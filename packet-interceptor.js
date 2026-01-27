// ============== DATA PACKET INTERCEPTOR MINIGAME ==============

let packetGameState = {
    isRunning: false,
    modalElement: null,
    canvas: null,
    ctx: null,
    cryptoSymbols: [],
    symbolsCaught: 0,
    gameTime: 0,
    maxGameTime: 30,
    score: 0,
    speed: 1,
    baseSpeed: 200, // pixels per second
    difficulty: 'EASY',
    gameStartTime: 0,
    spawnRate: 2, // symbols per second
    caughtParticles: [],
    gameActive: true
};

const CRYPTO_TYPES = [
    { name: 'BTC', symbol: '₿', color: '#f7931a' },
    { name: 'ETH', symbol: 'Ξ', color: '#627eea' },
    { name: 'DOGE', symbol: 'Ð', color: '#c2a633' }
];

// Abbreviate large numbers (e.g., 1500000 -> "1.500M")
function abbreviateNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(3) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(3) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(3) + 'K';
    return num.toFixed(0);
}

function initPacketInterceptorGame(difficulty = 'EASY') {
    packetGameState.difficulty = difficulty;
    packetGameState.isRunning = true;
    packetGameState.gameActive = true;
    packetGameState.cryptoSymbols = [];
    packetGameState.symbolsCaught = 0;
    packetGameState.score = 0;
    packetGameState.gameTime = 0;
    packetGameState.gameStartTime = Date.now();
    packetGameState.caughtParticles = [];

    // Detect if mobile (narrower than 768px)
    const isMobile = window.innerWidth < 768;

    // Set difficulty-based parameters (all 15 seconds, but harder)
    let maxTime = 15; // All difficulties: 15 seconds
    let baseSpeed = 180;
    let spawnRate = 2;
    let speedEscalation = 0.3; // Speed increases by 30% by end

    if (difficulty === 'MEDIUM') {
        maxTime = 15; // Still 15 seconds
        baseSpeed = 280;
        spawnRate = 3.5;
        speedEscalation = 0.5; // Speed increases by 50% by end
    } else if (difficulty === 'HARD') {
        maxTime = 15; // Still 15 seconds
        baseSpeed = 380;
        spawnRate = 5;
        speedEscalation = 0.7; // Speed increases by 70% by end
    }

    // On desktop, increase speed for faster gameplay (mobile keeps normal speed)
    if (!isMobile) {
        baseSpeed *= 1.4; // 40% faster on desktop
    }

    packetGameState.speedEscalation = speedEscalation;

    packetGameState.maxGameTime = maxTime;
    packetGameState.baseSpeed = baseSpeed;
    packetGameState.spawnRate = spawnRate;

    // Create modal
    createPacketInterceptorModal();
}

function createPacketInterceptorModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'packet-interceptor-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    // Create canvas for game
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.75;
    canvas.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 3px solid #ff8c00;
        border-radius: 12px;
        cursor: crosshair;
        display: block;
        margin-bottom: 20px;
    `;

    packetGameState.canvas = canvas;
    packetGameState.ctx = canvas.getContext('2d');
    packetGameState.modalElement = modal;

    // Add canvas to modal (no quit button - game must be completed)
    modal.appendChild(canvas);

    document.body.appendChild(modal);

    // Add event listeners
    canvas.addEventListener('click', handleCryptoClick);
    canvas.addEventListener('touchstart', handleCryptoTouch);

    // Start game loop
    gameLoopPacketInterceptor();
}

function handleCryptoClick(event) {
    if (!packetGameState.isRunning) return;

    const canvas = packetGameState.canvas;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    checkCryptoCollisions(clickX, clickY);
}

function handleCryptoTouch(event) {
    if (!packetGameState.isRunning) return;

    event.preventDefault();
    const canvas = packetGameState.canvas;
    const rect = canvas.getBoundingClientRect();

    for (let touch of event.touches) {
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        checkCryptoCollisions(touchX, touchY);
    }
}

function checkCryptoCollisions(clickX, clickY) {
    const hitRadius = 60; // Larger hit radius for easier clicking

    for (let i = packetGameState.cryptoSymbols.length - 1; i >= 0; i--) {
        const symbol = packetGameState.cryptoSymbols[i];
        const dx = symbol.x - clickX;
        const dy = symbol.y - clickY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hitRadius + symbol.size) {
            // Symbol caught!
            packetGameState.symbolsCaught++;
            packetGameState.score += symbol.value;

            // Add visual feedback
            addCaughtParticle(symbol.x, symbol.y, symbol.value, symbol.color);

            // Remove symbol
            packetGameState.cryptoSymbols.splice(i, 1);
            break; // Only catch one symbol per click
        }
    }
}

function addCaughtParticle(x, y, value, color) {
    packetGameState.caughtParticles.push({
        x: x,
        y: y,
        value: value,
        color: color,
        age: 0,
        maxAge: 0.8
    });
}

function spawnCryptoSymbol() {
    const canvas = packetGameState.canvas;
    if (!canvas) return;

    // Random crypto type
    const cryptoType = CRYPTO_TYPES[Math.floor(Math.random() * CRYPTO_TYPES.length)];

    // Calculate value based on current hash rate (what player would mine per second)
    // Packet value = current mining rate per second in USD
    // This means the higher your hash rate, the more valuable packets become!
    let usdValue = 0;

    // First try to get values from window (set by game.js), fallback to local scope
    const currentBtcPerSec = window.btcPerSec ?? btcPerSec ?? 0;
    const currentEthPerSec = window.ethPerSec ?? ethPerSec ?? 0;
    const currentDogePerSec = window.dogePerSec ?? dogePerSec ?? 0;
    const currentBtcPrice = window.btcPrice ?? btcPrice ?? 100000;
    const currentEthPrice = window.ethPrice ?? ethPrice ?? 3500;
    const currentDogePrice = window.dogePrice ?? dogePrice ?? 0.25;
    const currentTotalMultiplier = window.totalMiningMultiplier ?? totalMiningMultiplier ?? 1;

    if (currentBtcPerSec > 0 || currentEthPerSec > 0 || currentDogePerSec > 0) {
        // Use actual mining rates converted to USD per second
        if (cryptoType.name === 'BTC') {
            // BTC packet worth = BTC/s × price in USD (1 second of mining)
            usdValue = (currentBtcPerSec * currentTotalMultiplier) * currentBtcPrice;
        } else if (cryptoType.name === 'ETH') {
            // ETH packet worth = ETH/s × price in USD (1 second of mining)
            usdValue = (currentEthPerSec * currentTotalMultiplier) * currentEthPrice;
        } else if (cryptoType.name === 'DOGE') {
            // DOGE packet worth = DOGE/s × price in USD (1 second of mining)
            usdValue = (currentDogePerSec * currentTotalMultiplier) * currentDogePrice;
        }
    } else {
        // Fallback if rates/prices aren't available yet
        const baseRewards = { BTC: 30, ETH: 20, DOGE: 10 };
        if (cryptoType.name === 'BTC') usdValue = baseRewards.BTC;
        else if (cryptoType.name === 'ETH') usdValue = baseRewards.ETH;
        else if (cryptoType.name === 'DOGE') usdValue = baseRewards.DOGE;
    }

    // Spawn from left side
    const x = -30;
    const y = Math.random() * (canvas.height - 80) + 40;

    packetGameState.cryptoSymbols.push({
        x: x,
        y: y,
        vx: packetGameState.baseSpeed * packetGameState.speed,
        vy: (Math.random() - 0.5) * 100 * packetGameState.speed,
        type: cryptoType.name,
        symbol: cryptoType.symbol,
        color: cryptoType.color,
        value: usdValue,
        size: 50 + Math.random() * 20,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 6
    });
}

function gameLoopPacketInterceptor() {
    if (!packetGameState.gameActive) {
        endPacketInterceptorGame(false);
        return;
    }

    const now = Date.now();
    const elapsedSeconds = (now - packetGameState.gameStartTime) / 1000;
    packetGameState.gameTime = elapsedSeconds;

    // Check if game should end
    if (packetGameState.gameTime >= packetGameState.maxGameTime) {
        packetGameState.isRunning = false;
        packetGameState.gameActive = false;
        drawPacketInterceptorGame(); // Draw final frame
        // Schedule end after a brief delay so final frame renders
        setTimeout(() => endPacketInterceptorGame(false), 100);
        return;
    }

    // Update speed over time (escalate speed based on difficulty)
    const timeProgress = packetGameState.gameTime / packetGameState.maxGameTime;
    packetGameState.speed = 1 + timeProgress * packetGameState.speedEscalation;

    // Spawn symbols based on spawn rate
    if (Math.random() < packetGameState.spawnRate / 60) {
        spawnCryptoSymbol();
    }

    // Update symbols
    for (let i = packetGameState.cryptoSymbols.length - 1; i >= 0; i--) {
        const symbol = packetGameState.cryptoSymbols[i];
        symbol.x += symbol.vx / 60; // Assuming ~60fps
        symbol.y += symbol.vy / 60;
        symbol.rotation += symbol.rotationSpeed / 60;

        // Remove symbols that go off screen
        if (symbol.x > packetGameState.canvas.width + 50) {
            packetGameState.cryptoSymbols.splice(i, 1);
        }
    }

    // Update particles
    for (let i = packetGameState.caughtParticles.length - 1; i >= 0; i--) {
        const particle = packetGameState.caughtParticles[i];
        particle.age += 1 / 60;

        if (particle.age >= particle.maxAge) {
            packetGameState.caughtParticles.splice(i, 1);
        }
    }

    // Draw game
    drawPacketInterceptorGame();

    requestAnimationFrame(gameLoopPacketInterceptor);
}

function drawPacketInterceptorGame() {
    const ctx = packetGameState.ctx;
    const canvas = packetGameState.canvas;

    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw crypto symbols
    for (let symbol of packetGameState.cryptoSymbols) {
        ctx.save();
        ctx.translate(symbol.x, symbol.y);
        ctx.rotate(symbol.rotation);

        // Draw glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, symbol.size);
        gradient.addColorStop(0, symbol.color + '40');
        gradient.addColorStop(1, symbol.color + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(-symbol.size, -symbol.size, symbol.size * 2, symbol.size * 2);

        // Draw outer circle (bright border)
        ctx.strokeStyle = symbol.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, symbol.size * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        // Draw filled circle background
        ctx.fillStyle = symbol.color + 'cc';
        ctx.beginPath();
        ctx.arc(0, 0, symbol.size * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Draw crypto symbol
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(symbol.size * 0.8)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol.symbol, 0, 0);

        ctx.restore();
    }

    // Draw caught particles (floating value indicators)
    for (let particle of packetGameState.caughtParticles) {
        const alpha = 1 - (particle.age / particle.maxAge);
        const floatY = particle.y - (particle.age * 60);

        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fillText('+$' + abbreviateNumber(particle.value), particle.x, floatY);
    }

    // Draw HUD
    drawPacketInterceptorHUD();
}

function drawPacketInterceptorHUD() {
    const ctx = packetGameState.ctx;
    const canvas = packetGameState.canvas;

    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, 50);

    // Timer (left)
    const timeRemaining = Math.max(0, packetGameState.maxGameTime - packetGameState.gameTime);
    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`⏱ ${timeRemaining.toFixed(1)}s`, 20, 12);

    // Symbols caught (center)
    ctx.fillStyle = '#00ff00';
    ctx.textAlign = 'center';
    ctx.fillText(`Caught: ${packetGameState.symbolsCaught}`, canvas.width / 2, 12);

    // Score (right)
    ctx.fillStyle = '#ffff00';
    ctx.textAlign = 'right';
    ctx.fillText(`$${abbreviateNumber(packetGameState.score)}`, canvas.width - 20, 12);
}

function endPacketInterceptorGame(quit = false) {
    console.log('[Packet Interceptor] endPacketInterceptorGame called, quit:', quit);

    // Only remove the game modal, not if we're showing results
    if (packetGameState.modalElement && document.body.contains(packetGameState.modalElement)) {
        packetGameState.modalElement.removeEventListener('click', handleCryptoClick);
        packetGameState.modalElement.removeEventListener('touchstart', handleCryptoTouch);
        document.body.removeChild(packetGameState.modalElement);
        packetGameState.modalElement = null;
    }

    packetGameState.canvas = null;
    packetGameState.ctx = null;

    // If quit early, don't award rewards
    if (quit) {
        console.log('[Packet Interceptor] User quit, not showing rewards');
        switchTab('minigames');
        return;
    }

    // Calculate rewards (no difficulty multiplier - harder difficulty is challenge, not reward)
    const baseReward = packetGameState.score;
    const totalReward = baseReward;
    console.log('[Packet Interceptor] Calculated reward - Base:', baseReward, 'Packets caught:', packetGameState.symbolsCaught, 'Total USD:', totalReward);

    // Update game state (add rewards to dollar balance)
    // This must happen BEFORE showing results so packetLastRewards is populated
    if (typeof updatePacketInterceptorStats === 'function') {
        console.log('[Packet Interceptor] Calling updatePacketInterceptorStats');
        updatePacketInterceptorStats(
            packetGameState.symbolsCaught,
            totalReward
        );
    }

    // Show results (after stats are updated so packetLastRewards is available)
    console.log('[Packet Interceptor] About to show results modal');
    showPacketInterceptorResults(totalReward);
}

function showPacketInterceptorResults(totalReward) {
    console.log('[Packet Interceptor] Showing results modal, totalReward:', totalReward);

    // Create results modal
    const resultsModal = document.createElement('div');
    resultsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        font-family: Arial, sans-serif;
    `;

    const difficultyLabels = {
        'EASY': 'Easy',
        'MEDIUM': 'Medium',
        'HARD': 'Hard'
    };

    const resultsContent = document.createElement('div');
    resultsContent.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 140, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
        border: 3px solid #ff8c00;
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        max-width: 500px;
        color: #fff;
    `;

    const baseReward = packetGameState.score;

    // Get the scaled rewards from packetLastRewards (set by updatePacketInterceptorStats)
    let rewardDisplay = `💰 +$${totalReward.toFixed(2)}`;
    if (typeof packetLastRewards !== 'undefined' && packetLastRewards && packetLastRewards.totalUsd > 0) {
        // Show multi-currency breakdown
        rewardDisplay = `
            <div style="font-size: 0.9rem; margin-top: 10px;">
                <div>₿ ${packetLastRewards.btc.toFixed(8)} BTC</div>
                <div>Ξ ${packetLastRewards.eth.toFixed(8)} ETH</div>
                <div>Ð ${packetLastRewards.doge.toFixed(2)} DOGE</div>
                <div style="margin-top: 8px;">💵 $${abbreviateNumber(packetLastRewards.usd)} USD</div>
                <div style="color: #ffff00; font-weight: 800; margin-top: 8px;">Total: $${abbreviateNumber(packetLastRewards.totalUsd)}</div>
            </div>
        `;
    }

    resultsContent.innerHTML = `
        <h2 style="color: #ff8c00; margin: 0 0 20px 0; font-size: 2.5rem;">🎉 Game Complete!</h2>

        <div style="background: rgba(0,0,0,0.5); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                <div>
                    <div style="color: #888; font-size: 0.9rem;">Difficulty</div>
                    <div style="color: #ff8c00; font-size: 1.2rem; font-weight: 800;">${difficultyLabels[packetGameState.difficulty]}</div>
                </div>
                <div>
                    <div style="color: #888; font-size: 0.9rem;">Packets</div>
                    <div style="color: #00ff00; font-size: 1.2rem; font-weight: 800;">${packetGameState.symbolsCaught}</div>
                </div>
                <div>
                    <div style="color: #888; font-size: 0.9rem;">Base Score</div>
                    <div style="color: #ffff00; font-size: 1.2rem; font-weight: 800;">$${abbreviateNumber(baseReward)}</div>
                </div>
            </div>

            <div style="border-top: 2px solid #ff8c00; border-bottom: 2px solid #ff8c00; padding: 20px 0; margin: 20px 0;">
                <div style="color: #888; font-size: 0.95rem; margin-bottom: 15px;">YOUR REWARDS</div>
                ${rewardDisplay}
            </div>
        </div>

        <button id="packet-close-btn" style="background: #ff8c00; color: #000; border: none; padding: 15px 30px; font-weight: 800; border-radius: 8px; cursor: pointer; font-size: 1rem;">
            CLAIM REWARDS
        </button>
    `;

    resultsModal.appendChild(resultsContent);
    resultsModal.id = 'packet-results-modal';
    document.body.appendChild(resultsModal);
    console.log('[Packet Interceptor] Results modal appended to document body');

    // Add close button handler that triggers coin spawn and switches tab
    const closeBtn = document.getElementById('packet-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            console.log('[Packet Interceptor] Claiming rewards and closing modal');
            // Trigger coin spawn explosion before closing
            if (typeof spawnPacketInterceptorRewardCoins === 'function') {
                spawnPacketInterceptorRewardCoins();
            }
            document.getElementById('packet-results-modal').remove();
            switchTab('minigames');
        };
    } else {
        console.error('[Packet Interceptor] Close button not found!');
    }
}

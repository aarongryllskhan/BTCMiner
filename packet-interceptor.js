// ============== COIN SNAG MINIGAME ==============

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
    gameActive: true,
    manuallyClosed: false, // Track if user manually closed the game
    // Cached mining values to avoid expensive window lookups
    cachedBtcPerSec: 0,
    cachedEthPerSec: 0,
    cachedDogePerSec: 0,
    cachedBtcPrice: 100000,
    cachedEthPrice: 3500,
    cachedDogePrice: 0.25,
    cachedTotalMultiplier: 1,
    lastCacheUpdate: 0,
    frameCount: 0
};

const CRYPTO_TYPES = [
    { name: 'BTC', symbol: '₿', color: '#f7931a', imagePath: 'bitcointoken.png', sizeMultiplier: 1.0 },
    { name: 'ETH', symbol: 'Ξ', color: '#627eea', imagePath: 'ethcoin.png', sizeMultiplier: 1.12 },
    { name: 'DOGE', symbol: 'Ð', color: '#c2a633', imagePath: 'dogecoin.png', sizeMultiplier: 1.0 }
];

// Preload images
const cryptoImages = {};
CRYPTO_TYPES.forEach(crypto => {
    const img = new Image();
    img.src = crypto.imagePath;
    cryptoImages[crypto.name] = img;
});

// Abbreviate large numbers (e.g., 1500000 -> "1.500M")
function abbreviateNumber(num) {
    if (num >= 1e60) return (num / 1e60).toFixed(2) + 'Nmdc';
    if (num >= 1e57) return (num / 1e57).toFixed(2) + 'O/Odc';
    if (num >= 1e54) return (num / 1e54).toFixed(2) + 'Spdc';
    if (num >= 1e51) return (num / 1e51).toFixed(2) + 'Sxdc';
    if (num >= 1e48) return (num / 1e48).toFixed(2) + 'Qdc';
    if (num >= 1e45) return (num / 1e45).toFixed(2) + 'Qdc';
    if (num >= 1e42) return (num / 1e42).toFixed(2) + 'Tdc';
    if (num >= 1e39) return (num / 1e39).toFixed(2) + 'U/Udc';
    if (num >= 1e36) return (num / 1e36).toFixed(2) + 'D/Ddc';
    if (num >= 1e33) return (num / 1e33).toFixed(2) + 'Dc';
    if (num >= 1e30) return (num / 1e30).toFixed(2) + 'N';
    if (num >= 1e27) return (num / 1e27).toFixed(2) + 'O';
    if (num >= 1e24) return (num / 1e24).toFixed(2) + 'Sep';
    if (num >= 1e21) return (num / 1e21).toFixed(2) + 'S';
    if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Qa';
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
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

    // Adjust speed based on screen size for better mobile UX
    if (isMobile) {
        baseSpeed *= 1.0; // Same speed on mobile
        spawnRate *= 1.0; // Same spawn rate on mobile
    } else {
        baseSpeed *= 1.0; // Same speed on desktop
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
        overflow: hidden;
    `;

    // Create header container with close button
    const headerContainer = document.createElement('div');
    headerContainer.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10001;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        background: #ff8c00;
        color: #000;
        border: none;
        padding: 8px 12px;
        font-weight: 800;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeButton.onclick = function(e) {
        e.stopPropagation();
        closePacketInterceptorMidGame();
    };
    headerContainer.appendChild(closeButton);
    modal.appendChild(headerContainer);

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

    // Add canvas to modal
    modal.appendChild(canvas);

    document.body.appendChild(modal);

    // Add event listeners
    canvas.addEventListener('click', handleCryptoClick);
    canvas.addEventListener('touchstart', handleCryptoTouch);

    // Start game loop
    gameLoopPacketInterceptor();
}

function handleCryptoClick(event) {
    if (!packetGameState.isRunning || !packetGameState.canvasRect) return;

    const rect = packetGameState.canvasRect;
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    checkCryptoCollisions(clickX, clickY);
}

function handleCryptoTouch(event) {
    if (!packetGameState.isRunning || !packetGameState.canvasRect) return;

    event.preventDefault();
    const rect = packetGameState.canvasRect;

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

    // Use cached values (updated every 500ms in game loop)
    let usdValue = 0;
    const btcPerSec = packetGameState.cachedBtcPerSec;
    const ethPerSec = packetGameState.cachedEthPerSec;
    const dogePerSec = packetGameState.cachedDogePerSec;
    const btcPrice = packetGameState.cachedBtcPrice;
    const ethPrice = packetGameState.cachedEthPrice;
    const dogePrice = packetGameState.cachedDogePrice;
    const totalMultiplier = packetGameState.cachedTotalMultiplier;

    if (btcPerSec > 0 || ethPerSec > 0 || dogePerSec > 0) {
        // Use actual mining rates converted to USD per second
        if (cryptoType.name === 'BTC') {
            usdValue = (btcPerSec * totalMultiplier) * btcPrice;
        } else if (cryptoType.name === 'ETH') {
            usdValue = (ethPerSec * totalMultiplier) * ethPrice;
        } else if (cryptoType.name === 'DOGE') {
            usdValue = (dogePerSec * totalMultiplier) * dogePrice;
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
        vy: (Math.random() - 0.5) * 100 * packetGameState.speed,
        type: cryptoType.name,
        symbol: cryptoType.symbol,
        color: cryptoType.color,
        value: usdValue,
        size: 50, // Fixed size - coins stay same scale
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 6,
        sizeMultiplier: cryptoType.sizeMultiplier || 1.0
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

    // Cache canvas rect - update less frequently
    if (!packetGameState.canvasRect || now - packetGameState.lastRectUpdate > 200) {
        if (packetGameState.canvas) {
            packetGameState.canvasRect = packetGameState.canvas.getBoundingClientRect();
            packetGameState.lastRectUpdate = now;
        }
    }

    // Cache mining values every 30 frames (~500ms at 60fps) instead of every spawn
    packetGameState.frameCount++;
    if (packetGameState.frameCount >= 30) {
        packetGameState.cachedBtcPerSec = window.btcPerSec ?? 0;
        packetGameState.cachedEthPerSec = window.ethPerSec ?? 0;
        packetGameState.cachedDogePerSec = window.dogePerSec ?? 0;
        packetGameState.cachedBtcPrice = window.btcPrice ?? 100000;
        packetGameState.cachedEthPrice = window.ethPrice ?? 3500;
        packetGameState.cachedDogePrice = window.dogePrice ?? 0.25;
        packetGameState.cachedTotalMultiplier = window.totalMiningMultiplier ?? 1;
        packetGameState.frameCount = 0;
    }

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
        // Use baseSpeed with current speed multiplier instead of stored vx (keeps speed consistent)
        symbol.x += (packetGameState.baseSpeed * packetGameState.speed) / 60;
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

    requestAnimationFrame(() => gameLoopPacketInterceptor());
}

function drawBlockchainBackground(ctx, canvas) {
    // Solid background - no grid for performance
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHexagon(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawPacketInterceptorGame() {
    const ctx = packetGameState.ctx;
    const canvas = packetGameState.canvas;

    if (!ctx || !canvas) return;

    // Draw blockchain background
    drawBlockchainBackground(ctx, canvas);

    // Draw crypto symbols
    for (let symbol of packetGameState.cryptoSymbols) {
        ctx.save();
        ctx.translate(symbol.x, symbol.y);
        ctx.rotate(symbol.rotation);

        // Simplified glow - just a colored semi-transparent circle
        ctx.fillStyle = symbol.color + '20';
        ctx.beginPath();
        ctx.arc(0, 0, symbol.size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer circle (bright border)
        ctx.strokeStyle = symbol.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, symbol.size * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        // Draw crypto image
        const img = cryptoImages[symbol.type];
        if (img && img.complete) {
            const displaySize = symbol.size * 1.7 * symbol.sizeMultiplier;
            ctx.drawImage(img, -displaySize / 2, -displaySize / 2, displaySize, displaySize);
        } else {
            // Fallback to circle if image not loaded
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
        }

        ctx.restore();
    }

    // Draw caught particles (floating value indicators) - simplified
    for (let particle of packetGameState.caughtParticles) {
        const alpha = 1 - (particle.age / particle.maxAge);
        const floatY = particle.y - (particle.age * 60);

        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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
    // If manually closed, treat as quit
    if (packetGameState.manuallyClosed) {
        packetGameState.manuallyClosed = false; // Reset flag
        quit = true;
    }

    console.log('[Coin Snag] endPacketInterceptorGame called, quit:', quit);

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
        console.log('[Coin Snag] User quit, not showing rewards');
        switchTab('minigames');
        return;
    }

    // Calculate rewards (no difficulty multiplier - harder difficulty is challenge, not reward)
    const baseReward = packetGameState.score;
    const totalReward = baseReward;
    console.log('[Coin Snag] Calculated reward - Base:', baseReward, 'Packets caught:', packetGameState.symbolsCaught, 'Total USD:', totalReward);

    // Update game state (add rewards to dollar balance)
    // This must happen BEFORE showing results so packetLastRewards is populated
    if (typeof updatePacketInterceptorStats === 'function') {
        console.log('[Coin Snag] Calling updatePacketInterceptorStats');
        updatePacketInterceptorStats(
            packetGameState.symbolsCaught,
            totalReward
        );
    }

    // Show results (after stats are updated so packetLastRewards is available)
    console.log('[Coin Snag] About to show results modal');
    showPacketInterceptorResults(totalReward);
}

function showPacketInterceptorResults(totalReward) {
    console.log('[Coin Snag] Showing results modal, totalReward:', totalReward);

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
        background: rgba(0, 0, 0, 0.9);
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
                <div>₿ ${packetLastRewards.btc >= 1 ? packetLastRewards.btc.toFixed(4) : packetLastRewards.btc.toFixed(8)} BTC</div>
                <div>Ξ ${packetLastRewards.eth >= 1 ? packetLastRewards.eth.toFixed(4) : packetLastRewards.eth.toFixed(8)} ETH</div>
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
                    <div style="color: #888; font-size: 0.9rem;">Coins</div>
                    <div style="color: #00ff00; font-size: 1.2rem; font-weight: 800;">${packetGameState.symbolsCaught}</div>
                </div>
            </div>

            <div style="border-top: 2px solid #ff8c00; border-bottom: 2px solid #ff8c00; padding: 20px 0; margin: 20px 0;">
                <div style="color: #888; font-size: 0.95rem; margin-bottom: 8px; font-weight: 700;">FORMULA BREAKDOWN</div>
                <div style="color: #fff; font-size: 0.85rem; margin-bottom: 15px; text-align: center; line-height: 1.6;">
                    <div>Coins Caught: ${packetGameState.symbolsCaught}</div>
                    <div style="margin: 6px 0;">×</div>
                    <div style="font-size: 0.8rem; color: #ffb81c;">Per Coin Base Value:</div>
                    <div style="font-size: 0.75rem; color: #aaa; margin: 4px 0;">₿ BTC = $30 | Ξ ETH = $20 | Ð DOGE = $10</div>
                    <div style="font-size: 0.8rem; color: #ffb81c; margin-top: 4px;">(Plus your Mining Rate USD Value if available)</div>
                    <div style="margin: 6px 0;">= Total Reward</div>
                </div>

                <div style="color: #888; font-size: 0.95rem; margin-bottom: 15px; font-weight: 700; margin-top: 15px;">YOUR REWARDS</div>
                <div style="font-size: 0.75rem; color: #aaa; margin-bottom: 12px; font-style: italic;">
                    Paid as: 40% BTC • 35% ETH • 20% DOGE • 5% Cash
                </div>
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
    console.log('[Coin Snag] Results modal appended to document body');

    // Add close button handler that triggers coin spawn and switches tab
    const closeBtn = document.getElementById('packet-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            console.log('[Coin Snag] Claiming rewards and closing modal');
            // Trigger coin spawn explosion before closing
            if (typeof spawnPacketInterceptorRewardCoins === 'function') {
                spawnPacketInterceptorRewardCoins();
            }
            document.getElementById('packet-results-modal').remove();
            switchTab('minigames');
        };
    } else {
        console.error('[Coin Snag] Close button not found!');
    }
}

function closePacketInterceptorMidGame() {
    // Apply cooldown if game is still active
    if (packetGameState.gameActive && packetGameState.isRunning) {
        packetGameState.gameActive = false;
        packetGameState.isRunning = false;
        packetGameState.manuallyClosed = true; // Mark as manually closed

        // Apply cooldown - match the difficulty config from game.js
        const difficulty = packetGameState.difficulty;
        const cooldownDuration = 30000; // 30 seconds default

        // Access the packet cooldowns from the main game if available
        if (typeof packetCooldowns !== 'undefined') {
            packetCooldowns[difficulty] = Date.now() + cooldownDuration;
            console.log(`[Packet Interceptor] Applied cooldown to ${difficulty}: ${cooldownDuration}ms`);
            // Update display if function exists
            if (typeof updatePacketCooldownDisplays === 'function') {
                updatePacketCooldownDisplays();
            }
        }
    }

    // Close the modal
    if (packetGameState.modalElement && document.body.contains(packetGameState.modalElement)) {
        packetGameState.modalElement.removeEventListener('click', handleCryptoClick);
        packetGameState.modalElement.removeEventListener('touchstart', handleCryptoTouch);
        document.body.removeChild(packetGameState.modalElement);
        packetGameState.modalElement = null;
    }

    // Return to minigames tab
    if (typeof switchTab === 'function') {
        switchTab('minigames');
    }
}

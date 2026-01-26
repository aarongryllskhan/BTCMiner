    // Bitcoin
    let btcPrice = 100000; // Set manually each day - everyone starts at 100k
    let btcBalance = 0;
    let btcLifetime = 0;
    let btcPerSec = 0;
    let btcClickValue = 0.00000250;
    const BTC_MIN_PRICE = 50000;
    const BTC_MAX_PRICE = 200000;

    // Ethereum
    let ethPrice = 3500; // Starting ETH price
    let ethBalance = 0;
    let ethLifetime = 0;
    let ethPerSec = 0;
    let ethClickValue = 0.00007143; // $0.25 worth at $3500/ETH
    const ETH_MIN_PRICE = 1500;
    const ETH_MAX_PRICE = 8000;

    // Dogecoin
    let dogePrice = 0.25; // Starting DOGE price
    let dogeBalance = 0;
    let dogeLifetime = 0;
    let dogePerSec = 0;
    let dogeClickValue = 1.00000000; // $0.25 worth at $0.25/DOGE
    const DOGE_MIN_PRICE = 0.05;
    const DOGE_MAX_PRICE = 2.00;

    let hardwareEquity = 0;
    let dollarBalance = 0; // USD balance from selling crypto
    let lastTickTime = Date.now();
    let lastPriceUpdateTime = 0; // Track when price was last updated
    let manualHashClickTime = 0;
    let manualHashCooldownEnd = 0;
    let clickTimestamps = [];
    let priceSwingsStarted = false; // Flag to prevent starting price swings multiple times

    // Session tracking
    let sessionStartTime = Date.now();
    let sessionStartBalance = 0;
    let sessionStartNetWorth = 0;
    let sessionEarnings = 0; // Tracks USD value of all crypto earned this session (mining + staking)
    let lifetimeEarnings = 0; // Lifetime total - only ever increases, tracks USD value of all mined/staked crypto

    // Initialize gameState early so rugpull.js can access it
    if (!window.gameState) {
        window.gameState = { lifetimeEarnings: 0, dollarBalance: 0 };
    }

    // Buy quantity setting
    let buyQuantity = 1;

    // Chart history tracking
    let chartHistory = [];
    let chartTimestamps = []; // Track when each data point was added
    let lastChartUpdateTime = Date.now();
    let chartStartTime = Date.now();

    // Hacking Minigame State
    let hackingGameActive = false;
    let hackingGameDifficulty = 'EASY';
    let hackingVulnerabilitiesToFind = [];
    let hackingVulnerabilitiesFound = [];
    let hackingGameStartTime = 0;
    let hackingGameTimeLimit = 30000; // milliseconds
    let hackingLivesRemaining = 0;
    let hackingMaxLives = 0;
    let speedBoostActive = false;
    let speedBoostEndTime = 0;
    let speedBoostMultiplier = 1.0;
    let hackingGamesPlayed = 0;
    let hackingGamesWon = 0;
    let hackingConsecutiveWins = 0;
    let hackingNextNotificationTime = 0;
    let hackingTotalRewardsEarned = 0;
    let hackingCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 }; // Track cooldown end times

    // Whack-A-Block Minigame State
    let whackGameActive = false;
    let whackGameDifficulty = 'EASY';
    let whackGameStartTime = 0;
    let whackGameTimeLimit = 30000; // milliseconds
    let whackGameScore = 0;
    let whackGameBlocksHit = 0;
    let whackGameLivesRemaining = 0;
    let whackGameMaxLives = 0;
    let whackGameGamesPlayed = 0;
    let whackGameGamesWon = 0;
    let whackGameTotalRewardsEarned = 0;
    let whackCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 }; // Track cooldown end times
    let whackActiveBlock = null; // Currently active block ID
    let whackSpawnInterval = null; // Timer for spawning blocks
    let whackGameInterval = null; // Main game loop timer

    // Power system - Rebalanced for strategic gameplay
    let totalPowerAvailable = 0; // Total watts available
    let totalPowerUsed = 0; // Total watts being used
    const powerUpgrades = [
        { id: 0, name: "Basic Power Strip", baseUsd: 25, basePower: 10 },
        { id: 1, name: "Regulated PSU", baseUsd: 350, basePower: 100 },
        { id: 2, name: "High-Efficiency PSU", baseUsd: 2100, basePower: 500 },
        { id: 3, name: "Server-Grade PSU", baseUsd: 12000, basePower: 2500 },
        { id: 4, name: "Mining Power Distribution Unit", baseUsd: 60000, basePower: 12000 },
        { id: 5, name: "Modular Data Center Power System", baseUsd: 320000, basePower: 60000 },
        { id: 6, name: "Dedicated Substation Power Unit", baseUsd: 1600000, basePower: 280000 },
        { id: 7, name: "Industrial Grid Connection", baseUsd: 8000000, basePower: 1400000 },
        { id: 8, name: "Hydroelectric Power Station", baseUsd: 40000000, basePower: 7000000 },
        { id: 9, name: "Nuclear Reactor Array", baseUsd: 200000000, basePower: 35000000 },
        { id: 10, name: "Fusion Energy Complex", baseUsd: 1000000000, basePower: 175000000 },
        { id: 11, name: "Dyson Sphere Power Collector", baseUsd: 7000000000, basePower: 1200000000 },
        { id: 12, name: "Stellar Energy Tapestry", baseUsd: 50000000000, basePower: 8500000000 }
    ].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentPower: 0 }));

    // Power requirements for mining equipment (in watts)
    const equipmentPowerReqs = {
        0: 0, // Manual hash uses no power
        1: 2.5, // USB Miner
        2: 75, // GTX 1660
        3: 450, // RTX 5090
        4: 1200, // ASIC
        5: 3500, // Liquid ASIC
        6: 12000, // Container
        7: 45000, // Geothermal Farm
        8: 300000, // Data Center
        9: 1500000, // Orbital
        10: 5000000, // Quantum
        11: 25000000, // Advanced Quantum
        12: 120000000, // Superintelligent AI
        13: 650000000, // Dimensional Computer
        14: 3500000000, // Multiversal Processor
        15: 18000000000 // Infinite Energy Harvester
    };

    // Show price change notification
    // Track timeout IDs for each crypto to clear previous timers
    let indicatorTimeouts = { btc: null, eth: null, doge: null };

    function updatePriceIndicator(crypto, oldPrice, newPrice) {
        const change = newPrice - oldPrice;
        const changePercent = ((change / oldPrice) * 100).toFixed(2);
        const isUp = change >= 0;
        const indicatorId = crypto + '-indicator';
        const changeId = crypto + '-change';
        const indicator = document.getElementById(indicatorId);
        const changeDisplay = document.getElementById(changeId);

        // Clear previous timeout if exists
        if (indicatorTimeouts[crypto]) {
            clearTimeout(indicatorTimeouts[crypto]);
        }

        if (indicator && changeDisplay) {
            indicator.textContent = isUp ? '▲' : '▼';
            indicator.style.color = isUp ? '#00ff88' : '#ff3344';
            changeDisplay.textContent = (isUp ? '+' : '') + changePercent + '%';
            changeDisplay.style.color = isUp ? '#00ff88' : '#ff3344';

            // Set timeout to clear both after 0.8 seconds
            indicatorTimeouts[crypto] = setTimeout(() => {
                indicator.textContent = '';
                changeDisplay.textContent = '';
                indicatorTimeouts[crypto] = null;
            }, 800);
        }
    }

    // BTC tiny swings: ±0.05%-0.1% every 2 seconds with mean reversion
    function btcTinySwing() {
        setTimeout(() => {
            let oldBtcPrice = btcPrice;
            const btcTarget = 100000;
            const distanceFromTarget = Math.abs(btcPrice - btcTarget);
            const maxDistance = Math.abs(BTC_MAX_PRICE - btcTarget);
            const distancePercent = distanceFromTarget / maxDistance;

            let movePercent = (Math.random() * 0.0005) + 0.0005;
            let direction;

            // Increased mean reversion: 50% base + up to 45% more = up to 95% when far from target
            if (Math.random() < (0.5 + distancePercent * 0.45)) {
                direction = btcPrice > btcTarget ? -1 : 1;
            } else {
                direction = Math.random() > 0.5 ? 1 : -1;
            }

            let newBtcPrice = oldBtcPrice * (1 + (direction * movePercent));
            btcPrice = Math.max(BTC_MIN_PRICE, Math.min(BTC_MAX_PRICE, newBtcPrice));
            updatePriceIndicator('btc', oldBtcPrice, btcPrice);
            updateUI();
            btcTinySwing();
        }, 2000);
    }

    // BTC frequent swings: ±0.1%-1% every 2-60 seconds randomly with mean reversion
    function btcFrequentSwing() {
        let randomInterval = (Math.random() * (60000 - 2000)) + 2000; // 2-60 seconds
        setTimeout(() => {
            let movePercent = (Math.random() * 0.009) + 0.001; // 0.1% to 1%
            let oldBtcPrice = btcPrice;
            const btcTarget = 100000;
            const distanceFromTarget = Math.abs(btcPrice - btcTarget);
            const maxDistance = Math.abs(BTC_MAX_PRICE - btcTarget);
            const distancePercent = distanceFromTarget / maxDistance; // 0 to 1

            // Increased mean reversion: 75% + up to 25% more = up to 100% when far from target
            let newBtcPrice = oldBtcPrice * (1 + movePercent);
            if (Math.random() < (0.75 + distancePercent * 0.25)) {
                const targetPrice = 100000;
                const diff = targetPrice - oldBtcPrice;
                newBtcPrice = oldBtcPrice + (diff * 0.03);
            } else {
                let direction = Math.random() > 0.5 ? 1 : -1;
                newBtcPrice = oldBtcPrice * (1 + (direction * movePercent));
            }
            btcPrice = Math.max(BTC_MIN_PRICE, Math.min(BTC_MAX_PRICE, newBtcPrice));
            updatePriceIndicator('btc', oldBtcPrice, btcPrice);
            updateUI();
            btcFrequentSwing();
        }, randomInterval);
    }

    // ETH tiny swings: ±0.05%-0.1% every 2.3 seconds with mean reversion
    function ethTinySwing() {
        setTimeout(() => {
            let oldEthPrice = ethPrice;
            const ethTarget = 3500;
            const distanceFromTarget = Math.abs(ethPrice - ethTarget);
            const maxDistance = Math.abs(ETH_MAX_PRICE - ethTarget);
            const distancePercent = distanceFromTarget / maxDistance;

            let movePercent = (Math.random() * 0.0005) + 0.0005;
            let direction;

            // Increased mean reversion: 50% base + up to 45% more = up to 95% when far from target
            if (Math.random() < (0.5 + distancePercent * 0.45)) {
                direction = ethPrice > ethTarget ? -1 : 1;
            } else {
                direction = Math.random() > 0.5 ? 1 : -1;
            }

            let newEthPrice = oldEthPrice * (1 + (direction * movePercent));
            ethPrice = Math.max(ETH_MIN_PRICE, Math.min(ETH_MAX_PRICE, newEthPrice));
            updatePriceIndicator('eth', oldEthPrice, ethPrice);
            updateUI();
            ethTinySwing();
        }, 2300);
    }

    // ETH frequent swings: ±0.1%-1.2% every 3-75 seconds randomly with mean reversion
    function ethFrequentSwing() {
        let randomInterval = (Math.random() * (75000 - 3000)) + 3000; // 3-75 seconds
        setTimeout(() => {
            let movePercent = (Math.random() * 0.011) + 0.001; // 0.1% to 1.2%
            let oldEthPrice = ethPrice;
            const ethTarget = 3500;
            const distanceFromTarget = Math.abs(ethPrice - ethTarget);
            const maxDistance = Math.abs(ETH_MAX_PRICE - ethTarget);
            const distancePercent = distanceFromTarget / maxDistance; // 0 to 1

            // Increased mean reversion: 75% + up to 25% more = up to 100% when far from target
            let newEthPrice = oldEthPrice * (1 + movePercent);
            if (Math.random() < (0.75 + distancePercent * 0.25)) {
                const targetPrice = 3500;
                const diff = targetPrice - oldEthPrice;
                newEthPrice = oldEthPrice + (diff * 0.03);
            } else {
                let direction = Math.random() > 0.5 ? 1 : -1;
                newEthPrice = oldEthPrice * (1 + (direction * movePercent));
            }
            ethPrice = Math.max(ETH_MIN_PRICE, Math.min(ETH_MAX_PRICE, newEthPrice));
            updatePriceIndicator('eth', oldEthPrice, ethPrice);
            updateUI();
            ethFrequentSwing();
        }, randomInterval);
    }

    // DOGE tiny swings: ±0.05%-0.15% every 2.7 seconds with mean reversion (more volatile)
    function dogeTinySwing() {
        setTimeout(() => {
            let oldDogePrice = dogePrice;
            const dogeTarget = 0.25;
            const distanceFromTarget = Math.abs(dogePrice - dogeTarget);
            const maxDistance = Math.abs(DOGE_MAX_PRICE - dogeTarget);
            const distancePercent = distanceFromTarget / maxDistance;

            let movePercent = (Math.random() * 0.001) + 0.0005;
            let direction;

            // Increased mean reversion: 50% base + up to 45% more = up to 95% when far from target
            if (Math.random() < (0.5 + distancePercent * 0.45)) {
                direction = dogePrice > dogeTarget ? -1 : 1;
            } else {
                direction = Math.random() > 0.5 ? 1 : -1;
            }

            let newDogePrice = oldDogePrice * (1 + (direction * movePercent * 1.5));
            dogePrice = Math.max(DOGE_MIN_PRICE, Math.min(DOGE_MAX_PRICE, newDogePrice));
            updatePriceIndicator('doge', oldDogePrice, dogePrice);
            updateUI();
            dogeTinySwing();
        }, 2700);
    }

    // DOGE frequent swings: ±0.15%-1.8% every 2-45 seconds randomly (more volatile) with mean reversion
    function dogeFrequentSwing() {
        let randomInterval = (Math.random() * (45000 - 2000)) + 2000; // 2-45 seconds
        setTimeout(() => {
            let movePercent = (Math.random() * 0.0165) + 0.0015; // 0.15% to 1.8%
            let oldDogePrice = dogePrice;
            const dogeTarget = 0.25;
            const distanceFromTarget = Math.abs(dogePrice - dogeTarget);
            const maxDistance = Math.abs(DOGE_MAX_PRICE - dogeTarget);
            const distancePercent = distanceFromTarget / maxDistance; // 0 to 1

            // Increased mean reversion: 75% + up to 25% more = up to 100% when far from target
            let newDogePrice = oldDogePrice * (1 + movePercent * 1.5);
            if (Math.random() < (0.75 + distancePercent * 0.25)) {
                const targetPrice = 0.25;
                const diff = targetPrice - oldDogePrice;
                newDogePrice = oldDogePrice + (diff * 0.03);
            } else {
                let direction = Math.random() > 0.5 ? 1 : -1;
                newDogePrice = oldDogePrice * (1 + (direction * movePercent * 1.5));
            }
            dogePrice = Math.max(DOGE_MIN_PRICE, Math.min(DOGE_MAX_PRICE, newDogePrice));
            updatePriceIndicator('doge', oldDogePrice, dogePrice);
            updateUI();
            dogeFrequentSwing();
        }, randomInterval);
    }

    // BTC occasional big swings: ±2.5%-10% every 5 to 10 minutes
    function btcBigSwing() {
        let nextBigSwing = (Math.random() * (600000 - 300000)) + 300000;
        setTimeout(() => {
            let movePercent = (Math.random() * 0.075) + 0.025;
            let direction = Math.random() > 0.5 ? 1 : -1;
            let move = direction * movePercent;
            let oldBtcPrice = btcPrice;
            btcPrice = Math.max(BTC_MIN_PRICE, Math.min(BTC_MAX_PRICE, btcPrice * (1 + move)));
            updatePriceIndicator('btc', oldBtcPrice, btcPrice);

            // Show news popup for big swings
            const changePercent = ((btcPrice - oldBtcPrice) / oldBtcPrice) * 100;
            if (typeof window.showNewsPopup === 'function') {
                window.showNewsPopup('btc', changePercent, changePercent >= 0);
            } else {
                console.warn('⚠️ showNewsPopup not available yet, retrying...');
            }

            updateUI();
            btcBigSwing();
        }, nextBigSwing);
    }

    // ETH occasional big swings: ±2.5%-12% every 4 to 12 minutes (more volatile than BTC)
    function ethBigSwing() {
        let nextBigSwing = (Math.random() * (720000 - 240000)) + 240000;
        setTimeout(() => {
            let movePercent = (Math.random() * 0.095) + 0.025; // Slightly more volatile
            let direction = Math.random() > 0.5 ? 1 : -1;
            let move = direction * movePercent;
            let oldEthPrice = ethPrice;
            ethPrice = Math.max(ETH_MIN_PRICE, Math.min(ETH_MAX_PRICE, ethPrice * (1 + move)));
            updatePriceIndicator('eth', oldEthPrice, ethPrice);

            // Show news popup for big swings
            const changePercent = ((ethPrice - oldEthPrice) / oldEthPrice) * 100;
            if (typeof window.showNewsPopup === 'function') {
                window.showNewsPopup('eth', changePercent, changePercent >= 0);
            } else {
                console.warn('⚠️ showNewsPopup not available yet, retrying...');
            }

            updateUI();
            ethBigSwing();
        }, nextBigSwing);
    }

    // DOGE occasional big swings: ±3%-18% every 3 to 8 minutes (much more volatile)
    function dogeBigSwing() {
        let nextBigSwing = (Math.random() * (480000 - 180000)) + 180000;
        setTimeout(() => {
            let movePercent = (Math.random() * 0.15) + 0.03; // 3% to 18%
            let direction = Math.random() > 0.5 ? 1 : -1;
            let move = direction * movePercent;
            let oldDogePrice = dogePrice;
            dogePrice = Math.max(DOGE_MIN_PRICE, Math.min(DOGE_MAX_PRICE, dogePrice * (1 + move * 1.8)));
            updatePriceIndicator('doge', oldDogePrice, dogePrice);

            // Show news popup for big swings
            const changePercent = ((dogePrice - oldDogePrice) / oldDogePrice) * 100;
            if (typeof window.showNewsPopup === 'function') {
                window.showNewsPopup('doge', changePercent, changePercent >= 0);
            } else {
                console.warn('⚠️ showNewsPopup not available yet, retrying...');
            }

            updateUI();
            dogeBigSwing();
        }, nextBigSwing);
    }

    // Sound effects using Web Audio API
    let audioContext;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.error('Could not create audio context:', error);
        audioContext = null;
    }

    function playClickSound() {
        if (isMuted || !audioContext) return;
        try {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.start(now);
            osc.stop(now + 0.1);
        } catch (error) {
            console.error('Error playing click sound:', error);
        }
    }

    function playUpgradeSound() {
        if (isMuted || !audioContext) return;
        try {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
            osc.type = 'square';

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.start(now);
            osc.stop(now + 0.2);
        } catch (error) {
            console.error('Error playing upgrade sound:', error);
        }
    }

    // Bitcoin mining upgrades
    const btcUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 5, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.000000250 },
        { id: 1, name: "USB Miner", baseUsd: 5, baseYield: 0.00000010 },
        { id: 2, name: "GTX 1660 Super", baseUsd: 100, baseYield: 0.00000070 },
        { id: 3, name: "RTX 5090 Rig", baseUsd: 3000, baseYield: 0.000015 },
        { id: 4, name: "ASIC Mining Unit", baseUsd: 7500, baseYield: 0.000085 },
        { id: 5, name: "Liquid ASIC Rig", baseUsd: 28000, baseYield: 0.00045 },
        { id: 6, name: "Mobile Mining Container", baseUsd: 110000, baseYield: 0.0032 },
        { id: 7, name: "Geothermal Mining Farm", baseUsd: 680000, baseYield: 0.045 },
        { id: 8, name: "Data Center Facility", baseUsd: 5200000, baseYield: 0.62 },
        { id: 9, name: "Orbital Data Relay", baseUsd: 35000000, baseYield: 5.8 },
        { id: 10, name: "Quantum Computer", baseUsd: 500000000, baseYield: 125.0 },
        { id: 11, name: "Advanced Quantum Rig", baseUsd: 3500000000, baseYield: 900.0 },
        { id: 12, name: "Superintelligent AI Network", baseUsd: 25000000000, baseYield: 6500.0 },
        { id: 13, name: "Dimensional Mining Array", baseUsd: 180000000000, baseYield: 47000.0 },
        { id: 14, name: "Multiversal Hash Grid", baseUsd: 1300000000000, baseYield: 340000.0 },
        { id: 15, name: "Infinite Energy Extractor", baseUsd: 9500000000000, baseYield: 2500000.0 }
    ].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentYield: 0, boostCost: u.baseUsd * 0.5, boostLevel: 0 }));

    // Ethereum mining upgrades - Balanced to match BTC/DOGE USD/sec earnings
    const ethUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 5, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.00007143 },
        { id: 1, name: "Single GPU Rig", baseUsd: 5, baseYield: 0.0000029 },
        { id: 2, name: "RTX 4090 Miner", baseUsd: 100, baseYield: 0.000020 },
        { id: 3, name: "8-GPU Mining Rig", baseUsd: 3000, baseYield: 0.000428 },
        { id: 4, name: "Professional ETH Farm", baseUsd: 7500, baseYield: 0.00243 },
        { id: 5, name: "Staking Validator Node", baseUsd: 28000, baseYield: 0.0129 },
        { id: 6, name: "Multi-Validator Farm", baseUsd: 110000, baseYield: 0.0914 },
        { id: 7, name: "ETH Mining Complex", baseUsd: 680000, baseYield: 1.286 },
        { id: 8, name: "Enterprise Staking Pool", baseUsd: 5200000, baseYield: 17.7 },
        { id: 9, name: "Layer 2 Validation Network", baseUsd: 35000000, baseYield: 165.7 },
        { id: 10, name: "Ethereum Foundation Node", baseUsd: 500000000, baseYield: 3571.0 },
        { id: 11, name: "Global Validator Consortium", baseUsd: 3500000000, baseYield: 25000.0 },
        { id: 12, name: "Sharding Supernetwork", baseUsd: 25000000000, baseYield: 185700.0 },
        { id: 13, name: "Zero-Knowledge Proof Farm", baseUsd: 180000000000, baseYield: 1343000.0 },
        { id: 14, name: "Interchain Bridge Network", baseUsd: 1300000000000, baseYield: 9600000.0 },
        { id: 15, name: "Ethereum 3.0 Genesis Node", baseUsd: 9500000000000, baseYield: 70350000.0 }
    ].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentYield: 0, boostCost: u.baseUsd * 0.5, boostLevel: 0 }));

    // Dogecoin mining upgrades - Balanced to match BTC/ETH USD/sec earnings
    // All three currencies earn the same USD/sec at each tier (DOGE yields are 400x higher to compensate for $0.25 price)
    const dogeUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 5, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.01 },
        { id: 1, name: "Basic Scrypt Miner", baseUsd: 5, baseYield: 0.04 },
        { id: 2, name: "L3+ ASIC Miner", baseUsd: 100, baseYield: 0.28 },
        { id: 3, name: "Mini DOGE Farm", baseUsd: 3000, baseYield: 6.0 },
        { id: 4, name: "Scrypt Mining Pool", baseUsd: 7500, baseYield: 34.0 },
        { id: 5, name: "Industrial DOGE Facility", baseUsd: 28000, baseYield: 180.0 },
        { id: 6, name: "DOGE Megafarm", baseUsd: 110000, baseYield: 1280.0 },
        { id: 7, name: "WOW Mining Complex", baseUsd: 680000, baseYield: 18000.0 },
        { id: 8, name: "Moon Mining Station", baseUsd: 5200000, baseYield: 248000.0 },
        { id: 9, name: "Interplanetary DOGE Network", baseUsd: 35000000, baseYield: 2320000.0 },
        { id: 10, name: "To The Moon Supercomputer", baseUsd: 500000000, baseYield: 50000000.0 },
        { id: 11, name: "Mars Colony Mining Base", baseUsd: 3500000000, baseYield: 360000000.0 },
        { id: 12, name: "Asteroid Belt DOGE Harvester", baseUsd: 25000000000, baseYield: 2600000000.0 },
        { id: 13, name: "Jovian Satellite Network", baseUsd: 180000000000, baseYield: 19000000000.0 },
        { id: 14, name: "Solar System DOGE Grid", baseUsd: 1300000000000, baseYield: 140000000000.0 },
        { id: 15, name: "Intergalactic SHIBE Matrix", baseUsd: 9500000000000, baseYield: 1000000000000.0 }
    ].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentYield: 0, boostCost: u.baseUsd * 0.5, boostLevel: 0 }));

    // Keep reference to btcUpgrades as upgrades for backward compatibility
    const upgrades = btcUpgrades;

    // --- SAVE SYSTEM START ---
    let importInProgress = false; // Flag to prevent auto-save during import

    function saveGame() {
        // Don't save if an import is in progress (prevents overwriting imported data)
        if (importInProgress) {
            console.log('Save blocked - import in progress');
            return;
        }

        const gameState = {
            // Bitcoin data
            btcBalance,
            btcLifetime,
            btcClickValue,
            btcPerSec,
            btcPrice,
            // Ethereum data
            ethBalance,
            ethLifetime,
            ethClickValue,
            ethPerSec,
            ethPrice,
            // Dogecoin data
            dogeBalance,
            dogeLifetime,
            dogeClickValue,
            dogePerSec,
            dogePrice,
            // General data
            dollarBalance,
            hardwareEquity,
            lastSaveTime: Date.now(),
            autoClickerCooldownEnd,
            lifetimeEarnings,
            sessionEarnings,
            sessionStartTime,
            lifetimeEarningsDisplay: typeof window.rugpullState !== 'undefined' ? window.rugpullState.lifetimeEarningsDisplay : 0,
            chartHistory: chartHistory,
            chartTimestamps: chartTimestamps,
            chartStartTime: chartStartTime,
            totalPowerAvailable,
            // Staking data
            staking: getStakingData(),
            powerUpgrades: powerUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentPower: u.currentPower
            })),
            btcUpgrades: btcUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })),
            ethUpgrades: ethUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })),
            dogeUpgrades: dogeUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })),
            // Ascension/Rugpull data
            ascensionData: (typeof getAscensionData === 'function') ? getAscensionData() : {},
            // Achievements data
            achievements: (typeof achievementsData !== 'undefined') ? achievementsData.achievements : {},
            // Hacking minigame data
            hackingData: {
                gamesPlayed: hackingGamesPlayed,
                gamesWon: hackingGamesWon,
                consecutiveWins: hackingConsecutiveWins,
                totalRewardsEarned: hackingTotalRewardsEarned,
                speedBoostEndTime: speedBoostActive ? speedBoostEndTime : 0,
                speedBoostMultiplier: speedBoostActive ? speedBoostMultiplier : 1.0,
                nextNotificationTime: hackingNextNotificationTime,
                cooldowns: hackingCooldowns
            },
            // Whack-A-Block minigame data
            whackData: {
                gamesPlayed: whackGameGamesPlayed,
                gamesWon: whackGameGamesWon,
                totalRewardsEarned: whackGameTotalRewardsEarned,
                cooldowns: whackCooldowns
            }
        };

        try {
            const saveString = JSON.stringify(gameState);
            console.log('=== ATTEMPTING SAVE ===');
            console.log('BTC Balance:', btcBalance);
            console.log('Dollar Balance:', dollarBalance);
            console.log('Ascension Data:', gameState.ascensionData);
            console.log('Save string length:', saveString.length, 'bytes');

            localStorage.setItem('satoshiTerminalSave', saveString);

            // Verify save worked
            const testLoad = localStorage.getItem('satoshiTerminalSave');
            if (testLoad && testLoad.length > 0) {
                console.log('✓ SAVE SUCCESSFUL - Verified in localStorage');
            } else {
                console.error('✗ SAVE FAILED - Could not verify in localStorage');
            }
        } catch (error) {
            console.error('✗ ERROR saving game to localStorage:', error);
            alert('Failed to save game! Your progress may not be saved. Error: ' + error.message);
        }
    }

function loadGame() {
    console.log('=== LOAD GAME CALLED ===');
    try {
        const savedData = localStorage.getItem('satoshiTerminalSave');
        console.log('localStorage.getItem returned:', savedData ? 'DATA FOUND' : 'NULL/UNDEFINED');

        if (!savedData) {
            console.log('✗ No saved game found, starting fresh');
            return;
        }

        console.log('✓ Loading game... Save data size:', savedData.length, 'bytes');
        const state = JSON.parse(savedData);
        console.log('✓ Save data parsed successfully');
        console.log('Loaded BTC balance:', state.btcBalance);
        console.log('Loaded dollar balance:', state.dollarBalance);

        // Load achievements data FIRST before any game logic
        if (state.achievements && typeof achievementsData !== 'undefined') {
            Object.keys(state.achievements).forEach(id => {
                achievementsData.achievements[id] = state.achievements[id];
            });
            console.log('🏆 Achievements loaded early:', Object.values(achievementsData.achievements).filter(a => a.unlocked).length, 'unlocked');
        }

        // Load Bitcoin data
        btcBalance = state.btcBalance || 0;
        btcLifetime = state.btcLifetime || 0;
        btcClickValue = state.btcClickValue || 0.00000250;
        btcPrice = state.btcPrice || 100000;

        // Load Ethereum data
        ethBalance = state.ethBalance || 0;
        ethLifetime = state.ethLifetime || 0;
        ethClickValue = state.ethClickValue || 0.00007143;
        ethPrice = state.ethPrice || 3500;

        // Load Dogecoin data
        dogeBalance = state.dogeBalance || 0;
        dogeLifetime = state.dogeLifetime || 0;
        dogeClickValue = state.dogeClickValue || 1.00000000;
        dogePrice = state.dogePrice || 0.25;

        // Load general data
        dollarBalance = state.dollarBalance || 0;
        hardwareEquity = state.hardwareEquity || 0;
        lifetimeEarnings = state.lifetimeEarnings || 0;

        // Load lifetime earnings display (persists forever across page refreshes)
        if (state.lifetimeEarningsDisplay && typeof window.rugpullState !== 'undefined') {
            window.rugpullState.lifetimeEarningsDisplay = state.lifetimeEarningsDisplay;
        }
        // Also sync to gameState for display
        if (window.rugpullState && window.gameState) {
            window.gameState.lifetimeEarnings = window.rugpullState.lifetimeEarningsDisplay || 0;
        }

        // Reset session on every page load/refresh
        sessionEarnings = 0;
        sessionStartTime = Date.now();

        // Load staking data
        if (state.staking) {
            loadStakingData(state.staking);
        }

        sessionStartBalance = btcBalance;
        sessionStartNetWorth = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice) + hardwareEquity + dollarBalance;
        chartStartTime = state.chartStartTime || Date.now();

        // Load power upgrades
        if (state.powerUpgrades) {
            state.powerUpgrades.forEach((savedU) => {
                const powerUpgradeToUpdate = powerUpgrades.find(u => u.id === savedU.id);
                if (powerUpgradeToUpdate) {
                    powerUpgradeToUpdate.level = savedU.level || 0;
                    powerUpgradeToUpdate.currentUsd = savedU.currentUsd || powerUpgradeToUpdate.baseUsd;
                    powerUpgradeToUpdate.currentPower = savedU.currentPower || 0;
                }
            });
        }
        totalPowerAvailable = state.totalPowerAvailable || 0;

        // Load BTC upgrades
        if (state.btcUpgrades) {
            state.btcUpgrades.forEach((savedU) => {
                const upgradeToUpdate = btcUpgrades.find(u => u.id === savedU.id);
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    upgradeToUpdate.boostCost = savedU.boostCost || upgradeToUpdate.baseUsd * 0.5;
                    upgradeToUpdate.boostLevel = savedU.boostLevel || 0;
                }
            });
        } else if (state.upgrades) {
            // Backward compatibility: load old saves
            state.upgrades.forEach((savedU, index) => {
                let upgradeToUpdate;
                if (savedU.id !== undefined) {
                    upgradeToUpdate = btcUpgrades.find(u => u.id === savedU.id);
                } else {
                    upgradeToUpdate = btcUpgrades[index];
                }
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    upgradeToUpdate.boostCost = savedU.boostCost || upgradeToUpdate.baseUsd * 0.5;
                    upgradeToUpdate.boostLevel = savedU.boostLevel || 0;
                }
            });
        }

        // Load ETH upgrades
        if (state.ethUpgrades) {
            state.ethUpgrades.forEach((savedU) => {
                const upgradeToUpdate = ethUpgrades.find(u => u.id === savedU.id);
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    upgradeToUpdate.boostCost = savedU.boostCost || upgradeToUpdate.baseUsd * 0.5;
                    upgradeToUpdate.boostLevel = savedU.boostLevel || 0;
                }
            });
        }

        // Load DOGE upgrades
        if (state.dogeUpgrades) {
            state.dogeUpgrades.forEach((savedU) => {
                const upgradeToUpdate = dogeUpgrades.find(u => u.id === savedU.id);
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    upgradeToUpdate.boostCost = savedU.boostCost || upgradeToUpdate.baseUsd * 0.5;
                    upgradeToUpdate.boostLevel = savedU.boostLevel || 0;
                }
            });
        }

        // Load ascension data
        if (state.ascensionData && typeof loadAscensionData === 'function') {
            loadAscensionData(state.ascensionData);
            // Update UI to show/hide rugpull store button based on loaded currency
            if (typeof updateAscensionUI === 'function') {
                updateAscensionUI();
            }
        }

        // Load hacking minigame data
        if (state.hackingData) {
            hackingGamesPlayed = state.hackingData.gamesPlayed || 0;
            hackingGamesWon = state.hackingData.gamesWon || 0;
            hackingConsecutiveWins = state.hackingData.consecutiveWins || 0;
            hackingTotalRewardsEarned = state.hackingData.totalRewardsEarned || 0;
            hackingNextNotificationTime = state.hackingData.nextNotificationTime || 0;

            // Load cooldowns
            if (state.hackingData.cooldowns) {
                hackingCooldowns = state.hackingData.cooldowns;
            }

            // Check if speed boost is still active
            const savedBoostEnd = state.hackingData.speedBoostEndTime || 0;
            if (savedBoostEnd > Date.now()) {
                speedBoostActive = true;
                speedBoostEndTime = savedBoostEnd;
                speedBoostMultiplier = state.hackingData.speedBoostMultiplier || 1.0;
            } else {
                speedBoostActive = false;
                speedBoostMultiplier = 1.0;
            }
        }

        // Load whack-a-block minigame data
        if (state.whackData) {
            whackGameGamesPlayed = state.whackData.gamesPlayed || 0;
            whackGameGamesWon = state.whackData.gamesWon || 0;
            whackGameTotalRewardsEarned = state.whackData.totalRewardsEarned || 0;

            // Load cooldowns
            if (state.whackData.cooldowns) {
                whackCooldowns = state.whackData.cooldowns;
            }
        }

        // Calculate total power used
        calculateTotalPowerUsed();

        // Recalculate totals for all cryptos (with ascension bonus if available)
        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        btcPerSec = btcUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);

        // Restore autoclicker cooldown
        autoClickerCooldownEnd = state.autoClickerCooldownEnd || 0;

        // Calculate offline earnings (max 6 hours of earnings to prevent exploits)
        const lastSaveTime = state.lastSaveTime || Date.now();
        const currentTime = Date.now();
        let offlineSeconds = (currentTime - lastSaveTime) / 1000;
        const maxOfflineSeconds = 21600; // Cap at 6 hours
        if (offlineSeconds > maxOfflineSeconds) offlineSeconds = maxOfflineSeconds;

        console.log('=== OFFLINE EARNINGS DEBUG ===');
        console.log('Last save time:', new Date(lastSaveTime));
        console.log('Current time:', new Date(currentTime));
        console.log('Offline seconds:', offlineSeconds);
        console.log('Will show modal:', offlineSeconds >= 5);

        // Cap offline time at 6 hours (21600 seconds) + skill tree bonuses
        const BASE_OFFLINE_CAP = 21600; // 6 hours
        const MAX_OFFLINE_SECONDS = (typeof getOfflineCap === 'function') ? getOfflineCap() : BASE_OFFLINE_CAP;
        const cappedOfflineSeconds = Math.min(offlineSeconds, MAX_OFFLINE_SECONDS);
        const wasTimeCaped = offlineSeconds > MAX_OFFLINE_SECONDS;

        // Apply offline boost multiplier if purchased (2x earnings)
        const offlineBoostMultiplier = (typeof getOfflineBoost === 'function') ? (1 + getOfflineBoost()) : 1;

        const offlineBtcEarnings = btcPerSec * cappedOfflineSeconds * offlineBoostMultiplier;
        const offlineEthEarnings = ethPerSec * cappedOfflineSeconds * offlineBoostMultiplier;
        const offlineDogeEarnings = dogePerSec * cappedOfflineSeconds * offlineBoostMultiplier;

        // Calculate offline staking earnings (cash from staked crypto)
        const APR_RATE = 0.001; // 0.1% per 2 seconds
        const stakingIntervals = cappedOfflineSeconds / 2; // Number of 2-second intervals (capped)
        let offlineStakingCash = 0;

        if (state.staking) {
            const stakedBTC = state.staking.stakedBTC || 0;
            const stakedETH = state.staking.stakedETH || 0;
            const stakedDOGE = state.staking.stakedDOGE || 0;

            if (stakedBTC > 0) {
                const btcStakingEarnings = stakedBTC * APR_RATE * stakingIntervals;
                offlineStakingCash += btcStakingEarnings * btcPrice;
            }
            if (stakedETH > 0) {
                const ethStakingEarnings = stakedETH * APR_RATE * stakingIntervals;
                offlineStakingCash += ethStakingEarnings * ethPrice;
            }
            if (stakedDOGE > 0) {
                const dogeStakingEarnings = stakedDOGE * APR_RATE * stakingIntervals;
                offlineStakingCash += dogeStakingEarnings * dogePrice;
            }

            // Add staking cash to dollar balance
            if (offlineStakingCash > 0) {
                dollarBalance += offlineStakingCash;
                lifetimeEarnings += offlineStakingCash;
                sessionEarnings += offlineStakingCash;
            }
        }

        if (offlineBtcEarnings > 0) {
            btcBalance += offlineBtcEarnings;
            btcLifetime += offlineBtcEarnings;
            const btcUsdValue = offlineBtcEarnings * btcPrice;
            lifetimeEarnings += btcUsdValue;
            sessionEarnings += btcUsdValue; // Offline earnings count toward session
        }
        if (offlineEthEarnings > 0) {
            ethBalance += offlineEthEarnings;
            ethLifetime += offlineEthEarnings;
            const ethUsdValue = offlineEthEarnings * ethPrice;
            lifetimeEarnings += ethUsdValue;
            sessionEarnings += ethUsdValue; // Offline earnings count toward session
        }
        if (offlineDogeEarnings > 0) {
            dogeBalance += offlineDogeEarnings;
            dogeLifetime += offlineDogeEarnings;
            const dogeUsdValue = offlineDogeEarnings * dogePrice;
            lifetimeEarnings += dogeUsdValue;
            sessionEarnings += dogeUsdValue; // Offline earnings count toward session
        }

        // Always show offline earnings if we've been away (even if earnings are 0)
        // Only skip if the time away is less than 5 seconds (quick refresh)
        if (offlineSeconds >= 5) {
            window.offlineEarningsToShow = {
                btc: offlineBtcEarnings,
                eth: offlineEthEarnings,
                doge: offlineDogeEarnings,
                stakingCash: offlineStakingCash,
                seconds: offlineSeconds,
                wasCapped: wasTimeCaped,
                cappedSeconds: cappedOfflineSeconds
            };
            console.log('Offline earnings set:', window.offlineEarningsToShow);
        } else {
            console.log('Time away too short for offline modal:', offlineSeconds, 'seconds');
        }

        updateUI();

        // Restore chart history from save, starting from 0
        if (state.chartHistory && state.chartHistory.length > 0) {
            chartHistory = state.chartHistory;
            chartTimestamps = state.chartTimestamps || [];
            console.log('Chart data restored:', chartHistory.length, 'data points');
        } else {
            // Start fresh if no saved chart data
            chartHistory = [];
            chartTimestamps = [];
            console.log('No saved chart data, starting fresh');
        }

        // Debug log
        console.log('✓ LOAD COMPLETE');
        console.log('Final balances:', { btcBalance, ethBalance, dogeBalance, dollarBalance, hardwareEquity });
        console.log('Chart history length:', chartHistory.length);
    } catch (error) {
        console.error('✗ ERROR loading game from localStorage:', error);
        console.error('Error stack:', error.stack);
        // Silently start fresh without showing alert
    }
}
    // --- SAVE SYSTEM END ---

    // --- EXPORT/IMPORT SYSTEM START ---

    /**
     * Get the current game state for export (reuses saveGame structure)
     */
    function getExportableGameState() {
        return {
            // Game version for compatibility checks
            version: '1.1.0',
            exportDate: Date.now(),
            // Bitcoin data
            btcBalance,
            btcLifetime,
            btcClickValue,
            btcPerSec,
            btcPrice,
            // Ethereum data
            ethBalance,
            ethLifetime,
            ethClickValue,
            ethPerSec,
            ethPrice,
            // Dogecoin data
            dogeBalance,
            dogeLifetime,
            dogeClickValue,
            dogePerSec,
            dogePrice,
            // General data
            dollarBalance,
            hardwareEquity,
            lastSaveTime: Date.now(),
            autoClickerCooldownEnd,
            lifetimeEarnings,
            sessionEarnings,
            sessionStartTime,
            lifetimeEarningsDisplay: typeof window.rugpullState !== 'undefined' ? window.rugpullState.lifetimeEarningsDisplay : 0,
            chartHistory: chartHistory,
            chartTimestamps: chartTimestamps,
            chartStartTime: chartStartTime,
            totalPowerAvailable,
            // Staking data
            staking: getStakingData(),
            powerUpgrades: powerUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentPower: u.currentPower
            })),
            btcUpgrades: btcUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })),
            ethUpgrades: ethUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })),
            dogeUpgrades: dogeUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })),
            // Ascension/Rugpull data
            ascensionData: (typeof getAscensionData === 'function') ? getAscensionData() : {},
            // Achievements data
            achievements: (typeof achievementsData !== 'undefined') ? achievementsData.achievements : {},
            // Hacking minigame data
            hackingData: {
                gamesPlayed: hackingGamesPlayed,
                gamesWon: hackingGamesWon,
                consecutiveWins: hackingConsecutiveWins,
                totalRewardsEarned: hackingTotalRewardsEarned,
                speedBoostEndTime: speedBoostActive ? speedBoostEndTime : 0,
                speedBoostMultiplier: speedBoostActive ? speedBoostMultiplier : 1.0,
                nextNotificationTime: hackingNextNotificationTime,
                cooldowns: hackingCooldowns
            }
        };
    }

    /**
     * Encode game state to Base64 string (Cookie Clicker style)
     */
    function encodeGameState(gameState) {
        try {
            const jsonString = JSON.stringify(gameState);
            // Use btoa for Base64 encoding, with UTF-8 support
            const base64 = btoa(unescape(encodeURIComponent(jsonString)));
            return base64;
        } catch (error) {
            console.error('Error encoding game state:', error);
            return null;
        }
    }

    /**
     * Decode Base64 string back to game state
     */
    function decodeGameState(base64String) {
        try {
            // Remove any whitespace that might have been added
            const cleanBase64 = base64String.trim().replace(/\s/g, '');
            // Decode from Base64 with UTF-8 support
            const jsonString = decodeURIComponent(escape(atob(cleanBase64)));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error decoding game state:', error);
            return null;
        }
    }

    /**
     * Open the export/import modal
     */
    function openExportImportModal() {
        const modal = document.getElementById('export-import-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Clear previous status messages
            const exportStatus = document.getElementById('export-status');
            const importStatus = document.getElementById('import-status');
            if (exportStatus) exportStatus.style.display = 'none';
            if (importStatus) importStatus.style.display = 'none';
            // Clear the textarea
            const textarea = document.getElementById('import-save-textarea');
            if (textarea) textarea.value = '';
        }
    }

    /**
     * Close the export/import modal
     */
    function closeExportImportModal() {
        const modal = document.getElementById('export-import-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Export save to clipboard
     */
    function exportSaveToClipboard() {
        const gameState = getExportableGameState();
        const encoded = encodeGameState(gameState);

        if (!encoded) {
            showExportStatus('Failed to encode save data!', false);
            return;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(encoded).then(() => {
            showExportStatus('Save copied to clipboard!', true);
            console.log('Save exported to clipboard, length:', encoded.length, 'characters');
        }).catch(err => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = encoded;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showExportStatus('Save copied to clipboard!', true);
            } catch (e) {
                showExportStatus('Failed to copy to clipboard!', false);
            }
            document.body.removeChild(textarea);
        });
    }

    /**
     * Export save to a downloadable file
     */
    function exportSaveToFile() {
        const gameState = getExportableGameState();
        const encoded = encodeGameState(gameState);

        if (!encoded) {
            showExportStatus('Failed to encode save data!', false);
            return;
        }

        // Create filename with timestamp
        const date = new Date();
        const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `SatoshiTerminal_${timestamp}.txt`;

        // Create and download file
        const blob = new Blob([encoded], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showExportStatus(`Save downloaded as ${filename}`, true);
        console.log('Save exported to file:', filename);
    }

    /**
     * Import save from the textarea
     */
    function importSaveFromText() {
        try {
            console.log('=== IMPORT SAVE STARTED ===');

            const textarea = document.getElementById('import-save-textarea');
            if (!textarea || !textarea.value.trim()) {
                showImportStatus('Please paste a save string first!', false);
                return;
            }

            console.log('Textarea value length:', textarea.value.trim().length);

            const importedState = decodeGameState(textarea.value);
            if (!importedState) {
                showImportStatus('Invalid save data! Could not decode.', false);
                return;
            }

            console.log('Decoded state successfully');
            console.log('BTC Balance in import:', importedState.btcBalance);
            console.log('Dollar Balance in import:', importedState.dollarBalance);

            // Validate the imported data has expected properties
            if (!validateImportedState(importedState)) {
                showImportStatus('Invalid save data! Missing required fields.', false);
                return;
            }

            console.log('Validation passed');

            // Confirm before overwriting
            if (!confirm('This will overwrite your current save. Are you sure you want to continue?')) {
                console.log('User cancelled import');
                return;
            }

            console.log('User confirmed, blocking auto-save and applying import...');

            // CRITICAL: Block any auto-saves from overwriting our import
            importInProgress = true;

            // Apply the imported save
            applyImportedState(importedState);

            console.log('Import applied to localStorage');
            showImportStatus('Save imported! Reloading...', true);

            // Close the modal
            closeExportImportModal();

            // Force reload immediately - use location.href to ensure clean reload
            console.log('Forcing page reload NOW');
            window.location.href = window.location.href.split('?')[0] + '?imported=' + Date.now();

        } catch (error) {
            console.error('IMPORT ERROR:', error);
            importInProgress = false; // Reset flag on error
            showImportStatus('Import failed: ' + error.message, false);
        }
    }

    /**
     * Import save from a file
     */
    function importSaveFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const textarea = document.getElementById('import-save-textarea');
            if (textarea) {
                textarea.value = content;
            }

            const importedState = decodeGameState(content);
            if (!importedState) {
                showImportStatus('Invalid save file! Could not decode.', false);
                return;
            }

            if (!validateImportedState(importedState)) {
                showImportStatus('Invalid save file! Missing required fields.', false);
                return;
            }

            // Confirm before overwriting
            if (!confirm('This will overwrite your current save. Are you sure you want to continue?')) {
                // Reset the file input
                event.target.value = '';
                return;
            }

            // Block auto-saves
            importInProgress = true;

            applyImportedState(importedState);
            showImportStatus('Save imported! Reloading...', true);

            // Close the modal and force reload
            closeExportImportModal();
            window.location.href = window.location.href.split('?')[0] + '?imported=' + Date.now();
        };
        reader.onerror = function() {
            showImportStatus('Failed to read file!', false);
        };
        reader.readAsText(file);
    }

    /**
     * Validate that imported state has required fields
     */
    function validateImportedState(state) {
        // Check for essential fields that should exist in any valid save
        const requiredFields = [
            'btcBalance',
            'dollarBalance',
            'btcUpgrades'
        ];

        for (const field of requiredFields) {
            if (state[field] === undefined) {
                console.error('Missing required field:', field);
                return false;
            }
        }

        // Check that btcUpgrades is an array
        if (!Array.isArray(state.btcUpgrades)) {
            console.error('btcUpgrades is not an array');
            return false;
        }

        return true;
    }

    /**
     * Apply imported state to localStorage (let loadGame handle the actual loading)
     */
    function applyImportedState(state) {
        try {
            // Convert the imported state back to the format expected by loadGame
            const saveData = {
                ...state,
                lastSaveTime: Date.now() // Update the save time
            };

            const saveString = JSON.stringify(saveData);

            console.log('=== IMPORT DEBUG ===');
            console.log('Importing BTC balance:', state.btcBalance);
            console.log('Importing ETH balance:', state.ethBalance);
            console.log('Importing DOGE balance:', state.dogeBalance);
            console.log('Importing dollar balance:', state.dollarBalance);
            console.log('Importing hardware equity:', state.hardwareEquity);
            console.log('Importing lifetime earnings:', state.lifetimeEarnings);
            console.log('Save string length:', saveString.length);

            localStorage.setItem('satoshiTerminalSave', saveString);

            // Verify the save was written
            const verifyData = localStorage.getItem('satoshiTerminalSave');
            if (verifyData && verifyData.length === saveString.length) {
                console.log('IMPORT SUCCESS - Data verified in localStorage');
            } else {
                console.error('IMPORT WARNING - Data verification failed');
            }
        } catch (error) {
            console.error('Error applying imported state:', error);
            throw error;
        }
    }

    /**
     * Show export status message
     */
    function showExportStatus(message, success) {
        const status = document.getElementById('export-status');
        if (status) {
            status.textContent = message;
            status.style.color = success ? '#00ff88' : '#ff3344';
            status.style.display = 'block';

            // Hide after 3 seconds
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Show import status message
     */
    function showImportStatus(message, success) {
        const status = document.getElementById('import-status');
        if (status) {
            status.textContent = message;
            status.style.color = success ? '#00ff88' : '#ff3344';
            status.style.display = 'block';
        }
    }

    // --- EXPORT/IMPORT SYSTEM END ---

    function calculateTotalPowerUsed() {
        let rawPowerUsed = 0;
        // Calculate BTC equipment power
        upgrades.forEach(u => {
            if (u.level > 0 && equipmentPowerReqs[u.id] !== undefined) {
                rawPowerUsed += equipmentPowerReqs[u.id] * u.level;
            }
        });
        // Calculate ETH equipment power
        ethUpgrades.forEach(u => {
            if (u.level > 0 && equipmentPowerReqs[u.id] !== undefined) {
                rawPowerUsed += equipmentPowerReqs[u.id] * u.level;
            }
        });
        // Calculate DOGE equipment power
        dogeUpgrades.forEach(u => {
            if (u.level > 0 && equipmentPowerReqs[u.id] !== undefined) {
                rawPowerUsed += equipmentPowerReqs[u.id] * u.level;
            }
        });

        // Apply power efficiency skill bonus (reduces consumption)
        const powerEfficiency = typeof getPowerEfficiency === 'function' ? getPowerEfficiency() : 0;
        totalPowerUsed = rawPowerUsed * (1 - powerEfficiency);
    }

    function getTotalPowerAvailableWithBonus() {
        // Apply power boost skill bonus (increases available power)
        try {
            const powerBoost = typeof getPowerBoost === 'function' ? getPowerBoost() : 0;
            return totalPowerAvailable * (1 + powerBoost);
        } catch (e) {
            return totalPowerAvailable; // Return base if error
        }
    }

    function getEffectivePowerRequirement(powerReq) {
        // Apply power efficiency skill bonus (reduces consumption)
        // Safe fallback for when functions aren't available yet
        if (!powerReq || powerReq <= 0) return powerReq;
        try {
            if (typeof getSkillBonus === 'function') {
                const powerEfficiency = getSkillBonus('power_efficiency');
                return Math.max(0, powerReq * (1 - powerEfficiency));
            }
            return powerReq;
        } catch (e) {
            return powerReq; // Return base requirement if functions unavailable
        }
    }

    /**
     * Get effective price with crypto price bonus applied
     * Crypto price upgrades increase the value of sold crypto
     */
    function getEffectiveCryptoPrice(basePrice) {
        const cryptoPriceBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('crypto_price') : 0;
        return basePrice * (1 + cryptoPriceBonus);
    }

    /**
     * Get cash multiplier from upgrades
     * Increases earnings from all sources
     */
    function getCashMultiplier() {
        const cashBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('cash_multiplier') : 0;
        const cryptoDoubler = (typeof getSkillBonus === 'function') ? getSkillBonus('crypto_doubler') : 0;
        return 1 + cashBonus + cryptoDoubler;
    }

    /**
     * Check if auto-sell crypto is enabled and sell if needed
     */
    function tryAutoSellCrypto(cryptoType, amount) {
        // Check if auto-sell is purchased and enabled
        const metaUpgradesData = typeof window.metaUpgrades !== 'undefined' ? window.metaUpgrades : null;
        const toggleState = typeof window.upgradeToggleState !== 'undefined' ? window.upgradeToggleState : null;

        if (!metaUpgradesData || !toggleState) {
            console.debug(`[AUTO-SELL] ${cryptoType}: Missing data objects`, { metaUpgradesData: !!metaUpgradesData, toggleState: !!toggleState });
            return false;
        }

        const hasUpgrade = metaUpgradesData.auto_sell_crypto && metaUpgradesData.auto_sell_crypto.purchased;
        const isEnabled = toggleState.auto_sell === true;
        const autoSellEnabled = hasUpgrade && isEnabled;

        if (!autoSellEnabled) {
            console.debug(`[AUTO-SELL] ${cryptoType}: Disabled or not purchased`, { hasUpgrade, isEnabled, auto_sell: toggleState.auto_sell });
            return false;
        }

        // Get the cash multiplier for earnings
        const cashMultiplier = getCashMultiplier();

        if (cryptoType === 'btc') {
            const effectivePrice = getEffectiveCryptoPrice(btcPrice);
            const cashValue = amount * effectivePrice * 0.95 * cashMultiplier; // 5% fee, then apply cash multiplier
            dollarBalance += cashValue;
            console.log(`[AUTO-SELL] BTC: Sold ${amount} BTC for $${cashValue.toFixed(2)} (before multiplier: $${(amount * effectivePrice * 0.95).toFixed(2)})`);
            return true;  // Sold instead of adding to balance
        } else if (cryptoType === 'eth') {
            const effectivePrice = getEffectiveCryptoPrice(ethPrice);
            const cashValue = amount * effectivePrice * 0.95 * cashMultiplier; // 5% fee, then apply cash multiplier
            dollarBalance += cashValue;
            console.log(`[AUTO-SELL] ETH: Sold ${amount} ETH for $${cashValue.toFixed(2)} (before multiplier: $${(amount * effectivePrice * 0.95).toFixed(2)})`);
            return true;  // Sold instead of adding to balance
        } else if (cryptoType === 'doge') {
            const effectivePrice = getEffectiveCryptoPrice(dogePrice);
            const cashValue = amount * effectivePrice * 0.95 * cashMultiplier; // 5% fee, then apply cash multiplier
            dollarBalance += cashValue;
            console.log(`[AUTO-SELL] DOGE: Sold ${amount} DOGE for $${cashValue.toFixed(2)} (before multiplier: $${(amount * effectivePrice * 0.95).toFixed(2)})`);
            return true;  // Sold instead of adding to balance
        }

        return false;
    }

    function dismissInstructions() {
        const instructionsEl = document.getElementById('game-instructions');
        if (instructionsEl) {
            instructionsEl.style.display = 'none';
            localStorage.setItem('instructionsDismissed', 'true');
        }
    }

    function resetEarningsStats() {
        if (confirm('Reset lifetime and session earnings to $0? This will not affect your crypto or upgrades.')) {
            lifetimeEarnings = 0;
            sessionEarnings = 0;
            sessionStartTime = Date.now();
            saveGame();
            updateUI();
            alert('Earnings stats have been reset!');
        }
    }

    function resetGame() {
        if (confirm('Are you sure you want to reset your entire save? This cannot be undone!')) {
            localStorage.removeItem('satoshiTerminalSave');
            localStorage.removeItem('instructionsDismissed');
            localStorage.removeItem('achievements');
            // Reset all variables to defaults
            btcBalance = 0;
            btcLifetime = 0;
            btcPerSec = 0;
            btcClickValue = 0.00000250;
            ethBalance = 0;
            ethLifetime = 0;
            ethPerSec = 0;
            ethClickValue = 0.00007143;
            dogeBalance = 0;
            dogeLifetime = 0;
            dogePerSec = 0;
            dogeClickValue = 1.00000000;
            dollarBalance = 0;
            hardwareEquity = 0;
            autoClickerCooldownEnd = 0;
            // Reset session stats
            sessionStartTime = Date.now();
            sessionStartBTC = 0;
            sessionStartETH = 0;
            sessionStartDOGE = 0;
            sessionStartBalance = 0;
            sessionStartNetWorth = 0;
            sessionEarnings = 0;
            lifetimeEarnings = 0;
            // Reset chart history
            chartHistory = [];
            chartTimestamps = [];
            chartStartTime = Date.now();
            // Reset power system
            totalPowerAvailable = 0;
            totalPowerUsed = 0;
            powerUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentPower = 0;
            });
            // Reset all upgrades
            btcUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
                u.boostCost = u.baseCost || u.currentUsd;
                u.boostLevel = 0;
            });
            ethUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
                u.boostCost = u.baseCost || u.currentUsd;
                u.boostLevel = 0;
            });
            dogeUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
                u.boostCost = u.baseCost || u.currentUsd;
                u.boostLevel = 0;
            });
            // Reset staked crypto amounts
            stakedBTC = 0;
            stakedETH = 0;
            stakedDOGE = 0;
            // Reset skill tree (if skill tree system exists)
            if (typeof resetSkillTree === 'function') {
                resetSkillTree();
            }

            // Reset ascension/rugpull data completely
            if (typeof resetAscensionData === 'function') {
                console.log('Calling resetAscensionData()...');
                resetAscensionData();
                console.log('After reset - rugpullCurrency:', typeof rugpullCurrency !== 'undefined' ? rugpullCurrency : 'undefined');
            }

            // Reset hacking minigame data
            hackingGameActive = false;
            hackingGameDifficulty = 'EASY';
            hackingVulnerabilitiesToFind = [];
            hackingVulnerabilitiesFound = [];
            hackingGameStartTime = 0;
            hackingGameTimeLimit = 30000;
            hackingLivesRemaining = 0;
            hackingMaxLives = 0;
            speedBoostActive = false;
            speedBoostEndTime = 0;
            speedBoostMultiplier = 1.0;
            hackingGamesPlayed = 0;
            hackingGamesWon = 0;
            hackingConsecutiveWins = 0;
            hackingNextNotificationTime = 0;
            hackingTotalRewardsEarned = 0;
            hackingCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 };

            // Reset whack-a-block minigame
            whackGameGamesPlayed = 0;
            whackGameGamesWon = 0;
            whackGameTotalRewardsEarned = 0;
            whackCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 };

            // Reset achievements on full save reset
            if (typeof achievementsData !== 'undefined') {
                // Clear achievements object completely
                achievementsData.achievements = {};
                // Reinitialize achievements from definitions
                if (typeof initAchievements === 'function') {
                    initAchievements();
                }
                notificationsShownThisSession.clear();
                console.log('✓ Achievements reset on save reset');
            }

            console.log('Calling saveGame() after reset...');
            saveGame();
            updateUI();
            updateStakingUI(); // Update staking display

            // Clear browser cache to fix chart display issues (especially on mobile Chrome)
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    for (let name of names) {
                        caches.delete(name);
                    }
                });
            }

            alert('Game reset! Starting fresh. Page will reload to clear cache.')
            // Reload page to ensure clean state
            window.location.reload(true);
        }
    }

    function showOfflineEarningsModal(btcEarned, ethEarned, dogeEarned, stakingCash, secondsOffline, wasCapped, cappedSeconds) {
        console.log('showOfflineEarningsModal called with:', btcEarned, ethEarned, dogeEarned, stakingCash, secondsOffline, wasCapped, cappedSeconds);

        const overlay = document.createElement('div');
        overlay.className = 'offline-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'offline-modal';

        const hours = Math.floor(secondsOffline / 3600);
        const minutes = Math.floor((secondsOffline % 3600) / 60);
        const seconds = Math.floor(secondsOffline % 60);

        let timeStr = '';
        if (hours > 0) timeStr += hours + 'h ';
        if (minutes > 0) timeStr += minutes + 'm ';
        if (seconds > 0) timeStr += seconds + 's';
        if (!timeStr) timeStr = '< 1s';

        let earningsHtml = '';
        if (btcEarned > 0) {
            earningsHtml += `<div class="earnings" style="color: #f7931a;">₿ ${btcEarned.toFixed(8)}</div>`;
        }
        if (ethEarned > 0) {
            earningsHtml += `<div class="earnings" style="color: #627eea;">Ξ ${ethEarned.toFixed(8)}</div>`;
        }
        if (dogeEarned > 0) {
            earningsHtml += `<div class="earnings" style="color: #c2a633;">Ð ${dogeEarned.toFixed(2)}</div>`;
        }
        if (stakingCash > 0) {
            // Abbreviate large cash amounts
            let cashDisplay;
            if (stakingCash >= 1e9) {
                cashDisplay = '$' + (stakingCash / 1e9).toFixed(2) + 'b';
            } else if (stakingCash >= 1e6) {
                cashDisplay = '$' + (stakingCash / 1e6).toFixed(2) + 'm';
            } else if (stakingCash >= 1e3) {
                cashDisplay = '$' + (stakingCash / 1e3).toFixed(2) + 'k';
            } else {
                cashDisplay = '$' + stakingCash.toFixed(2);
            }
            earningsHtml += `<div class="earnings" style="color: #4caf50;">💰 ${cashDisplay}</div>`;
        }

        // If no earnings, show a message
        if (!earningsHtml) {
            earningsHtml = `<div class="earnings" style="color: #888; font-size: 1.2rem;">$0.00</div>
                           <div style="color: #666; font-size: 0.9rem; margin-top: 10px;">Purchase miners to earn while offline!</div>`;
        }

        // Add cap notice if time was capped
        let capNotice = '';
        if (wasCapped) {
            capNotice = `<div style="color: #ff9800; font-size: 0.85rem; margin-top: 8px; padding: 8px; background: rgba(255,152,0,0.1); border-radius: 4px; border: 1px solid rgba(255,152,0,0.3);">⚠️ Offline earnings capped at 6 hours</div>`;
        }

        modal.innerHTML = `
            <h2>⏰ Welcome Back!</h2>
            <div class="earnings-label">Offline Earnings${wasCapped ? ' (6 hour max)' : ''}</div>
            ${earningsHtml}
            <div class="time-offline">While you were away for ${timeStr}</div>
            ${capNotice}
            <button id="claim-btn">Claim Rewards</button>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        document.getElementById('claim-btn').onclick = () => {
            overlay.remove();
            modal.remove();
        };

        console.log('Modal created and appended');
    }

    // Sound mute toggle
    let isMuted = false;
    function toggleMute() {
        isMuted = !isMuted;
        const btn = document.getElementById('mute-btn');
        if (btn) {
            btn.innerText = isMuted ? 'SOUND OFF' : 'SOUND ON';
        }
    }

    // Auto-clicker state
    let autoClickerActive = false;
    let autoClickerCooldownEnd = 0;
    const AUTO_CLICKER_DURATION = 30000; // 30 seconds
    const AUTO_CLICKER_COOLDOWN = 300000; // 5 minutes

    function startAutoClicker() {
        if (autoClickerCooldownEnd > Date.now()) {
            return; // Still on cooldown
        }

        autoClickerActive = true;
        autoClickerCooldownEnd = Date.now() + AUTO_CLICKER_COOLDOWN;
        let clicksRemaining = AUTO_CLICKER_DURATION / 200; // 5 clicks/sec = 1 click every 200ms

        const clickInterval = setInterval(() => {
            if (clicksRemaining > 0) {
                // Click all three crypto types
                manualHash();      // BTC
                manualEthHash();   // ETH
                manualDogeHash();  // DOGE
                clicksRemaining--;
            } else {
                clearInterval(clickInterval);
                autoClickerActive = false;
                updateAutoClickerButtonState();
            }
        }, 200);

        updateAutoClickerButtonState();
    }

    function updateAutoClickerButtonState() {
        const btn = document.getElementById('autoclicker-btn');
        if (!btn) return;

        const now = Date.now();
        if (autoClickerCooldownEnd > now) {
            const cooldownMs = autoClickerCooldownEnd - now;
            const seconds = Math.ceil(cooldownMs / 1000);
            btn.disabled = true;
            btn.innerText = `AUTO CLICKER • COOLDOWN: ${seconds}s`;
        } else {
            btn.disabled = false;
            btn.innerText = 'AUTO CLICKER • 5 clicks/sec • 30s • 5m cooldown';
        }
    }

    function initBtcShop() {
        const container = document.getElementById('btc-shop');
        container.innerHTML = '';

        btcUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item';
            btn.id = `up-${u.id}`;
        // All upgrades use the same purchase function
        btn.onclick = () => buyLevelMultiple(i, buyQuantity);

        const powerReq = equipmentPowerReqs[u.id] || 0;
        const effectivePower = getEffectivePowerRequirement(powerReq);
        const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:var(--btc);font-weight:700;display:block;margin-top:3px" id="power-${u.id}">${formatPower(effectivePower)} Consumed per level</span>` : '';

        btn.innerHTML = `
            <div style="text-align:left;flex:1">
                <div style="font-size:0.9rem;color:#f7931a;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="yield-${u.id}">+0 ₿/s - Current Speed</div>
                <div style="font-size:0.9rem;color:#f7931a;font-weight:700;display:block;margin-top:3px" id="increase-${u.id}">+0 ₿/s per level</div>
                ${powerDisplay}
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="usd-${u.id}">$${formatNumberForDisplay(u.baseUsd)}</span>
                <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="afford-${u.id}">x0</span>
            </div>`;
        container.appendChild(btn);

        // Add boost button only for non-manual upgrades
        if (!u.isClickUpgrade) {
            const boostBtn = document.createElement('button');
            boostBtn.id = `boost-${u.id}`;
            boostBtn.style.background = '#ff9500';
            boostBtn.style.border = 'none';
            boostBtn.style.borderRadius = '6px';
            boostBtn.style.padding = '6px 10px';
            boostBtn.style.fontSize = '0.7rem';
            boostBtn.style.fontWeight = '700';
            boostBtn.style.color = '#000';
            boostBtn.style.cursor = 'pointer';
            boostBtn.style.marginTop = '2px';
            boostBtn.style.width = '100%';
            boostBtn.style.transition = '0.1s';
            boostBtn.onclick = () => buyBoost(i);
            boostBtn.innerHTML = `+10% HASH RATE | <span id="boost-cost-${u.id}">$0</span>`;
            boostBtn.disabled = u.level === 0;
            boostBtn.setAttribute('data-upgrade-name', u.name);
            container.appendChild(boostBtn);
        }
        });
    }

    function initPowerShop() {
        const container = document.getElementById('power-shop');
        container.innerHTML = '';

        powerUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item';
            btn.id = `pow-${u.id}`;
            btn.onclick = () => buyPowerUpgrade(i);

            const costBtc = u.currentUsd / btcPrice;
            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#00ff88;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="pow-lvl-txt-${u.id}">[Lvl ${u.level}]</span> ${u.name}</div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="pow-current-${u.id}">+0W - Current Power</div>
                    <div style="font-size:1.1rem;color:#00ff88;font-family:monospace;font-weight:700;display:block" id="pow-power-${u.id}">+0W Produced per level</div>
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="pow-usd-${u.id}">$${formatNumberForDisplay(u.currentUsd)}</span>
                    <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="pow-afford-${u.id}">x0</span>
                </div>`;
            container.appendChild(btn);
        });
    }

    function initEthShop() {
        const container = document.getElementById('eth-shop');
        container.innerHTML = '';

        ethUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item';
            btn.id = `eth-up-${u.id}`;
            if (u.isClickUpgrade) {
                btn.classList.add('click-upgrade');
            }

            btn.onclick = () => buyEthLevel(i, buyQuantity);

            const powerReq = equipmentPowerReqs[u.id] || 0;
            const effectivePower = getEffectivePowerRequirement(powerReq);
            const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-power-${u.id}">${formatPower(effectivePower)} Consumed per level</span>` : '';

            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#627eea;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="eth-lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="eth-yield-${u.id}">+0 Ξ/s - Current Speed</div>
                    <div style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-increase-${u.id}">+0 Ξ/s per level</div>
                    ${powerDisplay}
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="eth-usd-${u.id}">$${formatNumberForDisplay(u.baseUsd)}</span>
                    <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="eth-afford-${u.id}">x0</span>
                </div>`;
            container.appendChild(btn);

            // Add boost button only for non-manual upgrades
            if (!u.isClickUpgrade) {
                const boostBtn = document.createElement('button');
                boostBtn.id = `eth-boost-${u.id}`;
                boostBtn.style.background = '#ff9500';
                boostBtn.style.border = 'none';
                boostBtn.style.borderRadius = '6px';
                boostBtn.style.padding = '6px 10px';
                boostBtn.style.fontSize = '0.7rem';
                boostBtn.style.fontWeight = '700';
                boostBtn.style.color = '#000';
                boostBtn.style.cursor = 'pointer';
                boostBtn.style.marginTop = '2px';
                boostBtn.style.width = '100%';
                boostBtn.style.transition = '0.1s';
                boostBtn.onclick = () => buyEthBoost(i);
                boostBtn.innerHTML = `+10% HASH RATE | <span id="eth-boost-cost-${u.id}">$0</span>`;
                boostBtn.disabled = u.level === 0;
                boostBtn.setAttribute('data-upgrade-name', u.name);
                container.appendChild(boostBtn);
            }
        });
    }

    function initDogeShop() {
        const container = document.getElementById('doge-shop');
        container.innerHTML = '';

        dogeUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item';
            btn.id = `doge-up-${u.id}`;
            if (u.isClickUpgrade) {
                btn.classList.add('click-upgrade');
            }

            btn.onclick = () => buyDogeLevel(i, buyQuantity);

            const powerReq = equipmentPowerReqs[u.id] || 0;
            const effectivePower = getEffectivePowerRequirement(powerReq);
            const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-power-${u.id}">${formatPower(effectivePower)} Consumed per level</span>` : '';

            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#c2a633;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="doge-lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="doge-yield-${u.id}">+0 Ð/s - Current Speed</div>
                    <div style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-increase-${u.id}">+0 Ð/s per level</div>
                    ${powerDisplay}
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="doge-usd-${u.id}">$${formatNumberForDisplay(u.baseUsd)}</span>
                    <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="doge-afford-${u.id}">x0</span>
                </div>`;
            container.appendChild(btn);

            // Add boost button only for non-manual upgrades
            if (!u.isClickUpgrade) {
                const boostBtn = document.createElement('button');
                boostBtn.id = `doge-boost-${u.id}`;
                boostBtn.style.background = '#ff9500';
                boostBtn.style.border = 'none';
                boostBtn.style.borderRadius = '6px';
                boostBtn.style.padding = '6px 10px';
                boostBtn.style.fontSize = '0.7rem';
                boostBtn.style.fontWeight = '700';
                boostBtn.style.color = '#000';
                boostBtn.style.cursor = 'pointer';
                boostBtn.style.marginTop = '2px';
                boostBtn.style.width = '100%';
                boostBtn.style.transition = '0.1s';
                boostBtn.onclick = () => buyDogeBoost(i);
                boostBtn.innerHTML = `+10% HASH RATE | <span id="doge-boost-cost-${u.id}">$0</span>`;
                boostBtn.disabled = u.level === 0;
                boostBtn.setAttribute('data-upgrade-name', u.name);
                container.appendChild(boostBtn);
            }
        });
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        const tabElement = document.getElementById(tab + '-tab');
        tabElement.classList.add('active');

        // Add active class to the button that was clicked
        if (event && event.target) {
            event.target.classList.add('active');
        }

        // Reset purchase quantity to 1x when switching tabs
        setBuyQuantity(1);

        // Scroll buttons to the top of the page
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                const buttonsContainer = document.querySelector('.tab-buttons');
                if (buttonsContainer) {
                    buttonsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }
    }

    function setBuyQuantity(qty) {
        buyQuantity = qty;
        // All buttons are grey
        const defaultColor = '#888';

        document.querySelectorAll('.qty-toggle').forEach(el => {
            el.classList.remove('active');
            // Reset to default grey color
            el.style.borderColor = defaultColor;
            el.style.color = defaultColor;
        });

        // Find and highlight the active button in the current tab
        document.querySelectorAll('.qty-toggle').forEach(el => {
            if (el.textContent.trim() === `${qty}x`) {
                el.classList.add('active');
                el.style.borderColor = '#666';
                el.style.color = '#fff';
                el.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.2)';
            }
        });
    }

    // Market sell functions
    function sellBTC(amount) {
        if (btcBalance < amount) {
            alert('Not enough Bitcoin!');
            return;
        }
        btcBalance -= amount;
        dollarBalance += amount * btcPrice;
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllBTC() {
        if (btcBalance <= 0) return;
        const effectivePrice = getEffectiveCryptoPrice(btcPrice);
        const saleValue = btcBalance * effectivePrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        btcBalance = 0;
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellETH(amount) {
        if (ethBalance < amount) {
            alert('Not enough Ethereum!');
            return;
        }
        ethBalance -= amount;
        const effectivePrice = getEffectiveCryptoPrice(ethPrice);
        const saleValue = amount * effectivePrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllETH() {
        if (ethBalance <= 0) return;
        const effectivePrice = getEffectiveCryptoPrice(ethPrice);
        const saleValue = ethBalance * effectivePrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        ethBalance = 0;
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellDOGE(amount) {
        // DOGE uses whole numbers
        if (dogeBalance < amount) {
            alert('Not enough Dogecoin!');
            return;
        }
        dogeBalance -= amount;
        const effectivePrice = getEffectiveCryptoPrice(dogePrice);
        const saleValue = amount * effectivePrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllDOGE() {
        if (dogeBalance <= 0) return;
        const effectivePrice = getEffectiveCryptoPrice(dogePrice);
        dollarBalance += dogeBalance * effectivePrice;
        dogeBalance = 0;
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    /**
     * Quick sell functions that use percentages (like staking)
     */
    function quickSellBTC(percentage) {
        if (btcBalance <= 0) return;
        const amountToSell = btcBalance * (percentage / 100);
        const effectivePrice = getEffectiveCryptoPrice(btcPrice);
        const saleValue = amountToSell * effectivePrice * 0.95; // 5% fee
        btcBalance -= amountToSell;
        dollarBalance += saleValue;
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function quickSellETH(percentage) {
        if (ethBalance <= 0) return;
        const amountToSell = ethBalance * (percentage / 100);
        const effectivePrice = getEffectiveCryptoPrice(ethPrice);
        const saleValue = amountToSell * effectivePrice * 0.95; // 5% fee
        ethBalance -= amountToSell;
        dollarBalance += saleValue;
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function quickSellDOGE(percentage) {
        if (dogeBalance <= 0) return;
        const amountToSell = dogeBalance * (percentage / 100);
        const effectivePrice = getEffectiveCryptoPrice(dogePrice);
        const saleValue = amountToSell * effectivePrice * 0.95; // 5% fee
        dogeBalance -= amountToSell;
        dollarBalance += saleValue;
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function buyPowerUpgrade(i) {
        const u = powerUpgrades[i];
        const costUsd = u.currentUsd;

        if (dollarBalance >= costUsd) {
            dollarBalance -= costUsd;
            hardwareEquity += u.currentUsd;
            u.level++;
            u.currentPower = u.basePower * u.level;
            totalPowerAvailable += u.basePower;

            // Update price with 1.2x multiplier
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.2, u.level));

            // Track Basic Power Strip purchase for tutorial
            if (i === 0 && typeof trackPowerStripPurchase === 'function') {
                trackPowerStripPurchase();
            }

            updateUI();
            saveGame();
            playUpgradeSound();
        }
    }

    // ============== HACKING MINIGAME FUNCTIONS ==============

    // Difficulty configurations - rewards are USD values, converted to crypto based on current prices
    const hackingDifficultyConfig = {
        'EASY': {
            vulnerabilities: 3,
            timeLimit: 30000,
            codeLines: 12,
            lives: 6,
            baseUsdValue: 1000,  // $1K base - scales with progression
            speedBoost: 1.10,
            boostDuration: 120000, // 2 minutes
            cooldown: 300000 // 5 minute cooldown
        },
        'MEDIUM': {
            vulnerabilities: 4,
            timeLimit: 20000,
            codeLines: 16,
            lives: 8,
            baseUsdValue: 5000,  // $5K base - scales with progression
            speedBoost: 1.25,
            boostDuration: 120000, // 2 minutes
            cooldown: 900000 // 15 minute cooldown
        },
        'HARD': {
            vulnerabilities: 5,
            timeLimit: 12000,
            codeLines: 18,
            lives: 10,
            baseUsdValue: 20000,  // $20K base - scales with progression
            speedBoost: 1.50,
            boostDuration: 120000, // 2 minutes
            cooldown: 1800000 // 30 minute cooldown
        }
    };

    // Code templates for hacking minigame
    const codeTemplates = {
        'EASY': [
            `pragma solidity ^0.8.0;\ncontract Vault {\n    mapping(address => uint) balances;\n    \n    function withdraw(uint amount) public {\n        require(balances[msg.sender] > 0);        [V]\n        balances[msg.sender] -= amount;\n        (bool success, ) = msg.sender.call{value: amount}("");  [V]\n        require(success);\n    }\n    \n    function deposit() external payable {\n        balances[msg.sender] = msg.value;         [V]\n    }\n}`,
            `contract Token {\n    mapping(address => uint) public balances;\n    \n    function transfer(address to, uint amount) public {\n        balances[msg.sender] -= amount;           [V]\n        balances[to] += amount;                    [V]\n    }\n    \n    function mint(uint amount) public {\n        balances[msg.sender] += amount;            [V]\n    }\n}`,
        ],
        'MEDIUM': [
            `contract Auction {\n    address public highestBidder;\n    uint public highestBid;\n    \n    function bid() public payable {\n        require(msg.value > highestBid);\n        if (highestBidder != address(0)) {\n            payable(highestBidder).transfer(highestBid);  [V]\n        }\n        highestBidder = msg.sender;                [V]\n        highestBid = msg.value;                    [V]\n    }\n    \n    function claimPrize() public {\n        require(msg.sender == highestBidder);      [V]\n        payable(msg.sender).transfer(address(this).balance);\n    }\n}`,
            `contract Lottery {\n    address[] public players;\n    \n    function enter() public payable {\n        require(msg.value == 0.1 ether);           [V]\n        players.push(msg.sender);\n    }\n    \n    function random() private view returns (uint) {\n        return uint(keccak256(abi.encodePacked(block.timestamp)));  [V]\n    }\n    \n    function pickWinner() public {\n        uint index = random() % players.length;    [V]\n        payable(players[index]).transfer(address(this).balance);  [V]\n        delete players;                             [V]\n    }\n}`,
        ],
        'HARD': [
            `contract Exchange {\n    mapping(address => uint) public ethBalances;\n    mapping(address => uint) public tokenBalances;\n    uint public ethToTokenRate = 100;\n    \n    function depositEth() public payable {\n        ethBalances[msg.sender] += msg.value;      [V]\n    }\n    \n    function swapEthForTokens(uint ethAmount) public {\n        require(ethBalances[msg.sender] >= ethAmount);\n        uint tokens = ethAmount * ethToTokenRate;   [V]\n        ethBalances[msg.sender] -= ethAmount;       [V]\n        tokenBalances[msg.sender] += tokens;        [V]\n        (bool success, ) = msg.sender.call{value: ethAmount}("");  [V]\n        require(success);\n    }\n    \n    function updateRate(uint newRate) public {\n        ethToTokenRate = newRate;                   [V]\n    }\n}`,
        ]
    };

    // Whack-A-Block Minigame Configuration
    const whackDifficultyConfig = {
        'EASY': {
            timeLimit: 30000,
            lives: 5,
            spawnRate: 1200, // milliseconds between block spawns
            blockVisibility: 1200, // milliseconds block stays visible
            baseUsdValue: 500,  // $500 base - scales with progression
            cooldown: 180000 // 3 minute cooldown
        },
        'MEDIUM': {
            timeLimit: 30000,
            lives: 4,
            spawnRate: 700, // milliseconds between block spawns
            blockVisibility: 800, // milliseconds block stays visible
            baseUsdValue: 2000,  // $2K base - scales with progression
            cooldown: 600000 // 10 minute cooldown
        },
        'HARD': {
            timeLimit: 30000,
            lives: 3,
            spawnRate: 400, // milliseconds between block spawns
            blockVisibility: 500, // milliseconds block stays visible
            baseUsdValue: 5000,  // $5K base - scales with progression
            cooldown: 1200000 // 20 minute cooldown
        }
    };

    function generateVulnerableCode(difficulty) {
        const templates = codeTemplates[difficulty];
        const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
        const lines = selectedTemplate.split('\n');

        // Find vulnerable lines (marked with [V])
        const vulnerableIndices = [];
        lines.forEach((line, index) => {
            if (line.includes('[V]')) {
                vulnerableIndices.push(index);
                // Clean the marker from display
                lines[index] = line.replace('[V]', '').trim();
            }
        });

        return { lines, vulnerableIndices };
    }

    function initHackingMinigame(difficulty) {
        // Check difficulty-specific unlock requirements
        let requiredEarnings = 0;
        let difficultyName = '';

        if (difficulty === 'EASY') {
            requiredEarnings = 10000;
            difficultyName = 'EASY';
        } else if (difficulty === 'MEDIUM') {
            requiredEarnings = 50000;
            difficultyName = 'MEDIUM';
        } else if (difficulty === 'HARD') {
            requiredEarnings = 100000;
            difficultyName = 'HARD';
        }

        if (lifetimeEarnings < requiredEarnings) {
            alert(`🔒 ${difficultyName} Difficulty Locked!\n\nRequires $${requiredEarnings.toLocaleString()} lifetime earnings to unlock.\n\nCurrent: $${lifetimeEarnings.toFixed(2)}`);
            return;
        }

        // Check cooldown
        const now = Date.now();
        const cooldownEnd = hackingCooldowns[difficulty] || 0;

        if (now < cooldownEnd) {
            const remainingSeconds = Math.ceil((cooldownEnd - now) / 1000);
            alert(`⏱️ ${difficulty} difficulty is on cooldown!\n\nTry again in ${remainingSeconds} seconds.`);
            return;
        }

        hackingGameDifficulty = difficulty;
        hackingGameActive = true;
        const config = hackingDifficultyConfig[difficulty];
        hackingGameTimeLimit = config.timeLimit;
        hackingGameStartTime = Date.now();

        const { lines, vulnerableIndices } = generateVulnerableCode(difficulty);
        hackingVulnerabilitiesToFind = vulnerableIndices.slice(0, config.vulnerabilities);
        hackingVulnerabilitiesFound = [];

        // Set lives from config
        hackingMaxLives = config.lives;
        hackingLivesRemaining = hackingMaxLives;

        // Hide notification if visible
        const notification = document.getElementById('hacking-notification');
        if (notification) notification.style.display = 'none';

        // Show modal
        const modal = document.getElementById('hacking-modal');
        if (!modal) return;

        modal.style.display = 'flex';

        // Update modal content
        document.getElementById('hacking-difficulty-display').textContent = difficulty;
        document.getElementById('hacking-found-count').textContent = `0/${config.vulnerabilities}`;
        document.getElementById('hacking-lives-display').textContent = `❤️ ${hackingLivesRemaining}/${hackingMaxLives}`;

        // Display code
        const codeContainer = document.getElementById('hacking-code-container');
        codeContainer.innerHTML = '';
        lines.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'hacking-code-line';
            lineDiv.textContent = `${String(index + 1).padStart(2, ' ')} | ${line}`;
            lineDiv.setAttribute('data-line-index', index);

            // All lines are clickable (even non-vulnerable ones)
            lineDiv.style.cursor = 'pointer';
            lineDiv.onclick = () => checkHackingVulnerability(index);

            codeContainer.appendChild(lineDiv);
        });

        // Start timer update
        updateHackingTimer();
    }

    function checkHackingVulnerability(lineIndex) {
        if (!hackingGameActive) return;
        if (hackingVulnerabilitiesFound.includes(lineIndex)) return;

        const lineElement = document.querySelector(`[data-line-index="${lineIndex}"]`);

        if (hackingVulnerabilitiesToFind.includes(lineIndex)) {
            // Correct vulnerability found
            hackingVulnerabilitiesFound.push(lineIndex);
            lineElement.classList.add('vulnerability-found');
            lineElement.style.background = 'rgba(0, 255, 136, 0.3)';
            lineElement.style.border = '1px solid #00ff88';

            const config = hackingDifficultyConfig[hackingGameDifficulty];
            document.getElementById('hacking-found-count').textContent =
                `${hackingVulnerabilitiesFound.length}/${config.vulnerabilities}`;

            // Check if all found
            if (hackingVulnerabilitiesFound.length === config.vulnerabilities) {
                endHackingGame(true);
            }
        } else {
            // Wrong line clicked - lose a life!
            hackingLivesRemaining--;

            // Show red feedback
            lineElement.style.background = 'rgba(255, 51, 68, 0.6)';
            lineElement.style.border = '2px solid #ff3344';
            setTimeout(() => {
                lineElement.style.background = '';
                lineElement.style.border = '';
            }, 500);

            // Shake the modal!
            const modal = document.getElementById('hacking-modal');
            const modalContent = modal.querySelector('div');
            modalContent.classList.add('modal-shake');
            setTimeout(() => {
                modalContent.classList.remove('modal-shake');
            }, 500);

            // Update lives display
            document.getElementById('hacking-lives-display').textContent = `❤️ ${hackingLivesRemaining}/${hackingMaxLives}`;

            // Check if game over
            if (hackingLivesRemaining <= 0) {
                endHackingGame(false);
            }
        }
    }

    function updateHackingTimer() {
        if (!hackingGameActive) return;

        const elapsed = Date.now() - hackingGameStartTime;
        const remaining = Math.max(0, hackingGameTimeLimit - elapsed);
        const seconds = Math.ceil(remaining / 1000);

        const timerEl = document.getElementById('hacking-timer');
        if (timerEl) {
            timerEl.textContent = `${seconds}s`;

            // Change color based on time
            if (seconds <= 3) {
                timerEl.style.color = '#ff3344';
            } else if (seconds <= 5) {
                timerEl.style.color = '#ff9500';
            } else {
                timerEl.style.color = '#00ff88';
            }
        }

        if (remaining <= 0) {
            endHackingGame(false);
        } else {
            setTimeout(updateHackingTimer, 100);
        }
    }

    function endHackingGame(won) {
        hackingGameActive = false;
        hackingGamesPlayed++;

        const modal = document.getElementById('hacking-modal');
        const config = hackingDifficultyConfig[hackingGameDifficulty];

        // Set cooldown for this difficulty
        hackingCooldowns[hackingGameDifficulty] = Date.now() + config.cooldown;

        if (won) {
            hackingGamesWon++;
            hackingConsecutiveWins++;

            // Calculate multipliers
            const completionTime = Date.now() - hackingGameStartTime;
            const timeBonus = Math.max(1, 1.5 - (completionTime / hackingGameTimeLimit));
            const consecutiveMultiplier = 1 + (Math.min(hackingConsecutiveWins, 5) * 0.1);
            const finalMultiplier = timeBonus * consecutiveMultiplier;

            // Award rewards and get the amounts
            const rewards = awardHackingRewards(hackingGameDifficulty, finalMultiplier);

            // Apply speed boost - ADDITIVE stacking
            if (speedBoostActive) {
                // Add the boost percentage (e.g., 1.10 - 1 = 0.10, so add 10%)
                const currentBonus = speedBoostMultiplier - 1;
                const newBonus = config.speedBoost - 1;
                speedBoostMultiplier = 1 + currentBonus + newBonus;
                // Extend the duration (take the longer of current remaining time or new duration)
                const remainingTime = Math.max(0, speedBoostEndTime - Date.now());
                speedBoostEndTime = Date.now() + Math.max(remainingTime, config.boostDuration);
                console.log(`⚡ Speed boost STACKED: +${((speedBoostMultiplier - 1) * 100).toFixed(0)}% for ${Math.ceil((speedBoostEndTime - Date.now())/60000)} minutes`);
            } else {
                // New boost
                speedBoostMultiplier = config.speedBoost;
                speedBoostEndTime = Date.now() + config.boostDuration;
                speedBoostActive = true;
                console.log(`⚡ Speed boost activated: +${((speedBoostMultiplier - 1) * 100).toFixed(0)}% for ${config.boostDuration/60000} minutes`);
            }

            // Show success message with actual rewards
            const result = document.getElementById('hacking-result-message');
            if (result) {
                // Format crypto amounts
                const formatCrypto = (amount, decimals = 4) => {
                    if (amount >= 1) return amount.toFixed(decimals);
                    return amount.toFixed(8);
                };

                // Calculate speed boost percentage (subtract 1 and convert to %)
                const speedBoostPercent = ((speedBoostMultiplier - 1) * 100).toFixed(0);
                const boostMinutesRemaining = Math.ceil((speedBoostEndTime - Date.now()) / 60000);

                result.innerHTML = `<span style="color: #00ff88; font-size: 1.5rem;">✓ VULNERABILITIES PATCHED!</span><br>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="color: #f7931a; font-weight: 700; margin-bottom: 5px;">Rewards Earned:</div>
                        <div style="color: #fff; font-size: 0.9rem;">
                            ₿ ${formatCrypto(rewards.btc)} BTC<br>
                            Ξ ${formatCrypto(rewards.eth)} ETH<br>
                            Ð ${formatCrypto(rewards.doge)} DOGE<br>
                            💵 $${rewards.usd.toFixed(2)}
                        </div>
                    </div>
                    <div style="margin-top: 10px; color: #00ff88; font-weight: 700;">
                        ⚡ Speed Boost: +${speedBoostPercent}% for ${boostMinutesRemaining}m
                    </div>`;
            }

            // Check achievements
            if (typeof checkAchievements === 'function') {
                checkAchievements();
            }
        } else {
            hackingConsecutiveWins = 0;

            const result = document.getElementById('hacking-result-message');
            if (result) {
                result.innerHTML = `<span style="color: #ff3344; font-size: 1.5rem;">✗ TIME EXPIRED</span><br>
                    <span style="color: #888;">Better luck next time!</span>`;
            }
        }

        // Update stats
        updateHackingStats();

        // Hide code, show result
        document.getElementById('hacking-code-container').style.display = 'none';
        document.getElementById('hacking-result-message').style.display = 'block';
        document.getElementById('hacking-close-btn').style.display = 'block';

        // Schedule next notification
        scheduleHackingNotification();

        saveGame();
    }

    function awardHackingRewards(difficulty, multiplier) {
        const config = hackingDifficultyConfig[difficulty];

        // Get current rugpull/ascension level (defined in rugpull.js)
        const rugpullLevel = (typeof ascensionLevel !== 'undefined') ? ascensionLevel : 0;

        // Define crypto price multiplier ranges per difficulty
        // EASY: 0.1x - 0.5x of total crypto prices
        // MEDIUM: 0.5x - 1x of total crypto prices
        // HARD: 1x - 2x of total crypto prices
        let minMultiplier, maxMultiplier;
        if (difficulty === 'HARD') {
            minMultiplier = 1.0;
            maxMultiplier = 2.0;
        } else if (difficulty === 'MEDIUM') {
            minMultiplier = 0.5;
            maxMultiplier = 1.0;
        } else { // EASY
            minMultiplier = 0.1;
            maxMultiplier = 0.5;
        }

        // Random multiplier within the range
        const cryptoPriceMultiplier = minMultiplier + (Math.random() * (maxMultiplier - minMultiplier));

        // Calculate total crypto prices (BTC + ETH + DOGE)
        const totalCryptoPrices = btcPrice + ethPrice + dogePrice;

        // Calculate base USD value from crypto prices
        let baseUsdValue = totalCryptoPrices * cryptoPriceMultiplier;

        // Time bonus and consecutive wins bonus (already in multiplier parameter)
        const totalMultiplier = multiplier;

        // POWERFUL Rugpull multiplier: 10x per rugpull level
        // Rugpull 1 = 10x, Rugpull 2 = 20x, Rugpull 5 = 50x
        const ascensionMultiplier = rugpullLevel > 0 ? (rugpullLevel * 10) : 1;

        // Calculate total USD value after all multipliers
        const totalUsdValue = baseUsdValue * totalMultiplier * ascensionMultiplier;

        // Award BTC (40% of total USD value, converted to BTC at current price)
        const btcUsdValue = totalUsdValue * 0.40;
        const btcReward = btcUsdValue / btcPrice;
        btcBalance += btcReward;
        btcLifetime += btcReward;

        // Award ETH (35% of total USD value, converted to ETH at current price)
        const ethUsdValue = totalUsdValue * 0.35;
        const ethReward = ethUsdValue / ethPrice;
        ethBalance += ethReward;
        ethLifetime += ethReward;

        // Award DOGE (20% of total USD value, converted to DOGE at current price)
        const dogeUsdValue = totalUsdValue * 0.20;
        const dogeReward = dogeUsdValue / dogePrice;
        dogeBalance += dogeReward;
        dogeLifetime += dogeReward;

        // Award USD (5% as direct cash)
        const usdReward = totalUsdValue * 0.05;
        dollarBalance += usdReward;

        // Track total rewards
        hackingTotalRewardsEarned += totalUsdValue;
        lifetimeEarnings += totalUsdValue;
        sessionEarnings += totalUsdValue;

        // Return the rewards for display
        return {
            btc: btcReward,
            eth: ethReward,
            doge: dogeReward,
            usd: usdReward,
            totalUsd: totalUsdValue
        };
    }

    function getHackingSpeedBoost() {
        if (!speedBoostActive) return 1.0;

        const now = Date.now();
        if (now >= speedBoostEndTime) {
            speedBoostActive = false;
            speedBoostMultiplier = 1.0;
            return 1.0;
        }

        return speedBoostMultiplier;
    }

    function scheduleHackingNotification() {
        // Schedule next notification in 30-60 minutes
        const delay = (30 + Math.random() * 30) * 60 * 1000;
        hackingNextNotificationTime = Date.now() + delay;
    }

    function displayHackingNotification() {
        const notification = document.getElementById('hacking-notification');
        if (!notification) return;

        notification.style.display = 'flex';
    }

    function closeHackingModal() {
        const modal = document.getElementById('hacking-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Reset modal state
        document.getElementById('hacking-code-container').style.display = 'block';
        document.getElementById('hacking-result-message').style.display = 'none';
        document.getElementById('hacking-close-btn').style.display = 'none';
    }

    function dismissHackingNotification() {
        const notification = document.getElementById('hacking-notification');
        if (notification) {
            notification.style.display = 'none';
        }

        // Schedule next notification
        scheduleHackingNotification();
    }

    function updateHackingStats() {
        const statsContainer = document.getElementById('hacking-stats-content');
        if (!statsContainer) return;

        const winRate = hackingGamesPlayed > 0 ? ((hackingGamesWon / hackingGamesPlayed) * 100).toFixed(1) : '0.0';

        // Abbreviate total rewards
        let rewardsDisplay = '';
        if (hackingTotalRewardsEarned >= 1e12) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e12).toFixed(2) + 'T';
        } else if (hackingTotalRewardsEarned >= 1e9) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e9).toFixed(2) + 'B';
        } else if (hackingTotalRewardsEarned >= 1e6) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e6).toFixed(2) + 'M';
        } else if (hackingTotalRewardsEarned >= 1e3) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e3).toFixed(2) + 'K';
        } else {
            rewardsDisplay = '$' + hackingTotalRewardsEarned.toFixed(2);
        }

        statsContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Games Played:</span>
                <span style="color: #fff; font-weight: 700; margin-left: 10px;">${hackingGamesPlayed}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Win Rate:</span>
                <span style="color: #00ff88; font-weight: 700; margin-left: 10px;">${winRate}%</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Consecutive Wins:</span>
                <span style="color: #f7931a; font-weight: 700; margin-left: 10px;">${hackingConsecutiveWins}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Total Rewards:</span>
                <span style="color: #fff; font-weight: 700; margin-left: 10px;">${rewardsDisplay}</span>
            </div>
            ${speedBoostActive ? `
            <div style="margin-top: 15px; padding: 10px; background: rgba(0, 255, 136, 0.1); border: 1px solid #00ff88; border-radius: 6px;">
                <div style="color: #00ff88; font-weight: 700; margin-bottom: 5px;">⚡ ACTIVE SPEED BOOST</div>
                <div style="color: #fff; font-size: 0.9rem;">+${((speedBoostMultiplier - 1) * 100).toFixed(0)}% Mining Speed</div>
                <div style="color: #888; font-size: 0.8rem;">${Math.ceil((speedBoostEndTime - Date.now()) / 60000)} minutes remaining</div>
            </div>
            ` : ''}
        `;
    }

    function updateWhackStats() {
        // Update whack-a-block stats in the UI
        const gamesPlayedEl = document.getElementById('whack-games-played');
        if (gamesPlayedEl) gamesPlayedEl.textContent = whackGameGamesPlayed;

        const gamesWonEl = document.getElementById('whack-games-won');
        if (gamesWonEl) gamesWonEl.textContent = whackGameGamesWon;

        // Abbreviate total rewards
        let rewardsDisplay = '';
        if (whackGameTotalRewardsEarned >= 1e12) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e12).toFixed(2) + 'T';
        } else if (whackGameTotalRewardsEarned >= 1e9) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e9).toFixed(2) + 'B';
        } else if (whackGameTotalRewardsEarned >= 1e6) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e6).toFixed(2) + 'M';
        } else if (whackGameTotalRewardsEarned >= 1e3) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e3).toFixed(2) + 'K';
        } else {
            rewardsDisplay = '$' + whackGameTotalRewardsEarned.toFixed(2);
        }

        const totalRewardsEl = document.getElementById('whack-total-rewards');
        if (totalRewardsEl) totalRewardsEl.textContent = rewardsDisplay.slice(1); // Remove $ from display
    }

    function updateMinigamesTab() {
        // Update minigames hub stats display

        // Hacking stats
        const hackingWonEl = document.getElementById('hacking-games-won-display');
        if (hackingWonEl) hackingWonEl.textContent = hackingGamesWon;

        const hackingPlayedEl = document.getElementById('hacking-games-played-display');
        if (hackingPlayedEl) hackingPlayedEl.textContent = hackingGamesPlayed;

        const hackingRewardsEl = document.getElementById('hacking-rewards-display');
        if (hackingRewardsEl) {
            let hackingRewardsDisplay = '';
            if (hackingTotalRewardsEarned >= 1e6) {
                hackingRewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e6).toFixed(2) + 'M';
            } else if (hackingTotalRewardsEarned >= 1e3) {
                hackingRewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e3).toFixed(2) + 'K';
            } else {
                hackingRewardsDisplay = '$' + hackingTotalRewardsEarned.toFixed(0);
            }
            hackingRewardsEl.textContent = hackingRewardsDisplay;
        }

        // Whack stats
        const whackWonEl = document.getElementById('whack-games-won-display');
        if (whackWonEl) whackWonEl.textContent = whackGameGamesWon;

        const whackPlayedEl = document.getElementById('whack-games-played-display');
        if (whackPlayedEl) whackPlayedEl.textContent = whackGameGamesPlayed;

        const whackRewardsEl = document.getElementById('whack-rewards-display');
        if (whackRewardsEl) {
            let whackRewardsDisplay = '';
            if (whackGameTotalRewardsEarned >= 1e6) {
                whackRewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e6).toFixed(2) + 'M';
            } else if (whackGameTotalRewardsEarned >= 1e3) {
                whackRewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e3).toFixed(2) + 'K';
            } else {
                whackRewardsDisplay = '$' + whackGameTotalRewardsEarned.toFixed(0);
            }
            whackRewardsEl.textContent = whackRewardsDisplay;
        }
    }

    function updateHackingCooldownDisplays() {
        const now = Date.now();

        // Unlock requirements for each difficulty
        const unlockRequirements = {
            'EASY': 10000,
            'MEDIUM': 50000,
            'HARD': 100000
        };

        // Update each difficulty button's cooldown overlay
        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            const cooldownEnd = hackingCooldowns[difficulty] || 0;
            const cooldownElement = document.getElementById(`hacking-${difficulty.toLowerCase()}-cooldown`);
            const lockedElement = document.getElementById(`hacking-${difficulty.toLowerCase()}-locked`);
            const buttonElement = document.getElementById(`hacking-${difficulty.toLowerCase()}-btn`);

            if (!cooldownElement || !buttonElement || !lockedElement) return;

            // Check if difficulty is locked
            const isLocked = lifetimeEarnings < (unlockRequirements[difficulty] || 0);
            const isOnCooldown = now < cooldownEnd && !isLocked;

            // Update locked state
            if (isLocked) {
                lockedElement.style.display = 'flex';
                lockedElement.innerHTML = `🔒<br>$${(unlockRequirements[difficulty] || 0).toLocaleString()}`;
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'not-allowed';
                buttonElement.style.pointerEvents = 'none';
                buttonElement.dataset.locked = 'true';
            } else if (isOnCooldown) {
                lockedElement.style.display = 'none';
                cooldownElement.style.removeProperty('display');
                cooldownElement.style.setProperty('display', 'flex', 'important');
                buttonElement.style.cursor = 'not-allowed';
                buttonElement.style.pointerEvents = 'none';
                buttonElement.style.opacity = '0.6';
                buttonElement.dataset.locked = 'false';
                // Update timer
                const remainingMs = cooldownEnd - now;
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                cooldownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                // Button is active and clickable
                lockedElement.style.display = 'none';
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.style.opacity = '1';
                buttonElement.dataset.locked = 'false';
            }
        });

        // Update whack-a-block cooldowns
        const now2 = Date.now();

        // Unlock requirements for whack-a-block
        const whackUnlockRequirements = {
            'EASY': 5000,
            'MEDIUM': 25000,
            'HARD': 75000
        };

        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            const cooldownEnd = whackCooldowns[difficulty] || 0;
            const cooldownElement = document.getElementById(`whack-${difficulty.toLowerCase()}-cooldown`);
            const lockedElement = document.getElementById(`whack-${difficulty.toLowerCase()}-locked`);
            const buttonElement = document.getElementById(`whack-${difficulty.toLowerCase()}-btn`);

            if (!cooldownElement || !buttonElement || !lockedElement) return;

            // Check if difficulty is locked
            const isLocked = lifetimeEarnings < (whackUnlockRequirements[difficulty] || 0);
            const isOnCooldown = now2 < cooldownEnd && !isLocked;

            // Update locked state
            if (isLocked) {
                lockedElement.style.display = 'flex';
                lockedElement.innerHTML = `🔒<br>$${(whackUnlockRequirements[difficulty] || 0).toLocaleString()}`;
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'not-allowed';
                buttonElement.style.pointerEvents = 'none';
                buttonElement.dataset.locked = 'true';
            } else if (isOnCooldown) {
                lockedElement.style.display = 'none';
                cooldownElement.style.removeProperty('display');
                cooldownElement.style.setProperty('display', 'flex', 'important');
                buttonElement.style.cursor = 'not-allowed';
                buttonElement.style.pointerEvents = 'none';
                buttonElement.style.opacity = '0.6';
                buttonElement.dataset.locked = 'false';
                // Update timer
                const remainingMs = cooldownEnd - now2;
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                cooldownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                // Button is active and clickable
                lockedElement.style.display = 'none';
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.style.opacity = '1';
                buttonElement.dataset.locked = 'false';
            }
        });
    }

    function updateMinigameCardLocks() {
        // Check if hacking minigame is locked (Easy requires $10k)
        const hackingLockedCard = document.getElementById('hacking-card-locked');
        if (hackingLockedCard) {
            if (lifetimeEarnings < 10000) {
                hackingLockedCard.style.display = 'flex';
            } else {
                hackingLockedCard.style.display = 'none';
            }
        }

        // Check if whack-a-block minigame is locked (Easy requires $5k)
        const whackLockedCard = document.getElementById('whack-card-locked');
        if (whackLockedCard) {
            if (lifetimeEarnings < 5000) {
                whackLockedCard.style.display = 'flex';
            } else {
                whackLockedCard.style.display = 'none';
            }
        }
    }

    // ============== END HACKING MINIGAME FUNCTIONS ==============

    // ============== WHACK-A-BLOCK MINIGAME FUNCTIONS ==============

    function initWhackMinigame(difficulty) {
        // Check difficulty-specific unlock requirements
        let requiredEarnings = 0;
        let difficultyName = '';

        if (difficulty === 'EASY') {
            requiredEarnings = 5000;
            difficultyName = 'EASY';
        } else if (difficulty === 'MEDIUM') {
            requiredEarnings = 25000;
            difficultyName = 'MEDIUM';
        } else if (difficulty === 'HARD') {
            requiredEarnings = 75000;
            difficultyName = 'HARD';
        }

        if (lifetimeEarnings < requiredEarnings) {
            alert(`🔒 ${difficultyName} Difficulty Locked!\n\nRequires $${requiredEarnings.toLocaleString()} lifetime earnings to unlock.\n\nCurrent: $${lifetimeEarnings.toFixed(2)}`);
            return;
        }

        // Check cooldown
        const now = Date.now();
        const cooldownEnd = whackCooldowns[difficulty] || 0;

        if (now < cooldownEnd) {
            const remainingSeconds = Math.ceil((cooldownEnd - now) / 1000);
            alert(`⏱️ ${difficulty} difficulty is on cooldown!\n\nTry again in ${remainingSeconds} seconds.`);
            return;
        }

        whackGameDifficulty = difficulty;
        whackGameActive = true;
        const config = whackDifficultyConfig[difficulty];
        whackGameTimeLimit = config.timeLimit;
        whackGameStartTime = Date.now();
        whackGameScore = 0;
        whackGameBlocksHit = 0;
        whackGameMaxLives = config.lives;
        whackGameLivesRemaining = whackGameMaxLives;
        whackActiveBlock = null;

        // Show modal
        const modal = document.getElementById('whack-modal');
        if (!modal) return;

        modal.style.display = 'flex';

        // Update modal content
        document.getElementById('whack-difficulty-display').textContent = difficulty;
        document.getElementById('whack-lives-display').textContent = `❤️ ${whackGameLivesRemaining}/${whackGameMaxLives}`;
        document.getElementById('whack-score-display').textContent = '0';
        document.getElementById('whack-time-display').textContent = '30s';

        // Create grid
        const gridContainer = document.getElementById('whack-grid');
        gridContainer.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const block = document.createElement('div');
            block.className = 'whack-block';
            block.setAttribute('data-block-id', i);
            block.onclick = () => hitBlock(i);
            gridContainer.appendChild(block);
        }

        // Start game
        whackStartGame(config);
    }

    function whackStartGame(config) {
        // Start spawning blocks
        whackSpawnBlock(config.spawnRate);

        // Update timer every 100ms
        whackGameInterval = setInterval(() => {
            const elapsed = Date.now() - whackGameStartTime;
            const remaining = Math.max(0, whackGameTimeLimit - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            const timeDisplay = document.getElementById('whack-time-display');
            if (timeDisplay) timeDisplay.textContent = seconds + 's';

            if (remaining <= 0) {
                endWhackGame(false);
            }
        }, 100);
    }

    function whackSpawnBlock(spawnRate) {
        const config = whackDifficultyConfig[whackGameDifficulty];
        const blockVisibility = config.blockVisibility || 800;

        whackSpawnInterval = setInterval(() => {
            if (!whackGameActive) return;

            // Only spawn if no block is currently active
            if (whackActiveBlock === null) {
                const blockId = Math.floor(Math.random() * 16);
                const block = document.querySelector(`[data-block-id="${blockId}"]`);
                if (block) {
                    whackActiveBlock = blockId;
                    block.classList.add('active');

                    // Auto-miss after blockVisibility time if not clicked
                    setTimeout(() => {
                        if (whackActiveBlock === blockId) {
                            missBlock();
                        }
                    }, blockVisibility);
                }
            }
        }, spawnRate);
    }

    function hitBlock(blockId) {
        if (!whackGameActive) return;

        // Only award points if this is the active block
        if (whackActiveBlock === blockId) {
            whackGameScore += 10;
            whackGameBlocksHit++;

            const block = document.querySelector(`[data-block-id="${blockId}"]`);
            if (block) {
                block.classList.remove('active');
                block.classList.add('hit');
                setTimeout(() => block.classList.remove('hit'), 200);
            }

            whackActiveBlock = null;

            // Update display
            const scoreDisplay = document.getElementById('whack-score-display');
            if (scoreDisplay) scoreDisplay.textContent = whackGameScore;

            // Play hit sound
            playClickSound();
        } else {
            // Clicked wrong block - trigger red flash and miss
            const grid = document.getElementById('whack-grid');
            if (grid) {
                grid.classList.add('whack-error-flash');
                setTimeout(() => grid.classList.remove('whack-error-flash'), 300);
            }
            missBlock();
        }
    }

    function missBlock() {
        if (!whackGameActive) return;

        // Clear active block visually
        if (whackActiveBlock !== null) {
            const block = document.querySelector(`[data-block-id="${whackActiveBlock}"]`);
            if (block) {
                block.classList.remove('active');
            }
            whackActiveBlock = null;
        }

        // Lose a life
        whackGameLivesRemaining--;
        const livesDisplay = document.getElementById('whack-lives-display');
        if (livesDisplay) livesDisplay.textContent = `❤️ ${whackGameLivesRemaining}/${whackGameMaxLives}`;

        if (whackGameLivesRemaining <= 0) {
            endWhackGame(false);
        }
    }

    function endWhackGame(won) {
        whackGameActive = false;

        if (whackSpawnInterval) clearInterval(whackSpawnInterval);
        if (whackGameInterval) clearInterval(whackGameInterval);

        whackGameGamesPlayed++;

        const config = whackDifficultyConfig[whackGameDifficulty];
        let totalReward = 0;

        // Only award rewards if player didn't lose all lives
        if (whackGameLivesRemaining > 0) {
            whackGameGamesWon++;

            const baseReward = config.baseUsdValue;

            // Calculate score bonus multiplier (1.0 - 2.0x based on score)
            const scoreMultiplier = Math.min(2.0, 1.0 + (whackGameScore / 100) * 0.5);

            // Time bonus multiplier (0.8 - 1.5x based on speed)
            const elapsed = Date.now() - whackGameStartTime;
            const timeRatio = elapsed / whackGameTimeLimit;
            const timeMultiplier = timeRatio < 0.5 ? 1.5 : Math.max(0.8, 2.0 - (timeRatio * 2));

            // Calculate total reward
            totalReward = baseReward * scoreMultiplier * timeMultiplier;
            dollarBalance += totalReward;
            whackGameTotalRewardsEarned += totalReward;
        }

        // Set cooldown
        whackCooldowns[whackGameDifficulty] = Date.now() + config.cooldown;

        // Show results modal
        setTimeout(() => {
            // Hide game modal
            const gameModal = document.getElementById('whack-modal');
            if (gameModal) gameModal.style.display = 'none';

            // Update results modal
            const resultsModal = document.getElementById('whack-results-modal');
            if (resultsModal) {
                // Update content
                const titleEl = document.getElementById('whack-results-title');
                if (titleEl) {
                    titleEl.textContent = whackGameLivesRemaining > 0 ? '✅ SUCCESS!' : '❌ GAME OVER';
                    titleEl.style.color = whackGameLivesRemaining > 0 ? '#00ff88' : '#ff3344';
                }

                document.getElementById('whack-results-score').textContent = whackGameScore;
                document.getElementById('whack-results-blocks').textContent = whackGameBlocksHit;
                document.getElementById('whack-results-lives').textContent = `${Math.max(0, whackGameLivesRemaining)}/${whackGameMaxLives}`;
                document.getElementById('whack-results-reward').textContent = totalReward.toFixed(2);

                // Show modal
                resultsModal.style.display = 'flex';
            }

            updateUI();
        }, 300);
    }

    function closeWhackResultsModal() {
        const modal = document.getElementById('whack-results-modal');
        if (modal) modal.style.display = 'none';
    }

    // ============== END WHACK-A-BLOCK MINIGAME FUNCTIONS ==============

    function updatePowerDisplay() {
        const powerUsedEl = document.getElementById('power-used');
        if (powerUsedEl) {
            const availableWithBonus = getTotalPowerAvailableWithBonus();
            powerUsedEl.innerText = totalPowerUsed.toLocaleString() + 'W / ' + availableWithBonus.toLocaleString() + 'W';

            // Dynamic color for power text based on usage
            const percentage = availableWithBonus > 0 ? (totalPowerUsed / availableWithBonus * 100) : 0;
            if (percentage > 100) {
                powerUsedEl.style.color = '#ff3344'; // Red - over capacity
            } else if (percentage > 80) {
                powerUsedEl.style.color = '#ff9500'; // Orange - critical
            } else if (percentage > 60) {
                powerUsedEl.style.color = '#ffdd00'; // Yellow - warning
            } else {
                powerUsedEl.style.color = '#00ff88'; // Green - safe
            }
        }

        const powerBarFill = document.getElementById('power-bar-fill');
        if (powerBarFill) {
            const availableWithBonus = getTotalPowerAvailableWithBonus();
            const percentage = availableWithBonus > 0 ? (totalPowerUsed / availableWithBonus * 100) : 0;
            powerBarFill.style.width = Math.min(percentage, 100) + '%';

            // Dynamic color for power bar based on usage
            if (percentage > 100) {
                powerBarFill.style.background = '#ff3344'; // Red - over capacity
            } else if (percentage > 80) {
                powerBarFill.style.background = '#ff9500'; // Orange - critical
            } else if (percentage > 60) {
                powerBarFill.style.background = '#ffdd00'; // Yellow - warning
            } else {
                powerBarFill.style.background = '#00ff88'; // Green - safe
            }
        }

        // Update power upgrades display
        powerUpgrades.forEach(u => {
            const costUsd = u.currentUsd;
            const lvlEl = document.getElementById(`pow-lvl-txt-${u.id}`);
            if (lvlEl) lvlEl.innerText = `[Lvl ${u.level}]`;

            const currentPowerEl = document.getElementById(`pow-current-${u.id}`);
            if (currentPowerEl) currentPowerEl.innerText = `+${formatPower(u.currentPower)} - Current Power`;

            const powerEl = document.getElementById(`pow-power-${u.id}`);
            if (powerEl) powerEl.innerText = `+${formatPower(u.basePower)} Produced per level`;

            const usdEl = document.getElementById(`pow-usd-${u.id}`);
            if (usdEl) usdEl.innerText = `$${formatNumberForDisplay(u.currentUsd)}`;

            // Calculate how many power upgrades can be afforded (accounting for price increases)
            const affordEl = document.getElementById(`pow-afford-${u.id}`);
            if (affordEl) {
                let remaining = dollarBalance;
                let canAfford = 0;
                let nextCost = costUsd;
                let nextLevel = u.level;

                while (remaining >= nextCost) {
                    remaining -= nextCost;
                    canAfford++;
                    nextLevel++;
                    // Power upgrades: 1.2x multiplier
                    nextCost = u.baseUsd * Math.pow(1.2, nextLevel);
                }

                affordEl.innerText = `x${canAfford}`;
                affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
            }

            const btn = document.getElementById(`pow-${u.id}`);
            if (btn) btn.disabled = (dollarBalance < costUsd);
        });
    }

function updateAutoSellButtonUI() {
    const btn = document.getElementById('auto-sell-toggle-btn');
    const statusEl = document.getElementById('auto-sell-status');
    if (!btn || !statusEl) return;

    const metaUpgrades = typeof window.metaUpgrades !== 'undefined' ? window.metaUpgrades : null;
    const upgradeToggleState = typeof window.upgradeToggleState !== 'undefined' ? window.upgradeToggleState : null;

    const isPurchased = metaUpgrades && metaUpgrades.auto_sell_crypto && metaUpgrades.auto_sell_crypto.purchased;

    if (isPurchased) {
        const isEnabled = upgradeToggleState && upgradeToggleState.auto_sell === true;
        // Enable the button
        btn.disabled = false;
        btn.style.cursor = 'pointer';
        btn.style.background = isEnabled ? 'rgba(0,255,136,0.2)' : 'rgba(255,100,255,0.15)';
        btn.style.borderColor = isEnabled ? '#00ff88' : '#ff64ff';
        btn.style.color = isEnabled ? '#00ff88' : '#ff64ff';
        btn.innerHTML = (isEnabled ? '🟢' : '⭕') + ' Auto-Sell: <span id="auto-sell-status">' + (isEnabled ? 'ON' : 'OFF') + '</span>';
        btn.title = 'Click to toggle automatic crypto to USD conversion';
    } else {
        // Keep disabled
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
        btn.style.background = 'rgba(100,100,100,0.3)';
        btn.style.borderColor = '#666';
        btn.style.color = '#999';
        statusEl.innerText = 'LOCKED';
        btn.title = 'Purchase "Auto-Sell Crypto to USD" upgrade to enable';
    }
}

function toggleAutoSellButton() {
    // Check if upgrade is purchased
    const metaUpgrades = typeof window.metaUpgrades !== 'undefined' ? window.metaUpgrades : null;
    if (!metaUpgrades || !metaUpgrades.auto_sell_crypto || !metaUpgrades.auto_sell_crypto.purchased) {
        alert('Purchase the "Auto-Sell Crypto to USD" upgrade first!');
        return;
    }

    // Call the actual toggle function
    if (typeof toggleAutoSell === 'function') {
        toggleAutoSell();
        updateAutoSellButtonUI();
    }
}

function manualHash() {
    // Apply skill tree click bonus
    const clickBonus = (typeof getClickBonus === 'function') ? getClickBonus() : 1;

    // Apply ascension click multiplier (2x per ascension)
    const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (ascensionLevel * 2) : 1;

    const actualClickValue = btcClickValue * clickBonus * ascensionClickMultiplier;

    // Try auto-sell first (before adding to balance)
    const btcAutoSold = tryAutoSellCrypto('btc', actualClickValue);

    // If not auto-sold, add to balance
    if (!btcAutoSold) {
        btcBalance += actualClickValue;
    }

    // This ensures every manual click also increases your Lifetime Total
    btcLifetime += actualClickValue;

    // Track lifetime and session earnings in USD (including ascension multiplier)
    const usdValue = actualClickValue * btcPrice;
    lifetimeEarnings += usdValue;
    sessionEarnings += usdValue;

    // Track clicks for hashrate
    const now = Date.now();
    manualHashClickTime = now;
    manualHashCooldownEnd = now + 1000;
    clickTimestamps.push(now);
    if (clickTimestamps.length > 60) clickTimestamps.shift();

    // Play click sound
    playClickSound();

    // This refreshes the screen so you see the numbers go up
    updateUI();
}

function manualEthHash() {
    // Apply skill tree click bonus
    const clickBonus = (typeof getClickBonus === 'function') ? getClickBonus() : 1;
    // Apply ascension click multiplier (2x per ascension)
    const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (ascensionLevel * 2) : 1;
    const actualClickValue = ethClickValue * clickBonus * ascensionClickMultiplier;

    // Try auto-sell first (before adding to balance)
    const ethAutoSold = tryAutoSellCrypto('eth', actualClickValue);

    // If not auto-sold, add to balance
    if (!ethAutoSold) {
        ethBalance += actualClickValue;
    }
    ethLifetime += actualClickValue;

    // Track lifetime and session earnings in USD
    const usdValue = actualClickValue * ethPrice;
    lifetimeEarnings += usdValue;
    sessionEarnings += usdValue;

    // Track clicks for hashrate
    const now = Date.now();
    manualHashClickTime = now;
    manualHashCooldownEnd = now + 1000;
    clickTimestamps.push(now);
    if (clickTimestamps.length > 60) clickTimestamps.shift();

    // Play click sound
    playClickSound();

    // Refresh the screen
    updateUI();
}

function manualDogeHash() {
    // Apply skill tree click bonus
    const clickBonus = (typeof getClickBonus === 'function') ? getClickBonus() : 1;
    // Apply ascension click multiplier (2x per ascension)
    const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (ascensionLevel * 2) : 1;
    const actualClickValue = dogeClickValue * clickBonus * ascensionClickMultiplier;

    // Try auto-sell first (before adding to balance)
    const dogeAutoSold = tryAutoSellCrypto('doge', actualClickValue);

    // If not auto-sold, add to balance
    if (!dogeAutoSold) {
        dogeBalance += actualClickValue;
    }
    dogeLifetime += actualClickValue;

    // Track lifetime and session earnings in USD
    const usdValue = actualClickValue * dogePrice;
    lifetimeEarnings += usdValue;
    sessionEarnings += usdValue;

    // Track clicks for hashrate
    const now = Date.now();
    manualHashClickTime = now;
    manualHashCooldownEnd = now + 1000;
    clickTimestamps.push(now);
    if (clickTimestamps.length > 60) clickTimestamps.shift();

    // Play click sound
    playClickSound();

    // Refresh the screen
    updateUI();
}

function buyLevel(i) {
    const u = upgrades[i];
    const costBtc = u.currentUsd / btcPrice;

    if (btcBalance >= costBtc) {
        // Check power requirements
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + powerReq;
        const availablePower = getTotalPowerAvailableWithBonus();

        if (powerNeeded > availablePower && powerReq > 0) {
            alert(`Insufficient power! This upgrade requires ${powerReq.toLocaleString()}W per level.\nYou need ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power capacity.`);
            return;
        }

        btcBalance -= costBtc;
        hardwareEquity += u.currentUsd;
        u.level++;

        // Check if this is the Manual Hash upgrade
        if (u.id === 0 || u.isClickUpgrade) {
            // Increase click value by 10%
            btcClickValue *= 1.12;

            // FASTER PRICE SCALE: % increase per level
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));

            // Update the main orange button text to show new click value
            document.querySelector('.mine-btn span').innerText = `+${btcClickValue.toFixed(8)} ₿`;
        } else {
            // ALL OTHER MINERS: Standard 15% increase
            u.currentYield = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));
        }

        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        btcPerSec = upgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        updateUI();
        saveGame();

        // Play upgrade sound
        playUpgradeSound();
    }
}

function buyLevelMultiple(i, quantity) {
    const u = upgrades[i];
    const powerReq = equipmentPowerReqs[u.id] || 0;
    let purchased = 0;

    for (let q = 0; q < quantity; q++) {
        const costUsd = u.currentUsd;

        if (dollarBalance < costUsd) {
            break; // Not enough dollars
        }

        // Check power requirements
        if (powerReq > 0) {
            const powerNeeded = totalPowerUsed + powerReq;
            const availablePower = getTotalPowerAvailableWithBonus();
            if (powerNeeded > availablePower) {
                break; // Not enough power
            }
        }

        dollarBalance -= costUsd;
        hardwareEquity += u.currentUsd;
        u.level++;

        // Update price and yield based on upgrade type
        if (u.id === 0 || u.isClickUpgrade) {
            btcClickValue *= 1.12;
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));
        } else {
            u.currentYield = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));
        }

        purchased++;
        calculateTotalPowerUsed();
    }

    if (purchased > 0) {
        if (u.id === 0 || u.isClickUpgrade) {
            document.querySelector('.mine-btn span').innerText = `+${btcClickValue.toFixed(8)} ₿`;
        }
        btcPerSec = upgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);

        // Track USB Miner purchase for tutorial
        if (u.id === 1 && typeof trackUSBMinerPurchase === 'function') {
            trackUSBMinerPurchase();
        }

        updateUI();
        saveGame();
        playUpgradeSound();
    }
}

function buyBoost(i) {
    const u = upgrades[i];

    // Check if upgrade level is 0 (not purchased yet)
    if (u.level === 0) {
        return; // Cannot boost if upgrade hasn't been purchased
    }

    const costUsd = u.boostCost;

    if (dollarBalance >= costUsd) {
        dollarBalance -= costUsd;
        hardwareEquity += u.boostCost;
        u.boostLevel++;

        // Increase yield by 10% permanently
        u.currentYield *= 1.10;

        // Double the boost cost for next purchase
        u.boostCost *= 2;

        btcPerSec = upgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
        updateUI();
        saveGame();

        // Play upgrade sound
        playUpgradeSound();
    }
}

function buyEthBoost(i) {
    const u = ethUpgrades[i];

    // Check if upgrade level is 0 (not purchased yet)
    if (u.level === 0) {
        return; // Cannot boost if upgrade hasn't been purchased
    }

    const costUsd = u.boostCost;

    if (dollarBalance >= costUsd) {
        dollarBalance -= costUsd;
        hardwareEquity += u.boostCost;
        u.boostLevel++;

        // Increase yield by 10% permanently
        u.currentYield *= 1.10;

        // Double the boost cost for next purchase
        u.boostCost *= 2;

        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        updateUI();
        saveGame();

        // Play upgrade sound
        playUpgradeSound();
    }
}

function buyDogeBoost(i) {
    const u = dogeUpgrades[i];

    // Check if upgrade level is 0 (not purchased yet)
    if (u.level === 0) {
        return; // Cannot boost if upgrade hasn't been purchased
    }

    const costUsd = u.boostCost;

    if (dollarBalance >= costUsd) {
        dollarBalance -= costUsd;
        hardwareEquity += u.boostCost;
        u.boostLevel++;

        // Increase yield by 10% permanently
        u.currentYield *= 1.10;

        // Double the boost cost for next purchase
        u.boostCost *= 2;

        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        updateUI();
        saveGame();

        // Play upgrade sound
        playUpgradeSound();
    }
}

    // Ethereum buy functions
    function buyEthLevel(i, quantity) {
        const u = ethUpgrades[i];
        const powerReq = equipmentPowerReqs[u.id] || 0;
        let purchased = 0;

        for (let q = 0; q < quantity; q++) {
            const costUsd = u.currentUsd;

            if (dollarBalance < costUsd) {
                break; // Not enough dollars
            }

            // Check power requirements
            if (powerReq > 0) {
                const powerNeeded = totalPowerUsed + powerReq;
                const availablePower = getTotalPowerAvailableWithBonus();
                if (powerNeeded > availablePower) {
                    break; // Not enough power
                }
            }

            dollarBalance -= costUsd;
            hardwareEquity += u.currentUsd;
            u.level++;

            // Update price and yield based on upgrade type
            if (u.id === 0 || u.isClickUpgrade) {
                ethClickValue *= 1.12;
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));
                // Update the ETH button text to show new click value
                document.querySelectorAll('.mine-btn span')[1].innerText = `+${ethClickValue.toFixed(8)} Ξ`;
            } else {
                u.currentYield = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));
            }

            purchased++;
            calculateTotalPowerUsed();
        }

        if (purchased > 0) {
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
            updateUI();
            saveGame();
            playUpgradeSound();
        }
    }

    // Dogecoin buy functions
    function buyDogeLevel(i, quantity) {
        const u = dogeUpgrades[i];
        const powerReq = equipmentPowerReqs[u.id] || 0;
        let purchased = 0;

        for (let q = 0; q < quantity; q++) {
            const costUsd = u.currentUsd;

            if (dollarBalance < costUsd) {
                break; // Not enough dollars
            }

            // Check power requirements
            if (powerReq > 0) {
                const powerNeeded = totalPowerUsed + powerReq;
                const availablePower = getTotalPowerAvailableWithBonus();
                if (powerNeeded > availablePower) {
                    break; // Not enough power
                }
            }

            dollarBalance -= costUsd;
            hardwareEquity += u.currentUsd;
            u.level++;

            // Update price and yield based on upgrade type
            if (u.id === 0 || u.isClickUpgrade) {
                dogeClickValue *= 1.12;
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));
                // Update the DOGE button text to show new click value
                document.querySelectorAll('.mine-btn span')[2].innerText = `+${dogeClickValue.toFixed(8)} Ð`;
            } else {
                u.currentYield = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.12, u.level));
            }

            purchased++;
            calculateTotalPowerUsed();
        }

        if (purchased > 0) {
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
            updateUI();
            saveGame();
            playUpgradeSound();
        }
    }

    function updateSessionStats() {
        // Update session time
        const now = Date.now();
        const sessionSeconds = Math.floor((now - sessionStartTime) / 1000);
        const hours = Math.floor(sessionSeconds / 3600);
        const minutes = Math.floor((sessionSeconds % 3600) / 60);
        const seconds = sessionSeconds % 60;

        let timeStr = '';
        if (hours > 0) timeStr += hours + 'h ';
        if (minutes > 0) timeStr += minutes + 'm ';
        timeStr += seconds + 's';

        document.getElementById('session-time').innerText = timeStr;

        // Display session earnings (with abbreviations for large numbers)
        const sessionEarningEl = document.getElementById('session-earning');
        if (sessionEarningEl) {
            if (sessionEarnings >= 1000000000000000000000000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e30).toFixed(1) + 'N';
            } else if (sessionEarnings >= 1000000000000000000000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e27).toFixed(1) + 'O';
            } else if (sessionEarnings >= 1000000000000000000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e24).toFixed(1) + 'Sep';
            } else if (sessionEarnings >= 1000000000000000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e21).toFixed(1) + 'S';
            } else if (sessionEarnings >= 1000000000000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e18).toFixed(1) + 'Qa';
            } else if (sessionEarnings >= 1000000000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e15).toFixed(1) + 'Q';
            } else if (sessionEarnings >= 1000000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e12).toFixed(1) + 'T';
            } else if (sessionEarnings >= 1000000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e9).toFixed(1) + 'B';
            } else if (sessionEarnings >= 1000000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e6).toFixed(1) + 'M';
            } else if (sessionEarnings >= 1000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e3).toFixed(1) + 'K';
            } else {
                sessionEarningEl.innerText = '$' + sessionEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        }

        // Update lifetime earnings display (with abbreviations for large numbers)
        // Display = persisted total (lifetimeEarningsDisplay) + current run (lifetimeEarnings)
        const lifetimeEarningEl = document.getElementById('lifetime-earning');
        if (lifetimeEarningEl) {
            const totalLifetimeEarnings = (window.rugpullState?.lifetimeEarningsDisplay || 0) + lifetimeEarnings;
            if (totalLifetimeEarnings >= 1000000000000000000000000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e30).toFixed(1) + 'N';
            } else if (totalLifetimeEarnings >= 1000000000000000000000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e27).toFixed(1) + 'O';
            } else if (totalLifetimeEarnings >= 1000000000000000000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e24).toFixed(1) + 'Sep';
            } else if (totalLifetimeEarnings >= 1000000000000000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e21).toFixed(1) + 'S';
            } else if (totalLifetimeEarnings >= 1000000000000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e18).toFixed(1) + 'Qa';
            } else if (totalLifetimeEarnings >= 1000000000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e15).toFixed(1) + 'Q';
            } else if (totalLifetimeEarnings >= 1000000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e12).toFixed(1) + 'T';
            } else if (totalLifetimeEarnings >= 1000000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e9).toFixed(1) + 'B';
            } else if (totalLifetimeEarnings >= 1000000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e6).toFixed(1) + 'M';
            } else if (totalLifetimeEarnings >= 1000) {
                lifetimeEarningEl.innerText = '$' + (totalLifetimeEarnings / 1e3).toFixed(1) + 'K';
            } else {
                lifetimeEarningEl.innerText = '$' + totalLifetimeEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        }
    }

    // Helper function to abbreviate large numbers (mobile always, desktop at 1B+)
    function formatNumberForDisplay(num) {
        // Check if viewport is mobile (max-width: 768px)
        const isMobile = window.innerWidth <= 768;
        const abs = Math.abs(num);

        // Desktop: abbreviate only at 1B+, otherwise use locale string
        if (!isMobile) {
            if (abs >= 1e30) {
                return (num / 1e30).toFixed(1) + 'N';
            } else if (abs >= 1e27) {
                return (num / 1e27).toFixed(1) + 'O';
            } else if (abs >= 1e24) {
                return (num / 1e24).toFixed(1) + 'Sep';
            } else if (abs >= 1e21) {
                return (num / 1e21).toFixed(1) + 'S';
            } else if (abs >= 1e18) {
                return (num / 1e18).toFixed(1) + 'Qa';
            } else if (abs >= 1e15) {
                return (num / 1e15).toFixed(1) + 'Q';
            } else if (abs >= 1e12) {
                return (num / 1e12).toFixed(1) + 'T';
            } else if (abs >= 1e9) {
                return (num / 1e9).toFixed(1) + 'B';
            }
            return Math.floor(num).toLocaleString();
        }

        // Mobile abbreviation: 1k, 1m, 1b, 1t, 1q, 1qa, 1s, 1sep, 1o, 1n, etc
        if (abs >= 1e30) {
            return (num / 1e30).toFixed(1) + 'N';
        } else if (abs >= 1e27) {
            return (num / 1e27).toFixed(1) + 'O';
        } else if (abs >= 1e24) {
            return (num / 1e24).toFixed(1) + 'Sep';
        } else if (abs >= 1e21) {
            return (num / 1e21).toFixed(1) + 'S';
        } else if (abs >= 1e18) {
            return (num / 1e18).toFixed(1) + 'Qa';
        } else if (abs >= 1e15) {
            return (num / 1e15).toFixed(1) + 'Q';
        } else if (abs >= 1e12) {
            return (num / 1e12).toFixed(1) + 'T';
        } else if (abs >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (abs >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (abs >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return Math.floor(num).toLocaleString();
    }

    // Format crypto yields - keeps 8 decimal places below 1k, then abbreviates
    function formatCryptoYield(num) {
        const abs = Math.abs(num);

        // Below 1k: keep 8 decimal places
        if (abs < 1e3) {
            return num.toFixed(8);
        }

        // 1k and above: abbreviate with 2 decimal places for accuracy
        if (abs >= 1e30) {
            return (num / 1e30).toFixed(2) + 'N';
        } else if (abs >= 1e27) {
            return (num / 1e27).toFixed(2) + 'O';
        } else if (abs >= 1e24) {
            return (num / 1e24).toFixed(2) + 'Sep';
        } else if (abs >= 1e21) {
            return (num / 1e21).toFixed(2) + 'S';
        } else if (abs >= 1e18) {
            return (num / 1e18).toFixed(2) + 'Qa';
        } else if (abs >= 1e15) {
            return (num / 1e15).toFixed(2) + 'Q';
        } else if (abs >= 1e12) {
            return (num / 1e12).toFixed(2) + 'T';
        } else if (abs >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (abs >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (abs >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(8);
    }

    // Format crypto prices - keeps 8 decimal places until 1, then abbreviates
    function formatCryptoPrice(num) {
        const abs = Math.abs(num);

        // Below 1: keep 8 decimal places
        if (abs < 1) {
            return num.toFixed(8);
        }

        // 1 and above: abbreviate
        if (abs >= 1e30) {
            return (num / 1e30).toFixed(1) + 'N';
        } else if (abs >= 1e27) {
            return (num / 1e27).toFixed(1) + 'O';
        } else if (abs >= 1e24) {
            return (num / 1e24).toFixed(1) + 'Sep';
        } else if (abs >= 1e21) {
            return (num / 1e21).toFixed(1) + 'S';
        } else if (abs >= 1e18) {
            return (num / 1e18).toFixed(1) + 'Qa';
        } else if (abs >= 1e15) {
            return (num / 1e15).toFixed(1) + 'Q';
        } else if (abs >= 1e12) {
            return (num / 1e12).toFixed(1) + 'T';
        } else if (abs >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (abs >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (abs >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toFixed(1);
    }

    // Format watts to power units: W, KW, MW, GW, TW, PW
    function formatPower(watts) {
        if (watts >= 1e15) return (watts / 1e15).toFixed(2) + ' PW';  // Petawatt
        if (watts >= 1e12) return (watts / 1e12).toFixed(2) + ' TW';  // Terawatt
        if (watts >= 1e9)  return (watts / 1e9).toFixed(2) + ' GW';   // Gigawatt
        if (watts >= 1e6)  return (watts / 1e6).toFixed(2) + ' MW';   // Megawatt
        if (watts >= 1e3)  return (watts / 1e3).toFixed(2) + ' KW';   // Kilowatt
        return watts.toFixed(2) + ' W';  // Watts
    }

    function updateUI() {
        // Check achievements every UI update
        if (typeof checkAchievements === 'function') {
            checkAchievements();
        }

        // Crypto portfolio value = value of all crypto holdings only
        let cryptoPortfolioValue = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);
        const isMobileUI = window.innerWidth <= 768;

        // Abbreviate on mobile always, or on desktop when $1B+
        if ((isMobileUI && cryptoPortfolioValue >= 1000) || (cryptoPortfolioValue >= 1000000000)) {
            const abbrev = cryptoPortfolioValue / 1e9 >= 1 ? (cryptoPortfolioValue / 1e9).toFixed(1) + 'b' : cryptoPortfolioValue / 1e6 >= 1 ? (cryptoPortfolioValue / 1e6).toFixed(1) + 'm' : (cryptoPortfolioValue / 1e3).toFixed(1) + 'k';
            document.getElementById('nw-val').innerText = "$" + abbrev;
        } else {
            document.getElementById('nw-val').innerText = "$" + cryptoPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2});
        }

        // Format balances with smart abbreviations
        const formatCryptoBalance = (balance, decimals = 8) => {
            if (balance >= 1e9) {
                return (balance / 1e9).toFixed(2) + 'B';
            } else if (balance >= 1e6) {
                return (balance / 1e6).toFixed(2) + 'M';
            } else if (balance >= 1e3) {
                return (balance / 1e3).toFixed(2) + 'K';
            } else {
                return balance.toFixed(decimals);
            }
        };

        // Update balances
        document.getElementById('bal-btc').innerText = formatCryptoBalance(btcBalance);
        document.getElementById('bal-eth').innerText = formatCryptoBalance(ethBalance);
        document.getElementById('bal-doge').innerText = formatCryptoBalance(dogeBalance);

        // Update manual hash button text (with ascension multiplier applied)
        const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (ascensionLevel * 2) : 1;
        const clickSpeedBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('click_speed') : 0;
        const clickMultiplier = 1 + clickSpeedBonus;

        const mineBtnSpan = document.querySelector('.mine-btn span');
        if (mineBtnSpan) {
            const totalBtcClick = btcClickValue * clickMultiplier * ascensionClickMultiplier;
            mineBtnSpan.innerText = `+${totalBtcClick.toFixed(8)} ₿`;
        }
        const ethMineBtnSpan = document.querySelectorAll('.mine-btn span')[1];
        if (ethMineBtnSpan) {
            const totalEthClick = ethClickValue * clickMultiplier * ascensionClickMultiplier;
            ethMineBtnSpan.innerText = `+${totalEthClick.toFixed(8)} Ξ`;
        }
        const dogeMineBtnSpan = document.querySelectorAll('.mine-btn span')[2];
        if (dogeMineBtnSpan) {
            const totalDogeClick = dogeClickValue * clickMultiplier * ascensionClickMultiplier;
            dogeMineBtnSpan.innerText = `+${totalDogeClick.toFixed(8)} Ð`;
        }

        // Update hardware equity with smart abbreviations
        let hardwareEquityDisplay = "$" + Math.floor(hardwareEquity).toLocaleString();
        if (hardwareEquity >= 1000) {
            if (hardwareEquity >= 1e9) {
                hardwareEquityDisplay = "$" + (hardwareEquity / 1e9).toFixed(1) + 'B';
            } else if (hardwareEquity >= 1e6) {
                hardwareEquityDisplay = "$" + (hardwareEquity / 1e6).toFixed(1) + 'M';
            } else {
                hardwareEquityDisplay = "$" + (hardwareEquity / 1e3).toFixed(1) + 'K';
            }
        }
        document.getElementById('asset-usd').innerText = hardwareEquityDisplay;

        // Format hashrate with abbreviations (K, M, B, etc)
        const formatHashrate = (hashrate) => {
            if (hashrate >= 1e9) {
                return (hashrate / 1e9).toFixed(2) + 'B/s';
            } else if (hashrate >= 1e6) {
                return (hashrate / 1e6).toFixed(2) + 'M/s';
            } else if (hashrate >= 1e3) {
                return (hashrate / 1e3).toFixed(2) + 'K/s';
            } else {
                return hashrate.toFixed(8) + '/s';
            }
        };

        // Get mining bonuses for display
        const miningBonus = (typeof getSkillBonus === 'function') ? (1 + getSkillBonus('mining_speed')) : 1;
        const hackingBoost = getHackingSpeedBoost();
        const totalMiningMultiplier = miningBonus * hackingBoost;
        const isSpeedBoosted = hackingBoost > 1.0;

        // Update individual hashrate displays (old location - keep for backwards compatibility)
        const btcEl = document.getElementById('yield-btc');
        const ethEl = document.getElementById('yield-eth');
        const dogeEl = document.getElementById('yield-doge');

        if (btcEl) {
            btcEl.innerText = formatHashrate(btcPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                btcEl.style.color = '#00ff88';
                btcEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                btcEl.style.fontWeight = 'bold';
            } else {
                btcEl.style.color = '';
                btcEl.style.textShadow = '';
                btcEl.style.fontWeight = '';
            }
        }
        if (ethEl) {
            ethEl.innerText = formatHashrate(ethPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                ethEl.style.color = '#00ff88';
                ethEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                ethEl.style.fontWeight = 'bold';
            } else {
                ethEl.style.color = '';
                ethEl.style.textShadow = '';
                ethEl.style.fontWeight = '';
            }
        }
        if (dogeEl) {
            dogeEl.innerText = formatHashrate(dogePerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                dogeEl.style.color = '#00ff88';
                dogeEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                dogeEl.style.fontWeight = 'bold';
            } else {
                dogeEl.style.color = '';
                dogeEl.style.textShadow = '';
                dogeEl.style.fontWeight = '';
            }
        }

        // Update hashrate displays in new location
        const btcDisplayEl = document.getElementById('yield-btc-display');
        const ethDisplayEl = document.getElementById('yield-eth-display');
        const dogeDisplayEl = document.getElementById('yield-doge-display');

        if (btcDisplayEl) {
            btcDisplayEl.innerText = formatHashrate(btcPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                btcDisplayEl.style.color = '#00ff88';
                btcDisplayEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                btcDisplayEl.style.fontWeight = 'bold';
            } else {
                btcDisplayEl.style.color = '';
                btcDisplayEl.style.textShadow = '';
                btcDisplayEl.style.fontWeight = '';
            }
        }
        if (ethDisplayEl) {
            ethDisplayEl.innerText = formatHashrate(ethPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                ethDisplayEl.style.color = '#00ff88';
                ethDisplayEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                ethDisplayEl.style.fontWeight = 'bold';
            } else {
                ethDisplayEl.style.color = '';
                ethDisplayEl.style.textShadow = '';
                ethDisplayEl.style.fontWeight = '';
            }
        }
        if (dogeDisplayEl) {
            dogeDisplayEl.innerText = formatHashrate(dogePerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                dogeDisplayEl.style.color = '#00ff88';
                dogeDisplayEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                dogeDisplayEl.style.fontWeight = 'bold';
            } else {
                dogeDisplayEl.style.color = '';
                dogeDisplayEl.style.textShadow = '';
                dogeDisplayEl.style.fontWeight = '';
            }
        }

        // Update prices
        document.getElementById('btc-price').innerText = "$" + formatCryptoPrice(btcPrice);
        document.getElementById('eth-price').innerText = "$" + formatCryptoPrice(ethPrice);
        document.getElementById('doge-price').innerText = "$" + formatCryptoPrice(dogePrice);

        // Update dollar balance
        const dollarBalanceEl = document.getElementById('dollar-balance');
        if (dollarBalanceEl) dollarBalanceEl.innerText = "$" + formatNumberForDisplay(dollarBalance);

        // Update market prices
        const marketBtcPrice = document.getElementById('market-btc-price');
        const marketEthPrice = document.getElementById('market-eth-price');
        const marketDogePrice = document.getElementById('market-doge-price');
        if (marketBtcPrice) marketBtcPrice.innerText = formatCryptoPrice(btcPrice);
        if (marketEthPrice) marketEthPrice.innerText = formatCryptoPrice(ethPrice);
        if (marketDogePrice) marketDogePrice.innerText = formatCryptoPrice(dogePrice);

        // Update session stats
        updateSessionStats();

        // Update power display
        calculateTotalPowerUsed();
        updatePowerDisplay();

        // Update hacking tab visibility based on lifetime earnings
        const hackingTabBtn = document.getElementById('hacking-tab-btn');
        if (hackingTabBtn) {
            if (lifetimeEarnings < 10000) {
                hackingTabBtn.style.opacity = '0.5';
                hackingTabBtn.style.cursor = 'not-allowed';
                hackingTabBtn.innerHTML = `🔒 HACKING<br><span style="font-size: 0.6rem;">($${(lifetimeEarnings).toFixed(0)}/$10,000)</span>`;
                hackingTabBtn.onclick = function(e) {
                    e.preventDefault();
                    alert(`🔒 Hacking Feature Locked!\n\nRequires $10,000 lifetime earnings to unlock.\n\nCurrent: $${lifetimeEarnings.toFixed(2)}`);
                };
            } else {
                hackingTabBtn.style.opacity = '1';
                hackingTabBtn.style.cursor = 'pointer';
                hackingTabBtn.textContent = 'HACKING';
                hackingTabBtn.onclick = function() { switchTab('hacking'); };
            }
        }

        // Update difficulty button states based on lifetime earnings
        const easyBtn = document.getElementById('hacking-easy-btn');
        const mediumBtn = document.getElementById('hacking-medium-btn');
        const hardBtn = document.getElementById('hacking-hard-btn');

        if (easyBtn) {
            if (lifetimeEarnings < 10000) {
                easyBtn.style.opacity = '0.5';
                easyBtn.style.cursor = 'not-allowed';
            } else {
                easyBtn.style.opacity = '1';
                easyBtn.style.cursor = 'pointer';
            }
        }

        if (mediumBtn) {
            if (lifetimeEarnings < 50000) {
                mediumBtn.style.opacity = '0.5';
                mediumBtn.style.cursor = 'not-allowed';
                const currentAbbrev = lifetimeEarnings >= 1000 ? '$' + (lifetimeEarnings / 1000).toFixed(1) + 'K' : '$' + lifetimeEarnings.toFixed(0);
                mediumBtn.innerHTML = `<div style="margin-bottom: 5px;">🔒 MEDIUM</div>
                    <div style="font-size: 0.65rem; font-weight: 400;">${currentAbbrev}/$50K</div>`;
            } else {
                mediumBtn.style.opacity = '1';
                mediumBtn.style.cursor = 'pointer';
                mediumBtn.innerHTML = `<div style="margin-bottom: 5px;">MEDIUM</div>
                    <div style="font-size: 0.7rem; font-weight: 400;">4 bugs | 20s | 8 lives</div>
                    <div style="font-size: 0.65rem; margin-top: 5px;">+25% speed for 2min</div>`;
            }
        }

        if (hardBtn) {
            if (lifetimeEarnings < 100000) {
                hardBtn.style.opacity = '0.5';
                hardBtn.style.cursor = 'not-allowed';
                const currentAbbrev = lifetimeEarnings >= 1000 ? '$' + (lifetimeEarnings / 1000).toFixed(1) + 'K' : '$' + lifetimeEarnings.toFixed(0);
                hardBtn.innerHTML = `<div style="margin-bottom: 5px;">🔒 HARD</div>
                    <div style="font-size: 0.65rem; font-weight: 400;">${currentAbbrev}/$100K</div>`;
            } else {
                hardBtn.style.opacity = '1';
                hardBtn.style.cursor = 'pointer';
                hardBtn.innerHTML = `<div style="margin-bottom: 5px;">HARD</div>
                    <div style="font-size: 0.7rem; font-weight: 400;">5 bugs | 12s | 10 lives</div>
                    <div style="font-size: 0.65rem; margin-top: 5px;">+50% speed for 2min</div>`;
            }
        }

        btcUpgrades.forEach(u => {
    const costUsd = u.currentUsd;
    const yEl = document.getElementById(`yield-${u.id}`);

    if (yEl) {
        if (u.isClickUpgrade) {
            yEl.innerText = `+10% MANUAL HASH RATE`;
        } else {
            // Show the current speed WITH skill bonuses AND ascension bonus applied
            const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            const currentSpeed = baseSpeed * (1 + miningBonus + btcBonus + ascensionBonus);
            yEl.innerText = `+${formatCryptoYield(currentSpeed)} ₿/s - Current Speed`;
        }
    }

    // Update per-level increase
    const increaseEl = document.getElementById(`increase-${u.id}`);
    if (increaseEl) {
        if (u.isClickUpgrade) {
            increaseEl.style.display = 'none';
        } else {
            const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
            const perLevelIncrease = baseIncrease * (1 + miningBonus + btcBonus + ascensionBonus);
            increaseEl.innerText = `+${formatCryptoYield(perLevelIncrease)} ₿/s per level`;
            increaseEl.style.display = 'block';
        }
    }

    const uEl = document.getElementById(`usd-${u.id}`);
    if(uEl) {
        // Calculate total cost for the selected quantity
        let displayCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
            } else {
                displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
            }
            tempLevel++;
        }
        uEl.innerText = `$${formatNumberForDisplay(Math.floor(displayCost))}`;
    }

    // Update power display with effective consumption after skills
    const powerEl = document.getElementById(`power-${u.id}`);
    if(powerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            powerEl.innerText = `${formatPower(effectivePower)} Consumed per level`;
        }
    }

    // Calculate how many upgrades can be afforded (accounting for price increases)
    const affordEl = document.getElementById(`afford-${u.id}`);
    if(affordEl) {
        let remaining = dollarBalance;
        let canAfford = 0;
        let nextCost = costUsd;
        let nextLevel = u.level;

        while (remaining >= nextCost) {
            remaining -= nextCost;
            canAfford++;
            nextLevel++;

            // Calculate next cost based on upgrade type
            if (u.isClickUpgrade) {
                // Manual hash: 1.12x multiplier
                nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
            } else {
                // Other miners: 1.12x multiplier
                nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
            }
        }

        affordEl.innerText = `x${canAfford}`;
        affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
    }

    const bEl = document.getElementById(`up-${u.id}`);
    if(bEl) {
        // Check both dollar balance and power requirements for the selected quantity
        // Calculate total cost for buyQuantity items
        let totalCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
            } else {
                totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
            }
            tempLevel++;
        }

        const hasEnoughDollars = dollarBalance >= totalCost;
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
        const availablePower = getTotalPowerAvailableWithBonus();
        const hasEnoughPower = powerNeeded <= availablePower || powerReq === 0;
        const shouldDisable = !(hasEnoughDollars && hasEnoughPower);
        bEl.disabled = shouldDisable;
        if (u.id === 1) console.log(`USB Miner: dollars=${dollarBalance}/${totalCost}, power=${totalPowerUsed}/${availablePower}, needed=${powerNeeded}, qty=${buyQuantity}, disabled=${shouldDisable}`);

        // Change button appearance based on what's missing
        if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
            // Need both cash and power - prioritize showing cash need
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power`;
        } else if (!hasEnoughDollars) {
            // Only need cash
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
        } else if (!hasEnoughPower && powerReq > 0) {
            // Only need power
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE POWER';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE POWER';
            }
            bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power capacity.`;
        } else {
            // Can afford - remove overlay
            let overlay = bEl.querySelector('.power-overlay');
            if (overlay) overlay.remove();
            bEl.title = '';
        }
    }

    const lEl = document.getElementById(`lvl-txt-${u.id}`);
    if(lEl) lEl.innerText = `[Lvl ${u.level}]`;

    // Update boost button
    const boostCostBtc = u.boostCost / btcPrice;
    const boostCostEl = document.getElementById(`boost-cost-${u.id}`);
    if(boostCostEl) boostCostEl.innerText = `$${Math.floor(u.boostCost).toLocaleString()}`;

    // Format the current yield amount (after all boosts applied)
    const currentYield = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
    const boostAmtEl = document.getElementById(`boost-amt-${u.id}`);
    if(boostAmtEl) {
        if (currentYield >= 1) {
            boostAmtEl.innerText = currentYield.toFixed(2);
        } else if (currentYield >= 0.0001) {
            boostAmtEl.innerText = (currentYield * 1000000).toFixed(0) + 'μ';
        } else if (currentYield > 0) {
            boostAmtEl.innerText = (currentYield * 1000000000).toFixed(0);
        } else {
            boostAmtEl.innerText = '0';
        }
    }

    const boostBtn = document.getElementById(`boost-${u.id}`);
    if(boostBtn) {
        boostBtn.disabled = (u.level === 0 || dollarBalance < u.boostCost);
        if (u.level === 0) {
            boostBtn.innerHTML = `Purchase ${u.name} first`;
        } else {
            boostBtn.innerHTML = `+10% HASH RATE | <span id="boost-cost-${u.id}">$${Math.floor(u.boostCost).toLocaleString()}</span>`;
        }
    }
});

// Update ETH upgrades display
ethUpgrades.forEach(u => {
    const costUsd = u.currentUsd;
    const yEl = document.getElementById(`eth-yield-${u.id}`);
    if (yEl) {
        if (u.isClickUpgrade) {
            yEl.innerText = `+10% MANUAL ETH RATE`;
        } else {
            // Show the current speed WITH skill bonuses AND ascension bonus applied
            const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            const currentSpeed = baseSpeed * (1 + miningBonus + ethBonus + ascensionBonus);
            yEl.innerText = `+${formatCryptoYield(currentSpeed)} Ξ/s - Current Speed`;
        }
    }

    // Update per-level increase for ETH
    const ethIncreaseEl = document.getElementById(`eth-increase-${u.id}`);
    if (ethIncreaseEl) {
        if (u.isClickUpgrade) {
            ethIncreaseEl.style.display = 'none';
        } else {
            const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
            const perLevelIncrease = baseIncrease * (1 + miningBonus + ethBonus + ascensionBonus);
            ethIncreaseEl.innerText = `+${formatCryptoYield(perLevelIncrease)} Ξ/s per level`;
            ethIncreaseEl.style.display = 'block';
        }
    }

    const uEl = document.getElementById(`eth-usd-${u.id}`);
    if(uEl) {
        // Calculate total cost for the selected quantity
        let displayCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
            } else {
                displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
            }
            tempLevel++;
        }
        uEl.innerText = `$${formatNumberForDisplay(Math.floor(displayCost))}`;
    }

    // Update power display with effective consumption after skills
    const ethPowerEl = document.getElementById(`eth-power-${u.id}`);
    if(ethPowerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            ethPowerEl.innerText = `${formatPower(effectivePower)} Consumed per level`;
        }
    }

    const affordEl = document.getElementById(`eth-afford-${u.id}`);
    if(affordEl) {
        let remaining = dollarBalance;
        let canAfford = 0;
        let nextCost = costUsd;
        let nextLevel = u.level;

        while (remaining >= nextCost) {
            remaining -= nextCost;
            canAfford++;
            nextLevel++;
            if (u.isClickUpgrade) {
                nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
            } else {
                nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
            }
        }

        affordEl.innerText = `x${canAfford}`;
        affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
    }

    const bEl = document.getElementById(`eth-up-${u.id}`);
    if(bEl) {
        // Check both dollar balance and power requirements for the selected quantity
        // Calculate total cost for buyQuantity items
        let totalCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
            } else {
                totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
            }
            tempLevel++;
        }

        const hasEnoughDollars = dollarBalance >= totalCost;
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
        const ethAvailablePower = getTotalPowerAvailableWithBonus();
        const hasEnoughPower = powerNeeded <= ethAvailablePower || powerReq === 0;
        bEl.disabled = !(hasEnoughDollars && hasEnoughPower);

        // Change button appearance based on what's missing
        if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
            // Need both cash and power - prioritize showing cash need
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - ethAvailablePower).toLocaleString()}W more power`;
        } else if (!hasEnoughDollars) {
            // Only need cash
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
        } else if (!hasEnoughPower && powerReq > 0) {
            // Only need power
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE POWER';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE POWER';
            }
            bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - ethAvailablePower).toLocaleString()}W more power capacity.`;
        } else {
            // Can afford - remove overlay
            let overlay = bEl.querySelector('.power-overlay');
            if (overlay) overlay.remove();
            bEl.title = '';
        }
    }

    const lEl = document.getElementById(`eth-lvl-txt-${u.id}`);
    if(lEl) lEl.innerText = `[Lvl ${u.level}]`;

    // Update ETH boost button
    const ethBoostBtn = document.getElementById(`eth-boost-${u.id}`);
    if(ethBoostBtn) {
        ethBoostBtn.disabled = (u.level === 0 || dollarBalance < u.boostCost);
        if (u.level === 0) {
            ethBoostBtn.innerHTML = `Purchase ${u.name} first`;
        } else {
            ethBoostBtn.innerHTML = `+10% HASH RATE | <span id="eth-boost-cost-${u.id}">$${Math.floor(u.boostCost).toLocaleString()}</span>`;
        }
    }
});

// Update DOGE upgrades display
dogeUpgrades.forEach(u => {
    const costUsd = u.currentUsd;
    const yEl = document.getElementById(`doge-yield-${u.id}`);
    if (yEl) {
        if (u.isClickUpgrade) {
            yEl.innerText = `+10% MANUAL DOGE RATE`;
        } else {
            // Show the current speed WITH skill bonuses AND ascension bonus applied
            const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            const currentSpeed = baseSpeed * (1 + miningBonus + dogeBonus + ascensionBonus);
            yEl.innerText = `+${formatCryptoYield(currentSpeed)} Ð/s - Current Speed`;
        }
    }

    // Update per-level increase for DOGE
    const dogeIncreaseEl = document.getElementById(`doge-increase-${u.id}`);
    if (dogeIncreaseEl) {
        if (u.isClickUpgrade) {
            dogeIncreaseEl.style.display = 'none';
        } else {
            const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
            const perLevelIncrease = baseIncrease * (1 + miningBonus + dogeBonus + ascensionBonus);
            dogeIncreaseEl.innerText = `+${formatCryptoYield(perLevelIncrease)} Ð/s per level`;
            dogeIncreaseEl.style.display = 'block';
        }
    }

    const uEl = document.getElementById(`doge-usd-${u.id}`);
    if(uEl) {
        // Calculate total cost for the selected quantity
        let displayCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
            } else {
                displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
            }
            tempLevel++;
        }
        uEl.innerText = `$${formatNumberForDisplay(Math.floor(displayCost))}`;
    }

    // Update power display with effective consumption after skills
    const dogePowerEl = document.getElementById(`doge-power-${u.id}`);
    if(dogePowerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            dogePowerEl.innerText = `${formatPower(effectivePower)} Consumed per level`;
        }
    }

    const affordEl = document.getElementById(`doge-afford-${u.id}`);
    if(affordEl) {
        let remaining = dollarBalance;
        let canAfford = 0;
        let nextCost = costUsd;
        let nextLevel = u.level;

        while (remaining >= nextCost) {
            remaining -= nextCost;
            canAfford++;
            nextLevel++;
            if (u.isClickUpgrade) {
                nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
            } else {
                nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
            }
        }

        affordEl.innerText = `x${canAfford}`;
        affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
    }

    const bEl = document.getElementById(`doge-up-${u.id}`);
    if(bEl) {
        // Check both dollar balance and power requirements for the selected quantity
        // Calculate total cost for buyQuantity items
        let totalCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
            } else {
                totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
            }
            tempLevel++;
        }

        const hasEnoughDollars = dollarBalance >= totalCost;
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
        const dogeAvailablePower = getTotalPowerAvailableWithBonus();
        const hasEnoughPower = powerNeeded <= dogeAvailablePower || powerReq === 0;
        bEl.disabled = !(hasEnoughDollars && hasEnoughPower);

        // Change button appearance based on what's missing
        if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
            // Need both cash and power - prioritize showing cash need
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - dogeAvailablePower).toLocaleString()}W more power`;
        } else if (!hasEnoughDollars) {
            // Only need cash
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
        } else if (!hasEnoughPower && powerReq > 0) {
            // Only need power
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.innerHTML = 'YOU NEED MORE POWER';
                bEl.style.position = 'relative';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE POWER';
            }
            bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - dogeAvailablePower).toLocaleString()}W more power capacity.`;
        } else {
            // Can afford - remove overlay
            let overlay = bEl.querySelector('.power-overlay');
            if (overlay) overlay.remove();
            bEl.title = '';
        }
    }

    const lEl = document.getElementById(`doge-lvl-txt-${u.id}`);
    if(lEl) lEl.innerText = `[Lvl ${u.level}]`;

    // Update DOGE boost button
    const dogeBoostBtn = document.getElementById(`doge-boost-${u.id}`);
    if(dogeBoostBtn) {
        dogeBoostBtn.disabled = (u.level === 0 || dollarBalance < u.boostCost);
        if (u.level === 0) {
            dogeBoostBtn.innerHTML = `Purchase ${u.name} first`;
        } else {
            dogeBoostBtn.innerHTML = `+10% HASH RATE | <span id="doge-boost-cost-${u.id}">$${Math.floor(u.boostCost).toLocaleString()}</span>`;
        }
    }
    });

    // Update staking UI
    if (typeof updateStakingUI === 'function') {
        updateStakingUI();
    }

    // Update ascension UI
    if (typeof updateAscensionUI === 'function') {
        updateAscensionUI();
    }

    // Update store button visibility (for tokens display)
    if (typeof updateStoreButtonVisibility === 'function') {
        updateStoreButtonVisibility();
    }
    }

    // Mining loop - runs every 100ms
    setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - lastTickTime) / 1000;
        lastTickTime = now;

        // Get skill tree mining bonus
        const miningBonus = (typeof getSkillBonus === 'function') ? (1 + getSkillBonus('mining_speed')) : 1;

        // Get hacking speed boost
        const hackingBoost = getHackingSpeedBoost();

        // BTC mining gains
        if (btcPerSec > 0) {
            let gain = btcPerSec * deltaTime * miningBonus * hackingBoost;
            let effectivePrice = getEffectiveCryptoPrice(btcPrice);
            let usdValue = gain * effectivePrice;

            // Try auto-sell first (before adding to balance)
            const btcAutoSold = tryAutoSellCrypto('btc', gain);

            // If not auto-sold, add to balance
            if (!btcAutoSold) {
                btcBalance += gain;
            }

            btcLifetime += gain;
            lifetimeEarnings += usdValue;
            sessionEarnings += usdValue;
        }

        // ETH mining gains
        if (ethPerSec > 0) {
            let gain = ethPerSec * deltaTime * miningBonus * hackingBoost;
            let effectivePrice = getEffectiveCryptoPrice(ethPrice);
            let usdValue = gain * effectivePrice;

            // Try auto-sell first (before adding to balance)
            const ethAutoSold = tryAutoSellCrypto('eth', gain);

            // If not auto-sold, add to balance
            if (!ethAutoSold) {
                ethBalance += gain;
            }

            ethLifetime += gain;
            lifetimeEarnings += usdValue;
            sessionEarnings += usdValue;
        }

        // DOGE mining gains
        if (dogePerSec > 0) {
            let gain = dogePerSec * deltaTime * miningBonus * hackingBoost;
            let effectivePrice = getEffectiveCryptoPrice(dogePrice);
            let usdValue = gain * effectivePrice;

            // Try auto-sell first (before adding to balance)
            const dogeAutoSold = tryAutoSellCrypto('doge', gain);

            // If not auto-sold, add to balance
            if (!dogeAutoSold) {
                dogeBalance += gain;
            }

            dogeLifetime += gain;
            lifetimeEarnings += usdValue;
            sessionEarnings += usdValue;
        }

        // Update gameState with current values for rugpull.js
        // lifetimeEarnings = current run earnings (resets on rugpull)
        window.gameState.lifetimeEarnings = lifetimeEarnings;
        window.gameState.dollarBalance = dollarBalance;

        // Update currentRunEarnings for rugpull tracking (this is lifetimeEarnings since last rugpull)
        if (typeof updateCurrentRunEarnings === 'function') {
            updateCurrentRunEarnings(lifetimeEarnings);
        }

        updateUI();
        updateAutoClickerButtonState();
        updateWhackStats();
        updateMinigamesTab();

        // Check for rugpull milestone
        if (typeof checkRugpullMilestone === 'function') {
            checkRugpullMilestone();
        }

    }, 100);

    // Initialize all shops after DOM is ready
    function initializeGame() {
        // Test localStorage availability
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            console.log('localStorage is available and working');
        } catch (e) {
            console.error('localStorage is NOT available:', e);
            alert('WARNING: Browser storage is disabled! Your game progress will not be saved. Please enable cookies/storage in your browser settings.');
        }

        try {
            initBtcShop();
            initEthShop();
            initDogeShop();
            initPowerShop();
        } catch (e) {
            console.error('Error initializing shops:', e);
        }

        // Initialize achievements system BEFORE loading game so loadGame() can populate them
        if (typeof initAchievements === 'function') {
            initAchievements();
            console.log('✓ Achievements system initialized');
        }

        loadGame(); // This calls updateUI() internally
        updateAutoClickerButtonState(); // Update button state immediately after loading
        setBuyQuantity(1); // Highlight the 1x button on page load

        // Update auto-sell status button
        updateAutoSellButtonUI();

        // Initialize staking system
        initStaking();
        updateStakingUI();

        // Initialize tutorial for new players
        if (typeof initTutorial === 'function') {
            initTutorial();
            console.log('🎓 Tutorial system initialized');
        }

        // Schedule first hacking notification if not already scheduled
        if (hackingNextNotificationTime === 0) {
            scheduleHackingNotification();
            console.log('⚡ Hacking minigame notification scheduled');
        }

        // Initialize button states for both minigames
        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            // Hacking buttons
            const hackingBtn = document.getElementById(`hacking-${difficulty.toLowerCase()}-btn`);
            if (hackingBtn) {
                const hackingCooldownEnd = hackingCooldowns[difficulty] || 0;
                hackingBtn.dataset.onCooldown = Date.now() < hackingCooldownEnd ? 'true' : 'false';
                hackingBtn.style.filter = Date.now() < hackingCooldownEnd ? 'brightness(0.5)' : '';
            }

            // Whack buttons
            const whackBtn = document.getElementById(`whack-${difficulty.toLowerCase()}-btn`);
            if (whackBtn) {
                const whackCooldownEnd = whackCooldowns[difficulty] || 0;
                whackBtn.dataset.onCooldown = Date.now() < whackCooldownEnd ? 'true' : 'false';
                whackBtn.style.filter = Date.now() < whackCooldownEnd ? 'brightness(0.5)' : '';
            }
        });

        // Update hacking stats on page load
        updateHackingStats();
        updateWhackStats();
        updateMinigamesTab();

        // Show instructions modal if not dismissed and player hasn't ascended yet
        // BUT: don't show if tutorial is active for new players or if tutorial was completed
        const tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';
        const isNewPlayer = !localStorage.getItem('gameStarted');
        const isTutorialActive = typeof tutorialData !== 'undefined' && !tutorialData.completed;

        if (!isNewPlayer && !isTutorialActive && !tutorialCompleted && localStorage.getItem('instructionsDismissed') !== 'true') {
            const hasAscended = typeof ascensionLevel !== 'undefined' && ascensionLevel > 0;
            if (!hasAscended) {
                const instructionsEl = document.getElementById('game-instructions');
                if (instructionsEl) {
                    instructionsEl.style.display = 'flex';
                }
            }
        }

        // Show offline earnings if applicable (must be after loadGame())
        console.log('=== MODAL CHECK ===');
        console.log('window.offlineEarningsToShow:', window.offlineEarningsToShow);
        console.log('Type:', typeof window.offlineEarningsToShow);

        if (window.offlineEarningsToShow) {
            console.log('✓ SHOWING OFFLINE EARNINGS MODAL');
            console.log('Data:', window.offlineEarningsToShow);
            setTimeout(() => {
                console.log('Calling showOfflineEarningsModal function...');
                showOfflineEarningsModal(
                    window.offlineEarningsToShow.btc || 0,
                    window.offlineEarningsToShow.eth || 0,
                    window.offlineEarningsToShow.doge || 0,
                    window.offlineEarningsToShow.stakingCash || 0,
                    window.offlineEarningsToShow.seconds,
                    window.offlineEarningsToShow.wasCapped || false,
                    window.offlineEarningsToShow.cappedSeconds || window.offlineEarningsToShow.seconds
                );
                window.offlineEarningsToShow = null;
                // Show backup reminder after offline earnings modal
                setTimeout(() => {
                    showBackupReminder();
                }, 180000);
            }, 500);
        } else {
            console.log('✗ No offline earnings data - modal will not show');
            // Show backup reminder anyway on every load
            setTimeout(() => {
                showBackupReminder();
            }, 180000);
        }

        const canvasElement = document.getElementById('nwChart');
        console.log('Canvas element:', canvasElement);

        if (!canvasElement) {
            console.error('ERROR: Canvas element not found!');
            return;
        }

        // Function to initialize the chart
        const initChart = () => {
            const ctx = canvasElement.getContext('2d');
            console.log('Canvas context:', ctx);

            // Verify canvas context is valid
            if (!ctx) {
                console.error('ERROR: Could not get canvas 2D context');
                return null;
            }

            // Initialize chart with full history (at least one data point)
            const currentNetWorth = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);
            console.log('=== CHART DEBUG ===');
            console.log('btcBalance:', btcBalance, 'btcPrice:', btcPrice);
            console.log('ethBalance:', ethBalance, 'ethPrice:', ethPrice);
            console.log('dogeBalance:', dogeBalance, 'dogePrice:', dogePrice);
            console.log('hardwareEquity:', hardwareEquity);
            console.log('Current net worth for chart:', currentNetWorth);

            // Always start chart at 0
            if (chartHistory.length === 0) {
                chartHistory.push(0);
                chartHistory.push(0);
                chartTimestamps.push({ time: Date.now(), value: 0 });
                chartTimestamps.push({ time: Date.now() + 1000, value: 0 });
            }

            console.log('Chart history length:', chartHistory.length, 'Data:', chartHistory);

            // Check if Chart.js loaded
            if (typeof Chart === 'undefined') {
                console.error('ERROR: Chart.js library not loaded!');
                document.querySelector('.chart-wrapper').innerHTML = '<div style="color: #ff3344; padding: 20px; text-align: center; font-size: 0.8rem;">Chart.js failed to load<br>Check internet connection</div>';
                return null;
            }

            console.log('Chart.js version:', Chart.version);

            let nwChart;
            try {
                nwChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartHistory.map((_, i) => ''),
                    datasets: [{
                        data: chartHistory,
                        borderColor: '#00ff88',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    scales: {
                        x: {
                            display: false,
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                display: false
                            }
                        },
                        y: {
                            display: true,
                            beginAtZero: true,
                            min: 0,
                            grace: '5%',
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                display: true,
                                color: '#999',
                                font: {
                                    size: 10
                                },
                                maxTicksLimit: 8,
                                callback: function(value) {
                                    if (value >= 1000000000) {
                                        return '$' + (value / 1000000000).toFixed(1) + 'B';
                                    }
                                    if (value >= 1000000) {
                                        return '$' + (value / 1000000).toFixed(1) + 'M';
                                    }
                                    if (value >= 1000) {
                                        return '$' + (value / 1000).toFixed(1) + 'k';
                                    }
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });

                console.log('Chart object created:', nwChart);
                console.log('Chart initialized with data:', chartHistory);

                // Force an immediate render
                try {
                    nwChart.update();
                    console.log('Chart render forced successfully');
                } catch (renderError) {
                    console.error('ERROR forcing chart render:', renderError);
                }

                return nwChart;
            } catch (error) {
                console.error('ERROR creating chart:', error);
                document.querySelector('.chart-wrapper').innerHTML = '<div style="color: #ff3344; padding: 20px; text-align: center; font-size: 0.8rem;">Chart Error: ' + error.message + '<br><small>Try refreshing the page</small></div>';
                return null;
            }
        };

        // Initialize chart with retry logic
        let nwChart = null;
        let chartInitialized = false;

        const tryInitChart = () => {
            nwChart = initChart();
            if (nwChart) {
                chartInitialized = true;
                console.log('Chart successfully initialized');
            }
        };

        // Try immediate initialization
        setTimeout(() => {
            tryInitChart();

            // Retry with delays (especially important for mobile)
            if (!chartInitialized) {
                console.log('Chart init failed, retrying with delays...');
                setTimeout(tryInitChart, 200);
                setTimeout(tryInitChart, 500);
                setTimeout(tryInitChart, 1000);
                setTimeout(tryInitChart, 2000); // Extra retry for slow mobile devices
                setTimeout(tryInitChart, 3000); // Final attempt
            }
        }, 100); // Small initial delay to ensure DOM is fully rendered

        // Handle window resize/orientation change on mobile
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (nwChart) {
                    console.log('Window resized, reinitializing chart...');
                    nwChart.destroy();
                    chartInitialized = false;
                    tryInitChart();
                }
            }, 300);
        });

        let updateCount = 0;
        setInterval(() => {
            if (!nwChart) {
                // Try initializing again if still not ready
                if (!chartInitialized) {
                    tryInitChart();
                }
                return;
            }

            const netWorth = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);

            // Always update the chart with the current net worth
            chartHistory.push(netWorth);
            chartTimestamps.push({ time: Date.now(), value: netWorth });

            // Keep all data points - chart will stretch to the right showing full history
            // No limit on data points so we preserve the entire game history

            nwChart.data.datasets[0].data = chartHistory;
            nwChart.data.labels = chartHistory.map((_, i) => '');
            nwChart.update('none');

            updateCount++;
            if (updateCount % 5 === 0) {
                console.log('Chart updated:', updateCount, 'times. Current data points:', chartHistory.length, 'Latest value:', netWorth, 'BTC:', btcBalance, 'ETH:', ethBalance, 'DOGE:', dogeBalance);
            }
        }, 2000);

        // Auto-save every 1.5 seconds
        setInterval(saveGame, 1500);

        // Check tutorial progress every 500ms
        setInterval(() => {
            if (typeof checkTutorialProgress === 'function') {
                checkTutorialProgress();
            }

            // Check hacking notification timing
            if (hackingNextNotificationTime > 0 && Date.now() >= hackingNextNotificationTime) {
                hackingNextNotificationTime = 0; // Reset
                // Only display notification if lifetime earnings >= $10,000
                if (lifetimeEarnings >= 10000) {
                    displayHackingNotification();
                }
            }

            // Update hacking stats if tab is visible
            if (document.getElementById('hacking-tab') && document.getElementById('hacking-tab').classList.contains('active')) {
                updateHackingStats();
                updateHackingCooldownDisplays();
            }

            // Update minigame card lock states
            updateMinigameCardLocks();
        }, 500);

        // Start price swings: separate timing for each crypto
        // Only start if not already running (prevents multiple loops on refresh)
        if (!priceSwingsStarted) {
            priceSwingsStarted = true;
            // BTC swings (start immediately)
            btcTinySwing();       // ±0.05%-0.1% every 2 seconds
            btcFrequentSwing();   // ±0.1%-1% every 2-60 seconds
            btcBigSwing();        // ±2.5%-10% every 5-10 minutes

            // ETH swings (start with 700ms delay to stagger from BTC)
            setTimeout(ethTinySwing, 700);       // ±0.05%-0.1% every 2.3 seconds
            setTimeout(ethFrequentSwing, 1200);  // ±0.1%-1.2% every 3-75 seconds
            setTimeout(ethBigSwing, 1500);       // ±2.5%-12% every 4-12 minutes

            // DOGE swings (start with 1400ms delay to stagger from BTC and ETH)
            setTimeout(dogeTinySwing, 1400);     // ±0.05%-0.15% every 2.7 seconds
            setTimeout(dogeFrequentSwing, 2100); // ±0.15%-1.8% every 2-45 seconds
            setTimeout(dogeBigSwing, 2800);      // ±3%-18% every 3-8 minutes
        }
    }

    // Save game when page becomes hidden (mobile browser close, tab switch, etc.)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('Page hidden - saving game state');
            try {
                saveGame();
                console.log('Save successful on visibility change');
            } catch (e) {
                console.error('Save failed on visibility change:', e);
            }
        } else {
            console.log('Page visible - checking saved data exists');
            const testSave = localStorage.getItem('satoshiTerminalSave');
            if (testSave) {
                console.log('Save data confirmed in localStorage');
            } else {
                console.error('WARNING: No save data found in localStorage!');
            }
        }
    });

    // Save game when user is about to leave the page
    window.addEventListener('beforeunload', function(e) {
        console.log('Page unloading - saving game state');
        try {
            saveGame();
            console.log('Save successful on beforeunload');
        } catch (err) {
            console.error('Save failed on beforeunload:', err);
        }
    });

    // Save game when page is hidden on mobile (iOS Safari support)
    window.addEventListener('pagehide', function(e) {
        console.log('Page hide event - saving game state');
        try {
            saveGame();
            console.log('Save successful on pagehide');
        } catch (err) {
            console.error('Save failed on pagehide:', err);
        }
    });

    // Additional mobile save on freeze event (newer mobile browsers)
    window.addEventListener('freeze', function(e) {
        console.log('Page freeze event - saving game state');
        try {
            saveGame();
            console.log('Save successful on freeze');
        } catch (err) {
            console.error('Save failed on freeze:', err);
        }
    });


    // Combined age and terms modal handling
    function acceptAgeAndTerms() {
        localStorage.setItem('ageDisclaimerAccepted', 'true');
        localStorage.setItem('termsAccepted', 'true');
        document.getElementById('age-terms-modal').style.display = 'none';
    }

    function openAgeAndTermsModal() {
        document.getElementById('age-terms-modal').style.display = 'flex';
    }

    // Privacy policy modal handling
    function openPrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'flex';
    }

    function closePrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'none';
    }

    // Backup Reminder Modal functions
    function showBackupReminder() {
        // Don't show if permanently dismissed by user
        if (localStorage.getItem('backupReminderDismissed') === 'true') {
            return;
        }
        // Don't show if already shown this session
        if (window.backupReminderShownThisSession) {
            return;
        }
        window.backupReminderShownThisSession = true;
        const modal = document.getElementById('backup-reminder-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    function dismissBackupReminderPermanently() {
        localStorage.setItem('backupReminderDismissed', 'true');
        closeBackupReminder();
    }

    function closeBackupReminder() {
        const modal = document.getElementById('backup-reminder-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Make functions available globally
    window.acceptAgeAndTerms = acceptAgeAndTerms;
    window.openAgeAndTermsModal = openAgeAndTermsModal;
    window.openPrivacyModal = openPrivacyModal;
    window.closePrivacyModal = closePrivacyModal;
    window.showBackupReminder = showBackupReminder;
    window.closeBackupReminder = closeBackupReminder;
    window.dismissBackupReminderPermanently = dismissBackupReminderPermanently;

    // Export/Import functions
    window.openExportImportModal = openExportImportModal;
    window.closeExportImportModal = closeExportImportModal;
    window.exportSaveToClipboard = exportSaveToClipboard;
    window.exportSaveToFile = exportSaveToFile;
    window.importSaveFromText = importSaveFromText;
    window.importSaveFromFile = importSaveFromFile;

    // Hacking minigame functions
    window.initHackingMinigame = initHackingMinigame;
    window.closeHackingModal = closeHackingModal;
    window.dismissHackingNotification = dismissHackingNotification;

    // Test helper - set lifetime earnings for testing rugpull feature

    window.setTestEarnings = function(amount) {
        lifetimeEarnings = amount;
        sessionEarnings = amount;
        console.log('TEST: Set lifetimeEarnings to $' + amount.toLocaleString());
    };

    // Test function to set earnings to $1 billion and show rugpull modal
    window.test1Billion = function() {
        lifetimeEarnings = 1000000000;  // $1B
        dollarBalance = 1000000000;     // $1B cash too
        sessionEarnings = 1000000000;
        console.log('✓ TEST: Set earnings to $1,000,000,000');
        console.log('✓ Rugpull eligible! First rugpull reward: ~20 tokens');
        updateUI();
        // Auto-show rugpull modal
        if (typeof showRugpullOffer === 'function') {
            setTimeout(() => showRugpullOffer(), 500);
        }
    };

    // Debug function to check localStorage directly
    window.debugCheckSave = function() {
        const data = localStorage.getItem('satoshiTerminalSave');
        if (!data) {
            console.log('NO SAVE DATA IN LOCALSTORAGE');
            alert('No save data found in localStorage!');
            return;
        }
        try {
            const parsed = JSON.parse(data);
            console.log('=== LOCALSTORAGE CONTENTS ===');
            console.log('BTC Balance:', parsed.btcBalance);
            console.log('ETH Balance:', parsed.ethBalance);
            console.log('DOGE Balance:', parsed.dogeBalance);
            console.log('Dollar Balance:', parsed.dollarBalance);
            console.log('Hardware Equity:', parsed.hardwareEquity);
            console.log('Lifetime Earnings:', parsed.lifetimeEarnings);
            console.log('Full data:', parsed);
            alert('Check console for localStorage contents.\nBTC: ' + parsed.btcBalance + '\nETH: ' + parsed.ethBalance + '\nDOGE: ' + parsed.dogeBalance + '\n$: ' + parsed.dollarBalance);
        } catch(e) {
            console.error('Error parsing save:', e);
            alert('Error parsing save data: ' + e.message);
        }
    };

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeGame();
        });
    } else {
        initializeGame();
    }

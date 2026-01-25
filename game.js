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

    // Buy quantity setting
    let buyQuantity = 1;

    // Chart history tracking
    let chartHistory = [];
    let chartTimestamps = []; // Track when each data point was added
    let lastChartUpdateTime = Date.now();
    let chartStartTime = Date.now();

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

            if (Math.random() < (0.3 + distancePercent * 0.4)) {
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

            // 60% + up to 30% more chance to revert when far from target
            let newBtcPrice = oldBtcPrice * (1 + movePercent);
            if (Math.random() < (0.6 + distancePercent * 0.3)) {
                const targetPrice = 100000;
                const diff = targetPrice - oldBtcPrice;
                newBtcPrice = oldBtcPrice + (diff * 0.02);
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

            if (Math.random() < (0.3 + distancePercent * 0.4)) {
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

            let newEthPrice = oldEthPrice * (1 + movePercent);
            if (Math.random() < (0.6 + distancePercent * 0.3)) {
                const targetPrice = 3500;
                const diff = targetPrice - oldEthPrice;
                newEthPrice = oldEthPrice + (diff * 0.02);
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

            if (Math.random() < (0.3 + distancePercent * 0.4)) {
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

            let newDogePrice = oldDogePrice * (1 + movePercent * 1.5);
            if (Math.random() < (0.6 + distancePercent * 0.3)) {
                const targetPrice = 0.25;
                const diff = targetPrice - oldDogePrice;
                newDogePrice = oldDogePrice + (diff * 0.02);
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
	{ id: 0, name: "Manual Hash Rate", baseUsd: 5, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.00000050 },
        { id: 1, name: "USB Miner", baseUsd: 5, baseYield: 0.000000115 },
        { id: 2, name: "GTX 1660 Super", baseUsd: 100, baseYield: 0.0000007 },
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

    // Ethereum mining upgrades - Balanced by USD value per cost (price-adjusted)
    const ethUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 5, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.00002100 },
        { id: 1, name: "Single GPU Rig", baseUsd: 8, baseYield: 0.0000053 },
        { id: 2, name: "RTX 4090 Miner", baseUsd: 150, baseYield: 0.0000316 },
        { id: 3, name: "8-GPU Mining Rig", baseUsd: 4500, baseYield: 0.000684 },
        { id: 4, name: "Professional ETH Farm", baseUsd: 12000, baseYield: 0.00378 },
        { id: 5, name: "Staking Validator Node", baseUsd: 40000, baseYield: 0.0200 },
        { id: 6, name: "Multi-Validator Farm", baseUsd: 175000, baseYield: 0.143 },
        { id: 7, name: "ETH Mining Complex", baseUsd: 950000, baseYield: 2.0 },
        { id: 8, name: "Enterprise Staking Pool", baseUsd: 7500000, baseYield: 27.7 },
        { id: 9, name: "Layer 2 Validation Network", baseUsd: 52000000, baseYield: 258.0 },
        { id: 10, name: "Ethereum Foundation Node", baseUsd: 700000000, baseYield: 5570.0 },
        { id: 11, name: "Global Validator Consortium", baseUsd: 5000000000, baseYield: 40000.0 },
        { id: 12, name: "Sharding Supernetwork", baseUsd: 36000000000, baseYield: 290000.0 },
        { id: 13, name: "Zero-Knowledge Proof Farm", baseUsd: 260000000000, baseYield: 2100000.0 },
        { id: 14, name: "Interchain Bridge Network", baseUsd: 1900000000000, baseYield: 15000000.0 },
        { id: 15, name: "Ethereum 3.0 Genesis Node", baseUsd: 14000000000000, baseYield: 110000000.0 }
    ].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentYield: 0, boostCost: u.baseUsd * 0.5, boostLevel: 0 }));

    // Dogecoin mining upgrades - Balanced by USD value per cost (price-adjusted)
    // Formula: (btcYield × btcPrice × dogeCost) / (btcCost × dogePrice)
    const dogeUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 3, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.02 },
        { id: 1, name: "Basic Scrypt Miner", baseUsd: 3, baseYield: 4.60 },
        { id: 2, name: "L3+ ASIC Miner", baseUsd: 60, baseYield: 28.0 },
        { id: 3, name: "Mini DOGE Farm", baseUsd: 1800, baseYield: 600.0 },
        { id: 4, name: "Scrypt Mining Pool", baseUsd: 4500, baseYield: 3400.0 },
        { id: 5, name: "Industrial DOGE Facility", baseUsd: 18000, baseYield: 18000.0 },
        { id: 6, name: "DOGE Megafarm", baseUsd: 72000, baseYield: 128000.0 },
        { id: 7, name: "WOW Mining Complex", baseUsd: 450000, baseYield: 1800000.0 },
        { id: 8, name: "Moon Mining Station", baseUsd: 3400000, baseYield: 24800000.0 },
        { id: 9, name: "Interplanetary DOGE Network", baseUsd: 23000000, baseYield: 232000000.0 },
        { id: 10, name: "To The Moon Supercomputer", baseUsd: 320000000, baseYield: 5000000000.0 },
        { id: 11, name: "Mars Colony Mining Base", baseUsd: 2300000000, baseYield: 36000000000.0 },
        { id: 12, name: "Asteroid Belt DOGE Harvester", baseUsd: 16500000000, baseYield: 260000000000.0 },
        { id: 13, name: "Jovian Satellite Network", baseUsd: 120000000000, baseYield: 1900000000000.0 },
        { id: 14, name: "Solar System DOGE Grid", baseUsd: 870000000000, baseYield: 14000000000000.0 },
        { id: 15, name: "Intergalactic SHIBE Matrix", baseUsd: 6300000000000, baseYield: 100000000000000.0 }
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
            ascensionData: (typeof getAscensionData === 'function') ? getAscensionData() : {}
        };

        try {
            const saveString = JSON.stringify(gameState);
            console.log('=== ATTEMPTING SAVE ===');
            console.log('BTC Balance:', btcBalance);
            console.log('Dollar Balance:', dollarBalance);
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

        const offlineBtcEarnings = btcPerSec * cappedOfflineSeconds;
        const offlineEthEarnings = ethPerSec * cappedOfflineSeconds;
        const offlineDogeEarnings = dogePerSec * cappedOfflineSeconds;

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
            ascensionData: (typeof getAscensionData === 'function') ? getAscensionData() : {}
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
            if (typeof getPowerEfficiency === 'function') {
                const powerEfficiency = getPowerEfficiency();
                return Math.max(0, powerReq * (1 - powerEfficiency));
            }
            return powerReq;
        } catch (e) {
            return powerReq; // Return base requirement if functions unavailable
        }
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
            // Save ascension data BEFORE clearing (if rugpull system exists)
            const savedAscensionData = (typeof getAscensionData === 'function') ? getAscensionData() : null;

            localStorage.removeItem('satoshiTerminalSave');
            localStorage.removeItem('instructionsDismissed');
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
            // Reset skill tree
            resetSkillTree();

            // Restore ascension data AFTER reset
            if (savedAscensionData && typeof loadAscensionData === 'function') {
                loadAscensionData(savedAscensionData);
            }

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
        const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:var(--btc);font-weight:700;display:block;margin-top:3px" id="power-${u.id}">${effectivePower.toLocaleString()}W Consumed per level</span>` : '';

        btn.innerHTML = `
            <div style="text-align:left;flex:1">
                <div style="font-size:0.9rem;color:#f7931a;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="yield-${u.id}">+0 ₿/s - Current Speed</div>
                <div style="font-size:0.9rem;color:#f7931a;font-weight:700;display:block;margin-top:3px" id="increase-${u.id}">+0 ₿/s per level</div>
                ${powerDisplay}
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="usd-${u.id}">$${u.baseUsd.toLocaleString()}</span>
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
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="pow-usd-${u.id}">$${u.currentUsd.toLocaleString()}</span>
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
            const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-power-${u.id}">${effectivePower.toLocaleString()}W Consumed per level</span>` : '';

            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#627eea;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="eth-lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="eth-yield-${u.id}">+0 Ξ/s - Current Speed</div>
                    <div style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-increase-${u.id}">+0 Ξ/s per level</div>
                    ${powerDisplay}
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="eth-usd-${u.id}">$${u.baseUsd.toLocaleString()}</span>
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
            const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-power-${u.id}">${effectivePower.toLocaleString()}W Consumed per level</span>` : '';

            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#c2a633;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="doge-lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="doge-yield-${u.id}">+0 Ð/s - Current Speed</div>
                    <div style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-increase-${u.id}">+0 Ð/s per level</div>
                    ${powerDisplay}
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="doge-usd-${u.id}">$${u.baseUsd.toLocaleString()}</span>
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
        event.target.classList.add('active');

        // Reset purchase quantity to 1x when switching tabs
        setBuyQuantity(1);

        // Scroll to the tab content on mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                tabElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
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
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllBTC() {
        if (btcBalance <= 0) return;
        const saleValue = btcBalance * btcPrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        btcBalance = 0;
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
        const saleValue = amount * ethPrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllETH() {
        if (ethBalance <= 0) return;
        const saleValue = ethBalance * ethPrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        ethBalance = 0;
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
        const saleValue = amount * dogePrice * 0.95; // 5% fee
        dollarBalance += saleValue;
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllDOGE() {
        if (dogeBalance <= 0) return;
        dollarBalance += dogeBalance * dogePrice;
        dogeBalance = 0;
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

            updateUI();
            saveGame();
            playUpgradeSound();
        }
    }

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
            if (currentPowerEl) currentPowerEl.innerText = `+${u.currentPower.toLocaleString()}W - Current Power`;

            const powerEl = document.getElementById(`pow-power-${u.id}`);
            if (powerEl) powerEl.innerText = `+${u.basePower.toLocaleString()}W Produced per level`;

            const usdEl = document.getElementById(`pow-usd-${u.id}`);
            if (usdEl) usdEl.innerText = `$${u.currentUsd.toLocaleString()}`;

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

function manualHash() {
    // Apply skill tree click bonus
    const clickBonus = (typeof getClickBonus === 'function') ? getClickBonus() : 1;
    const actualClickValue = btcClickValue * clickBonus;

    // This adds your current click power to your spendable balance
    btcBalance += actualClickValue;

    // This ensures every manual click also increases your Lifetime Total
    btcLifetime += actualClickValue;

    // Track lifetime and session earnings in USD
    const usdValue = btcClickValue * btcPrice;
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
    const actualClickValue = ethClickValue * clickBonus;

    // Add ETH to balance
    ethBalance += actualClickValue;
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
    const actualClickValue = dogeClickValue * clickBonus;

    // Add DOGE to balance
    dogeBalance += actualClickValue;
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

        btcPerSec = upgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
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

        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
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

        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
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
            ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
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
            dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
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

        // Display session earnings (tracked directly from mining/staking)
        const sessionEarningEl = document.getElementById('session-earning');
        if (sessionEarningEl) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile && sessionEarnings >= 1000) {
                sessionEarningEl.innerText = '$' + (sessionEarnings / 1e6 >= 1 ? (sessionEarnings / 1e6).toFixed(1) + 'm' : sessionEarnings / 1e3 >= 1 ? (sessionEarnings / 1e3).toFixed(1) + 'k' : sessionEarnings.toFixed(2));
            } else {
                sessionEarningEl.innerText = '$' + sessionEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        }

        // Update lifetime earnings display (earnings are now tracked directly when crypto is mined/staked)
        const lifetimeEarningEl = document.getElementById('lifetime-earning');
        if (lifetimeEarningEl) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile && lifetimeEarnings >= 1000) {
                lifetimeEarningEl.innerText = '$' + (lifetimeEarnings / 1e6 >= 1 ? (lifetimeEarnings / 1e6).toFixed(1) + 'm' : lifetimeEarnings / 1e3 >= 1 ? (lifetimeEarnings / 1e3).toFixed(1) + 'k' : lifetimeEarnings.toFixed(2));
            } else {
                lifetimeEarningEl.innerText = '$' + lifetimeEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        }
    }

    // Helper function to abbreviate large numbers only on mobile
    function formatNumberForDisplay(num) {
        // Check if viewport is mobile (max-width: 768px)
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
            return Math.floor(num).toLocaleString();
        }

        // Mobile abbreviation: 1k, 1m, 1b, etc
        const abs = Math.abs(num);
        if (abs >= 1e9) {
            return (num / 1e9).toFixed(1) + 'b';
        } else if (abs >= 1e6) {
            return (num / 1e6).toFixed(1) + 'm';
        } else if (abs >= 1e3) {
            return (num / 1e3).toFixed(1) + 'k';
        }
        return Math.floor(num).toLocaleString();
    }

    function updateUI() {
        // Crypto portfolio value = value of all crypto holdings only
        let cryptoPortfolioValue = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);
        const isMobileUI = window.innerWidth <= 768;
        if (isMobileUI && cryptoPortfolioValue >= 1000) {
            const abbrev = cryptoPortfolioValue / 1e9 >= 1 ? (cryptoPortfolioValue / 1e9).toFixed(1) + 'b' : cryptoPortfolioValue / 1e6 >= 1 ? (cryptoPortfolioValue / 1e6).toFixed(1) + 'm' : (cryptoPortfolioValue / 1e3).toFixed(1) + 'k';
            document.getElementById('nw-val').innerText = "$" + abbrev;
        } else {
            document.getElementById('nw-val').innerText = "$" + cryptoPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2});
        }

        // Update balances
        document.getElementById('bal-btc').innerText = btcBalance.toFixed(8);
        document.getElementById('bal-eth').innerText = ethBalance.toFixed(8);
        document.getElementById('bal-doge').innerText = dogeBalance.toFixed(8);

        // Update manual hash button text
        const mineBtnSpan = document.querySelector('.mine-btn span');
        if (mineBtnSpan) {
            mineBtnSpan.innerText = `+${btcClickValue.toFixed(8)} ₿`;
        }
        const ethMineBtnSpan = document.querySelectorAll('.mine-btn span')[1];
        if (ethMineBtnSpan) {
            ethMineBtnSpan.innerText = `+${ethClickValue.toFixed(8)} Ξ`;
        }
        const dogeMineBtnSpan = document.querySelectorAll('.mine-btn span')[2];
        if (dogeMineBtnSpan) {
            dogeMineBtnSpan.innerText = `+${dogeClickValue.toFixed(8)} Ð`;
        }

        // Update hardware equity
        let hardwareEquityDisplay = "$" + Math.floor(hardwareEquity).toLocaleString();
        if (isMobileUI && hardwareEquity >= 1000) {
            hardwareEquityDisplay = "$" + (hardwareEquity / 1e9 >= 1 ? (hardwareEquity / 1e9).toFixed(1) + 'b' : hardwareEquity / 1e6 >= 1 ? (hardwareEquity / 1e6).toFixed(1) + 'm' : (hardwareEquity / 1e3).toFixed(1) + 'k');
        }
        document.getElementById('asset-usd').innerText = hardwareEquityDisplay;

        // Update individual hashrate displays (old location - keep for backwards compatibility)
        const btcEl = document.getElementById('yield-btc');
        const ethEl = document.getElementById('yield-eth');
        const dogeEl = document.getElementById('yield-doge');

        if (btcEl) btcEl.innerText = btcPerSec.toFixed(8) + "/s";
        if (ethEl) ethEl.innerText = ethPerSec.toFixed(8) + "/s";
        if (dogeEl) dogeEl.innerText = dogePerSec.toFixed(8) + "/s";

        // Update hashrate displays in new location
        const btcDisplayEl = document.getElementById('yield-btc-display');
        const ethDisplayEl = document.getElementById('yield-eth-display');
        const dogeDisplayEl = document.getElementById('yield-doge-display');

        if (btcDisplayEl) btcDisplayEl.innerText = btcPerSec.toFixed(8) + "/s";
        if (ethDisplayEl) ethDisplayEl.innerText = ethPerSec.toFixed(8) + "/s";
        if (dogeDisplayEl) dogeDisplayEl.innerText = dogePerSec.toFixed(8) + "/s";

        // Update prices
        document.getElementById('btc-price').innerText = "$" + Math.floor(btcPrice).toLocaleString();
        document.getElementById('eth-price').innerText = "$" + Math.floor(ethPrice).toLocaleString();
        document.getElementById('doge-price').innerText = "$" + dogePrice.toFixed(4);

        // Update dollar balance
        const dollarBalanceEl = document.getElementById('dollar-balance');
        if (dollarBalanceEl) dollarBalanceEl.innerText = "$" + formatNumberForDisplay(dollarBalance);

        // Update market prices
        const marketBtcPrice = document.getElementById('market-btc-price');
        const marketEthPrice = document.getElementById('market-eth-price');
        const marketDogePrice = document.getElementById('market-doge-price');
        if (marketBtcPrice) marketBtcPrice.innerText = Math.floor(btcPrice).toLocaleString();
        if (marketEthPrice) marketEthPrice.innerText = Math.floor(ethPrice).toLocaleString();
        if (marketDogePrice) marketDogePrice.innerText = dogePrice.toFixed(4);

        // Update session stats
        updateSessionStats();

        // Update power display
        calculateTotalPowerUsed();
        updatePowerDisplay();

        btcUpgrades.forEach(u => {
    const costUsd = u.currentUsd;
    const yEl = document.getElementById(`yield-${u.id}`);

    if (yEl) {
        if (u.isClickUpgrade) {
            yEl.innerText = `+10% MANUAL HASH RATE`;
        } else {
            // Show the current speed WITH skill bonuses applied
            const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            const currentSpeed = baseSpeed * (1 + miningBonus + btcBonus);
            yEl.innerText = `+${currentSpeed.toFixed(8)} ₿/s - Current Speed`;
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
            const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
            const perLevelIncrease = baseIncrease * (1 + miningBonus + btcBonus);
            increaseEl.innerText = `+${perLevelIncrease.toFixed(8)} ₿/s per level`;
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
        uEl.innerText = `$${Math.floor(displayCost).toLocaleString()}`;
    }

    // Update power display with effective consumption after skills
    const powerEl = document.getElementById(`power-${u.id}`);
    if(powerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            powerEl.innerText = `${effectivePower.toLocaleString()}W Consumed per level`;
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
            // Show the current speed WITH skill bonuses applied
            const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            const currentSpeed = baseSpeed * (1 + miningBonus + ethBonus);
            yEl.innerText = `+${currentSpeed.toFixed(8)} Ξ/s - Current Speed`;
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
            const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
            const perLevelIncrease = baseIncrease * (1 + miningBonus + ethBonus);
            ethIncreaseEl.innerText = `+${perLevelIncrease.toFixed(8)} Ξ/s per level`;
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
        uEl.innerText = `$${Math.floor(displayCost).toLocaleString()}`;
    }

    // Update power display with effective consumption after skills
    const ethPowerEl = document.getElementById(`eth-power-${u.id}`);
    if(ethPowerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            ethPowerEl.innerText = `${effectivePower.toLocaleString()}W Consumed per level`;
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
            // Show the current speed WITH skill bonuses applied
            const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
            const currentSpeed = baseSpeed * (1 + miningBonus + dogeBonus);
            yEl.innerText = `+${currentSpeed.toFixed(8)} Ð/s - Current Speed`;
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
            const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
            const perLevelIncrease = baseIncrease * (1 + miningBonus + dogeBonus);
            dogeIncreaseEl.innerText = `+${perLevelIncrease.toFixed(8)} Ð/s per level`;
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
        uEl.innerText = `$${Math.floor(displayCost).toLocaleString()}`;
    }

    // Update power display with effective consumption after skills
    const dogePowerEl = document.getElementById(`doge-power-${u.id}`);
    if(dogePowerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            dogePowerEl.innerText = `${effectivePower.toLocaleString()}W Consumed per level`;
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
                overlay.style.background = 'rgba(0,0,0,0.8)';
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
    }

    setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - lastTickTime) / 1000;
        lastTickTime = now;

        // Get skill tree mining bonus
        const miningBonus = (typeof getSkillBonus === 'function') ? (1 + getSkillBonus('mining_speed')) : 1;

        // BTC mining gains
        if (btcPerSec > 0) {
            let gain = btcPerSec * deltaTime * miningBonus;
            let usdValue = gain * btcPrice;
            btcBalance += gain;
            btcLifetime += gain;
            lifetimeEarnings += usdValue; // Track USD value of mined BTC
            sessionEarnings += usdValue; // Track session earnings
        }

        // ETH mining gains
        if (ethPerSec > 0) {
            let gain = ethPerSec * deltaTime * miningBonus;
            let usdValue = gain * ethPrice;
            ethBalance += gain;
            ethLifetime += gain;
            lifetimeEarnings += usdValue; // Track USD value of mined ETH
            sessionEarnings += usdValue; // Track session earnings
        }

        // DOGE mining gains
        if (dogePerSec > 0) {
            let gain = dogePerSec * deltaTime * miningBonus;
            let usdValue = gain * dogePrice;
            dogeBalance += gain;
            dogeLifetime += gain;
            lifetimeEarnings += usdValue; // Track USD value of mined DOGE
            sessionEarnings += usdValue; // Track session earnings
        }

        updateUI();
        updateAutoClickerButtonState();

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
        loadGame(); // This calls updateUI() internally
        updateAutoClickerButtonState(); // Update button state immediately after loading
        setBuyQuantity(1); // Highlight the 1x button on page load

        // Initialize staking system
        initStaking();
        updateStakingUI();

        // Show instructions modal if not dismissed
        if (localStorage.getItem('instructionsDismissed') !== 'true') {
            const instructionsEl = document.getElementById('game-instructions');
            if (instructionsEl) {
                instructionsEl.style.display = 'flex';
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
            }, 500);
        } else {
            console.log('✗ No offline earnings data - modal will not show');
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
                                    if (value >= 1000) {
                                        return '$' + (value / 1000).toFixed(2) + 'k';
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

    // Make functions available globally
    window.acceptAgeAndTerms = acceptAgeAndTerms;
    window.openAgeAndTermsModal = openAgeAndTermsModal;
    window.openPrivacyModal = openPrivacyModal;
    window.closePrivacyModal = closePrivacyModal;

    // Export/Import functions
    window.openExportImportModal = openExportImportModal;
    window.closeExportImportModal = closeExportImportModal;
    window.exportSaveToClipboard = exportSaveToClipboard;
    window.exportSaveToFile = exportSaveToFile;
    window.importSaveFromText = importSaveFromText;
    window.importSaveFromFile = importSaveFromFile;

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

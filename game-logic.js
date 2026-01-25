/**
 * GAME LOGIC MODULE
 *
 * This file contains all core game logic, state management, and gameplay functions.
 *
 * IMPORTANT: This file requires data.js to be loaded first (for btcUpgrades, ethUpgrades, dogeUpgrades arrays).
 * Load order in HTML:
 * 1. data.js (upgrade definitions)
 * 2. game-logic.js (this file)
 * 3. ui.js (UI rendering functions)
 * 4. Additional modules (staking.js, skills.js, etc.)
 */

// ============================================================================
// GAME STATE VARIABLES
// ============================================================================

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
// Note: powerUpgrades and equipmentPowerReqs are now loaded from data.js
let totalPowerAvailable = 0; // Total watts available
let totalPowerUsed = 0; // Total watts being used

// ============================================================================
// PRICE SWING FUNCTIONS
// ============================================================================

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

// ============================================================================
// SOUND FUNCTIONS
// ============================================================================

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

// Sound mute toggle
let isMuted = false;
function toggleMute() {
    isMuted = !isMuted;
    const btn = document.getElementById('mute-btn');
    if (btn) {
        btn.innerText = isMuted ? 'SOUND OFF' : 'SOUND ON';
    }
}

// ============================================================================
// SAVE/LOAD SYSTEM
// ============================================================================

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
        }))
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

        // Calculate total power used
        calculateTotalPowerUsed();

        // Recalculate totals for all cryptos
        btcPerSec = btcUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);

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

// ============================================================================
// EXPORT/IMPORT SYSTEM
// ============================================================================

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
        }))
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

// ============================================================================
// POWER CALCULATION FUNCTIONS
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

// ============================================================================
// PURCHASE FUNCTIONS
// ============================================================================

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

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

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

// ============================================================================
// SESSION STATS
// ============================================================================

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

// ============================================================================
// GAME LOOP AND INITIALIZATION
// ============================================================================

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

    // ===== CHART INITIALIZATION =====
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

    // Chart update interval - updates every 2 seconds
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

// ============================================================================
// MAIN GAME LOOP - Runs every 100ms to process mining and update UI
// ============================================================================

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
}, 100);

// ============================================================================
// EVENT LISTENERS
// ============================================================================

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

// ============================================================================
// DEBUG FUNCTIONS
// ============================================================================

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

// ============================================================================
// DOM READY TRIGGER
// ============================================================================

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeGame();
    });
} else {
    initializeGame();
}

// ============================================================================
// EXPORT FUNCTIONS TO WINDOW SCOPE
// ============================================================================

// Make functions available globally for HTML onclick handlers
window.openExportImportModal = openExportImportModal;
window.closeExportImportModal = closeExportImportModal;
window.exportSaveToClipboard = exportSaveToClipboard;
window.exportSaveToFile = exportSaveToFile;
window.importSaveFromText = importSaveFromText;
window.importSaveFromFile = importSaveFromFile;
window.dismissInstructions = dismissInstructions;
window.resetEarningsStats = resetEarningsStats;
window.resetGame = resetGame;
window.toggleMute = toggleMute;
window.startAutoClicker = startAutoClicker;
window.setBuyQuantity = setBuyQuantity;
window.sellBTC = sellBTC;
window.sellAllBTC = sellAllBTC;
window.sellETH = sellETH;
window.sellAllETH = sellAllETH;
window.sellDOGE = sellDOGE;
window.sellAllDOGE = sellAllDOGE;
window.buyPowerUpgrade = buyPowerUpgrade;
window.manualHash = manualHash;
window.manualEthHash = manualEthHash;
window.manualDogeHash = manualDogeHash;
window.buyLevel = buyLevel;
window.buyLevelMultiple = buyLevelMultiple;
window.buyBoost = buyBoost;
window.buyEthLevel = buyEthLevel;
window.buyEthBoost = buyEthBoost;
window.buyDogeLevel = buyDogeLevel;
window.buyDogeBoost = buyDogeBoost;
window.debugCheckSave = debugCheckSave;

// RUGPULL / ASCENSION SYSTEM
// Cookie Clicker-style ascending system with permanent meta-upgrades
// Players sacrifice current progress for permanent bonuses

// ==============================================
// STATE VARIABLES
// ==============================================

let ascensionLevel = 0;              // Total number of times the player has ascended
let rugpullCurrency = 0;             // "Corrupt Tokens" - earned through ascension
let lastShownMilestoneEarnings = 0;  // Track which $1M milestone popup was shown
let rugpullButtonListenersAttached = false;  // Flag to prevent duplicate event listeners
let ascensionStats = {
    totalRunsCompleted: 0,           // Total times player has reset
    currencyEarned: 0,               // Lifetime total of earned currency
    bestRunEarnings: 0,              // Highest $ earned in a single run
    totalGlobalBonus: 0              // Sum of all purchased bonuses
};

// Meta-upgrades purchased by the player (persists across resets)
let metaUpgrades = {
    mining_speed_5: { purchased: false, cost: 1 },       // +5% mining speed - first upgrade
    starter_miners: { purchased: false, cost: 1 },       // Start with 1 of each basic miner - first upgrade
    mining_speed_10: { purchased: false, cost: 1 },      // +10% mining speed
    auto_buy_basic: { purchased: false, cost: 1 },       // Auto-buy basic miners when affordable
    power_efficiency: { purchased: false, cost: 1 },     // 20% better power efficiency
    offline_boost: { purchased: false, cost: 2 },        // 2x offline earnings
    mining_speed_25: { purchased: false, cost: 2 },      // +25% mining speed
    advanced_quantum: { purchased: false, cost: 3 },     // Unlock quantum miners at start
    mining_speed_50: { purchased: false, cost: 4 },      // +50% mining speed
    prestige_tokens: { purchased: false, cost: 5 }       // +1% per token spent lifetime
};

// Unlocked systems (unlock new content after ascensions)
let unlockedSystems = {
    basicAscension: true,            // Available from start
    advancedMetaUpgrades: false,     // Unlock after 3 ascensions
    quantumBranch: false,            // Unlock after 5 ascensions
    infinityGates: false             // Unlock after 10 ascensions
};

// ==============================================
// CORE FUNCTIONS
// ==============================================

/**
 * Calculate the reward (Corrupt Tokens) for ascending
 * Based on: lifetime earnings, current cash, ascension bonus
 */
function calculateRugpullReward() {
    // Base reward from lifetime earnings and current balance
    const baseFromEarnings = Math.floor(lifetimeEarnings / 1000000);  // 1 token per $1M earned
    const baseFromCash = Math.floor(dollarBalance / 100000);         // 1 token per $100k cash
    const baseReward = baseFromEarnings + baseFromCash;

    // Bonus for higher ascension level (5% more each time)
    const ascensionBonus = 1 + (ascensionLevel * 0.05);

    // Minimum 1 token even if poor
    return Math.max(1, Math.floor(baseReward * ascensionBonus));
}

/**
 * Show the rugpull confirmation modal
 */
function showRugpullOffer() {
    // Calculate token breakdown
    const baseFromEarnings = Math.floor(lifetimeEarnings / 1000000);
    const baseFromCash = Math.floor(dollarBalance / 100000);
    const baseReward = baseFromEarnings + baseFromCash;
    const ascensionBonus = 1 + (ascensionLevel * 0.05);
    const reward = Math.max(1, Math.floor(baseReward * ascensionBonus));

    const starterCash = 1500 + (ascensionLevel * 500);

    // Create modal instead of using confirm()
    const modal = document.getElementById('rugpull-milestone-modal');
    const modalText = document.getElementById('milestone-modal-text');
    const confirmBtn = document.getElementById('milestone-confirm-btn');

    if (modal && modalText && confirmBtn) {
        modalText.innerHTML = `
            <div style="color: #ffeb3b; font-size: 1.2rem; font-weight: bold; margin-bottom: 15px;">🔓 HARD FORK DETECTED</div>
            <div style="color: #fff; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.8;">
                <div style="color: #ccc; margin-bottom: 15px;">Current Progress:</div>
                <div style="margin-bottom: 10px;">
                    • Lifetime Earnings: <span style="color: #4CAF50; font-weight: bold;">$${lifetimeEarnings.toLocaleString()}</span><br>
                    • Current Cash: <span style="color: #4CAF50; font-weight: bold;">$${dollarBalance.toLocaleString()}</span><br>
                    • Ascensions Completed: <span style="color: #4CAF50; font-weight: bold;">${ascensionLevel}</span>
                </div>
                <div style="border-top: 1px solid #555; padding-top: 15px; margin-top: 15px;">
                    <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 10px;">TOKEN CALCULATION:</div>
                    <div style="margin-bottom: 15px; color: #ddd; font-size: 0.85rem;">
                        • $${lifetimeEarnings.toLocaleString()} ÷ $1M = <span style="color: #4CAF50;">${baseFromEarnings}</span> tokens<br>
                        • $${dollarBalance.toLocaleString()} ÷ $100k = <span style="color: #4CAF50;">${baseFromCash}</span> tokens<br>
                        • Base Reward: <span style="color: #4CAF50;">${baseReward}</span> tokens<br>
                        • Ascension Bonus (${ascensionLevel > 0 ? '+' + (ascensionLevel * 5) + '%' : 'N/A'}): <span style="color: #4CAF50;">×${ascensionBonus.toFixed(2)}</span><br>
                        <span style="border-top: 1px solid #555; padding-top: 10px; margin-top: 10px; display: block;">
                            <span style="color: #ffeb3b; font-weight: bold;">TOTAL: ${reward} Corrupt Tokens</span>
                        </span>
                    </div>
                </div>
                <div style="border-top: 1px solid #555; padding-top: 15px; margin-top: 15px;">
                    <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 10px;">RUGPULL REWARDS:</div>
                    <div style="margin-bottom: 10px;">
                        • Earn <span style="color: #ffeb3b; font-weight: bold;">${reward} Corrupt Tokens</span><br>
                        • Start with <span style="color: #ffeb3b; font-weight: bold;">$${starterCash}</span> cash<br>
                        • +2x mining speed bonus <span style="color: #ffeb3b;">(${2 + ascensionLevel * 2}x total)</span><br>
                        • +2x manual hash bonus <span style="color: #ffeb3b;">(${2 + ascensionLevel * 2}x total)</span><br>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 8px;">💡 Bonuses stack additively: each ascension adds +2x</div>
                    </div>
                    <div style="border-top: 1px solid #555; padding-top: 10px; margin-top: 10px; color: #ccc; font-size: 0.85rem;">
                        This will:<br>
                        ✗ Reset all coins and miners<br>
                        ✗ Clear all upgrades<br>
                        ✗ Reset production speed<br>
                        ✓ Keep all meta-upgrades<br>
                        ✓ Maintain permanent bonuses
                    </div>
                </div>
            </div>
        `;

        // Update button to confirm
        confirmBtn.textContent = 'RUGPULL NOW';
        confirmBtn.onclick = function() {
            executeRugpull(reward);
        };

        modal.style.display = 'flex';
    }
}

/**
 * Execute the rugpull ascension
 */
function executeRugpull(reward) {
    // Prevent execution during import
    importInProgress = true;

    // Close any open modals immediately
    closeRugpullMilestoneModal();

    // Award the currency
    rugpullCurrency += reward;
    ascensionStats.currencyEarned += reward;
    ascensionStats.totalRunsCompleted++;
    if (dollarBalance > ascensionStats.bestRunEarnings) {
        ascensionStats.bestRunEarnings = dollarBalance;
    }

    // Reset the game (this will preserve ascensionData through modified resetGame)
    // Save ascension data before reset
    const savedAscensionData = {
        ascensionLevel: ascensionLevel + 1,
        rugpullCurrency: rugpullCurrency,
        metaUpgrades: JSON.parse(JSON.stringify(metaUpgrades)),
        ascensionStats: JSON.parse(JSON.stringify(ascensionStats)),
        unlockedSystems: JSON.parse(JSON.stringify(unlockedSystems))
    };

    // Clear localStorage but prepare to restore ascension data
    localStorage.removeItem('satoshiTerminalSave');
    localStorage.removeItem('instructionsDismissed');

    // Reset ALL game state
    resetGameState();

    // Restore ascension data
    ascensionLevel = savedAscensionData.ascensionLevel;
    rugpullCurrency = savedAscensionData.rugpullCurrency;
    metaUpgrades = savedAscensionData.metaUpgrades;
    ascensionStats = savedAscensionData.ascensionStats;
    unlockedSystems = savedAscensionData.unlockedSystems;

    // Reset milestone tracker so next $1M milestone will trigger popup
    lastShownMilestoneEarnings = 0;

    // Initialize new run with bonuses
    initializeNewRun();

    // Unlock systems based on ascension level
    unlockSystems();

    // Save and update UI
    importInProgress = false;
    saveGame();
    updateUI();
    updateStakingUI();

    // Show success message as modal
    showRugpullCompleteModal(reward);

    // Open meta-upgrades modal so player can spend tokens immediately
    setTimeout(() => {
        closeRugpullCompleteModal();
        openMetaUpgradesModal();
    }, 3000);

    // Don't reload - keep modals visible for player to interact with store
    // setTimeout(() => {
    //     window.location.reload(true);
    // }, 3000);
}

/**
 * Reset core game state (helper for rugpull)
 * Resets coins, miners, upgrades - but preserves ascension data
 */
function resetGameState() {
    // Reset balances
    btcBalance = 0;
    btcLifetime = 0;
    btcPerSec = 0;
    btcClickValue = 0.00000250;
    btcPrice = 100000;

    ethBalance = 0;
    ethLifetime = 0;
    ethPerSec = 0;
    ethClickValue = 0.00007143;
    ethPrice = 3500;

    dogeBalance = 0;
    dogeLifetime = 0;
    dogePerSec = 0;
    dogeClickValue = 1.00000000;
    dogePrice = 0.25;

    dollarBalance = 0;
    hardwareEquity = 0;
    sessionEarnings = 0;
    lifetimeEarnings = 0;

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
        u.boostCost = u.baseUsd * 0.5;
        u.boostLevel = 0;
    });

    ethUpgrades.forEach(u => {
        u.level = 0;
        u.currentUsd = u.baseUsd;
        u.currentYield = 0;
        u.boostCost = u.baseUsd * 0.5;
        u.boostLevel = 0;
    });

    dogeUpgrades.forEach(u => {
        u.level = 0;
        u.currentUsd = u.baseUsd;
        u.currentYield = 0;
        u.boostCost = u.baseUsd * 0.5;
        u.boostLevel = 0;
    });

    // Reset staking
    stakedBTC = 0;
    stakedETH = 0;
    stakedDOGE = 0;

    // Reset session tracking
    sessionStartTime = Date.now();
    sessionStartBalance = 0;
    sessionStartNetWorth = 0;

    // Reset chart
    chartHistory = [];
    chartTimestamps = [];
    chartStartTime = Date.now();
}

/**
 * Initialize a new run with ascension bonuses
 */
function initializeNewRun() {
    let startingCash = 1000;  // Starting cash for new run

    // Add cash bonus from ascension level
    startingCash += ascensionLevel * 500;
    dollarBalance = startingCash;

    // Give starter miners if purchased
    if (metaUpgrades.starter_miners.purchased) {
        // Give 1 of each basic mining upgrade
        btcUpgrades[1].level = 1;
        btcUpgrades[1].currentYield = btcUpgrades[1].baseYield;
        btcUpgrades[1].currentUsd = btcUpgrades[1].baseUsd * Math.pow(1.12, 1);

        ethUpgrades[1].level = 1;
        ethUpgrades[1].currentYield = ethUpgrades[1].baseYield;
        ethUpgrades[1].currentUsd = ethUpgrades[1].baseUsd * Math.pow(1.12, 1);

        dogeUpgrades[1].level = 1;
        dogeUpgrades[1].currentYield = dogeUpgrades[1].baseYield;
        dogeUpgrades[1].currentUsd = dogeUpgrades[1].baseUsd * Math.pow(1.12, 1);

        // Recalculate per-second rates WITH ascension bonuses stacking
        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        btcPerSec = btcUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
    }

    // Apply power bonuses
    if (metaUpgrades.power_efficiency.purchased) {
        totalPowerAvailable = powerUpgrades[0].basePower * 1.2;  // Start with bonus power
    } else {
        totalPowerAvailable = powerUpgrades[0].basePower;
    }

    // Apply offline boost
    if (metaUpgrades.offline_boost.purchased) {
        // This will be handled in the offline earnings calculation
    }

    // Enable auto-buy if purchased
    // (This will be handled by autoBuy system integration)
}

/**
 * Unlock systems based on ascension level
 */
function unlockSystems() {
    if (ascensionLevel >= 3) {
        unlockedSystems.advancedMetaUpgrades = true;
    }
    if (ascensionLevel >= 5) {
        unlockedSystems.quantumBranch = true;
    }
    if (ascensionLevel >= 10) {
        unlockedSystems.infinityGates = true;
    }
}

/**
 * Purchase a meta-upgrade with Corrupt Tokens
 */
function purchaseMetaUpgrade(upgradeKey) {
    if (!metaUpgrades[upgradeKey]) {
        console.error('Invalid upgrade:', upgradeKey);
        return;
    }

    const upgrade = metaUpgrades[upgradeKey];
    if (upgrade.purchased) {
        showGenericMessageModal('Already Purchased', `<div style="color: #ff9800;">You already own this upgrade!</div>`);
        return;
    }

    if (rugpullCurrency < upgrade.cost) {
        showGenericMessageModal('Not Enough Tokens', `
            <div>Not enough Corrupt Tokens!</div>
            <div style="margin-top: 10px; color: #ffeb3b;">
                Need: <span style="font-weight: bold;">${upgrade.cost}</span><br>
                Have: <span style="font-weight: bold;">${rugpullCurrency}</span>
            </div>
        `);
        return;
    }

    // Purchase the upgrade
    rugpullCurrency -= upgrade.cost;
    upgrade.purchased = true;
    ascensionStats.totalGlobalBonus += (upgrade.cost / 100);  // Rough bonus tracking

    // Apply permanent effect if applicable
    applyMetaUpgradeEffect(upgradeKey);

    // Save and update UI
    saveGame();
    updateMetaUpgradesUI();
    showGenericMessageModal('Purchase Successful', `
        <div style="color: #4CAF50; font-weight: bold; font-size: 1.1rem;">✓ Purchased</div>
        <div style="margin-top: 10px; color: #fff;">${getUpgradeName(upgradeKey)}</div>
    `);
}

/**
 * Apply the permanent effect of a meta-upgrade
 */
function applyMetaUpgradeEffect(upgradeKey) {
    switch(upgradeKey) {
        case 'mining_speed_5':
        case 'mining_speed_10':
        case 'mining_speed_25':
        case 'mining_speed_50':
            // These apply automatically via getAscensionMiningBonus()
            break;
        case 'starter_miners':
            // Applied on new run init
            break;
        case 'power_efficiency':
            // Applied on new run init and in calculateTotalPowerUsed
            break;
        case 'offline_boost':
            // Applied in offline earnings calculation
            break;
        case 'advanced_quantum':
            // Unlock quantum miners at start of run
            break;
        case 'prestige_tokens':
            // Passive bonus applied in calculations
            break;
    }
}

/**
 * Get the current global mining bonus from ascension meta-upgrades
 */
function getAscensionMiningBonus() {
    let bonus = 0;

    // Built-in 2x bonus for completing first ascension
    if (ascensionLevel > 0) {
        bonus = 1.0;  // 100% = 2x total speed
    }

    // Additional bonuses from purchased upgrades
    if (metaUpgrades.mining_speed_5.purchased) bonus += 0.05;
    if (metaUpgrades.mining_speed_10.purchased) bonus += 0.10;
    if (metaUpgrades.mining_speed_25.purchased) bonus += 0.25;
    if (metaUpgrades.mining_speed_50.purchased) bonus += 0.50;

    // Prestige token bonus: 1% per token ever spent
    if (metaUpgrades.prestige_tokens.purchased) {
        bonus += ascensionStats.totalGlobalBonus * 0.01;
    }

    return bonus;
}

/**
 * Get friendly name for upgrade key
 */
function getUpgradeName(upgradeKey) {
    const names = {
        'mining_speed_5': '+5% Mining Speed',
        'mining_speed_10': '+10% Mining Speed',
        'mining_speed_25': '+25% Mining Speed',
        'mining_speed_50': '+50% Mining Speed',
        'starter_miners': 'Start with 1 Basic Miner (BTC, ETH, DOGE)',
        'auto_buy_basic': 'Auto-Buy Basic Upgrades',
        'power_efficiency': '+20% Power Efficiency',
        'offline_boost': '2x Offline Earnings',
        'advanced_quantum': 'Start with Quantum Tech',
        'prestige_tokens': '+1% per Token Spent'
    };
    return names[upgradeKey] || upgradeKey;
}

/**
 * Update meta-upgrades UI (called after purchase or load)
 */
function updateMetaUpgradesUI() {
    const container = document.getElementById('meta-upgrades-container');
    if (!container) return;

    container.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = `🔴 RUGPULL META UPGRADES | Corrupt Tokens: ${rugpullCurrency}`;
    title.style.color = '#ff00ff';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    container.appendChild(title);

    // Display current bonuses
    const totalMiningBonus = 2 + (ascensionLevel * 2);
    const totalClickBonus = 2 + (ascensionLevel * 2);

    const bonusesDiv = document.createElement('div');
    bonusesDiv.style.background = '#1a2e2e';
    bonusesDiv.style.border = '2px solid #4CAF50';
    bonusesDiv.style.borderRadius = '6px';
    bonusesDiv.style.padding = '15px';
    bonusesDiv.style.marginBottom = '20px';
    bonusesDiv.style.textAlign = 'center';
    bonusesDiv.style.color = '#fff';

    let bonusText = `<div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">YOUR CURRENT BONUSES</div>`;
    bonusText += `<div style="font-size: 0.9rem; line-height: 1.8;">`;
    bonusText += `🔷 Ascensions: <span style="color: #ffeb3b; font-weight: bold;">${ascensionLevel}</span><br>`;
    bonusText += `⚡ Mining Speed: <span style="color: #ffeb3b; font-weight: bold;">${totalMiningBonus}x</span> (base ${2} + ${ascensionLevel}×${2})<br>`;
    bonusText += `🖱️ Manual Hash: <span style="color: #ffeb3b; font-weight: bold;">${totalClickBonus}x</span> (base ${2} + ${ascensionLevel}×${2})<br>`;
    bonusText += `</div>`;
    bonusesDiv.innerHTML = bonusText;
    container.appendChild(bonusesDiv);

    // Group upgrades by tier
    const tiers = [
        { name: 'Tier 1 (Basic)', upgrades: ['mining_speed_5', 'starter_miners'] },
        { name: 'Tier 2 (Advanced)', upgrades: ['mining_speed_10', 'auto_buy_basic', 'power_efficiency'] },
        { name: 'Tier 3 (Expert)', upgrades: ['mining_speed_25', 'offline_boost', 'mining_speed_50'] },
        { name: 'Tier 4 (Prestige)', upgrades: ['advanced_quantum', 'prestige_tokens'] }
    ];

    tiers.forEach(tier => {
        if (tier.upgrades.length === 0) return;

        const tierDiv = document.createElement('div');
        tierDiv.style.marginBottom = '20px';

        const tierTitle = document.createElement('h4');
        tierTitle.textContent = tier.name;
        tierTitle.style.color = '#00ff88';
        tierTitle.style.marginBottom = '10px';
        tierDiv.appendChild(tierTitle);

        tier.upgrades.forEach(upgradeKey => {
            if (!metaUpgrades[upgradeKey]) return;

            const upgrade = metaUpgrades[upgradeKey];
            const btn = document.createElement('button');
            btn.className = 'meta-upgrade-btn';
            btn.style.display = 'block';
            btn.style.width = '100%';
            btn.style.padding = '10px';
            btn.style.marginBottom = '8px';
            btn.style.border = '2px solid #ff00ff';
            btn.style.borderRadius = '6px';
            btn.style.background = upgrade.purchased ? '#333333' : '#1a1a2e';
            btn.style.color = upgrade.purchased ? '#888888' : '#ffffff';
            btn.style.cursor = upgrade.purchased ? 'default' : 'pointer';
            btn.style.fontWeight = 'bold';

            const name = getUpgradeName(upgradeKey);
            const status = upgrade.purchased ? '✓ OWNED' : `💎 ${upgrade.cost}`;
            btn.innerHTML = `${name}<br><small>${status}</small>`;

            if (!upgrade.purchased) {
                btn.onclick = () => purchaseMetaUpgrade(upgradeKey);
                btn.onmouseover = () => btn.style.background = '#2a2a4e';
                btn.onmouseout = () => btn.style.background = '#1a1a2e';
            }

            tierDiv.appendChild(btn);
        });

        container.appendChild(tierDiv);
    });
}

/**
 * Get ascension data for saving/loading
 */
function getAscensionData() {
    return {
        ascensionLevel,
        rugpullCurrency,
        lastShownMilestoneEarnings,
        ascensionStats,
        metaUpgrades,
        unlockedSystems
    };
}

/**
 * Load ascension data from save
 */
function loadAscensionData(data) {
    if (!data) {
        console.log('loadAscensionData: No data provided');
        return;
    }

    console.log('loadAscensionData called with:', data);
    ascensionLevel = data.ascensionLevel || 0;
    rugpullCurrency = data.rugpullCurrency || 0;
    lastShownMilestoneEarnings = data.lastShownMilestoneEarnings || 0;
    ascensionStats = data.ascensionStats || {
        totalRunsCompleted: 0,
        currencyEarned: 0,
        bestRunEarnings: 0,
        totalGlobalBonus: 0
    };
    metaUpgrades = data.metaUpgrades || metaUpgrades;
    unlockedSystems = data.unlockedSystems || unlockedSystems;
    console.log('After load - rugpullCurrency:', rugpullCurrency, 'ascensionLevel:', ascensionLevel);
}

/**
 * Reset ascension data completely (called when user does RESET SAVE)
 */
function resetAscensionData() {
    ascensionLevel = 0;
    rugpullCurrency = 0;
    lastShownMilestoneEarnings = 0;
    ascensionStats = {
        totalRunsCompleted: 0,
        currencyEarned: 0,
        bestRunEarnings: 0,
        totalGlobalBonus: 0
    };
    // Reset all meta-upgrades to unpurchased
    for (const key in metaUpgrades) {
        metaUpgrades[key].purchased = false;
    }
    // Reset unlocked systems
    unlockedSystems = {
        basicAscension: true,
        advancedMetaUpgrades: false,
        quantumBranch: false,
        infinityGates: false
    };
}

/**
 * Auto-buy basic upgrades when affordable (if upgrade purchased)
 * Only buys if: (1) auto_buy_basic upgrade is purchased, (2) player has enough USD
 */
function tryAutoBuyBasicUpgrades() {
    if (!metaUpgrades.auto_buy_basic.purchased) return;

    // Try to buy BTC basic miners (ID 0-3 are basic ones)
    const basicBtcUpgrades = btcUpgrades.filter(u => u.id <= 3);
    basicBtcUpgrades.forEach(upgrade => {
        // Keep buying until we can't afford it
        while (dollarBalance >= upgrade.currentUsd && upgrade.level < 100) {
            dollarBalance -= upgrade.currentUsd;
            upgrade.level++;
            upgrade.currentUsd = upgrade.baseUsd * Math.pow(1.15, upgrade.level);
            upgrade.currentYield = upgrade.baseYield * upgrade.level;

            // Recalculate BTC per second
            btcPerSec = btcUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            btcPerSec *= (1 + ascensionBonus);
        }
    });

    // Same for ETH and DOGE basic miners
    const basicEthUpgrades = ethUpgrades.filter(u => u.id <= 3);
    basicEthUpgrades.forEach(upgrade => {
        while (dollarBalance >= upgrade.currentUsd && upgrade.level < 100) {
            dollarBalance -= upgrade.currentUsd;
            upgrade.level++;
            upgrade.currentUsd = upgrade.baseUsd * Math.pow(1.15, upgrade.level);
            upgrade.currentYield = upgrade.baseYield * upgrade.level;
            ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            ethPerSec *= (1 + ascensionBonus);
        }
    });

    const basicDogeUpgrades = dogeUpgrades.filter(u => u.id <= 3);
    basicDogeUpgrades.forEach(upgrade => {
        while (dollarBalance >= upgrade.currentUsd && upgrade.level < 100) {
            dollarBalance -= upgrade.currentUsd;
            upgrade.level++;
            upgrade.currentUsd = upgrade.baseUsd * Math.pow(1.15, upgrade.level);
            upgrade.currentYield = upgrade.baseYield * upgrade.level;
            dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            dogePerSec *= (1 + ascensionBonus);
        }
    });
}

/**
 * Check if player is eligible to rugpull
 */
function isRugpullEligible() {
    // Eligible if earned at least $1M lifetime
    return lifetimeEarnings >= 1000000;
}

/**
 * Show the meta-upgrades modal (call from UI button)
 */
function openMetaUpgradesModal() {
    const modal = document.getElementById('meta-upgrades-modal');
    if (!modal) {
        console.error('Meta-upgrades modal not found in HTML');
        return;
    }

    const container = document.getElementById('meta-upgrades-container');
    if (container) {
        updateMetaUpgradesUI();
    }

    modal.style.display = 'flex';
}

/**
 * Close the meta-upgrades modal
 */
function closeMetaUpgradesModal() {
    const modal = document.getElementById('meta-upgrades-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show rugpull tooltip on hover - shows mechanic explanation
 */
function showRugpullTooltip() {
    const tooltipDiv = document.getElementById('rugpull-tooltip');

    if (tooltipDiv) {
        tooltipDiv.style.visibility = 'visible';
        tooltipDiv.style.opacity = '1';
    }
}

/**
 * Hide rugpull tooltip on mouse leave
 */
function hideRugpullTooltip() {
    const tooltipDiv = document.getElementById('rugpull-tooltip');
    if (tooltipDiv) {
        tooltipDiv.style.visibility = 'hidden';
        tooltipDiv.style.opacity = '0';
    }
}

/**
 * Display rugpull info in main UI (call from updateUI)
 */
function updateAscensionUI() {
    const ascensionInfo = document.getElementById('ascension-info');
    if (ascensionInfo) {
        if (ascensionLevel === 0 && rugpullCurrency === 0) {
            ascensionInfo.innerHTML = '';
        } else {
            ascensionInfo.innerHTML = `
                <div style="text-align: center; color: #ff00ff; font-weight: bold; margin-top: 10px;">
                    🔴 Rugpull Level: ${ascensionLevel} | Corrupt Tokens: ${rugpullCurrency} 🔴
                </div>
            `;
        }
    }

    // Update RUGPULL button state
    const rugpullBtn = document.getElementById('rugpull-btn');
    const progressText = document.getElementById('rugpull-progress-text');

    if (rugpullBtn) {
        const isEligible = isRugpullEligible();
        rugpullBtn.disabled = !isEligible;

        if (!isEligible) {
            // Not eligible - faded/disabled state
            rugpullBtn.style.background = '#666';
            rugpullBtn.style.opacity = '0.5';
            rugpullBtn.style.cursor = 'not-allowed';
        } else {
            // Eligible - bright and clickable
            rugpullBtn.style.background = '#9c27b0';
            rugpullBtn.style.opacity = '1';
            rugpullBtn.style.cursor = 'pointer';
            rugpullBtn.style.boxShadow = '0 0 15px rgba(156,39,176,0.8)';
        }
    }

    // Update progress text below button - always show
    if (progressText) {
        progressText.textContent = `$${Math.floor(lifetimeEarnings).toLocaleString()} / $1M`;
    }

    // Show/hide Rugpull Store button based on tokens
    const storeBtn = document.getElementById('rugpull-store-btn');
    if (storeBtn) {
        if (rugpullCurrency > 0) {
            storeBtn.style.display = 'block';
        } else {
            storeBtn.style.display = 'none';
        }
    }
}

/**
 * Handle RUGPULL button click - smart routing
 * If eligible for rugpull: show offer
 * If already have tokens: show meta-upgrades
 * If neither: show requirements
 */
function handleRugpullButtonClick() {
    if (isRugpullEligible()) {
        // Can rugpull - show the rugpull offer
        showRugpullOffer();
    } else if (rugpullCurrency > 0) {
        // Already have tokens - show meta-upgrades to spend them
        openMetaUpgradesModal();
    } else {
        // Not eligible and no tokens - show requirements
        const progressPercent = Math.min((lifetimeEarnings / 1000000) * 100, 99.9);
        showGenericMessageModal('RUGPULL LOCKED', `
            <div style="color: #ff9800; font-weight: bold; margin-bottom: 15px;">Reach $1,000,000 lifetime earnings to unlock</div>
            <div style="color: #fff; line-height: 1.8;">
                Current: <span style="color: #4CAF50; font-weight: bold;">$${lifetimeEarnings.toLocaleString()}</span><br>
                Progress: <span style="color: #ffeb3b; font-weight: bold;">${progressPercent.toFixed(1)}%</span>
            </div>
        `);
    }
}

/**
 * Check for $1M milestones and show popup (call from game loop)
 */
function checkRugpullMilestone() {
    if (typeof lifetimeEarnings === 'undefined') {
        console.log('checkRugpullMilestone: lifetimeEarnings undefined');
        return;
    }

    const currentMilestone = Math.floor(lifetimeEarnings / 1000000);
    const lastMilestone = Math.floor(lastShownMilestoneEarnings / 1000000);

    // Debug every 60 ticks (6 seconds)
    if (window._debugCounter === undefined) window._debugCounter = 0;
    if (window._debugCounter++ % 60 === 0) {
        console.log(`checkRugpullMilestone: lifetime=${lifetimeEarnings}, current=${currentMilestone}, last=${lastMilestone}, show=${currentMilestone > lastMilestone && currentMilestone >= 1}`);
    }

    // Show popup if player just hit a new $1M milestone
    if (currentMilestone > lastMilestone && currentMilestone >= 1) {
        console.log('MILESTONE DETECTED!', currentMilestone);
        lastShownMilestoneEarnings = lifetimeEarnings;

        // Small delay to ensure UI is ready
        setTimeout(() => {
            console.log('Calling showRugpullMilestonePopup for milestone', currentMilestone);
            showRugpullMilestonePopup(currentMilestone);
        }, 100);
    }
}

/**
 * Show popup when player reaches $1M, $2M, etc (as in-game modal)
 */
function showRugpullMilestonePopup(milestone) {
    const reward = calculateRugpullReward();
    const modalText = document.getElementById('milestone-modal-text');
    const modal = document.getElementById('rugpull-milestone-modal');
    const confirmBtn = document.getElementById('milestone-confirm-btn');

    // Calculate token breakdown for display
    const baseFromEarnings = Math.floor(lifetimeEarnings / 1000000);
    const baseFromCash = Math.floor(dollarBalance / 100000);
    const baseReward = baseFromEarnings + baseFromCash;
    const ascensionBonus = 1 + (ascensionLevel * 0.05);
    const starterCash = 1500 + (ascensionLevel * 500);

    if (modalText && modal) {
        if (milestone === 1) {
            const totalBonus = 2 + (ascensionLevel * 2);
            modalText.innerHTML = `
                <div style="color: #ffeb3b; font-size: 1.2rem; font-weight: bold; margin-bottom: 15px;">🔓 HARD FORK DETECTED - $1,000,000 REACHED!</div>
                <div style="color: #fff; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.8;">
                    <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 8px;">TOKEN CALCULATION:</div>
                    <div style="margin-bottom: 15px; color: #ddd; font-size: 0.85rem;">
                        • Lifetime Earnings: $${lifetimeEarnings.toLocaleString()} ÷ $1M = <span style="color: #4CAF50;">${baseFromEarnings}</span> tokens<br>
                        • Current Cash Bonus: $${dollarBalance.toLocaleString()} ÷ $100k = <span style="color: #4CAF50;">${baseFromCash}</span> tokens<br>
                        • Base Total: <span style="color: #4CAF50;">${baseReward}</span> tokens<br>
                        • Ascension Bonus: <span style="color: #4CAF50;">×${ascensionBonus.toFixed(2)}</span><br>
                        <span style="border-top: 1px solid #555; padding-top: 8px; margin-top: 8px; display: block;">
                            <span style="color: #ffeb3b; font-weight: bold;">FINAL REWARD: ${reward} Corrupt Tokens</span>
                        </span>
                    </div>
                    <div style="border-top: 1px solid #555; padding-top: 15px; margin-top: 15px;">
                        <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 8px;">RUGPULL REWARDS:</div>
                        <div style="margin-bottom: 10px; color: #ccc;">
                            • Earn <span style="color: #ffeb3b; font-weight: bold;">${reward} Corrupt Tokens</span><br>
                            • Start with <span style="color: #ffeb3b; font-weight: bold;">$${starterCash}</span> cash<br>
                            • +2x mining speed bonus <span style="color: #ffeb3b;">(New Total: ${totalBonus}x)</span><br>
                            • +2x manual hash bonus <span style="color: #ffeb3b;">(New Total: ${totalBonus}x)</span><br>
                            <div style="font-size: 0.8rem; color: #999; margin-top: 8px;">💡 Each ascension adds +2x (stacks additively, not multiplicatively)</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const totalBonus = 2 + (ascensionLevel * 2);
            modalText.innerHTML = `
                <div style="color: #ffeb3b; font-size: 1.2rem; font-weight: bold; margin-bottom: 15px;">🔓 HARD FORK DETECTED - $${(milestone * 1000000).toLocaleString()} REACHED!</div>
                <div style="color: #fff; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.8;">
                    <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 8px;">TOKEN CALCULATION:</div>
                    <div style="margin-bottom: 15px; color: #ddd; font-size: 0.85rem;">
                        • Lifetime Earnings: $${lifetimeEarnings.toLocaleString()} ÷ $1M = <span style="color: #4CAF50;">${baseFromEarnings}</span> tokens<br>
                        • Current Cash Bonus: $${dollarBalance.toLocaleString()} ÷ $100k = <span style="color: #4CAF50;">${baseFromCash}</span> tokens<br>
                        • Base Total: <span style="color: #4CAF50;">${baseReward}</span> tokens<br>
                        • Ascension Bonus: <span style="color: #4CAF50;">×${ascensionBonus.toFixed(2)}</span><br>
                        <span style="border-top: 1px solid #555; padding-top: 8px; margin-top: 8px; display: block;">
                            <span style="color: #ffeb3b; font-weight: bold;">FINAL REWARD: ${reward} Corrupt Tokens</span>
                        </span>
                    </div>
                    <div style="border-top: 1px solid #555; padding-top: 15px; margin-top: 15px;">
                        <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 8px;">RUGPULL REWARDS:</div>
                        <div style="margin-bottom: 10px; color: #ccc;">
                            • Earn <span style="color: #ffeb3b; font-weight: bold;">${reward} Corrupt Tokens</span><br>
                            • Start with <span style="color: #ffeb3b; font-weight: bold;">$${starterCash}</span> cash<br>
                            • +2x mining speed bonus <span style="color: #ffeb3b;">(New Total: ${totalBonus}x)</span><br>
                            • +2x manual hash bonus <span style="color: #ffeb3b;">(New Total: ${totalBonus}x)</span><br>
                            <div style="font-size: 0.8rem; color: #999; margin-top: 8px;">💡 Each ascension adds +2x (stacks additively, not multiplicatively)</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Reset button to call confirmRugpullFromModal
        if (confirmBtn) {
            confirmBtn.textContent = 'RUGPULL NOW';
            confirmBtn.onclick = function() {
                confirmRugpullFromModal();
            };
        }

        modal.style.display = 'flex';
    }
}

/**
 * Close rugpull milestone modal
 */
function closeRugpullMilestoneModal() {
    const modal = document.getElementById('rugpull-milestone-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Confirm rugpull from milestone modal
 */
function confirmRugpullFromModal() {
    closeRugpullMilestoneModal();
    showRugpullOffer();
}

/**
 * Show rugpull complete message as modal
 */
function showRugpullCompleteModal(reward) {
    const modal = document.getElementById('rugpull-complete-modal');
    const text = document.getElementById('complete-modal-text');

    if (modal && text) {
        text.innerHTML = `
            <div style="color: #ffeb3b; font-size: 1.1rem; font-weight: bold; margin-bottom: 15px;">+${reward} Corrupt Tokens earned</div>
            <div>Total Tokens: <span style="color: #ffeb3b; font-weight: bold;">${rugpullCurrency}</span></div>
            <div style="margin-top: 15px; line-height: 1.8;">
                New run starting with bonuses...<br>
                <span style="font-size: 0.9rem;">Open the Rugpull Store to spend your tokens!</span>
            </div>
        `;
        modal.style.display = 'flex';
    }
}

/**
 * Close rugpull complete modal
 */
function closeRugpullCompleteModal() {
    const modal = document.getElementById('rugpull-complete-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show generic message modal
 */
function showGenericMessageModal(title, message) {
    const modal = document.getElementById('generic-message-modal');
    const titleEl = document.getElementById('generic-modal-title');
    const textEl = document.getElementById('generic-modal-text');

    if (modal && titleEl && textEl) {
        titleEl.textContent = title;
        textEl.innerHTML = message;
        modal.style.display = 'flex';
    }
}

/**
 * Close generic message modal
 */
function closeGenericMessageModal() {
    const modal = document.getElementById('generic-message-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Manual test function - force show rugpull offer (for testing)
 * Type in console: testRugpull()
 */
function testRugpull() {
    console.log('TEST MODE: Showing rugpull offer...');
    console.log('Current eligibility:', isRugpullEligible());
    console.log('Lifetime earnings:', lifetimeEarnings);
    console.log('BTC per second:', btcPerSec);
    showRugpullOffer();
}

/**
 * Test function - give $1M for testing rugpull feature
 * Type in console: giveTestMillion()
 */
function giveTestMillion() {
    lifetimeEarnings = 1000000;
    lastShownMilestoneEarnings = 0;  // Reset so milestone will trigger
    console.log('TEST: Set lifetimeEarnings to $1M');
    console.log('Rugpull eligible:', isRugpullEligible());
    updateUI();
}

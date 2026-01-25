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
let upgradeToggleState = {
    auto_sell: true                  // Auto-sell crypto toggle state
};  // Track toggle states for upgrades that can be turned on/off
let ascensionStats = {
    totalRunsCompleted: 0,           // Total times player has reset
    currencyEarned: 0,               // Lifetime total of earned currency
    bestRunEarnings: 0,              // Highest $ earned in a single run
    totalGlobalBonus: 0              // Sum of all purchased bonuses
};

// Meta-upgrades purchased by the player (persists across resets)
let metaUpgrades = {
    // TIER 1 (Basic) - 100 tokens each (first rugpull: 2 of 4 with 220 tokens)
    mining_speed_miner_5: { purchased: false, cost: 100 },      // +5% mining speed for miners
    click_speed_5: { purchased: false, cost: 100 },             // +5% manual hash speed
    starter_miners: { purchased: false, cost: 100 },            // Start with 1 of each basic miner
    power_efficiency: { purchased: false, cost: 100 },          // +20% power efficiency
    // TIER 2 (Advanced) - 2000 tokens each (need multiple rugpulls)
    mining_speed_miner_10: { purchased: false, cost: 2000 },    // +10% mining speed for miners
    click_speed_10: { purchased: false, cost: 2000 },           // +10% manual hash speed
    cash_multiplier_5: { purchased: false, cost: 2000 },        // +5% cash from all sources
    // TIER 3 (Expert) - 20000 tokens each (significant investment)
    mining_speed_miner_25: { purchased: false, cost: 20000 },    // +25% mining speed for miners
    click_speed_25: { purchased: false, cost: 20000 },           // +25% manual hash speed
    mining_speed_miner_50: { purchased: false, cost: 20000 },    // +50% mining speed for miners
    auto_sell_crypto: { purchased: false, cost: 20000 },         // Auto-sell mined crypto for cash
    crypto_price_5: { purchased: false, cost: 20000 },           // +5% crypto prices
    // TIER 4 (Prestige) - millions of tokens each (long term goals)
    mining_speed_miner_100: { purchased: false, cost: 1000000 }, // +100% mining speed for miners
    click_speed_100: { purchased: false, cost: 1000000 },        // +100% manual hash speed
    crypto_doubler: { purchased: false, cost: 5000000 },         // Double all crypto mined
    prestige_tokens: { purchased: false, cost: 5000000 }         // +1% mining bonus per token spent
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
    // Token reward based on the rugpull requirement threshold
    // This ensures consistent scaling: each threshold gives 200 tokens at level 0
    // Level 0: $1B = 200 tokens
    // Level 1: $10B = 2000 tokens (×1.5 bonus)
    // Level 2: $100B = 20000 tokens (×2.25 bonus)

    const requirement = getRugpullRequirement();  // $1B, $10B, $100B, etc.
    const baseReward = Math.floor(requirement / 5000000);  // 1 token per $5M

    // Exponential bonus for higher ascension level (1.5x per ascension, starting at level 1)
    const ascensionBonus = ascensionLevel > 0 ? Math.pow(1.5, ascensionLevel - 1) : 1;  // 1x, 1.5x, 2.25x, 3.375x

    const totalReward = baseReward * ascensionBonus;

    // Minimum 1 token even if poor
    return Math.max(1, Math.floor(totalReward));
}

/**
 * Show the rugpull confirmation modal
 */
function showRugpullOffer() {
    // Get values from game.js with fallbacks
    const earnings = typeof lifetimeEarnings !== 'undefined' ? lifetimeEarnings : 0;
    const cash = typeof dollarBalance !== 'undefined' ? dollarBalance : 0;

    // Calculate token breakdown based on requirement threshold
    const requirement = getRugpullRequirement();  // $1B, $10B, $100B, etc.
    const baseReward = Math.floor(requirement / 5000000);  // 1 token per $5M

    // Ascension bonus (starts at level 1, not level 0)
    const ascensionBonus = ascensionLevel > 0 ? Math.pow(1.5, ascensionLevel - 1) : 1;
    const totalWithBonus = baseReward * ascensionBonus;
    const reward = Math.max(1, Math.floor(totalWithBonus));

    // For display breakdown
    const baseFromEarnings = 0;
    const baseFromCash = baseReward;

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
                    • Lifetime Earnings: <span style="color: #4CAF50; font-weight: bold;">$${earnings.toLocaleString()}</span><br>
                    • Current Cash: <span style="color: #4CAF50; font-weight: bold;">$${cash.toLocaleString()}</span><br>
                    • Ascensions Completed: <span style="color: #4CAF50; font-weight: bold;">${ascensionLevel}</span>
                </div>
                <div style="border-top: 1px solid #555; padding-top: 15px; margin-top: 15px;">
                    <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 10px;">TOKEN CALCULATION:</div>
                    <div style="margin-bottom: 15px; color: #ddd; font-size: 0.85rem;">
                        • $${cash.toLocaleString()} ÷ $5,000,000 = <span style="color: #4CAF50;">${baseReward}</span> tokens<br>
                        • Requirement: $${requirement.toLocaleString()} ÷ $5,000,000 = <span style="color: #4CAF50;">${baseReward}</span> tokens<br>
                        • Base Reward: <span style="color: #4CAF50;">${baseReward}</span> tokens<br>
                        • Ascension Bonus (${ascensionLevel > 0 ? 'Level ' + ascensionLevel + ' = ×' + ascensionBonus.toFixed(2) : 'None (Level 0)'}): <span style="color: #4CAF50;">×${ascensionBonus.toFixed(2)}</span><br>
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
                        • +2x mining speed bonus <span style="color: #ffeb3b;">(${(ascensionLevel + 1) * 2}x total)</span><br>
                        • +2x manual hash bonus <span style="color: #ffeb3b;">(${(ascensionLevel + 1) * 2}x total)</span><br>
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

        // Show the store button when rugpull offer is displayed
        const storeBtn = document.getElementById('rugpull-store-btn');
        if (storeBtn) {
            storeBtn.style.display = 'inline-block';
        }

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

    // Save lifetime earnings before reset (needed for next milestone tracking)
    const savedLifetimeEarnings = lifetimeEarnings;

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

    // Reset ALL game state (this sets lifetimeEarnings to 0)
    resetGameState();

    // Store the total lifetime earnings in ascension stats for future token calculations
    // lifetimeEarnings stays at 0 for the new run

    // Restore ascension data
    ascensionLevel = savedAscensionData.ascensionLevel;
    rugpullCurrency = savedAscensionData.rugpullCurrency;
    metaUpgrades = savedAscensionData.metaUpgrades;
    ascensionStats = savedAscensionData.ascensionStats;
    unlockedSystems = savedAscensionData.unlockedSystems;
    // Sync window references after restoring ascension data
    window.metaUpgrades = metaUpgrades;
    window.upgradeToggleState = upgradeToggleState;

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

        // Recalculate per-second rates WITH ascension bonuses AND skill bonuses
        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        const miningSpeedBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
        const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
        const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
        const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;

        btcPerSec = btcUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus + miningSpeedBonus + btcBonus);
        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus + miningSpeedBonus + ethBonus);
        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus + miningSpeedBonus + dogeBonus);
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

    // Update the auto-sell button UI if the auto-sell upgrade was purchased
    if (upgradeKey === 'auto_sell_crypto' && typeof updateAutoSellButtonUI === 'function') {
        updateAutoSellButtonUI();
    }

    // Update main game UI to reflect new bonuses
    if (typeof updateUI === 'function') {
        updateUI();
    }

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

    // +2x bonus for each rugpull (ascension)
    // Stored as additive bonus: ascensionLevel*2 - 1, so (1 + bonus) = ascensionLevel*2
    if (ascensionLevel > 0) {
        bonus = (ascensionLevel * 2) - 1;  // 2x per rugpull = +100% bonus
    }

    // Additional bonuses from purchased upgrades (using new keys)
    if (metaUpgrades.mining_speed_miner_5 && metaUpgrades.mining_speed_miner_5.purchased) bonus += 0.05;
    if (metaUpgrades.mining_speed_miner_10 && metaUpgrades.mining_speed_miner_10.purchased) bonus += 0.10;
    if (metaUpgrades.mining_speed_miner_25 && metaUpgrades.mining_speed_miner_25.purchased) bonus += 0.25;
    if (metaUpgrades.mining_speed_miner_50 && metaUpgrades.mining_speed_miner_50.purchased) bonus += 0.50;
    if (metaUpgrades.mining_speed_miner_100 && metaUpgrades.mining_speed_miner_100.purchased) bonus += 1.00;

    // Dynamic tier upgrades (Tier 5+)
    // Tier 5 upgrades: +2.5x (250%) mining speed for first 2 upgrades
    for (let i = 0; i < 2; i++) {
        const upgradeKey = `tier5_upgrade${i}`;
        if (metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased) {
            bonus += 2.5;
        }
    }

    // Tier 6+ upgrades: scaling bonus
    for (let tierNum = 6; tierNum <= 10; tierNum++) {
        const tierBonus = Math.pow(2.5, tierNum - 4);  // Exponential scaling
        for (let i = 0; i < 2; i++) {
            const upgradeKey = `tier${tierNum}_upgrade${i}`;
            if (metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased) {
                bonus += tierBonus;
            }
        }
    }

    // Prestige token bonus: 1% per token ever spent
    if (metaUpgrades.prestige_tokens && metaUpgrades.prestige_tokens.purchased) {
        bonus += ascensionStats.totalGlobalBonus * 0.01;
    }

    return bonus;
}

/**
 * Toggle auto-sell crypto feature on/off
 */
function toggleAutoSell() {
    upgradeToggleState.auto_sell = !upgradeToggleState.auto_sell;
    window.upgradeToggleState = upgradeToggleState;  // Sync to window
    const state = upgradeToggleState.auto_sell ? 'ON' : 'OFF';
    console.log(`[AUTO-SELL] Toggle called - now ${state}`);
    console.log(`[AUTO-SELL] upgradeToggleState:`, upgradeToggleState);
    console.log(`[AUTO-SELL] window.upgradeToggleState:`, window.upgradeToggleState);

    // Update the meta upgrades UI
    updateMetaUpgradesUI();  // Refresh the UI to show new state

    // Update the main toggle button UI if available
    if (typeof updateAutoSellButtonUI === 'function') {
        updateAutoSellButtonUI();
    }

    saveGame();
}

/**
 * Get skill bonus from meta-upgrades for mining speed
 * Called from game.js when calculating yields
 */
function getSkillBonus(skillType) {
    let bonus = 0;

    if (skillType === 'mining_speed') {
        // Mining speed for MINERS
        if (metaUpgrades.mining_speed_miner_5.purchased) bonus += 0.05;     // +5%
        if (metaUpgrades.mining_speed_miner_10.purchased) bonus += 0.10;    // +10%
        if (metaUpgrades.mining_speed_miner_25.purchased) bonus += 0.25;    // +25%
        if (metaUpgrades.mining_speed_miner_50.purchased) bonus += 0.50;    // +50%
        if (metaUpgrades.mining_speed_miner_100.purchased) bonus += 1.00;   // +100%

        // Prestige tokens: +1% per token ever spent
        if (metaUpgrades.prestige_tokens.purchased) {
            bonus += ascensionStats.totalGlobalBonus * 0.01;
        }
    } else if (skillType === 'click_speed') {
        // Manual hash speed
        if (metaUpgrades.click_speed_5.purchased) bonus += 0.05;    // +5%
        if (metaUpgrades.click_speed_10.purchased) bonus += 0.10;   // +10%
        if (metaUpgrades.click_speed_25.purchased) bonus += 0.25;   // +25%
        if (metaUpgrades.click_speed_100.purchased) bonus += 1.00;  // +100%

        // Dynamic tier upgrades (Tier 5+) - upgrades at index 1 are click_speed
        for (let tierNum = 5; tierNum <= 10; tierNum++) {
            const upgradeKey = `tier${tierNum}_upgrade1`;  // Index 1 = click_speed
            if (metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased) {
                const tierBonus = Math.pow(2.5, tierNum - 4);  // Exponential scaling: 2.5x, 6.25x, etc.
                bonus += tierBonus;
            }
        }
    } else if (skillType === 'cash_multiplier') {
        // Cash from all sources
        if (metaUpgrades.cash_multiplier_5.purchased) bonus += 0.05;  // +5%

        // Dynamic tier upgrades (Tier 5+) - upgrades at index 2 are cash_multiplier
        for (let tierNum = 5; tierNum <= 10; tierNum++) {
            const upgradeKey = `tier${tierNum}_upgrade2`;  // Index 2 = cash_multiplier
            if (metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased) {
                const tierBonus = Math.pow(1.0, tierNum - 4) * 0.5;  // +50%, +50%, scaling
                bonus += tierBonus;
            }
        }
    } else if (skillType === 'crypto_price') {
        // Crypto prices (affects value of mined coins)
        if (metaUpgrades.crypto_price_5.purchased) bonus += 0.05;  // +5%

        // Dynamic tier upgrades (Tier 5+) - upgrades at index 3 are crypto_price
        for (let tierNum = 5; tierNum <= 10; tierNum++) {
            const upgradeKey = `tier${tierNum}_upgrade3`;  // Index 3 = crypto_price
            if (metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased) {
                const tierBonus = Math.pow(0.5, tierNum - 5) * 0.5;  // Scaling crypto prices
                bonus += tierBonus;
            }
        }
    } else if (skillType === 'crypto_doubler') {
        // Double crypto mined
        if (metaUpgrades.crypto_doubler.purchased) return 1.0;  // 2x total (1 + 1 = 2)
    } else if (skillType === 'power_efficiency') {
        // Power efficiency bonus
        if (metaUpgrades.power_efficiency.purchased) return 0.20;  // +20%
    }

    return bonus;
}

/**
 * Get power boost from meta-upgrades (increases available power capacity)
 * Called from game.js getTotalPowerAvailableWithBonus
 */
function getPowerBoost() {
    let boost = 0;
    if (metaUpgrades.power_efficiency.purchased) {
        boost += 0.20;  // +20% more power available
    }
    return boost;
}

/**
 * Get offline earnings boost multiplier from meta-upgrades
 * Currently no offline boost upgrades, returns 0 for default 1x multiplier
 */
function getOfflineBoost() {
    return 0;  // No offline boost upgrades (default 1x)
}

/**
 * Get friendly name for upgrade key
 */
function getUpgradeName(upgradeKey) {
    const names = {
        // Tier 1
        'mining_speed_miner_5': '+5% Mining Speed (For Miners)',
        'click_speed_5': '+5% Manual Hash Speed',
        'starter_miners': 'Start with 1 Basic Miner on New Rugpull',
        'power_efficiency': '+20% Power Efficiency',
        // Tier 2
        'mining_speed_miner_10': '+10% Mining Speed (For Miners)',
        'click_speed_10': '+10% Manual Hash Speed',
        'cash_multiplier_5': '+5% Cash from All Sources',
        // Tier 3
        'mining_speed_miner_25': '+25% Mining Speed (For Miners)',
        'click_speed_25': '+25% Manual Hash Speed',
        'mining_speed_miner_50': '+50% Mining Speed (For Miners)',
        'auto_sell_crypto': 'Auto-Sell Crypto to USD',
        'crypto_price_5': '+5% Crypto Prices',
        // Tier 4
        'mining_speed_miner_100': '+100% Mining Speed (For Miners)',
        'click_speed_100': '+100% Manual Hash Speed',
        'crypto_doubler': '2x All Crypto Mined',
        'prestige_tokens': '+1% Mining Bonus per Token Spent'
    };

    // Handle dynamic tier upgrades
    if (!names[upgradeKey]) {
        const match = upgradeKey.match(/tier(\d+)_upgrade(\d+)/);
        if (match) {
            const tierNum = parseInt(match[1]);
            const upgradeNum = parseInt(match[2]);
            const upgradeNames = [
                '+250% Mining Speed',
                '+250% Manual Hash Speed',
                '+100% Cash Multiplier',
                '+50% Crypto Prices'
            ];
            return `[Tier ${tierNum}] ${upgradeNames[upgradeNum] || 'Upgrade'}`;
        }
    }

    return names[upgradeKey] || upgradeKey;
}

/**
 * Format token cost with abbreviations (K, M, B, T, Q, etc.)
 */
function formatTokenCost(cost) {
    if (cost >= 1e30) {
        return (cost / 1e30).toFixed(1) + 'N';
    } else if (cost >= 1e27) {
        return (cost / 1e27).toFixed(1) + 'O';
    } else if (cost >= 1e24) {
        return (cost / 1e24).toFixed(1) + 'Sep';
    } else if (cost >= 1e21) {
        return (cost / 1e21).toFixed(1) + 'S';
    } else if (cost >= 1e18) {
        return (cost / 1e18).toFixed(1) + 'Qa';
    } else if (cost >= 1e15) {
        return (cost / 1e15).toFixed(1) + 'Q';
    } else if (cost >= 1e12) {
        return (cost / 1e12).toFixed(1) + 'T';
    } else if (cost >= 1e9) {
        return (cost / 1e9).toFixed(1) + 'B';
    } else if (cost >= 1e6) {
        return (cost / 1e6).toFixed(1) + 'M';
    } else if (cost >= 1e3) {
        return (cost / 1e3).toFixed(1) + 'K';
    }
    return cost.toString();
}

/**
 * Update meta-upgrades UI (called after purchase or load)
 */
function updateMetaUpgradesUI() {
    const container = document.getElementById('meta-upgrades-container');
    if (!container) return;

    container.innerHTML = '';

    const title = document.createElement('h3');
    const tokenDisplay = formatTokenCost(rugpullCurrency);
    title.textContent = `💎 RUGPULL META UPGRADES | Corrupt Tokens: ${tokenDisplay}`;
    title.style.color = '#ff00ff';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    container.appendChild(title);

    // Display current bonuses
    const totalMiningBonus = ascensionLevel * 2;
    const totalClickBonus = ascensionLevel * 2;

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
    bonusText += `🔷 Rugpulls: <span style="color: #ffeb3b; font-weight: bold;">${ascensionLevel}</span><br>`;
    bonusText += `⚡ Mining Speed: <span style="color: #ffeb3b; font-weight: bold;">${totalMiningBonus}x</span><br>`;
    bonusText += `🖱️ Manual Hash: <span style="color: #ffeb3b; font-weight: bold;">${totalClickBonus}x</span><br>`;
    bonusText += `</div>`;
    bonusesDiv.innerHTML = bonusText;
    container.appendChild(bonusesDiv);

    // Group upgrades by tier
    const tiers = [
        { name: 'Tier 1 (Basic)', upgrades: ['mining_speed_miner_5', 'click_speed_5', 'starter_miners', 'power_efficiency'] },
        { name: 'Tier 2 (Advanced)', upgrades: ['mining_speed_miner_10', 'click_speed_10', 'cash_multiplier_5'] },
        { name: 'Tier 3 (Expert)', upgrades: ['mining_speed_miner_25', 'click_speed_25', 'mining_speed_miner_50', 'auto_sell_crypto', 'crypto_price_5'] },
        { name: 'Tier 4 (Prestige)', upgrades: ['mining_speed_miner_100', 'click_speed_100', 'crypto_doubler', 'prestige_tokens'] }
    ];

    // Generate dynamic tiers for higher ascensions (Tier 5+)
    // Each tier costs 10x the previous tier
    // Tier 4: 1M-5M, so Tier 5 starts at 10M, Tier 6 at 100M, etc.
    if (ascensionLevel >= 4 || rugpullCurrency > 0) {  // Show tier 5 if at least 1 rugpull completed
        for (let tierNum = 5; tierNum <= 10; tierNum++) {
            // Base costs: Tier 5 = 10M (2 upgrades) and 50M (2 upgrades), then 10x each tier
            let tierCost1, tierCost2;

            if (tierNum === 5) {
                tierCost1 = 10000000;      // 10M
                tierCost2 = 50000000;      // 50M
            } else {
                // Each tier: multiply previous tier's costs by 10
                const prevTier5Cost1 = 10000000 * Math.pow(10, tierNum - 5);
                const prevTier5Cost2 = 50000000 * Math.pow(10, tierNum - 5);
                tierCost1 = prevTier5Cost1;
                tierCost2 = prevTier5Cost2;
            }

            const tierUpgrades = [];

            // Generate 4 upgrades per tier: 2 at lower cost, 2 at higher cost
            for (let i = 0; i < 4; i++) {
                const upgradeKey = `tier${tierNum}_upgrade${i}`;
                const upgradeCost = i < 2 ? tierCost1 : tierCost2;

                // Ensure upgrade exists in metaUpgrades
                if (!metaUpgrades[upgradeKey]) {
                    metaUpgrades[upgradeKey] = { purchased: false, cost: upgradeCost };
                } else if (metaUpgrades[upgradeKey].cost !== upgradeCost) {
                    // Update cost if tier structure changed
                    metaUpgrades[upgradeKey].cost = upgradeCost;
                }

                tierUpgrades.push(upgradeKey);
            }

            const tierNames = ['Legendary', 'Mythic', 'Godlike', 'Celestial', 'Transcendent', 'Omnipotent'];
            tiers.push({
                name: `Tier ${tierNum} (${tierNames[tierNum - 5] || 'Infinite'})`,
                upgrades: tierUpgrades
            });
        }
    }

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
            const costDisplay = formatTokenCost(upgrade.cost);
            const status = upgrade.purchased ? '✓ OWNED' : `💎 ${costDisplay}`;

            // Add toggle indicator for auto_sell_crypto
            let toggleStatus = '';
            if (upgradeKey === 'auto_sell_crypto' && upgrade.purchased) {
                const autoSellState = typeof upgradeToggleState !== 'undefined' ? upgradeToggleState.auto_sell : true;
                toggleStatus = ` [${autoSellState ? 'ON' : 'OFF'}]`;
            }

            btn.innerHTML = `${name}${toggleStatus}<br><small>${status}</small>`;

            if (!upgrade.purchased) {
                btn.onclick = () => purchaseMetaUpgrade(upgradeKey);
                btn.onmouseover = () => btn.style.background = '#2a2a4e';
                btn.onmouseout = () => btn.style.background = '#1a1a2e';
            } else if (upgradeKey === 'auto_sell_crypto') {
                // Add toggle functionality for auto-sell
                btn.style.cursor = 'pointer';
                btn.onclick = () => toggleAutoSell();
                btn.onmouseover = () => btn.style.background = '#3a3a5e';
                btn.onmouseout = () => btn.style.background = '#333333';
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
        unlockedSystems,
        upgradeToggleState
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

    // UPDATE COSTS FOR REBALANCED ECONOMY (migration from old pricing)
    // Keep purchased status but update costs to new values
    const newCosts = {
        // TIER 1 (Basic) - 100 tokens each
        mining_speed_miner_5: 100,
        click_speed_5: 100,
        starter_miners: 100,
        power_efficiency: 100,
        // TIER 2 (Advanced) - 2000 tokens each
        mining_speed_miner_10: 2000,
        click_speed_10: 2000,
        cash_multiplier_5: 2000,
        // TIER 3 (Expert) - 20000 tokens each
        mining_speed_miner_25: 20000,
        click_speed_25: 20000,
        mining_speed_miner_50: 20000,
        auto_sell_crypto: 20000,
        crypto_price_5: 20000,
        // TIER 4 (Prestige) - millions of tokens each
        mining_speed_miner_100: 1000000,
        click_speed_100: 1000000,
        crypto_doubler: 5000000,
        prestige_tokens: 5000000,
        // Legacy names (for old saves - updated to new costs)
        mining_speed_5: 100,
        mining_speed_10: 2000,
        mining_speed_25: 20000,
        mining_speed_50: 20000,
        offline_boost: 2000,
        super_offline: 5000000
    };

    for (const key in metaUpgrades) {
        if (newCosts[key]) {
            metaUpgrades[key].cost = newCosts[key];
        }
    }

    // Initialize any missing upgrades from new structure
    // This ensures old saves get the new upgrades
    const defaultMetaUpgrades = {
        // TIER 1 (Basic) - 100 tokens each
        mining_speed_miner_5: { purchased: false, cost: 100 },
        click_speed_5: { purchased: false, cost: 100 },
        starter_miners: { purchased: false, cost: 100 },
        power_efficiency: { purchased: false, cost: 100 },
        // TIER 2 (Advanced) - 2000 tokens each
        mining_speed_miner_10: { purchased: false, cost: 2000 },
        click_speed_10: { purchased: false, cost: 2000 },
        cash_multiplier_5: { purchased: false, cost: 2000 },
        // TIER 3 (Expert) - 20000 tokens each
        mining_speed_miner_25: { purchased: false, cost: 20000 },
        click_speed_25: { purchased: false, cost: 20000 },
        mining_speed_miner_50: { purchased: false, cost: 20000 },
        auto_sell_crypto: { purchased: false, cost: 20000 },
        crypto_price_5: { purchased: false, cost: 20000 },
        // TIER 4 (Prestige) - millions of tokens each
        mining_speed_miner_100: { purchased: false, cost: 1000000 },
        click_speed_100: { purchased: false, cost: 1000000 },
        crypto_doubler: { purchased: false, cost: 5000000 },
        prestige_tokens: { purchased: false, cost: 5000000 }
    };

    // Add any missing upgrades from defaults
    for (const key in defaultMetaUpgrades) {
        if (!metaUpgrades[key]) {
            metaUpgrades[key] = defaultMetaUpgrades[key];
        }
    }

    // Load upgrade toggle states (like auto_sell)
    upgradeToggleState = data.upgradeToggleState || { auto_sell: true };
    window.upgradeToggleState = upgradeToggleState;  // Sync to window after loading
    window.metaUpgrades = metaUpgrades;  // Sync metaUpgrades to window after loading

    unlockedSystems = data.unlockedSystems || unlockedSystems;
    console.log('After load - rugpullCurrency:', rugpullCurrency, 'ascensionLevel:', ascensionLevel);
    console.log('After load - upgradeToggleState:', upgradeToggleState);
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
    // Sync window references
    window.metaUpgrades = metaUpgrades;
    window.upgradeToggleState = upgradeToggleState;
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
/**
 * Get the current rugpull requirement based on number of rugpulls completed
 * $1M, $10M, $100M, $500M, $1B, etc
 */
function getRugpullRequirement() {
    // Exponentially scaling rugpull requirements based on ascensions (infinite scaling)
    // 1st (level 0): $1B, 2nd (level 1): $10B, 3rd (level 2): $100B, 4th: $1T, 5th: $10T, 6th: $100T, 7th: $1Q, etc.
    const baseRequirement = 1000000000;  // $1B base for first rugpull
    const ascensionMultiplier = Math.pow(10, ascensionLevel);  // 10x harder each ascension
    return Math.floor(baseRequirement * ascensionMultiplier);
}

function isRugpullEligible() {
    // Check if lifetimeEarnings is available from game.js
    const earnings = typeof lifetimeEarnings !== 'undefined' ? lifetimeEarnings : 0;
    // Eligible if earned at least the current requirement
    return earnings >= getRugpullRequirement();
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
    // Hide the store button when modal is closed
    const storeBtn = document.getElementById('rugpull-store-btn');
    if (storeBtn) {
        storeBtn.style.display = 'none';
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
            const tokenDisplay = formatTokenCost(rugpullCurrency);
            ascensionInfo.innerHTML = `
                <div style="text-align: center; padding: 8px; background: rgba(0,0,0,0.4); border-radius: 6px; border: 1px solid #666; margin-top: 6px; color: #ccc; font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; font-weight: 800;">
                    Rugpulls: <span style="color: #f7931a; font-size: 0.9rem;">${ascensionLevel}</span> | Corrupt Tokens: <span style="color: #00ff88; font-size: 0.9rem;">${tokenDisplay}</span>
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
        const requirement = getRugpullRequirement();
        let requirementLabel = '';
        let earningsLabel = '';

        // Helper to format large numbers with appropriate suffix
        function formatLargeNumber(num) {
            if (num >= 1e30) {  // Nonillion (N)
                return `$${(num / 1e30).toFixed(1)}N`;
            } else if (num >= 1e27) {  // Octillion (O)
                return `$${(num / 1e27).toFixed(1)}O`;
            } else if (num >= 1e24) {  // Septillion (Sep)
                return `$${(num / 1e24).toFixed(1)}Sep`;
            } else if (num >= 1e21) {  // Sextillion (S)
                return `$${(num / 1e21).toFixed(1)}S`;
            } else if (num >= 1e18) {  // Quintillion (Qa)
                return `$${(num / 1e18).toFixed(1)}Qa`;
            } else if (num >= 1e15) {  // Quadrillion (Q)
                return `$${(num / 1e15).toFixed(1)}Q`;
            } else if (num >= 1e12) {  // Trillion (T)
                return `$${(num / 1e12).toFixed(1)}T`;
            } else if (num >= 1e9) {  // Billion (B)
                return `$${(num / 1e9).toFixed(1)}B`;
            } else if (num >= 1e6) {  // Million (M)
                return `$${(num / 1e6).toFixed(0)}M`;
            } else {
                return `$${Math.floor(num).toLocaleString()}`;
            }
        }

        requirementLabel = formatLargeNumber(requirement);
        earningsLabel = formatLargeNumber(lifetimeEarnings);

        progressText.textContent = `${earningsLabel} / ${requirementLabel}`;
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
    } else {
        // Show meta-upgrades shop (always accessible)
        openMetaUpgradesModal();
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

    const requirement = getRugpullRequirement();

    // Show popup if player just hit the current rugpull requirement
    if (lifetimeEarnings >= requirement && lastShownMilestoneEarnings < requirement) {
        console.log('RUGPULL MILESTONE DETECTED!', lifetimeEarnings, 'vs', requirement);
        lastShownMilestoneEarnings = lifetimeEarnings;

        // Small delay to ensure UI is ready
        setTimeout(() => {
            console.log('Calling showRugpullMilestonePopup');
            showRugpullMilestonePopup(ascensionLevel + 1);
        }, 100);
    }
}

/**
 * Show popup when player reaches a rugpull requirement (as in-game modal)
 */
function showRugpullMilestonePopup(nextMilestoneNumber) {
    const reward = calculateRugpullReward();
    const modalText = document.getElementById('milestone-modal-text');
    const modal = document.getElementById('rugpull-milestone-modal');
    const confirmBtn = document.getElementById('milestone-confirm-btn');

    // Get the requirement that was just met (dynamically calculated)
    const requirement = getRugpullRequirement();
    let requirementLabel = '';
    if (requirement >= 1000000000) {
        requirementLabel = `$${(requirement / 1000000000).toFixed(2)}B`;
    } else if (requirement >= 1000000) {
        requirementLabel = `$${(requirement / 1000000).toFixed(2)}M`;
    } else {
        requirementLabel = `$${requirement.toLocaleString()}`;
    }
    const currentMilestone = { value: requirement, label: requirementLabel };

    // Calculate token breakdown for display
    const baseFromEarnings = Math.floor(lifetimeEarnings / 1000000);
    const baseFromCash = Math.floor(dollarBalance / 100000);
    const baseReward = baseFromEarnings + baseFromCash;
    const ascensionBonus = 1 + (ascensionLevel * 0.05);
    const starterCash = 1500 + (ascensionLevel * 500);
    const totalBonus = ascensionLevel * 2;

    if (modalText && modal) {
        modalText.innerHTML = `
            <div style="color: #ffeb3b; font-size: 1.2rem; font-weight: bold; margin-bottom: 15px;">🔓 HARD FORK DETECTED - ${currentMilestone.label} REACHED!</div>
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
                        • +2x mining speed bonus <span style="color: #ffeb3b;">(New Total: ${(ascensionLevel + 1) * 2}x)</span><br>
                        • +2x manual hash bonus <span style="color: #ffeb3b;">(New Total: ${(ascensionLevel + 1) * 2}x)</span><br>
                        <div style="font-size: 0.8rem; color: #999; margin-top: 8px;">💡 Each rugpull adds +2x</div>
                    </div>
                </div>
            </div>
        `;

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
    // Hide the store button when modal is closed
    const storeBtn = document.getElementById('rugpull-store-btn');
    if (storeBtn) {
        storeBtn.style.display = 'none';
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
window.giveTestMillion = function() {
    // Find the setTestEarnings function from game.js
    if (typeof setTestEarnings === 'function') {
        setTestEarnings(1000000);
    }
    lastShownMilestoneEarnings = 0;
    console.log('TEST: Set earnings to $1M');
    console.log('Rugpull eligible:', isRugpullEligible());
    if (typeof updateUI === 'function') {
        updateUI();
    }
};

/**
 * Test function - give $10M for testing rugpull feature
 * Type in console: giveTestTenMillion()
 */
window.giveTestTenMillion = function() {
    if (typeof setTestEarnings === 'function') {
        setTestEarnings(10000000);
    }
    lastShownMilestoneEarnings = 0;
    console.log('TEST: Set earnings to $10M');
    console.log('Rugpull eligible:', isRugpullEligible());
    if (typeof updateUI === 'function') {
        updateUI();
    }
};

/**
 * Test function - give $100M for testing rugpull feature
 * Type in console: giveTestHundredMillion()
 */
window.giveTestHundredMillion = function() {
    if (typeof setTestEarnings === 'function') {
        setTestEarnings(100000000);
    }
    lastShownMilestoneEarnings = 0;
    console.log('TEST: Set earnings to $100M');
    console.log('Rugpull eligible:', isRugpullEligible());
    if (typeof updateUI === 'function') {
        updateUI();
    }
};

/**
 * Test function - give $10B for testing rugpull feature
 * Type in console: giveTest10Billion()
 */
window.giveTest10Billion = function() {
    if (typeof setTestEarnings === 'function') {
        setTestEarnings(10000000000);
    }
    lastShownMilestoneEarnings = 0;
    console.log('TEST: Set earnings to $10B');
    console.log('Tokens earned:', calculateRugpullReward());
    console.log('Rugpull eligible:', isRugpullEligible());
    if (typeof updateUI === 'function') {
        updateUI();
    }
};

/**
 * Test function - give $100B for testing rugpull feature
 * Type in console: giveTest100Billion()
 */
window.giveTest100Billion = function() {
    if (typeof setTestEarnings === 'function') {
        setTestEarnings(100000000000);
    }
    lastShownMilestoneEarnings = 0;
    console.log('TEST: Set earnings to $100B');
    console.log('Tokens earned:', calculateRugpullReward());
    console.log('Rugpull eligible:', isRugpullEligible());
    if (typeof updateUI === 'function') {
        updateUI();
    }
};

/**
 * Test function - give $1T for testing rugpull feature
 * Type in console: giveTest1Trillion()
 */
window.giveTest1Trillion = function() {
    if (typeof setTestEarnings === 'function') {
        setTestEarnings(1000000000000);
    }
    lastShownMilestoneEarnings = 0;
    console.log('TEST: Set earnings to $1T');
    console.log('Tokens earned:', calculateRugpullReward());
    console.log('Rugpull eligible:', isRugpullEligible());
    if (typeof updateUI === 'function') {
        updateUI();
    }
};

// Export testRugpull to window so it can be called from console
window.testRugpull = testRugpull;

// Export metaUpgrades and upgradeToggleState to window so game.js can access them
window.metaUpgrades = metaUpgrades;
window.upgradeToggleState = upgradeToggleState;

// Debug: Confirm exports are available
console.log('[RUGPULL] Exports set to window:', {
    metaUpgradesAvailable: !!window.metaUpgrades,
    auto_sell_crypto: window.metaUpgrades && window.metaUpgrades.auto_sell_crypto ? window.metaUpgrades.auto_sell_crypto : 'NOT FOUND',
    upgradeToggleState: window.upgradeToggleState
});

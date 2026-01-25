// RUGPULL / ASCENSION SYSTEM
// Cookie Clicker-style ascending system with permanent meta-upgrades
// Players sacrifice current progress for permanent bonuses

// ==============================================
// STATE VARIABLES
// ==============================================

let ascensionLevel = 0;              // Total number of times the player has ascended
let rugpullCurrency = 0;             // "Corrupt Tokens" - earned through ascension
let ascensionStats = {
    totalRunsCompleted: 0,           // Total times player has reset
    currencyEarned: 0,               // Lifetime total of earned currency
    bestRunEarnings: 0,              // Highest $ earned in a single run
    totalGlobalBonus: 0              // Sum of all purchased bonuses
};

// Meta-upgrades purchased by the player (persists across resets)
let metaUpgrades = {
    mining_speed_5: { purchased: false, cost: 50 },      // +5% mining speed
    mining_speed_10: { purchased: false, cost: 150 },    // +10% mining speed
    mining_speed_25: { purchased: false, cost: 500 },    // +25% mining speed
    mining_speed_50: { purchased: false, cost: 2000 },   // +50% mining speed
    starter_miners: { purchased: false, cost: 100 },     // Start with 1 of each basic miner
    auto_buy_basic: { purchased: false, cost: 200 },     // Auto-buy basic miners when affordable
    power_efficiency: { purchased: false, cost: 300 },   // 20% better power efficiency
    offline_boost: { purchased: false, cost: 400 },      // 2x offline earnings
    advanced_quantum: { purchased: false, cost: 1500 },  // Unlock quantum miners at start
    prestige_tokens: { purchased: false, cost: 5000 }    // +1% per token spent lifetime
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
    const reward = calculateRugpullReward();
    const title = `🔓 HARD FORK DETECTED`;
    const message = `Your network has detected an opportunity for optimization.

Current Progress:
• Lifetime Earnings: $${lifetimeEarnings.toLocaleString()}
• Current Cash: $${dollarBalance.toLocaleString()}
• Ascensions Completed: ${ascensionLevel}

═══════════════════════════════════

RUGPULL NOW to gain ${reward} Corrupt Tokens

This will:
✗ Reset all coins and miners
✗ Clear all upgrades
✗ Reset production speed
✓ Keep all meta-upgrades
✓ Grant permanent bonuses
✓ Start new run with 2x speed

═══════════════════════════════════`;

    const confirmed = confirm(title + "\n\n" + message + "\n\n[OK] to RUGPULL, [Cancel] to continue");
    if (confirmed) {
        executeRugpull(reward);
    }
}

/**
 * Execute the rugpull ascension
 */
function executeRugpull(reward) {
    // Prevent execution during import
    importInProgress = true;

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

    // Initialize new run with bonuses
    initializeNewRun();

    // Unlock systems based on ascension level
    unlockSystems();

    // Save and update UI
    importInProgress = false;
    saveGame();
    updateUI();
    updateStakingUI();

    // Show success message
    alert(`🎉 RUGPULL COMPLETE!\n\n+${reward} Corrupt Tokens earned\n\nTotal Tokens: ${rugpullCurrency}\n\nNew run starting with bonuses...\n\nOpen the Meta-Upgrades to spend your tokens!`);

    // Open meta-upgrades modal so player can spend tokens immediately
    setTimeout(() => {
        openMetaUpgradesModal();
    }, 500);

    // Reload to show new UI state after a delay (gives time to see modal)
    setTimeout(() => {
        window.location.reload(true);
    }, 3000);
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

        // Recalculate per-second rates
        btcPerSec = btcUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);
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
        alert('Already purchased!');
        return;
    }

    if (rugpullCurrency < upgrade.cost) {
        alert(`Not enough Corrupt Tokens!\nNeed: ${upgrade.cost}, Have: ${rugpullCurrency}`);
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
    alert(`✓ Purchased: ${getUpgradeName(upgradeKey)}`);
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
        ascensionStats,
        metaUpgrades,
        unlockedSystems
    };
}

/**
 * Load ascension data from save
 */
function loadAscensionData(data) {
    if (!data) return;

    ascensionLevel = data.ascensionLevel || 0;
    rugpullCurrency = data.rugpullCurrency || 0;
    ascensionStats = data.ascensionStats || {
        totalRunsCompleted: 0,
        currencyEarned: 0,
        bestRunEarnings: 0,
        totalGlobalBonus: 0
    };
    metaUpgrades = data.metaUpgrades || metaUpgrades;
    unlockedSystems = data.unlockedSystems || unlockedSystems;
}

/**
 * Check if player is eligible to rugpull
 */
function isRugpullEligible() {
    // Eligible if earned at least $1M lifetime or have decent progress
    return lifetimeEarnings >= 1000000 || btcPerSec > 0.01;
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
    if (rugpullBtn) {
        const isEligible = isRugpullEligible();
        rugpullBtn.style.display = 'inline-block';
        rugpullBtn.disabled = !isEligible;

        if (!isEligible) {
            rugpullBtn.style.opacity = '0.5';
            rugpullBtn.style.cursor = 'not-allowed';
            rugpullBtn.title = `Rugpull requires: $1M lifetime earnings OR BTC mining speed > 0.01/sec\n\nCurrent: $${lifetimeEarnings.toLocaleString()} earnings | ${btcPerSec.toFixed(8)} ₿/sec`;
        } else {
            rugpullBtn.style.opacity = '1';
            rugpullBtn.style.cursor = 'pointer';
            rugpullBtn.title = `Ready to Rugpull! You will earn ${calculateRugpullReward()} Corrupt Tokens`;
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
        alert(`🔴 NOT READY TO RUGPULL\n\nRequirements:\n• $1,000,000 lifetime earnings\nOR\n• Bitcoin mining speed > 0.01/sec\n\nCurrent Progress:\n• Earnings: $${lifetimeEarnings.toLocaleString()}\n• BTC Speed: ${btcPerSec.toFixed(8)} ₿/sec`);
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

console.log('🔴 RUGPULL.JS LOADING - START');

// RUGPULL / ASCENSION SYSTEM
// Cookie Clicker-style ascending system with permanent meta-upgrades
// Players sacrifice current progress for permanent bonuses

// ==============================================
// STATE VARIABLES
// ==============================================

let ascensionLevel = 0;                      // Total number of times the player has ascended
let rugpullCurrency = 0;                     // "Corrupt Tokens" - earned through ascension
let lastShownMilestoneEarnings = 0;          // Track which $1M milestone popup was shown
let lifetimeEarningsThisRugpull = 0;         // Earnings since last rugpull (for rugpull eligibility tracking) - RESETS each rugpull
let lifetimeEarningsDisplay = 0;             // Total lifetime earnings to DISPLAY to player (persists across rugpulls)
let rugpullButtonListenersAttached = false;  // Flag to prevent duplicate event listeners
let upgradeToggleState = {
    auto_sell: true                  // Auto-sell crypto toggle state
};  // Track toggle states for upgrades that can be turned on/off
let showRugpullConfirmation = true;  // Toggle for confirmation modal (can be disabled by "never show again")
let ascensionStats = {
    totalRunsCompleted: 0,           // Total times player has reset
    currencyEarned: 0,               // Lifetime total of earned currency
    bestRunEarnings: 0,              // Highest $ earned in a single run
    totalGlobalBonus: 0              // Sum of all purchased bonuses
};

// Permanent milestone doubling progression (persists across rugpulls)
// Stores which doublings player has purchased at each milestone level
// Structure: { btcDoublings: {1: true, 5: false, ...}, ethDoublings: {...}, dogeDoublings: {...} }
let permanentMilestoneDoublings = {
    btcDoublings: {},     // {1: true, 5: true, 10: false, ...}
    ethDoublings: {},     // {1: false, 5: false, ...}
    dogeDoublings: {}     // {1: false, 5: false, ...}
};

// Meta-upgrades purchased by the player (persists across resets)
let metaUpgrades = {
    // TIER 1 - 7500 tokens each (1.5x scale)
    power_capacity_1: { purchased: false, cost: 7500 },
    miner_efficiency_1: { purchased: false, cost: 7500 },
    staking_apy_1: { purchased: false, cost: 7500 },
    miner_hashrate_1: { purchased: false, cost: 7500 },
    click_hashrate_1: { purchased: false, cost: 7500 },
    offline_earnings_1: { purchased: false, cost: 7500 },
    earnings_boost_1: { purchased: false, cost: 7500 },
    minigame_reward_1: { purchased: false, cost: 7500 },
    token_generation_0: { purchased: false, cost: 7500 },
    // TIER 2 - 11250 tokens each (1.5x multiplier)
    power_capacity_2: { purchased: false, cost: 11250 },
    miner_efficiency_2: { purchased: false, cost: 11250 },
    staking_apy_2: { purchased: false, cost: 11250 },
    miner_hashrate_2: { purchased: false, cost: 11250 },
    click_hashrate_2: { purchased: false, cost: 11250 },
    offline_earnings_2: { purchased: false, cost: 11250 },
    earnings_boost_2: { purchased: false, cost: 11250 },
    minigame_reward_2: { purchased: false, cost: 11250 },
    token_generation_1_alt: { purchased: false, cost: 11250 },
    // TIER 3 - 16875 tokens each (1.5x multiplier)
    power_capacity_3: { purchased: false, cost: 16875 },
    miner_efficiency_3: { purchased: false, cost: 16875 },
    staking_apy_3: { purchased: false, cost: 16875 },
    miner_hashrate_3: { purchased: false, cost: 16875 },
    click_hashrate_3: { purchased: false, cost: 16875 },
    offline_earnings_3: { purchased: false, cost: 16875 },
    earnings_boost_3: { purchased: false, cost: 16875 },
    minigame_reward_3: { purchased: false, cost: 16875 },
    auto_sell: { purchased: false, cost: 16875 },
    token_generation_2_alt: { purchased: false, cost: 16875 },
    // TIER 4 - 25312 tokens each (1.5x multiplier)
    power_capacity_4: { purchased: false, cost: 25312 },
    miner_efficiency_4: { purchased: false, cost: 25312 },
    staking_apy_4: { purchased: false, cost: 25312 },
    miner_hashrate_4: { purchased: false, cost: 25312 },
    click_hashrate_4: { purchased: false, cost: 25312 },
    offline_earnings_4: { purchased: false, cost: 25312 },
    earnings_boost_4: { purchased: false, cost: 25312 },
    minigame_reward_4: { purchased: false, cost: 25312 },
    token_generation_3_alt: { purchased: false, cost: 25312 },
    // TIER 5 - 37968 tokens each (1.5x multiplier)
    power_capacity_5: { purchased: false, cost: 37968 },
    miner_efficiency_5: { purchased: false, cost: 37968 },
    staking_apy_5: { purchased: false, cost: 37968 },
    miner_hashrate_5: { purchased: false, cost: 37968 },
    click_hashrate_5: { purchased: false, cost: 37968 },
    offline_earnings_5: { purchased: false, cost: 37968 },
    earnings_boost_5: { purchased: false, cost: 37968 },
    minigame_reward_5: { purchased: false, cost: 37968 },
    starter_miners_t4: { purchased: false, cost: 37968 },
    starter_power_p3: { purchased: false, cost: 37968 },
    token_generation_4_alt: { purchased: false, cost: 37968 },
    // TIER 6 - 56953 tokens each (1.5x multiplier)
    power_capacity_6: { purchased: false, cost: 56953 },
    miner_efficiency_6: { purchased: false, cost: 56953 },
    staking_apy_6: { purchased: false, cost: 56953 },
    miner_hashrate_6: { purchased: false, cost: 56953 },
    click_hashrate_6: { purchased: false, cost: 56953 },
    offline_earnings_6: { purchased: false, cost: 56953 },
    earnings_boost_6: { purchased: false, cost: 56953 },
    minigame_reward_6: { purchased: false, cost: 56953 },
    starter_miners_t5: { purchased: false, cost: 56953 },
    starter_power_p4: { purchased: false, cost: 56953 },
    token_generation_t6: { purchased: false, cost: 56953 },
    // TIER 7 - 85429 tokens each (1.5x multiplier)
    power_capacity_7: { purchased: false, cost: 85429 },
    miner_efficiency_7: { purchased: false, cost: 85429 },
    staking_apy_7: { purchased: false, cost: 85429 },
    miner_hashrate_7: { purchased: false, cost: 85429 },
    click_hashrate_7: { purchased: false, cost: 85429 },
    offline_earnings_7: { purchased: false, cost: 85429 },
    earnings_boost_7: { purchased: false, cost: 85429 },
    minigame_reward_7: { purchased: false, cost: 85429 },
    starter_miners_t6: { purchased: false, cost: 85429 },
    starter_power_p5: { purchased: false, cost: 85429 },
    minigame_unlock: { purchased: false, cost: 85429 },
    token_generation_t7: { purchased: false, cost: 85429 },
    // TIER 8 - 128144 tokens each (1.5x multiplier)
    power_capacity_8: { purchased: false, cost: 128144 },
    miner_efficiency_8: { purchased: false, cost: 128144 },
    staking_apy_8: { purchased: false, cost: 128144 },
    miner_hashrate_8: { purchased: false, cost: 128144 },
    click_hashrate_8: { purchased: false, cost: 128144 },
    offline_earnings_8: { purchased: false, cost: 128144 },
    earnings_boost_8: { purchased: false, cost: 128144 },
    minigame_reward_8: { purchased: false, cost: 128144 },
    starter_miners_t7: { purchased: false, cost: 128144 },
    starter_power_p6: { purchased: false, cost: 128144 },
    cash_multiplier: { purchased: false, cost: 128144 },
    token_generation_t8: { purchased: false, cost: 128144 },
    // TIER 9 - 192216 tokens each (1.5x multiplier)
    power_capacity_9: { purchased: false, cost: 192216 },
    miner_efficiency_9: { purchased: false, cost: 192216 },
    staking_apy_9: { purchased: false, cost: 192216 },
    miner_hashrate_9: { purchased: false, cost: 192216 },
    click_hashrate_9: { purchased: false, cost: 192216 },
    offline_earnings_9: { purchased: false, cost: 192216 },
    earnings_boost_9: { purchased: false, cost: 192216 },
    minigame_reward_9: { purchased: false, cost: 192216 },
    starter_miners_t8: { purchased: false, cost: 192216 },
    starter_power_p7: { purchased: false, cost: 192216 },
    token_generation_t9: { purchased: false, cost: 192216 },
    // TIER 10 - 288324 tokens each (1.5x multiplier)
    power_capacity_10: { purchased: false, cost: 288324 },
    miner_efficiency_10: { purchased: false, cost: 288324 },
    staking_apy_10: { purchased: false, cost: 288324 },
    miner_hashrate_10: { purchased: false, cost: 288324 },
    click_hashrate_10: { purchased: false, cost: 288324 },
    offline_earnings_10: { purchased: false, cost: 288324 },
    earnings_boost_10: { purchased: false, cost: 288324 },
    minigame_reward_10: { purchased: false, cost: 288324 },
    starter_miners_t9: { purchased: false, cost: 288324 },
    starter_power_p8: { purchased: false, cost: 288324 },
    token_generation_t10: { purchased: false, cost: 288324 },
    // TIER 11 - 432486 tokens each (1.5x multiplier)
    power_capacity_11: { purchased: false, cost: 432486 },
    miner_efficiency_11: { purchased: false, cost: 432486 },
    staking_apy_11: { purchased: false, cost: 432486 },
    miner_hashrate_11: { purchased: false, cost: 432486 },
    click_hashrate_11: { purchased: false, cost: 432486 },
    offline_earnings_11: { purchased: false, cost: 432486 },
    earnings_boost_11: { purchased: false, cost: 432486 },
    minigame_reward_11: { purchased: false, cost: 432486 },
    starter_miners_t10: { purchased: false, cost: 432486 },
    starter_power_p9: { purchased: false, cost: 432486 },
    token_generation_t11: { purchased: false, cost: 432486 },
    // TIER 12 - 648729 tokens each (1.5x multiplier)
    power_capacity_12: { purchased: false, cost: 648729 },
    miner_efficiency_12: { purchased: false, cost: 648729 },
    staking_apy_12: { purchased: false, cost: 648729 },
    miner_hashrate_12: { purchased: false, cost: 648729 },
    click_hashrate_12: { purchased: false, cost: 648729 },
    offline_earnings_12: { purchased: false, cost: 648729 },
    earnings_boost_12: { purchased: false, cost: 648729 },
    minigame_reward_12: { purchased: false, cost: 648729 },
    starter_miners_t11: { purchased: false, cost: 648729 },
    starter_power_p10: { purchased: false, cost: 648729 },
    token_generation_t12: { purchased: false, cost: 648729 },
    // TIER 13 - 973094 tokens each (1.5x multiplier)
    power_capacity_13: { purchased: false, cost: 973094 },
    miner_efficiency_13: { purchased: false, cost: 973094 },
    staking_apy_13: { purchased: false, cost: 973094 },
    miner_hashrate_13: { purchased: false, cost: 973094 },
    click_hashrate_13: { purchased: false, cost: 973094 },
    offline_earnings_13: { purchased: false, cost: 973094 },
    earnings_boost_13: { purchased: false, cost: 973094 },
    minigame_reward_13: { purchased: false, cost: 973094 },
    starter_miners_t12: { purchased: false, cost: 973094 },
    starter_power_p11: { purchased: false, cost: 973094 },
    token_generation_t13: { purchased: false, cost: 973094 },
    // TIER 14 - 1459641 tokens each (1.5x multiplier)
    power_capacity_14: { purchased: false, cost: 1459641 },
    miner_efficiency_14: { purchased: false, cost: 1459641 },
    staking_apy_14: { purchased: false, cost: 1459641 },
    miner_hashrate_14: { purchased: false, cost: 1459641 },
    click_hashrate_14: { purchased: false, cost: 1459641 },
    offline_earnings_14: { purchased: false, cost: 1459641 },
    earnings_boost_14: { purchased: false, cost: 1459641 },
    minigame_reward_14: { purchased: false, cost: 1459641 },
    starter_miners_t13: { purchased: false, cost: 1459641 },
    starter_power_p12: { purchased: false, cost: 1459641 },
    token_generation_t14: { purchased: false, cost: 1459641 },
    // TIER 15 - 2189461 tokens each (1.5x multiplier)
    power_capacity_15: { purchased: false, cost: 2189461 },
    miner_efficiency_15: { purchased: false, cost: 2189461 },
    staking_apy_15: { purchased: false, cost: 2189461 },
    miner_hashrate_15: { purchased: false, cost: 2189461 },
    click_hashrate_15: { purchased: false, cost: 2189461 },
    offline_earnings_15: { purchased: false, cost: 2189461 },
    earnings_boost_15: { purchased: false, cost: 2189461 },
    minigame_reward_15: { purchased: false, cost: 2189461 },
    starter_miners_t14: { purchased: false, cost: 2189461 },
    token_generation_t15: { purchased: false, cost: 2189461 },
    // TIER 16 - 3284192 tokens each (1.5x multiplier)
    power_capacity_16: { purchased: false, cost: 3284192 },
    miner_efficiency_16: { purchased: false, cost: 3284192 },
    staking_apy_16: { purchased: false, cost: 3284192 },
    miner_hashrate_16: { purchased: false, cost: 3284192 },
    click_hashrate_16: { purchased: false, cost: 3284192 },
    offline_earnings_16: { purchased: false, cost: 3284192 },
    earnings_boost_16: { purchased: false, cost: 3284192 },
    minigame_reward_16: { purchased: false, cost: 3284192 },
    starter_miners_t15: { purchased: false, cost: 3284192 },
    token_generation_t16: { purchased: false, cost: 3284192 },
    // TIER 17 - 4926288 tokens each (1.5x multiplier)
    power_capacity_17: { purchased: false, cost: 4926288 },
    miner_efficiency_17: { purchased: false, cost: 4926288 },
    staking_apy_17: { purchased: false, cost: 4926288 },
    miner_hashrate_17: { purchased: false, cost: 4926288 },
    click_hashrate_17: { purchased: false, cost: 4926288 },
    offline_earnings_17: { purchased: false, cost: 4926288 },
    earnings_boost_17: { purchased: false, cost: 4926288 },
    minigame_reward_17: { purchased: false, cost: 4926288 },
    starter_miners_t16: { purchased: false, cost: 4926288 },
    token_generation_t17: { purchased: false, cost: 4926288 },
    // TIER 18 - 7389432 tokens each (1.5x multiplier)
    power_capacity_18: { purchased: false, cost: 7389432 },
    miner_efficiency_18: { purchased: false, cost: 7389432 },
    staking_apy_18: { purchased: false, cost: 7389432 },
    miner_hashrate_18: { purchased: false, cost: 7389432 },
    click_hashrate_18: { purchased: false, cost: 7389432 },
    offline_earnings_18: { purchased: false, cost: 7389432 },
    earnings_boost_18: { purchased: false, cost: 7389432 },
    minigame_reward_18: { purchased: false, cost: 7389432 },
    starter_miners_t17: { purchased: false, cost: 7389432 },
    token_generation_t18: { purchased: false, cost: 7389432 },
    // TIER 19 - 11084148 tokens each (1.5x multiplier)
    power_capacity_19: { purchased: false, cost: 11084148 },
    miner_efficiency_19: { purchased: false, cost: 11084148 },
    staking_apy_19: { purchased: false, cost: 11084148 },
    miner_hashrate_19: { purchased: false, cost: 11084148 },
    click_hashrate_19: { purchased: false, cost: 11084148 },
    offline_earnings_19: { purchased: false, cost: 11084148 },
    earnings_boost_19: { purchased: false, cost: 11084148 },
    minigame_reward_19: { purchased: false, cost: 11084148 },
    starter_miners_t18: { purchased: false, cost: 11084148 },
    token_generation_t19: { purchased: false, cost: 11084148 },
    // TIER 20 - 16626222 tokens each (1.5x multiplier)
    power_capacity_20: { purchased: false, cost: 16626222 },
    miner_efficiency_20: { purchased: false, cost: 16626222 },
    staking_apy_20: { purchased: false, cost: 16626222 },
    miner_hashrate_20: { purchased: false, cost: 16626222 },
    click_hashrate_20: { purchased: false, cost: 16626222 },
    offline_earnings_20: { purchased: false, cost: 16626222 },
    earnings_boost_20: { purchased: false, cost: 16626222 },
    minigame_reward_20: { purchased: false, cost: 16626222 },
    starter_miners_t19: { purchased: false, cost: 16626222 },
    token_generation_t20: { purchased: false, cost: 16626222 }
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
 * Ensure all metaUpgrade keys have default values (for backwards compatibility with old saves)
 */
function ensureMetaUpgradesInitialized() {
    const defaultMetaUpgrades = {
        // TIER 1
        power_capacity_1: { purchased: false, cost: 10 },
        miner_efficiency_1: { purchased: false, cost: 10 },
        staking_apy_1: { purchased: false, cost: 10 },
        miner_hashrate_1: { purchased: false, cost: 10 },
        click_hashrate_1: { purchased: false, cost: 10 },
        offline_earnings_1: { purchased: false, cost: 10 },
        earnings_boost_1: { purchased: false, cost: 10 },
        minigame_reward_1: { purchased: false, cost: 10 },
        // TIER 2-20: Add all tier keys in compact form
        ...Object.fromEntries(
            Object.keys(metaUpgrades)
                .filter(key => /^(power_capacity|miner_efficiency|staking_apy|miner_hashrate|click_hashrate|offline_earnings|earnings_boost|minigame_reward)_\d+$/.test(key))
                .map(key => {
                    const tier = parseInt(key.match(/\d+$/)[0]);
                    const type = key.replace(/_\d+$/, '');
                    let cost;

                    // New rugpull progression: 1M, 50M, 100M, 1B, 1T, 1Q, 1^500
                    if (tier === 1) cost = 1_000_000;           // 1M
                    else if (tier === 2) cost = 50_000_000;     // 50M
                    else if (tier === 3) cost = 100_000_000;    // 100M
                    else if (tier === 4) cost = 1_000_000_000;  // 1B
                    else if (tier === 5) cost = 1_000_000_000_000; // 1T
                    else if (tier === 6) cost = 1_000_000_000_000_000; // 1 Quadrillion
                    else {
                        // For tier 7+: exponential growth toward 10^500
                        // Use 10^(5 + (tier-6)*50) to reach 10^500 at tier 11
                        cost = Math.pow(10, 5 + (tier - 6) * 50);
                    }

                    return [key, { purchased: false, cost }];
                })
        )
    };

    // Merge defaults with actual upgrades, preserving purchased state
    for (const [key, defaultValue] of Object.entries(defaultMetaUpgrades)) {
        if (!metaUpgrades[key]) {
            metaUpgrades[key] = { ...defaultValue };
        }
        // DO NOT override click_hashrate costs - they should match their tier costs
    }

    // Ensure all other upgrades from the full default list exist
    const fullDefaults = {
        // Tier-specific upgrades (not in the tier loops above)
        auto_sell: { purchased: false, cost: 270 },
        starter_miners_t1: { purchased: false, cost: 80 },
        starter_miners_t2: { purchased: false, cost: 270 },
        starter_miners_t3: { purchased: false, cost: 640 },
        starter_miners_t4: { purchased: false, cost: 1250 },
        starter_miners_t5: { purchased: false, cost: 2160 },
        starter_miners_t6: { purchased: false, cost: 3430 },
        starter_miners_t7: { purchased: false, cost: 5120 },
        starter_miners_t8: { purchased: false, cost: 7290 },
        starter_miners_t9: { purchased: false, cost: 10000 },
        starter_miners_t10: { purchased: false, cost: 13310 },
        starter_miners_t11: { purchased: false, cost: 17280 },
        starter_miners_t12: { purchased: false, cost: 21970 },
        starter_miners_t13: { purchased: false, cost: 27440 },
        starter_miners_t14: { purchased: false, cost: 33750 },
        starter_miners_t15: { purchased: false, cost: 40960 },
        starter_miners_t16: { purchased: false, cost: 49130 },
        starter_miners_t17: { purchased: false, cost: 58320 },
        starter_miners_t18: { purchased: false, cost: 68590 },
        starter_miners_t19: { purchased: false, cost: 80000 },
        starter_power_p0: { purchased: false, cost: 80 },
        starter_power_p1: { purchased: false, cost: 270 },
        starter_power_p2: { purchased: false, cost: 640 },
        starter_power_p3: { purchased: false, cost: 1250 },
        starter_power_p4: { purchased: false, cost: 2160 },
        starter_power_p5: { purchased: false, cost: 3430 },
        starter_power_p6: { purchased: false, cost: 5120 },
        starter_power_p7: { purchased: false, cost: 7290 },
        starter_power_p8: { purchased: false, cost: 10000 },
        starter_power_p9: { purchased: false, cost: 13310 },
        starter_power_p10: { purchased: false, cost: 17280 },
        starter_power_p11: { purchased: false, cost: 21970 },
        starter_power_p12: { purchased: false, cost: 27440 },
        token_generation_1: { purchased: false, cost: 2160 },
        minigame_unlock: { purchased: false, cost: 3430 },
        cash_multiplier: { purchased: false, cost: 5120 },
        crypto_efficiency_1: { purchased: false, cost: 7290 },
        crypto_efficiency_2: { purchased: false, cost: 17280 },
        crypto_efficiency_3: { purchased: false, cost: 33750 },
        crypto_efficiency_4: { purchased: false, cost: 57600 },
        token_generation_2: { purchased: false, cost: 10000 },
        token_generation_3: { purchased: false, cost: 21970 },
        token_generation_4: { purchased: false, cost: 40960 },
        token_generation_5: { purchased: false, cost: 68590 }
    };

    for (const [key, defaultValue] of Object.entries(fullDefaults)) {
        if (!metaUpgrades[key]) {
            metaUpgrades[key] = { ...defaultValue };
        }
    }
}

/**
 * Calculate the reward (Corrupt Tokens) for ascending
 * Cubic scaling: 40 × level³ tokens
 * Bonus: 1 token per $1B earned above the requirement
 */
function calculateRugpullReward() {
    const requirement = getRugpullRequirement();
    const earnings = lifetimeEarningsThisRugpull;
    const level = ascensionLevel + 1;  // Convert to 1-indexed

    // Base reward: 40 × level^3 (cubic scaling)
    // Rugpull 1: 40 tokens, Rugpull 2: 320 tokens, Rugpull 3: 1,080 tokens, Rugpull 4: 2,560 tokens
    // Rugpull 5: 5,000 tokens, Rugpull 6: 8,640 tokens, Rugpull 10: 40,000 tokens
    const baseReward = 40 * Math.pow(level, 3);

    // Bonus tokens for exceeding requirement
    // Capped logarithmic scaling: bonus grows slower as earnings get higher
    // This prevents early rugpulls from giving too many tokens
    const excessEarnings = Math.max(0, earnings - requirement);
    const excessMultiplier = excessEarnings / requirement; // How many times the requirement was exceeded
    // Use logarithmic scaling: log(1 + x) grows slower than x
    // Max bonus is 4x the base reward (so at most 5x total with base)
    const bonusTokens = Math.floor(baseReward * Math.log(1 + excessMultiplier) * 2);

    const totalReward = baseReward + bonusTokens;

    // Minimum 1 token even if poor
    return Math.max(1, Math.floor(totalReward));
}

/**
 * Show the rugpull confirmation modal
 */
function showRugpullOffer() {
    // Helper function to abbreviate large numbers
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
        return num.toLocaleString();
    }

    // Get values from game.js with fallbacks
    const earnings = lifetimeEarningsThisRugpull;
    const cash = window.gameState && window.gameState.dollarBalance ? window.gameState.dollarBalance : 0;

    // Calculate token reward - exponential scaling with rugpull level
    // Each rugpull gets more base tokens as you progress
    // Designed so players can afford ~1-2 upgrades per tier every 2-4 rugpulls
    // Level 1: 20 tokens (Tier 1 costs 20 each)
    // Level 2: 100 tokens (Tier 2 costs 100 each)
    // Level 3: 400 tokens (Tier 3 costs 400 each)
    // Level 4+: grows at 2.5x per level (1k, 2.5k, 6.25k, 15.625k, ...)
    const requirement = getRugpullRequirement();
    const level = ascensionLevel + 1;  // Convert to 1-indexed

    // Base reward: exponential scaling with 1.025x multiplier per level
    // Target: ~3-5 upgrades per rugpull early game, ~23M tokens by R100
    // Level 1: 7500, Level 2: 37500, Level 3: 60000, Level 4+: 60000 × 1.025^(level-3)
    // This gives: R1: 7.5K, R2: 37.5K, R3: 60K, R4: 61.5K, R5: 63K, ... R100: ~23.5M
    let baseReward;
    if (level === 1) {
        baseReward = 7500;
    } else if (level === 2) {
        baseReward = 37500;
    } else {
        // Level 3+: 60000 × 1.025^(level-3) = 60000, 61500, 63075, 64626, ...
        baseReward = Math.floor(60000 * Math.pow(1.025, level - 3));
    }

    // Excess bonus: minimal bonus from grinding beyond requirement (~10% of base)
    // This makes base tokens the primary source, not the bonus
    const excessEarnings = Math.max(0, earnings - requirement);
    const excessMultiplier = excessEarnings / requirement;

    // Heavily reduced bonus scaling: log(1 + x) * 0.1 (90% less rewarding than before)
    // At exactly requirement: 0x bonus
    // At 2x requirement: ~0.07x bonus (0.07 tokens per base token)
    // At 10x requirement: ~0.23x bonus
    // At 100x requirement: ~0.35x bonus (capped at 1x max)
    const bonusMultiplier = Math.min(1.0, Math.log(1 + excessMultiplier) * 0.1);
    const bonusTokens = Math.floor(baseReward * bonusMultiplier);
    const reward = Math.max(1, Math.floor(baseReward + bonusTokens));

    // DEBUG: Log the calculation
    console.log('[RUGPULL CALC]', { earnings, requirement, excessEarnings, excessMultiplier, baseReward, bonusMultiplier, bonusTokens, reward });

    const starterCash = 1000 + (ascensionLevel * 1000);

    // Create modal instead of using confirm()
    const modal = document.getElementById('rugpull-milestone-modal');
    const modalText = document.getElementById('milestone-modal-text');
    const confirmBtn = document.getElementById('milestone-confirm-btn');

    if (modal && modalText && confirmBtn) {
        modalText.innerHTML = `
            <div style="color: #ffeb3b; font-size: 1.1rem; font-weight: bold; margin-bottom: 10px;">🔓 HARD FORK DETECTED</div>
            <div style="color: #fff; font-size: 0.85rem; line-height: 1.5;">
                <div style="color: #ccc; margin-bottom: 8px; font-weight: bold;">Current Progress:</div>
                <div style="margin-bottom: 8px;">
                    • Lifetime Earnings: <span style="color: #4CAF50;">$${abbreviateNumber(earnings)}</span><br>
                    • Current Cash: <span style="color: #4CAF50;">$${abbreviateNumber(cash)}</span><br>
                    • Ascensions Completed: <span style="color: #4CAF50;">${ascensionLevel}</span>
                </div>
                <div style="border-top: 1px solid #555; padding-top: 8px; margin-top: 8px;">
                    <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 6px;">TOKEN CALCULATION:</div>
                    <div style="margin-bottom: 8px; color: #ddd; font-size: 0.8rem;">
                        • Base Tokens: <span style="color: #4CAF50;">${baseReward}</span><br>
                        ${bonusTokens > 0 ? `• Bonus Tokens: <span style="color: #4CAF50;">+${bonusTokens}</span><br>` : ''}
                        • TOTAL: <span style="color: #ffeb3b;">${reward}</span> Corrupt Tokens<br>
                    </div>
                </div>
                <div style="border-top: 1px solid #555; padding-top: 8px; margin-top: 8px;">
                    <div style="color: #ffeb3b; font-weight: bold; margin-bottom: 6px;">RUGPULL REWARDS:</div>
                    <div style="margin-bottom: 6px; font-size: 0.8rem;">
                        • Earn <span style="color: #ffeb3b;">${reward}</span> Corrupt Tokens<br>
                        • Start with <span style="color: #ffeb3b;">$${starterCash}</span> cash<br>
                        • +1% mining speed per rugpull (+${(ascensionLevel * 1).toFixed(0)}% Total)<br>
                        • +1% manual hash per rugpull (+${(ascensionLevel * 1).toFixed(0)}% Total)<br>
                    </div>
                    <div style="border-top: 1px solid #555; padding-top: 6px; margin-top: 6px; color: #ccc; font-size: 0.75rem;">
                        This will:<br>
                        ✗ Reset all coins and miners<br>
                        ✗ Clear all upgrades<br>
                        ✓ Keep all meta-upgrades
                    </div>
                </div>
            </div>
        `;

        // Update button to confirm
        confirmBtn.textContent = 'RUGPULL NOW';
        confirmBtn.onclick = function() {
            if (showRugpullConfirmation) {
                showRugpullConfirmationModal(reward);
            } else {
                executeRugpull(reward);
            }
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
 * Show confirmation modal before rugpull with "never show again" option
 */
function showRugpullConfirmationModal(reward) {
    const modal = document.createElement('div');
    modal.id = 'rugpull-confirm-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="background: #1a1a2e; border: 3px solid #ffeb3b; border-radius: 12px; padding: 30px; max-width: 400px; text-align: center; box-shadow: 0 0 30px rgba(255, 235, 59, 0.5);">
            <div style="color: #ffeb3b; font-size: 1.5rem; font-weight: bold; margin-bottom: 15px;">⚠️ CONFIRM RUGPULL</div>
            <div style="color: #fff; margin-bottom: 20px; line-height: 1.6;">
                Are you sure you want to reset your progress?<br>
                <br>
                <span style="color: #4CAF50; font-weight: bold;">+${reward} Corrupt Tokens</span> will be earned!
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 15px; justify-content: center;">
                <button id="rugpull-confirm-yes" style="background: #9c27b0; color: white; border: 2px solid #ffeb3b; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">YES, RUGPULL</button>
                <button id="rugpull-confirm-no" style="background: #666; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">CANCEL</button>
            </div>
            <label style="color: #ccc; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <input type="checkbox" id="rugpull-never-show" style="cursor: pointer; width: 16px; height: 16px;">
                Don't show this again
            </label>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('rugpull-confirm-yes').onclick = function() {
        const neverShowCheckbox = document.getElementById('rugpull-never-show');
        if (neverShowCheckbox && neverShowCheckbox.checked) {
            showRugpullConfirmation = false;
            window.rugpullState = window.rugpullState || {};
            window.rugpullState.showConfirmation = false;
        }
        modal.remove();
        executeRugpull(reward);
    };

    document.getElementById('rugpull-confirm-no').onclick = function() {
        modal.remove();
    };

    // Close on backdrop click
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

/**
 * Trigger coin explosion effect on rugpull
 */
function triggerCoinExplosion() {
    // Get center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Create 20-30 coins that explode outward
    const coinCount = 25;
    for (let i = 0; i < coinCount; i++) {
        const coin = document.createElement('div');
        coin.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle at 30% 30%, #ffeb3b, #ffd700);
            border-radius: 50%;
            border: 2px solid #ff9800;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 0 10px rgba(255, 235, 59, 0.8);
        `;
        coin.textContent = '💰';

        document.body.appendChild(coin);

        // Calculate explosion direction
        const angle = (i / coinCount) * Math.PI * 2;
        const velocity = 5 + Math.random() * 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        let x = centerX;
        let y = centerY;
        let life = 60; // frames

        const animate = () => {
            life--;
            x += vx;
            y += vy;
            const opacity = life / 60;

            coin.style.left = x + 'px';
            coin.style.top = y + 'px';
            coin.style.opacity = opacity.toString();
            coin.style.transform = `scale(${1 - (1 - life / 60) * 0.5})`;

            if (life > 0) {
                requestAnimationFrame(animate);
            } else {
                coin.remove();
            }
        };

        animate();
    }
}

/**
 * Execute the rugpull ascension
 */
function executeRugpull(reward) {
    // Prevent execution during import
    importInProgress = true;

    // Trigger coin explosion effect using minigame effect
    if (typeof spawnExplosionCoins === 'function') {
        const coinCount = 80;
        spawnExplosionCoins('btc', coinCount / 4);
        spawnExplosionCoins('eth', coinCount / 4);
        spawnExplosionCoins('doge', coinCount / 4);
        spawnExplosionCoins('usd', coinCount / 4);
    }

    // Close any open modals immediately
    closeRugpullMilestoneModal();

    // Award the currency
    rugpullCurrency += reward;
    ascensionStats.currencyEarned += reward;
    ascensionStats.totalRunsCompleted++;
    if (dollarBalance > ascensionStats.bestRunEarnings) {
        ascensionStats.bestRunEarnings = dollarBalance;
    }

    // Add this run's earnings to the display total (for player to see)
    lifetimeEarningsDisplay += lifetimeEarnings;
    // Update window references so display updates
    if (window.rugpullState) {
        window.rugpullState.lifetimeEarningsDisplay = lifetimeEarningsDisplay;
    }
    if (window.gameState) {
        window.gameState.lifetimeEarnings = lifetimeEarningsDisplay;
    }
    // Save session data (should persist across rugpull - same session)
    const savedSessionEarnings = sessionEarnings;
    const savedSessionStartTime = sessionStartTime;

    // Achievement: First rugpull and ascension count
    const newAscensionLevel = ascensionLevel + 1;
    if (newAscensionLevel === 1 && typeof markFirstRugpull === 'function') {
        markFirstRugpull();
    }

    // SAVE ACHIEVEMENTS DATA BEFORE CLEARING LOCALSTORAGE
    const savedAchievements = (typeof achievementsData !== 'undefined') ? JSON.parse(JSON.stringify(achievementsData.achievements)) : {};

    // Reset the game (this will preserve ascensionData through modified resetGame)
    // Save ascension data before reset
    const savedAscensionData = {
        ascensionLevel: newAscensionLevel,
        rugpullCurrency: rugpullCurrency,
        metaUpgrades: JSON.parse(JSON.stringify(metaUpgrades)),
        ascensionStats: JSON.parse(JSON.stringify(ascensionStats)),
        unlockedSystems: JSON.parse(JSON.stringify(unlockedSystems)),
        achievements: savedAchievements,
        lifetimeEarningsDisplay: lifetimeEarningsDisplay,  // Persist display earnings across rugpull
        permanentMilestoneDoublings: JSON.parse(JSON.stringify(permanentMilestoneDoublings))  // Persist milestone doublings across rugpull
    };

    // Clear localStorage but prepare to restore ascension data
    localStorage.removeItem('satoshiTerminalSave');
    localStorage.removeItem('instructionsDismissed');

    // Reset ALL game state (this sets lifetimeEarnings to 0)
    resetGameState();

    // Store the total lifetime earnings in ascension stats for future token calculations
    // lifetimeEarnings stays at 0 for the new run

    // Reset milestone tracking for the new run (so popup only shows when NEW requirement is reached)
    lastShownMilestoneEarnings = 0;
    lifetimeEarningsThisRugpull = 0;  // Reset earnings counter for new run's rugpull tracking

    // Restore ascension data
    ascensionLevel = newAscensionLevel;
    rugpullCurrency = savedAscensionData.rugpullCurrency;
    // Merge saved metaUpgrades with defaults to include any new upgrades
    if (savedAscensionData.metaUpgrades) {
        metaUpgrades = { ...metaUpgrades, ...savedAscensionData.metaUpgrades };
    }
    // Ensure all metaUpgrade keys have default values if missing (for backwards compatibility)
    ensureMetaUpgradesInitialized();
    ascensionStats = savedAscensionData.ascensionStats;
    unlockedSystems = savedAscensionData.unlockedSystems;
    lifetimeEarningsDisplay = parseFloat(savedAscensionData.lifetimeEarningsDisplay) || 0;  // Restore display earnings
    // Sync window references after restoring ascension data
    window.metaUpgrades = metaUpgrades;
    window.upgradeToggleState = upgradeToggleState;
    if (window.rugpullState) {
        window.rugpullState.lifetimeEarningsDisplay = lifetimeEarningsDisplay;
    }

    // Restore session data (persist across rugpull - same gameplay session)
    sessionEarnings = savedSessionEarnings;
    sessionStartTime = savedSessionStartTime;

    // Update window.gameState with display earnings (what player sees)
    if (window.gameState) {
        window.gameState.lifetimeEarnings = lifetimeEarningsDisplay;
    }

    // RESTORE ACHIEVEMENTS DATA (persist across rugpulls)
    if (typeof achievementsData !== 'undefined' && savedAscensionData.achievements) {
        achievementsData.achievements = savedAscensionData.achievements;
        console.log('✓ Achievements restored after rugpull:', Object.values(achievementsData.achievements).filter(a => a.unlocked).length, 'unlocked');
    }

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
    updateAscensionUI(); // Explicitly update to show store button

    // Show success message as modal
    showRugpullCompleteModal(reward);

    // Open meta-upgrades modal so player can spend tokens immediately
    // Use shorter timeout and force open
    setTimeout(() => {
        closeRugpullCompleteModal();
        // Force display of store button
        const storeBtn = document.getElementById('rugpull-store-btn');
        if (storeBtn) {
            storeBtn.style.display = 'inline-block';
        }
        // Open the meta-upgrades modal
        openMetaUpgradesModal();
        console.log('[RUGPULL] Auto-opening meta-upgrades modal after rugpull');
    }, 2000);

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
    // DO NOT reset lifetimeEarnings - it persists across rugpulls

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
        // DO NOT reset milestone doublings or doubleMultiplier - they persist across rugpulls
    });

    ethUpgrades.forEach(u => {
        u.level = 0;
        u.currentUsd = u.baseUsd;
        u.currentYield = 0;
        // DO NOT reset milestone doublings or doubleMultiplier - they persist across rugpulls
    });

    dogeUpgrades.forEach(u => {
        u.level = 0;
        u.currentUsd = u.baseUsd;
        u.currentYield = 0;
        // DO NOT reset milestone doublings or doubleMultiplier - they persist across rugpulls
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

    // Add cash bonus from ascension level (2x per level to match upgrade cost scaling)
    startingCash += ascensionLevel * 1000;
    dollarBalance = startingCash;

    // Give starter miners if purchased (they stack together)
    // Dynamically loop through all available starter miners (tiers 1-15)
    const starterMinersToGive = [];
    for (let tier = 1; tier <= 15; tier++) {
        const upgradeKey = `starter_miners_t${tier}`;
        if (metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased) {
            starterMinersToGive.push(tier);
        }
    }

    // Apply all purchased starter miners
    if (starterMinersToGive.length > 0) {
        for (const tierIndex of starterMinersToGive) {
            if (btcUpgrades[tierIndex]) {
                btcUpgrades[tierIndex].level = 1;
                btcUpgrades[tierIndex].currentYield = btcUpgrades[tierIndex].baseYield;
                btcUpgrades[tierIndex].currentUsd = btcUpgrades[tierIndex].baseUsd * Math.pow(1.12, 1);
            }

            if (ethUpgrades[tierIndex]) {
                ethUpgrades[tierIndex].level = 1;
                ethUpgrades[tierIndex].currentYield = ethUpgrades[tierIndex].baseYield;
                ethUpgrades[tierIndex].currentUsd = ethUpgrades[tierIndex].baseUsd * Math.pow(1.12, 1);
            }

            if (dogeUpgrades[tierIndex]) {
                dogeUpgrades[tierIndex].level = 1;
                dogeUpgrades[tierIndex].currentYield = dogeUpgrades[tierIndex].baseYield;
                dogeUpgrades[tierIndex].currentUsd = dogeUpgrades[tierIndex].baseUsd * Math.pow(1.12, 1);
            }
        }

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

    // Give starter power supplies if purchased (they stack together)
    // Dynamically loop through all available starter power supplies (p0-p12, indexes 0-12)
    const starterPowerToGive = [];
    for (let powerIndex = 0; powerIndex <= 12; powerIndex++) {
        const upgradeKey = `starter_power_p${powerIndex}`;
        if (metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased) {
            starterPowerToGive.push(powerIndex);
        }
    }

    // Apply all purchased starter power supplies
    if (starterPowerToGive.length > 0) {
        for (const powerIndex of starterPowerToGive) {
            if (powerUpgrades[powerIndex]) {
                powerUpgrades[powerIndex].level = 1;
                powerUpgrades[powerIndex].currentPower = powerUpgrades[powerIndex].basePower;
            }
        }

        // Recalculate total power available with all purchased power supplies
        totalPowerAvailable = powerUpgrades.reduce((sum, item) => sum + (item.currentPower || 0), 0);
    } else {
        // Power capacity comes from power_capacity tier upgrades via getPowerBoost()
        totalPowerAvailable = powerUpgrades[0].basePower;
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
 * Check if a tier is unlocked (all upgrades in previous tier must be purchased)
 */
function isTierUnlocked(tierNumber) {
    if (tierNumber === 1) return true;  // Tier 1 is always unlocked

    const previousTierNumber = tierNumber - 1;
    const tiers = [
        { name: 'Tier 1', upgrades: ['power_capacity_1', 'miner_efficiency_1', 'staking_apy_1', 'miner_hashrate_1', 'click_hashrate_1', 'offline_earnings_1', 'earnings_boost_1', 'minigame_reward_1', 'token_generation_0'] },
        { name: 'Tier 2', upgrades: ['power_capacity_2', 'miner_efficiency_2', 'staking_apy_2', 'miner_hashrate_2', 'click_hashrate_2', 'offline_earnings_2', 'earnings_boost_2', 'minigame_reward_2', 'starter_miners_t1', 'starter_power_p0', 'token_generation_1_alt'] },
        { name: 'Tier 3', upgrades: ['power_capacity_3', 'miner_efficiency_3', 'staking_apy_3', 'miner_hashrate_3', 'click_hashrate_3', 'offline_earnings_3', 'earnings_boost_3', 'minigame_reward_3', 'auto_sell', 'starter_miners_t2', 'starter_power_p1', 'token_generation_2_alt'] },
        { name: 'Tier 4', upgrades: ['power_capacity_4', 'miner_efficiency_4', 'staking_apy_4', 'miner_hashrate_4', 'click_hashrate_4', 'offline_earnings_4', 'earnings_boost_4', 'minigame_reward_4', 'starter_miners_t3', 'starter_power_p2', 'token_generation_3_alt'] },
        { name: 'Tier 5', upgrades: ['power_capacity_5', 'miner_efficiency_5', 'staking_apy_5', 'miner_hashrate_5', 'click_hashrate_5', 'offline_earnings_5', 'earnings_boost_5', 'minigame_reward_5', 'starter_miners_t4', 'starter_power_p3', 'token_generation_4_alt'] },
        { name: 'Tier 6', upgrades: ['power_capacity_6', 'miner_efficiency_6', 'staking_apy_6', 'miner_hashrate_6', 'click_hashrate_6', 'offline_earnings_6', 'earnings_boost_6', 'minigame_reward_6', 'starter_miners_t5', 'starter_power_p4', 'token_generation_1'] },
        { name: 'Tier 7', upgrades: ['power_capacity_7', 'miner_efficiency_7', 'staking_apy_7', 'miner_hashrate_7', 'click_hashrate_7', 'offline_earnings_7', 'earnings_boost_7', 'minigame_reward_7', 'starter_miners_t6', 'starter_power_p5', 'minigame_unlock', 'token_generation_t7'] },
        { name: 'Tier 8', upgrades: ['power_capacity_8', 'miner_efficiency_8', 'staking_apy_8', 'miner_hashrate_8', 'click_hashrate_8', 'offline_earnings_8', 'earnings_boost_8', 'minigame_reward_8', 'starter_miners_t7', 'starter_power_p6', 'cash_multiplier', 'token_generation_t8'] },
        { name: 'Tier 9', upgrades: ['power_capacity_9', 'miner_efficiency_9', 'staking_apy_9', 'miner_hashrate_9', 'click_hashrate_9', 'offline_earnings_9', 'earnings_boost_9', 'minigame_reward_9', 'starter_miners_t8', 'starter_power_p7', 'token_generation_t9'] },
        { name: 'Tier 10', upgrades: ['power_capacity_10', 'miner_efficiency_10', 'staking_apy_10', 'miner_hashrate_10', 'click_hashrate_10', 'offline_earnings_10', 'earnings_boost_10', 'minigame_reward_10', 'starter_miners_t9', 'starter_power_p8', 'token_generation_t10'] },
        { name: 'Tier 11', upgrades: ['power_capacity_11', 'miner_efficiency_11', 'staking_apy_11', 'miner_hashrate_11', 'click_hashrate_11', 'offline_earnings_11', 'earnings_boost_11', 'minigame_reward_11', 'starter_miners_t10', 'starter_power_p9', 'token_generation_t11'] },
        { name: 'Tier 12', upgrades: ['power_capacity_12', 'miner_efficiency_12', 'staking_apy_12', 'miner_hashrate_12', 'click_hashrate_12', 'offline_earnings_12', 'earnings_boost_12', 'minigame_reward_12', 'starter_miners_t11', 'starter_power_p10', 'token_generation_t12'] },
        { name: 'Tier 13', upgrades: ['power_capacity_13', 'miner_efficiency_13', 'staking_apy_13', 'miner_hashrate_13', 'click_hashrate_13', 'offline_earnings_13', 'earnings_boost_13', 'minigame_reward_13', 'starter_miners_t12', 'starter_power_p11', 'token_generation_t13'] },
        { name: 'Tier 14', upgrades: ['power_capacity_14', 'miner_efficiency_14', 'staking_apy_14', 'miner_hashrate_14', 'click_hashrate_14', 'offline_earnings_14', 'earnings_boost_14', 'minigame_reward_14', 'starter_miners_t13', 'starter_power_p12', 'token_generation_t14'] },
        { name: 'Tier 15', upgrades: ['power_capacity_15', 'miner_efficiency_15', 'staking_apy_15', 'miner_hashrate_15', 'click_hashrate_15', 'offline_earnings_15', 'earnings_boost_15', 'minigame_reward_15', 'starter_miners_t14', 'token_generation_t15'] },
        { name: 'Tier 16', upgrades: ['power_capacity_16', 'miner_efficiency_16', 'staking_apy_16', 'miner_hashrate_16', 'click_hashrate_16', 'offline_earnings_16', 'earnings_boost_16', 'minigame_reward_16', 'starter_miners_t15', 'token_generation_t16'] },
        { name: 'Tier 17', upgrades: ['power_capacity_17', 'miner_efficiency_17', 'staking_apy_17', 'miner_hashrate_17', 'click_hashrate_17', 'offline_earnings_17', 'earnings_boost_17', 'minigame_reward_17', 'token_generation_t17'] },
        { name: 'Tier 18', upgrades: ['power_capacity_18', 'miner_efficiency_18', 'staking_apy_18', 'miner_hashrate_18', 'click_hashrate_18', 'offline_earnings_18', 'earnings_boost_18', 'minigame_reward_18', 'token_generation_t18'] },
        { name: 'Tier 19', upgrades: ['power_capacity_19', 'miner_efficiency_19', 'staking_apy_19', 'miner_hashrate_19', 'click_hashrate_19', 'offline_earnings_19', 'earnings_boost_19', 'minigame_reward_19', 'token_generation_t19'] },
        { name: 'Tier 20', upgrades: ['power_capacity_20', 'miner_efficiency_20', 'staking_apy_20', 'miner_hashrate_20', 'click_hashrate_20', 'offline_earnings_20', 'earnings_boost_20', 'minigame_reward_20', 'token_generation_t20'] }
    ];

    const previousTier = tiers[previousTierNumber - 1];
    if (!previousTier) return false;

    // Check if all upgrades in previous tier are purchased
    return previousTier.upgrades.every(upgradeKey => {
        return metaUpgrades[upgradeKey] && metaUpgrades[upgradeKey].purchased;
    });
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

    // Find which tier this upgrade belongs to
    const tiers = [
        { name: 'Tier 1', upgrades: ['power_capacity_1', 'miner_efficiency_1', 'staking_apy_1', 'miner_hashrate_1', 'click_hashrate_1', 'offline_earnings_1', 'earnings_boost_1', 'minigame_reward_1', 'token_generation_0'] },
        { name: 'Tier 2', upgrades: ['power_capacity_2', 'miner_efficiency_2', 'staking_apy_2', 'miner_hashrate_2', 'click_hashrate_2', 'offline_earnings_2', 'earnings_boost_2', 'minigame_reward_2', 'starter_miners_t1', 'starter_power_p0', 'token_generation_1_alt'] },
        { name: 'Tier 3', upgrades: ['power_capacity_3', 'miner_efficiency_3', 'staking_apy_3', 'miner_hashrate_3', 'click_hashrate_3', 'offline_earnings_3', 'earnings_boost_3', 'minigame_reward_3', 'auto_sell', 'starter_miners_t2', 'starter_power_p1', 'token_generation_2_alt'] },
        { name: 'Tier 4', upgrades: ['power_capacity_4', 'miner_efficiency_4', 'staking_apy_4', 'miner_hashrate_4', 'click_hashrate_4', 'offline_earnings_4', 'earnings_boost_4', 'minigame_reward_4', 'starter_miners_t3', 'starter_power_p2', 'token_generation_3_alt'] },
        { name: 'Tier 5', upgrades: ['power_capacity_5', 'miner_efficiency_5', 'staking_apy_5', 'miner_hashrate_5', 'click_hashrate_5', 'offline_earnings_5', 'earnings_boost_5', 'minigame_reward_5', 'starter_miners_t4', 'starter_power_p3', 'token_generation_4_alt'] },
        { name: 'Tier 6', upgrades: ['power_capacity_6', 'miner_efficiency_6', 'staking_apy_6', 'miner_hashrate_6', 'click_hashrate_6', 'offline_earnings_6', 'earnings_boost_6', 'minigame_reward_6', 'starter_miners_t5', 'starter_power_p4', 'token_generation_1'] },
        { name: 'Tier 7', upgrades: ['power_capacity_7', 'miner_efficiency_7', 'staking_apy_7', 'miner_hashrate_7', 'click_hashrate_7', 'offline_earnings_7', 'earnings_boost_7', 'minigame_reward_7', 'starter_miners_t6', 'starter_power_p5', 'minigame_unlock', 'token_generation_t7'] },
        { name: 'Tier 8', upgrades: ['power_capacity_8', 'miner_efficiency_8', 'staking_apy_8', 'miner_hashrate_8', 'click_hashrate_8', 'offline_earnings_8', 'earnings_boost_8', 'minigame_reward_8', 'starter_miners_t7', 'starter_power_p6', 'cash_multiplier', 'token_generation_t8'] },
        { name: 'Tier 9', upgrades: ['power_capacity_9', 'miner_efficiency_9', 'staking_apy_9', 'miner_hashrate_9', 'click_hashrate_9', 'offline_earnings_9', 'earnings_boost_9', 'minigame_reward_9', 'starter_miners_t8', 'starter_power_p7', 'token_generation_t9'] },
        { name: 'Tier 10', upgrades: ['power_capacity_10', 'miner_efficiency_10', 'staking_apy_10', 'miner_hashrate_10', 'click_hashrate_10', 'offline_earnings_10', 'earnings_boost_10', 'minigame_reward_10', 'starter_miners_t9', 'starter_power_p8', 'token_generation_t10'] },
        { name: 'Tier 11', upgrades: ['power_capacity_11', 'miner_efficiency_11', 'staking_apy_11', 'miner_hashrate_11', 'click_hashrate_11', 'offline_earnings_11', 'earnings_boost_11', 'minigame_reward_11', 'starter_miners_t10', 'starter_power_p9', 'token_generation_t11'] },
        { name: 'Tier 12', upgrades: ['power_capacity_12', 'miner_efficiency_12', 'staking_apy_12', 'miner_hashrate_12', 'click_hashrate_12', 'offline_earnings_12', 'earnings_boost_12', 'minigame_reward_12', 'starter_miners_t11', 'starter_power_p10', 'token_generation_t12'] },
        { name: 'Tier 13', upgrades: ['power_capacity_13', 'miner_efficiency_13', 'staking_apy_13', 'miner_hashrate_13', 'click_hashrate_13', 'offline_earnings_13', 'earnings_boost_13', 'minigame_reward_13', 'starter_miners_t12', 'starter_power_p11', 'token_generation_t13'] },
        { name: 'Tier 14', upgrades: ['power_capacity_14', 'miner_efficiency_14', 'staking_apy_14', 'miner_hashrate_14', 'click_hashrate_14', 'offline_earnings_14', 'earnings_boost_14', 'minigame_reward_14', 'starter_miners_t13', 'starter_power_p12', 'token_generation_t14'] },
        { name: 'Tier 15', upgrades: ['power_capacity_15', 'miner_efficiency_15', 'staking_apy_15', 'miner_hashrate_15', 'click_hashrate_15', 'offline_earnings_15', 'earnings_boost_15', 'minigame_reward_15', 'starter_miners_t14', 'token_generation_t15'] },
        { name: 'Tier 16', upgrades: ['power_capacity_16', 'miner_efficiency_16', 'staking_apy_16', 'miner_hashrate_16', 'click_hashrate_16', 'offline_earnings_16', 'earnings_boost_16', 'minigame_reward_16', 'starter_miners_t15', 'token_generation_t16'] },
        { name: 'Tier 17', upgrades: ['power_capacity_17', 'miner_efficiency_17', 'staking_apy_17', 'miner_hashrate_17', 'click_hashrate_17', 'offline_earnings_17', 'earnings_boost_17', 'minigame_reward_17', 'token_generation_t17'] },
        { name: 'Tier 18', upgrades: ['power_capacity_18', 'miner_efficiency_18', 'staking_apy_18', 'miner_hashrate_18', 'click_hashrate_18', 'offline_earnings_18', 'earnings_boost_18', 'minigame_reward_18', 'token_generation_t18'] },
        { name: 'Tier 19', upgrades: ['power_capacity_19', 'miner_efficiency_19', 'staking_apy_19', 'miner_hashrate_19', 'click_hashrate_19', 'offline_earnings_19', 'earnings_boost_19', 'minigame_reward_19', 'token_generation_t19'] },
        { name: 'Tier 20', upgrades: ['power_capacity_20', 'miner_efficiency_20', 'staking_apy_20', 'miner_hashrate_20', 'click_hashrate_20', 'offline_earnings_20', 'earnings_boost_20', 'minigame_reward_20', 'token_generation_t20'] }
    ];

    let tierNumber = 1;
    for (let i = 0; i < tiers.length; i++) {
        if (tiers[i].upgrades.includes(upgradeKey)) {
            tierNumber = i + 1;
            break;
        }
    }

    if (!isTierUnlocked(tierNumber)) {
        showGenericMessageModal('Tier Locked', `<div style="color: #ff9800;">You must purchase all upgrades in Tier ${tierNumber - 1} first!</div>`);
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
    if (upgradeKey === 'auto_sell' && typeof updateAutoSellButtonUI === 'function') {
        updateAutoSellButtonUI();
    }

    // Update staking APR display if a staking APR upgrade was purchased
    if (upgradeKey.includes('staking_apy') && typeof updateStakingAPRDisplay === 'function') {
        updateStakingAPRDisplay();
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

    // Cookie Clicker-style: +1% bonus for each rugpull (ascension level)
    // This is similar to how Cookie Clicker gives +1% CpS per prestige level
    if (ascensionLevel > 0) {
        bonus = ascensionLevel * 0.01;  // +1% per rugpull
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

    // Guard against undefined metaUpgrades during initialization
    if (!metaUpgrades || !ascensionStats) {
        return 0;
    }

    if (skillType === 'mining_speed') {
        // Mining speed for MINERS from miner_hashrate tier upgrades
        for (let tier = 1; tier <= 20; tier++) {
            const key = `miner_hashrate_${tier}`;
            if (metaUpgrades[key] && metaUpgrades[key].purchased) {
                // Each tier adds: 0.5 × 1.15^(tier-1)
                bonus += 0.5 * Math.pow(1.15, tier - 1) / 100;  // Convert to decimal (0.005 = 0.5%)
            }
        }
        // Add crypto_efficiency bonuses (multiplicative)
        if (metaUpgrades.crypto_efficiency_1 && metaUpgrades.crypto_efficiency_1.purchased) {
            bonus += 0.20;  // +20%
        }
        if (metaUpgrades.crypto_efficiency_2 && metaUpgrades.crypto_efficiency_2.purchased) {
            bonus += 0.40;  // +40%
        }
        if (metaUpgrades.crypto_efficiency_3 && metaUpgrades.crypto_efficiency_3.purchased) {
            bonus += 0.60;  // +60%
        }
        if (metaUpgrades.crypto_efficiency_4 && metaUpgrades.crypto_efficiency_4.purchased) {
            bonus += 0.80;  // +80%
        }
    } else if (skillType === 'click_speed') {
        // Manual hash speed from click_hashrate tier upgrades
        for (let tier = 1; tier <= 20; tier++) {
            const key = `click_hashrate_${tier}`;
            if (metaUpgrades[key] && metaUpgrades[key].purchased) {
                // Each tier adds: 0.5 × 1.15^(tier-1)
                bonus += 0.5 * Math.pow(1.15, tier - 1) / 100;  // Convert to decimal (0.005 = 0.5%)
            }
        }
    } else if (skillType === 'crypto_price') {
        // Crypto prices from tier upgrades - this is now using the tier system
        // The tier-based crypto efficiency upgrades are handled separately in the UI
    } else if (skillType === 'miner_efficiency') {
        // Miner efficiency bonus (power reduction from tier upgrades)
        // Calculate from miner_efficiency_1 through miner_efficiency_20
        for (let tier = 1; tier <= 20; tier++) {
            const key = `miner_efficiency_${tier}`;
            if (metaUpgrades[key] && metaUpgrades[key].purchased) {
                // Each tier adds: 0.5 × 1.15^(tier-1)
                bonus += 0.5 * Math.pow(1.15, tier - 1) / 100;  // Convert to decimal (0.005 = 0.5%)
            }
        }
        // Cap at 99% power reduction (0.99)
        return Math.min(bonus, 0.99);
    } else if (skillType === 'minigame_rewards') {
        // Minigame reward multiplier from tier upgrades
        for (let tier = 1; tier <= 20; tier++) {
            const key = `minigame_reward_${tier}`;
            if (metaUpgrades[key] && metaUpgrades[key].purchased) {
                // Each tier adds: 1 × 1.15^(tier-1)
                bonus += 1 * Math.pow(1.15, tier - 1) / 100;  // Convert to decimal (0.01 = 1%)
            }
        }
    } else if (skillType === 'earnings_boost' || skillType === 'crypto_sale_stake_value') {
        // Crypto sale & stake value bonus from tier upgrades
        // Calculate from earnings_boost_1 through earnings_boost_20
        for (let tier = 1; tier <= 20; tier++) {
            const key = `earnings_boost_${tier}`;
            if (metaUpgrades[key] && metaUpgrades[key].purchased) {
                // Each tier adds: 1 × 1.15^(tier-1) in percentage form
                bonus += 1 * Math.pow(1.15, tier - 1) / 100;  // Convert to decimal (0.01 = 1%)
            }
        }
        return bonus;
    } else if (skillType === 'cash_multiplier') {
        // Cash multiplier bonus from cash_multiplier upgrade
        if (metaUpgrades.cash_multiplier && metaUpgrades.cash_multiplier.purchased) {
            bonus += 0.5;  // 50% bonus to cash earnings
        }
        return bonus;
    } else if (skillType === 'crypto_efficiency') {
        // Crypto efficiency bonus from crypto_efficiency tier upgrades
        for (let tier = 1; tier <= 20; tier++) {
            const key = `crypto_efficiency_${tier}`;
            if (metaUpgrades[key] && metaUpgrades[key].purchased) {
                // Each tier adds: 0.5 × 1.15^(tier-1)
                bonus += 0.5 * Math.pow(1.15, tier - 1) / 100;  // Convert to decimal (0.005 = 0.5%)
            }
        }
        return bonus;
    }

    return bonus;
}

/**
 * Get power boost from meta-upgrades (increases available power capacity)
 * Power capacity bonuses come from power_capacity tier upgrades
 */
function getPowerBoost() {
    let boost = 0;
    for (let tier = 1; tier <= 20; tier++) {
        const key = `power_capacity_${tier}`;
        if (metaUpgrades[key] && metaUpgrades[key].purchased) {
            // Each tier adds: 0.5 × 1.15^(tier-1)
            boost += 0.5 * Math.pow(1.15, tier - 1) / 100;  // Convert to decimal (0.005 = 0.5%)
        }
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
 * Get offline earnings cap in seconds based on purchased upgrades
 * Base cap is 4 hours (14400 seconds)
 * Each offline_earnings upgrade adds 1 hour (3600 seconds)
 */
function getOfflineCap() {
    const BASE_OFFLINE_CAP = 14400; // 4 hours in seconds
    let additionalSeconds = 0;

    // Check each offline earnings upgrade tier
    for (let tier = 1; tier <= 20; tier++) {
        const key = `offline_earnings_${tier}`;
        if (metaUpgrades[key] && metaUpgrades[key].purchased) {
            // Each tier adds 1 hour (3600 seconds)
            additionalSeconds += 3600;
        }
    }

    return BASE_OFFLINE_CAP + additionalSeconds;
}

/**
 * Get the permanent doubling multiplier for a miner (persists across rugpulls)
 * @param cryptoType - 'btc', 'eth', or 'doge'
 * @returns multiplier (2^number of doublings purchased)
 */
function getPermanentDoubleMultiplier(cryptoType) {
    const doublingsObj = cryptoType === 'btc' ? permanentMilestoneDoublings.btcDoublings :
                         cryptoType === 'eth' ? permanentMilestoneDoublings.ethDoublings :
                         cryptoType === 'doge' ? permanentMilestoneDoublings.dogeDoublings : {};

    // Count how many doublings have been purchased
    const doubleCount = Object.values(doublingsObj).filter(v => v === true).length;
    return Math.pow(2, doubleCount);  // 2^count
}

/**
 * Purchase a permanent milestone doubling
 * @param cryptoType - 'btc', 'eth', or 'doge'
 * @param level - the milestone level (1, 5, 10, 25, etc.)
 */
function purchasePermanentMilestoneDoubling(cryptoType, level) {
    if (cryptoType === 'btc') {
        permanentMilestoneDoublings.btcDoublings[level] = true;
    } else if (cryptoType === 'eth') {
        permanentMilestoneDoublings.ethDoublings[level] = true;
    } else if (cryptoType === 'doge') {
        permanentMilestoneDoublings.dogeDoublings[level] = true;
    }
}

/**
 * Check if a permanent milestone doubling has been purchased
 * @param cryptoType - 'btc', 'eth', or 'doge'
 * @param level - the milestone level
 * @returns boolean
 */
function hasPermanentMilestoneDoubling(cryptoType, level) {
    const doublingsObj = cryptoType === 'btc' ? permanentMilestoneDoublings.btcDoublings :
                         cryptoType === 'eth' ? permanentMilestoneDoublings.ethDoublings :
                         cryptoType === 'doge' ? permanentMilestoneDoublings.dogeDoublings : {};
    return doublingsObj[level] || false;
}

/**
 * Get token conversion rate from earnings (how much earnings auto-convert to tokens)
 * Token generation is handled through tier upgrades
 */
function getTokenConversionRate() {
    // Token generation upgrades don't auto-convert earnings; they generate tokens from gameplay
    return 0;
}

/**
 * Get token generation rate (tokens per second earned offline AND online)
 * Based on purchased token_generation upgrades
 */
function getTokenGenerationRate() {
    let tokensPerSecond = 0;

    // TIER 1
    if (metaUpgrades.token_generation_0?.purchased) tokensPerSecond += 0.005;

    // TIER 2
    if (metaUpgrades.token_generation_1_alt?.purchased) tokensPerSecond += 0.00575;

    // TIER 3
    if (metaUpgrades.token_generation_2_alt?.purchased) tokensPerSecond += 0.00661;

    // TIER 4
    if (metaUpgrades.token_generation_3_alt?.purchased) tokensPerSecond += 0.00760;

    // TIER 5
    if (metaUpgrades.token_generation_4_alt?.purchased) tokensPerSecond += 0.00874;

    // TIER 6+
    if (metaUpgrades.token_generation_t6?.purchased) tokensPerSecond += 0.01005;
    if (metaUpgrades.token_generation_t7?.purchased) tokensPerSecond += 0.01156;
    if (metaUpgrades.token_generation_t8?.purchased) tokensPerSecond += 0.01330;
    if (metaUpgrades.token_generation_t9?.purchased) tokensPerSecond += 0.01531;
    if (metaUpgrades.token_generation_t10?.purchased) tokensPerSecond += 0.01761;
    if (metaUpgrades.token_generation_t11?.purchased) tokensPerSecond += 0.02025;
    if (metaUpgrades.token_generation_t12?.purchased) tokensPerSecond += 0.02329;
    if (metaUpgrades.token_generation_t13?.purchased) tokensPerSecond += 0.02678;
    if (metaUpgrades.token_generation_t14?.purchased) tokensPerSecond += 0.03080;
    if (metaUpgrades.token_generation_t15?.purchased) tokensPerSecond += 0.03542;
    if (metaUpgrades.token_generation_t16?.purchased) tokensPerSecond += 0.04073;
    if (metaUpgrades.token_generation_t17?.purchased) tokensPerSecond += 0.04684;
    if (metaUpgrades.token_generation_t18?.purchased) tokensPerSecond += 0.05387;
    if (metaUpgrades.token_generation_t19?.purchased) tokensPerSecond += 0.06196;
    if (metaUpgrades.token_generation_t20?.purchased) tokensPerSecond += 0.07126;
    if (metaUpgrades.token_generation_4?.purchased) tokensPerSecond += 0.02599;
    if (metaUpgrades.token_generation_5?.purchased) tokensPerSecond += 0.02989;
    if (metaUpgrades.token_generation_6?.purchased) tokensPerSecond += 0.03963;

    return tokensPerSecond;
}

/**
 * Get friendly name for upgrade key
 */
function getUpgradeName(upgradeKey) {
    const names = {
        // TIER 1 (Basic) - 8 base upgrades
        'power_capacity_1': 'Earn 0.5% Max Power Capacity',
        'miner_efficiency_1': '-0.5% Miner Power Consumption',
        'staking_apy_1': 'Earn 0.005% Staking APR',
        'miner_hashrate_1': 'Earn 0.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_1': 'Earn 0.5% Manual Hash Rate',
        'offline_earnings_1': '+1 Hour Offline Earnings Cap (5h Total)',
        'earnings_boost_1': '+1% Crypto Sale & Stake Value',
        'minigame_reward_1': '+1% Minigame Rewards',
        'token_generation_0': 'Earn 0.005 Corrupt Tokens/s Passively',

        // TIER 2 (Advanced) - 8 base + 1 unique (starter_miners_t1)
        'power_capacity_2': '+1% Max Power Capacity',
        'miner_efficiency_2': '-1% Miner Power Consumption',
        'staking_apy_2': 'Earn 0.01% Staking APR',
        'miner_hashrate_2': '+1% Miner Hash Rate (All Crypto)',
        'click_hashrate_2': '+1% Manual Hash Rate',
        'offline_earnings_2': '+1 Hour Offline Earnings Cap (6h Total)',
        'earnings_boost_2': '+1.15% Crypto Sale & Stake Value',
        'minigame_reward_2': '+1.15% Minigame Rewards',
        'starter_miners_t1': 'Start All Future Rugpulls With LVL1 T1 Miner For All Cryptos!',
        'starter_power_p0': 'Start All Future Rugpulls With LVL1 Basic Power Strip',
        'token_generation_1_alt': 'Earn 0.00575 Corrupt Tokens/s Passively',

        // TIER 3 (Expert) - 8 base + 2 unique (auto_sell, starter_miners_t2)
        'power_capacity_3': '+1.5% Max Power Capacity',
        'miner_efficiency_3': '-1.5% Miner Power Consumption',
        'staking_apy_3': 'Earn 0.015% Staking APR',
        'miner_hashrate_3': '+1.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_3': '+1.5% Manual Hash Rate',
        'offline_earnings_3': '+1 Hour Offline Earnings Cap (7h Total)',
        'earnings_boost_3': '+1.32% Crypto Sale & Stake Value',
        'minigame_reward_3': '+1.32% Minigame Rewards',
        'auto_sell': 'Auto-Sell Crypto to Cash (25% Fee)',
        'starter_miners_t2': 'Start All Future Rugpulls With LVL1 T2 Miner For All Cryptos!',
        'starter_power_p1': 'Start All Future Rugpulls With LVL1 Regulated PSU',
        'token_generation_2_alt': 'Earn 0.00661 Corrupt Tokens/s Passively',

        // TIER 4 (Prestige) - 8 base + 1 unique (starter_miners_t3)
        'power_capacity_4': '+2% Max Power Capacity',
        'miner_efficiency_4': '-2% Miner Power Consumption',
        'staking_apy_4': 'Earn 0.02% Staking APR',
        'miner_hashrate_4': '+2% Miner Hash Rate (All Crypto)',
        'click_hashrate_4': '+2% Manual Hash Rate',
        'offline_earnings_4': '+1 Hour Offline Earnings Cap (8h Total)',
        'earnings_boost_4': '+1.52% Crypto Sale & Stake Value',
        'minigame_reward_4': '+1.52% Minigame Rewards',
        'starter_miners_t3': 'Start All Future Rugpulls With LVL1 T3 Miner For All Cryptos!',
        'starter_power_p2': 'Start All Future Rugpulls With LVL1 High-Efficiency PSU',
        'token_generation_3_alt': 'Earn 0.00760 Corrupt Tokens/s Passively',

        // TIER 5 (Infinite) - 8 base + 1 unique (starter_miners_t4)
        'power_capacity_5': '+2.5% Max Power Capacity',
        'miner_efficiency_5': '-2.5% Miner Power Consumption',
        'staking_apy_5': 'Earn 0.025% Staking APR',
        'miner_hashrate_5': '+2.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_5': '+2.5% Manual Hash Rate',
        'offline_earnings_5': '+1 Hour Offline Earnings Cap (9h Total)',
        'earnings_boost_5': '+1.75% Crypto Sale & Stake Value',
        'minigame_reward_5': '+1.75% Minigame Rewards',
        'starter_miners_t4': 'Start All Future Rugpulls With LVL1 T4 Miner For All Cryptos!',
        'starter_power_p3': 'Start All Future Rugpulls With LVL1 Server-Grade PSU',
        'token_generation_4_alt': 'Earn 0.00874 Corrupt Tokens/s Passively',

        // TIER 6 (Cosmic) - 8 base + 2 unique (starter_miners_t5, token_generation_t6)
        'power_capacity_6': '+3% Max Power Capacity',
        'miner_efficiency_6': '-3% Miner Power Consumption',
        'staking_apy_6': 'Earn 0.03% Staking APR',
        'miner_hashrate_6': '+3% Miner Hash Rate (All Crypto)',
        'click_hashrate_6': '+3% Manual Hash Rate',
        'offline_earnings_6': '+1 Hour Offline Earnings Cap (10h Total)',
        'earnings_boost_6': '+2.01% Crypto Sale & Stake Value',
        'minigame_reward_6': '+2.01% Minigame Rewards',
        'starter_miners_t5': 'Start All Future Rugpulls With LVL1 T5 Miner For All Cryptos!',
        'starter_power_p4': 'Start All Future Rugpulls With LVL1 Mining Power Distribution Unit',
        'token_generation_t6': 'Earn 0.01005 Corrupt Tokens/s Passively',
        'token_generation_t7': 'Earn 0.01156 Corrupt Tokens/s Passively',
        'token_generation_t8': 'Earn 0.01330 Corrupt Tokens/s Passively',
        'token_generation_t9': 'Earn 0.01531 Corrupt Tokens/s Passively',
        'token_generation_t10': 'Earn 0.01761 Corrupt Tokens/s Passively',
        'token_generation_t11': 'Earn 0.02025 Corrupt Tokens/s Passively',
        'token_generation_t12': 'Earn 0.02329 Corrupt Tokens/s Passively',
        'token_generation_t13': 'Earn 0.02678 Corrupt Tokens/s Passively',
        'token_generation_t14': 'Earn 0.03080 Corrupt Tokens/s Passively',
        'token_generation_t15': 'Earn 0.03542 Corrupt Tokens/s Passively',
        'token_generation_t16': 'Earn 0.04073 Corrupt Tokens/s Passively',
        'token_generation_t17': 'Earn 0.04684 Corrupt Tokens/s Passively',
        'token_generation_t18': 'Earn 0.05387 Corrupt Tokens/s Passively',
        'token_generation_t19': 'Earn 0.06196 Corrupt Tokens/s Passively',
        'token_generation_t20': 'Earn 0.07126 Corrupt Tokens/s Passively',

        // TIER 7 (Transcendent) - 8 base + 2 unique (starter_miners_t6, minigame_unlock)
        'power_capacity_7': '+3.5% Max Power Capacity',
        'miner_efficiency_7': '-3.5% Miner Power Consumption',
        'staking_apy_7': 'Earn 0.035% Staking APR',
        'miner_hashrate_7': '+3.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_7': '+1.16% Manual Hash Rate',
        'offline_earnings_7': '+1 Hour Offline Earnings Cap (11h Total)',
        'earnings_boost_7': '+2.31% Crypto Sale & Stake Value',
        'minigame_reward_7': '+2.31% Minigame Rewards',
        'starter_miners_t6': 'Start All Future Rugpulls With LVL1 T6 Miner For All Cryptos!',
        'starter_power_p5': 'Start All Future Rugpulls With LVL1 Modular Data Center Power System',
        'minigame_unlock': 'All Minigames Unlocked on New Rugpulls',

        // TIER 8 (Omnipotent) - 8 base + 2 unique (starter_miners_t7, cash_multiplier)
        'power_capacity_8': '+4% Max Power Capacity',
        'miner_efficiency_8': '-4% Miner Power Consumption',
        'staking_apy_8': 'Earn 0.04% Staking APR',
        'miner_hashrate_8': '+4% Miner Hash Rate (All Crypto)',
        'click_hashrate_8': '+1.33% Manual Hash Rate',
        'offline_earnings_8': '+1 Hour Offline Earnings Cap (12h Total)',
        'earnings_boost_8': '+2.66% Crypto Sale & Stake Value',
        'minigame_reward_8': '+2.66% Minigame Rewards',
        'starter_miners_t7': 'Start All Future Rugpulls With LVL1 T7 Miner For All Cryptos!',
        'starter_power_p6': 'Start All Future Rugpulls With LVL1 Dedicated Substation Power Unit',
        'cash_multiplier': '+50% more Crypto Sale Value',

        // TIER 9 (Supreme) - 8 base + 2 unique (starter_miners_t8, crypto_efficiency_1)
        'power_capacity_9': '+4.5% Max Power Capacity',
        'miner_efficiency_9': '-4.5% Miner Power Consumption',
        'staking_apy_9': 'Earn 0.045% Staking APR',
        'miner_hashrate_9': '+4.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_9': '+1.53% Manual Hash Rate',
        'offline_earnings_9': '+1 Hour Offline Earnings Cap (13h Total)',
        'earnings_boost_9': '+3.06% Crypto Sale & Stake Value',
        'minigame_reward_9': '+3.06% Minigame Rewards',
        'starter_miners_t8': 'Start All Future Rugpulls With LVL1 T8 Miner For All Cryptos!',
        'starter_power_p7': 'Start All Future Rugpulls With LVL1 Industrial Grid Connection',
        'crypto_efficiency_1': '+20% Mining Efficiency',

        // TIER 10 (Godlike) - 8 base + 2 unique (starter_miners_t9, token_generation_t10)
        'power_capacity_10': '+5% Max Power Capacity',
        'miner_efficiency_10': '-5% Miner Power Consumption',
        'staking_apy_10': 'Earn 0.05% Staking APR',
        'miner_hashrate_10': '+5% Miner Hash Rate (All Crypto)',
        'click_hashrate_10': '+1.76% Manual Hash Rate',
        'offline_earnings_10': '+1 Hour Offline Earnings Cap (14h Total)',
        'earnings_boost_10': '+3.52% Crypto Sale & Stake Value',
        'minigame_reward_10': '+3.52% Minigame Rewards',
        'starter_miners_t9': 'Start All Future Rugpulls With LVL1 T9 Miner For All Cryptos!',
        'starter_power_p8': 'Start All Future Rugpulls With LVL1 Hydroelectric Power Station',

        // TIER 11 (Transcendence) - 8 base + 1 unique (starter_miners_t10)
        'power_capacity_11': '+5.5% Max Power Capacity',
        'miner_efficiency_11': '-5.5% Miner Power Consumption',
        'staking_apy_11': 'Earn 0.055% Staking APR',
        'miner_hashrate_11': '+5.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_11': '+2.03% Manual Hash Rate',
        'offline_earnings_11': '+1 Hour Offline Earnings Cap (15h Total)',
        'earnings_boost_11': '+4.05% Crypto Sale & Stake Value',
        'minigame_reward_11': '+4.05% Minigame Rewards',
        'starter_miners_t10': 'Start All Future Rugpulls With LVL1 T10 Miner For All Cryptos!',
        'starter_power_p9': 'Start All Future Rugpulls With LVL1 Nuclear Reactor Array',

        // TIER 12 (Beyond) - 8 base + 2 unique (starter_miners_t11, crypto_efficiency_2)
        'power_capacity_12': '+6% Max Power Capacity',
        'miner_efficiency_12': '-6% Miner Power Consumption',
        'staking_apy_12': 'Earn 0.06% Staking APR',
        'miner_hashrate_12': '+6% Miner Hash Rate (All Crypto)',
        'click_hashrate_12': '+2.34% Manual Hash Rate',
        'offline_earnings_12': '+1 Hour Offline Earnings Cap (16h Total)',
        'earnings_boost_12': '+4.65% Crypto Sale & Stake Value',
        'minigame_reward_12': '+4.65% Minigame Rewards',
        'starter_miners_t11': 'Start All Future Rugpulls With LVL1 T11 Miner For All Cryptos!',
        'starter_power_p10': 'Start All Future Rugpulls With LVL1 Fusion Energy Complex',
        'crypto_efficiency_2': '+40% Mining Efficiency',

        // TIER 13 (Godhood) - 8 base + 2 unique (starter_miners_t12, token_generation_t13)
        'power_capacity_13': '+6.5% Max Power Capacity',
        'miner_efficiency_13': '-6.5% Miner Power Consumption',
        'staking_apy_13': 'Earn 0.065% Staking APR',
        'miner_hashrate_13': '+6.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_13': '+2.69% Manual Hash Rate',
        'offline_earnings_13': '+1 Hour Offline Earnings Cap (17h Total)',
        'earnings_boost_13': '+5.35% Crypto Sale & Stake Value',
        'minigame_reward_13': '+5.35% Crypto Sale & Stake Value',
        'starter_miners_t12': 'Start All Future Rugpulls With LVL1 T12 Miner For All Cryptos!',
        'starter_power_p11': 'Start All Future Rugpulls With LVL1 Dyson Sphere Power Collector',

        // TIER 14 (Supreme Being) - 8 base + 1 unique (starter_miners_t13)
        'power_capacity_14': '+7% Max Power Capacity',
        'miner_efficiency_14': '-7% Miner Power Consumption',
        'staking_apy_14': 'Earn 0.07% Staking APR',
        'miner_hashrate_14': '+7% Miner Hash Rate (All Crypto)',
        'click_hashrate_14': '+3.09% Manual Hash Rate',
        'offline_earnings_14': '+1 Hour Offline Earnings Cap (18h Total)',
        'earnings_boost_14': '+6.15% Crypto Sale & Stake Value',
        'minigame_reward_14': '+6.15% Minigame Rewards',
        'starter_miners_t13': 'Start All Future Rugpulls With LVL1 T13 Miner For All Cryptos!',
        'starter_power_p12': 'Start All Future Rugpulls With LVL1 Stellar Energy Tapestry',

        // TIER 15 (Decillion) - 8 base + 2 unique (starter_miners_t14, crypto_efficiency_3)
        'power_capacity_15': '+7.5% Max Power Capacity',
        'miner_efficiency_15': '-7.5% Miner Power Consumption',
        'staking_apy_15': 'Earn 0.75% Staking APR',
        'miner_hashrate_15': '+7.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_15': '+2.78% Manual Hash Rate',
        'offline_earnings_15': '+1 Hour Offline Earnings Cap (19h Total)',
        'earnings_boost_15': '+5.35% Crypto Sale & Stake Value',
        'minigame_reward_15': '+5.35% Minigame Rewards',
        'starter_miners_t14': 'Start All Future Rugpulls With LVL1 T14 Miner For All Cryptos!',
        'crypto_efficiency_3': '+60% Mining Efficiency',

        // TIER 16 (Undecillion) - 8 base + 2 unique (starter_miners_t15, token_generation_4)
        'power_capacity_16': '+7.5% Max Power Capacity',
        'miner_efficiency_16': '-7.5% Miner Power Consumption',
        'staking_apy_16': 'Earn 0.80% Staking APR',
        'miner_hashrate_16': '+7.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_16': '+2.78% Manual Hash Rate',
        'offline_earnings_16': '+1 Hour Offline Earnings Cap (20h Total)',
        'earnings_boost_16': '+5.35% Crypto Sale & Stake Value',
        'minigame_reward_16': '+5.35% Minigame Rewards',
        'starter_miners_t15': 'Start All Future Rugpulls With LVL1 T15 Miner For All Cryptos!',
        'token_generation_4': 'Earn 0.02599 Corrupt Tokens/s Passively',

        // TIER 16 (Undecillion) - 8 base + 2 unique (starter_miners_t15, token_generation_4)
        'token_generation_5': 'Earn 0.02989 Corrupt Tokens/s Passively',

        // TIER 17 (Duodecillion) - 8 base + 1 unique (token_generation_6)
        'power_capacity_17': '+7.5% Max Power Capacity',
        'miner_efficiency_17': '-7.5% Miner Power Consumption',
        'staking_apy_17': 'Earn 0.85% Staking APR',
        'miner_hashrate_17': '+7.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_17': '+2.78% Manual Hash Rate',
        'offline_earnings_17': '+1 Hour Offline Earnings Cap (21h Total)',
        'earnings_boost_17': '+5.35% Crypto Sale & Stake Value',
        'minigame_reward_17': '+5.35% Minigame Rewards',
        'token_generation_6': 'Earn 0.03963 Corrupt Tokens/s Passively',

        // TIER 18 (Tredecillion) - 8 base
        'power_capacity_18': '+7.5% Max Power Capacity',
        'miner_efficiency_18': '-7.5% Miner Power Consumption',
        'staking_apy_18': 'Earn 0.90% Staking APR',
        'miner_hashrate_18': '+7.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_18': '+2.78% Manual Hash Rate',
        'offline_earnings_18': '+1 Hour Offline Earnings Cap (22h Total)',
        'earnings_boost_18': '+5.35% Crypto Sale & Stake Value',
        'minigame_reward_18': '+5.35% Minigame Rewards',

        // TIER 19 (Quattuordecillion) - 8 base
        'power_capacity_19': '+7.5% Max Power Capacity',
        'miner_efficiency_19': '-7.5% Miner Power Consumption',
        'staking_apy_19': 'Earn 0.95% Staking APR',
        'miner_hashrate_19': '+7.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_19': '+2.78% Manual Hash Rate',
        'offline_earnings_19': '+1 Hour Offline Earnings Cap (23h Total)',
        'earnings_boost_19': '+5.35% Crypto Sale & Stake Value',
        'minigame_reward_19': '+5.35% Minigame Rewards',

        // TIER 20 (Novemcillion) - 8 base
        'power_capacity_20': '+7.5% Max Power Capacity',
        'miner_efficiency_20': '-7.5% Miner Power Consumption',
        'staking_apy_20': '+1.0% Staking APR',
        'miner_hashrate_20': '+7.5% Miner Hash Rate (All Crypto)',
        'click_hashrate_20': '+2.78% Manual Hash Rate',
        'offline_earnings_20': '+1 Hour Offline Earnings Cap (24h Total)',
        'earnings_boost_20': '+5.35% Crypto Sale & Stake Value',
        'minigame_reward_20': '+5.35% Minigame Rewards'
    };

    return names[upgradeKey] || upgradeKey;
}

/**
 * Format token cost with abbreviations (K, M, B, T, Q, etc.)
 * Uses ABBREVIATIONS from game.js - do not redeclare
 */
function formatTokenCost(cost) {
    const abs = Math.abs(cost);

    for (let i = 0; i < ABBREVIATIONS.length; i++) {
        if (abs >= ABBREVIATIONS[i].threshold) {
            return (cost / ABBREVIATIONS[i].threshold).toFixed(3) + ABBREVIATIONS[i].suffix;
        }
    }

    if (abs < 1) {
        return cost.toFixed(3);
    }
    return Math.floor(cost).toString();
}

/**
 * Update meta-upgrades UI (called after purchase or load)
 */
function updateMetaUpgradesUI() {
    const container = document.getElementById('meta-upgrades-container');
    if (!container) return;

    container.innerHTML = '';

    // Update the modal header with Corrupt Tokens value
    const rugpullHeader = document.getElementById('rugpull-header');
    if (rugpullHeader) {
        const tokenDisplay = formatTokenCost(rugpullCurrency);
        rugpullHeader.textContent = `🔴 RUGPULL UPGRADES | Corrupt Tokens: ${tokenDisplay}`;
    }

    // Display current bonuses (Cookie Clicker-style: +1% per ascension level)
    const totalMiningBonus = 1 + (ascensionLevel * 0.01);  // 1x at level 0, 1.01x at level 1, 1.02x at level 2, etc.
    const totalClickBonus = 1 + (ascensionLevel * 0.01);   // Same as mining bonus
    const miningBonusPerToken = ascensionStats.totalGlobalBonus * 0.0001;

    // Calculate all bonus percentages from purchased upgrades
    let powerCapacityBonus = 0;
    let minerPowerReduction = 0;
    let stakingAPRBonus = 0;
    let minerHashRateBonus = 0;
    let clickHashRateBonus = 0;
    let offlineEarningsBonus = 0;
    let allEarningsBonus = 0;
    let minigameRewardBonus = 0;
    let tokenGenerationBonus = 0;

    // Sum up all purchased upgrade bonuses - iterate through all 160 upgrades
    // Bonuses scale linearly: tier × base amount
    Object.entries(metaUpgrades).forEach(([key, upgrade]) => {
        if (upgrade.purchased) {
            const tierMatch = key.match(/\d+$/);
            if (!tierMatch) return;  // Skip upgrades without a number suffix
            const tier = parseInt(tierMatch[0]);

            // Power capacity bonuses (tiers 1-20) - exponential 1.15x scaling (0.5% base)
            if (key.includes('power_capacity')) {
                powerCapacityBonus += 0.5 * Math.pow(1.15, tier - 1);  // T1: 0.5%, T2: 0.575%, T3: 0.66%, ... T20: 59.42%
            }
            // Miner efficiency bonuses (tiers 1-20) - exponential 1.15x scaling (0.5% base)
            if (key.includes('miner_efficiency')) {
                minerPowerReduction += 0.5 * Math.pow(1.15, tier - 1);  // T1: 0.5%, T2: 0.575%, T3: 0.66%, ... T20: 59.42%
            }
            // Staking APR bonuses (tiers 1-20) - exponential 1.15x scaling (0.005% base)
            if (key.includes('staking_apy')) {
                stakingAPRBonus += 0.005 * Math.pow(1.15, tier - 1);  // T1: 0.005%, T2: 0.00575%, T3: 0.0066%, ... T20: 0.594%
            }
            // Miner hash rate bonuses (tiers 1-20) - exponential 1.15x scaling (0.5% base)
            if (key.includes('miner_hashrate')) {
                minerHashRateBonus += 0.5 * Math.pow(1.15, tier - 1);  // T1: 0.5%, T2: 0.575%, T3: 0.66%, ... T20: 59.42%
            }
            // Click hash rate bonuses (tiers 1-20) - exponential 1.15x scaling (0.5% base)
            if (key.includes('click_hashrate')) {
                clickHashRateBonus += 0.5 * Math.pow(1.15, tier - 1);  // T1: 0.5%, T2: 0.575%, T3: 0.66%, ... T20: 59.42%
            }
            // Offline earnings bonuses (tiers 1-20) - exponential 1.15x scaling (1 hour base)
            if (key.includes('offline_earnings')) {
                // Scale: 1 hour × 1.15^(tier-1) = hours added per tier
                const hoursAdded = Math.round(Math.pow(1.15, tier - 1));  // T1: 1h, T2: 1.15h, T3: 1.32h, ... T20: 29.89h (up to ~36h total with +6 base)
                offlineEarningsBonus += hoursAdded;
            }
            // All earnings bonuses (tiers 1-20) - exponential 1.15x scaling (1% base for crypto sale & stake value)
            if (key.includes('earnings_boost')) {
                allEarningsBonus += 1 * Math.pow(1.15, tier - 1);  // T1: 1%, T2: 1.15%, T3: 1.32%, ... T20: 59.42%
            }
            // Minigame reward bonuses (tiers 1-20) - exponential scaling (1% base × 1.15^(tier-1))
            if (key.includes('minigame_reward')) {
                minigameRewardBonus += (Math.pow(1.15, tier - 1) - 1) * 100;  // T1: 0%, T2: 15%, T3: 32.25%, ... T20: 1223.62%
            }
            // Token generation bonuses (tiers 1-20) - sum all purchased token generation upgrades
            if (key.includes('token_generation')) {
                // Parse the token value from the upgrade name
                const upgradeName = getUpgradeName(key);
                const tokenMatch = upgradeName.match(/\+([0-9.]+)\s+Corrupt\s+Tokens/);
                if (tokenMatch) {
                    tokenGenerationBonus += parseFloat(tokenMatch[1]);
                }
            }
        }
    });

    const bonusesDiv = document.createElement('div');
    bonusesDiv.style.background = '#1a2e2e';
    bonusesDiv.style.border = '2px solid #4CAF50';
    bonusesDiv.style.borderRadius = '6px';
    bonusesDiv.style.padding = '15px';
    bonusesDiv.style.marginBottom = '20px';
    bonusesDiv.style.textAlign = 'center';
    bonusesDiv.style.color = '#fff';

    let bonusText = `<div style="color: #4CAF50; font-weight: bold; margin-bottom: 12px; font-size: 1.1rem;">YOUR CURRENT BONUSES</div>`;
    bonusText += `<div style="font-size: 0.85rem; line-height: 2;">`;
    bonusText += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">`;

    // Row 1
    bonusText += `<div>🔷 <strong>Rugpulls:</strong> <span style="color: #ffeb3b;">${ascensionLevel}</span></div>`;
    bonusText += `<div>🖱️ <strong>Manual Hash:</strong> <span style="color: #ffeb3b;">+${((totalClickBonus - 1) * 100).toFixed(1)}%</span></div>`;

    // Row 2
    bonusText += `<div>📍 <strong>% of Hash Rate as Manual Hash:</strong> <span style="color: #ffeb3b;">+${clickHashRateBonus.toFixed(1)}%</span></div>`;
    bonusText += `<div>⚙️ <strong>Power Capacity:</strong> <span style="color: #ffeb3b;">+${powerCapacityBonus.toFixed(1)}%</span></div>`;

    // Row 3
    bonusText += `<div>🔧 <strong>Miner Power Consumption:</strong> <span style="color: #ffeb3b;">-${minerPowerReduction.toFixed(1)}%</span></div>`;
    bonusText += `<div>📈 <strong>Miner Hash Rate:</strong> <span style="color: #ffeb3b;">+${minerHashRateBonus.toFixed(1)}%</span></div>`;

    // Row 4
    bonusText += `<div>💰 <strong>Staking APR:</strong> <span style="color: #ffeb3b;">+${stakingAPRBonus.toFixed(2)}%</span></div>`;
    bonusText += `<div>🌙 <strong>Offline Earnings Cap (Total):</strong> <span style="color: #ffeb3b;">${offlineEarningsBonus + 6}h</span></div>`;

    // Row 5
    bonusText += `<div>💵 <strong>Crypto Sale Value:</strong> <span style="color: #ffeb3b;">+${allEarningsBonus.toFixed(1)}%</span></div>`;
    bonusText += `<div>🎮 <strong>Minigame Rewards:</strong> <span style="color: #ffeb3b;">+${minigameRewardBonus.toFixed(1)}%</span></div>`;
    bonusText += `</div>`;

    // Token Generation (full width)
    bonusText += `<div style="margin-top: 12px;">🪙 <strong>Corrupt Tokens/s Passively:</strong> <span style="color: #ffeb3b;">+${tokenGenerationBonus.toFixed(5)}</span></div>`;

    bonusText += `</div></div>`;
    bonusesDiv.innerHTML = bonusText;
    container.appendChild(bonusesDiv);

    // Group upgrades by tier
    const tiers = [
        { name: 'Tier 1', upgrades: ['power_capacity_1', 'miner_efficiency_1', 'staking_apy_1', 'miner_hashrate_1', 'click_hashrate_1', 'offline_earnings_1', 'earnings_boost_1', 'minigame_reward_1', 'token_generation_0'] },
        { name: 'Tier 2', upgrades: ['power_capacity_2', 'miner_efficiency_2', 'staking_apy_2', 'miner_hashrate_2', 'click_hashrate_2', 'offline_earnings_2', 'earnings_boost_2', 'minigame_reward_2', 'starter_miners_t1', 'starter_power_p0', 'token_generation_1_alt'] },
        { name: 'Tier 3', upgrades: ['power_capacity_3', 'miner_efficiency_3', 'staking_apy_3', 'miner_hashrate_3', 'click_hashrate_3', 'offline_earnings_3', 'earnings_boost_3', 'minigame_reward_3', 'auto_sell', 'starter_miners_t2', 'starter_power_p1', 'token_generation_2_alt'] },
        { name: 'Tier 4', upgrades: ['power_capacity_4', 'miner_efficiency_4', 'staking_apy_4', 'miner_hashrate_4', 'click_hashrate_4', 'offline_earnings_4', 'earnings_boost_4', 'minigame_reward_4', 'starter_miners_t3', 'starter_power_p2', 'token_generation_3_alt'] },
        { name: 'Tier 5', upgrades: ['power_capacity_5', 'miner_efficiency_5', 'staking_apy_5', 'miner_hashrate_5', 'click_hashrate_5', 'offline_earnings_5', 'earnings_boost_5', 'minigame_reward_5', 'starter_miners_t4', 'starter_power_p3', 'token_generation_4_alt'] },
        { name: 'Tier 6', upgrades: ['power_capacity_6', 'miner_efficiency_6', 'staking_apy_6', 'miner_hashrate_6', 'click_hashrate_6', 'offline_earnings_6', 'earnings_boost_6', 'minigame_reward_6', 'starter_miners_t5', 'starter_power_p4', 'token_generation_1'] },
        { name: 'Tier 7', upgrades: ['power_capacity_7', 'miner_efficiency_7', 'staking_apy_7', 'miner_hashrate_7', 'click_hashrate_7', 'offline_earnings_7', 'earnings_boost_7', 'minigame_reward_7', 'starter_miners_t6', 'starter_power_p5', 'minigame_unlock', 'token_generation_t7'] },
        { name: 'Tier 8', upgrades: ['power_capacity_8', 'miner_efficiency_8', 'staking_apy_8', 'miner_hashrate_8', 'click_hashrate_8', 'offline_earnings_8', 'earnings_boost_8', 'minigame_reward_8', 'starter_miners_t7', 'starter_power_p6', 'cash_multiplier', 'token_generation_t8'] },
        { name: 'Tier 9', upgrades: ['power_capacity_9', 'miner_efficiency_9', 'staking_apy_9', 'miner_hashrate_9', 'click_hashrate_9', 'offline_earnings_9', 'earnings_boost_9', 'minigame_reward_9', 'starter_miners_t8', 'starter_power_p7', 'token_generation_t9'] },
        { name: 'Tier 10', upgrades: ['power_capacity_10', 'miner_efficiency_10', 'staking_apy_10', 'miner_hashrate_10', 'click_hashrate_10', 'offline_earnings_10', 'earnings_boost_10', 'minigame_reward_10', 'starter_miners_t9', 'starter_power_p8', 'token_generation_t10'] },
        { name: 'Tier 11', upgrades: ['power_capacity_11', 'miner_efficiency_11', 'staking_apy_11', 'miner_hashrate_11', 'click_hashrate_11', 'offline_earnings_11', 'earnings_boost_11', 'minigame_reward_11', 'starter_miners_t10', 'starter_power_p9', 'token_generation_t11'] },
        { name: 'Tier 12', upgrades: ['power_capacity_12', 'miner_efficiency_12', 'staking_apy_12', 'miner_hashrate_12', 'click_hashrate_12', 'offline_earnings_12', 'earnings_boost_12', 'minigame_reward_12', 'starter_miners_t11', 'starter_power_p10', 'token_generation_t12'] },
        { name: 'Tier 13', upgrades: ['power_capacity_13', 'miner_efficiency_13', 'staking_apy_13', 'miner_hashrate_13', 'click_hashrate_13', 'offline_earnings_13', 'earnings_boost_13', 'minigame_reward_13', 'starter_miners_t12', 'starter_power_p11', 'token_generation_t13'] },
        { name: 'Tier 14', upgrades: ['power_capacity_14', 'miner_efficiency_14', 'staking_apy_14', 'miner_hashrate_14', 'click_hashrate_14', 'offline_earnings_14', 'earnings_boost_14', 'minigame_reward_14', 'starter_miners_t13', 'starter_power_p12', 'token_generation_t14'] },
        { name: 'Tier 15', upgrades: ['power_capacity_15', 'miner_efficiency_15', 'staking_apy_15', 'miner_hashrate_15', 'click_hashrate_15', 'offline_earnings_15', 'earnings_boost_15', 'minigame_reward_15', 'starter_miners_t14', 'token_generation_t15'] },
        { name: 'Tier 16', upgrades: ['power_capacity_16', 'miner_efficiency_16', 'staking_apy_16', 'miner_hashrate_16', 'click_hashrate_16', 'offline_earnings_16', 'earnings_boost_16', 'minigame_reward_16', 'starter_miners_t15', 'token_generation_t16'] },
        { name: 'Tier 17', upgrades: ['power_capacity_17', 'miner_efficiency_17', 'staking_apy_17', 'miner_hashrate_17', 'click_hashrate_17', 'offline_earnings_17', 'earnings_boost_17', 'minigame_reward_17', 'token_generation_t17'] },
        { name: 'Tier 18', upgrades: ['power_capacity_18', 'miner_efficiency_18', 'staking_apy_18', 'miner_hashrate_18', 'click_hashrate_18', 'offline_earnings_18', 'earnings_boost_18', 'minigame_reward_18', 'token_generation_t18'] },
        { name: 'Tier 19', upgrades: ['power_capacity_19', 'miner_efficiency_19', 'staking_apy_19', 'miner_hashrate_19', 'click_hashrate_19', 'offline_earnings_19', 'earnings_boost_19', 'minigame_reward_19', 'token_generation_t19'] },
        { name: 'Tier 20', upgrades: ['power_capacity_20', 'miner_efficiency_20', 'staking_apy_20', 'miner_hashrate_20', 'click_hashrate_20', 'offline_earnings_20', 'earnings_boost_20', 'minigame_reward_20', 'token_generation_t20'] }
    ];

    // All tiers are now static and defined above

    tiers.forEach((tier, tierIndex) => {
        if (tier.upgrades.length === 0) return;

        const tierNumber = tierIndex + 1;  // Tier numbers start at 1
        const isCurrentTierLocked = !isTierUnlocked(tierNumber);

        const tierDiv = document.createElement('div');
        tierDiv.style.marginBottom = '20px';

        const tierTitle = document.createElement('h4');
        let titleText = tier.name;
        if (tierNumber === 1) {
            titleText += ' (Always Available)';
        } else {
            titleText += ` (Unlocks after clearing Tier ${tierNumber - 1})`;
        }
        tierTitle.textContent = titleText;
        tierTitle.style.color = isCurrentTierLocked ? '#888888' : '#00ff88';
        tierTitle.style.marginBottom = '10px';
        tierDiv.appendChild(tierTitle);

        tier.upgrades.forEach(upgradeKey => {
            if (!metaUpgrades[upgradeKey]) {
                console.warn(`Upgrade not found: ${upgradeKey}`);
                return;
            }

            const upgrade = metaUpgrades[upgradeKey];
            const isLocked = isCurrentTierLocked;

            const btn = document.createElement('button');
            btn.className = 'meta-upgrade-btn';
            btn.style.display = 'block';
            btn.style.width = '100%';
            btn.style.padding = '10px';
            btn.style.marginBottom = '8px';
            btn.style.border = '2px solid #ff00ff';
            btn.style.borderRadius = '6px';
            btn.style.background = upgrade.purchased ? '#333333' : (isLocked ? '#1a1a1a' : '#1a1a2e');
            btn.style.color = upgrade.purchased ? '#888888' : (isLocked ? '#555555' : '#ffffff');
            btn.style.cursor = upgrade.purchased ? 'default' : (isLocked ? 'not-allowed' : 'pointer');
            btn.style.fontWeight = 'bold';
            btn.style.opacity = isLocked ? '0.5' : '1';

            const name = getUpgradeName(upgradeKey);
            const costDisplay = formatTokenCost(upgrade.cost);
            let status = upgrade.purchased ? '✓ OWNED' : `💎 ${costDisplay}`;
            if (isLocked) {
                status = '🔒 LOCKED';
            }

            // Add toggle indicator for auto_sell
            let toggleStatus = '';
            if (upgradeKey === 'auto_sell' && upgrade.purchased) {
                const autoSellState = typeof upgradeToggleState !== 'undefined' ? upgradeToggleState.auto_sell : true;
                toggleStatus = ` [${autoSellState ? 'ON' : 'OFF'}]`;
            }

            btn.innerHTML = `${name}${toggleStatus}<br><small>${status}</small>`;

            if (upgrade.purchased) {
                if (upgradeKey === 'auto_sell') {
                    // Add toggle functionality for auto-sell
                    btn.style.cursor = 'pointer';
                    btn.onclick = () => toggleAutoSell();
                    btn.onmouseover = () => btn.style.background = '#3a3a5e';
                    btn.onmouseout = () => btn.style.background = '#333333';
                }
            } else if (!isLocked) {
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
        unlockedSystems,
        upgradeToggleState,
        permanentMilestoneDoublings  // Persist milestone doublings across rugpulls
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
    rugpullCurrency = parseFloat(data.rugpullCurrency) || 0;
    lastShownMilestoneEarnings = data.lastShownMilestoneEarnings || 0;
    ascensionStats = data.ascensionStats || {
        totalRunsCompleted: 0,
        currencyEarned: 0,
        bestRunEarnings: 0,
        totalGlobalBonus: 0
    };
    // Merge loaded metaUpgrades with defaults - only restore purchased state, not costs
    if (data.metaUpgrades) {
        Object.keys(data.metaUpgrades).forEach(key => {
            if (metaUpgrades[key]) {
                // Only restore purchased state, keep the new correct costs
                metaUpgrades[key].purchased = data.metaUpgrades[key].purchased || false;
            }
        });
    }

    // NOTE: Costs are now defined in the metaUpgrades object at the top of the file
    // with cubic scaling per tier (10×tier³): Tier 1=10, Tier 2=80, Tier 3=270, etc.
    // No legacy cost migration needed - new tier system replaces all old upgrades

    // Load upgrade toggle states (like auto_sell)
    upgradeToggleState = data.upgradeToggleState || { auto_sell: true };
    window.upgradeToggleState = upgradeToggleState;  // Sync to window after loading
    window.metaUpgrades = metaUpgrades;  // Sync metaUpgrades to window after loading

    // Load permanent milestone doublings (survives rugpulls)
    if (data.permanentMilestoneDoublings) {
        permanentMilestoneDoublings = data.permanentMilestoneDoublings;
    }

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
    // First rugpull is always $1M
    // Subsequent rugpulls scale exponentially at HALF the rate
    // Original was 10x per rugpull, now halved to 5x per rugpull
    // Rugpull 0: $1M (fixed)
    // Rugpull 1: $5M (half of $10M)
    // Rugpull 2: $50M (half of $100M)
    // Rugpull 3: $500M (half of $1B)
    // Rugpull 4: $5B (half of $10B)
    // Rugpull 5: $50B (half of $100B)
    // Rugpull 10: $5Q (half of $10Q)
    // Rugpull 20: Half of exponential scaling
    if (ascensionLevel === 0) {
        return 1000000;  // First rugpull always costs $1M
    }
    const level = ascensionLevel + 1;  // Convert 0-indexed to 1-indexed
    // $1M × 10^(level-1) / 2 - half of the full 10x exponential scaling
    const requirement = (1000000 * Math.pow(10, level - 1)) / 2;
    return requirement;
}

function isRugpullEligible() {
    // Check current run earnings (resets after each rugpull)
    const earnings = lifetimeEarningsThisRugpull;
    // Eligible if earned at least the current requirement
    return earnings >= getRugpullRequirement();
}

/**
 * Update current run earnings from game.js (called every 100ms)
 */
function updateCurrentRunEarnings(lifetimeEarningsFromGame) {
    lifetimeEarningsThisRugpull = lifetimeEarningsFromGame;
}

/**
 * Update store button visibility (called regularly from game loop)
 * This ensures the button stays visible when player has tokens
 */
function updateStoreButtonVisibility() {
    const storeBtn = document.getElementById('rugpull-store-btn');
    if (!storeBtn) return;

    if (rugpullCurrency > 0) {
        storeBtn.style.display = 'inline-block';
    } else {
        storeBtn.style.display = 'none';
    }
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
    // Update store button visibility based on current token balance
    // (don't automatically hide - let updateStoreButtonVisibility handle it)
    if (typeof updateStoreButtonVisibility === 'function') {
        updateStoreButtonVisibility();
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
    const rugpullBtnMobile = document.getElementById('rugpull-btn-mobile');
    const rugpullBtnDesktop = document.getElementById('rugpull-btn-desktop');
    const progressTextMobile = document.getElementById('rugpull-progress-text-mobile');
    const progressTextDesktop = document.getElementById('rugpull-progress-text-desktop');

    if (rugpullBtn || rugpullBtnMobile || rugpullBtnDesktop) {
        const isEligible = isRugpullEligible();
        if (rugpullBtn) rugpullBtn.disabled = !isEligible;
        if (rugpullBtnMobile) rugpullBtnMobile.disabled = !isEligible;
        if (rugpullBtnDesktop) rugpullBtnDesktop.disabled = !isEligible;

        const buttonStyle = !isEligible ? {
            background: '#666',
            opacity: '0.5',
            cursor: 'not-allowed',
            boxShadow: 'none'
        } : {
            background: '#9c27b0',
            opacity: '1',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(156,39,176,0.8)'
        };

        if (rugpullBtn) {
            rugpullBtn.style.background = buttonStyle.background;
            rugpullBtn.style.opacity = buttonStyle.opacity;
            rugpullBtn.style.cursor = buttonStyle.cursor;
            rugpullBtn.style.boxShadow = buttonStyle.boxShadow;
        }

        if (rugpullBtnMobile) {
            rugpullBtnMobile.style.background = buttonStyle.background;
            rugpullBtnMobile.style.opacity = buttonStyle.opacity;
            rugpullBtnMobile.style.cursor = buttonStyle.cursor;
            rugpullBtnMobile.style.boxShadow = buttonStyle.boxShadow;
        }

        if (rugpullBtnDesktop) {
            rugpullBtnDesktop.style.background = buttonStyle.background;
            rugpullBtnDesktop.style.opacity = buttonStyle.opacity;
            rugpullBtnDesktop.style.cursor = buttonStyle.cursor;
            rugpullBtnDesktop.style.boxShadow = buttonStyle.boxShadow;
        }
    }

    // Update progress text below button - always show
    if (progressTextMobile || progressTextDesktop) {
        const requirement = getRugpullRequirement();
        let requirementLabel = '';
        let earningsLabel = '';


        // Helper to format large numbers with appropriate suffix
        function formatLargeNumber(num) {
            if (num >= 1e60) return `$${(num / 1e60).toFixed(1)}Nmdc`;  // Novemcillion
            else if (num >= 1e57) return `$${(num / 1e57).toFixed(1)}O/Odc`;  // Octodecillion
            else if (num >= 1e54) return `$${(num / 1e54).toFixed(1)}Spdc`;  // Septendecillion
            else if (num >= 1e51) return `$${(num / 1e51).toFixed(1)}Sxdc`;  // Sexdecillion
            else if (num >= 1e48) return `$${(num / 1e48).toFixed(1)}Qdc`;  // Quindecillion
            else if (num >= 1e45) return `$${(num / 1e45).toFixed(1)}Qdc`;  // Quattuordecillion
            else if (num >= 1e42) return `$${(num / 1e42).toFixed(1)}Tdc`;  // Tredecillion
            else if (num >= 1e39) return `$${(num / 1e39).toFixed(1)}U/Udc`;  // Undecillion
            else if (num >= 1e36) return `$${(num / 1e36).toFixed(1)}D/Ddc`;  // Duodecillion
            else if (num >= 1e33) return `$${(num / 1e33).toFixed(1)}Dc`;  // Decillion
            else if (num >= 1e30) return `$${(num / 1e30).toFixed(1)}N`;  // Nonillion
            else if (num >= 1e27) return `$${(num / 1e27).toFixed(1)}O`;  // Octillion
            else if (num >= 1e24) return `$${(num / 1e24).toFixed(1)}Sep`;  // Septillion
            else if (num >= 1e21) return `$${(num / 1e21).toFixed(1)}S`;  // Sextillion
            else if (num >= 1e18) return `$${(num / 1e18).toFixed(1)}Qa`;  // Quintillion
            else if (num >= 1e15) return `$${(num / 1e15).toFixed(1)}Q`;  // Quadrillion
            else if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;  // Trillion
            else if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;  // Billion
            else if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;  // Million
            else return `$${Math.floor(num).toLocaleString()}`;
        }

        // Use the same formatting function for requirement as for earnings
        requirementLabel = formatLargeNumber(requirement);

        earningsLabel = formatLargeNumber(lifetimeEarningsThisRugpull);

        // Update mobile version
        if (progressTextMobile) {
            progressTextMobile.textContent = `${earningsLabel} / ${requirementLabel}`;
        }

        // Update desktop version
        if (progressTextDesktop) {
            progressTextDesktop.textContent = `${earningsLabel} / ${requirementLabel}`;
        }
    }

    // Show/hide Rugpull Store button based on tokens
    const storeBtn = document.getElementById('rugpull-store-btn');
    const storeBtnMobile = document.getElementById('rugpull-store-btn-mobile-main');
    const storeBtnDesktop = document.getElementById('rugpull-store-btn-desktop');
    if (storeBtn || storeBtnDesktop || storeBtnMobile) {
        if (rugpullCurrency > 0) {
            if (storeBtn) storeBtn.style.display = 'inline-block';
            if (storeBtnMobile) storeBtnMobile.style.display = 'block';
            if (storeBtnDesktop) storeBtnDesktop.style.display = 'flex';
        } else {
            if (storeBtn) storeBtn.style.display = 'none';
            if (storeBtnMobile) storeBtnMobile.style.display = 'none';
            if (storeBtnDesktop) storeBtnDesktop.style.display = 'none';
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
    const earnings = lifetimeEarningsThisRugpull;
    if (!earnings) {
        return;
    }

    const requirement = getRugpullRequirement();

    // Show popup if player just hit the current rugpull requirement
    if (earnings >= requirement && lastShownMilestoneEarnings < requirement) {
        lastShownMilestoneEarnings = earnings;

        // Show popup immediately
        showRugpullMilestonePopup(ascensionLevel + 1);
    }
}

/**
 * Show popup when player reaches a rugpull requirement (as in-game modal)
 * Now just delegates to showRugpullOffer() to avoid duplicate modals
 */
function showRugpullMilestonePopup(nextMilestoneNumber) {
    showRugpullOffer();
}

/**
 * Close rugpull milestone modal
 */
function closeRugpullMilestoneModal() {
    const modal = document.getElementById('rugpull-milestone-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Update store button visibility based on current token balance
    // (don't automatically hide - let updateStoreButtonVisibility handle it)
    if (typeof updateStoreButtonVisibility === 'function') {
        updateStoreButtonVisibility();
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

// Commented out for now - causing issues
// ensureMetaUpgradesInitialized();

console.log('[RUGPULL] About to export functions to window');

// Export testRugpull to window so it can be called from console
window.testRugpull = testRugpull;
console.log('[RUGPULL] ✓ Exported testRugpull');

// Export metaUpgrades and upgradeToggleState to window so game.js can access them
window.metaUpgrades = metaUpgrades;
window.upgradeToggleState = upgradeToggleState;

// Export rugpullState object to window so game.js can save/load lifetimeEarningsDisplay
window.rugpullState = {
    lifetimeEarningsDisplay: lifetimeEarningsDisplay
};

// Export rugpull currency and level to window
window.rugpullCurrency = rugpullCurrency;
window.ascensionLevel = ascensionLevel;

// Export store button visibility function to window
window.updateStoreButtonVisibility = updateStoreButtonVisibility;

// Export updateAscensionUI to window so game.js can call it
window.updateAscensionUI = updateAscensionUI;

// Export updateCurrentRunEarnings to window so game.js can call it
window.updateCurrentRunEarnings = updateCurrentRunEarnings;

// Export checkRugpullMilestone to window so game.js can call it
window.checkRugpullMilestone = checkRugpullMilestone;

// Create getter for lifetimeEarningsThisRugpull so it updates dynamically
Object.defineProperty(window, 'lifetimeEarningsThisRugpull', {
    get: function() {
        return lifetimeEarningsThisRugpull;
    },
    set: function(value) {
        lifetimeEarningsThisRugpull = value;
    }
});

// Export function to trigger UI update for rugpull progress
// Note: lifetimeEarningsThisRugpull is synced via updateCurrentRunEarnings from game.js every 100ms
window.rugpullAddEarnings = function(amount) {
    // Track earnings towards next rugpull
    lifetimeEarningsThisRugpull += amount;
    console.log('[RUGPULL] Earnings event:', { amount, currentEarnings: lifetimeEarningsThisRugpull });
    if (typeof updateAscensionUI === 'function') {
        updateAscensionUI();
    }
};

// Initialize implementation namespace if it doesn't exist
if (!window._rugpullImpl) {
    window._rugpullImpl = {};
}

// Export tooltip functions to implementation namespace
window._rugpullImpl.showRugpullTooltip = showRugpullTooltip;
window._rugpullImpl.hideRugpullTooltip = hideRugpullTooltip;

// Export modal functions to implementation namespace
window._rugpullImpl.openMetaUpgradesModal = openMetaUpgradesModal;
window.closeMetaUpgradesModal = closeMetaUpgradesModal;

// Export button click handler to implementation namespace
window._rugpullImpl.handleRugpullButtonClick = handleRugpullButtonClick;

// Export reset tracker function
window.resetRugpullTracker = function() {
    lifetimeEarningsThisRugpull = 0;
    console.log('[RUGPULL] Tracker reset - lifetimeEarningsThisRugpull = 0');
    if (typeof updateAscensionUI === 'function') {
        updateAscensionUI();
    }
};

// Debug: Confirm exports are available
console.log('[RUGPULL] ✓✓✓ RUGPULL.JS LOADED ✓✓✓');
console.log('[RUGPULL] Exports set to window:', {
    metaUpgradesAvailable: !!window.metaUpgrades,
    auto_sell_crypto: window.metaUpgrades && window.metaUpgrades.auto_sell_crypto ? window.metaUpgrades.auto_sell_crypto : 'NOT FOUND',
    upgradeToggleState: window.upgradeToggleState,
    rugpullAddEarnings: typeof window.rugpullAddEarnings === 'function' ? '✓ AVAILABLE' : '✗ NOT AVAILABLE'
});

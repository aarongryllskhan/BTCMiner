// Achievement System
// Tracks unlocked achievements, displays notifications, and manages modal display

let achievementsData = {
    achievements: {}
};

// Track which achievements we've shown notifications for this session
let notificationsShownThisSession = new Set();

// Queue for achievement notifications (to display one at a time)
let notificationQueue = [];
let isDisplayingNotification = false;

// Miner names for all cryptos
const minerNames = {
    btc: ['Manual Hash Rate', 'USB Miner', 'GTX 1660 Super', 'RTX 5090 Rig', 'ASIC Mining Unit', 'Liquid ASIC Rig', 'Mobile Mining Container', 'Geothermal Mining Farm', 'Data Center Facility', 'Orbital Data Relay', 'Quantum Computer', 'Advanced Quantum Rig', 'Superintelligent AI Network', 'Dimensional Mining Array', 'Multiversal Hash Grid', 'Infinite Energy Extractor'],
    eth: ['Manual Hash Rate', 'Single GPU Rig', 'RTX 4090 Miner', '8-GPU Mining Rig', 'Professional ETH Farm', 'Staking Validator Node', 'Multi-Validator Farm', 'ETH Mining Complex', 'Enterprise Staking Pool', 'Layer 2 Validation Network', 'Ethereum Foundation Node', 'Global Validator Consortium', 'Sharding Supernetwork', 'Zero-Knowledge Proof Farm', 'Interchain Bridge Network', 'Ethereum 3.0 Genesis Node'],
    doge: ['Manual Hash Rate', 'Basic Scrypt Miner', 'L3+ ASIC Miner', 'Mini DOGE Farm', 'Scrypt Mining Pool', 'Industrial DOGE Facility', 'DOGE Megafarm', 'WOW Mining Complex', 'Moon Mining Station', 'Interplanetary DOGE Network', 'To The Moon Supercomputer', 'Mars Colony Mining Base', 'Asteroid Belt DOGE Harvester', 'Jovian Satellite Network', 'Solar System DOGE Grid', 'Intergalactic SHIBE Matrix']
};

// Complete list of all achievements
const achievementDefinitions = {
    // ============ EARNINGS MILESTONES (Lifetime) ============
    first_dollar: { id: 'first_dollar', name: 'Your First Dollar', description: 'Earn your first dollar', emoji: '💵', category: 'earnings', threshold: 1 },
    first_1k: { id: 'first_1k', name: 'Your First $1K', description: 'Lifetime earnings hit $1,000', emoji: '💵', category: 'earnings', threshold: 1000 },
    first_10k: { id: 'first_10k', name: 'Your First $10K', description: 'Lifetime earnings hit $10,000', emoji: '💵', category: 'earnings', threshold: 10000 },
    first_100k: { id: 'first_100k', name: 'Your First $100K', description: 'Lifetime earnings hit $100,000', emoji: '💵', category: 'earnings', threshold: 100000 },
    first_1m: { id: 'first_1m', name: 'Your First $1M', description: 'Lifetime earnings hit $1,000,000', emoji: '💵', category: 'earnings', threshold: 1000000 },
    first_10m: { id: 'first_10m', name: 'Your First $10M', description: 'Lifetime earnings hit $10,000,000', emoji: '💵', category: 'earnings', threshold: 10000000 },
    first_100m: { id: 'first_100m', name: 'Your First $100M', description: 'Lifetime earnings hit $100,000,000', emoji: '💵', category: 'earnings', threshold: 100000000 },
    first_1b: { id: 'first_1b', name: 'Your First $1B', description: 'Lifetime earnings hit $1,000,000,000', emoji: '🤑', category: 'earnings', threshold: 1000000000 },
    first_10b: { id: 'first_10b', name: 'Your First $10B', description: 'Lifetime earnings hit $10,000,000,000', emoji: '🤑', category: 'earnings', threshold: 10000000000 },
    first_100b: { id: 'first_100b', name: 'Your First $100B', description: 'Lifetime earnings hit $100,000,000,000', emoji: '🤑', category: 'earnings', threshold: 100000000000 },
    first_1t: { id: 'first_1t', name: 'Your First $1T', description: 'Lifetime earnings hit $1,000,000,000,000', emoji: '💎', category: 'earnings', threshold: 1000000000000 },
    first_1q: { id: 'first_1q', name: 'Your First $1 Quadrillion', description: 'Lifetime earnings hit $1,000,000,000,000,000', emoji: '💎', category: 'earnings', threshold: 1000000000000000 },
    first_1qq: { id: 'first_1qq', name: 'Your First $1 Quintillion', description: 'Lifetime earnings hit $1,000,000,000,000,000,000', emoji: '💎', category: 'earnings', threshold: 1000000000000000000 },
    first_1s: { id: 'first_1s', name: 'Your First $1 Sextillion', description: 'Lifetime earnings hit $1,000,000,000,000,000,000,000', emoji: '💎', category: 'earnings', threshold: 1000000000000000000000 },
    first_1sp: { id: 'first_1sp', name: 'Your First $1 Septillion', description: 'Lifetime earnings hit $1,000,000,000,000,000,000,000,000', emoji: '💎', category: 'earnings', threshold: 1000000000000000000000000 },
    first_1o: { id: 'first_1o', name: 'Your First $1 Octillion', description: 'Lifetime earnings hit $1,000,000,000,000,000,000,000,000,000', emoji: '💎', category: 'earnings', threshold: 1000000000000000000000000000 },
    first_1n: { id: 'first_1n', name: 'Your First $1 Nonillion', description: 'Lifetime earnings hit $1,000,000,000,000,000,000,000,000,000,000', emoji: '🏆', category: 'earnings', threshold: 1000000000000000000000000000000 },
    first_1d: { id: 'first_1d', name: 'Your First $1 Decillion', description: 'Lifetime earnings hit $1 Decillion', emoji: '💫', category: 'earnings', threshold: 1e33 },
    first_1ud: { id: 'first_1ud', name: 'Your First $1 Undecillion', description: 'Lifetime earnings hit $1 Undecillion', emoji: '✨', category: 'earnings', threshold: 1e36 },
    first_1dd: { id: 'first_1dd', name: 'Your First $1 Duodecillion', description: 'Lifetime earnings hit $1 Duodecillion', emoji: '🌟', category: 'earnings', threshold: 1e39 },
    first_1td: { id: 'first_1td', name: 'Your First $1 Tredecillion', description: 'Lifetime earnings hit $1 Tredecillion', emoji: '⭐', category: 'earnings', threshold: 1e42 },
    first_1qad: { id: 'first_1qad', name: 'Your First $1 Quattuordecillion', description: 'Lifetime earnings hit $1 Quattuordecillion', emoji: '💥', category: 'earnings', threshold: 1e45 },
    first_1qid: { id: 'first_1qid', name: 'Your First $1 Quindecillion', description: 'Lifetime earnings hit $1 Quindecillion', emoji: '🔥', category: 'earnings', threshold: 1e48 },
    first_1sx: { id: 'first_1sx', name: 'Your First $1 Sexdecillion', description: 'Lifetime earnings hit $1 Sexdecillion', emoji: '🚀', category: 'earnings', threshold: 1e51 },
    first_1spd: { id: 'first_1spd', name: 'Your First $1 Septendecillion', description: 'Lifetime earnings hit $1 Septendecillion', emoji: '🌌', category: 'earnings', threshold: 1e54 },
    first_1octo: { id: 'first_1octo', name: 'Your First $1 Octodecillion', description: 'Lifetime earnings hit $1 Octodecillion', emoji: '🪐', category: 'earnings', threshold: 1e57 },
    first_1novem: { id: 'first_1novem', name: 'Your First $1 Novemdecillion', description: 'Lifetime earnings hit $1 Novemdecillion', emoji: '🌠', category: 'earnings', threshold: 1e60 },
    first_1vig: { id: 'first_1vig', name: 'Your First $1 Vigintillion', description: 'Lifetime earnings hit $1 Vigintillion', emoji: '♾️', category: 'earnings', threshold: 1e63 },
    first_googol: { id: 'first_googol', name: 'Your First $1 Googol', description: 'Lifetime earnings hit $1 Googol', emoji: '👑', category: 'earnings', threshold: 1e100 },
    first_centillion: { id: 'first_centillion', name: 'Your First $1 Centillion', description: 'Lifetime earnings hit $1 Centillion', emoji: '🏆', category: 'earnings', threshold: 1e303 },
    first_1e150: { id: 'first_1e150', name: 'Your First 10^150', description: 'Lifetime earnings hit 10^150', emoji: '🌌', category: 'earnings', threshold: 1e150 },
    first_1e200: { id: 'first_1e200', name: 'Your First 10^200', description: 'Lifetime earnings hit 10^200', emoji: '🔭', category: 'earnings', threshold: 1e200 },
    first_1e250: { id: 'first_1e250', name: 'Your First 10^250', description: 'Lifetime earnings hit 10^250', emoji: '⚡', category: 'earnings', threshold: 1e250 },
    first_1e300: { id: 'first_1e300', name: 'Your First 10^300', description: 'Lifetime earnings hit 10^300', emoji: '🌠', category: 'earnings', threshold: 1e300 },
    first_1e350: { id: 'first_1e350', name: 'Your First 10^350', description: 'Lifetime earnings hit 10^350', emoji: '🚀', category: 'earnings', threshold: 1e350 },
    first_1e400: { id: 'first_1e400', name: 'Your First 10^400', description: 'Lifetime earnings hit 10^400', emoji: '🛸', category: 'earnings', threshold: 1e400 },
    first_1e450: { id: 'first_1e450', name: 'Your First 10^450', description: 'Lifetime earnings hit 10^450', emoji: '🌟', category: 'earnings', threshold: 1e450 },
    first_1e500: { id: 'first_1e500', name: 'Your First 10^500 - INFINITE WEALTH', description: 'Lifetime earnings hit 10^500 - Ultimate achievement!', emoji: '✨', category: 'earnings', threshold: 1e500 },
};

// Generate equipment achievements for all miners (16 miners x 3 cryptos = 48 achievements)
// Generate for all miners except manual hash (id 1-15), with levels 10, 20, 50, 100
const minerIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const levels = [10, 20, 50, 100];
const levelNames = { 10: 'Starter', 20: 'Master', 50: 'Legend', 100: 'God' };
const cryptos = ['btc', 'eth', 'doge'];
const cryptoEmojis = { btc: '₿', eth: 'Ξ', doge: 'Ð' };

// Manual hash achievements (levels 10, 20, 50, 100 for each crypto)
['btc', 'eth', 'doge'].forEach(crypto => {
    [10, 20, 50, 100].forEach(level => {
        const levelName = levelNames[level];
        const cryptoName = crypto.toUpperCase();
        achievementDefinitions[`manual_${crypto}_${level}`] = {
            id: `manual_${crypto}_${level}`,
            name: `Manual ${levelName} (${cryptoName})`,
            description: `Get ${cryptoName} Manual Hash Rate to level ${level}`,
            emoji: '🖱️',
            category: 'equipment',
            type: 'manual',
            crypto,
            level
        };
    });
});

// Equipment achievements for miners 1-15
cryptos.forEach(crypto => {
    minerIds.forEach(minerId => {
        const minerName = minerNames[crypto][minerId];
        const cryptoName = crypto.toUpperCase();

        levels.forEach(level => {
            const levelName = levelNames[level];
            const emojis = { btc: '💾', eth: '🎮', doge: '🚀' };
            const emojiMap = {
                1: '💾', 2: '🎮', 3: '🚀', 4: '⛏️', 5: '🔧',
                6: '🏭', 7: '🏢', 8: '🌍', 9: '🛰️', 10: '🌌',
                11: '⚛️', 12: '🧠', 13: '🎪', 14: '🌀', 15: '♾️'
            };
            const emoji = emojiMap[minerId];

            achievementDefinitions[`${crypto}_miner${minerId}_${level}`] = {
                id: `${crypto}_miner${minerId}_${level}`,
                name: `${crypto.toUpperCase()} ${minerName} ${levelName}`,
                description: `Get ${minerName} to level ${level}`,
                emoji,
                category: 'equipment',
                type: 'miner',
                crypto,
                minerId,
                level
            };
        });
    });
});

// General equipment achievements
Object.assign(achievementDefinitions, {
    all_miners_level_1: { id: 'all_miners_level_1', name: 'Diverse Portfolio', description: 'Get all miners in one crypto to level 1+', emoji: '📊', category: 'equipment', type: 'all_miners', level: 1 },
    all_miners_level_10: { id: 'all_miners_level_10', name: 'Complete Arsenal', description: 'Get all miners in one crypto to level 10+', emoji: '⚒️', category: 'equipment', type: 'all_miners', level: 10 },
    any_miner_level_50: { id: 'any_miner_level_50', name: 'Legendary Status', description: 'Get any miner to level 50', emoji: '👑', category: 'equipment', type: 'any_miner', level: 50 },
    any_miner_level_100: { id: 'any_miner_level_100', name: 'Godlike Power', description: 'Get any miner to level 100', emoji: '💫', category: 'equipment', type: 'any_miner', level: 100 },

    // ============ POWER ============
    power_1mw: { id: 'power_1mw', name: 'Power User', description: 'Reach 1 MW of power consumption', emoji: '⚡', category: 'power', threshold: 1000000 },
    power_1gw: { id: 'power_1gw', name: 'Gigantic Setup', description: 'Reach 1 GW of power consumption', emoji: '⚡', category: 'power', threshold: 1000000000 },
    power_1tw: { id: 'power_1tw', name: 'Planetary Scale', description: 'Reach 1 TW of power consumption', emoji: '⚡', category: 'power', threshold: 1000000000000 },
    power_1pw: { id: 'power_1pw', name: 'Star Power', description: 'Reach 1 PW of power consumption', emoji: '⭐', category: 'power', threshold: 1000000000000000 },

    // ============ CRYPTO HOLDINGS ============
    own_1_btc: { id: 'own_1_btc', name: 'Bitcoin Holder', description: 'Own 1 BTC', emoji: '₿', category: 'holdings', threshold: 1, type: 'btc' },
    own_10_btc: { id: 'own_10_btc', name: 'BTC Whale Starter', description: 'Own 10 BTC', emoji: '₿', category: 'holdings', threshold: 10, type: 'btc' },
    own_100_btc: { id: 'own_100_btc', name: 'BTC Whale', description: 'Own 100 BTC', emoji: '₿', category: 'holdings', threshold: 100, type: 'btc' },
    own_1000_btc: { id: 'own_1000_btc', name: 'BTC Titan', description: 'Own 1000 BTC', emoji: '💎', category: 'holdings', threshold: 1000, type: 'btc' },

    own_50_eth: { id: 'own_50_eth', name: 'Ethereum Collector', description: 'Own 50 ETH', emoji: 'Ξ', category: 'holdings', threshold: 50, type: 'eth' },
    own_100_eth: { id: 'own_100_eth', name: 'Ethereum Hodler', description: 'Own 100 ETH', emoji: 'Ξ', category: 'holdings', threshold: 100, type: 'eth' },
    own_1000_eth: { id: 'own_1000_eth', name: 'Ethereum Whale', description: 'Own 1000 ETH', emoji: 'Ξ', category: 'holdings', threshold: 1000, type: 'eth' },

    own_1m_doge: { id: 'own_1m_doge', name: 'Doge Millionaire', description: 'Own 1,000,000 DOGE', emoji: 'Ð', category: 'holdings', threshold: 1000000, type: 'doge' },
    own_1b_doge: { id: 'own_1b_doge', name: 'Doge Billionaire', description: 'Own 1,000,000,000 DOGE', emoji: 'Ð', category: 'holdings', threshold: 1000000000, type: 'doge' },

    // ============ STAKING ============
    first_stake: { id: 'first_stake', name: 'First Stake', description: 'Stake your first crypto', emoji: '📦', category: 'staking' },
    stake_1_btc: { id: 'stake_1_btc', name: 'Hodler', description: 'Have 1 BTC staked', emoji: '💪', category: 'staking', threshold: 1, type: 'staked_btc' },
    staking_1k: { id: 'staking_1k', name: 'Staking Starter', description: 'Earn $1,000 from staking', emoji: '📈', category: 'staking', threshold: 1000, type: 'staking_earnings' },
    staking_1m: { id: 'staking_1m', name: 'Staking Millionaire', description: 'Earn $1,000,000 from staking', emoji: '💰', category: 'staking', threshold: 1000000, type: 'staking_earnings' },
    stake_10_btc: { id: 'stake_10_btc', name: 'Long Game', description: 'Have 10+ BTC staked', emoji: '🏦', category: 'staking', threshold: 10, type: 'staked_btc' },
    stake_1000_eth: { id: 'stake_1000_eth', name: 'Ethereum Staker', description: 'Have 1000 ETH staked', emoji: '📦', category: 'staking', threshold: 1000, type: 'staked_eth' },
    stake_1m_doge: { id: 'stake_1m_doge', name: 'Doge Staker', description: 'Have 1,000,000 DOGE staked', emoji: '🐕', category: 'staking', threshold: 1000000, type: 'staked_doge' },

    // ============ ASCENSION / RUGPULL ============
    first_rugpull: { id: 'first_rugpull', name: 'First Reset', description: 'Execute your first rugpull', emoji: '🔄', category: 'ascension' },
    five_rugpulls: { id: 'five_rugpulls', name: 'Serial Ascender', description: 'Execute 5 rugpulls', emoji: '🔄', category: 'ascension', threshold: 5, type: 'ascension_count' },
    ten_rugpulls: { id: 'ten_rugpulls', name: 'Prestige Master', description: 'Execute 10 rugpulls', emoji: '🔄', category: 'ascension', threshold: 10, type: 'ascension_count' },
    twenty_five_rugpulls: { id: 'twenty_five_rugpulls', name: 'Ascension Addict', description: 'Execute 25 rugpulls', emoji: '♻️', category: 'ascension', threshold: 25, type: 'ascension_count' },
    fifty_rugpulls: { id: 'fifty_rugpulls', name: 'Reality Bender', description: 'Execute 50 rugpulls', emoji: '🌀', category: 'ascension', threshold: 50, type: 'ascension_count' },
    seventy_five_rugpulls: { id: 'seventy_five_rugpulls', name: 'Dimensional Traveler', description: 'Execute 75 rugpulls', emoji: '⏳', category: 'ascension', threshold: 75, type: 'ascension_count' },
    hundred_rugpulls: { id: 'hundred_rugpulls', name: 'Ascension Deity', description: 'Execute 100 rugpulls', emoji: '👑', category: 'ascension', threshold: 100, type: 'ascension_count' },

    // ============ HACKING MINIGAME ============
    first_hack: { id: 'first_hack', name: 'First Hack', description: 'Complete your first hacking minigame', emoji: '🔐', category: 'hacking' },
    hack_master_easy: { id: 'hack_master_easy', name: 'Easy Hack Master', description: 'Win 10 EASY hacking games', emoji: '🟢', category: 'hacking', threshold: 10, difficulty: 'EASY' },
    hack_master_medium: { id: 'hack_master_medium', name: 'Medium Hack Master', description: 'Win 10 MEDIUM hacking games', emoji: '🟡', category: 'hacking', threshold: 10, difficulty: 'MEDIUM' },
    hack_master_hard: { id: 'hack_master_hard', name: 'Hard Hack Master', description: 'Win 5 HARD hacking games', emoji: '🔴', category: 'hacking', threshold: 5, difficulty: 'HARD' },
    hack_perfectionist: { id: 'hack_perfectionist', name: 'Perfectionist', description: 'Win 3 HARD games in a row', emoji: '💯', category: 'hacking', threshold: 3, type: 'consecutive_hard' },
    hacked_1k: { id: 'hacked_1k', name: 'Hacker Novice', description: 'Earn $1,000 from hacking', emoji: '💰', category: 'hacking', threshold: 1000, type: 'hacking_rewards' },
    hacked_100k: { id: 'hacked_100k', name: 'Professional Hacker', description: 'Earn $100,000 from hacking', emoji: '💵', category: 'hacking', threshold: 100000, type: 'hacking_rewards' },
    hacked_1m: { id: 'hacked_1m', name: 'Elite Hacker', description: 'Earn $1,000,000 from hacking', emoji: '🏆', category: 'hacking', threshold: 1000000, type: 'hacking_rewards' },

    // ============ SESSION-BASED ============
    lightning_fast: { id: 'lightning_fast', name: 'Lightning Fast', description: 'Earn $1M in a single session', emoji: '⚡', category: 'session', threshold: 1000000, type: 'session_earnings' },
    session_10m: { id: 'session_10m', name: 'Speed Racer', description: 'Earn $10M in a single session', emoji: '🏎️', category: 'session', threshold: 10000000, type: 'session_earnings' },
    session_100m: { id: 'session_100m', name: 'Speed Demon', description: 'Earn $100M in a single session', emoji: '🔥', category: 'session', threshold: 100000000, type: 'session_earnings' },
    session_1b: { id: 'session_1b', name: 'Blazing Fast', description: 'Earn $1B in a single session', emoji: '💫', category: 'session', threshold: 1000000000, type: 'session_earnings' },
    session_100b: { id: 'session_100b', name: 'Hyperfast', description: 'Earn $100B in a single session', emoji: '⚡', category: 'session', threshold: 100000000000, type: 'session_earnings' },
    session_1t: { id: 'session_1t', name: 'Ludicrous Speed', description: 'Earn $1T in a single session', emoji: '🚀', category: 'session', threshold: 1000000000000, type: 'session_earnings' },

    // ============ BREAKING SUPPLY CAPS ============
    btc_hard_cap: { id: 'btc_hard_cap', name: 'Your Hash Power has broken the hard-capped supply for BTC!', description: 'Mine more than 21 million BTC (hard supply cap)', emoji: '⚒️', category: 'supply_cap', type: 'btc_supply', threshold: 21000000 },
    eth_circulating: { id: 'eth_circulating', name: "You've somehow managed to mine more than the circulating supply?", description: 'Mine more than 120.7 million ETH (approx circulating supply)', emoji: '⚒️', category: 'supply_cap', type: 'eth_supply', threshold: 120700000 },
    doge_circulating: { id: 'doge_circulating', name: "You've somehow managed to mine more than the circulating supply?", description: 'Mine more than 169 billion DOGE (approx circulating supply)', emoji: '⚒️', category: 'supply_cap', type: 'doge_supply', threshold: 169000000000 }
});

// Initialize achievements on game load
function initAchievements() {
    Object.keys(achievementDefinitions).forEach(id => {
        if (!achievementsData.achievements[id]) {
            achievementsData.achievements[id] = {
                unlocked: false,
                unlockedAt: null,
                progress: 0,
                notificationShown: false
            };
        } else {
            // Preserve existing achievement data, especially notificationShown flag
            const existing = achievementsData.achievements[id];
            // Ensure notificationShown is set properly
            // If achievement was previously unlocked, mark notification as shown (don't show it again)
            if (existing.unlocked && typeof existing.notificationShown === 'undefined') {
                existing.notificationShown = true;
            }
            // If notificationShown is still undefined, set it based on unlocked status
            if (typeof existing.notificationShown === 'undefined') {
                existing.notificationShown = existing.unlocked ? true : false;
            }
        }
    });

}

// Check all achievement conditions and unlock if conditions are met
function checkAchievements() {
    Object.keys(achievementDefinitions).forEach(id => {
        const achievement = achievementDefinitions[id];
        const state = achievementsData.achievements[id];

        // Skip if state doesn't exist yet (happens before initAchievements)
        if (!state) return;
        if (state.unlocked) return;

        let unlocked = false;

        // ========== EARNINGS MILESTONES ==========
        if (achievement.category === 'earnings' && achievement.threshold) {
            const totalLifetimeEarnings = (typeof window !== 'undefined' && window.rugpullState?.lifetimeEarningsDisplay || 0) + lifetimeEarnings;
            if (totalLifetimeEarnings >= achievement.threshold) {
                unlocked = true;
            }
        }

        // ========== MANUAL HASH ==========
        else if (achievement.type === 'manual') {
            const { crypto, level } = achievement;
            const upgrades = crypto === 'btc' ? btcUpgrades : crypto === 'eth' ? ethUpgrades : dogeUpgrades;
            if (upgrades[0].level >= level) {
                unlocked = true;
            }
        }

        // ========== EQUIPMENT - SPECIFIC MINERS ==========
        else if (achievement.type === 'miner') {
            const { crypto, minerId, level } = achievement;
            const upgrades = crypto === 'btc' ? btcUpgrades : crypto === 'eth' ? ethUpgrades : dogeUpgrades;
            if (upgrades[minerId] && upgrades[minerId].level >= level) {
                unlocked = true;
            }
        }

        // ========== ALL MINERS LEVEL 1+ / 10+ ==========
        else if (achievement.type === 'all_miners') {
            const { level } = achievement;
            const btcAllLevel = btcUpgrades.every(u => u.level >= level);
            const ethAllLevel = ethUpgrades.every(u => u.level >= level);
            const dogeAllLevel = dogeUpgrades.every(u => u.level >= level);
            if (btcAllLevel || ethAllLevel || dogeAllLevel) {
                unlocked = true;
            }
        }

        // ========== ANY MINER LEVEL 50/100 ==========
        else if (achievement.type === 'any_miner') {
            const { level } = achievement;
            const anyLevel = [...btcUpgrades, ...ethUpgrades, ...dogeUpgrades].some(u => u.level >= level);
            if (anyLevel) {
                unlocked = true;
            }
        }

        // ========== POWER ==========
        else if (achievement.category === 'power' && achievement.threshold) {
            if (totalPowerUsed >= achievement.threshold) {
                unlocked = true;
            }
        }

        // ========== HOLDINGS ==========
        else if (achievement.type === 'btc' && btcBalance >= achievement.threshold) {
            unlocked = true;
        }
        else if (achievement.type === 'eth' && ethBalance >= achievement.threshold) {
            unlocked = true;
        }
        else if (achievement.type === 'doge' && dogeBalance >= achievement.threshold) {
            unlocked = true;
        }

        // ========== STAKING ==========
        else if (id === 'stake_1_btc' && typeof stakingEarnings !== 'undefined' && stakingEarnings.stakedBTC >= 1) {
            unlocked = true;
        }
        else if (id === 'staking_1k' && typeof stakingEarnings !== 'undefined' && stakingEarnings.totalStakingEarnings >= 1000) {
            unlocked = true;
        }
        else if (id === 'staking_1m' && typeof stakingEarnings !== 'undefined' && stakingEarnings.totalStakingEarnings >= 1000000) {
            unlocked = true;
        }
        else if (id === 'stake_10_btc' && typeof stakingEarnings !== 'undefined' && stakingEarnings.stakedBTC >= 10) {
            unlocked = true;
        }
        else if (id === 'stake_1000_eth' && typeof stakingEarnings !== 'undefined' && stakingEarnings.stakedETH >= 1000) {
            unlocked = true;
        }
        else if (id === 'stake_1m_doge' && typeof stakingEarnings !== 'undefined' && stakingEarnings.stakedDOGE >= 1000000) {
            unlocked = true;
        }

        // ========== SESSION EARNINGS ==========
        else if (achievement.category === 'session' && achievement.type === 'session_earnings' && achievement.threshold) {
            if (sessionEarnings >= achievement.threshold) {
                unlocked = true;
            }
        }

        // ========== ASCENSION ==========
        else if (id === 'first_rugpull' && typeof ascensionLevel !== 'undefined' && ascensionLevel >= 1) {
            unlocked = true;
        }
        else if (achievement.type === 'ascension_count' && achievement.threshold && typeof ascensionLevel !== 'undefined' && ascensionLevel >= achievement.threshold) {
            unlocked = true;
        }

        // ========== HACKING ==========
        else if (id === 'first_hack' && typeof hackingGamesWon !== 'undefined' && hackingGamesWon >= 1) {
            unlocked = true;
        }
        else if (achievement.category === 'hacking' && achievement.type === 'hacking_rewards' && achievement.threshold) {
            if (typeof hackingTotalRewardsEarned !== 'undefined' && hackingTotalRewardsEarned >= achievement.threshold) {
                unlocked = true;
            }
        }
        else if (id === 'hack_perfectionist' && typeof hackingConsecutiveWins !== 'undefined' && hackingConsecutiveWins >= 3) {
            unlocked = true;
        }

        // ========== BREAKING SUPPLY CAPS ==========
        else if (achievement.type === 'btc_supply' && btcBalance >= achievement.threshold) {
            unlocked = true;
        }
        else if (achievement.type === 'eth_supply' && ethBalance >= achievement.threshold) {
            unlocked = true;
        }
        else if (achievement.type === 'doge_supply' && dogeBalance >= achievement.threshold) {
            unlocked = true;
        }

        // Unlock achievement if condition met (only on first unlock)
        if (unlocked && !state.unlocked) {
            console.log('🏆 UNLOCKING ACHIEVEMENT:', id, 'notificationShown was:', state.notificationShown);
            state.unlocked = true;
            state.unlockedAt = Date.now();
            state.notificationShown = false; // Will be set to true after showing notification
            saveGame();

            // Show notification immediately when first unlocking
            showAchievementNotification(id);
            state.notificationShown = true;
            saveGame(); // Save the notificationShown flag
        }
    });
}

// Track active notifications for positioning
let activeNotifications = [];

// Special modal for supply cap achievements
function showSupplyCapModal(achievementId, achievement) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'supply-cap-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'supply-cap-modal';
    modal.style.cssText = `
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(100, 200, 255, 0.1));
        border: 3px solid #00ff88;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        max-width: 600px;
        color: #fff;
        box-shadow: 0 0 40px rgba(0, 255, 136, 0.6), 0 0 80px rgba(100, 200, 255, 0.3);
        animation: supplyCapPulse 0.5s ease-out;
    `;

    const achievementTitle = document.createElement('div');
    achievementTitle.style.cssText = `
        font-size: 2.5rem;
        font-weight: 900;
        margin-bottom: 20px;
        color: #00ff88;
        text-transform: uppercase;
        text-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
        font-family: monospace;
    `;
    achievementTitle.textContent = achievement.emoji;

    const achievementName = document.createElement('div');
    achievementName.style.cssText = `
        font-size: 2rem;
        font-weight: 900;
        margin-bottom: 15px;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-family: monospace;
    `;
    achievementName.textContent = achievement.name;

    const achievementDesc = document.createElement('div');
    achievementDesc.style.cssText = `
        font-size: 1.1rem;
        margin-bottom: 30px;
        color: #ccc;
        font-family: monospace;
    `;
    achievementDesc.textContent = achievement.description;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'CLAIM ACHIEVEMENT';
    closeBtn.style.cssText = `
        background: linear-gradient(135deg, #00ff88, #00cc6a);
        color: #000;
        border: none;
        padding: 15px 40px;
        font-size: 1.1rem;
        font-weight: 900;
        border-radius: 10px;
        cursor: pointer;
        font-family: monospace;
        text-transform: uppercase;
        transition: all 0.3s ease;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
    `;
    closeBtn.onmouseover = function() {
        this.style.boxShadow = '0 0 40px rgba(0, 255, 136, 1)';
        this.style.transform = 'scale(1.05)';
    };
    closeBtn.onmouseout = function() {
        this.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.6)';
        this.style.transform = 'scale(1)';
    };
    closeBtn.onclick = function() {
        modalOverlay.remove();
    };

    modal.appendChild(achievementTitle);
    modal.appendChild(achievementName);
    modal.appendChild(achievementDesc);
    modal.appendChild(closeBtn);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // Add animation style if not already present
    if (!document.getElementById('supply-cap-modal-style')) {
        const style = document.createElement('style');
        style.id = 'supply-cap-modal-style';
        style.textContent = `
            @keyframes supplyCapPulse {
                0% {
                    transform: scale(0.5);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.05);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Display achievement unlock notification
function showAchievementNotification(achievementId) {
    const achievement = achievementDefinitions[achievementId];
    if (!achievement) return;

    // Check if we've already shown this notification (prevent duplicates)
    if (notificationsShownThisSession.has(achievementId)) {
        console.log('🏆 BLOCKED duplicate notification:', achievementId);
        return;
    }

    // Special modal for supply cap achievements
    const supplyCapAchievements = ['btc_hard_cap', 'eth_circulating', 'doge_circulating'];
    if (supplyCapAchievements.includes(achievementId)) {
        console.log('🏆 SHOWING SPECIAL MODAL for:', achievementId, achievement.name);
        showSupplyCapModal(achievementId, achievement);
        notificationsShownThisSession.add(achievementId);
        return;
    }

    console.log('🏆 SHOWING notification:', achievementId, achievement.name);

    // Mark as shown BEFORE adding to queue to prevent duplicate calls
    notificationsShownThisSession.add(achievementId);

    // Add to notification queue
    notificationQueue.push({
        id: achievementId,
        achievement: achievement
    });

    // Process the queue
    processNotificationQueue();
}

// Process the notification queue - display one notification at a time
function processNotificationQueue() {
    // If already displaying, wait
    if (isDisplayingNotification) return;

    // If queue is empty, we're done
    if (notificationQueue.length === 0) return;

    // Mark as displaying
    isDisplayingNotification = true;

    // Get the next notification from queue
    const queueItem = notificationQueue.shift();
    const achievement = queueItem.achievement;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-content">
            <div class="achievement-notification-emoji">${achievement.emoji}</div>
            <div class="achievement-notification-text">
                <div class="achievement-notification-name">${achievement.name}</div>
                <div class="achievement-notification-desc">${achievement.description}</div>
            </div>
        </div>
    `;

    // Add to DOM
    document.body.appendChild(notification);
    activeNotifications.push(notification);

    // Display for 2 seconds, then remove and process next in queue
    setTimeout(() => {
        notification.remove();
        activeNotifications = activeNotifications.filter(n => n !== notification);

        // Mark as no longer displaying
        isDisplayingNotification = false;

        // Process next notification in queue
        processNotificationQueue();
    }, 2000);
}

// Update positions of all active notifications
function updateNotificationPositions() {
    // All notifications stay at the same position (stacked on top of each other)
    const startTop = window.innerWidth <= 932 ? 60 : 15;

    activeNotifications.forEach((notification) => {
        notification.style.top = startTop + 'px';
    });
}

// Open achievements modal
function openAchievementsModal() {
    const modal = document.getElementById('achievements-modal');
    if (modal) {
        modal.style.display = 'flex';
        populateAchievementsModal();
    }
}

// Close achievements modal
function closeAchievementsModal() {
    const modal = document.getElementById('achievements-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Populate achievements modal with current state
function populateAchievementsModal() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    container.innerHTML = '';

    const categories = {};
    Object.keys(achievementDefinitions).forEach(id => {
        const achievement = achievementDefinitions[id];
        const category = achievement.category;
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({ id, ...achievement });
    });

    const categoryLabels = {
        earnings: '💵 Earnings Milestones',
        equipment: '⚒️ Equipment',
        power: '⚡ Power',
        holdings: '₿ Crypto Holdings',
        staking: '📦 Staking',
        ascension: '🔄 Ascension',
        hacking: '🔐 Hacking',
        session: '⚡ Session Challenges'
    };

    Object.keys(categories).forEach(category => {
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'achievement-category-header';
        categoryHeader.innerHTML = `<h3>${categoryLabels[category] || category}</h3>`;
        container.appendChild(categoryHeader);

        categories[category].forEach(achievement => {
            // Ensure the achievement has been initialized in achievementsData
            if (!achievementsData.achievements[achievement.id]) {
                achievementsData.achievements[achievement.id] = {
                    unlocked: false,
                    unlockedAt: null,
                    progress: 0,
                    notificationShown: false
                };
            }

            const state = achievementsData.achievements[achievement.id];
            const isUnlocked = state && state.unlocked;

            const achievementDiv = document.createElement('div');
            achievementDiv.className = `achievement-item ${isUnlocked ? '' : 'achievement-locked'}`;

            if (isUnlocked) {
                const unlockedDate = new Date(state.unlockedAt);
                const dateStr = unlockedDate.toLocaleDateString();
                achievementDiv.innerHTML = `
                    <div class="achievement-emoji">${achievement.emoji}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                        <div class="achievement-date">Unlocked: ${dateStr}</div>
                    </div>
                `;
            } else {
                achievementDiv.innerHTML = `
                    <div class="achievement-emoji">❓</div>
                    <div class="achievement-info">
                        <div class="achievement-name">???</div>
                        <div class="achievement-desc">???</div>
                    </div>
                `;
            }

            container.appendChild(achievementDiv);
        });
    });
}

// Mark first stake
function markFirstStake() {
    if (!achievementsData.achievements['first_stake'].unlocked) {
        achievementsData.achievements['first_stake'].unlocked = true;
        achievementsData.achievements['first_stake'].unlockedAt = Date.now();
        showAchievementNotification('first_stake');
    }
}

// Mark first rugpull
function markFirstRugpull() {
    if (!achievementsData.achievements['first_rugpull'].unlocked) {
        achievementsData.achievements['first_rugpull'].unlocked = true;
        achievementsData.achievements['first_rugpull'].unlockedAt = Date.now();
        showAchievementNotification('first_rugpull');
    }
}


// Achievement System
// Tracks unlocked achievements, displays notifications, and manages modal display

let achievementsData = {
    achievements: {}
};

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

    // ============ SESSION-BASED ============
    lightning_fast: { id: 'lightning_fast', name: 'Lightning Fast', description: 'Earn $1M in a single session', emoji: '⚡', category: 'session', threshold: 1000000, type: 'session_earnings' },
    session_10m: { id: 'session_10m', name: 'Speed Racer', description: 'Earn $10M in a single session', emoji: '🏎️', category: 'session', threshold: 10000000, type: 'session_earnings' },
    session_100m: { id: 'session_100m', name: 'Speed Demon', description: 'Earn $100M in a single session', emoji: '🔥', category: 'session', threshold: 100000000, type: 'session_earnings' },
    session_1b: { id: 'session_1b', name: 'Blazing Fast', description: 'Earn $1B in a single session', emoji: '💫', category: 'session', threshold: 1000000000, type: 'session_earnings' },
    session_100b: { id: 'session_100b', name: 'Hyperfast', description: 'Earn $100B in a single session', emoji: '⚡', category: 'session', threshold: 100000000000, type: 'session_earnings' },
    session_1t: { id: 'session_1t', name: 'Ludicrous Speed', description: 'Earn $1T in a single session', emoji: '🚀', category: 'session', threshold: 1000000000000, type: 'session_earnings' }
});

// Initialize achievements on game load
function initAchievements() {
    Object.keys(achievementDefinitions).forEach(id => {
        if (!achievementsData.achievements[id]) {
            achievementsData.achievements[id] = {
                unlocked: false,
                unlockedAt: null,
                progress: 0
            };
        }
    });
}

// Check all achievement conditions and unlock if conditions are met
function checkAchievements() {
    Object.keys(achievementDefinitions).forEach(id => {
        const achievement = achievementDefinitions[id];
        const state = achievementsData.achievements[id];

        if (state.unlocked) return;

        let unlocked = false;

        // ========== EARNINGS MILESTONES ==========
        if (achievement.category === 'earnings' && achievement.threshold) {
            if (lifetimeEarnings >= achievement.threshold) {
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
        else if (id === 'five_rugpulls' && typeof ascensionLevel !== 'undefined' && ascensionLevel >= 5) {
            unlocked = true;
        }
        else if (id === 'ten_rugpulls' && typeof ascensionLevel !== 'undefined' && ascensionLevel >= 10) {
            unlocked = true;
        }

        // Unlock achievement if condition met
        if (unlocked && !state.unlocked) {
            state.unlocked = true;
            state.unlockedAt = Date.now();
            showAchievementNotification(id);
            saveGame();
        }
    });
}

// Display achievement unlock notification
function showAchievementNotification(achievementId) {
    const achievement = achievementDefinitions[achievementId];
    if (!achievement) return;

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

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 5000);
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
        session: '⚡ Session Challenges'
    };

    Object.keys(categories).forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'achievement-category';
        categoryDiv.innerHTML = `<h3>${categoryLabels[category] || category}</h3>`;

        categories[category].forEach(achievement => {
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

            categoryDiv.appendChild(achievementDiv);
        });

        container.appendChild(categoryDiv);
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

// Token calculation analysis for Rugpull 1-100

function calculateTokens(level) {
    let baseReward;
    if (level === 1) {
        baseReward = 7500;
    } else if (level === 2) {
        baseReward = 37500;
    } else if (level === 3) {
        baseReward = 150000;
    } else {
        // Level 4+: 87500 × 1.012^(level-4)
        baseReward = Math.floor(87500 * Math.pow(1.012, level - 4));
    }

    // Max bonus: assume 100x requirement (excessMultiplier = 99)
    const excessMultiplier = 99;  // 100x requirement
    const bonusMultiplier = Math.min(1.0, Math.log(1 + excessMultiplier) * 0.1);
    const bonusTokens = Math.floor(baseReward * bonusMultiplier);
    const totalReward = baseReward + bonusTokens;

    return {
        level,
        base: baseReward,
        bonusMultiplier: bonusMultiplier.toFixed(4),
        bonus: bonusTokens,
        total: totalReward
    };
}

// Calculate tier costs (1.5x multiplier scaling - 1.5x higher than before)
const tierCosts = {
    1: 7500,   // 9 upgrades
    2: 11250,  // 9 upgrades
    3: 16875,  // 9 upgrades
    4: 25312,  // 9 upgrades
    5: 37968, // 9 upgrades + 2 extras = 11
    6: 56953, // 10 upgrades
    7: 85429, // 10 upgrades
    8: 128144, // 10 upgrades
    9: 192216, // 10 upgrades
    10: 288324, // 10 upgrades
    11: 432486, // 10 upgrades
    12: 648729, // 10 upgrades
    13: 973094, // 10 upgrades
    14: 1459641, // 10 upgrades
    15: 2189461, // 10 upgrades
    16: 3284192, // 10 upgrades
    17: 4926288, // 10 upgrades
    18: 7389432, // 10 upgrades
    19: 11084148, // 10 upgrades
    20: 16626222  // 10 upgrades
};

const upgradesPerTier = {
    1: 9, 2: 9, 3: 9, 4: 9, 5: 11, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10,
    11: 10, 12: 10, 13: 10, 14: 10, 15: 10, 16: 10, 17: 10, 18: 10, 19: 10, 20: 10
};

// Calculate total cost per tier
let totalCostAllTiers = 0;
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    TIER COST BREAKDOWN (All Upgrades)                      ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');
console.log('║ Tier │ Cost/Upgrade │ # Upgrades │  Total Cost   │  Cumulative Total    ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');

for (let tier = 1; tier <= 20; tier++) {
    const costPerUpgrade = tierCosts[tier];
    const numUpgrades = upgradesPerTier[tier];
    const tierTotal = costPerUpgrade * numUpgrades;
    totalCostAllTiers += tierTotal;

    const tierStr = tier.toString().padStart(2);
    const costStr = costPerUpgrade.toString().padStart(12);
    const upgradesStr = numUpgrades.toString().padStart(10);
    const tierTotalStr = tierTotal.toString().padStart(13);
    const cumulativeStr = totalCostAllTiers.toString().padStart(18);

    console.log(`║  ${tierStr}  │${costStr}  │${upgradesStr}   │${tierTotalStr}  │${cumulativeStr}  ║`);
}

console.log('╠════════════════════════════════════════════════════════════════════════════╣');
console.log(`║ TOTAL COST FOR ALL UPGRADES (Tiers 1-20):${totalCostAllTiers.toString().padStart(37)}  ║`);
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

// Display header for token rewards - show selected rugpulls
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║              RUGPULL TOKEN REWARDS (Base + Max Bonus at 100x)              ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');
console.log('║ Rugpull │    Base    │ Bonus %  │    Bonus    │    Total    │ Cumulative ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');

// Show all rugpulls 1-100, but only display selected ones
let cumulativeTokens = 0;

for (let level = 1; level <= 100; level++) {
    const data = calculateTokens(level);
    cumulativeTokens += data.total;

    // Display every rugpull for 1-20, then every 5th
    if (level <= 20 || level % 5 === 0) {
        const bonusPercent = (data.bonusMultiplier * 100).toFixed(2);
        const levelPadded = level.toString().padStart(3);
        const basePadded = data.base.toString().padStart(10);
        const bonusPadded = data.bonus.toString().padStart(11);
        const totalPadded = data.total.toString().padStart(11);
        const cumulativePadded = cumulativeTokens.toString().padStart(10);

        console.log(`║   ${levelPadded}   │${basePadded}  │ ${bonusPercent.padStart(5)}% │${bonusPadded}  │${totalPadded}  │${cumulativePadded}  ║`);
    }
}

console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

// Summary
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                         SUMMARY & KEY METRICS                              ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');
console.log(`║ Total Cost (All Upgrades Tiers 1-20): ${totalCostAllTiers.toString().padStart(40)} ║`);
console.log(`║ Cumulative Tokens by Rugpull 100:     ${cumulativeTokens.toString().padStart(40)} ║`);
console.log(`║ Tokens Needed vs Earned:              ${(cumulativeTokens - totalCostAllTiers).toString().padStart(40)} ║`);
console.log('╠════════════════════════════════════════════════════════════════════════════╣');

// Calculate at key milestones
let cumulative = 0;
for (let i = 1; i <= 100; i++) {
    const data = calculateTokens(i);
    cumulative += data.total;

    if (i === 50 || i === 75 || i === 100) {
        console.log(`║ Cumulative Tokens at Rugpull ${i}: ${cumulative.toString().padStart(45)} ║`);
    }
}

console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

// Affordability analysis
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    AFFORDABILITY BY RUGPULL & TIER                        ║');
console.log('╠════════════════════════════════════════════════════════════════════════════╣');

cumulative = 0;
let currentTier = 1;
let tiersCumulative = 0;

for (let i = 1; i <= 100; i++) {
    const data = calculateTokens(i);
    cumulative += data.total;

    // Check at key milestones
    if (i === 50 || i === 75 || i === 100) {
        let affordable = 0;
        let tempCumulative = 0;

        for (let tier = 1; tier <= 20; tier++) {
            const tierCost = tierCosts[tier] * upgradesPerTier[tier];
            if (tempCumulative + tierCost <= cumulative) {
                tempCumulative += tierCost;
                affordable = tier;
            } else {
                break;
            }
        }

        console.log(`║ Rugpull ${i}: ${cumulative.toString().padEnd(10)} tokens → Can afford Tiers 1-${affordable} fully ║`);
    }
}

console.log('╚════════════════════════════════════════════════════════════════════════════╝');

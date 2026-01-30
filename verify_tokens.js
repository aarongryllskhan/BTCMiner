// Verify new token scaling
function calculateTokenReward(level) {
    let baseReward;
    if (level === 1) {
        baseReward = 7500;
    } else if (level === 2) {
        baseReward = 37500;
    } else {
        // Level 3+: 60000 × 1.025^(level-3)
        baseReward = Math.floor(60000 * Math.pow(1.025, level - 3));
    }
    return baseReward;
}

console.log('=== NEW TOKEN PROGRESSION (CUMULATIVE SUM) ===\n');
console.log('Rugpull | Base Reward | Cumulative Total | Can Afford');
console.log('--------|-------------|------------------|---------------------');

let cumulative = 0;
const tierCosts = {
    1: 7500, 2: 11250, 3: 16875, 4: 25312, 5: 37968,
    6: 56953, 7: 85429, 8: 128144, 9: 192216, 10: 288324,
    11: 432486, 12: 648729, 13: 973094, 14: 1459641, 15: 2189461,
    16: 3284192, 17: 4926288, 18: 7389432, 19: 11084148, 20: 16626222
};

const keyMilestones = [1, 2, 3, 4, 5, 10, 20, 30, 50, 75, 100];

for (const r of keyMilestones) {
    // Sum all rewards from R1 to R(r)
    cumulative = 0;
    for (let i = 1; i <= r; i++) {
        cumulative += calculateTokenReward(i);
    }

    // Find max tier we can fully afford by buying one of each
    let maxTierAffordable = 0;
    let totalCost = 0;
    for (let t = 1; t <= 20; t++) {
        if (totalCost + tierCosts[t] <= cumulative) {
            totalCost += tierCosts[t];
            maxTierAffordable = t;
        } else {
            break;
        }
    }

    const rewardStr = calculateTokenReward(r).toString().padStart(11);
    const cumStr = cumulative.toString().padStart(16);
    const tierStr = `Tier ${maxTierAffordable}`.padStart(19);

    console.log(`R${r.toString().padStart(3)} | ${rewardStr} | ${cumStr} | ${tierStr}`);
}

console.log('\n=== BREAKDOWN BY RUGPULL ===');
for (let r = 1; r <= 5; r++) {
    const reward = calculateTokenReward(r);
    console.log(`R${r}: ${reward.toLocaleString()} tokens`);
}
console.log('...');
for (let r = 98; r <= 100; r++) {
    const reward = calculateTokenReward(r);
    console.log(`R${r}: ${reward.toLocaleString()} tokens`);
}

// Calculate total
let total = 0;
for (let i = 1; i <= 100; i++) {
    total += calculateTokenReward(i);
}
console.log(`\nTotal R1-R100: ${total.toLocaleString()} tokens`);
console.log(`Target: ~23,500,000 tokens`);

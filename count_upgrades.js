const fs = require('fs');
const content = fs.readFileSync('rugpull.js', 'utf8');

// Extract just the metaUpgrades object (lines 38-268)
const start = content.indexOf('let metaUpgrades = {');
const end = content.indexOf('\n};', start) + 3;
const metaUpgradesStr = content.substring(start, end);

// Count upgrades by tier
const tierUpgrades = {};
const tierCosts = {
  1: 7500, 2: 11250, 3: 16875, 4: 25312, 5: 37968,
  6: 56953, 7: 85429, 8: 128144, 9: 192216, 10: 288324,
  11: 432486, 12: 648729, 13: 973094, 14: 1459641, 15: 2189461,
  16: 3284192, 17: 4926288, 18: 7389432, 19: 11084148, 20: 16626222
};

const expectedCounts = {
  1: 9, 2: 9, 3: 10, 4: 9, 5: 11, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10,
  11: 10, 12: 10, 13: 10, 14: 10, 15: 10, 16: 10, 17: 10, 18: 10, 19: 10, 20: 10
};

// Parse upgrades - count all with cost entries
const allUpgrades = [];
const regex = /(\w+):\s*\{\s*purchased:\s*false,\s*cost:\s*(\d+)\s*\}/g;
let match;
while ((match = regex.exec(metaUpgradesStr)) !== null) {
  const [, name, cost] = match;
  allUpgrades.push({ name, cost: parseInt(cost) });
}

// Classify upgrades by tier
for (const { name, cost } of allUpgrades) {
  // Try to find tier from name
  let tier = null;

  // Pattern: xxx_N where N is 1-20
  const tierMatch = name.match(/_([1-9]|1[0-9]|20)$/);
  if (tierMatch) {
    tier = parseInt(tierMatch[1]);
  }

  // Special cases for non-numbered upgrades that belong to specific tiers
  const tierMap = {
    'token_generation_0': 1, 'auto_sell': 3, 'starter_miners_t4': 5,
    'starter_miners_t5': 6, 'minigame_unlock': 7, 'cash_multiplier': 8,
    'token_generation_t6': 6, 'token_generation_t7': 7
  };

  if (!tier && tierMap[name]) {
    tier = tierMap[name];
  }

  if (tier && tier >= 1 && tier <= 20) {
    if (!tierUpgrades[tier]) {
      tierUpgrades[tier] = { count: 0, wrongCosts: 0, items: [] };
    }
    tierUpgrades[tier].count++;
    tierUpgrades[tier].items.push(name);
    if (cost !== tierCosts[tier]) {
      tierUpgrades[tier].wrongCosts++;
    }
  }
}

console.log('\n=== TIER UPGRADE AUDIT ===\n');
let totalErrors = 0;
for (let t = 1; t <= 20; t++) {
  const tier = tierUpgrades[t];
  const expected = expectedCounts[t];
  const actual = tier ? tier.count : 0;
  const wrongCosts = tier ? tier.wrongCosts : 0;

  let status = 'OK';
  if (actual !== expected) {
    status = `COUNT_MISMATCH (${actual} of ${expected})`;
    totalErrors++;
  } else if (wrongCosts > 0) {
    status = `COST_ERROR (${wrongCosts} wrong)`;
    totalErrors++;
  }

  const tierStr = String(t).padStart(2);
  const countStr = String(actual).padStart(2);
  const costStr = String(tierCosts[t]).padStart(7);
  const statusStr = status === 'OK' ? '[OK]' : '[ERROR]';
  console.log(`${statusStr} Tier ${tierStr}: ${countStr}/${expected} upgrades (cost: ${costStr}) - ${status}`);

  if (tier && tier.wrongCosts > 0) {
    for (const item of tier.items) {
      const cost = allUpgrades.find(u => u.name === item).cost;
      if (cost !== tierCosts[t]) {
        console.log(`     ${item}: ${cost} (expected ${tierCosts[t]})`);
      }
    }
  }
}

console.log(`\n${totalErrors === 0 ? '✅ ALL TIERS VERIFIED!' : '❌ FOUND ' + totalErrors + ' TIER(S) WITH ERRORS'}`);

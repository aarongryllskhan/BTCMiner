// Cookie Clicker scaling factors (tier 2 to tier 16)
const ccScaling = [10, 8, 6, 5.5, 5.4, 5.6, 5.6, 5.9, 6.1, 6.25, 6.25, 6.25, 6.25, 6.25, 6.25];

// CORRECT prices from game.js
const BTC_PRICE = 100000;
const ETH_PRICE = 3500;   // NOT 2500!
const DOGE_PRICE = 0.25;  // NOT 0.10!

// Target USD/sec for tier 1
const TARGET_USD_SEC = 2.5;

// Calculate BTC yields
console.log('=== BTC MINERS (CORRECTED PRICES) ===');
let btcUsd = TARGET_USD_SEC;
let btcYield = btcUsd / BTC_PRICE;
console.log(`Tier 1: ${btcYield.toFixed(8)} (${btcUsd.toFixed(2)}/sec USD)`);

const btcYields = [btcYield];
for (let i = 0; i < ccScaling.length; i++) {
    const tier = i + 2;
    btcUsd = btcUsd * ccScaling[i];
    btcYield = btcUsd / BTC_PRICE;
    btcYields.push(btcYield);
    console.log(`Tier ${tier}: ${btcYield.toFixed(8)} (${btcUsd.toFixed(2)}/sec USD)`);
}

// Calculate ETH yields
console.log('\n=== ETH MINERS (CORRECTED PRICES) ===');
let ethUsd = TARGET_USD_SEC;
let ethYield = ethUsd / ETH_PRICE;
console.log(`Tier 1: ${ethYield.toFixed(8)} (${ethUsd.toFixed(2)}/sec USD)`);

const ethYields = [ethYield];
for (let i = 0; i < ccScaling.length; i++) {
    const tier = i + 2;
    ethUsd = ethUsd * ccScaling[i];
    ethYield = ethUsd / ETH_PRICE;
    ethYields.push(ethYield);
    console.log(`Tier ${tier}: ${ethYield.toFixed(8)} (${ethUsd.toFixed(2)}/sec USD)`);
}

// Calculate DOGE yields
console.log('\n=== DOGE MINERS (CORRECTED PRICES) ===');
let dogeUsd = TARGET_USD_SEC;
let dogeYield = dogeUsd / DOGE_PRICE;
console.log(`Tier 1: ${dogeYield.toFixed(2)} (${dogeUsd.toFixed(2)}/sec USD)`);

const dogeYields = [dogeYield];
for (let i = 0; i < ccScaling.length; i++) {
    const tier = i + 2;
    dogeUsd = dogeUsd * ccScaling[i];
    dogeYield = dogeUsd / DOGE_PRICE;
    dogeYields.push(dogeYield);
    console.log(`Tier ${tier}: ${dogeYield.toFixed(2)} (${dogeUsd.toFixed(2)}/sec USD)`);
}

// Verify balance at tier 1
console.log('\n=== VERIFICATION: TIER 1 BALANCE ===');
const btc1Usd = btcYields[0] * BTC_PRICE;
const eth1Usd = ethYields[0] * ETH_PRICE;
const doge1Usd = dogeYields[0] * DOGE_PRICE;
console.log(`BTC: ${btcYields[0].toFixed(8)} ₿/s × $${BTC_PRICE} = $${btc1Usd.toFixed(2)}/sec`);
console.log(`ETH: ${ethYields[0].toFixed(8)} Ξ/s × $${ETH_PRICE} = $${eth1Usd.toFixed(2)}/sec`);
console.log(`DOGE: ${dogeYields[0].toFixed(2)} Ð/s × $${DOGE_PRICE} = $${doge1Usd.toFixed(2)}/sec`);

// Output arrays for copy-paste
console.log('\n=== ARRAYS FOR GAME.JS ===');
console.log('\nBTC Yields (copy to line 802):');
console.log(btcYields.map(y => y.toFixed(8)).join(', '));

console.log('\nETH Yields (copy to line 829):');
console.log(ethYields.map(y => y.toFixed(8)).join(', '));

console.log('\nDOGE Yields (copy to line 857):');
console.log(dogeYields.map(y => y.toFixed(2)).join(', '));

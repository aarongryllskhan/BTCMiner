const btcYield = 3836150.90332031;
const ethYield = 153446036.13281244;
const dogeYield = 3836150903320;

const btcPrice = 100000;
const ethPrice = 2500;
const dogePrice = 0.10;

const btcUsd = btcYield * btcPrice;
const ethUsd = ethYield * ethPrice;
const dogeUsd = dogeYield * dogePrice;

console.log('Tier 16 USD/sec Values:');
console.log(`BTC: ${btcYield.toFixed(8)} ₿/s × $${btcPrice} = $${btcUsd.toLocaleString('en-US', {maximumFractionDigits: 2})}/sec`);
console.log(`ETH: ${ethYield.toFixed(8)} Ξ/s × $${ethPrice} = $${ethUsd.toLocaleString('en-US', {maximumFractionDigits: 2})}/sec`);
console.log(`DOGE: ${dogeYield.toLocaleString()} Ð/s × $${dogePrice} = $${dogeUsd.toLocaleString('en-US', {maximumFractionDigits: 2})}/sec`);

console.log('\n✓ All tier 16 miners produce approximately the SAME USD/sec value');
console.log(`($${(btcUsd).toExponential(2)}/sec)`);
console.log('\nThis is perfect balance - each crypto tier 16 yields identical USD value!');

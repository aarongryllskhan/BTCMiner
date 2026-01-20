// Staking System for BTC Miner
// Allows users to lock crypto to earn 0.1% APR every 2 seconds converted to cash

// Staking state
let stakedBTC = 0;
let stakedETH = 0;
let stakedDOGE = 0;

// APR rate: 0.1% per 2 seconds
const APR_RATE = 0.001; // 0.1% as decimal
const APR_INTERVAL = 2000; // 2 seconds in milliseconds

// Staking interval reference
let stakingInterval = null;

/**
 * Initialize staking system - call this on game load
 */
function initStaking() {
    // Start the staking earnings interval
    if (stakingInterval) {
        clearInterval(stakingInterval);
    }

    stakingInterval = setInterval(processStakingEarnings, APR_INTERVAL);
}

/**
 * Process staking earnings every 2 seconds
 */
function processStakingEarnings() {
    let totalEarnings = 0;

    // Calculate BTC staking earnings
    if (stakedBTC > 0) {
        const btcEarnings = stakedBTC * APR_RATE;
        const btcCashValue = btcEarnings * btcPrice;
        totalEarnings += btcCashValue;
    }

    // Calculate ETH staking earnings
    if (stakedETH > 0) {
        const ethEarnings = stakedETH * APR_RATE;
        const ethCashValue = ethEarnings * ethPrice;
        totalEarnings += ethCashValue;
    }

    // Calculate DOGE staking earnings
    if (stakedDOGE > 0) {
        const dogeEarnings = stakedDOGE * APR_RATE;
        const dogeCashValue = dogeEarnings * dogePrice;
        totalEarnings += dogeCashValue;
    }

    // Add earnings to dollar balance
    if (totalEarnings > 0) {
        dollarBalance += totalEarnings;
        lifetimeEarnings += totalEarnings; // Track staking rewards in lifetime earnings
        sessionEarnings += totalEarnings; // Track staking rewards in session earnings
        updateUI();
    }
}

/**
 * Stake a percentage of crypto
 * @param {string} crypto - 'BTC', 'ETH', or 'DOGE'
 * @param {number} percentage - Percentage to stake (1-100)
 */
function stakeCrypto(crypto, percentage) {
    if (percentage <= 0 || percentage > 100) {
        alert('Invalid percentage! Must be between 1-100%');
        return;
    }

    const fraction = percentage / 100;

    switch(crypto) {
        case 'BTC':
            if (btcBalance <= 0) {
                alert('No Bitcoin available to stake!');
                return;
            }
            const btcToStake = btcBalance * fraction;
            btcBalance -= btcToStake;
            stakedBTC += btcToStake;
            break;

        case 'ETH':
            if (ethBalance <= 0) {
                alert('No Ethereum available to stake!');
                return;
            }
            const ethToStake = ethBalance * fraction;
            ethBalance -= ethToStake;
            stakedETH += ethToStake;
            break;

        case 'DOGE':
            if (dogeBalance <= 0) {
                alert('No Dogecoin available to stake!');
                return;
            }
            const dogeToStake = dogeBalance * fraction;
            dogeBalance -= dogeToStake;
            stakedDOGE += dogeToStake;
            break;

        default:
            alert('Invalid cryptocurrency!');
            return;
    }

    updateUI();
    updateStakingUI();
    saveGame();
    playUpgradeSound();
}

/**
 * Unstake a percentage of staked crypto
 * @param {string} crypto - 'BTC', 'ETH', or 'DOGE'
 * @param {number} percentage - Percentage to unstake (1-100)
 */
function unstakeCrypto(crypto, percentage) {
    if (percentage <= 0 || percentage > 100) {
        alert('Invalid percentage! Must be between 1-100%');
        return;
    }

    const fraction = percentage / 100;

    switch(crypto) {
        case 'BTC':
            if (stakedBTC <= 0) {
                alert('No staked Bitcoin to unstake!');
                return;
            }
            const btcToUnstake = stakedBTC * fraction;
            stakedBTC -= btcToUnstake;
            btcBalance += btcToUnstake;
            break;

        case 'ETH':
            if (stakedETH <= 0) {
                alert('No staked Ethereum to unstake!');
                return;
            }
            const ethToUnstake = stakedETH * fraction;
            stakedETH -= ethToUnstake;
            ethBalance += ethToUnstake;
            break;

        case 'DOGE':
            if (stakedDOGE <= 0) {
                alert('No staked Dogecoin to unstake!');
                return;
            }
            const dogeToUnstake = stakedDOGE * fraction;
            stakedDOGE -= dogeToUnstake;
            dogeBalance += dogeToUnstake;
            break;

        default:
            alert('Invalid cryptocurrency!');
            return;
    }

    updateUI();
    updateStakingUI();
    saveGame();
    playUpgradeSound();
}

/**
 * Update staking UI display
 */
function updateStakingUI() {
    // Update BTC staking display
    const btcStakedEl = document.getElementById('btc-staked-amount');
    const btcAprEl = document.getElementById('btc-apr-display');
    if (btcStakedEl) {
        btcStakedEl.textContent = stakedBTC.toFixed(8);
    }
    if (btcAprEl && stakedBTC > 0) {
        const btcEarningsPerInterval = stakedBTC * APR_RATE * btcPrice;
        const btcEarningsPerHour = btcEarningsPerInterval * (3600 / 2); // 1800 intervals per hour
        btcAprEl.textContent = `$${btcEarningsPerHour.toFixed(2)}/hr`;
    } else if (btcAprEl) {
        btcAprEl.textContent = '$0.00/hr';
    }

    // Update ETH staking display
    const ethStakedEl = document.getElementById('eth-staked-amount');
    const ethAprEl = document.getElementById('eth-apr-display');
    if (ethStakedEl) {
        ethStakedEl.textContent = stakedETH.toFixed(8);
    }
    if (ethAprEl && stakedETH > 0) {
        const ethEarningsPerInterval = stakedETH * APR_RATE * ethPrice;
        const ethEarningsPerHour = ethEarningsPerInterval * (3600 / 2);
        ethAprEl.textContent = `$${ethEarningsPerHour.toFixed(2)}/hr`;
    } else if (ethAprEl) {
        ethAprEl.textContent = '$0.00/hr';
    }

    // Update DOGE staking display
    const dogeStakedEl = document.getElementById('doge-staked-amount');
    const dogeAprEl = document.getElementById('doge-apr-display');
    if (dogeStakedEl) {
        dogeStakedEl.textContent = stakedDOGE.toFixed(2);
    }
    if (dogeAprEl && stakedDOGE > 0) {
        const dogeEarningsPerInterval = stakedDOGE * APR_RATE * dogePrice;
        const dogeEarningsPerHour = dogeEarningsPerInterval * (3600 / 2);
        dogeAprEl.textContent = `$${dogeEarningsPerHour.toFixed(2)}/hr`;
    } else if (dogeAprEl) {
        dogeAprEl.textContent = '$0.00/hr';
    }
}

/**
 * Quick stake buttons - stake preset percentages
 */
function quickStake(crypto, percentage) {
    stakeCrypto(crypto, percentage);
}

/**
 * Quick unstake buttons - unstake preset percentages
 */
function quickUnstake(crypto, percentage) {
    unstakeCrypto(crypto, percentage);
}

/**
 * Get staking data for save/load
 */
function getStakingData() {
    return {
        stakedBTC,
        stakedETH,
        stakedDOGE
    };
}

/**
 * Load staking data from save
 */
function loadStakingData(data) {
    if (data) {
        stakedBTC = data.stakedBTC || 0;
        stakedETH = data.stakedETH || 0;
        stakedDOGE = data.stakedDOGE || 0;
    }
}

/**
 * Calculate total staked value in USD
 */
function getTotalStakedValue() {
    return (stakedBTC * btcPrice) + (stakedETH * ethPrice) + (stakedDOGE * dogePrice);
}

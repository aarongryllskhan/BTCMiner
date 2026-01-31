// Staking System for BTC Miner
// Allows users to lock crypto to earn 0.01% APR every 2 seconds converted to cash

// Staking state
let stakedBTC = 0;
let stakedETH = 0;
let stakedDOGE = 0;

// APR rate: 0.01% per 2 seconds
const APR_RATE = 0.0001; // 0.01% as decimal
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
    updateStakingAPRDisplay();
}

/**
 * Calculate total staking APR bonus including rugpull upgrades
 */
function getStakingAPRBonus() {
    let stakingAPRBonus = 0;

    // Get rugpull staking APR bonuses if metaUpgrades exist
    if (typeof metaUpgrades !== 'undefined') {
        Object.entries(metaUpgrades).forEach(([key, upgrade]) => {
            if (upgrade.purchased && key.includes('staking_apy')) {
                const tierMatch = key.match(/\d+$/);
                if (tierMatch) {
                    const tier = parseInt(tierMatch[0]);
                    // 0.005% base per tier with 1.15x scaling
                    stakingAPRBonus += 0.005 * Math.pow(1.15, tier - 1);
                }
            }
        });
    }

    return stakingAPRBonus;
}

/**
 * Update the staking APR display with actual bonus value
 */
function updateStakingAPRDisplay() {
    const baseAPR = 0.01; // 0.01% base
    const bonusAPR = getStakingAPRBonus();
    const totalAPR = baseAPR + bonusAPR;

    const aprElement = document.getElementById('staking-apr-rate');
    if (aprElement) {
        aprElement.textContent = totalAPR.toFixed(2) + '%';
    }
}

/**
 * Process staking earnings every 2 seconds
 */
function processStakingEarnings() {
    let totalEarnings = 0;
    let btcEarned = 0;
    let ethEarned = 0;
    let dogeEarned = 0;

    // Get skill tree staking bonus
    const stakingBonus = (typeof getStakingBonus === 'function') ? getStakingBonus() : 1;

    // Get rugpull staking APR bonus (as decimal, e.g., 0.05 = 0.05%)
    const rugpullAPRBonus = getStakingAPRBonus();

    // Calculate effective APR rate: base 0.1% + rugpull bonus
    const effectiveAPRRate = APR_RATE + (rugpullAPRBonus / 100);

    // Calculate BTC staking earnings
    if (stakedBTC > 0) {
        const btcEarnings = stakedBTC * effectiveAPRRate * stakingBonus;
        btcEarned = btcEarnings;
        const btcCashValue = btcEarnings * btcPrice;
        totalEarnings += btcCashValue;
    }

    // Calculate ETH staking earnings
    if (stakedETH > 0) {
        const ethEarnings = stakedETH * effectiveAPRRate * stakingBonus;
        ethEarned = ethEarnings;
        const ethCashValue = ethEarnings * ethPrice;
        totalEarnings += ethCashValue;
    }

    // Calculate DOGE staking earnings
    if (stakedDOGE > 0) {
        const dogeEarnings = stakedDOGE * effectiveAPRRate * stakingBonus;
        dogeEarned = dogeEarnings;
        const dogeCashValue = dogeEarnings * dogePrice;
        totalEarnings += dogeCashValue;
    }

    // Add earnings to dollar balance and lifetime totals
    if (totalEarnings > 0) {
        dollarBalance += totalEarnings;
        lifetimeEarnings += totalEarnings; // Track staking rewards in lifetime earnings
        sessionEarnings += totalEarnings; // Track staking rewards in session earnings

        // Add to lifetime crypto totals for skill tree milestones
        if (btcEarned > 0) {
            btcLifetime += btcEarned;
        }
        if (ethEarned > 0) {
            ethLifetime += ethEarned;
        }
        if (dogeEarned > 0) {
            dogeLifetime += dogeEarned;
        }
    }

    // Add online corrupt token generation (from token_generation upgrades)
    if (typeof getTokenGenerationRate === 'function') {
        const tokenGenerationRate = getTokenGenerationRate();
        // APR_INTERVAL is 2 seconds, so divide rate by 2 to get per-2-second earnings
        const onlineTokens = tokenGenerationRate / 2;
        if (onlineTokens > 0 && typeof rugpullCurrency !== 'undefined') {
            if (typeof window !== 'undefined' && window.rugpullCurrency !== undefined) {
                window.rugpullCurrency += onlineTokens;
            }
        }

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

    // Mark first stake for achievements
    const isFirstStake = stakedBTC === 0 && stakedETH === 0 && stakedDOGE === 0;

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

    // Achievement: First stake
    if (isFirstStake && typeof markFirstStake === 'function') {
        markFirstStake();
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
    // Get staking bonuses from purchased upgrades
    let aprRate = APR_RATE;
    let earningsBoostMultiplier = 1;

    if (typeof getSkillBonus === 'function') {
        const stakingAPRBonus = getSkillBonus('staking_apy') || 0;
        const earningsBoost = getSkillBonus('earnings_boost') || 0;
        aprRate = APR_RATE * (1 + stakingAPRBonus / 100);
        earningsBoostMultiplier = 1 + earningsBoost / 100;
    }

    // Update BTC staking display
    const btcStakedEl = document.getElementById('btc-staked-amount');
    const btcAprEl = document.getElementById('btc-apr-display');
    if (btcStakedEl) {
        btcStakedEl.textContent = (typeof formatCryptoYield === 'function') ? formatCryptoYield(stakedBTC) : stakedBTC.toFixed(8);
    }
    if (btcAprEl && stakedBTC > 0) {
        const btcEarningsPerInterval = stakedBTC * aprRate * btcPrice * earningsBoostMultiplier;
        const btcEarningsPerHour = btcEarningsPerInterval * (3600 / 2); // 1800 intervals per hour
        btcAprEl.textContent = `$${(typeof formatNumberForDisplay === 'function') ? formatNumberForDisplay(btcEarningsPerHour) : btcEarningsPerHour.toFixed(2)}/hr`;
    } else if (btcAprEl) {
        btcAprEl.textContent = '$0.00/hr';
    }

    // Update ETH staking display
    const ethStakedEl = document.getElementById('eth-staked-amount');
    const ethAprEl = document.getElementById('eth-apr-display');
    if (ethStakedEl) {
        ethStakedEl.textContent = (typeof formatCryptoYield === 'function') ? formatCryptoYield(stakedETH) : stakedETH.toFixed(8);
    }
    if (ethAprEl && stakedETH > 0) {
        const ethEarningsPerInterval = stakedETH * aprRate * ethPrice * earningsBoostMultiplier;
        const ethEarningsPerHour = ethEarningsPerInterval * (3600 / 2);
        ethAprEl.textContent = `$${(typeof formatNumberForDisplay === 'function') ? formatNumberForDisplay(ethEarningsPerHour) : ethEarningsPerHour.toFixed(2)}/hr`;
    } else if (ethAprEl) {
        ethAprEl.textContent = '$0.00/hr';
    }

    // Update DOGE staking display
    const dogeStakedEl = document.getElementById('doge-staked-amount');
    const dogeAprEl = document.getElementById('doge-apr-display');
    if (dogeStakedEl) {
        dogeStakedEl.textContent = (typeof formatCryptoYield === 'function') ? formatCryptoYield(stakedDOGE) : stakedDOGE.toFixed(2);
    }
    if (dogeAprEl && stakedDOGE > 0) {
        const dogeEarningsPerInterval = stakedDOGE * aprRate * dogePrice * earningsBoostMultiplier;
        const dogeEarningsPerHour = dogeEarningsPerInterval * (3600 / 2);
        dogeAprEl.textContent = `$${(typeof formatNumberForDisplay === 'function') ? formatNumberForDisplay(dogeEarningsPerHour) : dogeEarningsPerHour.toFixed(2)}/hr`;
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
 * Stake all available BTC
 */
function stakeAllBTC(button) {
    if (btcBalance > 0) {
        stakeCrypto('BTC', 100);
        if (button && typeof button.classList !== 'undefined') {
            button.classList.add('sell-success');
            setTimeout(() => button.classList.remove('sell-success'), 250);
        }
    }
}

/**
 * Stake all available ETH
 */
function stakeAllETH(button) {
    if (ethBalance > 0) {
        stakeCrypto('ETH', 100);
        if (button && typeof button.classList !== 'undefined') {
            button.classList.add('sell-success');
            setTimeout(() => button.classList.remove('sell-success'), 250);
        }
    }
}

/**
 * Stake all available DOGE
 */
function stakeAllDOGE(button) {
    if (dogeBalance > 0) {
        stakeCrypto('DOGE', 100);
        if (button && typeof button.classList !== 'undefined') {
            button.classList.add('sell-success');
            setTimeout(() => button.classList.remove('sell-success'), 250);
        }
    }
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

// Export updateStakingUI to window so game.js can call it
window.updateStakingUI = updateStakingUI;

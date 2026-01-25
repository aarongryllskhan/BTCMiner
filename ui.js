/**
 * UI.JS - User Interface Rendering and Display Functions
 *
 * DEPENDENCIES:
 * This file requires the following scripts to be loaded first:
 * 1. data.js - Contains all upgrade definitions (btcUpgrades, ethUpgrades, dogeUpgrades, powerUpgrades, equipmentPowerReqs)
 * 2. game-logic.js - Contains core game logic functions and state variables
 *
 * REQUIRED VARIABLES FROM OTHER FILES:
 * - btcUpgrades, ethUpgrades, dogeUpgrades, powerUpgrades (from data.js)
 * - equipmentPowerReqs (from data.js)
 * - btcBalance, ethBalance, dogeBalance, dollarBalance (from game.js)
 * - btcPrice, ethPrice, dogePrice (from game.js)
 * - btcPerSec, ethPerSec, dogePerSec (from game.js)
 * - btcClickValue, ethClickValue, dogeClickValue (from game.js)
 * - hardwareEquity, totalPowerUsed (from game.js)
 * - sessionEarnings, lifetimeEarnings, sessionStartTime (from game.js)
 * - buyQuantity (from game.js)
 *
 * REQUIRED FUNCTIONS FROM OTHER FILES:
 * - getEffectivePowerRequirement() (from game-logic.js)
 * - getTotalPowerAvailableWithBonus() (from game-logic.js)
 * - getSkillBonus() (from skilltree.js - optional)
 * - calculateTotalPowerUsed() (from game-logic.js)
 * - buyLevelMultiple(), buyBoost(), buyEthLevel(), buyEthBoost(), buyDogeLevel(), buyDogeBoost() (from game-logic.js)
 * - buyPowerUpgrade() (from game-logic.js)
 * - setBuyQuantity() (from game-logic.js)
 * - updateStakingUI() (from staking.js - optional)
 */

// ============================================================================
// SHOP INITIALIZATION FUNCTIONS
// ============================================================================

function initBtcShop() {
    const container = document.getElementById('btc-shop');
    container.innerHTML = '';

    btcUpgrades.forEach((u, i) => {
        const btn = document.createElement('button');
        btn.className = 'u-item';
        btn.id = `up-${u.id}`;
    // All upgrades use the same purchase function
    btn.onclick = () => buyLevelMultiple(i, buyQuantity);

    const powerReq = equipmentPowerReqs[u.id] || 0;
    const effectivePower = getEffectivePowerRequirement(powerReq);
    const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:var(--btc);font-weight:700;display:block;margin-top:3px" id="power-${u.id}">${effectivePower.toLocaleString()}W Consumed per level</span>` : '';

    btn.innerHTML = `
        <div style="text-align:left;flex:1">
            <div style="font-size:0.9rem;color:#f7931a;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
            <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="yield-${u.id}">+0 ₿/s - Current Speed</div>
            <div style="font-size:0.9rem;color:#f7931a;font-weight:700;display:block;margin-top:3px" id="increase-${u.id}">+0 ₿/s per level</div>
            ${powerDisplay}
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
            <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="usd-${u.id}">$${u.baseUsd.toLocaleString()}</span>
            <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="afford-${u.id}">x0</span>
        </div>`;
    container.appendChild(btn);

    // Add boost button only for non-manual upgrades
    if (!u.isClickUpgrade) {
        const boostBtn = document.createElement('button');
        boostBtn.id = `boost-${u.id}`;
        boostBtn.style.background = '#ff9500';
        boostBtn.style.border = 'none';
        boostBtn.style.borderRadius = '6px';
        boostBtn.style.padding = '6px 10px';
        boostBtn.style.fontSize = '0.7rem';
        boostBtn.style.fontWeight = '700';
        boostBtn.style.color = '#000';
        boostBtn.style.cursor = 'pointer';
        boostBtn.style.marginTop = '2px';
        boostBtn.style.width = '100%';
        boostBtn.style.transition = '0.1s';
        boostBtn.onclick = () => buyBoost(i);
        boostBtn.innerHTML = `+10% HASH RATE | <span id="boost-cost-${u.id}">$0</span>`;
        boostBtn.disabled = u.level === 0;
        boostBtn.setAttribute('data-upgrade-name', u.name);
        container.appendChild(boostBtn);
    }
    });
}

function initPowerShop() {
    const container = document.getElementById('power-shop');
    container.innerHTML = '';

    powerUpgrades.forEach((u, i) => {
        const btn = document.createElement('button');
        btn.className = 'u-item';
        btn.id = `pow-${u.id}`;
        btn.onclick = () => buyPowerUpgrade(i);

        const costBtc = u.currentUsd / btcPrice;
        btn.innerHTML = `
            <div style="text-align:left;flex:1">
                <div style="font-size:0.9rem;color:#00ff88;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="pow-lvl-txt-${u.id}">[Lvl ${u.level}]</span> ${u.name}</div>
                <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="pow-current-${u.id}">+0W - Current Power</div>
                <div style="font-size:1.1rem;color:#00ff88;font-family:monospace;font-weight:700;display:block" id="pow-power-${u.id}">+0W Produced per level</div>
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="pow-usd-${u.id}">$${u.currentUsd.toLocaleString()}</span>
                <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="pow-afford-${u.id}">x0</span>
            </div>`;
        container.appendChild(btn);
    });
}

function initEthShop() {
    const container = document.getElementById('eth-shop');
    container.innerHTML = '';

    ethUpgrades.forEach((u, i) => {
        const btn = document.createElement('button');
        btn.className = 'u-item';
        btn.id = `eth-up-${u.id}`;
        if (u.isClickUpgrade) {
            btn.classList.add('click-upgrade');
        }

        btn.onclick = () => buyEthLevel(i, buyQuantity);

        const powerReq = equipmentPowerReqs[u.id] || 0;
        const effectivePower = getEffectivePowerRequirement(powerReq);
        const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-power-${u.id}">${effectivePower.toLocaleString()}W Consumed per level</span>` : '';

        btn.innerHTML = `
            <div style="text-align:left;flex:1">
                <div style="font-size:0.9rem;color:#627eea;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="eth-lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="eth-yield-${u.id}">+0 Ξ/s - Current Speed</div>
                <div style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-increase-${u.id}">+0 Ξ/s per level</div>
                ${powerDisplay}
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="eth-usd-${u.id}">$${u.baseUsd.toLocaleString()}</span>
                <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="eth-afford-${u.id}">x0</span>
            </div>`;
        container.appendChild(btn);

        // Add boost button only for non-manual upgrades
        if (!u.isClickUpgrade) {
            const boostBtn = document.createElement('button');
            boostBtn.id = `eth-boost-${u.id}`;
            boostBtn.style.background = '#ff9500';
            boostBtn.style.border = 'none';
            boostBtn.style.borderRadius = '6px';
            boostBtn.style.padding = '6px 10px';
            boostBtn.style.fontSize = '0.7rem';
            boostBtn.style.fontWeight = '700';
            boostBtn.style.color = '#000';
            boostBtn.style.cursor = 'pointer';
            boostBtn.style.marginTop = '2px';
            boostBtn.style.width = '100%';
            boostBtn.style.transition = '0.1s';
            boostBtn.onclick = () => buyEthBoost(i);
            boostBtn.innerHTML = `+10% HASH RATE | <span id="eth-boost-cost-${u.id}">$0</span>`;
            boostBtn.disabled = u.level === 0;
            boostBtn.setAttribute('data-upgrade-name', u.name);
            container.appendChild(boostBtn);
        }
    });
}

function initDogeShop() {
    const container = document.getElementById('doge-shop');
    container.innerHTML = '';

    dogeUpgrades.forEach((u, i) => {
        const btn = document.createElement('button');
        btn.className = 'u-item';
        btn.id = `doge-up-${u.id}`;
        if (u.isClickUpgrade) {
            btn.classList.add('click-upgrade');
        }

        btn.onclick = () => buyDogeLevel(i, buyQuantity);

        const powerReq = equipmentPowerReqs[u.id] || 0;
        const effectivePower = getEffectivePowerRequirement(powerReq);
        const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-power-${u.id}">${effectivePower.toLocaleString()}W Consumed per level</span>` : '';

        btn.innerHTML = `
            <div style="text-align:left;flex:1">
                <div style="font-size:0.9rem;color:#c2a633;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="doge-lvl-txt-${u.id}">[Lvl 0]</span> ${u.name}</div>
                <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="doge-yield-${u.id}">+0 Ð/s - Current Speed</div>
                <div style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-increase-${u.id}">+0 Ð/s per level</div>
                ${powerDisplay}
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="doge-usd-${u.id}">$${u.baseUsd.toLocaleString()}</span>
                <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="doge-afford-${u.id}">x0</span>
            </div>`;
        container.appendChild(btn);

        // Add boost button only for non-manual upgrades
        if (!u.isClickUpgrade) {
            const boostBtn = document.createElement('button');
            boostBtn.id = `doge-boost-${u.id}`;
            boostBtn.style.background = '#ff9500';
            boostBtn.style.border = 'none';
            boostBtn.style.borderRadius = '6px';
            boostBtn.style.padding = '6px 10px';
            boostBtn.style.fontSize = '0.7rem';
            boostBtn.style.fontWeight = '700';
            boostBtn.style.color = '#000';
            boostBtn.style.cursor = 'pointer';
            boostBtn.style.marginTop = '2px';
            boostBtn.style.width = '100%';
            boostBtn.style.transition = '0.1s';
            boostBtn.onclick = () => buyDogeBoost(i);
            boostBtn.innerHTML = `+10% HASH RATE | <span id="doge-boost-cost-${u.id}">$0</span>`;
            boostBtn.disabled = u.level === 0;
            boostBtn.setAttribute('data-upgrade-name', u.name);
            container.appendChild(boostBtn);
        }
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const tabElement = document.getElementById(tab + '-tab');
    tabElement.classList.add('active');
    event.target.classList.add('active');

    // Reset purchase quantity to 1x when switching tabs
    setBuyQuantity(1);

    // Scroll to the tab content on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            tabElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ============================================================================
// POWER DISPLAY UPDATE FUNCTION
// ============================================================================

function updatePowerDisplay() {
    const powerUsedEl = document.getElementById('power-used');
    if (powerUsedEl) {
        const availableWithBonus = getTotalPowerAvailableWithBonus();
        powerUsedEl.innerText = totalPowerUsed.toLocaleString() + 'W / ' + availableWithBonus.toLocaleString() + 'W';

        // Dynamic color for power text based on usage
        const percentage = availableWithBonus > 0 ? (totalPowerUsed / availableWithBonus * 100) : 0;
        if (percentage > 100) {
            powerUsedEl.style.color = '#ff3344'; // Red - over capacity
        } else if (percentage > 80) {
            powerUsedEl.style.color = '#ff9500'; // Orange - critical
        } else if (percentage > 60) {
            powerUsedEl.style.color = '#ffdd00'; // Yellow - warning
        } else {
            powerUsedEl.style.color = '#00ff88'; // Green - safe
        }
    }

    const powerBarFill = document.getElementById('power-bar-fill');
    if (powerBarFill) {
        const availableWithBonus = getTotalPowerAvailableWithBonus();
        const percentage = availableWithBonus > 0 ? (totalPowerUsed / availableWithBonus * 100) : 0;
        powerBarFill.style.width = Math.min(percentage, 100) + '%';

        // Dynamic color for power bar based on usage
        if (percentage > 100) {
            powerBarFill.style.background = '#ff3344'; // Red - over capacity
        } else if (percentage > 80) {
            powerBarFill.style.background = '#ff9500'; // Orange - critical
        } else if (percentage > 60) {
            powerBarFill.style.background = '#ffdd00'; // Yellow - warning
        } else {
            powerBarFill.style.background = '#00ff88'; // Green - safe
        }
    }

    // Update power upgrades display
    powerUpgrades.forEach(u => {
        const costUsd = u.currentUsd;
        const lvlEl = document.getElementById(`pow-lvl-txt-${u.id}`);
        if (lvlEl) lvlEl.innerText = `[Lvl ${u.level}]`;

        const currentPowerEl = document.getElementById(`pow-current-${u.id}`);
        if (currentPowerEl) currentPowerEl.innerText = `+${u.currentPower.toLocaleString()}W - Current Power`;

        const powerEl = document.getElementById(`pow-power-${u.id}`);
        if (powerEl) powerEl.innerText = `+${u.basePower.toLocaleString()}W Produced per level`;

        const usdEl = document.getElementById(`pow-usd-${u.id}`);
        if (usdEl) usdEl.innerText = `$${u.currentUsd.toLocaleString()}`;

        // Calculate how many power upgrades can be afforded (accounting for price increases)
        const affordEl = document.getElementById(`pow-afford-${u.id}`);
        if (affordEl) {
            let remaining = dollarBalance;
            let canAfford = 0;
            let nextCost = costUsd;
            let nextLevel = u.level;

            while (remaining >= nextCost) {
                remaining -= nextCost;
                canAfford++;
                nextLevel++;
                // Power upgrades: 1.2x multiplier
                nextCost = u.baseUsd * Math.pow(1.2, nextLevel);
            }

            affordEl.innerText = `x${canAfford}`;
            affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
        }

        const btn = document.getElementById(`pow-${u.id}`);
        if (btn) btn.disabled = (dollarBalance < costUsd);
    });
}

// ============================================================================
// SESSION STATS UPDATE FUNCTION
// ============================================================================

function updateSessionStats() {
    // Update session time
    const now = Date.now();
    const sessionSeconds = Math.floor((now - sessionStartTime) / 1000);
    const hours = Math.floor(sessionSeconds / 3600);
    const minutes = Math.floor((sessionSeconds % 3600) / 60);
    const seconds = sessionSeconds % 60;

    let timeStr = '';
    if (hours > 0) timeStr += hours + 'h ';
    if (minutes > 0) timeStr += minutes + 'm ';
    timeStr += seconds + 's';

    document.getElementById('session-time').innerText = timeStr;

    // Display session earnings (tracked directly from mining/staking)
    const sessionEarningEl = document.getElementById('session-earning');
    if (sessionEarningEl) {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && sessionEarnings >= 1000) {
            sessionEarningEl.innerText = '$' + (sessionEarnings / 1e6 >= 1 ? (sessionEarnings / 1e6).toFixed(1) + 'm' : sessionEarnings / 1e3 >= 1 ? (sessionEarnings / 1e3).toFixed(1) + 'k' : sessionEarnings.toFixed(2));
        } else {
            sessionEarningEl.innerText = '$' + sessionEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }
    }

    // Update lifetime earnings display (earnings are now tracked directly when crypto is mined/staked)
    const lifetimeEarningEl = document.getElementById('lifetime-earning');
    if (lifetimeEarningEl) {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && lifetimeEarnings >= 1000) {
            lifetimeEarningEl.innerText = '$' + (lifetimeEarnings / 1e6 >= 1 ? (lifetimeEarnings / 1e6).toFixed(1) + 'm' : lifetimeEarnings / 1e3 >= 1 ? (lifetimeEarnings / 1e3).toFixed(1) + 'k' : lifetimeEarnings.toFixed(2));
        } else {
            lifetimeEarningEl.innerText = '$' + lifetimeEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }
    }
}

// Helper function to abbreviate large numbers only on mobile
function formatNumberForDisplay(num) {
    // Check if viewport is mobile (max-width: 768px)
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
        return Math.floor(num).toLocaleString();
    }

    // Mobile abbreviation: 1k, 1m, 1b, etc
    const abs = Math.abs(num);
    if (abs >= 1e9) {
        return (num / 1e9).toFixed(1) + 'b';
    } else if (abs >= 1e6) {
        return (num / 1e6).toFixed(1) + 'm';
    } else if (abs >= 1e3) {
        return (num / 1e3).toFixed(1) + 'k';
    }
    return Math.floor(num).toLocaleString();
}

// ============================================================================
// MAIN UI UPDATE FUNCTION
// ============================================================================

function updateUI() {
    // Crypto portfolio value = value of all crypto holdings only
    let cryptoPortfolioValue = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);
    const isMobileUI = window.innerWidth <= 768;
    if (isMobileUI && cryptoPortfolioValue >= 1000) {
        const abbrev = cryptoPortfolioValue / 1e9 >= 1 ? (cryptoPortfolioValue / 1e9).toFixed(1) + 'b' : cryptoPortfolioValue / 1e6 >= 1 ? (cryptoPortfolioValue / 1e6).toFixed(1) + 'm' : (cryptoPortfolioValue / 1e3).toFixed(1) + 'k';
        document.getElementById('nw-val').innerText = "$" + abbrev;
    } else {
        document.getElementById('nw-val').innerText = "$" + cryptoPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2});
    }

    // Update balances
    document.getElementById('bal-btc').innerText = btcBalance.toFixed(8);
    document.getElementById('bal-eth').innerText = ethBalance.toFixed(8);
    document.getElementById('bal-doge').innerText = dogeBalance.toFixed(8);

    // Update manual hash button text
    const mineBtnSpan = document.querySelector('.mine-btn span');
    if (mineBtnSpan) {
        mineBtnSpan.innerText = `+${btcClickValue.toFixed(8)} ₿`;
    }
    const ethMineBtnSpan = document.querySelectorAll('.mine-btn span')[1];
    if (ethMineBtnSpan) {
        ethMineBtnSpan.innerText = `+${ethClickValue.toFixed(8)} Ξ`;
    }
    const dogeMineBtnSpan = document.querySelectorAll('.mine-btn span')[2];
    if (dogeMineBtnSpan) {
        dogeMineBtnSpan.innerText = `+${dogeClickValue.toFixed(8)} Ð`;
    }

    // Update hardware equity
    let hardwareEquityDisplay = "$" + Math.floor(hardwareEquity).toLocaleString();
    if (isMobileUI && hardwareEquity >= 1000) {
        hardwareEquityDisplay = "$" + (hardwareEquity / 1e9 >= 1 ? (hardwareEquity / 1e9).toFixed(1) + 'b' : hardwareEquity / 1e6 >= 1 ? (hardwareEquity / 1e6).toFixed(1) + 'm' : (hardwareEquity / 1e3).toFixed(1) + 'k');
    }
    document.getElementById('asset-usd').innerText = hardwareEquityDisplay;

    // Update individual hashrate displays (old location - keep for backwards compatibility)
    const btcEl = document.getElementById('yield-btc');
    const ethEl = document.getElementById('yield-eth');
    const dogeEl = document.getElementById('yield-doge');

    if (btcEl) btcEl.innerText = btcPerSec.toFixed(8) + "/s";
    if (ethEl) ethEl.innerText = ethPerSec.toFixed(8) + "/s";
    if (dogeEl) dogeEl.innerText = dogePerSec.toFixed(8) + "/s";

    // Update hashrate displays in new location
    const btcDisplayEl = document.getElementById('yield-btc-display');
    const ethDisplayEl = document.getElementById('yield-eth-display');
    const dogeDisplayEl = document.getElementById('yield-doge-display');

    if (btcDisplayEl) btcDisplayEl.innerText = btcPerSec.toFixed(8) + "/s";
    if (ethDisplayEl) ethDisplayEl.innerText = ethPerSec.toFixed(8) + "/s";
    if (dogeDisplayEl) dogeDisplayEl.innerText = dogePerSec.toFixed(8) + "/s";

    // Update prices
    document.getElementById('btc-price').innerText = "$" + Math.floor(btcPrice).toLocaleString();
    document.getElementById('eth-price').innerText = "$" + Math.floor(ethPrice).toLocaleString();
    document.getElementById('doge-price').innerText = "$" + dogePrice.toFixed(4);

    // Update dollar balance
    const dollarBalanceEl = document.getElementById('dollar-balance');
    if (dollarBalanceEl) dollarBalanceEl.innerText = "$" + formatNumberForDisplay(dollarBalance);

    // Update market prices
    const marketBtcPrice = document.getElementById('market-btc-price');
    const marketEthPrice = document.getElementById('market-eth-price');
    const marketDogePrice = document.getElementById('market-doge-price');
    if (marketBtcPrice) marketBtcPrice.innerText = Math.floor(btcPrice).toLocaleString();
    if (marketEthPrice) marketEthPrice.innerText = Math.floor(ethPrice).toLocaleString();
    if (marketDogePrice) marketDogePrice.innerText = dogePrice.toFixed(4);

    // Update session stats
    updateSessionStats();

    // Update power display
    calculateTotalPowerUsed();
    updatePowerDisplay();

    btcUpgrades.forEach(u => {
const costUsd = u.currentUsd;
const yEl = document.getElementById(`yield-${u.id}`);

if (yEl) {
    if (u.isClickUpgrade) {
        yEl.innerText = `+10% MANUAL HASH RATE`;
    } else {
        // Show the current speed WITH skill bonuses applied
        const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
        const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
        const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
        const currentSpeed = baseSpeed * (1 + miningBonus + btcBonus);
        yEl.innerText = `+${currentSpeed.toFixed(8)} ₿/s - Current Speed`;
    }
}

// Update per-level increase
const increaseEl = document.getElementById(`increase-${u.id}`);
if (increaseEl) {
    if (u.isClickUpgrade) {
        increaseEl.style.display = 'none';
    } else {
        const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
        const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
        const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
        const perLevelIncrease = baseIncrease * (1 + miningBonus + btcBonus);
        increaseEl.innerText = `+${perLevelIncrease.toFixed(8)} ₿/s per level`;
        increaseEl.style.display = 'block';
    }
}

const uEl = document.getElementById(`usd-${u.id}`);
if(uEl) {
    // Calculate total cost for the selected quantity
    let displayCost = 0;
    let tempLevel = u.level;
    for (let i = 0; i < buyQuantity; i++) {
        if (u.isClickUpgrade) {
            displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
        } else {
            displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
        }
        tempLevel++;
    }
    uEl.innerText = `$${Math.floor(displayCost).toLocaleString()}`;
}

// Update power display with effective consumption after skills
const powerEl = document.getElementById(`power-${u.id}`);
if(powerEl) {
    const powerReq = equipmentPowerReqs[u.id] || 0;
    if (powerReq > 0) {
        const effectivePower = getEffectivePowerRequirement(powerReq);
        powerEl.innerText = `${effectivePower.toLocaleString()}W Consumed per level`;
    }
}

// Calculate how many upgrades can be afforded (accounting for price increases)
const affordEl = document.getElementById(`afford-${u.id}`);
if(affordEl) {
    let remaining = dollarBalance;
    let canAfford = 0;
    let nextCost = costUsd;
    let nextLevel = u.level;

    while (remaining >= nextCost) {
        remaining -= nextCost;
        canAfford++;
        nextLevel++;

        // Calculate next cost based on upgrade type
        if (u.isClickUpgrade) {
            // Manual hash: 1.12x multiplier
            nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
        } else {
            // Other miners: 1.12x multiplier
            nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
        }
    }

    affordEl.innerText = `x${canAfford}`;
    affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
}

const bEl = document.getElementById(`up-${u.id}`);
if(bEl) {
    // Check both dollar balance and power requirements for the selected quantity
    // Calculate total cost for buyQuantity items
    let totalCost = 0;
    let tempLevel = u.level;
    for (let i = 0; i < buyQuantity; i++) {
        if (u.isClickUpgrade) {
            totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
        } else {
            totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
        }
        tempLevel++;
    }

    const hasEnoughDollars = dollarBalance >= totalCost;
    const powerReq = equipmentPowerReqs[u.id] || 0;
    const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
    const availablePower = getTotalPowerAvailableWithBonus();
    const hasEnoughPower = powerNeeded <= availablePower || powerReq === 0;
    const shouldDisable = !(hasEnoughDollars && hasEnoughPower);
    bEl.disabled = shouldDisable;
    if (u.id === 1) console.log(`USB Miner: dollars=${dollarBalance}/${totalCost}, power=${totalPowerUsed}/${availablePower}, needed=${powerNeeded}, qty=${buyQuantity}, disabled=${shouldDisable}`);

    // Change button appearance based on what's missing
    if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
        // Need both cash and power - prioritize showing cash need
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE CASH';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE CASH';
        }
        bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power`;
    } else if (!hasEnoughDollars) {
        // Only need cash
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE CASH';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE CASH';
        }
        bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
    } else if (!hasEnoughPower && powerReq > 0) {
        // Only need power
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE POWER';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE POWER';
        }
        bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power capacity.`;
    } else {
        // Can afford - remove overlay
        let overlay = bEl.querySelector('.power-overlay');
        if (overlay) overlay.remove();
        bEl.title = '';
    }
}

const lEl = document.getElementById(`lvl-txt-${u.id}`);
if(lEl) lEl.innerText = `[Lvl ${u.level}]`;

// Update boost button
const boostCostBtc = u.boostCost / btcPrice;
const boostCostEl = document.getElementById(`boost-cost-${u.id}`);
if(boostCostEl) boostCostEl.innerText = `$${Math.floor(u.boostCost).toLocaleString()}`;

// Format the current yield amount (after all boosts applied)
const currentYield = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
const boostAmtEl = document.getElementById(`boost-amt-${u.id}`);
if(boostAmtEl) {
    if (currentYield >= 1) {
        boostAmtEl.innerText = currentYield.toFixed(2);
    } else if (currentYield >= 0.0001) {
        boostAmtEl.innerText = (currentYield * 1000000).toFixed(0) + 'μ';
    } else if (currentYield > 0) {
        boostAmtEl.innerText = (currentYield * 1000000000).toFixed(0);
    } else {
        boostAmtEl.innerText = '0';
    }
}

const boostBtn = document.getElementById(`boost-${u.id}`);
if(boostBtn) {
    boostBtn.disabled = (u.level === 0 || dollarBalance < u.boostCost);
    if (u.level === 0) {
        boostBtn.innerHTML = `Purchase ${u.name} first`;
    } else {
        boostBtn.innerHTML = `+10% HASH RATE | <span id="boost-cost-${u.id}">$${Math.floor(u.boostCost).toLocaleString()}</span>`;
    }
}
});

// Update ETH upgrades display
ethUpgrades.forEach(u => {
const costUsd = u.currentUsd;
const yEl = document.getElementById(`eth-yield-${u.id}`);
if (yEl) {
    if (u.isClickUpgrade) {
        yEl.innerText = `+10% MANUAL ETH RATE`;
    } else {
        // Show the current speed WITH skill bonuses applied
        const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
        const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
        const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
        const currentSpeed = baseSpeed * (1 + miningBonus + ethBonus);
        yEl.innerText = `+${currentSpeed.toFixed(8)} Ξ/s - Current Speed`;
    }
}

// Update per-level increase for ETH
const ethIncreaseEl = document.getElementById(`eth-increase-${u.id}`);
if (ethIncreaseEl) {
    if (u.isClickUpgrade) {
        ethIncreaseEl.style.display = 'none';
    } else {
        const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
        const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
        const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
        const perLevelIncrease = baseIncrease * (1 + miningBonus + ethBonus);
        ethIncreaseEl.innerText = `+${perLevelIncrease.toFixed(8)} Ξ/s per level`;
        ethIncreaseEl.style.display = 'block';
    }
}

const uEl = document.getElementById(`eth-usd-${u.id}`);
if(uEl) {
    // Calculate total cost for the selected quantity
    let displayCost = 0;
    let tempLevel = u.level;
    for (let i = 0; i < buyQuantity; i++) {
        if (u.isClickUpgrade) {
            displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
        } else {
            displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
        }
        tempLevel++;
    }
    uEl.innerText = `$${Math.floor(displayCost).toLocaleString()}`;
}

// Update power display with effective consumption after skills
const ethPowerEl = document.getElementById(`eth-power-${u.id}`);
if(ethPowerEl) {
    const powerReq = equipmentPowerReqs[u.id] || 0;
    if (powerReq > 0) {
        const effectivePower = getEffectivePowerRequirement(powerReq);
        ethPowerEl.innerText = `${effectivePower.toLocaleString()}W Consumed per level`;
    }
}

const affordEl = document.getElementById(`eth-afford-${u.id}`);
if(affordEl) {
    let remaining = dollarBalance;
    let canAfford = 0;
    let nextCost = costUsd;
    let nextLevel = u.level;

    while (remaining >= nextCost) {
        remaining -= nextCost;
        canAfford++;
        nextLevel++;
        if (u.isClickUpgrade) {
            nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
        } else {
            nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
        }
    }

    affordEl.innerText = `x${canAfford}`;
    affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
}

const bEl = document.getElementById(`eth-up-${u.id}`);
if(bEl) {
    // Check both dollar balance and power requirements for the selected quantity
    // Calculate total cost for buyQuantity items
    let totalCost = 0;
    let tempLevel = u.level;
    for (let i = 0; i < buyQuantity; i++) {
        if (u.isClickUpgrade) {
            totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
        } else {
            totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
        }
        tempLevel++;
    }

    const hasEnoughDollars = dollarBalance >= totalCost;
    const powerReq = equipmentPowerReqs[u.id] || 0;
    const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
    const ethAvailablePower = getTotalPowerAvailableWithBonus();
    const hasEnoughPower = powerNeeded <= ethAvailablePower || powerReq === 0;
    bEl.disabled = !(hasEnoughDollars && hasEnoughPower);

    // Change button appearance based on what's missing
    if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
        // Need both cash and power - prioritize showing cash need
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE CASH';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE CASH';
        }
        bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - ethAvailablePower).toLocaleString()}W more power`;
    } else if (!hasEnoughDollars) {
        // Only need cash
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE CASH';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE CASH';
        }
        bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
    } else if (!hasEnoughPower && powerReq > 0) {
        // Only need power
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE POWER';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE POWER';
        }
        bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - ethAvailablePower).toLocaleString()}W more power capacity.`;
    } else {
        // Can afford - remove overlay
        let overlay = bEl.querySelector('.power-overlay');
        if (overlay) overlay.remove();
        bEl.title = '';
    }
}

const lEl = document.getElementById(`eth-lvl-txt-${u.id}`);
if(lEl) lEl.innerText = `[Lvl ${u.level}]`;

// Update ETH boost button
const ethBoostBtn = document.getElementById(`eth-boost-${u.id}`);
if(ethBoostBtn) {
    ethBoostBtn.disabled = (u.level === 0 || dollarBalance < u.boostCost);
    if (u.level === 0) {
        ethBoostBtn.innerHTML = `Purchase ${u.name} first`;
    } else {
        ethBoostBtn.innerHTML = `+10% HASH RATE | <span id="eth-boost-cost-${u.id}">$${Math.floor(u.boostCost).toLocaleString()}</span>`;
    }
}
});

// Update DOGE upgrades display
dogeUpgrades.forEach(u => {
const costUsd = u.currentUsd;
const yEl = document.getElementById(`doge-yield-${u.id}`);
if (yEl) {
    if (u.isClickUpgrade) {
        yEl.innerText = `+10% MANUAL DOGE RATE`;
    } else {
        // Show the current speed WITH skill bonuses applied
        const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;
        const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
        const baseSpeed = u.baseYield * u.level * Math.pow(1.12, u.boostLevel);
        const currentSpeed = baseSpeed * (1 + miningBonus + dogeBonus);
        yEl.innerText = `+${currentSpeed.toFixed(8)} Ð/s - Current Speed`;
    }
}

// Update per-level increase for DOGE
const dogeIncreaseEl = document.getElementById(`doge-increase-${u.id}`);
if (dogeIncreaseEl) {
    if (u.isClickUpgrade) {
        dogeIncreaseEl.style.display = 'none';
    } else {
        const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;
        const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
        const baseIncrease = u.baseYield * Math.pow(1.12, u.boostLevel);
        const perLevelIncrease = baseIncrease * (1 + miningBonus + dogeBonus);
        dogeIncreaseEl.innerText = `+${perLevelIncrease.toFixed(8)} Ð/s per level`;
        dogeIncreaseEl.style.display = 'block';
    }
}

const uEl = document.getElementById(`doge-usd-${u.id}`);
if(uEl) {
    // Calculate total cost for the selected quantity
    let displayCost = 0;
    let tempLevel = u.level;
    for (let i = 0; i < buyQuantity; i++) {
        if (u.isClickUpgrade) {
            displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
        } else {
            displayCost += u.baseUsd * Math.pow(1.12, tempLevel);
        }
        tempLevel++;
    }
    uEl.innerText = `$${Math.floor(displayCost).toLocaleString()}`;
}

// Update power display with effective consumption after skills
const dogePowerEl = document.getElementById(`doge-power-${u.id}`);
if(dogePowerEl) {
    const powerReq = equipmentPowerReqs[u.id] || 0;
    if (powerReq > 0) {
        const effectivePower = getEffectivePowerRequirement(powerReq);
        dogePowerEl.innerText = `${effectivePower.toLocaleString()}W Consumed per level`;
    }
}

const affordEl = document.getElementById(`doge-afford-${u.id}`);
if(affordEl) {
    let remaining = dollarBalance;
    let canAfford = 0;
    let nextCost = costUsd;
    let nextLevel = u.level;

    while (remaining >= nextCost) {
        remaining -= nextCost;
        canAfford++;
        nextLevel++;
        if (u.isClickUpgrade) {
            nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
        } else {
            nextCost = u.baseUsd * Math.pow(1.12, nextLevel);
        }
    }

    affordEl.innerText = `x${canAfford}`;
    affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
}

const bEl = document.getElementById(`doge-up-${u.id}`);
if(bEl) {
    // Check both dollar balance and power requirements for the selected quantity
    // Calculate total cost for buyQuantity items
    let totalCost = 0;
    let tempLevel = u.level;
    for (let i = 0; i < buyQuantity; i++) {
        if (u.isClickUpgrade) {
            totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
        } else {
            totalCost += u.baseUsd * Math.pow(1.12, tempLevel);
        }
        tempLevel++;
    }

    const hasEnoughDollars = dollarBalance >= totalCost;
    const powerReq = equipmentPowerReqs[u.id] || 0;
    const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
    const dogeAvailablePower = getTotalPowerAvailableWithBonus();
    const hasEnoughPower = powerNeeded <= dogeAvailablePower || powerReq === 0;
    bEl.disabled = !(hasEnoughDollars && hasEnoughPower);

    // Change button appearance based on what's missing
    if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
        // Need both cash and power - prioritize showing cash need
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE CASH';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE CASH';
        }
        bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - dogeAvailablePower).toLocaleString()}W more power`;
    } else if (!hasEnoughDollars) {
        // Only need cash
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE CASH';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE CASH';
        }
        bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
    } else if (!hasEnoughPower && powerReq > 0) {
        // Only need power
        let overlay = bEl.querySelector('.power-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'power-overlay';
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(0,0,0,0.8)';
            overlay.style.borderRadius = '10px';
            overlay.style.color = '#999';
            overlay.style.fontWeight = 'bold';
            overlay.style.fontSize = '1.1rem';
            overlay.style.textAlign = 'center';
            overlay.innerHTML = 'YOU NEED MORE POWER';
            bEl.style.position = 'relative';
            bEl.appendChild(overlay);
        } else {
            overlay.innerHTML = 'YOU NEED MORE POWER';
        }
        bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - dogeAvailablePower).toLocaleString()}W more power capacity.`;
    } else {
        // Can afford - remove overlay
        let overlay = bEl.querySelector('.power-overlay');
        if (overlay) overlay.remove();
        bEl.title = '';
    }
}

const lEl = document.getElementById(`doge-lvl-txt-${u.id}`);
if(lEl) lEl.innerText = `[Lvl ${u.level}]`;

// Update DOGE boost button
const dogeBoostBtn = document.getElementById(`doge-boost-${u.id}`);
if(dogeBoostBtn) {
    dogeBoostBtn.disabled = (u.level === 0 || dollarBalance < u.boostCost);
    if (u.level === 0) {
        dogeBoostBtn.innerHTML = `Purchase ${u.name} first`;
    } else {
        dogeBoostBtn.innerHTML = `+10% HASH RATE | <span id="doge-boost-cost-${u.id}">$${Math.floor(u.boostCost).toLocaleString()}</span>`;
    }
}
});

// Update staking UI
if (typeof updateStakingUI === 'function') {
    updateStakingUI();
}
}

// ============================================================================
// MODAL MANAGEMENT FUNCTIONS
// ============================================================================

function showOfflineEarningsModal(btcEarned, ethEarned, dogeEarned, stakingCash, secondsOffline, wasCapped, cappedSeconds) {
    console.log('showOfflineEarningsModal called with:', btcEarned, ethEarned, dogeEarned, stakingCash, secondsOffline, wasCapped, cappedSeconds);

    const overlay = document.createElement('div');
    overlay.className = 'offline-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'offline-modal';

    const hours = Math.floor(secondsOffline / 3600);
    const minutes = Math.floor((secondsOffline % 3600) / 60);
    const seconds = Math.floor(secondsOffline % 60);

    let timeStr = '';
    if (hours > 0) timeStr += hours + 'h ';
    if (minutes > 0) timeStr += minutes + 'm ';
    if (seconds > 0) timeStr += seconds + 's';
    if (!timeStr) timeStr = '< 1s';

    let earningsHtml = '';
    if (btcEarned > 0) {
        earningsHtml += `<div class="earnings" style="color: #f7931a;">₿ ${btcEarned.toFixed(8)}</div>`;
    }
    if (ethEarned > 0) {
        earningsHtml += `<div class="earnings" style="color: #627eea;">Ξ ${ethEarned.toFixed(8)}</div>`;
    }
    if (dogeEarned > 0) {
        earningsHtml += `<div class="earnings" style="color: #c2a633;">Ð ${dogeEarned.toFixed(2)}</div>`;
    }
    if (stakingCash > 0) {
        // Abbreviate large cash amounts
        let cashDisplay;
        if (stakingCash >= 1e9) {
            cashDisplay = '$' + (stakingCash / 1e9).toFixed(2) + 'b';
        } else if (stakingCash >= 1e6) {
            cashDisplay = '$' + (stakingCash / 1e6).toFixed(2) + 'm';
        } else if (stakingCash >= 1e3) {
            cashDisplay = '$' + (stakingCash / 1e3).toFixed(2) + 'k';
        } else {
            cashDisplay = '$' + stakingCash.toFixed(2);
        }
        earningsHtml += `<div class="earnings" style="color: #4caf50;">💰 ${cashDisplay}</div>`;
    }

    // If no earnings, show a message
    if (!earningsHtml) {
        earningsHtml = `<div class="earnings" style="color: #888; font-size: 1.2rem;">$0.00</div>
                       <div style="color: #666; font-size: 0.9rem; margin-top: 10px;">Purchase miners to earn while offline!</div>`;
    }

    // Add cap notice if time was capped
    let capNotice = '';
    if (wasCapped) {
        capNotice = `<div style="color: #ff9800; font-size: 0.85rem; margin-top: 8px; padding: 8px; background: rgba(255,152,0,0.1); border-radius: 4px; border: 1px solid rgba(255,152,0,0.3);">⚠️ Offline earnings capped at 6 hours</div>`;
    }

    modal.innerHTML = `
        <h2>⏰ Welcome Back!</h2>
        <div class="earnings-label">Offline Earnings${wasCapped ? ' (6 hour max)' : ''}</div>
        ${earningsHtml}
        <div class="time-offline">While you were away for ${timeStr}</div>
        ${capNotice}
        <button id="claim-btn">Claim Rewards</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    document.getElementById('claim-btn').onclick = () => {
        overlay.remove();
        modal.remove();
    };

    console.log('Modal created and appended');
}

function acceptAgeAndTerms() {
    localStorage.setItem('ageDisclaimerAccepted', 'true');
    localStorage.setItem('termsAccepted', 'true');
    document.getElementById('age-terms-modal').style.display = 'none';
}

function openAgeAndTermsModal() {
    document.getElementById('age-terms-modal').style.display = 'flex';
}

// Privacy policy modal handling
function openPrivacyModal() {
    document.getElementById('privacy-modal').style.display = 'flex';
}

function closePrivacyModal() {
    document.getElementById('privacy-modal').style.display = 'none';
}

// ============================================================================
// EXPORT FUNCTIONS TO WINDOW SCOPE
// This allows HTML onclick handlers and other scripts to access these functions
// ============================================================================

window.initBtcShop = initBtcShop;
window.initPowerShop = initPowerShop;
window.initEthShop = initEthShop;
window.initDogeShop = initDogeShop;
window.switchTab = switchTab;
window.updatePowerDisplay = updatePowerDisplay;
window.updateSessionStats = updateSessionStats;
window.formatNumberForDisplay = formatNumberForDisplay;
window.updateUI = updateUI;
window.showOfflineEarningsModal = showOfflineEarningsModal;
window.acceptAgeAndTerms = acceptAgeAndTerms;
window.openAgeAndTermsModal = openAgeAndTermsModal;
window.openPrivacyModal = openPrivacyModal;
window.closePrivacyModal = closePrivacyModal;

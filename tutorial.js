// Onboarding Tutorial System
// Guides new players through key game mechanics

// Helper function to get total portfolio valuation (the big green number at the top)
function getTotalCryptoValue() {
    // Calculate crypto portfolio value: (BTC * BTC_PRICE) + (ETH * ETH_PRICE) + (DOGE * DOGE_PRICE)
    try {
        const btcPrice = typeof BTC_PRICE !== 'undefined' ? BTC_PRICE : 99975;
        const ethPrice = typeof ETH_PRICE !== 'undefined' ? ETH_PRICE : 3499;
        const dogePrice = typeof DOGE_PRICE !== 'undefined' ? DOGE_PRICE : 0.35;

        const btcBal = typeof btcBalance !== 'undefined' ? btcBalance : 0;
        const ethBal = typeof ethBalance !== 'undefined' ? ethBalance : 0;
        const dogeBal = typeof dogeBalance !== 'undefined' ? dogeBalance : 0;

        const portfolioValue = (btcBal * btcPrice) + (ethBal * ethPrice) + (dogeBal * dogePrice);
        return portfolioValue;
    } catch (e) {
        console.log('🎓 Error calculating portfolio value:', e);
        return 0;
    }
}

// Helper function to save tutorial state to localStorage
function saveTutorialState() {
    const state = {
        completed: tutorialData.completed,
        currentStep: tutorialData.currentStep,
        cryptoSoldOnce: tutorialData.cryptoSoldOnce,
        powerUpgradeClicked: tutorialData.powerUpgradeClicked,
        btcTabClicked: tutorialData.btcTabClicked
    };
    localStorage.setItem('tutorialState', JSON.stringify(state));
    console.log('🎓 Tutorial state saved:', state);
}

// Helper function to load tutorial state from localStorage
function loadTutorialState() {
    const saved = localStorage.getItem('tutorialState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            tutorialData.completed = state.completed || false;
            tutorialData.currentStep = state.currentStep || 0;
            tutorialData.cryptoSoldOnce = state.cryptoSoldOnce || false;
            tutorialData.powerUpgradeClicked = state.powerUpgradeClicked || false;
            tutorialData.btcTabClicked = state.btcTabClicked || false;
            console.log('🎓 Tutorial state loaded:', state);
            return true;
        } catch (e) {
            console.log('🎓 Error loading tutorial state:', e);
            return false;
        }
    }
    return false;
}

let tutorialData = {
    completed: false,
    currentStep: 0,
    cryptoSoldOnce: false,
    steps: [
        {
            id: 'manual_hash',
            title: 'Start Mining!',
            description: 'Click the manual hash buttons OR use the AUTO CLICKER to earn cryptocurrency. Earn at least $30 to continue! 💰',
            targets: ['manual-hash-btc-btn', 'manual-hash-eth-btn', 'manual-hash-doge-btn', 'autoclicker-btn'],
            trigger: 'clicks_made',
            nextCondition: () => {
                try {
                    return getTotalCryptoValue() >= 30;
                } catch (e) {
                    return false;
                }
            },
            highlightClass: 'tutorial-highlight'
        },
        {
            id: 'crypto_exchange',
            title: 'Exchange Your Crypto',
            description: 'Great! Now you need to sell your cryptocurrency for USD. Open the Exchange tab and click "SELL ALL" to convert at least $30 worth of crypto to cash.',
            targets: ['crypto-exchange-btn'],
            trigger: 'manual',
            nextCondition: () => typeof dollarBalance !== 'undefined' && dollarBalance >= 30,
            highlightClass: 'tutorial-highlight-urgent',
            customHighlight: () => {
                // Highlight the crypto balance displays
                const btcEl = document.getElementById('bal-btc');
                const ethEl = document.getElementById('bal-eth');
                const dogeEl = document.getElementById('bal-doge');
                if (btcEl) btcEl.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
                if (ethEl) ethEl.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
                if (dogeEl) dogeEl.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';

                // Also highlight all SELL ALL buttons with flashing animation
                document.querySelectorAll('button').forEach(btn => {
                    if (btn.textContent.includes('SELL ALL')) {
                        btn.style.animation = 'tutorial-flash 0.6s infinite';
                        btn.style.zIndex = '9991';
                    }
                });
            }
        },
        {
            id: 'power_button',
            title: 'Upgrade Power Supply',
            description: 'Great! Now that you have cash, click the "UPGRADE POWER SUPPLY" button to increase your mining capacity.',
            targets: ['power-upgrade-btn'],
            trigger: 'manual',
            nextCondition: () => tutorialData.powerUpgradeClicked,
            highlightClass: 'tutorial-highlight-urgent'
        },
        {
            id: 'buy_power_supply',
            title: 'Buy Basic Power Strip',
            description: 'In the Power tab, find and buy the "Basic Power Strip" upgrade. This lets you run more miners at once.',
            targets: [],
            trigger: 'manual',
            nextCondition: () => typeof powerUpgrades !== 'undefined' && powerUpgrades[0] && powerUpgrades[0].level > 0,
            highlightClass: 'tutorial-highlight-urgent',
            autoAdvance: true,
            customHighlight: () => {
                // Highlight the Basic Power Strip button in the power shop
                // The Basic Power Strip is the first power upgrade (id: 0), so button id is "pow-0"
                const basicPowerStripBtn = document.getElementById('pow-0');

                if (basicPowerStripBtn) {
                    // Apply glow effect to the button itself
                    basicPowerStripBtn.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.2)';
                    basicPowerStripBtn.style.border = '2px dashed #FFD700';
                    basicPowerStripBtn.style.position = 'relative';
                    basicPowerStripBtn.style.zIndex = '9991';
                    basicPowerStripBtn.style.borderRadius = '8px';
                    console.log('🎓 Basic Power Strip highlighted successfully via ID pow-0');
                } else {
                    console.log('🎓 Could not find Basic Power Strip button with ID pow-0 - trying text search fallback');
                    // Fallback: search by text content
                    let found = false;
                    document.querySelectorAll('button.u-item').forEach(el => {
                        if (el.textContent.includes('Basic Power Strip')) {
                            el.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.2)';
                            el.style.border = '2px dashed #FFD700';
                            el.style.position = 'relative';
                            el.style.zIndex = '9991';
                            el.style.borderRadius = '8px';
                            console.log('🎓 Basic Power Strip found and highlighted via text search');
                            found = true;
                        }
                    });
                    if (!found) {
                        console.log('🎓 Basic Power Strip button not found - power shop may not be rendered yet');
                    }
                }
            }
        },
        {
            id: 'btc_tab',
            title: 'Mine Bitcoin',
            description: 'Perfect! Now that you have more power capacity, click the BTC tab to see Bitcoin mining equipment.',
            targets: ['btc-tab-btn'],
            trigger: 'manual',
            nextCondition: () => tutorialData.btcTabClicked,
            highlightClass: 'tutorial-highlight',
            autoAdvance: true
        },
        {
            id: 'buy_usb_miner',
            title: 'Buy USB Miner',
            description: 'In the BTC tab, buy a "USB Miner" to start passive Bitcoin mining. It will generate income automatically!',
            targets: ['btc-shop'],
            trigger: 'manual',
            nextCondition: () => typeof btcUpgrades !== 'undefined' && btcUpgrades[1] && btcUpgrades[1].level > 0,
            highlightClass: 'tutorial-highlight-urgent',
            autoAdvance: true,
            customHighlight: () => {
                // Highlight the USB Miner button in the BTC shop
                // USB Miner is btcUpgrades[1] with id: 1, so button id is "up-1"
                const usbMinerBtn = document.getElementById('up-1');

                if (usbMinerBtn) {
                    // Apply glow effect to the button itself
                    usbMinerBtn.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.2)';
                    usbMinerBtn.style.border = '2px dashed #FFD700';
                    usbMinerBtn.style.position = 'relative';
                    usbMinerBtn.style.zIndex = '9991';
                    usbMinerBtn.style.borderRadius = '8px';
                    console.log('🎓 USB Miner highlighted successfully via ID up-1');
                } else {
                    console.log('🎓 Could not find USB Miner button with ID up-1 - trying text search fallback');
                    // Fallback: search by text content
                    let found = false;
                    document.querySelectorAll('button.u-item').forEach(el => {
                        if (el.textContent.includes('USB Miner')) {
                            el.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.2)';
                            el.style.border = '2px dashed #FFD700';
                            el.style.position = 'relative';
                            el.style.zIndex = '9991';
                            el.style.borderRadius = '8px';
                            console.log('🎓 USB Miner found and highlighted via text search');
                            found = true;
                        }
                    });
                    if (!found) {
                        console.log('🎓 USB Miner button not found - BTC shop may not be rendered yet');
                    }
                }
            }
        },
        {
            id: 'tutorial_complete',
            title: 'You\'re Ready!',
            description: 'Excellent! You\'ve learned the core mechanics. Keep buying miners and upgrading power to grow your empire. Good luck!',
            targets: [],
            trigger: 'manual',
            nextCondition: () => true,
            highlightClass: ''
        }
    ]
};

// Check if this is a new player (based on whether tutorial was completed)
function isNewPlayer() {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';
    return !tutorialCompleted;
}

// Initialize tutorial for new players
function initTutorial() {
    // Check if tutorial is already completed
    const tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';
    if (tutorialCompleted) {
        console.log('🎓 Tutorial already completed, skipping');
        return;
    }

    console.log('🎓 Checking for in-progress tutorial...');

    // Check if there's a saved tutorial state (player refreshed page mid-tutorial)
    const hasSavedState = loadTutorialState();

    if (!hasSavedState) {
        // First time starting the tutorial
        console.log('🎓 Starting new tutorial');
        tutorialData.currentStep = 0;
    } else {
        // Resume from saved state
        console.log(`🎓 Resuming tutorial from step ${tutorialData.currentStep}`);
    }

    showTutorialStep();
}

// Show current tutorial step
function showTutorialStep() {
    const step = tutorialData.steps[tutorialData.currentStep];
    if (!step) {
        completeTutorial();
        return;
    }

    console.log(`🎓 Tutorial Step ${tutorialData.currentStep + 1}: ${step.id}`);

    // Remove previous tutorial overlay
    removeOldTutorialOverlay();

    // Create overlay (allows clicks to pass through)
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 9990;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    `;

    // Create tutorial card
    const card = document.createElement('div');
    card.className = 'tutorial-card';
    card.style.cssText = `
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 3px solid #FFD700;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.4s ease-out;
        pointer-events: auto;
        position: relative;
        z-index: 9991;
    `;

    // Check if "Got It!" button should be disabled
    const isStep1 = step.id === 'manual_hash';
    const isStep2 = step.id === 'crypto_exchange';
    const isStep3 = step.id === 'power_button';
    const isStep4 = step.id === 'buy_power_supply';
    const isStep6 = step.id === 'buy_usb_miner';

    let shouldDisableButton = false;
    let hasMetCondition = false;

    try {
        if (isStep1) {
            hasMetCondition = getTotalCryptoValue() >= 30;
            shouldDisableButton = !hasMetCondition;
        } else if (isStep2) {
            // Step 2: Button disabled until cash balance >= 30
            hasMetCondition = typeof dollarBalance !== 'undefined' && dollarBalance >= 30;
            shouldDisableButton = !hasMetCondition;
        } else if (isStep4) {
            // Step 4: Button disabled until Basic Power Strip (level 0) is owned (level > 0)
            hasMetCondition = typeof powerUpgrades !== 'undefined' && powerUpgrades[0] && powerUpgrades[0].level > 0;
            shouldDisableButton = !hasMetCondition;
        } else if (isStep6) {
            // Step 6: Button disabled until USB Miner is owned (level > 0)
            hasMetCondition = typeof btcUpgrades !== 'undefined' && btcUpgrades[1] && btcUpgrades[1].level > 0;
            shouldDisableButton = !hasMetCondition;
        }
    } catch (e) {
        console.log('🎓 Error checking condition:', e);
        shouldDisableButton = true;
    }

    // Determine button styling
    const buttonStyle = shouldDisableButton
        ? "background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;"
        : "background: #FFD700; color: #000; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700;";

    // For steps that auto-advance (Step 3, Step 4, Step 5, and Step 6), don't show Got It button
    const isStep5 = step.id === 'btc_tab';
    const shouldHideButton = isStep3 || isStep4 || isStep5 || isStep6;

    card.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 15px;">👋</div>
        <h2 style="color: #FFD700; margin: 0 0 10px 0; font-size: 1.8rem;">${step.title}</h2>
        <p style="color: #ccc; font-size: 1rem; line-height: 1.6; margin: 15px 0;">${step.description}</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            <button onclick="skipTutorial()" style="background: rgba(100,100,100,0.5); color: #999; border: 2px solid #666; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700;">Skip Tutorial</button>
            ${!shouldHideButton ? `<button id="tutorial-got-it-btn" onclick="nextTutorialStep(); return false;" style="${buttonStyle}" ${shouldDisableButton ? 'disabled' : ''}}>Got It! →</button>` : ''}
        </div>
        <div style="margin-top: 15px; font-size: 0.8rem; color: #888;">Step ${tutorialData.currentStep + 1} of ${tutorialData.steps.length}</div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Ensure button disabled state is set correctly
    const gotItButton = document.getElementById('tutorial-got-it-btn');
    if (gotItButton) {
        gotItButton.disabled = shouldDisableButton;
    }

    // Highlight target elements
    highlightTargets(step.targets, step.highlightClass);

    // Apply custom highlighting if provided
    if (step.customHighlight && typeof step.customHighlight === 'function') {
        step.customHighlight();
    }
}

// Highlight tutorial targets
function highlightTargets(targets, highlightClass) {
    targets.forEach(targetId => {
        const element = document.getElementById(targetId);
        if (element) {
            element.classList.add('tutorial-highlight');
            element.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 30px rgba(255, 215, 0, 0.2)';
            element.style.zIndex = '9991';
        }
    });
}

// Remove old tutorial overlay
function removeOldTutorialOverlay() {
    const oldOverlay = document.getElementById('tutorial-overlay');
    if (oldOverlay) oldOverlay.remove();

    // Remove highlights from tutorial-highlight class
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
        el.style.boxShadow = '';
        el.style.zIndex = '';
    });

    // Remove animations and glow from custom highlighted elements (like SELL ALL buttons)
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('SELL ALL')) {
            btn.style.animation = '';
            btn.style.boxShadow = '';
            btn.style.zIndex = '';
        }
    });

    // Remove glow from crypto balance displays
    ['bal-btc', 'bal-eth', 'bal-doge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.boxShadow = '';
        }
    });

    // Remove glow from Basic Power Strip button
    const basicPowerStripBtn = document.getElementById('pow-0');
    if (basicPowerStripBtn) {
        basicPowerStripBtn.style.boxShadow = '';
        basicPowerStripBtn.style.border = '';
        basicPowerStripBtn.style.zIndex = '';
        basicPowerStripBtn.style.borderRadius = '';
    }

    // Remove glow from USB Miner button
    const usbMinerBtn = document.getElementById('up-1');
    if (usbMinerBtn) {
        usbMinerBtn.style.boxShadow = '';
        usbMinerBtn.style.border = '';
        usbMinerBtn.style.zIndex = '';
        usbMinerBtn.style.borderRadius = '';
    }
}

// Next tutorial step
function nextTutorialStep() {
    console.log('🎓 nextTutorialStep() called');
    const step = tutorialData.steps[tutorialData.currentStep];

    if (!step) {
        console.log('🎓 No step found, tutorial might be complete');
        return;
    }

    console.log(`🎓 Current step: ${step.id}, trigger: ${step.trigger}`);

    // Always allow advancing when "Got It!" is clicked
    // This overrides the trigger type - button click takes priority
    console.log(`🎓 Advancing from step ${step.id} (button clicked)`);
    tutorialData.currentStep++;
    saveTutorialState();
    showTutorialStep();
}

// Skip tutorial
function skipTutorial() {
    removeOldTutorialOverlay();
    tutorialData.completed = true;
    localStorage.setItem('tutorialCompleted', 'true');
    localStorage.removeItem('tutorialState');
    console.log('🎓 Tutorial skipped');
}

// Complete tutorial
function completeTutorial() {
    removeOldTutorialOverlay();
    tutorialData.completed = true;
    localStorage.setItem('tutorialCompleted', 'true');
    localStorage.removeItem('tutorialState');
    console.log('🎓 Tutorial completed!');
}

// Auto-advance when conditions are met
function checkTutorialProgress() {
    if (tutorialData.completed) return;

    const step = tutorialData.steps[tutorialData.currentStep];
    if (!step) return;

    // Always update button state for Steps 1 and 2, regardless of trigger type
    if (step.id === 'manual_hash') {
        const totalCryptoValue = getTotalCryptoValue();
        console.log(`🎓 Checking manual_hash condition: dollarBalance=${totalCryptoValue}`);

        // Update the "Got It!" button state for step 1
        const gotItButton = document.getElementById('tutorial-got-it-btn');
        const hasEarned30 = totalCryptoValue >= 30;

        console.log(`🎓 Button state update: hasEarned30=${hasEarned30}, dollarBalance=${totalCryptoValue}, button exists=${!!gotItButton}`);

        if (gotItButton) {
            if (hasEarned30) {
                console.log('🎓 ENABLING Got It button - earned $30! Setting disabled=false and adding glow.');
                // Enable button when $30 is reached
                gotItButton.disabled = false;
                gotItButton.removeAttribute('disabled');
                // Clear the inline style attribute completely and rebuild it
                gotItButton.setAttribute('style', 'background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;');
                console.log(`🎓 Button now disabled: ${gotItButton.disabled}, background: ${gotItButton.style.background}`);
            } else {
                // Keep button disabled until $30
                gotItButton.disabled = true;
                gotItButton.setAttribute('disabled', 'disabled');
                gotItButton.setAttribute('style', 'background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;');
            }
        }
    } else if (step.id === 'crypto_exchange') {
        // Step 2: Button disabled until player reaches $30 cash balance
        const gotItButton = document.getElementById('tutorial-got-it-btn');
        const hasCash30Plus = typeof dollarBalance !== 'undefined' && dollarBalance >= 30;

        console.log(`🎓 Step 2 button check: dollarBalance=${dollarBalance}, hasCash30Plus=${hasCash30Plus}, button exists=${!!gotItButton}`);

        if (gotItButton) {
            if (hasCash30Plus) {
                console.log('🎓 ENABLING Got It button - earned $30 cash! Setting disabled=false and adding glow.');
                gotItButton.disabled = false;
                // Use removeAttribute to ensure disabled is gone
                gotItButton.removeAttribute('disabled');
                // Clear the inline style attribute completely and rebuild it
                gotItButton.setAttribute('style', 'background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;');
            } else {
                // Keep button disabled and greyed out until $30 cash
                console.log('🎓 Step 2: Not enough cash yet. Button greyed out and disabled.');
                gotItButton.disabled = true;
                gotItButton.setAttribute('disabled', 'disabled');
                gotItButton.setAttribute('style', 'background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;');
            }
        }
    } else if (step.id === 'buy_power_supply') {
        // Step 4: Button disabled until Basic Power Strip is purchased (level > 0)
        const gotItButton = document.getElementById('tutorial-got-it-btn');
        const hasPowerUpgrade = typeof powerUpgrades !== 'undefined' && powerUpgrades[0] && powerUpgrades[0].level > 0;

        console.log(`🎓 Step 4 button check: powerUpgrades[0].level=${powerUpgrades[0] ? powerUpgrades[0].level : 'undefined'}, hasPowerUpgrade=${hasPowerUpgrade}, button exists=${!!gotItButton}`);

        if (gotItButton) {
            if (hasPowerUpgrade) {
                console.log('🎓 ENABLING Got It button - bought Basic Power Strip! Setting disabled=false and adding glow.');
                gotItButton.disabled = false;
                // Use removeAttribute to ensure disabled is gone
                gotItButton.removeAttribute('disabled');
                // Clear the inline style attribute completely and rebuild it
                gotItButton.setAttribute('style', 'background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;');
            } else {
                // Keep button disabled and greyed out until power upgrade purchased
                console.log('🎓 Step 4: Basic Power Strip not purchased yet. Button greyed out and disabled.');
                gotItButton.disabled = true;
                gotItButton.setAttribute('disabled', 'disabled');
                gotItButton.setAttribute('style', 'background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;');
            }
        }
    } else if (step.id === 'buy_usb_miner') {
        // Step 6: Button disabled until USB Miner is purchased (level > 0)
        const gotItButton = document.getElementById('tutorial-got-it-btn');
        const hasUSBMiner = typeof btcUpgrades !== 'undefined' && btcUpgrades[1] && btcUpgrades[1].level > 0;

        console.log(`🎓 Step 6 button check: btcUpgrades[1].level=${btcUpgrades[1] ? btcUpgrades[1].level : 'undefined'}, hasUSBMiner=${hasUSBMiner}, button exists=${!!gotItButton}`);

        if (gotItButton) {
            if (hasUSBMiner) {
                console.log('🎓 ENABLING Got It button - bought USB Miner! Setting disabled=false and adding glow.');
                gotItButton.disabled = false;
                // Use removeAttribute to ensure disabled is gone
                gotItButton.removeAttribute('disabled');
                // Clear the inline style attribute completely and rebuild it
                gotItButton.setAttribute('style', 'background: #FFD700 !important; color: #000 !important; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer !important; font-weight: 700; opacity: 1 !important; pointer-events: auto !important; box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), inset 0 0 10px rgba(255, 215, 0, 0.3) !important;');
            } else {
                // Keep button disabled and greyed out until USB Miner purchased
                console.log('🎓 Step 6: USB Miner not purchased yet. Button greyed out and disabled.');
                gotItButton.disabled = true;
                gotItButton.setAttribute('disabled', 'disabled');
                gotItButton.setAttribute('style', 'background: rgba(100,100,100,0.3); color: #666; border: none; padding: 10px 20px; border-radius: 6px; cursor: not-allowed; font-weight: 700; opacity: 0.5;');
            }
        }
    }
}

// Track manual hash clicks
let manualHashClicks = 0;
function trackManualHashClick() {
    manualHashClicks++;
    if (manualHashClicks >= 3) {
        tutorialData.hashClicksDone = true;
    }
}

// Track power upgrade button click
function trackPowerUpgradeClick() {
    tutorialData.powerUpgradeClicked = true;
    saveTutorialState();

    // If we're on Step 3 (power_button), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 2 && tutorialData.steps[2].id === 'power_button') {
        console.log('🎓 Power upgrade button clicked! Advancing tutorial.');
        nextTutorialStep();
    }
}

// Track Basic Power Strip purchase
function trackPowerStripPurchase() {
    // If we're on Step 4 (buy_power_supply), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 3 && tutorialData.steps[3].id === 'buy_power_supply') {
        console.log('🎓 Basic Power Strip purchased! Advancing tutorial.');
        nextTutorialStep();
    }
}

// Track BTC tab click
function trackBTCTabClick() {
    tutorialData.btcTabClicked = true;
    saveTutorialState();

    // If we're on Step 5 (btc_tab), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 4 && tutorialData.steps[4].id === 'btc_tab') {
        console.log('🎓 BTC tab clicked! Advancing tutorial.');
        nextTutorialStep();
    }
}

// Track USB Miner purchase
function trackUSBMinerPurchase() {
    // If we're on Step 6 (buy_usb_miner), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 5 && tutorialData.steps[5].id === 'buy_usb_miner') {
        console.log('🎓 USB Miner purchased! Advancing tutorial.');
        nextTutorialStep();
    }
}

// CSS for tutorial
const tutorialStyles = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(-30px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    .tutorial-highlight {
        position: relative;
        transition: all 0.3s ease;
    }

    .tutorial-highlight::before {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border: 2px dashed #FFD700;
        border-radius: 8px;
        animation: pulse 1s infinite;
        pointer-events: none;
    }

    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
        }
    }

    .tutorial-highlight-urgent {
        animation: wiggle 0.5s infinite;
    }

    @keyframes wiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-2deg); }
        75% { transform: rotate(2deg); }
    }

    @keyframes tutorial-flash {
        0%, 100% {
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }
        50% {
            box-shadow: 0 0 30px rgba(255, 215, 0, 1);
        }
    }


    /* Mobile responsive styles */
    @media (max-width: 768px) {
        .tutorial-card {
            max-width: 90vw !important;
            padding: 20px !important;
        }

        .tutorial-card h2 {
            font-size: 1.4rem !important;
        }

        .tutorial-card p {
            font-size: 0.9rem !important;
            line-height: 1.4 !important;
        }

        .tutorial-card button {
            font-size: 0.85rem !important;
            padding: 8px 15px !important;
        }

        .tutorial-card > div:first-child {
            font-size: 1.5rem !important;
        }
    }

    @media (max-width: 480px) {
        .tutorial-card {
            max-width: 95vw !important;
            padding: 15px !important;
        }

        .tutorial-card h2 {
            font-size: 1.2rem !important;
        }

        .tutorial-card p {
            font-size: 0.85rem !important;
            margin: 10px 0 !important;
        }

        .tutorial-card button {
            font-size: 0.75rem !important;
            padding: 6px 12px !important;
            flex: 1;
        }

        .tutorial-card > div:first-child {
            font-size: 1.2rem !important;
            margin-bottom: 10px !important;
        }

        .tutorial-card > div:last-child {
            font-size: 0.7rem !important;
            margin-top: 10px !important;
        }
    }
`;

// Add tutorial styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = tutorialStyles;
document.head.appendChild(styleSheet);

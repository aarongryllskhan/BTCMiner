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
        btcTabClicked: tutorialData.btcTabClicked,
        ethTabClicked: tutorialData.ethTabClicked,
        dogeTabClicked: tutorialData.dogeTabClicked
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
            tutorialData.ethTabClicked = state.ethTabClicked || false;
            tutorialData.dogeTabClicked = state.dogeTabClicked || false;
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
    btcTabClicked: false,
    ethTabClicked: false,
    dogeTabClicked: false,
    steps: [
        {
            id: 'manual_hash',
            title: 'Start Mining!',
            description: 'Click the manual hash buttons AND/OR use the AUTO CLICKER to earn cryptocurrency. Earn at least $30 to continue! 💰',
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

                // Also highlight the cash balance display
                const cashEl = document.getElementById('player-cash-display');
                if (cashEl) {
                    cashEl.style.cssText = `
                        border: 3px dashed #FFD700 !important;
                        box-shadow: 0 0 30px rgba(255, 215, 0, 0.9) !important;
                        padding: 8px !important;
                        border-radius: 6px !important;
                    `;
                }

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
                // Use a longer delay to ensure the power shop is fully rendered
                setTimeout(() => {
                    const basicPowerStripBtn = document.getElementById('pow-0');

                    if (basicPowerStripBtn) {
                        // Apply aggressive highlight styling with !important
                        basicPowerStripBtn.style.cssText = `
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;
                        console.log('🎓 Basic Power Strip highlighted successfully via ID pow-0');
                    } else {
                        console.log('🎓 Could not find Basic Power Strip button with ID pow-0 - trying text search fallback');
                        // Fallback: search by text content
                        let found = false;
                        document.querySelectorAll('button.u-item').forEach(el => {
                            if (el.textContent.includes('Basic Power Strip')) {
                                el.style.cssText = `
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;
                                console.log('🎓 Basic Power Strip found and highlighted via text search');
                                found = true;
                            }
                        });
                        if (!found) {
                            console.log('🎓 Basic Power Strip button not found - power shop may not be rendered yet');
                        }
                    }
                }, 300);
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
                // Use a longer delay to ensure the BTC shop is fully rendered
                setTimeout(() => {
                    const usbMinerBtn = document.getElementById('up-1');

                    if (usbMinerBtn) {
                        // Apply aggressive highlight styling with !important
                        usbMinerBtn.style.cssText = `
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;
                        console.log('🎓 USB Miner highlighted successfully via ID up-1');
                    } else {
                        console.log('🎓 Could not find USB Miner button with ID up-1 - trying text search fallback');
                        // Fallback: search by text content
                        let found = false;
                        document.querySelectorAll('button.u-item').forEach(el => {
                            if (el.textContent.includes('USB Miner')) {
                                el.style.cssText = `
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;
                                console.log('🎓 USB Miner found and highlighted via text search');
                                found = true;
                            }
                        });
                        if (!found) {
                            console.log('🎓 USB Miner button not found - BTC shop may not be rendered yet');
                        }
                    }
                }, 300);
            }
        },
        {
            id: 'buy_eth_miner',
            title: 'Mine Ethereum',
            description: 'Now let\'s diversify! Click the ETH tab to see Ethereum mining equipment.',
            targets: ['eth-tab-btn'],
            trigger: 'manual',
            nextCondition: () => typeof tutorialData !== 'undefined' && tutorialData.ethTabClicked,
            highlightClass: 'tutorial-highlight-urgent',
            autoAdvance: true,
            hideGotItButton: true
        },
        {
            id: 'buy_gpu_rig',
            title: 'Buy Single GPU Rig',
            description: 'In the ETH tab, purchase a "Single GPU Rig" to start mining Ethereum. You can\'t proceed without buying one!',
            targets: ['eth-shop'],
            trigger: 'manual',
            nextCondition: () => typeof ethUpgrades !== 'undefined' && ethUpgrades[1] && ethUpgrades[1].level > 0,
            highlightClass: 'tutorial-highlight-urgent',
            autoAdvance: true,
            hideGotItButton: true,
            customHighlight: () => {
                setTimeout(() => {
                    const gpuRigBtn = document.getElementById('up-1-eth') || document.getElementById('ue-1');
                    if (gpuRigBtn) {
                        gpuRigBtn.style.cssText = `
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;
                        console.log('🎓 Single GPU Rig highlighted successfully');
                    } else {
                        console.log('🎓 Could not find GPU Rig button - trying text search fallback');
                        let found = false;
                        document.querySelectorAll('button.u-item').forEach(el => {
                            if (el.textContent.includes('Single GPU Rig')) {
                                el.style.cssText = `
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;
                                console.log('🎓 Single GPU Rig found and highlighted via text search');
                                found = true;
                            }
                        });
                        if (!found) {
                            console.log('🎓 Single GPU Rig button not found - ETH shop may not be rendered yet');
                        }
                    }
                }, 300);
            }
        },
        {
            id: 'buy_doge_miner',
            title: 'Mine Dogecoin',
            description: 'Let\'s complete the trifecta! Click the DOGE tab to see Dogecoin mining equipment.',
            targets: ['doge-tab-btn'],
            trigger: 'manual',
            nextCondition: () => typeof tutorialData !== 'undefined' && tutorialData.dogeTabClicked,
            highlightClass: 'tutorial-highlight-urgent',
            autoAdvance: true,
            hideGotItButton: true
        },
        {
            id: 'buy_scrypt_miner',
            title: 'Buy Basic Scrypt Miner',
            description: 'In the DOGE tab, purchase a "Basic Scrypt Miner" to start mining Dogecoin. You can\'t proceed without buying one!',
            targets: ['doge-shop'],
            trigger: 'manual',
            nextCondition: () => typeof dogeUpgrades !== 'undefined' && dogeUpgrades[1] && dogeUpgrades[1].level > 0,
            highlightClass: 'tutorial-highlight-urgent',
            autoAdvance: true,
            hideGotItButton: true,
            customHighlight: () => {
                setTimeout(() => {
                    const scryptBtn = document.getElementById('up-1-doge') || document.getElementById('ud-1');
                    if (scryptBtn) {
                        scryptBtn.style.cssText = `
                            border: 3px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                            position: relative !important;
                            z-index: 9991 !important;
                            outline: 2px solid #FFD700 !important;
                            outline-offset: 2px !important;
                        `;
                        console.log('🎓 Basic Scrypt Miner highlighted successfully');
                    } else {
                        console.log('🎓 Could not find Scrypt Miner button - trying text search fallback');
                        let found = false;
                        document.querySelectorAll('button.u-item').forEach(el => {
                            if (el.textContent.includes('Basic Scrypt Miner')) {
                                el.style.cssText = `
                                    border: 3px dashed #FFD700 !important;
                                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.2) !important;
                                    position: relative !important;
                                    z-index: 9991 !important;
                                    outline: 2px solid #FFD700 !important;
                                    outline-offset: 2px !important;
                                `;
                                console.log('🎓 Basic Scrypt Miner found and highlighted via text search');
                                found = true;
                            }
                        });
                        if (!found) {
                            console.log('🎓 Basic Scrypt Miner button not found - DOGE shop may not be rendered yet');
                        }
                    }
                }, 300);
            }
        },
        {
            id: 'hashrate_display',
            title: 'Monitor Your Hashrate',
            description: 'These bars display your current HASHRATE in $/sec for each cryptocurrency. This shows how much value you\'re earning per second from your miners!',
            targets: [],
            trigger: 'manual',
            nextCondition: () => true,
            highlightClass: 'tutorial-highlight',
            customHighlight: () => {
                // Scroll to show the hashrate bars
                setTimeout(() => {
                    const hashrateBtc = document.getElementById('btc-hashrate-bar');
                    if (hashrateBtc) {
                        // Find the flex container that directly holds all three hashrate boxes
                        // btc-hashrate-bar -> parent (bar container) -> parent (single crypto box) -> parent (flex container with all three)
                        const hashrateContainer = hashrateBtc.parentElement?.parentElement?.parentElement;

                        if (hashrateContainer) {
                            // Apply yellow dashed highlight to the entire hashrate display
                            hashrateContainer.style.cssText = `
                                border: 3px dashed #FFD700 !important;
                                box-shadow: 0 0 30px rgba(255, 215, 0, 0.8) !important;
                                padding: 8px !important;
                                border-radius: 8px !important;
                                position: relative !important;
                                width: 100% !important;
                                display: flex !important;
                                justify-content: center !important;
                                gap: 8px !important;
                                flex-wrap: nowrap !important;
                                box-sizing: border-box !important;
                            `;
                            console.log('🎓 Hashrate display highlighted with yellow dashed border');
                        }

                        // Scroll to show the entire hashrate section with labels and bars
                        hashrateBtc.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        },
        {
            id: 'crypto_distribution',
            title: 'Cryptocurrency Distribution',
            description: 'These colored bars show your current distribution of BTC, ETH, and DOGE. As you mine more cryptocurrencies, the proportions will shift based on which miners you own!',
            targets: [],
            trigger: 'manual',
            nextCondition: () => true,
            highlightClass: 'tutorial-highlight',
            customHighlight: () => {
                // Scroll to show the distribution bars
                setTimeout(() => {
                    const btcBar = document.getElementById('btc-bar');
                    if (btcBar) {
                        // Find the flex container that directly holds all three distribution boxes
                        // btc-bar -> parent (bar container) -> parent (single crypto box) -> parent (flex container with all three)
                        const distributionContainer = btcBar.parentElement?.parentElement?.parentElement;

                        if (distributionContainer) {
                            // Apply yellow dashed highlight to the entire distribution display
                            distributionContainer.style.cssText = `
                                border: 3px dashed #FFD700 !important;
                                box-shadow: 0 0 30px rgba(255, 215, 0, 0.8) !important;
                                padding: 8px !important;
                                border-radius: 8px !important;
                                position: relative !important;
                                width: 100% !important;
                                display: flex !important;
                                justify-content: center !important;
                                gap: clamp(16px, 5vw, 48px) !important;
                                flex-wrap: nowrap !important;
                                box-sizing: border-box !important;
                            `;
                            console.log('🎓 Crypto distribution display highlighted with yellow dashed border');
                        }

                        // Scroll to show the entire distribution section
                        btcBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        },
        {
            id: 'portfolio_chart',
            title: 'Track Your Portfolio',
            description: 'This chart displays your total net worth over time, including your cash balance and all cryptocurrency holdings. Watch it grow as you expand your mining operation!',
            targets: ['nw-chart-container'],
            trigger: 'manual',
            nextCondition: () => true,
            highlightClass: 'tutorial-highlight',
            customHighlight: () => {
                // Highlight the portfolio chart container
                setTimeout(() => {
                    const chartContainer = document.getElementById('nw-chart-container');
                    if (chartContainer) {
                        // Apply yellow dashed highlight to the chart with box-sizing to preserve dimensions
                        chartContainer.style.cssText = `
                            border: 2px dashed #FFD700 !important;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8) !important;
                            border-radius: 6px !important;
                            position: relative !important;
                            box-sizing: border-box !important;
                        `;
                        console.log('🎓 Portfolio chart highlighted with yellow dashed border');

                        // Scroll to show the portfolio chart
                        chartContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        },
        {
            id: 'explore_minigames',
            title: 'Discover Minigames',
            description: 'Click the MINIGAMES tab to unlock fun side activities! Earn extra rewards by playing Packet Interceptor, Network Destruction, and more to boost your earnings.',
            targets: ['minigames-tab-btn'],
            trigger: 'manual',
            nextCondition: () => true,
            highlightClass: 'tutorial-highlight',
            autoAdvance: true,
            hideGotItButton: true,
            customHighlight: () => {
                // Scroll to show the minigames tab on mobile
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        const minigamesBtn = document.getElementById('minigames-tab-btn');
                        if (minigamesBtn) {
                            minigamesBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 300);
                }
            }
        },
        {
            id: 'tutorial_complete',
            title: 'You\'re Ready!',
            description: 'Excellent! You\'ve learned the core mechanics. As you mine, you will see your progress towards RUGPULL filling up. Once the goal has been achieved, press the button to be prompted to sacrifice your progress and earn Corrupt Tokens—powerful upgrades that boost your earnings and apply to future playthroughs! Keep buying miners and upgrading power to grow your empire. Good luck!',
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
        // Scroll down to show manual hash buttons
        setTimeout(() => {
            const manualHashBtn = document.getElementById('manual-hash-btc-btn');
            if (manualHashBtn) {
                manualHashBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
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

    // Handle mobile scrolling for step 1 immediately
    if (step.id === 'manual_hash' && window.innerWidth <= 768) {
        setTimeout(() => {
            const autoclickerBtn = document.getElementById('autoclicker-btn');
            if (autoclickerBtn) {
                const btnRect = autoclickerBtn.getBoundingClientRect();
                const scrollPos = window.scrollY + btnRect.top - (window.innerHeight - btnRect.height - 300);
                window.scrollTo({ top: scrollPos, behavior: 'smooth' });
                console.log('🎓 Step 1 immediate scroll - scrollPos:', scrollPos);
            }
        }, 100);
    }

    // Remove previous tutorial overlay
    removeOldTutorialOverlay();

    // Create overlay (allows clicks to pass through)
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    const isMobile = window.innerWidth <= 768;
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 9990;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: ${isMobile ? 'flex-end' : 'center'};
        pointer-events: none;
        ${isMobile ? 'overflow-y: auto;' : ''}
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
        ${isMobile ? 'margin-bottom: 15px; max-height: 45vh; overflow-y: auto;' : ''}
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
    const shouldHideButton = isStep3 || isStep4 || isStep5 || isStep6 || step.hideGotItButton;

    card.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 15px;">👋</div>
        <h2 style="color: #FFD700; margin: 0 0 10px 0; font-size: 1.8rem;">${step.title}</h2>
        <p style="color: #ccc; font-size: 1rem; line-height: 1.6; margin: 15px 0;">${step.description}</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            <button onclick="skipTutorial()" style="background: rgba(100,100,100,0.5); color: #999; border: 2px solid #666; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 700;">Skip Tutorial</button>
            ${!shouldHideButton ? `<button id="tutorial-got-it-btn" onclick="nextTutorialStep(); return false;" style="${buttonStyle}" ${shouldDisableButton ? 'disabled' : ''}}>Got It! →</button>` : ''}
        </div>
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
        // Use a small delay to ensure DOM elements are rendered
        setTimeout(() => {
            step.customHighlight();
        }, 50);
    }

    // Scroll to target element on mobile for better visibility
    if (isStep1) {
        const autoclickerBtn = document.getElementById('autoclicker-btn');
        if (autoclickerBtn && window.innerWidth <= 768) {
            setTimeout(() => {
                const btnRect = autoclickerBtn.getBoundingClientRect();
                const scrollPos = window.scrollY + btnRect.top - (window.innerHeight - btnRect.height - 300);
                window.scrollTo({ top: scrollPos, behavior: 'smooth' });
                console.log('🎓 Step 1 scroll triggered - scrollPos:', scrollPos);
            }, 800);
        }
    } else if (isStep2) {
        const exchangeBtn = document.getElementById('crypto-exchange-btn');
        if (exchangeBtn && window.innerWidth <= 768) {
            setTimeout(() => {
                const btnRect = exchangeBtn.getBoundingClientRect();
                const scrollPos = window.scrollY + btnRect.top - (window.innerHeight - btnRect.height - 350);
                window.scrollTo({ top: scrollPos, behavior: 'smooth' });
            }, 600);
        }
    } else if (isStep3) {
        const powerBtn = document.getElementById('power-upgrade-btn');
        if (powerBtn && window.innerWidth <= 768) {
            setTimeout(() => {
                const btnRect = powerBtn.getBoundingClientRect();
                const scrollPos = window.scrollY + btnRect.top - 120;
                window.scrollTo({ top: scrollPos, behavior: 'smooth' });
                console.log('🎓 Step 3 scroll triggered - scrollPos:', scrollPos);
            }, 600);
        }
    } else if (isStep5) {
        const btcBtn = document.getElementById('btc-tab-btn');
        if (btcBtn && window.innerWidth <= 768) {
            setTimeout(() => {
                const btnRect = btcBtn.getBoundingClientRect();
                const scrollPos = window.scrollY + btnRect.top - 120;
                window.scrollTo({ top: scrollPos, behavior: 'smooth' });
            }, 600);
        }
    } else if (step.id === 'hashrate_display') {
        // Scroll to show hashrate bars on all screen sizes
        setTimeout(() => {
            const hashrateBtc = document.getElementById('btc-hashrate-bar');
            if (hashrateBtc) {
                hashrateBtc.scrollIntoView({ behavior: 'smooth', block: 'center' });
                console.log('🎓 Hashrate display step scroll triggered');
            }
        }, 600);
    } else if (step.id === 'tutorial_complete' && window.innerWidth <= 768) {
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            console.log('🎓 Step 7 scroll to top triggered');
        }, 600);
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

    // Get current step to check if we should preserve highlights
    const step = tutorialData.steps[tutorialData.currentStep];
    const isCurrentStepPowerSupply = step && step.id === 'buy_power_supply';
    const isCurrentStepUSBMiner = step && step.id === 'buy_usb_miner';

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

    // Only remove glow from Basic Power Strip button if we're NOT on that step
    if (!isCurrentStepPowerSupply) {
        const basicPowerStripBtn = document.getElementById('pow-0');
        if (basicPowerStripBtn) {
            basicPowerStripBtn.style.boxShadow = '';
            basicPowerStripBtn.style.border = '';
            basicPowerStripBtn.style.zIndex = '';
            basicPowerStripBtn.style.borderRadius = '';
            basicPowerStripBtn.style.outline = '';
            basicPowerStripBtn.style.outlineOffset = '';
            basicPowerStripBtn.style.position = '';
        }
    }

    // Only remove glow from USB Miner button if we're NOT on that step
    if (!isCurrentStepUSBMiner) {
        const usbMinerBtn = document.getElementById('up-1');
        if (usbMinerBtn) {
            usbMinerBtn.style.boxShadow = '';
            usbMinerBtn.style.border = '';
            usbMinerBtn.style.zIndex = '';
            usbMinerBtn.style.borderRadius = '';
            usbMinerBtn.style.outline = '';
            usbMinerBtn.style.outlineOffset = '';
            usbMinerBtn.style.position = '';
        }
    }

    // Remove GPU Rig highlighting if not on that step
    const isCurrentStepGPURig = step && step.id === 'buy_gpu_rig';
    if (!isCurrentStepGPURig) {
        // Try multiple possible selectors for GPU Rig button
        const possibleSelectors = ['up-1-eth', 'ue-1', 'eth-upgrade-1'];
        possibleSelectors.forEach(selector => {
            const gpuRigBtn = document.getElementById(selector);
            if (gpuRigBtn) {
                gpuRigBtn.style.cssText = '';
                gpuRigBtn.removeAttribute('style');
            }
        });

        // Also search by text content as fallback
        document.querySelectorAll('button.u-item').forEach(btn => {
            if (btn.textContent.includes('Single GPU Rig')) {
                btn.style.cssText = '';
                btn.removeAttribute('style');
            }
        });
    }

    // Remove Scrypt Miner highlighting if not on that step
    const isCurrentStepScryptMiner = step && step.id === 'buy_scrypt_miner';
    if (!isCurrentStepScryptMiner) {
        // Try multiple possible selectors for Scrypt Miner button
        const possibleSelectors = ['up-1-doge', 'ud-1', 'doge-upgrade-1'];
        possibleSelectors.forEach(selector => {
            const scryptBtn = document.getElementById(selector);
            if (scryptBtn) {
                scryptBtn.style.cssText = '';
                scryptBtn.removeAttribute('style');
            }
        });

        // Also search by text content as fallback
        document.querySelectorAll('button.u-item').forEach(btn => {
            if (btn.textContent.includes('Basic Scrypt Miner')) {
                btn.style.cssText = '';
                btn.removeAttribute('style');
            }
        });
    }

    // Remove hashrate display highlighting if not on that step
    const isCurrentStepHashrate = step && step.id === 'hashrate_display';
    if (!isCurrentStepHashrate) {
        // Clear only the highlight styles, preserve original layout
        const hashrateBtc = document.getElementById('btc-hashrate-bar');
        if (hashrateBtc) {
            const hashrateContainer = hashrateBtc.parentElement?.parentElement?.parentElement;

            if (hashrateContainer) {
                hashrateContainer.style.border = '';
                hashrateContainer.style.boxShadow = '';
                hashrateContainer.style.padding = '';
                hashrateContainer.style.borderRadius = '';
                hashrateContainer.style.position = '';
            }
        }
    }

    // Remove crypto distribution highlighting if not on that step
    const isCurrentStepDistribution = step && step.id === 'crypto_distribution';
    if (!isCurrentStepDistribution) {
        // Clear only the highlight styles, preserve original layout
        const btcBar = document.getElementById('btc-bar');
        if (btcBar) {
            const distributionContainer = btcBar.parentElement?.parentElement?.parentElement;

            if (distributionContainer) {
                distributionContainer.style.border = '';
                distributionContainer.style.boxShadow = '';
                distributionContainer.style.padding = '';
                distributionContainer.style.borderRadius = '';
                distributionContainer.style.position = '';
            }
        }
    }

    // Remove portfolio chart highlighting if not on that step
    const isCurrentStepChart = step && step.id === 'portfolio_chart';
    if (!isCurrentStepChart) {
        // Clear chart highlight
        const chartContainer = document.getElementById('nw-chart-container');
        if (chartContainer) {
            chartContainer.style.border = '';
            chartContainer.style.boxShadow = '';
            chartContainer.style.borderRadius = '';
            chartContainer.style.position = '';
        }
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
    } else if (step.id === 'buy_eth_miner') {
        // Step 7: Auto-advance when ETH tab is clicked
        if (tutorialData.ethTabClicked) {
            console.log('🎓 Step 7: ETH tab clicked! Auto-advancing.');
            nextTutorialStep();
        }
    } else if (step.id === 'buy_gpu_rig') {
        // Step 8: Auto-advance when GPU Rig is purchased (level > 0)
        const hasGPURig = typeof ethUpgrades !== 'undefined' && ethUpgrades[1] && ethUpgrades[1].level > 0;
        if (hasGPURig) {
            console.log('🎓 Step 8: Single GPU Rig purchased! Auto-advancing.');
            nextTutorialStep();
        }
    } else if (step.id === 'buy_doge_miner') {
        // Step 9: Auto-advance when DOGE tab is clicked
        if (tutorialData.dogeTabClicked) {
            console.log('🎓 Step 9: DOGE tab clicked! Auto-advancing.');
            nextTutorialStep();
        }
    } else if (step.id === 'buy_scrypt_miner') {
        // Step 10: Auto-advance when Scrypt Miner is purchased (level > 0)
        const hasScryptMiner = typeof dogeUpgrades !== 'undefined' && dogeUpgrades[1] && dogeUpgrades[1].level > 0;
        if (hasScryptMiner) {
            console.log('🎓 Step 10: Basic Scrypt Miner purchased! Auto-advancing.');
            nextTutorialStep();
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

// Track ETH tab click
function trackETHTabClick() {
    tutorialData.ethTabClicked = true;
    saveTutorialState();

    // If we're on Step 7 (buy_eth_miner), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 6 && tutorialData.steps[6].id === 'buy_eth_miner') {
        console.log('🎓 ETH tab clicked! Advancing tutorial.');
        nextTutorialStep();
    }
}

// Track DOGE tab click
function trackDOGETabClick() {
    tutorialData.dogeTabClicked = true;
    saveTutorialState();

    // If we're on Step 9 (buy_doge_miner), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 8 && tutorialData.steps[8].id === 'buy_doge_miner') {
        console.log('🎓 DOGE tab clicked! Advancing tutorial.');
        nextTutorialStep();
    }
}

// Track minigames tab click
function trackMinigamesTabClick() {
    // If we're on the explore_minigames step, advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 13 && tutorialData.steps[13].id === 'explore_minigames') {
        console.log('🎓 Minigames tab clicked! Auto-advancing tutorial.');
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

// Track GPU Rig purchase
function trackGPURigPurchase() {
    // If we're on Step 8 (buy_gpu_rig), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 7 && tutorialData.steps[7].id === 'buy_gpu_rig') {
        console.log('🎓 Single GPU Rig purchased! Advancing tutorial.');

        // Clear GPU Rig highlighting immediately - try multiple selectors
        const possibleSelectors = ['up-1-eth', 'ue-1', 'eth-upgrade-1'];
        possibleSelectors.forEach(selector => {
            const gpuRigBtn = document.getElementById(selector);
            if (gpuRigBtn) {
                gpuRigBtn.style.cssText = '';
                gpuRigBtn.removeAttribute('style');
            }
        });

        // Also try searching by text content as fallback
        document.querySelectorAll('button.u-item').forEach(btn => {
            if (btn.textContent.includes('Single GPU Rig')) {
                btn.style.cssText = '';
                btn.removeAttribute('style');
            }
        });

        nextTutorialStep();
    }
}

// Track Scrypt Miner purchase
function trackScryptMinerPurchase() {
    // If we're on Step 10 (buy_scrypt_miner), advance to next step
    if (!tutorialData.completed && tutorialData.currentStep === 9 && tutorialData.steps[9].id === 'buy_scrypt_miner') {
        console.log('🎓 Basic Scrypt Miner purchased! Advancing tutorial.');

        // Clear Scrypt Miner highlighting immediately - try multiple selectors
        const possibleSelectors = ['up-1-doge', 'ud-1', 'doge-upgrade-1'];
        possibleSelectors.forEach(selector => {
            const scryptBtn = document.getElementById(selector);
            if (scryptBtn) {
                scryptBtn.style.cssText = '';
                scryptBtn.removeAttribute('style');
            }
        });

        // Also try searching by text content as fallback
        document.querySelectorAll('button.u-item').forEach(btn => {
            if (btn.textContent.includes('Basic Scrypt Miner')) {
                btn.style.cssText = '';
                btn.removeAttribute('style');
            }
        });

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

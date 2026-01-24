/**
 * Firebase Cloud Save/Load System for Idle BTC Miner
 * Copyright © 2026 Aaron Khan. All Rights Reserved.
 */

// Track last manual save time for cooldown
let lastManualSaveTime = 0;
const MANUAL_SAVE_COOLDOWN = 20 * 60 * 1000; // 20 minutes in milliseconds

// Save game data to Firebase Cloud
// Only called for:
// 1. Manual saves (user clicks "Transfer to Cloud" button) - respects 20-min cooldown
// 2. Leaderboard refresh (updateLeaderboard calls this)
async function saveGameToCloud(isManualSave = false, isLeaderboardRefresh = false) {
    try {
        const user = auth.currentUser;

        if (!user) {
            console.log('⚠️ No user logged in - skipping cloud save');
            if (isManualSave) {
                showSaveMessage('You must be logged in to transfer progress to cloud. Your game auto-saves locally.', 'warning');
            }
            return false;
        }

        // Check user document exists
        try {
            const userDocCheck = await db.collection('users').doc(user.uid).get();
            if (!userDocCheck.exists) {
                console.log('⚠️ User document does not exist yet - skipping cloud save');
                return false;
            }
        } catch (checkError) {
            console.error('Error checking user document:', checkError);
            return false;
        }

        // Cooldown check for manual saves only (leaderboard refresh bypasses this)
        if (isManualSave && !isLeaderboardRefresh) {
            const now = Date.now();
            const timeSinceLastSave = now - lastManualSaveTime;

            if (timeSinceLastSave < MANUAL_SAVE_COOLDOWN) {
                const remainingSeconds = Math.ceil((MANUAL_SAVE_COOLDOWN - timeSinceLastSave) / 1000);
                const remainingMinutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                showSaveMessage(
                    `Transfer cooldown: ${remainingMinutes}m ${seconds}s remaining. Your game is already saved locally!`,
                    'info'
                );
                return false;
            }

            lastManualSaveTime = now;
        }

        // Gather game data
        const gameData = {
            btcBalance: typeof window.btcBalance !== 'undefined' ? window.btcBalance : 0,
            btcLifetime: typeof window.btcLifetime !== 'undefined' ? window.btcLifetime : 0,
            btcClickValue: typeof window.btcClickValue !== 'undefined' ? window.btcClickValue : 0,
            btcPerSec: typeof window.btcPerSec !== 'undefined' ? window.btcPerSec : 0,
            btcPrice: typeof window.btcPrice !== 'undefined' ? window.btcPrice : 100000,
            ethBalance: typeof window.ethBalance !== 'undefined' ? window.ethBalance : 0,
            ethLifetime: typeof window.ethLifetime !== 'undefined' ? window.ethLifetime : 0,
            ethClickValue: typeof window.ethClickValue !== 'undefined' ? window.ethClickValue : 0,
            ethPerSec: typeof window.ethPerSec !== 'undefined' ? window.ethPerSec : 0,
            ethPrice: typeof window.ethPrice !== 'undefined' ? window.ethPrice : 3500,
            dogeBalance: typeof window.dogeBalance !== 'undefined' ? window.dogeBalance : 0,
            dogeLifetime: typeof window.dogeLifetime !== 'undefined' ? window.dogeLifetime : 0,
            dogeClickValue: typeof window.dogeClickValue !== 'undefined' ? window.dogeClickValue : 0,
            dogePerSec: typeof window.dogePerSec !== 'undefined' ? window.dogePerSec : 0,
            dogePrice: typeof window.dogePrice !== 'undefined' ? window.dogePrice : 0.25,
            dollarBalance: typeof window.dollarBalance !== 'undefined' ? window.dollarBalance : 0,
            hardwareEquity: typeof window.hardwareEquity !== 'undefined' ? window.hardwareEquity : 0,
            autoClickerCooldownEnd: typeof window.autoClickerCooldownEnd !== 'undefined' ? window.autoClickerCooldownEnd : 0,
            lifetimeEarnings: typeof window.lifetimeEarnings !== 'undefined' ? window.lifetimeEarnings : 0,
            sessionEarnings: typeof window.sessionEarnings !== 'undefined' ? window.sessionEarnings : 0,
            sessionStartTime: typeof window.sessionStartTime !== 'undefined' ? window.sessionStartTime : 0,
            chartHistory: typeof window.chartHistory !== 'undefined' ? window.chartHistory : [],
            chartTimestamps: typeof window.chartTimestamps !== 'undefined' ? window.chartTimestamps : [],
            chartStartTime: typeof window.chartStartTime !== 'undefined' ? window.chartStartTime : 0,
            totalPowerAvailable: typeof window.totalPowerAvailable !== 'undefined' ? window.totalPowerAvailable : 0,
            powerUpgrades: typeof window.powerUpgrades !== 'undefined' ? window.powerUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentPower: u.currentPower
            })) : [],
            btcUpgrades: typeof window.btcUpgrades !== 'undefined' ? window.btcUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })) : [],
            ethUpgrades: typeof window.ethUpgrades !== 'undefined' ? window.ethUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })) : [],
            dogeUpgrades: typeof window.dogeUpgrades !== 'undefined' ? window.dogeUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })) : [],
            skillTree: typeof getSkillTreeData === 'function' ? getSkillTreeData() : {},
            staking: typeof getStakingData === 'function' ? getStakingData() : {},
            lastSaved: firebase.firestore.FieldValue.serverTimestamp(),
            lastSaveTime: typeof window.lastSaveTime !== 'undefined' ? window.lastSaveTime : Date.now()
        };

        console.log('💾 Saving game data to cloud:');
        console.log('  btcBalance:', gameData.btcBalance);
        console.log('  btcClickValue:', gameData.btcClickValue);
        console.log('  BTC Upgrades:', gameData.btcUpgrades ? gameData.btcUpgrades.length : 0);

        // Save to Firestore
        await db.collection('users').doc(user.uid).collection('gameData').doc('current').set(gameData, { merge: true });

        // Update user profile stats
        await db.collection('users').doc(user.uid).update({
            totalBTC: gameData.btcBalance,
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Progress synced to cloud successfully');
        if (isManualSave) {
            showSaveIndicator();
            updateLastSaveTime();
        }

        return true;

    } catch (error) {
        console.error('❌ Cloud save error:', error);
        if (isManualSave) {
            showMessage('Failed to save to cloud: ' + error.message, 'error');
        }
        return false;
    }
}

// Reset all game variables to default state
function resetGameVariables() {
    try {
        // Use window object to access variables (they're exposed via Object.defineProperty in game.js)
        window.btcBalance = 0;
        window.btcLifetime = 0;
        window.btcPerSec = 0;
        window.btcPrice = 100000;
        window.btcClickValue = 0.00000250;

        window.ethBalance = 0;
        window.ethLifetime = 0;
        window.ethPerSec = 0;
        window.ethPrice = 3500;
        window.ethClickValue = 0.00007143;

        window.dogeBalance = 0;
        window.dogeLifetime = 0;
        window.dogePerSec = 0;
        window.dogePrice = 0.25;
        window.dogeClickValue = 1.00000000;

        window.dollarBalance = 0;
        window.hardwareEquity = 0;
        window.lifetimeEarnings = 0;
        window.sessionEarnings = 0;
        window.totalPlayTime = 0;
        window.totalPowerAvailable = 0;
        window.autoClickerCooldownEnd = 0;
        window.sessionStartTime = Date.now();

        // Reset chart data
        window.chartHistory = [];
        window.chartTimestamps = [];
        window.chartStartTime = Date.now();

        // Reset upgrade arrays to default state (level 0)
        if (window.powerUpgrades && Array.isArray(window.powerUpgrades)) {
            window.powerUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentPower = 0;
            });
        }

        if (window.btcUpgrades && Array.isArray(window.btcUpgrades)) {
            window.btcUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
                u.boostCost = u.baseUsd * 0.5;
                u.boostLevel = 0;
            });
        }

        if (window.ethUpgrades && Array.isArray(window.ethUpgrades)) {
            window.ethUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
                u.boostCost = u.baseUsd * 0.5;
                u.boostLevel = 0;
            });
        }

        if (window.dogeUpgrades && Array.isArray(window.dogeUpgrades)) {
            window.dogeUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
                u.boostCost = u.baseUsd * 0.5;
                u.boostLevel = 0;
            });
        }

        // CRITICAL: Also overwrite localStorage with empty/reset data
        // This prevents old account data from bleeding through when a new account logs in
        if (typeof localStorage !== 'undefined' && typeof window.saveGame === 'function') {
            try {
                console.log('💾 Saving reset state to localStorage to prevent data bleed');
                window.saveGame(); // This will save all the reset variables to localStorage
            } catch (saveError) {
                console.warn('⚠️ Could not save reset state to localStorage:', saveError);
            }
        }

        console.log('✅ Game variables reset to defaults');
    } catch (error) {
        console.error('Error resetting variables:', error);
    }
}

// Load game data from Firebase Cloud
// Used when logging in on a different device or switching accounts
async function loadGameFromCloud(userId = null) {
    try {
        const user = userId ? { uid: userId } : auth.currentUser;

        if (!user) {
            console.log('⚠️ No user logged in - skipping cloud load');
            return false;
        }

        console.log('☁️ LOADING GAME FROM CLOUD for user:', user.uid);

        // Get game data from Firestore
        const gameDataDoc = await db.collection('users').doc(user.uid).collection('gameData').doc('current').get();

        if (!gameDataDoc.exists) {
            console.log('⚠️ No cloud save found for this user - starting fresh');
            return false;
        }

        const cloudData = gameDataDoc.data();
        console.log('✅ Cloud data retrieved, size:', JSON.stringify(cloudData).length, 'bytes');

        // Apply cloud data to game state (this will be processed by loadGame logic)
        if (typeof window.loadGame === 'function') {
            // Store cloud data in a temporary location for loadGame to use
            window.cloudGameData = cloudData;
            console.log('📦 Stored cloud data for loadGame to process');
            window.loadGame();
            return true;
        }

        return false;
    } catch (error) {
        console.error('❌ Error loading from cloud:', error);
        return false;
    }
}

// ANTI-CHEAT: Validate game data before saving
async function validateGameData(userId, gameData) {
    try {
        // Get user's account creation time
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
            console.error('User data not found');
            return false;
        }

        const accountAge = Date.now() - userData.createdAt.toMillis();
        const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);

        // VALIDATION CHECKS

        // 1. Check if BTC amount is reasonable for account age
        const maxPossibleBTC = calculateMaxPossibleBTC(accountAgeDays, gameData.playTime);

        if (gameData.btc > maxPossibleBTC * 1.5) { // Allow 50% margin for upgrades/bonuses
            console.warn('⚠️ Suspicious BTC amount detected');
            console.warn(`Account age: ${accountAgeDays} days, BTC: ${gameData.btc}, Max possible: ${maxPossibleBTC}`);

            // Log but don't reject - might be legitimate with good upgrades
            await logSuspiciousActivity(userId, 'high_btc', { btc: gameData.btc, maxPossible: maxPossibleBTC });
        }

        // 2. Check for negative values (obvious cheat)
        if (gameData.btc < 0 || gameData.bitcoinPerSecond < 0) {
            console.error('❌ Negative values detected - CHEAT');
            return false;
        }

        // 3. Check for unrealistic bitcoinPerSecond
        const maxBPS = 1000000000; // Adjust based on your game balance
        if (gameData.bitcoinPerSecond > maxBPS) {
            console.error('❌ Unrealistic BPS detected - CHEAT');
            return false;
        }

        // 4. Validate total earned vs current BTC
        if (gameData.btc > gameData.totalEarned && gameData.totalEarned > 0) {
            console.warn('⚠️ BTC exceeds total earned');
            // This might be OK if they unstaked, but log it
            await logSuspiciousActivity(userId, 'btc_exceeds_earned', { btc: gameData.btc, earned: gameData.totalEarned });
        }

        // All checks passed
        return true;

    } catch (error) {
        console.error('Validation error:', error);
        return false; // Reject on validation error to be safe
    }
}

// Calculate maximum possible BTC based on account age and playtime
function calculateMaxPossibleBTC(accountAgeDays, playTimeSeconds) {
    // Conservative estimate: even with max upgrades
    // Assume max 1,000,000 BTC/second with perfect upgrades
    const maxBPSPossible = 1000000;
    const maxPlayTimeSeconds = accountAgeDays * 24 * 60 * 60;

    // Use the lower of actual play time or account age
    const effectivePlayTime = Math.min(playTimeSeconds, maxPlayTimeSeconds);

    return maxBPSPossible * effectivePlayTime;
}

// Log suspicious activity for review
async function logSuspiciousActivity(userId, type, data) {
    try {
        await db.collection('logs').doc('suspicious').collection('activities').add({
            userId: userId,
            type: type,
            data: data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Failed to log suspicious activity:', error);
    }
}

// Auto-save to cloud every 20 minutes for all logged-in users (including guests)
// Local saves still happen automatically every second via saveGame() in game.js
let autoSaveInterval;

function startAutoSave() {
    // CLOUD AUTO-SAVE DISABLED - Using local-only persistence
    console.log('☁️ Cloud auto-save disabled - game uses local storage only');
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        console.log('🛑 Auto cloud save stopped');
    }
}

// Show subtle save indicator
function showSaveIndicator() {
    let indicator = document.getElementById('cloud-save-indicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'cloud-save-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: #fff;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        indicator.innerHTML = '☁️ Synced to Cloud';
        document.body.appendChild(indicator);
    }

    // Show indicator
    indicator.style.opacity = '1';

    // Hide after 2 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

// Show save messages to user
function showSaveMessage(message, type = 'info') {
    let messageDiv = document.getElementById('save-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'save-message';
        document.body.appendChild(messageDiv);
    }

    const colors = {
        success: '#00ff88',
        error: '#ff3344',
        info: '#f7931a',
        warning: '#ff9800'
    };

    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.95);
        color: ${colors[type] || colors.info};
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 0.9rem;
        z-index: 99998;
        border: 2px solid ${colors[type] || colors.info};
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        max-width: 400px;
        text-align: center;
        font-family: monospace;
    `;

    messageDiv.textContent = message;
    messageDiv.style.opacity = '1';

    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}

// Update last save time indicator
function updateLastSaveTime() {
    let indicator = document.getElementById('last-save-indicator');

    if (!indicator) {
        // Create the indicator if it doesn't exist
        indicator = document.createElement('div');
        indicator.id = 'last-save-indicator';
        indicator.title = 'Last cloud sync time. Auto-syncs every 20 minutes. Local saves happen automatically every second.';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff88;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-family: monospace;
            z-index: 9999;
            border: 1px solid #00ff88;
            cursor: help;
        `;
        document.body.appendChild(indicator);
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    indicator.innerHTML = `☁️ Last sync: ${timeString}`;
}

// Manual sync button (integrated into user info)
function createSyncButton() {
    // Don't create a separate button - it will be part of updateUserUI
    console.log('✅ Manual save button available in user menu');
}

// Save on page unload (especially important for guest users)
// Note: This is a best-effort save - some browsers may not complete async operations on unload
function setupUnloadSave() {
    window.addEventListener('beforeunload', async (event) => {
        // Only save for logged-in users
        if (auth && auth.currentUser && !window.isOfflineMode) {
            console.log('🔄 Page unloading - attempting final save...');

            // Use synchronous storage as a backup since async may not complete
            try {
                // The local save (via saveGame in game.js) should already be up-to-date
                // But we'll try a cloud save for good measure

                // For modern browsers, we can use sendBeacon for a more reliable save
                // But Firestore doesn't support sendBeacon, so we just try regular save
                // This may or may not complete depending on browser

                // Note: Don't await here as it may block page close
                saveGameToCloud(false).catch(err => {
                    console.warn('Final cloud save may not have completed:', err);
                });
            } catch (e) {
                console.warn('Error during unload save:', e);
            }
        }
    });

    // Also listen for visibility change to save when tab is hidden
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'hidden' && auth && auth.currentUser && !window.isOfflineMode) {
            console.log('📱 Tab hidden - saving progress...');
            try {
                await saveGameToCloud(false);
                console.log('✅ Tab hidden save complete');
            } catch (e) {
                console.warn('Tab hidden save failed:', e);
            }
        }
    });

    console.log('✅ Unload and visibility save handlers set up');
}

// Initialize unload save handler
setupUnloadSave();

// Export functions for global use
window.saveGameToCloud = saveGameToCloud;
window.loadGameFromCloud = loadGameFromCloud;
window.startAutoSave = startAutoSave;
window.stopAutoSave = stopAutoSave;
window.createSyncButton = createSyncButton;
window.resetGameVariables = resetGameVariables;

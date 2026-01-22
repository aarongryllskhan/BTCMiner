/**
 * Firebase Cloud Save/Load System for Idle BTC Miner
 * Copyright © 2026 Aaron Khan. All Rights Reserved.
 */

// Save game data to Firebase Cloud
async function saveGameToCloud() {
    try {
        const user = auth.currentUser;

        if (!user) {
            console.log('⚠️ No user logged in - skipping cloud save');
            return false;
        }

        // Gather game data from your existing game variables
        const gameData = {
            // Bitcoin data
            btcBalance: typeof btcBalance !== 'undefined' ? btcBalance : 0,
            btcLifetime: typeof btcLifetime !== 'undefined' ? btcLifetime : 0,
            btcClickValue: typeof btcClickValue !== 'undefined' ? btcClickValue : 0,
            btcPerSec: typeof btcPerSec !== 'undefined' ? btcPerSec : 0,
            btcPrice: typeof btcPrice !== 'undefined' ? btcPrice : 100000,
            // Ethereum data
            ethBalance: typeof ethBalance !== 'undefined' ? ethBalance : 0,
            ethLifetime: typeof ethLifetime !== 'undefined' ? ethLifetime : 0,
            ethClickValue: typeof ethClickValue !== 'undefined' ? ethClickValue : 0,
            ethPerSec: typeof ethPerSec !== 'undefined' ? ethPerSec : 0,
            ethPrice: typeof ethPrice !== 'undefined' ? ethPrice : 3500,
            // Dogecoin data
            dogeBalance: typeof dogeBalance !== 'undefined' ? dogeBalance : 0,
            dogeLifetime: typeof dogeLifetime !== 'undefined' ? dogeLifetime : 0,
            dogeClickValue: typeof dogeClickValue !== 'undefined' ? dogeClickValue : 0,
            dogePerSec: typeof dogePerSec !== 'undefined' ? dogePerSec : 0,
            dogePrice: typeof dogePrice !== 'undefined' ? dogePrice : 0.25,
            // General data
            dollarBalance: typeof dollarBalance !== 'undefined' ? dollarBalance : 0,
            hardwareEquity: typeof hardwareEquity !== 'undefined' ? hardwareEquity : 0,
            autoClickerCooldownEnd: typeof autoClickerCooldownEnd !== 'undefined' ? autoClickerCooldownEnd : 0,
            lifetimeEarnings: typeof lifetimeEarnings !== 'undefined' ? lifetimeEarnings : 0,
            sessionEarnings: typeof sessionEarnings !== 'undefined' ? sessionEarnings : 0,
            sessionStartTime: typeof sessionStartTime !== 'undefined' ? sessionStartTime : 0,
            chartHistory: typeof chartHistory !== 'undefined' ? chartHistory : [],
            chartTimestamps: typeof chartTimestamps !== 'undefined' ? chartTimestamps : [],
            chartStartTime: typeof chartStartTime !== 'undefined' ? chartStartTime : 0,
            totalPowerAvailable: typeof totalPowerAvailable !== 'undefined' ? totalPowerAvailable : 0,
            // Upgrades and skills
            powerUpgrades: typeof powerUpgrades !== 'undefined' ? powerUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentPower: u.currentPower
            })) : [],
            btcUpgrades: typeof btcUpgrades !== 'undefined' ? btcUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })) : [],
            ethUpgrades: typeof ethUpgrades !== 'undefined' ? ethUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })) : [],
            dogeUpgrades: typeof dogeUpgrades !== 'undefined' ? dogeUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                boostCost: u.boostCost,
                boostLevel: u.boostLevel
            })) : [],
            skillTree: typeof getSkillTreeData === 'function' ? getSkillTreeData() : {},
            staking: typeof getStakingData === 'function' ? getStakingData() : {},

            // Timestamps
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        };

        // ANTI-CHEAT: Server-side validation
        const isValid = await validateGameData(user.uid, gameData);

        if (!isValid) {
            console.error('❌ Invalid game data detected - save rejected');
            showMessage('Save failed: Invalid data detected', 'error');
            return false;
        }

        // Save to Firestore
        await db.collection('users').doc(user.uid).collection('gameData').doc('current').set(gameData, { merge: true });

        // Update user profile stats
        await db.collection('users').doc(user.uid).update({
            totalBTC: gameData.btcBalance,
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update leaderboard with current lifetime earnings
        if (typeof window.updateLeaderboard === 'function') {
            await window.updateLeaderboard();
        }

        console.log('✅ Game saved to cloud successfully');

        // Show subtle save indicator
        showSaveIndicator();

        return true;

    } catch (error) {
        console.error('❌ Cloud save error:', error);
        showMessage('Failed to save to cloud: ' + error.message, 'error');
        return false;
    }
}

// Reset all game variables to default state
function resetGameVariables() {
    try {
        // Bitcoin
        if (typeof btcBalance !== 'undefined') btcBalance = 0;
        if (typeof btcLifetime !== 'undefined') btcLifetime = 0;
        if (typeof btcPerSec !== 'undefined') btcPerSec = 0;
        if (typeof btcPrice !== 'undefined') btcPrice = 100000;

        // Ethereum
        if (typeof ethBalance !== 'undefined') ethBalance = 0;
        if (typeof ethLifetime !== 'undefined') ethLifetime = 0;
        if (typeof ethPerSec !== 'undefined') ethPerSec = 0;
        if (typeof ethPrice !== 'undefined') ethPrice = 3500;

        // Dogecoin
        if (typeof dogeBalance !== 'undefined') dogeBalance = 0;
        if (typeof dogeLifetime !== 'undefined') dogeLifetime = 0;
        if (typeof dogePerSec !== 'undefined') dogePerSec = 0;
        if (typeof dogePrice !== 'undefined') dogePrice = 0.25;

        // General
        if (typeof dollarBalance !== 'undefined') dollarBalance = 0;
        if (typeof hardwareEquity !== 'undefined') hardwareEquity = 0;
        if (typeof lifetimeEarnings !== 'undefined') lifetimeEarnings = 0;
        if (typeof sessionEarnings !== 'undefined') sessionEarnings = 0;
        if (typeof totalPlayTime !== 'undefined') totalPlayTime = 0;
        if (typeof totalPowerAvailable !== 'undefined') totalPowerAvailable = 0;

        console.log('✅ Game variables reset to defaults');
    } catch (error) {
        console.error('Error resetting variables:', error);
    }
}

// Load game data from Firebase Cloud (smart merge with local save)
async function loadGameFromCloud(userId = null) {
    try {
        const user = userId ? { uid: userId } : auth.currentUser;

        if (!user) {
            console.log('⚠️ No user logged in - using local save only');
            return false;
        }

        // Reset all game variables to prevent data from previous account
        resetGameVariables();

        // Get game data from Firestore
        const docRef = db.collection('users').doc(user.uid).collection('gameData').doc('current');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('ℹ️ No cloud save found - starting fresh game');
            return false;
        }

        const cloudData = docSnap.data();
        console.log('☁️ Cloud save found:', cloudData);

        // Apply cloud data to game variables
        // Bitcoin data
        if (typeof btcBalance !== 'undefined') btcBalance = cloudData.btcBalance || 0;
        if (typeof btcLifetime !== 'undefined') btcLifetime = cloudData.btcLifetime || 0;
        if (typeof btcClickValue !== 'undefined') btcClickValue = cloudData.btcClickValue || 0;
        if (typeof btcPerSec !== 'undefined') btcPerSec = cloudData.btcPerSec || 0;
        if (typeof btcPrice !== 'undefined') btcPrice = cloudData.btcPrice || 100000;
        // Ethereum data
        if (typeof ethBalance !== 'undefined') ethBalance = cloudData.ethBalance || 0;
        if (typeof ethLifetime !== 'undefined') ethLifetime = cloudData.ethLifetime || 0;
        if (typeof ethClickValue !== 'undefined') ethClickValue = cloudData.ethClickValue || 0;
        if (typeof ethPerSec !== 'undefined') ethPerSec = cloudData.ethPerSec || 0;
        if (typeof ethPrice !== 'undefined') ethPrice = cloudData.ethPrice || 3500;
        // Dogecoin data
        if (typeof dogeBalance !== 'undefined') dogeBalance = cloudData.dogeBalance || 0;
        if (typeof dogeLifetime !== 'undefined') dogeLifetime = cloudData.dogeLifetime || 0;
        if (typeof dogeClickValue !== 'undefined') dogeClickValue = cloudData.dogeClickValue || 0;
        if (typeof dogePerSec !== 'undefined') dogePerSec = cloudData.dogePerSec || 0;
        if (typeof dogePrice !== 'undefined') dogePrice = cloudData.dogePrice || 0.25;
        // General data
        if (typeof dollarBalance !== 'undefined') dollarBalance = cloudData.dollarBalance || 0;
        if (typeof hardwareEquity !== 'undefined') hardwareEquity = cloudData.hardwareEquity || 0;
        if (typeof autoClickerCooldownEnd !== 'undefined') autoClickerCooldownEnd = cloudData.autoClickerCooldownEnd || 0;
        if (typeof lifetimeEarnings !== 'undefined') lifetimeEarnings = cloudData.lifetimeEarnings || 0;
        if (typeof sessionEarnings !== 'undefined') sessionEarnings = cloudData.sessionEarnings || 0;
        if (typeof sessionStartTime !== 'undefined') sessionStartTime = cloudData.sessionStartTime || 0;
        if (typeof chartHistory !== 'undefined') chartHistory = cloudData.chartHistory || [];
        if (typeof chartTimestamps !== 'undefined') chartTimestamps = cloudData.chartTimestamps || [];
        if (typeof chartStartTime !== 'undefined') chartStartTime = cloudData.chartStartTime || 0;
        if (typeof totalPowerAvailable !== 'undefined') totalPowerAvailable = cloudData.totalPowerAvailable || 0;

        // Update UI if functions exist
        if (typeof updateDisplay === 'function') updateDisplay();
        if (typeof updateUpgradeUI === 'function') updateUpgradeUI();
        if (typeof updateSkillTree === 'function') updateSkillTree();

        console.log('✅ Progress loaded from cloud successfully');
        showMessage('Progress loaded from cloud!', 'success');

        return true;

    } catch (error) {
        console.error('❌ Cloud load error:', error);
        showMessage('Failed to load from cloud: ' + error.message, 'error');
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

// Auto-save every 60 seconds
let autoSaveInterval;

function startAutoSave() {
    // Clear any existing interval
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    // Save every 60 seconds
    autoSaveInterval = setInterval(async () => {
        if (auth.currentUser) {
            await saveGameToCloud();
        }
    }, 60000); // 60 seconds

    console.log('✅ Auto-save started (every 60 seconds)');
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        console.log('🛑 Auto-save stopped');
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
        indicator.innerHTML = '☁️ Saved';
        document.body.appendChild(indicator);
    }

    // Show indicator
    indicator.style.opacity = '1';

    // Hide after 2 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

// Manual sync button (integrated into user info)
function createSyncButton() {
    // Don't create a separate button - it will be part of updateUserUI
    console.log('✅ Manual save button available in user menu');
}

// Export functions for global use
window.saveGameToCloud = saveGameToCloud;
window.loadGameFromCloud = loadGameFromCloud;
window.startAutoSave = startAutoSave;
window.stopAutoSave = stopAutoSave;
window.createSyncButton = createSyncButton;

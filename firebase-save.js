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

        // Gather game data from your existing game variables (use window accessors for closure variables)
        const gameData = {
            // Bitcoin data
            btcBalance: typeof window.btcBalance !== 'undefined' ? window.btcBalance : 0,
            btcLifetime: typeof window.btcLifetime !== 'undefined' ? window.btcLifetime : 0,
            btcClickValue: typeof window.btcClickValue !== 'undefined' ? window.btcClickValue : 0,
            btcPerSec: typeof window.btcPerSec !== 'undefined' ? window.btcPerSec : 0,
            btcPrice: typeof window.btcPrice !== 'undefined' ? window.btcPrice : 100000,
            // Ethereum data
            ethBalance: typeof window.ethBalance !== 'undefined' ? window.ethBalance : 0,
            ethLifetime: typeof window.ethLifetime !== 'undefined' ? window.ethLifetime : 0,
            ethClickValue: typeof window.ethClickValue !== 'undefined' ? window.ethClickValue : 0,
            ethPerSec: typeof window.ethPerSec !== 'undefined' ? window.ethPerSec : 0,
            ethPrice: typeof window.ethPrice !== 'undefined' ? window.ethPrice : 3500,
            // Dogecoin data
            dogeBalance: typeof window.dogeBalance !== 'undefined' ? window.dogeBalance : 0,
            dogeLifetime: typeof window.dogeLifetime !== 'undefined' ? window.dogeLifetime : 0,
            dogeClickValue: typeof window.dogeClickValue !== 'undefined' ? window.dogeClickValue : 0,
            dogePerSec: typeof window.dogePerSec !== 'undefined' ? window.dogePerSec : 0,
            dogePrice: typeof window.dogePrice !== 'undefined' ? window.dogePrice : 0.25,
            // General data
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
            // Upgrades and skills
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

            // Timestamps
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Log what's being saved for debugging
        console.log('💾 Saving game data:');
        console.log('  btcBalance:', gameData.btcBalance);
        console.log('  btcClickValue:', gameData.btcClickValue);
        console.log('  btcPerSec:', gameData.btcPerSec);
        console.log('  BTC Upgrades:', gameData.btcUpgrades ? gameData.btcUpgrades.length : 0);

        // ANTI-CHEAT: Server-side validation (disabled for now - causing false rejections)
        // const isValid = await validateGameData(user.uid, gameData);
        // if (!isValid) {
        //     console.error('❌ Invalid game data detected - save rejected');
        //     showMessage('Save failed: Invalid data detected', 'error');
        //     return false;
        // }

        // Save to Firestore
        await db.collection('users').doc(user.uid).collection('gameData').doc('current').set(gameData, { merge: true });

        // Update user profile stats
        await db.collection('users').doc(user.uid).update({
            totalBTC: gameData.btcBalance,
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update leaderboard with current lifetime earnings (async - don't wait for it)
        if (typeof window.updateLeaderboard === 'function') {
            window.updateLeaderboard().catch(err => {
                console.warn('⚠️ Leaderboard update failed (non-critical):', err);
            });
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
                u.boostLevel = 0;
            });
        }

        if (window.ethUpgrades && Array.isArray(window.ethUpgrades)) {
            window.ethUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
                u.boostLevel = 0;
            });
        }

        if (window.dogeUpgrades && Array.isArray(window.dogeUpgrades)) {
            window.dogeUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentYield = 0;
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
        console.log('After reset - btcClickValue:', window.btcClickValue);

        // Get game data from Firestore
        const docRef = db.collection('users').doc(user.uid).collection('gameData').doc('current');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('ℹ️ No cloud save found - starting fresh game for user:', user.uid);
            console.log('  Current state - btcClickValue:', window.btcClickValue, 'btcBalance:', window.btcBalance);
            return false;
        }

        const cloudData = docSnap.data();
        console.log('☁️ Cloud save found, loading into game for user:', user.uid);
        console.log('  Cloud data - btcBalance:', cloudData.btcBalance);
        console.log('  Cloud data - btcClickValue:', cloudData.btcClickValue);
        console.log('  Cloud data - Dollar Balance:', cloudData.dollarBalance);
        console.log('  Cloud data - Lifetime Earnings:', cloudData.lifetimeEarnings);

        // Apply cloud data to game variables using window accessors (these use the setters)
        // Bitcoin data
        window.btcBalance = cloudData.btcBalance || 0;
        window.btcLifetime = cloudData.btcLifetime || 0;
        window.btcClickValue = cloudData.btcClickValue || 0.00000250;
        window.btcPerSec = cloudData.btcPerSec || 0;
        window.btcPrice = cloudData.btcPrice || 100000;
        // Ethereum data
        window.ethBalance = cloudData.ethBalance || 0;
        window.ethLifetime = cloudData.ethLifetime || 0;
        window.ethClickValue = cloudData.ethClickValue || 0.00007143;
        window.ethPerSec = cloudData.ethPerSec || 0;
        window.ethPrice = cloudData.ethPrice || 3500;
        // Dogecoin data
        window.dogeBalance = cloudData.dogeBalance || 0;
        window.dogeLifetime = cloudData.dogeLifetime || 0;
        window.dogeClickValue = cloudData.dogeClickValue || 1.00000000;
        window.dogePerSec = cloudData.dogePerSec || 0;
        window.dogePrice = cloudData.dogePrice || 0.25;
        // General data
        window.dollarBalance = cloudData.dollarBalance || 0;
        window.hardwareEquity = cloudData.hardwareEquity || 0;
        window.autoClickerCooldownEnd = cloudData.autoClickerCooldownEnd || 0;
        window.lifetimeEarnings = cloudData.lifetimeEarnings || 0;
        window.sessionEarnings = cloudData.sessionEarnings || 0;
        window.sessionStartTime = cloudData.sessionStartTime || 0;
        window.chartHistory = cloudData.chartHistory || [];
        window.chartTimestamps = cloudData.chartTimestamps || [];
        window.chartStartTime = cloudData.chartStartTime || 0;
        window.totalPowerAvailable = cloudData.totalPowerAvailable || 0;

        // Restore upgrades from cloud data
        if (cloudData.powerUpgrades && Array.isArray(cloudData.powerUpgrades)) {
            cloudData.powerUpgrades.forEach((cloudUpgrade, index) => {
                if (window.powerUpgrades[index]) {
                    window.powerUpgrades[index].level = cloudUpgrade.level || 0;
                    window.powerUpgrades[index].currentUsd = cloudUpgrade.currentUsd || window.powerUpgrades[index].baseUsd;
                    window.powerUpgrades[index].currentPower = cloudUpgrade.currentPower || 0;
                }
            });
        }

        if (cloudData.btcUpgrades && Array.isArray(cloudData.btcUpgrades)) {
            cloudData.btcUpgrades.forEach((cloudUpgrade, index) => {
                if (window.btcUpgrades[index]) {
                    window.btcUpgrades[index].level = cloudUpgrade.level || 0;
                    window.btcUpgrades[index].currentUsd = cloudUpgrade.currentUsd || window.btcUpgrades[index].baseUsd;
                    window.btcUpgrades[index].currentYield = cloudUpgrade.currentYield || 0;
                    window.btcUpgrades[index].boostLevel = cloudUpgrade.boostLevel || 0;
                }
            });
        }

        if (cloudData.ethUpgrades && Array.isArray(cloudData.ethUpgrades)) {
            cloudData.ethUpgrades.forEach((cloudUpgrade, index) => {
                if (window.ethUpgrades[index]) {
                    window.ethUpgrades[index].level = cloudUpgrade.level || 0;
                    window.ethUpgrades[index].currentUsd = cloudUpgrade.currentUsd || window.ethUpgrades[index].baseUsd;
                    window.ethUpgrades[index].currentYield = cloudUpgrade.currentYield || 0;
                    window.ethUpgrades[index].boostLevel = cloudUpgrade.boostLevel || 0;
                }
            });
        }

        if (cloudData.dogeUpgrades && Array.isArray(cloudData.dogeUpgrades)) {
            cloudData.dogeUpgrades.forEach((cloudUpgrade, index) => {
                if (window.dogeUpgrades[index]) {
                    window.dogeUpgrades[index].level = cloudUpgrade.level || 0;
                    window.dogeUpgrades[index].currentUsd = cloudUpgrade.currentUsd || window.dogeUpgrades[index].baseUsd;
                    window.dogeUpgrades[index].currentYield = cloudUpgrade.currentYield || 0;
                    window.dogeUpgrades[index].boostLevel = cloudUpgrade.boostLevel || 0;
                }
            });
        }

        // Restore skill tree data if function exists
        if (cloudData.skillTree && typeof window.setSkillTreeData === 'function') {
            try {
                window.setSkillTreeData(cloudData.skillTree);
                console.log('✅ Skill tree data restored');
            } catch (error) {
                console.warn('⚠️ Failed to restore skill tree data:', error);
            }
        }

        // Restore staking data if function exists
        if (cloudData.staking && typeof window.setStakingData === 'function') {
            try {
                window.setStakingData(cloudData.staking);
                console.log('✅ Staking data restored');
            } catch (error) {
                console.warn('⚠️ Failed to restore staking data:', error);
            }
        }

        // Verify data was actually loaded
        console.log('📋 Verifying loaded data in game variables:');
        console.log('  window.btcBalance:', window.btcBalance);
        console.log('  window.btcClickValue:', window.btcClickValue);
        console.log('  window.btcPerSec:', window.btcPerSec);
        console.log('  window.dollarBalance:', window.dollarBalance);
        console.log('  window.lifetimeEarnings:', window.lifetimeEarnings);
        console.log('  BTC Upgrades loaded:', window.btcUpgrades ? window.btcUpgrades.length : 0, 'upgrades');

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

    // Save every 10 seconds when user is logged in
    autoSaveInterval = setInterval(async () => {
        if (auth.currentUser) {
            await saveGameToCloud();
        }
    }, 10000); // 10 seconds

    console.log('✅ Auto-save started (every 10 seconds)');
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
window.resetGameVariables = resetGameVariables;

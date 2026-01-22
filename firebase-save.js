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
            // Core game stats - all crypto balances
            btc: typeof btc !== 'undefined' ? btc : 0,
            eth: typeof eth !== 'undefined' ? eth : 0,
            doge: typeof doge !== 'undefined' ? doge : 0,
            dollarBalance: typeof dollarBalance !== 'undefined' ? dollarBalance : 0,
            bitcoinPerSecond: typeof bitcoinPerSecond !== 'undefined' ? bitcoinPerSecond : 0,

            // Upgrades
            upgrades: typeof upgrades !== 'undefined' ? upgrades : {},

            // Skills
            skills: typeof skills !== 'undefined' ? skills : {},
            skillTokens: typeof skillTokens !== 'undefined' ? skillTokens : 0,

            // Achievements
            achievements: typeof achievements !== 'undefined' ? achievements : [],

            // Statistics
            totalEarned: typeof lifetimeEarnings !== 'undefined' ? lifetimeEarnings : (typeof totalEarned !== 'undefined' ? totalEarned : 0),
            totalSpent: typeof totalSpent !== 'undefined' ? totalSpent : 0,
            totalClicks: typeof totalClicks !== 'undefined' ? totalClicks : 0,

            // Staking
            stakedBTC: typeof stakedBTC !== 'undefined' ? stakedBTC : 0,
            stakedETH: typeof stakedETH !== 'undefined' ? stakedETH : 0,
            stakedDOGE: typeof stakedDOGE !== 'undefined' ? stakedDOGE : 0,
            stakingRewards: typeof stakingRewards !== 'undefined' ? stakingRewards : 0,

            // Timestamps
            lastSaved: firebase.firestore.FieldValue.serverTimestamp(),
            playTime: typeof totalPlayTime !== 'undefined' ? totalPlayTime : 0
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
            totalBTC: gameData.btc,
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        });

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

// Load game data from Firebase Cloud (smart merge with local save)
async function loadGameFromCloud(userId = null) {
    try {
        const user = userId ? { uid: userId } : auth.currentUser;

        if (!user) {
            console.log('⚠️ No user logged in - using local save only');
            return false;
        }

        // Get local save data (from localStorage via game.js)
        const hasLocalSave = localStorage.getItem('gameData') !== null;
        const localData = hasLocalSave ? JSON.parse(localStorage.getItem('gameData')) : null;

        // Get game data from Firestore
        const docRef = db.collection('users').doc(user.uid).collection('gameData').doc('current');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('ℹ️ No cloud save found');

            // If we have local progress, upload it to cloud
            if (hasLocalSave && localData) {
                console.log('📤 Uploading local progress to cloud...');
                await saveGameToCloud();
                showMessage('Local progress uploaded to cloud!', 'success');
            } else {
                console.log('Starting fresh game');
            }
            return false;
        }

        const cloudData = docSnap.data();
        console.log('☁️ Cloud save found:', cloudData);

        // Compare cloud vs local progress (use whichever has more total earnings)
        let useCloudData = true;

        if (hasLocalSave && localData) {
            const localEarnings = localData.lifetimeEarnings || localData.totalEarned || 0;
            const cloudEarnings = cloudData.totalEarned || 0;

            console.log(`📊 Comparing saves - Local: $${localEarnings}, Cloud: $${cloudEarnings}`);

            if (localEarnings > cloudEarnings) {
                console.log('✅ Local save is better - keeping local progress');
                useCloudData = false;

                // Upload the better local save to cloud
                await saveGameToCloud();
                showMessage('Local progress was better - uploaded to cloud!', 'info');
            } else {
                console.log('☁️ Cloud save is better - loading from cloud');
            }
        }

        // Only apply cloud data if it's better than local
        if (useCloudData) {
            // Apply cloud data to game variables
            if (typeof btc !== 'undefined') btc = cloudData.btc || 0;
            if (typeof eth !== 'undefined') eth = cloudData.eth || 0;
            if (typeof doge !== 'undefined') doge = cloudData.doge || 0;
            if (typeof dollarBalance !== 'undefined') dollarBalance = cloudData.dollarBalance || 0;
            if (typeof bitcoinPerSecond !== 'undefined') bitcoinPerSecond = cloudData.bitcoinPerSecond || 0;
            if (typeof upgrades !== 'undefined') upgrades = cloudData.upgrades || {};
            if (typeof skills !== 'undefined') skills = cloudData.skills || {};
            if (typeof skillTokens !== 'undefined') skillTokens = cloudData.skillTokens || 0;
            if (typeof achievements !== 'undefined') achievements = cloudData.achievements || [];
            if (typeof lifetimeEarnings !== 'undefined') lifetimeEarnings = cloudData.totalEarned || 0;
            if (typeof totalEarned !== 'undefined') totalEarned = cloudData.totalEarned || 0;
            if (typeof totalSpent !== 'undefined') totalSpent = cloudData.totalSpent || 0;
            if (typeof totalClicks !== 'undefined') totalClicks = cloudData.totalClicks || 0;
            if (typeof stakedBTC !== 'undefined') stakedBTC = cloudData.stakedBTC || 0;
            if (typeof stakedETH !== 'undefined') stakedETH = cloudData.stakedETH || 0;
            if (typeof stakedDOGE !== 'undefined') stakedDOGE = cloudData.stakedDOGE || 0;
            if (typeof totalPlayTime !== 'undefined') totalPlayTime = cloudData.playTime || 0;

            // Update UI if functions exist
            if (typeof updateDisplay === 'function') updateDisplay();
            if (typeof updateUpgradeUI === 'function') updateUpgradeUI();
            if (typeof updateSkillTree === 'function') updateSkillTree();

            showMessage('Progress loaded from cloud!', 'success');
        }

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

/**
 * Firebase Cloud Save/Load System for Idle BTC Miner
 * Copyright © 2026 Aaron Khan. All Rights Reserved.
 */

// Track last manual save time for cooldown
let lastManualSaveTime = 0;
const MANUAL_SAVE_COOLDOWN = 10 * 60 * 1000; // 10 minutes in milliseconds

// Save game data to Firebase Cloud
async function saveGameToCloud(isManualSave = false) {
    try {
        // Check if we're in offline mode (no Firebase)
        if (window.isOfflineMode) {
            console.log('📴 Offline mode - skipping cloud save');
            return false;
        }

        const user = auth.currentUser;

        if (!user) {
            console.log('⚠️ No user logged in - skipping cloud save');
            showSaveMessage('You must be logged in to transfer progress to cloud. Your game auto-saves locally.', 'warning');
            return false;
        }

        // Check if user document exists in Firestore
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

        // Check cooldown for manual saves only (auto-saves bypass this)
        if (isManualSave) {
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
            lastSaved: firebase.firestore.FieldValue.serverTimestamp(),
            lastSaveTime: typeof window.lastSaveTime !== 'undefined' ? window.lastSaveTime : Date.now()
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

        // Leaderboard updates are handled separately (on login/logout and when returning after 6+ hours away)

        console.log('✅ Progress synced to cloud successfully');

        // Show subtle save indicator with timestamp
        showSaveIndicator();
        updateLastSaveTime();

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

// Load game data from Firebase Cloud (smart merge with local save)
async function loadGameFromCloud(userId = null) {
    try {
        // Check if we're in offline mode (no Firebase)
        if (window.isOfflineMode) {
            console.log('📴 Offline mode - using local save only');
            return false;
        }

        const user = userId ? { uid: userId } : auth.currentUser;

        if (!user) {
            console.log('⚠️ No user logged in - using local save only');
            return false;
        }

        // Check if this is the same user as last time (account switch detection)
        const lastUserId = localStorage.getItem('lastLoggedInUser');
        const isAccountSwitch = lastUserId && lastUserId !== user.uid;

        if (isAccountSwitch) {
            console.log('🔄 Account switch detected - previous user:', lastUserId, 'new user:', user.uid);
        }

        // Store current user ID for future comparisons
        localStorage.setItem('lastLoggedInUser', user.uid);

        // Get game data from Firestore
        const docRef = db.collection('users').doc(user.uid).collection('gameData').doc('current');
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('ℹ️ No cloud save found for user:', user.uid);

            if (isAccountSwitch) {
                // Account switch with no cloud data - reset to fresh game
                console.log('🆕 New account with no cloud save - resetting to fresh game');
                resetGameVariables();
                if (typeof window.reinitializeChart === 'function') {
                    window.reinitializeChart();
                }
            } else {
                // Same account, no cloud data - keep local cache (might be first login on this device)
                console.log('📦 Keeping local cache (first login on this device)');
                if (typeof window.reinitializeChart === 'function') {
                    window.reinitializeChart();
                }
            }
            return false;
        }

        const cloudData = docSnap.data();
        console.log('☁️ Cloud save found for user:', user.uid);

        // If account switch, ALWAYS load cloud data (ignore local cache from different account)
        if (isAccountSwitch) {
            console.log('🔄 Loading cloud data due to account switch');
            resetGameVariables();
        } else {
            // Same account - load cloud data
            // (Local vs cloud decision is now made at a higher level in firebase-auth.js)
            console.log('☁️ Loading cloud data for same user');
            resetGameVariables();
        }

        console.log('  Cloud data - btcBalance:', cloudData.btcBalance);
        console.log('  Cloud data - btcClickValue:', cloudData.btcClickValue);
        console.log('  Cloud data - Dollar Balance:', cloudData.dollarBalance);

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
        // Always reset session earnings to 0 - session is per-login, not restored from cloud
        window.sessionEarnings = 0;
        // Always reset session time to now - session is per-login, not restored from cloud
        window.sessionStartTime = Date.now();
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
                    window.btcUpgrades[index].boostCost = cloudUpgrade.boostCost || window.btcUpgrades[index].baseUsd * 0.5;
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
                    window.ethUpgrades[index].boostCost = cloudUpgrade.boostCost || window.ethUpgrades[index].baseUsd * 0.5;
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
                    window.dogeUpgrades[index].boostCost = cloudUpgrade.boostCost || window.dogeUpgrades[index].baseUsd * 0.5;
                    window.dogeUpgrades[index].boostLevel = cloudUpgrade.boostLevel || 0;
                }
            });
        }

        // Recalculate click values from manual hash upgrade levels (same as game.js loadGame())
        const btcManualHashUpgrade = window.btcUpgrades.find(u => u.id === 0);
        if (btcManualHashUpgrade && btcManualHashUpgrade.level > 0) {
            window.btcClickValue = 0.00000250 * Math.pow(1.10, btcManualHashUpgrade.level);
            console.log('📊 Recalculated BTC click value from upgrade level:', window.btcClickValue);
        }

        const ethManualHashUpgrade = window.ethUpgrades.find(u => u.id === 0);
        if (ethManualHashUpgrade && ethManualHashUpgrade.level > 0) {
            window.ethClickValue = 0.00007143 * Math.pow(1.10, ethManualHashUpgrade.level);
            console.log('📊 Recalculated ETH click value from upgrade level:', window.ethClickValue);
        }

        const dogeManualHashUpgrade = window.dogeUpgrades.find(u => u.id === 0);
        if (dogeManualHashUpgrade && dogeManualHashUpgrade.level > 0) {
            window.dogeClickValue = 1.00000000 * Math.pow(1.10, dogeManualHashUpgrade.level);
            console.log('📊 Recalculated DOGE click value from upgrade level:', window.dogeClickValue);
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
                console.log('📥 Staking data from cloud:', cloudData.staking);
                window.setStakingData(cloudData.staking);
                console.log('✅ Staking data restored');
            } catch (error) {
                console.warn('⚠️ Failed to restore staking data:', error);
            }
        } else {
            console.log('ℹ️ No staking data in cloud or function not available:', {
                hasStakingData: !!cloudData.staking,
                hasFunction: typeof window.setStakingData === 'function'
            });
        }

        // Verify data was actually loaded
        console.log('📋 Verifying loaded data in game variables:');
        console.log('  window.btcBalance:', window.btcBalance);
        console.log('  window.btcClickValue:', window.btcClickValue);
        console.log('  window.btcPerSec:', window.btcPerSec);
        console.log('  Staking:', typeof window.getStakingData === 'function' ? window.getStakingData() : 'N/A');
        console.log('  window.dollarBalance:', window.dollarBalance);
        console.log('  window.lifetimeEarnings:', window.lifetimeEarnings);
        console.log('  BTC Upgrades loaded:', window.btcUpgrades ? window.btcUpgrades.length : 0, 'upgrades');

        // Calculate offline earnings from cloud load
        console.log('📊 Calculating offline earnings from cloud data...');
        const lastCloudSaveTime = cloudData.lastSaveTime || cloudData.lastSaved || Date.now();
        const currentTime = Date.now();
        const offlineSecondsRaw = (currentTime - lastCloudSaveTime) / 1000;
        const BASE_OFFLINE_CAP = 21600; // 6 hours
        const MAX_OFFLINE_SECONDS = (typeof window.getOfflineCap === 'function') ? window.getOfflineCap() : BASE_OFFLINE_CAP;
        const offlineSeconds = Math.min(offlineSecondsRaw, MAX_OFFLINE_SECONDS);
        const wasTimeCaped = offlineSecondsRaw > MAX_OFFLINE_SECONDS;

        console.log('  Time since cloud save:', offlineSecondsRaw, 'seconds');
        console.log('  Capped at:', offlineSeconds, 'seconds');
        console.log('  Was capped:', wasTimeCaped);

        // Calculate offline crypto earnings based on per-second rates
        const offlineBtcEarnings = (window.btcPerSec || 0) * offlineSeconds;
        const offlineEthEarnings = (window.ethPerSec || 0) * offlineSeconds;
        const offlineDogeEarnings = (window.dogePerSec || 0) * offlineSeconds;

        // Add offline earnings to balances
        if (offlineBtcEarnings > 0) {
            window.btcBalance += offlineBtcEarnings;
            window.btcLifetime += offlineBtcEarnings;
            const btcUsdValue = offlineBtcEarnings * (window.btcPrice || 100000);
            window.lifetimeEarnings += btcUsdValue;
        }
        if (offlineEthEarnings > 0) {
            window.ethBalance += offlineEthEarnings;
            window.ethLifetime += offlineEthEarnings;
            const ethUsdValue = offlineEthEarnings * (window.ethPrice || 3500);
            window.lifetimeEarnings += ethUsdValue;
        }
        if (offlineDogeEarnings > 0) {
            window.dogeBalance += offlineDogeEarnings;
            window.dogeLifetime += offlineDogeEarnings;
            const dogeUsdValue = offlineDogeEarnings * (window.dogePrice || 0.25);
            window.lifetimeEarnings += dogeUsdValue;
        }

        // Store offline earnings data to display modal (show for any duration, even if 0)
        console.log('🎯 Setting offline earnings modal for display');
        window.offlineEarningsToShow = {
            btc: offlineBtcEarnings,
            eth: offlineEthEarnings,
            doge: offlineDogeEarnings,
            stakingCash: 0, // Cloud already includes staking in balances
            seconds: offlineSecondsRaw,
            wasCapped: wasTimeCaped,
            cappedSeconds: offlineSeconds
        };

        // Show modal immediately after cloud load (don't wait for DOMContentLoaded check)
        console.log('✅ SHOWING OFFLINE EARNINGS MODAL FROM CLOUD');
        console.log('  BTC:', offlineBtcEarnings);
        console.log('  ETH:', offlineEthEarnings);
        console.log('  DOGE:', offlineDogeEarnings);
        console.log('  Seconds away:', offlineSecondsRaw);

        // Wait for onboarding/terms modals to close before showing offline earnings modal
        const checkAndShowModal = () => {
            const onboardingModal = document.getElementById('onboarding-modal');
            const privacyModal = document.getElementById('privacy-modal');
            const loginScreen = document.getElementById('login-screen');

            // Check if critical modals are still open
            const onboardingOpen = onboardingModal && onboardingModal.style.display !== 'none' && onboardingModal.classList.contains('show');
            const privacyOpen = privacyModal && privacyModal.style.display !== 'none';
            const loginOpen = loginScreen && loginScreen.style.display !== 'none';

            if (onboardingOpen || privacyOpen || loginOpen) {
                // Wait a bit and try again
                console.log('⏳ Waiting for modal to close before showing offline earnings...');
                setTimeout(checkAndShowModal, 500);
                return;
            }

            // Now show the offline modal
            console.log('🎯 All critical modals closed, showing offline earnings modal...');
            if (typeof showOfflineEarningsModal === 'function') {
                console.log('✅ showOfflineEarningsModal function found, calling now');
                showOfflineEarningsModal(
                    offlineBtcEarnings,
                    offlineEthEarnings,
                    offlineDogeEarnings,
                    0, // stakingCash
                    offlineSecondsRaw,
                    wasTimeCaped,
                    offlineSeconds
                );
            } else {
                console.warn('⚠️ showOfflineEarningsModal function not available, typeof:', typeof showOfflineEarningsModal);
            }
        };

        // Check after a short delay to allow modals to initialize
        setTimeout(checkAndShowModal, 1000);

        // Update UI if functions exist
        if (typeof updateDisplay === 'function') updateDisplay();
        if (typeof updateUpgradeUI === 'function') updateUpgradeUI();
        if (typeof updateSkillTree === 'function') updateSkillTree();
        if (typeof updateStakingUI === 'function') updateStakingUI();
        if (typeof window.updateManualHashButtons === 'function') window.updateManualHashButtons();

        // Reinitialize chart with new account data
        if (typeof window.reinitializeChart === 'function') {
            console.log('🔄 Reinitializing chart for new account...');
            window.reinitializeChart();
        }

        console.log('✅ Progress loaded from cloud successfully');

        // Auto-save to cloud immediately after loading (ensures offline earnings are synced)
        // This prevents losing progress if user refreshes before next 20-min auto-save
        setTimeout(async () => {
            if (typeof window.saveGameToCloud === 'function' && auth && auth.currentUser) {
                console.log('💾 Auto-saving to cloud after loading (offline earnings sync)...');
                try {
                    await window.saveGameToCloud(false);
                    console.log('✅ Cloud sync complete after load');
                } catch (err) {
                    console.warn('⚠️ Cloud sync after load failed (non-critical):', err);
                }
            }
        }, 1000); // Wait 1 second to ensure all calculations are complete

        // Only show "Welcome back" if they had prior data (not a brand new account)
        const hasExistingProgress = cloudData.lifetimeEarnings > 0 ||
                                   cloudData.btcBalance > 0 ||
                                   cloudData.ethBalance > 0 ||
                                   cloudData.dogeBalance > 0;

        if (hasExistingProgress) {
            showMessage('Progress transferred from cloud! Welcome back.', 'success');
        } else {
            showMessage('Ready to start mining!', 'success');
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

// Auto-save to cloud every 20 minutes for all logged-in users (including guests)
// Local saves still happen automatically every second via saveGame() in game.js
let autoSaveInterval;

function startAutoSave() {
    // Check if we're in offline mode (no Firebase)
    if (window.isOfflineMode) {
        console.log('📴 Offline mode - cloud auto-save disabled');
        return;
    }

    // Clear any existing interval
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    // Auto-save for all logged-in users (including guests)
    if (auth.currentUser) {
        // Save every 20 minutes for all users (both guests and registered)
        // Local saves happen frequently during gameplay (every action)
        // Cloud saves are less frequent to optimize Firebase free tier usage
        const saveInterval = 1200000; // 20 minutes for all users

        autoSaveInterval = setInterval(async () => {
            if (auth.currentUser && !window.isOfflineMode) {
                console.log('🔄 Auto-saving to cloud (20 min interval)...');
                await saveGameToCloud(false); // false = not manual save, skip cooldown
            }
        }, saveInterval);

        console.log('✅ Auto cloud save started (every 20 minutes for all users - local saves happen much more frequently during play)');
    } else {
        console.log('ℹ️ No user logged in - cloud auto-save disabled');
    }
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

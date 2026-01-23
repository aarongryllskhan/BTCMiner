/**
 * Firebase Authentication System for Idle BTC Miner
 * Copyright © 2026 Aaron Khan. All Rights Reserved.
 */

// Register new user with email and password
async function registerUser(email, password, username) {
    try {
        // Validate inputs
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        if (!username || username.trim().length < 3) {
            throw new Error('Username is required and must be at least 3 characters');
        }

        if (username.trim().length > 20) {
            throw new Error('Username must be 20 characters or less');
        }

        // Username validation
        if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
            throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const cleanUsername = username.trim();

        // Check if username is already taken
        const usernameQuery = await db.collection('users').where('username', '==', cleanUsername).get();
        if (!usernameQuery.empty) {
            throw new Error('Username is already taken. Please choose another one.');
        }

        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ User registered:', user.email);

        // Create user profile in Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            username: cleanUsername,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            totalBTC: 0,
            level: 1,
            achievements: [],
            isPremium: false
        });

        // Initialize empty game data with correct field names
        await db.collection('users').doc(user.uid).collection('gameData').doc('current').set({
            btcBalance: 0,
            btcLifetime: 0,
            btcClickValue: 0.00000250,
            btcPerSec: 0,
            btcPrice: 100000,
            ethBalance: 0,
            ethLifetime: 0,
            ethClickValue: 0.00007143,
            ethPerSec: 0,
            ethPrice: 3500,
            dogeBalance: 0,
            dogeLifetime: 0,
            dogeClickValue: 1.00000000,
            dogePerSec: 0,
            dogePrice: 0.25,
            dollarBalance: 0,
            hardwareEquity: 0,
            lifetimeEarnings: 0,
            sessionEarnings: 0,
            autoClickerCooldownEnd: 0,
            chartHistory: [],
            chartTimestamps: [],
            chartStartTime: 0,
            totalPowerAvailable: 0,
            powerUpgrades: [],
            btcUpgrades: [],
            ethUpgrades: [],
            dogeUpgrades: [],
            skillTree: {},
            staking: {},
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Account created successfully! Welcome to Idle BTC Miner!', 'success');
        return user;

    } catch (error) {
        console.error('❌ Registration error:', error);
        let errorMessage = 'Failed to create account';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Try logging in instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Use at least 6 characters.';
                break;
            default:
                errorMessage = error.message;
        }

        showMessage(errorMessage, 'error');
        throw error;
    }
}

// Login user with email and password
async function loginUser(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ User logged in:', user.email);

        // Check if user document exists in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            // User exists in Auth but not in Firestore - prompt for username and create the document
            console.log('⚠️ User document missing in Firestore, prompting for username...');

            let username = null;
            let usernameValid = false;

            while (!usernameValid) {
                username = prompt('Please choose a username (3-20 characters, letters, numbers, _ and - only):');

                if (!username) {
                    // User cancelled - sign them out and abort
                    await auth.signOut();
                    throw new Error('Username is required to complete login');
                }

                username = username.trim();

                // Validate username format
                if (username.length < 3 || username.length > 20) {
                    alert('Username must be between 3 and 20 characters');
                    continue;
                }

                if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                    alert('Username can only contain letters, numbers, underscores, and hyphens');
                    continue;
                }

                // Check if username is already taken
                const usernameQuery = await db.collection('users').where('username', '==', username).get();
                if (!usernameQuery.empty) {
                    alert('Username "' + username + '" is already taken. Please choose another one.');
                    continue;
                }

                usernameValid = true;
            }

            await db.collection('users').doc(user.uid).set({
                email: user.email,
                username: username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                totalBTC: 0,
                level: 1,
                achievements: [],
                isPremium: false
            });

            console.log('✅ Username set in Firestore:', username);

            // Update UI immediately to show the new username
            if (typeof window.updateUserUI === 'function') {
                await updateUserUI(user);
                console.log('✅ UI updated with username after Google login');
            }

            // Initialize empty game data
            await db.collection('users').doc(user.uid).collection('gameData').doc('current').set({
                btcBalance: 0,
                btcLifetime: 0,
                btcClickValue: 0.00000250,
                btcPerSec: 0,
                btcPrice: 100000,
                ethBalance: 0,
                ethLifetime: 0,
                ethClickValue: 0.00007143,
                ethPerSec: 0,
                ethPrice: 3500,
                dogeBalance: 0,
                dogeLifetime: 0,
                dogeClickValue: 1.00000000,
                dogePerSec: 0,
                dogePrice: 0.25,
                dollarBalance: 0,
                hardwareEquity: 0,
                lifetimeEarnings: 0,
                sessionEarnings: 0,
                autoClickerCooldownEnd: 0,
                chartHistory: [],
                chartTimestamps: [],
                chartStartTime: 0,
                totalPowerAvailable: 0,
                powerUpgrades: [],
                btcUpgrades: [],
                ethUpgrades: [],
                dogeUpgrades: [],
                skillTree: {},
                staking: {},
                lastSaved: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ User document created in Firestore');
        } else {
            // Update last login time for existing users
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        showMessage('Welcome back!', 'success');
        return user;

    } catch (error) {
        console.error('❌ Login error:', error);
        let errorMessage = 'Failed to log in';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Try creating an account.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Try again later.';
                break;
            default:
                errorMessage = error.message;
        }

        showMessage(errorMessage, 'error');
        throw error;
    }
}

// Login with Google
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        console.log('✅ Google login successful:', user.email);

        // Check if this is a new user
        const userDoc = await db.collection('users').doc(user.uid).get();

        if (!userDoc.exists) {
            // New user - prompt for username
            let username = null;
            let usernameValid = false;

            while (!usernameValid) {
                username = prompt('Welcome! Please choose a username (3-20 characters, letters, numbers, _ and - only):');

                if (!username) {
                    // User cancelled - sign out and abort
                    try {
                        await auth.signOut();
                    } catch (e) {
                        console.error('Error signing out:', e);
                    }
                    throw new Error('Username is required to create an account');
                }

                username = username.trim();

                // Validate username format
                if (username.length < 3 || username.length > 20) {
                    alert('Username must be between 3 and 20 characters');
                    continue;
                }

                if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                    alert('Username can only contain letters, numbers, underscores, and hyphens');
                    continue;
                }

                // Check if username is already taken
                const usernameQuery = await db.collection('users').where('username', '==', username).get();
                if (!usernameQuery.empty) {
                    alert('Username "' + username + '" is already taken. Please choose another one.');
                    continue;
                }

                usernameValid = true;
            }

            // Create new user profile
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                username: username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                totalBTC: 0,
                level: 1,
                achievements: [],
                isPremium: false,
                photoURL: user.photoURL
            });

            console.log('✅ Username set in Firestore:', username);

            // Update UI immediately to show the new username
            if (typeof window.updateUserUI === 'function') {
                await updateUserUI(user);
                console.log('✅ UI updated with username after email/password registration');
            }

            // Initialize empty game data with correct field names
            await db.collection('users').doc(user.uid).collection('gameData').doc('current').set({
                btcBalance: 0,
                btcLifetime: 0,
                btcClickValue: 0.00000250,
                btcPerSec: 0,
                btcPrice: 100000,
                ethBalance: 0,
                ethLifetime: 0,
                ethClickValue: 0.00007143,
                ethPerSec: 0,
                ethPrice: 3500,
                dogeBalance: 0,
                dogeLifetime: 0,
                dogeClickValue: 1.00000000,
                dogePerSec: 0,
                dogePrice: 0.25,
                dollarBalance: 0,
                hardwareEquity: 0,
                lifetimeEarnings: 0,
                sessionEarnings: 0,
                autoClickerCooldownEnd: 0,
                chartHistory: [],
                chartTimestamps: [],
                chartStartTime: 0,
                totalPowerAvailable: 0,
                powerUpgrades: [],
                btcUpgrades: [],
                ethUpgrades: [],
                dogeUpgrades: [],
                skillTree: {},
                staking: {},
                lastSaved: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        showMessage('Welcome!', 'success');

        // IMPORTANT: The onAuthStateChanged listener will handle UI updates
        // But we can manually trigger it here to ensure immediate response
        console.log('🔄 Google login complete, auth state should update automatically...');

        return user;

    } catch (error) {
        console.error('❌ Google login error:', error);

        if (error.code === 'auth/popup-closed-by-user') {
            showMessage('Login cancelled', 'info');
        } else {
            showMessage('Google login failed: ' + error.message, 'error');
        }

        throw error;
    }
}

// Logout user
async function logoutUser() {
    try {
        console.log('🔓 Starting logout process...');

        // Update leaderboard before logout (for registered users only)
        if (auth.currentUser && !auth.currentUser.isAnonymous && typeof window.updateLeaderboard === 'function') {
            console.log('🏆 Updating leaderboard before logout...');
            try {
                await window.updateLeaderboard();
                console.log('✅ Leaderboard updated');
            } catch (leaderboardError) {
                console.warn('⚠️ Failed to update leaderboard before logout (non-critical):', leaderboardError);
            }
        }

        // Save game before logging out
        if (auth.currentUser && typeof window.saveGameToCloud === 'function') {
            console.log('💾 Saving game before logout...');
            try {
                await window.saveGameToCloud();
                console.log('✅ Game saved');
            } catch (saveError) {
                console.warn('⚠️ Failed to save before logout (non-critical):', saveError);
            }
        }

        console.log('🔐 Signing out from Firebase...');

        // Sign out with a timeout in case Firebase is blocked
        try {
            await Promise.race([
                auth.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            console.log('✅ Signed out from Firebase - auth.currentUser should now be null');
        } catch (signOutError) {
            console.warn('⚠️ Firebase signOut encountered an issue (may be due to network blocking):', signOutError.message);
            // Continue with logout process anyway
        }

        // CRITICAL: Clear all in-memory game state immediately to prevent data leakage
        console.log('🔄 Clearing all in-memory game state...');
        if (typeof window.resetGameVariables === 'function') {
            try {
                window.resetGameVariables();
                console.log('✅ Game variables reset');
            } catch (resetError) {
                console.error('Error resetting game variables:', resetError);
            }
        }

        showMessage('Logged out successfully', 'success');

        // Clear local game data
        // Clear localStorage to prevent data leaking to next user
        console.log('🗑️ Clearing localStorage...');
        localStorage.clear();
        console.log('✅ localStorage cleared');

        // Reset login iframe to clear form state
        const loginScreenDiv = document.getElementById('login-screen');
        if (loginScreenDiv) {
            const iframe = loginScreenDiv.querySelector('iframe');
            if (iframe) {
                console.log('🔄 Reloading login iframe...');
                iframe.src = iframe.src; // Reload iframe to reset form
            }
        }

        // Show login screen again
        if (loginScreenDiv) {
            loginScreenDiv.style.display = 'flex';
        }
        const mainLayout = document.getElementById('main-layout');
        if (mainLayout) {
            mainLayout.style.display = 'grid'; // Keep visible as background
            mainLayout.style.pointerEvents = 'none'; // Disable interaction
            mainLayout.style.userSelect = 'none'; // Disable text selection
        }

        console.log('✅ Logout complete - auth state listener should trigger UI update');

    } catch (error) {
        console.error('❌ Logout error:', error);
        showMessage('Logout failed: ' + error.message, 'error');
    }
}

// Send password reset email
async function resetPassword(email) {
    try {
        if (!email) {
            throw new Error('Email is required');
        }

        await auth.sendPasswordResetEmail(email);
        console.log('✅ Password reset email sent to:', email);
        showMessage('Password reset email sent! Check your inbox.', 'success');

    } catch (error) {
        console.error('❌ Password reset error:', error);
        let errorMessage = 'Failed to send reset email';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            default:
                errorMessage = error.message;
        }

        showMessage(errorMessage, 'error');
        throw error;
    }
}

// Play as guest (anonymous login)
async function playAsGuest() {
    try {
        const userCredential = await auth.signInAnonymously();
        const user = userCredential.user;

        console.log('✅ Guest login successful');

        // Create temporary guest profile
        await db.collection('users').doc(user.uid).set({
            isGuest: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            totalBTC: 0,
            level: 1
        });

        // Initialize empty game data with correct field names
        await db.collection('users').doc(user.uid).collection('gameData').doc('current').set({
            btcBalance: 0,
            btcLifetime: 0,
            btcClickValue: 0.00000250,
            btcPerSec: 0,
            btcPrice: 100000,
            ethBalance: 0,
            ethLifetime: 0,
            ethClickValue: 0.00007143,
            ethPerSec: 0,
            ethPrice: 3500,
            dogeBalance: 0,
            dogeLifetime: 0,
            dogeClickValue: 1.00000000,
            dogePerSec: 0,
            dogePrice: 0.25,
            dollarBalance: 0,
            hardwareEquity: 0,
            lifetimeEarnings: 0,
            sessionEarnings: 0,
            autoClickerCooldownEnd: 0,
            chartHistory: [],
            chartTimestamps: [],
            chartStartTime: 0,
            totalPowerAvailable: 0,
            powerUpgrades: [],
            btcUpgrades: [],
            ethUpgrades: [],
            dogeUpgrades: [],
            skillTree: {},
            staking: {},
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Playing as guest. Click "🔗 LINK ACCOUNT" to create an account and save your progress!', 'info');
        return user;

    } catch (error) {
        console.error('❌ Guest login error:', error);
        showMessage('Failed to start guest session: ' + error.message, 'error');
        throw error;
    }
}

// Link guest account to email/password
async function linkGuestToEmail(email, password, username) {
    try {
        const user = auth.currentUser;

        if (!user || !user.isAnonymous) {
            throw new Error('Not a guest account');
        }

        if (!username || username.trim().length < 3) {
            throw new Error('Username is required and must be at least 3 characters');
        }

        if (username.trim().length > 20) {
            throw new Error('Username must be 20 characters or less');
        }

        // Username validation
        if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
            throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
        }

        const cleanUsername = username.trim();

        // Check if username is already taken
        const usernameQuery = await db.collection('users').where('username', '==', cleanUsername).get();
        if (!usernameQuery.empty) {
            throw new Error('Username is already taken. Please choose another one.');
        }

        const credential = firebase.auth.EmailAuthProvider.credential(email, password);
        const linkedUser = await user.linkWithCredential(credential);

        // Update user profile
        await db.collection('users').doc(user.uid).update({
            email: email,
            username: cleanUsername,
            isGuest: false,
            linkedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Guest account linked to email:', email);
        showMessage('Account created! Your progress is now saved.', 'success');

        return linkedUser.user;

    } catch (error) {
        console.error('❌ Account linking error:', error);
        showMessage('Failed to link account: ' + error.message, 'error');
        throw error;
    }
}

// Helper function to show messages
function showMessage(message, type = 'info') {
    // Create message element if it doesn't exist
    let messageDiv = document.getElementById('auth-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'auth-message';
        document.body.appendChild(messageDiv);
    }

    // Set styling based on message type
    const colors = {
        success: '#4CAF50',
        error: '#ff3344',
        info: '#f7931a',
        warning: '#ff9800'
    };

    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: #fff;
        padding: 15px 30px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 99999;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
    `;

    messageDiv.textContent = message;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export functions for global use
window.registerUser = registerUser;
window.loginUser = loginUser;
window.loginWithGoogle = loginWithGoogle;
window.logoutUser = logoutUser;
window.resetPassword = resetPassword;
window.playAsGuest = playAsGuest;
window.linkGuestToEmail = linkGuestToEmail;

// Setup authentication state listener
// This will be called after Firebase initializes
function setupAuthListener() {
    console.log('🔍 Setting up authentication listener...');

    if (!auth) {
        console.error('❌ Auth not initialized!');
        return;
    }

    // Listen for authentication state changes
    auth.onAuthStateChanged(async (user) => {
        console.log('🔄 Auth state changed!');

        if (user) {
            console.log('✅ User is logged in:', user.email || user.displayName || 'Guest User');
            console.log('User UID:', user.uid);

            // Check age disclaimer and terms before showing game
            const ageAccepted = localStorage.getItem('ageDisclaimerAccepted');
            const termsAccepted = localStorage.getItem('termsAccepted');

            if (!ageAccepted) {
                console.log('⚠️ Age disclaimer not accepted - showing age modal');
                if (typeof window.checkAgeDisclaimer === 'function') {
                    window.checkAgeDisclaimer();
                }
            }

            // Hide login screen
            const loginScreen = document.getElementById('login-screen');
            console.log('Login screen element found?', !!loginScreen);
            if (loginScreen) {
                console.log('Hiding login screen...');
                loginScreen.style.display = 'none';
            }

            // Show main game layout (and enable interactions)
            const mainLayout = document.getElementById('main-layout');
            console.log('Main layout element found?', !!mainLayout);
            if (mainLayout) {
                console.log('Showing main game layout...');
                mainLayout.style.display = 'grid';
                mainLayout.style.pointerEvents = 'auto'; // Re-enable interaction
                mainLayout.style.userSelect = 'auto'; // Re-enable text selection
            }

            // Update user UI with login info (shows username)
            if (window.updateUserUI) {
                window.updateUserUI(user);
            }

            // Hide the login button since user is logged in
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }

            // Load user's game data (smart merge with local save)
            console.log('loadGameFromCloud function available?', typeof window.loadGameFromCloud);
            if (window.loadGameFromCloud) {
                console.log('Loading game data from cloud...');
                try {
                    await window.loadGameFromCloud(user.uid);
                    console.log('✅ Game data loaded successfully');

                    // Re-initialize the game UI after loading
                    if (typeof window.initializeGame === 'function') {
                        console.log('Re-initializing game shops and UI...');
                        try {
                            // Initialize shops and UI elements
                            if (typeof window.initBtcShop === 'function') window.initBtcShop();
                            if (typeof window.initEthShop === 'function') window.initEthShop();
                            if (typeof window.initDogeShop === 'function') window.initDogeShop();
                            if (typeof window.initPowerShop === 'function') window.initPowerShop();
                            if (typeof window.updateAutoClickerButtonState === 'function') window.updateAutoClickerButtonState();
                            console.log('✅ Game shops re-initialized');
                        } catch (initError) {
                            console.error('⚠️ Error re-initializing shops:', initError);
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to load game data:', error);
                }
            } else {
                console.warn('⚠️ loadGameFromCloud function not available');
            }

            // Start leaderboard updates
            if (window.startLeaderboardUpdates) {
                window.startLeaderboardUpdates();
            }

            // Start auto-save to cloud (every 60 seconds)
            if (window.startAutoSave) {
                console.log('Starting auto-save...');
                window.startAutoSave();
            }

            console.log('🎮 Auth state handling complete - game should be visible now');
        } else {
            console.log('ℹ️ No user logged in - clearing game state and showing login screen');

            // CRITICAL: Clear all in-memory game state when user logs out
            console.log('🔄 Clearing all game variables on logout...');
            if (typeof window.resetGameVariables === 'function') {
                try {
                    window.resetGameVariables();
                    console.log('✅ Game variables cleared on logout');
                } catch (resetError) {
                    console.error('Error resetting game variables on logout:', resetError);
                }
            }

            // Stop leaderboard updates
            if (window.stopLeaderboardUpdates) {
                window.stopLeaderboardUpdates();
            }

            // Stop auto-save
            if (window.stopAutoSave) {
                window.stopAutoSave();
            }

            // Show main game layout in background (disabled)
            const mainLayout = document.getElementById('main-layout');
            if (mainLayout) {
                mainLayout.style.display = 'grid';
                mainLayout.style.pointerEvents = 'none'; // Disable interaction
                mainLayout.style.userSelect = 'none'; // Disable text selection
            }

            // Show login screen for new users
            // They can login, register, or skip to play offline
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.style.display = 'flex';
            }

            // Show the login button (for users who skipped or are in offline mode)
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
                loginBtn.textContent = 'LOGIN / SIGN UP';
            }

            console.log('✅ Logout complete - UI updated and game state cleared');
        }
    });
}

// Make it globally available
window.setupAuthListener = setupAuthListener;

// Listen for messages from iframe (for cross-origin guest login)
window.addEventListener('message', async function(event) {
    if (event.data && event.data.action === 'playAsGuest') {
        console.log('📨 Received playAsGuest message from iframe');
        try {
            await playAsGuest();
        } catch (error) {
            console.error('❌ Failed to play as guest:', error);
        }
    }
});

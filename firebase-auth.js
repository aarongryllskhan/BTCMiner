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

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log('✅ User registered:', user.email);

        // Create user profile in Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            username: username || email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            totalBTC: 0,
            level: 1,
            achievements: [],
            isPremium: false
        });

        // Initialize empty game data
        await db.collection('users').doc(user.uid).collection('gameData').doc('current').set({
            btc: 0,
            bitcoinPerSecond: 0,
            upgrades: {},
            skills: {},
            achievements: [],
            totalEarned: 0,
            totalSpent: 0,
            playTime: 0,
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

        // Update last login time
        await db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

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
            // Create new user profile
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                username: user.displayName || user.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                totalBTC: 0,
                level: 1,
                achievements: [],
                isPremium: false,
                photoURL: user.photoURL
            });

            // Initialize empty game data
            await db.collection('users').doc(user.uid).collection('gameData').doc('current').set({
                btc: 0,
                bitcoinPerSecond: 0,
                upgrades: {},
                skills: {},
                achievements: [],
                totalEarned: 0,
                totalSpent: 0,
                playTime: 0,
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
        // Save game before logging out
        if (auth.currentUser) {
            await saveGameToCloud();
        }

        await auth.signOut();
        console.log('✅ User logged out');
        showMessage('Logged out successfully', 'success');

        // Clear local game data
        // Clear localStorage to prevent data leaking to next user
        localStorage.clear();

        // Reset login iframe to clear form state
        const loginScreenDiv = document.getElementById('login-screen');
        if (loginScreenDiv) {
            const iframe = loginScreenDiv.querySelector('iframe');
            if (iframe) {
                iframe.src = iframe.src; // Reload iframe to reset form
            }
        }

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

        // Initialize empty game data
        await db.collection('users').doc(user.uid).collection('gameData').doc('current').set({
            btc: 0,
            bitcoinPerSecond: 0,
            upgrades: {},
            skills: {},
            achievements: [],
            totalEarned: 0,
            totalSpent: 0,
            playTime: 0,
            lastSaved: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Playing as guest. Click "☁️ Save to Cloud" to create an account and save your progress!', 'info');
        return user;

    } catch (error) {
        console.error('❌ Guest login error:', error);
        showMessage('Failed to start guest session: ' + error.message, 'error');
        throw error;
    }
}

// Link guest account to email/password
async function linkGuestToEmail(email, password) {
    try {
        const user = auth.currentUser;

        if (!user || !user.isAnonymous) {
            throw new Error('Not a guest account');
        }

        const credential = firebase.auth.EmailAuthProvider.credential(email, password);
        const linkedUser = await user.linkWithCredential(credential);

        // Update user profile
        await db.collection('users').doc(user.uid).update({
            email: email,
            username: email.split('@')[0],
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

            // Hide login screen
            const loginScreen = document.getElementById('login-screen');
            console.log('Login screen element found?', !!loginScreen);
            if (loginScreen) {
                console.log('Hiding login screen...');
                loginScreen.style.display = 'none';
            }

            // Show main game layout
            const mainLayout = document.getElementById('main-layout');
            console.log('Main layout element found?', !!mainLayout);
            if (mainLayout) {
                console.log('Showing main game layout...');
                mainLayout.style.display = 'grid';
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

            console.log('🎮 Auth state handling complete - game should be visible now');
        } else {
            console.log('ℹ️ No user logged in - showing login screen');

            // Stop leaderboard updates
            if (window.stopLeaderboardUpdates) {
                window.stopLeaderboardUpdates();
            }

            // Show login screen for new users
            // They can login, register, or skip to play offline
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.style.display = 'flex';
            }

            // Show the login button (for users who skipped)
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
            }
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

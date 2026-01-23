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

// Show warning modal when guest tries to logout
function showGuestLogoutWarning(guestUsername, onContinue) {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'guest-logout-warning-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease-out;
    `;

    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 40px;
            border-radius: 16px;
            max-width: 500px;
            width: 90%;
            border: 3px solid #ff3344;
            box-shadow: 0 0 50px rgba(255, 51, 68, 0.4);
            text-align: center;
        ">
            <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #ff3344; margin-bottom: 15px; font-size: 1.8rem;">Guest Account Warning</h2>
            <p style="color: #fff; margin-bottom: 20px; font-size: 1.1rem; line-height: 1.6;">
                You are logged in as <strong>${guestUsername}</strong> (guest account).
            </p>
            <p style="color: #ffcccc; margin-bottom: 30px; font-size: 1rem; line-height: 1.6;">
                ⚠️ <strong>If you logout now, ALL your progress will be lost!</strong><br><br>
                Guest accounts do not save progress when you log out.
            </p>
            <div style="background: rgba(255, 51, 68, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #ff3344;">
                <p style="color: #fff; margin: 0; font-size: 0.95rem;">
                    💡 <strong>To save your progress, create a permanent account:</strong><br>
                    Click the <strong>"🔗 LINK ACCOUNT"</strong> button in the top-right corner.
                </p>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="document.getElementById('guest-logout-warning-modal')?.remove()" style="
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: #fff;
                    border: none;
                    padding: 15px 40px;
                    font-size: 1rem;
                    font-weight: 700;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ✓ Continue Playing
                </button>
                <button onclick="window._confirmGuestLogout();" style="
                    background: linear-gradient(135deg, #ff3344 0%, #cc0000 100%);
                    color: #fff;
                    border: none;
                    padding: 15px 40px;
                    font-size: 1rem;
                    font-weight: 700;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ✗ Logout Anyway
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Store the function to be called if logout is confirmed
    window._confirmGuestLogout = () => {
        modal.remove();
        performLogout();
    };
}

// Logout user - shows warning if guest
async function logoutUser() {
    // Check if user is a guest and show warning
    if (auth.currentUser && auth.currentUser.isAnonymous) {
        console.log('⚠️ Guest user attempting to logout - showing warning...');
        const guestUsername = localStorage.getItem('guestUsername') || 'Guest';

        // Show a modal warning for guest logout
        showGuestLogoutWarning(guestUsername, window._confirmGuestLogout);
        return; // Don't proceed with logout yet
    }

    // Not a guest, proceed with logout
    await performLogout();
}

// Perform the actual logout (called after user confirms)
async function performLogout() {
    try {
        console.log('🔓 Starting logout process...');

        // Update leaderboard before logout (for all users including guests)
        if (auth.currentUser && typeof window.updateLeaderboard === 'function') {
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

            // Verify auth state is actually cleared
            if (auth.currentUser) {
                console.warn('⚠️ WARNING: auth.currentUser still exists after signOut!');
            }
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

        // Clear local game data while preserving important flags
        console.log('🗑️ Clearing localStorage (preserving important flags)...');
        try {
            // Save flags that should persist across account switches
            const ageDisclaimerAccepted = localStorage.getItem('ageDisclaimerAccepted');
            const termsAccepted = localStorage.getItem('termsAccepted');
            const cookieConsent = localStorage.getItem('cookieConsent');
            const cookieConsentDate = localStorage.getItem('cookieConsentDate');
            // IMPORTANT: Preserve guest credentials so they can sign back in
            const guestUserUid = localStorage.getItem('guestUserUid');
            const guestUsername = localStorage.getItem('guestUsername');

            // Clear all localStorage
            localStorage.clear();

            // Restore flags that should persist across account switches
            if (ageDisclaimerAccepted) {
                localStorage.setItem('ageDisclaimerAccepted', ageDisclaimerAccepted);
            }
            if (termsAccepted) {
                localStorage.setItem('termsAccepted', termsAccepted);
            }
            if (cookieConsent) {
                localStorage.setItem('cookieConsent', cookieConsent);
            }
            if (cookieConsentDate) {
                localStorage.setItem('cookieConsentDate', cookieConsentDate);
            }
            // Restore guest credentials so they can sign back in as the same guest
            if (guestUserUid) {
                localStorage.setItem('guestUserUid', guestUserUid);
            }
            if (guestUsername) {
                localStorage.setItem('guestUsername', guestUsername);
            }

            console.log('✅ localStorage cleared (important flags preserved including guest credentials)');
        } catch (e) {
            console.warn('⚠️ Could not clear localStorage (may be in private mode)');
        }

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
        // Check if we have a previous guest UID and username saved in localStorage
        const previousGuestUid = localStorage.getItem('guestUserUid');
        const previousGuestUsername = localStorage.getItem('guestUsername');

        console.log('👤 Attempting to load previous guest account...');
        console.log('   Previous UID from storage:', previousGuestUid);
        console.log('   Previous Username from storage:', previousGuestUsername);

        // IMPORTANT: First, always sign in anonymously to get current Firebase auth state
        const userCredential = await auth.signInAnonymously();
        const currentUser = userCredential.user;
        console.log('✅ Anonymous login successful, Current UID:', currentUser.uid);

        // Now check if we have a PREVIOUSLY saved guest account to restore
        if (previousGuestUsername) {
            console.log('🔍 Searching for previous guest account by username:', previousGuestUsername);
            try {
                // Try to find the previous guest account by username (not by UID, since UID might change)
                const guestQuery = await db.collection('users')
                    .where('username', '==', previousGuestUsername)
                    .where('isGuest', '==', true)
                    .limit(1)
                    .get();

                if (!guestQuery.empty) {
                    const previousGuestDoc = guestQuery.docs[0];
                    const previousUidInDb = previousGuestDoc.id; // Actual UID stored in Firestore
                    console.log('✅ Found previous guest account! Username:', previousGuestUsername, 'UID in DB:', previousUidInDb);

                    // If the current Firebase UID is different from the previous one, migrate the account
                    if (currentUser.uid !== previousUidInDb) {
                        console.log('⚠️ Firebase assigned a different UID. Migrating guest account from', previousUidInDb, 'to', currentUser.uid);

                        const guestData = previousGuestDoc.data();

                        // Copy all user data to the new UID
                        await db.collection('users').doc(currentUser.uid).set({
                            ...guestData,
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        // Copy game data subcollection
                        const gameDataDocs = await db.collection('users').doc(previousUidInDb).collection('gameData').get();
                        for (const doc of gameDataDocs.docs) {
                            await db.collection('users').doc(currentUser.uid).collection('gameData').doc(doc.id).set(doc.data());
                        }

                        // Delete the old guest account to avoid duplicates
                        await db.collection('users').doc(previousUidInDb).delete();
                        console.log('✅ Migrated guest account to new UID and deleted old account');
                    } else {
                        // Same UID, just update last login
                        console.log('✅ Same UID returned. Just updating last login...');
                        await db.collection('users').doc(currentUser.uid).update({
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }

                    // Update localStorage with current UID
                    localStorage.setItem('guestUserUid', currentUser.uid);
                    localStorage.setItem('guestUsername', previousGuestUsername);

                    if (typeof window.updateUserUI === 'function') {
                        await window.updateUserUI(currentUser);
                    }
                    showMessage(`Welcome back, ${previousGuestUsername}!`, 'success');
                    return currentUser;
                } else {
                    console.log('⚠️ Previous guest username not found in database. Creating new guest account.');
                }
            } catch (searchError) {
                console.error('⚠️ Error searching for previous guest account:', searchError);
                console.log('Creating new guest account instead...');
            }
        }

        // No previous guest found or failed to load - create a BRAND NEW guest account
        console.log('🆕 Creating brand new guest account (no previous guest found)...');
        // Note: currentUser is already signed in from line 613 above
        const user = currentUser;

        // Get the next guest number using a counter document to avoid race conditions
        let guestNumber = 1;
        try {
            const counterRef = db.collection('counters').doc('guestCounter');

            // Use a transaction to safely increment the counter
            const newGuestNumber = await db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);

                let nextNumber = 1;
                if (counterDoc.exists) {
                    nextNumber = (counterDoc.data().count || 0) + 1;
                } else {
                    // Initialize counter if it doesn't exist
                    transaction.set(counterRef, { count: 1, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() });
                    return 1;
                }

                transaction.update(counterRef, {
                    count: nextNumber,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });

                return nextNumber;
            });

            guestNumber = newGuestNumber;
            console.log('✅ Guest number assigned:', guestNumber);
        } catch (queryError) {
            console.warn('⚠️ Could not get guest counter, using timestamp fallback:', queryError);
            // Fallback to using timestamp-based number to ensure uniqueness
            guestNumber = Date.now() % 100000; // Use last 5 digits of timestamp
        }

        // Format guest username with leading zeros (e.g., guest01, guest02, ...)
        const guestUsername = `guest${String(guestNumber).padStart(2, '0')}`;
        console.log('👤 Creating guest user:', guestUsername);

        // Create temporary guest profile
        await db.collection('users').doc(user.uid).set({
            username: guestUsername,
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

        console.log('✅ Guest profile and game data created successfully');
        console.log('📝 Guest username in Firestore:', guestUsername);

        // Save guest credentials to localStorage for future sessions
        localStorage.setItem('guestUserUid', user.uid);
        localStorage.setItem('guestUsername', guestUsername);
        // Mark this as a fresh guest account that needs a refresh
        localStorage.setItem('guestNeedsRefresh', 'true');
        console.log('💾 Guest credentials saved to localStorage');

        // Show refresh modal for new guests
        showGuestRefreshModal(guestUsername);

        return user;

    } catch (error) {
        console.error('❌ Guest login error:', error);
        showMessage('Failed to start guest session: ' + error.message, 'error');
        throw error;
    }
}

// Link guest account to email/password by creating a new account and copying progress
async function linkGuestToEmail(email, password, username) {
    try {
        const guestUser = auth.currentUser;

        if (!guestUser || !guestUser.isAnonymous) {
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
        const guestUid = guestUser.uid;

        // Check if username is already taken
        const usernameQuery = await db.collection('users').where('username', '==', cleanUsername).get();
        if (!usernameQuery.empty) {
            throw new Error('Username is already taken. Please choose another one.');
        }

        // Check if email is already in use
        try {
            const userByEmail = await auth.fetchSignInMethodsForEmail(email);
            if (userByEmail && userByEmail.length > 0) {
                throw new Error('This email is already in use. Please use a different email.');
            }
        } catch (emailCheckError) {
            if (emailCheckError.code === 'auth/invalid-email') {
                throw new Error('Please enter a valid email address.');
            }
            if (!emailCheckError.message.includes('already in use')) {
                throw emailCheckError;
            }
        }

        console.log('📝 Creating new account with email/password...');

        // Step 1: Create a new account with email/password
        const newUserCredential = await auth.createUserWithEmailAndPassword(email, password);
        const newUser = newUserCredential.user;
        console.log('✅ New account created with UID:', newUser.uid);

        // Step 2: Copy guest account data to new account
        console.log('📋 Copying guest progress to new account...');

        // Get guest's Firestore user document
        const guestDoc = await db.collection('users').doc(guestUid).get();
        if (guestDoc.exists) {
            const guestData = guestDoc.data();

            // Create new user document with guest's progress
            await db.collection('users').doc(newUser.uid).set({
                email: email,
                username: cleanUsername,
                isGuest: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                linkedFromGuest: guestUid,
                linkedAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Copy relevant data from guest account
                totalBTC: guestData.totalBTC || 0,
                level: guestData.level || 1,
                isPremium: guestData.isPremium || false
            });

            // Copy game data subcollection
            const gameDataDocs = await db.collection('users').doc(guestUid).collection('gameData').get();
            for (const doc of gameDataDocs.docs) {
                await db.collection('users').doc(newUser.uid).collection('gameData').doc(doc.id).set(doc.data());
            }

            console.log('✅ Guest progress copied to new account');

            // Step 3: Delete the old guest account from Firestore
            console.log('🗑️ Removing guest account...');
            await db.collection('users').doc(guestUid).delete();
            console.log('✅ Guest account removed');
        }

        // Step 4: Sign out the guest and sign in as the new user
        console.log('🔄 Signing in with new account...');
        await auth.signOut();

        // Sign in with the new email/password
        const signInResult = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Signed in as new account:', email);

        // Clear guest credentials from localStorage since they're no longer needed
        localStorage.removeItem('guestUserUid');
        localStorage.removeItem('guestUsername');

        showMessage('Account created successfully! Your progress has been saved.', 'success');

        return signInResult.user;

    } catch (error) {
        console.error('❌ Account creation/linking error:', error);

        // Provide helpful error messages for common issues
        if (error.code === 'auth/email-already-in-use') {
            showMessage('This email is already in use. Please use a different email.', 'error');
        } else if (error.code === 'auth/invalid-email') {
            showMessage('Please enter a valid email address.', 'error');
        } else if (error.code === 'auth/weak-password') {
            showMessage('Password must be at least 6 characters.', 'error');
        } else if (error.code === 'auth/operation-not-allowed') {
            showMessage('Email/password authentication is not enabled. Please contact support.', 'error');
        } else {
            showMessage('Failed to create account: ' + error.message, 'error');
        }

        throw error;
    }
}

// Save user consent to Firebase
async function saveConsentToFirebase(userId) {
    try {
        if (!userId) {
            console.warn('⚠️ No user ID provided for consent save');
            return;
        }

        const consentData = {
            ageDisclaimerAccepted: window.safeStorage.getItem('ageDisclaimerAccepted') === 'true',
            termsAccepted: window.safeStorage.getItem('termsAccepted') === 'true',
            cookieConsent: window.safeStorage.getItem('cookieConsent') === 'true',
            cookieConsentDate: window.safeStorage.getItem('cookieConsentDate') || null,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(userId).update({
            consent: consentData
        });

        console.log('✅ Consent saved to Firebase for user:', userId);
    } catch (error) {
        console.error('❌ Failed to save consent to Firebase:', error);
        // Non-critical error - don't throw
    }
}

// Load user consent from Firebase
async function loadConsentFromFirebase(userId) {
    try {
        if (!userId) {
            console.warn('⚠️ No user ID provided for consent load');
            return false;
        }

        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            console.warn('⚠️ User document not found in Firestore');
            return false;
        }

        const userData = userDoc.data();
        if (!userData.consent) {
            console.log('ℹ️ No consent data found in Firebase for user');
            return false;
        }

        const consent = userData.consent;

        // Load consent into localStorage/safeStorage if it's already been accepted
        if (consent.ageDisclaimerAccepted) {
            window.safeStorage.setItem('ageDisclaimerAccepted', 'true');
            console.log('✅ Loaded ageDisclaimerAccepted from Firebase');
        }

        if (consent.termsAccepted) {
            window.safeStorage.setItem('termsAccepted', 'true');
            console.log('✅ Loaded termsAccepted from Firebase');
        }

        if (consent.cookieConsent) {
            window.safeStorage.setItem('cookieConsent', 'true');
            console.log('✅ Loaded cookieConsent from Firebase');
        }

        if (consent.cookieConsentDate) {
            window.safeStorage.setItem('cookieConsentDate', consent.cookieConsentDate);
            console.log('✅ Loaded cookieConsentDate from Firebase');
        }

        console.log('✅ All consent data loaded from Firebase');
        return true;

    } catch (error) {
        console.error('❌ Failed to load consent from Firebase:', error);
        return false;
    }
}

// Show refresh modal for new guest users
function showGuestRefreshModal(guestUsername) {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'guest-refresh-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.3s ease-out;
    `;

    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 40px;
            border-radius: 16px;
            max-width: 450px;
            width: 90%;
            border: 3px solid #f7931a;
            box-shadow: 0 0 50px rgba(247, 147, 26, 0.4);
            text-align: center;
        ">
            <div style="font-size: 4rem; margin-bottom: 20px;">🎮</div>
            <h2 style="color: #f7931a; margin-bottom: 15px; font-size: 1.8rem;">Welcome, ${guestUsername}!</h2>
            <p style="color: #ccc; margin-bottom: 25px; font-size: 1rem; line-height: 1.5;">
                Your guest account has been created successfully!
                <br><br>
                Please refresh the page to fully initialize the game and start mining.
            </p>
            <button onclick="location.reload()" style="
                background: linear-gradient(135deg, #f7931a 0%, #ff6b00 100%);
                color: #fff;
                border: none;
                padding: 18px 50px;
                font-size: 1.2rem;
                font-weight: 800;
                border-radius: 10px;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 4px 15px rgba(247, 147, 26, 0.4);
                transition: transform 0.2s, box-shadow 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(247, 147, 26, 0.6)';"
               onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(247, 147, 26, 0.4)';">
                🔄 Refresh & Start Mining
            </button>
            <p style="color: #666; font-size: 0.8rem; margin-top: 20px;">
                Your progress will be saved automatically every 5 minutes.
            </p>
        </div>
    `;

    document.body.appendChild(modal);
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
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

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
window.saveConsentToFirebase = saveConsentToFirebase;
window.loadConsentFromFirebase = loadConsentFromFirebase;

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

            // Clear the guestNeedsRefresh flag on page load (user has refreshed)
            if (localStorage.getItem('guestNeedsRefresh')) {
                console.log('✅ Guest has refreshed - clearing refresh flag');
                localStorage.removeItem('guestNeedsRefresh');
            }

            // Load consent from Firebase if available
            console.log('📥 Loading consent from Firebase...');
            await loadConsentFromFirebase(user.uid);

            // Check age disclaimer and terms before showing game
            const ageAccepted = window.safeStorage.getItem('ageDisclaimerAccepted');
            const termsAccepted = window.safeStorage.getItem('termsAccepted');

            // ONLY show onboarding if BOTH have not been accepted
            // Once both are accepted, never show again
            const bothAccepted = ageAccepted && termsAccepted;
            if (!bothAccepted) {
                console.log('⚠️ Onboarding not fully accepted - will show modal');
            } else {
                console.log('✅ Both age and terms already accepted - skipping onboarding');
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
                // Enable interaction
                mainLayout.style.pointerEvents = 'auto'; // Re-enable interaction
                mainLayout.style.userSelect = 'auto'; // Re-enable text selection
                mainLayout.style.visibility = 'visible'; // Ensure visibility
                mainLayout.style.opacity = '1'; // Ensure full opacity

                // Force layout recalculation
                mainLayout.offsetHeight;

                // Re-apply responsive mobile layout if needed
                if (typeof enforceMobileLayout === 'function') {
                    enforceMobileLayout();
                }
            }

            // Show onboarding modal if not accepted (age + terms)
            if (!ageAccepted || !termsAccepted) {
                const onboardingModal = document.getElementById('onboarding-modal');
                if (onboardingModal) {
                    console.log('Showing onboarding modal after login...');
                    onboardingModal.classList.add('show');
                }
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

                            // Reinitialize chart with loaded data
                            if (typeof window.reinitializeChart === 'function') {
                                console.log('Re-initializing chart with loaded data...');
                                window.reinitializeChart();
                            }

                            // Force display update
                            if (typeof window.updateDisplay === 'function') {
                                console.log('Updating display...');
                                window.updateDisplay();
                            }

                            console.log('✅ Game shops and UI re-initialized');
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

            // Start auto-save to cloud
            if (window.startAutoSave) {
                console.log('Starting auto-save...');
                window.startAutoSave();
            }

            // For guest users, do initial saves more frequently to prevent progress loss
            if (user.isAnonymous && window.saveGameToCloud) {
                // First save after 10 seconds
                setTimeout(async () => {
                    console.log('💾 Initial save for guest user (10 second delay)...');
                    try {
                        await window.saveGameToCloud(false);
                        console.log('✅ Guest initial save complete');
                    } catch (saveError) {
                        console.warn('⚠️ Guest initial save failed:', saveError);
                    }
                }, 10000);

                // Second save after 60 seconds
                setTimeout(async () => {
                    console.log('💾 Second save for guest user (60 second delay)...');
                    try {
                        await window.saveGameToCloud(false);
                        console.log('✅ Guest second save complete');
                    } catch (saveError) {
                        console.warn('⚠️ Guest second save failed:', saveError);
                    }
                }, 60000);
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
                mainLayout.style.pointerEvents = 'none'; // Disable interaction
                mainLayout.style.userSelect = 'none'; // Disable text selection

                // Re-apply responsive mobile layout
                if (typeof enforceMobileLayout === 'function') {
                    enforceMobileLayout();
                }
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

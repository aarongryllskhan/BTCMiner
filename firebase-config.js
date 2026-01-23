/**
 * Firebase Configuration for Idle BTC Miner
 * Copyright © 2026 Aaron Khan. All Rights Reserved.
 */

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRKOx0sCWbgxjOy2l2M4inQo8CJdY6iwU",
  authDomain: "idle-btc-miner-39d27.firebaseapp.com",
  projectId: "idle-btc-miner-39d27",
  storageBucket: "idle-btc-miner-39d27.firebasestorage.app",
  messagingSenderId: "1019206255931",
  appId: "1:1019206255931:web:967367f9a1831c7e87231e",
  measurementId: "G-02GKDK0M26"
};

// Initialize Firebase
let app;
let auth;
let db;

async function initializeFirebase() {
    try {
        // Initialize Firebase App
        app = firebase.initializeApp(firebaseConfig);

        // Initialize Firebase Authentication
        auth = firebase.auth();

        // Enable auth persistence so guest users stay logged in across page refreshes
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        console.log('✅ Firebase auth persistence enabled (LOCAL)');

        // Initialize Firestore Database
        db = firebase.firestore();

        console.log('✅ Firebase initialized successfully!');

        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        alert('Failed to connect to cloud services. Playing in offline mode.');
        return false;
    }
}

// Called when user logs in
function onUserLogin(user) {
    // Hide login screen, show game (and enable interaction)
    if (document.getElementById('login-screen')) {
        document.getElementById('login-screen').style.display = 'none';
    }
    const mainLayout = document.getElementById('main-layout');
    if (mainLayout) {
        mainLayout.style.display = 'grid';
        mainLayout.style.pointerEvents = 'auto'; // Re-enable interaction
        mainLayout.style.userSelect = 'auto'; // Re-enable text selection
    }

    // Load game data from cloud
    if (window.loadGameFromCloud) {
        loadGameFromCloud(user.uid);
    }

    // Update UI with user info
    updateUserUI(user);

    // Check if onboarding (age + terms) has been accepted
    setTimeout(() => {
        const ageAccepted = window.safeStorage.getItem('ageDisclaimerAccepted');
        const termsAccepted = window.safeStorage.getItem('termsAccepted');
        const bothAccepted = ageAccepted && termsAccepted;

        if (!bothAccepted) {
            console.log('📋 Showing onboarding modal after login');
            const onboardingModal = document.getElementById('onboarding-modal');
            if (onboardingModal) {
                onboardingModal.classList.add('show');
            }
        }
    }, 300);
}

// Called when user logs out
function onUserLogout() {
    // Show login screen, keep game visible as background
    if (document.getElementById('login-screen')) {
        document.getElementById('login-screen').style.display = 'flex';
    }
    const mainLayout = document.getElementById('main-layout');
    if (mainLayout) {
        mainLayout.style.display = 'grid'; // Keep visible as background
        mainLayout.style.pointerEvents = 'none'; // Disable interaction
        mainLayout.style.userSelect = 'none'; // Disable text selection
    }
}

// Update UI with user information
async function updateUserUI(user) {
    const userId = user.uid;
    const isGuest = user.isAnonymous;

    // Fetch username from Firestore
    let displayName = isGuest ? 'Guest' : 'User';
    try {
        // First attempt - get the document immediately
        let userDoc = await db.collection('users').doc(userId).get();
        console.log('📋 User doc fetch - exists:', userDoc.exists, 'username:', userDoc.data()?.username);

        // If document exists and has username, use it immediately (returning user)
        if (userDoc.exists && userDoc.data()?.username) {
            displayName = userDoc.data().username;
            console.log('✅ Username fetched immediately from Firestore:', displayName);
        } else if (isGuest) {
            // For NEW guest users, retry a few times (document may still be creating)
            // But use shorter retries - only 5 attempts × 300ms = 1.5 seconds max
            let retries = 0;
            const maxRetries = 5;

            while ((!userDoc.exists || !userDoc.data()?.username) && retries < maxRetries) {
                console.log(`⏳ Waiting for guest username... (attempt ${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms
                userDoc = await db.collection('users').doc(userId).get();
                retries++;

                if (userDoc.exists && userDoc.data()?.username) {
                    displayName = userDoc.data().username;
                    console.log('✅ Username fetched from Firestore after retry:', displayName);
                    break;
                }
            }

            // If still no username after retries, use fallback
            if (!userDoc.exists || !userDoc.data()?.username) {
                console.warn('⚠️ Guest username not found, using fallback');
                displayName = `guest${Date.now() % 10000}`;
            }
        } else {
            // For non-guest users without username, try other fallbacks
            if (user.displayName) {
                displayName = user.displayName;
            } else if (user.email) {
                displayName = user.email.split('@')[0];
            }
        }
    } catch (error) {
        console.error('Failed to fetch username:', error);
        if (isGuest) {
            displayName = `guest${Date.now() % 10000}`;
        } else if (user.displayName) {
            displayName = user.displayName;
        } else if (user.email) {
            displayName = user.email.split('@')[0];
        }
    }

    // Show the LOGIN/SIGN UP button only for guest users
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.style.display = isGuest ? 'inline-block' : 'none';
        loginBtn.textContent = '🔗 LINK ACCOUNT';
        // Update onclick handler for guest users
        if (isGuest) {
            loginBtn.onclick = () => showLinkAccountModal();
        } else {
            loginBtn.onclick = () => showLoginScreen();
        }
    }

    // Create or get user info display - insert it next to login button
    let userInfoDiv = document.getElementById('user-info-display');
    if (!userInfoDiv) {
        userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'user-info-display';
        // Insert after login button in the button row
        if (loginBtn && loginBtn.parentNode) {
            loginBtn.parentNode.insertBefore(userInfoDiv, loginBtn.nextSibling);
        } else {
            document.body.appendChild(userInfoDiv);
        }
    }

    userInfoDiv.style.cssText = 'display: inline-flex; align-items: center; background: rgba(0,0,0,0.8); padding: 4px 10px; border-radius: 4px; border: 1px solid #f7931a;';

    userInfoDiv.innerHTML = `
        <span style="color: #f7931a; font-size: 0.55rem;">👤</span>
        <span style="color: #fff; font-size: 0.55rem; font-weight: 700; margin: 0 6px;">${displayName}</span>
        <button id="logout-button-ui" style="background: #ff3344; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.55rem; font-weight: 700; margin-left: 4px;">
            Logout
        </button>
    `;

    // Add click handler to logout button
    const logoutButton = document.getElementById('logout-button-ui');
    if (logoutButton) {
        console.log('Attaching logout handler, window.logoutUser exists?', typeof window.logoutUser);
        logoutButton.addEventListener('click', async () => {
            console.log('Logout button clicked!');
            if (typeof window.logoutUser === 'function') {
                console.log('Calling logoutUser...');
                await window.logoutUser();
            } else {
                console.error('window.logoutUser is not a function!');
            }
        });
    } else {
        console.error('Logout button not found!');
    }
}

// Manual save function
async function manualSaveGame() {
    const btn = document.getElementById('manual-save-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '📤 Uploading...';
    }

    const success = await saveGameToCloud(true); // Pass true to indicate manual save

    if (btn) {
        if (success) {
            btn.innerHTML = '✓ Uploaded!';
            setTimeout(() => {
                btn.innerHTML = '📤 Transfer';
                btn.disabled = false;
            }, 2000);
        } else {
            btn.innerHTML = '✗ Failed';
            setTimeout(() => {
                btn.innerHTML = '📤 Transfer';
                btn.disabled = false;
            }, 2000);
        }
    }
}

window.manualSaveGame = manualSaveGame;

// Show modal to link guest account to email
function showLinkAccountModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('link-account-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'link-account-modal';
        modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 100000; justify-content: center; align-items: center;';

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px; border-radius: 12px; max-width: 500px; border: 2px solid #f7931a; box-shadow: 0 0 30px rgba(247,147,26,0.5);">
                <h2 style="color: #f7931a; margin-bottom: 20px; font-size: 2rem; text-align: center;">☁️ Create Account</h2>
                <p style="color: #ccc; margin-bottom: 20px; text-align: center;">Link your account to sync progress across devices. Auto-saves to cloud every 20 minutes!</p>

                <form onsubmit="handleLinkAccount(event)" style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="color: #aaa; font-size: 0.9rem; display: block; margin-bottom: 5px;">Username</label>
                        <input type="text" id="link-username" required placeholder="3-20 characters" minlength="3" maxlength="20" pattern="[a-zA-Z0-9_-]+" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #555; border-radius: 8px; color: #fff; font-size: 1rem;">
                        <small style="color: #888; font-size: 0.75rem;">Letters, numbers, _ and - only</small>
                    </div>

                    <div>
                        <label style="color: #aaa; font-size: 0.9rem; display: block; margin-bottom: 5px;">Email</label>
                        <input type="email" id="link-email" required placeholder="your@email.com" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #555; border-radius: 8px; color: #fff; font-size: 1rem;">
                    </div>

                    <div>
                        <label style="color: #aaa; font-size: 0.9rem; display: block; margin-bottom: 5px;">Password</label>
                        <input type="password" id="link-password" required placeholder="Min. 6 characters" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #555; border-radius: 8px; color: #fff; font-size: 1rem;">
                    </div>

                    <div>
                        <label style="color: #aaa; font-size: 0.9rem; display: block; margin-bottom: 5px;">Confirm Password</label>
                        <input type="password" id="link-password-confirm" required placeholder="Re-enter password" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #555; border-radius: 8px; color: #fff; font-size: 1rem;">
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button type="submit" style="flex: 1; background: #4CAF50; color: #fff; border: none; padding: 15px; font-weight: 800; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                            ✓ CREATE ACCOUNT
                        </button>
                        <button type="button" onclick="hideLinkAccountModal()" style="flex: 1; background: #555; color: #fff; border: none; padding: 15px; font-weight: 800; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                            ✗ CANCEL
                        </button>
                    </div>
                </form>

                <p style="color: #666; font-size: 0.75rem; margin-top: 15px; text-align: center;">
                    ☁️ Your progress syncs to the cloud every 20 minutes automatically. Play seamlessly across all your devices!
                </p>
            </div>
        `;

        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
}

// Hide link account modal
function hideLinkAccountModal() {
    const modal = document.getElementById('link-account-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle account linking form submission
async function handleLinkAccount(e) {
    e.preventDefault();

    const username = document.getElementById('link-username').value.trim();
    const email = document.getElementById('link-email').value;
    const password = document.getElementById('link-password').value;
    const confirmPassword = document.getElementById('link-password-confirm').value;

    if (username.length < 3 || username.length > 20) {
        alert('Username must be between 3 and 20 characters!');
        return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        alert('Username can only contain letters, numbers, underscores, and hyphens!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters!');
        return;
    }

    try {
        await linkGuestToEmail(email, password, username);
        hideLinkAccountModal();
    } catch (error) {
        console.error('Account linking failed:', error);
    }
}

// Make functions globally available
window.showLinkAccountModal = showLinkAccountModal;
window.hideLinkAccountModal = hideLinkAccountModal;
window.handleLinkAccount = handleLinkAccount;
window.updateUserUI = updateUserUI;

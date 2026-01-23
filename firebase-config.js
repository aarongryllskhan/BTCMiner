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

function initializeFirebase() {
    try {
        // Initialize Firebase App
        app = firebase.initializeApp(firebaseConfig);

        // Initialize Firebase Authentication
        auth = firebase.auth();

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
    // Hide login screen, show game
    if (document.getElementById('login-screen')) {
        document.getElementById('login-screen').style.display = 'none';
    }
    if (document.getElementById('main-layout')) {
        document.getElementById('main-layout').style.display = 'flex';
    }

    // Load game data from cloud
    if (window.loadGameFromCloud) {
        loadGameFromCloud(user.uid);
    }

    // Update UI with user info
    updateUserUI(user);
}

// Called when user logs out
function onUserLogout() {
    // Show login screen, hide game
    if (document.getElementById('login-screen')) {
        document.getElementById('login-screen').style.display = 'flex';
    }
    if (document.getElementById('main-layout')) {
        document.getElementById('main-layout').style.display = 'none';
    }
}

// Update UI with user information
function updateUserUI(user) {
    const userId = user.uid;
    const isGuest = user.isAnonymous;

    // Display username or email (prioritize displayName from Google/username)
    let displayName = 'Guest Player';
    if (!isGuest) {
        if (user.displayName) {
            // Google sign-in provides displayName
            displayName = user.displayName;
        } else if (user.email) {
            // Extract username from email (before @)
            displayName = user.email.split('@')[0];
        }
    }

    // Hide the LOGIN/SIGN UP button when user is logged in (not guest)
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.style.display = isGuest ? 'inline-block' : 'none';
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

    // Show "Link Account" button for guest users only
    const actionBtn = isGuest ? `
        <button onclick="showLinkAccountModal()"
                title="Create an account to save your progress across devices. Auto-syncs every 20 minutes."
                style="background: #4CAF50; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.55rem; font-weight: 700;">
            ☁️ Create Account
        </button>
    ` : '';

    userInfoDiv.innerHTML = `
        <span style="color: #f7931a; font-size: 0.55rem;">👤</span>
        <span style="color: #fff; font-size: 0.55rem; font-weight: 700; margin: 0 6px;">${displayName}</span>
        ${actionBtn}
        <button onclick="logoutUser()" style="background: #ff3344; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.55rem; font-weight: 700; margin-left: 4px;">
            Logout
        </button>
    `;
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

    const email = document.getElementById('link-email').value;
    const password = document.getElementById('link-password').value;
    const confirmPassword = document.getElementById('link-password-confirm').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters!');
        return;
    }

    try {
        await linkGuestToEmail(email, password);
        hideLinkAccountModal();
    } catch (error) {
        console.error('Account linking failed:', error);
    }
}

// Make functions globally available
window.showLinkAccountModal = showLinkAccountModal;
window.hideLinkAccountModal = hideLinkAccountModal;
window.handleLinkAccount = handleLinkAccount;

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
    const userEmail = user.email || 'Anonymous';
    const userId = user.uid;

    // Create user info display if it doesn't exist
    let userInfoDiv = document.getElementById('user-info-display');
    if (!userInfoDiv) {
        userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'user-info-display';
        userInfoDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 8px; border: 1px solid #f7931a; z-index: 9998;';
        document.body.appendChild(userInfoDiv);
    }

    userInfoDiv.innerHTML = `
        <div style="color: #fff; font-size: 0.8rem;">
            <span style="color: #f7931a;">👤</span> ${userEmail}
            <button onclick="logoutUser()" style="margin-left: 10px; background: #ff3344; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
                Logout
            </button>
        </div>
    `;
}

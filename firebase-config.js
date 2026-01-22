/**
 * Firebase Configuration for Idle BTC Miner
 * Copyright © 2026 Aaron Khan. All Rights Reserved.
 */

// Import Firebase modules (using CDN version for simplicity)
// These will be loaded from the HTML file

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

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

        // Set up auth state listener
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ User logged in:', user.email);
                onUserLogin(user);
            } else {
                console.log('ℹ️ No user logged in');
                onUserLogout();
            }
        });

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
    loadGameFromCloud(user.uid);

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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeFirebase, auth, db };
}

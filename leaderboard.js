/**
 * Leaderboard System for Idle BTC Miner
 * Tracks top players by lifetime earnings
 *
 * Update Policy:
 * - Updates on login (includes offline earnings, capped at 6 hours)
 * - Updates on logout
 * - Updates when returning to tab after being away for 6+ hours
 * - Guest users are excluded from leaderboard
 * - Leaderboard cache: 2 minutes (refreshes automatically when opened)
 * - Leaderboard reflects actual earnings with offline cap applied
 */

// Cache management for leaderboard (reduces Firebase reads)
let leaderboardCache = null;
let leaderboardCacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds (more real-time)

// Update player's leaderboard entry
async function updateLeaderboard() {
    try {
        // Check if we're in offline mode (no Firebase)
        if (window.isOfflineMode) {
            console.log('📴 Offline mode - skipping leaderboard update');
            return false;
        }

        if (!auth.currentUser) {
            console.log('⚠️ No user logged in - skipping leaderboard update');
            return false;
        }

        const user = auth.currentUser;

        // Skip leaderboard updates for guest/anonymous users
        if (user.isAnonymous) {
            console.log('ℹ️ Guest user - skipping leaderboard update (guests not shown on leaderboard)');
            return false;
        }

        // Fetch username from Firestore
        let username = 'Anonymous';
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().username) {
                username = userDoc.data().username;
                console.log('✅ Using Firestore username:', username);
            } else if (user.email) {
                // Use email prefix as fallback (not full displayName)
                username = user.email.split('@')[0];
                console.log('⚠️ No Firestore username, using email prefix:', username);
            } else if (user.displayName) {
                // Last resort: use display name
                username = user.displayName;
                console.log('⚠️ Using displayName as last resort:', username);
            }
        } catch (error) {
            console.error('Failed to fetch username for leaderboard:', error);
            // Fallback to email prefix, not full displayName
            username = user.email ? user.email.split('@')[0] : 'Anonymous';
        }

        // Get current lifetime earnings (use window accessor for closure variable)
        const lifetime = typeof window.lifetimeEarnings !== 'undefined' ? window.lifetimeEarnings : 0;

        console.log('📊 Updating leaderboard with:', {
            uid: user.uid,
            username: username,
            lifetime: lifetime,
            lifetimeEarningsExists: typeof window.lifetimeEarnings !== 'undefined'
        });

        // Update user's leaderboard entry
        await db.collection('leaderboard').doc(user.uid).set({
            username: username,
            lifetimeEarnings: lifetime,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: user.photoURL || null
        }, { merge: true });

        console.log('✅ Leaderboard updated successfully:', { username, lifetime });
        return true;

    } catch (error) {
        console.error('❌ Leaderboard update error:', error);
        return false;
    }
}

// Fetch top 10 players (optimized for free tier with caching)
async function fetchLeaderboard(limit = 10, forceRefresh = false) {
    try {
        // Check if we're in offline mode (no Firebase)
        if (window.isOfflineMode) {
            console.log('📴 Offline mode - leaderboard not available');
            return [];
        }

        // Check if we have valid cached data (less than 5 minutes old)
        const now = Date.now();
        const cacheAge = now - leaderboardCacheTimestamp;

        if (!forceRefresh && leaderboardCache && cacheAge < CACHE_DURATION) {
            console.log('📊 Using cached leaderboard (age: ' + Math.floor(cacheAge / 1000) + 's)');
            return leaderboardCache;
        }

        // Cache is stale or doesn't exist, fetch fresh data
        console.log('📡 Fetching fresh leaderboard from Firebase...');
        const snapshot = await db.collection('leaderboard')
            .orderBy('lifetimeEarnings', 'desc')
            .limit(limit)
            .get();

        const leaderboard = [];
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`📊 Leaderboard entry ${index + 1}:`, {
                uid: doc.id,
                username: data.username,
                lifetimeEarnings: data.lifetimeEarnings,
                lastUpdated: data.lastUpdated
            });

            leaderboard.push({
                rank: index + 1,
                uid: doc.id,
                username: data.username,
                lifetimeEarnings: data.lifetimeEarnings,
                lastUpdated: data.lastUpdated,
                photoURL: data.photoURL
            });
        });

        console.log('📊 Total leaderboard entries fetched:', leaderboard.length);

        // Update cache
        leaderboardCache = leaderboard;
        leaderboardCacheTimestamp = now;

        console.log('✅ Leaderboard cached (valid for ' + (CACHE_DURATION / 60000) + ' minutes)');
        return leaderboard;

    } catch (error) {
        console.error('❌ Leaderboard fetch error:', error);
        // Return cached data if available, even if stale
        return leaderboardCache || [];
    }
}

// Get player's current rank
async function getPlayerRank(userId = null) {
    try {
        // Check if we're in offline mode (no Firebase)
        if (window.isOfflineMode) {
            console.log('📴 Offline mode - player rank not available');
            return null;
        }

        const uid = userId || auth.currentUser?.uid;
        if (!uid) return null;

        const snapshot = await db.collection('leaderboard')
            .orderBy('lifetimeEarnings', 'desc')
            .get();

        let rank = null;
        let playerData = null;
        snapshot.forEach((doc, index) => {
            if (doc.id === uid) {
                rank = index + 1;
                playerData = doc.data();
            }
        });

        return rank ? { rank, ...playerData } : null;

    } catch (error) {
        console.error('❌ Get rank error:', error);
        return null;
    }
}

// Display leaderboard modal
async function openLeaderboardModal() {
    try {
        console.log('📊 Opening leaderboard modal...');
        const leaderboard = await fetchLeaderboard(10); // Top 10 only (optimized for free tier)
        console.log('📊 Fetched leaderboard data:', leaderboard);
        const playerRank = await getPlayerRank();
        console.log('📊 Player rank:', playerRank);

        const modal = document.getElementById('leaderboard-modal');
        if (!modal) {
            console.error('Leaderboard modal not found');
            return;
        }

        // Update refresh info
        const refreshInfo = document.getElementById('leaderboard-refresh-info');
        if (refreshInfo) {
            const cacheAge = Math.floor((Date.now() - leaderboardCacheTimestamp) / 1000);
            const cacheMinutes = Math.floor(cacheAge / 60);
            const cacheSeconds = cacheAge % 60;
            const cacheStatus = leaderboardCache ? `Last updated: ${cacheMinutes}m ${cacheSeconds}s ago` : 'Fetching fresh data...';
            refreshInfo.innerHTML = `
                ${cacheStatus} | Auto-syncs every 20 min
                <button onclick="refreshLeaderboardNow()" style="margin-left: 10px; background: #00ff88; color: #000; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; font-weight: 700;">
                    🔄 Refresh Now
                </button>
            `;
        }

        // Build leaderboard HTML
        let leaderboardHTML = `
            <div style="max-height: 600px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; color: #fff;">
                    <thead>
                        <tr style="background: rgba(247, 147, 26, 0.2); border-bottom: 2px solid #f7931a;">
                            <th style="padding: 10px; text-align: left; font-weight: bold;">RANK</th>
                            <th style="padding: 10px; text-align: left; font-weight: bold;">PLAYER</th>
                            <th style="padding: 10px; text-align: right; font-weight: bold;">LIFETIME EARNINGS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Check if leaderboard is empty
        if (leaderboard.length === 0) {
            leaderboardHTML += `
                <tr>
                    <td colspan="3" style="padding: 40px; text-align: center; color: #888;">
                        <div style="font-size: 3rem; margin-bottom: 10px;">🏆</div>
                        <div style="font-size: 1.2rem; color: #f7931a; margin-bottom: 10px;">Be the First!</div>
                        <div style="font-size: 0.9rem;">Start mining to claim your spot on the leaderboard.</div>
                    </td>
                </tr>
            `;
        } else {
            leaderboard.forEach(player => {
                const isCurrentPlayer = auth.currentUser?.uid === player.uid;
                const rowStyle = isCurrentPlayer
                    ? 'background: rgba(247, 147, 26, 0.3); border: 1px solid #f7931a;'
                    : 'border-bottom: 1px solid #333;';

                const earningsFormatted = formatCurrency(player.lifetimeEarnings);
                const rankEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '';

                leaderboardHTML += `
                    <tr style="${rowStyle} hover: background: rgba(255, 255, 255, 0.05);">
                        <td style="padding: 10px; text-align: left; font-weight: bold; color: #f7931a;">
                            ${rankEmoji} #${player.rank}
                        </td>
                        <td style="padding: 10px; text-align: left; ${isCurrentPlayer ? 'color: #f7931a; font-weight: bold;' : ''}">
                            ${player.username}${isCurrentPlayer ? ' (YOU)' : ''}
                        </td>
                        <td style="padding: 10px; text-align: right; ${isCurrentPlayer ? 'color: #00ff88; font-weight: bold;' : 'color: #00ff88;'}">
                            $${earningsFormatted}
                        </td>
                    </tr>
                `;
            });
        }

        leaderboardHTML += `
                    </tbody>
                </table>
            </div>
        `;

        // Add player's rank info if logged in
        if (playerRank) {
            leaderboardHTML = `
                <div style="background: rgba(247, 147, 26, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #f7931a;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #888; margin-bottom: 5px;">YOUR RANKING</div>
                        <div style="font-size: 2rem; color: #f7931a; font-weight: bold;">
                            ${playerRank.rank === 1 ? '🥇' : playerRank.rank === 2 ? '🥈' : playerRank.rank === 3 ? '🥉' : '#' + playerRank.rank}
                            #${playerRank.rank}
                        </div>
                        <div style="font-size: 1rem; color: #00ff88; margin-top: 5px;">
                            $${formatCurrency(playerRank.lifetimeEarnings)}
                        </div>
                    </div>
                </div>
            ` + leaderboardHTML;
        }

        const contentDiv = modal.querySelector('.leaderboard-content');
        if (contentDiv) {
            contentDiv.innerHTML = leaderboardHTML;
        }

        modal.style.display = 'flex';

    } catch (error) {
        console.error('❌ Open leaderboard error:', error);
        showMessage('Failed to load leaderboard: ' + error.message, 'error');
    }
}

// Close leaderboard modal
function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboard-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Format large numbers for display
function formatCurrency(value) {
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + 'T';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toFixed(0);
}

// Leaderboard updates only on: login, logout, or when returning after 6+ hours away
let leaderboardUpdateInterval;

function startLeaderboardUpdates() {
    // Only update leaderboard for registered users (not guests)
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
        // Update leaderboard immediately on login (includes capped offline earnings)
        updateLeaderboard();
        console.log('✅ Leaderboard updated on login (offline earnings capped at 6 hours)');
    } else {
        console.log('ℹ️ Guest user - leaderboard updates disabled');
    }
}

function stopLeaderboardUpdates() {
    if (leaderboardUpdateInterval) {
        clearInterval(leaderboardUpdateInterval);
        leaderboardUpdateInterval = null;
        console.log('🛑 Leaderboard auto-updates stopped');
    }
}

// Force refresh leaderboard (bypass cache)
async function refreshLeaderboardNow() {
    try {
        console.log('🔄 Forcing leaderboard refresh...');
        await fetchLeaderboard(10, true); // Force refresh
        await openLeaderboardModal(); // Reopen with fresh data
        console.log('✅ Leaderboard refreshed');
    } catch (error) {
        console.error('❌ Error refreshing leaderboard:', error);
    }
}

// Export functions
window.updateLeaderboard = updateLeaderboard;
window.fetchLeaderboard = fetchLeaderboard;
window.getPlayerRank = getPlayerRank;
window.updateLeaderboard = updateLeaderboard;
window.fetchLeaderboard = fetchLeaderboard;
window.getPlayerRank = getPlayerRank;
window.openLeaderboardModal = openLeaderboardModal;
window.closeLeaderboardModal = closeLeaderboardModal;
window.refreshLeaderboardNow = refreshLeaderboardNow;
window.startLeaderboardUpdates = startLeaderboardUpdates;
window.stopLeaderboardUpdates = stopLeaderboardUpdates;

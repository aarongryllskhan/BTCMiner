/**
 * Leaderboard System for Idle BTC Miner
 * Tracks top players by lifetime earnings
 */

// Update player's leaderboard entry
async function updateLeaderboard() {
    try {
        if (!auth.currentUser) {
            console.log('⚠️ No user logged in - skipping leaderboard update');
            return false;
        }

        const user = auth.currentUser;
        const username = user.displayName || user.email.split('@')[0] || 'Anonymous';

        // Get current lifetime earnings
        const lifetime = typeof lifetimeEarnings !== 'undefined' ? lifetimeEarnings : 0;

        // Update user's leaderboard entry
        await db.collection('leaderboard').doc(user.uid).set({
            username: username,
            lifetimeEarnings: lifetime,
            email: user.email,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: user.photoURL || null
        }, { merge: true });

        console.log('✅ Leaderboard updated:', { username, lifetime });
        return true;

    } catch (error) {
        console.error('❌ Leaderboard update error:', error);
        return false;
    }
}

// Fetch top 50 players
async function fetchLeaderboard(limit = 50) {
    try {
        const snapshot = await db.collection('leaderboard')
            .orderBy('lifetimeEarnings', 'desc')
            .limit(limit)
            .get();

        const leaderboard = [];
        snapshot.forEach((doc, index) => {
            leaderboard.push({
                rank: index + 1,
                uid: doc.id,
                username: doc.data().username,
                lifetimeEarnings: doc.data().lifetimeEarnings,
                lastUpdated: doc.data().lastUpdated,
                photoURL: doc.data().photoURL
            });
        });

        console.log('📊 Fetched leaderboard:', leaderboard);
        return leaderboard;

    } catch (error) {
        console.error('❌ Leaderboard fetch error:', error);
        return [];
    }
}

// Get player's current rank
async function getPlayerRank(userId = null) {
    try {
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
        const leaderboard = await fetchLeaderboard(50);
        const playerRank = await getPlayerRank();

        const modal = document.getElementById('leaderboard-modal');
        if (!modal) {
            console.error('Leaderboard modal not found');
            return;
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

// Auto-update leaderboard every 5 minutes
let leaderboardUpdateInterval;

function startLeaderboardUpdates() {
    // Update immediately
    updateLeaderboard();

    // Then update every 5 minutes
    leaderboardUpdateInterval = setInterval(() => {
        if (auth.currentUser) {
            updateLeaderboard();
        }
    }, 300000); // 5 minutes

    console.log('✅ Leaderboard auto-updates started');
}

function stopLeaderboardUpdates() {
    if (leaderboardUpdateInterval) {
        clearInterval(leaderboardUpdateInterval);
        leaderboardUpdateInterval = null;
        console.log('🛑 Leaderboard auto-updates stopped');
    }
}

// Export functions
window.updateLeaderboard = updateLeaderboard;
window.fetchLeaderboard = fetchLeaderboard;
window.getPlayerRank = getPlayerRank;
window.openLeaderboardModal = openLeaderboardModal;
window.closeLeaderboardModal = closeLeaderboardModal;
window.startLeaderboardUpdates = startLeaderboardUpdates;
window.stopLeaderboardUpdates = stopLeaderboardUpdates;

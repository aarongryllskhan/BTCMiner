# Idle BTC Miner - Developer Guide

## Project Overview

**Idle BTC Miner** is a browser-based cryptocurrency mining simulation game (incremental/idle game) similar to Cookie Clicker. Players mine Bitcoin, Ethereum, and Dogecoin, trade them for USD, and progress through multiple upgrade tiers and meta-systems.

**Type:** Client-side web application with optional Node.js development server
**Current Author:** Aaron Khan
**Status:** BTCMiner-Final-Branch-1

---

## Core Game Mechanics

### 1. Mining System
- **Three cryptocurrencies:** BTC, ETH, DOGE (each with independent progression)
- **16 tier progression** per cryptocurrency (Miners 1-16)
- **Two earning methods:**
  - Manual clicking: Generates hashrate directly
  - Automated miners: Passive hashrate generation per second
- **Hashrate visualization** in real-time chart

### 2. Economy & Pricing
- **Dynamic pricing system** with realistic ranges:
  - BTC: $50K - $200K
  - ETH: $1.5K - $8K
  - DOGE: $0.05 - $2.00
- **Price volatility simulation** with trend indicators
- **Auto-conversion:** Players sell crypto to earn USD cash
- **Hardware equity tracking** across all miners

### 3. Staking System
- Lock mined crypto to earn **0.1% APR every 2 seconds**
- Staking yields automatically convert to USD
- Meta-upgrades (Corrupt Tokens) boost APR percentage

### 4. Ascension/Rugpull System
- **Sacrifice progress** to reset game and earn "Corrupt Tokens"
- **Meta-upgrades purchased with tokens:**
  - Basic tier: 10 tokens
  - Advanced tier: 80 tokens
  - Expert tier: 270 tokens
  - Ultra tier: 2,187 tokens
- **Permanent bonuses** persist across resets (mining rates, APR, etc.)

### 5. Minigames
- **Packet Interceptor:** Catch falling packets worth 1 second of current mining output
- **Network Destruction:** Attack network using hash rate + clicks for rewards
- **Difficulty levels:** Easy, Medium, Hard (unlock as you progress)

### 6. Achievement System
- 48+ achievements tracking:
  - Earnings milestones ($1 → $1 Nonillion)
  - Equipment progression (16 levels × 3 cryptos)
  - Manual hash rate milestones
  - Special achievements

---

## File Structure

### Core Game Files
| File | Size | Purpose |
|------|------|---------|
| `index.html` | 144KB | Main game UI and layout |
| `game.js` | 349KB | Core game logic, mining mechanics, economy |
| `styles.css` | 64KB | Game styling and UI theming |
| `server.js` | — | Node.js dev server (port 8080) |

### Game Systems
- `achievements.js` (28KB) - Achievement tracking and definitions
- `rugpull.js` (113KB) - Ascension meta-upgrade system
- `staking.js` (11KB) - Staking mechanics and APR calculations
- `tutorial.js` (37KB) - Onboarding tutorial for new players
- `packet-interceptor.js` (25KB) - Packet catching minigame logic
- `coin-rain.js` (21KB) - Visual effects (coin rain animation)

### Assets
- **Crypto images:** `bitcointoken.png`, `ethcoin.png`, `dogecoin.png`
- **Currency assets:** `dollar.png`, `dollarstack.png`, `usd_bill.png`
- **Background:** `mainframebackground.png`
- **Icons:** Favicon and PWA icons (favicon-*.png, android-chrome-*.png, apple-touch-icon.png)

### Documentation & Legal
- `terms.html`, `privacy.html`, `cookies.html`, `contact.html`, `eula.html`
- `login-screen.html` - Styled login interface
- `privacy-modal.html`, `privacy-content.txt`

### Metadata
- `site.webmanifest` - PWA manifest
- `sitemap.xml` - SEO sitemap
- `robots.txt` - Search engine directives

---

## Technology Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Chart.js** - Real-time net worth and hashrate visualization
- **chartjs-adapter-date-fns** - Date formatting for charts
- **Responsive design** with mobile optimization

### Backend
- **Node.js** development server (optional)
- HTTP file server on port 8080
- No external API dependencies

### Analytics & Tracking
- **Google Tag Manager** (G-2H559N5J64) for user analytics
- Client-side only, no backend persistence

### Data Storage
- **LocalStorage** for game state persistence
- **Export/Import system** for save backups (encoded strings)
- Lifetime earnings tracked across ascension resets

---

## Development Setup

### Running Locally
```bash
node server.js
```
Access at `http://localhost:8080`

### Version Management
- Use `update-versions.js` to manage version numbers
- Clear charts by refreshing the page if visualization issues occur

---

## Key Game State Variables

### Player Economics
- `playerMoney` - USD cash balance
- `playerHardwareEquity` - Total investment in miners
- `totalEarnings` - Lifetime USD earned (persists through ascension)
- `sessionEarnings` - USD earned in current session

### Cryptocurrency Balances
- `playerBTC`, `playerETH`, `playerDOGE` - Unharvested crypto
- `stakedBTC`, `stakedETH`, `stakedDOGE` - Locked crypto earning APR

### Pricing & Market
- `priceHistory` - Historical price data for charting
- `btcPrice`, `ethPrice`, `dogePrice` - Current dynamic prices
- Price range: BTC ($50K-$200K), ETH ($1.5K-$8K), DOGE ($0.05-$2.00)

### Upgrades & Progression
- `minerLevels` - Object tracking level per miner (0-16) per crypto
- `corruptTokens` - Meta-upgrade currency
- `corruptUpgrades` - Purchased meta-upgrades (bitmask or array)

### Metrics
- `totalHashrate` - Combined hashrate from all miners
- `manualHashrate` - Player's per-click hash contribution
- `currentNetWorth` - Real-time total value (money + crypto + equity)

---

## Common Development Tasks

### Adding a New Achievement
1. Define in `achievements.js` with unique ID, title, description
2. Add unlock condition check in `game.js` after relevant action
3. Call `unlockAchievement(id)` when condition is met
4. Update UI to display achievement notification

### Tweaking Economy Balance
- **Miner prices:** Adjust tier-based cost multipliers in `game.js`
- **Staking APR:** Modify 0.1% constant in `staking.js` and meta-upgrade bonuses
- **Price ranges:** Update min/max bounds in pricing simulation
- **Ascension tokens:** Adjust tier costs in `rugpull.js`

### Adding a New Minigame
1. Create new JS file (`game-name.js`)
2. Implement game loop and reward calculation
3. Add launch button to game UI in `index.html`
4. Integrate reward callback to `game.js`
5. Track minigame earnings in player economy

### Modifying UI
- Edit `index.html` for layout structure
- Edit `styles.css` for styling
- Game state updates trigger `updateDisplay()` in `game.js`

---

## Important Architecture Notes

### State Management
- **Single source of truth:** All game state in `game.js`
- **Automatic persistence:** SaveGame called on every significant action
- **No external APIs:** Game is fully self-contained

### Performance Considerations
- **Large file sizes:** game.js (349KB), rugpull.js (113KB) - minimize when deploying
- **Chart rendering:** Real-time charts can be expensive; optimize Chart.js config
- **Game loop:** Update tick every 100-200ms to balance responsiveness and CPU usage

### Recommended Patterns
- Always call `saveGame()` after state changes
- Use `updateDisplay()` to refresh all UI elements
- Check tutorial state before showing beginner content
- Validate player input for all manual actions (mining, upgrades)

---

## Deployment

- Static site deployment (Netlify, Vercel, GitHub Pages)
- No server-side runtime required
- Set `robots.txt` for SEO indexing
- Use PWA manifest for mobile installation
- Include all asset files (images, icons)

---

## Contact & Attribution

**Game Creator:** Aaron Khan
**License:** [Check terms.html and eula.html for legal details]

---

## Notes for AI Assistants

- **Game balance changes:** Test thoroughly with multiple playthrough scenarios
- **Save system:** Always maintain backward compatibility with existing saves
- **Achievement definitions:** Consider difficulty curve and player motivation
- **New features:** Ensure they fit the idle game progression philosophy (not pay-to-win)
- **Bug fixes:** Verify they don't exploit game economy or break save systems

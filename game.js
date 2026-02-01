    // Calculate cost for the next multiplier purchase (exponential scaling)
    function getNextMultiplierCost(level) {
        const baseCosts = [1500000, 15000000, 150000000, 1500000000]; // 1.5m, 15m, 150m, 1.5b
        if (level < baseCosts.length) {
            return baseCosts[level];
        }
        // After 1b, multiply by 1000x each time
        let cost = baseCosts[baseCosts.length - 1]; // Start at 1b
        for (let i = baseCosts.length; i <= level; i++) {
            cost *= 1000;
        }
        return cost;
    }

    // Calculate cost for manual hash rate upgrade (starts at 10k, scales more aggressively)
    function getManualHashRateCost(level) {
        const baseCosts = [10000, 100000, 1000000, 10000000, 100000000]; // 10k, 100k, 1m, 10m, 100m
        if (level < baseCosts.length) {
            return baseCosts[level];
        }
        // After 100m, multiply by 10x each time
        let cost = baseCosts[baseCosts.length - 1]; // Start at 100m
        for (let i = baseCosts.length; i <= level; i++) {
            cost *= 10;
        }
        return cost;
    }

    // Bitcoin
    let btcPrice = 100000; // Set manually each day - everyone starts at 100k
    let btcBalance = 0;
    let btcLifetime = 0;
    let btcPerSec = 0;
    let btcClickValue = 0.00000250;
    const BTC_MIN_PRICE = 50000;
    const BTC_MAX_PRICE = 200000;

    // Ethereum
    let ethPrice = 3500; // Starting ETH price
    let ethBalance = 0;
    let ethLifetime = 0;
    let ethPerSec = 0;
    let ethClickValue = 0.00007143; // $0.25 worth at $3500/ETH
    const ETH_MIN_PRICE = 1500;
    const ETH_MAX_PRICE = 8000;

    // Dogecoin
    let dogePrice = 0.25; // Starting DOGE price
    let dogeBalance = 0;
    let dogeLifetime = 0;
    let dogePerSec = 0;
    let dogeClickValue = 1.00000000; // $0.25 worth at $0.25/DOGE
    const DOGE_MIN_PRICE = 0.05;
    const DOGE_MAX_PRICE = 2.00;

    // Global 2x multiplier system (applies to ALL miners of each crypto)
    let btcMultiplierLevel = 0;  // Number of times purchased
    let ethMultiplierLevel = 0;
    let dogeMultiplierLevel = 0;
    const MULTIPLIER_COSTS = [10000, 100000, 1000000, 1000000000]; // 10k, 100k, 1m, 1b, etc - will scale exponentially

    // Manual hash rate upgrade levels (each level = +10% manual hash rate)
    let btcManualHashRateLevel = 0;
    let ethManualHashRateLevel = 0;
    let dogeManualHashRateLevel = 0;

    let hardwareEquity = 0;
    // BigNumber system: stores large numbers as {mantissa: 1.5, exponent: 9} instead of 1500000000
    // This allows handling numbers beyond JavaScript's precision limit
    class BigNumber {
        constructor(mantissa = 0, exponent = 0) {
            // Normalize: keep mantissa between 1 and 999.999...
            if (mantissa !== 0) {
                while (mantissa >= 1000 && exponent < 2000) {
                    mantissa /= 1000;
                    exponent += 3;
                }
                while (mantissa < 1 && mantissa !== 0 && exponent > -2000) {
                    mantissa *= 1000;
                    exponent -= 3;
                }
            }
            this.mantissa = mantissa;
            this.exponent = exponent;
        }

        // Convert to regular number (for numbers small enough)
        toNumber() {
            if (this.mantissa === 0) return 0;
            return this.mantissa * Math.pow(10, this.exponent);
        }

        // Add two BigNumbers
        add(other) {
            if (this.mantissa === 0) return new BigNumber(other.mantissa, other.exponent);
            if (other.mantissa === 0) return new BigNumber(this.mantissa, this.exponent);

            // If exponents differ significantly, the smaller one is negligible
            if (Math.abs(this.exponent - other.exponent) > 3) {
                return this.exponent > other.exponent ?
                    new BigNumber(this.mantissa, this.exponent) :
                    new BigNumber(other.mantissa, other.exponent);
            }

            // Convert to same exponent
            if (this.exponent === other.exponent) {
                return new BigNumber(this.mantissa + other.mantissa, this.exponent);
            } else if (this.exponent > other.exponent) {
                const diff = this.exponent - other.exponent;
                const otherMantissa = other.mantissa / Math.pow(10, diff);
                return new BigNumber(this.mantissa + otherMantissa, this.exponent);
            } else {
                const diff = other.exponent - this.exponent;
                const thisMantissa = this.mantissa / Math.pow(10, diff);
                return new BigNumber(other.mantissa + thisMantissa, other.exponent);
            }
        }

        // Multiply two BigNumbers
        multiply(other) {
            if (this.mantissa === 0 || other.mantissa === 0) return new BigNumber(0, 0);
            return new BigNumber(this.mantissa * other.mantissa, this.exponent + other.exponent);
        }

        // Divide two BigNumbers
        divide(other) {
            if (other.mantissa === 0) return new BigNumber(0, 0);
            if (this.mantissa === 0) return new BigNumber(0, 0);
            return new BigNumber(this.mantissa / other.mantissa, this.exponent - other.exponent);
        }

        // Compare: returns -1 (this < other), 0 (equal), or 1 (this > other)
        compare(other) {
            if (this.exponent !== other.exponent) {
                return this.exponent > other.exponent ? 1 : -1;
            }
            if (this.mantissa > other.mantissa) return 1;
            if (this.mantissa < other.mantissa) return -1;
            return 0;
        }

        // Create from regular number
        static fromNumber(num) {
            if (num === 0) return new BigNumber(0, 0);
            const exp = Math.floor(Math.log10(Math.abs(num)));
            const mantissa = num / Math.pow(10, exp);
            return new BigNumber(mantissa, exp);
        }
    }

    let dollarBalance = 0; // USD balance from selling crypto (use BigNumber for very large amounts)
    let lastTickTime = Date.now();
    let lastPriceUpdateTime = 0; // Track when price was last updated
    let manualHashClickTime = 0;
    let manualHashCooldownEnd = 0;
    let clickTimestamps = [];
    let priceSwingsStarted = false; // Flag to prevent starting price swings multiple times

    // Session tracking
    let sessionStartTime = Date.now();
    let sessionStartBalance = 0;
    let sessionStartNetWorth = 0;
    let sessionEarnings = 0; // Tracks USD value of all crypto earned this session (mining + staking)
    let lifetimeEarnings = 0; // Lifetime total - only ever increases, tracks USD value of all mined/staked crypto
    let earningsThisRun = 0; // Earnings since last rugpull - resets when rugpull happens (tracked by rugpull.js)
    let lastSyncedSessionEarnings = 0; // Track last amount we synced to rugpull to avoid double-counting
    // lifetimeEarningsThisRugpull is now managed by rugpull.js - do not declare it here

    // Master abbreviation system for all number formatting
    const ABBREVIATIONS = [
        // ============ EXTENDED RANGE (10^306 to 10^500) ============
        { threshold: 1e500, suffix: 'Qng' },        // 10^500
        { threshold: 1e497, suffix: 'Qg' },         // 10^497
        { threshold: 1e494, suffix: 'Dg' },         // 10^494
        { threshold: 1e491, suffix: 'Tg' },         // 10^491
        { threshold: 1e488, suffix: 'Qag' },        // 10^488
        { threshold: 1e485, suffix: 'Qig' },        // 10^485
        { threshold: 1e482, suffix: 'Sxg' },        // 10^482
        { threshold: 1e479, suffix: 'Spg' },        // 10^479
        { threshold: 1e476, suffix: 'Ocg' },        // 10^476
        { threshold: 1e473, suffix: 'Nog' },        // 10^473
        { threshold: 1e470, suffix: 'Ung' },        // 10^470
        { threshold: 1e467, suffix: 'Dung' },       // 10^467
        { threshold: 1e464, suffix: 'Tung' },       // 10^464
        { threshold: 1e461, suffix: 'Qaung' },      // 10^461
        { threshold: 1e458, suffix: 'Qiung' },      // 10^458
        { threshold: 1e455, suffix: 'Sxung' },      // 10^455
        { threshold: 1e452, suffix: 'Spung' },      // 10^452
        { threshold: 1e449, suffix: 'Ocung' },      // 10^449
        { threshold: 1e446, suffix: 'Noung' },      // 10^446
        { threshold: 1e443, suffix: 'Unng' },       // 10^443
        { threshold: 1e440, suffix: 'Dunng' },      // 10^440
        { threshold: 1e437, suffix: 'Tunng' },      // 10^437
        { threshold: 1e434, suffix: 'Qaung' },      // 10^434
        { threshold: 1e431, suffix: 'Qiung' },      // 10^431
        { threshold: 1e428, suffix: 'Sxun' },       // 10^428
        { threshold: 1e425, suffix: 'Spun' },       // 10^425
        { threshold: 1e422, suffix: 'Ocun' },       // 10^422
        { threshold: 1e419, suffix: 'Noun' },       // 10^419
        { threshold: 1e416, suffix: 'Unt' },        // 10^416
        { threshold: 1e413, suffix: 'Dunt' },       // 10^413
        { threshold: 1e410, suffix: 'Tunt' },       // 10^410
        { threshold: 1e407, suffix: 'Qaunt' },      // 10^407
        { threshold: 1e404, suffix: 'Qiunt' },      // 10^404
        { threshold: 1e401, suffix: 'Sxunt' },      // 10^401
        { threshold: 1e398, suffix: 'Spunt' },      // 10^398
        { threshold: 1e395, suffix: 'Ocunt' },      // 10^395
        { threshold: 1e392, suffix: 'Nount' },      // 10^392
        { threshold: 1e389, suffix: 'Unqua' },      // 10^389
        { threshold: 1e386, suffix: 'Dunqua' },     // 10^386
        { threshold: 1e383, suffix: 'Tunqua' },     // 10^383
        { threshold: 1e380, suffix: 'Qaqua' },      // 10^380
        { threshold: 1e377, suffix: 'Qiqua' },      // 10^377
        { threshold: 1e374, suffix: 'Sxqua' },      // 10^374
        { threshold: 1e371, suffix: 'Spqua' },      // 10^371
        { threshold: 1e368, suffix: 'Ocqua' },      // 10^368
        { threshold: 1e365, suffix: 'Noqua' },      // 10^365
        { threshold: 1e363, suffix: 'VgCe' },        // 10^363 Viginticentillion
        { threshold: 1e360, suffix: 'UDcCe' },      // 10^360 Undecicentillion
        { threshold: 1e357, suffix: 'DcCe' },       // 10^357 Decicentillion
        { threshold: 1e354, suffix: 'NCe' },        // 10^354 Novemcentillion
        { threshold: 1e351, suffix: 'OCe' },        // 10^351 Octocentillion
        { threshold: 1e348, suffix: 'SpCe' },       // 10^348 Septencentillion
        { threshold: 1e345, suffix: 'SxCe' },       // 10^345 Sexcentillion
        { threshold: 1e342, suffix: 'QiCe' },       // 10^342 Quincentillion
        { threshold: 1e339, suffix: 'QaCe' },       // 10^339 Quattuorcentillion
        { threshold: 1e336, suffix: 'TCe' },        // 10^336 Trescentillion
        { threshold: 1e333, suffix: 'DCe' },        // 10^333 Duocentillion
        { threshold: 1e330, suffix: 'UCe' },        // 10^330 Uncentillion
        { threshold: 1e327, suffix: 'NCe' },        // 10^327 Novemcentillion
        { threshold: 1e324, suffix: 'OCe' },        // 10^324 Octocentillion
        { threshold: 1e321, suffix: 'SpCe' },       // 10^321 Septencentillion
        { threshold: 1e318, suffix: 'SxCe' },       // 10^318 Sexcentillion
        { threshold: 1e315, suffix: 'QiCe' },       // 10^315 Quincentillion
        { threshold: 1e312, suffix: 'QaCe' },       // 10^312 Quattuorcentillion
        { threshold: 1e309, suffix: 'TCe' },        // 10^309 Trescentillion
        { threshold: 1e306, suffix: 'UCe' },        // 10^306 Uncentillion
        { threshold: 1e303, suffix: 'Ce' },         // Centillion (10^303)
        { threshold: 1e300, suffix: 'NoN' },        // 10^300
        { threshold: 1e297, suffix: 'OcN' },        // 10^297
        { threshold: 1e294, suffix: 'SpN' },        // 10^294
        { threshold: 1e291, suffix: 'SxN' },        // 10^291
        { threshold: 1e288, suffix: 'QiNg' },       // 10^288
        { threshold: 1e285, suffix: 'QNg' },        // 10^285
        { threshold: 1e282, suffix: 'TNg' },        // 10^282
        { threshold: 1e279, suffix: 'DNg' },        // 10^279
        { threshold: 1e276, suffix: 'UNg' },        // 10^276
        { threshold: 1e273, suffix: 'Ng' },         // 10^273
        { threshold: 1e270, suffix: 'NoO' },        // 10^270
        { threshold: 1e267, suffix: 'OcO' },        // 10^267
        { threshold: 1e264, suffix: 'SpO' },        // 10^264
        { threshold: 1e261, suffix: 'SxO' },        // 10^261
        { threshold: 1e258, suffix: 'QiO' },        // 10^258
        { threshold: 1e255, suffix: 'QOg' },        // 10^255
        { threshold: 1e252, suffix: 'TOg' },        // 10^252
        { threshold: 1e249, suffix: 'DOg' },        // 10^249
        { threshold: 1e246, suffix: 'UOg' },        // 10^246
        { threshold: 1e243, suffix: 'Og' },         // 10^243
        { threshold: 1e240, suffix: 'NoSp' },       // 10^240
        { threshold: 1e237, suffix: 'OcSp' },       // 10^237
        { threshold: 1e234, suffix: 'SpSp' },       // 10^234
        { threshold: 1e231, suffix: 'SxSp' },       // 10^231
        { threshold: 1e228, suffix: 'QiSp' },       // 10^228
        { threshold: 1e225, suffix: 'QSp' },        // 10^225
        { threshold: 1e222, suffix: 'TSp' },        // 10^222
        { threshold: 1e219, suffix: 'DSp' },        // 10^219
        { threshold: 1e216, suffix: 'USp' },        // 10^216
        { threshold: 1e213, suffix: 'Spt' },        // 10^213
        { threshold: 1e210, suffix: 'NoS' },        // 10^210
        { threshold: 1e207, suffix: 'OcS' },        // 10^207
        { threshold: 1e204, suffix: 'SpS' },        // 10^204
        { threshold: 1e201, suffix: 'SxS' },        // 10^201
        { threshold: 1e198, suffix: 'QiS' },        // 10^198
        { threshold: 1e195, suffix: 'QSg' },        // 10^195
        { threshold: 1e192, suffix: 'TSg' },        // 10^192
        { threshold: 1e189, suffix: 'DSg' },        // 10^189
        { threshold: 1e186, suffix: 'USg' },        // 10^186
        { threshold: 1e183, suffix: 'Sg' },         // 10^183
        { threshold: 1e180, suffix: 'NoQi' },       // 10^180
        { threshold: 1e177, suffix: 'OcQi' },       // 10^177
        { threshold: 1e174, suffix: 'SpQi' },       // 10^174
        { threshold: 1e171, suffix: 'SxQi' },       // 10^171
        { threshold: 1e168, suffix: 'QiQi' },       // 10^168
        { threshold: 1e165, suffix: 'QQi' },        // 10^165
        { threshold: 1e162, suffix: 'TQi' },        // 10^162
        { threshold: 1e159, suffix: 'DQi' },        // 10^159
        { threshold: 1e156, suffix: 'UQi' },        // 10^156
        { threshold: 1e153, suffix: 'Qui' },        // 10^153
        { threshold: 1e150, suffix: 'NoQ' },        // 10^150
        { threshold: 1e147, suffix: 'OcQ' },        // 10^147
        { threshold: 1e144, suffix: 'SpQ' },        // 10^144
        { threshold: 1e141, suffix: 'SxQ' },        // 10^141
        { threshold: 1e138, suffix: 'QiQ' },        // 10^138
        { threshold: 1e135, suffix: 'QQu' },        // 10^135
        { threshold: 1e132, suffix: 'TQu' },        // 10^132
        { threshold: 1e129, suffix: 'DQu' },        // 10^129
        { threshold: 1e126, suffix: 'UQu' },        // 10^126
        { threshold: 1e123, suffix: 'Qua' },        // 10^123
        { threshold: 1e120, suffix: 'NoT' },        // 10^120
        { threshold: 1e117, suffix: 'OcT' },        // 10^117
        { threshold: 1e114, suffix: 'SpT' },        // 10^114
        { threshold: 1e111, suffix: 'SxT' },        // 10^111
        { threshold: 1e108, suffix: 'QiT' },        // 10^108
        { threshold: 1e105, suffix: 'QaT' },        // 10^105
        { threshold: 1e102, suffix: 'TTr' },        // 10^102
        { threshold: 1e99, suffix: 'DTr' },         // 10^99
        { threshold: 1e96, suffix: 'UTr' },         // 10^96
        { threshold: 1e93, suffix: 'Tr' },          // 10^93
        { threshold: 1e90, suffix: 'NoV' },         // 10^90
        { threshold: 1e87, suffix: 'OcV' },         // 10^87
        { threshold: 1e84, suffix: 'SpV' },         // 10^84
        { threshold: 1e81, suffix: 'SxV' },         // 10^81
        { threshold: 1e78, suffix: 'QiV' },         // 10^78
        { threshold: 1e75, suffix: 'QaV' },         // 10^75
        { threshold: 1e72, suffix: 'TVi' },         // 10^72
        { threshold: 1e69, suffix: 'DVi' },         // 10^69
        { threshold: 1e66, suffix: 'UVi' },         // 10^66
        { threshold: 1e63, suffix: 'Vi' },          // 10^63
        { threshold: 1e60, suffix: 'NoD' },         // 10^60
        { threshold: 1e57, suffix: 'OcD' },         // 10^57
        { threshold: 1e54, suffix: 'SpD' },         // 10^54
        { threshold: 1e51, suffix: 'SxD' },         // 10^51
        { threshold: 1e48, suffix: 'QiD' },         // 10^48
        { threshold: 1e45, suffix: 'QaD' },         // 10^45
        { threshold: 1e42, suffix: 'TVi' },         // 10^42
        { threshold: 1e39, suffix: 'DDe' },         // 10^39
        { threshold: 1e36, suffix: 'UDe' },         // 10^36
        { threshold: 1e33, suffix: 'De' },          // 10^33
        { threshold: 1e30, suffix: 'No' },          // Nonillion (10^30)
        { threshold: 1e27, suffix: 'Oc' },          // Octillion (10^27)
        { threshold: 1e24, suffix: 'Sp' },          // Septillion (10^24)
        // ============ STANDARD ABBREVIATIONS ============
        { threshold: 1e21, suffix: 'Sx' },          // Sextillion (10^21)
        { threshold: 1e18, suffix: 'Qi' },          // Quintillion (10^18)
        { threshold: 1e15, suffix: 'Qa' },          // Quadrillion (10^15)
        { threshold: 1e12, suffix: 'T' },           // Trillion (10^12)
        { threshold: 1e9, suffix: 'B' },            // Billion (10^9)
        { threshold: 1e6, suffix: 'M' },            // Million (10^6)
        { threshold: 1e3, suffix: 'K' }             // Thousand (10^3)
    ];

    // Initialize gameState early so rugpull.js can access it
    if (!window.gameState) {
        window.gameState = { lifetimeEarnings: 0, dollarBalance: 0 };
    }

    // Make mining rates globally accessible for minigames (packet-interceptor.js, etc.)
    // These are updated whenever rates change
    window.btcPerSec = btcPerSec;
    window.ethPerSec = ethPerSec;
    window.dogePerSec = dogePerSec;
    window.btcPrice = btcPrice;
    window.ethPrice = ethPrice;
    window.dogePrice = dogePrice;
    window.totalMiningMultiplier = 1; // Will be updated when calculated

    // Buy quantity setting
    let buyQuantity = 1;

    // Chart history tracking
    let chartHistory = [];
    let chartTimestamps = []; // Track when each data point was added
    let btcChartHistory = []; // Track individual BTC values
    let ethChartHistory = []; // Track individual ETH values
    let dogeChartHistory = []; // Track individual DOGE values
    let cashChartHistory = []; // Track individual CASH values
    let lastChartUpdateTime = Date.now();
    let chartStartTime = Date.now();
    let chartMarkers = []; // Fixed markers every 60 seconds: { index, time, value }
    let lastMarkerTime = Date.now();
    let chartIntervalMinutes = 10; // Current chart interval in minutes (1, 5, 10, 30, 60, 240, 1440)

    // Multi-axis hash rate chart tracking
    let hashRateChartHistory = [];
    let powerChartHistory = [];
    let currentPowerValues = []; // Track current power for each data point (for coloring)
    let powerChartColors = []; // Track the color for each point (green/red determined at time of recording)
    let cumulativePowerUsed = 0; // Track cumulative power consumption over time
    let maxPowerCapacity = 1; // Track the maximum power capacity (used for scaling chart)
    let ethHashRateChartHistory = [];
    let dogeHashRateChartHistory = [];
    let hashRateChartTimestamps = [];
    let lastHashRateChartUpdateTime = Date.now();
    let currentChartView = 'networth'; // 'networth' or 'hashrate'
    let hashRateChartInstance = null;
    let powerChartInstance = null;
    let currentHashrateView = 'hashrate'; // 'hashrate' or 'power'
    let lastUIUpdateTime = 0; // Throttle balance display updates to 150ms
    let lastChartDataCollectionTime = 0; // Track when chart data was last collected (1500ms interval)
    let lastPowerChartUpdateTime = 0; // Track when power chart was last updated (3000ms interval)
    let lastShopReinitTime = 0; // Track when shops were last reinitialized (500ms interval)
    let lastStatsUpdateTime = 0; // Track when stat updates were last done (250ms interval)
    let lastChartScaleCalcTime = 0; // Track when chart min/max scale was last calculated (60s interval)
    let lastChartDataLength = 0; // Track previous chart data length to detect new data
    let lastAscensionUIUpdateTime = 0; // Track when rugpull UI was last updated (throttle to 10000ms)
    let lastMilestoneCheckTime = 0; // Track when milestone check was last called (throttle to 2000ms)
    let lastAchievementCheckTime = 0; // Track when achievements were last checked (throttle to 1000ms)
    let rugpullMilestoneAnnounced = false; // Flag to stop checking once goal is hit and announced
    let chartYAxisScaleMultiplier = 10; // User-controlled Y-axis scale multiplier (0-10 = auto-zoom, 11-100 = manual zoom)
    let userControllingZoom = false; // Flag to prevent auto-scaling during active slider interaction
    let userHasSetZoom = false; // Flag that user has manually set zoom - disables zoom-out permanently (until refresh)
    let userLockedChartMax = null; // Stores the Y-axis max value user locked in (prevents chart from moving after zoom set)
    let zoomResetTimeout = null; // Timeout for resetting zoom flag after user stops interacting

    // Hacking Minigame State
    let hackingGameActive = false;
    let hackingGameDifficulty = 'EASY';
    let hackingVulnerabilitiesToFind = [];
    let hackingVulnerabilitiesFound = [];
    let hackingGameStartTime = 0;
    let hackingGameTimeLimit = 30000; // milliseconds
    let hackingLivesRemaining = 0;
    let hackingMaxLives = 0;
    let speedBoostActive = false;
    let speedBoostEndTime = 0;
    let speedBoostMultiplier = 1.0;
    let hackingGamesPlayed = 0;
    let hackingGamesWon = 0;
    let hackingGamesWonByDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 }; // Track wins per difficulty for achievements
    let hackingConsecutiveWins = 0;
    let hackingNextNotificationTime = 0;
    let hackingTotalRewardsEarned = 0;
    let hackingLastRewards = { btc: 0, eth: 0, doge: 0, usd: 0, totalUsd: 0 }; // Last game rewards
    let hackingCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 }; // Track cooldown end times

    // Whack-A-Block Minigame State
    let whackGameActive = false;
    let whackGameManuallyClosed = false; // Track if user manually closed the game
    let whackGameDifficulty = 'EASY';
    let whackGameStartTime = 0;
    let whackGameTimeLimit = 30000; // milliseconds
    let whackGameScore = 0;
    let whackGameBlocksHit = 0;
    let whackGameLivesRemaining = 0;
    let whackGameMaxLives = 0;
    let whackGameGamesPlayed = 0;
    let whackGameGamesWon = 0;
    let whackGameTotalRewardsEarned = 0;
    let whackLastRewards = { btc: 0, eth: 0, doge: 0, usd: 0, totalUsd: 0 }; // Last game rewards
    let whackCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 }; // Track cooldown end times
    let whackActiveBlock = null; // Currently active block ID
    let whackActiveBlocks = new Set(); // Track all currently active block IDs
    let whackSpawnInterval = null; // Timer for spawning blocks
    let whackGameInterval = null; // Main game loop timer

    // Network Stress Test Minigame State
    let networkGameActive = false;
    let networkGameDifficulty = 'EASY';
    let networkGameStartTime = 0;
    let networkGameTimeLimit = 10000; // 10 seconds
    let networkGameMaxHP = 50000;
    let networkGameCurrentHP = 50000;
    let networkGameTotalDamage = 0; // Total damage from all sources
    let networkGameClickDamageTotal = 0; // Damage from clicks only
    let networkGameClickDamage = 20; // Base damage per click (increases 10% per manual hash upgrade)
    let networkGameGamesPlayed = 0;
    let networkGameGamesWon = 0;
    let networkGameWonThisRound = false; // Track if won current round (for explosion coins)
    let networkGameTotalRewardsEarned = 0;
    let networkLastRewards = { btc: 0, eth: 0, doge: 0, usd: 0, totalUsd: 0 };
    let networkGameInterval = null; // Main game loop timer

    // Network Stress Test gets harder with each play
    // Difficulty scales based on games played

    // Coin Snag Minigame State
    let packetGameGamesPlayed = 0;
    let packetGameGamesWon = 0; // Games where at least 1 coin was caught
    let packetGameTotalRewardsEarned = 0;
    let packetLastRewards = { btc: 0, eth: 0, doge: 0, usd: 0, totalUsd: 0 };
    let packetCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 }; // Track cooldown end times

    // Power system - Rebalanced for strategic gameplay
    let totalPowerAvailable = 0; // Total watts available
    let totalPowerUsed = 0; // Total watts being used
    let totalPowerUSD = 0; // Total USD spent on power equipment
    const powerUpgrades = [
        { id: 0, name: "Basic Power Strip", baseUsd: 10, basePower: 25 },
        { id: 1, name: "Regulated PSU", baseUsd: 100, basePower: 750 },
        { id: 2, name: "High-Efficiency PSU", baseUsd: 1100, basePower: 4500 },
        { id: 3, name: "Server-Grade PSU", baseUsd: 12000, basePower: 12000 },
        { id: 4, name: "Mining Power Distribution Unit", baseUsd: 132000, basePower: 35000 },
        { id: 5, name: "Modular Data Center Power System", baseUsd: 1452000, basePower: 120000 },
        { id: 6, name: "Dedicated Substation Power Unit", baseUsd: 16000000, basePower: 450000 },
        { id: 7, name: "Industrial Grid Connection", baseUsd: 176000000, basePower: 3000000 },
        { id: 8, name: "Hydroelectric Power Station", baseUsd: 1940000000, basePower: 15000000 },
        { id: 9, name: "Nuclear Reactor Array", baseUsd: 21400000000, basePower: 50000000 },
        { id: 10, name: "Fusion Energy Complex", baseUsd: 235000000000, basePower: 250000000 },
        { id: 11, name: "Dyson Sphere Power Collector", baseUsd: 2580000000000, basePower: 1200000000 },
        { id: 12, name: "Stellar Energy Tapestry", baseUsd: 28400000000000, basePower: 5000000000 }
    ].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentPower: 0 }));

    // Power requirements for mining equipment (in watts)
    const equipmentPowerReqs = {
        0: 0, // Manual hash uses no power
        1: 2.5, // USB Miner
        2: 75, // GTX 1660
        3: 450, // RTX 5090
        4: 1200, // ASIC
        5: 3500, // Liquid ASIC
        6: 12000, // Container
        7: 45000, // Geothermal Farm
        8: 300000, // Data Center
        9: 1500000, // Orbital
        10: 5000000, // Quantum
        11: 25000000, // Advanced Quantum
        12: 120000000, // Superintelligent AI
        13: 650000000, // Dimensional Computer
        14: 3500000000, // Multiversal Processor
        15: 18000000000 // Infinite Energy Harvester
    };

    // Show price change notification
    // Track timeout IDs for each crypto to clear previous timers
    let indicatorTimeouts = { btc: null, eth: null, doge: null };

    function updatePriceIndicator(crypto, oldPrice, newPrice) {
        const change = newPrice - oldPrice;
        const changePercent = ((change / oldPrice) * 100).toFixed(2);
        const isUp = change >= 0;
        const indicatorId = crypto + '-indicator';
        const changeId = crypto + '-change';
        const indicator = document.getElementById(indicatorId);
        const changeDisplay = document.getElementById(changeId);

        // Clear previous timeout if exists
        if (indicatorTimeouts[crypto]) {
            clearTimeout(indicatorTimeouts[crypto]);
        }

        if (indicator && changeDisplay) {
            indicator.textContent = isUp ? '▲' : '▼';
            indicator.style.color = isUp ? '#00ff88' : '#ff3344';
            changeDisplay.textContent = (isUp ? '+' : '') + changePercent + '%';
            changeDisplay.style.color = isUp ? '#00ff88' : '#ff3344';

            // Set timeout to clear both after 0.8 seconds
            indicatorTimeouts[crypto] = setTimeout(() => {
                indicator.textContent = '';
                changeDisplay.textContent = '';
                indicatorTimeouts[crypto] = null;
            }, 800);
        }
    }

    // BTC tiny swings: ±0.05%-0.1% every 2 seconds with mean reversion
    function btcTinySwing() {
        setTimeout(() => {
            let oldBtcPrice = btcPrice;
            const btcTarget = 100000;
            const distanceFromTarget = Math.abs(btcPrice - btcTarget);
            const maxDistance = Math.abs(BTC_MAX_PRICE - btcTarget);
            const distancePercent = distanceFromTarget / maxDistance;

            let movePercent = (Math.random() * 0.0005) + 0.0005;
            let direction;

            // Increased mean reversion: 50% base + up to 45% more = up to 95% when far from target
            if (Math.random() < (0.5 + distancePercent * 0.45)) {
                direction = btcPrice > btcTarget ? -1 : 1;
            } else {
                direction = Math.random() > 0.5 ? 1 : -1;
            }

            let newBtcPrice = oldBtcPrice * (1 + (direction * movePercent));
            btcPrice = Math.max(BTC_MIN_PRICE, Math.min(BTC_MAX_PRICE, newBtcPrice));
            updatePriceIndicator('btc', oldBtcPrice, btcPrice);
            updateUI();
            btcTinySwing();
        }, 2000);
    }

    // BTC frequent swings: ±0.1%-1% every 2-60 seconds randomly with mean reversion
    function btcFrequentSwing() {
        let randomInterval = (Math.random() * (60000 - 2000)) + 2000; // 2-60 seconds
        setTimeout(() => {
            let movePercent = (Math.random() * 0.009) + 0.001; // 0.1% to 1%
            let oldBtcPrice = btcPrice;
            const btcTarget = 100000;
            const distanceFromTarget = Math.abs(btcPrice - btcTarget);
            const maxDistance = Math.abs(BTC_MAX_PRICE - btcTarget);
            const distancePercent = distanceFromTarget / maxDistance; // 0 to 1

            // Increased mean reversion: 75% + up to 25% more = up to 100% when far from target
            let newBtcPrice = oldBtcPrice * (1 + movePercent);
            if (Math.random() < (0.75 + distancePercent * 0.25)) {
                const targetPrice = 100000;
                const diff = targetPrice - oldBtcPrice;
                newBtcPrice = oldBtcPrice + (diff * 0.03);
            } else {
                let direction = Math.random() > 0.5 ? 1 : -1;
                newBtcPrice = oldBtcPrice * (1 + (direction * movePercent));
            }
            btcPrice = Math.max(BTC_MIN_PRICE, Math.min(BTC_MAX_PRICE, newBtcPrice));
            updatePriceIndicator('btc', oldBtcPrice, btcPrice);
            updateUI();
            btcFrequentSwing();
        }, randomInterval);
    }

    // ETH tiny swings: ±0.05%-0.1% every 2.3 seconds with mean reversion
    function ethTinySwing() {
        setTimeout(() => {
            let oldEthPrice = ethPrice;
            const ethTarget = 3500;
            const distanceFromTarget = Math.abs(ethPrice - ethTarget);
            const maxDistance = Math.abs(ETH_MAX_PRICE - ethTarget);
            const distancePercent = distanceFromTarget / maxDistance;

            let movePercent = (Math.random() * 0.0005) + 0.0005;
            let direction;

            // Increased mean reversion: 50% base + up to 45% more = up to 95% when far from target
            if (Math.random() < (0.5 + distancePercent * 0.45)) {
                direction = ethPrice > ethTarget ? -1 : 1;
            } else {
                direction = Math.random() > 0.5 ? 1 : -1;
            }

            let newEthPrice = oldEthPrice * (1 + (direction * movePercent));
            ethPrice = Math.max(ETH_MIN_PRICE, Math.min(ETH_MAX_PRICE, newEthPrice));
            updatePriceIndicator('eth', oldEthPrice, ethPrice);
            updateUI();
            ethTinySwing();
        }, 2300);
    }

    // ETH frequent swings: ±0.1%-1.2% every 3-75 seconds randomly with mean reversion
    function ethFrequentSwing() {
        let randomInterval = (Math.random() * (75000 - 3000)) + 3000; // 3-75 seconds
        setTimeout(() => {
            let movePercent = (Math.random() * 0.011) + 0.001; // 0.1% to 1.2%
            let oldEthPrice = ethPrice;
            const ethTarget = 3500;
            const distanceFromTarget = Math.abs(ethPrice - ethTarget);
            const maxDistance = Math.abs(ETH_MAX_PRICE - ethTarget);
            const distancePercent = distanceFromTarget / maxDistance; // 0 to 1

            // Increased mean reversion: 75% + up to 25% more = up to 100% when far from target
            let newEthPrice = oldEthPrice * (1 + movePercent);
            if (Math.random() < (0.75 + distancePercent * 0.25)) {
                const targetPrice = 3500;
                const diff = targetPrice - oldEthPrice;
                newEthPrice = oldEthPrice + (diff * 0.03);
            } else {
                let direction = Math.random() > 0.5 ? 1 : -1;
                newEthPrice = oldEthPrice * (1 + (direction * movePercent));
            }
            ethPrice = Math.max(ETH_MIN_PRICE, Math.min(ETH_MAX_PRICE, newEthPrice));
            updatePriceIndicator('eth', oldEthPrice, ethPrice);
            updateUI();
            ethFrequentSwing();
        }, randomInterval);
    }

    // DOGE tiny swings: ±0.05%-0.15% every 2.7 seconds with mean reversion (more volatile)
    function dogeTinySwing() {
        setTimeout(() => {
            let oldDogePrice = dogePrice;
            const dogeTarget = 0.25;
            const distanceFromTarget = Math.abs(dogePrice - dogeTarget);
            const maxDistance = Math.abs(DOGE_MAX_PRICE - dogeTarget);
            const distancePercent = distanceFromTarget / maxDistance;

            let movePercent = (Math.random() * 0.001) + 0.0005;
            let direction;

            // Increased mean reversion: 50% base + up to 45% more = up to 95% when far from target
            if (Math.random() < (0.5 + distancePercent * 0.45)) {
                direction = dogePrice > dogeTarget ? -1 : 1;
            } else {
                direction = Math.random() > 0.5 ? 1 : -1;
            }

            let newDogePrice = oldDogePrice * (1 + (direction * movePercent * 1.5));
            dogePrice = Math.max(DOGE_MIN_PRICE, Math.min(DOGE_MAX_PRICE, newDogePrice));
            updatePriceIndicator('doge', oldDogePrice, dogePrice);
            updateUI();
            dogeTinySwing();
        }, 2700);
    }

    // DOGE frequent swings: ±0.15%-1.8% every 2-45 seconds randomly (more volatile) with mean reversion
    function dogeFrequentSwing() {
        let randomInterval = (Math.random() * (45000 - 2000)) + 2000; // 2-45 seconds
        setTimeout(() => {
            let movePercent = (Math.random() * 0.0165) + 0.0015; // 0.15% to 1.8%
            let oldDogePrice = dogePrice;
            const dogeTarget = 0.25;
            const distanceFromTarget = Math.abs(dogePrice - dogeTarget);
            const maxDistance = Math.abs(DOGE_MAX_PRICE - dogeTarget);
            const distancePercent = distanceFromTarget / maxDistance; // 0 to 1

            // Increased mean reversion: 75% + up to 25% more = up to 100% when far from target
            let newDogePrice = oldDogePrice * (1 + movePercent * 1.5);
            if (Math.random() < (0.75 + distancePercent * 0.25)) {
                const targetPrice = 0.25;
                const diff = targetPrice - oldDogePrice;
                newDogePrice = oldDogePrice + (diff * 0.03);
            } else {
                let direction = Math.random() > 0.5 ? 1 : -1;
                newDogePrice = oldDogePrice * (1 + (direction * movePercent * 1.5));
            }
            dogePrice = Math.max(DOGE_MIN_PRICE, Math.min(DOGE_MAX_PRICE, newDogePrice));
            updatePriceIndicator('doge', oldDogePrice, dogePrice);
            updateUI();
            dogeFrequentSwing();
        }, randomInterval);
    }

    // BTC occasional big swings: ±2.5%-10% every 5 to 10 minutes
    function btcBigSwing() {
        let nextBigSwing = (Math.random() * (600000 - 300000)) + 300000;
        setTimeout(() => {
            let movePercent = (Math.random() * 0.075) + 0.025;
            let direction = Math.random() > 0.5 ? 1 : -1;
            let move = direction * movePercent;
            let oldBtcPrice = btcPrice;
            btcPrice = Math.max(BTC_MIN_PRICE, Math.min(BTC_MAX_PRICE, btcPrice * (1 + move)));
            updatePriceIndicator('btc', oldBtcPrice, btcPrice);

            // Show news popup for big swings
            const changePercent = ((btcPrice - oldBtcPrice) / oldBtcPrice) * 100;
            if (typeof window.showNewsPopup === 'function') {
                window.showNewsPopup('btc', changePercent, changePercent >= 0);
            } else {
                console.warn('⚠️ showNewsPopup not available yet, retrying...');
            }

            updateUI();
            btcBigSwing();
        }, nextBigSwing);
    }

    // ETH occasional big swings: ±2.5%-12% every 4 to 12 minutes (more volatile than BTC)
    function ethBigSwing() {
        let nextBigSwing = (Math.random() * (720000 - 240000)) + 240000;
        setTimeout(() => {
            let movePercent = (Math.random() * 0.095) + 0.025; // Slightly more volatile
            let direction = Math.random() > 0.5 ? 1 : -1;
            let move = direction * movePercent;
            let oldEthPrice = ethPrice;
            ethPrice = Math.max(ETH_MIN_PRICE, Math.min(ETH_MAX_PRICE, ethPrice * (1 + move)));
            updatePriceIndicator('eth', oldEthPrice, ethPrice);

            // Show news popup for big swings
            const changePercent = ((ethPrice - oldEthPrice) / oldEthPrice) * 100;
            if (typeof window.showNewsPopup === 'function') {
                window.showNewsPopup('eth', changePercent, changePercent >= 0);
            } else {
                console.warn('⚠️ showNewsPopup not available yet, retrying...');
            }

            updateUI();
            ethBigSwing();
        }, nextBigSwing);
    }

    // DOGE occasional big swings: ±3%-18% every 3 to 8 minutes (much more volatile)
    function dogeBigSwing() {
        let nextBigSwing = (Math.random() * (480000 - 180000)) + 180000;
        setTimeout(() => {
            let movePercent = (Math.random() * 0.15) + 0.03; // 3% to 18%
            let direction = Math.random() > 0.5 ? 1 : -1;
            let move = direction * movePercent;
            let oldDogePrice = dogePrice;
            dogePrice = Math.max(DOGE_MIN_PRICE, Math.min(DOGE_MAX_PRICE, dogePrice * (1 + move * 1.8)));
            updatePriceIndicator('doge', oldDogePrice, dogePrice);

            // Show news popup for big swings
            const changePercent = ((dogePrice - oldDogePrice) / oldDogePrice) * 100;
            if (typeof window.showNewsPopup === 'function') {
                window.showNewsPopup('doge', changePercent, changePercent >= 0);
            } else {
                console.warn('⚠️ showNewsPopup not available yet, retrying...');
            }

            updateUI();
            dogeBigSwing();
        }, nextBigSwing);
    }

    // Sound effects using Web Audio API
    let audioContext;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.error('Could not create audio context:', error);
        audioContext = null;
    }

    function playClickSound() {
        if (isMuted || !audioContext) return;
        try {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.start(now);
            osc.stop(now + 0.1);
        } catch (error) {
            console.error('Error playing click sound:', error);
        }
    }

    function playUpgradeSound() {
        if (isMuted || !audioContext) return;
        try {
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
            osc.type = 'square';

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.start(now);
            osc.stop(now + 0.2);
        } catch (error) {
            console.error('Error playing upgrade sound:', error);
        }
    }

    // ========================================
    // MILESTONE DOUBLING SYSTEM
    // ========================================
    // Levels at which miners can be doubled (+100% production)
    // These replace the old +10% boost system
    // ===== INFINITE MILESTONE DOUBLING SYSTEM =====
    // Milestone levels follow this pattern:
    //   - Levels 1-5: [1, 5]
    //   - Levels 5-50: [10, 25, 50]
    //   - Levels 50+: Every 50 levels (100, 150, 200, 250, 300, 350, ...)
    // This continues infinitely as players progress to any level

    function isMilestoneLevel(level) {
        if (level === 5 || level === 10 || level === 25 || level === 50) {
            return true; // Early milestones (starting at level 5)
        }
        if (level >= 100 && (level - 100) % 50 === 0) {
            return true; // Every 50 levels after 100
        }
        return false;
    }

    function getNextMilestoneAfter(level) {
        // Find the next milestone level after the given level
        if (level < 5) return 5;
        if (level < 10) return 10;
        if (level < 25) return 25;
        if (level < 50) return 50;
        // For level 50+: find next milestone in 50-level increments
        const nextBase = Math.ceil((level + 1) / 50) * 50;
        return nextBase >= 100 ? nextBase : 100;
    }

    // Pre-generate common milestones for quick lookup (up to level 10000)
    // Milestones start at level 5 (no doubling at level 1)
    function generateMilestones(maxLevel = 10000) {
        const milestones = [5, 10, 25, 50];
        for (let level = 100; level <= maxLevel; level += 50) {
            milestones.push(level);
        }
        return milestones;
    }
    const MILESTONE_LEVELS = generateMilestones(10000);

    /**
     * Calculate the cost of a milestone doubling upgrade for a miner
     * Cookie Clicker style: Each miner tier has its own cost that scales independently
     * Tier 1 (USB Miner): starts at $100
     * Tier 2 (GTX 1660): starts at $5,000
     * Tier 3 (RTX 5090): starts at $275,000
     * etc. Each tier's cost is roughly 10x the miner's baseUsd
     */
    function calculateMilestoneDoublingCost(upgrade) {
        // Cost is 20x the miner's baseUsd (like Cookie Clicker)
        // This makes doubling upgrades cost roughly equivalent to buying the miner a few more times
        return upgrade.baseUsd * 20;
    }

    // Bitcoin mining upgrades
    const btcUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 100, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.000000250 },
        { id: 1, name: "USB Miner", baseUsd: 5, baseYield: 0.00002500 },
        { id: 2, name: "GTX 1660 Super", baseUsd: 50, baseYield: 0.00025000 },
        { id: 3, name: "RTX 5090 Rig", baseUsd: 550, baseYield: 0.00200000 },
        { id: 4, name: "ASIC Mining Unit", baseUsd: 6000, baseYield: 0.01200000 },
        { id: 5, name: "Liquid ASIC Rig", baseUsd: 66000, baseYield: 0.06600000 },
        { id: 6, name: "Mobile Mining Container", baseUsd: 726000, baseYield: 0.35640000 },
        { id: 7, name: "Geothermal Mining Farm", baseUsd: 8000000, baseYield: 1.99584000 },
        { id: 8, name: "Data Center Facility", baseUsd: 88000000, baseYield: 11.17670400 },
        { id: 9, name: "Orbital Data Relay", baseUsd: 970000000, baseYield: 65.94255360 },
        { id: 10, name: "Quantum Computer", baseUsd: 10700000000, baseYield: 402.24957696 },
        { id: 11, name: "Advanced Quantum Rig", baseUsd: 117000000000, baseYield: 2514.05985600 },
        { id: 12, name: "Superintelligent AI Network", baseUsd: 1290000000000, baseYield: 15712.87410000 },
        { id: 13, name: "Dimensional Mining Array", baseUsd: 14200000000000, baseYield: 98205.46312500 },
        { id: 14, name: "Multiversal Hash Grid", baseUsd: 156000000000000, baseYield: 613784.14453125 },
        { id: 15, name: "Infinite Energy Extractor", baseUsd: 1720000000000000, baseYield: 3836150.90332031 }
    ].map(u => ({
        ...u,
        level: 0,
        currentUsd: u.baseUsd,
        currentYield: 0,
        milestoneDoublings: MILESTONE_LEVELS.reduce((acc, level) => { acc[level] = false; return acc; }, {}),
        doubleMultiplier: 1
    }));

    // Ethereum mining upgrades - Balanced to match BTC/DOGE USD/sec earnings
    const ethUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 100, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.00007143 },
        { id: 1, name: "Single GPU Rig", baseUsd: 5, baseYield: 0.00071429 },
        { id: 2, name: "RTX 4090 Miner", baseUsd: 50, baseYield: 0.00714286 },
        { id: 3, name: "8-GPU Mining Rig", baseUsd: 550, baseYield: 0.05714286 },
        { id: 4, name: "Professional ETH Farm", baseUsd: 6000, baseYield: 0.34285714 },
        { id: 5, name: "Staking Validator Node", baseUsd: 66000, baseYield: 1.88571429 },
        { id: 6, name: "Multi-Validator Farm", baseUsd: 726000, baseYield: 10.18285714 },
        { id: 7, name: "ETH Mining Complex", baseUsd: 8000000, baseYield: 57.02400000 },
        { id: 8, name: "Enterprise Staking Pool", baseUsd: 88000000, baseYield: 319.33440000 },
        { id: 9, name: "Layer 2 Validation Network", baseUsd: 970000000, baseYield: 1884.07296000 },
        { id: 10, name: "Ethereum Foundation Node", baseUsd: 10700000000, baseYield: 11492.84505600 },
        { id: 11, name: "Global Validator Consortium", baseUsd: 117000000000, baseYield: 71830.28160000 },
        { id: 12, name: "Sharding Supernetwork", baseUsd: 1290000000000, baseYield: 448939.26000000 },
        { id: 13, name: "Zero-Knowledge Proof Farm", baseUsd: 14200000000000, baseYield: 2805870.37500000 },
        { id: 14, name: "Interchain Bridge Network", baseUsd: 156000000000000, baseYield: 17536689.84375000 },
        { id: 15, name: "Ethereum 3.0 Genesis Node", baseUsd: 1720000000000000, baseYield: 109604311.52343747 }
    ].map(u => ({
        ...u,
        level: 0,
        currentUsd: u.baseUsd,
        currentYield: 0,
        milestoneDoublings: MILESTONE_LEVELS.reduce((acc, level) => { acc[level] = false; return acc; }, {}),
        doubleMultiplier: 1
    }));

    // Dogecoin mining upgrades - Balanced to match BTC/ETH USD/sec earnings
    // All three currencies earn the same USD/sec at each tier (DOGE yields are 400x higher to compensate for $0.25 price)
    const dogeUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 100, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.01 },
        { id: 1, name: "Basic Scrypt Miner", baseUsd: 5, baseYield: 10.00 },
        { id: 2, name: "L3+ ASIC Miner", baseUsd: 50, baseYield: 100.00 },
        { id: 3, name: "Mini DOGE Farm", baseUsd: 550, baseYield: 800.00 },
        { id: 4, name: "Scrypt Mining Pool", baseUsd: 6000, baseYield: 4800.00 },
        { id: 5, name: "Industrial DOGE Facility", baseUsd: 66000, baseYield: 26400.00 },
        { id: 6, name: "DOGE Megafarm", baseUsd: 726000, baseYield: 142560.00 },
        { id: 7, name: "WOW Mining Complex", baseUsd: 8000000, baseYield: 798336.00 },
        { id: 8, name: "Moon Mining Station", baseUsd: 88000000, baseYield: 4470681.60 },
        { id: 9, name: "Interplanetary DOGE Network", baseUsd: 970000000, baseYield: 26377021.44 },
        { id: 10, name: "To The Moon Supercomputer", baseUsd: 10700000000, baseYield: 160899830.78 },
        { id: 11, name: "Mars Colony Mining Base", baseUsd: 117000000000, baseYield: 1005623942.40 },
        { id: 12, name: "Asteroid Belt DOGE Harvester", baseUsd: 1290000000000, baseYield: 6285149640.00 },
        { id: 13, name: "Jovian Satellite Network", baseUsd: 14200000000000, baseYield: 39282185250.00 },
        { id: 14, name: "Solar System DOGE Grid", baseUsd: 156000000000000, baseYield: 245513657812.50 },
        { id: 15, name: "Intergalactic SHIBE Matrix", baseUsd: 1720000000000000, baseYield: 1534460361328.12 }
    ].map(u => ({
        ...u,
        level: 0,
        currentUsd: u.baseUsd,
        currentYield: 0,
        milestoneDoublings: MILESTONE_LEVELS.reduce((acc, level) => { acc[level] = false; return acc; }, {}),
        doubleMultiplier: 1
    }));

    // Keep reference to btcUpgrades as upgrades for backward compatibility
    const upgrades = btcUpgrades;

    // --- SAVE SYSTEM START ---
    let importInProgress = false; // Flag to prevent auto-save during import

    function saveGame() {
        // Don't save if an import is in progress (prevents overwriting imported data)
        if (importInProgress) {
            console.log('Save blocked - import in progress');
            return;
        }

        // Trim chart history to prevent localStorage quota issues - keep last 4,800 points per chart (1 hour at 750ms intervals)
        const maxChartPoints = 4800;
        const trimmedChartHistory = chartHistory.length > maxChartPoints ? chartHistory.slice(-maxChartPoints) : chartHistory;
        const trimmedChartTimestamps = chartTimestamps.length > maxChartPoints ? chartTimestamps.slice(-maxChartPoints) : chartTimestamps;
        const trimmedBtcChartHistory = btcChartHistory.length > maxChartPoints ? btcChartHistory.slice(-maxChartPoints) : btcChartHistory;
        const trimmedEthChartHistory = ethChartHistory.length > maxChartPoints ? ethChartHistory.slice(-maxChartPoints) : ethChartHistory;
        const trimmedDogeChartHistory = dogeChartHistory.length > maxChartPoints ? dogeChartHistory.slice(-maxChartPoints) : dogeChartHistory;
        const trimmedCashChartHistory = cashChartHistory.length > maxChartPoints ? cashChartHistory.slice(-maxChartPoints) : cashChartHistory;
        const trimmedPowerChartHistory = powerChartHistory.length > maxChartPoints ? powerChartHistory.slice(-maxChartPoints) : powerChartHistory;
        const trimmedPowerChartColors = powerChartColors.length > maxChartPoints ? powerChartColors.slice(-maxChartPoints) : powerChartColors;
        const trimmedHashRateChartTimestamps = hashRateChartTimestamps.length > maxChartPoints ? hashRateChartTimestamps.slice(-maxChartPoints) : hashRateChartTimestamps;

        const gameState = {
            // Bitcoin data
            btcBalance,
            btcLifetime,
            btcClickValue,
            btcPerSec,
            btcPrice,
            // Ethereum data
            ethBalance,
            ethLifetime,
            ethClickValue,
            ethPerSec,
            ethPrice,
            // Dogecoin data
            dogeBalance,
            dogeLifetime,
            dogeClickValue,
            dogePerSec,
            dogePrice,
            // Global multiplier levels
            btcMultiplierLevel,
            ethMultiplierLevel,
            dogeMultiplierLevel,
            // General data
            dollarBalance,
            hardwareEquity,
            lastSaveTime: Date.now(),
            autoClickerCooldownEnd,
            lifetimeEarnings,
            sessionEarnings,
            sessionStartTime,
            lifetimeEarningsDisplay: typeof window.rugpullState !== 'undefined' ? window.rugpullState.lifetimeEarningsDisplay : 0,
            chartHistory: trimmedChartHistory,
            chartTimestamps: trimmedChartTimestamps,
            btcChartHistory: trimmedBtcChartHistory,
            ethChartHistory: trimmedEthChartHistory,
            dogeChartHistory: trimmedDogeChartHistory,
            cashChartHistory: trimmedCashChartHistory,
            chartStartTime: chartStartTime,
            powerChartHistory: trimmedPowerChartHistory,
            powerChartColors: trimmedPowerChartColors,
            hashRateChartTimestamps: trimmedHashRateChartTimestamps,
            totalPowerAvailable,
            totalPowerUSD,
            // Staking data
            staking: getStakingData(),
            powerUpgrades: powerUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentPower: u.currentPower
            })),
            btcUpgrades: btcUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                milestoneDoublings: u.milestoneDoublings,
                doubleMultiplier: u.doubleMultiplier
            })),
            ethUpgrades: ethUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                milestoneDoublings: u.milestoneDoublings,
                doubleMultiplier: u.doubleMultiplier
            })),
            dogeUpgrades: dogeUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                milestoneDoublings: u.milestoneDoublings,
                doubleMultiplier: u.doubleMultiplier
            })),
            // Ascension/Rugpull data
            ascensionData: (typeof getAscensionData === 'function') ? getAscensionData() : {},
            // Achievements data
            achievements: (typeof achievementsData !== 'undefined') ? achievementsData.achievements : {},
            // Hacking minigame data
            hackingData: {
                gamesPlayed: hackingGamesPlayed,
                gamesWon: hackingGamesWon,
                gamesWonByDifficulty: hackingGamesWonByDifficulty,
                consecutiveWins: hackingConsecutiveWins,
                totalRewardsEarned: hackingTotalRewardsEarned,
                speedBoostEndTime: speedBoostActive ? speedBoostEndTime : 0,
                speedBoostMultiplier: speedBoostActive ? speedBoostMultiplier : 1.0,
                nextNotificationTime: hackingNextNotificationTime,
                cooldowns: hackingCooldowns
            },
            // Whack-A-Block minigame data
            whackData: {
                gamesPlayed: whackGameGamesPlayed,
                gamesWon: whackGameGamesWon,
                totalRewardsEarned: whackGameTotalRewardsEarned,
                cooldowns: whackCooldowns
            },
            // Network Stress Test minigame data
            networkData: {
                gamesPlayed: networkGameGamesPlayed,
                gamesWon: networkGameGamesWon,
                totalRewardsEarned: networkGameTotalRewardsEarned
            },
            // Packet Interceptor minigame data
            packetData: {
                gamesPlayed: packetGameGamesPlayed,
                gamesWon: packetGameGamesWon,
                totalRewardsEarned: packetGameTotalRewardsEarned,
                cooldowns: packetCooldowns
            }
        };

        try {
            const saveString = JSON.stringify(gameState);

            localStorage.setItem('satoshiTerminalSave', saveString);

            // Verify save worked
            const testLoad = localStorage.getItem('satoshiTerminalSave');
            if (!testLoad || testLoad.length === 0) {
                console.error('✗ SAVE FAILED - Could not verify in localStorage');
            }
        } catch (error) {
            console.error('✗ ERROR saving game to localStorage:', error);
            alert('Failed to save game! Your progress may not be saved. Error: ' + error.message);
        }
    }

function loadGame() {
    try {
        const savedData = localStorage.getItem('satoshiTerminalSave');

        if (!savedData) {
            return;
        }

        const state = JSON.parse(savedData);

        // Load achievements data FIRST before any game logic
        if (state.achievements && typeof achievementsData !== 'undefined') {
            Object.keys(state.achievements).forEach(id => {
                achievementsData.achievements[id] = state.achievements[id];
            });
        }

        // Load Bitcoin data
        btcBalance = state.btcBalance || 0;
        btcLifetime = state.btcLifetime || 0;
        btcClickValue = state.btcClickValue || 0.00000250;
        // Sanity check: if btcClickValue is suspiciously small (less than 0.000001), reset it
        if (btcClickValue < 0.000001 && btcClickValue > 0) {
            btcClickValue = 0.00000250;
        }
        btcPrice = state.btcPrice || 100000;

        // Load Ethereum data
        ethBalance = state.ethBalance || 0;
        ethLifetime = state.ethLifetime || 0;
        ethClickValue = state.ethClickValue || 0.00007143;
        // Sanity check: if ethClickValue is suspiciously small (less than 0.00001), reset it
        if (ethClickValue < 0.00001 && ethClickValue > 0) {
            ethClickValue = 0.00007143;
        }
        ethPrice = state.ethPrice || 3500;

        // Load Dogecoin data
        dogeBalance = state.dogeBalance || 0;
        dogeLifetime = state.dogeLifetime || 0;
        dogeClickValue = state.dogeClickValue || 1.00000000;
        // Sanity check: if dogeClickValue is suspiciously small (less than 0.1), reset it
        if (dogeClickValue < 0.1 && dogeClickValue > 0) {
            dogeClickValue = 1.00000000;
        }
        dogePrice = state.dogePrice || 0.25;

        // Load global multiplier levels
        btcMultiplierLevel = state.btcMultiplierLevel || 0;
        ethMultiplierLevel = state.ethMultiplierLevel || 0;
        dogeMultiplierLevel = state.dogeMultiplierLevel || 0;

        // Load general data
        dollarBalance = parseFloat(state.dollarBalance) || 0;
        hardwareEquity = parseFloat(state.hardwareEquity) || 0;
        lifetimeEarnings = parseFloat(state.lifetimeEarnings) || 0;

        // Load lifetime earnings display (persists forever across page refreshes)
        if (state.lifetimeEarningsDisplay && typeof window.rugpullState !== 'undefined') {
            window.rugpullState.lifetimeEarningsDisplay = parseFloat(state.lifetimeEarningsDisplay) || 0;
        }
        // Also sync to gameState for display
        if (window.rugpullState && window.gameState) {
            window.gameState.lifetimeEarnings = window.rugpullState.lifetimeEarningsDisplay || 0;
        }

        // Reset session on every page load/refresh
        sessionEarnings = 0;
        sessionStartTime = Date.now();

        // Load staking data
        if (state.staking) {
            loadStakingData(state.staking);
        }

        sessionStartBalance = btcBalance;
        sessionStartNetWorth = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice) + hardwareEquity + dollarBalance;
        chartStartTime = state.chartStartTime || Date.now();

        // Load power upgrades
        if (state.powerUpgrades) {
            state.powerUpgrades.forEach((savedU) => {
                const powerUpgradeToUpdate = powerUpgrades.find(u => u.id === savedU.id);
                if (powerUpgradeToUpdate) {
                    powerUpgradeToUpdate.level = savedU.level || 0;
                    // Recalculate currentUsd based on level and current baseUsd (picks up balance changes)
                    powerUpgradeToUpdate.currentUsd = Math.floor(powerUpgradeToUpdate.baseUsd * Math.pow(1.15, powerUpgradeToUpdate.level));
                    powerUpgradeToUpdate.currentPower = savedU.currentPower || 0;
                }
            });
        }
        totalPowerAvailable = state.totalPowerAvailable || 0;
        totalPowerUSD = state.totalPowerUSD || 0;

        // Load BTC upgrades
        if (state.btcUpgrades) {
            state.btcUpgrades.forEach((savedU) => {
                const upgradeToUpdate = btcUpgrades.find(u => u.id === savedU.id);
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    // Load milestone doubling data (new system) or fallback to old boost data (backward compat)
                    if (savedU.milestoneDoublings) {
                        upgradeToUpdate.milestoneDoublings = savedU.milestoneDoublings;
                    }
                    upgradeToUpdate.doubleMultiplier = savedU.doubleMultiplier || 1;
                }
            });
        } else if (state.upgrades) {
            // Backward compatibility: load old saves
            state.upgrades.forEach((savedU, index) => {
                let upgradeToUpdate;
                if (savedU.id !== undefined) {
                    upgradeToUpdate = btcUpgrades.find(u => u.id === savedU.id);
                } else {
                    upgradeToUpdate = btcUpgrades[index];
                }
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    // Initialize milestone system for old saves
                    upgradeToUpdate.milestoneDoublings = MILESTONE_LEVELS.reduce((acc, level) => { acc[level] = false; return acc; }, {});
                    upgradeToUpdate.doubleMultiplier = 1;
                }
            });
        }

        // Load ETH upgrades
        if (state.ethUpgrades) {
            state.ethUpgrades.forEach((savedU) => {
                const upgradeToUpdate = ethUpgrades.find(u => u.id === savedU.id);
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    if (savedU.milestoneDoublings) {
                        upgradeToUpdate.milestoneDoublings = savedU.milestoneDoublings;
                    }
                    upgradeToUpdate.doubleMultiplier = savedU.doubleMultiplier || 1;
                }
            });
        }

        // Load DOGE upgrades
        if (state.dogeUpgrades) {
            state.dogeUpgrades.forEach((savedU) => {
                const upgradeToUpdate = dogeUpgrades.find(u => u.id === savedU.id);
                if (upgradeToUpdate) {
                    upgradeToUpdate.level = savedU.level || 0;
                    upgradeToUpdate.currentUsd = savedU.currentUsd || upgradeToUpdate.baseUsd;
                    upgradeToUpdate.currentYield = savedU.currentYield || 0;
                    if (savedU.milestoneDoublings) {
                        upgradeToUpdate.milestoneDoublings = savedU.milestoneDoublings;
                    }
                    upgradeToUpdate.doubleMultiplier = savedU.doubleMultiplier || 1;
                }
            });
        }

        // Load ascension data
        if (state.ascensionData && typeof loadAscensionData === 'function') {
            loadAscensionData(state.ascensionData);
            // Sync rugpull earnings tracker to game's lifetime earnings
            // If lifetimeEarningsThisRugpull is 0 (old save), initialize it with lifetimeEarnings
            if (typeof window.lifetimeEarningsThisRugpull !== 'undefined') {
                if (window.lifetimeEarningsThisRugpull === 0 && lifetimeEarnings > 0) {
                    window.lifetimeEarningsThisRugpull = lifetimeEarnings;
                }
            }
            // Update UI to show/hide rugpull store button based on loaded currency
            if (typeof updateAscensionUI === 'function') {
                updateAscensionUI();
            }
        }

        // Load hacking minigame data
        if (state.hackingData) {
            hackingGamesPlayed = state.hackingData.gamesPlayed || 0;
            hackingGamesWon = state.hackingData.gamesWon || 0;
            hackingGamesWonByDifficulty = state.hackingData.gamesWonByDifficulty || { EASY: 0, MEDIUM: 0, HARD: 0 };
            hackingConsecutiveWins = state.hackingData.consecutiveWins || 0;
            hackingTotalRewardsEarned = state.hackingData.totalRewardsEarned || 0;
            hackingNextNotificationTime = state.hackingData.nextNotificationTime || 0;

            // Load cooldowns
            if (state.hackingData.cooldowns) {
                hackingCooldowns = state.hackingData.cooldowns;
            }

            // Check if speed boost is still active
            const savedBoostEnd = state.hackingData.speedBoostEndTime || 0;
            if (savedBoostEnd > Date.now()) {
                speedBoostActive = true;
                speedBoostEndTime = savedBoostEnd;
                speedBoostMultiplier = state.hackingData.speedBoostMultiplier || 1.0;
            } else {
                speedBoostActive = false;
                speedBoostMultiplier = 1.0;
            }
        }

        // Load whack-a-block minigame data
        if (state.whackData) {
            whackGameGamesPlayed = state.whackData.gamesPlayed || 0;
            whackGameGamesWon = state.whackData.gamesWon || 0;
            whackGameTotalRewardsEarned = state.whackData.totalRewardsEarned || 0;

            // Load cooldowns
            if (state.whackData.cooldowns) {
                whackCooldowns = state.whackData.cooldowns;
            }
        }

        // Load network stress test minigame data
        if (state.networkData) {
            networkGameGamesPlayed = state.networkData.gamesPlayed || 0;
            networkGameGamesWon = state.networkData.gamesWon || 0;
            networkGameTotalRewardsEarned = state.networkData.totalRewardsEarned || 0;
        }

        // Load packet interceptor minigame data
        if (state.packetData) {
            packetGameGamesPlayed = state.packetData.gamesPlayed || 0;
            packetGameGamesWon = state.packetData.gamesWon || 0;
            packetGameTotalRewardsEarned = state.packetData.totalRewardsEarned || 0;

            // Load cooldowns
            if (state.packetData.cooldowns) {
                packetCooldowns = state.packetData.cooldowns;
            }
        }

        // Calculate total power used
        calculateTotalPowerUsed();

        // Restore permanent milestone doublings from Rugpull system (persists across resets)
        restorePermanentMilestoneDoublings();

        // Recalculate totals for all cryptos (with ascension bonus if available)
        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        btcPerSec = btcUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);

        // Make mining rates globally accessible for minigames
        window.btcPerSec = btcPerSec;
        window.ethPerSec = ethPerSec;
        window.dogePerSec = dogePerSec;

        // Restore autoclicker cooldown
        autoClickerCooldownEnd = state.autoClickerCooldownEnd || 0;

        // Calculate offline earnings (max 4 hours of earnings to prevent exploits)
        const lastSaveTime = state.lastSaveTime || Date.now();
        const currentTime = Date.now();
        let offlineSeconds = (currentTime - lastSaveTime) / 1000;
        const maxOfflineSeconds = 14400; // Cap at 4 hours
        if (offlineSeconds > maxOfflineSeconds) offlineSeconds = maxOfflineSeconds;

        // Cap offline time at 4 hours (14400 seconds) + skill tree bonuses
        const BASE_OFFLINE_CAP = 14400; // 4 hours
        const MAX_OFFLINE_SECONDS = (typeof getOfflineCap === 'function') ? getOfflineCap() : BASE_OFFLINE_CAP;
        const cappedOfflineSeconds = Math.min(offlineSeconds, MAX_OFFLINE_SECONDS);
        const wasTimeCaped = offlineSeconds > MAX_OFFLINE_SECONDS;

        // Apply offline boost multiplier if purchased (2x earnings)
        const offlineBoostMultiplier = (typeof getOfflineBoost === 'function') ? (1 + getOfflineBoost()) : 1;

        // Calculate offline corrupt tokens (from token_generation upgrades)
        const tokenGenerationRate = (typeof getTokenGenerationRate === 'function') ? getTokenGenerationRate() : 0;
        const offlineCorruptTokens = tokenGenerationRate * cappedOfflineSeconds;

        const offlineBtcEarnings = btcPerSec * cappedOfflineSeconds * offlineBoostMultiplier;
        const offlineEthEarnings = ethPerSec * cappedOfflineSeconds * offlineBoostMultiplier;
        const offlineDogeEarnings = dogePerSec * cappedOfflineSeconds * offlineBoostMultiplier;

        // Calculate offline staking earnings (cash from staked crypto)
        let APR_RATE = 0.0001; // 0.01% per 2 seconds
        // Apply staking APR bonus from tier upgrades
        if (typeof getSkillBonus === 'function') {
            const stakingAPRBonus = getSkillBonus('staking_apy') || 0;
            APR_RATE = APR_RATE * (1 + stakingAPRBonus / 100);  // stakingAPRBonus is in percentage form
        }
        const stakingIntervals = cappedOfflineSeconds / 2; // Number of 2-second intervals (capped)
        let offlineStakingCash = 0;
        // Apply earnings boost bonus to staking rewards
        const earningsBoostBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('earnings_boost') : 0;
        const stakingMultiplier = 1 + earningsBoostBonus;

        if (state.staking) {
            const stakedBTC = state.staking.stakedBTC || 0;
            const stakedETH = state.staking.stakedETH || 0;
            const stakedDOGE = state.staking.stakedDOGE || 0;

            if (stakedBTC > 0) {
                const btcStakingEarnings = stakedBTC * APR_RATE * stakingIntervals;
                offlineStakingCash += btcStakingEarnings * btcPrice * stakingMultiplier;
            }
            if (stakedETH > 0) {
                const ethStakingEarnings = stakedETH * APR_RATE * stakingIntervals;
                offlineStakingCash += ethStakingEarnings * ethPrice * stakingMultiplier;
            }
            if (stakedDOGE > 0) {
                const dogeStakingEarnings = stakedDOGE * APR_RATE * stakingIntervals;
                offlineStakingCash += dogeStakingEarnings * dogePrice * stakingMultiplier;
            }

            // Add staking cash to dollar balance
            if (offlineStakingCash > 0) {
                addEarnings(offlineStakingCash);
                lifetimeEarnings += offlineStakingCash;
                sessionEarnings += offlineStakingCash;
            }
        }

        // Add offline corrupt tokens
        if (offlineCorruptTokens > 0) {
            if (typeof rugpullCurrency !== 'undefined') {
                rugpullCurrency += offlineCorruptTokens;
            }
        }

        if (offlineBtcEarnings > 0) {
            btcBalance += offlineBtcEarnings;
            btcLifetime += offlineBtcEarnings;
            const btcUsdValue = offlineBtcEarnings * btcPrice;
            lifetimeEarnings += btcUsdValue;
            sessionEarnings += btcUsdValue; // Offline earnings count toward session
            // Update rugpull tracker for offline crypto earnings
            if (typeof window.rugpullAddEarnings === 'function') {
                window.rugpullAddEarnings(btcUsdValue);
            }
        }
        if (offlineEthEarnings > 0) {
            ethBalance += offlineEthEarnings;
            ethLifetime += offlineEthEarnings;
            const ethUsdValue = offlineEthEarnings * ethPrice;
            lifetimeEarnings += ethUsdValue;
            sessionEarnings += ethUsdValue; // Offline earnings count toward session
            // Update rugpull tracker for offline crypto earnings
            if (typeof window.rugpullAddEarnings === 'function') {
                window.rugpullAddEarnings(ethUsdValue);
            }
        }
        if (offlineDogeEarnings > 0) {
            dogeBalance += offlineDogeEarnings;
            dogeLifetime += offlineDogeEarnings;
            const dogeUsdValue = offlineDogeEarnings * dogePrice;
            lifetimeEarnings += dogeUsdValue;
            sessionEarnings += dogeUsdValue; // Offline earnings count toward session
            // Update rugpull tracker for offline crypto earnings
            if (typeof window.rugpullAddEarnings === 'function') {
                window.rugpullAddEarnings(dogeUsdValue);
            }
        }

        // Always show offline earnings if we've been away (even if earnings are 0)
        // Only skip if the time away is less than 5 seconds (quick refresh)
        if (offlineSeconds >= 5) {
            window.offlineEarningsToShow = {
                btc: offlineBtcEarnings,
                eth: offlineEthEarnings,
                doge: offlineDogeEarnings,
                stakingCash: offlineStakingCash,
                corruptTokens: offlineCorruptTokens,
                seconds: offlineSeconds,
                wasCapped: wasTimeCaped,
                cappedSeconds: cappedOfflineSeconds
            };
        }

        updateUI();

        // Restore chart history from save, always starting from 0
        if (state.chartHistory && state.chartHistory.length > 0) {
            chartHistory = state.chartHistory;
            chartTimestamps = state.chartTimestamps || [];
            // Restore individual crypto chart histories
            if (state.btcChartHistory) btcChartHistory = state.btcChartHistory;
            if (state.ethChartHistory) ethChartHistory = state.ethChartHistory;
            if (state.dogeChartHistory) dogeChartHistory = state.dogeChartHistory;
            if (state.cashChartHistory) cashChartHistory = state.cashChartHistory;

            // Ensure chart always starts at $0 by prepending a zero point if first point isn't zero
            if (chartHistory.length > 0 && chartHistory[0] !== 0) {
                const firstTimestamp = chartTimestamps.length > 0 ? chartTimestamps[0].time : Date.now() - 1000;
                chartHistory.unshift(0);
                btcChartHistory.unshift(0);
                ethChartHistory.unshift(0);
                dogeChartHistory.unshift(0);
                cashChartHistory.unshift(0);
                chartTimestamps.unshift({ time: firstTimestamp - 1000, value: 0, cash: 0, btc: 0, eth: 0, doge: 0 });
            }
        } else {
            // Start fresh if no saved chart data
            chartHistory = [];
            chartTimestamps = [];
            btcChartHistory = [];
            ethChartHistory = [];
            dogeChartHistory = [];
            cashChartHistory = [];
        }

        // Restore power chart history from save
        if (state.powerChartHistory && state.powerChartHistory.length > 0) {
            powerChartHistory = state.powerChartHistory;
            powerChartColors = state.powerChartColors || [];
            // Don't restore old timestamps - start fresh with current time to avoid showing stale data
            hashRateChartTimestamps = [];
        } else {
            // Start fresh if no saved power chart data
            powerChartHistory = [];
            powerChartColors = [];
            hashRateChartTimestamps = [];
        }
    } catch (error) {
        console.error('✗ ERROR loading game from localStorage:', error);
        console.error('Error stack:', error.stack);
        // Silently start fresh without showing alert
    }
}
    // --- SAVE SYSTEM END ---

    // --- EXPORT/IMPORT SYSTEM START ---

    /**
     * Get the current game state for export (reuses saveGame structure)
     */
    function getExportableGameState() {
        // Trim chart history to prevent localStorage quota issues - keep last 4,800 points per chart
        const maxChartPoints = 4800;
        const trimmedChartHistory = chartHistory.length > maxChartPoints ? chartHistory.slice(-maxChartPoints) : chartHistory;
        const trimmedChartTimestamps = chartTimestamps.length > maxChartPoints ? chartTimestamps.slice(-maxChartPoints) : chartTimestamps;
        const trimmedBtcChartHistory = btcChartHistory.length > maxChartPoints ? btcChartHistory.slice(-maxChartPoints) : btcChartHistory;
        const trimmedEthChartHistory = ethChartHistory.length > maxChartPoints ? ethChartHistory.slice(-maxChartPoints) : ethChartHistory;
        const trimmedDogeChartHistory = dogeChartHistory.length > maxChartPoints ? dogeChartHistory.slice(-maxChartPoints) : dogeChartHistory;
        const trimmedCashChartHistory = cashChartHistory.length > maxChartPoints ? cashChartHistory.slice(-maxChartPoints) : cashChartHistory;
        const trimmedPowerChartHistory = powerChartHistory.length > maxChartPoints ? powerChartHistory.slice(-maxChartPoints) : powerChartHistory;
        const trimmedPowerChartColors = powerChartColors.length > maxChartPoints ? powerChartColors.slice(-maxChartPoints) : powerChartColors;
        const trimmedHashRateChartTimestamps = hashRateChartTimestamps.length > maxChartPoints ? hashRateChartTimestamps.slice(-maxChartPoints) : hashRateChartTimestamps;

        return {
            // Game version for compatibility checks
            version: '1.1.0',
            exportDate: Date.now(),
            // Bitcoin data
            btcBalance,
            btcLifetime,
            btcClickValue,
            btcPerSec,
            btcPrice,
            // Ethereum data
            ethBalance,
            ethLifetime,
            ethClickValue,
            ethPerSec,
            ethPrice,
            // Dogecoin data
            dogeBalance,
            dogeLifetime,
            dogeClickValue,
            dogePerSec,
            dogePrice,
            // General data
            dollarBalance,
            hardwareEquity,
            lastSaveTime: Date.now(),
            autoClickerCooldownEnd,
            lifetimeEarnings,
            sessionEarnings,
            sessionStartTime,
            lifetimeEarningsDisplay: typeof window.rugpullState !== 'undefined' ? window.rugpullState.lifetimeEarningsDisplay : 0,
            chartHistory: trimmedChartHistory,
            chartTimestamps: trimmedChartTimestamps,
            btcChartHistory: trimmedBtcChartHistory,
            ethChartHistory: trimmedEthChartHistory,
            dogeChartHistory: trimmedDogeChartHistory,
            cashChartHistory: trimmedCashChartHistory,
            chartStartTime: chartStartTime,
            powerChartHistory: trimmedPowerChartHistory,
            powerChartColors: trimmedPowerChartColors,
            hashRateChartTimestamps: trimmedHashRateChartTimestamps,
            totalPowerAvailable,
            totalPowerUSD,
            // Staking data
            staking: getStakingData(),
            powerUpgrades: powerUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentPower: u.currentPower
            })),
            btcUpgrades: btcUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                milestoneDoublings: u.milestoneDoublings,
                doubleMultiplier: u.doubleMultiplier
            })),
            ethUpgrades: ethUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                milestoneDoublings: u.milestoneDoublings,
                doubleMultiplier: u.doubleMultiplier
            })),
            dogeUpgrades: dogeUpgrades.map(u => ({
                id: u.id,
                level: u.level,
                currentUsd: u.currentUsd,
                currentYield: u.currentYield,
                milestoneDoublings: u.milestoneDoublings,
                doubleMultiplier: u.doubleMultiplier
            })),
            // Ascension/Rugpull data
            ascensionData: (typeof getAscensionData === 'function') ? getAscensionData() : {},
            // Achievements data
            achievements: (typeof achievementsData !== 'undefined') ? achievementsData.achievements : {},
            // Hacking minigame data
            hackingData: {
                gamesPlayed: hackingGamesPlayed,
                gamesWon: hackingGamesWon,
                consecutiveWins: hackingConsecutiveWins,
                totalRewardsEarned: hackingTotalRewardsEarned,
                speedBoostEndTime: speedBoostActive ? speedBoostEndTime : 0,
                speedBoostMultiplier: speedBoostActive ? speedBoostMultiplier : 1.0,
                nextNotificationTime: hackingNextNotificationTime,
                cooldowns: hackingCooldowns
            }
        };
    }

    /**
     * Encode game state to Base64 string (Cookie Clicker style)
     */
    function encodeGameState(gameState) {
        try {
            // Use a custom replacer to convert large numbers to strings to preserve precision
            const jsonString = JSON.stringify(gameState, (key, value) => {
                // Convert very large numbers (> Number.MAX_SAFE_INTEGER) to strings
                if (typeof value === 'number' && Math.abs(value) > Number.MAX_SAFE_INTEGER) {
                    return value.toString();
                }
                return value;
            });
            // Use btoa for Base64 encoding, with UTF-8 support
            const base64 = btoa(unescape(encodeURIComponent(jsonString)));
            return base64;
        } catch (error) {
            console.error('Error encoding game state:', error);
            return null;
        }
    }

    /**
     * Decode Base64 string back to game state
     */
    function decodeGameState(base64String) {
        try {
            // Remove any whitespace that might have been added
            const cleanBase64 = base64String.trim().replace(/\s/g, '');
            // Decode from Base64 with UTF-8 support
            const jsonString = decodeURIComponent(escape(atob(cleanBase64)));
            // Use a custom reviver to convert string numbers back to actual numbers
            return JSON.parse(jsonString, (key, value) => {
                // If it's a string that looks like a number, convert it back
                if (typeof value === 'string' && !isNaN(value) && value !== '') {
                    const num = parseFloat(value);
                    // Only convert if it was originally a very large number (stored as string)
                    if (num > Number.MAX_SAFE_INTEGER || num < -Number.MAX_SAFE_INTEGER) {
                        return num;
                    }
                }
                return value;
            });
        } catch (error) {
            console.error('Error decoding game state:', error);
            return null;
        }
    }

    /**
     * Open the export/import modal
     */
    function openExportImportModal() {
        const modal = document.getElementById('export-import-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Clear previous status messages
            const exportStatus = document.getElementById('export-status');
            const importStatus = document.getElementById('import-status');
            if (exportStatus) exportStatus.style.display = 'none';
            if (importStatus) importStatus.style.display = 'none';
            // Clear the textarea
            const textarea = document.getElementById('import-save-textarea');
            if (textarea) textarea.value = '';
        }
    }

    /**
     * Close the export/import modal
     */
    function closeExportImportModal() {
        const modal = document.getElementById('export-import-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Export save to clipboard
     */
    function exportSaveToClipboard() {
        try {
            const gameState = getExportableGameState();
            if (!gameState) {
                showExportStatus('Failed to get game state!', false);
                console.error('getExportableGameState returned null or undefined');
                return;
            }

            const encoded = encodeGameState(gameState);
            if (!encoded) {
                showExportStatus('Failed to encode save data!', false);
                console.error('encodeGameState returned null or undefined');
                return;
            }

            console.log('Encoded save string, length:', encoded.length);

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(encoded)
                    .then(() => {
                        showExportStatus('Save copied to clipboard!', true);
                        console.log('Save exported to clipboard via clipboard API, length:', encoded.length, 'characters');
                    })
                    .catch(err => {
                        console.warn('Clipboard API failed, trying fallback:', err);
                        copyToClipboardFallback(encoded);
                    });
            } else {
                console.log('Clipboard API not available, using fallback');
                copyToClipboardFallback(encoded);
            }
        } catch (error) {
            console.error('Error in exportSaveToClipboard:', error);
            showExportStatus('Error exporting save!', false);
        }
    }

    function copyToClipboardFallback(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-999999px';
            textarea.style.top = '-999999px';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (success) {
                showExportStatus('Save copied to clipboard!', true);
                console.log('Save exported to clipboard via fallback, length:', text.length, 'characters');
            } else {
                showExportStatus('Failed to copy to clipboard!', false);
                console.error('execCommand("copy") returned false');
            }
        } catch (e) {
            console.error('Fallback clipboard copy failed:', e);
            showExportStatus('Failed to copy to clipboard!', false);
        }
    }

    /**
     * Export save to a downloadable file
     */
    function exportSaveToFile() {
        try {
            const gameState = getExportableGameState();
            if (!gameState) {
                showExportStatus('Failed to get game state!', false);
                console.error('getExportableGameState returned null or undefined');
                return;
            }

            const encoded = encodeGameState(gameState);
            if (!encoded) {
                showExportStatus('Failed to encode save data!', false);
                console.error('encodeGameState returned null or undefined');
                return;
            }

            console.log('Encoded save string, length:', encoded.length);

            // Create filename with timestamp
            const date = new Date();
            const timestamp = date.toISOString().slice(0, 10).replace(/-/g, '');
            const filename = `IdleBTCMiner_${timestamp}.txt`;

            // Create and download file
            const blob = new Blob([encoded], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);

            // Use setTimeout to ensure the element is in the DOM
            setTimeout(() => {
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showExportStatus(`Save downloaded as ${filename}`, true);
                console.log('Save exported to file:', filename);
            }, 100);
        } catch (error) {
            console.error('Error in exportSaveToFile:', error);
            showExportStatus('Error exporting save!', false);
        }
    }

    /**
     * Import save from the textarea
     */
    function importSaveFromText() {
        try {
            console.log('=== IMPORT SAVE STARTED ===');

            const textarea = document.getElementById('import-save-textarea');
            if (!textarea || !textarea.value.trim()) {
                showImportStatus('Please paste a save string first!', false);
                return;
            }

            console.log('Textarea value length:', textarea.value.trim().length);

            const importedState = decodeGameState(textarea.value);
            if (!importedState) {
                showImportStatus('Invalid save data! Could not decode.', false);
                return;
            }

            console.log('Decoded state successfully');
            console.log('BTC Balance in import:', importedState.btcBalance);
            console.log('Dollar Balance in import:', importedState.dollarBalance);

            // Validate the imported data has expected properties
            if (!validateImportedState(importedState)) {
                showImportStatus('Invalid save data! Missing required fields.', false);
                return;
            }

            console.log('Validation passed');

            // Confirm before overwriting
            if (!confirm('This will overwrite your current save. Are you sure you want to continue?')) {
                console.log('User cancelled import');
                return;
            }

            console.log('User confirmed, blocking auto-save and applying import...');

            // CRITICAL: Block any auto-saves from overwriting our import
            importInProgress = true;

            // Apply the imported save
            applyImportedState(importedState);

            console.log('Import applied to localStorage');
            showImportStatus('Save imported! Reloading...', true);

            // Close the modal
            closeExportImportModal();

            // Force reload immediately - use location.href to ensure clean reload
            console.log('Forcing page reload NOW');
            window.location.href = window.location.href.split('?')[0] + '?imported=' + Date.now();

        } catch (error) {
            console.error('IMPORT ERROR:', error);
            importInProgress = false; // Reset flag on error
            showImportStatus('Import failed: ' + error.message, false);
        }
    }

    /**
     * Import save from a file
     */
    function importSaveFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const textarea = document.getElementById('import-save-textarea');
            if (textarea) {
                textarea.value = content;
            }

            const importedState = decodeGameState(content);
            if (!importedState) {
                showImportStatus('Invalid save file! Could not decode.', false);
                return;
            }

            if (!validateImportedState(importedState)) {
                showImportStatus('Invalid save file! Missing required fields.', false);
                return;
            }

            // Confirm before overwriting
            if (!confirm('This will overwrite your current save. Are you sure you want to continue?')) {
                // Reset the file input
                event.target.value = '';
                return;
            }

            // Block auto-saves
            importInProgress = true;

            applyImportedState(importedState);
            showImportStatus('Save imported! Reloading...', true);

            // Close the modal and force reload
            closeExportImportModal();
            window.location.href = window.location.href.split('?')[0] + '?imported=' + Date.now();
        };
        reader.onerror = function() {
            showImportStatus('Failed to read file!', false);
        };
        reader.readAsText(file);
    }

    /**
     * Validate that imported state has required fields
     */
    function validateImportedState(state) {
        // Check for essential fields that should exist in any valid save
        const requiredFields = [
            'btcBalance',
            'dollarBalance',
            'btcUpgrades'
        ];

        for (const field of requiredFields) {
            if (state[field] === undefined) {
                console.error('Missing required field:', field);
                return false;
            }
        }

        // Check that btcUpgrades is an array
        if (!Array.isArray(state.btcUpgrades)) {
            console.error('btcUpgrades is not an array');
            return false;
        }

        return true;
    }

    /**
     * Apply imported state to localStorage (let loadGame handle the actual loading)
     */
    function applyImportedState(state) {
        try {
            // Convert the imported state back to the format expected by loadGame
            const saveData = {
                ...state,
                lastSaveTime: Date.now() // Update the save time
            };

            const saveString = JSON.stringify(saveData);

            console.log('=== IMPORT DEBUG ===');
            console.log('Importing BTC balance:', state.btcBalance);
            console.log('Importing ETH balance:', state.ethBalance);
            console.log('Importing DOGE balance:', state.dogeBalance);
            console.log('Importing dollar balance:', state.dollarBalance);
            console.log('Importing hardware equity:', state.hardwareEquity);
            console.log('Importing lifetime earnings:', state.lifetimeEarnings);
            console.log('Save string length:', saveString.length);

            localStorage.setItem('satoshiTerminalSave', saveString);

            // Verify the save was written
            const verifyData = localStorage.getItem('satoshiTerminalSave');
            if (verifyData && verifyData.length === saveString.length) {
                console.log('IMPORT SUCCESS - Data verified in localStorage');
            } else {
                console.error('IMPORT WARNING - Data verification failed');
            }
        } catch (error) {
            console.error('Error applying imported state:', error);
            throw error;
        }
    }

    /**
     * Show export status message
     */
    function showExportStatus(message, success) {
        const status = document.getElementById('export-status');
        if (status) {
            status.textContent = message;
            status.style.color = success ? '#00ff88' : '#ff3344';
            status.style.display = 'block';

            // Hide after 3 seconds
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Show import status message
     */
    function showImportStatus(message, success) {
        const status = document.getElementById('import-status');
        if (status) {
            status.textContent = message;
            status.style.color = success ? '#00ff88' : '#ff3344';
            status.style.display = 'block';
        }
    }

    // --- EXPORT/IMPORT SYSTEM END ---

    function calculateTotalPowerUsed() {
        let rawPowerUsed = 0;
        // Calculate BTC equipment power
        upgrades.forEach(u => {
            if (u.level > 0 && equipmentPowerReqs[u.id] !== undefined) {
                rawPowerUsed += equipmentPowerReqs[u.id] * u.level;
            }
        });
        // Calculate ETH equipment power
        ethUpgrades.forEach(u => {
            if (u.level > 0 && equipmentPowerReqs[u.id] !== undefined) {
                rawPowerUsed += equipmentPowerReqs[u.id] * u.level;
            }
        });
        // Calculate DOGE equipment power
        dogeUpgrades.forEach(u => {
            if (u.level > 0 && equipmentPowerReqs[u.id] !== undefined) {
                rawPowerUsed += equipmentPowerReqs[u.id] * u.level;
            }
        });

        // Apply power efficiency skill bonus (reduces consumption)
        // Use miner_efficiency bonus from tier upgrades (capped at 99%)
        let powerEfficiency = 0;
        if (typeof getSkillBonus === 'function') {
            powerEfficiency = getSkillBonus('miner_efficiency') || 0;
        }
        totalPowerUsed = rawPowerUsed * (1 - powerEfficiency);
    }

    function getTotalPowerAvailableWithBonus() {
        // Apply power boost skill bonus (increases available power)
        try {
            const powerBoost = typeof getPowerBoost === 'function' ? getPowerBoost() : 0;
            return totalPowerAvailable * (1 + powerBoost);
        } catch (e) {
            return totalPowerAvailable; // Return base if error
        }
    }

    function getEffectivePowerRequirement(powerReq) {
        // Apply power efficiency skill bonus (reduces consumption)
        // Safe fallback for when functions aren't available yet
        if (!powerReq || powerReq <= 0) return powerReq;
        try {
            if (typeof getSkillBonus === 'function') {
                // Get both miner_efficiency (from tier upgrades) and power_efficiency (from meta-upgrades)
                const minerEfficiency = getSkillBonus('miner_efficiency') || 0;
                const powerEfficiency = getSkillBonus('power_efficiency') || 0;
                // Combine both reductions (additive)
                const totalReduction = Math.min(minerEfficiency + powerEfficiency, 0.99);
                return Math.max(0, powerReq * (1 - totalReduction));
            }
            return powerReq;
        } catch (e) {
            return powerReq; // Return base requirement if functions unavailable
        }
    }

    /**
     * Get effective price with crypto price bonus applied
     * Crypto price upgrades increase the value of sold crypto
     */
    function getEffectiveCryptoPrice(basePrice) {
        const cryptoPriceBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('crypto_price') : 0;
        return basePrice * (1 + cryptoPriceBonus);
    }

    /**
     * Get cash multiplier from upgrades
     * Increases earnings from all sources
     */
    function getCashMultiplier() {
        const cashBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('cash_multiplier') : 0;
        const cryptoDoubler = (typeof getSkillBonus === 'function') ? getSkillBonus('crypto_doubler') : 0;
        return 1 + cashBonus + cryptoDoubler;
    }

    /**
     * Add earnings to both dollar balance and rugpull tracker
     * Call this instead of directly modifying dollarBalance
     */
    function addEarnings(amount) {
        dollarBalance += amount;
        earningsThisRun += amount;

        // Update rugpull earnings tracker in rugpull.js if available
        if (typeof window.rugpullAddEarnings === 'function') {
            window.rugpullAddEarnings(amount);
        }
    }

    /**
     * Check if auto-sell crypto is enabled and sell if needed
     */
    function tryAutoSellCrypto(cryptoType, amount) {
        // Check if auto-sell is purchased and enabled
        const metaUpgradesData = typeof window.metaUpgrades !== 'undefined' ? window.metaUpgrades : null;
        const toggleState = typeof window.upgradeToggleState !== 'undefined' ? window.upgradeToggleState : null;

        if (!metaUpgradesData || !toggleState) {
            return false;
        }

        const hasUpgrade = metaUpgradesData.auto_sell && metaUpgradesData.auto_sell.purchased;
        const isEnabled = toggleState.auto_sell === true;
        const autoSellEnabled = hasUpgrade && isEnabled;

        if (!autoSellEnabled) {
            return false;
        }

        // Get the cash multiplier for earnings
        const cashMultiplier = getCashMultiplier();

        if (cryptoType === 'btc') {
            const effectivePrice = getEffectiveCryptoPrice(btcPrice);
            const cashValue = amount * effectivePrice * 0.75 * cashMultiplier; // 25% fee, then apply cash multiplier
            addEarnings(cashValue);
            return true;  // Sold instead of adding to balance
        } else if (cryptoType === 'eth') {
            const effectivePrice = getEffectiveCryptoPrice(ethPrice);
            const cashValue = amount * effectivePrice * 0.75 * cashMultiplier; // 25% fee, then apply cash multiplier
            addEarnings(cashValue);
            return true;  // Sold instead of adding to balance
        } else if (cryptoType === 'doge') {
            const effectivePrice = getEffectiveCryptoPrice(dogePrice);
            const cashValue = amount * effectivePrice * 0.75 * cashMultiplier; // 25% fee, then apply cash multiplier
            addEarnings(cashValue);
            return true;  // Sold instead of adding to balance
        }

        return false;
    }

    function dismissInstructions() {
        const instructionsEl = document.getElementById('game-instructions');
        if (instructionsEl) {
            instructionsEl.style.display = 'none';
            localStorage.setItem('instructionsDismissed', 'true');
        }
    }

    function resetEarningsStats() {
        const modal = document.getElementById('reset-earnings-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    window.confirmResetEarnings = function() {
        lifetimeEarnings = 0;
        sessionEarnings = 0;
        earningsThisRun = 0;
        // Reset the persisted lifetime earnings display from rugpull.js
        if (typeof window.rugpullState !== 'undefined') {
            window.rugpullState.lifetimeEarningsDisplay = 0;
        }
        if (typeof window.resetRugpullTracker === 'function') {
            window.resetRugpullTracker();
        }
        sessionStartTime = Date.now();
        saveGame();
        updateUI();
        // Show success modal instead of alert
        showResetEarningsSuccessModal();
    };

    window.closeResetEarningsModal = function() {
        const modal = document.getElementById('reset-earnings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    window.showResetEarningsSuccessModal = function() {
        const modal = document.getElementById('reset-earnings-success-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    window.closeResetEarningsSuccessModal = function() {
        const modal = document.getElementById('reset-earnings-success-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Reset rugpull milestone announcement flag when new rugpull starts
    window.resetRugpullMilestoneFlag = function() {
        rugpullMilestoneAnnounced = false;
        console.log('🔄 Rugpull milestone announcement flag reset - ready to declare next goal');
    };

    function resetGame() {
        const modal = document.getElementById('reset-save-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    window.confirmResetGame = function() {
        localStorage.removeItem('satoshiTerminalSave');
        localStorage.removeItem('instructionsDismissed');
        localStorage.removeItem('achievements');
            // Reset all variables to defaults
            btcBalance = 0;
            btcLifetime = 0;
            btcPerSec = 0;
            btcClickValue = 0.00000250;
            ethBalance = 0;
            ethLifetime = 0;
            ethPerSec = 0;
            ethClickValue = 0.00007143;
            dogeBalance = 0;
            dogeLifetime = 0;
            dogePerSec = 0;
            dogeClickValue = 1.00000000;
            dollarBalance = 0;
            hardwareEquity = 0;
            autoClickerCooldownEnd = 0;
            // Reset session stats
            sessionStartTime = Date.now();
            sessionStartBTC = 0;
            sessionStartETH = 0;
            sessionStartDOGE = 0;
            sessionStartBalance = 0;
            sessionStartNetWorth = 0;
            sessionEarnings = 0;
            lifetimeEarnings = 0;
            earningsThisRun = 0;  // Reset earnings since last rugpull
            // Reset chart history - clear all chart data arrays
            chartHistory = [];
            chartTimestamps = [];
            btcChartHistory = [];
            ethChartHistory = [];
            dogeChartHistory = [];
            cashChartHistory = [];
            hashRateChartHistory = [];
            ethHashRateChartHistory = [];
            dogeHashRateChartHistory = [];
            hashRateChartTimestamps = [];
            powerChartHistory = [];
            currentPowerValues = [];
            powerChartColors = [];
            chartMarkers = [];
            chartStartTime = Date.now();
            lastChartUpdateTime = Date.now();
            lastChartDataLength = 0;
            // Reset power system
            totalPowerAvailable = 0;
            totalPowerUsed = 0;
            powerUpgrades.forEach(u => {
                u.level = 0;
                u.currentUsd = u.baseUsd;
                u.currentPower = 0;
            });
            // Reset all upgrades (including milestone doublings for RESET SAVE)
            try {
                const newMilestoneDoublings = {};
                MILESTONE_LEVELS.forEach(level => { newMilestoneDoublings[level] = false; });

                btcUpgrades.forEach(u => {
                    u.level = 0;
                    u.currentUsd = u.baseUsd;
                    u.currentYield = 0;
                    u.milestoneDoublings = { ...newMilestoneDoublings };
                    u.doubleMultiplier = 1;
                    console.log(`Reset ${u.name}: doubleMultiplier = ${u.doubleMultiplier}`);
                });
                ethUpgrades.forEach(u => {
                    u.level = 0;
                    u.currentUsd = u.baseUsd;
                    u.currentYield = 0;
                    u.milestoneDoublings = { ...newMilestoneDoublings };
                    u.doubleMultiplier = 1;
                });
                dogeUpgrades.forEach(u => {
                    u.level = 0;
                    u.currentUsd = u.baseUsd;
                    u.currentYield = 0;
                    u.milestoneDoublings = { ...newMilestoneDoublings };
                    u.doubleMultiplier = 1;
                });
                console.log('✓ Upgrades reset successfully');
                console.log('BTC USB Miner doubleMultiplier after reset:', btcUpgrades[1].doubleMultiplier);
            } catch (e) {
                console.error('Error resetting upgrades:', e);
            }
            // Reset staked crypto amounts
            stakedBTC = 0;
            stakedETH = 0;
            stakedDOGE = 0;
            // Reset global multipliers
            btcMultiplierLevel = 0;
            ethMultiplierLevel = 0;
            dogeMultiplierLevel = 0;
            // Reset skill tree (if skill tree system exists)
            if (typeof resetSkillTree === 'function') {
                resetSkillTree();
            }

            // Reset ascension/rugpull data completely
            if (typeof resetAscensionData === 'function') {
                console.log('Calling resetAscensionData()...');
                resetAscensionData();
                console.log('After reset - rugpullCurrency:', typeof rugpullCurrency !== 'undefined' ? rugpullCurrency : 'undefined');
            }

            // Reset lifetime earnings display (rugpull.js variable)
            if (typeof window.rugpullState !== 'undefined') {
                window.rugpullState.lifetimeEarningsDisplay = 0;
            }

            // Also reset rugpull progress counter directly
            if (typeof window.lifetimeEarningsThisRugpull !== 'undefined') {
                window.lifetimeEarningsThisRugpull = 0;
            }

            // Reset hacking minigame data
            hackingGameActive = false;
            hackingGameDifficulty = 'EASY';
            hackingVulnerabilitiesToFind = [];
            hackingVulnerabilitiesFound = [];
            hackingGameStartTime = 0;
            hackingGameTimeLimit = 30000;
            hackingLivesRemaining = 0;
            hackingMaxLives = 0;
            speedBoostActive = false;
            speedBoostEndTime = 0;
            speedBoostMultiplier = 1.0;
            hackingGamesPlayed = 0;
            hackingGamesWon = 0;
            hackingConsecutiveWins = 0;
            hackingNextNotificationTime = 0;
            hackingTotalRewardsEarned = 0;
            hackingCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 };

            // Reset whack-a-block minigame
            whackGameGamesPlayed = 0;
            whackGameGamesWon = 0;
            whackGameTotalRewardsEarned = 0;
            whackCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 };

            // Reset network stress test minigame
            networkGameGamesPlayed = 0;
            networkGameGamesWon = 0;
            networkGameTotalRewardsEarned = 0;

            // Reset packet interceptor minigame
            packetGameGamesPlayed = 0;
            packetGameGamesWon = 0;
            packetGameTotalRewardsEarned = 0;
            packetCooldowns = { 'EASY': 0, 'MEDIUM': 0, 'HARD': 0 };

            // Reset achievements on full save reset
            if (typeof achievementsData !== 'undefined') {
                // Clear achievements object completely
                achievementsData.achievements = {};
                // Reinitialize achievements from definitions
                if (typeof initAchievements === 'function') {
                    initAchievements();
                }
                notificationsShownThisSession.clear();
                console.log('✓ Achievements reset on save reset');
            }

            console.log('Calling saveGame() after reset...');
            saveGame();

            // Reinitialize all shops to show fresh UI
            initBtcShop();
            initEthShop();
            initDogeShop();
            initPowerShop();

            // Force immediate UI update by resetting throttle
            lastUIUpdateTime = 0;
            updateUI();
            updateStakingUI(); // Update staking display

            // Clear browser cache to fix chart display issues (especially on mobile Chrome)
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    for (let name of names) {
                        caches.delete(name);
                    }
                });
            }

        closeResetSaveModal();
        // Show success modal that will reload when user clicks OK
        showResetSaveSuccessModal();
    };

    window.closeResetSaveModal = function() {
        const modal = document.getElementById('reset-save-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    window.showResetSaveSuccessModal = function() {
        const modal = document.getElementById('reset-save-success-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    window.reloadPageForReset = function() {
        // Reload page to ensure clean state
        window.location.reload(true);
    };

    // Expose resetGame to window so HTML onclick can call it
    window.resetGame = resetGame;

    function showOfflineEarningsModal(btcEarned, ethEarned, dogeEarned, stakingCash, corruptTokens, secondsOffline, wasCapped, cappedSeconds) {
        console.log('showOfflineEarningsModal called with:', btcEarned, ethEarned, dogeEarned, stakingCash, corruptTokens, secondsOffline, wasCapped, cappedSeconds);

        const overlay = document.createElement('div');
        overlay.className = 'offline-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'offline-modal';

        // Get current offline cap in seconds based on purchased upgrades
        const currentOfflineCap = (typeof getOfflineCap === 'function') ? getOfflineCap() : 14400;
        const currentOfflineCapHours = currentOfflineCap / 3600;

        const hours = Math.floor(secondsOffline / 3600);
        const minutes = Math.floor((secondsOffline % 3600) / 60);
        const seconds = Math.floor(secondsOffline % 60);

        let timeStr = '';
        if (hours > 0) timeStr += hours + 'h ';
        if (minutes > 0) timeStr += minutes + 'm ';
        if (seconds > 0) timeStr += seconds + 's';
        if (!timeStr) timeStr = '< 1s';

        let earningsHtml = '';
        if (btcEarned > 0) {
            earningsHtml += `<div class="earnings" style="color: #f7931a;">₿ ${btcEarned.toFixed(8)}</div>`;
        }
        if (ethEarned > 0) {
            earningsHtml += `<div class="earnings" style="color: #627eea;">Ξ ${ethEarned.toFixed(8)}</div>`;
        }
        if (dogeEarned > 0) {
            earningsHtml += `<div class="earnings" style="color: #c2a633;">Ð ${dogeEarned.toFixed(2)}</div>`;
        }
        if (stakingCash > 0) {
            // Abbreviate large cash amounts
            let cashDisplay;
            if (stakingCash >= 1e9) {
                cashDisplay = '$' + (stakingCash / 1e9).toFixed(2) + 'b';
            } else if (stakingCash >= 1e6) {
                cashDisplay = '$' + (stakingCash / 1e6).toFixed(2) + 'm';
            } else if (stakingCash >= 1e3) {
                cashDisplay = '$' + (stakingCash / 1e3).toFixed(2) + 'k';
            } else {
                cashDisplay = '$' + stakingCash.toFixed(2);
            }
            earningsHtml += `<div class="earnings" style="color: #4caf50;">💰 ${cashDisplay}</div>`;
        }
        if (corruptTokens > 0) {
            earningsHtml += `<div class="earnings" style="color: #ffeb3b; font-size: 1.2rem;">🔴 ${corruptTokens.toFixed(3)} Corrupt Tokens</div>`;
        }

        // If no earnings, show a message
        if (!earningsHtml) {
            earningsHtml = `<div class="earnings" style="color: #888; font-size: 1.2rem;">$0.00</div>
                           <div style="color: #666; font-size: 0.9rem; margin-top: 10px;">Purchase miners to earn while offline!</div>`;
        }

        // Add cap notice - always show the current cap info (updates with upgrades)
        let capNotice = '';
        if (wasCapped) {
            capNotice = `<div style="color: #ff9800; font-size: 0.85rem; margin-top: 8px; padding: 8px; background: rgba(255,152,0,0.1); border-radius: 4px; border: 1px solid rgba(255,152,0,0.3);">⚠️ Offline earnings capped at ${currentOfflineCapHours} hours</div>`;
        } else {
            capNotice = `<div style="color: #4caf50; font-size: 0.85rem; margin-top: 8px; padding: 8px; background: rgba(76,175,80,0.1); border-radius: 4px; border: 1px solid rgba(76,175,80,0.3);">ℹ️ Current Offline Earnings Capped at ${currentOfflineCapHours} Hours</div>`;
        }

        modal.innerHTML = `
            <h2>⏰ Welcome Back!</h2>
            <div class="earnings-label">Offline Earnings${wasCapped ? ` (${currentOfflineCapHours} hour max)` : ''}</div>
            ${earningsHtml}
            <div class="time-offline">While you were away for ${timeStr}</div>
            ${capNotice}
            <button id="claim-btn">Claim Rewards</button>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        document.getElementById('claim-btn').onclick = () => {
            overlay.remove();
            modal.remove();
        };

        console.log('Modal created and appended');
    }

    // Sound mute toggle
    let isMuted = false;
    function toggleMute() {
        isMuted = !isMuted;
        const btn = document.getElementById('mute-btn');
        if (btn) {
            btn.innerText = isMuted ? 'SOUND OFF' : 'SOUND ON';
        }
    }

    // VFX (coin animations) toggle
    let vfxEnabled = true;
    function toggleVFX() {
        vfxEnabled = !vfxEnabled;
        const btn = document.getElementById('vfx-btn');
        if (btn) {
            btn.innerText = vfxEnabled ? 'VFX ON' : 'VFX OFF';
        }
    }

    // Fullscreen toggle
    function toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            // Enter fullscreen
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // Auto-clicker state
    let autoClickerActive = false;
    let autoClickerCooldownEnd = 0;
    const AUTO_CLICKER_DURATION = 30000; // 30 seconds
    const AUTO_CLICKER_COOLDOWN = 300000; // 5 minutes

    function startAutoClicker() {
        if (autoClickerCooldownEnd > Date.now()) {
            return; // Still on cooldown
        }

        autoClickerActive = true;
        autoClickerCooldownEnd = Date.now() + AUTO_CLICKER_COOLDOWN;
        let clicksRemaining = AUTO_CLICKER_DURATION / 200; // 5 clicks/sec = 1 click every 200ms

        const clickInterval = setInterval(() => {
            if (clicksRemaining > 0) {
                // Click all three crypto types
                manualHash();      // BTC
                manualEthHash();   // ETH
                manualDogeHash();  // DOGE
                clicksRemaining--;
            } else {
                clearInterval(clickInterval);
                autoClickerActive = false;
                updateAutoClickerButtonState();
            }
        }, 200);

        updateAutoClickerButtonState();
    }

    function updateAutoClickerButtonState() {
        const btn = document.getElementById('autoclicker-btn');
        if (!btn) return;

        const now = Date.now();
        if (autoClickerCooldownEnd > now) {
            const cooldownMs = autoClickerCooldownEnd - now;
            const seconds = Math.ceil(cooldownMs / 1000);
            btn.disabled = true;
            btn.innerText = `AUTO CLICKER • COOLDOWN: ${seconds}s`;
        } else {
            btn.disabled = false;
            btn.innerText = 'AUTO CLICKER • 5 clicks/sec • 30s • 5m cooldown';
        }
    }

    function initBtcShop() {
        const container = document.getElementById('btc-shop');
        container.innerHTML = '';

        btcUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item btn-primary btn-primary-btc';
            btn.id = `up-${u.id}`;
            if (u.isClickUpgrade) {
                btn.classList.add('click-upgrade');
            }

            btn.onclick = () => buyLevelMultiple(i, buyQuantity);

        const powerReq = equipmentPowerReqs[u.id] || 0;
        const effectivePower = getEffectivePowerRequirement(powerReq);
        const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:var(--btc);font-weight:700;display:block;margin-top:3px" id="power-${u.id}">${formatPower(effectivePower)} Consumed per level</span>` : '';

        btn.innerHTML = `
            <div style="text-align:left;flex:1">
                <div style="font-size:0.9rem;color:#f7931a;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="mult-${u.id}" style="color:#ff4400;margin-right:4px"></span>${u.name} <span style="color:#888;font-size:0.85rem">${formatLevelTag(u.level)}</span></div>
                <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="yield-${u.id}">+0 ₿/s - Current Speed</div>
                <div style="font-size:0.9rem;color:#f7931a;font-weight:700;display:block;margin-top:3px" id="increase-${u.id}">+0 ₿/s per level</div>
                ${powerDisplay}
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="usd-${u.id}">$${formatNumberForDisplay(u.baseUsd)}</span>
                <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="afford-${u.id}">x0</span>
            </div>`;

        // Add multiplier badge if any doublings are purchased (show whenever doubleMultiplier > 1)
        if (!u.isClickUpgrade && u.doubleMultiplier > 1) {
            // The multiplier will be displayed in the level text via the yield-${u.id} element update
            // We mark this button with a data attribute for styling
            btn.setAttribute('data-has-multiplier', 'true');
            btn.setAttribute('data-multiplier', u.doubleMultiplier);
        }

        container.appendChild(btn);

        // Doubling buttons will be created dynamically by updateDoublingButtons()
        // No pre-creation needed
        });
    }

    function initPowerShop() {
        const container = document.getElementById('power-shop');
        container.innerHTML = '';

        powerUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item';
            btn.id = `pow-${u.id}`;
            btn.onclick = () => buyPowerUpgrade(i);

            const costBtc = u.currentUsd / btcPrice;
            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#00ff88;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px">${u.name} <span style="color:#888;font-size:0.85rem">${formatLevelTag(u.level)}</span></div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="pow-current-${u.id}">+0W - Current Power</div>
                    <div style="font-size:1.1rem;color:#00ff88;font-family:monospace;font-weight:700;display:block" id="pow-power-${u.id}">+0W Produced per level</div>
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="pow-usd-${u.id}">$${formatNumberForDisplay(u.currentUsd)}</span>
                    <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="pow-afford-${u.id}">x0</span>
                </div>`;
            container.appendChild(btn);
        });
    }

    function initEthShop() {
        const container = document.getElementById('eth-shop');
        container.innerHTML = '';

        ethUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item btn-primary btn-primary-eth';
            btn.id = `eth-up-${u.id}`;
            if (u.isClickUpgrade) {
                btn.classList.add('click-upgrade');
            }

            btn.onclick = () => buyEthLevel(i, buyQuantity);

            const powerReq = equipmentPowerReqs[u.id] || 0;
            const effectivePower = getEffectivePowerRequirement(powerReq);
            const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-power-${u.id}">${formatPower(effectivePower)} Consumed per level</span>` : '';

            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#627eea;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="eth-mult-${u.id}" style="color:#627eea;margin-right:4px"></span>${u.name} <span style="color:#888;font-size:0.85rem">${formatLevelTag(u.level)}</span></div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="eth-yield-${u.id}">+0 Ξ/s - Current Speed</div>
                    <div style="font-size:0.9rem;color:#627eea;font-weight:700;display:block;margin-top:3px" id="eth-increase-${u.id}">+0 Ξ/s per level</div>
                    ${powerDisplay}
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="eth-usd-${u.id}">$${formatNumberForDisplay(u.baseUsd)}</span>
                    <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="eth-afford-${u.id}">x0</span>
                </div>`;

            // Add multiplier badge if any doublings are purchased AND at a milestone level
            // Add multiplier badge if any doublings are purchased (show whenever doubleMultiplier > 1)
            if (!u.isClickUpgrade && u.doubleMultiplier > 1) {
                // The multiplier will be displayed in the level text via the eth-yield-${u.id} element update
                // We mark this button with a data attribute for styling
                btn.setAttribute('data-has-multiplier', 'true');
                btn.setAttribute('data-multiplier', u.doubleMultiplier);
            }

            container.appendChild(btn);

            // Doubling buttons will be created dynamically by updateDoublingButtons()
            // No pre-creation needed
        });
    }

    function initDogeShop() {
        const container = document.getElementById('doge-shop');
        container.innerHTML = '';

        dogeUpgrades.forEach((u, i) => {
            const btn = document.createElement('button');
            btn.className = 'u-item btn-primary btn-primary-doge';
            btn.id = `doge-up-${u.id}`;
            if (u.isClickUpgrade) {
                btn.classList.add('click-upgrade');
            }

            btn.onclick = () => buyDogeLevel(i, buyQuantity);

            const powerReq = equipmentPowerReqs[u.id] || 0;
            const effectivePower = getEffectivePowerRequirement(powerReq);
            const powerDisplay = powerReq > 0 ? `<span style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-power-${u.id}">${formatPower(effectivePower)} Consumed per level</span>` : '';

            btn.innerHTML = `
                <div style="text-align:left;flex:1">
                    <div style="font-size:0.9rem;color:#c2a633;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px"><span id="doge-mult-${u.id}" style="color:#c2a633;margin-right:4px"></span>${u.name} <span style="color:#888;font-size:0.85rem">${formatLevelTag(u.level)}</span></div>
                    <div style="font-size:1.1rem;color:var(--green);font-family:monospace;font-weight:700;display:block;margin-bottom:3px" id="doge-yield-${u.id}">+0 Ð/s - Current Speed</div>
                    <div style="font-size:0.9rem;color:#c2a633;font-weight:700;display:block;margin-top:3px" id="doge-increase-${u.id}">+0 Ð/s per level</div>
                    ${powerDisplay}
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end">
                    <span style="font-size:1.3rem;font-weight:900;display:block;color:#fff" id="doge-usd-${u.id}">$${formatNumberForDisplay(u.baseUsd)}</span>
                    <span style="font-size:0.75rem;color:#00ff88;font-family:monospace;font-weight:900;margin-top:2px" id="doge-afford-${u.id}">x0</span>
                </div>`;

            // Add multiplier badge if any doublings are purchased (show whenever doubleMultiplier > 1)
            if (!u.isClickUpgrade && u.doubleMultiplier > 1) {
                // The multiplier will be displayed in the level text via the doge-yield-${u.id} element update
                // We mark this button with a data attribute for styling
                btn.setAttribute('data-has-multiplier', 'true');
                btn.setAttribute('data-multiplier', u.doubleMultiplier);
            }

            container.appendChild(btn);

            // Doubling buttons will be created dynamically by updateDoublingButtons()
            // No pre-creation needed
        });
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.btn-tab').forEach(el => el.classList.remove('active'));

        // Also remove active class from power upgrade button
        const powerBtn = document.getElementById('power-upgrade-btn');
        if (powerBtn) powerBtn.classList.remove('active');

        const tabElement = document.getElementById(tab + '-tab');
        tabElement.classList.add('active');

        // Add active class to the button that was clicked
        if (event && event.target) {
            event.target.classList.add('active');
        }

        // Ensure power upgrade button is active when switching to power tab
        if (tab === 'power' && powerBtn) {
            powerBtn.classList.add('active');
        }

        // Update power chart if switching to power tab
        if (tab === 'power' && powerChartInstance && hashRateChartInstance && hashRateChartInstance.data.labels) {
            setTimeout(() => {
                // Use the exact same number of data points as hash rate chart
                const hashChartDataCount = hashRateChartInstance.data.labels.length;
                const powerStartIndex = Math.max(0, hashRateChartTimestamps.length - hashChartDataCount);
                const powerSliceLength = hashChartDataCount;

                const powerDataPercent = powerChartHistory.slice(powerStartIndex, powerStartIndex + powerSliceLength);
                const powerLabels = hashRateChartTimestamps.slice(powerStartIndex, powerStartIndex + powerSliceLength).map((ts) => {
                    const time = ts?.time || Date.now();
                    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                });

                powerChartInstance.data.labels = powerLabels;
                powerChartInstance.data.datasets[0].data = powerDataPercent;
                powerChartInstance._powerChartColors = powerChartColors.slice(powerStartIndex, powerStartIndex + powerSliceLength);
                powerChartInstance.update('none');
            }, 50);
        }

        // Reset purchase quantity to 1x when switching tabs
        setBuyQuantity(1);

        // Scroll buttons to the top of the page
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                const buttonsContainer = document.querySelector('.tab-buttons');
                if (buttonsContainer) {
                    buttonsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }

        // Track tutorial tab clicks
        if (tab === 'btc-mining') {
            trackBTCTabClick();
        } else if (tab === 'eth-mining') {
            trackETHTabClick();
        } else if (tab === 'doge-mining') {
            trackDOGETabClick();
        }
    }

    function setBuyQuantity(qty) {
        buyQuantity = qty;
        // All buttons are grey
        const defaultColor = '#888';

        document.querySelectorAll('.qty-toggle').forEach(el => {
            el.classList.remove('active');
            // Reset to default grey color
            el.style.borderColor = defaultColor;
            el.style.color = defaultColor;
        });

        // Find and highlight the active button in the current tab
        document.querySelectorAll('.qty-toggle').forEach(el => {
            if (el.textContent.trim() === `${qty}x`) {
                el.classList.add('active');
                el.style.borderColor = '#666';
                el.style.color = '#fff';
                el.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.2)';
            }
        });
    }

    // REMOVED: updateDoublingButtons() - Replaced by global multiplier button system
    function updateDoublingButtons() {
        // This function is no longer used - per-miner milestone buttons have been replaced with 3 global multiplier buttons
        return;
        // OLD CODE BELOW (disabled):
        // Update BTC doubling buttons
        upgrades.forEach((u, i) => {
            if (!u.isClickUpgrade) {
                const allMilestones = [5, 10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
                for (let m = 550; m <= 5000; m += 50) {
                    allMilestones.push(m);
                }

                // Find the first unpurchased milestone
                let firstUnpurchasedMilestone = null;
                for (let milestone of allMilestones) {
                    const isLocalPurchased = u.milestoneDoublings[milestone];
                    const isPermanentPurchased = (typeof hasPermanentMilestoneDoubling === 'function' && hasPermanentMilestoneDoubling('btc', milestone));
                    if (!isLocalPurchased && !isPermanentPurchased) {
                        firstUnpurchasedMilestone = milestone;
                        break;
                    }
                }

                // Only show button for the first unpurchased milestone (if we've reached it)
                if (firstUnpurchasedMilestone && u.level >= firstUnpurchasedMilestone) {
                    const milestone = firstUnpurchasedMilestone;
                    let btn = document.getElementById(`doubling-${u.id}-${milestone}`);

                    // Create button if it doesn't exist
                    if (!btn) {
                        btn = document.createElement('button');
                        btn.id = `doubling-${u.id}-${milestone}`;
                        btn.className = 'doubling-btn';
                        btn.onclick = () => purchaseMilestoneDoubling(i, milestone);
                        btn.style.border = 'none';
                        btn.style.borderRadius = '0 0 6px 6px';
                        btn.style.padding = '8px 10px';
                        btn.style.fontSize = '0.75rem';
                        btn.style.fontWeight = '700';
                        btn.style.marginTop = '-1px';
                        btn.style.width = '100%';
                        btn.style.transition = '0.2s';

                        // Insert after the main upgrade button
                        const mainBtn = document.getElementById(`up-${u.id}`);
                        if (mainBtn && mainBtn.parentNode) {
                            const parent = mainBtn.parentNode;
                            const nextElem = mainBtn.nextElementSibling;
                            if (nextElem) {
                                parent.insertBefore(btn, nextElem);
                            } else {
                                parent.appendChild(btn);
                            }
                        }
                    }

                    // Show the button
                    btn.style.display = 'block';
                    btn.style.pointerEvents = 'auto';

                    // Update button state
                    const doublingCost = calculateMilestoneDoublingCost(u);
                    const canAfford = dollarBalance >= doublingCost;

                    if (canAfford) {
                        btn.style.background = '#ff4400';
                        btn.innerHTML = `LEVEL ${milestone} | <span id="doubling-cost-${u.id}-${milestone}">$${formatNumberForDisplay(doublingCost)}</span>`;
                        btn.style.color = '#fff';
                        btn.style.cursor = 'pointer';
                        btn.style.opacity = '1';
                        btn.style.boxShadow = 'inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 10px rgba(255,68,0,0.6)';
                    } else {
                        btn.style.background = '#ff4400';
                        btn.innerHTML = `LEVEL ${milestone} | <span id="doubling-cost-${u.id}-${milestone}">$${formatNumberForDisplay(doublingCost)}</span>`;
                        btn.style.color = '#fff';
                        btn.style.cursor = 'not-allowed';
                        btn.style.opacity = '0.6';
                        btn.style.boxShadow = 'none';
                    }
                }
            }
        });

        // Update ETH doubling buttons
        ethUpgrades.forEach((u, i) => {
            if (!u.isClickUpgrade) {
                const allMilestones = [5, 10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
                for (let m = 550; m <= 5000; m += 50) {
                    allMilestones.push(m);
                }

                // Find the first unpurchased milestone
                let firstUnpurchasedMilestone = null;
                for (let milestone of allMilestones) {
                    const isLocalPurchased = u.milestoneDoublings[milestone];
                    const isPermanentPurchased = (typeof hasPermanentMilestoneDoubling === 'function' && hasPermanentMilestoneDoubling('eth', milestone));
                    if (!isLocalPurchased && !isPermanentPurchased) {
                        firstUnpurchasedMilestone = milestone;
                        break;
                    }
                }

                // Only show button for the first unpurchased milestone (if we've reached it)
                if (firstUnpurchasedMilestone && u.level >= firstUnpurchasedMilestone) {
                    const milestone = firstUnpurchasedMilestone;
                    let btn = document.getElementById(`eth-doubling-${u.id}-${milestone}`);

                    // Create button if it doesn't exist
                    if (!btn) {
                        btn = document.createElement('button');
                        btn.id = `eth-doubling-${u.id}-${milestone}`;
                        btn.className = 'doubling-btn';
                        btn.onclick = () => purchaseMilestoneDoublingEth(i, milestone);
                        btn.style.border = 'none';
                        btn.style.borderRadius = '0 0 6px 6px';
                        btn.style.padding = '8px 10px';
                        btn.style.fontSize = '0.75rem';
                        btn.style.fontWeight = '700';
                        btn.style.marginTop = '-1px';
                        btn.style.width = '100%';
                        btn.style.transition = '0.2s';

                        // Insert after the main upgrade button
                        const mainBtn = document.getElementById(`eth-up-${u.id}`);
                        if (mainBtn && mainBtn.parentNode) {
                            const parent = mainBtn.parentNode;
                            const nextElem = mainBtn.nextElementSibling;
                            if (nextElem) {
                                parent.insertBefore(btn, nextElem);
                            } else {
                                parent.appendChild(btn);
                            }
                        }
                    }

                    // Show the button
                    btn.style.display = 'block';
                    btn.style.pointerEvents = 'auto';

                    // Update button state
                    const doublingCost = calculateMilestoneDoublingCost(u);
                    const canAfford = dollarBalance >= doublingCost;

                    if (canAfford) {
                        btn.style.background = '#627eea';
                        btn.innerHTML = `LEVEL ${milestone} | <span id="eth-doubling-cost-${u.id}-${milestone}">$${formatNumberForDisplay(doublingCost)}</span>`;
                        btn.style.color = '#fff';
                        btn.style.cursor = 'pointer';
                        btn.style.opacity = '1';
                        btn.style.boxShadow = 'inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 10px rgba(98,126,234,0.6)';
                    } else {
                        btn.style.background = '#627eea';
                        btn.innerHTML = `LEVEL ${milestone} | <span id="eth-doubling-cost-${u.id}-${milestone}">$${formatNumberForDisplay(doublingCost)}</span>`;
                        btn.style.color = '#fff';
                        btn.style.cursor = 'not-allowed';
                        btn.style.opacity = '0.6';
                        btn.style.boxShadow = 'none';
                    }
                }
            }
        });

        // Update DOGE doubling buttons
        dogeUpgrades.forEach((u, i) => {
            if (!u.isClickUpgrade) {
                const allMilestones = [5, 10, 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
                for (let m = 550; m <= 5000; m += 50) {
                    allMilestones.push(m);
                }

                // Find the first unpurchased milestone
                let firstUnpurchasedMilestone = null;
                for (let milestone of allMilestones) {
                    const isLocalPurchased = u.milestoneDoublings[milestone];
                    const isPermanentPurchased = (typeof hasPermanentMilestoneDoubling === 'function' && hasPermanentMilestoneDoubling('doge', milestone));
                    if (!isLocalPurchased && !isPermanentPurchased) {
                        firstUnpurchasedMilestone = milestone;
                        break;
                    }
                }

                // Only show button for the first unpurchased milestone (if we've reached it)
                if (firstUnpurchasedMilestone && u.level >= firstUnpurchasedMilestone) {
                    const milestone = firstUnpurchasedMilestone;
                    let btn = document.getElementById(`doge-doubling-${u.id}-${milestone}`);

                    // Create button if it doesn't exist
                    if (!btn) {
                        btn = document.createElement('button');
                        btn.id = `doge-doubling-${u.id}-${milestone}`;
                        btn.className = 'doubling-btn';
                        btn.onclick = () => purchaseMilestoneDoublingDoge(i, milestone);
                        btn.style.border = 'none';
                        btn.style.borderRadius = '0 0 6px 6px';
                        btn.style.padding = '8px 10px';
                        btn.style.fontSize = '0.75rem';
                        btn.style.fontWeight = '700';
                        btn.style.marginTop = '-1px';
                        btn.style.width = '100%';
                        btn.style.transition = '0.2s';

                        // Insert after the main upgrade button
                        const mainBtn = document.getElementById(`doge-up-${u.id}`);
                        if (mainBtn && mainBtn.parentNode) {
                            const parent = mainBtn.parentNode;
                            const nextElem = mainBtn.nextElementSibling;
                            if (nextElem) {
                                parent.insertBefore(btn, nextElem);
                            } else {
                                parent.appendChild(btn);
                            }
                        }
                    }

                    // Show the button
                    btn.style.display = 'block';
                    btn.style.pointerEvents = 'auto';

                    // Update button state
                    const doublingCost = calculateMilestoneDoublingCost(u);
                    const canAfford = dollarBalance >= doublingCost;

                    if (canAfford) {
                        btn.style.background = '#c2a633';
                        btn.innerHTML = `LEVEL ${milestone} | <span id="doge-doubling-cost-${u.id}-${milestone}">$${formatNumberForDisplay(doublingCost)}</span>`;
                        btn.style.color = '#000';
                        btn.style.cursor = 'pointer';
                        btn.style.opacity = '1';
                        btn.style.boxShadow = 'inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 10px rgba(194,166,51,0.6)';
                    } else {
                        btn.style.background = '#c2a633';
                        btn.innerHTML = `LEVEL ${milestone} | <span id="doge-doubling-cost-${u.id}-${milestone}">$${formatNumberForDisplay(doublingCost)}</span>`;
                        btn.style.color = '#000';
                        btn.style.cursor = 'not-allowed';
                        btn.style.opacity = '0.6';
                        btn.style.boxShadow = 'none';
                    }
                }
            }
        });
    }

    // Helper function for sell button visual feedback
    function showSellFeedback(button) {
        if (!button) return;
        button.classList.add('sell-success');
        playUpgradeSound();
        // Add a brief scale pulse
        setTimeout(() => {
            button.classList.remove('sell-success');
        }, 500);
    }

    // Market sell functions
    function sellBTC(amount) {
        if (btcBalance < amount) {
            alert('Not enough Bitcoin!');
            return;
        }
        const saleValue = amount * btcPrice;
        btcBalance -= amount;
        addEarnings(saleValue);
        // Spawn dollar coins on sell
        spawnCoinsForClick('usd', saleValue);
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllBTC(button) {
        if (btcBalance <= 0) return;
        const effectivePrice = getEffectiveCryptoPrice(btcPrice);
        const saleValue = btcBalance * effectivePrice * 0.95; // 5% fee
        addEarnings(saleValue);
        btcBalance = 0;
        // Spawn dollar coins on sell (1 coin per $10 USD)
        spawnCoinsForClick('usd', saleValue);
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        // Show enhanced visual feedback
        showSellFeedback(button);
    }

    function sellETH(amount) {
        if (ethBalance < amount) {
            alert('Not enough Ethereum!');
            return;
        }
        const effectivePrice = getEffectiveCryptoPrice(ethPrice);
        const saleValue = amount * effectivePrice * 0.95; // 5% fee
        ethBalance -= amount;
        addEarnings(saleValue);
        // Spawn dollar coins on sell
        spawnCoinsForClick('usd', saleValue);
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllETH(button) {
        if (ethBalance <= 0) return;
        const effectivePrice = getEffectiveCryptoPrice(ethPrice);
        const saleValue = ethBalance * effectivePrice * 0.95; // 5% fee
        addEarnings(saleValue);
        ethBalance = 0;
        // Spawn dollar coins on sell (1 coin per $10 USD)
        spawnCoinsForClick('usd', saleValue);
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        // Show enhanced visual feedback
        showSellFeedback(button);
    }

    function sellDOGE(amount) {
        // DOGE uses whole numbers
        if (dogeBalance < amount) {
            alert('Not enough Dogecoin!');
            return;
        }
        const effectivePrice = getEffectiveCryptoPrice(dogePrice);
        const saleValue = amount * effectivePrice * 0.95; // 5% fee
        dogeBalance -= amount;
        addEarnings(saleValue);
        // Spawn dollar coins on sell
        spawnCoinsForClick('usd', saleValue);
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        playUpgradeSound();
    }

    function sellAllDOGE(button) {
        if (dogeBalance <= 0) return;
        const effectivePrice = getEffectiveCryptoPrice(dogePrice);
        const saleValue = dogeBalance * effectivePrice;
        addEarnings(saleValue);
        dogeBalance = 0;
        // Spawn dollar coins on sell (1 coin per $10 USD)
        spawnCoinsForClick('usd', saleValue);
        // Track for tutorial
        if (typeof tutorialData !== 'undefined') {
            tutorialData.cryptoSoldOnce = true;
        }
        updateUI();
        saveGame();
        // Show enhanced visual feedback
        showSellFeedback(button);
    }

    /**
     * Quick sell functions that use percentages (like staking)
     */
    function quickSellBTC(percentage, button) {
        if (btcBalance <= 0) return;
        const amountToSell = btcBalance * (percentage / 100);
        const effectivePrice = getEffectiveCryptoPrice(btcPrice);
        const saleValue = amountToSell * effectivePrice * 0.95; // 5% fee
        btcBalance -= amountToSell;
        addEarnings(saleValue);
        // Spawn dollar coins on sell
        spawnCoinsForClick('usd', saleValue);
        updateUI();
        saveGame();
        // Show enhanced visual feedback
        showSellFeedback(button);
    }

    function quickSellETH(percentage, button) {
        if (ethBalance <= 0) return;
        const amountToSell = ethBalance * (percentage / 100);
        const effectivePrice = getEffectiveCryptoPrice(ethPrice);
        const saleValue = amountToSell * effectivePrice * 0.95; // 5% fee
        ethBalance -= amountToSell;
        addEarnings(saleValue);
        // Spawn dollar coins on sell
        spawnCoinsForClick('usd', saleValue);
        updateUI();
        saveGame();
        // Show enhanced visual feedback
        showSellFeedback(button);
    }

    function quickSellDOGE(percentage, button) {
        if (dogeBalance <= 0) return;
        const amountToSell = dogeBalance * (percentage / 100);
        const effectivePrice = getEffectiveCryptoPrice(dogePrice);
        const saleValue = amountToSell * effectivePrice * 0.95; // 5% fee
        dogeBalance -= amountToSell;
        addEarnings(saleValue);
        // Spawn dollar coins on sell
        spawnCoinsForClick('usd', saleValue);
        updateUI();
        saveGame();
        // Show enhanced visual feedback
        showSellFeedback(button);
    }

    function buyPowerUpgrade(i) {
        const u = powerUpgrades[i];
        const costUsd = u.currentUsd;

        if (dollarBalance >= costUsd) {
            dollarBalance -= costUsd;
            totalPowerUSD += costUsd;
            hardwareEquity += u.currentUsd;
            u.level++;
            u.currentPower = u.basePower * u.level;
            totalPowerAvailable += u.basePower;

            // Update chart max capacity to reflect new power level
            const availablePower = getTotalPowerAvailableWithBonus();
            if (availablePower > maxPowerCapacity) {
                maxPowerCapacity = availablePower;
            }

            // Update price with 1.2x multiplier
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));

            // Track Basic Power Strip purchase for tutorial
            if (i === 0 && typeof trackPowerStripPurchase === 'function') {
                trackPowerStripPurchase();
            }

            // Force immediate UI update by resetting the throttle timer
            lastUIUpdateTime = 0;
            updateUI();
            saveGame();
            playUpgradeSound();

            // Check power achievements based on total capacity and USD spent
            if (typeof checkAchievements === 'function') {
                // Make totalPowerUSD available globally for achievements check
                window.totalPowerUSD = totalPowerUSD;
                checkAchievements(totalPowerAvailable);
            }
        }
    }

    // ============== HACKING MINIGAME FUNCTIONS ==============

    // Difficulty configurations - rewards are USD values, converted to crypto based on current prices
    const hackingDifficultyConfig = {
        'EASY': {
            vulnerabilities: 3,
            timeLimit: 30000,
            codeLines: 12,
            lives: 8,
            baseUsdValue: 100,  // $100 base - scales with progression
            speedBoost: 1.10,
            boostDuration: 120000, // 2 minutes
            cooldown: 300000 // 5 minute cooldown
        },
        'MEDIUM': {
            vulnerabilities: 5,
            timeLimit: 19000,
            codeLines: 16,
            lives: 11,
            baseUsdValue: 1000,  // $1K base - scales with progression
            speedBoost: 1.25,
            boostDuration: 120000, // 2 minutes
            cooldown: 900000 // 15 minute cooldown
        },
        'HARD': {
            vulnerabilities: 5,
            timeLimit: 13000,
            codeLines: 18,
            lives: 13,
            baseUsdValue: 5000,  // $5K base - scales with progression
            speedBoost: 1.50,
            boostDuration: 120000, // 2 minutes
            cooldown: 1800000 // 30 minute cooldown
        }
    };

    // Code templates for hacking minigame
    const codeTemplates = {
        'EASY': [
            `pragma solidity ^0.8.0;\ncontract Vault {\n    mapping(address => uint) balances;\n    \n    function withdraw(uint amount) public {\n        require(balances[msg.sender] > 0);        [V]\n        balances[msg.sender] -= amount;\n        (bool success, ) = msg.sender.call{value: amount}("");  [V]\n        require(success);\n    }\n    \n    function deposit() external payable {\n        balances[msg.sender] = msg.value;         [V]\n    }\n}`,
            `contract Token {\n    mapping(address => uint) public balances;\n    \n    function transfer(address to, uint amount) public {\n        balances[msg.sender] -= amount;           [V]\n        balances[to] += amount;                    [V]\n    }\n    \n    function mint(uint amount) public {\n        balances[msg.sender] += amount;            [V]\n    }\n}`,
        ],
        'MEDIUM': [
            `contract Auction {\n    address public highestBidder;\n    uint public highestBid;\n    \n    function bid() public payable {\n        require(msg.value > highestBid);\n        if (highestBidder != address(0)) {\n            payable(highestBidder).transfer(highestBid);  [V]\n        }\n        highestBidder = msg.sender;                [V]\n        highestBid = msg.value;                    [V]\n    }\n    \n    function claimPrize() public {\n        require(msg.sender == highestBidder);      [V]\n        payable(msg.sender).transfer(address(this).balance);\n    }\n}`,
            `contract Lottery {\n    address[] public players;\n    \n    function enter() public payable {\n        require(msg.value == 0.1 ether);           [V]\n        players.push(msg.sender);\n    }\n    \n    function random() private view returns (uint) {\n        return uint(keccak256(abi.encodePacked(block.timestamp)));  [V]\n    }\n    \n    function pickWinner() public {\n        uint index = random() % players.length;    [V]\n        payable(players[index]).transfer(address(this).balance);  [V]\n        delete players;                             [V]\n    }\n}`,
        ],
        'HARD': [
            `contract Exchange {\n    mapping(address => uint) public ethBalances;\n    mapping(address => uint) public tokenBalances;\n    uint public ethToTokenRate = 100;\n    \n    function depositEth() public payable {\n        ethBalances[msg.sender] += msg.value;      [V]\n    }\n    \n    function swapEthForTokens(uint ethAmount) public {\n        require(ethBalances[msg.sender] >= ethAmount);\n        uint tokens = ethAmount * ethToTokenRate;   [V]\n        ethBalances[msg.sender] -= ethAmount;       [V]\n        tokenBalances[msg.sender] += tokens;        [V]\n        (bool success, ) = msg.sender.call{value: ethAmount}("");  [V]\n        require(success);\n    }\n    \n    function updateRate(uint newRate) public {\n        ethToTokenRate = newRate;                   [V]\n    }\n}`,
        ]
    };

    // Whack-A-Block Minigame Configuration
    const whackDifficultyConfig = {
        'EASY': {
            timeLimit: 15000,
            lives: 14,
            spawnRate: 700, // milliseconds between block spawns (slower = easier)
            blockVisibility: 950, // milliseconds block stays visible (longer = easier)
            simultaneousBlocks: 1, // number of blocks visible at once (reduced for easier play)
            baseUsdValue: 50,  // $50 base - scales with progression
            cooldown: 180000 // 3 minute cooldown
        },
        'MEDIUM': {
            timeLimit: 15000,
            lives: 18,
            spawnRate: 550, // milliseconds between block spawns (slower = easier)
            blockVisibility: 800, // milliseconds block stays visible (longer = easier)
            simultaneousBlocks: 2, // number of blocks visible at once
            baseUsdValue: 500,  // $500 base - scales with progression
            cooldown: 600000 // 10 minute cooldown
        },
        'HARD': {
            timeLimit: 15000,
            lives: 22,
            spawnRate: 480, // milliseconds between block spawns (slower = easier)
            blockVisibility: 760, // milliseconds block stays visible (longer = easier)
            simultaneousBlocks: 2, // number of blocks visible at once (reduced for easier play)
            baseUsdValue: 2000,  // $2K base - scales with progression
            cooldown: 1200000 // 20 minute cooldown
        }
    };

    function generateVulnerableCode(difficulty) {
        const templates = codeTemplates[difficulty];
        const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
        const lines = selectedTemplate.split('\n');

        // Find vulnerable lines (marked with [V])
        const vulnerableIndices = [];
        lines.forEach((line, index) => {
            if (line.includes('[V]')) {
                vulnerableIndices.push(index);
                // Clean the marker from display
                lines[index] = line.replace('[V]', '').trim();
            }
        });

        return { lines, vulnerableIndices };
    }

    function initHackingMinigame(difficulty) {
        // Check if minigame_unlock is purchased (unlocks all minigames at start)
        const hasMinigameUnlock = (typeof metaUpgrades !== 'undefined' && metaUpgrades.minigame_unlock && metaUpgrades.minigame_unlock.purchased);

        // Check difficulty-specific unlock requirements
        let requiredEarnings = 0;
        let difficultyName = '';

        if (difficulty === 'EASY') {
            requiredEarnings = 0;
            difficultyName = 'EASY';
        } else if (difficulty === 'MEDIUM') {
            requiredEarnings = 0;
            difficultyName = 'MEDIUM';
        } else if (difficulty === 'HARD') {
            requiredEarnings = 0;
            difficultyName = 'HARD';
        }

        if (!hasMinigameUnlock && lifetimeEarnings < requiredEarnings) {
            // Lock overlay is already displayed on button by updateHackingCooldownDisplays()
            return;
        }

        // Check cooldown
        const now = Date.now();
        const cooldownEnd = hackingCooldowns[difficulty] || 0;

        if (now < cooldownEnd) {
            // Cooldown timer is already displayed on button by updateHackingCooldownDisplays()
            return;
        }

        hackingGameDifficulty = difficulty;
        hackingGameActive = true;
        console.log(`[HACKING] Starting ${difficulty} game`);
        const config = hackingDifficultyConfig[difficulty];
        hackingGameTimeLimit = config.timeLimit;
        hackingGameStartTime = Date.now();

        const { lines, vulnerableIndices } = generateVulnerableCode(difficulty);
        hackingVulnerabilitiesToFind = vulnerableIndices.slice(0, config.vulnerabilities);
        hackingVulnerabilitiesFound = [];

        // Set lives from config
        hackingMaxLives = config.lives;
        hackingLivesRemaining = hackingMaxLives;

        // Hide notification if visible
        const notification = document.getElementById('hacking-notification');
        if (notification) notification.style.display = 'none';

        // Show modal
        const modal = document.getElementById('hacking-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        // NOTE: Disabled to prevent layout breaking - document.body.classList.add('minigame-modal-open');

        // Hide previous results and show game content
        const resultMessage = document.getElementById('hacking-result-message');
        const gameInfo = document.getElementById('hacking-game-info');
        if (resultMessage) resultMessage.style.display = 'none';
        if (gameInfo) gameInfo.style.display = 'block';

        // Update modal content
        document.getElementById('hacking-difficulty-display').textContent = difficulty;
        document.getElementById('hacking-found-count').textContent = `0/${config.vulnerabilities}`;
        document.getElementById('hacking-lives-display').textContent = `❤️ ${hackingLivesRemaining}/${hackingMaxLives}`;

        // Display code
        const codeContainer = document.getElementById('hacking-code-container');
        codeContainer.innerHTML = '';
        lines.forEach((line, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'hacking-code-line';
            lineDiv.textContent = `${String(index + 1).padStart(2, ' ')} | ${line}`;
            lineDiv.setAttribute('data-line-index', index);

            // All lines are clickable (even non-vulnerable ones)
            lineDiv.style.cursor = 'pointer';
            lineDiv.onclick = () => checkHackingVulnerability(index);

            codeContainer.appendChild(lineDiv);
        });

        // Start timer update
        updateHackingTimer();
    }

    function checkHackingVulnerability(lineIndex) {
        if (!hackingGameActive) return;
        if (hackingVulnerabilitiesFound.includes(lineIndex)) return;

        const lineElement = document.querySelector(`[data-line-index="${lineIndex}"]`);

        if (hackingVulnerabilitiesToFind.includes(lineIndex)) {
            // Correct vulnerability found
            hackingVulnerabilitiesFound.push(lineIndex);
            lineElement.classList.add('vulnerability-found');
            lineElement.style.background = 'rgba(0, 255, 136, 0.3)';
            lineElement.style.border = '1px solid #00ff88';

            const config = hackingDifficultyConfig[hackingGameDifficulty];
            document.getElementById('hacking-found-count').textContent =
                `${hackingVulnerabilitiesFound.length}/${config.vulnerabilities}`;

            // Check if all found
            if (hackingVulnerabilitiesFound.length === config.vulnerabilities) {
                endHackingGame(true);
            }
        } else {
            // Wrong line clicked - lose a life!
            hackingLivesRemaining--;

            // Show red feedback
            lineElement.style.background = 'rgba(255, 51, 68, 0.6)';
            lineElement.style.border = '2px solid #ff3344';
            setTimeout(() => {
                lineElement.style.background = '';
                lineElement.style.border = '';
            }, 500);

            // Shake the modal!
            const modal = document.getElementById('hacking-modal');
            const modalContent = modal.querySelector('div');
            modalContent.classList.add('modal-shake');
            setTimeout(() => {
                modalContent.classList.remove('modal-shake');
            }, 500);

            // Update lives display
            document.getElementById('hacking-lives-display').textContent = `❤️ ${hackingLivesRemaining}/${hackingMaxLives}`;

            // Check if game over
            if (hackingLivesRemaining <= 0) {
                endHackingGame(false);
            }
        }
    }

    function updateHackingTimer() {
        if (!hackingGameActive) return;

        const elapsed = Date.now() - hackingGameStartTime;
        const remaining = Math.max(0, hackingGameTimeLimit - elapsed);
        const seconds = Math.ceil(remaining / 1000);

        const timerEl = document.getElementById('hacking-timer');
        if (timerEl) {
            timerEl.textContent = `${seconds}s`;

            // Change color based on time
            if (seconds <= 3) {
                timerEl.style.color = '#ff3344';
            } else if (seconds <= 5) {
                timerEl.style.color = '#ff9500';
            } else {
                timerEl.style.color = '#00ff88';
            }
        }

        if (remaining <= 0) {
            endHackingGame(false);
        } else {
            setTimeout(updateHackingTimer, 100);
        }
    }

    function endHackingGame(won) {
        hackingGameActive = false;
        hackingGamesPlayed++;

        const modal = document.getElementById('hacking-modal');
        const config = hackingDifficultyConfig[hackingGameDifficulty];

        // Set cooldown for this difficulty
        hackingCooldowns[hackingGameDifficulty] = Date.now() + config.cooldown;
        const cooldownSeconds = Math.ceil(config.cooldown / 1000);
        console.log(`[HACKING] Setting ${hackingGameDifficulty} cooldown to ${config.cooldown}ms (${cooldownSeconds}s)`);
        console.log('[HACKING] All cooldowns:', hackingCooldowns);
        window.hackingCooldowns = hackingCooldowns; // Make it accessible in console

        if (won) {
            hackingGamesWon++;
            hackingGamesWonByDifficulty[hackingGameDifficulty]++;
            hackingConsecutiveWins++;

            // Calculate multipliers
            const completionTime = Date.now() - hackingGameStartTime;
            const timeBonus = Math.max(1, 1.5 - (completionTime / hackingGameTimeLimit));
            const consecutiveMultiplier = 1 + (Math.min(hackingConsecutiveWins, 5) * 0.1);
            const finalMultiplier = timeBonus * consecutiveMultiplier;

            // Award rewards and get the amounts
            const rewards = awardHackingRewards(hackingGameDifficulty, finalMultiplier);

            // Store rewards for display in results modal
            hackingLastRewards = rewards;

            // Apply speed boost - ADDITIVE stacking
            if (speedBoostActive) {
                // Add the boost percentage (e.g., 1.10 - 1 = 0.10, so add 10%)
                const currentBonus = speedBoostMultiplier - 1;
                const newBonus = config.speedBoost - 1;
                speedBoostMultiplier = 1 + currentBonus + newBonus;
                // Extend the duration (take the longer of current remaining time or new duration)
                const remainingTime = Math.max(0, speedBoostEndTime - Date.now());
                speedBoostEndTime = Date.now() + Math.max(remainingTime, config.boostDuration);
                console.log(`⚡ Speed boost STACKED: +${((speedBoostMultiplier - 1) * 100).toFixed(0)}% for ${Math.ceil((speedBoostEndTime - Date.now())/60000)} minutes`);
            } else {
                // New boost
                speedBoostMultiplier = config.speedBoost;
                speedBoostEndTime = Date.now() + config.boostDuration;
                speedBoostActive = true;
                console.log(`⚡ Speed boost activated: +${((speedBoostMultiplier - 1) * 100).toFixed(0)}% for ${config.boostDuration/60000} minutes`);
            }

            // Check achievements (delay to ensure UI is ready)
            if (typeof checkAchievements === 'function') {
                setTimeout(() => {
                    checkAchievements(totalPowerUsed);
                }, 100);
            }
        } else {
            hackingConsecutiveWins = 0;
        }

        // Update stats
        updateHackingStats();

        // Close game modal and show results modal
        const gameModal = document.getElementById('hacking-modal');
        const resultsModal = document.getElementById('hacking-results-modal');

        if (gameModal) gameModal.style.display = 'none';

        // Populate results modal
        if (resultsModal) {
            // Update title
            const titleEl = document.getElementById('hacking-results-title');
            if (titleEl) {
                titleEl.textContent = won ? '🔐 AUDIT COMPLETE' : '🔐 AUDIT FAILED';
            }

            // Update vulnerabilities found
            const linesEl = document.getElementById('hacking-results-lines');
            if (linesEl) linesEl.textContent = hackingVulnerabilitiesFound.length;

            // Update rewards breakdown
            const rewardsEl = document.getElementById('hacking-results-rewards-breakdown');
            if (rewardsEl) {
                if (won) {
                    rewardsEl.innerHTML = `<div style="color: #f7931a; font-weight: 700; margin-bottom: 8px;">Rewards Earned:</div>
                        <div style="color: #fff; font-size: 0.9rem; line-height: 1.6;">
                            ₿ ${hackingLastRewards.btc >= 1 ? hackingLastRewards.btc.toFixed(4) : hackingLastRewards.btc.toFixed(8)} BTC<br>
                            Ξ ${hackingLastRewards.eth >= 1 ? hackingLastRewards.eth.toFixed(4) : hackingLastRewards.eth.toFixed(8)} ETH<br>
                            Ð ${hackingLastRewards.doge.toFixed(2)} DOGE<br>
                            💵 $${abbreviateNumber(hackingLastRewards.totalUsd)}
                        </div>`;
                } else {
                    rewardsEl.innerHTML = `<div style="color: #888;">No rewards earned</div>`;
                }
            }

            // Show the results modal
            resultsModal.style.display = 'flex';
        }

        // Schedule next notification
        scheduleHackingNotification();

        saveGame();
    }

    function awardHackingRewards(difficulty, multiplier) {
        const config = hackingDifficultyConfig[difficulty];

        // Get current rugpull/ascension level (defined in rugpull.js)
        const rugpullLevel = (typeof ascensionLevel !== 'undefined') ? ascensionLevel : 0;

        // Hash rate-based reward system: each line validated = $50 base + (BTC/sec × BTC price + ETH/sec × ETH price + DOGE/sec × DOGE price)
        const currentBtcPerSec = window.btcPerSec ?? btcPerSec ?? 0;
        const currentEthPerSec = window.ethPerSec ?? ethPerSec ?? 0;
        const currentDogePerSec = window.dogePerSec ?? dogePerSec ?? 0;
        const currentBtcPrice = window.btcPrice ?? btcPrice ?? 100000;
        const currentEthPrice = window.ethPrice ?? ethPrice ?? 3500;
        const currentDogePrice = window.dogePrice ?? dogePrice ?? 0.25;

        // Number of lines validated (vulnerabilities found)
        const linesValidated = hackingVulnerabilitiesFound.length;

        // Reward per line formula: $50 base + (current hash rate value in USD)
        const hashRateUsdValue = (currentBtcPerSec * currentBtcPrice) + (currentEthPerSec * currentEthPrice) + (currentDogePerSec * currentDogePrice);
        const rewardPerLine = 50 + hashRateUsdValue;

        // Total base USD value = lines validated × reward per line
        let baseUsdValue = linesValidated * rewardPerLine;

        // Time bonus and consecutive wins bonus (already in multiplier parameter)
        const totalMultiplier = multiplier;

        // Rugpull multiplier: 1.15x per rugpull level (exponential scaling like buildings)
        // Rugpull 0 = 1x, Rugpull 1 = 1.15x, Rugpull 5 = 2.01x, Rugpull 10 = 4.05x
        const ascensionMultiplier = Math.pow(1.15, rugpullLevel);

        // Minigame reward bonus from skill tree purchases
        const minigameRewardBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('minigame_rewards') : 0;
        const minigameRewardMultiplier = 1 + minigameRewardBonus / 100;

        // Calculate total USD value after all multipliers
        const totalUsdValue = baseUsdValue * totalMultiplier * ascensionMultiplier * minigameRewardMultiplier;

        // Award BTC (40% of total USD value, converted to BTC at current price)
        const btcUsdValue = totalUsdValue * 0.40;
        const btcReward = btcUsdValue / btcPrice;
        btcBalance += btcReward;
        btcLifetime += btcReward;

        // Award ETH (35% of total USD value, converted to ETH at current price)
        const ethUsdValue = totalUsdValue * 0.35;
        const ethReward = ethUsdValue / ethPrice;
        ethBalance += ethReward;
        ethLifetime += ethReward;

        // Award DOGE (20% of total USD value, converted to DOGE at current price)
        const dogeUsdValue = totalUsdValue * 0.20;
        const dogeReward = dogeUsdValue / dogePrice;
        dogeBalance += dogeReward;
        dogeLifetime += dogeReward;

        // Award USD (5% as direct cash)
        const usdReward = totalUsdValue * 0.05;
        addEarnings(usdReward);

        // Track total rewards
        hackingTotalRewardsEarned += totalUsdValue;
        lifetimeEarnings += totalUsdValue;
        sessionEarnings += totalUsdValue;

        // Return the rewards for display
        return {
            btc: btcReward,
            eth: ethReward,
            doge: dogeReward,
            usd: usdReward,
            totalUsd: totalUsdValue
        };
    }

    function getHackingSpeedBoost() {
        if (!speedBoostActive) return 1.0;

        const now = Date.now();
        if (now >= speedBoostEndTime) {
            speedBoostActive = false;
            speedBoostMultiplier = 1.0;
            return 1.0;
        }

        return speedBoostMultiplier;
    }

    function scheduleHackingNotification() {
        // Schedule next notification in 30-60 minutes
        const delay = (30 + Math.random() * 30) * 60 * 1000;
        hackingNextNotificationTime = Date.now() + delay;
    }

    function displayHackingNotification() {
        const notification = document.getElementById('hacking-notification');
        if (!notification) return;

        notification.style.display = 'flex';
    }

    function closeHackingModal() {
        const modal = document.getElementById('hacking-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        // document.body.classList.remove('minigame-modal-open');

        // Spawn explosion coins when closing results
        if (vfxEnabled && hackingGamesWon > 0 && typeof spawnExplosionCoins === 'function') {
            // Use last rewards if we just won
            const totalUsdValue = (hackingLastRewards?.btc * btcPrice || 0) + (hackingLastRewards?.eth * ethPrice || 0) + (hackingLastRewards?.doge * dogePrice || 0);
            const coinCount = Math.max(80, Math.min(300, Math.floor(totalUsdValue / 10)));
            spawnExplosionCoins('btc', coinCount / 4);
            spawnExplosionCoins('eth', coinCount / 4);
            spawnExplosionCoins('doge', coinCount / 4);
            spawnExplosionCoins('usd', coinCount / 4);
        }

        // Reset modal state
        document.getElementById('hacking-code-container').style.display = 'block';
        document.getElementById('hacking-result-message').style.display = 'none';
        document.getElementById('hacking-close-btn').style.display = 'none';
    }

    function closeHackingResultsModal() {
        const modal = document.getElementById('hacking-results-modal');
        if (modal) modal.style.display = 'none';
        // document.body.classList.remove('minigame-modal-open');

        // Spawn explosion coins when closing results
        if (vfxEnabled && hackingGamesWon > 0 && typeof spawnExplosionCoins === 'function') {
            // Use last rewards if we just won
            const totalUsdValue = (hackingLastRewards?.btc * btcPrice || 0) + (hackingLastRewards?.eth * ethPrice || 0) + (hackingLastRewards?.doge * dogePrice || 0);
            const coinCount = Math.max(80, Math.min(300, Math.floor(totalUsdValue / 10)));
            spawnExplosionCoins('btc', coinCount / 4);
            spawnExplosionCoins('eth', coinCount / 4);
            spawnExplosionCoins('doge', coinCount / 4);
            spawnExplosionCoins('usd', coinCount / 4);
        }
    }

    function dismissHackingNotification() {
        const notification = document.getElementById('hacking-notification');
        if (notification) {
            notification.style.display = 'none';
        }

        // Schedule next notification
        scheduleHackingNotification();
    }

    function updateHackingStats() {
        const statsContainer = document.getElementById('hacking-stats-content');
        if (!statsContainer) return;

        const winRate = hackingGamesPlayed > 0 ? ((hackingGamesWon / hackingGamesPlayed) * 100).toFixed(1) : '0.0';

        // Abbreviate total rewards
        let rewardsDisplay = '';
        if (hackingTotalRewardsEarned >= 1e12) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e12).toFixed(2) + 'T';
        } else if (hackingTotalRewardsEarned >= 1e9) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e9).toFixed(2) + 'B';
        } else if (hackingTotalRewardsEarned >= 1e6) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e6).toFixed(2) + 'M';
        } else if (hackingTotalRewardsEarned >= 1e3) {
            rewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e3).toFixed(2) + 'K';
        } else {
            rewardsDisplay = '$' + hackingTotalRewardsEarned.toFixed(2);
        }

        statsContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Games Played:</span>
                <span style="color: #fff; font-weight: 700; margin-left: 10px;">${hackingGamesPlayed}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Win Rate:</span>
                <span style="color: #00ff88; font-weight: 700; margin-left: 10px;">${winRate}%</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Consecutive Wins:</span>
                <span style="color: #f7931a; font-weight: 700; margin-left: 10px;">${hackingConsecutiveWins}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="color: #888; font-size: 0.8rem;">Total Rewards:</span>
                <span style="color: #fff; font-weight: 700; margin-left: 10px;">${rewardsDisplay}</span>
            </div>
            ${speedBoostActive ? `
            <div style="margin-top: 15px; padding: 10px; background: rgba(0, 255, 136, 0.1); border: 1px solid #00ff88; border-radius: 6px;">
                <div style="color: #00ff88; font-weight: 700; margin-bottom: 5px;">⚡ ACTIVE SPEED BOOST</div>
                <div style="color: #fff; font-size: 0.9rem;">+${((speedBoostMultiplier - 1) * 100).toFixed(0)}% Mining Speed</div>
                <div style="color: #888; font-size: 0.8rem;">${Math.ceil((speedBoostEndTime - Date.now()) / 60000)} minutes remaining</div>
            </div>
            ` : ''}
        `;
    }

    function updateWhackStats() {
        // Update whack-a-block stats in the UI
        const gamesPlayedEl = document.getElementById('whack-games-played');
        if (gamesPlayedEl) gamesPlayedEl.textContent = whackGameGamesPlayed;

        const gamesWonEl = document.getElementById('whack-games-won');
        if (gamesWonEl) gamesWonEl.textContent = whackGameGamesWon;

        // Abbreviate total rewards
        let rewardsDisplay = '';
        if (whackGameTotalRewardsEarned >= 1e12) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e12).toFixed(2) + 'T';
        } else if (whackGameTotalRewardsEarned >= 1e9) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e9).toFixed(2) + 'B';
        } else if (whackGameTotalRewardsEarned >= 1e6) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e6).toFixed(2) + 'M';
        } else if (whackGameTotalRewardsEarned >= 1e3) {
            rewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e3).toFixed(2) + 'K';
        } else {
            rewardsDisplay = '$' + whackGameTotalRewardsEarned.toFixed(2);
        }

        const totalRewardsEl = document.getElementById('whack-total-rewards');
        if (totalRewardsEl) totalRewardsEl.textContent = rewardsDisplay.slice(1); // Remove $ from display
    }

    function updateNetworkStats() {
        // Update network stress test stats in the UI
        const gamesPlayedEl = document.getElementById('network-games-played');
        if (gamesPlayedEl) gamesPlayedEl.textContent = networkGameGamesPlayed;

        const gamesWonEl = document.getElementById('network-games-won');
        if (gamesWonEl) gamesWonEl.textContent = networkGameGamesWon;

        // Abbreviate total rewards
        let rewardsDisplay = '';
        if (networkGameTotalRewardsEarned >= 1e12) {
            rewardsDisplay = '$' + (networkGameTotalRewardsEarned / 1e12).toFixed(2) + 'T';
        } else if (networkGameTotalRewardsEarned >= 1e9) {
            rewardsDisplay = '$' + (networkGameTotalRewardsEarned / 1e9).toFixed(2) + 'B';
        } else if (networkGameTotalRewardsEarned >= 1e6) {
            rewardsDisplay = '$' + (networkGameTotalRewardsEarned / 1e6).toFixed(2) + 'M';
        } else if (networkGameTotalRewardsEarned >= 1e3) {
            rewardsDisplay = '$' + (networkGameTotalRewardsEarned / 1e3).toFixed(2) + 'K';
        } else {
            rewardsDisplay = '$' + networkGameTotalRewardsEarned.toFixed(2);
        }

        const totalRewardsEl = document.getElementById('network-total-rewards');
        if (totalRewardsEl) totalRewardsEl.textContent = rewardsDisplay.slice(1); // Remove $ from display
    }

    function updateMinigamesTab() {
        // Update minigames hub stats display

        // Hacking stats
        const hackingWonEl = document.getElementById('hacking-games-won-display');
        if (hackingWonEl) hackingWonEl.textContent = hackingGamesWon;

        const hackingPlayedEl = document.getElementById('hacking-games-played-display');
        if (hackingPlayedEl) hackingPlayedEl.textContent = hackingGamesPlayed;

        const hackingRewardsEl = document.getElementById('hacking-rewards-display');
        if (hackingRewardsEl) {
            let hackingRewardsDisplay = '';
            if (hackingTotalRewardsEarned >= 1e6) {
                hackingRewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e6).toFixed(2) + 'M';
            } else if (hackingTotalRewardsEarned >= 1e3) {
                hackingRewardsDisplay = '$' + (hackingTotalRewardsEarned / 1e3).toFixed(2) + 'K';
            } else {
                hackingRewardsDisplay = '$' + hackingTotalRewardsEarned.toFixed(0);
            }
            hackingRewardsEl.textContent = hackingRewardsDisplay;
        }

        // Whack stats
        const whackWonEl = document.getElementById('whack-games-won-display');
        if (whackWonEl) whackWonEl.textContent = whackGameGamesWon;

        const whackPlayedEl = document.getElementById('whack-games-played-display');
        if (whackPlayedEl) whackPlayedEl.textContent = whackGameGamesPlayed;

        const whackRewardsEl = document.getElementById('whack-rewards-display');
        if (whackRewardsEl) {
            let whackRewardsDisplay = '';
            if (whackGameTotalRewardsEarned >= 1e6) {
                whackRewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e6).toFixed(2) + 'M';
            } else if (whackGameTotalRewardsEarned >= 1e3) {
                whackRewardsDisplay = '$' + (whackGameTotalRewardsEarned / 1e3).toFixed(2) + 'K';
            } else {
                whackRewardsDisplay = '$' + whackGameTotalRewardsEarned.toFixed(0);
            }
            whackRewardsEl.textContent = whackRewardsDisplay;
        }

        // Network stats
        const networkWonEl = document.getElementById('network-games-won-display');
        if (networkWonEl) networkWonEl.textContent = networkGameGamesWon;

        const networkPlayedEl = document.getElementById('network-games-played-display');
        if (networkPlayedEl) networkPlayedEl.textContent = networkGameGamesPlayed;

        const networkRewardsEl = document.getElementById('network-rewards-display');
        if (networkRewardsEl) {
            let networkRewardsDisplay = '';
            if (networkGameTotalRewardsEarned >= 1e6) {
                networkRewardsDisplay = '$' + (networkGameTotalRewardsEarned / 1e6).toFixed(2) + 'M';
            } else if (networkGameTotalRewardsEarned >= 1e3) {
                networkRewardsDisplay = '$' + (networkGameTotalRewardsEarned / 1e3).toFixed(2) + 'K';
            } else {
                networkRewardsDisplay = '$' + networkGameTotalRewardsEarned.toFixed(0);
            }
            networkRewardsEl.textContent = networkRewardsDisplay;
        }

        // Packet Interceptor stats
        const packetWonEl = document.getElementById('packet-games-won-display');
        if (packetWonEl) packetWonEl.textContent = packetGameGamesWon;

        const packetPlayedEl = document.getElementById('packet-games-played-display');
        if (packetPlayedEl) packetPlayedEl.textContent = packetGameGamesPlayed;

        const packetRewardsEl = document.getElementById('packet-rewards-display');
        if (packetRewardsEl) {
            let packetRewardsDisplay = '';
            if (packetGameTotalRewardsEarned >= 1e6) {
                packetRewardsDisplay = '$' + (packetGameTotalRewardsEarned / 1e6).toFixed(2) + 'M';
            } else if (packetGameTotalRewardsEarned >= 1e3) {
                packetRewardsDisplay = '$' + (packetGameTotalRewardsEarned / 1e3).toFixed(2) + 'K';
            } else {
                packetRewardsDisplay = '$' + packetGameTotalRewardsEarned.toFixed(0);
            }
            packetRewardsEl.textContent = packetRewardsDisplay;
        }
    }

    function updateHackingCooldownDisplays() {
        const now = Date.now();

        // Unlock requirements for each difficulty
        const unlockRequirements = {
            'EASY': 0,
            'MEDIUM': 0,
            'HARD': 0
        };

        // Update each difficulty button's cooldown overlay
        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            const cooldownEnd = hackingCooldowns[difficulty] || 0;
            const cooldownElement = document.getElementById(`hacking-${difficulty.toLowerCase()}-cooldown`);
            const lockedElement = document.getElementById(`hacking-${difficulty.toLowerCase()}-locked`);
            const buttonElement = document.getElementById(`hacking-${difficulty.toLowerCase()}-btn`);

            if (!cooldownElement || !buttonElement || !lockedElement) return;

            // Check if difficulty is locked
            const isLocked = lifetimeEarnings < (unlockRequirements[difficulty] || 0);
            const isOnCooldown = now < cooldownEnd && !isLocked;

            // Update locked state
            if (isLocked) {
                lockedElement.style.visibility = 'visible';
                lockedElement.style.pointerEvents = 'none';
                lockedElement.innerHTML = `🔒<br>$${(unlockRequirements[difficulty] || 0).toLocaleString()}`;
                cooldownElement.style.visibility = 'hidden';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.opacity = '1';
                buttonElement.dataset.locked = 'true';
            } else if (isOnCooldown) {
                lockedElement.style.visibility = 'hidden';
                cooldownElement.style.visibility = 'visible';
                cooldownElement.style.opacity = '1';
                cooldownElement.style.pointerEvents = 'none';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.opacity = '0.6';
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.dataset.locked = 'false';
                // Update timer
                const remainingMs = cooldownEnd - now;
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                cooldownElement.textContent = timerText;
                if (difficulty === 'MEDIUM' || difficulty === 'HARD') {
                    console.log(`[HACKING-COOLDOWN] ${difficulty} timer set to: "${timerText}", element visibility: ${cooldownElement.style.visibility}, opacity: ${cooldownElement.style.opacity}`);
                }
            } else {
                // Button is active and clickable
                lockedElement.style.visibility = 'hidden';
                cooldownElement.style.visibility = 'hidden';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.opacity = '1';
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.dataset.locked = 'false';
            }
        });

        // Update whack-a-block cooldowns
        const now2 = Date.now();

        // Unlock requirements for whack-a-block
        const whackUnlockRequirements = {
            'EASY': 5000,
            'MEDIUM': 25000,
            'HARD': 75000
        };

        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            const cooldownEnd = whackCooldowns[difficulty] || 0;
            const cooldownElement = document.getElementById(`whack-${difficulty.toLowerCase()}-cooldown`);
            const lockedElement = document.getElementById(`whack-${difficulty.toLowerCase()}-locked`);
            const buttonElement = document.getElementById(`whack-${difficulty.toLowerCase()}-btn`);

            if (!cooldownElement || !buttonElement || !lockedElement) return;

            // Check if difficulty is locked
            const isLocked = lifetimeEarnings < (whackUnlockRequirements[difficulty] || 0);
            const isOnCooldown = now2 < cooldownEnd && !isLocked;

            // Update locked state
            if (isLocked) {
                lockedElement.style.display = 'flex';
                lockedElement.style.pointerEvents = 'none';
                lockedElement.innerHTML = `🔒<br>$${(whackUnlockRequirements[difficulty] || 0).toLocaleString()}`;
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.opacity = '1';
                buttonElement.dataset.locked = 'true';
            } else if (isOnCooldown) {
                lockedElement.style.display = 'none';
                cooldownElement.style.removeProperty('display');
                cooldownElement.style.setProperty('display', 'flex', 'important');
                cooldownElement.style.pointerEvents = 'none';
                buttonElement.style.cursor = 'not-allowed';
                buttonElement.style.opacity = '0.6';
                buttonElement.dataset.locked = 'false';
                // Update timer
                const remainingMs = cooldownEnd - now2;
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                cooldownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                // Button is active and clickable
                lockedElement.style.display = 'none';
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.opacity = '1';
                buttonElement.dataset.locked = 'false';
            }
        });
    }

    function updateMinigameCardLocks() {
        // Check if packet interceptor minigame is locked (no lock - available from start!)
        const packetLockedCard = document.getElementById('packet-card-locked');
        if (packetLockedCard) {
            packetLockedCard.style.display = 'none'; // Always available
        }

        // Check if packet interceptor MEDIUM is locked (requires $100k lifetime earnings)
        const packetMediumLocked = document.getElementById('packet-medium-locked');
        if (packetMediumLocked) {
            if (lifetimeEarnings < 100000) {
                packetMediumLocked.style.display = 'flex';
                document.getElementById('packet-medium-btn').disabled = true;
                document.getElementById('packet-medium-btn').style.opacity = '0.6';
            } else {
                packetMediumLocked.style.display = 'none';
                document.getElementById('packet-medium-btn').disabled = false;
                document.getElementById('packet-medium-btn').style.opacity = '1';
            }
        }

        // Check if packet interceptor HARD is locked (requires $1M lifetime earnings)
        const packetHardLocked = document.getElementById('packet-hard-locked');
        if (packetHardLocked) {
            if (lifetimeEarnings < 1000000) {
                packetHardLocked.style.display = 'flex';
                document.getElementById('packet-hard-btn').disabled = true;
                document.getElementById('packet-hard-btn').style.opacity = '0.6';
            } else {
                packetHardLocked.style.display = 'none';
                document.getElementById('packet-hard-btn').disabled = false;
                document.getElementById('packet-hard-btn').style.opacity = '1';
            }
        }

        // Check if network stress test minigame is locked (requires $20k)
        // Check if minigame_unlock is purchased (unlocks all minigames at start)
        const hasMinigameUnlock = (typeof metaUpgrades !== 'undefined' && metaUpgrades.minigame_unlock && metaUpgrades.minigame_unlock.purchased);

        const networkLockedCard = document.getElementById('network-card-locked');
        if (networkLockedCard) {
            if (!hasMinigameUnlock && lifetimeEarnings < 20000) {
                networkLockedCard.style.display = 'flex';
            } else {
                networkLockedCard.style.display = 'none';
            }
        }

        // Check if whack-a-block minigame is locked (Easy requires $50k)
        const whackLockedCard = document.getElementById('whack-card-locked');
        if (whackLockedCard) {
            if (!hasMinigameUnlock && lifetimeEarnings < 50000) {
                whackLockedCard.style.display = 'flex';
            } else {
                whackLockedCard.style.display = 'none';
            }
        }

        // Check if hacking minigame is locked (requires $500k)
        const hackingLockedCard = document.getElementById('hacking-card-locked');
        if (hackingLockedCard) {
            if (!hasMinigameUnlock && lifetimeEarnings < 500000) {
                hackingLockedCard.style.display = 'flex';
            } else {
                hackingLockedCard.style.display = 'none';
            }
        }
    }

    // Function to update packet interceptor stats after game completion
    function updatePacketInterceptorStats(packetsCaught, totalReward) {
        packetGameGamesPlayed++;
        if (packetsCaught > 0) {
            packetGameGamesWon++;
        }

        // Scale reward based on current earnings and ascension bonus
        // All difficulties scale with progression so they remain valuable forever
        // Use same scaling as other minigames: rugpull multiplier (1.15x per level, exponential) + ascension bonus + minigame reward bonus
        const rugpullMultiplier = typeof rugpullLevel !== 'undefined' ? Math.pow(1.15, rugpullLevel) : 1;
        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        const minigameRewardBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('minigame_rewards') : 0;
        const totalUsdValue = totalReward * rugpullMultiplier * (1 + ascensionBonus) * (1 + minigameRewardBonus / 100);

        console.log(`[Packet Interceptor] Base Reward: $${totalReward}, Rugpull: ${rugpullMultiplier.toFixed(1)}x, Ascension: ${(ascensionBonus * 100).toFixed(1)}%, Final: $${totalUsdValue.toFixed(2)}`);

        // Distribute rewards in multi-currency format (same split as hacking game)
        // Award BTC (40% of total USD value, converted to BTC at current price)
        const btcUsdValue = totalUsdValue * 0.40;
        const btcReward = btcUsdValue / btcPrice;
        btcBalance += btcReward;
        btcLifetime += btcReward;

        // Award ETH (35% of total USD value, converted to ETH at current price)
        const ethUsdValue = totalUsdValue * 0.35;
        const ethReward = ethUsdValue / ethPrice;
        ethBalance += ethReward;
        ethLifetime += ethReward;

        // Award DOGE (20% of total USD value, converted to DOGE at current price)
        const dogeUsdValue = totalUsdValue * 0.20;
        const dogeReward = dogeUsdValue / dogePrice;
        dogeBalance += dogeReward;
        dogeLifetime += dogeReward;

        // Award USD (5% as direct cash)
        const usdReward = totalUsdValue * 0.05;
        addEarnings(usdReward);

        // Track total rewards
        packetGameTotalRewardsEarned += totalUsdValue;
        lifetimeEarnings += totalUsdValue;
        sessionEarnings += totalUsdValue;

        // Store last rewards for display
        packetLastRewards = {
            btc: btcReward,
            eth: ethReward,
            doge: dogeReward,
            usd: usdReward,
            totalUsd: totalUsdValue
        };

        // Set cooldown based on difficulty (stored in packetGameState from packet-interceptor.js)
        if (typeof packetGameState !== 'undefined') {
            const difficulty = packetGameState.difficulty;
            const cooldownDurations = {
                'EASY': 30 * 1000,      // 30 seconds
                'MEDIUM': 60 * 1000,    // 60 seconds
                'HARD': 120 * 1000      // 120 seconds
            };
            packetCooldowns[difficulty] = Date.now() + (cooldownDurations[difficulty] || 30000);
        }

        // Update displays
        updateMinigamesTab();
        updateMinigameCardLocks();
        updatePacketCooldownDisplays();

        // Save game
        saveGame();
    }


    function updateWhackCooldownDisplays() {
        const now = Date.now();

        // Update each difficulty button's cooldown overlay
        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            const cooldownEnd = whackCooldowns[difficulty] || 0;
            const cooldownElement = document.getElementById(`whack-${difficulty.toLowerCase()}-cooldown`);
            const buttonElement = document.getElementById(`whack-${difficulty.toLowerCase()}-btn`);

            if (!cooldownElement || !buttonElement) return;

            const isOnCooldown = now < cooldownEnd;

            if (isOnCooldown) {
                cooldownElement.style.removeProperty('display');
                cooldownElement.style.setProperty('display', 'flex', 'important');
                cooldownElement.style.pointerEvents = 'none';
                buttonElement.style.cursor = 'not-allowed';
                buttonElement.style.opacity = '0.6';
                // Update timer
                const remainingMs = cooldownEnd - now;
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                cooldownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                // Button is active and clickable
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.opacity = '1';
            }
        });
    }

    function updatePacketCooldownDisplays() {
        const now = Date.now();

        // Update each difficulty button's cooldown overlay
        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            const cooldownEnd = packetCooldowns[difficulty] || 0;
            const cooldownElement = document.getElementById(`packet-${difficulty.toLowerCase()}-cooldown`);
            const buttonElement = document.getElementById(`packet-${difficulty.toLowerCase()}-btn`);

            if (!cooldownElement || !buttonElement) return;

            const isOnCooldown = now < cooldownEnd;

            if (isOnCooldown) {
                cooldownElement.style.removeProperty('display');
                cooldownElement.style.setProperty('display', 'flex', 'important');
                cooldownElement.style.pointerEvents = 'none';
                buttonElement.style.cursor = 'not-allowed';
                buttonElement.style.opacity = '0.6';
                buttonElement.dataset.locked = 'false';
                // Update timer
                const remainingMs = cooldownEnd - now;
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                cooldownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                // Button is active and clickable
                cooldownElement.style.display = 'none';
                buttonElement.style.cursor = 'pointer';
                buttonElement.style.opacity = '1';
                buttonElement.dataset.locked = 'false';
            }
        });
    }

    // ============== END HACKING MINIGAME FUNCTIONS ==============

    // ============== WHACK-A-BLOCK MINIGAME FUNCTIONS ==============

    function initWhackMinigame(difficulty) {
        // Check difficulty-specific unlock requirements
        let requiredEarnings = 0;
        let difficultyName = '';

        if (difficulty === 'EASY') {
            requiredEarnings = 50000;
            difficultyName = 'EASY';
        } else if (difficulty === 'MEDIUM') {
            requiredEarnings = 25000;
            difficultyName = 'MEDIUM';
        } else if (difficulty === 'HARD') {
            requiredEarnings = 75000;
            difficultyName = 'HARD';
        }

        if (lifetimeEarnings < requiredEarnings) {
            // Lock overlay is already displayed on button by updateHackingCooldownDisplays()
            return;
        }

        // Check cooldown
        const now = Date.now();
        const cooldownEnd = whackCooldowns[difficulty] || 0;

        if (now < cooldownEnd) {
            // Cooldown timer is already displayed on button by updateHackingCooldownDisplays()
            return;
        }

        whackGameDifficulty = difficulty;
        whackGameActive = true;
        const config = whackDifficultyConfig[difficulty];
        whackGameTimeLimit = config.timeLimit;
        whackGameStartTime = Date.now();
        whackGameScore = 0;
        whackGameBlocksHit = 0;
        whackGameMaxLives = config.lives;
        whackGameLivesRemaining = whackGameMaxLives;
        whackActiveBlock = null;
        whackActiveBlocks.clear(); // Clear all active blocks

        // Show modal
        const modal = document.getElementById('whack-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Reset display - hide results, show game
        const gameInfo = document.getElementById('whack-game-info');
        const resultsMessage = document.getElementById('whack-results-message');
        const closeBtn = document.getElementById('whack-close-btn');
        if (gameInfo) gameInfo.style.display = 'block';
        if (resultsMessage) resultsMessage.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'none';

        // Update modal content
        document.getElementById('whack-difficulty-display').textContent = difficulty;
        document.getElementById('whack-lives-display').textContent = `❤️ ${whackGameLivesRemaining}/${whackGameMaxLives}`;
        document.getElementById('whack-score-display').textContent = '0';
        document.getElementById('whack-time-display').textContent = '30s';

        // Create grid
        const gridContainer = document.getElementById('whack-grid');
        gridContainer.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const block = document.createElement('div');
            block.className = 'whack-block';
            block.setAttribute('data-block-id', i);
            block.onclick = () => hitBlock(i);
            gridContainer.appendChild(block);
        }

        // Start game
        whackStartGame(config);
    }

    function whackStartGame(config) {
        // Start spawning blocks
        whackSpawnBlock(config.spawnRate);

        // Update timer every 100ms
        whackGameInterval = setInterval(() => {
            const elapsed = Date.now() - whackGameStartTime;
            const remaining = Math.max(0, whackGameTimeLimit - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            const timeDisplay = document.getElementById('whack-time-display');
            if (timeDisplay) timeDisplay.textContent = seconds + 's';

            if (remaining <= 0) {
                endWhackGame(false);
            }
        }, 100);
    }

    function whackSpawnBlock(spawnRate) {
        const config = whackDifficultyConfig[whackGameDifficulty];
        const blockVisibility = config.blockVisibility || 800;
        const simultaneousBlocks = config.simultaneousBlocks || 1;

        whackSpawnInterval = setInterval(() => {
            if (!whackGameActive) return;

            // Spawn new blocks if we haven't reached the limit
            if (whackActiveBlocks.size < simultaneousBlocks) {
                // Find a block that's not already active
                let blockId = Math.floor(Math.random() * 16);
                let attempts = 0;
                while (whackActiveBlocks.has(blockId) && attempts < 10) {
                    blockId = Math.floor(Math.random() * 16);
                    attempts++;
                }

                // Only spawn if we found an available block
                if (!whackActiveBlocks.has(blockId)) {
                    const block = document.querySelector(`[data-block-id="${blockId}"]`);
                    if (block) {
                        whackActiveBlocks.add(blockId);
                        block.classList.add('active');

                        // Auto-miss after blockVisibility time if not clicked
                        setTimeout(() => {
                            if (whackActiveBlocks.has(blockId)) {
                                whackActiveBlocks.delete(blockId);
                                block.classList.remove('active');
                                if (whackGameActive) {
                                    missBlock();
                                }
                            }
                        }, blockVisibility);
                    }
                }
            }
        }, spawnRate);
    }

    function hitBlock(blockId) {
        if (!whackGameActive) return;

        const block = document.querySelector(`[data-block-id="${blockId}"]`);

        // Check if block is visually active (has the 'active' class)
        // This prevents false misses when clicking blocks that are already expiring
        if (block && block.classList.contains('active')) {
            whackGameScore += 10;
            whackGameBlocksHit++;
            whackActiveBlocks.delete(blockId);

            if (block) {
                block.classList.remove('active');
                block.classList.add('hit');
                setTimeout(() => block.classList.remove('hit'), 200);
            }

            // Update display - show blocks suppressed (not score points)
            const scoreDisplay = document.getElementById('whack-score-display');
            if (scoreDisplay) scoreDisplay.textContent = whackGameBlocksHit;

            // Play hit sound
            playClickSound();
        } else {
            // Only trigger miss if block is actually supposed to be active
            // This prevents false misses due to timing/race conditions
            if (block && !block.classList.contains('active')) {
                // Clicked wrong block - trigger red flash and miss
                const grid = document.getElementById('whack-grid');
                if (grid) {
                    grid.classList.add('whack-error-flash');
                    setTimeout(() => grid.classList.remove('whack-error-flash'), 300);
                }
                missBlock();
            }
        }
    }

    function missBlock() {
        if (!whackGameActive) return;

        // Flash grid red when missing a block
        const grid = document.getElementById('whack-grid');
        if (grid) {
            grid.classList.add('whack-error-flash');
            setTimeout(() => grid.classList.remove('whack-error-flash'), 300);
        }

        // Clear active block visually
        if (whackActiveBlock !== null) {
            const block = document.querySelector(`[data-block-id="${whackActiveBlock}"]`);
            if (block) {
                block.classList.remove('active');
            }
            whackActiveBlock = null;
        }

        // Lose a life
        whackGameLivesRemaining--;
        const livesDisplay = document.getElementById('whack-lives-display');
        if (livesDisplay) livesDisplay.textContent = `❤️ ${whackGameLivesRemaining}/${whackGameMaxLives}`;

        if (whackGameLivesRemaining <= 0) {
            endWhackGame(false);
        }
    }

    function endWhackGame(won) {
        // If game was manually closed, don't show results
        if (whackGameManuallyClosed) {
            whackGameManuallyClosed = false; // Reset flag
            if (whackSpawnInterval) clearInterval(whackSpawnInterval);
            if (whackGameInterval) clearInterval(whackGameInterval);
            return;
        }

        whackGameActive = false;

        if (whackSpawnInterval) clearInterval(whackSpawnInterval);
        if (whackGameInterval) clearInterval(whackGameInterval);

        whackGameGamesPlayed++;

        const config = whackDifficultyConfig[whackGameDifficulty];
        let totalReward = 0;

        // Only award rewards if player didn't lose all lives
        if (whackGameLivesRemaining > 0) {
            whackGameGamesWon++;

            // Get current rugpull/ascension level (defined in rugpull.js)
            const rugpullLevel = (typeof ascensionLevel !== 'undefined') ? ascensionLevel : 0;

            // Hash rate-based reward system: each block hit = $10 base + (BTC/sec × BTC price + ETH/sec × ETH price + DOGE/sec × DOGE price)
            const currentBtcPerSec = window.btcPerSec ?? btcPerSec ?? 0;
            const currentEthPerSec = window.ethPerSec ?? ethPerSec ?? 0;
            const currentDogePerSec = window.dogePerSec ?? dogePerSec ?? 0;
            const currentBtcPrice = window.btcPrice ?? btcPrice ?? 100000;
            const currentEthPrice = window.ethPrice ?? ethPrice ?? 3500;
            const currentDogePrice = window.dogePrice ?? dogePrice ?? 0.25;

            // Use actual blocks hit (clicked/suppressed)
            const blocksHit = whackGameBlocksHit;

            // Reward per block formula: $50 base + (current hash rate value in USD)
            const hashRateUsdValue = (currentBtcPerSec * currentBtcPrice) + (currentEthPerSec * currentEthPrice) + (currentDogePerSec * currentDogePrice);
            const rewardPerBlock = 50 + hashRateUsdValue;

            // Total base USD value = blocks hit × reward per block
            let baseUsdValue = blocksHit * rewardPerBlock;

            // Calculate score bonus multiplier based on blocks hit accuracy
            // Better accuracy = higher multiplier (up to 1.5x for perfect - all blocks hit)
            const maxBlocks = 15; // Maximum blocks that can be spawned in 15 seconds
            const scoreMultiplier = Math.min(1.5, (blocksHit / maxBlocks));

            // POWERFUL Rugpull multiplier: 10x per rugpull level
            // Rugpull 1 = 10x, Rugpull 2 = 20x, Rugpull 5 = 50x
            const ascensionMultiplier = Math.pow(1.15, rugpullLevel);

            // Minigame reward bonus from skill tree purchases
            const minigameRewardBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('minigame_rewards') : 0;
            const minigameRewardMultiplier = 1 + minigameRewardBonus / 100;

            // Calculate total USD value after all multipliers
            const totalUsdValue = baseUsdValue * scoreMultiplier * ascensionMultiplier * minigameRewardMultiplier;

            // Award BTC (40% of total USD value, converted to BTC at current price)
            const btcUsdValue = totalUsdValue * 0.40;
            const btcReward = btcUsdValue / btcPrice;
            btcBalance += btcReward;
            btcLifetime += btcReward;

            // Award ETH (35% of total USD value, converted to ETH at current price)
            const ethUsdValue = totalUsdValue * 0.35;
            const ethReward = ethUsdValue / ethPrice;
            ethBalance += ethReward;
            ethLifetime += ethReward;

            // Award DOGE (20% of total USD value, converted to DOGE at current price)
            const dogeUsdValue = totalUsdValue * 0.20;
            const dogeReward = dogeUsdValue / dogePrice;
            dogeBalance += dogeReward;
            dogeLifetime += dogeReward;

            // Award USD (5% as direct cash)
            const usdReward = totalUsdValue * 0.05;
            addEarnings(usdReward);

            // Track total rewards
            totalReward = totalUsdValue;
            whackGameTotalRewardsEarned += totalUsdValue;
            lifetimeEarnings += totalUsdValue;
            sessionEarnings += totalUsdValue;

            // Store rewards for display in results modal
            whackLastRewards = {
                btc: btcReward,
                eth: ethReward,
                doge: dogeReward,
                usd: usdReward,
                totalUsd: totalUsdValue
            };
        }

        // Set cooldown
        whackCooldowns[whackGameDifficulty] = Date.now() + config.cooldown;

        // Close game modal and show results modal
        const gameModal = document.getElementById('whack-modal');
        const resultsModal = document.getElementById('whack-results-modal');

        if (gameModal) gameModal.style.display = 'none';

        // Populate results modal
        if (resultsModal) {
            // Update title based on win/loss
            const titleEl = document.getElementById('whack-results-title');
            if (titleEl) {
                titleEl.textContent = whackGameLivesRemaining > 0 ? '⚡ VICTORY!' : '⚡ DEFEAT!';
            }

            // Update score display
            const scoreEl = document.getElementById('whack-results-score');
            if (scoreEl) scoreEl.textContent = whackGameBlocksHit;

            // Update blocks hit display
            const blocksEl = document.getElementById('whack-results-blocks');
            if (blocksEl) blocksEl.textContent = whackGameBlocksHit;

            // Update lives display
            const livesEl = document.getElementById('whack-results-lives');
            if (livesEl) livesEl.textContent = whackGameLivesRemaining;

            // Update rewards breakdown
            const rewardsEl = document.getElementById('whack-results-rewards-breakdown');
            if (rewardsEl) {
                if (whackGameLivesRemaining > 0) {
                    rewardsEl.innerHTML = `<div style="color: #f7931a; font-weight: 700; margin-bottom: 8px;">Rewards Earned:</div>
                        <div style="color: #fff; font-size: 0.9rem; line-height: 1.6;">
                            ₿ ${whackLastRewards.btc >= 1 ? whackLastRewards.btc.toFixed(4) : whackLastRewards.btc.toFixed(8)} BTC<br>
                            Ξ ${whackLastRewards.eth >= 1 ? whackLastRewards.eth.toFixed(4) : whackLastRewards.eth.toFixed(8)} ETH<br>
                            Ð ${whackLastRewards.doge.toFixed(2)} DOGE<br>
                            💵 $${abbreviateNumber(whackLastRewards.totalUsd)}
                        </div>
                        <div style="font-size: 0.75rem; color: #aaa; margin-top: 10px; margin-bottom: 5px; font-style: italic;">
                            Paid as: 40% BTC • 35% ETH • 20% DOGE • 5% Cash
                        </div>
                        <div style="font-size: 0.7rem; color: #888; margin-bottom: 0px;">
                            Base Reward: $50 + your mining hash rate value
                        </div>`;
                } else {
                    rewardsEl.innerHTML = `<div style="color: #888;">No rewards earned</div>`;
                }
            }

            // Show the results modal
            resultsModal.style.display = 'flex';
        }

        updateUI();
        saveGame();
    }

    function closeWhackResultsModal() {
        const modal = document.getElementById('whack-results-modal');
        if (modal) modal.style.display = 'none';
        // document.body.classList.remove('minigame-modal-open');

        // Spawn explosion coins when closing results
        if (vfxEnabled && whackGameGamesWon > 0 && typeof spawnExplosionCoins === 'function') {
            // Use last rewards if we just won
            const totalUsdValue = whackLastRewards?.totalUsd || 0;
            const coinCount = Math.max(15, Math.min(50, Math.floor(totalUsdValue / 50)));
            spawnExplosionCoins('btc', coinCount / 4);
            spawnExplosionCoins('eth', coinCount / 4);
            spawnExplosionCoins('doge', coinCount / 4);
            spawnExplosionCoins('usd', coinCount / 4);
        }
    }

    function closeWhackMidGame() {
        // Close mid-game and apply cooldown if game is active
        if (whackGameActive) {
            whackGameActive = false;
            whackGameManuallyClosed = true; // Mark as manually closed
            const config = whackDifficultyConfig[whackGameDifficulty];
            whackCooldowns[whackGameDifficulty] = Date.now() + config.cooldown;
            console.log(`[WHACK] Applied cooldown to ${whackGameDifficulty}: ${config.cooldown}ms`);
            updateWhackCooldownDisplays();
        }

        // Close the game modal
        const modal = document.getElementById('whack-modal');
        if (modal) modal.style.display = 'none';

        // Also close results modal if open (from previous game)
        const resultsModal = document.getElementById('whack-results-modal');
        if (resultsModal) resultsModal.style.display = 'none';
    }

    function closeWhackModal() {
        const modal = document.getElementById('whack-modal');
        if (modal) modal.style.display = 'none';
        document.body.classList.remove('modal-open');

        // Only spawn explosion coins if we actually won (not from manual close)
        // whackGameGamesWon only increments when endWhackGame(true) is called
        if (vfxEnabled && whackGameGamesWon > 0 && typeof spawnExplosionCoins === 'function') {
            // Use last rewards if we just won
            const totalUsdValue = whackLastRewards?.totalUsd || 0;
            const coinCount = Math.max(15, Math.min(50, Math.floor(totalUsdValue / 50)));
            spawnExplosionCoins('btc', coinCount / 4);
            spawnExplosionCoins('eth', coinCount / 4);
            spawnExplosionCoins('doge', coinCount / 4);
            spawnExplosionCoins('usd', coinCount / 4);
        }
    }

    // ============== END WHACK-A-BLOCK MINIGAME FUNCTIONS ==============

    // ============== NETWORK STRESS TEST MINIGAME FUNCTIONS ==============

    // Helper function to get total manual hash upgrades and bonus percentage
    function getManualHashBonus() {
        const btcLevel = btcUpgrades[0]?.level || 0;
        const ethLevel = ethUpgrades[0]?.level || 0;
        const dogeLevel = dogeUpgrades[0]?.level || 0;
        const totalUpgrades = btcLevel + ethLevel + dogeLevel;
        const bonusPercent = (Math.pow(1.1, totalUpgrades) - 1) * 100;
        return {
            totalUpgrades: totalUpgrades,
            bonusPercent: bonusPercent,
            displayText: bonusPercent > 0 ? `+${bonusPercent.toFixed(1)}%` : '0%'
        };
    }

    function initNetworkMinigame() {
        // Check unlock requirement (starts unlocked, but scales with gameplay)
        const hasMinigameUnlock = (typeof metaUpgrades !== 'undefined' && metaUpgrades.minigame_unlock && metaUpgrades.minigame_unlock.purchased);
        if (!hasMinigameUnlock && lifetimeEarnings < 20000) {
            alert(`🔒 Network Stress Test Locked!\n\nRequires $20,000 lifetime earnings to unlock.\n\nCurrent: $${lifetimeEarnings.toFixed(2)}`);
            return;
        }

        networkGameActive = true;
        networkGameStartTime = Date.now();
        networkGameTotalDamage = 0;
        networkGameClickDamageTotal = 0;

        // Calculate difficulty based on games won (successful wins only)
        // Each successful run scales HP by 1.3x: 200 → 260 → 338 → 439 → 571 → 742 → 965
        const difficultyMultiplier = Math.pow(1.3, networkGameGamesWon);
        networkGameMaxHP = Math.floor(200 * difficultyMultiplier); // 200 base, scales by 1.3
        networkGameCurrentHP = networkGameMaxHP;

        // Click damage based on manual hash rate upgrades purchased
        const manualHashBonus = getManualHashBonus();
        networkGameClickDamage = Math.floor(20 * Math.pow(1.1, manualHashBonus.totalUpgrades));

        // Speed boost increases with difficulty
        const speedBoostMultiplier = 0.05 + (0.015 * networkGameGamesPlayed);

        // Show modal
        const modal = document.getElementById('network-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Reset display - hide results, show game
        const gameInfo = document.getElementById('network-game-info');
        const resultsMessage = document.getElementById('network-results-message');
        const closeBtn = document.getElementById('network-close-btn');
        if (gameInfo) gameInfo.style.display = 'block';
        if (resultsMessage) resultsMessage.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'none';

        // Update modal content
        document.getElementById('network-difficulty-display').textContent = `RUN #${networkGameGamesPlayed + 1}`;
        document.getElementById('network-hp-display').textContent = networkGameMaxHP;
        document.getElementById('network-hp-max-display').textContent = networkGameMaxHP;
        document.getElementById('network-time-display').textContent = '10s';
        // Display manual click damage bonus percentage
        const bonus = getManualHashBonus();
        document.getElementById('network-total-damage-display').textContent = bonus.displayText;
        document.getElementById('network-click-damage-display').textContent = `+${networkGameClickDamage} damage/click`;

        // Start game
        networkStartGame(speedBoostMultiplier);
    }

    function networkStartGame(speedBoostMultiplier) {
        // Update timer every 100ms
        networkGameInterval = setInterval(() => {
            const elapsed = Date.now() - networkGameStartTime;
            const remaining = Math.max(0, networkGameTimeLimit - elapsed);
            const seconds = Math.ceil(remaining / 1000);

            const timeDisplay = document.getElementById('network-time-display');
            if (timeDisplay) timeDisplay.textContent = seconds + 's';

            // Calculate passive damage from hash rate
            // Hash rate (crypto per second) × price of crypto = USD value per second = damage per second
            const btcDamagePerSec = btcPerSec * btcPrice;
            const ethDamagePerSec = ethPerSec * ethPrice;
            const dogeDamagePerSec = dogePerSec * dogePrice;
            const totalDamagePerSec = btcDamagePerSec + ethDamagePerSec + dogeDamagePerSec;

            // Frame is 100ms, so divide by 10
            const passiveDamageThisFrame = totalDamagePerSec / 10;

            if (networkGameActive) {
                networkGameCurrentHP -= passiveDamageThisFrame;
                networkGameTotalDamage += passiveDamageThisFrame;

                // Update displays
                const hpDisplay = document.getElementById('network-hp-display');
                if (hpDisplay) hpDisplay.textContent = Math.max(0, Math.floor(networkGameCurrentHP));

                const totalDamageDisplay = document.getElementById('network-total-damage-display');
                if (totalDamageDisplay) {
                    // Show manual click damage bonus percentage
                    const bonus = getManualHashBonus();
                    totalDamageDisplay.textContent = bonus.displayText;
                }

                const passiveDpsDisplay = document.getElementById('network-passive-dps-display');
                if (passiveDpsDisplay) {
                    if (totalDamagePerSec < 0.01) {
                        passiveDpsDisplay.textContent = totalDamagePerSec.toFixed(4);
                    } else if (totalDamagePerSec < 1) {
                        passiveDpsDisplay.textContent = totalDamagePerSec.toFixed(2);
                    } else {
                        passiveDpsDisplay.textContent = Math.floor(totalDamagePerSec);
                    }
                }

                // Update HP bar
                const hpBar = document.getElementById('network-hp-bar');
                if (hpBar) {
                    const hpPercent = Math.max(0, Math.min(100, (networkGameCurrentHP / networkGameMaxHP) * 100));
                    hpBar.style.width = hpPercent + '%';
                }

                // Update rewards preview
                updateNetworkRewardsPreview();

                // Check if network destroyed
                if (networkGameCurrentHP <= 0) {
                    endNetworkGame(true);
                }
            }

            // End game when timer reaches 0 (10 seconds elapsed) or if network is destroyed
            if (remaining <= 0) {
                endNetworkGame(networkGameCurrentHP <= 0);
            }
        }, 100);
    }

    function networkClickAttack() {
        if (!networkGameActive) return;

        networkGameCurrentHP -= networkGameClickDamage;
        networkGameTotalDamage += networkGameClickDamage;
        networkGameClickDamageTotal += networkGameClickDamage;

        // Update displays
        const hpDisplay = document.getElementById('network-hp-display');
        if (hpDisplay) hpDisplay.textContent = Math.max(0, Math.floor(networkGameCurrentHP));

        const totalDamageDisplay = document.getElementById('network-total-damage-display');
        if (totalDamageDisplay) totalDamageDisplay.textContent = Math.floor(networkGameClickDamageTotal);

        // Update HP bar
        const hpBar = document.getElementById('network-hp-bar');
        if (hpBar) {
            const hpPercent = Math.max(0, Math.min(100, (networkGameCurrentHP / networkGameMaxHP) * 100));
            hpBar.style.width = hpPercent + '%';
        }

        // Visual feedback
        const clickBtn = document.getElementById('network-click-btn');
        if (clickBtn) {
            clickBtn.style.transform = 'scale(0.95)';
            setTimeout(() => { clickBtn.style.transform = 'scale(1)'; }, 100);
        }

        // Play click sound
        playClickSound();

        // Check if network destroyed
        if (networkGameCurrentHP <= 0) {
            endNetworkGame(true);
        }
    }

    function updateNetworkRewardsPreview() {
        // Calculate fixed reward for current level (no variation based on damage)
        // Reward is fixed based on games won: 5k → 6.95k → 9.65k → 13.4k → 18.6k → 25.8k → 35.8k
        const fixedReward = 5000 * Math.pow(1.39, networkGameGamesWon);

        // Format helper
        const formatAmount = (amount) => {
            if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 'T';
            if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'B';
            if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'M';
            if (amount >= 1e3) return (amount / 1e3).toFixed(2) + 'K';
            return amount.toFixed(0);
        };

        // Split rewards proportionally
        const btcUsdValue = fixedReward * 0.40;
        const btcReward = btcUsdValue / btcPrice;
        const ethUsdValue = fixedReward * 0.35;
        const ethReward = ethUsdValue / ethPrice;
        const dogeUsdValue = fixedReward * 0.20;
        const dogeReward = dogeUsdValue / dogePrice;
        const usdReward = fixedReward * 0.05;

        // Update displays
        const btcDisplay = document.getElementById('network-reward-btc-preview');
        if (btcDisplay) {
            if (btcReward >= 1) {
                btcDisplay.textContent = btcReward.toFixed(4);
            } else {
                btcDisplay.textContent = btcReward.toFixed(8);
            }
        }

        const ethDisplay = document.getElementById('network-reward-eth-preview');
        if (ethDisplay) {
            if (ethReward >= 1) {
                ethDisplay.textContent = ethReward.toFixed(4);
            } else {
                ethDisplay.textContent = ethReward.toFixed(8);
            }
        }

        const dogeDisplay = document.getElementById('network-reward-doge-preview');
        if (dogeDisplay) {
            if (dogeReward >= 1) {
                dogeDisplay.textContent = dogeReward.toFixed(4);
            } else {
                dogeDisplay.textContent = dogeReward.toFixed(8);
            }
        }

        const usdDisplay = document.getElementById('network-reward-usd-preview');
        if (usdDisplay) {
            usdDisplay.textContent = '$' + formatAmount(usdReward);
        }
    }

    function endNetworkGame(won) {
        networkGameActive = false;

        if (networkGameInterval) clearInterval(networkGameInterval);

        let totalReward = 0;

        if (won) {
            // Set flag to allow explosion coins on close
            networkGameWonThisRound = true;
            // Only increment games played on successful win
            networkGameGamesPlayed++;
            networkGameGamesWon++;

            // Get current rugpull/ascension level
            const rugpullLevel = (typeof ascensionLevel !== 'undefined') ? ascensionLevel : 0;

            // Rewards scale with successful wins by 1.39: 10k → 13.9k → 19.3k → 26.8k → 37.2k → 51.7k → 71.9k
            // Base reward = 10k × (1.39)^(wins)
            const baseReward = 5000 * Math.pow(1.39, networkGameGamesWon);

            // Success rate multiplier based on how much HP was destroyed (0.5x to 2.0x)
            // If destroyed perfectly (all HP), get full bonus
            const damageRatio = Math.min(1.0, networkGameTotalDamage / (networkGameMaxHP * 1.5)); // 1.5x multiplier for extra damage bonus
            const successMultiplier = 0.5 + (damageRatio * 1.5);

            // POWERFUL Rugpull multiplier: 10x per rugpull level
            const ascensionMultiplier = Math.pow(1.15, rugpullLevel);

            // Calculate total USD value after all multipliers
            const totalUsdValue = baseReward * successMultiplier * ascensionMultiplier;

            // Award BTC (40%)
            const btcUsdValue = totalUsdValue * 0.40;
            const btcReward = btcUsdValue / btcPrice;
            btcBalance += btcReward;
            btcLifetime += btcReward;

            // Award ETH (35%)
            const ethUsdValue = totalUsdValue * 0.35;
            const ethReward = ethUsdValue / ethPrice;
            ethBalance += ethReward;
            ethLifetime += ethReward;

            // Award DOGE (20%)
            const dogeUsdValue = totalUsdValue * 0.20;
            const dogeReward = dogeUsdValue / dogePrice;
            dogeBalance += dogeReward;
            dogeLifetime += dogeReward;

            // Award USD (5%)
            const usdReward = totalUsdValue * 0.05;
            addEarnings(usdReward);

            // Track total rewards
            totalReward = totalUsdValue;
            networkGameTotalRewardsEarned += totalUsdValue;
            lifetimeEarnings += totalUsdValue;
            sessionEarnings += totalUsdValue;

            // Store rewards for display
            networkLastRewards = {
                btc: btcReward,
                eth: ethReward,
                doge: dogeReward,
                usd: usdReward,
                totalUsd: totalUsdValue
            };
        }

        // Show results
        const resultsMessage = document.getElementById('network-results-message');
        if (resultsMessage) {
            if (won) {
                // Format crypto amounts
                const formatAmount = (amount) => {
                    if (amount >= 1) return amount.toFixed(4);
                    return amount.toFixed(8);
                };

                resultsMessage.innerHTML = `<span style="color: #00b4ff; font-size: 1.5rem;">✓ NETWORK DESTROYED!</span><br>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px;">
                        <div style="color: #f7931a; font-weight: 700; margin-bottom: 8px;">Formula Breakdown:</div>
                        <div style="color: #fff; font-size: 0.75rem; margin-bottom: 10px; text-align: left; line-height: 1.4;">
                            <div>Damage Dealt: ${Math.floor(networkGameTotalDamage)}</div>
                            <div>Base Reward: (Damage × $10) × Score Multiplier</div>
                            <div>Games Won Bonus: ${networkGameGamesWon} consecutive wins</div>
                            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #666;">Total Multiplier: ${(Math.pow(1.15, ascensionLevel || 0) * (1 + (getSkillBonus ? getSkillBonus('minigame_rewards') : 0) / 100)).toFixed(3)}x</div>
                        </div>
                        <div style="color: #f7931a; font-weight: 700; margin-bottom: 5px;">Rewards Earned:</div>
                        <div style="color: #fff; font-size: 0.9rem;">
                            ₿ ${formatAmount(networkLastRewards.btc)} BTC<br>
                            Ξ ${formatAmount(networkLastRewards.eth)} ETH<br>
                            Ð ${formatAmount(networkLastRewards.doge)} DOGE<br>
                            💵 $${networkLastRewards.usd.toFixed(2)}
                        </div>
                        <div style="font-size: 0.75rem; color: #aaa; margin-top: 10px; margin-bottom: 5px; font-style: italic;">
                            Paid as: 40% BTC • 35% ETH • 20% DOGE • 5% Cash
                        </div>
                        <div style="font-size: 0.7rem; color: #888; margin-bottom: 0px;">
                            Base Reward: $10 per damage dealt
                        </div>
                    </div>`;
            } else {
                resultsMessage.innerHTML = `<span style="color: #ff3344; font-size: 1.5rem;">✗ TIME'S UP!</span><br>
                    <span style="color: #888;">Network HP remaining: ${Math.max(0, Math.floor(networkGameCurrentHP))}<br>You dealt ${Math.floor(networkGameTotalDamage)} damage!</span>`;
            }
        }

        // Hide game info, show results and close button
        const gameInfo = document.getElementById('network-game-info');
        const closeBtn = document.getElementById('network-close-btn');

        if (gameInfo) gameInfo.style.display = 'none';
        if (resultsMessage) resultsMessage.style.display = 'block';
        if (closeBtn) closeBtn.style.display = 'block';

        updateUI();
        saveGame();
    }

    function closeNetworkModal() {
        const modal = document.getElementById('network-modal');
        if (modal) modal.style.display = 'none';
        document.body.classList.remove('modal-open');

        // Spawn explosion coins only if we just won this game (not if we lost and are closing)
        if (vfxEnabled && networkGameWonThisRound && typeof spawnExplosionCoins === 'function') {
            // Use last rewards if we just won
            const totalUsdValue = networkLastRewards?.totalUsd || 0;
            const coinCount = Math.max(20, Math.min(50, Math.floor(totalUsdValue / 50)));
            spawnExplosionCoins('btc', coinCount / 4);
            spawnExplosionCoins('eth', coinCount / 4);
            spawnExplosionCoins('doge', coinCount / 4);
            spawnExplosionCoins('usd', coinCount / 4);
        }
        networkGameWonThisRound = false; // Reset flag after closing
    }

    // ============== END NETWORK STRESS TEST MINIGAME FUNCTIONS ==============

    function updatePowerDisplay() {
        const powerUsedEl = document.getElementById('power-used');
        if (powerUsedEl) {
            const availableWithBonus = getTotalPowerAvailableWithBonus();
            powerUsedEl.innerText = formatPower(totalPowerUsed) + ' / ' + formatPower(availableWithBonus);

            // Dynamic color for power text based on usage
            const percentage = availableWithBonus > 0 ? (totalPowerUsed / availableWithBonus * 100) : 0;
            if (percentage > 100) {
                powerUsedEl.style.color = '#ff3344'; // Red - over capacity
            } else if (percentage > 80) {
                powerUsedEl.style.color = '#ff9500'; // Orange - critical
            } else if (percentage > 60) {
                powerUsedEl.style.color = '#ffdd00'; // Yellow - warning
            } else {
                powerUsedEl.style.color = '#00ff88'; // Green - safe
            }
        }

        const powerBarFill = document.getElementById('power-bar-fill');
        if (powerBarFill) {
            const availableWithBonus = getTotalPowerAvailableWithBonus();
            const percentage = availableWithBonus > 0 ? (totalPowerUsed / availableWithBonus * 100) : 0;
            powerBarFill.style.width = Math.min(percentage, 100) + '%';

            // Dynamic color for power bar based on usage
            if (percentage > 100) {
                powerBarFill.style.background = '#ff3344'; // Red - over capacity
            } else if (percentage > 80) {
                powerBarFill.style.background = '#ff9500'; // Orange - critical
            } else if (percentage > 60) {
                powerBarFill.style.background = '#ffdd00'; // Yellow - warning
            } else {
                powerBarFill.style.background = '#00ff88'; // Green - safe
            }
        }

        // Update power upgrades display
        powerUpgrades.forEach(u => {
            const costUsd = u.currentUsd;

            // Update level tag in equipment name
            const nameEl = document.querySelector(`#pow-${u.id} > div:first-child > div:first-child`);
            if (nameEl) {
                const levelTag = formatLevelTag(u.level);
                // Replace or add the level tag after the equipment name
                nameEl.innerHTML = nameEl.innerHTML.replace(/\s*<span style="color:#888;font-size:0\.85rem">\[.*?\]<\/span>/g, '') + ` <span style="color:#888;font-size:0.85rem">${levelTag}</span>`;
            }

            const currentPowerEl = document.getElementById(`pow-current-${u.id}`);
            if (currentPowerEl) currentPowerEl.innerText = `+${formatPower(u.currentPower)} - Current Power`;

            const powerEl = document.getElementById(`pow-power-${u.id}`);
            if (powerEl) powerEl.innerText = `+${formatPower(u.basePower)} Produced per level`;

            const usdEl = document.getElementById(`pow-usd-${u.id}`);
            if (usdEl) usdEl.innerText = `$${formatNumberForDisplay(u.currentUsd)}`;

            // Calculate how many power upgrades can be afforded (accounting for price increases)
            const affordEl = document.getElementById(`pow-afford-${u.id}`);
            if (affordEl) {
                let remaining = dollarBalance;
                let canAfford = 0;
                let nextCost = costUsd;
                let nextLevel = u.level;

                while (remaining >= nextCost) {
                    remaining -= nextCost;
                    canAfford++;
                    nextLevel++;
                    // Power upgrades: 1.2x multiplier
                    nextCost = u.baseUsd * Math.pow(1.15, nextLevel);
                }

                affordEl.innerText = `x${canAfford}`;
                affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
            }

            const btn = document.getElementById(`pow-${u.id}`);
            if (btn) {
                if (dollarBalance < costUsd) {
                    btn.style.opacity = '0.2';
                    btn.style.cursor = 'not-allowed';
                } else {
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                }
            }
        });
    }

function updateAutoSellButtonUI() {
    const btn = document.getElementById('auto-sell-toggle-btn');
    const statusEl = document.getElementById('auto-sell-status');
    if (!btn || !statusEl) return;

    const metaUpgrades = typeof window.metaUpgrades !== 'undefined' ? window.metaUpgrades : null;
    const upgradeToggleState = typeof window.upgradeToggleState !== 'undefined' ? window.upgradeToggleState : null;

    const isPurchased = metaUpgrades && metaUpgrades.auto_sell && metaUpgrades.auto_sell.purchased;

    if (isPurchased) {
        const isEnabled = upgradeToggleState && upgradeToggleState.auto_sell === true;
        // Enable the button - use CSS classes instead of inline styles
        btn.disabled = false;
        btn.removeAttribute('disabled');
        btn.title = 'Click to toggle automatic crypto to USD conversion';
        // Update text
        statusEl.innerText = isEnabled ? 'ON' : 'OFF';
        const icon = isEnabled ? '🟢' : '⭕';
        btn.innerHTML = icon + ' Auto-Sell: <span id="auto-sell-status">' + (isEnabled ? 'ON' : 'OFF') + '</span>';
    } else {
        // Keep disabled - use CSS classes instead of inline styles
        btn.disabled = true;
        btn.setAttribute('disabled', 'disabled');
        statusEl.innerText = 'LOCKED';
        btn.title = 'Purchase "Auto-Sell Crypto to Cash" upgrade to enable';
        btn.innerHTML = '🔒 Auto-Sell: <span id="auto-sell-status">LOCKED</span>';
    }
}

function toggleAutoSellButton() {
    // Check if upgrade is purchased
    const metaUpgrades = typeof window.metaUpgrades !== 'undefined' ? window.metaUpgrades : null;
    if (!metaUpgrades || !metaUpgrades.auto_sell || !metaUpgrades.auto_sell.purchased) {
        alert('Purchase the "Auto-Sell Crypto to Cash" upgrade first!');
        return;
    }

    // Call the actual toggle function
    if (typeof toggleAutoSell === 'function') {
        toggleAutoSell();
        updateAutoSellButtonUI();
    }
}

function flashCryptoBar(barId) {
    const bar = document.getElementById(barId);
    if (bar) {
        // Remove class if already present
        if (bar.classList.contains('bar-flash')) {
            bar.classList.remove('bar-flash');
            // Use setTimeout to ensure the removal is processed before re-adding
            setTimeout(() => {
                bar.classList.add('bar-flash');
            }, 10);
        } else {
            bar.classList.add('bar-flash');
        }
    }
}

function manualHash() {
    // Pause coin animation during manual hash to reduce lag
    if (typeof pauseCoinRain === 'function') {
        pauseCoinRain();
        // Resume after a short delay
        setTimeout(() => {
            if (typeof resumeCoinRain === 'function') {
                resumeCoinRain();
            }
        }, 50);
    }

    // Apply skill tree click bonus
    const clickBonus = (typeof getClickBonus === 'function') ? getClickBonus() : 1;

    // Apply ascension click multiplier (Cookie Clicker-style: +1% per ascension)
    const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (1 + ascensionLevel * 0.01) : 1;

    let actualClickValue = btcClickValue * clickBonus * ascensionClickMultiplier;

    // Add rugpull click_hashrate bonus (% of current BTC hash rate)
    if (typeof metaUpgrades !== 'undefined') {
        let clickHashRateBonus = 0;
        Object.entries(metaUpgrades).forEach(([key, upgrade]) => {
            if (upgrade.purchased && key.includes('click_hashrate')) {
                const tier = parseInt(key.match(/\d+$/)[0]);
                clickHashRateBonus += 0.5 * Math.pow(1.15, tier - 1);
            }
        });
        if (clickHashRateBonus > 0) {
            actualClickValue += btcPerSec * (clickHashRateBonus / 100);
        }
    }

    // Add +1% of current BTC hash rate if hash_rate_memory upgrade is purchased
    if (typeof metaUpgrades !== 'undefined' && metaUpgrades.hash_rate_memory && metaUpgrades.hash_rate_memory.purchased) {
        actualClickValue += btcPerSec * 0.01;
    }

    // Try auto-sell first (before adding to balance)
    const btcAutoSold = tryAutoSellCrypto('btc', actualClickValue);

    // If not auto-sold, add to balance
    if (!btcAutoSold) {
        btcBalance += actualClickValue;
    }

    // This ensures every manual click also increases your Lifetime Total
    btcLifetime += actualClickValue;

    // Track lifetime and session earnings in USD (including ascension multiplier)
    const usdValue = actualClickValue * btcPrice;
    lifetimeEarnings += usdValue;
    sessionEarnings += usdValue;

    // Track clicks for hashrate
    const now = Date.now();
    manualHashClickTime = now;
    manualHashCooldownEnd = now + 1000;
    clickTimestamps.push(now);
    if (clickTimestamps.length > 60) clickTimestamps.shift();

    // Spawn coins on click
    spawnCoinsForClick('btc', usdValue);

    // Flash the BTC bar
    flashCryptoBar('btc-bar');

    // Play click sound
    playClickSound();

    // This refreshes the screen so you see the numbers go up
    updateUI();
}

function manualEthHash() {
    // Pause coin animation during manual hash to reduce lag
    if (typeof pauseCoinRain === 'function') {
        pauseCoinRain();
        // Resume after a short delay
        setTimeout(() => {
            if (typeof resumeCoinRain === 'function') {
                resumeCoinRain();
            }
        }, 50);
    }

    // Apply skill tree click bonus
    const clickBonus = (typeof getClickBonus === 'function') ? getClickBonus() : 1;
    // Apply ascension click multiplier (Cookie Clicker-style: +1% per ascension)
    const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (1 + ascensionLevel * 0.01) : 1;

    let actualClickValue = ethClickValue * clickBonus * ascensionClickMultiplier;

    // Add rugpull click_hashrate bonus (% of current ETH hash rate)
    if (typeof metaUpgrades !== 'undefined') {
        let clickHashRateBonus = 0;
        Object.entries(metaUpgrades).forEach(([key, upgrade]) => {
            if (upgrade.purchased && key.includes('click_hashrate')) {
                const tier = parseInt(key.match(/\d+$/)[0]);
                clickHashRateBonus += 0.5 * Math.pow(1.15, tier - 1);
            }
        });
        if (clickHashRateBonus > 0) {
            actualClickValue += ethPerSec * (clickHashRateBonus / 100);
        }
    }

    // Add +1% of current ETH hash rate if hash_rate_memory upgrade is purchased
    if (typeof metaUpgrades !== 'undefined' && metaUpgrades.hash_rate_memory && metaUpgrades.hash_rate_memory.purchased) {
        actualClickValue += ethPerSec * 0.01;
    }

    // Try auto-sell first (before adding to balance)
    const ethAutoSold = tryAutoSellCrypto('eth', actualClickValue);

    // If not auto-sold, add to balance
    if (!ethAutoSold) {
        ethBalance += actualClickValue;
    }
    ethLifetime += actualClickValue;

    // Track lifetime and session earnings in USD
    const usdValue = actualClickValue * ethPrice;
    lifetimeEarnings += usdValue;
    sessionEarnings += usdValue;

    // Track clicks for hashrate
    const now = Date.now();
    manualHashClickTime = now;
    manualHashCooldownEnd = now + 1000;
    clickTimestamps.push(now);
    if (clickTimestamps.length > 60) clickTimestamps.shift();

    // Spawn coins on click
    spawnCoinsForClick('eth', usdValue);

    // Flash the ETH bar
    flashCryptoBar('eth-bar');

    // Play click sound
    playClickSound();

    // Refresh the screen
    updateUI();
}

function manualDogeHash() {
    // Pause coin animation during manual hash to reduce lag
    if (typeof pauseCoinRain === 'function') {
        pauseCoinRain();
        // Resume after a short delay
        setTimeout(() => {
            if (typeof resumeCoinRain === 'function') {
                resumeCoinRain();
            }
        }, 50);
    }

    // Apply skill tree click bonus
    const clickBonus = (typeof getClickBonus === 'function') ? getClickBonus() : 1;
    // Apply ascension click multiplier (Cookie Clicker-style: +1% per ascension)
    const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (1 + ascensionLevel * 0.01) : 1;

    let actualClickValue = dogeClickValue * clickBonus * ascensionClickMultiplier;

    // Add rugpull click_hashrate bonus (% of current DOGE hash rate)
    if (typeof metaUpgrades !== 'undefined') {
        let clickHashRateBonus = 0;
        Object.entries(metaUpgrades).forEach(([key, upgrade]) => {
            if (upgrade.purchased && key.includes('click_hashrate')) {
                const tier = parseInt(key.match(/\d+$/)[0]);
                clickHashRateBonus += 0.5 * Math.pow(1.15, tier - 1);
            }
        });
        if (clickHashRateBonus > 0) {
            actualClickValue += dogePerSec * (clickHashRateBonus / 100);
        }
    }

    // Add +1% of current DOGE hash rate if hash_rate_memory upgrade is purchased
    if (typeof metaUpgrades !== 'undefined' && metaUpgrades.hash_rate_memory && metaUpgrades.hash_rate_memory.purchased) {
        actualClickValue += dogePerSec * 0.01;
    }

    // Try auto-sell first (before adding to balance)
    const dogeAutoSold = tryAutoSellCrypto('doge', actualClickValue);

    // If not auto-sold, add to balance
    if (!dogeAutoSold) {
        dogeBalance += actualClickValue;
    }
    dogeLifetime += actualClickValue;

    // Track lifetime and session earnings in USD
    const usdValue = actualClickValue * dogePrice;
    lifetimeEarnings += usdValue;
    sessionEarnings += usdValue;

    // Track clicks for hashrate
    const now = Date.now();
    manualHashClickTime = now;
    manualHashCooldownEnd = now + 1000;
    clickTimestamps.push(now);
    if (clickTimestamps.length > 60) clickTimestamps.shift();

    // Spawn coins on click
    spawnCoinsForClick('doge', usdValue);

    // Flash the DOGE bar
    flashCryptoBar('doge-bar');

    // Play click sound
    playClickSound();

    // Refresh the screen
    updateUI();
}

function spawnCoinsForClick(coinType, usdValue) {
    if (!vfxEnabled) return;

    // Initialize coin rain system if not already done
    if (typeof window.coinRainSystem === 'undefined' || !window.coinRainSystem) {
        if (typeof initializeCoinRain === 'function') {
            initializeCoinRain();
        } else {
            return; // Can't initialize, bail out
        }
    }

    let coinCount;
    if (coinType === 'usd') {
        // For dollar sells: reduced coin count to minimize lag
        if (usdValue < 1) {
            coinCount = 1;
        } else if (usdValue < 10) {
            coinCount = Math.floor(Math.min(3, usdValue));
        } else if (usdValue < 1000) {
            coinCount = 3 + Math.floor((usdValue - 10) / 330); // ~3 coins max
        } else if (usdValue < 10000) {
            coinCount = 4 + Math.floor((usdValue - 1000) / 2250); // ~4 coins max
        } else if (usdValue < 100000) {
            coinCount = 5 + Math.floor((usdValue - 10000) / 22500); // ~5 coins max
        } else if (usdValue < 1000000) {
            coinCount = 6 + Math.floor((usdValue - 100000) / 225000); // ~6 coins max
        } else if (usdValue < 10000000) {
            coinCount = 7 + Math.floor((usdValue - 1000000) / 1285714); // ~8 coins max
        } else if (usdValue < 100000000) {
            coinCount = 8 + Math.floor((usdValue - 10000000) / 10000000); // ~9 coins max
        } else {
            // Cap at 10 coins for mega amounts
            coinCount = 10;
        }
        coinCount = Math.max(1, Math.min(10, coinCount));
    } else {
        // For manual crypto clicks: Always just 1 coin for clean visual feedback
        coinCount = 1;
    }

    // Determine which USD images to spawn (mix for large amounts)
    let usdCoinTypes = ['usd']; // default to regular dollar only
    if (coinType === 'usd') {
        if (usdValue >= 100000) {
            // Use all three: regular dollars, stacks, and mega stacks
            usdCoinTypes = ['usd', 'usd_stack', 'usd_stack_2'];
            // Keep 80% of coins (20% reduction instead of 66%)
            coinCount = Math.ceil(coinCount * 0.8);
        } else if (usdValue >= 10000) {
            // Use dollars and stacks
            usdCoinTypes = ['usd', 'usd_stack'];
            // Keep 90% of coins (10% reduction instead of 50%)
            coinCount = Math.ceil(coinCount * 0.9);
        }
    }

    for (let i = 0; i < coinCount; i++) {
        // Stagger coin spawning with tiny delays (5-30ms between each)
        setTimeout(() => {
            let typeToSpawn = coinType;
            if (coinType === 'usd') {
                // Randomly select from the available USD types
                typeToSpawn = usdCoinTypes[Math.floor(Math.random() * usdCoinTypes.length)];
            }
            window.coinRainSystem.spawnCoin(typeToSpawn, true); // true = consistent size
        }, i * (5 + Math.random() * 25)); // Random delay between 5-30ms per coin
    }
}

function spawnPacketInterceptorRewardCoins() {
    // Initialize coin rain system if not already done
    if (typeof window.coinRainSystem === 'undefined' || !window.coinRainSystem) {
        if (typeof initializeCoinRain === 'function') {
            initializeCoinRain();
        } else {
            return; // Can't initialize, bail out
        }
    }

    // Get the last rewards earned from packet interceptor
    if (typeof packetLastRewards === 'undefined' || !packetLastRewards || packetLastRewards.totalUsd <= 0) {
        return; // No rewards to display
    }

    // Skip if VFX is disabled
    if (typeof vfxEnabled !== 'undefined' && !vfxEnabled) return;

    const rewards = packetLastRewards;
    const totalUsdValue = rewards.totalUsd;

    // Spawn USD coins (reduced for performance)
    let usdCoinCount;
    if (totalUsdValue >= 100000) {
        usdCoinCount = Math.min(6, Math.floor(totalUsdValue / 500000));
    } else if (totalUsdValue >= 10000) {
        usdCoinCount = Math.min(5, Math.floor(totalUsdValue / 50000));
    } else {
        usdCoinCount = Math.min(4, Math.floor(totalUsdValue / 10000) + 2);
    }
    usdCoinCount = Math.max(1, usdCoinCount);

    // Spawn BTC coins (reduced)
    const btcCoinCount = Math.min(5, Math.max(1, Math.floor(rewards.btc * 100)));

    // Spawn ETH coins (reduced)
    const ethCoinCount = Math.min(5, Math.max(1, Math.floor(rewards.eth * 10)));

    // Spawn DOGE coins (reduced)
    const dogeCoinCount = Math.min(5, Math.max(1, Math.floor(rewards.doge / 1000)));

    // Helper function to spawn coins of a type
    const spawnCoinsOfType = (coinType, count) => {
        let usdCoinTypes = null;
        if (coinType === 'usd') {
            if (totalUsdValue >= 100000) {
                usdCoinTypes = ['usd', 'usd_stack', 'usd_stack_2'];
            } else if (totalUsdValue >= 10000) {
                usdCoinTypes = ['usd', 'usd_stack'];
            } else {
                usdCoinTypes = ['usd'];
            }
        }

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                let typeToSpawn = coinType;
                if (coinType === 'usd' && usdCoinTypes) {
                    typeToSpawn = usdCoinTypes[Math.floor(Math.random() * usdCoinTypes.length)];
                }
                window.coinRainSystem.spawnCoin(typeToSpawn, true); // true = consistent size
            }, i * (10 + Math.random() * 30)); // Random delay between 10-40ms per coin
        }
    };

    // Spawn all coin types
    spawnCoinsOfType('usd', usdCoinCount);
    spawnCoinsOfType('btc', btcCoinCount);
    spawnCoinsOfType('eth', ethCoinCount);
    spawnCoinsOfType('doge', dogeCoinCount);
}

function buyLevel(i) {
    const u = upgrades[i];
    const costBtc = u.currentUsd / btcPrice;

    if (btcBalance >= costBtc) {
        // Check power requirements
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + powerReq;
        const availablePower = getTotalPowerAvailableWithBonus();

        if (powerNeeded > availablePower && powerReq > 0) {
            alert(`Insufficient power! This upgrade requires ${powerReq.toLocaleString()}W per level.\nYou need ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power capacity.`);
            return;
        }

        btcBalance -= costBtc;
        hardwareEquity += u.currentUsd;
        u.level++;

        // Check if this is the Manual Hash upgrade
        if (u.id === 0 || u.isClickUpgrade) {
            // Increase click value by 10%
            btcClickValue *= 1.12;

            // FASTER PRICE SCALE: % increase per level
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));

            // Update the main orange button text to show new click value
            document.getElementById('btc-hash-value').innerText = `+${btcClickValue.toFixed(8)} ₿`;
        } else {
            // ALL OTHER MINERS: Use milestone doubling multiplier
            u.currentYield = calculateMinerYield(u);
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));
        }

        const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
        btcPerSec = upgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
        updateUI();
        saveGame();

        // Play upgrade sound
        playUpgradeSound();
    }
}

function buyLevelMultiple(i, quantity) {
    const u = upgrades[i];
    const powerReq = equipmentPowerReqs[u.id] || 0;
    let purchased = 0;

    for (let q = 0; q < quantity; q++) {
        const costUsd = u.currentUsd;

        if (dollarBalance < costUsd) {
            break; // Not enough dollars
        }

        // Check power requirements
        if (powerReq > 0) {
            const powerNeeded = totalPowerUsed + powerReq;
            const availablePower = getTotalPowerAvailableWithBonus();
            if (powerNeeded > availablePower) {
                break; // Not enough power
            }
        }

        dollarBalance -= costUsd;
        hardwareEquity += u.currentUsd;
        u.level++;

        // Update price and yield based on upgrade type
        if (u.id === 0 || u.isClickUpgrade) {
            btcClickValue *= 1.12;
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));
        } else {
            u.currentYield = calculateMinerYield(u);
            u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));
        }

        purchased++;
        calculateTotalPowerUsed();
    }

    if (purchased > 0) {
        if (u.id === 0 || u.isClickUpgrade) {
            document.getElementById('btc-hash-value').innerText = `+${btcClickValue.toFixed(8)} ₿`;
        }
        btcPerSec = upgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0);

        // Track USB Miner purchase for tutorial
        if (u.id === 1 && typeof trackUSBMinerPurchase === 'function') {
            trackUSBMinerPurchase();
        }

        // Force immediate UI update by resetting the throttle timer
        lastUIUpdateTime = 0;
        updateUI();
        saveGame();
        playUpgradeSound();
    }
}

// ========================================
// MILESTONE DOUBLING SYSTEM FUNCTIONS
// ========================================

/**
 * Restore permanent milestone doublings from Rugpull system (persists across resets)
 * This must be called after upgrades are loaded
 */
function restorePermanentMilestoneDoublings() {
    // Helper function to recalculate doubleMultiplier from milestoneDoublings
    function recalculateMultiplier(upgrade) {
        if (upgrade.id === 0 || upgrade.isClickUpgrade) return;

        // Count how many doublings are purchased for this upgrade
        let purchasedCount = 0;
        if (upgrade.milestoneDoublings && typeof upgrade.milestoneDoublings === 'object') {
            purchasedCount = Object.values(upgrade.milestoneDoublings).filter(v => v === true).length;
        }

        // doubleMultiplier = 2^(number of purchased doublings)
        // Start at 1, then multiply by 2 for each purchased doubling
        upgrade.doubleMultiplier = Math.pow(2, purchasedCount);
    }

    // Restore BTC doublings
    upgrades.forEach(u => {
        recalculateMultiplier(u);

        // Apply permanent multiplier from Rugpull system if available
        if (typeof getPermanentDoubleMultiplier === 'function') {
            const btcMultiplier = getPermanentDoubleMultiplier('btc') || 1;
            if (btcMultiplier > 1 && u.id !== 0 && !u.isClickUpgrade) {
                u.doubleMultiplier *= btcMultiplier;
            }
        }
    });

    // Restore ETH doublings
    ethUpgrades.forEach(u => {
        recalculateMultiplier(u);

        if (typeof getPermanentDoubleMultiplier === 'function') {
            const ethMultiplier = getPermanentDoubleMultiplier('eth') || 1;
            if (ethMultiplier > 1 && u.id !== 0 && !u.isClickUpgrade) {
                u.doubleMultiplier *= ethMultiplier;
            }
        }
    });

    // Restore DOGE doublings
    dogeUpgrades.forEach(u => {
        recalculateMultiplier(u);

        if (typeof getPermanentDoubleMultiplier === 'function') {
            const dogeMultiplier = getPermanentDoubleMultiplier('doge') || 1;
            if (dogeMultiplier > 1 && u.id !== 0 && !u.isClickUpgrade) {
                u.doubleMultiplier *= dogeMultiplier;
            }
        }
    });
}

/**
 * Calculate miner yield including milestone doubling multiplier
 */
function calculateMinerYield(u) {
    if (u.id === 0 || u.isClickUpgrade) {
        return 0;  // Click upgrades don't use this formula
    }
    const baseYield = u.baseYield * u.level;
    let multiplier = u.doubleMultiplier;

    // Apply global multiplier based on crypto type
    if (btcUpgrades.includes(u)) {
        multiplier *= Math.pow(2, btcMultiplierLevel);
    } else if (ethUpgrades.includes(u)) {
        multiplier *= Math.pow(2, ethMultiplierLevel);
    } else if (dogeUpgrades.includes(u)) {
        multiplier *= Math.pow(2, dogeMultiplierLevel);
    }

    return baseYield * multiplier;
}

/**
 * Purchase global 2x multiplier for BTC (applies to ALL BTC miners)
 */
function purchaseGlobalBTCMultiplier() {
    const cost = getNextMultiplierCost(btcMultiplierLevel);

    if (dollarBalance < cost) {
        return;
    }

    dollarBalance -= cost;
    hardwareEquity += cost;
    btcMultiplierLevel++;

    // Recalculate yields for all BTC miners
    const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
    upgrades.forEach(u => {
        if (!u.isClickUpgrade) {
            u.currentYield = calculateMinerYield(u);
        }
    });
    btcPerSec = upgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);

    // Force UI update by resetting throttle timer
    lastUIUpdateTime = 0;
    initBtcShop();  // Reinitialize shop to show updated yields
    updateUI();
    saveGame();
    playUpgradeSound();
}

/**
 * Purchase global 2x multiplier for ETH (applies to ALL ETH miners)
 */
function purchaseGlobalETHMultiplier() {
    const cost = getNextMultiplierCost(ethMultiplierLevel);

    if (dollarBalance < cost) {
        console.log(`[DEBUG] Cannot afford ETH multiplier. Cost: $${cost}, Balance: $${dollarBalance}`);
        return;
    }

    dollarBalance -= cost;
    hardwareEquity += cost;
    ethMultiplierLevel++;

    console.log(`[DEBUG] Purchased ETH multiplier ${ethMultiplierLevel}! Next cost: $${getNextMultiplierCost(ethMultiplierLevel)}`);

    // Recalculate yields for all ETH miners
    const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
    ethUpgrades.forEach(u => {
        if (!u.isClickUpgrade) {
            u.currentYield = calculateMinerYield(u);
        }
    });
    ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
    window.ethPerSec = ethPerSec;

    // Force UI update by resetting throttle timer
    lastUIUpdateTime = 0;
    initEthShop();  // Reinitialize shop to show updated yields
    updateUI();
    saveGame();
    playUpgradeSound();
}

/**
 * Purchase global 2x multiplier for DOGE (applies to ALL DOGE miners)
 */
function purchaseGlobalDogeMultiplier() {
    const cost = getNextMultiplierCost(dogeMultiplierLevel);

    if (dollarBalance < cost) {
        console.log(`[DEBUG] Cannot afford DOGE multiplier. Cost: $${cost}, Balance: $${dollarBalance}`);
        return;
    }

    dollarBalance -= cost;
    hardwareEquity += cost;
    dogeMultiplierLevel++;

    console.log(`[DEBUG] Purchased DOGE multiplier ${dogeMultiplierLevel}! Next cost: $${getNextMultiplierCost(dogeMultiplierLevel)}`);

    // Recalculate yields for all DOGE miners
    const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
    dogeUpgrades.forEach(u => {
        if (!u.isClickUpgrade) {
            u.currentYield = calculateMinerYield(u);
        }
    });
    dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
    window.dogePerSec = dogePerSec;

    // Force UI update by resetting throttle timer
    lastUIUpdateTime = 0;
    initDogeShop();  // Reinitialize shop to show updated yields
    updateUI();
    saveGame();
    playUpgradeSound();
}

/**
 * Purchase manual hash rate upgrade for BTC (+10% per level)
 */
function purchaseBTCManualHashRate() {
    const cost = getManualHashRateCost(btcManualHashRateLevel);

    if (dollarBalance < cost) {
        return;
    }

    dollarBalance -= cost;
    hardwareEquity += cost;
    btcManualHashRateLevel++;

    // Update manual hash rate for BTC
    const btcUpgrade = upgrades.find(u => u.name === "Manual Hash Rate");
    if (btcUpgrade) {
        btcUpgrade.clickIncrease *= 1.1;  // Apply 10% boost
        btcClickValue = btcUpgrade.clickIncrease;
        // Update button display
        const btcHashSpan = document.getElementById('btc-hash-value');
        if (btcHashSpan) {
            btcHashSpan.innerText = `+${btcClickValue.toFixed(8)} ₿`;
        }
    }

    // Only update the BTC manual hash rate button, not all buttons
    const btcMHRBtn = document.getElementById('btc-manual-hash-rate-btn');
    if (btcMHRBtn) {
        const btcMHRCost = getManualHashRateCost(btcManualHashRateLevel);
        const btcMHRCanAfford = dollarBalance >= btcMHRCost;
        const btcMHRMultiplier = Math.pow(1.1, btcManualHashRateLevel);

        document.getElementById('btc-mhr-cost').innerHTML = `$${formatNumberForDisplay(btcMHRCost)}`;
        document.getElementById('btc-mhr-multi').innerHTML = `${btcMHRMultiplier.toFixed(1)}x`;

        if (!btcMHRCanAfford) {
            btcMHRBtn.style.opacity = '0.45';
            btcMHRBtn.style.cursor = 'not-allowed';
            btcMHRBtn.disabled = true;
        } else {
            btcMHRBtn.style.opacity = '1';
            btcMHRBtn.style.cursor = 'pointer';
            btcMHRBtn.disabled = false;
        }
    }

    saveGame();
    playUpgradeSound();
}

/**
 * Purchase manual hash rate upgrade for ETH (+10% per level)
 */
function purchaseETHManualHashRate() {
    const cost = getManualHashRateCost(ethManualHashRateLevel);

    if (dollarBalance < cost) {
        return;
    }

    dollarBalance -= cost;
    hardwareEquity += cost;
    ethManualHashRateLevel++;

    // Update manual hash rate for ETH
    const ethUpgrade = ethUpgrades.find(u => u.name === "Manual Hash Rate");
    if (ethUpgrade) {
        ethUpgrade.clickIncrease *= 1.1;  // Apply 10% boost
        ethClickValue = ethUpgrade.clickIncrease;
        // Update button display
        const ethHashSpan = document.getElementById('eth-hash-value');
        if (ethHashSpan) {
            ethHashSpan.innerText = `+${ethClickValue.toFixed(8)} Ξ`;
        }
    }

    // Only update the ETH manual hash rate button, not all buttons
    const ethMHRBtn = document.getElementById('eth-manual-hash-rate-btn');
    if (ethMHRBtn) {
        const ethMHRCost = getManualHashRateCost(ethManualHashRateLevel);
        const ethMHRCanAfford = dollarBalance >= ethMHRCost;
        const ethMHRMultiplier = Math.pow(1.1, ethManualHashRateLevel);

        document.getElementById('eth-mhr-cost').innerHTML = `$${formatNumberForDisplay(ethMHRCost)}`;
        document.getElementById('eth-mhr-multi').innerHTML = `${ethMHRMultiplier.toFixed(1)}x`;

        if (!ethMHRCanAfford) {
            ethMHRBtn.style.opacity = '0.45';
            ethMHRBtn.style.cursor = 'not-allowed';
            ethMHRBtn.disabled = true;
        } else {
            ethMHRBtn.style.opacity = '1';
            ethMHRBtn.style.cursor = 'pointer';
            ethMHRBtn.disabled = false;
        }
    }

    saveGame();
    playUpgradeSound();
}

/**
 * Purchase manual hash rate upgrade for DOGE (+10% per level)
 */
function purchaseDOGEManualHashRate() {
    const cost = getManualHashRateCost(dogeManualHashRateLevel);

    if (dollarBalance < cost) {
        return;
    }

    dollarBalance -= cost;
    hardwareEquity += cost;
    dogeManualHashRateLevel++;

    // Update manual hash rate for DOGE
    const dogeUpgrade = dogeUpgrades.find(u => u.name === "Manual Hash Rate");
    if (dogeUpgrade) {
        dogeUpgrade.clickIncrease *= 1.1;  // Apply 10% boost
        dogeClickValue = dogeUpgrade.clickIncrease;
        // Update button display
        const dogeHashSpan = document.getElementById('doge-hash-value');
        if (dogeHashSpan) {
            dogeHashSpan.innerText = `+${dogeClickValue.toFixed(8)} Ð`;
        }
    }

    // Only update the DOGE manual hash rate button, not all buttons
    const dogeMHRBtn = document.getElementById('doge-manual-hash-rate-btn');
    if (dogeMHRBtn) {
        const dogeMHRCost = getManualHashRateCost(dogeManualHashRateLevel);
        const dogeMHRCanAfford = dollarBalance >= dogeMHRCost;
        const dogeMHRMultiplier = Math.pow(1.1, dogeManualHashRateLevel);

        document.getElementById('doge-mhr-cost').innerHTML = `$${formatNumberForDisplay(dogeMHRCost)}`;
        document.getElementById('doge-mhr-multi').innerHTML = `${dogeMHRMultiplier.toFixed(1)}x`;

        if (!dogeMHRCanAfford) {
            dogeMHRBtn.style.opacity = '0.45';
            dogeMHRBtn.style.cursor = 'not-allowed';
            dogeMHRBtn.disabled = true;
        } else {
            dogeMHRBtn.style.opacity = '1';
            dogeMHRBtn.style.cursor = 'pointer';
            dogeMHRBtn.disabled = false;
        }
    }

    saveGame();
    playUpgradeSound();
}

/**
 * Update the display of global multiplier buttons (called from updateUI)
 */
function updateGlobalMultiplierButtons() {
    // Update BTC multiplier button
    const btcBtn = document.getElementById('btc-global-multiplier-btn');
    if (btcBtn) {
        const btcNextCost = getNextMultiplierCost(btcMultiplierLevel);
        const btcCanAfford = dollarBalance >= btcNextCost;
        const btcMultiplier = Math.pow(2, btcMultiplierLevel);

        document.getElementById('btc-multiplier-cost').innerHTML = `Cost: $${formatNumberForDisplay(btcNextCost)}`;
        document.getElementById('btc-multiplier-level').innerHTML = `Multiplier: ${btcMultiplier}x`;

        // Darken button if can't afford
        if (!btcCanAfford) {
            btcBtn.style.opacity = '0.45';
            btcBtn.style.cursor = 'not-allowed';
        } else {
            btcBtn.style.opacity = '1';
            btcBtn.style.cursor = 'pointer';
        }
    }

    // Update ETH multiplier button
    const ethBtn = document.getElementById('eth-global-multiplier-btn');
    if (ethBtn) {
        const ethNextCost = getNextMultiplierCost(ethMultiplierLevel);
        const ethCanAfford = dollarBalance >= ethNextCost;
        const ethMultiplier = Math.pow(2, ethMultiplierLevel);

        document.getElementById('eth-multiplier-cost').innerHTML = `Cost: $${formatNumberForDisplay(ethNextCost)}`;
        document.getElementById('eth-multiplier-level').innerHTML = `Multiplier: ${ethMultiplier}x`;

        // Darken button if can't afford
        if (!ethCanAfford) {
            ethBtn.style.opacity = '0.45';
            ethBtn.style.cursor = 'not-allowed';
        } else {
            ethBtn.style.opacity = '1';
            ethBtn.style.cursor = 'pointer';
        }
    }

    // Update DOGE multiplier button
    const dogeBtn = document.getElementById('doge-global-multiplier-btn');
    if (dogeBtn) {
        const dogeNextCost = getNextMultiplierCost(dogeMultiplierLevel);
        const dogeCanAfford = dollarBalance >= dogeNextCost;
        const dogeMultiplier = Math.pow(2, dogeMultiplierLevel);

        document.getElementById('doge-multiplier-cost').innerHTML = `Cost: $${formatNumberForDisplay(dogeNextCost)}`;
        document.getElementById('doge-multiplier-level').innerHTML = `Multiplier: ${dogeMultiplier}x`;

        // Darken button if can't afford
        if (!dogeCanAfford) {
            dogeBtn.style.opacity = '0.45';
            dogeBtn.style.cursor = 'not-allowed';
        } else {
            dogeBtn.style.opacity = '1';
            dogeBtn.style.cursor = 'pointer';
        }
    }
}

/**
 * Update the display of manual hash rate upgrade buttons
 */
function updateManualHashRateButtons() {
    // Update BTC manual hash rate button
    const btcMHRBtn = document.getElementById('btc-manual-hash-rate-btn');
    if (btcMHRBtn) {
        const btcMHRCost = getManualHashRateCost(btcManualHashRateLevel);
        const btcMHRCanAfford = dollarBalance >= btcMHRCost;
        const btcMHRMultiplier = Math.pow(1.1, btcManualHashRateLevel);

        document.getElementById('btc-mhr-cost').innerHTML = `$${formatNumberForDisplay(btcMHRCost)}`;
        document.getElementById('btc-mhr-multi').innerHTML = `${btcMHRMultiplier.toFixed(1)}x`;

        if (!btcMHRCanAfford) {
            btcMHRBtn.style.opacity = '0.45';
            btcMHRBtn.style.cursor = 'not-allowed';
            btcMHRBtn.disabled = true;
        } else {
            btcMHRBtn.style.opacity = '1';
            btcMHRBtn.style.cursor = 'pointer';
            btcMHRBtn.disabled = false;
        }
    }

    // Update ETH manual hash rate button
    const ethMHRBtn = document.getElementById('eth-manual-hash-rate-btn');
    if (ethMHRBtn) {
        const ethMHRCost = getManualHashRateCost(ethManualHashRateLevel);
        const ethMHRCanAfford = dollarBalance >= ethMHRCost;
        const ethMHRMultiplier = Math.pow(1.1, ethManualHashRateLevel);

        document.getElementById('eth-mhr-cost').innerHTML = `$${formatNumberForDisplay(ethMHRCost)}`;
        document.getElementById('eth-mhr-multi').innerHTML = `${ethMHRMultiplier.toFixed(1)}x`;

        if (!ethMHRCanAfford) {
            ethMHRBtn.style.opacity = '0.45';
            ethMHRBtn.style.cursor = 'not-allowed';
            ethMHRBtn.disabled = true;
        } else {
            ethMHRBtn.style.opacity = '1';
            ethMHRBtn.style.cursor = 'pointer';
            ethMHRBtn.disabled = false;
        }
    }

    // Update DOGE manual hash rate button
    const dogeMHRBtn = document.getElementById('doge-manual-hash-rate-btn');
    if (dogeMHRBtn) {
        const dogeMHRCost = getManualHashRateCost(dogeManualHashRateLevel);
        const dogeMHRCanAfford = dollarBalance >= dogeMHRCost;
        const dogeMHRMultiplier = Math.pow(1.1, dogeManualHashRateLevel);

        document.getElementById('doge-mhr-cost').innerHTML = `$${formatNumberForDisplay(dogeMHRCost)}`;
        document.getElementById('doge-mhr-multi').innerHTML = `${dogeMHRMultiplier.toFixed(1)}x`;

        if (!dogeMHRCanAfford) {
            dogeMHRBtn.style.opacity = '0.45';
            dogeMHRBtn.style.cursor = 'not-allowed';
            dogeMHRBtn.disabled = true;
        } else {
            dogeMHRBtn.style.opacity = '1';
            dogeMHRBtn.style.cursor = 'pointer';
            dogeMHRBtn.disabled = false;
        }
    }
}

// REMOVED: purchaseMilestoneDoubling() - Replaced by global multiplier system

// REMOVED: purchaseMilestoneDoublingEth() - Replaced by global multiplier system

// REMOVED: purchaseMilestoneDoublingDoge() - Replaced by global multiplier system

// OLD BOOST FUNCTIONS REMOVED - Replaced by milestone doubling system
// buyBoost(), buyEthBoost(), buyDogeBoost() are no longer used
// Use purchaseMilestoneDoubling(), purchaseMilestoneDoublingEth(), purchaseMilestoneDoublingDoge() instead

    // Ethereum buy functions
    function buyEthLevel(i, quantity) {
        const u = ethUpgrades[i];
        const powerReq = equipmentPowerReqs[u.id] || 0;
        let purchased = 0;

        for (let q = 0; q < quantity; q++) {
            const costUsd = u.currentUsd;

            if (dollarBalance < costUsd) {
                break; // Not enough dollars
            }

            // Check power requirements
            if (powerReq > 0) {
                const powerNeeded = totalPowerUsed + powerReq;
                const availablePower = getTotalPowerAvailableWithBonus();
                if (powerNeeded > availablePower) {
                    break; // Not enough power
                }
            }

            dollarBalance -= costUsd;
            hardwareEquity += u.currentUsd;
            u.level++;

            // Update price and yield based on upgrade type
            if (u.id === 0 || u.isClickUpgrade) {
                ethClickValue *= 1.12;
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));
                // Update the ETH button text to show new click value
                document.getElementById('eth-hash-value').innerText = `+${ethClickValue.toFixed(8)} Ξ`;
            } else {
                u.currentYield = calculateMinerYield(u);
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));
            }

            purchased++;
            calculateTotalPowerUsed();
        }

        if (purchased > 0) {
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            ethPerSec = ethUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
            window.ethPerSec = ethPerSec; // Make globally accessible for minigames

            // Track GPU Rig purchase for tutorial
            if (u.id === 1 && typeof trackGPURigPurchase === 'function') {
                trackGPURigPurchase();
            }

            // Force immediate UI update by resetting the throttle timer
            lastUIUpdateTime = 0;
            updateUI();
            saveGame();
            playUpgradeSound();
        }
    }

    // Dogecoin buy functions
    function buyDogeLevel(i, quantity) {
        const u = dogeUpgrades[i];
        const powerReq = equipmentPowerReqs[u.id] || 0;
        let purchased = 0;

        for (let q = 0; q < quantity; q++) {
            const costUsd = u.currentUsd;

            if (dollarBalance < costUsd) {
                break; // Not enough dollars
            }

            // Check power requirements
            if (powerReq > 0) {
                const powerNeeded = totalPowerUsed + powerReq;
                const availablePower = getTotalPowerAvailableWithBonus();
                if (powerNeeded > availablePower) {
                    break; // Not enough power
                }
            }

            dollarBalance -= costUsd;
            hardwareEquity += u.currentUsd;
            u.level++;

            // Update price and yield based on upgrade type
            if (u.id === 0 || u.isClickUpgrade) {
                dogeClickValue *= 1.12;
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));
                // Update the DOGE button text to show new click value
                document.getElementById('doge-hash-value').innerText = `+${dogeClickValue.toFixed(8)} Ð`;
            } else {
                u.currentYield = calculateMinerYield(u);
                u.currentUsd = Math.floor(u.baseUsd * Math.pow(1.15, u.level));
            }

            purchased++;
            calculateTotalPowerUsed();
        }

        if (purchased > 0) {
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            dogePerSec = dogeUpgrades.reduce((sum, item) => sum + (item.currentYield || 0), 0) * (1 + ascensionBonus);
            window.dogePerSec = dogePerSec; // Make globally accessible for minigames
            // Force immediate UI update by resetting the throttle timer
            lastUIUpdateTime = 0;
            updateUI();
            saveGame();
            playUpgradeSound();

            // Track Scrypt Miner purchase for tutorial
            if (u.id === 1 && typeof trackScryptMinerPurchase === 'function') {
                trackScryptMinerPurchase();
            }
        }
    }

    // Update the date/time tracker on the chart based on cursor position
    // Track the current hovered marker for tooltip display
    let hoveredMarkerIndex = -1;

    function updateChartDateTracker(mouseEvent) {
        const tooltip = document.getElementById('chart-marker-tooltip');
        const trackerElement = document.getElementById('chart-date-tracker');

        hoveredMarkerIndex = -1;

        // Hide tooltip by default
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        if (trackerElement) {
            trackerElement.textContent = '--';
        }

        // If mouse event, check if hovering over a marker
        if (mouseEvent && nwChart && chartMarkers.length > 0) {
            const canvas = document.getElementById('nwChart');
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = mouseEvent.clientX - rect.left;
            const mouseY = mouseEvent.clientY - rect.top;

            // Chart.js provides canvasX and canvasY directly
            const canvasPosition = Chart.helpers.getRelativePosition(mouseEvent, nwChart);
            if (!canvasPosition) return;

            const xScale = nwChart.scales.x;
            const yScale = nwChart.scales.y;

            // Check if mouse is near any marker (within 15px radius)
            for (let i = 0; i < chartMarkers.length; i++) {
                const marker = chartMarkers[i];
                // Get pixel position for the marker index
                const markerX = xScale.getPixelForValue(marker.index);
                const markerY = yScale.getPixelForValue(marker.value);

                const distance = Math.sqrt((mouseX - markerX) ** 2 + (mouseY - markerY) ** 2);

                if (distance <= 15) {
                    hoveredMarkerIndex = i;
                    const date = new Date(marker.time);
                    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
                    const dateStr = date.toLocaleDateString('en-US', options);

                    let valueStr = '$0';
                    if (marker.value >= 1000000000) {
                        valueStr = '$' + (marker.value / 1000000000).toFixed(1) + 'B';
                    } else if (marker.value >= 1000000) {
                        valueStr = '$' + (marker.value / 1000000).toFixed(1) + 'M';
                    } else if (marker.value >= 1000) {
                        valueStr = '$' + (marker.value / 1000).toFixed(1) + 'k';
                    } else if (marker.value > 0) {
                        valueStr = '$' + marker.value.toFixed(2);
                    }

                    // Show and position tooltip
                    if (tooltip) {
                        tooltip.textContent = valueStr;
                        tooltip.style.display = 'block';
                        tooltip.style.left = (markerX - tooltip.offsetWidth / 2) + 'px';
                        tooltip.style.top = (markerY - 40) + 'px';
                    }

                    // Also show in the bottom tracker
                    if (trackerElement) {
                        trackerElement.textContent = dateStr;
                    }
                    break;
                }
            }
        }

        // No need to manually redraw with Chart.js - tooltips are handled automatically
    }

    function updateSessionStats() {
        // Update session time
        const now = Date.now();
        const sessionSeconds = Math.floor((now - sessionStartTime) / 1000);
        const hours = Math.floor(sessionSeconds / 3600);
        const minutes = Math.floor((sessionSeconds % 3600) / 60);
        const seconds = sessionSeconds % 60;

        let timeStr = '';
        if (hours > 0) timeStr += hours + 'h ';
        if (minutes > 0) timeStr += minutes + 'm ';
        timeStr += seconds + 's';

        document.getElementById('session-time').innerText = timeStr;

        // Display session earnings (with comprehensive abbreviations for large numbers)
        const sessionEarningEl = document.getElementById('session-earning');
        if (sessionEarningEl) {
            sessionEarningEl.innerText = formatCurrencyAbbreviated(sessionEarnings, 1);
        }

        // Update lifetime earnings display (with abbreviations for large numbers)
        // Display = persisted total (lifetimeEarningsDisplay) + current run (lifetimeEarnings)
        const lifetimeEarningEl = document.getElementById('lifetime-earning');
        if (lifetimeEarningEl) {
            const totalLifetimeEarnings = (window.rugpullState?.lifetimeEarningsDisplay || 0) + lifetimeEarnings;
            lifetimeEarningEl.innerText = '$' + abbreviateNumber(totalLifetimeEarnings, 3);
        }
    }

    // Universal abbreviation function using master ABBREVIATIONS system
    function abbreviateNumber(num, decimals = 3) {
        // Handle BigNumber objects
        if (num instanceof BigNumber) {
            const value = num.toNumber();
            // If it fits in a regular number, use normal abbreviation
            if (isFinite(value)) {
                return abbreviateNumber(value, decimals);
            }
            // For extremely large BigNumbers, find matching abbreviation by exponent
            for (let i = 0; i < ABBREVIATIONS.length; i++) {
                // Get the exponent of the threshold (e.g., 1e500 has exponent 500)
                const thresholdExp = Math.floor(Math.log10(ABBREVIATIONS[i].threshold));
                if (num.exponent === thresholdExp) {
                    const mantissaAbbr = num.mantissa.toFixed(2).replace(/\.?0+$/, '');
                    return mantissaAbbr + ABBREVIATIONS[i].suffix;
                }
            }
            // Fallback: just display mantissa and exponent
            const mantissaAbbr = num.mantissa.toFixed(2).replace(/\.?0+$/, '');
            return mantissaAbbr + ' × 10^' + num.exponent;
        }

        // Handle string input
        if (typeof num === 'string') {
            if (num === '∞') {
                return '∞';
            }
            num = parseFloat(num);
        }
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }

        const abs = Math.abs(num);

        // Handle infinity and NaN
        if (!isFinite(abs)) {
            return '∞';
        }

        // Check every threshold starting from the highest
        for (let i = 0; i < ABBREVIATIONS.length; i++) {
            if (abs >= ABBREVIATIONS[i].threshold) {
                const divided = num / ABBREVIATIONS[i].threshold;
                const abbreviated = divided.toFixed(decimals);
                // Remove trailing zeros after decimal point
                const cleaned = abbreviated.replace(/\.?0+$/, '');
                const suffix = String(ABBREVIATIONS[i].suffix || '');
                return cleaned + suffix;
            }
        }

        // Numbers below smallest threshold (1000)
        if (abs >= 1) {
            // For numbers >= 1 but < 1000, use regular formatting without decimals if integer
            if (num === Math.floor(num)) {
                return Math.floor(num).toString();
            }
            return num.toFixed(decimals).replace(/\.?0+$/, '');
        }

        // Numbers below 1
        return num.toFixed(decimals);
    }

    // Helper function to abbreviate large numbers (mobile always, desktop at 1B+)
    function formatNumberForDisplay(num) {
        return abbreviateNumber(num, 3);
    }

    // Format crypto yields - keeps 8 decimal places below 1k, then abbreviates
    function formatCryptoYield(num) {
        const abs = Math.abs(num);

        // Below 1k: keep 8 decimal places
        if (abs < 1e3) {
            return num.toFixed(8);
        }

        // 1k and above: abbreviate with 2 decimal places for accuracy
        if (abs >= 1e30) {
            return (num / 1e30).toFixed(2) + 'N';
        } else if (abs >= 1e27) {
            return (num / 1e27).toFixed(2) + 'O';
        } else if (abs >= 1e24) {
            return (num / 1e24).toFixed(2) + 'Sep';
        } else if (abs >= 1e21) {
            return (num / 1e21).toFixed(2) + 'S';
        } else if (abs >= 1e18) {
            return (num / 1e18).toFixed(2) + 'Qa';
        } else if (abs >= 1e15) {
            return (num / 1e15).toFixed(2) + 'Q';
        } else if (abs >= 1e12) {
            return (num / 1e12).toFixed(2) + 'T';
        } else if (abs >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (abs >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (abs >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(8);
    }

    // Format equipment level tags like [0], [1K], [1M], etc.
    function formatLevelTag(level) {
        if (level === 0) return '[0]';
        if (level >= 1e3) return '[' + abbreviateNumber(level, 1) + ']';
        return '[' + level + ']';
    }

    // Format crypto prices - keeps 8 decimal places until 1, then abbreviates
    function formatCryptoPrice(num) {
        const abs = Math.abs(num);

        // Below 1: keep 8 decimal places
        if (abs < 1) {
            return num.toFixed(8);
        }

        // 1 and above: abbreviate
        if (abs >= 1e30) {
            return (num / 1e30).toFixed(1) + 'N';
        } else if (abs >= 1e27) {
            return (num / 1e27).toFixed(1) + 'O';
        } else if (abs >= 1e24) {
            return (num / 1e24).toFixed(1) + 'Sep';
        } else if (abs >= 1e21) {
            return (num / 1e21).toFixed(1) + 'S';
        } else if (abs >= 1e18) {
            return (num / 1e18).toFixed(1) + 'Qa';
        } else if (abs >= 1e15) {
            return (num / 1e15).toFixed(1) + 'Q';
        } else if (abs >= 1e12) {
            return (num / 1e12).toFixed(1) + 'T';
        } else if (abs >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (abs >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (abs >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toFixed(1);
    }

    // Format currency (USD) with abbreviations using master ABBREVIATIONS system
    function formatCurrencyAbbreviated(num, decimals = 1) {
        const abs = Math.abs(num);

        for (let i = 0; i < ABBREVIATIONS.length; i++) {
            if (abs >= ABBREVIATIONS[i].threshold) {
                return '$' + (num / ABBREVIATIONS[i].threshold).toFixed(decimals) + ABBREVIATIONS[i].suffix;
            }
        }

        // Numbers below 1000
        if (abs < 1000) {
            return '$' + num.toFixed(2);
        }
        return '$' + Math.floor(num).toLocaleString();
    }

    // Format crypto amount (BTC, ETH, DOGE) with abbreviations - keeps decimals below 1
    function formatCryptoAmount(amount, decimals = 8) {
        const abs = Math.abs(amount);

        // Below 1: keep full decimals (up to 8 for crypto)
        if (abs < 1) {
            return amount.toFixed(decimals);
        }

        // Use master abbreviations for 1 and above
        for (let i = 0; i < ABBREVIATIONS.length; i++) {
            if (abs >= ABBREVIATIONS[i].threshold) {
                return (amount / ABBREVIATIONS[i].threshold).toFixed(2) + ABBREVIATIONS[i].suffix;
            }
        }

        // Fallback for numbers 1-999
        return amount.toFixed(2);
    }

    // Format watts to power units: W, KW, MW, GW, TW, PW
    function formatPower(watts) {
        // Use unified abbreviation system for all power amounts
        if (watts >= 1e3) {
            return abbreviateNumber(watts, 2) + 'W';
        } else {
            return watts.toFixed(2) + 'W';
        }
    }

    function initBars() {
        // Just verify the bar elements exist
        const btcBar = document.getElementById('btc-bar');
        const ethBar = document.getElementById('eth-bar');
        const dogeBar = document.getElementById('doge-bar');

        if (!btcBar || !ethBar || !dogeBar) {
            console.warn('Crypto bar elements not found');
            return false;
        }

        // Initialize bars to 0%
        updateCryptoBars();
        return true;
    }

    function updateCryptoBars() {
        const btcValue = btcBalance * btcPrice;
        const ethValue = ethBalance * ethPrice;
        const dogeValue = dogeBalance * dogePrice;
        const totalValue = btcValue + ethValue + dogeValue;

        let btcPercent = 0;
        let ethPercent = 0;
        let dogePercent = 0;

        if (totalValue > 0) {
            btcPercent = (btcValue / totalValue) * 100;
            ethPercent = (ethValue / totalValue) * 100;
            dogePercent = (dogeValue / totalValue) * 100;
        }

        // Update bar widths with smooth transition
        const btcBar = document.getElementById('btc-bar');
        const ethBar = document.getElementById('eth-bar');
        const dogeBar = document.getElementById('doge-bar');

        if (btcBar) btcBar.style.width = btcPercent + '%';
        if (ethBar) ethBar.style.width = ethPercent + '%';
        if (dogeBar) dogeBar.style.width = dogePercent + '%';

        // Update percentage text
        document.getElementById('btc-bar-percent').textContent = btcPercent.toFixed(1) + '%';
        document.getElementById('eth-bar-percent').textContent = ethPercent.toFixed(1) + '%';
        document.getElementById('doge-bar-percent').textContent = dogePercent.toFixed(1) + '%';
    }

    function updateHashrateBars() {
        // Calculate USD value per second for each crypto (hashrate * price)
        const btcHashrate = btcPerSec * totalMiningMultiplier;
        const ethHashrate = ethPerSec * totalMiningMultiplier;
        const dogeHashrate = dogePerSec * totalMiningMultiplier;

        const btcUsdPerSec = btcHashrate * btcPrice;
        const ethUsdPerSec = ethHashrate * ethPrice;
        const dogeUsdPerSec = dogeHashrate * dogePrice;

        const totalUsdPerSec = btcUsdPerSec + ethUsdPerSec + dogeUsdPerSec;

        let btcPercent = 0;
        let ethPercent = 0;
        let dogePercent = 0;

        if (totalUsdPerSec > 0) {
            btcPercent = (btcUsdPerSec / totalUsdPerSec) * 100;
            ethPercent = (ethUsdPerSec / totalUsdPerSec) * 100;
            dogePercent = (dogeUsdPerSec / totalUsdPerSec) * 100;
        }

        // Update hashrate bar widths
        const btcHashrateBar = document.getElementById('btc-hashrate-bar');
        const ethHashrateBar = document.getElementById('eth-hashrate-bar');
        const dogeHashrateBar = document.getElementById('doge-hashrate-bar');

        if (btcHashrateBar) btcHashrateBar.style.width = btcPercent + '%';
        if (ethHashrateBar) ethHashrateBar.style.width = ethPercent + '%';
        if (dogeHashrateBar) dogeHashrateBar.style.width = dogePercent + '%';

        // Update USD/sec value display
        const btcHashratePercent = document.getElementById('btc-hashrate-percent');
        const ethHashratePercent = document.getElementById('eth-hashrate-percent');
        const dogeHashratePercent = document.getElementById('doge-hashrate-percent');

        if (btcHashratePercent) btcHashratePercent.textContent = formatCurrencyAbbreviated(btcUsdPerSec) + '/sec';
        if (ethHashratePercent) ethHashratePercent.textContent = formatCurrencyAbbreviated(ethUsdPerSec) + '/sec';
        if (dogeHashratePercent) dogeHashratePercent.textContent = formatCurrencyAbbreviated(dogeUsdPerSec) + '/sec';
    }

    function updateRugpullProgressDisplay() {
        // Get earnings since last rugpull - try multiple ways to access it
        let earningsThisSession = 0;

        if (typeof lifetimeEarningsThisRugpull !== 'undefined') {
            earningsThisSession = lifetimeEarningsThisRugpull;
        } else if (typeof window.lifetimeEarningsThisRugpull !== 'undefined') {
            earningsThisSession = window.lifetimeEarningsThisRugpull;
        }

        // Calculate rugpull requirement (Rugpull 0 = $1M, Rugpull 1 = $8M, etc)
        let ascensionLvl = (typeof ascensionLevel !== 'undefined') ? ascensionLevel : 0;
        const level = ascensionLvl + 1;
        const requirement = 1000000 * Math.pow(level, 3);

        // Format numbers for display
        const formatNum = (num) => {
            if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B';
            if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
            if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
            return '$' + Math.floor(num).toLocaleString();
        };

        const earningsLabel = formatNum(earningsThisSession);
        const requirementLabel = formatNum(requirement);
        const displayText = earningsLabel + ' / ' + requirementLabel;

        // Calculate progress percentage (capped at 100%)
        const progressPercent = Math.min(100, (earningsThisSession / requirement) * 100);

        // Update all rugpull progress display elements
        const displayElements = [
            document.getElementById('rugpull-progress-text'),
            document.getElementById('rugpull-progress-text-mobile'),
            document.getElementById('rugpull-progress-text-desktop')
        ];

        displayElements.forEach(el => {
            if (el) {
                el.textContent = displayText;
            }
        });

        // Update progress bar fills (button background fill)
        const progressBars = [
            document.getElementById('rugpull-progress-fill-mobile'),
            document.getElementById('rugpull-progress-fill-desktop')
        ];

        progressBars.forEach(bar => {
            if (bar) {
                bar.style.width = progressPercent + '%';
            }
        });
    }

    function updateUI() {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUIUpdateTime;

        // Throttle balance display updates to 150ms - skip expensive operations if too soon
        if (timeSinceLastUpdate < 150) {
            return;
        }
        lastUIUpdateTime = now;

        // Update global multiplier buttons (cost and affordability)
        try {
            updateGlobalMultiplierButtons();
            updateManualHashRateButtons();
        } catch (e) {
            console.error('Error updating global multiplier buttons:', e);
        }

        // Update doubling button states every 100ms (don't recreate, just update visibility and clickability)
        const timeSinceLastShopUpdate = now - lastShopReinitTime;
        if (timeSinceLastShopUpdate >= 100) {
            try {
                updateDoublingButtons();
                lastShopReinitTime = now;
            } catch (e) {
                console.error('Error updating doubling buttons:', e);
            }
        }

        // Sync new session earnings to rugpull tracker
        // This ensures all earnings paths (mining, staking, minigames, etc.) are tracked
        const newSessionEarnings = sessionEarnings - lastSyncedSessionEarnings;
        if (newSessionEarnings > 0 && typeof window.rugpullAddEarnings === 'function') {
            window.rugpullAddEarnings(newSessionEarnings);
            lastSyncedSessionEarnings = sessionEarnings;
        }

        // Update rugpull progress display and UI (calls rugpull.js function) - throttle to 10000ms
        if (now - lastAscensionUIUpdateTime >= 10000) {
            lastAscensionUIUpdateTime = now;
            if (typeof window.updateAscensionUI === 'function') {
                window.updateAscensionUI();
            } else {
                updateRugpullProgressDisplay();
            }
        }

        // Check achievements every 1000ms (throttle expensive iteration)
        if (now - lastAchievementCheckTime >= 1000) {
            lastAchievementCheckTime = now;
            if (typeof checkAchievements === 'function') {
                checkAchievements(totalPowerUsed);
            }
        }

        // NOTE: Chart data collection has been moved to the main game loop (line ~7200)

        // Crypto portfolio value = value of all crypto holdings only
        let cryptoPortfolioValue = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);
        const isMobileUI = window.innerWidth <= 768;

        // Abbreviate on mobile always, or on desktop when over $100M
        if ((isMobileUI && cryptoPortfolioValue >= 1000) || (cryptoPortfolioValue > 100000000)) {
            const abbrev = abbreviateNumber(cryptoPortfolioValue, 3);
            document.getElementById('nw-val').innerText = "$" + abbrev;
        } else {
            document.getElementById('nw-val').innerText = "$" + cryptoPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2});
        }

        // Update net worth breakdown (desktop only)
        if (document.getElementById('nw-breakdown')) {
            const btcValue = formatCryptoAmount(btcBalance, 8);
            const ethValue = formatCryptoAmount(ethBalance, 8);
            const dogeValue = formatCryptoAmount(dogeBalance, 8);
            document.getElementById('nw-btc').innerText = btcValue;
            document.getElementById('nw-eth').innerText = ethValue;
            document.getElementById('nw-doge').innerText = dogeValue;

            // Also update visible bar amounts
            const btcAmountEl = document.querySelector('.btc-amount');
            const ethAmountEl = document.querySelector('.eth-amount');
            const dogeAmountEl = document.querySelector('.doge-amount');
            if (btcAmountEl) btcAmountEl.innerText = btcValue;
            if (ethAmountEl) ethAmountEl.innerText = ethValue;
            if (dogeAmountEl) dogeAmountEl.innerText = dogeValue;
        }

        // Format balances with smart abbreviations
        const formatCryptoBalance = (balance, decimals = 8) => {
            // Use unified abbreviation system for large numbers
            if (balance >= 1e3) {
                return abbreviateNumber(balance, 2);
            } else {
                return balance.toFixed(decimals);
            }
        };

        // Update balances (if elements exist)
        if (document.getElementById('bal-btc')) document.getElementById('bal-btc').innerText = formatCryptoBalance(btcBalance);
        if (document.getElementById('bal-eth')) document.getElementById('bal-eth').innerText = formatCryptoBalance(ethBalance);
        if (document.getElementById('bal-doge')) document.getElementById('bal-doge').innerText = formatCryptoBalance(dogeBalance);

        // Update crypto bars with current distribution
        updateCryptoBars();

        // Update hashrate distribution bars
        updateHashrateBars();

        // Update manual hash button text (with ascension multiplier applied)
        const ascensionClickMultiplier = (typeof ascensionLevel !== 'undefined' && ascensionLevel > 0) ? (1 + ascensionLevel * 0.01) : 1;
        const clickSpeedBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('click_speed') : 0;
        const clickMultiplier = 1 + clickSpeedBonus;

        // Calculate click hash rate bonus from rugpull upgrades
        let clickHashRateBonus = 0;
        if (typeof metaUpgrades !== 'undefined') {
            Object.entries(metaUpgrades).forEach(([key, upgrade]) => {
                if (upgrade.purchased && key.includes('click_hashrate')) {
                    const tier = parseInt(key.match(/\d+$/)[0]);
                    clickHashRateBonus += 0.5 * Math.pow(1.15, tier - 1);
                }
            });
        }

        const mineBtnSpan = document.getElementById('btc-hash-value');
        if (mineBtnSpan) {
            const totalBtcClick = btcClickValue * clickMultiplier * ascensionClickMultiplier;
            const hashRateAddition = btcPerSec * (clickHashRateBonus / 100);
            const totalWithHashRate = totalBtcClick + hashRateAddition;
            mineBtnSpan.innerText = `+${totalWithHashRate.toFixed(8)} ₿`;
        }
        const ethMineBtnSpan = document.getElementById('eth-hash-value');
        if (ethMineBtnSpan) {
            const totalEthClick = ethClickValue * clickMultiplier * ascensionClickMultiplier;
            const hashRateAddition = ethPerSec * (clickHashRateBonus / 100);
            const totalWithHashRate = totalEthClick + hashRateAddition;
            ethMineBtnSpan.innerText = `+${totalWithHashRate.toFixed(8)} Ξ`;
        }
        const dogeMineBtnSpan = document.getElementById('doge-hash-value');
        if (dogeMineBtnSpan) {
            const totalDogeClick = dogeClickValue * clickMultiplier * ascensionClickMultiplier;
            const hashRateAddition = dogePerSec * (clickHashRateBonus / 100);
            const totalWithHashRate = totalDogeClick + hashRateAddition;
            dogeMineBtnSpan.innerText = `+${totalWithHashRate.toFixed(8)} Ð`;
        }

        // Update hardware equity with smart abbreviations
        document.getElementById('asset-usd').innerText = formatCurrencyAbbreviated(hardwareEquity, 1);

        // Format hashrate with unified abbreviations
        const formatHashrate = (hashrate) => {
            if (hashrate >= 1e3) {
                return abbreviateNumber(hashrate, 2) + '/s';
            } else {
                return hashrate.toFixed(8) + '/s';
            }
        };

        // Get mining bonuses for display
        const miningBonus = (typeof getSkillBonus === 'function') ? (1 + getSkillBonus('mining_speed')) : 1;
        const hackingBoost = getHackingSpeedBoost();
        const totalMiningMultiplier = miningBonus * hackingBoost;
        window.totalMiningMultiplier = totalMiningMultiplier; // Make globally accessible for minigames
        window.btcPrice = btcPrice; // Make globally accessible for minigames
        window.ethPrice = ethPrice;
        window.dogePrice = dogePrice;
        const isSpeedBoosted = hackingBoost > 1.0;

        // Update coin rain animation with current hash rates (convert to USD values)
        if (vfxEnabled && typeof updateCoinRain === 'function') {
            const btcUsdPerSec = (btcPerSec * totalMiningMultiplier) * btcPrice;
            const ethUsdPerSec = (ethPerSec * totalMiningMultiplier) * ethPrice;
            const dogeUsdPerSec = (dogePerSec * totalMiningMultiplier) * dogePrice;
            updateCoinRain(btcUsdPerSec, ethUsdPerSec, dogeUsdPerSec);
        } else if (!vfxEnabled && typeof updateCoinRain === 'function') {
            // Disable passive spawning when VFX is off
            updateCoinRain(0, 0, 0);
        }

        // Update individual hashrate displays (old location - keep for backwards compatibility)
        const btcEl = document.getElementById('yield-btc');
        const ethEl = document.getElementById('yield-eth');
        const dogeEl = document.getElementById('yield-doge');

        if (btcEl) {
            btcEl.innerText = formatHashrate(btcPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                btcEl.style.color = '#00ff88';
                btcEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                btcEl.style.fontWeight = 'bold';
            } else {
                btcEl.style.color = '';
                btcEl.style.textShadow = '';
                btcEl.style.fontWeight = '';
            }
        }
        if (ethEl) {
            ethEl.innerText = formatHashrate(ethPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                ethEl.style.color = '#00ff88';
                ethEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                ethEl.style.fontWeight = 'bold';
            } else {
                ethEl.style.color = '';
                ethEl.style.textShadow = '';
                ethEl.style.fontWeight = '';
            }
        }
        if (dogeEl) {
            dogeEl.innerText = formatHashrate(dogePerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                dogeEl.style.color = '#00ff88';
                dogeEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                dogeEl.style.fontWeight = 'bold';
            } else {
                dogeEl.style.color = '';
                dogeEl.style.textShadow = '';
                dogeEl.style.fontWeight = '';
            }
        }

        // Update hashrate displays in new location
        const btcDisplayEl = document.getElementById('yield-btc-display');
        const ethDisplayEl = document.getElementById('yield-eth-display');
        const dogeDisplayEl = document.getElementById('yield-doge-display');

        if (btcDisplayEl) {
            btcDisplayEl.innerText = formatHashrate(btcPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                btcDisplayEl.style.color = '#00ff88';
                btcDisplayEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                btcDisplayEl.style.fontWeight = 'bold';
            } else {
                btcDisplayEl.style.color = '';
                btcDisplayEl.style.textShadow = '';
                btcDisplayEl.style.fontWeight = '';
            }
        }
        if (ethDisplayEl) {
            ethDisplayEl.innerText = formatHashrate(ethPerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                ethDisplayEl.style.color = '#00ff88';
                ethDisplayEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                ethDisplayEl.style.fontWeight = 'bold';
            } else {
                ethDisplayEl.style.color = '';
                ethDisplayEl.style.textShadow = '';
                ethDisplayEl.style.fontWeight = '';
            }
        }
        if (dogeDisplayEl) {
            dogeDisplayEl.innerText = formatHashrate(dogePerSec * totalMiningMultiplier);
            if (isSpeedBoosted) {
                dogeDisplayEl.style.color = '#00ff88';
                dogeDisplayEl.style.textShadow = '0 0 10px #00ff88, 0 0 20px #00ff88';
                dogeDisplayEl.style.fontWeight = 'bold';
            } else {
                dogeDisplayEl.style.color = '';
                dogeDisplayEl.style.textShadow = '';
                dogeDisplayEl.style.fontWeight = '';
            }
        }

        // Update prices
        document.getElementById('btc-price').innerText = "$" + formatCryptoPrice(btcPrice);
        document.getElementById('eth-price').innerText = "$" + formatCryptoPrice(ethPrice);
        document.getElementById('doge-price').innerText = "$" + formatCryptoPrice(dogePrice);

        // Update dollar balance display
        // Handle Infinity by converting to BigNumber representation
        let displayBalance = dollarBalance;
        if (typeof dollarBalance === 'number' && !isFinite(dollarBalance) && dollarBalance > 0) {
            // When a number exceeds MAX_VALUE and becomes Infinity,
            // we need to represent it as a very large number
            // Assume it's something like 1e500 for now, show appropriate suffix
            displayBalance = new BigNumber(1, 500); // 1 × 10^500
        } else if (typeof dollarBalance === 'number' && !isFinite(dollarBalance)) {
            displayBalance = '∞';
        }
        const dollarText = "$" + formatNumberForDisplay(displayBalance);
        const dollarBalanceEl = document.getElementById('dollar-balance');
        if (dollarBalanceEl) dollarBalanceEl.innerText = dollarText;
        const dollarBalanceBtcEl = document.getElementById('dollar-balance-btc');
        if (dollarBalanceBtcEl) dollarBalanceBtcEl.innerText = dollarText;
        const dollarBalanceEthEl = document.getElementById('dollar-balance-eth');
        if (dollarBalanceEthEl) dollarBalanceEthEl.innerText = dollarText;
        const dollarBalanceDogeEl = document.getElementById('dollar-balance-doge');
        if (dollarBalanceDogeEl) dollarBalanceDogeEl.innerText = dollarText;
        const dollarBalancePowerEl = document.getElementById('dollar-balance-power');
        if (dollarBalancePowerEl) dollarBalancePowerEl.innerText = dollarText;
        const dollarBalanceExchangeEl = document.getElementById('dollar-balance-exchange');
        if (dollarBalanceExchangeEl) dollarBalanceExchangeEl.innerText = dollarText;

        // Update market prices
        const marketBtcPrice = document.getElementById('market-btc-price');
        const marketEthPrice = document.getElementById('market-eth-price');
        const marketDogePrice = document.getElementById('market-doge-price');
        if (marketBtcPrice) marketBtcPrice.innerText = formatCryptoPrice(btcPrice);
        if (marketEthPrice) marketEthPrice.innerText = formatCryptoPrice(ethPrice);
        if (marketDogePrice) marketDogePrice.innerText = formatCryptoPrice(dogePrice);

        // Update session stats
        updateSessionStats();

        // Update power display
        calculateTotalPowerUsed();
        updatePowerDisplay();

        // Update hacking tab visibility based on lifetime earnings
        const hackingTabBtn = document.getElementById('hacking-tab-btn');
        if (hackingTabBtn) {
            if (lifetimeEarnings < 10000) {
                hackingTabBtn.style.opacity = '0.5';
                hackingTabBtn.style.cursor = 'not-allowed';
                hackingTabBtn.innerHTML = `🔒 HACKING<br><span style="font-size: 0.6rem;">($${(lifetimeEarnings).toFixed(0)}/$10,000)</span>`;
                hackingTabBtn.onclick = function(e) {
                    e.preventDefault();
                    alert(`🔒 Hacking Feature Locked!\n\nRequires $10,000 lifetime earnings to unlock.\n\nCurrent: $${lifetimeEarnings.toFixed(2)}`);
                };
            } else {
                hackingTabBtn.style.opacity = '1';
                hackingTabBtn.style.cursor = 'pointer';
                hackingTabBtn.textContent = 'HACKING';
                hackingTabBtn.onclick = function() { switchTab('hacking'); };
            }
        }

        // Update difficulty button states based on lifetime earnings
        const hasMinigameUnlock = (typeof metaUpgrades !== 'undefined' && metaUpgrades.minigame_unlock && metaUpgrades.minigame_unlock.purchased);

        const easyBtn = document.getElementById('hacking-easy-btn');
        const mediumBtn = document.getElementById('hacking-medium-btn');
        const hardBtn = document.getElementById('hacking-hard-btn');

        if (easyBtn) {
            if (!hasMinigameUnlock && lifetimeEarnings < 10000) {
                easyBtn.style.opacity = '0.5';
                easyBtn.style.cursor = 'not-allowed';
            } else {
                easyBtn.style.opacity = '1';
                easyBtn.style.cursor = 'pointer';
            }
        }

        if (mediumBtn) {
            if (!hasMinigameUnlock && lifetimeEarnings < 50000) {
                mediumBtn.style.opacity = '0.5';
                mediumBtn.style.cursor = 'not-allowed';
                const currentAbbrev = lifetimeEarnings >= 1000 ? '$' + (lifetimeEarnings / 1000).toFixed(1) + 'K' : '$' + lifetimeEarnings.toFixed(0);
                mediumBtn.innerHTML = `<div style="margin-bottom: 5px;">🔒 MEDIUM</div>
                    <div style="font-size: 0.65rem; font-weight: 400;">${currentAbbrev}/$50K</div>`;
            } else {
                mediumBtn.style.opacity = '1';
                mediumBtn.style.cursor = 'pointer';
                mediumBtn.innerHTML = `<div style="margin-bottom: 5px;">MEDIUM</div>
                    <div style="font-size: 0.7rem; font-weight: 400;">4 bugs | 20s | 8 lives</div>
                    <div style="font-size: 0.65rem; margin-top: 5px;">+25% speed for 2min</div>`;
            }
        }

        if (hardBtn) {
            if (!hasMinigameUnlock && lifetimeEarnings < 100000) {
                hardBtn.style.opacity = '0.5';
                hardBtn.style.cursor = 'not-allowed';
                const currentAbbrev = lifetimeEarnings >= 1000 ? '$' + (lifetimeEarnings / 1000).toFixed(1) + 'K' : '$' + lifetimeEarnings.toFixed(0);
                hardBtn.innerHTML = `<div style="margin-bottom: 5px;">🔒 HARD</div>
                    <div style="font-size: 0.65rem; font-weight: 400;">${currentAbbrev}/$100K</div>`;
            } else {
                hardBtn.style.opacity = '1';
                hardBtn.style.cursor = 'pointer';
                hardBtn.innerHTML = `<div style="margin-bottom: 5px;">HARD</div>
                    <div style="font-size: 0.7rem; font-weight: 400;">5 bugs | 12s | 10 lives</div>
                    <div style="font-size: 0.65rem; margin-top: 5px;">+50% speed for 2min</div>`;
            }
        }

        btcUpgrades.forEach(u => {
    const costUsd = u.currentUsd;

    // Update level tag in equipment name
    const nameEl = document.querySelector(`#up-${u.id} > div:first-child > div:first-child`);
    if (nameEl) {
        const levelTag = formatLevelTag(u.level);
        // Replace or add the level tag after the equipment name
        nameEl.innerHTML = nameEl.innerHTML.replace(/\s*<span style="color:#888;font-size:0\.85rem">\[.*?\]<\/span>/g, '') + ` <span style="color:#888;font-size:0.85rem">${levelTag}</span>`;
    }

    const yEl = document.getElementById(`yield-${u.id}`);

    if (yEl) {
        if (u.isClickUpgrade) {
            yEl.innerText = `+10% MANUAL HASH RATE`;
        } else {
            // Show the current speed WITH skill bonuses AND ascension bonus AND doubling multiplier AND global multiplier applied
            const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseSpeed = u.baseYield * u.level;
            const globalMultiplier = Math.pow(2, btcMultiplierLevel);  // Apply global multiplier
            const currentSpeed = baseSpeed * (1 + miningBonus + btcBonus + ascensionBonus) * u.doubleMultiplier * globalMultiplier;
            yEl.innerText = `+${formatCryptoYield(currentSpeed)} ₿/s - Current Speed`;
        }
    }

    // Update per-level increase
    const increaseEl = document.getElementById(`increase-${u.id}`);
    if (increaseEl) {
        if (u.isClickUpgrade) {
            increaseEl.style.display = 'none';
        } else {
            const btcBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('btc_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseIncrease = u.baseYield;
            const globalMultiplier = Math.pow(2, btcMultiplierLevel);  // Apply global multiplier
            const perLevelIncrease = baseIncrease * (1 + miningBonus + btcBonus + ascensionBonus) * u.doubleMultiplier * globalMultiplier;
            increaseEl.innerText = `+${formatCryptoYield(perLevelIncrease)} ₿/s per level`;
            increaseEl.style.display = 'block';
        }
    }

    const uEl = document.getElementById(`usd-${u.id}`);
    if(uEl) {
        // Calculate total cost for the selected quantity
        let displayCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                displayCost += u.baseUsd * Math.pow(1.15, tempLevel);
            } else {
                displayCost += u.baseUsd * Math.pow(1.15, tempLevel);
            }
            tempLevel++;
        }
        uEl.innerText = `$${formatNumberForDisplay(Math.floor(displayCost))}`;
    }

    // Update power display with effective consumption after skills
    const powerEl = document.getElementById(`power-${u.id}`);
    if(powerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            powerEl.innerText = `${formatPower(effectivePower)} Consumed per level`;
        }
    }

    // Calculate how many upgrades can be afforded (accounting for price increases)
    const affordEl = document.getElementById(`afford-${u.id}`);
    if(affordEl) {
        let remaining = dollarBalance;
        let canAfford = 0;
        let nextCost = costUsd;
        let nextLevel = u.level;

        while (remaining >= nextCost) {
            remaining -= nextCost;
            canAfford++;
            nextLevel++;

            // Calculate next cost based on upgrade type
            if (u.isClickUpgrade) {
                // Manual hash: 1.12x multiplier
                nextCost = u.baseUsd * Math.pow(1.15, nextLevel);
            } else {
                // Other miners: 1.12x multiplier
                nextCost = u.baseUsd * Math.pow(1.15, nextLevel);
            }
        }

        affordEl.innerText = `x${canAfford}`;
        affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
    }

    const bEl = document.getElementById(`up-${u.id}`);
    if(bEl) {
        // Check both dollar balance and power requirements for the selected quantity
        // Calculate total cost for buyQuantity items
        let totalCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                totalCost += u.baseUsd * Math.pow(1.15, tempLevel);
            } else {
                totalCost += u.baseUsd * Math.pow(1.15, tempLevel);
            }
            tempLevel++;
        }

        const hasEnoughDollars = dollarBalance >= totalCost;
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
        const availablePower = getTotalPowerAvailableWithBonus();
        const hasEnoughPower = powerNeeded <= availablePower || powerReq === 0;
        const shouldDisable = !(hasEnoughDollars && hasEnoughPower);
        // Don't set disabled attribute - it prevents click events. Use CSS opacity/cursor instead
        // bEl.disabled = shouldDisable;
        if (shouldDisable) {
            bEl.style.opacity = '0.2';
            bEl.style.cursor = 'not-allowed';
        } else {
            bEl.style.opacity = '1';
            bEl.style.cursor = 'pointer';
        }

        // Ensure button has relative positioning for overlay to work
        if (bEl.style.position !== 'absolute' && bEl.style.position !== 'fixed') {
            bEl.style.position = 'relative';
        }

        // Change button appearance based on what's missing
        if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
            // Need both cash and power - prioritize showing cash need
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power`;
        } else if (!hasEnoughDollars) {
            // Need cash (regardless of power)
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
        } else if (!hasEnoughPower && powerReq > 0) {
            // Need power (and have enough cash)
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE POWER';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE POWER';
            }
            bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - availablePower).toLocaleString()}W more power capacity.`;
        } else {
            // Can afford - remove overlay
            let overlay = bEl.querySelector('.power-overlay');
            if (overlay) overlay.remove();
            bEl.title = '';
        }
    }

    // Update doubling button cost display
    const doublingCostEl = document.getElementById(`doubling-cost-${u.id}`);
    if(doublingCostEl) {
        const doublingCost = calculateMilestoneDoublingCost(u);
        doublingCostEl.innerText = `$${Math.floor(doublingCost).toLocaleString()}`;
    }

    // Update doubling button availability
    const doublingBtn = document.getElementById(`doubling-${u.id}`);
    if(doublingBtn) {
        const doublingCost = calculateMilestoneDoublingCost(u);
        // Don't set disabled attribute - it prevents click events. Use CSS instead
        const canAfford = dollarBalance >= doublingCost;
        if (!canAfford) {
            doublingBtn.style.opacity = '0.6';
        } else {
            doublingBtn.style.opacity = '1';
        }
    }
});

// Update ETH upgrades display
ethUpgrades.forEach(u => {
    const costUsd = u.currentUsd;

    // Update level tag in equipment name
    const nameEl = document.querySelector(`#eth-up-${u.id} > div:first-child > div:first-child`);
    if (nameEl) {
        const levelTag = formatLevelTag(u.level);
        // Replace or add the level tag after the equipment name
        nameEl.innerHTML = nameEl.innerHTML.replace(/\s*<span style="color:#888;font-size:0\.85rem">\[.*?\]<\/span>/g, '') + ` <span style="color:#888;font-size:0.85rem">${levelTag}</span>`;
    }

    const yEl = document.getElementById(`eth-yield-${u.id}`);
    if (yEl) {
        if (u.isClickUpgrade) {
            yEl.innerText = `+10% MANUAL ETH RATE`;
        } else {
            // Show the current speed WITH skill bonuses AND ascension bonus AND doubling multiplier AND global multiplier applied
            const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseSpeed = u.baseYield * u.level;
            const globalMultiplier = Math.pow(2, ethMultiplierLevel);  // Apply global multiplier
            const currentSpeed = baseSpeed * (1 + miningBonus + ethBonus + ascensionBonus) * u.doubleMultiplier * globalMultiplier;
            yEl.innerText = `+${formatCryptoYield(currentSpeed)} Ξ/s - Current Speed`;
        }
    }

    // Update per-level increase for ETH
    const ethIncreaseEl = document.getElementById(`eth-increase-${u.id}`);
    if (ethIncreaseEl) {
        if (u.isClickUpgrade) {
            ethIncreaseEl.style.display = 'none';
        } else {
            const ethBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('eth_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseIncrease = u.baseYield;
            const globalMultiplier = Math.pow(2, ethMultiplierLevel);  // Apply global multiplier
            const perLevelIncrease = baseIncrease * (1 + miningBonus + ethBonus + ascensionBonus) * u.doubleMultiplier * globalMultiplier;
            ethIncreaseEl.innerText = `+${formatCryptoYield(perLevelIncrease)} Ξ/s per level`;
            ethIncreaseEl.style.display = 'block';
        }
    }

    const uEl = document.getElementById(`eth-usd-${u.id}`);
    if(uEl) {
        // Calculate total cost for the selected quantity
        let displayCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                displayCost += u.baseUsd * Math.pow(1.15, tempLevel);
            } else {
                displayCost += u.baseUsd * Math.pow(1.15, tempLevel);
            }
            tempLevel++;
        }
        uEl.innerText = `$${formatNumberForDisplay(Math.floor(displayCost))}`;
    }

    // Update power display with effective consumption after skills
    const ethPowerEl = document.getElementById(`eth-power-${u.id}`);
    if(ethPowerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            ethPowerEl.innerText = `${formatPower(effectivePower)} Consumed per level`;
        }
    }

    const affordEl = document.getElementById(`eth-afford-${u.id}`);
    if(affordEl) {
        let remaining = dollarBalance;
        let canAfford = 0;
        let nextCost = costUsd;
        let nextLevel = u.level;

        while (remaining >= nextCost) {
            remaining -= nextCost;
            canAfford++;
            nextLevel++;
            if (u.isClickUpgrade) {
                nextCost = u.baseUsd * Math.pow(1.15, nextLevel);
            } else {
                nextCost = u.baseUsd * Math.pow(1.15, nextLevel);
            }
        }

        affordEl.innerText = `x${canAfford}`;
        affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
    }

    const bEl = document.getElementById(`eth-up-${u.id}`);
    if(bEl) {
        // Check both dollar balance and power requirements for the selected quantity
        // Calculate total cost for buyQuantity items
        let totalCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                totalCost += u.baseUsd * Math.pow(1.15, tempLevel);
            } else {
                totalCost += u.baseUsd * Math.pow(1.15, tempLevel);
            }
            tempLevel++;
        }

        const hasEnoughDollars = dollarBalance >= totalCost;
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
        const ethAvailablePower = getTotalPowerAvailableWithBonus();
        const hasEnoughPower = powerNeeded <= ethAvailablePower || powerReq === 0;
        const shouldDisable = !(hasEnoughDollars && hasEnoughPower);
        // Don't set disabled attribute - it prevents click events. Use CSS opacity/cursor instead
        // bEl.disabled = shouldDisable;
        if (shouldDisable) {
            bEl.style.opacity = '0.2';
            bEl.style.cursor = 'not-allowed';
        } else {
            bEl.style.opacity = '1';
            bEl.style.cursor = 'pointer';
        }

        // Ensure button has relative positioning for overlay to work
        if (bEl.style.position !== 'absolute' && bEl.style.position !== 'fixed') {
            bEl.style.position = 'relative';
        }

        // Change button appearance based on what's missing
        if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
            // Need both cash and power - prioritize showing cash need
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - ethAvailablePower).toLocaleString()}W more power`;
        } else if (!hasEnoughDollars) {
            // Need cash (regardless of power)
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
        } else if (!hasEnoughPower && powerReq > 0) {
            // Need power (and have enough cash)
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE POWER';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE POWER';
            }
            bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - ethAvailablePower).toLocaleString()}W more power capacity.`;
        } else {
            // Can afford - remove overlay
            let overlay = bEl.querySelector('.power-overlay');
            if (overlay) overlay.remove();
            bEl.title = '';
        }
    }

    // Update ETH doubling button cost display
    const ethDoublingCostEl = document.getElementById(`eth-doubling-cost-${u.id}`);
    if(ethDoublingCostEl) {
        const doublingCost = calculateMilestoneDoublingCost(u);
        ethDoublingCostEl.innerText = `$${Math.floor(doublingCost).toLocaleString()}`;
    }

    // Update ETH doubling button availability
    const ethDoublingBtn = document.getElementById(`eth-doubling-${u.id}`);
    if(ethDoublingBtn) {
        const doublingCost = calculateMilestoneDoublingCost(u);
        ethDoublingBtn.disabled = (dollarBalance < doublingCost);
    }
});

// Update DOGE upgrades display
dogeUpgrades.forEach(u => {
    const costUsd = u.currentUsd;

    // Update level tag in equipment name
    const nameEl = document.querySelector(`#doge-up-${u.id} > div:first-child > div:first-child`);
    if (nameEl) {
        const levelTag = formatLevelTag(u.level);
        // Replace or add the level tag after the equipment name
        nameEl.innerHTML = nameEl.innerHTML.replace(/\s*<span style="color:#888;font-size:0\.85rem">\[.*?\]<\/span>/g, '') + ` <span style="color:#888;font-size:0.85rem">${levelTag}</span>`;
    }

    const yEl = document.getElementById(`doge-yield-${u.id}`);
    if (yEl) {
        if (u.isClickUpgrade) {
            yEl.innerText = `+10% MANUAL DOGE RATE`;
        } else {
            // Show the current speed WITH skill bonuses AND ascension bonus AND doubling multiplier AND global multiplier applied
            const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseSpeed = u.baseYield * u.level;
            const globalMultiplier = Math.pow(2, dogeMultiplierLevel);  // Apply global multiplier
            const currentSpeed = baseSpeed * (1 + miningBonus + dogeBonus + ascensionBonus) * u.doubleMultiplier * globalMultiplier;
            yEl.innerText = `+${formatCryptoYield(currentSpeed)} Ð/s - Current Speed`;
        }
    }

    // Update per-level increase for DOGE
    const dogeIncreaseEl = document.getElementById(`doge-increase-${u.id}`);
    if (dogeIncreaseEl) {
        if (u.isClickUpgrade) {
            dogeIncreaseEl.style.display = 'none';
        } else {
            const dogeBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('doge_mining_speed') : 0;
            const miningBonus = (typeof getSkillBonus === 'function') ? getSkillBonus('mining_speed') : 0;
            const ascensionBonus = (typeof getAscensionMiningBonus === 'function') ? getAscensionMiningBonus() : 0;
            const baseIncrease = u.baseYield;
            const globalMultiplier = Math.pow(2, dogeMultiplierLevel);  // Apply global multiplier
            const perLevelIncrease = baseIncrease * (1 + miningBonus + dogeBonus + ascensionBonus) * u.doubleMultiplier * globalMultiplier;
            dogeIncreaseEl.innerText = `+${formatCryptoYield(perLevelIncrease)} Ð/s per level`;
            dogeIncreaseEl.style.display = 'block';
        }
    }

    const uEl = document.getElementById(`doge-usd-${u.id}`);
    if(uEl) {
        // Calculate total cost for the selected quantity
        let displayCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                displayCost += u.baseUsd * Math.pow(1.15, tempLevel);
            } else {
                displayCost += u.baseUsd * Math.pow(1.15, tempLevel);
            }
            tempLevel++;
        }
        uEl.innerText = `$${formatNumberForDisplay(Math.floor(displayCost))}`;
    }

    // Update power display with effective consumption after skills
    const dogePowerEl = document.getElementById(`doge-power-${u.id}`);
    if(dogePowerEl) {
        const powerReq = equipmentPowerReqs[u.id] || 0;
        if (powerReq > 0) {
            const effectivePower = getEffectivePowerRequirement(powerReq);
            dogePowerEl.innerText = `${formatPower(effectivePower)} Consumed per level`;
        }
    }

    const affordEl = document.getElementById(`doge-afford-${u.id}`);
    if(affordEl) {
        let remaining = dollarBalance;
        let canAfford = 0;
        let nextCost = costUsd;
        let nextLevel = u.level;

        while (remaining >= nextCost) {
            remaining -= nextCost;
            canAfford++;
            nextLevel++;
            if (u.isClickUpgrade) {
                nextCost = u.baseUsd * Math.pow(1.15, nextLevel);
            } else {
                nextCost = u.baseUsd * Math.pow(1.15, nextLevel);
            }
        }

        affordEl.innerText = `x${canAfford}`;
        affordEl.style.color = canAfford > 0 ? '#00ff88' : '#666';
    }

    const bEl = document.getElementById(`doge-up-${u.id}`);
    if(bEl) {
        // Check both dollar balance and power requirements for the selected quantity
        // Calculate total cost for buyQuantity items
        let totalCost = 0;
        let tempLevel = u.level;
        for (let i = 0; i < buyQuantity; i++) {
            if (u.isClickUpgrade) {
                totalCost += u.baseUsd * Math.pow(1.15, tempLevel);
            } else {
                totalCost += u.baseUsd * Math.pow(1.15, tempLevel);
            }
            tempLevel++;
        }

        const hasEnoughDollars = dollarBalance >= totalCost;
        const powerReq = equipmentPowerReqs[u.id] || 0;
        const powerNeeded = totalPowerUsed + (powerReq * buyQuantity);
        const dogeAvailablePower = getTotalPowerAvailableWithBonus();
        const hasEnoughPower = powerNeeded <= dogeAvailablePower || powerReq === 0;
        const shouldDisable = !(hasEnoughDollars && hasEnoughPower);
        // Don't set disabled attribute - it prevents click events. Use CSS opacity/cursor instead
        // bEl.disabled = shouldDisable;
        if (shouldDisable) {
            bEl.style.opacity = '0.2';
            bEl.style.cursor = 'not-allowed';
        } else {
            bEl.style.opacity = '1';
            bEl.style.cursor = 'pointer';
        }

        // Ensure button has relative positioning for overlay to work
        if (bEl.style.position !== 'absolute' && bEl.style.position !== 'fixed') {
            bEl.style.position = 'relative';
        }

        // Change button appearance based on what's missing
        if (!hasEnoughDollars && !hasEnoughPower && powerReq > 0) {
            // Need both cash and power - prioritize showing cash need
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more cash AND ${Math.ceil(powerNeeded - dogeAvailablePower).toLocaleString()}W more power`;
        } else if (!hasEnoughDollars) {
            // Need cash (regardless of power)
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE CASH';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE CASH';
            }
            bEl.title = `Need $${(totalCost - dollarBalance).toLocaleString()} more`;
        } else if (!hasEnoughPower && powerReq > 0) {
            // Need power (and have enough cash)
            let overlay = bEl.querySelector('.power-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'power-overlay';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.borderRadius = '10px';
                overlay.style.color = '#999';
                overlay.style.fontWeight = 'bold';
                overlay.style.fontSize = '1.1rem';
                overlay.style.textAlign = 'center';
                overlay.style.zIndex = '9999';
                overlay.style.pointerEvents = 'none';
                overlay.innerHTML = 'YOU NEED MORE POWER';
                bEl.appendChild(overlay);
            } else {
                overlay.innerHTML = 'YOU NEED MORE POWER';
            }
            bEl.title = `Insufficient power! This requires ${powerReq.toLocaleString()}W per level. Need ${Math.ceil(powerNeeded - dogeAvailablePower).toLocaleString()}W more power capacity.`;
        } else {
            // Can afford - remove overlay
            let overlay = bEl.querySelector('.power-overlay');
            if (overlay) overlay.remove();
            bEl.title = '';
        }
    }

    // Update DOGE doubling button cost display
    const dogeDoublingCostEl = document.getElementById(`doge-doubling-cost-${u.id}`);
    if(dogeDoublingCostEl) {
        const doublingCost = calculateMilestoneDoublingCost(u);
        dogeDoublingCostEl.innerText = `$${Math.floor(doublingCost).toLocaleString()}`;
    }

    // Update DOGE doubling button availability
    const dogeDoublingBtn = document.getElementById(`doge-doubling-${u.id}`);
    if(dogeDoublingBtn) {
        const doublingCost = calculateMilestoneDoublingCost(u);
        dogeDoublingBtn.disabled = (dollarBalance < doublingCost);
    }
    });

    // Update staking UI
    if (typeof window.updateStakingUI === 'function') {
        window.updateStakingUI();
    }

    // Update ascension UI
    if (typeof window.updateAscensionUI === 'function') {
        window.updateAscensionUI();
    }

    // Update store button visibility (for tokens display)
    if (typeof window.updateStoreButtonVisibility === 'function') {
        window.updateStoreButtonVisibility();
    }
    }

    // Mining loop - runs every 100ms for smooth earning display
    setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - lastTickTime) / 1000;
        lastTickTime = now;

        // Get skill tree mining bonus
        const miningBonus = (typeof getSkillBonus === 'function') ? (1 + getSkillBonus('mining_speed')) : 1;

        // Get hacking speed boost
        const hackingBoost = getHackingSpeedBoost();

        // BTC mining gains
        if (btcPerSec > 0) {
            let gain = btcPerSec * deltaTime * miningBonus * hackingBoost;
            let effectivePrice = getEffectiveCryptoPrice(btcPrice);
            let usdValue = gain * effectivePrice;

            // Try auto-sell first (before adding to balance)
            const btcAutoSold = tryAutoSellCrypto('btc', gain);

            // If not auto-sold, add to balance
            if (!btcAutoSold) {
                btcBalance += gain;
            }

            btcLifetime += gain;
            lifetimeEarnings += usdValue;
            sessionEarnings += usdValue;
        }

        // ETH mining gains
        if (ethPerSec > 0) {
            let gain = ethPerSec * deltaTime * miningBonus * hackingBoost;
            let effectivePrice = getEffectiveCryptoPrice(ethPrice);
            let usdValue = gain * effectivePrice;

            // Try auto-sell first (before adding to balance)
            const ethAutoSold = tryAutoSellCrypto('eth', gain);

            // If not auto-sold, add to balance
            if (!ethAutoSold) {
                ethBalance += gain;
            }

            ethLifetime += gain;
            lifetimeEarnings += usdValue;
            sessionEarnings += usdValue;
        }

        // DOGE mining gains
        if (dogePerSec > 0) {
            let gain = dogePerSec * deltaTime * miningBonus * hackingBoost;
            let effectivePrice = getEffectiveCryptoPrice(dogePrice);
            let usdValue = gain * effectivePrice;

            // Try auto-sell first (before adding to balance)
            const dogeAutoSold = tryAutoSellCrypto('doge', gain);

            // If not auto-sold, add to balance
            if (!dogeAutoSold) {
                dogeBalance += gain;
            }

            dogeLifetime += gain;
            lifetimeEarnings += usdValue;
            sessionEarnings += usdValue;
        }

        // Generate corrupt tokens passively (online)
        const tokenGenerationRate = (typeof getTokenGenerationRate === 'function') ? getTokenGenerationRate() : 0;
        if (tokenGenerationRate > 0 && typeof rugpullCurrency !== 'undefined') {
            const tokensGenerated = tokenGenerationRate * deltaTime;
            rugpullCurrency += tokensGenerated;
        }

        // Update gameState with current values for rugpull.js
        // lifetimeEarnings = lifetime total (never resets)
        window.gameState.lifetimeEarnings = lifetimeEarnings;
        window.gameState.dollarBalance = dollarBalance;

        // Note: rugpull earnings are tracked via addEarnings() → rugpullAddEarnings()
        // We don't need to call updateCurrentRunEarnings here as it would overwrite
        // the incremental updates from rugpullAddEarnings()

        updateUI();

        // Throttle stat updates to 250ms to reduce CPU load
        if (now - lastStatsUpdateTime >= 250) {
            updateAutoClickerButtonState();
            updateWhackStats();
            updateNetworkStats();
            updateMinigamesTab();
            lastStatsUpdateTime = now;
        }

        // Chart data collection moved to main 1000ms loop for perfect timing

        // Check for rugpull milestone (only until goal is announced, then stop calling to save CPU) - throttle to 2000ms
        if (!rugpullMilestoneAnnounced && (now - lastMilestoneCheckTime >= 2000)) {
            lastMilestoneCheckTime = now;
            const hasCheckFunc = typeof window.checkRugpullMilestone === 'function';
            const hasReqFunc = typeof window.getRugpullRequirement === 'function';
            const earnings = window.lifetimeEarningsThisRugpull;

            if (earnings > 0 && earnings % 5000000 < 100000) { // Debug every ~$5M
                console.log('[MILESTONE-DEBUG] Check func: ' + hasCheckFunc + ', Req func: ' + hasReqFunc + ', Earnings: $' + earnings.toFixed(0));
            }

            if (hasCheckFunc) {
                window.checkRugpullMilestone();

                // Check if milestone was just announced
                if (hasReqFunc) {
                    const requirement = window.getRugpullRequirement();
                    if (earnings > 0 && earnings % 1000000 < 100000) { // Log roughly every $1M in earnings
                        console.log('[MILESTONE-CHECK] Earnings: $' + earnings.toFixed(0) + ' vs Requirement: $' + requirement.toFixed(0) + ' | Flag: ' + rugpullMilestoneAnnounced);
                    }
                    if (earnings >= requirement && earnings > 0) {
                        rugpullMilestoneAnnounced = true;
                        console.log('✅ RUGPULL MILESTONE ANNOUNCED - Earnings: $' + earnings.toFixed(0) + ' >= Requirement: $' + requirement.toFixed(0));
                        console.log('🎯 Stopping milestone checks to save CPU - flag is now true');
                    }
                }
            }
        }

    }, 100);

    // Initialize all shops after DOM is ready
    function initializeGame() {
        // FIX: Ensure any stuck minigame modal class is removed on page load
        // document.body.classList.remove('minigame-modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.position = 'static';

        // Don't force close modals - they're controlled by their respective functions
        // The modals start with display: none in the HTML and are opened when needed

        // Test localStorage availability
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            console.log('localStorage is available and working');
        } catch (e) {
            console.error('localStorage is NOT available:', e);
            alert('WARNING: Browser storage is disabled! Your game progress will not be saved. Please enable cookies/storage in your browser settings.');
        }

        try {
            initBtcShop();
            initEthShop();
            initDogeShop();
            initPowerShop();
        } catch (e) {
            console.error('Error initializing shops:', e);
        }

        // Initialize achievements system BEFORE loading game so loadGame() can populate them
        if (typeof initAchievements === 'function') {
            initAchievements();
            console.log('✓ Achievements system initialized');
        }

        loadGame(); // This calls updateUI() internally
        updateAutoClickerButtonState(); // Update button state immediately after loading
        setBuyQuantity(1); // Highlight the 1x button on page load

        // Update auto-sell status button
        updateAutoSellButtonUI();

        // Initialize staking system
        initStaking();
        updateStakingUI();

        // Initialize tutorial for new players
        if (typeof initTutorial === 'function') {
            initTutorial();
            console.log('🎓 Tutorial system initialized');
        }

        // Schedule first hacking notification if not already scheduled
        if (hackingNextNotificationTime === 0) {
            scheduleHackingNotification();
            console.log('⚡ Hacking minigame notification scheduled');
        }

        // Initialize button states for both minigames
        ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
            // Hacking buttons
            const hackingBtn = document.getElementById(`hacking-${difficulty.toLowerCase()}-btn`);
            if (hackingBtn) {
                const hackingCooldownEnd = hackingCooldowns[difficulty] || 0;
                hackingBtn.dataset.onCooldown = Date.now() < hackingCooldownEnd ? 'true' : 'false';
                hackingBtn.style.filter = Date.now() < hackingCooldownEnd ? 'brightness(0.5)' : '';
            }

            // Whack buttons
            const whackBtn = document.getElementById(`whack-${difficulty.toLowerCase()}-btn`);
            if (whackBtn) {
                const whackCooldownEnd = whackCooldowns[difficulty] || 0;
                whackBtn.dataset.onCooldown = Date.now() < whackCooldownEnd ? 'true' : 'false';
                whackBtn.style.filter = Date.now() < whackCooldownEnd ? 'brightness(0.5)' : '';
            }
        });

        // Update hacking stats on page load
        updateHackingStats();
        updateWhackStats();
        updateNetworkStats();
        updateMinigamesTab();

        // Initialize event handlers for manual hash buttons (mobile + desktop support)
        const manualBtcBtn = document.getElementById('manual-hash-btc-btn');
        const manualEthBtn = document.getElementById('manual-hash-eth-btn');
        const manualDogeBtn = document.getElementById('manual-hash-doge-btn');

        if (manualBtcBtn) {
            let btcAnimTimeout = null;
            let btcTouched = false;
            const btcClick = () => {
                trackManualHashClick();
                manualHash();
            };
            const triggerBtcAnimation = () => {
                // Clear any pending timeout to prevent glitching on rapid clicks
                if (btcAnimTimeout) clearTimeout(btcAnimTimeout);
                // Add active state class
                manualBtcBtn.classList.add('active');
                // Schedule removal - shorter timeout for faster bounce
                btcAnimTimeout = setTimeout(() => {
                    manualBtcBtn.classList.remove('active');
                    btcAnimTimeout = null;
                }, 50);
            };
            manualBtcBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btcTouched = true;
                triggerBtcAnimation();
                btcClick();
            });
            manualBtcBtn.addEventListener('click', (e) => {
                if (!btcTouched) {
                    triggerBtcAnimation();
                    btcClick();
                }
                btcTouched = false;
            });
        }

        if (manualEthBtn) {
            let ethAnimTimeout = null;
            let ethTouched = false;
            const ethClick = () => {
                trackManualHashClick();
                manualEthHash();
            };
            const triggerEthAnimation = () => {
                if (ethAnimTimeout) clearTimeout(ethAnimTimeout);
                manualEthBtn.classList.add('active');
                ethAnimTimeout = setTimeout(() => {
                    manualEthBtn.classList.remove('active');
                    ethAnimTimeout = null;
                }, 50);
            };
            manualEthBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                ethTouched = true;
                triggerEthAnimation();
                ethClick();
            });
            manualEthBtn.addEventListener('click', (e) => {
                if (!ethTouched) {
                    triggerEthAnimation();
                    ethClick();
                }
                ethTouched = false;
            });
        }

        if (manualDogeBtn) {
            let dogeAnimTimeout = null;
            let dogeTouched = false;
            const dogeClick = () => {
                trackManualHashClick();
                manualDogeHash();
            };
            const triggerDogeAnimation = () => {
                if (dogeAnimTimeout) clearTimeout(dogeAnimTimeout);
                manualDogeBtn.classList.add('active');
                dogeAnimTimeout = setTimeout(() => {
                    manualDogeBtn.classList.remove('active');
                    dogeAnimTimeout = null;
                }, 50);
            };
            manualDogeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                dogeTouched = true;
                triggerDogeAnimation();
                dogeClick();
            });
            manualDogeBtn.addEventListener('click', (e) => {
                if (!dogeTouched) {
                    triggerDogeAnimation();
                    dogeClick();
                }
                dogeTouched = false;
            });
        }

        // Show instructions modal if not dismissed and player hasn't ascended yet
        // BUT: don't show if tutorial is active for new players or if tutorial was completed
        const tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';
        const isNewPlayer = !localStorage.getItem('gameStarted');
        const isTutorialActive = typeof tutorialData !== 'undefined' && !tutorialData.completed;

        if (!isNewPlayer && !isTutorialActive && !tutorialCompleted && localStorage.getItem('instructionsDismissed') !== 'true') {
            const hasAscended = typeof ascensionLevel !== 'undefined' && ascensionLevel > 0;
            if (!hasAscended) {
                const instructionsEl = document.getElementById('game-instructions');
                if (instructionsEl) {
                    instructionsEl.style.display = 'flex';
                }
            }
        }

        // Show offline earnings if applicable (must be after loadGame())
        console.log('=== MODAL CHECK ===');
        console.log('window.offlineEarningsToShow:', window.offlineEarningsToShow);
        console.log('Type:', typeof window.offlineEarningsToShow);

        if (window.offlineEarningsToShow) {
            console.log('✓ SHOWING OFFLINE EARNINGS MODAL');
            console.log('Data:', window.offlineEarningsToShow);
            setTimeout(() => {
                console.log('Calling showOfflineEarningsModal function...');
                showOfflineEarningsModal(
                    window.offlineEarningsToShow.btc || 0,
                    window.offlineEarningsToShow.eth || 0,
                    window.offlineEarningsToShow.doge || 0,
                    window.offlineEarningsToShow.stakingCash || 0,
                    window.offlineEarningsToShow.corruptTokens || 0,
                    window.offlineEarningsToShow.seconds,
                    window.offlineEarningsToShow.wasCapped || false,
                    window.offlineEarningsToShow.cappedSeconds || window.offlineEarningsToShow.seconds
                );
                window.offlineEarningsToShow = null;
                // Show backup reminder after offline earnings modal
                setTimeout(() => {
                    showBackupReminder();
                }, 600000);
            }, 500);
        } else {
            console.log('✗ No offline earnings data - modal will not show');
            // Show backup reminder anyway on every load
            setTimeout(() => {
                showBackupReminder();
            }, 600000);
        }

        const canvasElement = document.getElementById('nwChart');
        console.log('Canvas element:', canvasElement);

        if (!canvasElement) {
            console.error('ERROR: Canvas element not found!');
            return;
        }

        // Function to initialize the chart
        const initChart = () => {
            // Initialize chart with full history (at least one data point)
            const currentNetWorth = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);
            console.log('=== CHART DEBUG ===');
            console.log('btcBalance:', btcBalance, 'btcPrice:', btcPrice);
            console.log('ethBalance:', ethBalance, 'ethPrice:', ethPrice);
            console.log('dogeBalance:', dogeBalance, 'dogePrice:', dogePrice);
            console.log('hardwareEquity:', hardwareEquity);
            console.log('Current net worth for chart:', currentNetWorth);

            // Always start chart with current values
            if (chartHistory.length === 0) {
                const btcUSD = btcBalance * btcPrice;
                const ethUSD = ethBalance * ethPrice;
                const dogeUSD = dogeBalance * dogePrice;
                const netWorthVal = btcUSD + ethUSD + dogeUSD + dollarBalance;

                chartHistory.push(netWorthVal);
                chartHistory.push(netWorthVal);
                btcChartHistory.push(btcUSD);
                btcChartHistory.push(btcUSD);
                ethChartHistory.push(ethUSD);
                ethChartHistory.push(ethUSD);
                dogeChartHistory.push(dogeUSD);
                dogeChartHistory.push(dogeUSD);
                cashChartHistory.push(dollarBalance);
                cashChartHistory.push(dollarBalance);
                chartTimestamps.push({ time: Date.now(), value: netWorthVal, cash: dollarBalance, btc: btcBalance, eth: ethBalance, doge: dogeBalance });
                chartTimestamps.push({ time: Date.now() + 1000, value: netWorthVal, cash: dollarBalance, btc: btcBalance, eth: ethBalance, doge: dogeBalance });
            }

            console.log('Chart history length:', chartHistory.length, 'Data:', chartHistory);

            // Check if Chart.js loaded
            if (typeof Chart === 'undefined') {
                console.error('ERROR: Chart.js library not loaded!');
                document.querySelector('.chart-wrapper').innerHTML = '<div style="color: #ff3344; padding: 20px; text-align: center; font-size: 0.8rem;">Chart.js failed to load<br>Check internet connection</div>';
                return null;
            }

            console.log('Chart.js loaded');

            let nwChart;
            try {
                const ctx = document.getElementById('nwChart');
                if (!ctx) {
                    console.error('Canvas element not found');
                    return null;
                }

                // Format chart data - Chart.js expects x as labels and y as data values
                const getChartLabels = () => {
                    return chartTimestamps.map((ts) =>
                        new Date(ts.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    );
                };

                const getChartValues = () => {
                    return chartHistory;
                };


                nwChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: getChartLabels(),
                        datasets: [{
                            label: 'BTC',
                            data: btcChartHistory,
                            borderColor: '#f7931a',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            fill: false,
                            tension: 0,
                            pointRadius: 0,
                            pointBackgroundColor: '#f7931a',
                            pointBorderColor: 'transparent',
                            pointBorderWidth: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: '#f7931a',
                            pointHoverBorderColor: 'transparent',
                            pointHoverBorderWidth: 0
                        }, {
                            label: 'ETH',
                            data: ethChartHistory,
                            borderColor: '#627eea',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            fill: false,
                            tension: 0,
                            pointRadius: 0,
                            pointBackgroundColor: '#627eea',
                            pointBorderColor: 'transparent',
                            pointBorderWidth: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: '#627eea',
                            pointHoverBorderColor: 'transparent',
                            pointHoverBorderWidth: 0
                        }, {
                            label: 'DOGE',
                            data: dogeChartHistory,
                            borderColor: '#c2a633',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            fill: false,
                            tension: 0,
                            pointRadius: 0,
                            pointBackgroundColor: '#c2a633',
                            pointBorderColor: 'transparent',
                            pointBorderWidth: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: '#c2a633',
                            pointHoverBorderColor: 'transparent',
                            pointHoverBorderWidth: 0
                        }, {
                            label: 'CASH',
                            data: cashChartHistory,
                            borderColor: '#00ff88',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            fill: false,
                            tension: 0,
                            pointRadius: 0,
                            pointBackgroundColor: '#00ff88',
                            pointBorderColor: 'transparent',
                            pointBorderWidth: 0,
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: '#00ff88',
                            pointHoverBorderColor: 'transparent',
                            pointHoverBorderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        plugins: {
                            legend: {
                                display: true,
                                align: 'center',
                                labels: {
                                    color: '#999',
                                    font: { size: window.innerWidth <= 448 ? 6 : (window.innerWidth <= 932 ? 8 : 12) },
                                    boxWidth: 18,
                                    boxHeight: 13,
                                    padding: 6
                                }
                            },
                            tooltip: {
                                enabled: true,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#00ff88',
                                bodyColor: '#ffffff',
                                borderColor: '#00ff88',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: true,
                                callbacks: {
                                    title: function(context) {
                                        if (context.length > 0) {
                                            const index = context[0].dataIndex;
                                            return chartTimestamps[index] ?
                                                new Date(chartTimestamps[index].time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                                                '';
                                        }
                                        return '';
                                    },
                                    labelColor: function(context) {
                                        return {
                                            borderColor: context.dataset.borderColor,
                                            backgroundColor: context.dataset.borderColor,
                                            borderWidth: 0,
                                            borderRadius: 0
                                        };
                                    },
                                    label: function(context) {
                                        const value = parseFloat(context.parsed.y) || 0;
                                        return context.dataset.label + ': $' + abbreviateNumber(value, 2);
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                display: true,
                                grid: {
                                    display: false,
                                    drawBorder: false
                                },
                                ticks: {
                                    color: 'transparent',
                                    font: {
                                        size: 11
                                    },
                                    maxTicksLimit: 6
                                }
                            },
                            y: {
                                display: true,
                                position: 'left',
                                min: 0,
                                max: (() => {
                                    // If user has locked zoom, use that value
                                    if (userLockedChartMax !== null) {
                                        return userLockedChartMax;
                                    }
                                    // Otherwise calculate from current data (defaults to current max value = 0% zoom)
                                    const allValues = [...btcChartHistory, ...ethChartHistory, ...dogeChartHistory, ...cashChartHistory].filter(v => v !== undefined && v !== null);
                                    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
                                    return maxValue;
                                })(),
                                grace: 0,
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.05)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#999',
                                    font: {
                                        size: 11
                                    },
                                    callback: function(value) {
                                        return formatCurrencyAbbreviated(value, 1);
                                    }
                                }
                            }
                        }
                    }
                });

                console.log('Chart object created:', nwChart);
                console.log('Chart initialized with data:', chartHistory);

                return nwChart;
            } catch (error) {
                console.error('ERROR creating chart:', error);
                document.querySelector('.chart-wrapper').innerHTML = '<div style="color: #ff3344; padding: 20px; text-align: center; font-size: 0.8rem;">Chart Error: ' + error.message + '<br><small>Try refreshing the page</small></div>';
                return null;
            }
        };

        // Initialize chart with retry logic
        let nwChart = null;
        let chartInitialized = false;

        const tryInitChart = () => {
            nwChart = initChart();
            if (nwChart) {
                chartInitialized = true;
                console.log('Chart successfully initialized');

                // Initialize chart with starting data point if empty
                if (chartHistory.length === 0) {
                    const now = Date.now();
                    const currentNetWorth = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice) + dollarBalance;
                    chartHistory.push(currentNetWorth);
                    btcChartHistory.push(btcBalance * btcPrice);
                    ethChartHistory.push(ethBalance * ethPrice);
                    dogeChartHistory.push(dogeBalance * dogePrice);
                    cashChartHistory.push(dollarBalance);
                    chartTimestamps.push({ time: now, value: currentNetWorth, cash: dollarBalance, btc: btcBalance * btcPrice, eth: ethBalance * ethPrice, doge: dogeBalance * dogePrice });
                    chartStartTime = now;
                    console.log('Chart initialized with current data point');
                }

                // Update the date tracker on initialization
                updateChartDateTracker();
            }
        };

        // Try immediate initialization
        const isDesktop = window.innerWidth > 1200;

        setTimeout(() => {
            tryInitChart();

            // Initialize hash rate chart on all screen sizes
            // On mobile it will be hidden but ready to show when swapped to
            console.log('Initializing hash rate chart...');
            const hrInitResult = initializeHashRateChart();
            if (!hrInitResult) {
                console.log('Hash rate chart init failed, will retry...');
                // Retry hash rate chart initialization
                setTimeout(() => {
                    console.log('Retrying hash rate chart initialization...');
                    initializeHashRateChart();
                }, 200);
            }

            // Initialize crypto bars
            console.log('Initializing crypto bars...');
            if (initBars()) {
                console.log('Crypto bars successfully initialized');
            }

            // Power chart has been removed from the UI - skipping initialization
            // (Power chart canvas no longer exists in the DOM)

            // Retry with delays (especially important for mobile)
            if (!chartInitialized) {
                console.log('Chart init failed, retrying with delays...');
                setTimeout(tryInitChart, 200);
                setTimeout(tryInitChart, 500);
                setTimeout(tryInitChart, 1000);
                setTimeout(tryInitChart, 2000); // Extra retry for slow mobile devices
                setTimeout(tryInitChart, 3000); // Final attempt
            }
        }, 100); // Small initial delay to ensure DOM is fully rendered

        // Initialize rugpull sections visibility based on screen size
        const initializeRugpullVisibility = () => {
            const isDesktop = window.innerWidth > 1200;
            const desktopRugpull = document.getElementById('desktop-rugpull-section');
            const mobileRugpull = document.getElementById('mobile-rugpull-section');
            if (desktopRugpull && mobileRugpull) {
                desktopRugpull.style.display = isDesktop ? 'flex' : 'none';
                mobileRugpull.style.display = isDesktop ? 'none' : 'flex';
            }
        };
        initializeRugpullVisibility();

        // Handle window resize/orientation change on mobile
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const isDesktop = window.innerWidth > 1200;

                // Show/hide rugpull sections based on screen size
                const desktopRugpull = document.getElementById('desktop-rugpull-section');
                const mobileRugpull = document.getElementById('mobile-rugpull-section');
                if (desktopRugpull && mobileRugpull) {
                    desktopRugpull.style.display = isDesktop ? 'flex' : 'none';
                    mobileRugpull.style.display = isDesktop ? 'none' : 'flex';
                }

                if (nwChart) {
                    console.log('Window resized, re-rendering net worth chart...');
                    nwChart.resize();
                }
                if (isDesktop && hashRateChartInstance) {
                    console.log('Window resized to desktop, re-rendering hash rate chart...');
                    hashRateChartInstance.resize();
                } else if (isDesktop && !hashRateChartInstance) {
                    console.log('Window resized to desktop, initializing hash rate chart...');
                    initializeHashRateChart();
                }
            }, 300);
        });

        // Y-Axis Scale Slider Event Listener
        const yAxisScaleSlider = document.getElementById('y-axis-scale-slider');
        const yAxisScaleValue = document.getElementById('y-axis-scale-value');
        if (yAxisScaleSlider) {
            yAxisScaleSlider.addEventListener('input', (e) => {
                const sliderValue = parseFloat(e.target.value);

                // Get the current max value in chart
                const allValues = [...btcChartHistory, ...ethChartHistory, ...dogeChartHistory, ...cashChartHistory].filter(v => v !== undefined && v !== null);
                const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;

                // Slider range (0-100): 0 = no zoom (current max value), 100 = full zoom ($10)
                const minZoom = 10;
                const maxZoom = maxValue;

                // Normalize slider value (0 to 1)
                const normalizedSlider = sliderValue / 100;

                // Exponential interpolation: at 0% = maxZoom, at 100% = minZoom
                // This is backwards from usual, so we reverse it
                const reversedNormalized = 1 - normalizedSlider; // 0 slider = 1, 100 slider = 0
                const calculatedMax = minZoom * Math.pow(maxZoom / minZoom, reversedNormalized);

                chartYAxisScaleMultiplier = sliderValue;
                userControllingZoom = true;

                // Only lock zoom if slider is above 10%
                // At 0-10%, enable auto-zoom to follow highest line
                if (sliderValue <= 10) {
                    userHasSetZoom = false;
                    userLockedChartMax = null;
                } else {
                    userHasSetZoom = true; // User has manually set zoom - disable zoom-out
                    userLockedChartMax = calculatedMax;
                }

                // Display zoom level: 1-10% shows as "FIXED", 0% and 11-100% show percentage
                if (sliderValue > 0 && sliderValue <= 10) {
                    yAxisScaleValue.innerText = 'FIXED';
                } else {
                    const zoomPercentage = Math.round(sliderValue);
                    yAxisScaleValue.innerText = zoomPercentage + '%';
                }

                // Update chart during drag for real-time feedback
                if (nwChart) {
                    if (sliderValue <= 10) {
                        // At 0-10% zoom, remove the locked max and let it auto-scale
                        nwChart.options.scales.y.max = undefined;
                    } else {
                        // Above 10% zoom, set the calculated max
                        nwChart.options.scales.y.max = calculatedMax;
                    }
                    nwChart.options.scales.y.min = 0;
                    nwChart.update('none');
                }
            });

            // Maintain zoom when user releases the slider
            yAxisScaleSlider.addEventListener('change', () => {
                userControllingZoom = false;
                // Ensure the locked value persists
                if (nwChart && userHasSetZoom && userLockedChartMax !== null) {
                    nwChart.options.scales.y.min = 0;
                    nwChart.options.scales.y.max = userLockedChartMax;
                    nwChart.update('none');
                }
            });
        }

        // Master chart update loop - renders every 500ms, collects new data every 1500ms with interpolation
        let updateCount = 0;
        let lastTrimTime = Date.now();
        setInterval(() => {
            if (!nwChart) {
                // Try initializing again if still not ready
                if (!chartInitialized) {
                    tryInitChart();
                }
                return;
            }

            const timeRangeSlider = document.getElementById('chart-time-slider');
            const timeRangePercent = timeRangeSlider ? parseInt(timeRangeSlider.value) : 100;
            const now = Date.now();

            // Calculate net worth every interval (used for charts and markers)
            const netWorth = (btcBalance * btcPrice) + (ethBalance * ethPrice) + (dogeBalance * dogePrice);

            // Recalculate power usage every frame for accurate chart rendering
            calculateTotalPowerUsed();

            // Track current power usage continuously
            const timeDeltaSeconds = (now - lastHashRateChartUpdateTime) / 1000;
            cumulativePowerUsed += totalPowerUsed * timeDeltaSeconds;

            // Update max capacity to available power supply
            const availablePower = getTotalPowerAvailableWithBonus();
            if (availablePower > maxPowerCapacity) {
                maxPowerCapacity = availablePower;
            }

            // Determine color based on current percentage at time of recording
            const currentPercentage = (totalPowerUsed / availablePower) * 100;
            const color = currentPercentage > 50 ? '#ff3333' : '#00ff88';

            // Update power tracking for continuous rendering
            lastHashRateChartUpdateTime = now;

            // Power chart updates every loop for smooth rendering (data already collected above in mining loop)
            if (powerChartHistory.length > 0 && hashRateChartTimestamps.length > 0) {
                // Update the last power data point to reflect current usage
                powerChartHistory[powerChartHistory.length - 1] = currentPercentage;
                powerChartColors[powerChartColors.length - 1] = color;
            }

            // Trim chart data intelligently: remove points from BETWEEN old data (not edges)
            // This keeps the full time span visible while reducing point density as you play longer
            if (now - lastTrimTime >= 120000) {
                lastTrimTime = now;
                const maxChartPoints = 7600; // Allow up to 63+ minutes at 500ms intervals before decimating

                if (chartTimestamps.length > maxChartPoints) {
                    // Uniform decimation: trim evenly across ALL data points
                    // This makes the entire line progressively sparser as you play longer
                    const decimationFactor = Math.ceil(chartTimestamps.length / Math.floor(maxChartPoints * 0.9));

                    let newTimestamps = [];
                    let newChartHistory = [];
                    let newBtcHistory = [];
                    let newEthHistory = [];
                    let newDogeHistory = [];
                    let newCashHistory = [];

                    // ALWAYS keep the first point (game start at $0)
                    newTimestamps.push(chartTimestamps[0]);
                    newChartHistory.push(chartHistory[0]);
                    newBtcHistory.push(btcChartHistory[0]);
                    newEthHistory.push(ethChartHistory[0]);
                    newDogeHistory.push(dogeChartHistory[0]);
                    newCashHistory.push(cashChartHistory[0]);

                    // Keep every Nth point starting from index 1 (skip the first since we already added it)
                    for (let i = decimationFactor; i < chartTimestamps.length; i += decimationFactor) {
                        newTimestamps.push(chartTimestamps[i]);
                        newChartHistory.push(chartHistory[i]);
                        newBtcHistory.push(btcChartHistory[i]);
                        newEthHistory.push(ethChartHistory[i]);
                        newDogeHistory.push(dogeChartHistory[i]);
                        newCashHistory.push(cashChartHistory[i]);
                    }

                    // Always keep the last point (current moment)
                    if (newTimestamps[newTimestamps.length - 1] !== chartTimestamps[chartTimestamps.length - 1]) {
                        newTimestamps.push(chartTimestamps[chartTimestamps.length - 1]);
                        newChartHistory.push(chartHistory[chartHistory.length - 1]);
                        newBtcHistory.push(btcChartHistory[btcChartHistory.length - 1]);
                        newEthHistory.push(ethChartHistory[ethChartHistory.length - 1]);
                        newDogeHistory.push(dogeChartHistory[dogeChartHistory.length - 1]);
                        newCashHistory.push(cashChartHistory[cashChartHistory.length - 1]);
                    }

                    // Replace arrays with decimated versions
                    chartTimestamps = newTimestamps;
                    chartHistory = newChartHistory;
                    btcChartHistory = newBtcHistory;
                    ethChartHistory = newEthHistory;
                    dogeChartHistory = newDogeHistory;
                    cashChartHistory = newCashHistory;

                    // Also trim hash rate arrays uniformly
                    if (hashRateChartTimestamps.length > maxChartPoints) {
                        const hashDecFactor = Math.ceil(hashRateChartTimestamps.length / Math.floor(maxChartPoints * 0.9));

                        let newHashTimestamps = [];
                        let newHashRate = [];
                        let newEthHashRate = [];
                        let newDogeHashRate = [];

                        // ALWAYS keep the first point
                        newHashTimestamps.push(hashRateChartTimestamps[0]);
                        newHashRate.push(hashRateChartHistory[0]);
                        newEthHashRate.push(ethHashRateChartHistory[0]);
                        newDogeHashRate.push(dogeHashRateChartHistory[0]);

                        // Keep every Nth point starting from hashDecFactor
                        for (let i = hashDecFactor; i < hashRateChartTimestamps.length; i += hashDecFactor) {
                            newHashTimestamps.push(hashRateChartTimestamps[i]);
                            newHashRate.push(hashRateChartHistory[i]);
                            newEthHashRate.push(ethHashRateChartHistory[i]);
                            newDogeHashRate.push(dogeHashRateChartHistory[i]);
                        }

                        // Always keep the last point
                        if (newHashTimestamps[newHashTimestamps.length - 1] !== hashRateChartTimestamps[hashRateChartTimestamps.length - 1]) {
                            newHashTimestamps.push(hashRateChartTimestamps[hashRateChartTimestamps.length - 1]);
                            newHashRate.push(hashRateChartHistory[hashRateChartHistory.length - 1]);
                            newEthHashRate.push(ethHashRateChartHistory[ethHashRateChartHistory.length - 1]);
                            newDogeHashRate.push(dogeHashRateChartHistory[dogeHashRateChartHistory.length - 1]);
                        }

                        hashRateChartTimestamps = newHashTimestamps;
                        hashRateChartHistory = newHashRate;
                        ethHashRateChartHistory = newEthHashRate;
                        dogeHashRateChartHistory = newDogeHashRate;
                    }
                }
            }

            // Add a marker every minute (60 seconds)
            if (now - lastMarkerTime >= 60000) {
                chartMarkers.push({
                    index: chartHistory.length - 1,
                    time: now,
                    value: netWorth
                });
                lastMarkerTime = now;

                // Keep only 50 markers on chart
                if (chartMarkers.length > 50) {
                    chartMarkers.splice(20, 10);
                }
            }

            // Collect chart data every loop (loop runs every 1000ms)
            const wasEmpty = chartHistory.length === 0; // Track if this is first data point
            chartHistory.push(netWorth);
            btcChartHistory.push(btcBalance * btcPrice);
            ethChartHistory.push(ethBalance * ethPrice);
            dogeChartHistory.push(dogeBalance * dogePrice);
            cashChartHistory.push(dollarBalance);
            chartTimestamps.push({ time: now, value: netWorth, cash: dollarBalance, btc: btcBalance, eth: ethBalance, doge: dogeBalance });
            hashRateChartHistory.push(btcPerSec * totalMiningMultiplier);
            ethHashRateChartHistory.push(ethPerSec * totalMiningMultiplier);
            dogeHashRateChartHistory.push(dogePerSec * totalMiningMultiplier);

            // Update net worth chart - show ALL stored data (already trimmed for performance)
            // Chart always shows from $0 (start of game) to current
            // Storage arrays are trimmed progressively to keep ~5k points max, preventing lag
            // Update immediately on first data point, then every 1000ms to prevent flickering on far right
            const timeSinceLastChartUpdate = now - lastChartUpdateTime;
            if ((wasEmpty || timeSinceLastChartUpdate >= 1000) && nwChart && chartTimestamps.length > 0) {
                lastChartUpdateTime = now;

                // Display all data we have (storage arrays are already managed for performance)
                const displayTimestamps = chartTimestamps.map(ts => ts.time);

                // Update chart with data - create fresh arrays for Chart.js
                nwChart.data.labels = displayTimestamps.map((ts) =>
                    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                );
                nwChart.data.datasets[0].data = [...btcChartHistory];
                nwChart.data.datasets[1].data = [...ethChartHistory];
                nwChart.data.datasets[2].data = [...dogeChartHistory];
                nwChart.data.datasets[3].data = [...cashChartHistory];

                // Force preserve zoom settings if user has set zoom
                // Do this BEFORE updating chart data to prevent Chart.js auto-scaling
                if (userHasSetZoom && userLockedChartMax !== null) {
                    nwChart.options.scales.y.min = 0;
                    nwChart.options.scales.y.max = userLockedChartMax;
                }

                // Smart Y-axis scaling: only recalculate when data exceeds current max (not every 500ms)
                // Skip scaling updates if user is actively controlling the zoom
                if (!userControllingZoom && (btcChartHistory.length > 0 || ethChartHistory.length > 0 || dogeChartHistory.length > 0 || cashChartHistory.length > 0)) {
                    // Find current max value (just the latest values, not the entire history)
                    let currentMax = 0;
                    if (btcChartHistory.length > 0) currentMax = Math.max(currentMax, btcChartHistory[btcChartHistory.length - 1]);
                    if (ethChartHistory.length > 0) currentMax = Math.max(currentMax, ethChartHistory[ethChartHistory.length - 1]);
                    if (dogeChartHistory.length > 0) currentMax = Math.max(currentMax, dogeChartHistory[dogeChartHistory.length - 1]);
                    if (cashChartHistory.length > 0) currentMax = Math.max(currentMax, cashChartHistory[cashChartHistory.length - 1]);

                    // Only recalculate scale if current value exceeds 90% of current max (data is growing into limit)
                    const currentScale = nwChart.options.scales.y.max || 1;

                    if (userHasSetZoom && userLockedChartMax !== null) {
                        // User has manually set zoom: keep zoom level completely fixed
                        // Data can go off-screen if it exceeds the zoom level - that's intentional
                        // No expansion, no adjustment, just hold the line
                    } else if (!userHasSetZoom) {
                        // Auto-scaling when user hasn't manually set zoom (slider at 0-10%)
                        // At 0%, highest line touches top; at 10%, still auto-zoom but with slight padding
                        let yAxisMax;
                        if (chartYAxisScaleMultiplier === 0) {
                            // At exactly 0%, line touches the top
                            yAxisMax = currentMax;
                        } else {
                            // At 1-10%, add small padding as you zoom in
                            const paddingPercent = (10 - chartYAxisScaleMultiplier) / 100; // Less padding as zoom increases
                            yAxisMax = currentMax * (1 + paddingPercent);
                        }

                        nwChart.options.scales.y.min = 0;
                        nwChart.options.scales.y.max = yAxisMax;
                    }
                }

                nwChart.update('none');
            }

            // Update hash rate chart
            if (hashRateChartInstance && hashRateChartHistory.length > 0 && hashRateChartTimestamps.length > 0) {
                // Ensure all data arrays are the same length
                const dataLength = Math.min(
                    hashRateChartHistory.length,
                    ethHashRateChartHistory.length,
                    dogeHashRateChartHistory.length,
                    hashRateChartTimestamps.length
                );

                // Calculate start index based on filtered data length, not raw array length
                // Ensure minimum of 3 data points even for very small percentages
                const minHashPoints = Math.max(3, Math.ceil(dataLength * (timeRangePercent / 100)));
                const hashRateStartIndex = Math.max(0, dataLength - minHashPoints);
                const sliceLength = Math.max(3, dataLength - hashRateStartIndex);

                // Scale hash rates by USD value per second
                const btcUsdPerSec = hashRateChartHistory.slice(hashRateStartIndex, hashRateStartIndex + sliceLength).map(v => v * btcPrice);
                const ethUsdPerSec = ethHashRateChartHistory.slice(hashRateStartIndex, hashRateStartIndex + sliceLength).map(v => v * ethPrice);
                const dogeUsdPerSec = dogeHashRateChartHistory.slice(hashRateStartIndex, hashRateStartIndex + sliceLength).map(v => v * dogePrice);

                const hashLabels = hashRateChartTimestamps.slice(hashRateStartIndex, hashRateStartIndex + sliceLength).map((ts) => {
                    const time = ts?.time || Date.now();
                    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                });

                hashRateChartInstance.data.labels = hashLabels;
                hashRateChartInstance.data.datasets[0].data = btcUsdPerSec;
                hashRateChartInstance.data.datasets[1].data = ethUsdPerSec;
                hashRateChartInstance.data.datasets[2].data = dogeUsdPerSec;
                hashRateChartInstance.update('none');
            }

            // Power chart update removed

            // Update chart date tracker
            updateChartDateTracker();

            // Trigger balance display update check (will only update if 1000ms throttle has elapsed)
            updateUI();

            updateCount++;
            if (updateCount % 20 === 0) {
                console.log('Chart updated:', updateCount, 'times. Current data points:', chartHistory.length);
            }
        }, 1000);

        // Add mouse tracking for marker hover detection
        const nwChartCanvas = document.getElementById('nwChart');
        if (nwChartCanvas) {
            nwChartCanvas.addEventListener('mousemove', (e) => {
                updateChartDateTracker(e);
            });

            nwChartCanvas.addEventListener('mouseleave', () => {
                // Clear marker hover when mouse leaves
                hoveredMarkerIndex = -1;
                updateChartDateTracker();
            });
        }

        // Add chart interval button functionality
        const timeRangeLabel = document.getElementById('chart-time-label');
        const intervalButtons = document.querySelectorAll('.chart-interval-btn');

        if (intervalButtons.length > 0) {
            intervalButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const interval = parseFloat(e.target.getAttribute('data-interval'));

                    // Update chart interval
                    chartIntervalMinutes = interval;

                    // Update button styles
                    intervalButtons.forEach(b => {
                        b.style.background = 'rgba(100,100,100,0.2)';
                        b.style.borderColor = '#666';
                        b.style.color = '#999';
                    });
                    e.target.style.background = 'rgba(0,255,136,0.2)';
                    e.target.style.borderColor = '#00ff88';
                    e.target.style.color = '#00ff88';

                    // Update label - support sub-minute intervals
                    const labels = {
                        0.0167: '1s',
                        0.0833: '5s',
                        0.5: '30s',
                        1: '1m',
                        5: '5m',
                        10: '10m',
                        30: '30m',
                        60: '1h',
                        240: '4h',
                        1440: '1d'
                    };
                    timeRangeLabel.textContent = labels[interval] + ' interval';

                    // Trigger chart update
                    if (nwChart) {
                        nwChart.update('none');
                    }
                });
            });
        }

        // Keep old slider code for backwards compatibility (hidden)
        const timeRangeSlider = document.getElementById('chart-time-slider');
        let sliderUpdateTimeout;

        if (false && timeRangeSlider) {
            timeRangeSlider.addEventListener('input', (e) => {
                const sliderValue = parseInt(e.target.value);
                const VIEWPORT_SIZE = 10; // Always show exactly 10 minute window

                // Calculate the actual maximum slider value based on oldest data available
                let maxSliderValue = 100; // Default max
                if (chartTimestamps.length > 0) {
                    const oldestTimestamp = chartTimestamps[0].time;
                    const ageMs = Date.now() - oldestTimestamp;
                    const ageMinutes = Math.ceil(ageMs / (60 * 1000));
                    // Max slider = oldest data age in minutes
                    maxSliderValue = Math.max(VIEWPORT_SIZE, ageMinutes);

                    // Update slider max attribute
                    if (parseInt(timeRangeSlider.max) !== maxSliderValue) {
                        timeRangeSlider.max = maxSliderValue;
                    }
                }

                // Pan logic (TradingView style):
                // sliderValue = how many minutes ago the RIGHT edge of the viewport is
                // Viewport is always 10 minutes wide
                // At slider max (left): RIGHT edge is at oldest data, showing oldest 10 mins
                // At slider 10 (right): RIGHT edge is at now, showing last 10 mins
                const viewportEndMinutesAgo = Math.max(VIEWPORT_SIZE, sliderValue);

                // Generate label showing what time range is visible
                let label;
                const startMinutesAgo = viewportEndMinutesAgo + VIEWPORT_SIZE;
                if (viewportEndMinutesAgo === VIEWPORT_SIZE) {
                    label = 'Last 10 Minutes';
                } else if (startMinutesAgo < 60) {
                    label = `${Math.round(startMinutesAgo)}-${Math.round(viewportEndMinutesAgo)} min ago`;
                } else {
                    const startHours = (startMinutesAgo / 60).toFixed(1);
                    const endHours = (viewportEndMinutesAgo / 60).toFixed(1);
                    label = `${startHours}-${endHours}h ago`;
                }

                // Update label immediately
                timeRangeLabel.textContent = label;

                // Debounce chart update to avoid lag while dragging
                clearTimeout(sliderUpdateTimeout);
                sliderUpdateTimeout = setTimeout(() => {
                    if (nwChart && chartHistory.length > 0) {
                        // TradingView pan: show 10-minute window ending at viewportEndMinutesAgo
                        const now = Date.now();
                        const endTimeMs = now - (viewportEndMinutesAgo * 60 * 1000);
                        const startTimeMs = endTimeMs - (10 * 60 * 1000); // 10 minute window

                        // Find indices for the 10-minute window
                        let startIndex = 0;
                        let endIndex = chartTimestamps.length - 1;

                        for (let i = 0; i < chartTimestamps.length; i++) {
                            if (chartTimestamps[i].time >= startTimeMs) {
                                startIndex = i;
                                break;
                            }
                        }

                        for (let i = chartTimestamps.length - 1; i >= 0; i--) {
                            if (chartTimestamps[i].time <= endTimeMs) {
                                endIndex = i;
                                break;
                            }
                        }

                        // Ensure we have valid slice
                        const sliceLength = Math.max(1, endIndex - startIndex + 1);

                        nwChart.data.labels = chartTimestamps.slice(startIndex, startIndex + sliceLength).map((ts) =>
                            new Date(ts.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        );
                        const slicedBTC = btcChartHistory.slice(startIndex, startIndex + sliceLength); // BTC USD
                        const slicedETH = ethChartHistory.slice(startIndex, startIndex + sliceLength); // ETH USD
                        const slicedDOGE = dogeChartHistory.slice(startIndex, startIndex + sliceLength); // DOGE USD
                        const slicedCASH = cashChartHistory.slice(startIndex, startIndex + sliceLength); // CASH USD

                        nwChart.data.datasets[0].data = slicedBTC;
                        nwChart.data.datasets[1].data = slicedETH;
                        nwChart.data.datasets[2].data = slicedDOGE;
                        nwChart.data.datasets[3].data = slicedCASH;

                        // Update Y-axis scale for slider changes
                        if (slicedBTC.length > 0 || slicedETH.length > 0 || slicedDOGE.length > 0 || slicedCASH.length > 0) {
                            const allValues = [
                                ...slicedBTC,
                                ...slicedETH,
                                ...slicedDOGE,
                                ...slicedCASH
                            ].filter(v => v !== undefined && v !== null);

                            if (allValues.length > 0) {
                                const minValue = Math.min(...allValues, 0);
                                const maxValue = Math.max(...allValues, 0);
                                const range = maxValue - minValue;

                                const padding = range < 1 ? range * 0.2 : range * 0.05;
                                const paddingAmount = Math.max(padding, maxValue * 0.1);

                                nwChart.options.scales.y.min = 0;
                                nwChart.options.scales.y.max = maxValue + paddingAmount;
                            }
                        }

                        nwChart.update('none');
                    }

                    // Update hash rate chart (always visible)
                    if (hashRateChartInstance && hashRateChartHistory.length > 0) {
                        // Ensure all data arrays are the same length
                        const dataLength = Math.min(
                            hashRateChartHistory.length,
                            ethHashRateChartHistory.length,
                            dogeHashRateChartHistory.length,
                            hashRateChartTimestamps.length
                        );

                        // Calculate start index based on actual data length
                        const startIndex = Math.max(0, dataLength - Math.max(1, Math.ceil(dataLength * percentRatio)));
                        const sliceLength = Math.max(1, dataLength - startIndex);

                        // Scale hash rates by USD value per second
                        const btcUsdPerSec = hashRateChartHistory.slice(startIndex, startIndex + sliceLength).map(v => v * btcPrice);
                        const ethUsdPerSec = ethHashRateChartHistory.slice(startIndex, startIndex + sliceLength).map(v => v * ethPrice);
                        const dogeUsdPerSec = dogeHashRateChartHistory.slice(startIndex, startIndex + sliceLength).map(v => v * dogePrice);

                        const labels = hashRateChartTimestamps.slice(startIndex, startIndex + sliceLength).map((ts) => {
                            const time = ts?.time || Date.now();
                            return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        });

                        hashRateChartInstance.data.labels = labels;
                        hashRateChartInstance.data.datasets[0].data = btcUsdPerSec;
                        hashRateChartInstance.data.datasets[1].data = ethUsdPerSec;
                        hashRateChartInstance.data.datasets[2].data = dogeUsdPerSec;
                        hashRateChartInstance.update('none');
                    }

                    // Update power chart - use SAME start index as hash rate chart for identical timestamps
                    if (powerChartInstance && hashRateChartTimestamps.length > 0) {
                        // Use the exact same filtering as hash rate chart
                        if (hashRateChartInstance && hashRateChartInstance.data.labels && hashRateChartInstance.data.labels.length > 0) {
                            const hashChartDataCount = hashRateChartInstance.data.labels.length;
                            const startIndex = Math.max(0, hashRateChartTimestamps.length - hashChartDataCount);
                            const sliceLength = hashChartDataCount;

                            const powerDataPercent = powerChartHistory.slice(startIndex, startIndex + sliceLength);
                            const labels = hashRateChartTimestamps.slice(startIndex, startIndex + sliceLength).map((ts) => {
                                const time = ts?.time || Date.now();
                                return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            });

                            powerChartInstance.data.labels = labels;
                            powerChartInstance.data.datasets[0].data = powerDataPercent;
                            powerChartInstance._powerChartColors = powerChartColors.slice(startIndex, startIndex + sliceLength);
                            powerChartInstance.update('none');
                        }
                    }
                }, 200); // Update 200ms after user stops dragging
            });
        }

        // Chart swap function (mobile only)
        window.swapChartView = function() {
            // Only swap on mobile
            if (window.innerWidth <= 1200) {
                const nwContainer = document.getElementById('nw-chart-container');
                const hrContainer = document.getElementById('hr-chart-container');
                const swapBtn = document.getElementById('swap-chart-btn');

                if (currentChartView === 'networth') {
                    // Switch to hash rate view
                    currentChartView = 'hashrate';
                    nwContainer.style.cssText = 'display: none !important;';
                    hrContainer.style.cssText = 'display: block !important;';
                    swapBtn.textContent = 'SWAP CHARTS (NET WORTH)';

                    // Initialize hash rate chart if not already done
                    setTimeout(() => {
                        if (!hashRateChartInstance) {
                            initializeHashRateChart();
                        } else {
                            hashRateChartInstance.resize();
                        }
                    }, 50);
                } else {
                    // Switch to net worth view
                    currentChartView = 'networth';
                    nwContainer.style.cssText = 'display: block !important;';
                    hrContainer.style.cssText = 'display: none !important;';
                    swapBtn.textContent = 'SWAP CHARTS';

                    // Update the net worth chart
                    setTimeout(() => {
                        if (nwChart) {
                            nwChart.resize();
                        }
                    }, 50);
                }
            }
        };

        // Initialize hash rate chart
        window.initializeHashRateChart = function() {
            try {
                const canvasEl = document.getElementById('hashRateChart');
                if (!canvasEl) {
                    console.warn('Hash rate chart canvas not found in DOM yet');
                    return false;
                }

                const ctx = canvasEl.getContext('2d');
                if (!ctx) {
                    console.warn('Could not get canvas context for hash rate chart');
                    return false;
                }

                if (hashRateChartInstance) {
                    hashRateChartInstance.destroy();
                }

                // Ensure we have data - bootstrap from existing chart history if available
                if (hashRateChartHistory.length === 0) {
                    if (chartHistory.length > 0 && chartTimestamps.length > 0) {
                        // Copy existing data from main chart
                        for (let i = 0; i < chartHistory.length; i++) {
                            hashRateChartHistory.push(btcPerSec * totalMiningMultiplier);
                            ethHashRateChartHistory.push(ethPerSec * totalMiningMultiplier);
                            dogeHashRateChartHistory.push(dogePerSec * totalMiningMultiplier);
                            // Store as percentage for consistency with other data collection
                            const availablePower = getTotalPowerAvailableWithBonus();
                            const powerPercentage = availablePower > 0 ? (totalPowerUsed / availablePower) * 100 : 0;
                            powerChartHistory.push(powerPercentage);
                            const color = powerPercentage > 50 ? '#ff3333' : '#00ff88';
                            powerChartColors.push(color);
                            hashRateChartTimestamps.push(chartTimestamps[i]);
                        }
                    } else {
                        // If no data yet, create one initial point
                        hashRateChartHistory.push(btcPerSec * totalMiningMultiplier);
                        ethHashRateChartHistory.push(ethPerSec * totalMiningMultiplier);
                        dogeHashRateChartHistory.push(dogePerSec * totalMiningMultiplier);
                        // Store as percentage for consistency with other data collection
                        const availablePower = getTotalPowerAvailableWithBonus();
                        const powerPercentage = availablePower > 0 ? (totalPowerUsed / availablePower) * 100 : 0;
                        powerChartHistory.push(powerPercentage);
                        const color = powerPercentage > 50 ? '#ff3333' : '#00ff88';
                        powerChartColors.push(color);
                        hashRateChartTimestamps.push({ time: Date.now() });
                    }
                }

                const timeRangeSlider = document.getElementById('chart-time-slider');
            const timeRangePercent = timeRangeSlider ? parseInt(timeRangeSlider.value) : 100;

            // Ensure all data arrays are the same length
            const dataLength = Math.min(
                hashRateChartHistory.length,
                ethHashRateChartHistory.length,
                dogeHashRateChartHistory.length,
                hashRateChartTimestamps.length
            );

            // Calculate start index based on filtered data length, not raw array length
            const startIndex = Math.max(0, dataLength - Math.max(1, Math.ceil(dataLength * (timeRangePercent / 100))));
            const sliceLength = Math.max(1, dataLength - startIndex);

            // Scale hash rates by their USD value per second
            const btcUsdPerSec = hashRateChartHistory.slice(startIndex, startIndex + sliceLength).map(v => v * btcPrice);
            const ethUsdPerSec = ethHashRateChartHistory.slice(startIndex, startIndex + sliceLength).map(v => v * ethPrice);
            const dogeUsdPerSec = dogeHashRateChartHistory.slice(startIndex, startIndex + sliceLength).map(v => v * dogePrice);

            const labels = hashRateChartTimestamps.slice(startIndex, startIndex + sliceLength).map((ts) => {
                const time = ts?.time || Date.now();
                return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            });

            hashRateChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'BTC',
                            data: btcUsdPerSec,
                            borderColor: '#f7931a',
                            backgroundColor: 'rgba(247, 147, 26, 0.1)',
                            pointBackgroundColor: '#f7931a',
                            pointBorderColor: '#f7931a',
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            yAxisID: 'y',
                            tension: 0,
                            fill: false,
                            borderWidth: 2
                        },
                        {
                            label: 'ETH',
                            data: ethUsdPerSec,
                            borderColor: '#627eea',
                            backgroundColor: 'rgba(98, 126, 234, 0.1)',
                            pointBackgroundColor: '#627eea',
                            pointBorderColor: '#627eea',
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            yAxisID: 'y',
                            tension: 0,
                            fill: false,
                            borderWidth: 2
                        },
                        {
                            label: 'DOGE',
                            data: dogeUsdPerSec,
                            borderColor: '#c2a633',
                            backgroundColor: 'rgba(194, 166, 51, 0.1)',
                            pointBackgroundColor: '#c2a633',
                            pointBorderColor: '#c2a633',
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            yAxisID: 'y',
                            tension: 0,
                            fill: false,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    stacked: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: '#999',
                                font: { size: window.innerWidth <= 448 ? 6 : (window.innerWidth <= 932 ? 8 : 12) }
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#00ff88',
                            bodyColor: '#ffffff',
                            borderColor: '#00ff88',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    if (context.length > 0) {
                                        const index = context[0].dataIndex;
                                        return hashRateChartTimestamps[index] ?
                                            new Date(hashRateChartTimestamps[index].time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                                            '';
                                    }
                                    return '';
                                },
                                labelColor: function(context) {
                                    return {
                                        borderColor: context.dataset.borderColor,
                                        backgroundColor: context.dataset.borderColor,
                                        borderWidth: 0,
                                        borderRadius: 0
                                    };
                                },
                                label: function(context) {
                                    const value = parseFloat(context.parsed.y) || 0;
                                    const formatted = '$' + abbreviateNumber(value, 2);
                                    return context.dataset.label + ': ' + formatted;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: { color: '#999', font: { size: 11 }, maxTicksLimit: 6 }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            beginAtZero: false,
                            ticks: {
                                color: '#999',
                                font: { size: 10 },
                                callback: function(value) {
                                    return formatCurrencyAbbreviated(value, 1);
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                            title: { display: true, text: 'USD Value per Second', color: '#999' }
                        }
                    }
                }
            });

            // Both charts are always visible now, no need to hide

            console.log('✅ Hash rate chart initialized successfully');
            return true;
        } catch (error) {
            console.error('Error creating hash rate chart:', error);
            return false;
        }
        };

        // Initialize power usage chart
        window.initializePowerChart = function() {
            try {
                const canvasEl = document.getElementById('powerChart');
                if (!canvasEl) {
                    console.warn('Power chart canvas not found in DOM yet');
                    return false;
                }

                const ctx = canvasEl.getContext('2d');
                if (!ctx) {
                    console.warn('Could not get canvas context for power chart');
                    return false;
                }

                if (powerChartInstance) {
                    powerChartInstance.destroy();
                }

                // If we have no power data yet, bootstrap from current values
                if (powerChartHistory.length === 0) {
                    // Initialize with current power percentage
                    const availablePower = getTotalPowerAvailableWithBonus();
                    const currentPercentage = (totalPowerUsed / availablePower) * 100;
                    const color = currentPercentage > 50 ? '#ff3333' : '#00ff88';

                    // Bootstrap with at least some initial data points
                    const dataPointsNeeded = Math.max(hashRateChartTimestamps.length, 10);
                    for (let i = 0; i < dataPointsNeeded; i++) {
                        powerChartHistory.push(currentPercentage);
                        powerChartColors.push(color);
                    }
                }

                if (powerChartHistory.length === 0) {
                    return false; // No data yet
                }

                // Use SAME filtering as hashrate chart for identical time ranges
                // If hashrate chart exists and has data, use its exact data point count
                let startIndex = 0;
                let sliceLength = Math.max(powerChartHistory.length, 1); // Use all available power data

                if (hashRateChartInstance && hashRateChartInstance.data.labels && hashRateChartInstance.data.labels.length > 0) {
                    // Use the EXACT same number of data points as hash rate chart
                    const hashChartDataCount = hashRateChartInstance.data.labels.length;
                    startIndex = Math.max(0, powerChartHistory.length - hashChartDataCount);
                    sliceLength = Math.min(hashChartDataCount, powerChartHistory.length - startIndex);
                }

                const powerData = powerChartHistory.slice(startIndex, startIndex + sliceLength);
                if (powerData.length === 0) {
                    return false;
                }

                // powerChartHistory already contains percentages (0-100%), so use them directly
                const powerDataPercent = powerData;

                // Create time labels - use same slice length for consistency
                const labels = [];
                const timestampsSlice = hashRateChartTimestamps.slice(startIndex, startIndex + sliceLength);

                // If we have enough timestamps, use them; otherwise create placeholder labels
                if (timestampsSlice.length >= sliceLength) {
                    for (let i = 0; i < sliceLength; i++) {
                        const ts = timestampsSlice[i];
                        const time = ts?.time || Date.now();
                        labels.push(new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
                    }
                } else {
                    // Create placeholder labels when timestamps aren't available
                    for (let i = 0; i < sliceLength; i++) {
                        labels.push('');
                    }
                }

                console.log('🔋 Creating power chart with data:', {
                    labels: labels.length,
                    powerDataPercent: powerDataPercent.length,
                    dataPoints: powerDataPercent.slice(0, 5),
                    startIndex: startIndex,
                    sliceLength: sliceLength,
                    powerChartHistoryLength: powerChartHistory.length,
                    hashRateTimestampsLength: hashRateChartTimestamps.length,
                    totalPowerUsed: totalPowerUsed,
                    availablePower: getTotalPowerAvailableWithBonus()
                });

                powerChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Power Usage',
                                data: powerDataPercent,
                                borderColor: '#00ff88',
                                backgroundColor: 'rgba(0, 0, 0, 0)',
                                pointRadius: 0,
                                pointHoverRadius: 5,
                                borderWidth: 2,
                                fill: false,
                                stepped: 'middle',
                                spanGaps: true,
                                segment: {
                                    borderColor: function(context) {
                                        const p0DataIndex = context.p0DataIndex;
                                        const p1DataIndex = context.p1DataIndex;

                                        // Get the data values for this segment
                                        if (context.dataset && context.dataset.data && p0DataIndex !== undefined && p1DataIndex !== undefined) {
                                            const value0 = context.dataset.data[p0DataIndex];
                                            const value1 = context.dataset.data[p1DataIndex];

                                            // If either point is above 50%, the segment is red
                                            // This keeps the line red from when it crosses 50% until it drops back below 50%
                                            return (value0 > 50 || value1 > 50) ? '#ff3333' : '#00ff88';
                                        }
                                        return '#00ff88';
                                    }
                                }
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                top: 5,
                                bottom: 5,
                                left: 0,
                                right: 0
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                padding: 10,
                                titleFont: { size: 12, weight: 'bold' },
                                bodyFont: { size: 11 },
                                borderColor: '#00ff88',
                                borderWidth: 1,
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        const percentValue = context.parsed.y;
                                        return percentValue.toFixed(1) + '%';
                                    }
                                }
                            }
                        },
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        scales: {
                            x: {
                                display: true,
                                grid: {
                                    display: false,
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#999',
                                    font: { size: 11 },
                                    maxTicksLimit: 6
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(255,255,255,0.05)',
                                    drawBorder: false
                                },
                                min: 0,
                                max: 100,
                                ticks: {
                                    color: '#999',
                                    font: { size: 10 },
                                    stepSize: 25,
                                    callback: function(value) {
                                        return value.toFixed(0) + '%';
                                    }
                                }
                            }
                        }
                    }
                });

                // Store power data and pre-recorded colors for segment coloring
                powerChartInstance._powerDataPercent = powerDataPercent;
                powerChartInstance._powerData = powerData;
                // Store the colors that were recorded at the time of each data point
                powerChartInstance._powerChartColors = powerChartColors.slice(startIndex, startIndex + powerDataPercent.length);

                console.log('✅ Power chart initialized successfully', {
                    instance: !!powerChartInstance,
                    dataLength: powerDataPercent.length,
                    minValue: Math.min(...powerDataPercent),
                    maxValue: Math.max(...powerDataPercent)
                });
                return true;
            } catch (error) {
                console.error('Error creating power chart:', error);
                return false;
            }
        };

        // Auto-save every 1.5 seconds
        setInterval(saveGame, 1500);

        // Check tutorial progress every 500ms
        setInterval(() => {
            if (typeof checkTutorialProgress === 'function') {
                checkTutorialProgress();
            }

            // Check hacking notification timing
            if (hackingNextNotificationTime > 0 && Date.now() >= hackingNextNotificationTime) {
                hackingNextNotificationTime = 0; // Reset
                // Only display notification if lifetime earnings >= $10,000
                if (lifetimeEarnings >= 10000) {
                    displayHackingNotification();
                }
            }

            // Update hacking stats if tab is visible
            if (document.getElementById('hacking-tab') && document.getElementById('hacking-tab').classList.contains('active')) {
                updateHackingStats();
            }

            // Always update cooldown displays (even when tab is not visible)
            updateHackingCooldownDisplays();
            updateWhackCooldownDisplays();
            updatePacketCooldownDisplays();

            // Update minigame card lock states
            updateMinigameCardLocks();
        }, 1000);

        // Start price swings: separate timing for each crypto
        // Only start if not already running (prevents multiple loops on refresh)
        if (!priceSwingsStarted) {
            priceSwingsStarted = true;
            // BTC swings (start immediately)
            btcTinySwing();       // ±0.05%-0.1% every 2 seconds
            btcFrequentSwing();   // ±0.1%-1% every 2-60 seconds
            btcBigSwing();        // ±2.5%-10% every 5-10 minutes

            // ETH swings (start with 700ms delay to stagger from BTC)
            setTimeout(ethTinySwing, 700);       // ±0.05%-0.1% every 2.3 seconds
            setTimeout(ethFrequentSwing, 1200);  // ±0.1%-1.2% every 3-75 seconds
            setTimeout(ethBigSwing, 1500);       // ±2.5%-12% every 4-12 minutes

            // DOGE swings (start with 1400ms delay to stagger from BTC and ETH)
            setTimeout(dogeTinySwing, 1400);     // ±0.05%-0.15% every 2.7 seconds
            setTimeout(dogeFrequentSwing, 2100); // ±0.15%-1.8% every 2-45 seconds
            setTimeout(dogeBigSwing, 2800);      // ±3%-18% every 3-8 minutes
        }
    }

    // Save game when page becomes hidden (mobile browser close, tab switch, etc.)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('Page hidden - saving game state');
            try {
                saveGame();
                console.log('Save successful on visibility change');
            } catch (e) {
                console.error('Save failed on visibility change:', e);
            }
        } else {
            console.log('Page visible - checking saved data exists');
            const testSave = localStorage.getItem('satoshiTerminalSave');
            if (testSave) {
                console.log('Save data confirmed in localStorage');
            } else {
                console.error('WARNING: No save data found in localStorage!');
            }
        }
    });

    // Save game when user is about to leave the page
    window.addEventListener('beforeunload', function(e) {
        console.log('Page unloading - saving game state');
        try {
            saveGame();
            console.log('Save successful on beforeunload');
        } catch (err) {
            console.error('Save failed on beforeunload:', err);
        }
    });

    // Save game when page is hidden on mobile (iOS Safari support)
    window.addEventListener('pagehide', function(e) {
        console.log('Page hide event - saving game state');
        try {
            saveGame();
            console.log('Save successful on pagehide');
        } catch (err) {
            console.error('Save failed on pagehide:', err);
        }
    });

    // Additional mobile save on freeze event (newer mobile browsers)
    window.addEventListener('freeze', function(e) {
        console.log('Page freeze event - saving game state');
        try {
            saveGame();
            console.log('Save successful on freeze');
        } catch (err) {
            console.error('Save failed on freeze:', err);
        }
    });


    // Combined age and terms modal handling
    function acceptAgeAndTerms() {
        localStorage.setItem('ageDisclaimerAccepted', 'true');
        localStorage.setItem('termsAccepted', 'true');
        document.getElementById('age-terms-modal').style.display = 'none';
    }

    function openAgeAndTermsModal() {
        document.getElementById('age-terms-modal').style.display = 'flex';
    }

    // Privacy policy modal handling
    function openPrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'flex';
    }

    function closePrivacyModal() {
        document.getElementById('privacy-modal').style.display = 'none';
    }

    // Backup Reminder Modal functions
    function showBackupReminder() {
        // Don't show if permanently dismissed by user
        if (localStorage.getItem('backupReminderDismissed') === 'true') {
            return;
        }
        const modal = document.getElementById('backup-reminder-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // Schedule next reminder in 10 minutes if this is the first time shown this session
        if (!window.backupReminderShownThisSession) {
            window.backupReminderShownThisSession = true;
            // Schedule recurring reminders every 10 minutes
            setInterval(() => {
                if (localStorage.getItem('backupReminderDismissed') !== 'true') {
                    const modal = document.getElementById('backup-reminder-modal');
                    if (modal) {
                        modal.style.display = 'flex';
                    }
                }
            }, 600000); // 600000ms = 10 minutes
        }
    }

    function dismissBackupReminderPermanently() {
        localStorage.setItem('backupReminderDismissed', 'true');
        closeBackupReminder();
    }

    function closeBackupReminder() {
        const modal = document.getElementById('backup-reminder-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Make functions available globally
    window.acceptAgeAndTerms = acceptAgeAndTerms;
    window.openAgeAndTermsModal = openAgeAndTermsModal;
    window.openPrivacyModal = openPrivacyModal;
    window.closePrivacyModal = closePrivacyModal;
    window.showBackupReminder = showBackupReminder;
    window.closeBackupReminder = closeBackupReminder;
    window.dismissBackupReminderPermanently = dismissBackupReminderPermanently;

    // Export/Import functions
    window.openExportImportModal = openExportImportModal;
    window.closeExportImportModal = closeExportImportModal;
    window.exportSaveToClipboard = exportSaveToClipboard;
    window.exportSaveToFile = exportSaveToFile;
    window.importSaveFromText = importSaveFromText;
    window.importSaveFromFile = importSaveFromFile;

    // Hacking minigame functions
    window.initHackingMinigame = initHackingMinigame;
    window.closeHackingModal = closeHackingModal;
    window.dismissHackingNotification = dismissHackingNotification;

    // Whack-a-block minigame functions
    window.initWhackMinigame = initWhackMinigame;
    window.closeWhackMidGame = closeWhackMidGame;
    window.closeWhackModal = closeWhackModal;
    window.closeWhackResultsModal = closeWhackResultsModal;

    // Network Stress Test minigame functions
    window.initNetworkMinigame = initNetworkMinigame;
    window.closeNetworkModal = closeNetworkModal;
    window.networkClickAttack = networkClickAttack;

    // Stub for rugpull store - will be overridden by rugpull.js if it loads
    window.openMetaUpgradesModal = function() {
        const modal = document.getElementById('meta-upgrades-modal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✓ Meta-upgrades modal opened');
        } else {
            alert('Meta-upgrades modal not found in HTML');
        }
    };

    // Close meta-upgrades modal
    window.closeMetaUpgradesModal = function() {
        const modal = document.getElementById('meta-upgrades-modal');
        if (modal) {
            modal.style.display = 'none';
            console.log('✓ Meta-upgrades modal closed');
        }
    };

    // Handle rugpull button click
    window.handleRugpullButtonClick = function() {
        console.log('Rugpull button clicked');
        // Call the meta-upgrades modal function from rugpull.js or the wrapper
        if (typeof window._rugpullImpl?.handleRugpullButtonClick === 'function') {
            window._rugpullImpl.handleRugpullButtonClick();
        } else {
            window.openMetaUpgradesModal();
        }
    };

    // Test helper - set lifetime earnings for testing rugpull feature
    window.setTestEarnings = function(amount) {
        lifetimeEarnings = amount;
        sessionEarnings = amount;
        // Also update rugpull tracker
        addEarnings(amount);
        console.log('TEST: Set lifetimeEarnings to $' + amount.toLocaleString());
    };

    // Test function to set earnings to $1 billion and show rugpull modal
    window.test1Billion = function() {
        lifetimeEarnings = 1000000000;  // $1B
        dollarBalance = 1000000000;     // $1B cash too
        sessionEarnings = 1000000000;
        // Also update rugpull tracker
        if (typeof window.rugpullAddEarnings === 'function') {
            window.rugpullAddEarnings(1000000000);
        }
        console.log('✓ TEST: Set earnings to $1,000,000,000');
        console.log('✓ Rugpull eligible! First rugpull reward: ~20 tokens');
        updateUI();
        // Auto-show rugpull modal
        if (typeof showRugpullOffer === 'function') {
            setTimeout(() => showRugpullOffer(), 500);
        }
    };

    // Test function specifically for rugpull progress tracking
    window.testRugpullEarnings = function(amount) {
        console.log(`TEST: Adding $${amount.toLocaleString()} to rugpull progress`);
        addEarnings(amount);
        updateUI();
    };

    // Debug function to check localStorage directly
    window.debugCheckSave = function() {
        const data = localStorage.getItem('satoshiTerminalSave');
        if (!data) {
            console.log('NO SAVE DATA IN LOCALSTORAGE');
            alert('No save data found in localStorage!');
            return;
        }
        try {
            const parsed = JSON.parse(data);
            console.log('=== LOCALSTORAGE CONTENTS ===');
            console.log('BTC Balance:', parsed.btcBalance);
            console.log('ETH Balance:', parsed.ethBalance);
            console.log('DOGE Balance:', parsed.dogeBalance);
            console.log('Dollar Balance:', parsed.dollarBalance);
            console.log('Hardware Equity:', parsed.hardwareEquity);
            console.log('Lifetime Earnings:', parsed.lifetimeEarnings);
            console.log('Full data:', parsed);
            alert('Check console for localStorage contents.\nBTC: ' + parsed.btcBalance + '\nETH: ' + parsed.ethBalance + '\nDOGE: ' + parsed.dogeBalance + '\n$: ' + parsed.dollarBalance);
        } catch(e) {
            console.error('Error parsing save:', e);
            alert('Error parsing save data: ' + e.message);
        }
    };

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeGame();
        });
    } else {
        initializeGame();
    }

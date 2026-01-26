// Coin Falling Animation System
// Scales coin spawn rate with hash rate (like Cookie Clicker)

(function() {
    'use strict';

    class CoinRainSystem {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.coins = [];
            this.isRunning = false;
            this.lastHashRate = 0;
            this.spawnRate = 0;
            this.spawnRates = { btc: 0, eth: 0, doge: 0, usd: 0 };
            this.maxCoins = 50; // Much lower for very subtle passive effect
            this.lastAnimationTime = 0;

            this.coinTypes = [
                { name: 'btc', src: 'bitcointoken.png', color: '#f7931a' },
                { name: 'eth', src: 'ethcoin.png', color: '#627eea' },
                { name: 'doge', src: 'dogecoin.png', color: '#c2a633' },
                { name: 'usd', src: 'dollar.png', color: '#00ff88' }
            ];

            this.images = {};
            this.imagesLoaded = false;
            this.loadImages();
        }

        loadImages() {
            let loadedCount = 0;
            const totalImages = this.coinTypes.length;

            this.coinTypes.forEach(coin => {
                const img = new Image();
                img.crossOrigin = 'anonymous';

                const handleLoad = () => {
                    loadedCount++;
                    console.log(`[CoinRain] ✓ Loaded: ${coin.src}`);
                    if (loadedCount === totalImages) {
                        this.imagesLoaded = true;
                        console.log('[CoinRain] All images loaded!');
                    }
                };

                const handleError = () => {
                    console.warn(`[CoinRain] ✗ Failed to load: ${coin.src} - using colored circles`);
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.imagesLoaded = true;
                        console.log('[CoinRain] Using fallback colored circles');
                    }
                };

                img.onload = handleLoad;
                img.onerror = handleError;
                // Try different paths
                img.src = coin.src;
                this.images[coin.name] = img;
            });

            // Fallback: mark as loaded after 3 seconds anyway
            setTimeout(() => {
                if (loadedCount < totalImages) {
                    console.warn('[CoinRain] Timeout - using fallback circles');
                    this.imagesLoaded = true;
                }
            }, 3000);
        }

        initialize() {
            if (this.canvas) return;

            const canvas = document.createElement('canvas');
            canvas.id = 'coin-rain-canvas';
            canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:500;display:block;background:transparent;';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            document.body.insertBefore(canvas, document.body.firstChild);

            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: true });

            console.log('[CoinRain] Canvas initialized:', canvas.width, 'x', canvas.height);

            window.addEventListener('resize', () => this.onWindowResize());
            this.startAnimation();
        }

        onWindowResize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        startAnimation() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastAnimationTime = Date.now();
            this.animate();
        }

        stopAnimation() {
            this.isRunning = false;
        }

        updateHashRate(btcUsdPerSec, ethUsdPerSec, dogeUsdPerSec) {
            const totalUsdPerSec = btcUsdPerSec + ethUsdPerSec + dogeUsdPerSec;
            this.lastHashRate = totalUsdPerSec;

            // Spawn rate: much slower - 1 coin per $500 USD per second (max 5/sec total)
            // This gives subtle passive drops - couple coins every few seconds
            const baseCoinRate = totalUsdPerSec / 500;
            this.spawnRate = Math.min(baseCoinRate, 5);

            // Track individual spawn rates based on USD value distribution
            // This is used by the animate loop to spawn appropriate coin types
            this.spawnRates.btc = btcUsdPerSec / 500;
            this.spawnRates.eth = ethUsdPerSec / 500;
            this.spawnRates.doge = dogeUsdPerSec / 500;
            this.spawnRates.usd = totalUsdPerSec / 500;
        }

        spawnCoin(forcedType = null, consistentSize = false) {
            if (this.coins.length >= this.maxCoins) return;

            let coinType;
            if (forcedType) {
                // Use the forced type if provided
                coinType = this.coinTypes.find(c => c.name === forcedType);
                if (!coinType) {
                    // Fallback to random if forced type not found
                    coinType = this.coinTypes[Math.floor(Math.random() * this.coinTypes.length)];
                }
            } else {
                // Random type for passive spawning
                coinType = this.coinTypes[Math.floor(Math.random() * this.coinTypes.length)];
            }

            // Consistent sizes for all coins
            let size;
            if (coinType.name === 'usd') {
                size = 42; // Fixed size for all dollar bills
            } else if (coinType.name === 'eth') {
                size = 32.4; // ETH 35% bigger (24 * 1.35 = 32.4)
            } else {
                size = 24; // Fixed size for BTC and DOGE
            }

            // Increase randomization for click coins
            const vxVariation = consistentSize ? 3 : 2;
            const vyVariation = consistentSize ? 2.5 : 1.5;
            const rotationSpeedVariation = consistentSize ? 0.2 : 0.1;

            const coin = {
                x: Math.random() * this.canvas.width,
                y: Math.random() * -100 - 50, // Stagger spawn heights from -50 to -150
                vx: (Math.random() - 0.5) * vxVariation, // More horizontal variation for click coins
                vy: 0.5 + Math.random() * vyVariation, // More variable fall speed for click coins
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * rotationSpeedVariation, // More varied rotation for click coins
                size: size,
                opacity: 0.7, // Start more transparent
                type: coinType.name,
                lifetime: 0,
                maxLifetime: 12000 + Math.random() * 6000, // Much longer lifetime (12-18 seconds)
                isClickCoin: consistentSize // Mark as click coin if consistent size
            };

            this.coins.push(coin);
        }

        updateCoins(deltaTime) {
            for (let i = this.coins.length - 1; i >= 0; i--) {
                const coin = this.coins[i];

                coin.x += coin.vx;
                coin.y += coin.vy;
                coin.rotation += coin.rotationSpeed;
                coin.lifetime += deltaTime;

                // Check if this is an explosion coin (higher rotation speed indicates explosion)
                const isExplosionCoin = coin.rotationSpeed > 0.1 || coin.rotationSpeed < -0.1;

                if (isExplosionCoin) {
                    // Explosion coins: faster gravity, fade by lifetime
                    coin.vy += 0.15;
                    coin.vx *= 0.97;

                    // Fade out based on lifetime
                    const lifeProgress = coin.lifetime / coin.maxLifetime;
                    coin.opacity = Math.max(0, 1 - lifeProgress);
                } else if (coin.isClickCoin) {
                    // Click coins: fall all the way down, fade by lifetime
                    coin.vy += 0.08;
                    coin.vx *= 0.99;

                    // Fade out based on lifetime (not screen position)
                    const lifeProgress = coin.lifetime / coin.maxLifetime;
                    coin.opacity = Math.max(0, 0.7 - (lifeProgress * 0.7)); // Fade from 0.7 to 0
                } else {
                    // Passive coins: slow gravity, fade at midpoint
                    coin.vy += 0.08;
                    coin.vx *= 0.99;

                    // Fade out when halfway down screen
                    const midpointY = this.canvas.height / 2;
                    if (coin.y < midpointY) {
                        coin.opacity = 1;
                    } else if (coin.y < midpointY + 100) {
                        coin.opacity = 1 - ((coin.y - midpointY) / 100);
                    } else {
                        coin.opacity = 0;
                    }
                }

                if (coin.y > this.canvas.height + 50 || coin.lifetime > coin.maxLifetime) {
                    this.coins.splice(i, 1);
                }
            }
        }

        drawCoins() {
            this.coins.forEach(coin => {
                this.ctx.save();
                this.ctx.globalAlpha = coin.opacity;
                this.ctx.translate(coin.x, coin.y);
                this.ctx.rotate(coin.rotation);

                const img = this.images[coin.type];
                const coinColor = this.coinTypes.find(c => c.name === coin.type)?.color || '#fff';

                if (img && img.complete && img.naturalHeight !== 0) {
                    try {
                        this.ctx.drawImage(img, -coin.size / 2, -coin.size / 2, coin.size, coin.size);
                    } catch (e) {
                        this.drawFallback(coin.size, coinColor);
                    }
                } else {
                    this.drawFallback(coin.size, coinColor);
                }

                this.ctx.restore();
            });
        }

        drawFallback(size, color) {
            const radius = size / 2;

            // Draw outer glow (bright)
            this.ctx.fillStyle = color.replace(')', ', 0.5)').replace('rgb', 'rgba');
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw solid circle (bright)
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw bright border
            this.ctx.strokeStyle = 'rgba(255,255,255,1)';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            // Draw inner highlight (bright)
            this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
            this.ctx.beginPath();
            this.ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
        }

        animate() {
            if (!this.isRunning) return;

            const now = Date.now();
            const deltaTime = Math.min(now - this.lastAnimationTime, 50);
            this.lastAnimationTime = now;

            // Spawn coins based on individual crypto type spawn rates
            const btcCoinsToSpawn = Math.floor((this.spawnRates.btc / 1000) * deltaTime);
            const ethCoinsToSpawn = Math.floor((this.spawnRates.eth / 1000) * deltaTime);
            const dogeCoinsToSpawn = Math.floor((this.spawnRates.doge / 1000) * deltaTime);

            for (let i = 0; i < btcCoinsToSpawn; i++) {
                this.spawnCoin('btc');
            }
            for (let i = 0; i < ethCoinsToSpawn; i++) {
                this.spawnCoin('eth');
            }
            for (let i = 0; i < dogeCoinsToSpawn; i++) {
                this.spawnCoin('doge');
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.updateCoins(deltaTime);
            this.drawCoins();

            // Debug text disabled - less intrusive
            // if (this.coins.length > 0 || this.spawnRate > 0) {
            //     this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            //     this.ctx.font = '10px monospace';
            //     this.ctx.fillText(`Coins: ${this.coins.length}`, 10, 15);
            // }

            requestAnimationFrame(() => this.animate());
        }
    }

    // Global interface
    window.CoinRainSystem = CoinRainSystem;
    window.coinRainSystem = null;

    function initializeCoinRain() {
        if (!window.coinRainSystem) {
            window.coinRainSystem = new CoinRainSystem();
            window.coinRainSystem.initialize();
            console.log('[CoinRain] Initialization complete');
        }
    }

    function updateCoinRain(btcPerSec, ethPerSec, dogePerSec) {
        if (!window.coinRainSystem) {
            initializeCoinRain();
        }
        window.coinRainSystem.updateHashRate(btcPerSec, ethPerSec, dogePerSec);
    }

    function spawnExplosionCoins(coinType, count) {
        if (!window.coinRainSystem) {
            initializeCoinRain();
        }
        // Spawn coins in random directions from center of screen (explosion effect)
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2; // Random direction
            const speed = 8 + Math.random() * 12; // Much faster spread!

            const coin = {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.5,
                size: coinType === 'usd' ? 35 + Math.random() * 15 : 12 + Math.random() * 8,
                opacity: 1,
                type: coinType,
                lifetime: 0,
                maxLifetime: 2500 + Math.random() * 1500
            };

            window.coinRainSystem.coins.push(coin);
        }
    }

    window.initializeCoinRain = initializeCoinRain;
    window.updateCoinRain = updateCoinRain;
    window.spawnExplosionCoins = spawnExplosionCoins;

    // Auto-initialize when DOM is ready
    function tryInitialize() {
        if (document.body) {
            console.log('[CoinRain] Initializing now...');
            initializeCoinRain();
        } else {
            console.log('[CoinRain] Body not ready, retrying...');
            setTimeout(tryInitialize, 50);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[CoinRain] DOMContentLoaded fired');
            setTimeout(initializeCoinRain, 100);
        });
    } else {
        console.log('[CoinRain] DOM already loaded, initializing soon...');
        setTimeout(tryInitialize, 100);
    }

    console.log('[CoinRain] Script loaded and setup complete');
    window._coinRainLoaded = true;
})();

// Fallback initialization in case IIFE doesn't work
if (typeof initializeCoinRain !== 'function') {
    console.warn('[CoinRain] IIFE failed to execute - attempting direct init');
}

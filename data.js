// ============================================
// DATA.JS - All Game Constants and Upgrades
// ============================================

// ===== PRICE CONSTANTS =====
const BTC_MIN_PRICE = 50000;
const BTC_MAX_PRICE = 200000;
const ETH_MIN_PRICE = 1500;
const ETH_MAX_PRICE = 8000;
const DOGE_MIN_PRICE = 0.05;
const DOGE_MAX_PRICE = 2.00;

// ===== POWER REQUIREMENTS FOR MINING EQUIPMENT (in watts) =====
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
    11: 25000000, // AI-Optimized Mining Network
    12: 125000000, // Planetary Mining Grid
    13: 625000000, // Dyson Sphere Mining Array
    14: 3125000000, // Galactic Hash Network
    15: 15625000000 // Universal Computation Matrix
};

// ===== POWER SUPPLY UPGRADES =====
const powerUpgrades = [
    { id: 0, name: "Basic Power Strip", baseUsd: 25, basePower: 10 },
    { id: 1, name: "Regulated PSU", baseUsd: 350, basePower: 100 },
    { id: 2, name: "High-Efficiency PSU", baseUsd: 2100, basePower: 500 },
    { id: 3, name: "Server-Grade PSU", baseUsd: 12000, basePower: 2500 },
    { id: 4, name: "Mining Power Distribution Unit", baseUsd: 60000, basePower: 12000 },
    { id: 5, name: "Modular Data Center Power System", baseUsd: 320000, basePower: 60000 },
    { id: 6, name: "Dedicated Substation Power Unit", baseUsd: 1600000, basePower: 280000 },
    { id: 7, name: "Industrial Grid Connection", baseUsd: 8000000, basePower: 1400000 },
    { id: 8, name: "Hydroelectric Power Station", baseUsd: 40000000, basePower: 7000000 },
    { id: 9, name: "Nuclear Reactor Array", baseUsd: 200000000, basePower: 35000000 }
].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentPower: 0 }));

// ===== BITCOIN MINING UPGRADES =====
const btcUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 5, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.00000050 },
    { id: 1, name: "USB Miner", baseUsd: 5, baseYield: 0.000000115 },
    { id: 2, name: "GTX 1660 Super", baseUsd: 100, baseYield: 0.0000007 },
    { id: 3, name: "RTX 5090 Rig", baseUsd: 3000, baseYield: 0.000015 },
    { id: 4, name: "ASIC Mining Unit", baseUsd: 7500, baseYield: 0.000085 },
    { id: 5, name: "Liquid ASIC Rig", baseUsd: 28000, baseYield: 0.00045 },
    { id: 6, name: "Mobile Mining Container", baseUsd: 110000, baseYield: 0.0032 },
    { id: 7, name: "Geothermal Mining Farm", baseUsd: 680000, baseYield: 0.045 },
    { id: 8, name: "Data Center Facility", baseUsd: 5200000, baseYield: 0.62 },
    { id: 9, name: "Orbital Data Relay", baseUsd: 35000000, baseYield: 5.8 },
    { id: 10, name: "Quantum Computer", baseUsd: 500000000, baseYield: 125.0 },
    { id: 11, name: "AI-Optimized Mining Network", baseUsd: 3500000000, baseYield: 900.0 },
    { id: 12, name: "Planetary Mining Grid", baseUsd: 25000000000, baseYield: 6500.0 },
    { id: 13, name: "Dyson Sphere Mining Array", baseUsd: 180000000000, baseYield: 47000.0 },
    { id: 14, name: "Galactic Hash Network", baseUsd: 1300000000000, baseYield: 340000.0 },
    { id: 15, name: "Universal Computation Matrix", baseUsd: 9500000000000, baseYield: 2500000.0 }
].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentYield: 0, boostCost: u.baseUsd * 0.5, boostLevel: 0 }));

// ===== ETHEREUM MINING UPGRADES =====
const ethUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 5, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.00002100 },
    { id: 1, name: "Single GPU Rig", baseUsd: 8, baseYield: 0.0000053 },
    { id: 2, name: "RTX 4090 Miner", baseUsd: 150, baseYield: 0.0000316 },
    { id: 3, name: "8-GPU Mining Rig", baseUsd: 4500, baseYield: 0.000684 },
    { id: 4, name: "Professional ETH Farm", baseUsd: 12000, baseYield: 0.00378 },
    { id: 5, name: "Staking Validator Node", baseUsd: 40000, baseYield: 0.0200 },
    { id: 6, name: "Multi-Validator Farm", baseUsd: 175000, baseYield: 0.143 },
    { id: 7, name: "ETH Mining Complex", baseUsd: 950000, baseYield: 2.0 },
    { id: 8, name: "Enterprise Staking Pool", baseUsd: 7500000, baseYield: 27.7 },
    { id: 9, name: "Layer 2 Validation Network", baseUsd: 52000000, baseYield: 258.0 },
    { id: 10, name: "Ethereum Foundation Node", baseUsd: 700000000, baseYield: 5570.0 },
    { id: 11, name: "Global Validator Consortium", baseUsd: 5000000000, baseYield: 40000.0 },
    { id: 12, name: "Sharding Supernetwork", baseUsd: 36000000000, baseYield: 290000.0 },
    { id: 13, name: "Zero-Knowledge Proof Farm", baseUsd: 260000000000, baseYield: 2100000.0 },
    { id: 14, name: "Interchain Bridge Network", baseUsd: 1900000000000, baseYield: 15000000.0 },
    { id: 15, name: "Ethereum 3.0 Genesis Node", baseUsd: 14000000000000, baseYield: 110000000.0 }
].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentYield: 0, boostCost: u.baseUsd * 0.5, boostLevel: 0 }));

// ===== DOGECOIN MINING UPGRADES =====
const dogeUpgrades = [
	{ id: 0, name: "Manual Hash Rate", baseUsd: 3, baseYield: 0, isClickUpgrade: true, clickIncrease: 0.02 },
    { id: 1, name: "Basic Scrypt Miner", baseUsd: 3, baseYield: 4.60 },
    { id: 2, name: "L3+ ASIC Miner", baseUsd: 60, baseYield: 28.0 },
    { id: 3, name: "Mini DOGE Farm", baseUsd: 1800, baseYield: 600.0 },
    { id: 4, name: "Scrypt Mining Pool", baseUsd: 4500, baseYield: 3400.0 },
    { id: 5, name: "Industrial DOGE Facility", baseUsd: 18000, baseYield: 18000.0 },
    { id: 6, name: "DOGE Megafarm", baseUsd: 72000, baseYield: 128000.0 },
    { id: 7, name: "WOW Mining Complex", baseUsd: 450000, baseYield: 1800000.0 },
    { id: 8, name: "Moon Mining Station", baseUsd: 3400000, baseYield: 24800000.0 },
    { id: 9, name: "Interplanetary DOGE Network", baseUsd: 23000000, baseYield: 232000000.0 },
    { id: 10, name: "To The Moon Supercomputer", baseUsd: 320000000, baseYield: 5000000000.0 },
    { id: 11, name: "Mars Colony Mining Base", baseUsd: 2300000000, baseYield: 36000000000.0 },
    { id: 12, name: "Asteroid Belt DOGE Harvester", baseUsd: 16500000000, baseYield: 260000000000.0 },
    { id: 13, name: "Jovian Satellite Network", baseUsd: 120000000000, baseYield: 1900000000000.0 },
    { id: 14, name: "Solar System DOGE Grid", baseUsd: 870000000000, baseYield: 14000000000000.0 },
    { id: 15, name: "Intergalactic SHIBE Matrix", baseUsd: 6300000000000, baseYield: 100000000000000.0 }
].map(u => ({ ...u, level: 0, currentUsd: u.baseUsd, currentYield: 0, boostCost: u.baseUsd * 0.5, boostLevel: 0 }));

// Keep reference to btcUpgrades as upgrades for backward compatibility
const upgrades = btcUpgrades;

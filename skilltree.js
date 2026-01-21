// Skill Tree System for BTC Miner
// Earn Skill Tokens by reaching milestones

// Skill Token balance
let skillTokens = 0;

// Milestone tracking
let milestoneLevel = 0;
let lastMilestoneChecked = 0;

// Milestone requirements (cumulative lifetime earnings)
const MILESTONES = [
    // Milestone 1
    {
        level: 1,
        btc: 0.5,
        eth: 15,
        doge: 35000,
        reward: 5,
        name: "First Steps"
    },
    // Milestone 2 (25% more than milestone 1)
    {
        level: 2,
        btc: 0.625,
        eth: 18.75,
        doge: 43750,
        reward: 5,
        name: "Getting Started"
    },
    // Milestone 3 (25% more than milestone 2)
    {
        level: 3,
        btc: 0.78125,
        eth: 23.4375,
        doge: 54687.5,
        reward: 7,
        name: "Novice Miner"
    },
    // Milestone 4
    {
        level: 4,
        btc: 0.9765625,
        eth: 29.296875,
        doge: 68359.375,
        reward: 7,
        name: "Apprentice"
    },
    // Milestone 5
    {
        level: 5,
        btc: 1.220703125,
        eth: 36.62109375,
        doge: 85449.21875,
        reward: 10,
        name: "Skilled Miner"
    },
    // Milestone 6
    {
        level: 6,
        btc: 1.52587890625,
        eth: 45.7763671875,
        doge: 106811.5234375,
        reward: 10,
        name: "Expert"
    },
    // Milestone 7
    {
        level: 7,
        btc: 1.9073486328125,
        eth: 57.220458984375,
        doge: 133514.404296875,
        reward: 15,
        name: "Master Miner"
    },
    // Milestone 8
    {
        level: 8,
        btc: 2.384185791015625,
        eth: 71.52557373046875,
        doge: 166893.00537109375,
        reward: 15,
        name: "Legendary"
    },
    // Milestone 9
    {
        level: 9,
        btc: 2.98023223876953125,
        eth: 89.4069671630859375,
        doge: 208616.2567138671875,
        reward: 20,
        name: "Crypto Tycoon"
    },
    // Milestone 10
    {
        level: 10,
        btc: 3.7252902984619140625,
        eth: 111.758708953857421875,
        doge: 260770.320892333984375,
        reward: 25,
        name: "Mining Mogul"
    }
];

// Skill Tree Nodes - Redesigned with grid positioning
const skillTreeNodes = [
    // Tier 1 - Foundation Skills (Easy to get started)
    {
        id: 'hash_start',
        name: 'Hash Beginner',
        description: '+5% BTC mining speed',
        tier: 1,
        position: { row: 1, col: 2 },
        cost: 1,
        purchased: false,
        requires: [],
        effect: { type: 'btc_mining_speed', value: 0.05 }
    },
    {
        id: 'eth_start',
        name: 'ETH Novice',
        description: '+5% ETH mining speed',
        tier: 1,
        position: { row: 1, col: 3 },
        cost: 1,
        purchased: false,
        requires: [],
        effect: { type: 'eth_mining_speed', value: 0.05 }
    },
    {
        id: 'doge_start',
        name: 'DOGE Friend',
        description: '+5% DOGE mining speed',
        tier: 1,
        position: { row: 1, col: 4 },
        cost: 1,
        purchased: false,
        requires: [],
        effect: { type: 'doge_mining_speed', value: 0.05 }
    },
    {
        id: 'click_power_1',
        name: 'Steady Hands',
        description: '+25% manual click power',
        tier: 1,
        position: { row: 2, col: 1 },
        cost: 2,
        purchased: false,
        requires: [],
        effect: { type: 'click_power', value: 0.25 }
    },
    {
        id: 'mining_speed_1',
        name: 'Mining Basics',
        description: '+10% all mining speed',
        tier: 1,
        position: { row: 2, col: 3 },
        cost: 3,
        purchased: false,
        requires: ['hash_start', 'eth_start', 'doge_start'],
        effect: { type: 'mining_speed', value: 0.10 }
    },
    {
        id: 'efficient_power',
        name: 'Power Saver',
        description: '-5% power consumption',
        tier: 1,
        position: { row: 2, col: 5 },
        cost: 2,
        purchased: false,
        requires: [],
        effect: { type: 'power_efficiency', value: 0.05 }
    },

    // Tier 2 - Intermediate Skills
    {
        id: 'click_power_2',
        name: 'Expert Clicker',
        description: '+50% manual click power',
        tier: 2,
        position: { row: 3, col: 1 },
        cost: 5,
        purchased: false,
        requires: ['click_power_1'],
        effect: { type: 'click_power', value: 0.50 }
    },
    {
        id: 'mining_speed_2',
        name: 'Advanced Mining',
        description: '+20% all mining speed',
        tier: 2,
        position: { row: 3, col: 3 },
        cost: 8,
        purchased: false,
        requires: ['mining_speed_1'],
        effect: { type: 'mining_speed', value: 0.20 }
    },
    {
        id: 'power_boost',
        name: 'Power Grid',
        description: '+15% total power available',
        tier: 2,
        position: { row: 3, col: 5 },
        cost: 6,
        purchased: false,
        requires: ['efficient_power'],
        effect: { type: 'power_boost', value: 0.15 }
    },
    {
        id: 'offline_boost_1',
        name: 'Idle Earner I',
        description: '+2 hours offline cap (8h)',
        tier: 2,
        position: { row: 4, col: 2 },
        cost: 10,
        purchased: false,
        requires: ['mining_speed_1'],
        effect: { type: 'offline_cap', value: 7200 }
    },
    {
        id: 'staking_boost_1',
        name: 'Stake Master I',
        description: '+25% staking rewards',
        tier: 2,
        position: { row: 4, col: 4 },
        cost: 10,
        purchased: false,
        requires: ['mining_speed_1'],
        effect: { type: 'staking_boost', value: 0.25 }
    },

    // Tier 3 - Advanced Skills
    {
        id: 'click_power_3',
        name: 'Click Legend',
        description: '+100% manual click power',
        tier: 3,
        position: { row: 5, col: 1 },
        cost: 15,
        purchased: false,
        requires: ['click_power_2'],
        effect: { type: 'click_power', value: 1.00 }
    },
    {
        id: 'mining_speed_3',
        name: 'Master Miner',
        description: '+35% all mining speed',
        tier: 3,
        position: { row: 5, col: 3 },
        cost: 20,
        purchased: false,
        requires: ['mining_speed_2'],
        effect: { type: 'mining_speed', value: 0.35 }
    },
    {
        id: 'power_efficiency_2',
        name: 'Green Energy',
        description: '-15% power consumption',
        tier: 3,
        position: { row: 5, col: 5 },
        cost: 15,
        purchased: false,
        requires: ['power_boost'],
        effect: { type: 'power_efficiency', value: 0.15 }
    },
    {
        id: 'offline_boost_2',
        name: 'Idle Earner II',
        description: '+4 hours offline cap (12h)',
        tier: 3,
        position: { row: 6, col: 2 },
        cost: 25,
        purchased: false,
        requires: ['offline_boost_1'],
        effect: { type: 'offline_cap', value: 14400 }
    },
    {
        id: 'staking_boost_2',
        name: 'Stake Master II',
        description: '+50% staking rewards',
        tier: 3,
        position: { row: 6, col: 4 },
        cost: 25,
        purchased: false,
        requires: ['staking_boost_1'],
        effect: { type: 'staking_boost', value: 0.50 }
    },

    // Tier 4 - Elite Skills
    {
        id: 'mega_boost',
        name: 'Quantum Miner',
        description: '+75% all mining speed',
        tier: 4,
        position: { row: 7, col: 3 },
        cost: 40,
        purchased: false,
        requires: ['mining_speed_3'],
        effect: { type: 'mining_speed', value: 0.75 }
    },
    {
        id: 'ultimate_staking',
        name: 'Stake Legend',
        description: '+100% staking rewards',
        tier: 4,
        position: { row: 7, col: 4 },
        cost: 50,
        purchased: false,
        requires: ['staking_boost_2'],
        effect: { type: 'staking_boost', value: 1.00 }
    },
    {
        id: 'ultimate_power',
        name: 'Ultimate Efficiency',
        description: '-25% power consumption',
        tier: 4,
        position: { row: 7, col: 5 },
        cost: 40,
        purchased: false,
        requires: ['power_efficiency_2'],
        effect: { type: 'power_efficiency', value: 0.25 }
    }
];

/**
 * Check if player has reached any new milestones
 */
function checkMilestones() {
    // Check each milestone in order
    for (let i = lastMilestoneChecked; i < MILESTONES.length; i++) {
        const milestone = MILESTONES[i];

        // Check if all requirements are met
        if (btcLifetime >= milestone.btc &&
            ethLifetime >= milestone.eth &&
            dogeLifetime >= milestone.doge) {

            // Milestone reached!
            skillTokens += milestone.reward;
            milestoneLevel = milestone.level;
            lastMilestoneChecked = i + 1;

            // Show notification
            showMilestoneNotification(milestone);

            // Update UI
            updateSkillTreeUI();
            saveGame();
            playUpgradeSound();
        } else {
            // Stop checking once we hit an incomplete milestone
            break;
        }
    }
}

/**
 * Show milestone achievement notification
 */
function showMilestoneNotification(milestone) {
    alert(`🎉 Milestone Reached: ${milestone.name}!\n\nYou earned ${milestone.reward} Skill Tokens! 🔷\n\nTotal Tokens: ${skillTokens}`);
}

/**
 * Get next milestone info
 */
function getNextMilestone() {
    if (lastMilestoneChecked >= MILESTONES.length) {
        return null; // All milestones completed
    }
    return MILESTONES[lastMilestoneChecked];
}

/**
 * Purchase a skill from the skill tree
 */
function purchaseSkill(skillId) {
    const skill = skillTreeNodes.find(s => s.id === skillId);
    if (!skill) return;

    // Check if already purchased
    if (skill.purchased) {
        alert('You already own this skill!');
        return;
    }

    // Check if have enough Skill Tokens
    if (skillTokens < skill.cost) {
        alert(`Not enough Skill Tokens!\n\nNeed: ${skill.cost} 🔷\nHave: ${skillTokens} 🔷`);
        return;
    }

    // Check if requirements are met
    if (skill.requires.length > 0) {
        const unmetRequirements = skill.requires.filter(reqId => {
            const reqSkill = skillTreeNodes.find(s => s.id === reqId);
            return !reqSkill || !reqSkill.purchased;
        });

        if (unmetRequirements.length > 0) {
            alert('You must unlock prerequisite skills first!');
            return;
        }
    }

    // Purchase the skill
    skillTokens -= skill.cost;
    skill.purchased = true;

    // Apply the effect
    applySkillEffect(skill);

    updateUI();
    updateSkillTreeUI();
    saveGame();
    playUpgradeSound();

    alert(`🌟 Unlocked: ${skill.name}!\n${skill.description}`);
}

/**
 * Apply skill effect to the game
 */
function applySkillEffect(skill) {
    // Effects are applied dynamically when calculating yields
    // This function is called when purchasing to trigger immediate updates
    recalculateAllYields();

    // Recalculate power if power-related skills were purchased
    if (skill.effect.type === 'power_efficiency' || skill.effect.type === 'power_boost') {
        if (typeof calculateTotalPowerUsed === 'function') {
            calculateTotalPowerUsed();
        }
    }
}

/**
 * Get total skill bonus for a specific effect type
 */
function getSkillBonus(type) {
    let totalBonus = 0;
    skillTreeNodes.forEach(skill => {
        if (skill.purchased && skill.effect.type === type) {
            totalBonus += skill.effect.value;
        }
    });
    return totalBonus;
}

/**
 * Recalculate all yields with skill bonuses applied
 */
function recalculateAllYields() {
    const btcBonus = getSkillBonus('btc_mining_speed');
    const ethBonus = getSkillBonus('eth_mining_speed');
    const dogeBonus = getSkillBonus('doge_mining_speed');
    const miningBonus = getSkillBonus('mining_speed');

    // Recalculate BTC per second
    btcPerSec = 0;
    btcUpgrades.forEach(u => {
        if (u.level > 0) {
            btcPerSec += u.currentYield * (1 + miningBonus + btcBonus);
        }
    });

    // Recalculate ETH per second
    ethPerSec = 0;
    ethUpgrades.forEach(u => {
        if (u.level > 0) {
            ethPerSec += u.currentYield * (1 + miningBonus + ethBonus);
        }
    });

    // Recalculate DOGE per second
    dogePerSec = 0;
    dogeUpgrades.forEach(u => {
        if (u.level > 0) {
            dogePerSec += u.currentYield * (1 + miningBonus + dogeBonus);
        }
    });

    updateUI();
}

/**
 * Get modified offline cap with skill bonuses
 */
function getOfflineCap() {
    const BASE_CAP = 21600; // 6 hours
    const bonusCap = getSkillBonus('offline_cap');
    return BASE_CAP + bonusCap;
}

/**
 * Get modified click power with skill bonuses
 */
function getClickBonus() {
    return 1 + getSkillBonus('click_power');
}

/**
 * Get modified staking rate with skill bonuses
 */
function getStakingBonus() {
    return 1 + getSkillBonus('staking_boost');
}

/**
 * Get power efficiency reduction factor (e.g., 0.05 for -5% consumption)
 */
function getPowerEfficiency() {
    return getSkillBonus('power_efficiency');
}

/**
 * Get power boost multiplier (e.g., 0.15 for +15% available power)
 */
function getPowerBoost() {
    return getSkillBonus('power_boost');
}

/**
 * Update Skill Tree UI
 */
function updateSkillTreeUI() {
    // Update Skill Token display
    const skillTokenEl = document.getElementById('skill-tokens-display');
    if (skillTokenEl) {
        skillTokenEl.textContent = skillTokens;
    }

    // Update Skill Token display in modal
    const skillTokenModalEl = document.getElementById('skill-tokens-modal');
    if (skillTokenModalEl) {
        skillTokenModalEl.textContent = skillTokens;
    }

    // Update milestone progress
    const milestoneEl = document.getElementById('milestone-progress');
    if (milestoneEl) {
        const nextMilestone = getNextMilestone();
        if (nextMilestone) {
            const btcProgress = ((btcLifetime / nextMilestone.btc) * 100).toFixed(1);
            const ethProgress = ((ethLifetime / nextMilestone.eth) * 100).toFixed(1);
            const dogeProgress = ((dogeLifetime / nextMilestone.doge) * 100).toFixed(1);

            milestoneEl.innerHTML = `
                <div style="font-size: 0.9rem; color: #00ff88; font-weight: bold; margin-bottom: 8px;">
                    Next Milestone: ${nextMilestone.name} (+${nextMilestone.reward} 🔷)
                </div>
                <div style="font-size: 0.75rem; color: #aaa;">
                    ₿ ${btcLifetime.toFixed(4)} / ${nextMilestone.btc} (${btcProgress}%)<br>
                    Ξ ${ethLifetime.toFixed(2)} / ${nextMilestone.eth} (${ethProgress}%)<br>
                    Ð ${dogeLifetime.toFixed(0)} / ${nextMilestone.doge} (${dogeProgress}%)
                </div>
            `;
        } else {
            milestoneEl.innerHTML = `
                <div style="font-size: 0.9rem; color: #00ff88; font-weight: bold;">
                    🏆 All Milestones Complete!
                </div>
            `;
        }
    }

    // Update each skill node
    skillTreeNodes.forEach(skill => {
        const skillEl = document.getElementById('skill-' + skill.id);
        if (skillEl) {
            if (skill.purchased) {
                skillEl.classList.add('purchased');
                skillEl.classList.remove('locked', 'available');
            } else {
                // Check if requirements are met
                const requirementsMet = skill.requires.every(reqId => {
                    const reqSkill = skillTreeNodes.find(s => s.id === reqId);
                    return reqSkill && reqSkill.purchased;
                });

                if (requirementsMet && skillTokens >= skill.cost) {
                    skillEl.classList.add('available');
                    skillEl.classList.remove('locked', 'purchased');
                } else if (requirementsMet) {
                    skillEl.classList.remove('locked', 'purchased', 'available');
                } else {
                    skillEl.classList.add('locked');
                    skillEl.classList.remove('purchased', 'available');
                }
            }
        }
    });

    // Redraw connection lines
    drawSkillConnections();
}

/**
 * Draw connection lines between skills (SVG-based for proper scaling)
 */
function drawSkillConnections() {
    const svg = document.getElementById('skill-connections-svg');
    if (!svg) return;

    const container = document.querySelector('.skill-tree-grid');
    if (!container) return;

    const wrapper = svg.parentElement;
    if (!wrapper) return;

    // Clear existing lines
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }

    // Get wrapper dimensions (this is what the SVG fills)
    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;

    // Set SVG to match wrapper dimensions
    svg.setAttribute('width', wrapperWidth);
    svg.setAttribute('height', wrapperHeight);
    svg.setAttribute('viewBox', `0 0 ${wrapperWidth} ${wrapperHeight}`);

    // Get wrapper's position to calculate relative coordinates
    const wrapperRect = wrapper.getBoundingClientRect();

    // Draw lines between connected skills
    skillTreeNodes.forEach(skill => {
        if (skill.requires.length === 0) return;

        const skillEl = document.getElementById('skill-' + skill.id);
        if (!skillEl) return;

        const skillRect = skillEl.getBoundingClientRect();
        // Position relative to wrapper
        const endX = skillRect.left - wrapperRect.left + skillRect.width / 2;
        const endY = skillRect.top - wrapperRect.top + skillRect.height / 2;

        skill.requires.forEach(reqId => {
            const reqSkill = skillTreeNodes.find(s => s.id === reqId);
            if (!reqSkill) return;

            const reqEl = document.getElementById('skill-' + reqId);
            if (!reqEl) return;

            const reqRect = reqEl.getBoundingClientRect();
            // Position relative to wrapper
            const startX = reqRect.left - wrapperRect.left + reqRect.width / 2;
            const startY = reqRect.top - wrapperRect.top + reqRect.height / 2;

            // Determine line color based on purchase status
            let lineColor = '#333'; // Default locked
            if (skill.purchased && reqSkill.purchased) {
                lineColor = '#00ff88'; // Both purchased - green
            } else if (reqSkill.purchased) {
                lineColor = '#f7931a'; // Parent purchased - orange
            }

            // Create line element
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', startX);
            line.setAttribute('y1', startY);
            line.setAttribute('x2', endX);
            line.setAttribute('y2', endY);
            line.setAttribute('stroke', lineColor);
            line.setAttribute('stroke-width', '3');
            svg.appendChild(line);
        });
    });
}

/**
 * Render Skill Tree UI with branching structure
 */
function renderSkillTree() {
    const container = document.getElementById('skill-tree-container');
    if (!container) return;

    // Find grid dimensions
    let maxRow = 0;
    let maxCol = 0;
    skillTreeNodes.forEach(skill => {
        if (skill.position.row > maxRow) maxRow = skill.position.row;
        if (skill.position.col > maxCol) maxCol = skill.position.col;
    });

    // Create a wrapper with SVG that stays within the modal
    let html = '<div style="position: relative; width: 100%; height: 100%;">';
    html += '<svg id="skill-connections-svg" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 0; width: 100%; height: 100%;"></svg>';
    html += '<div class="skill-tree-grid" style="display: grid; grid-template-rows: repeat(' + maxRow + ', 100px); grid-template-columns: repeat(' + maxCol + ', 1fr); gap: 20px; position: relative; padding: 20px; min-height: 600px; z-index: 1;">';

    skillTreeNodes.forEach(skill => {
        const isLocked = !skill.purchased && (
            skill.requires.some(reqId => {
                const reqSkill = skillTreeNodes.find(s => s.id === reqId);
                return !reqSkill || !reqSkill.purchased;
            }) || skillTokens < skill.cost
        );

        const statusClass = skill.purchased ? 'purchased' : (isLocked ? 'locked' : 'available');

        html += `
            <div class="skill-node ${statusClass}"
                 id="skill-${skill.id}"
                 style="grid-row: ${skill.position.row}; grid-column: ${skill.position.col};"
                 onclick="purchaseSkill('${skill.id}')">
                <div class="skill-name">${skill.name}</div>
                <div class="skill-description">${skill.description}</div>
                <div class="skill-cost">${skill.purchased ? '✓ OWNED' : `${skill.cost} 🔷`}</div>
            </div>
        `;
    });

    html += '</div>'; // Close skill-tree-grid
    html += '</div>'; // Close wrapper
    container.innerHTML = html;

    // Draw connections after DOM is ready
    setTimeout(() => {
        drawSkillConnections();

        // Redraw on window resize
        window.addEventListener('resize', drawSkillConnections);
    }, 100);
}

/**
 * Open skill tree modal
 */
function openSkillTreeModal() {
    const modal = document.getElementById('skill-tree-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderSkillTree();
        updateSkillTreeUI();
    }
}

/**
 * Close skill tree modal
 */
function closeSkillTreeModal() {
    const modal = document.getElementById('skill-tree-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Get skill tree data for save/load
 */
function getSkillTreeData() {
    return {
        skillTokens,
        milestoneLevel,
        lastMilestoneChecked,
        purchasedSkills: skillTreeNodes.filter(s => s.purchased).map(s => s.id)
    };
}

/**
 * Load skill tree data from save
 */
function loadSkillTreeData(data) {
    if (data) {
        skillTokens = data.skillTokens || 0;
        milestoneLevel = data.milestoneLevel || 0;
        lastMilestoneChecked = data.lastMilestoneChecked || 0;

        if (data.purchasedSkills && Array.isArray(data.purchasedSkills)) {
            data.purchasedSkills.forEach(skillId => {
                const skill = skillTreeNodes.find(s => s.id === skillId);
                if (skill) {
                    skill.purchased = true;
                }
            });
        }

        // Recalculate yields with skill bonuses
        recalculateAllYields();
    }
}

/**
 * Reset skill tree (for game reset)
 */
function resetSkillTree() {
    skillTokens = 0;
    milestoneLevel = 0;
    lastMilestoneChecked = 0;
    skillTreeNodes.forEach(skill => {
        skill.purchased = false;
    });
}

// Check milestones periodically (every 2 seconds)
setInterval(checkMilestones, 2000);

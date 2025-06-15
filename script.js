document.addEventListener('DOMContentLoaded', () => {
const currentTurnSpan = document.getElementById('currentTurn');
const nextTurnBtn = document.getElementById('nextTurnBtn');
const resetGameBtn = document.getElementById('resetGameBtn');
const pointLimitInput = document.getElementById('pointLimitInput');
const player1NameInput = document.getElementById('player1NameInput'); // Player 1 Name Input
const player2NameInput = document.getElementById('player2NameInput'); // Player 2 Name Input
const maxTurnsInput = document.getElementById('maxTurnsInput'); 
const maxTurnsDisplay = document.getElementById('maxTurnsDisplay'); 

const player1OrderTokensContainer = document.getElementById('player1OrderTokensContainer'); // Player 1 Order Tokens
const player2OrderTokensContainer = document.getElementById('player2OrderTokensContainer'); // Player 2 Order Tokens

const player1SquadDiv = document.getElementById('player1Squad');
const player2SquadDiv = document.getElementById('player2Squad'); // Player 2 Squad Div

const player1TotalRankSpan = document.getElementById('player1TotalRank');
const player2TotalRankSpan = document.getElementById('player2TotalRank'); // Player 2 Total Rank

const player1PointsSpentSpan = document.getElementById('player1PointsSpent');
const player2PointsSpentSpan = document.getElementById('player2PointsSpent'); // Player 2 Points Spent

const playerPointLimitSpans = document.querySelectorAll('.player-point-limit');

const diceResultsDisplay = document.getElementById('diceResultsDisplay');
const rollDiceButtons = document.querySelectorAll('.roll-dice-btn');

// Combat Setup Elements
const combatControlPanel = document.querySelector('.combat-control-panel');
const activeAttackerDisplay = document.getElementById('activeAttackerDisplay');
const activeTargetDisplay = document.getElementById('activeTargetDisplay'); // This is still the ID for the span
const resolveCombatBtn = document.getElementById('resolveCombatBtn');

// Combat Option Inputs
const targetInCoverCheckbox = document.getElementById('targetInCover');
const attackTypeSelect = document.getElementById('attackType');
const isStationaryAttackCheckbox = document.getElementById('isStationaryAttack');

const MODEL_COSTS = {
    small: 1,
    large: 2
};

const MAX_RANK_ROLLS = 3; 

let game = {
    currentTurn: 1,
    maxTurns: parseInt(maxTurnsInput.value), 
    pointLimit: parseInt(pointLimitInput.value),
    players: { // Reverted to two player objects
        1: {
            name: player1NameInput.value,
            orders: [], 
            squad: [],
            lieutenantId: null,
            totalRank: 0,
            pointsSpent: 0
        },
        2: {
            name: player2NameInput.value, 
            orders: [], 
            squad: [],
            lieutenantId: null,
            totalRank: 0,
            pointsSpent: 0
        }
    },
    nextModelId: 1,
    // Combat State
    activeAttacker: null, // {playerId: 1, modelId: 5}
    activeTarget: null,   // {playerId: 2, modelId: 3}
};

// --- Core Functions ---

function updateUI() {
    currentTurnSpan.textContent = game.currentTurn;
    maxTurnsDisplay.textContent = game.maxTurns; 
    playerPointLimitSpans.forEach(span => span.textContent = game.pointLimit);
    
    // Update UI for both players
    updatePlayerSpecificUI(1);
    updatePlayerSpecificUI(2);

    // Update Combat Setup Display
    updateCombatSetupDisplay();
}

function updatePlayerSpecificUI(playerId) {
    const player = game.players[playerId];
    
    // Update player name input
    const playerNameInputElem = playerId === 1 ? player1NameInput : player2NameInput;
    playerNameInputElem.value = player.name;

    // --- Order Token Rendering ---
    const orderTokensContainer = playerId === 1 ? player1OrderTokensContainer : player2OrderTokensContainer;
    orderTokensContainer.innerHTML = ''; // Clear existing tokens
    player.orders.forEach((isUsed, index) => {
        const orderToken = document.createElement('button');
        orderToken.className = `order-token ${isUsed ? 'used' : 'available'}`;
        orderToken.dataset.orderIndex = index;
        orderToken.dataset.playerId = playerId; // Add player ID to order token
        orderTokensContainer.appendChild(orderToken);
    });
    // --- End Order Token Rendering ---

    const playerSquadDiv = playerId === 1 ? player1SquadDiv : player2SquadDiv;
    playerSquadDiv.innerHTML = ''; // Clear existing models
    player.squad.forEach(model => {
        const modelCard = document.createElement('div');
        modelCard.className = `model-card ${model.isKO ? 'ko' : ''}`;
        modelCard.dataset.modelId = model.id;
        modelCard.dataset.playerId = playerId; // Add player ID to model card
        
        modelCard.innerHTML = `
            <div class="model-info">
                <img src="${model.mugshot}" alt="${model.name}" class="mugshot-img"> <!-- Mugshot Image -->
                <div>
                    ${model.name} <br>
                    Rank: <span class="model-rank-display">${model.rank}</span>
                    <span class="hits-taken-display">(Hits: ${model.hitsTaken})</span>
                    <span class="rank-rolls-display">(Rolls: ${model.rankRollsUsed}/${MAX_RANK_ROLLS})</span>
                </div>
            </div>
            <div class="model-controls">
                <div class="rank-input-group">
                    <input type="number" class="rank-input" value="${model.rank}" min="0" max="20">
                    <button class="roll-rank-btn" data-model-id="${model.id}" data-player-id="${playerId}" ${model.rankRollsUsed >= MAX_RANK_ROLLS ? 'disabled' : ''}>Roll Rank</button>
                </div>
                <button class="lieutenant-toggle ${model.id === player.lieutenantId ? 'is-lieutenant' : ''}" data-model-id="${model.id}" data-player-id="${playerId}">BB</button>
                <button class="ko-toggle ${model.isKO ? 'is-ko' : ''}" data-model-id="${model.id}" data-player-id="${playerId}">KO</button>
                <button class="remove-model-btn" data-model-id="${model.id}" data-player-id="${playerId}">X</button>
                <div class="damage-buttons">
                    <button class="apply-damage-btn" data-damage="-3" data-model-id="${model.id}" data-player-id="${playerId}">-3</button>
                    <button class="apply-damage-btn" data-damage="-6" data-model-id="${model.id}" data-player-id="${playerId}">-6</button>
                </div>
                <div class="combat-target-buttons">
                    <button class="set-attacker-btn" data-model-id="${model.id}" data-player-id="${playerId}">Set Attacker</button>
                    <button class="set-target-btn" data-model-id="${model.id}" data-player-id="${playerId}">Set Target</button>
                </div>
            </div>
        `;
        playerSquadDiv.appendChild(modelCard);
    });
    const totalRankSpan = playerId === 1 ? player1TotalRankSpan : player2TotalRankSpan;
    const pointsSpentSpan = playerId === 1 ? player1PointsSpentSpan : player2PointsSpentSpan;

    calculateTotalRank(playerId);
    calculatePointsSpent(playerId);
    totalRankSpan.textContent = player.totalRank;
    pointsSpentSpan.textContent = player.pointsSpent;
}

function calculateOrders(playerId) {
    const player = game.players[playerId];
    let totalOrders = 0; 
    const activeModels = player.squad.filter(model => !model.isKO);
    totalOrders += activeModels.length; 
    
    if (player.lieutenantId) {
        const lieutenant = player.squad.find(m => m.id === player.lieutenantId);
        if (lieutenant && !lieutenant.isKO) {
            totalOrders += 1; 
        }
    }
    player.orders = Array(totalOrders).fill(false); 
}

function calculateTotalRank(playerId) {
    const player = game.players[playerId];
    player.totalRank = player.squad.reduce((sum, model) => sum + (model.isKO ? 0 : model.rank), 0);
}

function calculatePointsSpent(playerId) {
    const player = game.players[playerId];
    player.pointsSpent = player.squad.reduce((sum, model) => sum + MODEL_COSTS[model.type], 0);
}

function updateCombatSetupDisplay() {
    let attackerName = "None";
    let targetName = "None";

    if (game.activeAttacker) {
        const attackerPlayer = game.players[game.activeAttacker.playerId];
        const attackerModel = attackerPlayer.squad.find(m => m.id === game.activeAttacker.modelId);
        if (attackerModel) {
            attackerName = `${attackerPlayer.name}'s ${attackerModel.name}`;
        } else {
            attackerName = `${attackerPlayer.name}'s [KO'd]`;
        }
    }

    if (game.activeTarget) {
        const targetPlayer = game.players[game.activeTarget.playerId];
        const targetModel = targetPlayer.squad.find(m => m.id === game.activeTarget.modelId);
        if (targetModel) {
            targetName = `${targetPlayer.name}'s ${targetModel.name}`; 
        } else {
            targetName = `${targetPlayer.name}'s [KO'd]`;
        }
    }
    activeAttackerDisplay.textContent = attackerName;
    activeTargetDisplay.textContent = targetName;
}

function resolveCombat() {
    if (!game.activeAttacker || !game.activeTarget) {
        alert("Please set both an Attacker and a Target to resolve combat.");
        return;
    }

    const attackerPlayer = game.players[game.activeAttacker.playerId];
    const attackerModel = attackerPlayer.squad.find(m => m.id === game.activeAttacker.modelId);
    const targetPlayer = game.players[game.activeTarget.playerId]; 
    const targetModel = targetPlayer.squad.find(m => m.id === game.activeTarget.modelId); 

    if (!attackerModel || attackerModel.isKO) {
        alert("Attacker is KO'd or invalid. Please select a valid attacker.");
        return;
    }
    if (!targetModel || targetModel.isKO) { 
        alert("Target is KO'd or invalid. Please select a valid target."); 
        return;
    }

    // Get combat options
    const isTargetInCover = targetInCoverCheckbox.checked; 
    const attackType = attackTypeSelect.value; 
    const isStationaryAttack = isStationaryAttackCheckbox.checked;

    let combatLog = `Combat between ${attackerModel.name} (Rank ${attackerModel.rank}) and ${targetModel.name} (Rank ${targetModel.rank}):\n`;
    combatLog += `Attack Type: ${attackType.toUpperCase()}, Stationary: ${isStationaryAttack ? 'Yes' : 'No'}, Target in Cover: ${isTargetInCover ? 'Yes' : 'No'}\n`;

    // Determine dice to roll based on rules
    let attackerDiceCount;
    let targetDiceCount; 

    // Attacker Dice
    if (attackType === 'ranged') {
        attackerDiceCount = 1; 
    } else { // melee
        attackerDiceCount = (attackerModel.type === 'large' ? 3 : 2); 
    }

    // Defender Dice
    targetDiceCount = 1; 
    if (attackType === 'melee') { 
        targetDiceCount = (targetModel.type === 'large' ? 3 : 2); 
    } 

    // Adjust Ranks for rolls based on rules
    let effectiveAttackerRank = attackerModel.rank;
    let effectiveTargetRank = targetModel.rank; 

    if (attackType === 'melee') {
        if (attackerModel.type === 'large') effectiveAttackerRank += 2; 
        if (targetModel.type === 'large') effectiveTargetRank += 2; 
    }
    if (isStationaryAttack) {
        effectiveAttackerRank += 2; // Stationary Attack Bonus is +2
    }
    // Ranged Cover Bonus
    if (attackType === 'ranged' && isTargetInCover) { 
        effectiveTargetRank += 3; 
    }

    // Cap effective ranks at 20
    effectiveAttackerRank = Math.min(20, effectiveAttackerRank);
    effectiveTargetRank = Math.min(20, effectiveTargetRank); 

    // Roll dice
    const attackerRolls = Array.from({ length: attackerDiceCount }, () => rollD20());
    const targetRolls = Array.from({ length: targetDiceCount }, () => rollD20()); 

    combatLog += `${attackerModel.name} (Eff. Rank ${effectiveAttackerRank}) rolls: ${attackerRolls.join(', ')}\n`;
    combatLog += `${targetModel.name} (Eff. Rank ${effectiveTargetRank}) rolls: ${targetRolls.join(', ')}\n`; 

    // Process rolls for successes and crits
    const processRollsResults = (rolls, rank) => {
        let successes = [];
        let crits = [];
        rolls.forEach(roll => {
            if (roll <= rank) {
                successes.push(roll);
                if (roll === rank) {
                    crits.push(roll);
                }
            }
        });
        return { successes, crits, highestSuccess: successes.length > 0 ? Math.max(...successes) : 0 };
    };

    const attackerResults = processRollsResults(attackerRolls, effectiveAttackerRank);
    const targetResults = processRollsResults(targetRolls, effectiveTargetRank); 

    let damageToTarget = 0; 
    let damageToAttacker = 0;
    let outcomeMessage = "";

    // --- Combat Resolution Logic (Based on Rulebook) ---

    // 1. Compare Critical Hits
    if (attackerResults.crits.length > 0 && targetResults.crits.length === 0) { 
        // Attacker Crit (and Defender is NOT Crit)
        damageToTarget = attackerResults.crits.length * 6; 
        outcomeMessage = `${attackerModel.name} scores a CRITICAL HIT! ${targetModel.name} takes ${damageToTarget} damage.`; 
    } else if (targetResults.crits.length > 0 && attackerResults.crits.length === 0) { 
        // Defender Crit (and Attacker is NOT Crit)
        outcomeMessage = `${targetModel.name} scores a CRITICAL DEFENSE! Attack is completely negated.`; 
    } else if (attackerResults.crits.length > 0 && targetResults.crits.length > 0) { 
        // Both Critical Hit: Defender's Crit wins
        outcomeMessage = `Both critical! ${targetModel.name}'s critical defense wins. Attack is negated.`; 
    } else {
        // 2. If NO Critical Hits from either side, compare Non-Crit Successes
        if (attackerResults.successes.length > 0 && targetResults.successes.length === 0) { 
            // Attacker Success, Defender Failure
            damageToTarget = attackerResults.successes.length * 3; 
            outcomeMessage = `${attackerModel.name} hits ${targetModel.name} for ${damageToTarget} damage.`; 
        } else if (attackerResults.successes.length === 0 && targetResults.successes.length > 0) { 
            // Attacker Failure, Defender Success -> Attacker takes 3 damage
            damageToAttacker = 3; 
            outcomeMessage = `${attackerModel.name} misses, but ${targetModel.name} successfully defends and counters! ${targetModel.name} takes 3 damage.`; 
        } else if (attackerResults.successes.length > 0 && targetResults.successes.length > 0) { 
            // Both Success (Non-Critical) - Higher roll wins
            if (attackerResults.highestSuccess > targetResults.highestSuccess) { 
                damageToTarget = attackerResults.successes.length * 3; 
                outcomeMessage = `${attackerModel.name}'s higher roll hits ${targetModel.name} for ${damageToTarget} damage.`; 
            } else { // Defender's roll is higher or tied
                outcomeMessage = `${targetModel.name}'s defense holds. Attack is negated.`; 
            }
        } else {
            // Both Failure
            outcomeMessage = "Both miss. No damage dealt.";
        }
    }

    // Apply damage
    if (damageToTarget > 0) {
        targetModel.rank = Math.min(20, Math.max(0, targetModel.rank - damageToTarget));
        targetModel.hitsTaken++;
        if (targetModel.rank <= 0) {
            targetModel.isKO = true;
            outcomeMessage += ` ${targetModel.name} is KO'd!`;
        }
    }
    if (damageToAttacker > 0) {
        attackerModel.rank = Math.min(20, Math.max(0, attackerModel.rank - damageToAttacker));
        attackerModel.hitsTaken++;
        if (attackerModel.rank <= 0) {
            attackerModel.isKO = true;
            outcomeMessage += ` ${attackerModel.name} is KO'd!`;
        }
    }

    alert(combatLog + "\n" + outcomeMessage); 

    // Clear active attacker/target after combat
    game.activeAttacker = null;
    game.activeTarget = null;

    // Update UI for both players after combat
    updateUI(); 
}

function resetGame() {
    game = {
        currentTurn: 1,
        maxTurns: parseInt(maxTurnsInput.value), 
        pointLimit: parseInt(pointLimitInput.value),
        players: {
            1: {
                name: player1NameInput.value, 
                orders: [], 
                squad: [],
                lieutenantId: null,
                totalRank: 0,
                pointsSpent: 0
            },
            2: {
                name: player2NameInput.value, 
                orders: [], 
                squad: [],
                lieutenantId: null,
                totalRank: 0,
                pointsSpent: 0
            }
        },
        nextModelId: 1,
        activeAttacker: null,
        activeTarget: null
    };
    calculateOrders(1); 
    calculateOrders(2); 
    updateUI(); 
}

// --- Utility Function ---
function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

// --- Random Name Generator ---
const BRUTISH_NAMES = [
    "Fat Freddy", "Big Bertha", "Muscle Mike", "Broad Brad", "Tall Tim", "Heavy Henry", "Giant Jeff",
    "Bully Bob", "Tankard Tim", "Iron Ike", "Slammin' Sam", "Bruiser Bruce", "Grizzly Gus", "Lumbering Lou", "Boulder Ben", "Thumper Tom", "The Wall Wally", "King Kong Karl", "Hulk Hogan", "Mighty Max", "Goliath Greg"
];
const SCRAPPY_NAMES = [
    "Sneaky Sam", "Nimble Nick", "Dodgy Derek", "Quick Kyle", "Shady Sammy",
    "Whiskey Wally", "Darting Dave", "Jittery Jim", "Flicker Finn", "Spry Spike",
    "Tiny Tim", "Zippy Zach", "Blinky Ben", "Chip Charlie", "Pocket Paul", "Wriggly Ron", "Pint-Sized Pete", "Slippery Sid", "Mickey Mouse", "Speedy Steve"
];

// Array to keep track of used names to prevent duplicates
let usedNames = [];

function getRandomName(type) {
    let namesList;
    if (type === 'large') {
        namesList = BRUTISH_NAMES;
    } else { // small
        namesList = SCRAPPY_NAMES;
    }

    // Filter out names already used
    let availableNames = namesList.filter(name => !usedNames.includes(name));

    // If all names are used, reset the usedNames array (or handle as an error)
    if (availableNames.length === 0) {
        usedNames = []; // Reset for a new cycle
        availableNames = namesList; // All names are now available again
        console.warn("All unique names used. Resetting name pool.");
    }

    const randomIndex = Math.floor(Math.random() * availableNames.length);
    const selectedName = availableNames[randomIndex];
    
    usedNames.push(selectedName); // Add the selected name to the used list
    return selectedName;
}
// --- End Random Name Generator ---

// --- Event Listeners ---

// Player Name Inputs
player1NameInput.addEventListener('change', (e) => {
    game.players[1].name = e.target.value;
    updateCombatSetupDisplay(); 
});
player2NameInput.addEventListener('change', (e) => {
    game.players[2].name = e.target.value;
    updateCombatSetupDisplay(); 
});

// Max Turns Input Listener
maxTurnsInput.addEventListener('change', () => {
    let newMaxTurns = parseInt(maxTurnsInput.value);
    if (isNaN(newMaxTurns) || newMaxTurns < 1) newMaxTurns = 1;
    if (newMaxTurns > 10) newMaxTurns = 10; 
    maxTurnsInput.value = newMaxTurns; 
    game.maxTurns = newMaxTurns;
    
    if (game.currentTurn > game.maxTurns) {
        game.currentTurn = 1;
        calculateOrders(1); 
        calculateOrders(2); 
    }
    updateUI(); 
});

nextTurnBtn.addEventListener('click', () => {
    if (game.currentTurn < game.maxTurns) { 
        game.currentTurn++;
        calculateOrders(1); 
        calculateOrders(2); 
        updateUI();
    } else {
        alert(`Game over! Max ${game.maxTurns} turns reached.`); 
    }
});

resetGameBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset the game?")) {
        resetGame();
    }
});

pointLimitInput.addEventListener('change', () => {
    let newLimit = parseInt(pointLimitInput.value);
    if (isNaN(newLimit) || newLimit < 1) newLimit = 1;
    if (newLimit > 10) newLimit = 10;
    pointLimitInput.value = newLimit;
    game.pointLimit = newLimit;
    
    if (game.players[1].pointsSpent > game.pointLimit || game.players[2].pointsSpent > game.pointLimit) {
        alert("Warning: One or both players' squads currently exceed the new point limit. Consider resetting the game or removing models.");
    }
    updateUI();
});

// Order Tokens Container Click Listener (Event Delegation for both players)
document.querySelectorAll('.player-orders').forEach(container => {
    container.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('order-token')) {
            const orderIndex = parseInt(target.dataset.orderIndex);
            const playerId = parseInt(target.dataset.playerId);
            game.players[playerId].orders[orderIndex] = !game.players[playerId].orders[orderIndex];
            updatePlayerSpecificUI(playerId); 
        }
    });
});

// Add Model buttons (attached directly for robustness)
document.querySelectorAll('.add-model-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const playerId = parseInt(e.target.dataset.player); 
        const type = e.target.dataset.type; 
        const cost = MODEL_COSTS[type];

        if (game.players[playerId].pointsSpent + cost > game.pointLimit) {
            alert(`Cannot add ${type === 'small' ? 'Scrapper' : 'Brute'} model. Exceeds point limit of ${game.pointLimit}. Current points: ${game.players[playerId].pointsSpent}`);
            return;
        }

        const newModel = {
            id: game.nextModelId++,
            type: type,
            name: getRandomName(type), 
            rank: 10, 
            hitsTaken: 0,
            rankRollsUsed: 0,
            isKO: false
        };
        game.players[playerId].squad.push(newModel);
        calculateOrders(playerId); 
        updatePlayerSpecificUI(playerId); 
    });
});

// Universal Dice Roller Listener (attached directly for robustness)
rollDiceButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const numDice = parseInt(e.target.dataset.numDice);
        let results = [];
        for (let i = 0; i < numDice; i++) {
            results.push(rollD20());
        }
        diceResultsDisplay.textContent = results.join(', ');
    });
});

// Player Panels Click Listener (Event Delegation for model controls)
document.querySelectorAll('.player-panel').forEach(panel => {
    panel.addEventListener('click', (e) => {
        const target = e.target;
        const modelCard = target.closest('.model-card'); 
        const playerId = parseInt(panel.dataset.playerId); 
        
        // Handle player name input separately
        const playerNameInputElem = playerId === 1 ? player1NameInput : player2NameInput;
        if (target === playerNameInputElem) {
            // This is handled by specific playerNameInput listeners
            return; 
        }

        // If click is not on a model card control, exit
        if (!modelCard) {
            return; 
        }

        const modelId = parseInt(modelCard.dataset.modelId);
        const player = game.players[playerId]; 
        const model = player.squad.find(m => m.id === modelId);

        if (!model) return; 

        if (target.classList.contains('remove-model-btn')) {
            if (model.id === player.lieutenantId && !confirm("This is your BB. Are you sure you want to remove them?")) {
                return;
            }
            player.squad = player.squad.filter(m => m.id !== modelId);
            if (player.lieutenantId === modelId) {
                player.lieutenantId = null;
            }
            calculateOrders(playerId); 
        } else if (target.classList.contains('lieutenant-toggle')) {
            if (model.id === player.lieutenantId) { // Check against model.id directly
                player.lieutenantId = null;
            } else {
                if (player.lieutenantId !== null) {
                    alert("You can only have one BB at a time. Please unassign the current BB first.");
                    return;
                }
                player.lieutenantId = model.id; // Set using model.id
            }
            calculateOrders(playerId); 
        } else if (target.classList.contains('ko-toggle')) {
            model.isKO = !model.isKO;
            calculateOrders(playerId); 
        } else if (target.classList.contains('apply-damage-btn')) {
            const damageAmount = parseInt(target.dataset.damage);
            model.rank = Math.min(20, Math.max(0, model.rank + damageAmount)); 
            model.hitsTaken++; 

            if (model.rank <= 0) {
                model.isKO = true; 
            }
        } else if (target.classList.contains('roll-rank-btn')) {
            if (model.rankRollsUsed >= MAX_RANK_ROLLS) {
                alert(`This model has already used its ${MAX_RANK_ROLLS} Rank rerolls.`);
                return;
            }
            const rolledRank = rollD20();
            model.rank = rolledRank; 
            model.rankRollsUsed++; 
            modelCard.querySelector('.rank-input').value = rolledRank;
            modelCard.querySelector('.model-rank-display').textContent = rolledRank;
            modelCard.querySelector('.rank-rolls-display').textContent = `(Rolls: ${model.rankRollsUsed}/${MAX_RANK_ROLLS})`;
            if (model.rankRollsUsed >= MAX_RANK_ROLLS) {
                target.disabled = true;
            }
            calculateTotalRank(playerId); 
            const totalRankSpan = playerId === 1 ? player1TotalRankSpan : player2TotalRankSpan;
            totalRankSpan.textContent = player.totalRank; 
            return; 
        } else if (target.classList.contains('set-attacker-btn')) {
            game.activeAttacker = { playerId: playerId, modelId: model.id };
        } else if (target.classList.contains('set-target-btn')) { // Corrected to set-defender-btn
            game.activeTarget = { playerId: playerId, modelId: model.id };
        }
        updatePlayerSpecificUI(playerId); 
        updateCombatSetupDisplay(); 
    });

    panel.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('rank-input')) {
            const modelCard = target.closest('.model-card');
            if (!modelCard) return; 

            const playerId = parseInt(panel.dataset.playerId); 
            const modelId = parseInt(modelCard.dataset.modelId);
            const player = game.players[playerId]; 
            const model = player.squad.find(m => m.id === modelId);

            if (model) {
                let newRank = parseInt(target.value);
                if (isNaN(newRank) || newRank < 0) newRank = 0;
                if (newRank > 20) newRank = 20;
                
                model.rank = newRank;
                target.closest('.model-card').querySelector('.model-rank-display').textContent = newRank;
                calculateTotalRank(playerId); 
                
                const totalRankSpan = playerId === 1 ? player1TotalRankSpan : player2TotalRankSpan;
                totalRankSpan.textContent = player.totalRank;
            }
        }
    });
});

// Resolve Combat Button Listener
resolveCombatBtn.addEventListener('click', resolveCombat); 

// Initial setup when the page loads
resetGame(); 
});

// --- Random Name Generator ---
const BRUTISH_NAMES = [
"Fat Freddy", "Big Bertha", "Muscle Mike", "Broad Brad", "Tall Tim", "Heavy Henry", "Giant Jeff",
"Bully Bob", "Tankard Tim", "Iron Ike", "Slammin' Sam", "Bruiser Bruce", "Grizzly Gus", "Lumbering Lou", "Boulder Ben", "Thumper Tom", "The Wall Wally", "King Kong Karl", "Hulk Hogan", "Mighty Max", "Goliath Greg"
];
const SCRAPPY_NAMES = [
"Sneaky Sam", "Nimble Nick", "Dodgy Derek", "Quick Kyle", "Shady Sammy",
"Whiskey Wally", "Darting Dave", "Jittery Jim", "Flicker Finn", "Spry Spike",
"Tiny Tim", "Zippy Zach", "Blinky Ben", "Chip Charlie", "Pocket Paul", "Wriggly Ron", "Pint-Sized Pete", "Slippery Sid", "Mickey Mouse", "Speedy Steve"
];

// Array to keep track of used names to prevent duplicates
let usedNames = [];

function getRandomName(type) {
let namesList;
if (type === 'large') {
    namesList = BRUTISH_NAMES;
} else { // small
    namesList = SCRAPPY_NAMES;
}

// Filter out names already used
let availableNames = namesList.filter(name => !usedNames.includes(name));

// If all names are used, reset the usedNames array (or handle as an error)
if (availableNames.length === 0) {
    usedNames = []; // Reset for a new cycle
    availableNames = namesList; // All names are now available again
    console.warn("All unique names used. Resetting name pool.");
}

const randomIndex = Math.floor(Math.random() * availableNames.length);
const selectedName = availableNames[randomIndex];

usedNames.push(selectedName); // Add the selected name to the used list
return selectedName;
}
// --- End Random Name Generator ---

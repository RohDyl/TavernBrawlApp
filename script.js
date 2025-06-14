document.addEventListener('DOMContentLoaded', () => {
const currentTurnSpan = document.getElementById('currentTurn');
const nextTurnBtn = document.getElementById('nextTurnBtn');
const resetGameBtn = document.getElementById('resetGameBtn');
const pointLimitInput = document.getElementById('pointLimitInput');
const playerNameInput = document.getElementById('playerNameInput');

const orderTokensContainer = document.getElementById('orderTokensContainer');

const playerSquadDiv = document.getElementById('player1Squad');
const playerTotalRankSpan = document.getElementById('player1TotalRank');
const playerPointsSpentSpan = document.getElementById('player1PointsSpent');
const playerPointLimitSpans = document.querySelectorAll('.player-point-limit');

const diceResultsDisplay = document.getElementById('diceResultsDisplay');
const rollDiceButtons = document.querySelectorAll('.roll-dice-btn');

const MODEL_COSTS = {
    small: 1,
    large: 2
};

const MAX_RANK_ROLLS = 3; 

let game = {
    currentTurn: 1,
    pointLimit: parseInt(pointLimitInput.value),
    player: {
        name: playerNameInput.value,
        orders: [], // Array of order states (true/false for used/available)
        squad: [],
        lieutenantId: null,
        totalRank: 0,
        pointsSpent: 0
    },
    nextModelId: 1
};

// --- Core Functions ---

function updateUI() {
    currentTurnSpan.textContent = game.currentTurn;
    playerPointLimitSpans.forEach(span => span.textContent = game.pointLimit);
    updatePlayerSpecificUI();
}

function updatePlayerSpecificUI() {
    const player = game.player;
    
    playerNameInput.value = player.name;

    // --- Order Token Rendering ---
    orderTokensContainer.innerHTML = ''; // Clear existing tokens
    player.orders.forEach((isUsed, index) => {
        const orderToken = document.createElement('button');
        orderToken.className = `order-token ${isUsed ? 'used' : 'available'}`;
        orderToken.dataset.orderIndex = index;
        orderTokensContainer.appendChild(orderToken);
    });
    // --- End Order Token Rendering ---

    playerSquadDiv.innerHTML = ''; // Clear existing models
    player.squad.forEach(model => {
        const modelCard = document.createElement('div');
        modelCard.className = `model-card ${model.isKO ? 'ko' : ''}`;
        modelCard.dataset.modelId = model.id;
        
        modelCard.innerHTML = `
            <div class="model-info">
                ${model.name} <br>
                Rank: <span class="model-rank-display">${model.rank}</span>
                <span class="hits-taken-display">(Hits: ${model.hitsTaken})</span>
                <span class="rank-rolls-display">(Rolls: ${model.rankRollsUsed}/${MAX_RANK_ROLLS})</span>
            </div>
            <div class="model-controls">
                <div class="rank-input-group">
                    <input type="number" class="rank-input" value="${model.rank}" min="0" max="20">
                    <button class="roll-rank-btn" data-model-id="${model.id}" ${model.rankRollsUsed >= MAX_RANK_ROLLS ? 'disabled' : ''}>Roll Rank</button>
                </div>
                <button class="lieutenant-toggle ${model.id === player.lieutenantId ? 'is-lieutenant' : ''}" data-model-id="${model.id}">BB</button>
                <button class="ko-toggle ${model.isKO ? 'is-ko' : ''}" data-model-id="${model.id}">KO</button>
                <button class="remove-model-btn" data-model-id="${model.id}">X</button>
                <div class="damage-buttons">
                    <button class="apply-damage-btn" data-damage="-3" data-model-id="${model.id}">-3</button>
                    <button class="apply-damage-btn" data-damage="-6" data-model-id="${model.id}">-6</button>
                </div>
            </div>
        `;
        playerSquadDiv.appendChild(modelCard);
    });
    calculateTotalRank();
    calculatePointsSpent();
    playerTotalRankSpan.textContent = player.totalRank;
    playerPointsSpentSpan.textContent = player.pointsSpent;
}

function calculateOrders() {
    const player = game.player;
    let totalOrders = 0; // Start with 0
    const activeModels = player.squad.filter(model => !model.isKO);
    totalOrders += activeModels.length; // Each active model adds an order
    
    // Big Bozza bonus
    if (player.lieutenantId) {
        const lieutenant = player.squad.find(m => m.id === player.lieutenantId);
        if (lieutenant && !lieutenant.isKO) {
            totalOrders += 1; // Add 1 extra order for Big Bozza
        }
    }
    
    // When calculating orders for a new turn, create a fresh array of available orders
    player.orders = Array(totalOrders).fill(false); 
}

function calculateTotalRank() {
    const player = game.player;
    player.totalRank = player.squad.reduce((sum, model) => sum + (model.isKO ? 0 : model.rank), 0);
}

function calculatePointsSpent() {
    const player = game.player;
    player.pointsSpent = player.squad.reduce((sum, model) => sum + MODEL_COSTS[model.type], 0);
}

function resetGame() {
    game = {
        currentTurn: 1,
        pointLimit: parseInt(pointLimitInput.value),
        player: {
            name: playerNameInput.value,
            orders: [], // Reset to empty array, calculateOrders will fill it
            squad: [],
            lieutenantId: null,
            totalRank: 0,
            pointsSpent: 0
        },
        nextModelId: 1
    };
    calculateOrders(); 
    updateUI(); 
}

// --- Utility Function ---
function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

// --- Event Listeners ---

playerNameInput.addEventListener('change', (e) => {
    game.player.name = e.target.value;
});

nextTurnBtn.addEventListener('click', () => {
    if (game.currentTurn < 3) {
        game.currentTurn++;
        calculateOrders(); // This will reset orders to available for the new turn
        updateUI();
    } else {
        alert("Game over! Max 3 turns reached.");
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
    
    if (game.player.pointsSpent > game.pointLimit) {
        alert("Warning: Your squad currently exceeds the new point limit. Consider resetting the game or removing models.");
    }
    updateUI();
});

// Order Tokens Container Click Listener (Event Delegation)
orderTokensContainer.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('order-token')) {
        const orderIndex = parseInt(target.dataset.orderIndex);
        // Toggle the used state of the clicked order token
        game.player.orders[orderIndex] = !game.player.orders[orderIndex];
        updatePlayerSpecificUI(); // Re-render to show updated state
    }
});

document.querySelectorAll('.add-model-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        const cost = MODEL_COSTS[type];

        if (game.player.pointsSpent + cost > game.pointLimit) {
            alert(`Cannot add ${type} model. Exceeds point limit of ${game.pointLimit}. Current points: ${game.player.pointsSpent}`);
            return;
        }

        const newModel = {
            id: game.nextModelId++,
            type: type,
            name: getRandomName(type), // Assign a random name
            rank: 10, // Default starting rank
            hitsTaken: 0,
            rankRollsUsed: 0,
            isKO: false
        };
        game.player.squad.push(newModel);
        calculateOrders(); // Recalculate orders when a model is added
        updatePlayerSpecificUI(); 
    });
});

// Universal Dice Roller Listener
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

document.getElementById('player1Panel').addEventListener('click', (e) => {
    const target = e.target;
    const modelCard = target.closest('.model-card');
    if (!modelCard) {
        // If click is not on a model card, it's a click on the panel background or other non-model elements.
        // This is fine, just return.
        return; 
    }

    const modelId = parseInt(modelCard.dataset.modelId);
    const player = game.player;
    const model = player.squad.find(m => m.id === modelId);

    if (!model) return; // Should not happen if modelId is correct

    if (target.classList.contains('remove-model-btn')) {
        if (model.id === player.lieutenantId && !confirm("This is your BB. Are you sure you want to remove them?")) {
            return;
        }
        player.squad = player.squad.filter(m => m.id !== modelId);
        if (player.lieutenantId === modelId) {
            player.lieutenantId = null;
        }
        calculateOrders(); // Recalculate orders if a model is removed
    } else if (target.classList.contains('lieutenant-toggle')) {
        if (player.lieutenantId === modelId) {
            player.lieutenantId = null;
        } else {
            if (player.lieutenantId !== null) {
                alert("You can only have one BB at a time. Please unassign the current BB first.");
                return;
            }
            player.lieutenantId = modelId;
        }
        calculateOrders(); // Recalculate orders immediately
    } else if (target.classList.contains('ko-toggle')) {
        model.isKO = !model.isKO;
        calculateOrders(); // Recalculate orders if BB is KO'd
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
        calculateTotalRank(); 
        playerTotalRankSpan.textContent = game.player.totalRank; 
        return; 
    }
    updatePlayerSpecificUI(); 
});

document.getElementById('player1Panel').addEventListener('change', (e) => {
    const target = e.target;
    if (target.classList.contains('rank-input')) {
        const modelCard = target.closest('.model-card');
        if (!modelCard) return; 

        const modelId = parseInt(modelCard.dataset.modelId);
        const player = game.player;
        const model = player.squad.find(m => m.id === modelId);

        if (model) {
            let newRank = parseInt(target.value);
            if (isNaN(newRank) || newRank < 0) newRank = 0;
            if (newRank > 20) newRank = 20;
            
            model.rank = newRank;
            target.closest('.model-card').querySelector('.model-rank-display').textContent = newRank;
            calculateTotalRank(); 
            
            playerTotalRankSpan.textContent = player.totalRank;
        }
    }
});

// Initial setup when the page loads
resetGame(); 
});

// --- Random Name Generator (Moved outside DOMContentLoaded for clarity) ---
const BRUTISH_NAMES = [
"Big Mike", "Frankie", "Butch", "Tiny", "Brenda", "Gus", "Duke", "Hammerhead", "Knuckles", "Mauler"
];
const SCRAPPY_NAMES = [
"Spike", "Rusty", "Whisper", "Twitch", "Mickey", "Ace", "Jinxie", "Fizz", "Shorty", "Dart"
];

function getRandomName(type) {
let namesList;
let prefix;
if (type === 'large') {
    namesList = BRUTISH_NAMES;
    prefix = "Brutish";
} else { // small
    namesList = SCRAPPY_NAMES;
    prefix = "Scrappy";
}
const randomName = namesList[Math.floor(Math.random() * namesList.length)];
return `${prefix} ${randomName}`;
}
// --- End Random Name Generator ---
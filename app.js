// Animal Dictionary Logic
const dictionary = {
    "BIRD": ["eagle", "parrot", "penguin"],
    "INSECT": ["bee"],
    "MAMMAL": ["bear", "cheetah", "elephant", "giraffe", "leopard", "gorilla", "lion", "monkey", "seal", "tiger", "whale", "wolf"],
    "REPTILE": ["crocodile", "snake", "lizard"]
};

let animalList = [];
for (let category in dictionary) {
    dictionary[category].forEach(animal => {
        animalList.push({ name: animal, category: category });
    });
}

// Drop Zone Mapping
const corners = {
    "0,0": "BIRD",
    "0,14": "INSECT",
    "14,0": "MAMMAL",
    "14,14": "REPTILE"
};

// 15x15 Solvable Maze (0: Path, 1: Wall)
const maze = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0],
    [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Center Row
    [0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    [0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const MAZE_SIZE = 15;
let charX = 7;
let charY = 7;

// Enemy Logic
let enemyX = 2;
let enemyY = 2;
let enemyInterval;

let currentAnimal = null;
let selectedChar = null;
let isPlaying = false;

// Lives System
const MAX_LIVES = 5;
let lives = MAX_LIVES;

/* 
    Karakter Sprite Yön Haritası
*/
const spriteMap = {
    'down': 1,
    'left': 5,
    'up': 9,
    'right': 13
};

// DOM Elements
const charBoxes = document.querySelectorAll('.char-box');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const mazeContainer = document.getElementById('maze-container');
const characterEl = document.getElementById('character');
const enemyEl = document.getElementById('enemy');
const animalDisplay = document.getElementById('animal-display');
const livesDisplay = document.getElementById('lives-display');
const popupOverlay = document.getElementById('popup-overlay');
const popupMsg = document.getElementById('popup-msg');
const popupBtn = document.getElementById('popup-btn');
const popupBox = document.getElementById('popup-box');

// Character Selection
charBoxes.forEach(box => {
    box.addEventListener('click', () => {
        charBoxes.forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
        selectedChar = box.dataset.char;
        startBtn.disabled = false;
    });
});

// Start Game Event
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    lives = MAX_LIVES;
    updateLivesDisplay();
    initMaze();
    resetCharacter();
    resetEnemy();
    pickRandomAnimal();
    isPlaying = true;
    startEnemyAI();
});

// Lives Display
function updateLivesDisplay() {
    livesDisplay.textContent = '❤️'.repeat(lives) + '🖤'.repeat(MAX_LIVES - lives);
}

function loseLife() {
    lives--;
    updateLivesDisplay();
    // Shake animation
    livesDisplay.classList.remove('shake');
    void livesDisplay.offsetWidth;
    livesDisplay.classList.add('shake');
    if (lives <= 0) {
        showPopup("Game Over! 💀", false, true);
        return true;
    }
    return false;
}

function initMaze() {
    mazeContainer.style.gridTemplateColumns = `repeat(${MAZE_SIZE}, var(--cell-size))`;
    mazeContainer.style.gridTemplateRows = `repeat(${MAZE_SIZE}, var(--cell-size))`;
    
    // Remove old cells if any
    document.querySelectorAll('.cell').forEach(el => el.remove());

    for (let y = 0; y < MAZE_SIZE; y++) {
        for (let x = 0; x < MAZE_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (maze[y][x] === 1) {
                cell.classList.add('wall');
            } else {
                cell.classList.add('path');
            }
            
            // Assign corners
            if (y === 0 && x === 0) cell.dataset.corner = "BIRD";
            else if (y === 0 && x === MAZE_SIZE-1) cell.dataset.corner = "INSECT";
            else if (y === MAZE_SIZE-1 && x === 0) cell.dataset.corner = "MAMMAL";
            else if (y === MAZE_SIZE-1 && x === MAZE_SIZE-1) cell.dataset.corner = "REPTILE";
            
            mazeContainer.appendChild(cell);
        }
    }
    // Ensure characters are on top
    mazeContainer.appendChild(characterEl);
    mazeContainer.appendChild(enemyEl);
}

function updateCharacterPosition(direction = 'down') {
    characterEl.style.left = `calc(${charX} * var(--cell-size))`;
    characterEl.style.top = `calc(${charY} * var(--cell-size))`;
    
    const prefix = selectedChar === '1' ? 'b' : 'g';
    const folder = `karakter ${selectedChar}`;
    const frame = spriteMap[direction] || 1;
    characterEl.style.backgroundImage = `url('gorseller/${folder}/${prefix}${frame}.png')`;
}

function updateEnemyPosition() {
    enemyEl.style.left = `calc(${enemyX} * var(--cell-size))`;
    enemyEl.style.top = `calc(${enemyY} * var(--cell-size))`;
    // m1.png görseli kovalıyor (sprite haritası yok, sabit tek resim kabul ediyoruz)
    enemyEl.style.backgroundImage = `url('gorseller/karakter 3/m1.png')`;
}

function resetCharacter() {
    charX = 7;
    charY = 7; // Merkezde başlıyor
    updateCharacterPosition('down');
}

function resetEnemy() {
    // Uzak bir noktada başlat
    enemyX = 2;
    enemyY = 2;
    updateEnemyPosition();
}

function pickRandomAnimal() {
    let nextAnimal;
    do {
        const randomIndex = Math.floor(Math.random() * animalList.length);
        nextAnimal = animalList[randomIndex];
    } while (currentAnimal && nextAnimal.name === currentAnimal.name && animalList.length > 1);
    
    currentAnimal = nextAnimal;
    animalDisplay.textContent = currentAnimal.name;
    
    // Bounce Animation
    animalDisplay.classList.remove('bounce');
    void animalDisplay.offsetWidth; // trigger reflow
    animalDisplay.classList.add('bounce');
}

function move(direction) {
    if (!isPlaying) return;
    
    let nextX = charX;
    let nextY = charY;
    
    if (direction === 'up') nextY--;
    else if (direction === 'down') nextY++;
    else if (direction === 'left') nextX--;
    else if (direction === 'right') nextX++;
    
    if (nextX >= 0 && nextX < MAZE_SIZE && nextY >= 0 && nextY < MAZE_SIZE) {
        if (maze[nextY][nextX] !== 1) {
            charX = nextX;
            charY = nextY;
            updateCharacterPosition(direction);
            
            // Check collision immediately after moving
            if(checkEnemyCollision()) return;
            
            checkWinCondition();
        } else {
            updateCharacterPosition(direction); // turn to face wall
        }
    } else {
        updateCharacterPosition(direction); // turn to face boundary
    }
}

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    // Prevent default scroll behaviors
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    
    if (e.key === 'ArrowUp') move('up');
    else if (e.key === 'ArrowDown') move('down');
    else if (e.key === 'ArrowLeft') move('left');
    else if (e.key === 'ArrowRight') move('right');
});

// Mobile Controls
document.getElementById('btn-up').addEventListener('click', () => move('up'));
document.getElementById('btn-down').addEventListener('click', () => move('down'));
document.getElementById('btn-left').addEventListener('click', () => move('left'));
document.getElementById('btn-right').addEventListener('click', () => move('right'));

function checkWinCondition() {
    const posKey = `${charY},${charX}`;
    if (corners[posKey]) {
        if (corners[posKey] === currentAnimal.category) {
            showPopup("Well done! 🎉", true, false);
        } else {
            // Wrong answer: lose a life
            if (!loseLife()) {
                showPopup("Try again! ❌", false, false);
            }
        }
    }
}

// Enemy AI: BFS Shortest Path Algorithm
function startEnemyAI() {
    if (enemyInterval) clearInterval(enemyInterval);
    enemyInterval = setInterval(() => {
        if (!isPlaying) return;
        
        const path = findShortestPath(enemyX, enemyY, charX, charY);
        if (path && path.length > 0) {
            const nextStep = path[0];
            
            enemyX = nextStep.x;
            enemyY = nextStep.y;
            updateEnemyPosition();
            
            checkEnemyCollision();
        }
    }, 600); // Düşman 600ms'de bir hareket eder
}

function findShortestPath(startX, startY, targetX, targetY) {
    const queue = [{x: startX, y: startY, path: []}];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    
    const dirs = [
        {dx: 0, dy: -1}, // up
        {dx: 0, dy: 1},  // down
        {dx: -1, dy: 0}, // left
        {dx: 1, dy: 0}   // right
    ];
    
    while (queue.length > 0) {
        const curr = queue.shift();
        
        if (curr.x === targetX && curr.y === targetY) {
            return curr.path;
        }
        
        for (let d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            
            if (nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE && maze[ny][nx] !== 1) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({x: nx, y: ny, path: [...curr.path, {x: nx, y: ny}]});
                }
            }
        }
    }
    return null; // no path found
}

function checkEnemyCollision() {
    if (charX === enemyX && charY === enemyY) {
        // Enemy caught you: lose a life
        if (!loseLife()) {
            showPopup("Caught by the enemy! 😱", false, false);
        }
        return true;
    }
    return false;
}

function showPopup(msg, isSuccess, isGameOver) {
    isPlaying = false;
    popupMsg.textContent = msg;
    
    if (isSuccess) {
        popupMsg.style.color = 'var(--secondary)';
        popupBox.style.borderColor = 'var(--secondary)';
    } else {
        popupMsg.style.color = 'var(--primary)';
        popupBox.style.borderColor = 'var(--primary)';
    }
    
    popupOverlay.classList.remove('hidden');
    
    if (isGameOver) {
        // Game Over: stop enemy, show restart
        if (enemyInterval) clearInterval(enemyInterval);
        popupBtn.textContent = 'Restart';
        popupBtn.onclick = () => {
            popupOverlay.classList.add('hidden');
            lives = MAX_LIVES;
            updateLivesDisplay();
            resetCharacter();
            resetEnemy();
            pickRandomAnimal();
            popupBtn.textContent = 'Continue';
            setTimeout(() => {
                isPlaying = true;
                startEnemyAI();
            }, 150);
        };
    } else {
        popupBtn.textContent = 'Continue';
        popupBtn.onclick = () => {
            popupOverlay.classList.add('hidden');
            resetCharacter();
            resetEnemy();
            if (isSuccess) {
                pickRandomAnimal();
            }
            setTimeout(() => { isPlaying = true; }, 150);
        };
    }
}

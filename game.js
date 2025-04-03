// Orange Dynasty Game
// A professional contribution to the Orange Dynasty community

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameStarted = false;

// Track key states for continuous movement
const keys = {};

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!gameStarted) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;
    player.x += deltaX;
    player.y += deltaY;
    touchStartX = touchX;
    touchStartY = touchY;
    // Keep player within bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
});

// Shoot button for mobile
document.getElementById('shootButton').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameStarted) return;
    player.shoot();
});

// Base dimensions for scaling
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
let scaleX, scaleY;

// Resize canvas for responsiveness
function resizeCanvas() {
    const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
    let width = window.innerWidth * 0.9;
    let height = window.innerHeight * 0.9;
    if (width / height > aspectRatio) {
        height = Math.min(height, BASE_HEIGHT);
        width = height * aspectRatio;
    } else {
        width = Math.min(width, BASE_WIDTH);
        height = width / aspectRatio;
    }
    canvas.width = width;
    canvas.height = height;
    scaleX = canvas.width / BASE_WIDTH;
    scaleY = canvas.height / BASE_HEIGHT;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Load assets (images and sounds)
const playerImg = new Image();
playerImg.src = 'assets/player.png';
playerImg.onerror = () => console.error("Failed to load player.png");

const enemyImg = new Image();
enemyImg.src = 'assets/enemy1.png';
enemyImg.onerror = () => console.error("Failed to load enemy1.png");

const bossImg = new Image();
bossImg.src = 'assets/boss.png';
bossImg.onerror = () => console.error("Failed to load boss.png");

const projectilePlayerImg = new Image();
projectilePlayerImg.src = 'assets/projectile_player.png';
projectilePlayerImg.onerror = () => console.error("Failed to load projectile_player.png");

const projectileEnemyImg = new Image();
projectileEnemyImg.src = 'assets/projectile_enemy.png';
projectileEnemyImg.onerror = () => console.error("Failed to load projectile_enemy.png");

const coinImg = new Image();
coinImg.src = 'assets/coin.png';
coinImg.onerror = () => console.error("Failed to load coin.png");

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';
backgroundImg.onerror = () => console.error("Failed to load background.png");

const coinSound = new Audio('assets/coin_collect.mp3');
const hitSound = new Audio('assets/enemy_hit.mp3'); // Player hit
const destroySound = new Audio('assets/enemy_destroy.mp3'); // Enemy destroyed

// Player class
class Player {
    constructor() {
        this.width = 50 * scaleX;
        this.height = 50 * scaleY;
        this.x = 100 * scaleX;
        this.y = (canvas.height - this.height) / 2;
        this.speed = 5 * scaleX; // Adjust speed as needed
        this.lives = 3;
        this.shootCooldown = 0;
        this.maxCooldown = 20; // Adjust for shooting speed
    }
    draw() {
        if (playerImg.complete && playerImg.naturalWidth !== 0) {
            ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
        }
    }
    move(direction) {
        switch (direction) {
            case 'left': this.x -= this.speed; break;
            case 'right': this.x += this.speed; break;
            case 'up': this.y -= this.speed; break;
            case 'down': this.y += this.speed; break;
        }
        // Keep player within bounds
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height - this.height) this.y = canvas.height - this.height;
    }
    shoot() {
        if (this.shootCooldown <= 0) {
            projectiles.push(new Projectile(this.x + this.width, this.y + this.height / 2, 'player'));
            this.shootCooldown = this.maxCooldown;
        }
    }
    update() {
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
}

// Enemy class
class Enemy {
    constructor() {
        this.width = 50 * scaleX;
        this.height = 50 * scaleY;
        this.x = canvas.width + Math.random() * 100 * scaleX;
        this.y = Math.random() * (canvas.height - this.height);
        this.speed = (3 + Math.random() * 2) * scaleX;
        this.shootTimer = Math.random() * 100;
    }
    draw() {
        if (enemyImg.complete && enemyImg.naturalWidth !== 0) {
            ctx.drawImage(enemyImg, this.x, this.y, this.width, this.height);
        }
    }
    update() {
        this.x -= this.speed;
        this.shootTimer--;
        if (this.shootTimer <= 0) {
            projectiles.push(new Projectile(this.x, this.y + this.height / 2, 'enemy'));
            this.shootTimer = 100 + Math.random() * 100;
        }
    }
}

// Boss class
class Boss extends Enemy {
    constructor() {
        super();
        this.width = 100 * scaleX;
        this.height = 100 * scaleY;
        this.speed = 1 * scaleX;
        this.health = 5;
        this.shootTimer = 50;
    }
    draw() {
        if (bossImg.complete && bossImg.naturalWidth !== 0) {
            ctx.drawImage(bossImg, this.x, this.y, this.width, this.height);
        }
    }
    update() {
        this.x -= this.speed;
        this.shootTimer--;
        if (this.shootTimer <= 0) {
            projectiles.push(new Projectile(this.x, this.y + this.height / 2, 'enemy'));
            this.shootTimer = 50;
        }
    }
    hit() {
        this.health--;
        if (this.health <= 0) {
            score += 50;
            destroySound.play();
            return true;
        }
        return false;
    }
}

// Projectile class
class Projectile {
    constructor(x, y, type) {
        this.width = 20 * scaleX;
        this.height = 10 * scaleY;
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = (type === 'player' ? 7 : -5) * scaleX;
    }
    draw() {
        const img = this.type === 'player' ? projectilePlayerImg : projectileEnemyImg;
        if (img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }
    }
    update() {
        this.x += this.speed;
    }
}

// Collectible (coin) class
class Collectible {
    constructor() {
        this.width = 30 * scaleX;
        this.height = 30 * scaleY;
        this.x = canvas.width + Math.random() * 100 * scaleX;
        this.y = Math.random() * (canvas.height - this.height);
        this.speed = 2 * scaleX;
    }
    draw() {
        if (coinImg.complete && coinImg.naturalWidth !== 0) {
            ctx.drawImage(coinImg, this.x, this.y, this.width, this.height);
        }
    }
    update() {
        this.x -= this.speed;
    }
}

// Game state
let player = new Player();
let enemies = [];
let projectiles = [];
let collectibles = [];
let score = 0;
let gameOver = false;
let backgroundX = 0;
let bossThreshold = 100;

// Spawning intervals
let enemyInterval, collectibleInterval;

function spawnEnemies() {
    enemyInterval = setInterval(() => {
        if (!gameOver) enemies.push(new Enemy());
    }, 2000);
}

function spawnCollectibles() {
    collectibleInterval = setInterval(() => {
        if (!gameOver) collectibles.push(new Collectible());
    }, 5000);
}

function stopSpawning() {
    clearInterval(enemyInterval);
    clearInterval(collectibleInterval);
}

// Collision detection
function checkCollisions() {
    projectiles.forEach((proj, pIndex) => {
        if (proj.type === 'player') {
            enemies.forEach((enemy, eIndex) => {
                if (isColliding(proj, enemy)) {
                    if (enemy instanceof Boss) {
                        if (enemy.hit()) enemies.splice(eIndex, 1);
                    } else {
                        enemies.splice(eIndex, 1);
                        score += 10;
                        destroySound.play();
                    }
                    projectiles.splice(pIndex, 1);
                }
            });
        }
    });
    projectiles.forEach((proj, pIndex) => {
        if (proj.type === 'enemy' && isColliding(proj, player)) {
            player.lives--;
            projectiles.splice(pIndex, 1);
            hitSound.play();
            if (player.lives <= 0) gameOver = true;
        }
    });
    collectibles.forEach((collectible, cIndex) => {
        if (isColliding(player, collectible)) {
            score += 20;
            collectibles.splice(cIndex, 1);
            coinSound.play();
        }
    });
}

function isColliding(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Desktop controls: Track key presses
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Mouse click for shooting on desktop
canvas.addEventListener('click', () => {
    if (!gameStarted) return;
    player.shoot();
});

// Update game state
function update() {
    if (gameOver) {
        stopSpawning(); // Stop spawning when game over
        return;
    }
    // Continuous movement based on key states
    if (keys['KeyA']) player.move('left');
    if (keys['KeyD']) player.move('right');
    if (keys['KeyW']) player.move('up');
    if (keys['KeyS']) player.move('down');
    if (keys['Space']) player.shoot();
    player.update();
    enemies.forEach((enemy, index) => {
        enemy.update();
        if (enemy.x < -enemy.width) enemies.splice(index, 1);
    });
    projectiles.forEach((proj, index) => {
        proj.update();
        if (proj.x < 0 || proj.x > canvas.width) projectiles.splice(index, 1);
    });
    collectibles.forEach((collectible, index) => {
        collectible.update();
        if (collectible.x < -collectible.width) collectibles.splice(index, 1);
    });
    checkCollisions();
    if (score >= bossThreshold) {
        enemies.push(new Boss());
        bossThreshold += 100;
    }
}

// Render the game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background (fallback to solid color if image fails to load)
    if (backgroundImg.complete && backgroundImg.naturalWidth !== 0) {
        ctx.drawImage(backgroundImg, backgroundX, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImg, backgroundX + canvas.width, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#FFA500'; // Fallback to solid orange background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    backgroundX -= 1 * scaleX;
    if (backgroundX <= -canvas.width) backgroundX = 0;

    // Draw other elements only if their images are loaded
    player.draw();
    enemies.forEach(enemy => enemy.draw());
    projectiles.forEach(proj => proj.draw());
    collectibles.forEach(collectible => collectible.draw());

    // Draw UI elements (score, lives, game over)
    ctx.fillStyle = 'black';
    ctx.font = `${20 * scaleY}px Arial`;
    ctx.fillText(`Score: ${score}`, 10 * scaleX, 30 * scaleY);
    ctx.fillText(`Lives: ${player.lives}`, 10 * scaleX, 60 * scaleY);
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = `${48 * scaleY}px Arial`;
        ctx.fillText('Game Over', canvas.width / 2 - 100 * scaleX, canvas.height / 2);
        ctx.font = `${24 * scaleY}px Arial`;
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50 * scaleX, canvas.height / 2 + 40 * scaleY);
    }
}

// Game loop
function gameLoop() {
    if (!gameStarted) return;
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('shootButton').style.display = 'block'; // Show Shoot button
    document.getElementById('restart').style.display = 'block';
    player = new Player();
    spawnEnemies();
    spawnCollectibles();
    gameLoop();
}


document.getElementById('playButton').addEventListener('click', startGame);

// Restart game
document.getElementById('restart').addEventListener('click', () => {
    stopSpawning(); // Clear existing intervals
    player = new Player();
    enemies = [];
    projectiles = [];
    collectibles = [];
    score = 0;
    gameOver = false;
    bossThreshold = 100;
    spawnEnemies(); // Restart spawning
    spawnCollectibles();
});
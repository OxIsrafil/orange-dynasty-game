// Orange Dynasty Game
// A professional contribution to the Orange Dynasty community

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
playerImg.src = 'assets/player.png'; // Your player image (min 50x50)
const enemyImg = new Image();
enemyImg.src = 'assets/enemy1.png'; // Your enemy image (min 50x50)
const bossImg = new Image();
bossImg.src = 'assets/boss.png'; // Your boss image (min 100x100)
const projectilePlayerImg = new Image();
projectilePlayerImg.src = 'assets/projectile_player.png'; // Player projectile
const projectileEnemyImg = new Image();
projectileEnemyImg.src = 'assets/projectile_enemy.png'; // Enemy projectile
const coinImg = new Image();
coinImg.src = 'assets/coin.png'; // Sign logo for coins (min 30x30)
const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png'; // Background (wider than 800px)

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
        this.speed = 5 * scaleX;
        this.lives = 3;
        this.shootCooldown = 0;
        this.maxCooldown = 20;
    }
    draw() {
        ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    }
    move(direction) {
        if (gameOver) return;
        switch (direction) {
            case 'left': this.x -= this.speed; break;
            case 'right': this.x += this.speed; break;
            case 'up': this.y -= this.speed; break;
            case 'down': this.y += this.speed; break;
        }
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
        ctx.drawImage(enemyImg, this.x, this.y, this.width, this.height);
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
        ctx.drawImage(bossImg, this.x, this.y, this.width, this.height);
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
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
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
        ctx.drawImage(coinImg, this.x, this.y, this.width, this.height);
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

// Spawn enemies and collectibles
function spawnEnemies() {
    setInterval(() => {
        if (!gameOver) enemies.push(new Enemy());
    }, 2000);
}
function spawnCollectibles() {
    setInterval(() => {
        if (!gameOver) collectibles.push(new Collectible());
    }, 5000);
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

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.code] = true; });
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
document.getElementById('left').addEventListener('touchstart', () => keys['ArrowLeft'] = true);
document.getElementById('left').addEventListener('touchend', () => keys['ArrowLeft'] = false);
document.getElementById('right').addEventListener('touchstart', () => keys['ArrowRight'] = true);
document.getElementById('right').addEventListener('touchend', () => keys['ArrowRight'] = false);
document.getElementById('up').addEventListener('touchstart', () => keys['ArrowUp'] = true);
document.getElementById('up').addEventListener('touchend', () => keys['ArrowUp'] = false);
document.getElementById('down').addEventListener('touchstart', () => keys['ArrowDown'] = true);
document.getElementById('down').addEventListener('touchend', () => keys['ArrowDown'] = false);
document.getElementById('shoot').addEventListener('touchstart', () => keys['Space'] = true);
document.getElementById('shoot').addEventListener('touchend', () => keys['Space'] = false);

// Update game state
function update() {
    if (gameOver) return;
    if (keys['ArrowLeft']) player.move('left');
    if (keys['ArrowRight']) player.move('right');
    if (keys['ArrowUp']) player.move('up');
    if (keys['ArrowDown']) player.move('down');
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
    ctx.drawImage(backgroundImg, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, backgroundX + canvas.width, 0, canvas.width, canvas.height);
    backgroundX -= 1 * scaleX;
    if (backgroundX <= -canvas.width) backgroundX = 0;
    player.draw();
    enemies.forEach(enemy => enemy.draw());
    projectiles.forEach(proj => proj.draw());
    collectibles.forEach(collectible => collectible.draw());
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
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Restart game
document.getElementById('restart').addEventListener('click', () => {
    player = new Player();
    enemies = [];
    projectiles = [];
    collectibles = [];
    score = 0;
    gameOver = false;
    bossThreshold = 100;
});

// Start the game
spawnEnemies();
spawnCollectibles();
gameLoop();
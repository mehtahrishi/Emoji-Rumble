// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('background-music');
const timeCounter = document.getElementById('time-counter');
const waveCounter = document.getElementById('wave-counter');
const waveEmoji = document.getElementById('wave-emoji');
const healthFill = document.querySelector('.health-fill');

// Game state
let gameActive = false;
let gameTime = 0;
let currentWave = 1;
let wavesCompleted = 0;
let waveTimer = 0;
let enemySpawnTimer = 0;
let projectileTimer = 0;
let powerUpTimer = 0;
let playerHealth = 100;
let gameLoopId;
let isBossWave = false;
let playerHasShield = false;
let shieldTimeRemaining = 0;
let playerSpeedBoost = 0;
let speedBoostTimeRemaining = 0;
let playerHasWeapon = false;
let weaponTimeRemaining = 0;
let playerProjectiles = [];

// Player variables
const player = {
    emoji: window.playerSelectedEmoji || '😎', // Use selected emoji from landing page
    x: 0,
    y: 0,
    size: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    baseSpeed: 5,
    shootCooldown: 0
};

// Enemy variables
const enemies = [];
const projectiles = [];
const powerUps = [];
const enemyTypes = [
    { emoji: '😈', speed: 2, damage: 10, projectileSpeed: 3, fireRate: 2, health: 20, pattern: 'direct' },
    { emoji: '🤖', speed: 3, damage: 15, projectileSpeed: 4, fireRate: 1.8, health: 30, pattern: 'zigzag' },
    { emoji: '💀', speed: 3.5, damage: 20, projectileSpeed: 4.5, fireRate: 1.5, health: 40, pattern: 'circular' },
    { emoji: '👿', speed: 4, damage: 25, projectileSpeed: 5, fireRate: 1.2, health: 50, pattern: 'teleport' }
];

// Boss enemy types
const bossTypes = [
    { emoji: '👹', speed: 1.5, damage: 30, projectileSpeed: 4, fireRate: 1, health: 200, pattern: 'boss', size: 60 },
    { emoji: '👾', speed: 2, damage: 25, projectileSpeed: 5, fireRate: 0.8, health: 150, pattern: 'splitter', size: 50 }
];

// Power-up types
const powerUpTypes = [
    { emoji: '❤️', type: 'health', duration: 0, value: 25, chance: 0.3 },
    { emoji: '🛡️', type: 'shield', duration: 10, value: 0, chance: 0.2 },
    { emoji: '⚡', type: 'speed', duration: 8, value: 3, chance: 0.2 },
    { emoji: '🔫', type: 'weapon', duration: 15, value: 0, chance: 0.2 },
    { emoji: '💣', type: 'bomb', duration: 0, value: 0, chance: 0.1 }
];

// Key states
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Initialize game
function init() {
    // Set canvas size to match container
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Position player in center
    player.x = canvas.width / 2 - player.size / 2;
    player.y = canvas.height / 2 - player.size / 2;
    
    // Reset game state
    gameActive = true;
    gameTime = 0;
    currentWave = 1;
    wavesCompleted = 0;
    waveTimer = 0;
    enemySpawnTimer = 0;
    projectileTimer = 0;
    powerUpTimer = 0;
    playerHealth = 100;
    enemies.length = 0;
    projectiles.length = 0;
    powerUps.length = 0;
    playerHasShield = false;
    shieldTimeRemaining = 0;
    playerSpeedBoost = 0;
    speedBoostTimeRemaining = 0;
    playerHasWeapon = false;
    weaponTimeRemaining = 0;
    playerProjectiles.length = 0;
    player.speed = player.baseSpeed;
    isBossWave = false;
    
    // Start background music
    bgMusic.currentTime = 0;
    bgMusic.play();
    
    // Start game loop
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    gameLoop();
    
    // Update health bar
    updateHealthBar();
}

// Game loop
function gameLoop() {
    if (!gameActive) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game time
    gameTime += 1/60; // Assuming 60 FPS
    timeCounter.textContent = Math.floor(gameTime);
    
    // Check for wave progression (every 15 seconds)
    waveTimer += 1/60;
    if (waveTimer >= 15) {
        waveTimer = 0;
        currentWave++;
        wavesCompleted++;
        
        // Check if it's a boss wave (every 5 waves)
        isBossWave = currentWave % 5 === 0;
        
        if (isBossWave) {
            // Spawn a boss
            const bossIndex = Math.floor(Math.random() * bossTypes.length);
            spawnBoss(bossTypes[bossIndex]);
            waveEmoji.textContent = bossTypes[bossIndex].emoji;
        } else {
            // Update wave emoji for regular waves
            const waveIndex = Math.min(Math.floor((currentWave - 1) % enemyTypes.length), enemyTypes.length - 1);
            waveEmoji.textContent = enemyTypes[waveIndex].emoji;
        }
    }
    
    // Spawn enemies every 1 second (but not during boss waves)
    if (!isBossWave) {
        enemySpawnTimer += 1/60;
        if (enemySpawnTimer >= 1) {
            enemySpawnTimer = 0;
            spawnEnemy();
        }
    }
    
    // Generate projectiles from enemies
    projectileTimer += 1/60;
    if (projectileTimer >= 0.5) {
        projectileTimer = 0;
        // Each enemy has a chance to fire based on their fire rate
        enemies.forEach(enemy => {
            const enemyType = getEnemyTypeByEmoji(enemy.emoji);
            if (Math.random() < 1/enemyType.fireRate) {
                fireProjectile(enemy);
            }
        });
    }
    
    // Spawn power-ups randomly (every 10-15 seconds)
    powerUpTimer += 1/60;
    if (powerUpTimer >= 10 + Math.random() * 5) {
        powerUpTimer = 0;
        spawnPowerUp();
    }
    
    // Update power-up timers
    updatePowerUpTimers();
    
    // Player shooting (if has weapon power-up)
    if (playerHasWeapon) {
        player.shootCooldown -= 1/60;
        if (player.shootCooldown <= 0) {
            player.shootCooldown = 0.5; // Fire every 0.5 seconds
            firePlayerProjectile();
        }
    }
    
    // Update player
    updatePlayer();
    
    // Update enemies
    updateEnemies();
    
    // Update projectiles
    updateProjectiles();
    
    // Update player projectiles
    updatePlayerProjectiles();
    
    // Update power-ups
    updatePowerUps();
    
    // Draw everything
    drawGame();
    
    // Continue game loop
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Update player position
function updatePlayer() {
    // Reset movement
    player.dx = 0;
    player.dy = 0;
    
    // Set movement based on key states
    if (keys.ArrowUp) player.dy = -player.speed;
    if (keys.ArrowDown) player.dy = player.speed;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    
    // Update position
    player.x += player.dx;
    player.y += player.dy;
    
    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.size) player.y = canvas.height - player.size;
}

// Spawn a new enemy
function spawnEnemy() {
    // Determine enemy type based on current wave
    // We'll use the current wave for the newest enemies, but can go back to previous waves
    // for variety
    const maxWaveIndex = Math.min(currentWave - 1, enemyTypes.length - 1);
    // Randomly select from wave 0 to maxWaveIndex
    const waveIndex = Math.floor(Math.random() * (maxWaveIndex + 1));
    const enemyType = enemyTypes[waveIndex];
    
    // Determine spawn position (outside canvas)
    let x, y;
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    switch (side) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -30;
            break;
        case 1: // right
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            break;
        case 3: // left
            x = -30;
            y = Math.random() * canvas.height;
            break;
    }
    
    // Create enemy
    const enemy = {
        x,
        y,
        size: 30,
        emoji: enemyType.emoji,
        speed: enemyType.speed * (1 + wavesCompleted * 0.1), // Increase speed with completed waves
        damage: enemyType.damage,
        health: enemyType.health,
        pattern: enemyType.pattern,
        lastFired: 0,
        patternTimer: 0,
        patternDirection: 1,
        teleportCooldown: 0,
        lastTeleport: 0
    };
    
    enemies.push(enemy);
}

// Spawn a boss enemy
function spawnBoss(bossType) {
    // Spawn boss in the middle top of the screen
    const boss = {
        x: canvas.width / 2 - bossType.size / 2,
        y: -bossType.size,
        size: bossType.size,
        emoji: bossType.emoji,
        speed: bossType.speed,
        damage: bossType.damage,
        health: bossType.health,
        maxHealth: bossType.health,
        pattern: bossType.pattern,
        lastFired: 0,
        patternTimer: 0,
        patternDirection: 1,
        isBoss: true
    };
    
    enemies.push(boss);
}

// Spawn a power-up
function spawnPowerUp() {
    // Determine which power-up to spawn based on chance
    const roll = Math.random();
    let cumulativeChance = 0;
    let selectedPowerUp = null;
    
    for (const powerUp of powerUpTypes) {
        cumulativeChance += powerUp.chance;
        if (roll <= cumulativeChance) {
            selectedPowerUp = powerUp;
            break;
        }
    }
    
    if (!selectedPowerUp) return; // Shouldn't happen, but just in case
    
    // Spawn power-up at random position (not too close to edges)
    const padding = 50;
    const powerUp = {
        x: padding + Math.random() * (canvas.width - padding * 2),
        y: padding + Math.random() * (canvas.height - padding * 2),
        size: 30,
        emoji: selectedPowerUp.emoji,
        type: selectedPowerUp.type,
        duration: selectedPowerUp.duration,
        value: selectedPowerUp.value
    };
    
    powerUps.push(powerUp);
}

// Helper function to get enemy type by emoji
function getEnemyTypeByEmoji(emoji) {
    // Check regular enemies
    const regularEnemy = enemyTypes.find(type => type.emoji === emoji);
    if (regularEnemy) return regularEnemy;
    
    // Check boss enemies
    const bossEnemy = bossTypes.find(type => type.emoji === emoji);
    if (bossEnemy) return bossEnemy;
    
    // Default to first enemy type if not found
    return enemyTypes[0];
}

// Fire a projectile from an enemy
function fireProjectile(enemy) {
    // Calculate direction towards player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const enemyType = getEnemyTypeByEmoji(enemy.emoji);
    
    // Create projectile
    const projectile = {
        x: enemy.x + enemy.size / 2,
        y: enemy.y + enemy.size / 2,
        radius: 5,
        color: '#ff0000', // Red projectile
        speed: enemyType.projectileSpeed,
        dx: dx / distance,
        dy: dy / distance,
        damage: enemyType.damage / 2, // Half the damage of direct collision
        fromEnemy: true
    };
    
    // For boss enemies, fire multiple projectiles in a spread pattern
    if (enemy.isBoss) {
        // Fire 3 projectiles in a spread
        for (let i = -1; i <= 1; i++) {
            const angle = Math.atan2(dy, dx) + i * 0.3; // Spread angle
            const spreadProjectile = {
                x: enemy.x + enemy.size / 2,
                y: enemy.y + enemy.size / 2,
                radius: 8, // Bigger projectiles for boss
                color: '#ff0000',
                speed: enemyType.projectileSpeed,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                damage: enemyType.damage / 2,
                fromEnemy: true
            };
            projectiles.push(spreadProjectile);
        }
    } else {
        projectiles.push(projectile);
    }
}

// Fire a projectile from the player
function firePlayerProjectile() {
    // Fire in 4 directions (up, down, left, right)
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
    ];
    
    directions.forEach(dir => {
        const projectile = {
            x: player.x + player.size / 2,
            y: player.y + player.size / 2,
            radius: 5,
            color: '#00ffff', // Cyan projectile for player
            speed: 8,
            dx: dir.dx,
            dy: dir.dy,
            damage: 10,
            fromPlayer: true
        };
        
        playerProjectiles.push(projectile);
    });
}

// Update enemy positions
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Update enemy based on its movement pattern
        switch (enemy.pattern) {
            case 'direct':
                // Move enemy directly towards player
                moveEnemyDirect(enemy);
                break;
            case 'zigzag':
                // Move enemy in a zigzag pattern towards player
                moveEnemyZigzag(enemy);
                break;
            case 'circular':
                // Move enemy in a circular pattern towards player
                moveEnemyCircular(enemy);
                break;
            case 'teleport':
                // Move enemy with occasional teleports
                moveEnemyTeleport(enemy);
                break;
            case 'boss':
                // Boss movement pattern
                moveBossEnemy(enemy);
                break;
            case 'splitter':
                // Splitter boss movement
                moveSplitterBoss(enemy);
                break;
            default:
                // Default to direct movement
                moveEnemyDirect(enemy);
        }
        
        // Check collision with player
        if (checkCollision(player, enemy)) {
            // If player has shield, don't take damage but reduce shield time
            if (playerHasShield) {
                shieldTimeRemaining -= 2; // Reduce shield time faster on direct hit
                if (shieldTimeRemaining <= 0) {
                    playerHasShield = false;
                    shieldTimeRemaining = 0;
                }
            } else {
                // Damage player
                playerHealth -= enemy.damage;
                updateHealthBar();
            }
            
            // Reduce enemy health or remove
            enemy.health -= 10; // Player collision damages enemy too
            
            if (enemy.health <= 0) {
                // If it's a splitter boss and big enough, split into smaller enemies
                if (enemy.pattern === 'splitter' && enemy.size > 30) {
                    splitEnemy(enemy);
                }
                
                enemies.splice(i, 1);
            }
            
            // Check game over
            if (playerHealth <= 0) {
                gameOver();
            }
        }
    }
}

// Direct movement pattern
function moveEnemyDirect(enemy) {
    // Move enemy towards player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
    }
}

// Zigzag movement pattern
function moveEnemyZigzag(enemy) {
    // Move in zigzag pattern towards player
    enemy.patternTimer += 1/60;
    
    // Change direction every second
    if (enemy.patternTimer >= 1) {
        enemy.patternTimer = 0;
        enemy.patternDirection *= -1;
    }
    
    // Calculate direction towards player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        // Move towards player but with a sideways component
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Create perpendicular vector for zigzag
        const perpX = -normalizedDy;
        const perpY = normalizedDx;
        
        // Combine direct and perpendicular movement
        enemy.x += (normalizedDx * 0.8 + perpX * 0.5 * enemy.patternDirection) * enemy.speed;
        enemy.y += (normalizedDy * 0.8 + perpY * 0.5 * enemy.patternDirection) * enemy.speed;
    }
}

// Circular movement pattern
function moveEnemyCircular(enemy) {
    // Move in circular pattern towards player
    enemy.patternTimer += 1/60;
    
    // Calculate direction towards player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        // Calculate angle for circular movement
        const angle = enemy.patternTimer * 3; // Speed of rotation
        
        // Create circular motion vector
        const circleX = Math.cos(angle) * 0.5;
        const circleY = Math.sin(angle) * 0.5;
        
        // Combine direct and circular movement
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        enemy.x += (normalizedDx * 0.7 + circleX * 0.3) * enemy.speed;
        enemy.y += (normalizedDy * 0.7 + circleY * 0.3) * enemy.speed;
    }
}

// Teleport movement pattern
function moveEnemyTeleport(enemy) {
    // Move directly most of the time, but occasionally teleport
    enemy.teleportCooldown -= 1/60;
    
    if (enemy.teleportCooldown <= 0 && distance(enemy, player) > 100) {
        // Teleport closer to player
        const angle = Math.random() * Math.PI * 2;
        const teleportDistance = 80 + Math.random() * 50;
        
        enemy.x = player.x + Math.cos(angle) * teleportDistance;
        enemy.y = player.y + Math.sin(angle) * teleportDistance;
        
        // Keep within canvas bounds
        enemy.x = Math.max(0, Math.min(canvas.width - enemy.size, enemy.x));
        enemy.y = Math.max(0, Math.min(canvas.height - enemy.size, enemy.y));
        
        // Create teleport effect
        createTeleportEffect(enemy.x, enemy.y);
        
        // Reset cooldown (4-7 seconds)
        enemy.teleportCooldown = 4 + Math.random() * 3;
    } else {
        // Regular movement
        moveEnemyDirect(enemy);
    }
}

// Boss movement pattern
function moveBossEnemy(enemy) {
    // Boss moves horizontally at the top of the screen
    if (enemy.y < 50) {
        enemy.y += enemy.speed * 0.5; // Move down to position
    } else {
        // Move horizontally back and forth
        enemy.patternTimer += 1/60;
        
        // Sine wave movement
        const centerX = canvas.width / 2 - enemy.size / 2;
        const amplitude = canvas.width / 3;
        enemy.x = centerX + Math.sin(enemy.patternTimer * 0.5) * amplitude;
        
        // Occasionally move down towards player then back up
        if (Math.random() < 0.005) {
            enemy.chargeDown = true;
        }
        
        if (enemy.chargeDown) {
            enemy.y += enemy.speed * 2;
            if (enemy.y > canvas.height / 2) {
                enemy.chargeDown = false;
                enemy.retreating = true;
            }
        } else if (enemy.retreating) {
            enemy.y -= enemy.speed;
            if (enemy.y <= 50) {
                enemy.retreating = false;
                enemy.y = 50;
            }
        }
    }
}

// Splitter boss movement
function moveSplitterBoss(enemy) {
    // Similar to direct movement but slower
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed * 0.7;
        enemy.y += (dy / distance) * enemy.speed * 0.7;
    }
}

// Split an enemy into smaller ones
function splitEnemy(enemy) {
    // Create 2-3 smaller enemies
    const numSplits = 2 + Math.floor(Math.random() * 2);
    const newSize = enemy.size * 0.6;
    
    for (let i = 0; i < numSplits; i++) {
        const angle = (i / numSplits) * Math.PI * 2;
        const newEnemy = {
            x: enemy.x + Math.cos(angle) * 20,
            y: enemy.y + Math.sin(angle) * 20,
            size: newSize,
            emoji: enemy.emoji,
            speed: enemy.speed * 1.2,
            damage: enemy.damage * 0.7,
            health: enemy.health * 0.4,
            pattern: 'direct', // Smaller enemies move directly
            lastFired: 0
        };
        
        enemies.push(newEnemy);
    }
}

// Create teleport effect
function createTeleportEffect(x, y) {
    // Visual effect only - could be expanded with actual particles
    ctx.beginPath();
    ctx.arc(x + 15, y + 15, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.fill();
    ctx.closePath();
}

// Helper function to calculate distance between objects
function distance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Update projectiles
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Move projectile
        projectile.x += projectile.dx * projectile.speed;
        projectile.y += projectile.dy * projectile.speed;
        
        // Check if projectile is out of bounds
        if (
            projectile.x < -projectile.radius ||
            projectile.x > canvas.width + projectile.radius ||
            projectile.y < -projectile.radius ||
            projectile.y > canvas.height + projectile.radius
        ) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with player (only for enemy projectiles)
        if (projectile.fromEnemy) {
            const dx = projectile.x - (player.x + player.size / 2);
            const dy = projectile.y - (player.y + player.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.radius + player.size / 2) {
                // If player has shield, don't take damage
                if (playerHasShield) {
                    shieldTimeRemaining -= 1; // Reduce shield time
                    if (shieldTimeRemaining <= 0) {
                        playerHasShield = false;
                        shieldTimeRemaining = 0;
                    }
                } else {
                    // Damage player
                    playerHealth -= projectile.damage;
                    updateHealthBar();
                    
                    // Check game over
                    if (playerHealth <= 0) {
                        gameOver();
                    }
                }
                
                // Remove projectile
                projectiles.splice(i, 1);
            }
        }
    }
}

// Update player projectiles
function updatePlayerProjectiles() {
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const projectile = playerProjectiles[i];
        
        // Move projectile
        projectile.x += projectile.dx * projectile.speed;
        projectile.y += projectile.dy * projectile.speed;
        
        // Check if projectile is out of bounds
        if (
            projectile.x < -projectile.radius ||
            projectile.x > canvas.width + projectile.radius ||
            projectile.y < -projectile.radius ||
            projectile.y > canvas.height + projectile.radius
        ) {
            playerProjectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with enemies
        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = projectile.x - (enemy.x + enemy.size / 2);
            const dy = projectile.y - (enemy.y + enemy.size / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.radius + enemy.size / 2) {
                // Damage enemy
                enemy.health -= projectile.damage;
                
                // Check if enemy is defeated
                if (enemy.health <= 0) {
                    // If it's a splitter boss and big enough, split into smaller enemies
                    if (enemy.pattern === 'splitter' && enemy.size > 30) {
                        splitEnemy(enemy);
                    }
                    
                    enemies.splice(j, 1);
                }
                
                hitEnemy = true;
                break;
            }
        }
        
        // Remove projectile if it hit an enemy
        if (hitEnemy) {
            playerProjectiles.splice(i, 1);
        }
    }
}

// Update power-ups
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Check collision with player
        if (checkCollision(player, powerUp)) {
            // Apply power-up effect
            applyPowerUp(powerUp);
            
            // Remove power-up
            powerUps.splice(i, 1);
        }
    }
}

// Apply power-up effect
function applyPowerUp(powerUp) {
    switch (powerUp.type) {
        case 'health':
            // Restore health
            playerHealth = Math.min(100, playerHealth + powerUp.value);
            updateHealthBar();
            break;
        case 'shield':
            // Activate shield
            playerHasShield = true;
            shieldTimeRemaining = powerUp.duration;
            break;
        case 'speed':
            // Boost speed
            playerSpeedBoost = powerUp.value;
            player.speed = player.baseSpeed + playerSpeedBoost;
            speedBoostTimeRemaining = powerUp.duration;
            break;
        case 'weapon':
            // Activate weapon
            playerHasWeapon = true;
            weaponTimeRemaining = powerUp.duration;
            break;
        case 'bomb':
            // Clear all enemies and projectiles
            activateBomb();
            break;
    }
}

// Activate bomb power-up
function activateBomb() {
    // Clear all enemies except bosses
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy.isBoss) {
            enemies.splice(i, 1);
        } else {
            // Damage bosses
            enemy.health -= 50;
            if (enemy.health <= 0) {
                enemies.splice(i, 1);
            }
        }
    }
    
    // Clear all enemy projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].fromEnemy) {
            projectiles.splice(i, 1);
        }
    }
    
    // Visual effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Update power-up timers
function updatePowerUpTimers() {
    // Update shield timer
    if (playerHasShield) {
        shieldTimeRemaining -= 1/60;
        if (shieldTimeRemaining <= 0) {
            playerHasShield = false;
            shieldTimeRemaining = 0;
        }
    }
    
    // Update speed boost timer
    if (playerSpeedBoost > 0) {
        speedBoostTimeRemaining -= 1/60;
        if (speedBoostTimeRemaining <= 0) {
            playerSpeedBoost = 0;
            player.speed = player.baseSpeed;
            speedBoostTimeRemaining = 0;
        }
    }
    
    // Update weapon timer
    if (playerHasWeapon) {
        weaponTimeRemaining -= 1/60;
        if (weaponTimeRemaining <= 0) {
            playerHasWeapon = false;
            weaponTimeRemaining = 0;
        }
    }
}

// Draw game elements
function drawGame() {
    // Draw power-ups
    powerUps.forEach(powerUp => {
        drawEmoji(powerUp.emoji, powerUp.x, powerUp.y, powerUp.size);
        
        // Add glow effect to power-ups
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.size/2, powerUp.y + powerUp.size/2, powerUp.size/2 + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    });
    
    // Draw player
    drawEmoji(player.emoji, player.x, player.y, player.size);
    
    // Draw shield if active
    if (playerHasShield) {
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    }
    
    // Draw enemies
    enemies.forEach(enemy => {
        drawEmoji(enemy.emoji, enemy.x, enemy.y, enemy.size);
        
        // Draw health bar for bosses
        if (enemy.isBoss) {
            const healthPercent = enemy.health / enemy.maxHealth;
            const barWidth = enemy.size * 1.5;
            const barHeight = 5;
            const barX = enemy.x + enemy.size/2 - barWidth/2;
            const barY = enemy.y - 15;
            
            // Background
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health fill
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    });
    
    // Draw projectiles
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
        ctx.closePath();
        
        // Add glow effect to projectiles
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = projectile.fromEnemy ? '#ff6666' : '#66ffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    });
    
    // Draw player projectiles
    playerProjectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = projectile.color;
        ctx.fill();
        ctx.closePath();
        
        // Add glow effect to player projectiles
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#66ffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    });
    
    // Draw power-up status indicators
    drawPowerUpStatus();
}

// Draw power-up status indicators
function drawPowerUpStatus() {
    const statusY = 40;
    let statusX = 10;
    
    // Shield status
    if (playerHasShield) {
        drawStatusIndicator('🛡️', statusX, statusY, shieldTimeRemaining);
        statusX += 60;
    }
    
    // Speed boost status
    if (playerSpeedBoost > 0) {
        drawStatusIndicator('⚡', statusX, statusY, speedBoostTimeRemaining);
        statusX += 60;
    }
    
    // Weapon status
    if (playerHasWeapon) {
        drawStatusIndicator('🔫', statusX, statusY, weaponTimeRemaining);
    }
}

// Draw status indicator with timer
function drawStatusIndicator(emoji, x, y, timeRemaining) {
    // Draw emoji
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(emoji, x, y);
    
    // Draw timer bar
    const barWidth = 40;
    const barHeight = 5;
    const barX = x;
    const barY = y + 25;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Timer fill (assuming max duration is 15 seconds)
    const fillPercent = Math.min(1, timeRemaining / 15);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(barX, barY, barWidth * fillPercent, barHeight);
}

// Draw emoji
function drawEmoji(emoji, x, y, size) {
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + size/2, y + size/2);
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.size > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.size > obj2.y
    );
}

// Update health bar
function updateHealthBar() {
    const health = Math.max(0, playerHealth);
    healthFill.style.width = `${health}%`;
    
    // Change color based on health
    if (health > 60) {
        healthFill.style.backgroundColor = '#00ff00';
    } else if (health > 30) {
        healthFill.style.backgroundColor = '#ffff00';
    } else {
        healthFill.style.backgroundColor = '#ff0000';
    }
}

// Game over
function gameOver() {
    gameActive = false;
    bgMusic.pause();
    
    // Show game over screen
    const gameOverScreen = document.getElementById('game-over');
    gameOverScreen.classList.remove('hidden');
    
    // Update final score
    document.getElementById('final-time').textContent = Math.floor(gameTime);
    document.getElementById('final-wave').textContent = wavesCompleted;
    document.getElementById('final-emoji').textContent = waveEmoji.textContent;
    
    // Set up save score button
    document.getElementById('save-score-btn').addEventListener('click', saveScore);
}

// Save score to leaderboard
function saveScore() {
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    // Send score to server
    fetch('/api/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: playerName,
            time_survived: Math.floor(gameTime),
            wave: wavesCompleted
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Hide save score form
            document.querySelector('.save-score').classList.add('hidden');
            
            // Show success message and buttons
            document.getElementById('score-saved').classList.remove('hidden');
            
            // Set up buttons
            document.getElementById('home-btn').addEventListener('click', () => {
                window.location.href = '/';
            });
            
            document.getElementById('leaderboard-btn').addEventListener('click', () => {
                window.location.href = '/leaderboard';
            });
        } else {
            alert('Error saving score. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving score. Please try again.');
    });
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
        e.preventDefault();
    }
});

// Resize handler
window.addEventListener('resize', () => {
    if (gameActive) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
});

// Create stars background
const starsContainer = document.querySelector('.stars-container');
for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 10}s`;
    starsContainer.appendChild(star);
}

// Start game when page loads
window.addEventListener('load', init);

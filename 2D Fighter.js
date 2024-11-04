/**
 * @fileoverview 2D Fighting Game main implementation
 * @version 1.0.0
 * @author Your Name
 * @description A 2D fighting game built with HTML5 Canvas and JavaScript
 */

/**
 * Global game configuration and constants
 * @constant {Object}
 */
const GAME_CONFIG = {
    /** @type {number} Target frames per second */
    fps: 60,
    /** @type {number} Time step for game loop in milliseconds */
    timeStep: 1000 / 60,
    /** @type {number} Gravity constant for physics */
    gravity: 0.7,
    /** @type {number} Jump force for characters */
    jumpForce: -15,
    /** @type {number} Base movement speed */
    moveSpeed: 5,
    /** @type {Object} Debug settings */
    debug: {
        showHitboxes: false,
        showFPS: false,
        logPerformance: false
    },
    /** @type {Object} Game balance settings */
    balance: {
        damageMultiplier: 1.0,
        healthMultiplier: 1.0,
        energyRegenRate: 0.1,
        blockDamageReduction: 0.5,
        hitStunDuration: 300,
        comboTimeWindow: 500
    }
};

/**
 * Custom error for game-specific errors
 * @extends Error
 */
class GameError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'GameError';
        this.code = code;
    }
}

/**
 * Validates game configuration
 * @param {Object} config - Configuration to validate
 * @throws {GameError} If configuration is invalid
 */
function validateConfig(config) {
    const required = ['fps', 'timeStep', 'gravity'];
    for (const prop of required) {
        if (!(prop in config)) {
            throw new GameError(
                `Missing required config: ${prop}`,
                'CONFIG_ERROR'
            );
        }
    }
}

/**
 * Main Game class - Controls the game loop and manages all game systems
 * @class
 */
class Game {
    /**
     * Creates a new Game instance
     * @constructor
     * @throws {Error} If canvas element is not found
     */
    constructor() {
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        this.ctx = this.canvas.getContext('2d');

        // Initialize core systems
        this.initializeSystems();
        
        // Bind methods to prevent context loss
        this.gameLoop = this.gameLoop.bind(this);
        this.handleInput = this.handleInput.bind(this);
        
        // Start the game
        this.initialize();

        /**
         * @type {string} Current game speed setting
         * @private
         */
        this.speedSetting = 'normal';
        
        /**
         * @type {number} Current time scale for game logic
         * @private
         */
        this.timeScale = SPEED_CONFIG.normal.timeScale;
    }

    /**
     * Initializes all game systems
     * @private
     */
    initializeSystems() {
        this.loadingScreen = new LoadingScreen(this);
        this.errorHandler = new ErrorHandler();
        this.performanceMonitor = new PerformanceMonitor();
        this.assetLoader = new AssetLoader();
        this.animationSystem = new AnimationSystem();
        this.effectsSystem = new EffectsSystem();
        this.menuSystem = new MenuSystem(this);
        this.stateManager = new GameStateManager(this);
        
        // Game state initialization
        this.gameState = 'loading';
        this.player1 = null;
        this.player2 = null;
        this.paused = false;
        
        // Performance optimization
        this.lastTime = 0;
        this.accumulator = 0;
        this.frames = 0;
    }

    /**
     * Initializes the game
     * @async
     * @throws {GameError} If initialization fails
     */
    async initialize() {
        try {
            validateConfig(GAME_CONFIG);
            await this.assetLoader.loadAssets();
            this.setupSystems();
            this.gameLoop(0);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Sets up event listeners for the game
     * @private
     */
    setupEventListeners() {
        window.addEventListener('keydown', this.handleInput);
        window.addEventListener('keyup', this.handleInput);
        window.addEventListener('blur', () => this.handleBlur());
        window.addEventListener('focus', () => this.handleFocus());
    }

    /**
     * Main game loop
     * @param {number} timestamp Current timestamp from requestAnimationFrame
     */
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Performance monitoring
        if (GAME_CONFIG.debug.logPerformance) {
            this.performanceMonitor.startFrame();
        }

        // Fixed time step accumulator
        this.accumulator += deltaTime;
        
        // Update game logic at fixed time steps
        while (this.accumulator >= GAME_CONFIG.timeStep) {
            this.update(GAME_CONFIG.timeStep);
            this.accumulator -= GAME_CONFIG.timeStep;
        }

        // Render
        this.render();

        // Performance monitoring
        if (GAME_CONFIG.debug.logPerformance) {
            this.performanceMonitor.endFrame(timestamp);
        }

        // Schedule next frame
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Sets the game speed
     * @param {string} speed - Speed setting (slow/normal/fast)
     */
    setGameSpeed(speed) {
        if (SPEED_CONFIG[speed]) {
            this.speedSetting = speed;
            this.timeScale = SPEED_CONFIG[speed].timeScale;
            
            // Update animation speeds
            this.animationSystem.setSpeedMultiplier(
                SPEED_CONFIG[speed].animationSpeedMultiplier
            );
        }
    }

    /**
     * Main game loop with speed control
     * @param {number} timestamp - Current frame timestamp
     */
    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * this.timeScale;
        this.lastTime = timestamp;

        // Update game with scaled time
        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Handles game errors
     * @param {Error} error - Error to handle
     * @private
     */
    handleError(error) {
        this.errorHandler.logError(error);
        if (error instanceof GameError) {
            this.showErrorMessage(error.message);
        } else {
            this.showErrorMessage('An unexpected error occurred');
        }
    }

    // ... (continued in next part)
}

// Additional required classes:
// - AssetLoader
// - AnimationSystem
// - EffectsSystem
// - MenuSystem
// - Character
// - SpecialMoveSystem

/**
 * Manages the loading screen and asset loading progress
 */
class LoadingScreen {
    constructor(game) {
        this.game = game;
        this.progress = 0;
        this.isLoading = true;
        this.loadingText = 'Loading...';
        this.errors = [];
    }

    draw(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw progress bar
        const barWidth = ctx.canvas.width * 0.6;
        const barHeight = 20;
        const barX = (ctx.canvas.width - barWidth) / 2;
        const barY = ctx.canvas.height / 2;

        // Border
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Fill
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, barWidth * this.progress, barHeight);

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.loadingText, ctx.canvas.width / 2, barY - 20);

        // Error messages
        if (this.errors.length > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '16px Arial';
            this.errors.forEach((error, index) => {
                ctx.fillText(error, ctx.canvas.width / 2, barY + 60 + (index * 20));
            });
        }
    }

    updateProgress(loaded, total) {
        this.progress = Math.min(1, loaded / total);
        this.loadingText = `Loading... ${Math.floor(this.progress * 100)}%`;
    }

    addError(error) {
        this.errors.push(error);
    }
}

/**
 * Handles error logging and reporting
 */
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            this.logError('Global Error', error);
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });
    }

    logError(type, error) {
        const errorInfo = {
            type,
            message: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        this.errors.push(errorInfo);
        console.error(`[${type}]`, errorInfo);

        // Limit stored errors
        if (this.errors.length > 50) {
            this.errors.shift();
        }
    }

    getErrors() {
        return [...this.errors];
    }

    clearErrors() {
        this.errors = [];
    }
}

/**
 * Monitors and reports game performance metrics
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            frameTime: [],
            memoryUsage: []
        };
        this.lastTime = performance.now();
        this.frames = 0;
        this.fpsUpdateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = this.lastTime;
    }

    startFrame() {
        return performance.now();
    }

    endFrame(startTime) {
        const currentTime = performance.now();
        const frameTime = currentTime - startTime;

        // Update FPS
        this.frames++;
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            const fps = (this.frames * 1000) / (currentTime - this.lastFpsUpdate);
            this.metrics.fps.push(fps);
            this.frames = 0;
            this.lastFpsUpdate = currentTime;

            // Keep only last 60 samples
            if (this.metrics.fps.length > 60) {
                this.metrics.fps.shift();
            }
        }

        // Update frame time metrics
        this.metrics.frameTime.push(frameTime);
        if (this.metrics.frameTime.length > 60) {
            this.metrics.frameTime.shift();
        }

        // Update memory usage if available
        if (window.performance && performance.memory) {
            this.metrics.memoryUsage.push(performance.memory.usedJSHeapSize);
            if (this.metrics.memoryUsage.length > 60) {
                this.metrics.memoryUsage.shift();
            }
        }
    }

    getMetrics() {
        return {
            averageFps: this.getAverage(this.metrics.fps),
            averageFrameTime: this.getAverage(this.metrics.frameTime),
            memoryUsage: this.metrics.memoryUsage.length > 0 ? 
                this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] : null
        };
    }

    getAverage(array) {
        return array.length > 0 ? 
            array.reduce((a, b) => a + b) / array.length : 0;
    }
}

/**
 * Manages asset loading and caching
 */
class AssetLoader {
    constructor() {
        this.assets = {
            images: new Map(),
            audio: new Map(),
            data: new Map()
        };
        this.loadQueue = [];
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    async loadAssets() {
        // Define assets to load
        const assetManifest = {
            images: {
                'fighter1_idle': 'assets/sprites/fighter1/idle.png',
                'fighter1_walk': 'assets/sprites/fighter1/walk.png',
                'fighter1_attack': 'assets/sprites/fighter1/attack.png',
                'fighter2_idle': 'assets/sprites/fighter2/idle.png',
                'fighter2_walk': 'assets/sprites/fighter2/walk.png',
                'fighter2_attack': 'assets/sprites/fighter2/attack.png',
                'background': 'assets/backgrounds/stage1.png',
                'effects_hit': 'assets/effects/hit.png'
            },
            audio: {
                'hit': 'assets/sounds/hit.mp3',
                'jump': 'assets/sounds/jump.mp3',
                'music': 'assets/music/battle-theme.mp3'
            },
            data: {
                'characters': 'assets/data/characters.json',
                'moves': 'assets/data/moves.json'
            }
        };

        this.totalAssets = Object.values(assetManifest).reduce(
            (total, category) => total + Object.keys(category).length, 0
        );

        try {
            // Load all asset categories concurrently
            await Promise.all([
                this.loadImageAssets(assetManifest.images),
                this.loadAudioAssets(assetManifest.audio),
                this.loadDataAssets(assetManifest.data)
            ]);
            return true;
        } catch (error) {
            console.error('Asset loading failed:', error);
            return false;
        }
    }

    async loadImageAssets(imageManifest) {
        const promises = Object.entries(imageManifest).map(([key, path]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.assets.images.set(key, img);
                    this.loadedAssets++;
                    resolve();
                };
                img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
                img.src = path;
            });
        });
        await Promise.all(promises);
    }

    async loadAudioAssets(audioManifest) {
        const promises = Object.entries(audioManifest).map(([key, path]) => {
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => {
                    this.assets.audio.set(key, audio);
                    this.loadedAssets++;
                    resolve();
                };
                audio.onerror = () => reject(new Error(`Failed to load audio: ${path}`));
                audio.src = path;
            });
        });
        await Promise.all(promises);
    }

    async loadDataAssets(dataManifest) {
        const promises = Object.entries(dataManifest).map(([key, path]) => {
            return fetch(path)
                .then(response => response.json())
                .then(data => {
                    this.assets.data.set(key, data);
                    this.loadedAssets++;
                });
        });
        await Promise.all(promises);
    }

    getImage(key) {
        return this.assets.images.get(key);
    }

    getAudio(key) {
        return this.assets.audio.get(key);
    }

    getData(key) {
        return this.assets.data.get(key);
    }

    getLoadingProgress() {
        return this.loadedAssets / this.totalAssets;
    }
}

/**
 * Manages sprite animations
 */
class AnimationSystem {
    constructor() {
        this.animations = new Map();
    }

    createAnimation(key, spriteSheet, frameWidth, frameHeight, frameCount, frameDuration, loop = true) {
        this.animations.set(key, {
            spriteSheet,
            frameWidth,
            frameHeight,
            frameCount,
            frameDuration,
            loop,
            currentFrame: 0,
            elapsed: 0
        });
    }

    update(deltaTime) {
        this.animations.forEach(animation => {
            animation.elapsed += deltaTime;
            if (animation.elapsed >= animation.frameDuration) {
                animation.currentFrame = (animation.currentFrame + 1) % animation.frameCount;
                animation.elapsed = 0;

                if (!animation.loop && animation.currentFrame === 0) {
                    animation.currentFrame = animation.frameCount - 1;
                }
            }
        });
    }

    draw(ctx, key, x, y, flipX = false) {
        const animation = this.animations.get(key);
        if (!animation) return;

        const { spriteSheet, frameWidth, frameHeight, currentFrame } = animation;

        ctx.save();
        if (flipX) {
            ctx.scale(-1, 1);
            x = -x - frameWidth;
        }

        ctx.drawImage(
            spriteSheet,
            currentFrame * frameWidth,
            0,
            frameWidth,
            frameHeight,
            x,
            y,
            frameWidth,
            frameHeight
        );
        ctx.restore();
    }

    resetAnimation(key) {
        const animation = this.animations.get(key);
        if (animation) {
            animation.currentFrame = 0;
            animation.elapsed = 0;
        }
    }

    /**
     * Sets the speed multiplier for all animations
     * @param {number} multiplier - Speed multiplier
     */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.animations.forEach(animation => {
            animation.frameDuration = 
                animation.baseDuration / multiplier;
        });
    }
}

/**
 * Represents a playable character in the game
 */
class Character {
    /**
     * Creates a new Character instance
     * @param {Game} game - Reference to the main game instance
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {boolean} isPlayer1 - Whether this is player 1
     * @param {Object} characterData - Character configuration data
     */
    constructor(game, x, y, isPlayer1, characterData) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.isPlayer1 = isPlayer1;
        this.width = 60;
        this.height = 100;
        
        // Load character data
        this.loadCharacterData(characterData);
        
        // Physics state
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.facing = isPlayer1 ? 1 : -1;
        
        // Combat state
        this.health = 100;
        this.energy = 100;
        this.isBlocking = false;
        this.isAttacking = false;
        this.isHit = false;
        this.invulnerable = false;
        this.comboCount = 0;
        
        // Animation state
        this.currentState = 'idle';
        this.stateTime = 0;
        
        // Input buffer for combos
        this.inputBuffer = [];
        this.lastInputTime = 0;
        this.inputBufferTimeout = 500; // ms
    }

    loadCharacterData(data) {
        this.stats = {
            walkSpeed: data.walkSpeed || 5,
            jumpForce: data.jumpForce || -15,
            weight: data.weight || 1,
            attackDamage: data.attackDamage || 10,
            specialDamage: data.specialDamage || 20,
            blockReduction: data.blockReduction || 0.5
        };
        
        this.moves = data.moves || {};
        this.hitboxes = data.hitboxes || {};
    }

    /**
     * Updates character state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update combat state
        this.updateCombat(deltaTime);
        
        // Clean input buffer
        this.cleanInputBuffer();
        
        // Regenerate energy
        if (this.energy < 100) {
            this.energy = Math.min(100, this.energy + 0.1);
        }
    }

    updatePhysics(deltaTime) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocityY += GAME_CONFIG.gravity * deltaTime;
        }
        
        // Update position
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Check ground collision
        const ground = this.game.canvas.height - this.height;
        if (this.y > ground) {
            this.y = ground;
            this.velocityY = 0;
            this.isGrounded = true;
        }
        
        // Check screen boundaries
        this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
    }

    updateAnimation(deltaTime) {
        this.stateTime += deltaTime;
        const animation = this.game.animationSystem.animations.get(
            `${this.isPlayer1 ? 'p1' : 'p2'}_${this.currentState}`
        );
        
        if (animation && !animation.loop && 
            this.stateTime >= animation.frameDuration * animation.frameCount) {
            this.currentState = 'idle';
            this.stateTime = 0;
        }
    }

    updateCombat(deltaTime) {
        if (this.isHit) {
            this.hitStunTime -= deltaTime;
            if (this.hitStunTime <= 0) {
                this.isHit = false;
                this.invulnerable = false;
            }
        }
    }

    /**
     * Handles character input
     * @param {InputState} input - Current input state
     */
    handleInput(input) {
        // Add input to buffer
        const currentTime = Date.now();
        this.inputBuffer.push({
            input: input,
            timestamp: currentTime
        });
        
        // Check for special moves
        this.checkSpecialMoves();
        
        // Handle basic moves
        switch(input) {
            case 'left':
                this.move(-1);
                break;
            case 'right':
                this.move(1);
                break;
            case 'jump':
                this.jump();
                break;
            case 'attack':
                this.attack();
                break;
            case 'block':
                this.block();
                break;
        }
    }

    move(direction) {
        if (this.isAttacking || this.isHit) return;
        
        this.velocityX = direction * this.stats.walkSpeed;
        this.facing = direction;
        this.currentState = 'walk';
    }

    jump() {
        if (this.isGrounded && !this.isAttacking && !this.isHit) {
            this.velocityY = this.stats.jumpForce;
            this.isGrounded = false;
            this.currentState = 'jump';
            this.game.audioManager.playSound('jump');
        }
    }

    attack() {
        if (this.isAttacking || this.isBlocking || this.isHit) return;

        this.isAttacking = true;
        this.currentState = 'attack';
        this.stateTime = 0;
        this.game.audioManager.playSound('attack');

        // Create hit effect
        this.game.effectsSystem.createEffect('hit', {
            x: this.x + (this.facing * this.width),
            y: this.y + (this.height / 2),
            type: 'attack'
        });
    }

    block() {
        if (this.isAttacking || this.isHit) return;
        
        this.isBlocking = true;
        this.currentState = 'block';
        this.velocityX = 0;
    }

    takeHit(damage, attacker) {
        if (this.invulnerable) return;

        const actualDamage = this.isBlocking ? 
            damage * this.stats.blockReduction : damage;

        this.health = Math.max(0, this.health - actualDamage);
        this.isHit = true;
        this.hitStunTime = 300; // ms
        this.currentState = 'hit';
        
        // Knockback
        const knockbackForce = this.isBlocking ? 2 : 5;
        this.velocityX = (this.x < attacker.x ? -1 : 1) * knockbackForce;
        
        // Visual effects
        this.game.effectsSystem.createEffect('hit', {
            x: this.x + (this.width / 2),
            y: this.y + (this.height / 2),
            type: this.isBlocking ? 'block' : 'hit'
        });
        
        // Sound effects
        this.game.audioManager.playSound(this.isBlocking ? 'block' : 'hit');
        
        // Check for KO
        if (this.health <= 0) {
            this.currentState = 'ko';
            this.game.checkRoundEnd();
        }
    }

    checkSpecialMoves() {
        const recentInputs = this.inputBuffer
            .filter(input => Date.now() - input.timestamp < this.inputBufferTimeout)
            .map(input => input.input);

        for (const [moveName, move] of Object.entries(this.moves)) {
            if (this.checkInputSequence(recentInputs, move.sequence)) {
                if (this.energy >= move.energyCost) {
                    this.executeSpecialMove(moveName, move);
                    break;
                }
            }
        }
    }

    executeSpecialMove(moveName, move) {
        this.energy -= move.energyCost;
        this.isAttacking = true;
        this.currentState = moveName;
        this.stateTime = 0;
        
        this.game.audioManager.playSound(moveName);
        this.game.effectsSystem.createEffect(moveName, {
            x: this.x + (this.facing * this.width),
            y: this.y + (this.height / 2),
            type: 'special'
        });
    }

    cleanInputBuffer() {
        const currentTime = Date.now();
        this.inputBuffer = this.inputBuffer.filter(
            input => currentTime - input.timestamp < this.inputBufferTimeout
        );
    }

    draw(ctx) {
        // Draw character sprite
        this.game.animationSystem.draw(
            ctx,
            `${this.isPlayer1 ? 'p1' : 'p2'}_${this.currentState}`,
            this.x,
            this.y,
            this.facing === -1
        );

        // Draw health bar
        this.drawHealthBar(ctx);
        
        // Draw energy bar
        this.drawEnergyBar(ctx);
    }

    drawHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 5;
        const x = this.x + (this.width - barWidth) / 2;
        const y = this.y - 10;

        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        const healthPercent = this.health / 100;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    }

    drawEnergyBar(ctx) {
        const barWidth = 40;
        const barHeight = 3;
        const x = this.x + (this.width - barWidth) / 2;
        const y = this.y - 15;

        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x, y, barWidth * (this.energy / 100), barHeight);
    }
}

/**
 * Manages special moves and combo systems
 */
class SpecialMoveSystem {
    constructor() {
        this.moves = {
            'p1_fireball': new FireballMove(),
            'p1_thunderbolt': new ThunderboltMove(),
            'p2_iceblade': new IcebladeMove(),
            'p2_frostbolt': new FrostboltMove()
        };
    }

    getMove(key) {
        return this.moves[key];
    }

    // ... (continued in next part)
}

/**
 * Manages effects and animations
 */
class EffectsSystem {
    constructor() {
        this.effects = new Map();
    }

    createEffect(key, effectData) {
        this.effects.set(key, new Effect(effectData));
    }

    update(deltaTime) {
        this.effects.forEach(effect => effect.update(deltaTime));
    }

    draw(ctx) {
        this.effects.forEach(effect => effect.draw(ctx));
    }

    resetEffect(key) {
        this.effects.get(key).reset();
    }
}

/**
 * Manages menu systems
 */
class MenuSystem {
    constructor(game) {
        this.game = game;
        this.menu = new Menu(this);
    }

    // ... (continued in next part)
}

/**
 * Manages character systems
 */
class CharacterSystem {
    constructor(game) {
        this.game = game;
        this.characters = new Map();
    }

    addCharacter(key, character) {
        this.characters.set(key, character);
    }

    getCharacter(key) {
        return this.characters.get(key);
    }

    // ... (continued in next part)
}

/**
 * Manages special moves and combo systems
 */
class SpecialMoveSystem {
    constructor() {
        this.moves = {
            'p1_fireball': new FireballMove(),
            'p1_thunderbolt': new ThunderboltMove(),
            'p2_iceblade': new IcebladeMove(),
            'p2_frostbolt': new FrostboltMove()
        };
    }

    getMove(key) {
        return this.moves[key];
    }

    // ... (continued in next part)
}

/**
 * Manages effects and animations
 */
class EffectsSystem {
    constructor() {
        this.effects = new Map();
    }

    createEffect(key, effectData) {
        this.effects.set(key, new Effect(effectData));
    }

    update(deltaTime) {
        this.effects.forEach(effect => effect.update(deltaTime));
    }

    draw(ctx) {
        this.effects.forEach(effect => effect.draw(ctx));
    }

    resetEffect(key) {
        this.effects.get(key).reset();
    }
}

/**
 * Manages menu systems
 */
class MenuSystem {
    constructor(game) {
        this.game = game;
        this.menu = new Menu(this);
    }
}

/**
 * Menu System Implementation
 */
class Menu {
    constructor(game) {
        this.game = game;
        this.currentMenu = 'main';
        this.selectedIndex = 0;
        
        this.menus = {
            main: {
                title: 'FIGHTER GAME',
                options: ['Start Game', 'Options', 'Controls', 'Exit'],
                callbacks: {
                    'Start Game': () => this.switchMenu('characterSelect'),
                    'Options': () => this.switchMenu('options'),
                    'Controls': () => this.switchMenu('controls'),
                    'Exit': () => window.close()
                }
            },
            characterSelect: {
                title: 'SELECT CHARACTER',
                options: ['Fighter 1', 'Fighter 2', 'Fighter 3', 'Back'],
                callbacks: {
                    'Fighter 1': () => this.selectCharacter('fighter1'),
                    'Fighter 2': () => this.selectCharacter('fighter2'),
                    'Fighter 3': () => this.selectCharacter('fighter3'),
                    'Back': () => this.switchMenu('main')
                }
            },
            options: {
                title: 'OPTIONS',
                options: ['Sound: ON', 'Music: ON', 'Difficulty: Normal', 'Back'],
                callbacks: {
                    'Sound: ON': () => this.toggleSound(),
                    'Music: ON': () => this.toggleMusic(),
                    'Difficulty: Normal': () => this.cycleDifficulty(),
                    'Back': () => this.switchMenu('main')
                }
            }
        };
    }

    draw(ctx) {
        const menu = this.menus[this.currentMenu];
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(menu.title, ctx.canvas.width / 2, 100);
        
        // Draw options
        ctx.font = '24px Arial';
        menu.options.forEach((option, index) => {
            const y = 250 + (index * 50);
            if (index === this.selectedIndex) {
                ctx.fillStyle = '#ffff00';
                ctx.fillText('> ' + option + ' <', ctx.canvas.width / 2, y);
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillText(option, ctx.canvas.width / 2, y);
            }
        });
    }

    handleInput(input) {
        switch(input) {
            case 'ArrowUp':
                this.selectedIndex = (this.selectedIndex - 1 + 
                    this.menus[this.currentMenu].options.length) % 
                    this.menus[this.currentMenu].options.length;
                this.game.audioManager.playSound('menuMove');
                break;
            case 'ArrowDown':
                this.selectedIndex = (this.selectedIndex + 1) % 
                    this.menus[this.currentMenu].options.length;
                this.game.audioManager.playSound('menuMove');
                break;
            case 'Enter':
                const selectedOption = this.menus[this.currentMenu]
                    .options[this.selectedIndex];
                this.menus[this.currentMenu].callbacks[selectedOption]();
                this.game.audioManager.playSound('menuSelect');
                break;
        }
    }

    switchMenu(menuName) {
        this.currentMenu = menuName;
        this.selectedIndex = 0;
    }

    selectCharacter(character) {
        // Implementation for character selection
        this.game.selectedCharacter = character;
        this.game.startGame();
    }

    toggleSound() {
        // Implementation for sound toggle
    }

    toggleMusic() {
        // Implementation for music toggle
    }

    cycleDifficulty() {
        // Implementation for difficulty cycling
    }
}

/**
 * Game State Management Implementation
 */
class GameStateManager {
    constructor(game) {
        this.game = game;
        this.currentState = 'loading';
        this.states = {
            loading: new LoadingState(game),
            menu: new MenuState(game),
            fighting: new FightingState(game),
            pause: new PauseState(game),
            gameOver: new GameOverState(game)
        };
    }

    changeState(newState) {
        if (this.states[newState]) {
            this.states[this.currentState].exit();
            this.currentState = newState;
            this.states[this.currentState].enter();
        }
    }

    update(deltaTime) {
        this.states[this.currentState].update(deltaTime);
    }

    draw(ctx) {
        this.states[this.currentState].draw(ctx);
    }

    handleInput(input) {
        this.states[this.currentState].handleInput(input);
    }
}

/**
 * Base State Class
 */
class GameState {
    constructor(game) {
        this.game = game;
    }

    enter() {}
    exit() {}
    update(deltaTime) {}
    draw(ctx) {}
    handleInput(input) {}
}

/**
 * Fighting State Implementation
 */
class FightingState extends GameState {
    enter() {
        this.game.startRound();
    }

    update(deltaTime) {
        this.game.player1.update(deltaTime);
        this.game.player2.update(deltaTime);
        this.game.effectsSystem.update(deltaTime);
        this.game.checkCollisions();
    }

    draw(ctx) {
        // Draw background
        ctx.drawImage(this.game.assetLoader.getImage('background'), 0, 0);
        
        // Draw characters
        this.game.player1.draw(ctx);
        this.game.player2.draw(ctx);
        
        // Draw effects
        this.game.effectsSystem.draw(ctx);
        
        // Draw HUD
        this.drawHUD(ctx);
    }

    drawHUD(ctx) {
        // Implementation for HUD drawing
    }

    handleInput(input) {
        // Implementation for input handling during fight
    }
}

/**
 * Loading State Implementation
 */
class LoadingState extends GameState {
    constructor(game) {
        super(game);
        this.loadingProgress = 0;
        this.loadingText = 'Loading...';
        this.minLoadTime = 1000; // Minimum loading screen time
        this.startTime = Date.now();
    }

    enter() {
        this.startTime = Date.now();
    }

    update(deltaTime) {
        this.loadingProgress = this.game.assetLoader.getLoadingProgress();
        
        // Check if minimum time has passed and assets are loaded
        if (this.loadingProgress >= 1 && 
            Date.now() - this.startTime > this.minLoadTime) {
            this.game.stateManager.changeState('menu');
        }
    }

    draw(ctx) {
        this.game.loadingScreen.updateProgress(
            this.loadingProgress * 100,
            100
        );
        this.game.loadingScreen.draw(ctx);
    }
}

/**
 * Menu State Implementation
 */
class MenuState extends GameState {
    enter() {
        this.game.audioManager.playMusic('menuTheme');
    }

    exit() {
        this.game.audioManager.stopMusic();
    }

    update(deltaTime) {
        // Update menu animations if any
    }

    draw(ctx) {
        this.game.menuSystem.draw(ctx);
    }

    handleInput(input) {
        this.game.menuSystem.handleInput(input);
    }
}

/**
 * Pause State Implementation
 */
class PauseState extends GameState {
    enter() {
        this.game.audioManager.pauseMusic();
    }

    exit() {
        this.game.audioManager.resumeMusic();
    }

    draw(ctx) {
        // Draw the paused game state in background
        this.game.states.fighting.draw(ctx);
        
        // Draw pause menu overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', ctx.canvas.width / 2, ctx.canvas.height / 2);
        
        // Draw pause menu options
        const options = ['Resume', 'Options', 'Quit to Menu'];
        ctx.font = '24px Arial';
        options.forEach((option, index) => {
            ctx.fillText(
                option,
                ctx.canvas.width / 2,
                ctx.canvas.height / 2 + 50 + (index * 40)
            );
        });
    }
}

/**
 * Game Over State Implementation
 */
class GameOverState extends GameState {
    enter() {
        this.game.audioManager.playMusic('gameOverTheme');
        this.winner = this.determineWinner();
        this.showResults();
    }

    determineWinner() {
        return this.game.player1.health > this.game.player2.health ? 
            'Player 1' : 'Player 2';
    }

    showResults() {
        // Show match statistics
        this.stats = {
            duration: this.game.matchDuration,
            maxCombo: Math.max(
                this.game.player1.maxCombo,
                this.game.player2.maxCombo
            ),
            perfectRounds: this.game.perfectRounds
        };
    }

    draw(ctx) {
        // Draw end game screen
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.winner} WINS!`,
            ctx.canvas.width / 2,
            ctx.canvas.height / 3
        );
        
        // Draw stats
        ctx.font = '24px Arial';
        Object.entries(this.stats).forEach(([stat, value], index) => {
            ctx.fillText(
                `${stat}: ${value}`,
                ctx.canvas.width / 2,
                ctx.canvas.height / 2 + (index * 40)
            );
        });
    }
}

/**
 * Audio System Implementation
 */
class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
        
        this.settings = {
            masterVolume: 1,
            musicVolume: 0.7,
            soundVolume: 0.8,
            muted: false
        };
        
        this.loadAudio();
    }

    loadAudio() {
        // Load sound effects
        const soundEffects = {
            'hit': 'assets/sounds/hit.mp3',
            'block': 'assets/sounds/block.mp3',
            'special': 'assets/sounds/special.mp3',
            'menuMove': 'assets/sounds/menu-move.mp3',
            'menuSelect': 'assets/sounds/menu-select.mp3',
            'roundStart': 'assets/sounds/round-start.mp3',
            'roundEnd': 'assets/sounds/round-end.mp3',
            'ko': 'assets/sounds/ko.mp3'
        };
        
        // Load music tracks
        const musicTracks = {
            'menuTheme': 'assets/music/menu-theme.mp3',
            'battleTheme': 'assets/music/battle-theme.mp3',
            'gameOverTheme': 'assets/music/gameover-theme.mp3'
        };
        
        // Load all audio
        Object.entries(soundEffects).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            this.sounds.set(key, audio);
        });
        
        Object.entries(musicTracks).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.loop = true;
            this.music.set(key, audio);
        });
    }

    playSound(key) {
        if (this.settings.muted) return;
        
        const sound = this.sounds.get(key);
        if (sound) {
            const soundClone = sound.cloneNode();
            soundClone.volume = this.settings.soundVolume * this.settings.masterVolume;
            soundClone.play().catch(error => 
                console.warn(`Failed to play sound: ${error}`)
            );
        }
    }

    playMusic(key) {
        if (this.settings.muted) return;
        
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        
        const music = this.music.get(key);
        if (music) {
            music.volume = this.settings.musicVolume * this.settings.masterVolume;
            music.play().catch(error => 
                console.warn(`Failed to play music: ${error}`)
            );
            this.currentMusic = music;
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }

    resumeMusic() {
        if (this.currentMusic && !this.settings.muted) {
            this.currentMusic.play().catch(error => 
                console.warn(`Failed to resume music: ${error}`)
            );
        }
    }

    setVolume(type, value) {
        value = Math.max(0, Math.min(1, value));
        switch(type) {
            case 'master':
                this.settings.masterVolume = value;
                break;
            case 'music':
                this.settings.musicVolume = value;
                if (this.currentMusic) {
                    this.currentMusic.volume = 
                        value * this.settings.masterVolume;
                }
                break;
            case 'sound':
                this.settings.soundVolume = value;
                break;
        }
    }

    toggleMute() {
        this.settings.muted = !this.settings.muted;
        if (this.settings.muted) {
            this.stopMusic();
        } else {
            this.resumeMusic();
        }
    }
}

/**
 * Special Move Base Class
 */
class SpecialMove {
    constructor(config) {
        this.name = config.name;
        this.damage = config.damage;
        this.energyCost = config.energyCost;
        this.startupFrames = config.startupFrames;
        this.activeFrames = config.activeFrames;
        this.recoveryFrames = config.recoveryFrames;
        this.hitboxes = config.hitboxes;
        this.animation = config.animation;
        this.effects = config.effects;
    }

    execute(character) {
        if (character.energy < this.energyCost) return false;
        character.energy -= this.energyCost;
        return true;
    }
}

/**
 * Special Move Implementations
 */
class FireballMove extends SpecialMove {
    constructor() {
        super({
            name: 'Fireball',
            damage: 25,
            energyCost: 20,
            startupFrames: 10,
            activeFrames: 30,
            recoveryFrames: 15,
            hitboxes: [{
                x: 0, y: -20,
                width: 40, height: 40,
                type: 'projectile'
            }],
            animation: 'fireball',
            effects: ['fire', 'explosion']
        });
    }

    execute(character) {
        if (!super.execute(character)) return;

        // Create projectile
        const projectile = new Projectile({
            x: character.x + (character.facing * 50),
            y: character.y + 30,
            velocity: { x: character.facing * 8, y: 0 },
            lifetime: 2000,
            damage: this.damage,
            owner: character,
            effects: this.effects
        });

        character.game.addProjectile(projectile);
    }
}

/**
 * Projectile System
 */
class ProjectileSystem {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
    }

    update(deltaTime) {
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return !projectile.destroyed;
        });
    }

    draw(ctx) {
        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }

    checkCollisions(character) {
        this.projectiles.forEach(projectile => {
            if (projectile.owner !== character && 
                this.checkCollision(projectile, character)) {
                character.takeHit(projectile.damage, projectile.owner);
                projectile.onHit();
            }
        });
    }

    checkCollision(projectile, character) {
        // Implement collision detection
        return false; // Placeholder
    }
}

/**
 * Combat Balance Configuration
 */
const COMBAT_CONFIG = {
    damage: {
        light: 5,
        medium: 10,
        heavy: 15,
        special: 20
    },
    hitstun: {
        light: 100,
        medium: 200,
        heavy: 300,
        special: 400
    },
    blockstun: {
        light: 50,
        medium: 100,
        heavy: 150,
        special: 200
    },
    recovery: {
        light: 10,
        medium: 15,
        heavy: 20,
        special: 25
    },
    combo: {
        scaling: 0.1,
        maxHits: 10,
        timeWindow: 500
    }
};

/**
 * Enhanced Combat System
 */
class CombatSystem {
    constructor(game) {
        this.game = game;
        this.comboCounter = 0;
        this.lastHitTime = 0;
        this.currentDamageScale = 1.0;
    }

    /**
     * Handles a hit between characters
     * @param {Character} attacker - Attacking character
     * @param {Character} defender - Defending character
     * @param {Object} attackData - Attack information
     * @returns {boolean} Whether the hit connected
     */
    handleHit(attacker, defender, attackData) {
        // Check if combo is still valid
        if (Date.now() - this.lastHitTime > COMBAT_CONFIG.combo.timeWindow) {
            this.resetCombo();
        }

        // Calculate damage with scaling
        let damage = COMBAT_CONFIG.damage[attackData.type];
        if (this.comboCounter > 0) {
            damage *= (1 - (this.comboCounter * COMBAT_CONFIG.combo.scaling));
        }

        // Apply the hit
        if (!defender.isBlocking) {
            defender.health -= damage;
            defender.hitstun = COMBAT_CONFIG.hitstun[attackData.type];
            this.comboCounter++;
        } else {
            defender.health -= damage * 0.1;
            defender.blockstun = COMBAT_CONFIG.blockstun[attackData.type];
        }

        // Update combo state
        this.lastHitTime = Date.now();
        this.currentDamageScale = Math.max(
            0.1,
            1 - (this.comboCounter * COMBAT_CONFIG.combo.scaling)
        );

        // Create hit effects
        this.createHitEffects(attacker, defender, attackData);
    }

    createHitEffects(attacker, defender, attackData) {
        const hitPos = {
            x: defender.x + (defender.width / 2),
            y: defender.y + (defender.height / 2)
        };

        // Create visual effects
        this.game.effectsSystem.createEffect('hit', {
            position: hitPos,
            type: attackData.type,
            blocked: defender.isBlocking
        });

        // Create hit particles
        this.game.particleSystem.createHitParticles({
            position: hitPos,
            count: attackData.type === 'special' ? 20 : 10,
            color: defender.isBlocking ? '#ffff00' : '#ff0000'
        });

        // Play hit sound
        this.game.audioManager.playSound(
            defender.isBlocking ? 'block' : 'hit'
        );
    }

    resetCombo() {
        this.comboCounter = 0;
        this.currentDamageScale = 1.0;
    }
}

/**
 * Enhanced Particle System
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.particlePool = new ObjectPool(() => new Particle());
    }

    createHitParticles(config) {
        const { position, count, color } = config;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 2 + 2;
            const particle = this.particlePool.get();
            
            particle.init({
                x: position.x,
                y: position.y,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                color: color,
                lifetime: 500,
                size: Math.random() * 3 + 2
            });

            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            if (particle.update(deltaTime)) {
                return true;
            } else {
                this.particlePool.release(particle);
                return false;
            }
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
}

/**
 * Game difficulty and speed configuration
 * @constant {Object}
 */
const DIFFICULTY_CONFIG = {
    easy: {
        aiReactionTime: 500,      // ms to react
        aiAccuracy: 0.6,          // 60% accuracy
        aiAggressiveness: 0.3,    // 30% chance to attack
        damageMultiplier: 0.8,    // Player deals more damage
        aiDamageMultiplier: 0.6   // AI deals less damage
    },
    normal: {
        aiReactionTime: 300,
        aiAccuracy: 0.8,
        aiAggressiveness: 0.5,
        damageMultiplier: 1.0,
        aiDamageMultiplier: 1.0
    },
    hard: {
        aiReactionTime: 150,
        aiAccuracy: 0.9,
        aiAggressiveness: 0.7,
        damageMultiplier: 1.0,
        aiDamageMultiplier: 1.2
    }
};

/**
 * Game speed configuration
 * @constant {Object}
 */
const SPEED_CONFIG = {
    slow: {
        timeScale: 0.5,
        animationSpeedMultiplier: 0.5,
        physicsIterations: 1
    },
    normal: {
        timeScale: 1.0,
        animationSpeedMultiplier: 1.0,
        physicsIterations: 1
    },
    fast: {
        timeScale: 1.5,
        animationSpeedMultiplier: 1.5,
        physicsIterations: 2
    }
};

/**
 * AI Controller for computer-controlled characters
 * @class
 */
class AIController {
    /**
     * Creates an AI controller
     * @param {Character} character - The character to control
     * @param {string} difficulty - Difficulty setting (easy/normal/hard)
     */
    constructor(character, difficulty = 'normal') {
        this.character = character;
        this.difficulty = difficulty;
        this.config = DIFFICULTY_CONFIG[difficulty];
        this.lastDecisionTime = 0;
        this.currentAction = null;
    }

    update(deltaTime, opponent) {
        const currentTime = Date.now();
        
        // Check if it's time for a new decision
        if (currentTime - this.lastDecisionTime > this.config.aiReactionTime) {
            this.makeDecision(opponent);
            this.lastDecisionTime = currentTime;
        }

        // Execute current action
        this.executeAction(opponent);
    }

    makeDecision(opponent) {
        const distance = Math.abs(opponent.x - this.character.x);
        
        // Decide action based on situation
        if (Math.random() < this.config.aiAccuracy) {
            if (distance < 100 && Math.random() < this.config.aiAggressiveness) {
                this.currentAction = 'attack';
            } else if (distance > 200) {
                this.currentAction = 'approach';
            } else if (Math.random() < 0.3) {
                this.currentAction = 'jump';
            } else {
                this.currentAction = 'block';
            }
        }
    }

    executeAction(opponent) {
        switch(this.currentAction) {
            case 'attack':
                if (Math.random() < this.config.aiAggressiveness) {
                    this.character.attack();
                }
                break;
            case 'approach':
                const direction = opponent.x > this.character.x ? 1 : -1;
                this.character.move(direction);
                break;
            case 'jump':
                this.character.jump();
                break;
            case 'block':
                this.character.block();
                break;
        }
    }
}

/**
 * Animation Manager with improved smoothing
 * @class
 */
class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.currentAnimation = null;
        this.transitionDuration = 100; // ms
        this.lastTransitionTime = 0;
        this.transitionProgress = 1;
        this.previousFrame = null;
    }

    /**
     * Updates animation state
     * @param {number} deltaTime - Time since last update in ms
     * @param {number} speedMultiplier - Current game speed multiplier
     */
    update(deltaTime, speedMultiplier = 1.0) {
        // Update transition progress
        if (this.transitionProgress < 1) {
            this.transitionProgress = Math.min(1, 
                (Date.now() - this.lastTransitionTime) / this.transitionDuration);
        }

        // Update current animation
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime * speedMultiplier);
        }
    }

    /**
     * Smoothly transitions to a new animation
     * @param {string} newAnimationName - Name of the animation to transition to
     */
    transitionTo(newAnimationName) {
        const newAnimation = this.animations.get(newAnimationName);
        if (!newAnimation || newAnimation === this.currentAnimation) return;

        // Store previous frame for interpolation
        if (this.currentAnimation) {
            this.previousFrame = this.currentAnimation.getCurrentFrame();
        }

        this.currentAnimation = newAnimation;
        this.transitionProgress = 0;
        this.lastTransitionTime = Date.now();
    }

    /**
     * Draws the current animation frame with interpolation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {boolean} flipX - Whether to flip horizontally
     */
    draw(ctx, x, y, flipX = false) {
        if (!this.currentAnimation) return;

        if (this.transitionProgress < 1 && this.previousFrame) {
            // Draw interpolated frame
            this.drawInterpolatedFrame(ctx, x, y, flipX);
        } else {
            // Draw current frame normally
            this.currentAnimation.draw(ctx, x, y, flipX);
        }
    }

    /**
     * Draws an interpolated frame between animations
     * @private
     */
    drawInterpolatedFrame(ctx, x, y, flipX) {
        ctx.save();
        ctx.globalAlpha = 1 - this.transitionProgress;
        if (this.previousFrame) {
            this.drawFrame(ctx, this.previousFrame, x, y, flipX);
        }
        ctx.globalAlpha = this.transitionProgress;
        this.currentAnimation.draw(ctx, x, y, flipX);
        ctx.restore();
    }
}

/**
 * @typedef {Object} Vector2D
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} GameState
 * @property {string} current - Current game state
 * @property {boolean} paused - Whether game is paused
 * @property {number} timeScale - Current time scale
 * @property {string} difficulty - Current difficulty setting
 */

/**
 * @typedef {Object} CharacterState
 * @property {number} health - Current health
 * @property {number} energy - Current energy
 * @property {boolean} isBlocking - Whether character is blocking
 * @property {boolean} isAttacking - Whether character is attacking
 * @property {string} currentAnimation - Current animation name
 */

/**
 * @typedef {Object} InputState
 * @property {boolean} left - Left input state
 * @property {boolean} right - Right input state
 * @property {boolean} up - Up input state
 * @property {boolean} down - Down input state
 * @property {boolean} attack - Attack input state
 * @property {boolean} block - Block input state
 */

import { SIZE_MULTIPLIER, SCALE, showWarning, COSTS } from './utils/constants.js';
import { UISystem } from './systems/UISystem.js';
import { Worker } from './entities/Worker.js';
import { MineralPatch } from './entities/MineralPatch.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { WorkerSystem } from './systems/WorkerSystem.js';
import { TurretSystem } from './systems/TurretSystem.js';
import { BatterySystem } from './systems/BatterySystem.js';
import { MissileSystem } from './systems/MissileSystem.js';
import { MilestoneSystem } from './systems/MilestoneSystem.js';
import { MinimapSystem } from './systems/MinimapSystem.js';
import { Camera } from './utils/Camera.js';
import { Turret } from './entities/Turret.js';
import { Battery } from './entities/Battery.js';
import { drawSelectionRectangle } from './systems/InputSystem.js';

// Main game class to manage game state and initialization
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isPaused = false;
        this.gameOver = false;
        this.victory = false;
        this.minerals = 450;
        this.totalMineralsCollected = 0;
        this.wave = 1;
        this.waveStartTime = Date.now();
        this.gameStartTime = Date.now();
        this.lastSpawn = Date.now();
        this.spawnInterval = 5000;
        this.warningMessage = '';
        this.warningTimeout = null;
        this.buildingType = null;
        this.selectedTurret = null;
        this.selectedBattery = null;
        this.selectedWorker = null;

        // Initialize camera
        this.camera = new Camera(this);

        // Initialize collections
        this.workers = [];
        this.turrets = [];
        this.enemies = [];
        this.missiles = [];
        this.batteries = [];
        this.mineralPatches = [];

        // Initialize systems
        this.milestoneSystem = new MilestoneSystem(this);

        // Initialize base
        this.base = {
            x: this.camera.worldWidth / 2,
            y: this.camera.worldHeight * 0.8,
            size: 40 * SCALE / SIZE_MULTIPLIER,
            hp: 1000,
            maxHp: 1000,
            draw: function(ctx, camera) {
                const screen = camera.worldToScreen(this.x, this.y);
                if (!camera.isOnScreen(this.x, this.y)) return;
                
                const visualSize = this.size * SIZE_MULTIPLIER;
                
                // Draw base platform
                ctx.fillStyle = '#34495e';
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, visualSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw base structure
                ctx.fillStyle = '#2c3e50';
                const numSides = 6;
                ctx.beginPath();
                for (let i = 0; i < numSides; i++) {
                    const angle = (i / numSides) * Math.PI * 2;
                    const x = screen.x + Math.cos(angle) * visualSize * 0.5;
                    const y = screen.y + Math.sin(angle) * visualSize * 0.5;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                
                // Draw enhanced health bar
                const healthBarWidth = visualSize * 1.5;
                const healthBarHeight = 8 * SIZE_MULTIPLIER;
                const healthPercentage = this.hp / this.maxHp;
                const barY = screen.y - visualSize/2 - 20 * SIZE_MULTIPLIER;
                
                // Health bar background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(screen.x - healthBarWidth/2 - 1, barY - 1, healthBarWidth + 2, healthBarHeight + 2);
                
                // Health bar border
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(screen.x - healthBarWidth/2 - 1, barY - 1, healthBarWidth + 2, healthBarHeight + 2);
                
                // Health bar fill
                const gradient = ctx.createLinearGradient(screen.x - healthBarWidth/2, barY, screen.x - healthBarWidth/2, barY + healthBarHeight);
                gradient.addColorStop(0, healthPercentage > 0.5 ? '#00ff00' : '#ff6b6b');
                gradient.addColorStop(1, healthPercentage > 0.5 ? '#00cc00' : '#cc0000');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(screen.x - healthBarWidth/2, barY, healthBarWidth * healthPercentage, healthBarHeight);
            }
        };

        // Center camera to put base in middle of screen
        this.camera.x = this.base.x - screen.availWidth/2

        this.camera.y = this.base.y - screen.availHeight/2

        // Clamp camera position to world bounds
        this.camera.x = Math.max(0, Math.min(
            this.camera.worldWidth - this.canvas.width,
            this.camera.x
        ));
        this.camera.y = Math.max(0, Math.min(
            this.camera.worldHeight - this.canvas.height,
            this.camera.y
        ));

        // Bind methods
        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.togglePause = this.togglePause.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleRightClick = this.handleRightClick.bind(this);

        // Add event listeners
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            } else if (e.key.toLowerCase() === 'f') {
                this.toggleFullscreen();
            }
        });

        // Initial setup
        this.handleResize();
        this.initializeMineralPatches();
    }

    // Helper function to assign worker to mineral patch
    assignWorkerToPatch(worker, patch) {
        if (!worker || !patch) return;

        // Remove from current patch if assigned
        if (worker.targetPatch) {
            // Remove from mining queue if present
            const queueIndex = worker.targetPatch.miningQueue.indexOf(worker);
            if (queueIndex !== -1) {
                worker.targetPatch.miningQueue.splice(queueIndex, 1);
            }
            // Clear current miner if this worker
            if (worker.targetPatch.currentMiner === worker) {
                worker.targetPatch.currentMiner = null;
            }
            worker.targetPatch.workers--;
        }
        
        // Assign to new patch
        worker.targetPatch = patch;
        worker.state = 'toMineral';
        patch.workers++;
        showWarning('Worker assigned to mineral patch');
    }

    handleRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Convert screen coordinates to world coordinates
        const worldPos = this.camera.screenToWorld(screenX, screenY);

        // If we have a selected worker, check if clicked on a mineral patch
        if (this.selectedWorker) {
            for (let patch of this.mineralPatches) {
                const dist = Math.hypot(worldPos.x - patch.x, worldPos.y - patch.y);
                if (dist < patch.size * 2) {
                    this.assignWorkerToPatch(this.selectedWorker, patch);
                    return;
                }
            }
        }
    }

    handleClick(e) {
        if (this.gameOver) {
            resetGame(this);
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Check if click was on minimap
        if (MinimapSystem.handleClick(this, screenX, screenY)) {
            return;
        }

        // Convert screen coordinates to world coordinates for other interactions
        const worldPos = this.camera.screenToWorld(screenX, screenY);

        // Handle building placement
        if (this.buildingType) {
            // Check if the placement position is within world bounds
            const margin = 50; // Margin from world edges
            if (worldPos.x < margin || worldPos.x > this.camera.worldWidth - margin ||
                worldPos.y < margin || worldPos.y > this.camera.worldHeight - margin) {
                showWarning('Cannot build outside the game world!');
                return;
            }

            const cost = COSTS[this.buildingType];
            if (this.minerals >= cost) {
                // Create the new building at world coordinates
                let newBuilding = null;
                switch (this.buildingType) {
                    case 'worker':
                        newBuilding = new Worker(this, worldPos.x, worldPos.y);
                        this.workers.push(newBuilding);
                        break;
                    case 'turret':
                        newBuilding = new Turret(this, worldPos.x, worldPos.y);
                        this.turrets.push(newBuilding);
                        break;
                    case 'battery':
                        newBuilding = new Battery(this, worldPos.x, worldPos.y);
                        this.batteries.push(newBuilding);
                        break;
                }
                this.minerals -= cost;
                
                // Center camera on the new building
                this.camera.x = Math.max(0, Math.min(
                    this.camera.worldWidth - this.canvas.width,
                    worldPos.x - this.canvas.width / 2
                ));
                this.camera.y = Math.max(0, Math.min(
                    this.camera.worldHeight - this.canvas.height,
                    worldPos.y - this.canvas.height / 2
                ));

                this.buildingType = null;
                showWarning('Building placed!');
            } else {
                showWarning(`Not enough minerals! Need ${cost}`);
            }
            return;
        }

        // Clear all selections first
        this.mineralPatches.forEach(patch => patch.isSelected = false);
        this.workers.forEach(worker => worker.isSelected = false);
        this.selectedWorker = null;
        this.selectedTurret = null;
        this.selectedBattery = null;

        // Check mineral patches first
        let clickedPatch = null;
        for (let patch of this.mineralPatches) {
            const dist = Math.hypot(worldPos.x - patch.x, worldPos.y - patch.y);
            if (dist < patch.size * 2) {
                patch.isSelected = true;
                clickedPatch = patch;
                showWarning(`Mineral Patch: ${Math.floor(patch.minerals)} minerals remaining`);
                break;
            }
        }

        // Check workers
        for (let worker of this.workers) {
            const dist = Math.hypot(worldPos.x - worker.x, worldPos.y - worker.y);
            if (dist < worker.size) {
                worker.isSelected = true;
                this.selectedWorker = worker;
                break;
            }
        }

        // Check turrets
        for (let turret of this.turrets) {
            const dist = Math.hypot(worldPos.x - turret.x, worldPos.y - turret.y);
            if (dist < turret.size) {
                this.selectedTurret = turret;
                break;
            }
        }

        // Check batteries
        for (let battery of this.batteries) {
            const dist = Math.hypot(worldPos.x - battery.x, worldPos.y - battery.y);
            if (dist < battery.size) {
                this.selectedBattery = battery;
                break;
            }
        }

        // Handle worker assignment to mineral patch (modify existing code to use helper function)
        if (this.selectedWorker && clickedPatch) {
            this.assignWorkerToPatch(this.selectedWorker, clickedPatch);
        }
    }

    handleResize() {
        // If in fullscreen, use screen dimensions
        if (document.fullscreenElement) {
            this.canvas.width = window.screen.width;
            this.canvas.height = window.screen.height;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        // Update positions relative to world size
        this.base.x = this.camera.worldWidth / 2;
        this.base.y = this.camera.worldHeight * 0.8;
        
        // Update mineral patch positions
        this.updateMineralPatchPositions();
    }

    initializeMineralPatches() {
        const patchConfigs = [
            // Starting patches - close to base, smaller amounts but easily accessible
            { x: 0.4, y: 0.65, minerals: 800 },    // Left starter patch
            { x: 0.6, y: 0.65, minerals: 800 },    // Right starter patch
            
            // Mid-game patches - medium distance, moderate amounts
            { x: 0.25, y: 0.45, minerals: 3000 },  // Left mid patch
            { x: 0.75, y: 0.45, minerals: 3000 },  // Right mid patch
            
            // Late-game patches - further away, larger amounts
            { x: 0.2, y: 0.25, minerals: 8000 },   // Left far patch
            { x: 0.8, y: 0.25, minerals: 8000 },   // Right far patch
            
            // Challenge patches - most distant, highest reward
            { x: 0.35, y: 0.15, minerals: 12000 }, // Left challenge patch
            { x: 0.65, y: 0.15, minerals: 12000 }  // Right challenge patch
        ];

        this.mineralPatches = patchConfigs.map(config => new MineralPatch(
            this.camera.worldWidth * config.x,
            this.camera.worldHeight * config.y,
            60 * SCALE / SIZE_MULTIPLIER,
            config.minerals
        ));
    }

    updateMineralPatchPositions() {
        const positions = [
            { x: 0.4, y: 0.65 }, { x: 0.6, y: 0.65 },   // Starter patches
            { x: 0.25, y: 0.45 }, { x: 0.75, y: 0.45 }, // Mid patches
            { x: 0.2, y: 0.25 }, { x: 0.8, y: 0.25 },   // Far patches
            { x: 0.35, y: 0.15 }, { x: 0.65, y: 0.15 }  // Challenge patches
        ];

        this.mineralPatches.forEach((patch, index) => {
            patch.x = this.camera.worldWidth * positions[index].x;
            patch.y = this.camera.worldHeight * positions[index].y;
        });
    }

    addMinerals(amount) {
        this.minerals += amount;
        this.totalMineralsCollected += amount;
        // Update button states whenever minerals change
        if (window.updateButtonStates) {
            window.updateButtonStates(this);
        }
    }

    update() {
        if (this.gameOver || this.isPaused) return;

        // Update enemies first
        this.enemies.forEach(enemy => enemy.update(this));
        
        // Then update other systems
        SpawnSystem.update(this);
        CollisionSystem.update(this);
        WorkerSystem.update(this);
        TurretSystem.update(this);
        BatterySystem.update(this);
        MissileSystem.update(this);
        this.milestoneSystem.update();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state
        this.ctx.save();
        
        // Draw all game elements
        this.drawBackground();
        this.drawBase();
        this.drawMineralPatches();
        this.drawWorkers();
        this.drawTurrets();
        this.drawBatteries();
        this.drawEnemies();
        this.drawProjectiles();
        this.drawExplosions();
        this.drawUI();
        
        // Restore context state
        this.ctx.restore();
        
        // Draw selection rectangle on top of everything
        drawSelectionRectangle(this.ctx);
    }

    drawBackground() {
        // Optional: Add background drawing logic here
    }

    drawBase() {
        this.base.draw(this.ctx, this.camera);
    }

    drawMineralPatches() {
        this.mineralPatches.forEach(patch => {
            if (this.camera.isOnScreen(patch.x, patch.y)) {
                const screen = this.camera.worldToScreen(patch.x, patch.y);
                patch.draw(this.ctx, screen.x, screen.y);
            }
        });
    }

    drawWorkers() {
        this.workers.forEach(worker => {
            if (this.camera.isOnScreen(worker.x, worker.y)) {
                const screen = this.camera.worldToScreen(worker.x, worker.y);
                worker.draw(this.ctx, screen.x, screen.y);
            }
        });
    }

    drawTurrets() {
        this.turrets.forEach(turret => {
            if (this.camera.isOnScreen(turret.x, turret.y)) {
                const screen = this.camera.worldToScreen(turret.x, turret.y);
                turret.draw(this.ctx, screen.x, screen.y);
            }
        });
    }

    drawBatteries() {
        this.batteries.forEach(battery => {
            if (this.camera.isOnScreen(battery.x, battery.y)) {
                const screen = this.camera.worldToScreen(battery.x, battery.y);
                battery.draw(this.ctx, screen.x, screen.y);
            }
        });
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            if (this.camera.isOnScreen(enemy.x, enemy.y)) {
                const screen = this.camera.worldToScreen(enemy.x, enemy.y);
                enemy.draw(this.ctx, screen.x, screen.y);
            }
        });
    }

    drawProjectiles() {
        this.missiles.forEach(missile => {
            if (this.camera.isOnScreen(missile.x, missile.y)) {
                const screen = this.camera.worldToScreen(missile.x, missile.y);
                missile.draw(this.ctx, screen.x, screen.y);
            }
        });
    }

    drawExplosions() {
        // Optional: Add explosion drawing logic here
    }

    drawUI() {
        // Draw UI elements (these are in screen coordinates)
        UISystem.draw(this);
        
        // Draw minimap last (always on top)
        MinimapSystem.draw(this, this.ctx);
    }

    gameLoop() {
        if (this.gameOver) {
            UISystem.drawGameOver(this);
            return;
        }

        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }

    reset() {
        this.minerals = 450;
        this.totalMineralsCollected = 0;
        this.wave = 1;
        this.waveStartTime = Date.now();
        this.gameStartTime = Date.now();
        this.lastSpawn = Date.now();
        this.spawnInterval = 5000;
        this.gameOver = false;
        this.victory = false;
        this.workers = [];
        this.turrets = [];
        this.enemies = [];
        this.missiles = [];
        this.batteries = [];
        this.base.hp = this.base.maxHp;
        
        // Center camera to put base in middle of screen
        this.camera.x = this.base.x - this.canvas.width / 2;
        this.camera.y = this.base.y - this.canvas.height / 2;

        // Clamp camera position to world bounds
        this.camera.x = Math.max(0, Math.min(
            this.camera.worldWidth - this.canvas.width,
            this.camera.x
        ));
        this.camera.y = Math.max(0, Math.min(
            this.camera.worldHeight - this.canvas.height,
            this.camera.y
        ));
        
        this.initializeMineralPatches();
        this.milestoneSystem = new MilestoneSystem(this);
        this.gameLoop();
    }

    showWarning(message, duration = 3000) {
        this.warningMessage = message;
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
        }
        this.warningTimeout = setTimeout(() => {
            this.warningMessage = '';
            this.warningTimeout = null;
        }, duration);
    }

    cleanup() {
        this.camera.cleanup();
        window.removeEventListener('resize', this.handleResize);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.showWarning(this.isPaused ? 'Game Paused' : 'Game Resumed');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (this.canvas.requestFullscreen) {
                this.canvas.requestFullscreen();
            } else if (this.canvas.webkitRequestFullscreen) { // Safari
                this.canvas.webkitRequestFullscreen();
            } else if (this.canvas.msRequestFullscreen) { // IE11
                this.canvas.msRequestFullscreen();
            }
            this.showWarning('Entered fullscreen mode - Press F to exit');
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE11
                document.msExitFullscreen();
            }
            this.showWarning('Exited fullscreen mode - Press F to enter');
        }
    }
} 
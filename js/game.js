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
import { SoundSystem } from './systems/SoundSystem.js';
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
        this.selectedBase = null;
        this.lastWorkerCountFix = Date.now(); // Track when we last fixed worker counts

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

        // Initialize sound system
        this.soundSystem = new SoundSystem();
        this.soundSystem.playMusic();

        // Initialize base
        this.base = {
            x: this.camera.worldWidth / 2,
            y: this.camera.worldHeight * 0.8,
            size: 40 * SCALE / SIZE_MULTIPLIER,
            hp: 1000,
            maxHp: 1000,
            defaultMineralPatch: null, // Default mineral patch for new workers
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

        // Initialize control groups if they don't exist
        if (!window.controlGroups) {
            window.controlGroups = {};
        }
        
        // Assign base to control group 5 at game start
        setTimeout(() => {
            if (window.controlGroups && typeof window.assignToControlGroup === 'function') {
                // Select the base first
                this.selectedBase = this.base;
                // Then assign to control group 5
                window.assignToControlGroup(this, 5);
                showWarning('Base assigned to control group 5');
            }
        }, 500); // Short delay to ensure everything is initialized
    }

    // Helper function to assign worker to mineral patch (more robust implementation)
    assignWorkerToPatch(worker, patch) {
        // Clean up previous patch assignment
        if (worker.targetPatch) {
            // Remove from current mining queue if present
            const queueIndex = worker.targetPatch.miningQueue.indexOf(worker);
            if (queueIndex !== -1) {
                worker.targetPatch.miningQueue.splice(queueIndex, 1);
            }
            
            // If worker was active miner, finish mining operation
            if (worker.targetPatch.currentMiner === worker) {
                worker.targetPatch.finishMining();
            }
            
            worker.targetPatch.workers--;
        }
        
        // Update worker and patch
        worker.targetPatch = patch;
        worker.state = 'toMineral';
        patch.workers++;
        
        // Add validation to ensure we don't exceed worker limit
        const MAX_WORKERS_PER_PATCH = 8;
        
        // If this patch has too many workers, reassign the excess
        if (patch.workers > MAX_WORKERS_PER_PATCH) {
            // Find patches with fewer workers
            const alternatePatches = this.mineralPatches
                .filter(p => p !== patch && p.minerals > 0 && p.workers < MAX_WORKERS_PER_PATCH)
                .sort((a, b) => a.workers - b.workers);
            
            if (alternatePatches.length > 0) {
                // Set the default patch to the least crowded one
                if (!this.base.defaultMineralPatch) {
                    this.base.defaultMineralPatch = alternatePatches[0];
                }
                
                // Get excess workers
                const workersToReassign = this.workers
                    .filter(w => w.targetPatch === patch)
                    .slice(0, patch.workers - MAX_WORKERS_PER_PATCH);
                
                // Distribute excess workers to other patches
                workersToReassign.forEach((w, i) => {
                    const targetPatch = alternatePatches[i % alternatePatches.length];
                    this.assignWorkerToPatch(w, targetPatch);
                });
                
                this.showWarning(`Redistributed workers from crowded mineral patch`);
            }
        }
        
        // Ensure the base has a default mineral patch set
        if (!this.base.defaultMineralPatch && this.mineralPatches.length > 0) {
            this.base.defaultMineralPatch = patch;
        }
    }
    
    // New method to verify worker counts for a specific patch
    verifyMineralPatchWorkers(patch) {
        if (!patch) return;
        
        // Count workers assigned to this patch
        let actualWorkerCount = 0;
        this.workers.forEach(worker => {
            if (worker.targetPatch === patch) {
                actualWorkerCount++;
            }
        });
        
        // Fix count if it doesn't match
        if (patch.workers !== actualWorkerCount) {
            patch.workers = actualWorkerCount;
        }
    }

    // Enhanced fix method with more detailed validation
    fixMineralPatchWorkerCounts() {
        // Reset all patch worker counts to zero
        this.mineralPatches.forEach(patch => {
            patch.workers = 0;
        });
        
        // Count actual workers assigned to each patch
        this.workers.forEach(worker => {
            if (worker.targetPatch) {
                worker.targetPatch.workers++;
            }
        });
        
        // Clean up mining queues and current miners
        this.mineralPatches.forEach(patch => {
            // Remove any workers from mining queue that no longer exist
            if (patch.miningQueue) {
                patch.miningQueue = patch.miningQueue.filter(worker => 
                    this.workers.includes(worker)
                );
            } else {
                patch.miningQueue = [];
            }
            
            // Reset currentMiner if the worker no longer exists
            if (patch.currentMiner && !this.workers.includes(patch.currentMiner)) {
                patch.currentMiner = null;
                // Also reset mining time to prevent patch from being stuck
                patch.lastMineTime = Date.now();
            }
            
            // Ensure mining queues don't contain duplicate workers
            const uniqueWorkers = new Set();
            if (patch.miningQueue) {
                patch.miningQueue = patch.miningQueue.filter(worker => {
                    if (uniqueWorkers.has(worker)) {
                        return false;
                    }
                    uniqueWorkers.add(worker);
                    return true;
                });
            }
        });
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

        console.log('Click detected at screen coordinates:', screenX, screenY);

        // Check if click was on minimap
        if (MinimapSystem.handleClick(this, screenX, screenY)) {
            this.soundSystem.play('click');
            console.log('Click handled by minimap');
            return;
        }

        // Convert screen coordinates to world coordinates for other interactions
        const worldPos = this.camera.screenToWorld(screenX, screenY);
        console.log('Converted to world coordinates:', worldPos.x, worldPos.y);

        // Handle building placement
        if (this.buildingType) {
            console.log('Building placement mode active:', this.buildingType);
            
            // Check if the placement position is within world bounds
            const margin = 50; // Margin from world edges
            if (worldPos.x < margin || worldPos.x > this.camera.worldWidth - margin ||
                worldPos.y < margin || worldPos.y > this.camera.worldHeight - margin) {
                this.soundSystem.play('error');
                showWarning('Cannot build outside the game world!');
                return;
            }

            const cost = COSTS[this.buildingType.toUpperCase()];
            console.log('Building cost:', cost, 'Available minerals:', this.minerals);
            
            if (this.minerals >= cost) {
                // Create the new building at world coordinates
                let newBuilding = null;
                console.log('Creating new building of type:', this.buildingType);
                
                switch (this.buildingType) {
                    case 'worker':
                        newBuilding = new Worker(this, worldPos.x, worldPos.y);
                        this.workers.push(newBuilding);
                        this.soundSystem.play('build-worker');
                        console.log('Worker created at:', worldPos.x, worldPos.y);
                        break;
                    case 'turret':
                        newBuilding = new Turret(this, worldPos.x, worldPos.y);
                        this.turrets.push(newBuilding);
                        this.soundSystem.play('build-turret');
                        console.log('Turret created at:', worldPos.x, worldPos.y);
                        break;
                    case 'battery':
                        newBuilding = new Battery(this, worldPos.x, worldPos.y);
                        this.batteries.push(newBuilding);
                        this.soundSystem.play('build-battery');
                        console.log('Battery created at:', worldPos.x, worldPos.y);
                        break;
                }
                this.minerals -= cost;
                
                // Center camera on the new building
                this.camera.x = Math.max(0, Math.min(
                    this.camera.worldWidth - this.canvas.width / this.camera.zoom,
                    worldPos.x - (this.canvas.width / this.camera.zoom) / 2
                ));
                this.camera.y = Math.max(0, Math.min(
                    this.camera.worldHeight - this.canvas.height / this.camera.zoom,
                    worldPos.y - (this.canvas.height / this.camera.zoom) / 2
                ));

                this.buildingType = null;
                showWarning('Building placed!');
                
                // Update button states
                if (window.updateButtonStates) {
                    window.updateButtonStates(this);
                }
            } else {
                this.soundSystem.play('error');
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
                this.soundSystem.play('click');
                break;
            }
        }

        // Check workers
        for (let worker of this.workers) {
            const dist = Math.hypot(worldPos.x - worker.x, worldPos.y - worker.y);
            if (dist < worker.size) {
                worker.isSelected = true;
                this.selectedWorker = worker;
                this.soundSystem.play('click');
                break;
            }
        }

        // Check turrets
        for (let turret of this.turrets) {
            const dist = Math.hypot(worldPos.x - turret.x, worldPos.y - turret.y);
            if (dist < turret.size * 1.5) {
                this.selectedTurret = turret;
                this.soundSystem.play('click');
                break;
            }
        }

        // Check batteries
        for (let battery of this.batteries) {
            const dist = Math.hypot(worldPos.x - battery.x, worldPos.y - battery.y);
            if (dist < battery.size * 1.5) {
                this.selectedBattery = battery;
                this.soundSystem.play('click');
                break;
            }
        }
        
        // Check base selection (new)
        const distToBase = Math.hypot(worldPos.x - this.base.x, worldPos.y - this.base.y);
        if (distToBase < this.base.size * 1.5) {
            this.selectedBase = this.base;
            this.soundSystem.play('click');
        } else {
            this.selectedBase = null;
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
        // Generate mineral patches around the map
        const mapWidth = this.camera.worldWidth;
        const mapHeight = this.camera.worldHeight;
        
        // Create mineral patches in strategic locations
        const mineralPatchLocations = [
            // Top section (mid-distance from base)
            { x: mapWidth * 0.3, y: mapHeight * 0.3, minerals: 15000 },
            { x: mapWidth * 0.7, y: mapHeight * 0.3, minerals: 15000 },
            
            // Middle section (closer to base)
            { x: mapWidth * 0.4, y: mapHeight * 0.5, minerals: 15000 },
            { x: mapWidth * 0.6, y: mapHeight * 0.5, minerals: 15000 },
            
            // Bottom section (closest to base)
            { x: mapWidth * 0.35, y: mapHeight * 0.7, minerals: 15000 },
            { x: mapWidth * 0.65, y: mapHeight * 0.7, minerals: 15000 },
        ];
        
        mineralPatchLocations.forEach(loc => {
            this.mineralPatches.push(new MineralPatch(loc.x, loc.y, 30, loc.minerals));
        });
        
        // Set the default mineral patch to the closest patch to the base
        let closestPatch = null;
        let closestDist = Infinity;
        
        this.mineralPatches.forEach(patch => {
            const dist = Math.hypot(this.base.x - patch.x, this.base.y - patch.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestPatch = patch;
            }
        });
        
        if (closestPatch) {
            this.base.defaultMineralPatch = closestPatch;
        }
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

        // Update camera for smooth movement
        this.camera.update();

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
        
        // Check if we need to fix mineral patch worker counts (every 2 seconds instead of 5)
        const now = Date.now();
        if (now - this.lastWorkerCountFix > 2000) {
            this.fixMineralPatchWorkerCounts();
            this.lastWorkerCountFix = now;
        }
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
        // Draw a line connecting the base to the default mineral patch if one exists
        // Only show the connection line when the base is selected
        if (this.base.defaultMineralPatch && this.selectedBase) {
            const baseScreen = this.camera.worldToScreen(this.base.x, this.base.y);
            const patchScreen = this.camera.worldToScreen(
                this.base.defaultMineralPatch.x, 
                this.base.defaultMineralPatch.y
            );
            
            // Draw a dashed line connecting base to default mineral patch
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(74, 158, 255, 0.4)'; // Light blue, semi-transparent
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]); // Dashed line pattern
            
            this.ctx.beginPath();
            this.ctx.moveTo(baseScreen.x, baseScreen.y);
            this.ctx.lineTo(patchScreen.x, patchScreen.y);
            this.ctx.stroke();
            
            // Draw a small indicator at the mineral patch end
            this.ctx.fillStyle = 'rgba(74, 158, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(patchScreen.x, patchScreen.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        // Draw the base itself
        this.base.draw(this.ctx, this.camera);
        
        // Draw control group indicator if the base is in a control group
        if (window.UISystem) {
            const baseScreen = this.camera.worldToScreen(this.base.x, this.base.y);
            UISystem.drawControlGroupMarker(this.ctx, this.base, baseScreen.x, baseScreen.y, this.base.size);
        }
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
                
                // Draw control group indicator if this worker is in a control group
                if (window.UISystem) {
                    UISystem.drawControlGroupMarker(this.ctx, worker, screen.x, screen.y, worker.size);
                }
            }
        });
    }

    drawTurrets() {
        this.turrets.forEach(turret => {
            if (this.camera.isOnScreen(turret.x, turret.y)) {
                const screen = this.camera.worldToScreen(turret.x, turret.y);
                turret.draw(this.ctx, screen.x, screen.y);
                
                // Draw control group indicator if this turret is in a control group
                if (window.UISystem) {
                    UISystem.drawControlGroupMarker(this.ctx, turret, screen.x, screen.y, turret.size);
                }
            }
        });
    }

    drawBatteries() {
        this.batteries.forEach(battery => {
            if (this.camera.isOnScreen(battery.x, battery.y)) {
                const screen = this.camera.worldToScreen(battery.x, battery.y);
                battery.draw(this.ctx, screen.x, screen.y);
                
                // Draw control group indicator if this battery is in a control group
                if (window.UISystem) {
                    UISystem.drawControlGroupMarker(this.ctx, battery, screen.x, screen.y, battery.size);
                }
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

    // Add sound toggle method
    toggleSound() {
        return this.soundSystem.toggleMute();
    }
} 
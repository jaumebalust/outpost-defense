import { SIZE_MULTIPLIER, SCALE, getScale, updateScale, showWarning, COSTS, COMBAT, UNIT_STATS } from './utils/constants.js';
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
import { selectionState } from './systems/InputSystem.js';
import { MissileLauncher } from './entities/MissileLauncher.js';

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
        this.missileLaunchers = [];
        this.effects = []; // Array for visual effects like explosions

        // Initialize systems
        this.milestoneSystem = new MilestoneSystem(this);

        // Initialize a dummy sound system that doesn't play sounds
        this.soundSystem = {
            play: function() { /* Do nothing */ },
            playMusic: function() { /* Do nothing */ },
            toggleMute: function() { return false; /* Always return false */ }
        };

        // Initialize base
        this.base = {
            x: this.camera.worldWidth / 2,
            y: this.camera.worldHeight * 0.8,
            size: 40 * SCALE / SIZE_MULTIPLIER,
            hp: 1000,
            maxHp: 1000,
            isSelected: false,
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
        this.camera.x = this.base.x - this.canvas.width/2;
        this.camera.y = this.base.y - this.canvas.height/2 - 150; // Move camera 50 pixels higher

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
        this.handleRightClick = this.handleRightClick.bind(this);

        // Add event listeners
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('load', () => {
            // Update scale and positions after full page load
            updateScale();
            this.handleResize();
        });
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
             
            }
        }, 500); // Short delay to ensure everything is initialized
        
        // Create 3 initial workers and assign them to the first mineral patch
        setTimeout(() => {
            if (this.mineralPatches.length > 0) {
                // Find the closest mineral patch to the base
                let closestPatch = null;
                let closestDist = Infinity;
                
                this.mineralPatches.forEach(patch => {
                    const dist = Math.hypot(this.base.x - patch.x, this.base.y - patch.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPatch = patch;
                    }
                });
                
                // Use the closest patch or the first one if no closest found
                const targetPatch = closestPatch || this.mineralPatches[0];
                
                // Set this as the base's default mineral patch
                this.base.defaultMineralPatch = targetPatch;
                
                console.log('Creating 3 workers for mineral patch at:', targetPatch.x, targetPatch.y);
                
                // Create 3 workers
                for (let i = 0; i < 3; i++) {
                    // Create worker near the base
                    const offsetX = (Math.random() - 0.5) * 40;
                    const offsetY = (Math.random() - 0.5) * 40;
                    const worker = new Worker(this, this.base.x + offsetX, this.base.y + offsetY);
                    
                    // Properly set up the worker
                    worker.targetPatch = targetPatch;
                    worker.state = 'toMineral';
                    
                    // Add worker to the game
                    this.workers.push(worker);
                    
                    // Update the mineral patch
                    targetPatch.workers++;
                    
                    // Add to mining queue if not already there
                    if (!targetPatch.miningQueue.includes(worker)) {
                        targetPatch.miningQueue.push(worker);
                    }
                }
                
                // Deduct the cost of the workers
                this.minerals -= COSTS.WORKER * 3;
                
                // Update button states
                if (window.updateButtonStates) {
                    window.updateButtonStates(this);
                }
                
                showWarning('3 workers created and assigned to minerals');
                
                // Check milestones after workers are created to ensure "Build 3 workers" milestone is completed
                if (this.milestoneSystem) {
                    this.milestoneSystem.update();
                }
            }
        }, 600); // Slightly longer delay than the control group assignment
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

    handleResize() {
        // If in fullscreen, use screen dimensions
        if (document.fullscreenElement) {
            this.canvas.width = window.screen.width;
            this.canvas.height = window.screen.height;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        // Update the SCALE value to match new window dimensions
        updateScale();
        
        // Update positions relative to world size
        this.base.x = this.camera.worldWidth / 2;
        this.base.y = this.camera.worldHeight * 0.8;
        
        // Update mineral patch positions
        this.updateMineralPatchPositions();
        
        // Force recalculation of camera bounds
        this.camera.x = Math.max(0, Math.min(
            this.camera.worldWidth - this.canvas.width,
            this.camera.x
        ));
        this.camera.y = Math.max(0, Math.min(
            this.camera.worldHeight - this.canvas.height,
            this.camera.y
        ));
        
        // Signal UI systems to update their layouts
        if (window.UISystem) {
            // Force UI recalculation on next draw
            window.UISystem.needsUpdate = true;
        }
        
        // Re-center camera on base if we're at game start
        if (Date.now() - this.gameStartTime < 2000) {
            this.camera.x = this.base.x - this.canvas.width/2;
            this.camera.y = this.base.y - this.canvas.height/2 - 150; // Move camera 50 pixels higher
            
            // Re-clamp camera position
            this.camera.x = Math.max(0, Math.min(
                this.camera.worldWidth - this.canvas.width,
                this.camera.x
            ));
            this.camera.y = Math.max(0, Math.min(
                this.camera.worldHeight - this.canvas.height,
                this.camera.y
            ));
        }
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

        // Update all patches positions based on current world size
        this.mineralPatches.forEach((patch, index) => {
            if (index < positions.length) {
                patch.x = this.camera.worldWidth * positions[index].x;
                patch.y = this.camera.worldHeight * positions[index].y;
            }
        });

        // Update worker paths to mineral patches if they have been assigned
        this.workers.forEach(worker => {
            if (worker.targetPatch && worker.state === 'toMineral') {
                // Recalculate the path to the target patch
                worker.findPathToMineralPatch();
            }
        });
        
        // Ensure base's default mineral patch is updated
        if (this.base && this.base.defaultMineralPatch) {
            // Find the closest patch again in case positions shifted significantly
            let closestPatch = null;
            let closestDist = Infinity;
            
            this.mineralPatches.forEach(patch => {
                const dist = Math.hypot(this.base.x - patch.x, this.base.y - patch.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPatch = patch;
                }
            });
            
            // Only update if there's a significant change
            if (closestPatch && closestPatch !== this.base.defaultMineralPatch) {
                this.base.defaultMineralPatch = closestPatch;
            }
        }
    }

    addMinerals(amount) {
        this.minerals += amount;
        this.totalMineralsCollected += amount;
        // Update button states whenever minerals change
        if (window.updateButtonStates) {
            window.updateButtonStates(this);
        }
        
        // Check milestones after adding minerals - fix for milestone tracking
        if (this.milestoneSystem) {
            this.milestoneSystem.update();
        }
    }

    update(deltaTime) {
        if (this.gameOver || this.isPaused) return;

        // Update game time
        this.time = Date.now();

        // Update camera position
        this.camera.update();

        // Clamp camera to world bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.camera.worldWidth - this.canvas.width / this.camera.zoom));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.camera.worldHeight - this.canvas.height / this.camera.zoom));

        // Update entities
        // Update workers
        for (const worker of this.workers) {
            worker.update(this, deltaTime);
        }
        
        // Update turrets using TurretSystem
        TurretSystem.update(this);
        
        // Update batteries using BatterySystem
        BatterySystem.update(this);
        
        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(this, deltaTime);
        }
        
        // Update missile launchers with error handling
        for (const missileLauncher of this.missileLaunchers) {
            try {
                missileLauncher.update(this, deltaTime);
            } catch (e) {
                console.error("Error updating missile launcher:", e);
            }
        }

        // Update missiles with MissileSystem
        MissileSystem.update(this);
        
        // Update collisions with CollisionSystem
        CollisionSystem.update(this);

        // Check for game over
        if (this.base.hp <= 0) {
            this.gameOver = true;
            this.showWarning('Game Over! Base destroyed!');
            return;
        }

        // Spawn enemies
        if (Date.now() - this.lastSpawn > this.spawnInterval) {
            SpawnSystem.update(this);
            this.lastSpawn = Date.now();
        }

        // Fix worker count if needed (every 5 seconds)
        const now = Date.now();
        if (now - this.lastWorkerCountFix > 5000) {
            this.fixMineralPatchWorkerCounts();
            this.lastWorkerCountFix = now;
        }
    }

    draw(ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Draw the world background
        this.drawBackground(ctx);

        // Draw the grid
        this.drawGrid(ctx);

        // Draw the entities
        this.drawMineralPatches(ctx);
        this.drawBase(ctx);
        this.drawWorkers(ctx);
        this.drawTurrets(ctx);
        this.drawBatteries(ctx);
        this.drawMissileLaunchers(ctx);
        this.drawEnemies(ctx);
        this.drawEffects(ctx);

        // Draw the selection rectangle if we're selecting
        if (selectionState.isSelecting) {
            drawSelectionRectangle(this.ctx);
        }

        // Draw the UI
        UISystem.draw(this);
        
        // Draw minimap
        MinimapSystem.draw(this, ctx);
    }

    drawBackground(ctx) {
        // Optional: Add background drawing logic here
    }

    drawBase(ctx) {
        // Draw a line connecting the base to the default mineral patch if one exists
        // Only show the connection line when the base is selected
        if (this.base.defaultMineralPatch && this.selectedBase) {
            const baseScreen = this.camera.worldToScreen(this.base.x, this.base.y);
            const patchScreen = this.camera.worldToScreen(
                this.base.defaultMineralPatch.x, 
                this.base.defaultMineralPatch.y
            );
            
            // Draw a dashed line connecting base to default mineral patch
            ctx.save();
            ctx.strokeStyle = 'rgba(74, 158, 255, 0.4)'; // Light blue, semi-transparent
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed line pattern
            
            ctx.beginPath();
            ctx.moveTo(baseScreen.x, baseScreen.y);
            ctx.lineTo(patchScreen.x, patchScreen.y);
            ctx.stroke();
            
            // Draw a small indicator at the mineral patch end
            ctx.fillStyle = 'rgba(74, 158, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(patchScreen.x, patchScreen.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Draw the base itself
        this.base.draw(ctx, this.camera);
        
        // Draw control group indicator if the base is in a control group
        if (window.UISystem) {
            const baseScreen = this.camera.worldToScreen(this.base.x, this.base.y);
            UISystem.drawControlGroupMarker(ctx, this.base, baseScreen.x, baseScreen.y, this.base.size);
        }
    }

    drawMineralPatches(ctx) {
        this.mineralPatches.forEach(patch => {
            if (this.camera.isOnScreen(patch.x, patch.y)) {
                const screen = this.camera.worldToScreen(patch.x, patch.y);
                patch.draw(ctx, screen.x, screen.y);
            }
        });
    }

    drawWorkers(ctx) {
        this.workers.forEach(worker => {
            if (this.camera.isOnScreen(worker.x, worker.y)) {
                const screen = this.camera.worldToScreen(worker.x, worker.y);
                worker.draw(ctx, screen.x, screen.y);
                
                // Draw control group indicator if this worker is in a control group
                if (window.UISystem) {
                    UISystem.drawControlGroupMarker(ctx, worker, screen.x, screen.y, worker.size);
                }
            }
        });
    }

    drawTurrets(ctx) {
        this.turrets.forEach(turret => {
            if (this.camera.isOnScreen(turret.x, turret.y)) {
                const screen = this.camera.worldToScreen(turret.x, turret.y);
                turret.draw(ctx, screen.x, screen.y);
                
                // Draw control group indicator if this turret is in a control group
                if (window.UISystem) {
                    UISystem.drawControlGroupMarker(ctx, turret, screen.x, screen.y, turret.size);
                }
            }
        });
    }

    drawBatteries(ctx) {
        this.batteries.forEach(battery => {
            if (this.camera.isOnScreen(battery.x, battery.y)) {
                const screen = this.camera.worldToScreen(battery.x, battery.y);
                battery.draw(ctx, screen.x, screen.y);
                
                // Draw control group indicator if this battery is in a control group
                if (window.UISystem) {
                    UISystem.drawControlGroupMarker(ctx, battery, screen.x, screen.y, battery.size);
                }
            }
        });
    }

    drawEnemies(ctx) {
        this.enemies.forEach(enemy => {
            if (this.camera.isOnScreen(enemy.x, enemy.y)) {
                const screen = this.camera.worldToScreen(enemy.x, enemy.y);
                enemy.draw(ctx, screen.x, screen.y);
            }
        });
    }

    drawProjectiles(ctx) {
        this.missiles.forEach(missile => {
            if (this.camera.isOnScreen(missile.x, missile.y)) {
                const screen = this.camera.worldToScreen(missile.x, missile.y);
                missile.draw(ctx, screen.x, screen.y);
            }
        });
    }

    drawExplosions(ctx) {
        // Draw explosion effects
        if (!this.effects) return;
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            
            if (effect.type === 'explosion') {
                const screenPos = this.camera.worldToScreen(effect.x, effect.y);
                
                // Only draw if on screen
                if (this.camera.isOnScreen(effect.x, effect.y)) {
                    // Draw explosion
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, effect.size * this.camera.zoom, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 100, 0, ${effect.alpha})`;
                    ctx.fill();
                    
                    // Outer glow
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, effect.size * 1.5 * this.camera.zoom, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 200, 0, ${effect.alpha * 0.5})`;
                    ctx.fill();
                }
                
                // Update effect
                effect.size += 1;
                effect.alpha -= 0.05;
                
                // Remove effect if it's faded out
                if (effect.alpha <= 0) {
                    this.effects.splice(i, 1);
                }
            }
        }
    }

    drawUI(ctx) {
        // Draw UI elements (these are in screen coordinates)
        UISystem.draw(this);
        
        // Draw minimap last (always on top)
        MinimapSystem.draw(this, ctx);
    }

    gameLoop(timestamp) {
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }
        
        // Calculate delta time in seconds
        const deltaTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        
        if (this.gameOver) {
            // Draw the game over screen
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            UISystem.drawEndScreen(this.ctx, this);
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
            return;
        }

        // Update game state
        this.update(deltaTime);
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the game
        this.drawBackground(this.ctx);
        this.drawMineralPatches(this.ctx);
        this.drawBase(this.ctx);
        this.drawWorkers(this.ctx);
        this.drawTurrets(this.ctx);
        this.drawBatteries(this.ctx);
        this.drawMissileLaunchers(this.ctx);
        this.drawEnemies(this.ctx);
        this.drawProjectiles(this.ctx);
        this.drawExplosions(this.ctx);
        
        // Draw selection rectangle if selecting
        if (selectionState.isSelecting) {
            drawSelectionRectangle(this.ctx);
        }
        
        // Draw UI
        UISystem.draw(this);
        
        // Draw minimap
        MinimapSystem.draw(this, this.ctx);
        
        // Continue the game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    start() {
        // Initialize the game time
        this.time = Date.now();
        this.lastTimestamp = 0;
        
        // Start the game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
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
        
        // Create initial workers with the same timeout as in constructor
        setTimeout(() => {
            if (this.mineralPatches.length > 0) {
                // Find the closest mineral patch to the base
                let closestPatch = null;
                let closestDist = Infinity;
                
                this.mineralPatches.forEach(patch => {
                    const dist = Math.hypot(this.base.x - patch.x, this.base.y - patch.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPatch = patch;
                    }
                });
                
                // Use the closest patch or the first one
                const targetPatch = closestPatch || this.mineralPatches[0];
                this.base.defaultMineralPatch = targetPatch;
                
                // Create 3 workers
                for (let i = 0; i < 3; i++) {
                    const offsetX = (Math.random() - 0.5) * 40;
                    const offsetY = (Math.random() - 0.5) * 40;
                    const worker = new Worker(this, this.base.x + offsetX, this.base.y + offsetY);
                    worker.targetPatch = targetPatch;
                    worker.state = 'toMineral';
                    this.workers.push(worker);
                    targetPatch.workers++;
                    
                    if (!targetPatch.miningQueue.includes(worker)) {
                        targetPatch.miningQueue.push(worker);
                    }
                }
                
                // Check milestones after workers are created
                if (this.milestoneSystem) {
                    this.milestoneSystem.update();
                }
            }
        }, 600);
        
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

    drawMissileLaunchers(ctx) {
        for (const missileLauncher of this.missileLaunchers) {
            // Only draw if on screen
            if (this.camera.isOnScreen(missileLauncher.x, missileLauncher.y)) {
                const screen = this.camera.worldToScreen(missileLauncher.x, missileLauncher.y);
                missileLauncher.draw(ctx, screen.x, screen.y, this.camera.zoom);
                
                // Check if this missile launcher is in a control group
                if (window.controlGroups) {
                    for (let i = 1; i <= 9; i++) {
                        if (window.controlGroups[i] && window.controlGroups[i].some(entity => entity.id === missileLauncher.id)) {
                            if (window.UISystem) {
                                window.UISystem.drawControlGroupMarker(ctx, missileLauncher, 
                                    screen.x, 
                                    screen.y, 
                                    missileLauncher.size * this.camera.zoom);
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    clearSelection() {
        if (this.selectedEntity) {
            this.selectedEntity.selected = false;
            this.selectedEntity = null;
        }

        for (const worker of this.workers) {
            worker.selected = false;
        }

        for (const turret of this.turrets) {
            turret.selected = false;
        }

        for (const battery of this.batteries) {
            battery.selected = false;
        }
        
        for (const missileLauncher of this.missileLaunchers) {
            missileLauncher.selected = false;
        }
        
        // Clear enemy selections
        for (const enemy of this.enemies) {
            enemy.isSelected = false;
        }
        
        // Clear base selection
        if (this.base) {
            this.base.isSelected = false;
        }
        
        this.selectedWorker = null;
        this.selectedTurret = null;
        this.selectedBattery = null;
        this.selectedMissileLauncher = null;
        this.selectedBase = null;
        this.selectedEnemy = null;
        
        // Update UI to reflect that nothing is selected
        if (window.UISystem) {
            window.UISystem.updateInfoPanel(this);
        }
    }

    buildMissileLauncher() {
        console.log('buildMissileLauncher called');
        
        // Check if we have enough minerals
        if (this.minerals < COSTS.MISSILE_LAUNCHER) {
            this.showWarning(`Not enough minerals! Need ${COSTS.MISSILE_LAUNCHER}`);
            return;
        }
        
        // Check if a worker is selected
        if (!this.selectedWorker && !this.selectedBase) {
            this.showWarning('Select a worker or base to build a missile launcher');
            return;
        }
        
        // Enter building placement mode
        this.buildingType = 'MISSILE_LAUNCHER';
        this.showWarning('Select location for missile launcher');
        
        // Update button states
        if (window.updateButtonStates) {
            window.updateButtonStates(this);
        }
    }
} 
import { COSTS } from '../utils/constants.js';
import { showWarning } from '../utils/constants.js';
import { Worker } from '../entities/Worker.js';
import { Turret } from '../entities/Turret.js';
import { Battery } from '../entities/Battery.js';

// Selection state
export const selectionState = {
    isSelecting: false,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 }
};

// Add control groups for quick selection
export const controlGroups = {
    // Each group will store references to game entities
    1: [], 2: [], 3: [], 4: [], 5: [], 
    6: [], 7: [], 8: [], 9: [], 0: []
};

// Make updateButtonStates available globally
export function updateButtonStates(game) {
    try {
        const buildWorkerButton = document.getElementById('buildWorkerButton') || document.querySelector('.worker-btn');
        const buildTurretButton = document.getElementById('buildTurretButton') || document.querySelector('.turret-btn');
        const buildBatteryButton = document.getElementById('buildBatteryButton') || document.querySelector('.battery-btn');
        
        // Only proceed if buttons exist in the DOM
        if (!buildWorkerButton || !buildTurretButton || !buildBatteryButton) {
            console.warn('Could not find all building buttons in the DOM');
            return; // Exit early if any button is not found
        }
        
        // Check if buttons are visible before updating their state
        const isWorkerButtonVisible = buildWorkerButton.style.visibility !== 'hidden';
        const isTurretButtonVisible = buildTurretButton.style.visibility !== 'hidden';
        const isBatteryButtonVisible = buildBatteryButton.style.visibility !== 'hidden';
        
        // Only update buttons if they are visible
        if (isWorkerButtonVisible && buildWorkerButton) {
            if (game.minerals >= COSTS.WORKER) {
                buildWorkerButton.disabled = false;
                buildWorkerButton.classList.remove('disabled');
            } else {
                buildWorkerButton.disabled = true;
                buildWorkerButton.classList.add('disabled');
            }
        }
        
        if (isTurretButtonVisible && buildTurretButton) {
            if (game.minerals >= COSTS.TURRET) {
                buildTurretButton.disabled = false;
                buildTurretButton.classList.remove('disabled');
            } else {
                buildTurretButton.disabled = true;
                buildTurretButton.classList.add('disabled');
            }
        }
        
        if (isBatteryButtonVisible && buildBatteryButton) {
            if (game.minerals >= COSTS.BATTERY) {
                buildBatteryButton.disabled = false;
                buildBatteryButton.classList.remove('disabled');
            } else {
                buildBatteryButton.disabled = true;
                buildBatteryButton.classList.add('disabled');
            }
        }
    } catch (error) {
        console.error('Error updating button states:', error);
    }
}

// Make it available globally
window.updateButtonStates = updateButtonStates;
window.controlGroups = controlGroups;

export function initializeEventListeners(game) {
    const canvas = game.canvas;
    const floatingUpgradeBtn = document.getElementById('floating-upgrade-btn');

    // Mouse down - Start selection rectangle
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on UI elements by checking coordinates
        const minimapSize = 200; // From MinimapSystem
        const minimapPadding = 10;
        const infoPanel = document.getElementById('info-panel');
        const actionButtons = document.getElementById('action-buttons');
        
        const isInInfoPanel = infoPanel && e.target === canvas && 
            x >= (canvas.width / 2) - 200 && 
            x <= (canvas.width / 2) + 200 && 
            y >= canvas.height - 150;
        
        const isInActionButtons = actionButtons && e.target === canvas && 
            x >= canvas.width - 300 && 
            x <= canvas.width && 
            y >= canvas.height - 300;
            
        const isInMinimap = e.target === canvas && 
            x >= minimapPadding && 
            x <= minimapPadding + minimapSize && 
            y >= canvas.height - minimapSize - minimapPadding && 
            y <= canvas.height - minimapPadding;
            
        if (isInInfoPanel || isInActionButtons || isInMinimap) {
            return; // Don't start selection if clicking on UI
        }

        // For left click, start selection if not in building mode
        if (e.button === 0 && !game.buildingType) {
            selectionState.isSelecting = true;
            selectionState.start = { x, y };
            selectionState.end = { x, y };
        }
    });

    // Mouse move - Track selection rectangle
    canvas.addEventListener('mousemove', function(e) {
        if (selectionState.isSelecting) {
            const rect = canvas.getBoundingClientRect();
            selectionState.end = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    });

    // Mouse up - Finish selection
    canvas.addEventListener('mouseup', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Handle building placement on left click
        if (e.button === 0 && game.buildingType) {
            handleClick(game, x, y);
            return;
        }

        if (selectionState.isSelecting) {
            selectionState.end = { x, y };
            selectionState.isSelecting = false;
            
            // Check if this was a click vs. a drag
            const dragDistance = Math.sqrt(
                Math.pow(selectionState.end.x - selectionState.start.x, 2) +
                Math.pow(selectionState.end.y - selectionState.start.y, 2)
            );
            
            if (dragDistance < 10) {
                // Treat as click if dragged less than 10 pixels
                handleClick(game, x, y);
            } else {
                // Handle rectangle selection
                handleRectangleSelection(game);
            }
        } else if (e.button !== 2) {  // Not right click
            // Normal click
            handleClick(game, x, y);
        }
    });

    // Add right click handler
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();  // Prevent default context menu
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleRightClick(game, x, y);
    });

    // Add keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'q':
                toggleBuilding(game, 'worker');
                break;
            case 't':
            case 'a': // Add 'a' as an alternative key for building turrets
                toggleBuilding(game, 'turret');
                break;
            case 'b': // 'b' for battery instead of 's'
                toggleBuilding(game, 'battery');
                break;
            case 'escape':
                // Cancel rectangle selection if active
                if (selectionState.isSelecting) {
                    selectionState.isSelecting = false;
                    return;
                }
                
                // Cancel building mode and clear selection
                if (game.buildingType) {
                    game.buildingType = null;
                    showWarning('Building cancelled');
                    try {
                        updateButtonStates(game);
                    } catch (err) {
                        console.warn('Could not update button states', err);
                    }
                }
                
                // Clear any existing selection
                game.selectedTurret = null;
                game.selectedBattery = null;
                game.selectedWorker = null;
                game.selectedBase = null;
                game.selectedMineralPatch = null;
                game.selectedEnemy = null;
                game.workers.forEach(worker => worker.isSelected = false);
                
                // Hide upgrade button
                if (floatingUpgradeBtn) {
                    floatingUpgradeBtn.classList.add('hidden');
                }
                
                showWarning('Selection cleared');
                break;
        }
    });

    // Add keyboard event listener for control groups
    window.addEventListener('keydown', function(e) {
        // Skip if typing in an input field
        if (e.target.tagName.toLowerCase() === 'input') {
            return;
        }
        
        const key = e.key;
        const ctrlKey = e.ctrlKey || e.metaKey; // Support both Ctrl and Command (Mac)
        
        // Handle control group assignment (Ctrl + number)
        if (ctrlKey && /^[0-9]$/.test(key)) {
            const groupNumber = parseInt(key);
            assignToControlGroup(game, groupNumber);
            e.preventDefault(); // Prevent browser shortcuts
            return;
        }
        
        // Handle control group selection (just number key)
        if (!ctrlKey && /^[0-9]$/.test(key)) {
            const groupNumber = parseInt(key);
            selectControlGroup(game, groupNumber);
            e.preventDefault();
            return;
        }
    });

    // Define building functions
    game.buildWorker = () => {
        console.log('buildWorker called');
        toggleBuilding(game, 'worker');
    };
    
    game.buildTurret = () => {
        console.log('buildTurret called');
        toggleBuilding(game, 'turret');
    };
    
    game.buildBattery = () => {
        console.log('buildBattery called');
        toggleBuilding(game, 'battery');
    };
    
    game.upgradeTurret = () => upgradeTurret(game);

    // Make sure these methods are also available on the window.game object
    if (window.game) {
        window.game.buildWorker = game.buildWorker;
        window.game.buildTurret = game.buildTurret;
        window.game.buildBattery = game.buildBattery;
        window.game.upgradeTurret = game.upgradeTurret;
    }

    // Initialize button states
    try {
        updateButtonStates(game);
    } catch (err) {
        console.warn('Could not update button states', err);
    }
}

function toggleBuilding(game, type) {
    console.log('toggleBuilding called with type:', type, 'Selected base:', game.selectedBase);
    
    // Get the cost based on building type
    let cost;
    switch (type) {
        case 'worker':
            cost = COSTS.WORKER;
            // For workers, we'll auto-select the base if it's not already selected
            if (!game.selectedBase) {
                console.log('Auto-selecting base for worker creation');
                game.selectedBase = game.base;
            }
            console.log('Base is selected, proceeding with worker creation');
            break;
        case 'turret':
            cost = COSTS.TURRET;
            // For turrets, we'll check if any worker is selected
            if (!game.workers.some(w => w.isSelected) && !game.selectedWorker) {
                // Auto-select a worker if available
                if (game.workers.length > 0) {
                    game.selectedWorker = game.workers[0];
                    game.selectedWorker.isSelected = true;
                    console.log('Auto-selected a worker for turret building');
                } else {
                    showWarning('No workers available to build turrets');
                    return;
                }
            }
            console.log('Worker is selected, proceeding with turret building mode');
            break;
        case 'battery':
            cost = COSTS.BATTERY;
            // For batteries, we'll check if any worker is selected
            if (!game.workers.some(w => w.isSelected) && !game.selectedWorker) {
                // Auto-select a worker if available
                if (game.workers.length > 0) {
                    game.selectedWorker = game.workers[0];
                    game.selectedWorker.isSelected = true;
                    console.log('Auto-selected a worker for battery building');
                } else {
                    showWarning('No workers available to build batteries');
                    return;
                }
            }
            console.log('Worker is selected, proceeding with battery building mode');
            break;
        default:
            showWarning('Unknown building type');
            return;
    }

    // Check if we have enough minerals
    if (game.minerals < cost) {
        showWarning(`Not enough minerals! Need ${cost}`);
        return;
    }

    // Special case for worker: build immediately since the base is already selected
    if (type === 'worker') {
        // Use the base's default mineral patch
        if (!game.base.defaultMineralPatch) {
            // Find a mineral patch if none set
            let closestPatch = findClosestMineralPatch(game, game.base.x, game.base.y);
            if (!closestPatch) {
                showWarning('No mineral patches available!');
                return;
            }
            game.base.defaultMineralPatch = closestPatch;
        }
        
        // Make sure the mineral patch exists and has minerals
        if (!game.base.defaultMineralPatch || game.base.defaultMineralPatch.minerals <= 0) {
            // Try to find another mineral patch
            let closestPatch = findClosestMineralPatch(game, game.base.x, game.base.y);
            if (!closestPatch) {
                showWarning('No mineral patches available!');
                return;
            }
            game.base.defaultMineralPatch = closestPatch;
        }
        
        buildWorker(game, game.base.defaultMineralPatch);
        return;
    }

    // For turrets and batteries, enter building mode
    if (game.buildingType === type) {
        // Toggle off if already in this building mode
        game.buildingType = null;
        showWarning('Building mode cancelled');
    } else {
        // Toggle on building mode
        game.buildingType = type;
        showWarning(`Select location to build ${type}`);
    }

    // Update button states to reflect building mode - with try-catch for safety
    try {
        updateButtonStates(game);
    } catch (err) {
        console.warn('Could not update button states', err);
    }
}

function handleClick(game, x, y) {
    if (game.gameOver) {
        resetGame(game);
        return;
    }

    // If we have a selected entity, we might want to handle actions
    if (game.selectedTurret || game.selectedBattery || game.selectedBase || game.selectedWorker) {
        // Check if click was on a valid target for attack
        if (game.input && game.input.targetSelectionActive) {
            handleTargetSelection(game, x, y);
            return;
        }
    }

    // Right-click target selection mode
    if (game.targetSelectionMode) {
        return;
    }
    
    // Building mode
    if (game.buildingType) {
        handleBuilding(game, x, y);
        return;
    }
    
    // Normal selection
    handleSelection(game, x, y);
}

function handleSelection(game, x, y) {
    // Hide floating upgrade button - we'll use the action panel now
    const floatingUpgradeBtn = document.getElementById('floating-upgrade-btn');
    if (floatingUpgradeBtn) {
        floatingUpgradeBtn.classList.add('hidden');
    }
    
    // Convert screen coordinates to world coordinates
    const worldPos = game.camera.screenToWorld(x, y);
    const worldX = worldPos.x;
    const worldY = worldPos.y;
    
    // Clear all selections first
    game.selectedTurret = null;
    game.selectedBattery = null;
    game.selectedBase = null;
    game.selectedWorker = null;
    game.selectedMineralPatch = null;
    game.selectedEnemy = null;
    game.workers.forEach(worker => worker.isSelected = false);
    
    // First priority: try to select base if clicked near it
    const baseHitboxSize = 2; // Increased hitbox size for easier selection
    const distToBase = Math.hypot(worldX - game.base.x, worldY - game.base.y);

    if (distToBase < game.base.size * baseHitboxSize) {
        game.selectedBase = game.base;
        console.log('Base selected:', game.selectedBase, 'Distance:', distToBase, 'Base size:', game.base.size);
        showWarning('Selected Command Center');
        return;
    }
    
    // Second priority: try to select turrets
    let closestTurret = null;
    let closestTurretDist = Infinity;
    const turretHitboxSize = 2.5; // Increased hitbox
    
    game.turrets.forEach(turret => {
        const dist = Math.hypot(worldX - turret.x, worldY - turret.y);
        
        if (dist < turret.size * turretHitboxSize) {
            if (dist < closestTurretDist) {
                closestTurret = turret;
                closestTurretDist = dist;
            }
        }
    });
    
    if (closestTurret) {
        game.selectedTurret = closestTurret;
        showWarning(`Selected Turret (Level ${closestTurret.level})`);
        return;
    }
    
    // Third priority: try to select batteries
    let closestBattery = null;
    let closestBatteryDist = Infinity;
    const batteryHitboxSize = 2.5; // Increased hitbox

    game.batteries.forEach(battery => {
        const dist = Math.hypot(worldX - battery.x, worldY - battery.y);
        
        if (dist < battery.size * batteryHitboxSize) {
            if (dist < closestBatteryDist) {
                closestBattery = battery;
                closestBatteryDist = dist;
            }
        }
    });
    
    if (closestBattery) {
        game.selectedBattery = closestBattery;
        showWarning('Selected Shield Battery');
        return;
    }
    
    // Fourth priority: mineral patches
    let closestMineral = null;
    let closestMineralDist = Infinity;
    const mineralHitboxSize = 2; // Added hitbox multiplier

    game.mineralPatches.forEach(mineral => {
        const dist = Math.hypot(worldX - mineral.x, worldY - mineral.y);
        
        if (dist < mineral.size * mineralHitboxSize) {
            if (dist < closestMineralDist) {
                closestMineral = mineral;
                closestMineralDist = dist;
            }
        }
    });
    
    if (closestMineral) {
        game.selectedMineralPatch = closestMineral;
        closestMineral.isSelected = true;
        showWarning('Selected Mineral Patch');
        return;
    }
    
    // Fifth priority: enemies
    let closestEnemy = null;
    let closestEnemyDist = Infinity;
    const enemyHitboxSize = 1.5; // Added hitbox multiplier

    game.enemies.forEach(enemy => {
        const dist = Math.hypot(worldX - enemy.x, worldY - enemy.y);
        
        if (dist < enemy.size * enemyHitboxSize) {
            if (dist < closestEnemyDist) {
                closestEnemy = enemy;
                closestEnemyDist = dist;
            }
        }
    });
    
    if (closestEnemy) {
        game.selectedEnemy = closestEnemy;
        showWarning(`Selected ${closestEnemy.type} enemy`);
        return;
    }
    
    // Next priority: try to select workers within hitbox
    let closestWorker = null;
    let closestWorkerDist = Infinity;
    const workerHitboxSize = 1; // Reduced priority for workers
    
    game.workers.forEach(worker => {
        const dist = Math.hypot(worldX - worker.x, worldY - worker.y);
        
        if (dist < worker.size * workerHitboxSize) {
            if (dist < closestWorkerDist) {
                closestWorker = worker;
                closestWorkerDist = dist;
            }
        }
    });
    
    if (closestWorker) {
        closestWorker.isSelected = true;
        game.selectedWorker = closestWorker;
        showWarning('Selected worker');
        
        // Make sure the UI is updated to show build options
        try {
            // Import UISystem if it exists in the global scope
            if (window.UISystem) {
                window.UISystem.updateInfoPanel(game);
            }
        } catch (err) {
            console.warn('Could not update UI after worker selection', err);
        }
        
        return;
    }
    
    // Nothing selected
    showWarning('Nothing selected');
}

function handleBuilding(game, screenX, screenY) {
    console.log('handleBuilding called with buildingType:', game.buildingType);
    
    // Get the cost based on building type
    let cost;
    switch (game.buildingType) {
        case 'turret':
            cost = COSTS.TURRET;
            break;
        case 'battery':
            cost = COSTS.BATTERY;
            break;
        default:
            console.warn('Unknown building type:', game.buildingType);
            return;
    }
    
    if (game.minerals < cost) {
        showWarning(`Not enough minerals! Need ${cost}`);
        game.buildingType = null;
        updateButtonStates(game);
        return;
    }

    // Convert screen coordinates to world coordinates
    const worldPos = game.camera.screenToWorld(screenX, screenY);
    const worldX = worldPos.x;
    const worldY = worldPos.y;

    // Check if the placement position is within world bounds
    const margin = 50; // Margin from world edges
    if (worldX < margin || worldX > game.camera.worldWidth - margin ||
        worldY < margin || worldY > game.camera.worldHeight - margin) {
        showWarning('Cannot build outside the game world!');
        return;
    }

    // Check if clicking near any selectable unit using world coordinates
    const SELECTION_THRESHOLD = 0; // Pixels
    let nearbyUnit = false;

    // Check workers
    game.workers.forEach(worker => {
        if (Math.hypot(worldX - worker.x, worldY - worker.y) < worker.size + SELECTION_THRESHOLD) {
            nearbyUnit = true;
        }
    });

    // Check turrets
    game.turrets.forEach(turret => {
        if (Math.hypot(worldX - turret.x, worldY - turret.y) < turret.size + SELECTION_THRESHOLD) {
            nearbyUnit = true;
        }
    });

    // Check batteries
    game.batteries.forEach(battery => {
        if (Math.hypot(worldX - battery.x, worldY - battery.y) < battery.size + SELECTION_THRESHOLD) {
            nearbyUnit = true;
        }
    });

    // If clicked near a unit, don't build
    if (nearbyUnit) {
        console.log('Cannot build: clicked near an existing unit');
        return;
    }

    // Get a worker to build the structure
    let builder = null;
    
    // First check if we have a single selected worker
    if (game.selectedWorker) {
        builder = game.selectedWorker;
        console.log('Using selectedWorker as builder:', builder);
    } else {
        // Otherwise check for multiple selected workers
        const selectedWorkers = game.workers.filter(worker => worker.isSelected);
        if (selectedWorkers.length > 0) {
            builder = selectedWorkers[0]; // Use the first selected worker
            console.log('Using first of multiple selected workers as builder:', builder);
        }
    }
    
    if (!builder) {
        console.warn('No workers selected to build');
        showWarning('No workers selected to build');
        game.buildingType = null;
        updateButtonStates(game);
        return;
    }
    
    console.log('Proceeding with building at position:', worldX, worldY, 'with builder:', builder);
    
    // Proceed with building using world coordinates
    if (game.buildingType === 'battery') {
        buildBattery(game, worldX, worldY, builder);
    } else {
        buildTurret(game, worldX, worldY, builder);
    }
}

function upgradeTurret(game) {
    if (!game.selectedTurret) {
        showWarning('Select a turret to upgrade');
        return;
    }

    const turret = game.selectedTurret;
    const cost = 150 * Math.pow(2, turret.level - 1);
    
    if (game.minerals < cost) {
        showWarning(`Not enough minerals! Need ${cost}`);
        return;
    }

    game.minerals -= cost;
    turret.upgrade();
    showWarning(`Turret upgraded to level ${turret.level}!`);
}

function resetGame(game) {
    // Reset game state will be implemented in Game class
    game.reset();
}

// Helper functions
function findClosestMineralPatch(game, worldX, worldY) {
    if (game.mineralPatches.length === 0) return null;
    
    // First, filter out patches with no minerals
    const patchesWithMinerals = game.mineralPatches.filter(patch => patch.minerals > 0);
    
    // If there are no patches with minerals left, fall back to all patches
    const patches = patchesWithMinerals.length > 0 ? patchesWithMinerals : game.mineralPatches;
    
    return patches.reduce((closest, patch) => {
        if (!closest) return patch;
        const dist = Math.hypot(worldX - patch.x, worldY - patch.y);
        const closestDist = Math.hypot(worldX - closest.x, worldY - closest.y);
        return dist < closestDist ? patch : closest;
    }, null);
}

function reassignWorker(worker, newPatch) {
    if (worker.targetPatch) {
        worker.targetPatch.workers--;
    }
    worker.targetPatch = newPatch;
    worker.state = 'toMineral';
    newPatch.workers++;
    showWarning('Worker reassigned to mineral patch');
}

function buildWorker(game, mineralPatch) {
    console.log('Building worker with mineral patch:', mineralPatch);
    
    if (!mineralPatch) {
        console.error('No mineral patch provided for worker');
        showWarning('Error: No mineral patch available');
        return;
    }
    
    const cost = COSTS.WORKER;
    game.minerals -= cost;
    const worker = new Worker(game, game.base.x, game.base.y);
    worker.targetPatch = mineralPatch;
    game.workers.push(worker);
    mineralPatch.workers++;
    showWarning('Worker built!');
    console.log('Worker built successfully. Total workers:', game.workers.length);
    
    // Clear building type after successful purchase
    game.buildingType = null;
    // Add try-catch for safety
    try {
        updateButtonStates(game);
    } catch (err) {
        console.warn('Could not update button states', err);
    }
}

function buildTurret(game, worldX, worldY, builder) {
    console.log('Building turret at position:', worldX, worldY, 'with builder:', builder);
    
    game.minerals -= COSTS.TURRET;
    const turret = new Turret(game, worldX, worldY);
    game.turrets.push(turret);
    showWarning('Turret built!');
    
    // Clear building type after successful purchase
    game.buildingType = null;
    
    // Update UI
    try {
        updateButtonStates(game);
        
        // Update info panel if UISystem is available
        if (window.UISystem) {
            window.UISystem.updateInfoPanel(game);
        }
    } catch (err) {
        console.warn('Could not update UI after building turret', err);
    }
    
    game.milestoneSystem.update();
}

function buildBattery(game, worldX, worldY, builder) {
    console.log('Building battery at position:', worldX, worldY, 'with builder:', builder);
    
    game.minerals -= COSTS.BATTERY;
    const battery = new Battery(game, worldX, worldY);
    game.batteries.push(battery);
    showWarning('Shield Battery built!');
    
    // Clear building type after successful purchase
    game.buildingType = null;
    
    // Update UI
    try {
        updateButtonStates(game);
        
        // Update info panel if UISystem is available
        if (window.UISystem) {
            window.UISystem.updateInfoPanel(game);
        }
    } catch (err) {
        console.warn('Could not update UI after building battery', err);
    }
}

// Add function to draw selection rectangle
export function drawSelectionRectangle(ctx) {
    if (selectionState.isSelecting) {
        ctx.save();
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        
        // Calculate rectangle dimensions in screen space
        const x = Math.min(selectionState.start.x, selectionState.end.x);
        const y = Math.min(selectionState.start.y, selectionState.end.y);
        const width = Math.abs(selectionState.end.x - selectionState.start.x);
        const height = Math.abs(selectionState.end.y - selectionState.start.y);
        
        // Draw rectangle in screen space
        ctx.strokeRect(x, y, width, height);
        
        // Draw semi-transparent fill
        ctx.fillStyle = 'rgba(74, 158, 255, 0.1)';
        ctx.fillRect(x, y, width, height);
        
        ctx.restore();
    }
}

function handleRectangleSelection(game) {
    // Convert selection coordinates to world coordinates
    const startWorld = game.camera.screenToWorld(selectionState.start.x, selectionState.start.y);
    const endWorld = game.camera.screenToWorld(selectionState.end.x, selectionState.end.y);
    
    // Define selection bounds
    const left = Math.min(startWorld.x, endWorld.x);
    const right = Math.max(startWorld.x, endWorld.x);
    const top = Math.min(startWorld.y, endWorld.y);
    const bottom = Math.max(startWorld.y, endWorld.y);
    
    // Check if selection rectangle is too small - treat as click
    const MIN_SELECTION_SIZE = 5; // Minimum size in world units
    if (right - left < MIN_SELECTION_SIZE && bottom - top < MIN_SELECTION_SIZE) {
        // Get average point in world coordinates
        const avgX = (startWorld.x + endWorld.x) / 2;
        const avgY = (startWorld.y + endWorld.y) / 2;
        
        // Treat as regular selection click
        handleSelection(game, 
            game.camera.worldToScreen(avgX, avgY).x, 
            game.camera.worldToScreen(avgX, avgY).y
        );
        return;
    }
    
    // Clear previous selections
    game.workers.forEach(worker => worker.isSelected = false);
    game.selectedWorker = null;
    game.selectedTurret = null;
    game.selectedBattery = null;
    game.selectedBase = null;
    game.selectedMineralPatch = null;
    game.selectedEnemy = null;
    
    // Select workers that are within the rectangle
    const selectedWorkers = game.workers.filter(worker => {
        // Add a small buffer around worker position for easier selection
        const buffer = worker.size / 2;
        return (
            worker.x - buffer >= left && 
            worker.x + buffer <= right && 
            worker.y - buffer >= top && 
            worker.y + buffer <= bottom
        );
    });
    
    // Mark all selected workers
    selectedWorkers.forEach(worker => {
        worker.isSelected = true;
    });
    
    if (selectedWorkers.length > 0) {
        // Set the first selected worker as the primary selected worker
        game.selectedWorker = selectedWorkers[0];
        showWarning(`Selected ${selectedWorkers.length} workers`);
        
        // Make sure the UI is updated to show build options
        try {
            // Import UISystem if it exists in the global scope
            if (window.UISystem) {
                window.UISystem.updateInfoPanel(game);
            }
        } catch (err) {
            console.warn('Could not update UI after worker selection', err);
        }
    } else {
        showWarning('Nothing selected');
    }
}

function handleRightClick(game, screenX, screenY) {
    // Convert screen coordinates to world coordinates
    const worldPos = game.camera.screenToWorld(screenX, screenY);
    const worldX = worldPos.x;
    const worldY = worldPos.y;

    // Check if clicked on a mineral patch
    let clickedPatch = game.mineralPatches.find(patch => 
        Math.hypot(worldX - patch.x, worldY - patch.y) < patch.size * 2
    );

    if (clickedPatch) {
        // If base is selected, set this as the default mineral patch
        if (game.selectedBase) {
            game.base.defaultMineralPatch = clickedPatch;
            showWarning('Default mineral patch updated - new workers will be sent here');
            return;
        }
    
        // Get all selected workers
        const selectedWorkers = game.workers.filter(worker => worker.isSelected);
        if (selectedWorkers.length > 0) {
            // Reassign all selected workers to the new patch
            selectedWorkers.forEach(worker => {
                reassignWorker(worker, clickedPatch);
                // Keep the worker selected after reassignment
                worker.isSelected = true;
            });
            // Update the game.selectedWorker to be the last selected one
            game.selectedWorker = selectedWorkers[selectedWorkers.length - 1];
            showWarning(`Reassigned ${selectedWorkers.length} worker${selectedWorkers.length > 1 ? 's' : ''} to mineral patch`);
            return;
        }
    }
}

// Function to assign selected entities to a control group
function assignToControlGroup(game, groupNumber) {
    // Clear the existing group
    controlGroups[groupNumber] = [];
    
    // Check what's currently selected
    let assigned = false;
    
    // Base
    if (game.selectedBase) {
        controlGroups[groupNumber].push({
            type: 'base',
            entity: game.base
        });
        assigned = true;
    }
    
    // Workers
    const selectedWorkers = game.workers.filter(worker => worker.isSelected);
    if (selectedWorkers.length > 0 || game.selectedWorker) {
        if (game.selectedWorker) {
            controlGroups[groupNumber].push({
                type: 'worker',
                entity: game.selectedWorker
            });
            assigned = true;
        }
        
        selectedWorkers.forEach(worker => {
            if (worker !== game.selectedWorker) {
                controlGroups[groupNumber].push({
                    type: 'worker',
                    entity: worker
                });
            }
        });
        assigned = assigned || selectedWorkers.length > 0;
    }
    
    // Turrets
    if (game.selectedTurret) {
        controlGroups[groupNumber].push({
            type: 'turret',
            entity: game.selectedTurret
        });
        assigned = true;
    }
    
    // Batteries
    if (game.selectedBattery) {
        controlGroups[groupNumber].push({
            type: 'battery',
            entity: game.selectedBattery
        });
        assigned = true;
    }
    
    if (assigned) {
        const count = controlGroups[groupNumber].length;
        const entityType = count === 1 ? 
            controlGroups[groupNumber][0].type.charAt(0).toUpperCase() + 
            controlGroups[groupNumber][0].type.slice(1) : 
            'units';
        
        showWarning(`${count} ${entityType} assigned to group ${groupNumber}`);
        game.soundSystem.play('click');
    }
}

// Function to select entities in a control group
function selectControlGroup(game, groupNumber) {
    const group = controlGroups[groupNumber];
    
    if (!group || group.length === 0) {
        return; // No entities in this group
    }
    
    // Clear all current selections
    game.mineralPatches.forEach(patch => patch.isSelected = false);
    game.workers.forEach(worker => worker.isSelected = false);
    game.selectedWorker = null;
    game.selectedTurret = null;
    game.selectedBattery = null;
    game.selectedBase = null;
    
    // Select all entities in the group
    let selectedCount = 0;
    
    group.forEach(item => {
        // Check if the entity still exists in the game
        let entityExists = false;
        
        switch (item.type) {
            case 'base':
                if (game.base === item.entity) {
                    game.selectedBase = item.entity;
                    entityExists = true;
                }
                break;
                
            case 'worker':
                if (game.workers.includes(item.entity)) {
                    item.entity.isSelected = true;
                    // If this is the first worker, set it as the primary selected worker
                    if (!game.selectedWorker) {
                        game.selectedWorker = item.entity;
                    }
                    entityExists = true;
                }
                break;
                
            case 'turret':
                if (game.turrets.includes(item.entity)) {
                    game.selectedTurret = item.entity;
                    entityExists = true;
                }
                break;
                
            case 'battery':
                if (game.batteries.includes(item.entity)) {
                    game.selectedBattery = item.entity;
                    entityExists = true;
                }
                break;
        }
        
        if (entityExists) {
            selectedCount++;
        }
    });
    
    // Clean up the group by removing entities that no longer exist
    controlGroups[groupNumber] = group.filter(item => {
        switch (item.type) {
            case 'base':
                return game.base === item.entity;
            case 'worker':
                return game.workers.includes(item.entity);
            case 'turret':
                return game.turrets.includes(item.entity);
            case 'battery':
                return game.batteries.includes(item.entity);
            default:
                return false;
        }
    });
    
    if (selectedCount > 0) {
        const entityType = selectedCount === 1 ? 
            controlGroups[groupNumber][0].type.charAt(0).toUpperCase() + 
            controlGroups[groupNumber][0].type.slice(1) : 
            'units';
            
        showWarning(`Group ${groupNumber}: ${selectedCount} ${entityType} selected`);
        game.soundSystem.play('click');
        
        // Update UI to reflect the new selection
        if (window.UISystem) {
            window.UISystem.updateInfoPanel(game);
        }
    } else {
        // If all entities in the group are gone, clear the group
        controlGroups[groupNumber] = [];
    }
}

// Expose control group functions to the window object
window.assignToControlGroup = assignToControlGroup;
window.selectControlGroup = selectControlGroup; 
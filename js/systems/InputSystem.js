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

// Make updateButtonStates available globally
export function updateButtonStates(game) {
    const workerBtn = document.querySelector('.worker-btn');
    const turretBtn = document.querySelector('.turret-btn');
    const batteryBtn = document.querySelector('.battery-btn');
    const upgradeBtn = document.querySelector('.upgrade-btn');
    
    // Remove selected class from all buttons
    workerBtn.classList.remove('selected');
    turretBtn.classList.remove('selected');
    batteryBtn.classList.remove('selected');
    
    // Add selected class to active building button
    if (game.buildingType === 'worker') {
        workerBtn.classList.add('selected');
    } else if (game.buildingType === 'turret') {
        turretBtn.classList.add('selected');
    } else if (game.buildingType === 'battery') {
        batteryBtn.classList.add('selected');
    }
    
    // Always disable buttons if not enough minerals
    workerBtn.disabled = game.minerals < COSTS.WORKER;
    turretBtn.disabled = game.minerals < COSTS.TURRET;
    batteryBtn.disabled = game.minerals < COSTS.BATTERY;

    // Update upgrade button if a turret is selected
    if (game.selectedTurret && upgradeBtn) {
        const cost = 150 * Math.pow(2, game.selectedTurret.level - 1);
        upgradeBtn.disabled = game.minerals < cost;
    }
}

// Make it available globally
window.updateButtonStates = updateButtonStates;

export function initializeEventListeners(game) {
    // Add mouse down event for selection start
    game.canvas.addEventListener('mousedown', (e) => {
        const rect = game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // For left click, start selection if not in building mode
        if (e.button === 0 && !game.buildingType) {
            selectionState.isSelecting = true;
            selectionState.start = { x, y };
            selectionState.end = { ...selectionState.start };
        }
    });

    // Add mouse move event for selection rectangle
    game.canvas.addEventListener('mousemove', (e) => {
        if (selectionState.isSelecting) {
            const rect = game.canvas.getBoundingClientRect();
            selectionState.end = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    });

    // Add mouse up event for selection end
    game.canvas.addEventListener('mouseup', (e) => {
        const rect = game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Handle building placement on left click
        if (e.button === 0 && game.buildingType) {
            handleClick(game, x, y);
            return;
        }

        // If we were selecting, handle the selection and don't do anything else
        if (selectionState.isSelecting) {
            if (e.button === 0) {
                selectionState.end = { x, y };
                
                // Only handle as a click if the mouse hasn't moved at all
                const dragDistance = Math.hypot(
                    selectionState.end.x - selectionState.start.x, 
                    selectionState.end.y - selectionState.start.y
                );
                
                if (dragDistance === 0) {
                    handleClick(game, x, y);
                } else {
                    handleRectangleSelection(game);
                }
            }
            setTimeout(()=>{
                selectionState.isSelecting = false;
            },50)
            
            return;
        }

        // Handle normal clicks only if we weren't selecting
        if (e.button === 0 && !game.buildingType) {
            handleClick(game, x, y);
        }
    });

    // Add right click handler
    game.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();  // Prevent default context menu
        const rect = game.canvas.getBoundingClientRect();
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
                    updateButtonStates(game);
                }
                
                // Clear any existing selection
                game.selectedTurret = null;
                game.selectedBattery = null;
                game.selectedWorker = null;
                game.workers.forEach(worker => worker.isSelected = false);
                
                // Hide upgrade button
                const floatingUpgradeBtn = document.getElementById('floating-upgrade-btn');
                if (floatingUpgradeBtn) {
                    floatingUpgradeBtn.style.display = 'none';
                }
                
                showWarning('Selection cleared');
                break;
        }
    });

    // Add building methods to game
    game.buildWorker = () => toggleBuilding(game, 'worker');
    game.buildTurret = () => toggleBuilding(game, 'turret');
    game.buildBattery = () => toggleBuilding(game, 'battery');
    game.upgradeTurret = () => upgradeTurret(game);

    // Initialize button states
    updateButtonStates(game);
}

function toggleBuilding(game, type) {
    // Get the cost based on building type
    let cost;
    switch (type) {
        case 'worker':
            cost = COSTS.WORKER;
            break;
        case 'turret':
            cost = COSTS.TURRET;
            break;
        case 'battery':
            cost = COSTS.BATTERY;
            break;
        default:
            return;
    }
    
    // Check if we have enough minerals
    if (game.minerals >= cost) {
        // If already in building mode but selecting a different type, just switch to it
        if (game.buildingType && game.buildingType !== type) {
            game.buildingType = type;
            showWarning(`Select location for ${type}`);
        } 
        // If not in building mode or clicking same type, toggle it
        else if (!game.buildingType) {
            game.buildingType = type;
            showWarning(`Select location for ${type}`);
        } else {
            game.buildingType = null;
            showWarning('Building cancelled');
        }
    } else {
        showWarning(`Not enough minerals! Need ${cost}`);
        // Only clear building type if we're currently on this type
        if (game.buildingType === type) {
            game.buildingType = null;
        }
    }
    
    updateButtonStates(game);
}

function handleClick(game, x, y) {
    // Don't handle clicks if we're in the middle of a rectangle selection
    if (selectionState.isSelecting) {
        return;
    }

    if (game.gameOver) {
        resetGame(game);
        return;
    }
    
    if (game.buildingType) {
        handleBuilding(game, x, y);
    } else {
        handleSelection(game, x, y);
    }
}

function handleSelection(game, screenX, screenY) {
    let foundTurret = false;
    let foundBattery = false;
    let foundWorker = false;
    const floatingUpgradeBtn = document.getElementById('floating-upgrade-btn');

    // Convert screen coordinates to world coordinates
    const worldPos = game.camera.screenToWorld(screenX, screenY);
    const worldX = worldPos.x;
    const worldY = worldPos.y;

    // Clear non-worker selections first
    game.selectedTurret = null;
    game.selectedBattery = null;
    floatingUpgradeBtn.style.display = 'none';

    // Clear all selections first
    game.workers.forEach(worker => worker.isSelected = false);
    game.selectedWorker = null;

    // Check worker selection
    game.workers.forEach(worker => {
        if (Math.hypot(worldX - worker.x, worldY - worker.y) < worker.size) {
            worker.isSelected = true;
            foundWorker = true;
        }
    });

    // If we found a worker, update the game.selectedWorker to be the last selected one
    if (foundWorker) {
        game.selectedWorker = game.workers.find(worker => worker.isSelected);
        showWarning('Selected worker');
        return; // Don't check other selections if we found a worker
    }

    // Check turret selection
    game.turrets.forEach(turret => {
        if (Math.hypot(worldX - turret.x, worldY - turret.y) < turret.size) {
            game.selectedTurret = turret;
            foundTurret = true;
            showWarning(`Selected turret (Level ${turret.level})`);
            
            // Position and show upgrade button above the turret
            const rect = game.canvas.getBoundingClientRect();
            const screenPos = game.camera.worldToScreen(turret.x, turret.y);
            floatingUpgradeBtn.style.left = `${rect.left + screenPos.x}px`;
            floatingUpgradeBtn.style.top = `${rect.top + screenPos.y - 40}px`;
            floatingUpgradeBtn.style.display = 'block';
            
            // Update upgrade button text with cost
            const cost = 150 * Math.pow(2, turret.level - 1);
            const upgradeBtn = floatingUpgradeBtn.querySelector('.upgrade-btn');
            upgradeBtn.textContent = `Upgrade Turret (${cost} 💎)`;
            upgradeBtn.disabled = game.minerals < cost;
        }
    });

    // Check battery selection
    game.batteries.forEach(battery => {
        if (Math.hypot(worldX - battery.x, worldY - battery.y) < battery.size) {
            game.selectedBattery = battery;
            foundBattery = true;
            showWarning('Selected shield battery');
        }
    });
}

function handleBuilding(game, screenX, screenY) {
    // Get the cost based on building type
    let cost;
    switch (game.buildingType) {
        case 'worker':
            cost = COSTS.WORKER;
            break;
        case 'turret':
            cost = COSTS.TURRET;
            break;
        case 'battery':
            cost = COSTS.BATTERY;
            break;
        default:
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
        return;
    }

    // Otherwise, proceed with building using world coordinates
    if (game.buildingType === 'worker') {
        let closestPatch = findClosestMineralPatch(game, worldX, worldY);
        if (!closestPatch) {
            showWarning('No mineral patches available!');
            return;
        }
        buildWorker(game, closestPatch);
    } else if (game.buildingType === 'battery') {
        buildBattery(game, worldX, worldY);
    } else {
        buildTurret(game, worldX, worldY);
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
    
    return game.mineralPatches.reduce((closest, patch) => {
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
    const cost = COSTS.WORKER;
    game.minerals -= cost;
    const worker = new Worker(game, game.base.x, game.base.y);
    worker.targetPatch = mineralPatch;
    game.workers.push(worker);
    mineralPatch.workers++;
    showWarning('Worker built!');
    updateButtonStates(game);
}

function buildTurret(game, worldX, worldY) {
    game.minerals -= COSTS.TURRET;
    const turret = new Turret(game, worldX, worldY);
    game.turrets.push(turret);
    showWarning('Turret built!');
    updateButtonStates(game);
    game.milestoneSystem.update();
}

function buildBattery(game, worldX, worldY) {
    game.minerals -= COSTS.BATTERY;
    const battery = new Battery(game, worldX, worldY);
    game.batteries.push(battery);
    showWarning('Shield Battery built!');
    updateButtonStates(game);
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
    
    // Calculate selection bounds in world coordinates
    const left = Math.min(startWorld.x, endWorld.x);
    const right = Math.max(startWorld.x, endWorld.x);
    const top = Math.min(startWorld.y, endWorld.y);
    const bottom = Math.max(startWorld.y, endWorld.y);
    
    // Clear previous selections
    game.workers.forEach(worker => worker.isSelected = false);
    game.selectedWorker = null;
    game.selectedTurret = null;
    game.selectedBattery = null;
    
    // Select all workers that intersect with the selection rectangle
    let selectedWorkers = [];
    game.workers.forEach(worker => {
        // Add buffer around worker position for easier selection
        const buffer = worker.size * 2;
        
        // Check if worker's position (with buffer) is within the selection rectangle
        if (worker.x - buffer <= right && 
            worker.x + buffer >= left && 
            worker.y - buffer <= bottom && 
            worker.y + buffer >= top) {
            // Set the worker's selected state
            worker.isSelected = true;
            selectedWorkers.push(worker);
        }
    });

 
    
    // If we selected any workers, keep track of the last one for compatibility
    // and ensure all selected workers maintain their state
    if (selectedWorkers.length > 0) {
        // Set the game's selected worker to the last one selected
        game.selectedWorker = selectedWorkers[selectedWorkers.length - 1];
        
        // Double-check that all selected workers have their state set
        selectedWorkers.forEach(worker => {
            worker.isSelected = true;
        });
        
        console.log('Selected workers:', selectedWorkers.map(w => w.isSelected));
        showWarning(`Selected ${selectedWorkers.length} worker${selectedWorkers.length > 1 ? 's' : ''}`);
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
import { COSTS } from '../utils/constants.js';
import { showWarning } from '../utils/constants.js';
import { Worker } from '../entities/Worker.js';
import { Turret } from '../entities/Turret.js';
import { Battery } from '../entities/Battery.js';
import { MissileLauncher } from '../entities/MissileLauncher.js';
import { MinimapSystem } from './MinimapSystem.js';

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
        const buildMissileLauncherButton = document.getElementById('buildMissileLauncherButton') || document.querySelector('.missile-launcher-btn');
        
        // Get upgrade buttons
        const turretUpgradeButton = document.querySelector('#turret-buttons .upgrade-btn');
        const missileLauncherUpgradeButton = document.querySelector('#missile-launcher-buttons .upgrade-btn');
        
        // Only proceed if buttons exist in the DOM
        if (!buildWorkerButton || !buildTurretButton || !buildBatteryButton || !buildMissileLauncherButton) {
            console.warn('Could not find all building buttons in the DOM');
            // Continue anyway, as upgrade buttons may still exist
        }
        
        // Update turret upgrade button if it exists
        if (turretUpgradeButton && game.selectedTurret) {
            console.log('Turret upgrade button found and turret selected');
            const upgradeCost = 150 * Math.pow(2, game.selectedTurret.level - 1);
            turretUpgradeButton.textContent = `Upgrade (${upgradeCost})`;
            
            if (game.minerals >= upgradeCost) {
                turretUpgradeButton.disabled = false;
                turretUpgradeButton.classList.remove('disabled');
            } else {
                turretUpgradeButton.disabled = true;
                turretUpgradeButton.classList.add('disabled');
            }
        } else {
            console.log('Turret upgrade button issue:',
                'Button exists:', !!turretUpgradeButton,
                'Turret selected:', !!game.selectedTurret);
        }
        
        // Update missile launcher upgrade button if it exists
        if (missileLauncherUpgradeButton && game.selectedMissileLauncher) {
            const upgradeCost = 150 * Math.pow(2, game.selectedMissileLauncher.level - 1);
            missileLauncherUpgradeButton.textContent = `Upgrade (${upgradeCost})`;
            
            if (game.minerals >= upgradeCost) {
                missileLauncherUpgradeButton.disabled = false;
                missileLauncherUpgradeButton.classList.remove('disabled');
            } else {
                missileLauncherUpgradeButton.disabled = true;
                missileLauncherUpgradeButton.classList.add('disabled');
            }
        }
        
        // Check if buttons are visible before updating their state
        const isWorkerButtonVisible = buildWorkerButton.style.visibility !== 'hidden';
        const isTurretButtonVisible = buildTurretButton.style.visibility !== 'hidden';
        const isBatteryButtonVisible = buildBatteryButton.style.visibility !== 'hidden';
        const isMissileLauncherButtonVisible = buildMissileLauncherButton.style.visibility !== 'hidden';
        
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
        
        if (isMissileLauncherButtonVisible && buildMissileLauncherButton) {
            if (game.minerals >= COSTS.MISSILE_LAUNCHER) {
                buildMissileLauncherButton.disabled = false;
                buildMissileLauncherButton.classList.remove('disabled');
            } else {
                buildMissileLauncherButton.disabled = true;
                buildMissileLauncherButton.classList.add('disabled');
            }
        }
    } catch (error) {
        console.error('Error updating button states:', error);
    }
}

// Make it available globally
window.updateButtonStates = updateButtonStates;
window.controlGroups = controlGroups;
window.selectionState = selectionState;

export function initializeEventListeners(game) {
    const canvas = game.canvas;
    const floatingUpgradeBtn = document.getElementById('floating-upgrade-btn');

    // Set initial action button visibility
    const defaultButtons = document.getElementById('default-buttons');
    if (defaultButtons) {
        defaultButtons.classList.add('active');
    }

    // Mouse down - Start selection rectangle
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check specifically for minimap click first
        if (e.button === 0) {  // Left click only
            const isInMinimap = MinimapSystem.isInMinimapBounds(x, y, canvas.height);
            
            if (isInMinimap) {
                console.log('Minimap click detected in mousedown event');
                // Handle the minimap click and exit - don't start selection
                MinimapSystem.handleClick(game, x, y);
                e.preventDefault(); // Prevent any default behavior
                e.stopPropagation(); // Stop event from bubbling
                return;
            }
        }
        
        // Check if clicking on HTML UI elements
        // Only proceed with game canvas logic if the target is the canvas itself
        if (e.target !== canvas) {
            console.log('Clicked on HTML UI element:', e.target);
            return; // Don't process canvas interactions for clicks on UI elements
        }
        
        // Check if clicking on UI elements by checking coordinates
        const infoPanel = document.getElementById('info-panel');
        const actionButtons = document.getElementById('action-buttons');
        
        // Calculate action buttons bounds more precisely
        const actionButtonsRect = actionButtons ? actionButtons.getBoundingClientRect() : null;
        const isInActionButtons = actionButtonsRect && 
            e.clientX >= actionButtonsRect.left && 
            e.clientX <= actionButtonsRect.right && 
            e.clientY >= actionButtonsRect.top && 
            e.clientY <= actionButtonsRect.bottom;
        
        const isInInfoPanel = infoPanel && 
            x >= (canvas.width / 2) - 200 && 
            x <= (canvas.width / 2) + 200 && 
            y >= canvas.height - 150;
        
        if (isInInfoPanel || isInActionButtons) {
            console.log('Click on UI element detected:', isInInfoPanel ? 'info panel' : 'action buttons');
            return; // Don't start selection if clicking on UI
        }

        // For left click, start selection if not in building mode
        if (e.button === 0 && !game.buildingType) {
            selectionState.isSelecting = true;
            selectionState.start = { x, y };
            selectionState.end = { x, y };
            console.log('Selection started at', x, y);
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
            console.log('Selection rectangle updated:', 
                'start:', selectionState.start, 
                'end:', selectionState.end, 
                'isSelecting:', selectionState.isSelecting);
        }
    });

    // Mouse up - Finish selection
    canvas.addEventListener('mouseup', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Don't process canvas interactions for clicks on UI elements
        if (e.target !== canvas) {
            console.log('Mouse up on HTML UI element:', e.target);
            selectionState.isSelecting = false; // End any selection in progress
            return;
        }
        
        // Check for action buttons using getBoundingClientRect for more precise detection
        const actionButtons = document.getElementById('action-buttons');
        const actionButtonsRect = actionButtons ? actionButtons.getBoundingClientRect() : null;
        const isInActionButtons = actionButtonsRect && 
            e.clientX >= actionButtonsRect.left && 
            e.clientX <= actionButtonsRect.right && 
            e.clientY >= actionButtonsRect.top && 
            e.clientY <= actionButtonsRect.bottom;
        
        if (isInActionButtons) {
            console.log('Mouse up on action buttons');
            selectionState.isSelecting = false; // End any selection in progress
            return;
        }
        
        // Check if clicking on minimap - don't handle as a regular click
        if (e.button === 0 && MinimapSystem.isInMinimapBounds(x, y, canvas.height)) {
            // If the click started and ended on the minimap, it's already being handled
            // If selection in progress, just end it without taking action
            selectionState.isSelecting = false;
            return;
        }
        
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
                // Treat as regular selection click
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
            case 'm': // 'm' for missile launcher
                toggleBuilding(game, 'missile_launcher');
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
                
                // Update UI to reflect that nothing is selected
                if (window.UISystem) {
                    window.UISystem.updateInfoPanel(game);
                }
                
                // Update action buttons visibility
                updateActionButtonsVisibility(game);
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
        
        // Handle turret upgrade with 'U' key
        if (key.toLowerCase() === 'u') {
            console.log('Upgrade key pressed');
            upgradeTurret(game);
            e.preventDefault();
            return;
        }
    });

    // Define building functions
    game.buildWorker = () => {
        console.log('buildWorker called');
        // Special handling for workers - build immediately instead of entering building mode
        
        // Check if we have enough minerals
        if (game.minerals < COSTS.WORKER) {
            showWarning(`Not enough minerals! Need ${COSTS.WORKER}, have ${game.minerals}`);
            return;
        }
        
        // Workers spawn at the Command Center and don't need placement
        // Create worker and assign it to the default mineral patch
        const mineralPatch = game.base.defaultMineralPatch;
        
        if (!mineralPatch) {
            // If no default mineral patch, find the closest one
            const closestPatch = findClosestMineralPatch(game, game.base.x, game.base.y);
            if (!closestPatch) {
                showWarning('No mineral patches available!');
                return;
            }
            
            buildWorker(game, closestPatch);
        } else {
            buildWorker(game, mineralPatch);
        }
    };
    
    game.buildTurret = () => {
        console.log('buildTurret called');
        toggleBuilding(game, 'turret');
    };
    
    game.buildBattery = () => {
        console.log('buildBattery called');
        toggleBuilding(game, 'battery');
    };
    
    game.buildMissileLauncher = () => {
        console.log('buildMissileLauncher called');
        toggleBuilding(game, 'missile_launcher');
    };
    
    game.upgradeTurret = () => upgradeTurret(game);

    // Make sure these methods are also available on the window.game object
    if (window.game) {
        window.game.buildWorker = game.buildWorker;
        window.game.buildTurret = game.buildTurret;
        window.game.buildBattery = game.buildBattery;
        window.game.buildMissileLauncher = game.buildMissileLauncher;
        window.game.upgradeTurret = game.upgradeTurret;
    }

    // Initialize button states
    try {
        updateButtonStates(game);
    } catch (err) {
        console.warn('Could not update button states', err);
    }
}

export function toggleBuilding(game, type) {
    console.log('toggleBuilding called with type:', type, 'Selected base:', game.selectedBase);
    
    // Normalize the type to uppercase for consistency
    type = type.toUpperCase();
    
    // Special handling for workers - they don't need placement
    if (type === 'WORKER') {
        // Check if we have enough minerals
        if (game.minerals < COSTS.WORKER) {
            showWarning(`Not enough minerals! Need ${COSTS.WORKER}, have ${game.minerals}`);
            return;
        }
        
        // Get default or closest mineral patch
        const mineralPatch = game.base.defaultMineralPatch || findClosestMineralPatch(game, game.base.x, game.base.y);
        
        if (!mineralPatch) {
            showWarning('No mineral patches available!');
            return;
        }
        
        // Build worker directly
        buildWorker(game, mineralPatch);
        return;
    }
    
    // Regular building mode toggle for other building types
    if (game.buildingType === type) {
        game.buildingType = null;
        showWarning('Building cancelled');
    } else {
        // Check if we have enough minerals
        const cost = COSTS[type];
        if (game.minerals < cost) {
            showWarning(`Not enough minerals! Need ${cost}, have ${game.minerals}`);
            return;
        }
        
        game.buildingType = type;
        showWarning(`Select location for ${type}`);
        
        // Auto-select base if no builder is selected
        if (!game.selectedBase && !game.selectedWorker) {
            game.selectedBase = game.base;
            game.base.isSelected = true;
            showWarning('Base selected as builder');
        }
    }
    
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

    // Minimap clicks are now handled in the mousedown event, so no need to check here

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

function handleSelection(game, screenX, screenY) {
    // Hide floating upgrade button - we'll use the action panel now
    const floatingUpgradeBtn = document.getElementById('floating-upgrade-btn');
    if (floatingUpgradeBtn) {
        floatingUpgradeBtn.classList.add('hidden');
    }
    
    // Convert screen coordinates to world coordinates
    const worldPos = game.camera.screenToWorld(screenX, screenY);
    const worldX = worldPos.x;
    const worldY = worldPos.y;
    
    // Check if clicking near any selectable unit using world coordinates
    const SELECTION_THRESHOLD = 20; // Pixels
    
    // Clear previous selection
    game.selectedTurret = null;
    game.selectedBattery = null;
    game.selectedWorker = null;
    game.selectedBase = null;
    game.selectedMineralPatch = null;
    game.selectedEnemy = null;
    game.selectedMissileLauncher = null;
    
    // Reset selection state for all entities
    game.workers.forEach(worker => worker.isSelected = false);
    game.turrets.forEach(turret => turret.isSelected = false);
    game.batteries.forEach(battery => battery.isSelected = false);
    game.missileLaunchers.forEach(missileLauncher => missileLauncher.isSelected = false);
    
    // First priority: try to select base if clicked near it
    const baseHitboxSize = 2; // Increased hitbox size for easier selection
    const distToBase = Math.hypot(worldX - game.base.x, worldY - game.base.y);

    if (distToBase < game.base.size * baseHitboxSize) {
        game.selectedBase = game.base;
        game.base.isSelected = true;
        console.log('Base selected:', game.selectedBase, 'Distance:', distToBase, 'Base size:', game.base.size);
        
        updateActionButtonsVisibility(game);
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
        closestTurret.isSelected = true;
        showWarning(`Selected Turret (Level ${closestTurret.level})`);
        updateActionButtonsVisibility(game);
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
        updateActionButtonsVisibility(game);
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
        updateActionButtonsVisibility(game);
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
        updateActionButtonsVisibility(game);
        return;
    }
    
    // Check missile launchers
    for (const missileLauncher of game.missileLaunchers) {
        if (Math.hypot(worldX - missileLauncher.x, worldY - missileLauncher.y) < missileLauncher.size + SELECTION_THRESHOLD) {
            missileLauncher.isSelected = true;
            game.selectedMissileLauncher = missileLauncher;
            game.soundSystem.play('select');
            showWarning('Missile Launcher selected');
            
            // Update UI
            if (window.UISystem) {
                window.UISystem.updateInfoPanel(game);
            }
            
            updateActionButtonsVisibility(game);
            return;
        }
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
        
        // Make sure the UI is updated to show build options
        try {
            // Import UISystem if it exists in the global scope
            if (window.UISystem) {
                window.UISystem.updateInfoPanel(game);
            }
        } catch (err) {
            console.warn('Could not update UI after worker selection', err);
        }
        
        updateActionButtonsVisibility(game);
        return;
    }
    
    // Nothing selected
    showWarning('Nothing selected');
    updateActionButtonsVisibility(game);
}

function handleBuilding(game, screenX, screenY) {
    // Workers are now built immediately without placement, so skip if worker type
    if (game.buildingType === 'WORKER') {
        console.log('Workers do not use placement mode - this should not happen');
        game.buildingType = null;
        updateButtonStates(game);
        return;
    }
    
    // Convert screen coordinates to world coordinates
    const worldPos = game.camera.screenToWorld(screenX, screenY);
    const worldX = worldPos.x;
    const worldY = worldPos.y;
    
    console.log('Building at world position:', worldX, worldY);
    
    // Check if we have enough minerals
    const cost = COSTS[game.buildingType];
    if (game.minerals < cost) {
        showWarning(`Not enough minerals! Need ${cost}`);
        game.buildingType = null;
        updateButtonStates(game);
        return;
    }
    
    // Find a builder (worker or base)
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
    if (game.buildingType === 'BATTERY') {
        buildBattery(game, worldX, worldY, builder);
    } else if (game.buildingType === 'MISSILE_LAUNCHER') {
        buildMissileLauncher(game, worldX, worldY, builder);
    } else {
        buildTurret(game, worldX, worldY, builder);
    }
}

export function upgradeTurret(game) {
    if (game.selectedTurret) {
        const turret = game.selectedTurret;
        const cost = 150 * Math.pow(2, turret.level - 1);
        
        if (game.minerals < cost) {
            showWarning(`Not enough minerals! Need ${cost}`);
            return;
        }

        game.minerals -= cost;
        turret.upgrade();
        showWarning(`Turret upgraded to level ${turret.level}!`);
        return;
    }
    
    if (game.selectedMissileLauncher) {
        const missileLauncher = game.selectedMissileLauncher;
        const cost = 150 * Math.pow(2, missileLauncher.level - 1);
        
        if (game.minerals < cost) {
            showWarning(`Not enough minerals! Need ${cost}`);
            return;
        }

        game.minerals -= cost;
        missileLauncher.upgrade();
        showWarning(`Missile Launcher upgraded to level ${missileLauncher.level}!`);
        return;
    }

    showWarning('Select a turret or missile launcher to upgrade');
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

function buildMissileLauncher(game, worldX, worldY, builder) {
    // Create a new missile launcher at the specified location
    const missileLauncher = new MissileLauncher(game, worldX, worldY);
    game.missileLaunchers.push(missileLauncher);
    
    // Deduct the cost
    game.minerals -= COSTS.MISSILE_LAUNCHER;
    
    // Reset building mode
    game.buildingType = null;
    
    // Play build sound
    if (game.soundSystem) {
        game.soundSystem.play('build-missile-launcher');
    }
    
    // Update button states
    if (typeof updateButtonStates === 'function') {
        updateButtonStates(game);
    }
}

// Add function to draw selection rectangle
export function drawSelectionRectangle(ctx) {
    if (selectionState.isSelecting) {
        console.log('Drawing selection rectangle:', selectionState);
        
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
    game.enemies.forEach(enemy => enemy.isSelected = false);
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
    
    // Select enemies that are within the rectangle
    const selectedEnemies = game.enemies.filter(enemy => {
        // Add a small buffer around enemy position for easier selection
        const buffer = enemy.size / 2;
        return (
            enemy.x - buffer >= left && 
            enemy.x + buffer <= right && 
            enemy.y - buffer >= top && 
            enemy.y + buffer <= bottom
        );
    });
    
    // Mark all selected workers
    selectedWorkers.forEach(worker => {
        worker.isSelected = true;
    });
    
    // Mark all selected enemies
    selectedEnemies.forEach(enemy => {
        enemy.isSelected = true;
    });
    
    if (selectedWorkers.length > 0) {
        // Set the first selected worker as the primary selected worker
        game.selectedWorker = selectedWorkers[0];
        
        // Make sure the UI is updated to show build options
        try {
            // Import UISystem if it exists in the global scope
            if (window.UISystem) {
                window.UISystem.updateInfoPanel(game);
            }
        } catch (err) {
            console.warn('Could not update UI after worker selection', err);
        }
        
        // Update action buttons visibility for worker selection
        updateActionButtonsVisibility(game);
        return;
    }
    
    if (selectedEnemies.length > 0) {
        // Set the first selected enemy as the primary selected enemy
        game.selectedEnemy = selectedEnemies[0];
        
        // Make sure the UI is updated to show enemy information
        try {
            if (window.UISystem) {
                window.UISystem.updateInfoPanel(game);
            }
        } catch (err) {
            console.warn('Could not update UI after enemy selection', err);
        }
        
        showWarning(`Selected ${selectedEnemies.length} ${selectedEnemies.length > 1 ? 'enemies' : 'enemy'}`);
        updateActionButtonsVisibility(game);
        return;
    }
    
    showWarning('Nothing selected');
    updateActionButtonsVisibility(game);
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

    // Enemies
    const selectedEnemies = game.enemies.filter(enemy => enemy.isSelected);
    if (selectedEnemies.length > 0 || game.selectedEnemy) {
        if (game.selectedEnemy) {
            controlGroups[groupNumber].push({
                type: 'enemy',
                entity: game.selectedEnemy
            });
            assigned = true;
        }
        
        selectedEnemies.forEach(enemy => {
            if (enemy !== game.selectedEnemy) {
                controlGroups[groupNumber].push({
                    type: 'enemy',
                    entity: enemy
                });
            }
        });
        assigned = assigned || selectedEnemies.length > 0;
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
    game.enemies.forEach(enemy => enemy.isSelected = false);
    game.selectedWorker = null;
    game.selectedTurret = null;
    game.selectedBattery = null;
    game.selectedBase = null;
    game.selectedEnemy = null;
    
    // Select all entities in the group
    let selectedCount = 0;
    
    group.forEach(item => {
        // Check if the entity still exists in the game
        let entityExists = false;
        
        switch (item.type) {
            case 'base':
                if (game.base === item.entity) {
                    game.selectedBase = item.entity;
                    game.base.isSelected = true;
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

            case 'enemy':
                if (game.enemies.includes(item.entity)) {
                    item.entity.isSelected = true;
                    // If this is the first enemy, set it as the primary selected enemy
                    if (!game.selectedEnemy) {
                        game.selectedEnemy = item.entity;
                    }
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
            case 'enemy':
                return game.enemies.includes(item.entity);
            default:
                return false;
        }
    });
    
    // If no entities left in this group, return
    if (selectedCount === 0) {
        showWarning(`Control group ${groupNumber} is empty`);
        return;
    }
    
    // Update UI
    if (window.UISystem) {
        window.UISystem.updateInfoPanel(game);
    }
    
    // Update action buttons visibility based on the new selection
    updateActionButtonsVisibility(game);
    
    // Play sound and show warning
    game.soundSystem.play('select');
    showWarning(`Selected ${selectedCount} units from group ${groupNumber}`);
}

// Expose control group functions to the window object
window.assignToControlGroup = assignToControlGroup;
window.selectControlGroup = selectControlGroup;

export function createButtons() {
    const buttons = [
        {
            id: 'worker-button',
            x: 10,
            y: window.innerHeight - 60,
            width: 50,
            height: 50,
            text: 'W',
            tooltip: 'Build Worker (50)',
            action: () => toggleBuilding('WORKER'),
            isActive: () => game.buildingType === 'WORKER',
            isEnabled: () => game.minerals >= COSTS.WORKER
        },
        {
            id: 'turret-button',
            x: 70,
            y: window.innerHeight - 60,
            width: 50,
            height: 50,
            text: 'T',
            tooltip: 'Build Turret (100)',
            action: () => toggleBuilding('TURRET'),
            isActive: () => game.buildingType === 'TURRET',
            isEnabled: () => game.minerals >= COSTS.TURRET
        },
        {
            id: 'battery-button',
            x: 130,
            y: window.innerHeight - 60,
            width: 50,
            height: 50,
            text: 'B',
            tooltip: 'Build Battery (150)',
            action: () => toggleBuilding('BATTERY'),
            isActive: () => game.buildingType === 'BATTERY',
            isEnabled: () => game.minerals >= COSTS.BATTERY
        },
        {
            id: 'missile-launcher-button',
            x: 190,
            y: window.innerHeight - 60,
            width: 50,
            height: 50,
            text: 'M',
            tooltip: 'Build Missile Launcher (200)',
            action: () => toggleBuilding('MISSILE_LAUNCHER'),
            isActive: () => game.buildingType === 'MISSILE_LAUNCHER',
            isEnabled: () => game.minerals >= COSTS.MISSILE_LAUNCHER
        },
        // ... existing buttons ...
    ];
    
    // ... existing code ...
}

// Add this function to update action button visibility based on selection
function updateActionButtonsVisibility(game) {
    // Get all button groups
    const commandCenterButtons = document.getElementById('command-center-buttons');
    const workerButtons = document.getElementById('worker-buttons');
    const defaultButtons = document.getElementById('default-buttons');
    const turretButtons = document.getElementById('turret-buttons');
    const missileLauncherButtons = document.getElementById('missile-launcher-buttons');
    
    // Debug element existence
    console.log('Turret buttons element found:', turretButtons ? 'Yes' : 'No');
    console.log('Selected turret:', game.selectedTurret);
    console.log('Turret isSelected:', game.selectedTurret ? game.selectedTurret.isSelected : false);
    
    // Remove active class from all button groups
    if (commandCenterButtons) commandCenterButtons.classList.remove('active');
    if (workerButtons) workerButtons.classList.remove('active');
    if (defaultButtons) defaultButtons.classList.remove('active');
    if (turretButtons) turretButtons.classList.remove('active');
    if (missileLauncherButtons) missileLauncherButtons.classList.remove('active');
    
    // Show appropriate button group based on selection
    if (game.selectedBase && game.selectedBase.isSelected) {
        // Command Center is selected - show worker build button
        if (commandCenterButtons) commandCenterButtons.classList.add('active');
    } else if (game.selectedWorker && game.selectedWorker.isSelected) {
        // Worker is selected - show building buttons
        if (workerButtons) workerButtons.classList.add('active');
    } else if (game.selectedTurret && game.selectedTurret.isSelected) {
        // Turret is selected - show upgrade button
        if (turretButtons) turretButtons.classList.add('active');
    } else if (game.selectedMissileLauncher && game.selectedMissileLauncher.isSelected) {
        // Missile Launcher is selected - show upgrade button
        if (missileLauncherButtons) missileLauncherButtons.classList.add('active');
    } else {
        // Nothing relevant selected - show empty buttons
        if (defaultButtons) defaultButtons.classList.add('active');
    }
    
    // Update button states (enabled/disabled) based on mineral availability
    try {
        updateButtonStates(game);
    } catch (err) {
        console.warn('Could not update button states', err);
    }
} 
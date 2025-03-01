import { COSTS, UNIT_STATS } from '../utils/constants.js';
import { MilestoneSystem } from './MilestoneSystem.js';

export class UISystem {
    static draw(game) {
        const ctx = game.ctx;
        
        // Draw the main HUD containers
        UISystem.drawHUDBackground(ctx, game, true); // Resource panel
        UISystem.drawHUDBackground(ctx, game, false); // Milestone panel
        
        // Draw resource panel
        UISystem.drawResourcePanel(ctx, game);
        
        // Draw milestone panel
        UISystem.drawMilestonePanel(ctx, game);
        
        // Draw wave info
        UISystem.drawWaveInfo(ctx, game);

        // Draw warning message if exists
        UISystem.drawWarningMessage(ctx, game);
        
        // Update info panel with selected entity details
        UISystem.updateInfoPanel(game);

        // Draw game over or victory screen
        if (game.gameOver) {
            UISystem.drawEndScreen(ctx, game);
        }
        
        // Draw control group indicators
        UISystem.drawControlGroupIndicators(ctx, game);
    }

    static drawHUDBackground(ctx, game, isResourcePanel) {
        // Configure panel dimensions
        const resourcePanelHeight = 100;
        const milestonePanelHeight = 160;
        const panelWidth = 300;
        
        const height = isResourcePanel ? resourcePanelHeight : milestonePanelHeight;
        const y = isResourcePanel ? 10 : resourcePanelHeight + 20;
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, y, panelWidth, height);
        gradient.addColorStop(0, 'rgba(16, 22, 26, 0.9)');
        gradient.addColorStop(1, 'rgba(16, 22, 26, 0.7)');
        
        ctx.fillStyle = gradient;
        
        // Draw rounded rectangle
        UISystem.roundRect(ctx, 10, y, panelWidth, height, 10);
        
        // Add tech border effect
        ctx.strokeStyle = 'rgba(77, 182, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, y + 5, panelWidth - 10, height - 10);
        
        // Add corner accents
        ctx.strokeStyle = '#4DB6FF';
        ctx.lineWidth = 2;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(10, y + 15);
        ctx.lineTo(10, y);
        ctx.lineTo(25, y);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(panelWidth - 15, y);
        ctx.lineTo(panelWidth + 10, y);
        ctx.lineTo(panelWidth + 10, y + 15);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(10, y + height - 15);
        ctx.lineTo(10, y + height);
        ctx.lineTo(25, y + height);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(panelWidth - 15, y + height);
        ctx.lineTo(panelWidth + 10, y + height);
        ctx.lineTo(panelWidth + 10, y + height - 15);
        ctx.stroke();
    }

    static drawResourcePanel(ctx, game) {
        const PANEL_X = 10;  // Starting X position of the panel
        const PANEL_PADDING = 25;
        const PANEL_WIDTH = 300;
        const AVAILABLE_WIDTH = PANEL_WIDTH - (PANEL_PADDING * 2);

        // Draw minerals label
        ctx.fillStyle = '#4DB6FF';
        ctx.font = 'bold 20px "Orbitron", sans-serif';
        const mineralsLabel = 'MINERALS';
        const mineralsLabelX = PANEL_X + PANEL_PADDING + 100
        ctx.fillText(mineralsLabel, mineralsLabelX, 45);
        
        // Draw crystal icon on the right side
        UISystem.drawCrystalIcon(ctx, PANEL_X + PANEL_WIDTH - PANEL_PADDING - 25, 60);
        
        // Draw mineral count with more space
        ctx.fillStyle = '#7FDBFF';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        const mineralsText = `${Math.round(game.minerals)}`;
        const mineralsX = mineralsLabelX;
        ctx.fillText(mineralsText, mineralsX, 80);
        
        // Draw collection rate indicator with proper spacing
        ctx.fillStyle = '#45A5F5';
        ctx.font = '14px "Orbitron", sans-serif';
        const collectionRate = game.workers.length * 10;
        const rateText = `+${collectionRate}/min`;
        const mineralsMetrics = ctx.measureText(mineralsText);
        const rateX = mineralsX + mineralsMetrics.width + 100;
        ctx.fillText(rateText, rateX, 80);
    }

    static drawMilestonePanel(ctx, game) {
        if (!game.milestoneSystem) return;

        const PANEL_X = 10;  // Starting X position of the panel
        const PANEL_PADDING = 25;
        const PANEL_WIDTH = 300;
        const AVAILABLE_WIDTH = PANEL_WIDTH - (PANEL_PADDING * 2);
        const CHECKBOX_SIZE = 16;
        const CHECKBOX_TEXT_SPACING = 15;
        const LINE_HEIGHT = 25;
        const RESOURCE_PANEL_HEIGHT = 100;
        const PANEL_GAP = 20;

        const phase = game.milestoneSystem.currentPhase;
        const currentPhase = game.milestoneSystem.MILESTONES[phase];
        
        if (!currentPhase) return; // Safety check
        
        // Calculate the base Y position relative to the milestone panel's position
        const panelY = RESOURCE_PANEL_HEIGHT + PANEL_GAP;
        const baseY = panelY + 35; // Add padding from the top of the panel
        
        // Draw phase name
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px "Orbitron", sans-serif';
        const phaseName = currentPhase.name;
        const phaseNameX = PANEL_X + PANEL_PADDING +100;
        ctx.fillText(phaseName, phaseNameX, baseY);
        
        // Draw goals with checkboxes
        currentPhase.goals.forEach((goal, index) => {
            const y = baseY + 30 + (index * LINE_HEIGHT);
            const completed = game.milestoneSystem.completedMilestones.has(goal.id);
            
            // Draw checkbox
            const checkboxX = PANEL_X + PANEL_PADDING;
            const checkboxY = y - 12;
            ctx.strokeStyle = completed ? '#4CAF50' : '#7FDBFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(checkboxX, checkboxY, CHECKBOX_SIZE, CHECKBOX_SIZE);
            
            if (completed) {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(checkboxX + 3, checkboxY + 3, CHECKBOX_SIZE - 6, CHECKBOX_SIZE - 6);
            }
            
            // Draw goal text with proper spacing and wrapping
            ctx.fillStyle = completed ? '#4CAF50' : '#7FDBFF';
            ctx.font = '14px "Orbitron", sans-serif';
            const textX = checkboxX + CHECKBOX_SIZE + CHECKBOX_TEXT_SPACING +100;
            const maxTextWidth = PANEL_WIDTH - (PANEL_PADDING * 2) - (CHECKBOX_SIZE + CHECKBOX_TEXT_SPACING + 10);
            
            // Get the description text, handling both static and dynamic descriptions
            let displayText = typeof goal.description === 'function' ? goal.description() : goal.description;
            
            // Measure and truncate text if necessary
            const metrics = ctx.measureText(displayText);
            if (metrics.width > maxTextWidth) {
                while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 0) {
                    displayText = displayText.slice(0, -1);
                }
                displayText += '...';
            }
            
            ctx.fillText(displayText, textX, y);
        });
    }

    static drawWaveInfo(ctx, game) {
        const PANEL_PADDING = 20;
        const waveWidth = 200;
        const waveHeight = 80;
        const x = game.canvas.width - waveWidth - 10;
        
        // Wave background
        const gradient = ctx.createLinearGradient(x, 0, x + waveWidth, waveHeight);
        gradient.addColorStop(0, 'rgba(16, 22, 26, 0.9)');
        gradient.addColorStop(1, 'rgba(16, 22, 26, 0.7)');
        
        ctx.fillStyle = gradient;
        UISystem.roundRect(ctx, x, 10, waveWidth, waveHeight, 10);
        
        // Wave text
        ctx.fillStyle = '#FF5252';
        ctx.font = 'bold 18px "Orbitron", sans-serif';
        const waveText = 'WAVE';
        const waveTextX = x + PANEL_PADDING +25;
        ctx.fillText(waveText, waveTextX, 35);
        
        // Wave number
        ctx.fillStyle = '#FF7070';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        const waveNumber = game.wave.toString();
        const waveNumberX = x + PANEL_PADDING + waveNumber.length * 10;
        ctx.fillText(waveNumber, waveNumberX, 70);
        
        // Draw wave progress
        const timeInWave = Date.now() - game.waveStartTime;
        const waveProgress = Math.min(timeInWave / game.spawnInterval, 1);
        
        // Progress bar background
        const progressBarX = x + PANEL_PADDING + 80;
        ctx.fillStyle = 'rgba(255, 82, 82, 0.2)';
        UISystem.roundRect(ctx, progressBarX, 30, 80, 10, 5);
        
        // Progress bar fill
        ctx.fillStyle = '#FF5252';
        UISystem.roundRect(ctx, progressBarX, 30, 80 * waveProgress, 10, 5);
    }

    static drawWarningMessage(ctx, game) {
        if (game.warningMessage) {
            const textMetrics = ctx.measureText(game.warningMessage);
            const x = (game.canvas.width - textMetrics.width) / 2;
            const y = game.canvas.height / 2;
            
            // Draw warning background
            ctx.fillStyle = 'rgba(16, 22, 26, 0.9)';
            UISystem.roundRect(ctx, x - 20, y - 40, textMetrics.width + 40, 60, 10);
            
            // Draw warning border
            ctx.strokeStyle = '#FF5252';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 15, y - 35, textMetrics.width + 30, 50);
            
            // Draw warning text
            ctx.fillStyle = '#FF7070';
            ctx.font = 'bold 32px "Orbitron", sans-serif';
            ctx.fillText(game.warningMessage, x, y);
        }
    }

    static drawEndScreen(ctx, game) {
        // Fade background
        ctx.fillStyle = 'rgba(16, 22, 26, 0.95)';
        ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        
        // Draw title
        ctx.fillStyle = game.victory ? '#4CAF50' : '#FF5252';
        ctx.font = 'bold 64px "Orbitron", sans-serif';
        const mainText = game.victory ? 'VICTORY' : 'GAME OVER';
        const textMetrics = ctx.measureText(mainText);
        const x = (game.canvas.width - textMetrics.width) / 2 +200;
        ctx.fillText(mainText, x, game.canvas.height / 2 - 100);
        
        // Draw stats panel
        const stats = [
            { label: 'MINERALS COLLECTED', value: Math.floor(game.totalMineralsCollected) },
            { label: 'WAVES SURVIVED', value: game.wave },
            { label: 'TIME SURVIVED', value: `${Math.floor((Date.now() - game.gameStartTime) / 1000)}s` },
            { label: 'WORKERS BUILT', value: game.workers.length },
            { label: 'TURRETS BUILT', value: game.turrets.length },
            { label: 'BATTERIES BUILT', value: game.batteries.length }
        ];
        
        const startY = game.canvas.height / 2 - 50;
        stats.forEach((stat, index) => {
            const y = startY + index * 40;
            
            // Draw stat background
            ctx.fillStyle = 'rgba(77, 182, 255, 0.1)';
            UISystem.roundRect(ctx, game.canvas.width / 2 - 200, y, 400, 30, 5);
            
            // Draw stat label
            ctx.fillStyle = '#7FDBFF';
            ctx.font = '18px "Orbitron", sans-serif';
            ctx.fillText(stat.label, game.canvas.width / 2 , y + 22);
            
            // Draw stat value
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px "Orbitron", sans-serif';
            ctx.fillText(stat.value.toString(), game.canvas.width / 2 + 150, y + 22);
        });
        
        // Draw restart button
        const buttonWidth = 250;
        const buttonHeight = 60;
        const buttonX = (game.canvas.width - buttonWidth) / 2;
        const buttonY = startY + stats.length * 40 + 30;
        
        // Button background
        const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonWidth, buttonY + buttonHeight);
        buttonGradient.addColorStop(0, '#2196F3');
        buttonGradient.addColorStop(1, '#1976D2');
        ctx.fillStyle = buttonGradient;
        UISystem.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 10);
        
        // Button text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px "Orbitron", sans-serif';
        const buttonText = 'PLAY AGAIN';
        const buttonTextMetrics = ctx.measureText(buttonText);
        const buttonTextX = buttonX + (buttonWidth - buttonTextMetrics.width) / 2 +100;
        ctx.fillText(buttonText, buttonTextX, buttonY + 38);
        
        // Add button hover effect and click handler
        if (!game.restartButtonListener) {
            game.canvas.addEventListener('click', function(event) {
                if (game.gameOver) {
                    const rect = game.canvas.getBoundingClientRect();
                    const clickX = event.clientX - rect.left;
                    const clickY = event.clientY - rect.top;
                    
                    if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                        clickY >= buttonY && clickY <= buttonY + buttonHeight) {
                        game.reset();
                    }
                }
            });
            game.restartButtonListener = true;
        }
    }

    static roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    static drawCrystalIcon(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.5, 0.5);
        
        // Crystal shape
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(15, 0);
        ctx.lineTo(0, 20);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        
        // Crystal gradient
        const gradient = ctx.createLinearGradient(-15, -20, 15, 20);
        gradient.addColorStop(0, '#7FDBFF');
        gradient.addColorStop(0.5, '#4DB6FF');
        gradient.addColorStop(1, '#2196F3');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Crystal outline
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shine effect
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(0, -5);
        ctx.lineTo(5, -10);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();
        
        ctx.restore();
    }

    static updateGameInfo(game) {
        let gameInfo = document.querySelector('.game-info');
        if (!gameInfo) {
            gameInfo = document.createElement('div');
            gameInfo.className = 'game-info';
            document.body.appendChild(gameInfo);
        }
        
        gameInfo.innerHTML = `
            <div class="minerals">💎 Minerals: ${Math.round(game.minerals)}</div>
            <div class="base-hp">❤️ Base HP: ${Math.round(game.base.hp)}/${game.base.maxHp}</div>
            <div class="wave">🌊 Wave: ${game.wave}</div>
            ${game.isPaused ? '<div style="color: #ff9800">⏸️ PAUSED</div>' : ''}
        `;
    }

    static updateButtons(game) {
        const workerBtn = document.querySelector('.worker-btn');
        const turretBtn = document.querySelector('.turret-btn');
        const batteryBtn = document.querySelector('.battery-btn');
        const upgradeBtn = document.querySelector('.upgrade-btn');

        workerBtn.disabled = game.minerals < COSTS.WORKER;
        turretBtn.disabled = game.minerals < COSTS.TURRET;
        batteryBtn.disabled = game.minerals < COSTS.BATTERY;
        
        if (game.selectedTurret) {
            const upgradeCost = 150 * Math.pow(2, game.selectedTurret.level - 1);
            upgradeBtn.classList.remove('hidden');
            upgradeBtn.disabled = game.minerals < upgradeCost;
            upgradeBtn.textContent = `Upgrade Turret (${upgradeCost} 💎)`;
        } else {
            upgradeBtn.classList.add('hidden');
        }
    }

    static drawWarningMessage(game) {
        if (game.warningMessage) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'warning-message';
            warningDiv.textContent = game.warningMessage;
            document.body.appendChild(warningDiv);
            setTimeout(() => warningDiv.remove(), 2000);
            game.warningMessage = '';
        }
    }

    // New method to get control group information for an entity
    static getControlGroupInfo(entity) {
        if (!window.controlGroups) return '';
        
        // Find which control groups this entity belongs to
        const groups = [];
        for (let i = 1; i <= 9; i++) {
            const group = window.controlGroups[i];
            if (group) {
                for (let j = 0; j < group.length; j++) {
                    const item = group[j];
                    if (item.entity === entity) {
                        groups.push(i);
                        break;
                    }
                }
            }
        }
        
        if (groups.length === 0) {
            return '<div style="font-style: italic; color: #999;">Not assigned to any control group</div>';
        }
        
        return `<div style="color: #4a9eff;">Control Group${groups.length > 1 ? 's' : ''}: ${groups.join(', ')}</div>`;
    }

    // New method to get control group information for multiple entities
    static getMultipleControlGroupInfo(entities) {
        if (!window.controlGroups || !entities || entities.length === 0) return '';
        
        // Count how many entities are in each group
        const groupCounts = {};
        for (let i = 1; i <= 9; i++) {
            groupCounts[i] = 0;
        }
        
        // For each entity, check which groups it belongs to
        entities.forEach(entity => {
            for (let i = 1; i <= 9; i++) {
                const group = window.controlGroups[i];
                if (group) {
                    for (let j = 0; j < group.length; j++) {
                        const item = group[j];
                        if (item.entity === entity) {
                            groupCounts[i]++;
                            break;
                        }
                    }
                }
            }
        });
        
        // Filter out groups with no entities
        const activeGroups = Object.entries(groupCounts)
            .filter(([_, count]) => count > 0)
            .map(([group, count]) => `${group} (${count}/${entities.length})`);
        
        if (activeGroups.length === 0) {
            return '<div style="font-style: italic; color: #999;">Not assigned to any control group</div>';
        }
        
        return `<div style="color: #4a9eff;">Control Group${activeGroups.length > 1 ? 's' : ''}: ${activeGroups.join(', ')}</div>`;
    }

    // Update the updateInfoPanel method to include control group information
    static updateInfoPanel(game) {
        const portrait = document.getElementById('unit-portrait');
        const name = document.getElementById('unit-name');
        const stats = document.getElementById('unit-stats');
        const actionButtons = document.getElementById('action-buttons');
        
        // Default button layout for building
        let defaultButtons = `
            <button id="buildWorkerButton" onclick="game.buildWorker()" class="worker-btn" data-shortcut="Q" data-icon="👷" ${game.minerals < COSTS.WORKER ? 'disabled' : ''}>Worker</button>
            <button id="buildTurretButton" onclick="game.buildTurret()" class="turret-btn" data-shortcut="T" data-icon="🔫" ${game.minerals < COSTS.TURRET ? 'disabled' : ''}>Turret</button>
            <button id="buildBatteryButton" onclick="game.buildBattery()" class="battery-btn" data-shortcut="B" data-icon="🛡️" ${game.minerals < COSTS.BATTERY ? 'disabled' : ''}>Shield</button>
            <button onclick="game.toggleSound()" class="sound-btn" data-shortcut="M" data-icon="🔊">Sound</button>
            
            <!-- Empty slots for StarCraft-like grid -->
            <button style="visibility:hidden"></button>
            <button style="visibility:hidden"></button>
            <button style="visibility:hidden"></button>
            <button style="visibility:hidden"></button>
            <button style="visibility:hidden"></button>
        `;

        if (game.selectedBase) {
            // Base is selected
            portrait.innerHTML = '🏠';
            name.textContent = 'Command Center';
            
            // Get default mineral patch info
            const defaultPatch = game.base.defaultMineralPatch;
            const patchInfo = defaultPatch ? 
                `Default mineral patch: ${Math.round(defaultPatch.minerals)} minerals (${defaultPatch.workers} workers)` : 
                'No default mineral patch set (right-click a patch to set)';
            
            stats.innerHTML = `
                <div>HP: ${Math.round(game.base.hp)}/${game.base.maxHp}</div>
                <div>Status: ${game.base.hp < game.base.maxHp * 0.3 ? '🔴 Critical' : game.base.hp < game.base.maxHp * 0.7 ? '🟠 Damaged' : '🟢 Operational'}</div>
                <div style="margin-top: 10px; color: #4DB6FF;">Default Mineral Assignment:</div>
                <div>${defaultPatch ? `💎 ${Math.round(defaultPatch.minerals)} minerals available` : '❌ No default patch set'}</div>
                <div>${defaultPatch ? `👷 ${defaultPatch.workers} workers assigned` : ''}</div>
                <div style="font-style: italic; margin-top: 5px; font-size: 0.9em;">Right-click on any mineral patch to set it as default for new workers</div>
                ${UISystem.getControlGroupInfo(game.base)}
                <div style="margin-top: 10px; font-style: italic; font-size: 0.9em;">Tip: Ctrl+[1-9] to assign to control group, [1-9] to select</div>
            `;
            
            // Show base-specific action buttons with StarCraft-style grid
            actionButtons.innerHTML = `
                <button id="buildWorkerButton" onclick="game.buildWorker()" class="worker-btn" data-shortcut="Q" data-icon="👷" ${game.minerals < COSTS.WORKER ? 'disabled' : ''}>
                    Worker
                </button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button onclick="game.toggleSound()" class="sound-btn" data-shortcut="M" data-icon="🔊">Sound</button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
            `;
        }
        else if (game.selectedTurret) {
            // Turret is selected
            portrait.innerHTML = '🔫';
            name.textContent = `Defense Turret Lvl ${game.selectedTurret.level}`;
            
            const upgradeCost = 150 * Math.pow(2, game.selectedTurret.level - 1);
            stats.innerHTML = `
                <div>HP: ${Math.round(game.selectedTurret.hp)}/${game.selectedTurret.maxHp}</div>
                <div>Damage: ${game.selectedTurret.damage.toFixed(2)}</div>
                <div>Range: ${game.selectedTurret.range.toFixed(2)}</div>
                <div>Fire Rate: ${(1000 / game.selectedTurret.fireRate).toFixed(2)} shots/sec</div>
                ${UISystem.getControlGroupInfo(game.selectedTurret)}
                <div style="margin-top: 10px; font-style: italic; font-size: 0.9em;">Tip: Ctrl+[1-9] to assign to control group, [1-9] to select</div>
            `;
            
            // Show turret-specific action buttons with StarCraft-style grid
            actionButtons.innerHTML = `
                <button onclick="game.upgradeTurret()" class="upgrade-btn" data-shortcut="U" data-icon="⬆️" ${game.minerals < upgradeCost ? 'disabled' : ''}>
                    Upgrade
                </button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button onclick="game.toggleSound()" class="sound-btn" data-shortcut="M" data-icon="🔊">Sound</button>
                <!-- Empty slots for StarCraft-like grid -->
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
            `;
        }
        else if (game.selectedBattery) {
            // Battery is selected
            portrait.innerHTML = '🛡️';
            name.textContent = 'Shield Battery';
            stats.innerHTML = `
                <div>HP: ${Math.round(game.selectedBattery.hp)}/${game.selectedBattery.maxHp}</div>
                <div>Energy: ${Math.round(game.selectedBattery.energy)}/${UNIT_STATS.BATTERY.ENERGY}</div>
                <div>Range: ${game.selectedBattery.range.toFixed(2)}</div>
                <div>Healing: ${UNIT_STATS.BATTERY.HEAL_AMOUNT.toFixed(2)} HP per tick</div>
                <div>Status: ${game.selectedBattery.energy < 10 ? '🔴 Low Energy' : '🟢 Operational'}</div>
                ${UISystem.getControlGroupInfo(game.selectedBattery)}
                <div style="margin-top: 10px; font-style: italic; font-size: 0.9em;">Tip: Ctrl+[1-9] to assign to control group, [1-9] to select</div>
            `;
            // Battery is selected - only show sound button
            actionButtons.innerHTML = `
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button onclick="game.toggleSound()" class="sound-btn" data-shortcut="M" data-icon="🔊">Sound</button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
            `;
        }
        else if (game.selectedWorker) {
            // Worker is selected
            portrait.innerHTML = '👷';
            name.textContent = 'Worker';
            
            const workerStatus = game.selectedWorker.state === 'toBase' ? 'Returning to Base' :
                               game.selectedWorker.state === 'toMineral' ? 'Moving to Minerals' :
                               game.selectedWorker.state === 'mining' ? 'Mining' : 'Idle';
            
            // Check if multiple workers are selected
            const selectedWorkers = game.workers.filter(worker => worker.isSelected);
            const multipleSelected = selectedWorkers.length > 1;
            
            if (multipleSelected) {
                stats.innerHTML = `
                    <div>${selectedWorkers.length} Workers Selected</div>
                    <div>Right-click on a mineral patch to reassign all selected workers</div>
                    ${UISystem.getMultipleControlGroupInfo(selectedWorkers)}
                    <div style="margin-top: 10px; font-style: italic; font-size: 0.9em;">Tip: Ctrl+[1-9] to assign to control group, [1-9] to select</div>
                `;
            } else {
                stats.innerHTML = `
                    <div>HP: ${Math.round(game.selectedWorker.hp)}/${game.selectedWorker.maxHp}</div>
                    <div>Minerals: ${Math.round(game.selectedWorker.minerals)}/${game.selectedWorker.maxMinerals}</div>
                    <div>Status: ${workerStatus}</div>
                    <div>Right-click on a mineral patch to reassign</div>
                    ${UISystem.getControlGroupInfo(game.selectedWorker)}
                    <div style="margin-top: 10px; font-style: italic; font-size: 0.9em;">Tip: Ctrl+[1-9] to assign to control group, [1-9] to select</div>
                `;
            }
            
            // Show worker-specific action buttons with StarCraft-style grid
            actionButtons.innerHTML = `
                <button id="buildTurretButton" onclick="game.buildTurret()" class="turret-btn" data-shortcut="T" data-icon="🔫" ${game.minerals < COSTS.TURRET ? 'disabled' : ''}>
                    Turret
                </button>
                <button id="buildBatteryButton" onclick="game.buildBattery()" class="battery-btn" data-shortcut="B" data-icon="🛡️" ${game.minerals < COSTS.BATTERY ? 'disabled' : ''}>
                    Shield
                </button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button onclick="game.toggleSound()" class="sound-btn" data-shortcut="M" data-icon="🔊">Sound</button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
            `;
        }
        else if (game.selectedMineralPatch) {
            // Mineral patch is selected
            portrait.innerHTML = '💎';
            name.textContent = 'Mineral Patch';
            
            // Calculate minerals per minute based on number of workers
            const mineralsPerMinute = game.selectedMineralPatch.workers * 10;
            
            stats.innerHTML = `
                <div>Minerals: ${Math.round(game.selectedMineralPatch.minerals)}/${game.selectedMineralPatch.maxMinerals}</div>
                <div>Workers: ${game.selectedMineralPatch.workers}</div>
                <div>Mining rate: ${mineralsPerMinute.toFixed(2)} minerals/min</div>
                <div>Status: ${game.selectedMineralPatch.minerals < 1000 ? '🔴 Depleting' : '🟢 Abundant'}</div>
                <div>Right-click with workers selected to mine here</div>
            `;
            // Mineral patch is selected - only show sound button
            actionButtons.innerHTML = `
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button onclick="game.toggleSound()" class="sound-btn" data-shortcut="M" data-icon="🔊">Sound</button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
            `;
        }
        else if (game.selectedEnemy) {
            // Enemy is selected
            const enemy = game.selectedEnemy;
            
            // Different portrait icons for different enemy types
            const enemyPortraits = {
                'normal': '👾',
                'elite': '💀',
                'fast': '⚡',
                'tank': '🛡️',
                'boss': '👹'
            };
            portrait.innerHTML = enemyPortraits[enemy.type] || '👾';
            
            // Get the enemy name based on type
            const enemyNames = {
                'normal': 'Standard Enemy',
                'elite': 'Elite Enemy',
                'fast': 'Swift Striker',
                'tank': 'Heavy Tank',
                'boss': 'Boss Enemy'
            };
            name.textContent = enemyNames[enemy.type] || 'Enemy';
            
            stats.innerHTML = `
                <div>HP: ${Math.round(enemy.hp)}/${Math.round(enemy.maxHp)}</div>
                <div>Damage: ${enemy.damage.toFixed(2)}</div>
                <div>Speed: ${enemy.speed.toFixed(2)}</div>
                <div>Type: ${enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1)}</div>
                <div>Target: ${enemy.currentTarget ? 
                    (enemy.currentTarget === game.base ? 'Base' : 
                    game.turrets.includes(enemy.currentTarget) ? 'Turret' : 
                    game.batteries.includes(enemy.currentTarget) ? 'Battery' : 
                    game.workers.includes(enemy.currentTarget) ? 'Worker' : 'Unknown') : 'None'}</div>
            `;
            // Enemy is selected - only show sound button
            actionButtons.innerHTML = `
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button onclick="game.toggleSound()" class="sound-btn" data-shortcut="M" data-icon="🔊">Sound</button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
            `;
        }
        else {
            // Nothing selected
            portrait.innerHTML = '?';
            name.textContent = 'No Selection';
            stats.innerHTML = 'Select a unit, building, or resource to view information.';
            // Hide all buttons when nothing is selected
            actionButtons.innerHTML = `
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
                <button style="visibility:hidden"></button>
            `;
        }
        
        // Show costs in the button tooltips
        const workerBtn = document.querySelector('.worker-btn');
        const turretBtn = document.querySelector('.turret-btn');
        const batteryBtn = document.querySelector('.battery-btn');
        
        if (workerBtn) workerBtn.title = "Build Worker (50 💎) - Shortcut: Q";
        if (turretBtn) turretBtn.title = "Build Turret (100 💎) - Shortcut: T";
        if (batteryBtn) batteryBtn.title = "Build Shield Battery (150 💎) - Shortcut: B";
        
        // Update upgrade button if present
        const upgradeBtn = document.querySelector('.upgrade-btn');
        if (upgradeBtn && game.selectedTurret) {
            const upgradeCost = 150 * Math.pow(2, game.selectedTurret.level - 1);
            upgradeBtn.title = `Upgrade Turret (${upgradeCost} 💎) - Shortcut: U`;
        }
        
        // Ensure action buttons stay in the right position
        if (actionButtons) {
            actionButtons.style.position = 'fixed';
            actionButtons.style.bottom = '10px';
            actionButtons.style.right = '10px';
            actionButtons.style.zIndex = '100';
        }
    }

    // Add a method to draw control group indicators
    static drawControlGroupIndicators(ctx, game) {
        if (!window.controlGroups) return;
        
        // Draw control group indicators in the top-right corner
        const padding = 10;
        const size = 30;
        const spacing = 5;
        const startX = game.canvas.width - padding - (size * 5) - (spacing * 4);
        const startY = padding;
        
        // Draw background for all groups
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
            startX - padding,
            startY - padding,
            (size * 5) + (spacing * 4) + (padding * 2),
            (size * 2) + spacing + (padding * 2)
        );
        
        // Draw border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            startX - padding,
            startY - padding,
            (size * 5) + (spacing * 4) + (padding * 2),
            (size * 2) + spacing + (padding * 2)
        );
        
        // Draw each control group indicator
        for (let i = 1; i <= 9; i++) {
            const group = window.controlGroups[i];
            const hasEntities = group && group.length > 0;
            
            // Calculate position (1-5 on first row, 6-0 on second row)
            const row = i <= 5 ? 0 : 1;
            const col = i <= 5 ? i - 1 : i - 6;
            const x = startX + (col * (size + spacing));
            const y = startY + (row * (size + spacing));
            
            // Draw background
            ctx.fillStyle = hasEntities ? 'rgba(74, 158, 255, 0.3)' : 'rgba(50, 50, 50, 0.3)';
            ctx.fillRect(x, y, size, size);
            
            // Draw border
            ctx.strokeStyle = hasEntities ? '#4a9eff' : '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, size, size);
            
            // Draw number
            ctx.fillStyle = hasEntities ? '#ffffff' : '#999999';
            ctx.font = 'bold 16px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), x + size/2, y + size/2);
            
            // Draw count if there are entities
            if (hasEntities) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px "Orbitron", sans-serif';
                ctx.fillText(group.length.toString(), x + size - 5, y + size - 5);
            }
        }
        
        // Reset text alignment
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    // Add control group indicators to entities
    static drawControlGroupMarker(ctx, entity, x, y, size) {
        if (!window.controlGroups) return;
        
        // Find which control groups this entity belongs to
        const groups = [];
        for (let i = 1; i <= 9; i++) {
            const group = window.controlGroups[i];
            if (group) {
                for (let j = 0; j < group.length; j++) {
                    const item = group[j];
                    if (item.entity === entity) {
                        groups.push(i);
                        break;
                    }
                }
            }
        }
        
        if (groups.length === 0) return;
        
        // Draw control group indicator
        const indicatorSize = 14;
        const indicatorX = x - indicatorSize / 2;
        const indicatorY = y - size - indicatorSize - 5;
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(indicatorX + indicatorSize/2, indicatorY + indicatorSize/2, indicatorSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(indicatorX + indicatorSize/2, indicatorY + indicatorSize/2, indicatorSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw number (just show the first group if in multiple groups)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(groups[0].toString(), indicatorX + indicatorSize/2, indicatorY + indicatorSize/2);
        
        // Reset text alignment
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    static drawUI() {
        // ... existing code ...
    }
}

// Expose UISystem to the window object for access from other modules
window.UISystem = UISystem; 
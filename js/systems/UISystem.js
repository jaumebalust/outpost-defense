import { COSTS, UNIT_STATS, COMBAT, SCALE } from '../utils/constants.js';
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

        // Draw control group indicators
        UISystem.drawControlGroupIndicators(ctx, game);

        // Draw warning message if exists
        UISystem.drawWarningMessage(game);
        
        // Update info panel with selected entity details
        UISystem.updateInfoPanel(game);

        // Draw game over or victory screen
        if (game.gameOver) {
            UISystem.drawEndScreen(ctx, game);
        }
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
        const mineralsLabelX = PANEL_X + PANEL_PADDING + (15 * (SCALE / 2));
        ctx.fillText(mineralsLabel, mineralsLabelX, 45);
        
        // Draw crystal icon on the right side
        UISystem.drawCrystalIcon(ctx, PANEL_X + PANEL_WIDTH - PANEL_PADDING - 25, 60);
        
        // Draw mineral count with more space
        ctx.fillStyle = '#7FDBFF';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        const mineralsText = `${Math.round(game.minerals)}`;
        const mineralsX = mineralsLabelX;
        ctx.fillText(mineralsText, mineralsX, 80);
        

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
        const phaseNameX = PANEL_X + PANEL_PADDING + (15 * (SCALE / 2));
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
            const textX = checkboxX + CHECKBOX_SIZE + CHECKBOX_TEXT_SPACING;
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
        
        // Wave text - make position responsive to screen size
        ctx.fillStyle = '#FF5252';
        ctx.font = 'bold 18px "Orbitron", sans-serif';
        const waveText = 'WAVE';
        // Center the text in available space by accounting for SCALE
        const waveTextX = x + PANEL_PADDING * (SCALE / 2);
        ctx.fillText(waveText, waveTextX, 35);
        
        // Wave number - make position responsive to screen size
        ctx.fillStyle = '#FF7070';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        const waveNumber = game.wave.toString();
        // Adjust position based on SCALE
        const waveNumberX = x + PANEL_PADDING;
        ctx.fillText(waveNumber, waveNumberX, 70);
        
        // Draw wave progress
        const timeInWave = Date.now() - game.waveStartTime;
        const waveProgress = Math.min(timeInWave / game.spawnInterval, 1);
        
        // Progress bar background - adjust position based on SCALE
        const progressBarX = x + PANEL_PADDING + 80 * (SCALE / 2);
        ctx.fillStyle = 'rgba(255, 82, 82, 0.2)';
        UISystem.roundRect(ctx, progressBarX, 30, 80, 10, 5);
        
        // Progress bar fill
        ctx.fillStyle = '#FF5252';
        UISystem.roundRect(ctx, progressBarX, 30, 80 * waveProgress, 10, 5);
    }

    static drawWarningMessage(game) {
        if (game.warningMessage) {
            // Use the showWarning function from constants.js
            if (typeof window.showWarning === 'function') {
                window.showWarning(game.warningMessage);
            } else {
                // Fallback if showWarning isn't available
                // Get or create the notification container
                let container = document.querySelector('.notification-container');
                if (!container) {
                    container = document.createElement('div');
                    container.className = 'notification-container';
                    document.body.appendChild(container);
                }
                
                // Create the warning message
                const warningDiv = document.createElement('div');
                warningDiv.className = 'warning-message';
                warningDiv.textContent = game.warningMessage;
                
                // Add the warning to the container
                container.appendChild(warningDiv);
                
                // Remove this specific warning after animation completes
                setTimeout(() => {
                    if (warningDiv.parentNode === container) {
                        container.removeChild(warningDiv);
                    }
                    
                    // If no warnings left, remove the container
                    if (container.children.length === 0) {
                        document.body.removeChild(container);
                    }
                }, 2000);
            }
            
            // Reset the game's warning message
            game.warningMessage = '';
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
            ctx.fillText(stat.label, game.canvas.width / 2 -180 , y + 22);
            
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
        ctx.fillText(buttonText, buttonTextX-100, buttonY + 38);
        
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
        const missileLauncherBtn = document.querySelector('.missile-launcher-btn');
        const upgradeBtn = document.querySelector('.upgrade-btn');

        workerBtn.disabled = game.minerals < COSTS.WORKER;
        turretBtn.disabled = game.minerals < COSTS.TURRET;
        batteryBtn.disabled = game.minerals < COSTS.BATTERY;
        missileLauncherBtn.disabled = game.minerals < COSTS.MISSILE_LAUNCHER;
        
        if (game.selectedTurret) {
            const upgradeCost = 150 * Math.pow(2, game.selectedTurret.level - 1);
            upgradeBtn.classList.remove('hidden');
            upgradeBtn.disabled = game.minerals < upgradeCost;
            upgradeBtn.textContent = `Upgrade Turret (${upgradeCost} 💎)`;
        } else if (game.selectedMissileLauncher) {
            const upgradeCost = 150 * Math.pow(2, game.selectedMissileLauncher.level - 1);
            upgradeBtn.classList.remove('hidden');
            upgradeBtn.disabled = game.minerals < upgradeCost;
            upgradeBtn.textContent = `Upgrade Missile Launcher (${upgradeCost} 💎)`;
        } else {
            upgradeBtn.classList.add('hidden');
        }
    }

    static getControlGroupInfo(entity) {
        if (!window.controlGroups) return '';
        
        // Find which control groups this entity belongs to
        const groups = [];
        for (let i = 1; i <= 9; i++) {
            if (window.controlGroups[i] && window.controlGroups[i].some(e => e.entity && e.entity.id === entity.id)) {
                groups.push(i);
            }
        }
        
        if (groups.length === 0) {
            return '<div class="control-group-info">No control group assigned</div>';
        }
        
        const groupText = groups.length > 1 ? 'Control Groups' : 'Control Group';
        let html = `<div class="control-group-info">
            <span style="color:#a0d0ff">${groupText}:</span> `;
        
        // Create styled control group indicators
        groups.forEach((group, index) => {
            if (index > 0) html += ' ';
            html += `<span style="display:inline-block; width:18px; height:16px; margin:0 2px; 
                background:linear-gradient(to bottom, #0a4a96, #042c5c); 
                border:1px solid #1d6eb8; border-radius:2px; text-align:center; 
                color:#c8e0ff; font-size:11px; line-height:16px;
                box-shadow:0 0 3px rgba(0, 60, 120, 0.5); text-shadow:0 0 2px rgba(0, 100, 255, 0.7);">${group}</span>`;
        });
        
        html += '</div>';
        return html;
    }

    static getMultipleControlGroupInfo(entities) {
        if (!window.controlGroups || !entities || entities.length === 0) return '';
        
        // Count how many entities are in each control group
        const groupCounts = {};
        for (let i = 1; i <= 9; i++) {
            if (window.controlGroups[i]) {
                const count = entities.filter(entity => 
                    window.controlGroups[i].some(e => e.entity && e.entity.id === entity.id)
                ).length;
                
                if (count > 0) {
                    groupCounts[i] = count;
                }
            }
        }
        
        if (Object.keys(groupCounts).length === 0) {
            return '<div class="control-group-info">No control groups assigned</div>';
        }
        
        let html = '<div class="control-group-info"><span style="color:#a0d0ff">Control Group Assignments:</span><div style="margin-top:5px">';
        
        // Create control group assignment display with styled indicators
        for (const [group, count] of Object.entries(groupCounts)) {
            html += `
                <div style="display:inline-block; margin-right:10px; margin-bottom:4px">
                    <span style="display:inline-block; width:18px; height:16px;
                        background:linear-gradient(to bottom, #0a4a96, #042c5c); 
                        border:1px solid #1d6eb8; border-radius:2px; text-align:center; 
                        color:#c8e0ff; font-size:11px; line-height:16px;
                        box-shadow:0 0 3px rgba(0, 60, 120, 0.5); text-shadow:0 0 2px rgba(0, 100, 255, 0.7);">${group}</span>
                    <span style="margin-left:4px">${count} unit${count > 1 ? 's' : ''}</span>
                </div>`;
        }
        
        html += '</div></div>';
        
        return html;
    }

    static updateInfoPanel(game) {
        const infoPanel = document.getElementById('info-panel');
        if (!infoPanel) return;
        
        // Default portrait icon
        let portraitIcon = '?';
        let html = '';
        
        // Check what's selected
        if (game.selectedBase && game.selectedBase.isSelected) {
            portraitIcon = '🏢';
            // Base is selected
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Command Center</div>
                    <div class="unit-stats">
                        <p><span style="color:#8bb8ff">HP:</span> ${Math.floor(game.selectedBase.hp)}/${game.selectedBase.maxHp}</p>
                        <p><span style="color:#8bb8ff">Workers:</span> ${game.workers.length}</p>
                        <p><span style="color:#8bb8ff">Minerals:</span> ${game.minerals}</p>
                    </div>
                    <div class="action-buttons">
                        <button id="buildWorkerButton" class="action-btn worker-btn ${game.minerals < COSTS.WORKER ? 'disabled' : ''}" 
                            onclick="window.toggleBuilding(window.game, 'worker')">
                            Build Worker (${COSTS.WORKER})
                        </button>
                    </div>
                </div>
            `;
        } else if (game.selectedWorker && game.selectedWorker.isSelected) {
            portraitIcon = '👷';
            // Worker is selected
            const worker = game.selectedWorker;
            const assignedPatch = worker.targetPatch ? 
                `Mining minerals: ${worker.targetPatch.minerals}` : 
                'Not assigned to a mineral patch';
            
            let mineralsCarried = '';
            if (worker.minerals > 0) {
                mineralsCarried = `<p><span style="color:#8bb8ff">Carrying:</span> <span style="color:#00ccff">${worker.minerals}/${worker.maxMinerals}</span> minerals</p>`;
            }
            
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Worker Unit</div>
                    <div class="unit-stats">
                        <p><span style="color:#8bb8ff">HP:</span> ${Math.floor(worker.hp)}/${worker.maxHp}</p>
                        ${mineralsCarried}
                        <p><span style="color:#8bb8ff">Status:</span> ${worker.state.charAt(0).toUpperCase() + worker.state.slice(1)}</p>
                        <p style="font-size:11px">${assignedPatch}</p>
                    </div>
                    ${window.controlGroups ? this.getControlGroupInfo(worker) : ''}
                </div>
            `;
        } else if (game.selectedTurret && game.selectedTurret.isSelected) {
            portraitIcon = '🔫';
            // Turret is selected
            const turret = game.selectedTurret;
            const upgradeCost = 150 * Math.pow(2, turret.level - 1);
            
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Defensive Turret <span style="color:#4eccff">Lvl ${turret.level}</span></div>
                    <div class="unit-stats">
                        <p><span style="color:#8bb8ff">HP:</span> ${Math.floor(turret.hp)}/${turret.maxHp}</p>
                        <p><span style="color:#8bb8ff">Damage:</span> ${turret.damage} <span style="opacity:0.7">per hit</span></p>
                        <p><span style="color:#8bb8ff">Range:</span> ${turret.range} <span style="opacity:0.7">units</span></p>
                        <p><span style="color:#8bb8ff">Fire Rate:</span> ${(1000 / turret.fireRate).toFixed(1)} <span style="opacity:0.7">shots/sec</span></p>
                    </div>
                    <div class="action-buttons">
                        <button id="upgradeTurretButton" class="action-btn upgrade-btn ${game.minerals < upgradeCost ? 'disabled' : ''}" 
                            onclick="window.upgradeTurret(window.game)">
                            Upgrade (${upgradeCost})
                        </button>
                    </div>
                    ${window.controlGroups ? this.getControlGroupInfo(turret) : ''}
                </div>
            `;
        } else if (game.selectedBattery && game.selectedBattery.isSelected) {
            portraitIcon = '🛡️';
            // Battery is selected
            const battery = game.selectedBattery;
            
            const energyPercent = Math.floor((battery.energy / battery.maxEnergy) * 100);
            const energyColor = energyPercent > 70 ? '#00ff00' : (energyPercent > 30 ? '#ffff00' : '#ff6600');
            
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Shield Battery</div>
                    <div class="unit-stats">
                        <p><span style="color:#8bb8ff">HP:</span> ${Math.floor(battery.hp)}/${battery.maxHp}</p>
                        <p><span style="color:#8bb8ff">Energy:</span> <span style="color:${energyColor}">${Math.floor(battery.energy)}/${battery.maxEnergy}</span></p>
                        <p><span style="color:#8bb8ff">Range:</span> ${battery.range} <span style="opacity:0.7">units</span></p>
                        <p><span style="color:#8bb8ff">Heal Rate:</span> ${battery.healAmount} <span style="opacity:0.7">HP/tick</span></p>
                    </div>
                    ${window.controlGroups ? this.getControlGroupInfo(battery) : ''}
                </div>
            `;
        } else if (game.selectedMissileLauncher && game.selectedMissileLauncher.isSelected) {
            portraitIcon = '🚀';
            // Missile Launcher is selected
            const missileLauncher = game.selectedMissileLauncher;
            const upgradeCost = 150 * Math.pow(2, missileLauncher.level - 1);
            
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Missile Launcher <span style="color:#4eccff">Lvl ${missileLauncher.level}</span></div>
                    <div class="unit-stats">
                        <p><span style="color:#8bb8ff">HP:</span> ${Math.floor(missileLauncher.hp)}/${missileLauncher.maxHp}</p>
                        <p><span style="color:#8bb8ff">Damage:</span> ${missileLauncher.damage}</p>
                        <p><span style="color:#ff9955">vs Boss:</span> ${missileLauncher.damage * COMBAT.DAMAGE_MULTIPLIER.BOSS}</p>
                        <p><span style="color:#8bb8ff">Range:</span> ${missileLauncher.range}</p>
                    </div>
                    <div class="action-buttons">
                        <button id="upgradeMissileLauncherButton" class="action-btn upgrade-btn ${game.minerals < upgradeCost ? 'disabled' : ''}" 
                            onclick="window.upgradeTurret(window.game)">
                            Upgrade (${upgradeCost})
                        </button>
                    </div>
                    ${window.controlGroups ? this.getControlGroupInfo(missileLauncher) : ''}
                </div>
            `;
        } else if (game.selectedMineralPatch && game.selectedMineralPatch.isSelected) {
            portraitIcon = '💎';
            // Mineral patch is selected
            const patch = game.selectedMineralPatch;
            const percentLeft = Math.floor((patch.minerals / patch.maxMinerals) * 100);
            const mineralColor = percentLeft > 70 ? '#00ccff' : (percentLeft > 30 ? '#0099cc' : '#006699');
            const workersOnPatch = game.workers.filter(w => w.targetPatch === patch).length;
            
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Mineral Deposit</div>
                    <div class="unit-stats">
                        <p><span style="color:#8bb8ff">Resources:</span> <span style="color:${mineralColor}">${patch.minerals}</span>/<span style="opacity:0.7">${patch.maxMinerals}</span></p>
                        <p><span style="color:#8bb8ff">Workers:</span> ${workersOnPatch} mining</p>
                        <p><span style="color:#8bb8ff">Status:</span> ${percentLeft > 0 ? 'Active' : 'Depleted'}</p>
                    </div>
                </div>
            `;
        } else if (game.selectedEnemy && game.selectedEnemy.isSelected) {
            // Enemy is selected - assign appropriate icon based on enemy type
            switch(game.selectedEnemy.type) {
                case 'fast':
                    portraitIcon = '⚡'; // Fast enemy icon
                    break;
                case 'tank':
                    portraitIcon = '🛡️'; // Tank enemy icon
                    break;
                case 'elite':
                    portraitIcon = '⭐'; // Elite enemy icon
                    break;
                case 'boss':
                    portraitIcon = '👑'; // Boss enemy icon
                    break;
                default: // normal
                    portraitIcon = '👾'; // Normal enemy icon
            }
            
            const enemy = game.selectedEnemy;
            const healthPercent = Math.floor((enemy.hp / enemy.maxHp) * 100);
            const healthColor = healthPercent > 70 ? '#00ff00' : (healthPercent > 30 ? '#ffff00' : '#ff6600');
            
            // Format enemy type name with proper capitalization
            const typeFormatted = enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1);
            
            // Create specific descriptions based on enemy type
            let enemyDescription = '';
            switch(enemy.type) {
                case 'fast':
                    enemyDescription = '<span style="color:#ff6b6b">Quick and agile unit with low HP</span>';
                    break;
                case 'tank':
                    enemyDescription = '<span style="color:#8b0000">Heavily armored unit with high HP</span>';
                    break;
                case 'elite':
                    enemyDescription = '<span style="color:#ffff00">Enhanced enemy with improved stats</span>';
                    break;
                case 'boss':
                    enemyDescription = '<span style="color:#ff44aa">Powerful enemy with massive health pool</span>';
                    break;
                default: // normal
                    enemyDescription = '<span style="color:#ff0000">Standard enemy unit</span>';
            }
            
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">${typeFormatted} Enemy</div>
                    <div class="unit-stats">
                        <p style="font-size:11px;margin-bottom:8px">${enemyDescription}</p>
                        <p><span style="color:#8bb8ff">HP:</span> <span style="color:${healthColor}">${Math.floor(enemy.hp)}</span>/<span style="opacity:0.8">${Math.floor(enemy.maxHp)}</span></p>
                        <p><span style="color:#8bb8ff">Damage:</span> <span style="color:#ff9955">${enemy.damage}</span> <span style="opacity:0.7">per hit</span></p>
                        <p><span style="color:#8bb8ff">Attack Speed:</span> <span style="color:#ff9955">${(1000 / enemy.attackSpeed).toFixed(1)}</span> <span style="opacity:0.7">hits/sec</span></p>
                        <p><span style="color:#8bb8ff">Move Speed:</span> <span style="color:#4eccff">${enemy.speed.toFixed(1)}</span></p>
                        <p><span style="color:#8bb8ff">Wave:</span> <span style="color:#ffff00">${game.wave}</span></p>
                    </div>
                </div>
            `;
        } else if (game.selectedEntities && game.selectedEntities.length > 0) {
            portraitIcon = '⚙️';
            // Multiple entities selected
            const workers = game.selectedEntities.filter(e => e instanceof Worker);
            const turrets = game.selectedEntities.filter(e => e instanceof Turret && !(e instanceof MissileLauncher));
            const batteries = game.selectedEntities.filter(e => e instanceof Battery);
            const missileLaunchers = game.selectedEntities.filter(e => e instanceof MissileLauncher);
            
            let unitDetails = '';
            if (workers.length > 0) {
                unitDetails += `<p><span style="color:#8bb8ff">Workers:</span> ${workers.length}</p>`;
            }
            if (turrets.length > 0) {
                unitDetails += `<p><span style="color:#8bb8ff">Turrets:</span> ${turrets.length}</p>`;
            }
            if (batteries.length > 0) {
                unitDetails += `<p><span style="color:#8bb8ff">Batteries:</span> ${batteries.length}</p>`;
            }
            if (missileLaunchers.length > 0) {
                unitDetails += `<p><span style="color:#8bb8ff">Missile Launchers:</span> ${missileLaunchers.length}</p>`;
            }
            
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Multiple Units Selected</div>
                    <div class="unit-stats">
                        ${unitDetails}
                        <p><span style="color:#8bb8ff">Total:</span> ${game.selectedEntities.length} units</p>
                    </div>
                    ${window.controlGroups ? this.getMultipleControlGroupInfo(game.selectedEntities) : ''}
                </div>
            `;
        } else {
            portraitIcon = '🎮';
            // Nothing selected - show game info
            html = `
                <div class="unit-portrait">${portraitIcon}</div>
                <div class="unit-info">
                    <div class="unit-name">Base Operations</div>
                    <div class="unit-stats">
                        <p><span style="color:#8bb8ff">Minerals:</span> <span style="color:#00ccff">${game.minerals}</span></p>
                        <p><span style="color:#8bb8ff">Workers:</span> ${game.workers.length}</p>
                        <p><span style="color:#8bb8ff">Defenses:</span> ${game.turrets.length + game.batteries.length + (game.missileLaunchers ? game.missileLaunchers.length : 0)}</p>
                        <p><span style="color:#ff9955">Wave:</span> ${game.wave}</p>
                    </div>
                </div>
            `;
        }
        
        infoPanel.innerHTML = html;
    }

    static drawControlGroupIndicators(ctx, game) {
        if (!window.controlGroups) return;
        
        // Get wave panel dimensions to avoid overlap
        const waveWidth = 200;
        const waveHeight = 80;
        const wavePanelBottom = 10 + waveHeight; // 10px is the top padding of wave panel
        
        // Draw control group indicators on the right side, below the wave panel
        const padding = 10;
        const size = 30;
        const spacing = 5;
        const startX = game.canvas.width - padding - (size * 5) - (spacing * 4);
        
        // Position below the wave panel with some extra spacing
        const startY = wavePanelBottom + padding * 2;
        
        // Draw background for all groups
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(
            startX - padding,
            startY - padding +10,
            (size * 5) + (spacing * 4) + (padding * 2),
            (size * 2) + spacing + (padding * 2)
        );
        
        // Draw border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            startX - padding,
            startY - padding+10,
            (size * 5) + (spacing * 4) + (padding * 2),
            (size * 2) + spacing + (padding * 2)
        );
        
        // Draw title
        ctx.fillStyle = '#4a9eff';
        ctx.font = 'bold 12px "Orbitron", sans-serif';
        ctx.fillText('CONTROL GROUPS', startX, startY - padding + 5);
        
        // Draw each control group indicator
        for (let i = 1; i <= 9; i++) {
            const group = window.controlGroups[i];
            const hasEntities = group && group.length > 0;
            
            // Calculate position (1-5 on first row, 6-0 on second row)
            const row = i <= 5 ? 0 : 1;
            const col = i <= 5 ? i - 1 : i - 6;
            const x = startX + (col * (size + spacing));
            const y = startY + (row * (size + spacing))+10;
            
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
import { COSTS } from '../utils/constants.js';
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
        const mineralsLabelX = PANEL_X + PANEL_PADDING + 100
        ctx.fillText(mineralsLabel, mineralsLabelX, 45);
        
        // Draw crystal icon on the right side
        UISystem.drawCrystalIcon(ctx, PANEL_X + PANEL_WIDTH - PANEL_PADDING - 25, 60);
        
        // Draw mineral count with more space
        ctx.fillStyle = '#7FDBFF';
        ctx.font = 'bold 32px "Orbitron", sans-serif';
        const mineralsText = `${Math.floor(game.minerals)}`;
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
            <div class="minerals">💎 Minerals: ${game.minerals}</div>
            <div class="base-hp">❤️ Base HP: ${game.base.hp}/${game.base.maxHp}</div>
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
            upgradeBtn.style.display = 'block';
            upgradeBtn.disabled = game.minerals < upgradeCost;
            upgradeBtn.textContent = `Upgrade Turret (${upgradeCost} 💎)`;
        } else {
            upgradeBtn.style.display = 'none';
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
} 
import { Entity } from './Entity.js';
import { UNIT_STATS, SIZE_MULTIPLIER } from '../utils/constants.js';

export class Battery extends Entity {
    constructor(game, x, y) {
        super(x, y, UNIT_STATS.BATTERY.SIZE, UNIT_STATS.BATTERY.HP, UNIT_STATS.BATTERY.HP);
        this.game = game;
        this.energy = UNIT_STATS.BATTERY.ENERGY;
        this.range = UNIT_STATS.BATTERY.RANGE;
        this.healingTargets = [];
    }

    draw(ctx, screenX, screenY) {
        // Draw only the health bar from base entity
        this.drawHealthBar(ctx, screenX, screenY);

        const visualSize = this.size * SIZE_MULTIPLIER;
        const time = Date.now() / 1000;
        
        ctx.save();
        ctx.translate(screenX, screenY);

        // Draw base hexagon
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const x = Math.cos(angle) * visualSize/2;
            const y = Math.sin(angle) * visualSize/2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Draw energy core
        const energyRatio = this.energy / UNIT_STATS.BATTERY.ENERGY;
        const pulseScale = 0.8 + Math.sin(time * 3) * 0.2;
        const coreSize = visualSize * 0.3 * pulseScale;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + energyRatio * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw energy rings
        const numRings = 3;
        for (let i = 0; i < numRings; i++) {
            const ringPhase = (time * 1.2 + i / numRings) % 1;
            const ringSize = visualSize * (0.3 + ringPhase * 0.3);
            ctx.strokeStyle = `rgba(0, 255, 255, ${(1 - ringPhase) * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw shield effect when has energy
        if (this.energy > 0) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, visualSize * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();

        // Draw energy bar below health bar
        const barWidth = this.size * 2;
        const barHeight = 4 * SIZE_MULTIPLIER;
        const barY = screenY - this.size - 20 * SIZE_MULTIPLIER;
        
        // Energy bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX - barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        // Energy bar border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        // Energy bar fill
        const energyGradient = ctx.createLinearGradient(screenX - barWidth/2, barY, screenX - barWidth/2, barY + barHeight);
        energyGradient.addColorStop(0, '#00ffff');
        energyGradient.addColorStop(1, '#0099cc');
        
        ctx.fillStyle = energyGradient;
        ctx.fillRect(screenX - barWidth/2, barY, barWidth * energyRatio, barHeight);

        // Draw healing beams to targets
        if (this.healingTargets && this.healingTargets.length > 0) {
            ctx.restore(); // Restore before drawing beams (need absolute coordinates)
            
            this.healingTargets.forEach(target => {
                // Convert target position to screen coordinates
                const targetScreen = this.game.camera.worldToScreen(target.x, target.y);
                const dx = targetScreen.x - screenX;
                const dy = targetScreen.y - screenY;
                const dist = Math.hypot(dx, dy);
                
                // Create gradient for the healing beam
                const gradient = ctx.createLinearGradient(screenX, screenY, targetScreen.x, targetScreen.y);
                gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                // Draw the main beam
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(targetScreen.x, targetScreen.y);
                ctx.stroke();
                
                // Draw energy particles along the beam
                const numParticles = Math.floor(dist / 30);
                for (let i = 0; i < numParticles; i++) {
                    const particlePhase = (time * 1.5 + i / numParticles) % 1;
                    const x = screenX + dx * particlePhase;
                    const y = screenY + dy * particlePhase;
                    
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            return; // Don't need to restore again
        }

        // Draw selection highlight and range indicator
        if (this.game.selectedBattery === this) {
            // Draw range indicator
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw selection highlight
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, visualSize/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
} 
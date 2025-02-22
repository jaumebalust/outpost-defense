import { Entity } from './Entity.js';
import { UNIT_STATS, COMBAT, SIZE_MULTIPLIER, SCALE } from '../utils/constants.js';

export class Turret extends Entity {
    constructor(game, x, y) {
        super(x, y, UNIT_STATS.TURRET.SIZE, UNIT_STATS.TURRET.HP, UNIT_STATS.TURRET.HP);
        this.game = game;
        this.level = 1;
        this.range = UNIT_STATS.TURRET.RANGE * SCALE;
        this.damage = COMBAT.BASE_TURRET_DAMAGE;
        this.baseFireRate = COMBAT.BASE_FIRE_RATE;
        this.cooldown = 0;
        this.currentRotation = 0;
    }

    upgrade() {
        this.level++;
        this.maxHp *= 1.5;
        this.hp = this.maxHp;
        this.damage *= 1.5;
        this.baseFireRate = Math.max(20, this.baseFireRate * 0.8);
        this.range *= 1.1;
    }

    draw(ctx, screenX, screenY) {
        // Draw only the health bar from base entity
        this.drawHealthBar(ctx, screenX, screenY);
        
        const visualSize = this.size * SIZE_MULTIPLIER;
        const time = Date.now() / 1000; // For animation effects
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Draw base platform with hexagonal shape
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const x = Math.cos(angle) * (visualSize * 0.6);
            const y = Math.sin(angle) * (visualSize * 0.6);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add metallic rim to base
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw rotating base with mechanical details
        ctx.rotate(this.currentRotation + Math.PI/2);
        
        // Draw main turret body (cylindrical base)
        const gradient = ctx.createLinearGradient(-visualSize/3, -visualSize/3, visualSize/3, visualSize/3);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, visualSize/3, visualSize/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add metallic details to body
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw armor plates
        ctx.fillStyle = '#34495e';
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2 / 3) + time * 0.5;
            ctx.save();
            ctx.rotate(angle);
            ctx.fillRect(-visualSize/8, -visualSize/3, visualSize/4, visualSize/6);
            ctx.restore();
        }
        
        // Draw turret barrel
        ctx.save();
        // Main barrel
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-visualSize/6, -visualSize/2, visualSize/3, visualSize/2);
        
        // Barrel details
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-visualSize/8, -visualSize/2, visualSize/6, visualSize/2);
        
        // Barrel tip with gradient
        const barrelGradient = ctx.createLinearGradient(0, -visualSize/2, 0, -visualSize/2 + visualSize/6);
        barrelGradient.addColorStop(0, '#3498db');
        barrelGradient.addColorStop(1, '#2980b9');
        ctx.fillStyle = barrelGradient;
        ctx.beginPath();
        ctx.ellipse(0, -visualSize/2, visualSize/6, visualSize/8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect when ready to fire
        if (this.cooldown <= 0) {
            ctx.shadowColor = '#3498db';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            ctx.beginPath();
            ctx.arc(0, -visualSize/2, visualSize/8, 0, Math.PI * 2);
            ctx.fill();
            
            // Add additional glow rings
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
            ctx.lineWidth = 2;
            for (let i = 1; i <= 2; i++) {
                ctx.beginPath();
                ctx.arc(0, -visualSize/2, visualSize/8 + i * 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
        
        // Level indicator with glowing orbs
        ctx.fillStyle = '#f1c40f';
        for (let i = 0; i < this.level; i++) {
            const angle = (i / this.level) * Math.PI * 2;
            const x = Math.cos(angle) * (visualSize/2.5);
            const y = Math.sin(angle) * (visualSize/2.5);
            
            // Glowing effect
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, visualSize/12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw range indicator when selected
        if (this.game.selectedTurret === this) {
            ctx.shadowBlur = 0;
            // Inner circle
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, this.range * 0.25, 0, Math.PI * 2);
            ctx.stroke();
            
            // Outer range circle
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Selection highlight
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, visualSize * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
} 
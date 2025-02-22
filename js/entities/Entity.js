import { SIZE_MULTIPLIER, SCALE } from '../utils/constants.js';

export class Entity {
    constructor(x, y, size, hp = 100, maxHp = 100) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.hp = hp;
        this.maxHp = maxHp;
    }

    draw(ctx, screenX, screenY) {
        // Base entity drawing - can be overridden by child classes
        this.drawBaseCircle(ctx, screenX, screenY);
        this.drawHealthBar(ctx, screenX, screenY);
    }

    drawBaseCircle(ctx, screenX, screenY) {
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHealthBar(ctx, screenX, screenY) {
        // Draw enhanced health bar
        const healthBarWidth = this.size * 2;
        const healthBarHeight = 6 * SIZE_MULTIPLIER;
        const healthPercentage = this.hp / this.maxHp;
        const barY = screenY - this.size - 10 * SIZE_MULTIPLIER;
        
        // Health bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX - healthBarWidth/2 - 1, barY - 1, healthBarWidth + 2, healthBarHeight + 2);
        
        // Health bar border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - healthBarWidth/2 - 1, barY - 1, healthBarWidth + 2, healthBarHeight + 2);
        
        // Health bar fill
        const gradient = ctx.createLinearGradient(screenX - healthBarWidth/2, barY, screenX - healthBarWidth/2, barY + healthBarHeight);
        gradient.addColorStop(0, healthPercentage > 0.5 ? '#00ff00' : '#ff6b6b');
        gradient.addColorStop(1, healthPercentage > 0.5 ? '#00cc00' : '#cc0000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX - healthBarWidth/2, barY, healthBarWidth * healthPercentage, healthBarHeight);
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    isColliding(other) {
        const distance = Math.hypot(this.x - other.x, this.y - other.y);
        return distance < (this.size + other.size) / 2;
    }
} 
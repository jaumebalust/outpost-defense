import { SCALE, SIZE_MULTIPLIER, COMBAT } from '../utils/constants.js';

export class Missile {
    constructor(x, y, direction, damage) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.damage = damage;  // Store the turret's damage value
        this.speed = COMBAT.MISSILE_SPEED * SCALE;  // Use new missile speed constant
        this.size = 8 * SIZE_MULTIPLIER;  // Scale missile size
        this.active = true;
    }

    update() {
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;
    }

    draw(ctx, screenX, screenY) {
        ctx.save();
        
        // Rotate missile in direction of travel
        const angle = Math.atan2(this.direction.y, this.direction.x);
        ctx.translate(screenX, screenY);
        ctx.rotate(angle);
        
        // Draw missile body
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, -this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Draw glowing trail
        ctx.globalAlpha = 0.5;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-this.size * 2, 0);
        ctx.lineTo(-this.size, -this.size/2);
        ctx.lineTo(-this.size, this.size/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
} 
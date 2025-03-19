import { Entity } from './Entity.js';
import { UNIT_STATS, COMBAT, SIZE_MULTIPLIER, SCALE } from '../utils/constants.js';
import { calculateAngle } from '../utils/math.js';

export class Enemy extends Entity {
    constructor(x, y, wave, type = 'normal') {
        const baseSize = type === 'boss' ? 70 : type === 'tank' ? 50 : 35;
        const baseHp = COMBAT.ENEMY_HP[type.toUpperCase()];
        const waveScaling = Math.pow(1.2, wave - 1);
        
        super(x, y, baseSize, baseHp * waveScaling, baseHp * waveScaling);
        
        this.type = type;
        this.speed = COMBAT.ENEMY_SPEED[type.toUpperCase()] * SCALE;
        this.damage = COMBAT.ENEMY_DAMAGE[type.toUpperCase()] * waveScaling;
        this.attackSpeed = COMBAT.ENEMY_ATTACK_SPEED[type.toUpperCase()];
        this.attackCooldown = 0;
        this.currentTarget = null;
        this.attackX = null;
        this.attackY = null;
        this.targetUpdateCooldown = 0;
        this.spawnTime = Date.now();
        this.id = Math.random().toString(36).substr(2, 9); // Generate unique ID for missile targeting
    }

    findTarget(game) {
        // Priority: Turrets = Workers > Batteries > Base
        let shortestDist = Infinity;
        let target = null;
        let targetX = null;
        let targetY = null;

        // Helper function to check and update target
        const checkTarget = (obj, x, y) => {
            const dist = Math.hypot(this.x - x, this.y - y);
            if (dist < shortestDist) {
                shortestDist = dist;
                target = obj;
                targetX = x;
                targetY = y;
                return true;
            }
            return false;
        };

        // Check both workers and turrets first (equal priority)
        const highPriorityTargets = [...game.workers, ...game.turrets];
        highPriorityTargets.forEach(target => {
            checkTarget(target, target.x, target.y);
        });

        // If no worker or turret in range, check batteries
        if (!target) {
            game.batteries.forEach(battery => {
                checkTarget(battery, battery.x, battery.y);
            });
        }

        // If no other targets, go for base
        if (!target) {
            checkTarget(game.base, game.base.x, game.base.y);
        }

        this.currentTarget = target;
        this.attackX = targetX;
        this.attackY = targetY;
    }

    update(game) {
        // Check if enemy is dead
        if (this.hp <= 0) {
            // Remove this enemy from the game
            game.enemies = game.enemies.filter(e => e !== this);
            return;
        }
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        if (this.targetUpdateCooldown > 0) {
            this.targetUpdateCooldown--;
        }

        // Update target selection periodically or when needed
        if (!this.currentTarget || this.targetUpdateCooldown <= 0 || 
            (this.currentTarget !== game.base && this.currentTarget.hp <= 0)) {  // Recheck if current target is destroyed
            this.findTarget(game);
            this.targetUpdateCooldown = 30; // Update target every 30 frames
        }

        // Move towards target
        if (this.attackX !== null && this.attackY !== null) {
            const dx = this.attackX - this.x;
            const dy = this.attackY - this.y;
            const dist = Math.hypot(dx, dy);
            
            // If we're not in attack range, move towards target
            if (dist > COMBAT.COMBAT_RANGE) {
                const moveAngle = Math.atan2(dy, dx);
                this.x += Math.cos(moveAngle) * this.speed;
                this.y += Math.sin(moveAngle) * this.speed;
            }
        }
    }

    draw(ctx, screenX, screenY) {
        this.drawHealthBar(ctx, screenX, screenY);

        const rotation = this.attackX && this.attackY ? 
            calculateAngle(this.x, this.y, this.attackX, this.attackY) : 0;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(rotation);

        const visualSize = this.size * SIZE_MULTIPLIER;
        const time = Date.now() / 1000;
        
        // Draw enemy body based on type
        switch(this.type) {
            case 'fast':
                // Sleek, arrow-like design
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.moveTo(visualSize/2, 0);
                ctx.lineTo(-visualSize/3, -visualSize/4);
                ctx.lineTo(-visualSize/3, visualSize/4);
                ctx.closePath();
                ctx.fill();
                
                // Add speed trails
                ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
                ctx.lineWidth = 2;
                for(let i = 1; i <= 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-visualSize/3 - i*10, -visualSize/4);
                    ctx.lineTo(-visualSize/3 - i*10, visualSize/4);
                    ctx.stroke();
                }
                break;
                
            case 'tank':
                // Heavy, armored design
                ctx.fillStyle = '#8b0000';
                ctx.beginPath();
                ctx.rect(-visualSize/2, -visualSize/2, visualSize, visualSize);
                ctx.fill();
                
                // Add armor plates
                ctx.fillStyle = '#a52a2a';
                for(let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.rect(-visualSize/2 + i*visualSize/3, -visualSize/2, visualSize/4, visualSize);
                    ctx.fill();
                }
                break;
                
            case 'boss':
                // Intimidating, complex design
                const pulseScale = 1 + Math.sin(time * 2) * 0.1;
                
                // Main body
                ctx.fillStyle = '#800000';
                ctx.beginPath();
                ctx.arc(0, 0, visualSize/2 * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                // Rotating armor segments
                ctx.fillStyle = '#ff0000';
                for(let i = 0; i < 6; i++) {
                    const angle = time * 2 + (i * Math.PI / 3);
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, -visualSize/4);
                    ctx.lineTo(visualSize/2, -visualSize/6);
                    ctx.lineTo(visualSize/2, visualSize/6);
                    ctx.lineTo(0, visualSize/4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                
                // Energy core
                ctx.fillStyle = `rgba(255, 255, 0, ${0.5 + Math.sin(time * 4) * 0.5})`;
                ctx.beginPath();
                ctx.arc(0, 0, visualSize/4, 0, Math.PI * 2);
                ctx.fill();
                
                // Add glow effect
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                ctx.fill();
                break;
                
            case 'elite':
                // Enhanced version of normal enemy
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.moveTo(-visualSize/2, -visualSize/2);
                ctx.lineTo(visualSize/2, 0);
                ctx.lineTo(-visualSize/2, visualSize/2);
                ctx.closePath();
                ctx.fill();
                
                // Add elite markings
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-visualSize/4, 0);
                ctx.lineTo(visualSize/4, 0);
                ctx.stroke();
                
                // Add glow effect
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                ctx.fill();
                break;
                
            default: // normal enemy
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(-visualSize/2, -visualSize/2);
                ctx.lineTo(visualSize/2, 0);
                ctx.lineTo(-visualSize/2, visualSize/2);
                ctx.closePath();
                ctx.fill();
                
                // Add mechanical details
                ctx.fillStyle = '#800000';
                ctx.beginPath();
                ctx.arc(0, 0, visualSize/4, 0, Math.PI * 2);
                ctx.fill();
        }

        // Draw attack indicator when cooldown is ready
        if (this.attackCooldown <= 0) {
            ctx.strokeStyle = this.type === 'elite' || this.type === 'boss' ? '#ffff00' : '#ff4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(visualSize/2, 0);
            ctx.lineTo(visualSize, 0);
            ctx.stroke();
        }

        ctx.restore();
    }
} 
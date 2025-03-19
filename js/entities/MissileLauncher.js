import { Turret } from './Turret.js';
import { COMBAT, UNIT_STATS } from '../utils/constants.js';

export class MissileLauncher extends Turret {
    constructor(game, x, y) {
        super(game, x, y);
        this.type = 'MISSILE_LAUNCHER';
        this.size = UNIT_STATS.MISSILE_LAUNCHER.SIZE;
        this.hp = UNIT_STATS.MISSILE_LAUNCHER.HP;
        this.maxHp = UNIT_STATS.MISSILE_LAUNCHER.HP;
        this.range = UNIT_STATS.MISSILE_LAUNCHER.RANGE;
        this.damage = COMBAT.MISSILE_LAUNCHER_DAMAGE;
        this.fireRate = COMBAT.MISSILE_LAUNCHER_FIRE_RATE;
        this.lastFired = 0;
        this.level = 1;
        this.selected = false;
        this.target = null;
        this.missiles = [];
        this.id = Math.random().toString(36).substr(2, 9); // Generate unique ID
    }

    upgrade() {
        this.level++;
        this.maxHp += 50;
        this.hp = this.maxHp;
        this.damage += 25;
        this.fireRate = Math.max(30, this.fireRate - 10);
        this.range += 20;
        console.log(`Missile Launcher upgraded to level ${this.level}`);
    }

    draw(ctx, screenX, screenY, zoom) {
        const size = this.size * zoom;

        // Draw range circle if selected
        if (this.isSelected) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.range * zoom, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 100, 100, 0.1)';
            ctx.fill();
        }

        // Draw the missile launcher base
        ctx.beginPath();
        ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#555555';
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the missile launcher turret
        ctx.beginPath();
        ctx.arc(screenX, screenY, size / 3, 0, Math.PI * 2);
        ctx.fillStyle = '#777777';
        ctx.fill();

        // Draw missile tubes
        const tubeLength = size * 0.7;
        const tubeWidth = size * 0.15;
        
        // If we have a target, rotate towards it
        let angle = 0;
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            angle = Math.atan2(dy, dx);
        }
        
        // Draw the missile tubes
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(angle);
        
        // Left tube
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, -tubeWidth * 1.2, tubeLength, tubeWidth);
        
        // Right tube
        ctx.fillRect(0, tubeWidth * 0.2, tubeLength, tubeWidth);
        
        ctx.restore();

        // Draw health bar
        const healthBarWidth = size;
        const healthBarHeight = 5 * zoom;
        const healthPercentage = this.hp / this.maxHp;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX - healthBarWidth / 2, screenY - size / 2 - healthBarHeight * 2, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = healthPercentage > 0.5 ? 'green' : healthPercentage > 0.25 ? 'orange' : 'red';
        ctx.fillRect(screenX - healthBarWidth / 2, screenY - size / 2 - healthBarHeight * 2, healthBarWidth * healthPercentage, healthBarHeight);

        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = `${10 * zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`Lvl ${this.level}`, screenX, screenY - size / 2 - healthBarHeight * 3);

        // Draw missiles
        this.missiles.forEach(missile => {
            // Convert missile world coordinates to screen coordinates using the game's camera
            if (this.game && this.game.camera) {
                const missileScreen = this.game.camera.worldToScreen(missile.x, missile.y);
                const missileScreenX = missileScreen.x;
                const missileScreenY = missileScreen.y;
                const missileSize = 5 * zoom;
                
                ctx.beginPath();
                ctx.arc(missileScreenX, missileScreenY, missileSize, 0, Math.PI * 2);
                ctx.fillStyle = '#ff4400';
                ctx.fill();
                
                // Draw missile trail
                ctx.beginPath();
                ctx.moveTo(missileScreenX, missileScreenY);
                ctx.lineTo(
                    missileScreenX - Math.cos(missile.angle) * missileSize * 3,
                    missileScreenY - Math.sin(missile.angle) * missileSize * 3
                );
                ctx.strokeStyle = 'rgba(255, 150, 0, 0.7)';
                ctx.lineWidth = missileSize * 0.8;
                ctx.stroke();
            }
        });
    }

    update(game, deltaTime) {
        // Find target if we don't have one or if it's dead
        if (!this.target || this.target.hp <= 0) {
            this.findTarget(game.enemies);
        }

        // If we have a target, check if it's in range
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If target is out of range, clear it
            if (distance > this.range) {
                this.target = null;
            } else {
                // Fire at the target if cooldown is ready
                if (game.time - this.lastFired > this.fireRate) {
                    this.fire(game);
                }
            }
        }

        // Update missiles
        this.updateMissiles(game, deltaTime);
    }

    fire(game) {
        if (!this.target) return;
        
        this.lastFired = game.time;
        
        // Create a new missile
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        this.missiles.push({
            x: this.x,
            y: this.y,
            targetId: this.target.id,
            angle: angle,
            speed: COMBAT.MISSILE_SPEED,
            damage: this.calculateDamage(this.target),
            size: 5 // Add explicit size for the missile
        });
        
        // Play sound effect
        if (game.soundSystem) {
            game.soundSystem.play('missile');
        }
    }

    calculateDamage(target) {
        // Apply damage multiplier for boss enemies
        if (target.type === 'BOSS') {
            return this.damage * COMBAT.DAMAGE_MULTIPLIER.BOSS;
        }
        return this.damage;
    }

    updateMissiles(game, deltaTime) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            
            // Find the target
            const target = game.enemies.find(enemy => enemy.id === missile.targetId);
            
            // If target is gone, remove missile
            if (!target) {
                this.missiles.splice(i, 1);
                continue;
            }
            
            // Update missile angle to track target
            missile.angle = Math.atan2(target.y - missile.y, target.x - missile.x);
            
            // Move missile
            missile.x += Math.cos(missile.angle) * missile.speed;
            missile.y += Math.sin(missile.angle) * missile.speed;
            
            // Check for collision
            const dx = target.x - missile.x;
            const dy = target.y - missile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < target.size / 2) {
                // Hit target
                target.hp -= missile.damage;
                
                // Create explosion effect
                if (game.effects) {
                    game.effects.push({
                        x: missile.x,
                        y: missile.y,
                        size: 20,
                        alpha: 1,
                        type: 'explosion'
                    });
                }
                
                // Play explosion sound
                if (game.soundSystem) {
                    game.soundSystem.play('explosion');
                }
                
                // Remove missile
                this.missiles.splice(i, 1);
            }
        }
    }

    findTarget(enemies) {
        // Prioritize boss enemies
        const bosses = enemies.filter(enemy => enemy.type === 'BOSS');
        if (bosses.length > 0) {
            this.target = this.findClosestEnemy(bosses);
            return;
        }
        
        // Then prioritize tank enemies
        const tanks = enemies.filter(enemy => enemy.type === 'TANK');
        if (tanks.length > 0) {
            this.target = this.findClosestEnemy(tanks);
            return;
        }
        
        // Then any enemy in range
        this.target = this.findClosestEnemy(enemies);
    }

    findClosestEnemy(enemies) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.range && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        return closestEnemy;
    }
} 
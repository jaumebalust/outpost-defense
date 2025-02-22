import { COMBAT } from '../utils/constants.js';

export class CollisionSystem {
    static update(game) {
        // First handle missile movement and collisions
        game.missiles = game.missiles.filter(missile => {
            // Check if missile hits any enemy
            let hitEnemy = false;
            
            game.enemies.forEach(enemy => {
                if (!hitEnemy) {  // Only check if missile hasn't hit anything yet
                    const dist = Math.hypot(missile.x - enemy.x, missile.y - enemy.y);
                    const collisionRadius = (enemy.size + missile.size) / 2;
                    
                    if (dist < collisionRadius) {
                        enemy.hp -= missile.damage;
                        hitEnemy = true;
                        
                        // If enemy died, remove it
                        if (enemy.hp <= 0) {
                            game.enemies = game.enemies.filter(e => e !== enemy);
                        }
                    }
                }
            });
            
            // Keep missile if it hasn't hit anything and is in bounds
            return !hitEnemy && 
                missile.x >= 0 && 
                missile.x <= game.camera.worldWidth && 
                missile.y >= 0 && 
                missile.y <= game.camera.worldHeight;
        });

        // Then handle enemy collisions and attacks
        game.enemies = game.enemies.filter(enemy => {
            // Check collision with base
            const distToBase = Math.hypot(enemy.x - game.base.x, enemy.y - game.base.y);
            
            if (distToBase < game.base.size / 2 + enemy.size / 2) {
                if (enemy.attackCooldown <= 0) {
                    game.base.hp -= enemy.damage;
                    enemy.attackCooldown = enemy.attackSpeed;
                    
                    if (game.base.hp <= 0) {
                        game.gameOver = true;
                    }
                }
                return true; // Keep enemy alive to continue attacking
            }
            
            // Check collision with workers
            for (let i = game.workers.length - 1; i >= 0; i--) {
                const worker = game.workers[i];
                const distToWorker = Math.hypot(enemy.x - worker.x, enemy.y - worker.y);
                if (distToWorker < worker.size / 2 + enemy.size / 2) {
                    if (enemy.attackCooldown <= 0) {
                        worker.hp -= enemy.damage;
                        enemy.attackCooldown = enemy.attackSpeed;
                        
                        if (worker.hp <= 0) {
                            if (worker.targetPatch) {
                                worker.targetPatch.workers--;
                            }
                            game.workers.splice(i, 1);
                            enemy.currentTarget = null;
                            enemy.attackX = null;
                            enemy.attackY = null;
                            return true;
                        }
                    }
                    return true;
                }
            }
            
            // Check collision with turrets
            for (let i = game.turrets.length - 1; i >= 0; i--) {
                const turret = game.turrets[i];
                const distToTurret = Math.hypot(enemy.x - turret.x, enemy.y - turret.y);
                if (distToTurret < turret.size / 2 + enemy.size / 2) {
                    if (enemy.attackCooldown <= 0) {
                        turret.hp -= enemy.damage;
                        enemy.attackCooldown = enemy.attackSpeed;
                        
                        if (turret.hp <= 0) {
                            game.turrets.splice(i, 1);
                            enemy.currentTarget = null;
                            enemy.attackX = null;
                            enemy.attackY = null;
                            return true;
                        }
                    }
                    return true;
                }
            }
            
            // Check collision with batteries
            for (let i = game.batteries.length - 1; i >= 0; i--) {
                const battery = game.batteries[i];
                const distToBattery = Math.hypot(enemy.x - battery.x, enemy.y - battery.y);
                if (distToBattery < battery.size / 2 + enemy.size / 2) {
                    if (enemy.attackCooldown <= 0) {
                        // If battery has energy, damage the energy first
                        if (battery.energy > 0) {
                            battery.energy = Math.max(0, battery.energy - enemy.damage * 2);
                        } else {
                            // If no energy, damage HP
                            battery.hp -= enemy.damage;
                        }
                        enemy.attackCooldown = enemy.attackSpeed;
                        
                        if (battery.hp <= 0) {
                            game.batteries.splice(i, 1);
                            enemy.currentTarget = null;
                            enemy.attackX = null;
                            enemy.attackY = null;
                            return true;
                        }
                    }
                    return true;
                }
            }
            
            // Keep enemy alive and check if it's within world bounds
            return enemy.x >= 0 && 
                   enemy.x <= game.camera.worldWidth && 
                   enemy.y >= 0 && 
                   enemy.y <= game.camera.worldHeight;
        });
    }
} 
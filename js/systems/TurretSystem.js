import { calculateAngle } from '../utils/constants.js';
import { Missile } from '../entities/Missile.js';

export class TurretSystem {
    static update(game) {
        const time = Date.now() / 1000; // For idle rotation

        game.turrets.forEach(turret => {
            if (turret.cooldown > 0) {
                turret.cooldown--;
            }
            
            // Find closest target
            let target = null;
            let minDist = Infinity;
            
            game.enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - turret.x, enemy.y - turret.y);
                if (dist < turret.range && dist < minDist) {
                    minDist = dist;
                    target = enemy;
                }
            });

            // Update turret rotation
            if (target) {
                // Calculate target angle
                const targetAngle = calculateAngle(turret.x, turret.y, target.x, target.y);
                
                // Smoothly rotate towards target
                let angleDiff = targetAngle - turret.currentRotation;
                
                // Normalize angle difference to [-PI, PI]
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // Rotate with a speed proportional to the angle difference
                const rotationSpeed = Math.min(Math.abs(angleDiff), 0.1);
                turret.currentRotation += Math.sign(angleDiff) * rotationSpeed;
                
                // Fire if cooled down and facing target (within 0.1 radians)
                if (turret.cooldown <= 0 && Math.abs(angleDiff) < 0.1) {
                    const dx = target.x - turret.x;
                    const dy = target.y - turret.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const direction = { x: dx / length, y: dy / length };
                    
                    // Create missile with turret's current damage value
                    const missile = new Missile(
                        turret.x,
                        turret.y,
                        direction,
                        turret.damage // Pass the turret's current damage
                    );
                    
                    game.missiles.push(missile);
                    turret.cooldown = turret.baseFireRate;
                }
            } else {
                // Idle rotation behavior
                const idleRotationSpeed = 0.02;
                const idleRotationRange = Math.PI / 3; // 60 degrees
                
                // Calculate idle rotation based on time
                const baseRotation = Math.sin(time * idleRotationSpeed) * idleRotationRange;
                
                // Smoothly transition to idle rotation
                let angleDiff = baseRotation - turret.currentRotation;
                
                // Normalize angle difference
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                turret.currentRotation += angleDiff * 0.05;
            }

            // Normalize current rotation
            while (turret.currentRotation > Math.PI) turret.currentRotation -= 2 * Math.PI;
            while (turret.currentRotation < -Math.PI) turret.currentRotation += 2 * Math.PI;
        });
    }
} 
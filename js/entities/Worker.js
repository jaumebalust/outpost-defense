import { Entity } from './Entity.js';
import { UNIT_STATS, SIZE_MULTIPLIER, SCALE } from '../utils/constants.js';
import { calculateAngle } from '../utils/math.js';

export class Worker extends Entity {
    constructor(game, x, y) {
        super(x, y, UNIT_STATS.WORKER.SIZE, UNIT_STATS.WORKER.HP, UNIT_STATS.WORKER.HP);
        this.game = game;
        this.state = 'toMineral';
        this.targetPatch = null;
        this.speed = UNIT_STATS.WORKER.SPEED * SCALE;
        this.minerals = 0;
        this.maxMinerals = 10;
        this.isSelected = false;
    }

    findPathToMineralPatch() {
        if (this.targetPatch) {
            this.state = 'toMineral';
        }
    }

    update() {
        if (this.state === 'toMineral' && this.targetPatch) {
            const dx = this.targetPatch.x - this.x;
            const dy = this.targetPatch.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 5) {
                // Check if we should even try to mine
                if (this.minerals >= this.maxMinerals || this.targetPatch.minerals <= 0) {
                    this.state = 'toBase';
                    return;
                }

                // Try to start mining
                if (this.targetPatch.startMining(this)) {
                    this.state = 'mining';
                }
                // If we couldn't start mining, we're automatically queued
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        } else if (this.state === 'mining') {
            // Verify we should still be mining
            if (this.minerals >= this.maxMinerals || this.targetPatch.minerals <= 0 || 
                this.targetPatch.currentMiner !== this) {
                this.state = 'toBase';
                if (this.targetPatch.currentMiner === this) {
                    this.targetPatch.finishMining();
                }
                return;
            }

            // Check if mining is complete
            const now = Date.now();
            if (now - this.targetPatch.lastMineTime >= this.targetPatch.miningDelay) {
                // Calculate how much we can mine in one operation
                const spaceLeft = this.maxMinerals - this.minerals;
                const mineAmount = Math.min(spaceLeft, this.targetPatch.minerals);
                
                this.minerals += mineAmount;
                this.targetPatch.minerals -= mineAmount;
                
                // Always go to base after a full mining operation
                this.state = 'toBase';
                this.targetPatch.finishMining();
            }
        } else if (this.state === 'toBase') {
            const dx = this.game.base.x - this.x;
            const dy = this.game.base.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 5) {
                // Use game.addMinerals instead of directly modifying minerals
                // This ensures UI buttons refresh properly
                this.game.addMinerals(this.minerals);
                // Reset worker's carried minerals
                this.minerals = 0;
                
                // Clean up any mining state
                if (this.targetPatch) {
                    if (this.targetPatch.currentMiner === this) {
                        this.targetPatch.finishMining();
                    }
                    const queueIndex = this.targetPatch.miningQueue.indexOf(this);
                    if (queueIndex !== -1) {
                        this.targetPatch.miningQueue.splice(queueIndex, 1);
                    }
                }

                // Determine next state
                if (this.targetPatch && this.targetPatch.minerals > 0) {
                    // Step back and try to mine again
                    const angle = Math.atan2(this.y - this.game.base.y, this.x - this.game.base.x);
                    this.x = this.game.base.x + Math.cos(angle) * 10;
                    this.y = this.game.base.y + Math.sin(angle) * 10;
                    this.state = 'toMineral';
                } else {
                    this.state = 'idle';
                    if (this.targetPatch) {
                        this.targetPatch.workers--;
                        this.targetPatch = null;
                    }
                }
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
    }

    draw(ctx, screenX, screenY) {
        ctx.save();
        
        // Draw selection circle if selected
        if (this.isSelected) {
            ctx.beginPath();
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 2;
            ctx.arc(screenX, screenY, this.size * SIZE_MULTIPLIER * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw selection dots
            const dotCount = 8;
            const dotRadius = 2;
            const radius = this.size * SIZE_MULTIPLIER * 1.2;
            for (let i = 0; i < dotCount; i++) {
                const angle = (i / dotCount) * Math.PI * 2;
                const dotX = screenX + radius * Math.cos(angle);
                const dotY = screenY + radius * Math.sin(angle);
                
                ctx.beginPath();
                ctx.fillStyle = '#4a9eff';
                ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw only the health bar from base entity
        this.drawHealthBar(ctx, screenX, screenY);

        // Calculate rotation based on movement or state
        let rotation = 0;
        if (this.state === 'toMineral' || this.state === 'toBase') {
            const targetX = this.state === 'toMineral' ? this.targetPatch.x : this.game.base.x;
            const targetY = this.state === 'toMineral' ? this.targetPatch.y : this.game.base.y;
            rotation = calculateAngle(this.x, this.y, targetX, targetY);
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(rotation);

        // Draw worker body
        const time = Date.now() / 1000;
        const visualSize = this.size * SIZE_MULTIPLIER;
        
        // Main body (circular base)
        ctx.fillStyle = this.isSelected ? '#5ab4ff' : '#4a9eff';
        ctx.beginPath();
        ctx.arc(0, 0, visualSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw mechanical arms (animated)
        const armAngle = Math.sin(time * 4) * 0.3;
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 3;
        
        // Left arm
        ctx.save();
        ctx.rotate(-Math.PI/4 + armAngle);
        ctx.beginPath();
        ctx.moveTo(-visualSize * 0.2, 0);
        ctx.lineTo(-visualSize * 0.5, 0);
        ctx.stroke();
        
        // Left hand tool
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-visualSize * 0.6, -visualSize * 0.1, visualSize * 0.15, visualSize * 0.2);
        ctx.restore();
        
        // Right arm
        ctx.save();
        ctx.rotate(Math.PI/4 - armAngle);
        ctx.beginPath();
        ctx.moveTo(visualSize * 0.2, 0);
        ctx.lineTo(visualSize * 0.5, 0);
        ctx.stroke();
        
        // Right hand tool
        ctx.fillStyle = '#34495e';
        ctx.fillRect(visualSize * 0.45, -visualSize * 0.1, visualSize * 0.15, visualSize * 0.2);
        ctx.restore();

        // Draw head with visor
        ctx.fillStyle = this.isSelected ? '#45a8f0' : '#3498db';
        ctx.beginPath();
        ctx.arc(0, -visualSize * 0.1, visualSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw visor
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(0, -visualSize * 0.1, visualSize * 0.15, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.fill();

        // Draw mineral indicator if carrying minerals
        if (this.minerals > 0) {
            const mineralRatio = this.minerals / this.maxMinerals;
            
            // Draw crystal shards
            const numShards = Math.ceil(mineralRatio * 5);
            for (let i = 0; i < numShards; i++) {
                const angle = (i / numShards) * Math.PI * 2 + Date.now() / 1000;
                const radius = visualSize * 0.6;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + mineralRatio * 0.5})`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - visualSize * 0.1, y + visualSize * 0.2);
                ctx.lineTo(x + visualSize * 0.1, y + visualSize * 0.2);
                ctx.closePath();
                ctx.fill();
                
                ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            // Draw energy field
            ctx.beginPath();
            ctx.arc(0, 0, visualSize * 0.6, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, visualSize * 0.6);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        ctx.restore();
        ctx.restore();
    }
} 
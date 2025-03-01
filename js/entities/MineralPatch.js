import { SIZE_MULTIPLIER } from '../utils/constants.js';

export class MineralPatch {
    constructor(x, y, size, minerals, maxMinerals = 15000) {
        this.x = x;
        this.y = y;
        this.size = size;  // Store original size without multiplier
        this.minerals = minerals;
        this.maxMinerals = maxMinerals;
        this.workers = 0;
        this.miningQueue = [];  // Queue of workers waiting to mine
        this.currentMiner = null;  // Currently mining worker
        this.miningDelay = 800;  // Mining delay in milliseconds
        this.lastMineTime = 0;  // Last time minerals were mined
        this.isSelected = false;  // Track if patch is selected
        this.lastWorkerCleanup = Date.now(); // Track when we last cleaned up worker references
    }

    canStartMining(worker) {
        const now = Date.now();
        // Can only start mining if:
        // 1. No current miner
        // 2. Enough time has passed since last mining
        // 3. Worker has room for minerals
        // 4. Patch has minerals left
        return !this.currentMiner && 
               now - this.lastMineTime >= this.miningDelay &&
               worker.minerals < worker.maxMinerals &&
               this.minerals > 0;
    }

    startMining(worker) {
        if (this.canStartMining(worker)) {
            // Clear worker from queue if present
            const queueIndex = this.miningQueue.indexOf(worker);
            if (queueIndex !== -1) {
                this.miningQueue.splice(queueIndex, 1);
            }
            
            this.currentMiner = worker;
            this.lastMineTime = Date.now();
            
            // Run queue validation when starting mining
            this.validateMiningQueue(worker.game);
            
            return true;
        } else if (!this.miningQueue.includes(worker) && 
                   worker.minerals < worker.maxMinerals &&
                   this.minerals > 0 &&
                   worker.state !== 'mining') {  // Don't queue if already mining
            // Only add to queue if:
            // 1. Worker isn't already in queue
            // 2. Worker isn't full
            // 3. Patch has minerals left
            // 4. Worker isn't currently mining
            this.miningQueue.push(worker);
        }
        return false;
    }

    finishMining() {
        // Store previous miner before clearing
        const previousMiner = this.currentMiner;
        const hasGame = previousMiner && previousMiner.game;
        
        // Clear current miner and reset mining time
        this.currentMiner = null;
        this.lastMineTime = Date.now();  // Reset mining time to enforce delay between miners

        // Don't start next worker immediately if previous worker is full
        if (previousMiner && (previousMiner.minerals >= previousMiner.maxMinerals || this.minerals <= 0)) {
            // Run queue validation after finishing mining
            if (hasGame) {
                this.validateMiningQueue(previousMiner.game);
            }
            return;
        }

        // Clean up the queue - remove any workers that:
        // 1. Are no longer assigned to this patch
        // 2. Are full of minerals
        // 3. Are heading back to base
        // 4. Were the previous miner (to prevent immediate re-queueing)
        // 5. Patch is depleted
        // 6. Are currently mining
        this.miningQueue = this.miningQueue.filter(worker => 
            worker !== previousMiner &&
            worker.targetPatch === this && 
            worker.minerals < worker.maxMinerals &&
            worker.state !== 'toBase' &&
            this.minerals > 0 &&
            worker.state !== 'mining'
        );
        
        // Start the next worker if available and conditions are right
        if (this.miningQueue.length > 0 && this.minerals > 0) {
            const nextWorker = this.miningQueue[0];
            // Only start mining if worker is in the right state and position
            if (nextWorker.state === 'toMineral' && 
                Math.hypot(nextWorker.x - this.x, nextWorker.y - this.y) < 5 &&
                this.canStartMining(nextWorker)) {
                this.miningQueue.shift();
                this.startMining(nextWorker);
            }
        }
        
        // Run queue validation after finishing mining
        if (hasGame) {
            this.validateMiningQueue(previousMiner.game);
        }
    }
    
    // New method to validate and fix the mining queue
    validateMiningQueue(game) {
        if (!game) return;
        
        // Periodically perform more thorough cleanup (every 5 seconds)
        const now = Date.now();
        if (now - this.lastWorkerCleanup > 5000) {
            // Verify the current miner is still valid
            if (this.currentMiner && 
                (!game.workers.includes(this.currentMiner) || 
                 this.currentMiner.targetPatch !== this)) {
                this.currentMiner = null;
                this.lastMineTime = now; // Reset mining time
            }
            
            // Filter the mining queue to remove invalid workers
            this.miningQueue = this.miningQueue.filter(worker => 
                game.workers.includes(worker) && 
                worker.targetPatch === this &&
                worker.minerals < worker.maxMinerals &&
                worker.state !== 'mining'
            );
            
            // Periodically verify worker count accuracy
            let actualWorkerCount = 0;
            game.workers.forEach(worker => {
                if (worker.targetPatch === this) {
                    actualWorkerCount++;
                }
            });
            
            // Update worker count if it doesn't match reality
            if (this.workers !== actualWorkerCount) {
                this.workers = actualWorkerCount;
            }
            
            this.lastWorkerCleanup = now;
        }
    }

    draw(ctx, screenX, screenY) {
        const mineralRatio = this.minerals / this.maxMinerals;
        const crystalCount = Math.max(3, Math.floor(mineralRatio * 8));
        const visualSize = this.size * SIZE_MULTIPLIER;
        const baseSize = visualSize * 0.8;
        const time = Date.now() / 1000;
        
        // Draw base platform with highlight if selected
        ctx.fillStyle = this.isSelected ? '#2a2a2a' : '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + visualSize/4, visualSize/2, visualSize/4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw crystals
        for (let i = 0; i < crystalCount; i++) {
            const angle = (i / crystalCount) * Math.PI * 2;
            const offsetX = Math.cos(angle) * (baseSize/4);
            const offsetY = Math.sin(angle) * (baseSize/4);
            
            const height = baseSize * (0.3 + mineralRatio * 0.7);
            
            const pulse = 0.7 + Math.sin(time * 2 + i) * 0.3;
            const alpha = 0.3 + mineralRatio * 0.7;
            
            const baseColor = this.isSelected ? 55 : 0;
            ctx.fillStyle = `rgba(${baseColor}, ${200 + pulse * 55}, ${200 + pulse * 55}, ${alpha})`;
            
            ctx.beginPath();
            ctx.moveTo(screenX + offsetX, screenY + offsetY);
            ctx.lineTo(screenX + offsetX - visualSize/8, screenY + offsetY + height/2);
            ctx.lineTo(screenX + offsetX, screenY + offsetY - height);
            ctx.lineTo(screenX + offsetX + visualSize/8, screenY + offsetY + height/2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowColor = this.isSelected ? 'rgba(100, 255, 255, 0.7)' : 'rgba(0, 255, 255, 0.5)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw mineral amount
        ctx.fillStyle = 'white';
        ctx.font = `${Math.floor(16 * SIZE_MULTIPLIER)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(this.minerals), screenX, screenY + visualSize/2 + 20);
        
        // Draw worker count and queue info
        if (this.workers > 0) {
            ctx.fillStyle = '#4a9eff';
            const queueText = this.miningQueue.length > 0 ? ` (+${this.miningQueue.length} queued)` : '';
            const minerText = this.currentMiner ? ' (1 mining)' : '';
            ctx.fillText(`${this.workers} workers${minerText}${queueText}`, screenX, screenY + visualSize/2 + 40);
        }

        // Draw mining progress bar when someone is mining
        if (this.currentMiner) {
            const now = Date.now();
            const progress = Math.min(1, (now - this.lastMineTime) / this.miningDelay);
            const barWidth = visualSize;
            const barHeight = 4;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(screenX - barWidth/2, screenY - visualSize/2 - 10, barWidth, barHeight);
            
            // Progress
            ctx.fillStyle = '#4a9eff';
            ctx.fillRect(screenX - barWidth/2, screenY - visualSize/2 - 10, barWidth * progress, barHeight);
        }
    }
} 
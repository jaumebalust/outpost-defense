export class WorkerSystem {
    static update(game) {
        // Update each worker
        game.workers = game.workers.filter(worker => {
            // Store selection state before update
            const wasSelected = worker.isSelected;
            
            // Update worker state
            worker.update();

            // Check if worker's target patch is depleted
            if (worker.targetPatch && worker.targetPatch.minerals <= 0 && worker.minerals === 0) {
                // Find new patch with minerals
                let newPatch = null;
                let shortestDist = Infinity;
                
                game.mineralPatches.forEach(patch => {
                    if (patch.minerals > 0) {
                        const dist = Math.hypot(worker.x - patch.x, worker.y - patch.y);
                        if (dist < shortestDist) {
                            shortestDist = dist;
                            newPatch = patch;
                        }
                    }
                });

                if (newPatch) {
                    // Use the game's robust assignWorkerToPatch method
                    game.assignWorkerToPatch(worker, newPatch);
                    worker.isSelected = wasSelected;
                    return true;
                } else {
                    // No available patches, remove worker properly
                    if (worker.targetPatch) {
                        // Clean up worker references in the patch
                        if (worker.targetPatch.currentMiner === worker) {
                            worker.targetPatch.currentMiner = null;
                            worker.targetPatch.lastMineTime = Date.now(); // Reset mining time
                        }
                        
                        const queueIndex = worker.targetPatch.miningQueue.indexOf(worker);
                        if (queueIndex !== -1) {
                            worker.targetPatch.miningQueue.splice(queueIndex, 1);
                        }
                        
                        worker.targetPatch.workers--;
                    }
                    return false;
                }
            }

            worker.isSelected = wasSelected;
            return true;
        });
        
        // Periodically check for orphaned workers with no valid target patch
        if (Math.random() < 0.1) { // 10% chance per update to check
            game.workers.forEach(worker => {
                if (worker.targetPatch && (!game.mineralPatches.includes(worker.targetPatch) || 
                    (worker.targetPatch.minerals <= 0 && worker.minerals === 0))) {
                    // Find a new patch for the worker
                    let newPatch = null;
                    let shortestDist = Infinity;
                    
                    game.mineralPatches.forEach(patch => {
                        if (patch.minerals > 0) {
                            const dist = Math.hypot(worker.x - patch.x, worker.y - patch.y);
                            if (dist < shortestDist) {
                                shortestDist = dist;
                                newPatch = patch;
                            }
                        }
                    });
                    
                    if (newPatch) {
                        game.assignWorkerToPatch(worker, newPatch);
                    }
                }
            });
        }
    }
} 
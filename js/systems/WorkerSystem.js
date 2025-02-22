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
                    // Reassign worker to new patch
                    worker.targetPatch.workers--;
                    worker.targetPatch = newPatch;
                    newPatch.workers++;
                    worker.state = 'toMineral';
                    worker.isSelected = wasSelected;
                    return true;
                } else {
                    // No available patches, remove worker
                    worker.targetPatch.workers--;
                    return false;
                }
            }

            worker.isSelected = wasSelected;
            return true;
        });
    }
} 
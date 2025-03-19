export class MinimapSystem {
    static MINIMAP_SIZE = 200;
    static MINIMAP_PADDING = 10;

    static draw(game, ctx) {
        const minimapSize = MinimapSystem.MINIMAP_SIZE;
        const padding = MinimapSystem.MINIMAP_PADDING;
        
        // Calculate scale factors
        const scaleX = minimapSize / game.camera.worldWidth;
        const scaleY = minimapSize / game.camera.worldHeight;
        
        // Draw minimap background - moved back to bottom-left corner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            padding,
            ctx.canvas.height - minimapSize - padding,
            minimapSize,
            minimapSize
        );
        
        // Draw border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            padding,
            ctx.canvas.height - minimapSize - padding,
            minimapSize,
            minimapSize
        );
        
        // Draw minimap title
        ctx.fillStyle = '#4a9eff';
        ctx.font = 'bold 14px "Orbitron", sans-serif';
        ctx.fillText('TACTICAL MAP', padding + 50, ctx.canvas.height - minimapSize - padding - 10);

        // Draw mineral patches
        game.mineralPatches.forEach(patch => {
            ctx.fillStyle = '#00ffff';
            const x = padding + (patch.x * scaleX);
            const y = ctx.canvas.height - minimapSize - padding + (patch.y * scaleY);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw connection line between base and default mineral patch
        if (game.base.defaultMineralPatch && game.selectedBase) {
            const baseX = padding + (game.base.x * scaleX);
            const baseY = ctx.canvas.height - minimapSize - padding + (game.base.y * scaleY);
            const patchX = padding + (game.base.defaultMineralPatch.x * scaleX);
            const patchY = ctx.canvas.height - minimapSize - padding + (game.base.defaultMineralPatch.y * scaleY);
            
            // Draw dashed line
            ctx.save();
            ctx.strokeStyle = 'rgba(74, 158, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(patchX, patchY);
            ctx.stroke();
            ctx.restore();
        }

        // Draw base
        ctx.fillStyle = '#4a9eff';
        const baseX = padding + (game.base.x * scaleX);
        const baseY = ctx.canvas.height - minimapSize - padding + (game.base.y * scaleY);
        ctx.beginPath();
        ctx.arc(baseX, baseY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw workers
        game.workers.forEach(worker => {
            ctx.fillStyle = '#4a9eff';
            const x = padding + (worker.x * scaleX);
            const y = ctx.canvas.height - minimapSize - padding + (worker.y * scaleY);
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw turrets
        game.turrets.forEach(turret => {
            ctx.fillStyle = '#2980b9';
            const x = padding + (turret.x * scaleX);
            const y = ctx.canvas.height - minimapSize - padding + (turret.y * scaleY);
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw enemies
        game.enemies.forEach(enemy => {
            ctx.fillStyle = '#ff0000';
            const x = padding + (enemy.x * scaleX);
            const y = ctx.canvas.height - minimapSize - padding + (enemy.y * scaleY);
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw current view rectangle
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            padding + (game.camera.x * scaleX),
            ctx.canvas.height - minimapSize - padding + (game.camera.y * scaleY),
            (ctx.canvas.width * scaleX),
            (ctx.canvas.height * scaleY)
        );
    }

    static handleClick(game, x, y) {
        const minimapSize = MinimapSystem.MINIMAP_SIZE;
        const padding = MinimapSystem.MINIMAP_PADDING;
        
        // Check if click is within minimap bounds - updated back to bottom-left position
        if (x >= padding &&
            x <= padding + minimapSize &&
            y >= game.canvas.height - minimapSize - padding &&
            y <= game.canvas.height - padding) {
            
            console.log('Minimap click detected at:', x, y);
            console.log('Minimap bounds: x:', padding, 'to', padding + minimapSize, 
                        'y:', game.canvas.height - minimapSize - padding, 'to', game.canvas.height - padding);
            
            // Convert minimap coordinates to world coordinates
            const scaleX = game.camera.worldWidth / minimapSize;
            const scaleY = game.camera.worldHeight / minimapSize;
            
            const worldX = (x - padding) * scaleX;
            const worldY = (y - (game.canvas.height - minimapSize - padding)) * scaleY;
            
            console.log('Converted to world coordinates:', worldX, worldY);
            
            // Center the camera on the clicked point
            const oldCameraX = game.camera.x;
            const oldCameraY = game.camera.y;
            
            game.camera.x = Math.max(0, Math.min(
                game.camera.worldWidth - game.canvas.width / game.camera.zoom,
                worldX - (game.canvas.width / game.camera.zoom) / 2
            ));
            game.camera.y = Math.max(0, Math.min(
                game.camera.worldHeight - game.canvas.height / game.camera.zoom,
                worldY - (game.canvas.height / game.camera.zoom) / 2
            ));
            
            console.log('Camera moved from:', oldCameraX, oldCameraY, 'to:', game.camera.x, game.camera.y);
            
            // Reset camera velocity to prevent drift after clicking
            if (game.camera.velocityX !== undefined) {
                game.camera.velocityX = 0;
                game.camera.velocityY = 0;
            }
            
            // Play click sound for feedback
            game.soundSystem.play('click');
            
            // Return true to indicate the click was handled
            return true;
        }
        
        // Click was not in minimap bounds
        return false;
    }

    static isInMinimapBounds(x, y, canvasHeight) {
        const minimapSize = MinimapSystem.MINIMAP_SIZE;
        const padding = MinimapSystem.MINIMAP_PADDING;
        
        // Updated back to check bottom-left corner
        return x >= padding &&
               x <= padding + minimapSize &&
               y >= canvasHeight - minimapSize - padding &&
               y <= canvasHeight - padding;
    }
} 
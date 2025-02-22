import { Enemy } from '../entities/Enemy.js';
import { showWarning } from '../utils/constants.js';

export class SpawnSystem {
    static update(game) {
        const currentTime = Date.now();
        
        // Check if it's time for next wave
        if (currentTime - game.waveStartTime > 45000) {
            game.wave++;
            game.waveStartTime = currentTime;
            game.spawnInterval = Math.max(1500, 7000 - (game.wave - 1) * 500);
            showWarning(`Wave ${game.wave} incoming!`);
        }

        // Spawn enemies based on current interval
        if (currentTime - game.lastSpawn > game.spawnInterval) {
            const baseEnemies = 1;
            const extraEnemies = Math.floor((game.wave - 1) / 3);
            const numEnemies = baseEnemies + extraEnemies;
            
            // Define spawn zones in world coordinates
            const spawnZones = [
                () => ({ x: Math.random() * game.camera.worldWidth, y: 0 }), // Top
                () => ({ x: 0, y: Math.random() * (game.camera.worldHeight * 0.7) }), // Left
                () => ({ x: game.camera.worldWidth, y: Math.random() * (game.camera.worldHeight * 0.7) }) // Right
            ];
            
            // Spawn enemies with type distribution based on wave
            for (let i = 0; i < numEnemies; i++) {
                const spawnZone = spawnZones[Math.floor(Math.random() * spawnZones.length)];
                const position = spawnZone();
                
                // Determine enemy type based on wave and randomness
                let enemyType = 'normal';
                const rand = Math.random();
                
                if (game.wave >= 10 && rand < 0.1) {
                    enemyType = 'boss';
                } else if (game.wave >= 5) {
                    if (rand < 0.2) {
                        enemyType = 'elite';
                    } else if (rand < 0.4) {
                        enemyType = 'fast';
                    } else if (rand < 0.6) {
                        enemyType = 'tank';
                    }
                } else if (game.wave >= 3) {
                    if (rand < 0.3) {
                        enemyType = 'fast';
                    } else if (rand < 0.5) {
                        enemyType = 'tank';
                    }
                }
                
                game.enemies.push(new Enemy(position.x, position.y, game.wave, enemyType));
            }
            
            // Special wave events
            if (game.wave % 5 === 0) {
                // Boss wave
                const spawnZone = spawnZones[Math.floor(Math.random() * spawnZones.length)];
                const position = spawnZone();
                const bossEnemy = new Enemy(position.x, position.y, game.wave, 'boss');
                game.enemies.push(bossEnemy);
                showWarning('Boss enemy incoming!');
            } else if (game.wave % 3 === 0) {
                // Elite squad
                const squadSize = Math.min(3, Math.floor(game.wave / 3));
                for (let i = 0; i < squadSize; i++) {
                    const spawnZone = spawnZones[Math.floor(Math.random() * spawnZones.length)];
                    const position = spawnZone();
                    const eliteEnemy = new Enemy(position.x, position.y, game.wave, 'elite');
                    game.enemies.push(eliteEnemy);
                }
                showWarning('Elite squad incoming!');
            }
            
            game.lastSpawn = currentTime;
        }
    }
} 
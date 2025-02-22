export class MissileSystem {
    static update(game) {
        // Update missile positions and remove those that are out of bounds
        game.missiles = game.missiles.filter(missile => {
            missile.update();
            
            // Remove missiles that go out of world bounds
            return (
                missile.x >= 0 &&
                missile.x <= game.camera.worldWidth &&
                missile.y >= 0 &&
                missile.y <= game.camera.worldHeight &&
                missile.active
            );
        });
    }
} 
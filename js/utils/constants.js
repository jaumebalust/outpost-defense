// Global size multiplier - adjust this to make everything bigger or smaller
export const SIZE_MULTIPLIER = 1.2;

// Scale factors for game elements
export const SCALE = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * 2 * SIZE_MULTIPLIER;

// Game constants
export const COSTS = {
    WORKER: 50,
    TURRET: 100,
    BATTERY: 150
};

export const COMBAT = {
    COMBAT_RANGE: 30,
    BASE_TURRET_DAMAGE: 25,
    BASE_TURRET_RANGE: 200,
    BASE_FIRE_RATE: 90,
    MISSILE_SPEED: 5,
    ENEMY_SPEED: {
        NORMAL: 1.2,
        ELITE: 0.8,
        FAST: 2.0,
        TANK: 0.5,
        BOSS: 0.4
    },
    ENEMY_ATTACK_SPEED: {
        NORMAL: 90,
        ELITE: 60,
        FAST: 120,
        TANK: 120,
        BOSS: 45
    },
    ENEMY_HP: {
        NORMAL: 100,
        ELITE: 150,
        FAST: 60,
        TANK: 300,
        BOSS: 1000
    },
    ENEMY_DAMAGE: {
        NORMAL: 10,
        ELITE: 15,
        FAST: 5,
        TANK: 20,
        BOSS: 40
    }
};

export const UNIT_STATS = {
    WORKER: {
        HP: 50,
        SPEED: 1.2,
        SIZE: 40
    },
    TURRET: {
        HP: 200,
        SIZE: 40,
        RANGE: 200
    },
    BATTERY: {
        HP: 300,
        SIZE: 40,
        RANGE: 250,
        ENERGY: 800,
        HEAL_AMOUNT: 3,
        ENERGY_COST: 0.15,
        ENERGY_REGEN: 0.15
    }
};

// Helper functions
export function showWarning(message) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.textContent = message;
    document.body.appendChild(warningDiv);
    setTimeout(() => warningDiv.remove(), 2000);
}

export function calculateDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

export function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
} 
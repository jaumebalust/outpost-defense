// Global size multiplier - adjust this to make everything bigger or smaller
export const SIZE_MULTIPLIER = 1.2;

// Scale factors for game elements - converted to a function to be recalculated when needed
export function getScale() {
    return Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * 2 * SIZE_MULTIPLIER;
}

// Initial scale value
export let SCALE = getScale();

// Function to update scale when window resizes
export function updateScale() {
    SCALE = getScale();
    return SCALE;
}

// Game constants
export const COSTS = {
    WORKER: 50,
    TURRET: 100,
    BATTERY: 150,
    MISSILE_LAUNCHER: 300  // New missile launcher turret type
};

export const COMBAT = {
    COMBAT_RANGE: 30,
    BASE_TURRET_DAMAGE: 25,
    BASE_TURRET_RANGE: 200,
    BASE_FIRE_RATE: 90,
    MISSILE_SPEED: 5,
    // Missile launcher stats
    MISSILE_LAUNCHER_DAMAGE: 75,  // Higher damage for bosses
    MISSILE_LAUNCHER_RANGE: 300,  // Longer range
    MISSILE_LAUNCHER_FIRE_RATE: 150,  // Slower fire rate to balance
    // Enemy stats
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
    },
    // Boss damage multipliers
    DAMAGE_MULTIPLIER: {
        NORMAL: 1.0,
        BOSS: 2.5  // Missile launchers do 2.5x damage to bosses
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
    MISSILE_LAUNCHER: {
        HP: 180,
        SIZE: 45,
        RANGE: 300
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
    // Get or create the notification container
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Check if the same warning message already exists
    const existingWarnings = container.querySelectorAll('.warning-message');
    for (const existing of existingWarnings) {
        if (existing.textContent === message) {
            // Duplicate message found, don't create a new one
            return;
        }
    }
    
    // Create the warning message
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.textContent = message;
    
    // Add the warning to the container
    container.appendChild(warningDiv);
    
    // Remove this specific warning after animation completes
    setTimeout(() => {
        if (warningDiv.parentNode === container) {
            container.removeChild(warningDiv);
        }
        
        // If no warnings left, remove the container
        if (container.children.length === 0) {
            document.body.removeChild(container);
        }
    }, 1000);
}

export function calculateDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

export function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
} 
import { UNIT_STATS } from '../utils/constants.js';
import { Battery } from '../entities/Battery.js';

export class BatterySystem {
    static update(game) {
        game.batteries.forEach(battery => {
            // Clear previous healing targets
            battery.healingTargets = [];

            // Regenerate energy over time
            if (battery.energy < UNIT_STATS.BATTERY.ENERGY) {
                battery.energy = Math.min(
                    UNIT_STATS.BATTERY.ENERGY,
                    battery.energy + UNIT_STATS.BATTERY.ENERGY_REGEN
                );
            }

            // Set minimum energy threshold for healing
            const MIN_ENERGY_THRESHOLD = 10;
            
            // Calculate energy cost based on potential healing targets
            // More efficient energy use when healing multiple units
            const ENERGY_PER_UNIT = 1;
            
            if (battery.energy >= MIN_ENERGY_THRESHOLD) {
                let damagedUnits = [];

                // Check base first (highest priority)
                if (game.base.hp < game.base.maxHp) {
                    const dist = Math.hypot(battery.x - game.base.x, battery.y - game.base.y);
                    if (dist <= battery.range) {
                        damagedUnits.push(game.base);
                    }
                }

                // Find all damaged units in range
                game.workers.forEach(worker => {
                    if (worker.hp < worker.maxHp) {
                        const dist = Math.hypot(battery.x - worker.x, battery.y - worker.y);
                        if (dist <= battery.range) {
                            damagedUnits.push(worker);
                        }
                    }
                });

                game.turrets.forEach(turret => {
                    if (turret.hp < turret.maxHp) {
                        const dist = Math.hypot(battery.x - turret.x, battery.y - turret.y);
                        if (dist <= battery.range) {
                            damagedUnits.push(turret);
                        }
                    }
                });

                // Check other batteries for HP damage only
                game.batteries.forEach(otherBattery => {
                    if (otherBattery !== battery && otherBattery.hp < otherBattery.maxHp) {
                        const dist = Math.hypot(battery.x - otherBattery.x, battery.y - otherBattery.y);
                        if (dist <= battery.range) {
                            damagedUnits.push(otherBattery);
                        }
                    }
                });

                // Heal units if we have damaged units to heal
                if (damagedUnits.length > 0) {
                    // Scale energy cost based on number of units, with a minimum cost
                    const totalEnergyCost = Math.max(MIN_ENERGY_THRESHOLD, damagedUnits.length * ENERGY_PER_UNIT);
                    
                    // Full healing mode - use larger amounts of energy for more effective healing
                    if (battery.energy >= totalEnergyCost) {
                        damagedUnits.forEach(unit => {
                            // Handle base healing separately since it's not an Entity
                            if (unit === game.base) {
                                unit.hp = Math.min(unit.maxHp, unit.hp + UNIT_STATS.BATTERY.HEAL_AMOUNT);
                            } else {
                                // Heal HP for Entity-based units
                                unit.heal(UNIT_STATS.BATTERY.HEAL_AMOUNT);
                            }
                            
                            battery.healingTargets.push(unit);
                        });
                        battery.energy -= totalEnergyCost;
                    }
                    // Emergency healing mode - when energy is low, heal less but still provide some healing
                    else if (battery.energy > 0) {
                        // Use whatever energy we have left for reduced healing
                        const emergencyHealAmount = Math.max(1, Math.floor(UNIT_STATS.BATTERY.HEAL_AMOUNT / 2));
                        damagedUnits.forEach(unit => {
                            // Handle base healing separately since it's not an Entity
                            if (unit === game.base) {
                                unit.hp = Math.min(unit.maxHp, unit.hp + emergencyHealAmount);
                            } else {
                                // Heal HP for Entity-based units
                                unit.heal(emergencyHealAmount);
                            }
                            
                            battery.healingTargets.push(unit);
                        });
                        // Use all remaining energy
                        battery.energy = 0;
                    }
                }
            }
        });
    }
} 
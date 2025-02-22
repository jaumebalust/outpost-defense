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

            // Only heal if we have enough energy for at least one complete healing operation (5 energy)
            const BATCH_ENERGY_COST = 5;
            if (battery.energy >= BATCH_ENERGY_COST) {
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

                // Heal units if we have enough energy for all of them
                if (damagedUnits.length > 0) {
                    const totalEnergyCost = BATCH_ENERGY_COST;
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
                }
            }
        });
    }
} 
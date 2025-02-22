export class MilestoneSystem {
    constructor(game) {
        this.game = game;
        this.completedMilestones = new Set();
        this.currentPhase = "PHASE_1";
        this.showingNotification = false;
    }

    get MILESTONES() {
        return {
            PHASE_1: {
                name: "Establishment",
                goals: [
                    { id: "workers_3", description: "Build 3 workers", check: () => this.game.workers.length >= 3 },
                    { id: "minerals_500", description: () => `Collect 500 minerals (${Math.floor(this.game.totalMineralsCollected)})`, check: () => this.game.totalMineralsCollected >= 500 },
                    { id: "first_turret", description: "Build your first turret", check: () => this.game.turrets.length >= 1 }
                ]
            },
            PHASE_2: {
                name: "Infrastructure",
                goals: [
                    { id: "workers_5", description: "Reach 5 workers", check: () => this.game.workers.length >= 5 },
                    { id: "turrets_3", description: "Build 3 turrets", check: () => this.game.turrets.length >= 3 },
                    { id: "first_battery", description: "Build first battery", check: () => this.game.batteries.length >= 1 },
                    { id: "minerals_5000", description: () => `Accumulate 5,000 minerals (${Math.floor(this.game.totalMineralsCollected)})`, check: () => this.game.totalMineralsCollected >= 5000 }
                ]
            },
            PHASE_3: {
                name: "Fortification",
                goals: [
                    { id: "survive_wave_5", description: "Survive Wave 5 with 75%+ health", 
                      check: () => this.game.wave > 5 && this.game.base.hp >= this.game.base.maxHp * 0.75 },
                    { id: "workers_8", description: "Have 8 workers operational", check: () => this.game.workers.length >= 8 },
                    { id: "defense_setup", description: "Maintain 5 turrets and 2 batteries", 
                      check: () => this.game.turrets.length >= 5 && this.game.batteries.length >= 2 },
                    { id: "minerals_15000", description: () => `Reach 15,000 minerals (${Math.floor(this.game.totalMineralsCollected)})`, check: () => this.game.totalMineralsCollected >= 15000 }
                ]
            },
            FINAL: {
                name: "Final Challenge",
                goals: [
                    { id: "survive_10_min", description: "Survive for 10 minutes", 
                      check: () => (Date.now() - this.game.gameStartTime) >= 600000 },
                    { id: "base_health", description: "Keep base health above 50%", 
                      check: () => this.game.base.hp >= this.game.base.maxHp * 0.5 },
                    { id: "mineral_patch", description: "Have at least one mineral patch not depleted", 
                      check: () => this.game.mineralPatches.some(patch => patch.minerals > 0) },
                    { id: "final_wave", description: "Defeat the final wave", 
                      check: () => this.game.wave >= 10 && this.game.enemies.length === 0 }
                ]
            }
        };
    }

    update() {
        const currentPhaseGoals = this.MILESTONES[this.currentPhase].goals;
        let allCompleted = true;
        
        // Check all goals in current phase
        currentPhaseGoals.forEach(goal => {
            const completed = goal.check();
            if (completed && !this.completedMilestones.has(goal.id)) {
                this.completedMilestones.add(goal.id);
                const description = typeof goal.description === 'function' ? goal.description() : goal.description;
                this.showMilestoneNotification(description);
            }
            if (!completed) {
                allCompleted = false;
            }
        });

        // Progress to next phase if all current goals are completed
        if (allCompleted) {
            const nextPhase = this.getNextPhase(this.currentPhase);
            if (nextPhase) {
                const currentPhaseName = this.currentPhase; // Store current phase name
                
                // Award bonus minerals for the completed phase
                switch (currentPhaseName) {
                    case "PHASE_1":
                        this.game.minerals += 500;
                        break;
                    case "PHASE_2":
                        this.game.minerals += 1000;
                        break;
                    case "PHASE_3":
                        this.game.minerals += 2000;
                        break;
                }

                // Show completion notification for the current phase
                this.showPhaseCompleteNotification(currentPhaseName);
                
                // Clear completed milestones before changing phase
                this.completedMilestones.clear();
                
                // Set the new phase
                this.currentPhase = nextPhase;
            } else if (this.currentPhase === "FINAL" && !this.game.victory) {
                this.game.victory = true;
                this.showVictoryScreen();
            }
        }
    }

    getNextPhase(currentPhase) {
        const phases = ["PHASE_1", "PHASE_2", "PHASE_3", "FINAL"];
        const currentIndex = phases.indexOf(currentPhase);
        if (currentIndex < phases.length - 1) {
            return phases[currentIndex + 1];
        }
        return null;
    }

    showPhaseCompleteNotification(phase) {
        const phaseName = this.MILESTONES[phase].name;
        this.game.showWarning(`${phaseName} Phase Complete!`, 3000);
    }

    showMilestoneNotification(description) {
        if (this.showingNotification) return;
        
        this.showingNotification = true;
        this.game.showWarning(`Milestone Complete: ${description}!`, 3000);
        setTimeout(() => {
            this.showingNotification = false;
        }, 3000);
    }

    showVictoryScreen() {
        // Victory screen will be handled by UISystem
        this.game.gameOver = true;
        this.game.victory = true;
    }
} 
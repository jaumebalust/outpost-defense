export class SoundSystem {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        
        // Initialize all game sounds
        this.loadSounds();
    }

    loadSounds() {
        // UI Sounds (using .wav for better responsiveness)
        this.addSound('click', 'sounds/click.wav');
        this.addSound('error', 'sounds/error.wav');
        
        // Building Sounds (using .wav for instant feedback)
        this.addSound('build-worker', 'sounds/build-worker.wav');
        this.addSound('build-turret', 'sounds/build-turret.wav');
        this.addSound('build-battery', 'sounds/build-battery.wav');
        
        // Combat Sounds (using .wav for minimal latency)
        this.addSound('shoot', 'sounds/shoot.wav');
        this.addSound('explosion', 'sounds/explosion.wav');
        
        // Background Music (using .mp3 for better compression on long audio)
        this.music = new Audio('sounds/background-music.mp3');
        this.music.loop = true;
    }

    addSound(name, path) {
        this.sounds[name] = new Audio(path);
    }

    play(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;
        
        // Clone the audio to allow multiple simultaneous plays
        const sound = this.sounds[soundName].cloneNode();
        sound.volume = 0.3; // Adjust volume as needed
        sound.play().catch(error => console.log("Audio play failed:", error));
    }

    playMusic() {
        if (this.isMuted || !this.music) return;
        this.music.volume = 0.1; // Lower volume for background music
        this.music.play().catch(error => console.log("Music play failed:", error));
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
        return this.isMuted;
    }
} 
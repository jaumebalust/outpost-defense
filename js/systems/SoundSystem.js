export class SoundSystem {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.musicStarted = false;
        
        // Load sounds
        this.loadSounds();
    }
    
    loadSounds() {
        // Load sound effects
        this.sounds = {
            'click': new Audio('sounds/click.wav'),
            'build': new Audio('sounds/build.mp3'),
            'build-worker': new Audio('sounds/build-worker.mp3'),
            'build-turret': new Audio('sounds/build-turret.mp3'),
            'build-battery': new Audio('sounds/build-battery.mp3'),
            'build-missile-launcher': new Audio('sounds/build-missile-launcher.mp3'),
            'error': new Audio('sounds/error.mp3'),
            'explosion': new Audio('sounds/explosion.mp3'),
            'missile': new Audio('sounds/missile.mp3'),
            'select': new Audio('sounds/select.mp3')
        };
        
        // Set volume for all sounds
        for (const sound in this.sounds) {
            this.sounds[sound].volume = 0.3;
        }
        
        // Load background music
        this.music = new Audio('sounds/background.mp3');
        this.music.loop = true;
        this.music.volume = 0.1;
    }
    
    play(soundName) {
        if (this.isMuted) return;
        
        if (this.sounds[soundName]) {
            // Clone the audio to allow overlapping sounds
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = this.sounds[soundName].volume;
            sound.play().catch(error => {
                console.log(`Sound play failed: ${error}`);
            });
            
            // If this is the first user interaction, try to start music
            if (!this.musicStarted) {
                this.playMusic();
            }
        }
    }
    
    playMusic() {
        if (this.isMuted) return;
        
        // Try to play music, but don't throw an error if it fails due to autoplay restrictions
        this.music.play().then(() => {
            this.musicStarted = true;
            console.log('Background music started successfully');
        }).catch(error => {
            console.log(`Music play failed: ${error}`);
            // We'll try again on the next user interaction
        });
    }
    
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.musicStarted = false;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // Pause all sounds
            for (const sound in this.sounds) {
                this.sounds[sound].pause();
                this.sounds[sound].currentTime = 0;
            }
            
            // Pause music
            if (this.music) {
                this.music.pause();
            }
            
            return '🔇 Sound Off';
        } else {
            // Resume music if it was playing before
            if (this.musicStarted) {
                this.music.play().catch(error => {
                    console.log(`Music resume failed: ${error}`);
                });
            }
            
            return '🔊 Sound On';
        }
    }
} 
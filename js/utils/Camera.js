import { MinimapSystem } from '../systems/MinimapSystem.js';

export class Camera {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.worldWidth = 4000; // The total size of the game world
        this.worldHeight = 3000;
        this.moveSpeed = 20; // Increased for better responsiveness
        this.edgeScrollThreshold = 100; // Pixels from edge to start scrolling
        this.maxScrollSpeed = 30; // Maximum scroll speed
        
        // Smooth movement properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.acceleration = 0.8; // Reduced for smoother acceleration
        this.friction = 0.92; // Increased for smoother deceleration
        this.maxVelocity = 25; // Increased for better top speed
        
        // Track pressed keys
        this.pressedKeys = new Set();
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.update = this.update.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mousemove', this.handleMouseMove);
    }

    handleKeyDown(e) {
        // Only block keyboard movement if typing in an input field
        if (e.target.tagName.toLowerCase() === 'input') {
            return;
        }

        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            this.pressedKeys.add(key);
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.pressedKeys.delete(key);
    }

    // New method to be called every frame from the game loop
    update() {
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        let targetVelocityX = 0;
        let targetVelocityY = 0;

        // Calculate target velocity based on pressed keys
        if (this.pressedKeys.has('w') || this.pressedKeys.has('arrowup')) targetVelocityY -= this.moveSpeed;
        if (this.pressedKeys.has('s') || this.pressedKeys.has('arrowdown')) targetVelocityY += this.moveSpeed;
        if (this.pressedKeys.has('a') || this.pressedKeys.has('arrowleft')) targetVelocityX -= this.moveSpeed;
        if (this.pressedKeys.has('d') || this.pressedKeys.has('arrowright')) targetVelocityX += this.moveSpeed;

        // Normalize diagonal movement
        if (targetVelocityX !== 0 && targetVelocityY !== 0) {
            const length = Math.sqrt(targetVelocityX * targetVelocityX + targetVelocityY * targetVelocityY);
            targetVelocityX = (targetVelocityX / length) * this.moveSpeed;
            targetVelocityY = (targetVelocityY / length) * this.moveSpeed;
        }

        // Smoothly accelerate toward target velocity
        this.velocityX += (targetVelocityX - this.velocityX) * this.acceleration;
        this.velocityY += (targetVelocityY - this.velocityY) * this.acceleration;

        // Apply friction when no keys are pressed
        if (targetVelocityX === 0) this.velocityX *= this.friction;
        if (targetVelocityY === 0) this.velocityY *= this.friction;

        // Clamp velocity to maximum
        const currentVelocity = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (currentVelocity > this.maxVelocity) {
            this.velocityX = (this.velocityX / currentVelocity) * this.maxVelocity;
            this.velocityY = (this.velocityY / currentVelocity) * this.maxVelocity;
        }

        // Stop completely if velocity is very small
        if (Math.abs(this.velocityX) < 0.05) this.velocityX = 0;
        if (Math.abs(this.velocityY) < 0.05) this.velocityY = 0;

        // Apply movement with bounds checking
        this.x = Math.max(0, Math.min(this.worldWidth - this.game.canvas.width, this.x + this.velocityX));
        this.y = Math.max(0, Math.min(this.worldHeight - this.game.canvas.height, this.y + this.velocityY));
    }

    handleMouseMove(e) {
        if (this.game.isPaused) return;

        // Get the actual screen boundaries
        const rect = this.game.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Only proceed if mouse is within canvas bounds
        if (mouseX < 0 || mouseX > this.game.canvas.width || 
            mouseY < 0 || mouseY > this.game.canvas.height) {
            return;
        }

        // Check if mouse is in minimap area (now in bottom-left)
        const isInMinimap = MinimapSystem.isInMinimapBounds(mouseX, mouseY, this.game.canvas.height);

        // Calculate scroll speed based on how close to the edge the cursor is
        const getScrollSpeed = (distance) => {
            const factor = 1 - (distance / this.edgeScrollThreshold);
            return Math.ceil(this.maxScrollSpeed * factor);
        };

        // Calculate horizontal movement
        let dx = 0;
        let horizontalSpeed = 0;
        if (mouseX < this.edgeScrollThreshold) {
            // Only scroll if we're not in minimap area or at the very edge
            if (!isInMinimap || mouseX < 5) {
                horizontalSpeed = getScrollSpeed(mouseX);
                dx = -horizontalSpeed;
            }
        } else if (mouseX > this.game.canvas.width - this.edgeScrollThreshold) {
            horizontalSpeed = getScrollSpeed(this.game.canvas.width - mouseX);
            dx = horizontalSpeed;
        }

        // Calculate vertical movement
        let dy = 0;
        let verticalSpeed = 0;
        if (mouseY < this.edgeScrollThreshold) {
            verticalSpeed = getScrollSpeed(mouseY);
            dy = -verticalSpeed;
        } else if (mouseY > this.game.canvas.height - this.edgeScrollThreshold) {
            // Only scroll if we're not in minimap area or at the very edge
            if (!isInMinimap || mouseY > this.game.canvas.height - 5) {
                verticalSpeed = getScrollSpeed(this.game.canvas.height - mouseY);
                dy = verticalSpeed;
            }
        }

        // If moving diagonally, normalize the speed
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            const normalizedSpeed = Math.max(horizontalSpeed, verticalSpeed);
            dx = (dx / length) * normalizedSpeed;
            dy = (dy / length) * normalizedSpeed;
        }

        // Apply movement with bounds checking
        this.x = Math.max(0, Math.min(this.worldWidth - this.game.canvas.width, this.x + dx));
        this.y = Math.max(0, Math.min(this.worldHeight - this.game.canvas.height, this.y + dy));
    }

    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }

    // Check if a point in world coordinates is visible on screen
    isOnScreen(worldX, worldY) {
        const screen = this.worldToScreen(worldX, worldY);
        return screen.x >= -100 && 
               screen.x <= this.game.canvas.width + 100 && 
               screen.y >= -100 && 
               screen.y <= this.game.canvas.height + 100;
    }

    cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
    }
} 
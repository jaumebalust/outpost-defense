import { MinimapSystem } from '../systems/MinimapSystem.js';

export class Camera {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.worldWidth = 4000; // The total size of the game world
        this.worldHeight = 3000;
        this.moveSpeed = 100; // Increased from 15 to 30 for faster WASD movement
        this.edgeScrollThreshold = 100; // Increased from 50 to 150 pixels
        this.maxScrollSpeed = 30; // Maximum scroll speed
        
        // Track pressed keys
        this.pressedKeys = new Set();
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        
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
            this.updateCameraPosition();
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.pressedKeys.delete(key);
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        let dx = 0;
        let dy = 0;

        // Calculate movement direction
        if (this.pressedKeys.has('w') || this.pressedKeys.has('arrowup')) dy -= 1;
        if (this.pressedKeys.has('s') || this.pressedKeys.has('arrowdown')) dy += 1;
        if (this.pressedKeys.has('a') || this.pressedKeys.has('arrowleft')) dx -= 1;
        if (this.pressedKeys.has('d') || this.pressedKeys.has('arrowright')) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * this.moveSpeed;
            dy = (dy / length) * this.moveSpeed;
        } else {
            dx *= this.moveSpeed;
            dy *= this.moveSpeed;
        }

        // Apply movement with bounds checking
        this.x = Math.max(0, Math.min(this.worldWidth - this.game.canvas.width, this.x + dx));
        this.y = Math.max(0, Math.min(this.worldHeight - this.game.canvas.height, this.y + dy));
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

        // Check if mouse is in minimap area
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
            // Only scroll if we're at the very edge or not in minimap area
            if (mouseX < 5 || !isInMinimap) {
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
        } else if (mouseY > this.game.canvas.height - this.edgeScrollThreshold && 
                   e.clientY >= window.innerHeight - 5) { // Only scroll down if at bottom of window
            // Only scroll if we're at the very edge or not in minimap area
            if (e.clientY >= window.innerHeight - 5 || !isInMinimap) {
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
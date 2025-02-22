/**
 * Calculate the angle between two points in radians
 * @param {number} x1 - Starting point x coordinate
 * @param {number} y1 - Starting point y coordinate
 * @param {number} x2 - Target point x coordinate
 * @param {number} y2 - Target point y coordinate
 * @returns {number} Angle in radians
 */
export function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Calculate the distance between two points
 * @param {number} x1 - Starting point x coordinate
 * @param {number} y1 - Starting point y coordinate
 * @param {number} x2 - Target point x coordinate
 * @param {number} y2 - Target point y coordinate
 * @returns {number} Distance between points
 */
export function calculateDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
} 
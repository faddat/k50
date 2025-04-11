/**
 * @typedef {Object} NodePosition
 * @property {number} x - The x coordinate of the node
 * @property {number} y - The y coordinate of the node
 */

/**
 * @typedef {Object} AudioLevels
 * @property {number} bassLevel - Bass frequency level (0-1)
 * @property {number} midLevel - Mid frequency level (0-1)
 * @property {number} trebleLevel - Treble frequency level (0-1)
 * @property {number} overallLevel - Overall audio level (0-1)
 */

/**
 * @typedef {Object} ViewportSize
 * @property {number} width - Viewport width
 * @property {number} height - Viewport height
 * @property {number} aspect - Aspect ratio (width/height)
 * @property {number} min - Minimum of width and height
 * @property {number} max - Maximum of width and height
 */

/**
 * @typedef {Object} Node
 * @property {number} id - Unique identifier for the node
 * @property {number} x - Current x position
 * @property {number} y - Current y position
 * @property {number} vx - Velocity in x direction
 * @property {number} vy - Velocity in y direction
 * @property {string} color - Node color in any valid CSS format
 */

/**
 * Interface for visualization modes
 */
export class IVisualizationMode {
    /**
     * Get the initial position for a node
     * @param {number} index - Index of the node
     * @param {number} total - Total number of nodes
     * @param {ViewportSize} viewport - Current viewport size
     * @returns {NodePosition} Initial position for the node
     */
    getInitialPosition(index, total, viewport) {
        throw new Error('Method not implemented');
    }

    /**
     * Update node positions based on current state and audio
     * @param {Node[]} nodes - Array of nodes to update
     * @param {AudioLevels} audio - Current audio levels
     * @param {ViewportSize} viewport - Current viewport size
     * @param {number} time - Current time in seconds
     * @returns {void}
     */
    updatePositions(nodes, audio, viewport, time) {
        throw new Error('Method not implemented');
    }

    /**
     * Get the name of this visualization mode
     * @returns {string} Name of the visualization mode
     */
    getName() {
        throw new Error('Method not implemented');
    }
} 
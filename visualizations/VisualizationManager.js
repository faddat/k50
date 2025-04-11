import { ClassicMode } from './ClassicMode.js';
import { CircularMode } from './CircularMode.js';
import { SpiralMode } from './SpiralMode.js';
import { GridMode } from './GridMode.js';

export class VisualizationManager {
    constructor() {
        this.modes = {
            classic: new ClassicMode(),
            circular: new CircularMode(),
            spiral: new SpiralMode(),
            grid: new GridMode()
        };
        this.currentMode = 'classic';
    }

    /**
     * Get list of available visualization modes
     * @returns {string[]} Array of mode names
     */
    getAvailableModes() {
        return Object.keys(this.modes);
    }

    /**
     * Set current visualization mode
     * @param {string} modeName - Name of the mode to set
     * @throws {Error} If mode name is invalid
     */
    setMode(modeName) {
        if (!this.modes[modeName]) {
            throw new Error(`Invalid visualization mode: ${modeName}`);
        }
        this.currentMode = modeName;
    }

    /**
     * Get current visualization mode
     * @returns {string} Name of current mode
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Get initial positions for nodes
     * @param {number} total - Total number of nodes
     * @param {ViewportSize} viewport - Current viewport size
     * @returns {NodePosition[]} Array of initial positions
     */
    getInitialPositions(total, viewport) {
        const mode = this.modes[this.currentMode];
        return Array.from({ length: total }, (_, i) => 
            mode.getInitialPosition(i, total, viewport)
        );
    }

    /**
     * Update node positions based on current mode
     * @param {Node[]} nodes - Array of nodes to update
     * @param {AudioLevels} audio - Current audio levels
     * @param {ViewportSize} viewport - Current viewport size
     * @param {number} time - Current time in seconds
     */
    updatePositions(nodes, audio, viewport, time) {
        this.modes[this.currentMode].updatePositions(nodes, audio, viewport, time);
    }
} 
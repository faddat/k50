import { IVisualizationMode } from './IVisualizationMode.js';

export class CircularMode extends IVisualizationMode {
    constructor() {
        super();
        this.positionForce = 0.1; // Force to maintain target position
        this.damping = 0.9; // Velocity damping
    }

    getName() {
        return 'Circular';
    }

    getInitialPosition(index, total, viewport) {
        const radius = Math.min(viewport.width, viewport.height) * 0.4;
        const angle = (index * 2 * Math.PI) / total;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        };
    }

    updatePositions(nodes, audio, viewport, time) {
        const { bassLevel, midLevel, trebleLevel } = audio;
        const audioForce = (bassLevel + midLevel + trebleLevel) / 3;
        
        nodes.forEach((node, i) => {
            // Get target position
            const targetPos = this.getInitialPosition(i, nodes.length, viewport);
            
            // Calculate force towards target position
            const dx = targetPos.x - node.x;
            const dy = targetPos.y - node.y;
            
            let fx = dx * this.positionForce;
            let fy = dy * this.positionForce;
            
            // Add audio-reactive jitter
            if (audioForce > 0) {
                fx += (Math.random() - 0.5) * audioForce * 20;
                fy += (Math.random() - 0.5) * audioForce * 20;
                
                // Add circular motion based on bass
                const angle = time * (1 + bassLevel);
                fx += Math.cos(angle) * bassLevel * 10;
                fy += Math.sin(angle) * bassLevel * 10;
            }
            
            // Update velocity and position
            node.vx = (node.vx + fx) * this.damping;
            node.vy = (node.vy + fy) * this.damping;
            node.x += node.vx;
            node.y += node.vy;
        });
    }
} 
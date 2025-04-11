import { IVisualizationMode } from './IVisualizationMode.js';

export class SpiralMode extends IVisualizationMode {
    constructor() {
        super();
        this.positionForce = 0.1;
        this.damping = 0.9;
        this.spiralTurns = 3; // Number of spiral turns
    }

    getName() {
        return 'Spiral';
    }

    getInitialPosition(index, total, viewport) {
        const radius = Math.min(viewport.width, viewport.height) * 0.4;
        const angle = (index * 2 * Math.PI * this.spiralTurns) / total;
        const spiralRadius = (radius * index) / total;
        return {
            x: Math.cos(angle) * spiralRadius,
            y: Math.sin(angle) * spiralRadius
        };
    }

    updatePositions(nodes, audio, viewport, time) {
        const { bassLevel, midLevel, trebleLevel } = audio;
        const audioForce = (bassLevel + midLevel + trebleLevel) / 3;
        
        // Dynamic spiral adjustment based on audio
        this.spiralTurns = 3 + bassLevel * 2;
        
        nodes.forEach((node, i) => {
            // Get target position with dynamic spiral
            const targetPos = this.getInitialPosition(i, nodes.length, viewport);
            
            // Calculate force towards target position
            const dx = targetPos.x - node.x;
            const dy = targetPos.y - node.y;
            
            let fx = dx * this.positionForce;
            let fy = dy * this.positionForce;
            
            // Add audio-reactive effects
            if (audioForce > 0) {
                // Spiral expansion/contraction based on bass
                const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
                const expansionForce = bassLevel * 30;
                fx += (node.x / distFromCenter) * expansionForce;
                fy += (node.y / distFromCenter) * expansionForce;
                
                // Rotational force based on treble
                const rotationAngle = time * (1 + trebleLevel);
                const rotationForce = trebleLevel * 15;
                fx += (-node.y / distFromCenter) * rotationForce * Math.sin(rotationAngle);
                fy += (node.x / distFromCenter) * rotationForce * Math.sin(rotationAngle);
                
                // Random jitter based on mid frequencies
                fx += (Math.random() - 0.5) * midLevel * 10;
                fy += (Math.random() - 0.5) * midLevel * 10;
            }
            
            // Update velocity and position
            node.vx = (node.vx + fx) * this.damping;
            node.vy = (node.vy + fy) * this.damping;
            node.x += node.vx;
            node.y += node.vy;
        });
    }
} 
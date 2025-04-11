import { IVisualizationMode } from './IVisualizationMode.js';

export class GridMode extends IVisualizationMode {
    constructor() {
        super();
        this.positionForce = 0.1;
        this.damping = 0.9;
    }

    getName() {
        return 'Grid';
    }

    getInitialPosition(index, total, viewport) {
        const radius = Math.min(viewport.width, viewport.height) * 0.4;
        const cols = Math.ceil(Math.sqrt(total));
        const gridX = (index % cols) - cols/2;
        const gridY = Math.floor(index / cols) - cols/2;
        const scale = radius / (cols/2);
        return {
            x: gridX * scale,
            y: gridY * scale
        };
    }

    updatePositions(nodes, audio, viewport, time) {
        const { bassLevel, midLevel, trebleLevel } = audio;
        const audioForce = (bassLevel + midLevel + trebleLevel) / 3;
        
        nodes.forEach((node, i) => {
            // Get target position
            const targetPos = this.getInitialPosition(i, nodes.length, viewport);
            
            // Calculate base force towards target position
            const dx = targetPos.x - node.x;
            const dy = targetPos.y - node.y;
            
            let fx = dx * this.positionForce;
            let fy = dy * this.positionForce;
            
            // Add audio-reactive effects
            if (audioForce > 0) {
                // Wave pattern based on bass
                const wavePhase = time * 2 + i * 0.1;
                const waveAmplitude = bassLevel * 30;
                fx += Math.sin(wavePhase) * waveAmplitude;
                fy += Math.cos(wavePhase) * waveAmplitude;
                
                // Grid compression/expansion based on mid frequencies
                const gridPulse = Math.sin(time * 3) * midLevel * 20;
                fx += (node.x / targetPos.x) * gridPulse;
                fy += (node.y / targetPos.y) * gridPulse;
                
                // Random displacement based on treble
                if (trebleLevel > 0.5) {
                    fx += (Math.random() - 0.5) * trebleLevel * 15;
                    fy += (Math.random() - 0.5) * trebleLevel * 15;
                }
            }
            
            // Update velocity and position
            node.vx = (node.vx + fx) * this.damping;
            node.vy = (node.vy + fy) * this.damping;
            node.x += node.vx;
            node.y += node.vy;
        });
    }
} 
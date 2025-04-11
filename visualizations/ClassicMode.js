import { IVisualizationMode } from './IVisualizationMode.js';

export class ClassicMode extends IVisualizationMode {
    constructor() {
        super();
        this.charge = -1200; // Stronger repulsion
        this.centerForce = 0.02; // Center attraction
        this.damping = 0.98; // Velocity damping
    }

    getName() {
        return 'Classic';
    }

    getInitialPosition(index, total, viewport) {
        const radius = Math.min(viewport.width, viewport.height) * 0.4;
        const angle = (index * 2 * Math.PI) / total;
        return {
            x: Math.cos(angle) * radius * (0.9 + Math.random() * 0.2),
            y: Math.sin(angle) * radius * (0.9 + Math.random() * 0.2)
        };
    }

    updatePositions(nodes, audio, viewport, time) {
        const bounds = Math.min(viewport.width, viewport.height) * 0.8;
        const { bassLevel, midLevel } = audio;
        
        nodes.forEach((node, i) => {
            let fx = 0, fy = 0;

            // Node repulsion
            nodes.forEach(other => {
                if (node !== other) {
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const audioMod = 1 + (bassLevel * 0.5);
                    const force = (this.charge * audioMod) / (dist * dist + 100);
                    fx += force * dx / dist;
                    fy += force * dy / dist;
                }
            });

            // Audio-reactive forces
            const swirl = Math.sin(time * 0.5) * 0.5 + 0.5;
            const pulse = Math.sin(time * 2) * 0.5 + 0.5;
            
            const angle = (i * 2 * Math.PI / nodes.length) + (swirl * Math.PI * 2);
            const bassForce = bassLevel * 50 * (1 + pulse * 0.5);
            const midForce = midLevel * 40 * (1 + Math.sin(time * 3) * 0.3);
            
            // Swirling motion
            fx += Math.cos(angle) * bassForce;
            fy += Math.sin(angle) * bassForce;
            
            // Pulsing motion
            fx += Math.cos(time + i) * midForce;
            fy += Math.sin(time + i) * midForce;

            // Boundary forces
            const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
            const maxDist = bounds * (0.9 + bassLevel * 0.1);
            
            if (distFromCenter > maxDist) {
                const boundaryForce = Math.pow((distFromCenter - maxDist) / maxDist, 2) * 0.5;
                fx -= node.x * boundaryForce;
                fy -= node.y * boundaryForce;
            } else {
                const centerStrength = this.centerForce * (1 + (bassLevel + midLevel) * 0.2);
                fx -= node.x * centerStrength;
                fy -= node.y * centerStrength;
            }

            // Update velocity and position
            node.vx = (node.vx + fx * 0.1) * this.damping;
            node.vy = (node.vy + fy * 0.1) * this.damping;
            node.x += node.vx;
            node.y += node.vy;
        });
    }
} 
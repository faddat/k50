import { visualizationState, createNodeSprite, createEdgeMaterial } from './visualization.js';

// Graph state
const state = {
    currentNodeCount: 69,
    nodes: [],
    edges: []
};

// Generate complete graph with n nodes
export function generateCompleteGraph(n) {
    state.currentNodeCount = n;
    state.nodes = [];
    state.edges = [];

    // Create nodes
    for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2;
        const radius = 300;
        state.nodes.push({
            id: i,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            vx: 0,
            vy: 0
        });
    }

    // Create edges (complete graph: every node connected to every other node)
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            state.edges.push({
                source: i,
                target: j
            });
        }
    }

    return createGraphObjects();
}

// Create Three.js objects for nodes and edges
function createGraphObjects() {
    const nodeSprites = [];
    const edgeLines = [];

    // Create node sprites
    state.nodes.forEach((node, i) => {
        const hue = (i / state.nodes.length);
        const color = `hsl(${hue * 360}, 100%, 50%)`;
        const sprite = createNodeSprite(color);
        sprite.position.set(node.x, node.y, 0);
        sprite.scale.set(50, 50, 1);
        nodeSprites.push(sprite);
    });

    // Create edge lines
    state.edges.forEach(edge => {
        const sourceNode = state.nodes[edge.source];
        const targetNode = state.nodes[edge.target];

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            sourceNode.x, sourceNode.y, 0,
            targetNode.x, targetNode.y, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create main line and glow line
        const mainLine = new THREE.Line(geometry, createEdgeMaterial());
        edgeLines.push(mainLine);

        const glowLine = new THREE.Line(geometry.clone(), createEdgeMaterial());
        glowLine.material.linewidth = 3;
        edgeLines.push(glowLine);
    });

    return { nodeSprites, edgeLines };
}

// Update node positions based on forces
export function updateNodePositions(audioLevels) {
    const { bassLevel, midLevel, trebleLevel } = audioLevels;
    const bounds = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    const charge = -800 - (bassLevel * 400);
    const centerForce = 0.01 + (midLevel * 0.01);
    const damping = 0.95;

    // Calculate forces
    state.nodes.forEach(node => {
        node.vx *= damping;
        node.vy *= damping;

        // Repulsion between nodes
        state.nodes.forEach(other => {
            if (node === other) return;
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) return;
            const force = charge / (dist * dist);
            node.vx += dx * force / dist;
            node.vy += dy * force / dist;
        });

        // Center force
        node.vx += -node.x * centerForce;
        node.vy += -node.y * centerForce;

        // Audio-reactive jitter
        node.vx += (Math.random() - 0.5) * trebleLevel * 10;
        node.vy += (Math.random() - 0.5) * trebleLevel * 10;
    });

    // Update positions
    state.nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Boundary constraints
        const dist = Math.sqrt(node.x * node.x + node.y * node.y);
        if (dist > bounds) {
            node.x = (node.x / dist) * bounds;
            node.y = (node.y / dist) * bounds;
        }
    });
}

// Export state and functions
export const graphState = state; 
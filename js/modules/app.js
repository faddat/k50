import { visualizationState } from './visualization.js';
import { audioState, getAudioLevels } from './audio.js';
import { graphState, generateCompleteGraph, updateNodePositions } from './graph.js';

// App state
const state = {
    isDebugMode: false,
    stats: null,
    animationFrame: null
};

// Initialize debug stats
function initStats() {
    if (window.K50 && window.K50.Stats) {
        state.stats = window.K50.Stats;
        state.stats.showPanel(0); // Show FPS panel
        document.body.appendChild(state.stats.dom);
        state.stats.dom.style.display = 'none';
    } else {
        console.warn('Stats not available');
    }
}

// Animation loop
function animate() {
    state.animationFrame = requestAnimationFrame(animate);
    
    if (state.isDebugMode && state.stats) {
        state.stats.begin();
    }

    // Get audio levels
    const audioLevels = getAudioLevels();

    // Update node positions
    updateNodePositions(audioLevels);

    // Update node sprites and edge lines
    if (visualizationState.nodeSprites && visualizationState.nodeSprites.length > 0) {
        visualizationState.nodeSprites.forEach((sprite, i) => {
            if (graphState.nodes[i]) {
                sprite.position.set(graphState.nodes[i].x, graphState.nodes[i].y, 0);
            }
        });
    }

    if (visualizationState.edgeLines && visualizationState.edgeLines.length > 0) {
        visualizationState.edgeLines.forEach((line, i) => {
            const edgeIndex = Math.floor(i / 2);
            if (graphState.edges[edgeIndex]) {
                const edge = graphState.edges[edgeIndex];
                const source = graphState.nodes[edge.source];
                const target = graphState.nodes[edge.target];
                
                const positions = line.geometry.attributes.position.array;
                positions[0] = source.x;
                positions[1] = source.y;
                positions[3] = target.x;
                positions[4] = target.y;
                line.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    // Render scene
    if (visualizationState.renderer && visualizationState.scene && visualizationState.camera) {
        visualizationState.renderer.render(visualizationState.scene, visualizationState.camera);
    }

    if (state.isDebugMode && state.stats) {
        state.stats.end();
    }
}

// Initialize app
export function initApp() {
    try {
        initStats();
        generateCompleteGraph(69);
        animate();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Toggle debug mode
export function toggleDebug() {
    state.isDebugMode = !state.isDebugMode;
    if (state.stats) {
        state.stats.dom.style.display = state.isDebugMode ? 'block' : 'none';
    }
}

// Handle node count change
export function handleNodeCountChange(count) {
    try {
        const n = Math.min(200, Math.max(3, parseInt(count) || 69));
        const { nodeSprites, edgeLines } = generateCompleteGraph(n);
        
        // Clear existing objects
        if (visualizationState.nodeSprites) {
            visualizationState.nodeSprites.forEach(sprite => visualizationState.scene.remove(sprite));
        }
        if (visualizationState.edgeLines) {
            visualizationState.edgeLines.forEach(line => visualizationState.scene.remove(line));
        }
        
        // Add new objects
        nodeSprites.forEach(sprite => visualizationState.scene.add(sprite));
        edgeLines.forEach(line => visualizationState.scene.add(line));
        
        // Update state
        visualizationState.nodeSprites = nodeSprites;
        visualizationState.edgeLines = edgeLines;
    } catch (error) {
        console.error('Error changing node count:', error);
    }
}

// Export state and functions
export const appState = state; 
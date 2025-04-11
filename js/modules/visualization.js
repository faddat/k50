import { getAudioLevels } from './audio.js';
import { updateNodePositions } from './graph.js';

// Core visualization state
export const visualizationState = {
    isClassicMode: true,
    scene: null,
    camera: null,
    renderer: null,
    nodeSprites: [],
    edgeLines: [],
    nodeTrails: [],
    graph: { nodes: [], edges: [] },
};

// Initialize Three.js scene
export function initVisualization() {
    console.log('Initializing visualization...');

    // Create scene
    visualizationState.scene = new THREE.Scene();
    visualizationState.scene.background = new THREE.Color(0x0d041a);

    // Set up camera
    const viewport = getViewportSize();
    visualizationState.camera = new THREE.OrthographicCamera(
        -viewport.width / 2,
        viewport.width / 2,
        viewport.height / 2,
        -viewport.height / 2,
        1,
        2000
    );
    visualizationState.camera.position.z = 1000;

    // Create renderer
    visualizationState.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
    });

    visualizationState.renderer.setSize(window.innerWidth, window.innerHeight);
    visualizationState.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(visualizationState.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    console.log('Visualization initialized:', {
        scene: visualizationState.scene !== null,
        camera: visualizationState.camera !== null,
        renderer: visualizationState.renderer !== null,
    });

    return visualizationState;
}

// Get current visualization mode
export function isClassicMode() {
    return visualizationState.isClassicMode;
}

// Toggle visualization mode
export function toggleMode() {
    visualizationState.isClassicMode = !visualizationState.isClassicMode;
    return visualizationState.isClassicMode;
}

// Create node sprite with enhanced glow
export function createNodeSprite(color) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Create gradient for enhanced glow
        const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);

        // Parse the color to get its RGB components for enhanced effects
        const tempDiv = document.createElement('div');
        tempDiv.style.color = color;
        document.body.appendChild(tempDiv);
        const rgbColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);

        // Extract RGB values for dynamic glow
        const rgbMatch = rgbColor.match(/\d+/g);
        const [r, g, b] = rgbMatch ? rgbMatch.map(Number) : [255, 255, 255];

        // Bright core with RGB influence
        gradient.addColorStop(
            0,
            `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`
        );

        // Enhanced middle glow
        gradient.addColorStop(0.1, color);
        gradient.addColorStop(0.2, rgbColor.replace(')', ', 0.8)'));

        // Outer glow with multiple color stops
        gradient.addColorStop(0.4, rgbColor.replace(')', ', 0.4)'));
        gradient.addColorStop(0.6, rgbColor.replace(')', ', 0.2)'));
        gradient.addColorStop(0.8, rgbColor.replace(')', ', 0.1)'));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        // Draw the enhanced glow
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        // Add a bright center highlight with color influence
        const highlightGradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 8);
        highlightGradient.addColorStop(
            0,
            `rgb(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)})`
        );
        highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(0, 0, 128, 128);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false,
        });

        const sprite = new THREE.Sprite(material);

        // Store the original color and RGB values for audio reactivity
        sprite.userData = {
            originalScale: sprite.scale.clone(),
            color: color,
            rgb: [r, g, b],
        };

        return sprite;
    } catch (error) {
        console.error('Error creating node sprite:', error);
        throw error;
    }
}

// Create edge material
export function createEdgeMaterial() {
    if (visualizationState.isClassicMode) {
        return new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.4,
            transparent: true,
            blending: THREE.AdditiveBlending,
            linewidth: 1,
        });
    } else {
        return new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.6,
            transparent: true,
            blending: THREE.AdditiveBlending,
            linewidth: 20,
        });
    }
}

// Helper functions
function getViewportSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        aspect: window.innerWidth / window.innerHeight,
        min: Math.min(window.innerWidth, window.innerHeight),
        max: Math.max(window.innerWidth, window.innerHeight),
    };
}

function onWindowResize() {
    const viewport = getViewportSize();
    if (visualizationState.camera) {
        visualizationState.camera.left = -viewport.width / 2;
        visualizationState.camera.right = viewport.width / 2;
        visualizationState.camera.top = viewport.height / 2;
        visualizationState.camera.bottom = -viewport.height / 2;
        visualizationState.camera.updateProjectionMatrix();
    }
    if (visualizationState.renderer) {
        visualizationState.renderer.setSize(viewport.width, viewport.height);
    }
}

// Create trail material for shooting star effect
function createTrailMaterial(color, opacity = 1) {
    return new THREE.LineDashedMaterial({
        color: color,
        opacity: opacity,
        transparent: true,
        linewidth: 2,
        scale: 1,
        dashSize: 3,
        gapSize: 1,
    });
}

// Create lightning material with enhanced glow
function createLightningMaterial(color, opacity = 1) {
    return new THREE.LineBasicMaterial({
        color: color,
        opacity: opacity,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        linewidth: 2,
    });
}

// Update scene with new trails
export function updateTrails(trails) {
    // Remove old trails
    visualizationState.scene.children = visualizationState.scene.children.filter(
        child => !child.isTrail
    );

    // Add new trails
    trails.forEach(trail => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([trail.x1, trail.y1, 0, trail.x2, trail.y2, 0]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create main trail
        const trailLine = new THREE.Line(
            geometry,
            createTrailMaterial(trail.color, trail.opacity * trail.intensity)
        );
        trailLine.isTrail = true;
        visualizationState.scene.add(trailLine);

        // Create glow effect
        const glowLine = new THREE.Line(
            geometry.clone(),
            createTrailMaterial(trail.color, trail.opacity * trail.intensity * 0.5)
        );
        glowLine.material.linewidth = 4;
        glowLine.isTrail = true;
        visualizationState.scene.add(glowLine);
    });
}

// Update scene with new effects
export function updateEffects(effects) {
    // Remove old effects
    visualizationState.scene.children = visualizationState.scene.children.filter(
        child => !child.isEffect
    );

    // Add new trails with enhanced glow
    if (effects.trails) {
        effects.trails.forEach(trail => {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([trail.x1, trail.y1, 0, trail.x2, trail.y2, 0]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            // Create multiple trail layers for enhanced glow
            [1, 0.7, 0.4, 0.2].forEach((intensity, i) => {
                const trailLine = new THREE.Line(
                    geometry.clone(),
                    createTrailMaterial(trail.color, trail.opacity * intensity * trail.intensity)
                );
                trailLine.isEffect = true;
                trailLine.scale.set(1 + i * 0.3, 1 + i * 0.3, 1);
                visualizationState.scene.add(trailLine);
            });
        });
    }

    // Add new lightning arcs with enhanced glow
    if (effects.lightningArcs) {
        effects.lightningArcs.forEach(arc => {
            const positions = new Float32Array(arc.points.length * 3);
            arc.points.forEach((point, i) => {
                positions[i * 3] = point.x;
                positions[i * 3 + 1] = point.y;
                positions[i * 3 + 2] = 0;
            });

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            // Create multiple layers with varying intensity and scale
            [1, 0.8, 0.6, 0.3].forEach((intensity, i) => {
                const material = createLightningMaterial(
                    arc.color,
                    arc.opacity * intensity * arc.intensity
                );
                const line = new THREE.Line(geometry.clone(), material);
                line.isEffect = true;
                line.scale.set(1 + i * 0.25, 1 + i * 0.25, 1);
                visualizationState.scene.add(line);
            });
        });
    }
}

// Update graph state
export function updateGraphState(nodes, edges) {
    visualizationState.graph.nodes = nodes;
    visualizationState.graph.edges = edges;
}

// Update animation loop to include effects
export function animate() {
    try {
        requestAnimationFrame(animate);

        const audioLevels = getAudioLevels();
        const updates = updateNodePositions(audioLevels);

        // Update node positions in visualization
        if (visualizationState.nodeSprites && visualizationState.nodeSprites.length > 0) {
            visualizationState.nodeSprites.forEach((sprite, i) => {
                if (visualizationState.graph.nodes[i]) {
                    const node = visualizationState.graph.nodes[i];
                    sprite.position.set(node.x, node.y, 0);

                    // Update sprite scale based on audio energy
                    const scale = sprite.userData.originalScale.clone();
                    const energyScale = 1 + audioLevels.bassLevel * 0.3;
                    sprite.scale.copy(scale.multiplyScalar(energyScale));
                }
            });
        }

        // Update edge positions
        if (visualizationState.edgeLines && visualizationState.edgeLines.length > 0) {
            visualizationState.edgeLines.forEach((line, i) => {
                const edgeIndex = Math.floor(i / 2);
                if (visualizationState.graph.edges[edgeIndex]) {
                    const edge = visualizationState.graph.edges[edgeIndex];
                    const source = visualizationState.graph.nodes[edge.source];
                    const target = visualizationState.graph.nodes[edge.target];

                    if (source && target) {
                        const positions = line.geometry.attributes.position.array;
                        positions[0] = source.x;
                        positions[1] = source.y;
                        positions[3] = target.x;
                        positions[4] = target.y;
                        line.geometry.attributes.position.needsUpdate = true;
                    }
                }
            });
        }

        // Update visual effects
        if (updates && (updates.trails || updates.lightningArcs)) {
            updateEffects(updates);
        }

        // Render the scene
        if (visualizationState.renderer && visualizationState.scene && visualizationState.camera) {
            visualizationState.renderer.render(visualizationState.scene, visualizationState.camera);
        }
    } catch (error) {
        console.error('Animation loop error:', error);
    }
}

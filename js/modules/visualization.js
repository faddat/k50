// Core visualization state
const state = {
    isClassicMode: true,
    scene: null,
    camera: null,
    renderer: null,
    nodeSprites: [],
    edgeLines: [],
    nodeTrails: [],
    graph: { nodes: [], edges: [] }
};

// Initialize Three.js scene
export function initVisualization() {
    console.log('Initializing visualization...');
    
    // Create scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x0d041a);

    // Set up camera
    const viewport = getViewportSize();
    state.camera = new THREE.OrthographicCamera(
        -viewport.width / 2,
        viewport.width / 2,
        viewport.height / 2,
        -viewport.height / 2,
        1,
        2000
    );
    state.camera.position.z = 1000;

    // Create renderer
    state.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(state.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    console.log('Visualization initialized:', {
        scene: state.scene !== null,
        camera: state.camera !== null,
        renderer: state.renderer !== null
    });

    return state;
}

// Get current visualization mode
export function isClassicMode() {
    return state.isClassicMode;
}

// Toggle visualization mode
export function toggleMode() {
    state.isClassicMode = !state.isClassicMode;
    return state.isClassicMode;
}

// Create node sprite
export function createNodeSprite(color) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Could not get 2D context');
        }

        if (state.isClassicMode) {
            // Classic mode: Enhanced dot with stronger glow
            const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.2, color);
            gradient.addColorStop(0.4, color);
            gradient.addColorStop(0.6, color.replace(')', ', 0.7)'));
            gradient.addColorStop(0.8, color.replace(')', ', 0.3)'));
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);

            // Add central bright spot for extra pop
            const centerGlow = ctx.createRadialGradient(128, 128, 0, 128, 128, 30);
            centerGlow.addColorStop(0, '#ffffff');
            centerGlow.addColorStop(0.5, color.replace(')', ', 0.8)'));
            centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = centerGlow;
            ctx.fillRect(0, 0, 256, 256);
        } else {
            // Fluid mode: Larger, more diffuse glow with enhanced brightness
            const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.2, color);
            gradient.addColorStop(0.4, color);
            gradient.addColorStop(0.6, color.replace(')', ', 0.6)'));
            gradient.addColorStop(0.8, color.replace(')', ', 0.3)'));
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
        }
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });
        
        return new THREE.Sprite(material);
    } catch (error) {
        console.error('Error creating node sprite:', error);
        throw error;
    }
}

// Create edge material
export function createEdgeMaterial() {
    if (state.isClassicMode) {
        return new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.8,
            transparent: true,
            blending: THREE.NormalBlending,
            linewidth: 1
        });
    } else {
        return new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 1.0,
            transparent: true,
            blending: THREE.AdditiveBlending,
            linewidth: 20
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
        max: Math.max(window.innerWidth, window.innerHeight)
    };
}

function onWindowResize() {
    const viewport = getViewportSize();
    if (state.camera) {
        state.camera.left = -viewport.width / 2;
        state.camera.right = viewport.width / 2;
        state.camera.top = viewport.height / 2;
        state.camera.bottom = -viewport.height / 2;
        state.camera.updateProjectionMatrix();
    }
    if (state.renderer) {
        state.renderer.setSize(viewport.width, viewport.height);
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
        gapSize: 1
    });
}

// Create lightning material
function createLightningMaterial(color, opacity = 1) {
    return new THREE.LineBasicMaterial({
        color: color,
        opacity: opacity,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
}

// Update scene with new trails
export function updateTrails(trails) {
    // Remove old trails
    state.scene.children = state.scene.children.filter(child => !child.isTrail);
    
    // Add new trails
    trails.forEach(trail => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            trail.x1, trail.y1, 0,
            trail.x2, trail.y2, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create main trail
        const trailLine = new THREE.Line(
            geometry,
            createTrailMaterial(trail.color, trail.opacity * trail.intensity)
        );
        trailLine.isTrail = true;
        state.scene.add(trailLine);
        
        // Create glow effect
        const glowLine = new THREE.Line(
            geometry.clone(),
            createTrailMaterial(trail.color, trail.opacity * trail.intensity * 0.5)
        );
        glowLine.material.linewidth = 4;
        glowLine.isTrail = true;
        state.scene.add(glowLine);
    });
}

// Update scene with new effects
export function updateEffects(effects) {
    // Remove old effects
    state.scene.children = state.scene.children.filter(child => !child.isEffect);
    
    // Add new trails
    if (effects.trails) {
        effects.trails.forEach(trail => {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                trail.x1, trail.y1, 0,
                trail.x2, trail.y2, 0
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const trailLine = new THREE.Line(
                geometry,
                createTrailMaterial(trail.color, trail.opacity * trail.intensity)
            );
            trailLine.isEffect = true;
            state.scene.add(trailLine);
        });
    }
    
    // Add new lightning arcs
    if (effects.lightningArcs) {
        effects.lightningArcs.forEach(arc => {
            // Create main lightning stroke
            const positions = new Float32Array(arc.points.length * 3);
            arc.points.forEach((point, i) => {
                positions[i * 3] = point.x;
                positions[i * 3 + 1] = point.y;
                positions[i * 3 + 2] = 0;
            });
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            // Create multiple layers for glow effect
            [1, 0.7, 0.4].forEach((intensity, i) => {
                const material = createLightningMaterial(
                    arc.color,
                    arc.opacity * intensity * arc.intensity
                );
                const line = new THREE.Line(geometry, material);
                line.isEffect = true;
                
                // Scale each layer slightly
                line.scale.set(1 + i * 0.2, 1 + i * 0.2, 1);
                state.scene.add(line);
            });
        });
    }
}

// Update animation loop to include effects
export function animate() {
    requestAnimationFrame(animate);
    
    const audioLevels = getAudioLevels();
    const updates = updateNodePositions(audioLevels);
    
    if (updates) {
        if (updates.trails || updates.lightningArcs) {
            updateEffects(updates);
        }
        // ... rest of existing animation code ...
    }
    
    state.renderer.render(state.scene, state.camera);
}

// Export state for access from other modules
export const visualizationState = state; 
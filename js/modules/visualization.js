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
            // Classic mode: Simple dot with glow
            const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.3, color);
            gradient.addColorStop(0.5, color.replace(')', ', 0.5)'));
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
        } else {
            // Fluid mode: Larger, more diffuse glow
            const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.2, color);
            gradient.addColorStop(0.4, color.replace(')', ', 0.5)'));
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

// Export state for access from other modules
export const visualizationState = state; 
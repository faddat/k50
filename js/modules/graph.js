import { visualizationState, createNodeSprite, createEdgeMaterial } from './visualization.js';

// Graph state
const state = {
    currentNodeCount: 180,
    nodes: [],
    edges: [],
    clusterCenters: [],
    clusterPhase: 0,
    lastClusterUpdate: Date.now(),
    transitionProgress: 0,
    isUpdating: false,
    musicEnergy: 0, // Track overall music energy
    lastBeat: Date.now(), // Track beat timing
    beatCount: 0, // Count beats for pattern variation
    nodeTrails: [], // Track node trails for shooting star effect
    lightningArcs: [] // Track active lightning arcs
};

// Safe math operations
const safeDivide = (a, b, fallback = 0) => (b === 0 ? fallback : a / b);
const safeDistance = (dx, dy) => Math.sqrt(dx * dx + dy * dy) || 0.0001;

// Generate complete graph with n nodes
export function generateCompleteGraph(n) {
    console.log('Generating complete graph with', n, 'nodes');
    
    try {
        // Input validation
        n = Math.max(3, Math.min(200, Math.floor(n) || 180));
        
        if (state.isUpdating) {
            console.warn('Already updating graph, request queued');
            return null;
        }
        
        state.isUpdating = true;
        state.currentNodeCount = n;
        state.nodes = [];
        state.edges = [];
        state.clusterCenters = [];
        state.clusterPhase = 0;

        // Create nodes with color information
        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2;
            const radius = 300;
            const hue = (i / n) * 360;
            state.nodes.push({
                id: i,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                clusterId: -1,
                hue: hue,
                color: `hsl(${hue}, 100%, 50%)`,
                lastUpdate: Date.now()
            });
        }

        // Create edges with safety checks
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (state.nodes[i] && state.nodes[j]) {
                    state.edges.push({
                        source: i,
                        target: j
                    });
                }
            }
        }

        updateClusterCenters();

        const result = createGraphObjects();
        state.isUpdating = false;
        return result;
    } catch (error) {
        console.error('Error generating complete graph:', error);
        state.isUpdating = false;
        return null;
    }
}

// Calculate color similarity with safety checks
function getColorSimilarity(hue1, hue2) {
    try {
        const h1 = ((hue1 % 360) + 360) % 360;
        const h2 = ((hue2 % 360) + 360) % 360;
        const diff = Math.abs(h1 - h2);
        return 1 - Math.min(diff, 360 - diff) / 180;
    } catch (error) {
        console.warn('Color similarity calculation error:', error);
        return 0;
    }
}

// Update cluster centers with safety checks
function updateClusterCenters() {
    try {
        const now = Date.now();
        const timeSinceLastUpdate = now - state.lastClusterUpdate;
        
        // Prevent too frequent updates
        if (timeSinceLastUpdate < 16) return; // Max 60fps
        
        state.transitionProgress = Math.min(1, safeDivide(timeSinceLastUpdate, 2000));

        if (timeSinceLastUpdate > 15000) {
            state.lastClusterUpdate = now;
            state.clusterPhase = (state.clusterPhase + 0.1) % 1;
            state.transitionProgress = 0;

            // Create more organic patterns with golden ratio
            const phi = (1 + Math.sqrt(5)) / 2;
            const clusterCount = state.clusterPhase < 0.5 ? 
                1 + Math.floor(8 * Math.pow(Math.sin(state.clusterPhase * Math.PI * phi), 2)) : 1;

            if (!state.nodes.length) return;

            if (clusterCount === 1) {
                state.clusterCenters = [{
                    x: 0,
                    y: 0,
                    hue: 0,
                    radius: 0
                }];
                state.nodes.forEach(node => node.clusterId = 0);
            } else {
                state.clusterCenters = [];
                const screenRadius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
                
                // Create fibonacci spiral pattern for clusters
                for (let i = 0; i < clusterCount; i++) {
                    const golden = i * phi;
                    const angle = golden * Math.PI * 2;
                    const spiralRadius = screenRadius * Math.sqrt(i / clusterCount);
                    const hue = (golden * 360) % 360;
                    
                    state.clusterCenters.push({
                        x: Math.cos(angle) * spiralRadius,
                        y: Math.sin(angle) * spiralRadius,
                        hue: hue,
                        radius: 150 + (spiralRadius * 0.2)
                    });
                }

                // Enhanced color-based clustering
                state.nodes.forEach(node => {
                    let bestScore = -1;
                    let bestCluster = 0;
                    state.clusterCenters.forEach((center, idx) => {
                        const colorSimilarity = getColorSimilarity(node.hue, center.hue);
                        const dx = center.x - node.x;
                        const dy = center.y - node.y;
                        const distanceScore = 1 / (1 + Math.sqrt(dx * dx + dy * dy) / screenRadius);
                        const score = colorSimilarity * 0.7 + distanceScore * 0.3;
                        
                        if (score > bestScore) {
                            bestScore = score;
                            bestCluster = idx;
                        }
                    });
                    node.clusterId = bestCluster;
                    node.colorSimilarity = bestScore;
                });
            }
        }
    } catch (error) {
        console.error('Error updating cluster centers:', error);
    }
}

// Create Three.js objects for nodes and edges
function createGraphObjects() {
    console.log('Creating graph objects...');
    
    try {
        const nodeSprites = [];
        const edgeLines = [];

        // Create node sprites
        state.nodes.forEach(node => {
            const sprite = createNodeSprite(node.color);
            sprite.position.set(node.x, node.y, 0);
            sprite.scale.set(75, 75, 1);
            nodeSprites.push(sprite);
        });

        console.log('Created node sprites:', nodeSprites.length);

        // Create edge lines
        state.edges.forEach((edge, index) => {
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

        console.log('Created edge lines:', edgeLines.length);

        return { nodeSprites, edgeLines };
    } catch (error) {
        console.error('Error creating graph objects:', error);
        throw error;
    }
}

// Enhanced audio processing
function processAudioLevels(audioLevels) {
    const { bassLevel = 0, midLevel = 0, trebleLevel = 0 } = audioLevels;
    
    // Calculate overall music energy (0-1)
    const energy = Math.min(1, (bassLevel * 1.5 + midLevel + trebleLevel * 0.8) / 2);
    
    // Detect beats using bass level
    const now = Date.now();
    const timeSinceBeat = now - state.lastBeat;
    if (bassLevel > 0.6 && timeSinceBeat > 200) { // Beat detection threshold
        state.lastBeat = now;
        state.beatCount++;
    }
    
    // Smooth energy transitions
    state.musicEnergy = state.musicEnergy * 0.8 + energy * 0.2;
    
    return {
        energy: state.musicEnergy,
        isBeat: timeSinceBeat < 100,
        beatPhase: Math.min(1, timeSinceBeat / 200)
    };
}

// Lightning arc generation
function createLightningArc(start, end, color, intensity) {
    const points = [];
    const segments = 12;
    const maxOffset = 50 * intensity;
    
    // Create jagged path between points
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        
        // Add random offset except for start/end points
        if (i > 0 && i < segments) {
            const offset = (Math.random() - 0.5) * maxOffset * Math.sin(Math.PI * t);
            points.push({
                x: x + offset,
                y: y + offset
            });
        } else {
            points.push({ x, y });
        }
    }
    
    return {
        points,
        color,
        timestamp: Date.now(),
        intensity,
        duration: 200 + Math.random() * 300 // Random duration between 200-500ms
    };
}

// Update node positions with improved stability and music responsiveness
export function updateNodePositions(audioLevels = { bassLevel: 0, midLevel: 0, trebleLevel: 0 }) {
    if (state.isUpdating) return;
    
    try {
        const now = Date.now();
        const bounds = Math.min(window.innerWidth, window.innerHeight) * 0.8;
        const audio = processAudioLevels(audioLevels);
        
        // Update existing effects
        state.nodeTrails = state.nodeTrails.filter(trail => now - trail.timestamp < 500);
        state.lightningArcs = state.lightningArcs.filter(arc => now - arc.timestamp < arc.duration);
        
        // Generate new lightning on strong beats
        if (audio.isBeat && audio.energy > 0.6) {
            // Find nodes to connect with lightning
            const nodePairs = [];
            state.nodes.forEach((node, i) => {
                state.nodes.slice(i + 1).forEach(other => {
                    const dx = other.x - node.x;
                    const dy = other.y - node.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const colorSimilarity = getColorSimilarity(node.hue, other.hue);
                    
                    // Connect similar-colored nodes that are far apart
                    if (colorSimilarity > 0.85 && dist > 300 && dist < 800) {
                        nodePairs.push({
                            start: node,
                            end: other,
                            dist,
                            colorSimilarity
                        });
                    }
                });
            });
            
            // Sort by distance and take top candidates
            nodePairs.sort((a, b) => b.dist - a.dist);
            const maxArcs = Math.floor(3 + audio.energy * 4);
            nodePairs.slice(0, maxArcs).forEach(pair => {
                state.lightningArcs.push(
                    createLightningArc(
                        pair.start,
                        pair.end,
                        pair.start.color,
                        audio.energy
                    )
                );
            });
        }

        // Dynamic base repulsion force
        const baseRepulsion = -2000 - (audio.energy * 800); // Increased base repulsion
        
        state.nodes.forEach(node => {
            const prevX = node.x;
            const prevY = node.y;
            
            if (now - node.lastUpdate < 16) return;
            node.lastUpdate = now;

            // Apply music-reactive forces with reduced damping
            node.vx *= 0.98 - (audio.energy * 0.02); // Less damping
            node.vy *= 0.98 - (audio.energy * 0.02);

            // Enhanced node interactions with stronger repulsion
            state.nodes.forEach(other => {
                if (node === other) return;
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = safeDistance(dx, dy);
                
                const colorSimilarity = getColorSimilarity(node.hue, other.hue);
                const sameCluster = node.clusterId === other.clusterId;
                
                // Adjusted clustering forces
                const musicClusterEffect = 1 + (audio.energy * 1.5); // Reduced music effect
                const clusterMultiplier = sameCluster ?
                    (0.3 + (colorSimilarity * 1.2)) * musicClusterEffect : // Reduced attraction
                    (2.5 + ((1 - colorSimilarity) * 1.8)) / musicClusterEffect; // Increased repulsion
                
                // Apply repulsion force with distance-based scaling
                const distanceScale = Math.max(0.1, Math.min(1, dist / 400)); // Gradual force falloff
                const force = safeDivide(baseRepulsion * clusterMultiplier * distanceScale, dist * dist);
                node.vx += safeDivide(dx * force, dist) * 0.4; // Increased force application
                node.vy += safeDivide(dy * force, dist) * 0.4;
            });

            // Enhanced cluster center attraction with more spacing
            if (state.clusterCenters.length > 0 && node.clusterId >= 0) {
                const center = state.clusterCenters[node.clusterId];
                if (center) {
                    const dx = center.x - node.x;
                    const dy = center.y - node.y;
                    const dist = safeDistance(dx, dy);
                    
                    // Reduced cluster cohesion
                    const clusterForce = 0.02 * // Halved attraction force
                        state.transitionProgress * 
                        (0.3 + (node.colorSimilarity || 0)) * 
                        Math.sin(state.clusterPhase * Math.PI) *
                        (1 + audio.energy * 0.5); // Reduced music influence
                    
                    // Larger cluster radius
                    const clusterRadius = (center.radius || 300) * (1 + audio.energy * 0.3);
                    const radiusForce = dist > clusterRadius ? 0.015 : -0.01; // Added slight repulsion inside radius
                    
                    // Spiral effect on beats
                    const spiralAngle = Math.atan2(dy, dx);
                    const spiralForce = audio.isBeat ? 0.08 * audio.energy : 0;
                    node.vx += dx * (clusterForce + radiusForce) + Math.cos(spiralAngle + Math.PI/2) * spiralForce;
                    node.vy += dy * (clusterForce + radiusForce) + Math.sin(spiralAngle + Math.PI/2) * spiralForce;
                }
            }

            // Reduced center force
            const centerMultiplier = state.clusterCenters.length > 1 ? 
                0.15 * (1 - state.transitionProgress) * (1 + audio.energy) : 0.5; // Halved center force
            node.vx += -node.x * 0.001 * centerMultiplier; // Reduced base center force
            node.vy += -node.y * 0.001 * centerMultiplier;

            // Pulse effect on beats
            if (audio.isBeat) {
                const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
                const pulseForce = 0.5 * Math.sin(distFromCenter / 50);
                node.vx += node.x * pulseForce * audio.energy;
                node.vy += node.y * pulseForce * audio.energy;
            }

            // Dynamic velocity limits based on music energy
            const maxVelocity = 10 + (audio.energy * 15);
            node.vx = Math.max(-maxVelocity, Math.min(maxVelocity, node.vx));
            node.vy = Math.max(-maxVelocity, Math.min(maxVelocity, node.vy));

            // Frequency-based oscillation
            const oscillation = Math.sin(now / 1000 + node.hue / 30) * audioLevels.midLevel * 2;
            node.vx += oscillation;
            node.vy += oscillation;

            // Update position
            node.x += node.vx;
            node.y += node.vy;

            // Expanded boundaries
            const padding = 100 * (1 + audio.energy * 0.3); // Doubled padding
            const maxX = (window.innerWidth / 2) - padding;
            const maxY = (window.innerHeight / 2) - padding;

            if (Math.abs(node.x) > maxX) {
                const excess = Math.abs(node.x) - maxX;
                node.vx -= Math.sign(node.x) * excess * (0.15 + audio.energy * 0.15); // Gentler boundary force
                node.x = Math.sign(node.x) * maxX;
            }

            if (Math.abs(node.y) > maxY) {
                const excess = Math.abs(node.y) - maxY;
                node.vy -= Math.sign(node.y) * excess * (0.15 + audio.energy * 0.15);
                node.y = Math.sign(node.y) * maxY;
            }

            // Add trail for fast-moving nodes
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (speed > 15 || (audio.isBeat && speed > 8)) {
                state.nodeTrails.push({
                    x1: prevX,
                    y1: prevY,
                    x2: node.x,
                    y2: node.y,
                    color: node.color,
                    timestamp: now,
                    intensity: Math.min(1, speed / 20)
                });
            }
        });

        // Return effects for visualization
        return {
            trails: state.nodeTrails.map(trail => ({
                ...trail,
                opacity: Math.max(0, 1 - (now - trail.timestamp) / 500)
            })),
            lightningArcs: state.lightningArcs.map(arc => ({
                ...arc,
                opacity: Math.max(0, 1 - (now - arc.timestamp) / arc.duration)
            }))
        };
    } catch (error) {
        console.error('Error updating node positions:', error);
        state.isUpdating = false;
    }
}

// Export state and functions
export const graphState = state; 
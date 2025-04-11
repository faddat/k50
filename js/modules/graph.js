import { visualizationState, createNodeSprite, createEdgeMaterial, updateGraphState } from './visualization.js';

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
    lightningArcs: [], // Track active lightning arcs
    isClassicMode: false // Default to false, will be updated when visualization is ready
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
        
        // Update visualization state with new graph data
        updateGraphState(state.nodes, state.edges);

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
        state.edges.forEach((edge, _index) => {
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

// Process audio levels for visualization
function processAudioLevels(audioLevels) {
    const { bassLevel, midLevel, trebleLevel } = audioLevels;
    // Increase energy sensitivity
    const energy = (bassLevel * 1.8 + midLevel * 1.2 + trebleLevel) / 2;
    const isBeat = bassLevel > 0.5 && bassLevel > (midLevel * 1.2); // More sensitive beat detection
    
    return {
        energy: Math.min(1, energy * 1.5), // Boost overall energy more
        isBeat,
        bassLevel: bassLevel * 1.5, // Amplify bass impact
        midLevel: midLevel * 1.2,
        trebleLevel: trebleLevel * 1.3
    };
}

// Update node positions with improved stability and music responsiveness
export function updateNodePositions(audioLevels = { bassLevel: 0, midLevel: 0, trebleLevel: 0 }) {
    if (state.isUpdating) return;
    
    try {
        // Sync visualization mode from global state
        state.isClassicMode = visualizationState.isClassicMode;
        
        const now = Date.now();
        const bounds = Math.min(window.innerWidth, window.innerHeight) * 1.2;
        const audio = processAudioLevels(audioLevels);
        
        // Enhanced audio reactivity
        const beatPulse = audio.isBeat ? Math.sin(now / 80) * audio.energy * 3 : 0; // Stronger beat pulse
        const frequencyOscillation = Math.sin(now / 400) * audio.midLevel * 1.5; // More pronounced oscillation
        const trebleShimmer = Math.cos(now / 150) * audio.trebleLevel * 1.5; // Enhanced shimmer
        
        // Update existing effects
        state.nodeTrails = state.nodeTrails.filter(trail => now - trail.timestamp < 800); // Longer trails
        state.lightningArcs = state.lightningArcs.filter(arc => now - arc.timestamp < arc.duration);
        
        // Generate new lightning on strong beats
        if (audio.isBeat && audio.energy > 0.4) { // More frequent lightning
            const nodePairs = findConnectableNodes();
            createLightningEffects(nodePairs, audio);
        }

        state.nodes.forEach(node => {
            if (now - node.lastUpdate < 16) return;
            
            const prevX = node.x;
            const prevY = node.y;
            node.lastUpdate = now;

            // Use safeDistance for all distance calculations
            state.nodes.forEach(other => {
                if (node === other) return;
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = safeDistance(dx, dy);
                
                // Apply forces using safe distance
                const force = calculateForce(node, other, dist, audio);
                node.vx += (dx / dist) * force;
                node.vy += (dy / dist) * force;
            });

            // Enhanced music-reactive forces
            const nodeEnergy = audio.energy * (1.5 + Math.sin(node.hue / 30 + now / 800));
            node.vx *= 0.97 - (nodeEnergy * 0.04); // Less damping
            node.vy *= 0.97 - (nodeEnergy * 0.04);

            // Stronger frequency-based oscillations
            node.vx += Math.cos(node.hue / 30) * frequencyOscillation * 1.5;
            node.vy += Math.sin(node.hue / 30) * frequencyOscillation * 1.5;
            
            // Enhanced treble shimmer
            node.vx += (Math.random() - 0.5) * trebleShimmer * 2;
            node.vy += (Math.random() - 0.5) * trebleShimmer * 2;

            // Stronger beat pulse effect
            if (audio.isBeat) {
                const angle = Math.atan2(node.y, node.x);
                node.vx += Math.cos(angle) * beatPulse * 1.5;
                node.vy += Math.sin(angle) * beatPulse * 1.5;
            }

            // Enhanced node interactions with stronger forces
            applyNodeInteractions(node, audio);
            
            // Apply cluster forces with more energy
            if (state.clusterCenters.length > 0) {
                applyClusterForces(node, audio);
            }

            // Higher velocity limits
            const maxVelocity = 20 + (audio.energy * 30);
            node.vx = Math.max(-maxVelocity, Math.min(maxVelocity, node.vx));
            node.vy = Math.max(-maxVelocity, Math.min(maxVelocity, node.vy));

            // Update position
            node.x += node.vx;
            node.y += node.vy;

            // Softer boundary forces with organic overflow
            applyBoundaryForces(node, bounds, audio);

            // More frequent trails
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (speed > 10 || (audio.isBeat && speed > 5)) { // Lower threshold for trails
                createNodeTrail(node, prevX, prevY, speed);
            }
        });

        // Update visualization state with new positions
        updateGraphState(state.nodes, state.edges);
        
        return {
            trails: state.nodeTrails.map(trail => ({
                ...trail,
                opacity: Math.max(0, 1 - (now - trail.timestamp) / 800)
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

// Helper functions for node updates
function applyNodeInteractions(node, audio) {
    const baseRepulsion = -2000 * (1 + audio.energy);
    
    state.nodes.forEach(other => {
        if (node === other) return;
        
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 1) return; // Prevent division by zero
        
        const colorSimilarity = getColorSimilarity(node.hue, other.hue);
        const sameCluster = node.clusterId === other.clusterId;
        
        // Enhanced clustering forces
        const musicClusterEffect = 1 + (audio.energy * 2);
        const clusterMultiplier = sameCluster ?
            (0.2 + colorSimilarity) * musicClusterEffect :
            (2 + (1 - colorSimilarity)) / musicClusterEffect;
        
        const force = (baseRepulsion * clusterMultiplier) / (dist * dist);
        node.vx += (dx / dist) * force * 0.5;
        node.vy += (dy / dist) * force * 0.5;
    });
}

function applyClusterForces(node, audio) {
    const center = state.clusterCenters[node.clusterId];
    if (!center) return;
    
    const dx = center.x - node.x;
    const dy = center.y - node.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const clusterForce = 0.03 * 
        state.transitionProgress * 
        (0.5 + (node.colorSimilarity || 0)) * 
        Math.sin(state.clusterPhase * Math.PI) *
        (1 + audio.energy);
    
    const clusterRadius = center.radius * (1 + audio.energy * 0.5);
    const radiusForce = dist > clusterRadius ? 0.02 : -0.015;
    
    // Add spiral motion on beats
    const spiralAngle = Math.atan2(dy, dx) + Math.PI/2;
    const spiralForce = audio.isBeat ? 0.1 * audio.energy : 0;
    
    node.vx += dx * (clusterForce + radiusForce) + Math.cos(spiralAngle) * spiralForce;
    node.vy += dy * (clusterForce + radiusForce) + Math.sin(spiralAngle) * spiralForce;
}

function applyBoundaryForces(node, bounds, audio) {
    // Calculate maximum allowed radius with some padding
    const maxRadius = (bounds / 2) * 0.9; // Reduce to 90% of bounds to ensure visibility
    const softZone = maxRadius * 0.2; // Soft boundary starts at 80% of max radius
    const hardZone = maxRadius * 0.1; // Hard boundary at 90% of max radius
    
    // Calculate distance from center
    const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
    
    // Progressive boundary forces
    if (distFromCenter > maxRadius - softZone) {
        // Calculate force based on how far past the boundary we are
        const excess = distFromCenter - (maxRadius - softZone);
        const normalizedExcess = excess / softZone;
        const force = Math.pow(normalizedExcess, 3) * (0.5 + audio.energy * 0.5); // Stronger cubic force
        
        // Apply force towards center
        const angle = Math.atan2(node.y, node.x);
        const fx = -Math.cos(angle) * force;
        const fy = -Math.sin(angle) * force;
        
        // Add some spiral motion for more organic movement
        const spiralForce = 0.05 * force;
        node.vx += fx * node.vx + fy * spiralForce;
        node.vy += fy * node.vy - fx * spiralForce;
        
        // Hard limit at the absolute boundary
        if (distFromCenter > maxRadius - hardZone) {
            const limitRadius = maxRadius - hardZone;
            node.x = Math.cos(angle) * limitRadius;
            node.y = Math.sin(angle) * limitRadius;
            
            // Stronger velocity dampening at boundary
            node.vx *= 0.7;
            node.vy *= 0.7;
        }
    }
    
    // Enhanced center attraction when far out
    if (distFromCenter > maxRadius * 0.7) { // Start attraction earlier
        const centerForce = 0.004 * Math.pow(distFromCenter / maxRadius, 4); // Stronger attraction
        node.vx -= node.x * centerForce;
        node.vy -= node.y * centerForce;
    }
    
    // Add some noise to prevent stagnation
    if (audio.energy > 0.1) {
        const noise = audio.energy * 0.08; // Reduced noise
        node.vx += (Math.random() - 0.5) * noise;
        node.vy += (Math.random() - 0.5) * noise;
    }
    
    // Final safety check - absolute containment
    const absoluteMaxRadius = bounds / 2;
    const currentRadius = Math.sqrt(node.x * node.x + node.y * node.y);
    
    if (currentRadius > absoluteMaxRadius) {
        const scale = absoluteMaxRadius / currentRadius;
        node.x *= scale;
        node.y *= scale;
        // Strong inward force
        node.vx *= -0.5;
        node.vy *= -0.5;
    }
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

// Find nodes that can be connected with lightning
function findConnectableNodes() {
    const nodePairs = [];
    state.nodes.forEach((node, _index) => {
        state.nodes.slice(_index + 1).forEach(other => {
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
    
    // Sort by distance and return top candidates
    nodePairs.sort((a, b) => b.dist - a.dist);
    return nodePairs;
}

// Create lightning effects between nodes
function createLightningEffects(nodePairs, audio) {
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

// Create trail effect for fast-moving nodes
function createNodeTrail(node, prevX, prevY, speed) {
    state.nodeTrails.push({
        x1: prevX,
        y1: prevY,
        x2: node.x,
        y2: node.y,
        color: node.color,
        timestamp: Date.now(),
        intensity: Math.min(1, speed / 20)
    });
}

// Calculate force between nodes using safe operations
function calculateForce(node, other, dist, audio) {
    const baseRepulsion = -2000 * (1 + audio.energy);
    const colorSimilarity = getColorSimilarity(node.hue, other.hue);
    const sameCluster = node.clusterId === other.clusterId;
    
    const musicClusterEffect = 1 + (audio.energy * 2);
    const clusterMultiplier = sameCluster ?
        (0.2 + colorSimilarity) * musicClusterEffect :
        (2 + (1 - colorSimilarity)) / musicClusterEffect;
    
    return (baseRepulsion * clusterMultiplier) / (dist * dist);
}

// Export state and functions
export const graphState = state; 
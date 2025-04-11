import {
    visualizationState,
    createNodeSprite,
    createEdgeMaterial,
    updateGraphState,
} from './visualization.js';
// THREE is available globally via CDN

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
    isClassicMode: false, // Default to false, will be updated when visualization is ready
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
                lastUpdate: Date.now(),
            });
        }

        // Create edges with safety checks
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (state.nodes[i] && state.nodes[j]) {
                    state.edges.push({
                        source: i,
                        target: j,
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
            const clusterCount =
        state.clusterPhase < 0.5
            ? 1 + Math.floor(8 * Math.pow(Math.sin(state.clusterPhase * Math.PI * phi), 2))
            : 1;

            if (!state.nodes.length) return;

            if (clusterCount === 1) {
                state.clusterCenters = [
                    {
                        x: 0,
                        y: 0,
                        hue: 0,
                        radius: 0,
                    },
                ];
                state.nodes.forEach(node => (node.clusterId = 0));
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
                        radius: 150 + spiralRadius * 0.2,
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
                sourceNode.x,
                sourceNode.y,
                0,
                targetNode.x,
                targetNode.y,
                0,
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
function processAudioLevels(audioLevels = {}) {
    const { bassLevel = 0, midLevel = 0, trebleLevel = 0 } = audioLevels;

    const energy = (bassLevel * 1.8 + midLevel * 1.2 + trebleLevel) / 2;
    const isBeat = bassLevel > 0.5 && bassLevel > midLevel * 1.2;

    return {
        energy: Math.min(1, energy * 1.5),
        isBeat,
        bassLevel: bassLevel * 1.5,
        midLevel: midLevel * 1.2,
        trebleLevel: trebleLevel * 1.3,
        spectrum: {
            bass: bassLevel,
            lowMid: midLevel * 0.8,
            mid: midLevel,
            highMid: midLevel * 1.2,
            treble: trebleLevel,
        },
    };
}

// Update node positions with enhanced music reactivity
export function updateNodePositions(audioLevels = {}) {
    if (state.isUpdating) return;

    try {
        const processedAudio = processAudioLevels(audioLevels);
        const { energy = 0, bassLevel = 0, isBeat = false, spectrum = {} } = processedAudio;

        // Enhanced force calculations based on audio
        const repulsionForce = 0.4 + energy * 0.6; // Increased base repulsion
        const springForce = 0.1 + bassLevel * 0.2; // Reduced spring force
        const maxSpeed = 3 + energy * 10; // Increased max speed

        // Beat-reactive node scaling
        if (isBeat) {
            state.nodes.forEach(node => {
                node.scale = 1.3 + energy * 0.7;
                node.pulsePhase = 0;
            });
        }

        // Update node positions with increased spread
        state.nodes.forEach(node => {
            node.fx = 0;
            node.fy = 0;

            if (!node.phase) node.phase = Math.random() * Math.PI * 2;
            const angle = node.phase;
            const freqForce = 0.15 + (spectrum.mid || 0) * 0.5; // Increased frequency force
            node.fx += Math.cos(angle) * freqForce;
            node.fy += Math.sin(angle) * freqForce;
            node.phase += 0.02 + (spectrum.highMid || 0) * 0.04;

            // Enhanced node repulsion
            state.nodes.forEach(other => {
                if (other !== node) {
                    const dx = other.x - node.x;
                    const dy = other.y - node.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;

                    if (dist < 150) {
                        // Increased repulsion distance
                        const force = repulsionForce * (1 - dist / 150);
                        node.fx -= (dx / dist) * force;
                        node.fy -= (dy / dist) * force;
                    }
                }
            });

            // Reduced edge spring forces
            state.edges.forEach(edge => {
                if (edge.source === node.id || edge.target === node.id) {
                    const other =
            edge.source === node.id ? state.nodes[edge.target] : state.nodes[edge.source];

                    if (!other) return;

                    const dx = other.x - node.x;
                    const dy = other.y - node.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
                    const force = (springForce * (dist - 100)) / 100; // Increased rest length

                    node.fx += (dx / dist) * force;
                    node.fy += (dy / dist) * force;
                }
            });

            // Apply forces with reduced damping
            const damping = 0.9 - energy * 0.1;
            node.vx = (node.vx || 0) * damping + node.fx * (1 + bassLevel);
            node.vy = (node.vy || 0) * damping + node.fy * (1 + bassLevel);

            // Limit speed
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (speed > maxSpeed) {
                node.vx = (node.vx / speed) * maxSpeed;
                node.vy = (node.vy / speed) * maxSpeed;
            }

            // Add slight outward drift
            const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
            const outwardForce = 0.001 * (1 + energy * 0.2);
            const outwardAngle = Math.atan2(node.y, node.x);
            node.vx += Math.cos(outwardAngle) * outwardForce * distFromCenter * 0.01;
            node.vy += Math.sin(outwardAngle) * outwardForce * distFromCenter * 0.01;

            // Update position
            node.x += node.vx;
            node.y += node.vy;

            // Update node effects
            updateNodeEffects(node, { energy, spectrum, isBeat });
        });

        // Apply boundary forces with larger bounds
        state.nodes.forEach(node => {
            applyBoundaryForces(node, 1200, { energy, bassLevel }); // Increased bounds
        });

        updateGraphState(state.nodes, state.edges);

        return {
            trails: state.nodeTrails,
            lightningArcs: state.lightningArcs,
        };
    } catch (error) {
        console.error('Error in updateNodePositions:', error);
        return { trails: [], lightningArcs: [] };
    }
}

// Enhanced node effects
function updateNodeEffects(node, audioLevels) {
    const { energy, spectrum, isBeat } = audioLevels;

    // Update node color based on frequency content
    const hueShift = (spectrum.treble - spectrum.bass) * 20;
    node.hue = (node.baseHue + hueShift) % 360;

    // Update node size with pulses
    if (node.pulsePhase === undefined) node.pulsePhase = Math.random() * Math.PI * 2;
    node.pulsePhase += 0.1 + energy * 0.2;
    const pulseFactor = 0.2 + Math.sin(node.pulsePhase) * 0.1;
    node.scale = (node.scale || 1) * (1 + pulseFactor * energy);

    // Gradually return to normal scale
    node.scale = 1 + (node.scale - 1) * 0.9;

    // Beat-reactive glow
    if (isBeat) {
        node.glow = 1.5 + energy;
    } else {
        node.glow = 1 + (node.glow - 1) * 0.85;
    }

    // Update node trail generation
    if (Math.sqrt(node.vx * node.vx + node.vy * node.vy) > 1 + energy * 2) {
        createNodeTrail(node);
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
        const musicClusterEffect = 1 + audio.energy * 2;
        const clusterMultiplier = sameCluster
            ? (0.2 + colorSimilarity) * musicClusterEffect
            : (2 + (1 - colorSimilarity)) / musicClusterEffect;

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

    const clusterForce =
    0.03 *
    state.transitionProgress *
    (0.5 + (node.colorSimilarity || 0)) *
    Math.sin(state.clusterPhase * Math.PI) *
    (1 + audio.energy);

    const clusterRadius = center.radius * (1 + audio.energy * 0.5);
    const radiusForce = dist > clusterRadius ? 0.02 : -0.015;

    // Add spiral motion on beats
    const spiralAngle = Math.atan2(dy, dx) + Math.PI / 2;
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
    if (distFromCenter > maxRadius * 0.7) {
    // Start attraction earlier
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
                y: y + offset,
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
        duration: 200 + Math.random() * 300, // Random duration between 200-500ms
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
                    colorSimilarity,
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
            createLightningArc(pair.start, pair.end, pair.start.color, audio.energy)
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
        intensity: Math.min(1, speed / 20),
    });
}

// Calculate force between nodes using safe operations
function calculateForce(node, other, dist, audio) {
    const baseRepulsion = -2000 * (1 + audio.energy);
    const colorSimilarity = getColorSimilarity(node.hue, other.hue);
    const sameCluster = node.clusterId === other.clusterId;

    const musicClusterEffect = 1 + audio.energy * 2;
    const clusterMultiplier = sameCluster
        ? (0.2 + colorSimilarity) * musicClusterEffect
        : (2 + (1 - colorSimilarity)) / musicClusterEffect;

    return (baseRepulsion * clusterMultiplier) / (dist * dist);
}

// Export state and functions
export const graphState = state;

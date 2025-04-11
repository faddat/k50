// Audio state
export const audioState = {
    audioContext: null,
    analyser: null,
    mediaSource: null,
    audioData: new Uint8Array(1024),
    isMicrophoneActive: false,
    isMusicPlaying: false,
    microphoneStream: null,
};

// Initialize audio context safely
function initAudioContext() {
    if (!audioState.audioContext) {
        try {
            audioState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioState.analyser = audioState.audioContext.createAnalyser();
            audioState.analyser.fftSize = 2048;
            console.log('Audio context initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    return audioState.audioContext;
}

// Setup microphone with proper error handling
export async function setupMicrophone() {
    try {
    // Initialize audio context if needed
        const audioContext = initAudioContext();
        if (!audioContext) {
            throw new Error('Audio context not available');
        }

        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Clean up existing stream if any
        if (audioState.microphoneStream) {
            audioState.microphoneStream.getTracks().forEach(track => track.stop());
        }

        // Setup new stream
        audioState.microphoneStream = stream;
        audioState.mediaSource = audioContext.createMediaStreamSource(stream);
        audioState.mediaSource.connect(audioState.analyser);
        audioState.isMicrophoneActive = true;

        console.log('Microphone setup successful');
    } catch (error) {
        console.error('Error setting up microphone:', error);
        audioState.isMicrophoneActive = false;
        throw error;
    }
}

// Toggle music playback
export function toggleMusic() {
    try {
        const audioContext = initAudioContext();
        if (!audioContext) return;

        if (!audioState.isMusicPlaying) {
            // Start music playback logic here
            audioState.isMusicPlaying = true;
        } else {
            // Stop music playback logic here
            audioState.isMusicPlaying = false;
        }
    } catch (error) {
        console.error('Error toggling music:', error);
    }
}

// Get audio levels with safety checks
export function getAudioLevels() {
    if (!audioState.analyser) return { bassLevel: 0, midLevel: 0, trebleLevel: 0 };

    try {
        audioState.analyser.getByteFrequencyData(audioState.audioData);

        // Calculate frequency bands
        const bass = Array.from(audioState.audioData.slice(0, 100));
        const mids = Array.from(audioState.audioData.slice(100, 500));
        const treble = Array.from(audioState.audioData.slice(500, 1000));

        // Calculate average levels
        const bassLevel = bass.reduce((a, b) => a + b, 0) / (bass.length * 255);
        const midLevel = mids.reduce((a, b) => a + b, 0) / (mids.length * 255);
        const trebleLevel = treble.reduce((a, b) => a + b, 0) / (treble.length * 255);

        return {
            bassLevel,
            midLevel,
            trebleLevel,
        };
    } catch (error) {
        console.error('Error getting audio levels:', error);
        return { bassLevel: 0, midLevel: 0, trebleLevel: 0 };
    }
}

// Process audio data for visualization
export function processAudioData(analyser) {
    if (!analyser)
        return {
            bassLevel: 0,
            midLevel: 0,
            trebleLevel: 0,
            energy: 0,
            isBeat: false,
            spectrum: {
                bass: 0,
                lowMid: 0,
                mid: 0,
                highMid: 0,
                treble: 0,
            },
        };

    try {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Enhanced frequency band analysis
        const bass = averageFrequencyRange(dataArray, 20, 140);
        const lowMid = averageFrequencyRange(dataArray, 140, 400);
        const mid = averageFrequencyRange(dataArray, 400, 2600);
        const highMid = averageFrequencyRange(dataArray, 2600, 5200);
        const treble = averageFrequencyRange(dataArray, 5200, 14000);

        // Improved energy calculation with weighted bands
        const energy =
      (bass * 1.4 + // Boost bass impact
        lowMid * 1.2 + // Enhance low-mids
        mid * 1.0 + // Keep mids balanced
        highMid * 0.8 + // Slightly reduce high-mids
        treble * 0.6) / // Gentle treble response
      5;

        // Dynamic beat detection
        const isBeat = detectBeat(bass, energy);

        return {
            bassLevel: bass / 255,
            midLevel: (lowMid + mid + highMid) / (255 * 3),
            trebleLevel: treble / 255,
            energy: Math.min(1, energy / 255),
            isBeat,
            spectrum: {
                bass: bass / 255,
                lowMid: lowMid / 255,
                mid: mid / 255,
                highMid: highMid / 255,
                treble: treble / 255,
            },
        };
    } catch (error) {
        console.error('Error processing audio data:', error);
        return {
            bassLevel: 0,
            midLevel: 0,
            trebleLevel: 0,
            energy: 0,
            isBeat: false,
            spectrum: {
                bass: 0,
                lowMid: 0,
                mid: 0,
                highMid: 0,
                treble: 0,
            },
        };
    }
}

// Enhanced frequency range averaging
function averageFrequencyRange(dataArray, startFreq, endFreq) {
    const sampleRate = 44100;
    const startIndex = Math.floor((startFreq * dataArray.length) / (sampleRate / 2));
    const endIndex = Math.floor((endFreq * dataArray.length) / (sampleRate / 2));
    let sum = 0;

    for (let i = startIndex; i < endIndex; i++) {
        sum += dataArray[i];
    }

    return sum / (endIndex - startIndex);
}

// Improved beat detection with dynamic threshold
const beatHistory = [];
const BEAT_HISTORY_LENGTH = 20;
const BEAT_THRESHOLD = 0.6;
const MIN_BEAT_INTERVAL = 200; // ms
let lastBeatTime = 0;

function detectBeat(bass, energy) {
    const now = Date.now();
    const timeSinceLastBeat = now - lastBeatTime;

    // Add current bass level to history
    beatHistory.push(bass);
    if (beatHistory.length > BEAT_HISTORY_LENGTH) {
        beatHistory.shift();
    }

    // Calculate dynamic threshold
    const average = beatHistory.reduce((a, b) => a + b, 0) / beatHistory.length;
    const variance =
    beatHistory.reduce((a, b) => a + Math.pow(b - average, 2), 0) / beatHistory.length;
    const threshold = average + Math.sqrt(variance) * BEAT_THRESHOLD;

    // Beat detection with timing constraint
    if (bass > threshold && energy > 0.4 && timeSinceLastBeat > MIN_BEAT_INTERVAL) {
        lastBeatTime = now;
        return true;
    }

    return false;
}

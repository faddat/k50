// Audio state
export const audioState = {
    audioContext: null,
    analyser: null,
    mediaSource: null,
    audioData: new Uint8Array(1024),
    isMicrophoneActive: false,
    isMusicPlaying: false,
    microphoneStream: null
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
            trebleLevel
        };
    } catch (error) {
        console.error('Error getting audio levels:', error);
        return { bassLevel: 0, midLevel: 0, trebleLevel: 0 };
    }
} 
// Audio state
const state = {
    audioContext: new (window.AudioContext || window.webkitAudioContext)(),
    musicPlaying: false,
    musicSource: null,
    analyser: null,
    audioData: null,
    microphoneAnalyser: null,
    microphoneData: null,
    isMicrophoneActive: false,
    synth: null
};

// TechnoSynth class for generative music
class TechnoSynth {
    constructor(context) {
        this.context = context;
        this.analyser = context.createAnalyser();
        this.analyser.fftSize = 256;
        this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Create nodes
        this.masterGain = context.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.analyser);
        this.analyser.connect(context.destination);
        
        // Create compressor
        this.compressor = context.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.analyser);
        
        // Create oscillators
        this.setupOscillators();
        this.setupLFOs();
        this.setupFilters();
        
        // Start oscillators
        this.startOscillators();
        
        // Create rhythm
        this.rhythmInterval = 200;
        this.lastRhythmTime = 0;
    }
    
    setupOscillators() {
        this.bassOsc = this.context.createOscillator();
        this.bassOsc.type = 'triangle';
        this.bassOsc.frequency.value = 55;
        
        this.midOsc = this.context.createOscillator();
        this.midOsc.type = 'sine';
        this.midOsc.frequency.value = 110;
        
        this.highOsc = this.context.createOscillator();
        this.highOsc.type = 'sine';
        this.highOsc.frequency.value = 220;
        
        this.bassGain = this.context.createGain();
        this.bassGain.gain.value = 0.4;
        
        this.midGain = this.context.createGain();
        this.midGain.gain.value = 0.2;
        
        this.highGain = this.context.createGain();
        this.highGain.gain.value = 0.1;
    }
    
    setupFilters() {
        this.bassFilter = this.context.createBiquadFilter();
        this.bassFilter.type = 'lowpass';
        this.bassFilter.frequency.value = 150;
        this.bassFilter.Q.value = 1;
        
        this.midFilter = this.context.createBiquadFilter();
        this.midFilter.type = 'bandpass';
        this.midFilter.frequency.value = 800;
        this.midFilter.Q.value = 0.5;
        
        this.highFilter = this.context.createBiquadFilter();
        this.highFilter.type = 'highpass';
        this.highFilter.frequency.value = 1500;
        this.highFilter.Q.value = 0.5;
    }
    
    setupLFOs() {
        this.bassLFO = this.context.createOscillator();
        this.bassLFO.frequency.value = 0.2;
        this.bassLFOGain = this.context.createGain();
        this.bassLFOGain.gain.value = 10;
        
        this.midLFO = this.context.createOscillator();
        this.midLFO.frequency.value = 0.1;
        this.midLFOGain = this.context.createGain();
        this.midLFOGain.gain.value = 15;
        
        this.highLFO = this.context.createOscillator();
        this.highLFO.frequency.value = 0.15;
        this.highLFOGain = this.context.createGain();
        this.highLFOGain.gain.value = 20;
    }
    
    startOscillators() {
        // Connect oscillators
        this.bassOsc.connect(this.bassGain);
        this.bassGain.connect(this.bassFilter);
        this.bassFilter.connect(this.masterGain);
        
        this.midOsc.connect(this.midGain);
        this.midGain.connect(this.midFilter);
        this.midFilter.connect(this.masterGain);
        
        this.highOsc.connect(this.highGain);
        this.highGain.connect(this.highFilter);
        this.highFilter.connect(this.masterGain);
        
        // Start all oscillators
        this.bassOsc.start();
        this.midOsc.start();
        this.highOsc.start();
        this.bassLFO.start();
        this.midLFO.start();
        this.highLFO.start();
    }
    
    update(seed) {
        const now = this.context.currentTime;
        
        if (now - this.lastRhythmTime >= this.rhythmInterval / 1000) {
            this.lastRhythmTime = now;
            this.bassGain.gain.setValueAtTime(0.4, now);
            this.bassGain.gain.exponentialRampToValueAtTime(0.1, now + 0.1);
        }

        const bassFreq = 55 + (seed % 5);
        const midFreq = 110 + (seed % 10);
        const highFreq = 220 + (seed % 15);
        
        this.bassOsc.frequency.setTargetAtTime(bassFreq, now, 0.1);
        this.midOsc.frequency.setTargetAtTime(midFreq, now, 0.1);
        this.highOsc.frequency.setTargetAtTime(highFreq, now, 0.1);
        
        const bassMod = Math.sin(now * 0.2) * 30 + 150;
        const midMod = Math.sin(now * 0.1) * 100 + 800;
        const highMod = Math.sin(now * 0.15) * 200 + 1500;
        
        this.bassFilter.frequency.setTargetAtTime(bassMod, now, 0.1);
        this.midFilter.frequency.setTargetAtTime(midMod, now, 0.1);
        this.highFilter.frequency.setTargetAtTime(highMod, now, 0.1);
    }
    
    getAnalyser() {
        return this.analyser;
    }
    
    getAudioData() {
        return this.audioData;
    }
}

// Toggle music playback
export async function toggleMusic() {
    try {
        if (!state.synth) {
            state.synth = new TechnoSynth(state.audioContext);
            state.analyser = state.synth.getAnalyser();
            state.audioData = state.synth.getAudioData();
            state.musicPlaying = true;
        } else {
            if (state.musicPlaying) {
                state.synth.masterGain.gain.setValueAtTime(0, state.audioContext.currentTime);
                state.musicPlaying = false;
            } else {
                state.synth.masterGain.gain.setValueAtTime(0.5, state.audioContext.currentTime);
                state.musicPlaying = true;
            }
        }
    } catch (error) {
        console.error('Error toggling music:', error);
    }
}

// Setup microphone input
export async function setupMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = state.audioContext.createMediaStreamSource(stream);
        state.microphoneAnalyser = state.audioContext.createAnalyser();
        state.microphoneAnalyser.fftSize = 256;
        state.microphoneData = new Uint8Array(state.microphoneAnalyser.frequencyBinCount);
        source.connect(state.microphoneAnalyser);
        state.isMicrophoneActive = true;
    } catch (error) {
        console.error('Error setting up microphone:', error);
    }
}

// Get current audio levels
export function getAudioLevels() {
    let bassLevel = 0;
    let midLevel = 0;
    let trebleLevel = 0;
    let overallLevel = 0;

    function average(array) {
        return array.reduce((a, b) => a + b, 0) / array.length;
    }

    if (state.analyser && state.musicPlaying) {
        state.analyser.getByteFrequencyData(state.audioData);
        bassLevel = (average(state.audioData.slice(0, 4)) / 255) * 2.5;
        midLevel = (average(state.audioData.slice(4, 12)) / 255) * 2.0;
        trebleLevel = (average(state.audioData.slice(12, 24)) / 255) * 2.0;
        overallLevel = (average(state.audioData) / 255) * 2.0;
    }

    if (state.microphoneAnalyser && state.isMicrophoneActive) {
        state.microphoneAnalyser.getByteFrequencyData(state.microphoneData);
        const micBass = (average(state.microphoneData.slice(0, 4)) / 255) * 2.5;
        const micMid = (average(state.microphoneData.slice(4, 12)) / 255) * 2.0;
        const micTreble = (average(state.microphoneData.slice(12, 24)) / 255) * 2.0;
        const micOverall = (average(state.microphoneData) / 255) * 2.0;
        
        bassLevel = Math.max(bassLevel, micBass * 2.0);
        midLevel = Math.max(midLevel, micMid * 1.8);
        trebleLevel = Math.max(trebleLevel, micTreble * 1.8);
        overallLevel = Math.max(overallLevel, micOverall * 1.8);
    }

    return { bassLevel, midLevel, trebleLevel, overallLevel };
}

// Export state and functions
export const audioState = state; 
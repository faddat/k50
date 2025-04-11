import { toggleMode, isClassicMode } from './visualization.js';
import { toggleMusic, setupMicrophone, audioState } from './audio.js';

// UI state
const state = {
    controlsTimeout: null,
    controlsVisible: true
};

// Initialize UI controls
export function initControls() {
    const topControls = document.querySelectorAll('.controls, .audio-controls, .microphone-control');
    const bottomControls = document.querySelectorAll('.node-count-container');
    const modeIndicator = document.querySelector('.mode-indicator');

    // Show/hide controls functions
    function showControls() {
        clearTimeout(state.controlsTimeout);
        topControls.forEach(element => {
            element.classList.remove('hidden');
        });
        bottomControls.forEach(element => {
            element.classList.remove('hidden-bottom');
        });
        modeIndicator.classList.add('visible');
        state.controlsTimeout = setTimeout(hideControls, 3000);
    }

    function hideControls() {
        topControls.forEach(element => {
            element.classList.add('hidden');
        });
        bottomControls.forEach(element => {
            element.classList.add('hidden-bottom');
        });
        modeIndicator.classList.remove('visible');
    }

    // Event listeners
    document.addEventListener('mousemove', showControls);

    [...topControls, ...bottomControls].forEach(element => {
        element.addEventListener('mouseenter', () => {
            clearTimeout(state.controlsTimeout);
        });
        element.addEventListener('mouseleave', () => {
            state.controlsTimeout = setTimeout(hideControls, 3000);
        });
    });

    // Space bar handler for mode switching
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !event.repeat) {
            event.preventDefault();
            handleModeSwitch();
        }
    });

    // Initialize with hidden controls
    hideControls();
}

// Handle mode switching
export function handleModeSwitch() {
    const newMode = toggleMode();
    const modeIndicator = document.querySelector('.mode-indicator');
    
    // Update mode indicator
    modeIndicator.textContent = `Mode: ${newMode ? 'Classic' : 'Fluid'}`;
    modeIndicator.classList.add('visible');
    
    // Clear timeout and set new one
    clearTimeout(state.controlsTimeout);
    state.controlsTimeout = setTimeout(() => {
        modeIndicator.classList.remove('visible');
    }, 3000);
}

// Handle microphone toggle
export function handleMicrophoneToggle() {
    const micButton = document.querySelector('.microphone-control button');
    
    if (!audioState.isMicrophoneActive) {
        setupMicrophone();
        micButton.style.background = '#ffd700';
        micButton.style.color = '#0d041a';
    } else {
        audioState.isMicrophoneActive = false;
        micButton.style.background = 'rgba(255, 215, 0, 0.2)';
        micButton.style.color = '#ffd700';
    }
}

// Handle music toggle
export function handleMusicToggle() {
    toggleMusic();
}

// Export state
export const controlsState = state; 
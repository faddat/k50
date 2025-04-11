import { visualizationState } from './visualization.js';
import { toggleMusic, setupMicrophone, audioState } from './audio.js';
import { handleNodeCountChange } from './app.js';

// UI state
const state = {
  controlsTimeout: null,
  controlsVisible: true,
  modeIndicator: null,
  debugButton: null,
  nodeCountInput: null,
  modeToggle: null,
};

// Initialize controls
export function initControls() {
  // Cache DOM elements
  state.debugButton = document.getElementById('debug');
  state.nodeCountInput = document.getElementById('nodeCount');
  state.modeToggle = document.getElementById('mode');
  state.modeIndicator = document.querySelector('.mode-indicator');

  setupDebugButton();
  setupNodeCountInput();
  setupModeToggle();
  setupControlsVisibility();
}

function setupDebugButton() {
  if (state.debugButton) {
    state.debugButton.addEventListener('click', () => {
      document.body.classList.toggle('debug');
      if (window.stats) {
        window.stats.dom.style.display = document.body.classList.contains('debug')
          ? 'block'
          : 'none';
      }
    });
  }
}

function setupNodeCountInput() {
  if (state.nodeCountInput) {
    state.nodeCountInput.addEventListener('change', e => {
      handleNodeCountChange(parseInt(e.target.value));
    });
  }
}

function setupModeToggle() {
  if (state.modeToggle) {
    state.modeToggle.addEventListener('click', () => {
      toggleVisualizationMode();
    });

    // Initialize mode display
    updateModeDisplay(visualizationState.isClassicMode);
  }
}

function toggleVisualizationMode() {
  visualizationState.isClassicMode = !visualizationState.isClassicMode;
  updateModeDisplay(visualizationState.isClassicMode);
  applyModeVisualChanges(visualizationState.isClassicMode);
}

function updateModeDisplay(isClassic) {
  if (state.modeToggle) {
    state.modeToggle.textContent = isClassic ? 'Mode: Classic' : 'Mode: Dynamic';
    document.body.classList.toggle('classic-mode', isClassic);
  }

  if (state.modeIndicator) {
    state.modeIndicator.textContent = `Mode: ${isClassic ? 'Classic' : 'Dynamic'}`;
    state.modeIndicator.classList.add('visible');

    clearTimeout(state.controlsTimeout);
    state.controlsTimeout = setTimeout(() => {
      state.modeIndicator.classList.remove('visible');
    }, 3000);
  }
}

function applyModeVisualChanges(isClassic) {
  if (visualizationState.nodeSprites) {
    visualizationState.nodeSprites.forEach(sprite => {
      if (isClassic) {
        sprite.scale.setScalar(50); // Smaller nodes in classic mode
      } else {
        sprite.scale.copy(sprite.userData.originalScale); // Restore original scale
      }
    });
  }
}

function setupControlsVisibility() {
  const topControls = document.querySelectorAll('.controls, .audio-controls, .microphone-control');
  const bottomControls = document.querySelectorAll('.node-count-container');

  function showControls() {
    clearTimeout(state.controlsTimeout);
    topControls.forEach(element => element.classList.remove('hidden'));
    bottomControls.forEach(element => element.classList.remove('hidden-bottom'));
    if (state.modeIndicator) state.modeIndicator.classList.add('visible');
    state.controlsTimeout = setTimeout(hideControls, 3000);
  }

  function hideControls() {
    topControls.forEach(element => element.classList.add('hidden'));
    bottomControls.forEach(element => element.classList.add('hidden-bottom'));
    if (state.modeIndicator) state.modeIndicator.classList.remove('visible');
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

  // Initialize with hidden controls
  hideControls();
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

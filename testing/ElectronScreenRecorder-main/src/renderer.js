import './index.css';

console.log('👋 Audio Recorder App');

import { ipcRenderer } from 'electron';
import { writeFile } from 'fs';

let mediaRecorder;
let recordedChunks = [];
let currentAudioType = null; // Track which type of audio is being recorded

// UI Elements
const startSystemAudioBtn = document.getElementById('startSystemAudioBtn');
const startMicrophoneBtn = document.getElementById('startMicrophoneBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDisplay = document.getElementById('statusDisplay');

// System Audio Recording
startSystemAudioBtn.onclick = () => {
  currentAudioType = 'system-audio';
  startSystemAudioRecording();
};

// Microphone Recording
startMicrophoneBtn.onclick = () => {
  currentAudioType = 'microphone';
  startMicrophoneRecording();
};

// Stop Recording
stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    statusDisplay.innerText = 'Stopped. Saving file...';
  }
};

// System Audio Recording Function
async function startSystemAudioRecording() {
  try {
    recordedChunks = [];
    statusDisplay.innerText = 'Recording System Audio...';
    startSystemAudioBtn.disabled = true;
    startMicrophoneBtn.disabled = true;
    stopBtn.disabled = false;

    const IS_MACOS = await ipcRenderer.invoke('getOperatingSystem') === 'darwin';

    // System audio constraints - won't work on macOS without additional setup
    const constraints = {
      audio: !IS_MACOS ? {
        mandatory: {
          chromeMediaSource: 'desktop'
        }
      } : false,
      video: false
    };

    if (IS_MACOS) {
      statusDisplay.innerText = 'System audio not supported on macOS. Use Microphone instead.';
      startSystemAudioBtn.disabled = false;
      startMicrophoneBtn.disabled = false;
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = () => stopSystemAudioRecording(stream);
    mediaRecorder.start();

  } catch (error) {
    console.error('System Audio Error:', error);
    statusDisplay.innerText = 'Error: ' + error.message;
    startSystemAudioBtn.disabled = false;
    startMicrophoneBtn.disabled = false;
  }
}

// Microphone Recording Function
async function startMicrophoneRecording() {
  try {
    recordedChunks = [];
    statusDisplay.innerText = 'Recording Microphone...';
    startSystemAudioBtn.disabled = true;
    startMicrophoneBtn.disabled = true;
    stopBtn.disabled = false;

    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      },
      video: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = () => stopMicrophoneRecording(stream);
    mediaRecorder.start();

  } catch (error) {
    console.error('Microphone Error:', error);
    statusDisplay.innerText = 'Microphone access denied: ' + error.message;
    startSystemAudioBtn.disabled = false;
    startMicrophoneBtn.disabled = false;
  }
}

// Data Available Callback
function onDataAvailable(e) {
  if (e.data.size > 0) {
    recordedChunks.push(e.data);
  }
}

// Stop System Audio Recording
async function stopSystemAudioRecording(stream) {
  stream.getTracks().forEach(track => track.stop());
  await saveAudioFile('system-audio');
  resetUI();
}

// Stop Microphone Recording
async function stopMicrophoneRecording(stream) {
  stream.getTracks().forEach(track => track.stop());
  await saveAudioFile('microphone');
  resetUI();
}

// Save Audio File
async function saveAudioFile(audioType) {
  try {
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const buffer = Buffer.from(await blob.arrayBuffer());
    recordedChunks = [];

    const { canceled, filePath } = await ipcRenderer.invoke('showSaveDialog', audioType);

    if (canceled) {
      statusDisplay.innerText = 'Save canceled.';
      return;
    }

    if (filePath) {
      writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error('Save Error:', err);
          statusDisplay.innerText = 'Error saving file: ' + err.message;
        } else {
          statusDisplay.innerText = `Audio saved successfully at: ${filePath}`;
          console.log('Audio saved successfully!');
        }
      });
    }
  } catch (error) {
    console.error('Save Error:', error);
    statusDisplay.innerText = 'Error: ' + error.message;
  }
}

// Reset UI
function resetUI() {
  startSystemAudioBtn.disabled = false;
  startMicrophoneBtn.disabled = false;
  stopBtn.disabled = true;
  currentAudioType = null;
}

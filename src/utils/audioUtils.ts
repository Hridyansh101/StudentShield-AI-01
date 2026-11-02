// StudentShield Audio Recording & Synthesis Utilities

// Generate a valid base64-encoded WAV audio clip for demo presets
export function createSyntheticDemoWav(durationSeconds: number = 3, frequency: number = 440): string {
  const sampleRate = 8000;
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + numSamples, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * 1 channel * 8 bits / 8)
  view.setUint32(28, sampleRate, true);
  // block align (1 channel * 8 bits / 8)
  view.setUint16(32, 1, true);
  // bits per sample
  view.setUint16(34, 8, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, numSamples, true);

  // Generate simulated telephone dial/call tones
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Modulated phone tone with cadence
    const tone1 = Math.sin(2 * Math.PI * frequency * t);
    const tone2 = Math.sin(2 * Math.PI * (frequency * 1.33) * t);
    const pulse = Math.sin(2 * Math.PI * 2 * t) > 0 ? 1 : 0.3;
    const sample = 128 + Math.floor(40 * (tone1 + tone2) * 0.5 * pulse);
    view.setUint8(44 + i, Math.max(0, Math.min(255, sample)));
  }

  // Convert array buffer to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Convert AudioContext PCM Int16 to Base64 for Live API
export function pcmToBase64(float32Array: Float32Array): string {
  const l = float32Array.length;
  const int16Array = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  let binary = '';
  const bytes = new Uint8Array(int16Array.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Play incoming 24kHz raw PCM chunk from Gemini Live
export function playLiveAudioChunk(audioCtx: AudioContext, base64Audio: string, nextStartTimeRef: { current: number }) {
  try {
    const binary = atob(base64Audio);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
  } catch (err) {
    console.warn('Error playing live audio chunk:', err);
  }
}

/**
 * Final Proxispeak - AudioContext & Local Microphone Service
 */

class AudioContextService {
  constructor() {
    this.audioContext = null;
    this.localStream = null;
    this.localTrack = null;
    this.analyser = null;
    this.isMuted = false;
    this.permissionState = 'prompt'; // 'prompt' | 'granted' | 'denied'
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    // Resume if suspended by browser autoplay policy
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch((err) => {
        console.warn('[AudioContext] Auto-resume postponed until user gesture:', err.message);
      });
    }
    return this.audioContext;
  }

  async requestMicrophone() {
    try {
      this.getAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this.localStream = stream;
      this.localTrack = stream.getAudioTracks()[0];
      this.permissionState = 'granted';
      this.isMuted = false;

      // Attach audio analyzer for speech level meter
      if (this.audioContext && this.localStream) {
        try {
          const source = this.audioContext.createMediaStreamSource(this.localStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);
        } catch (analyserErr) {
          console.warn('[AudioContext] Could not connect analyzer:', analyserErr.message);
        }
      }

      console.log('[AudioContext] Microphone access granted');
      return { success: true, stream: this.localStream };
    } catch (error) {
      console.error('[AudioContext] Microphone request failed:', error.name, error.message);
      this.permissionState = error.name === 'NotAllowedError' ? 'denied' : 'error';
      return { success: false, error: error.name };
    }
  }

  toggleMute() {
    if (this.localTrack) {
      this.isMuted = !this.isMuted;
      this.localTrack.enabled = !this.isMuted;
      return this.isMuted;
    }
    return true;
  }

  setMute(mute) {
    if (this.localTrack) {
      this.isMuted = mute;
      this.localTrack.enabled = !mute;
      return this.isMuted;
    }
    return true;
  }

  getAudioLevel() {
    if (!this.analyser || this.isMuted) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255); // Normalized 0.0 - 1.0
  }

  getLocalVolume() {
    return this.getAudioLevel();
  }

  stop() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
      this.localTrack = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const audioContextService = new AudioContextService();


/**
 * Web Audio API procedural sound synthesizer (Zero external dependencies).
 * Generates realistic low-frequency rocket engine rumble, thruster hisses, and capture chimes.
 */
export class SoundFX {
  constructor() {
    this.ctx = null;
    this.thrusterGain = null;
    this.thrusterNoise = null;
    this.isFiring = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  startThruster(type = 'PROGRADE') {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.isFiring) return;
    this.isFiring = true;

    try {
      // 1. Procedural Pink/Brownian Noise Buffer for Rocket Thrust
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brownian filter for deep sub-bass roar
        data[i] = (lastOut + 0.03 * white) / 1.03;
        lastOut = data[i];
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter: deep rumble for prograde, slightly harsher hiss for retrograde
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'PROGRADE' ? 240 : 360, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.thrusterNoise = noise;
      this.thrusterGain = gain;
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  stopThruster() {
    if (!this.isFiring) return;
    this.isFiring = false;

    if (this.thrusterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.thrusterGain.gain.setValueAtTime(this.thrusterGain.gain.value, now);
        this.thrusterGain.gain.linearRampToValueAtTime(0.0001, now + 0.08);

        const noiseRef = this.thrusterNoise;
        const gainRef = this.thrusterGain;
        this.thrusterNoise = null;
        this.thrusterGain = null;

        setTimeout(() => {
          try {
            if (noiseRef) {
              noiseRef.stop();
              noiseRef.disconnect();
            }
            if (gainRef) {
              gainRef.disconnect();
            }
          } catch (e) {}
        }, 90);
      } catch (e) {
        this.thrusterNoise = null;
        this.thrusterGain = null;
      }
    }
  }

  playCapture() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.28); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
  }
}

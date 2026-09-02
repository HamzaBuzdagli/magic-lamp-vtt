class SoundService {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: { stop: () => void } | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private volume: number = 0.5;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.volume;
    }
  }

  public stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (e) {
        console.warn('Error stopping procedural ambient source:', e);
      }
      this.ambientSource = null;
    }
    if (this.customAudioElement) {
      try {
        this.customAudioElement.pause();
        this.customAudioElement.currentTime = 0;
      } catch (e) {
        console.warn('Error stopping custom audio element:', e);
      }
      this.customAudioElement = null;
    }
  }

  public playTrackById(trackId: string, customTracks: Array<{ id: string; url: string }> = []) {
    this.stopAmbient();
    if (trackId === 'rain') this.playRainAmbient();
    else if (trackId === 'tavern') this.playTavernAmbient();
    else if (trackId === 'cave') this.playCaveAmbient();
    else if (trackId === 'war') this.playWarAmbient();
    else {
      const custom = customTracks.find((t) => t.id === trackId);
      if (custom && custom.url) {
        this.playCustomAudio(custom.url);
      }
    }
  }

  public playCustomAudio(url: string, loop: boolean = true) {
    this.stopAmbient();
    try {
      const audio = new Audio(url);
      audio.loop = loop;
      audio.volume = this.volume;
      audio.play().catch((err) => {
        console.warn('Custom audio playback blocked or failed:', err);
      });
      this.customAudioElement = audio;
    } catch (e) {
      console.warn('Failed to initialize custom audio:', e);
    }
  }

  public playRainAmbient() {
    this.stopAmbient();
    this.initCtx();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    this.ambientGain = gain;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    this.ambientSource = { stop: () => { try { noise.stop(); } catch(e){} } };
  }

  public playTavernAmbient() {
    this.stopAmbient();
    this.initCtx();
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    this.ambientGain = gain;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start();
    osc2.start();
    const interval = window.setInterval(() => {
      if (!this.ctx) return;
      const pop = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      pop.type = 'square';
      pop.frequency.setValueAtTime(100 + Math.random() * 800, this.ctx.currentTime);
      popGain.gain.setValueAtTime(this.volume * 0.08, this.ctx.currentTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      pop.connect(popGain);
      popGain.connect(this.ctx.destination);
      pop.start();
      pop.stop(this.ctx.currentTime + 0.04);
    }, 280);
    this.ambientSource = {
      stop: () => {
        clearInterval(interval);
        try { osc1.stop(); osc2.stop(); } catch (e) {}
      }
    };
  }

  public playCaveAmbient() {
    this.stopAmbient();
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
    this.ambientGain = gain;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    this.ambientSource = { stop: () => { try { osc.stop(); } catch(e){} } };
  }

  public playWarAmbient() {
    this.stopAmbient();
    this.initCtx();
    if (!this.ctx) return;
    const interval = window.setInterval(() => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    }, 550);
    this.ambientSource = {
      stop: () => clearInterval(interval)
    };
  }

  public playDiceSound() {
    this.initCtx();
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 600, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      }, i * 45);
    }
  }

  public playSwordSound() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playMagicSound() {
    this.initCtx();
    if (!this.ctx) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 + i * 150, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      }, i * 35);
    }
  }

  public playTorchSound() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    gain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playMonsterSound() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  public playVictorySound() {
    this.initCtx();
    if (!this.ctx) return;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, idx * 100);
    });
  }
}

export const soundService = new SoundService();

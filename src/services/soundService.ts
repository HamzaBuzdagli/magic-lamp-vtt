class SoundService {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: { stop: () => void } | null = null;
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
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(58, this.ctx.currentTime);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
    this.ambientGain = gain;
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start();
    osc2.start();
    this.ambientSource = {
      stop: () => { try { osc1.stop(); osc2.stop(); } catch (e) {} }
    };
  }

  public playWarAmbient() {
    this.stopAmbient();
    this.initCtx();
    if (!this.ctx) return;
    let step = 0;
    const interval = window.setInterval(() => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const isStrong = step % 4 === 0;
      const freq = isStrong ? 65 : 85;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
      const amp = isStrong ? this.volume * 0.4 : this.volume * 0.22;
      gain.gain.setValueAtTime(amp, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
      step++;
    }, 380);
    this.ambientSource = { stop: () => { clearInterval(interval); } };
  }

  public stopAmbient() {
    if (this.ambientSource) {
      try { this.ambientSource.stop(); } catch (e) {}
      this.ambientSource = null;
    }
  }

  public playSwordClash() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  public playDiceRoll() {
    this.initCtx();
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350 + Math.random() * 300, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      }, i * 60);
    }
  }

  public playMagicSpell() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  public playMonsterRoar() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  public playVictoryFanfare() {
    this.initCtx();
    if (!this.ctx) return;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      }, i * 90);
    });
  }

  public playDoomGong() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.9);
  }
}

export const soundService = new SoundService();
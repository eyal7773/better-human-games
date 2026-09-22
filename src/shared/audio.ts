/**
 * Fully procedural sound: every effect and the ambient music are synthesized
 * with the Web Audio API, so the games ship with zero audio files.
 */

const PENTA = [0, 2, 4, 7, 9];
export const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const pentaStep = (i: number) => PENTA[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);

interface ToneOpts {
  f: number;
  type?: OscillatorType;
  t?: number; // delay in seconds
  a?: number; // attack
  d?: number; // decay
  g?: number; // peak gain
  to?: number; // glide target frequency
  lp?: number; // lowpass cutoff
  verb?: number; // reverb send
  bus?: 'sfx' | 'music';
  detune?: number;
}

interface NoiseOpts {
  t?: number;
  a?: number;
  d?: number;
  g?: number;
  type?: BiquadFilterType;
  f?: number;
  to?: number;
  q?: number;
  verb?: number;
}

type Stop = () => void;

export class AudioEngine {
  ctx: AudioContext | null = null;
  muted: boolean;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private verb!: GainNode;
  private noiseBuf!: AudioBuffer;
  private whistle: { g: GainNode; osc: OscillatorNode; bp: BiquadFilterNode } | null = null;
  private padTimer = 0;
  private padVoices: { g: GainNode; oscs: OscillatorNode[] }[] = [];
  private extras: Stop[] = [];
  private pendingPad: 'home' | 'island' | null = null;

  constructor(muted = false) {
    this.muted = muted;
  }

  /** Must be called from a user gesture (iOS/Chrome autoplay rules). */
  unlock() {
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(comp);
      this.sfx = ctx.createGain();
      this.sfx.gain.value = 0.85;
      this.sfx.connect(this.master);
      this.music = ctx.createGain();
      this.music.gain.value = 0.55;
      this.music.connect(this.master);
      const conv = ctx.createConvolver();
      conv.buffer = this.impulse(3, 2.6);
      const wet = ctx.createGain();
      wet.gain.value = 0.4;
      conv.connect(wet);
      wet.connect(this.master);
      this.verb = ctx.createGain();
      this.verb.connect(conv);
      const len = ctx.sampleRate * 2;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.pendingPad) {
      const mood = this.pendingPad;
      this.pendingPad = null;
      this.startPad(mood);
    }
  }

  /** Silence everything while the app is in the background. */
  setBackground(hidden: boolean) {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  private impulse(sec: number, decay: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private envelope(g: GainNode, t: number, a: number, peak: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  tone(o: ToneOpts) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + (o.t ?? 0);
    const a = o.a ?? 0.005;
    const d = o.d ?? 0.2;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.detune) osc.detune.value = o.detune;
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + a + d);
    const g = ctx.createGain();
    this.envelope(g, t, a, o.g ?? 0.2, d);
    let node: AudioNode = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(o.bus === 'music' ? this.music : this.sfx);
    if (o.verb) {
      const s = ctx.createGain();
      s.gain.value = o.verb;
      g.connect(s);
      s.connect(this.verb);
    }
    osc.start(t);
    osc.stop(t + a + d + 0.05);
  }

  noise(o: NoiseOpts) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + (o.t ?? 0);
    const a = o.a ?? 0.005;
    const d = o.d ?? 0.2;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.f ?? 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + a + d);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    this.envelope(g, t, a, o.g ?? 0.2, d);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    if (o.verb) {
      const s = ctx.createGain();
      s.gain.value = o.verb;
      g.connect(s);
      s.connect(this.verb);
    }
    src.start(t, Math.random() * 1.5);
    src.stop(t + a + d + 0.05);
  }

  // ---------- one-shot effects ----------

  /** Marimba-ish note climbing a pentatonic scale — progress feels musical. */
  pluck(step = 0) {
    const f = midi(69 + pentaStep(step));
    this.tone({ f, d: 0.55, g: 0.2, verb: 0.25 });
    this.tone({ f: f * 4, d: 0.07, g: 0.04 });
    this.tone({ f: f * 2, d: 0.2, g: 0.05, type: 'triangle' });
  }

  success() {
    [0, 2, 4, 7].forEach((s, i) => {
      const f = midi(72 + pentaStep(s));
      this.tone({ f, t: i * 0.085, d: 0.8, g: 0.14, verb: 0.35 });
      this.tone({ f: f * 3, t: i * 0.085, d: 0.2, g: 0.02 });
    });
  }

  miss() {
    this.tone({ f: 200, to: 110, type: 'triangle', d: 0.18, g: 0.2 });
  }

  pop() {
    this.tone({ f: 380, to: 1000, d: 0.08, g: 0.14 });
  }

  whoosh() {
    this.noise({ a: 0.08, d: 0.35, g: 0.22, type: 'bandpass', f: 350, to: 2600, q: 1.1 });
  }

  giggle() {
    for (let i = 0; i < 6; i++) {
      const f = 650 + Math.random() * 450;
      this.tone({ f, to: f * 1.5, type: 'square', t: i * 0.07, d: 0.05, g: 0.045, lp: 2600 });
    }
  }

  /** Whiny little-voice "aaa!" — a sawtooth glide through a vowel-ish filter. */
  whine() {
    const f = 380 + Math.random() * 120;
    this.tone({ f, to: f * 1.6, type: 'sawtooth', a: 0.05, d: 0.45, g: 0.07, lp: 1400 });
    this.tone({ f: f * 1.5, to: f * 2.2, type: 'sawtooth', t: 0.08, a: 0.05, d: 0.35, g: 0.04, lp: 1800 });
  }

  notif() {
    this.tone({ f: 1318.5, d: 0.15, g: 0.11, type: 'triangle' });
    this.tone({ f: 1760, t: 0.12, d: 0.35, g: 0.11, type: 'triangle', verb: 0.1 });
  }

  ring() {
    for (let i = 0; i < 8; i++)
      this.tone({ f: i % 2 ? 1400 : 1760, type: 'square', t: i * 0.055, d: 0.045, g: 0.035, lp: 4000 });
  }

  tick(accent = false) {
    this.tone({ f: accent ? 2400 : 1800, d: 0.025, g: accent ? 0.05 : 0.035, type: 'square', lp: 5000 });
  }

  sizzle() {
    this.noise({ d: 0.14, g: 0.22, type: 'highpass', f: 2500 });
    this.tone({ f: 160, to: 90, type: 'sawtooth', d: 0.12, g: 0.06, lp: 900 });
  }

  heartbeat() {
    this.tone({ f: 72, to: 42, d: 0.16, g: 0.55 });
    this.tone({ f: 66, to: 40, t: 0.2, d: 0.2, g: 0.38 });
  }

  bell(pitch = 0, gain = 1) {
    const base = midi(84 + pitch);
    const partials: [number, number, number][] = [
      [1, 0.16, 2.4],
      [2.76, 0.07, 1.4],
      [5.4, 0.035, 0.8],
      [8.93, 0.018, 0.5],
    ];
    for (const [m, g, d] of partials) this.tone({ f: base * m, d, g: g * gain, verb: 0.6 });
  }

  gong() {
    const base = 98;
    for (const [m, g, d] of [
      [1, 0.25, 4],
      [1.47, 0.1, 3],
      [2.09, 0.06, 2.2],
      [2.9, 0.03, 1.6],
    ] as const)
      this.tone({ f: base * m, a: 0.01, d, g, verb: 0.7 });
  }

  coin(i = 0) {
    this.tone({ f: midi(88 + pentaStep(i % 7)), d: 0.14, g: 0.07, verb: 0.15 });
  }

  slip() {
    this.noise({ d: 0.1, g: 0.25, type: 'highpass', f: 2200 });
    this.tone({ f: 320, to: 120, type: 'sawtooth', d: 0.14, g: 0.05, lp: 1200 });
  }

  /** Breathing air: filtered noise that swells in (rising) or out (falling). */
  breath(inhale: boolean, dur: number) {
    this.noise({
      a: dur * 0.55,
      d: dur * 0.45,
      g: 0.16,
      type: 'lowpass',
      f: inhale ? 260 : 950,
      to: inhale ? 1100 : 220,
      q: 0.4,
    });
  }

  boilOver() {
    this.noise({ a: 0.05, d: 1.6, g: 0.5, type: 'bandpass', f: 700, to: 3200, q: 0.8, verb: 0.3 });
    this.tone({ f: 2300, to: 2900, d: 1.2, g: 0.08 });
    this.tone({ f: 55, to: 35, d: 1.5, g: 0.4 });
  }

  // ---------- continuous layers ----------

  /** Kettle whistle that rises with the heat. level 0..1 */
  setWhistle(level: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    if (!this.whistle) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 7;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 18;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 22;
      const ng = ctx.createGain();
      ng.gain.value = 0.9;
      src.connect(bp);
      bp.connect(ng);
      const g = ctx.createGain();
      g.gain.value = 0;
      const og = ctx.createGain();
      og.gain.value = 0.35;
      osc.connect(og);
      og.connect(g);
      ng.connect(g);
      g.connect(this.sfx);
      osc.start();
      lfo.start();
      src.start();
      this.whistle = { g, osc, bp };
    }
    const t = ctx.currentTime;
    const amp = level <= 0 ? 0 : Math.pow(level, 1.6) * 0.09;
    const f = 1150 + level * 1500;
    this.whistle.g.gain.setTargetAtTime(this.muted ? 0 : amp, t, 0.12);
    this.whistle.osc.frequency.setTargetAtTime(f, t, 0.2);
    this.whistle.bp.frequency.setTargetAtTime(f, t, 0.2);
  }

  /** Buzzing fly. Returns a stop function. */
  buzz(): Stop {
    const ctx = this.ctx;
    if (!ctx || this.muted) return () => {};
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 185;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 21;
    const lg = ctx.createGain();
    lg.gain.value = 26;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.05, ctx.currentTime, 0.08);
    osc.connect(bp);
    bp.connect(g);
    g.connect(this.sfx);
    osc.start();
    lfo.start();
    return () => {
      const t = ctx.currentTime;
      g.gain.setTargetAtTime(0, t, 0.06);
      osc.stop(t + 0.4);
      lfo.stop(t + 0.4);
    };
  }

  /**
   * Soft evolving pad. `mood` changes the chord colour:
   * home = warm major 7ths, island = open suspended voicings.
   */
  startPad(mood: 'home' | 'island') {
    const ctx = this.ctx;
    if (!ctx) {
      this.pendingPad = mood;
      return;
    }
    if (this.padTimer) return;
    const progressions: Record<string, number[][]> = {
      home: [
        [48, 55, 64, 71],
        [45, 52, 60, 67],
        [41, 48, 57, 64],
        [43, 50, 59, 62],
      ],
      island: [
        [50, 57, 62, 69, 76],
        [46, 53, 62, 65, 72],
        [48, 55, 62, 67, 74],
        [45, 52, 60, 64, 71],
      ],
    };
    const chords = progressions[mood];
    let i = 0;
    const play = () => {
      if (this.muted) return;
      const now = ctx.currentTime;
      for (const v of this.padVoices.splice(0)) {
        v.g.gain.cancelScheduledValues(now);
        v.g.gain.setTargetAtTime(0, now, 1.4);
        v.oscs.forEach((o) => o.stop(now + 6));
      }
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      lp.connect(this.music);
      const send = ctx.createGain();
      send.gain.value = 0.5;
      lp.connect(send);
      send.connect(this.verb);
      for (const m of chords[i % chords.length]) {
        const g = ctx.createGain();
        g.gain.value = 0;
        g.gain.setTargetAtTime(0.022, now, 1.2);
        const oscs = [-6, 6].map((det) => {
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.value = midi(m);
          o.detune.value = det;
          o.connect(g);
          o.start(now);
          return o;
        });
        g.connect(lp);
        this.padVoices.push({ g, oscs });
      }
      i++;
    };
    play();
    this.padTimer = window.setInterval(play, 7000);
  }

  stopPad() {
    this.pendingPad = null;
    if (this.padTimer) clearInterval(this.padTimer);
    this.padTimer = 0;
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const v of this.padVoices.splice(0)) {
      v.g.gain.setTargetAtTime(0, now, 0.6);
      v.oscs.forEach((o) => o.stop(now + 3));
    }
  }

  /** Occasional wind chimes on the island. */
  startChimes() {
    let alive = true;
    const next = () => {
      if (!alive) return;
      if (!this.muted) {
        const n = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++)
          setTimeout(() => this.bell(pentaStep(Math.floor(Math.random() * 7)), 0.35), k * 180);
      }
      setTimeout(next, 3000 + Math.random() * 5000);
    };
    setTimeout(next, 1500);
    this.extras.push(() => (alive = false));
  }

  /** Gentle sea: looping noise with a slow swell. */
  startWaves() {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 480;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lg = ctx.createGain();
    lg.gain.value = 0.04;
    lfo.connect(lg);
    lg.connect(g.gain);
    src.connect(lp);
    lp.connect(g);
    g.connect(this.music);
    src.start();
    lfo.start();
    this.extras.push(() => {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      src.stop(ctx.currentTime + 2);
      lfo.stop(ctx.currentTime + 2);
    });
  }

  stopExtras() {
    for (const s of this.extras.splice(0)) s();
  }
}

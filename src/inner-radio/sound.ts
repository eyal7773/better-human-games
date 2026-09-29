import { midi, type AudioEngine } from '../shared/audio';
import { levelOf, type Emotion, type Station } from './logic';
import { EMOTION } from './content';

/**
 * The radio's continuous sound: white-noise static that thins out as you
 * tune in, and under it each station's little tune, louder the closer (and
 * the stronger) it is. Built lazily — audio only exists after a user gesture.
 */
export class RadioSound {
  private built = false;
  private staticGain: GainNode | null = null;
  private staticFilter: BiquadFilterNode | null = null;
  private src: AudioBufferSourceNode | null = null;
  private voices = new Map<Emotion, { g: GainNode; lp: BiquadFilterNode; next: number; i: number }>();
  private crackleAt = 0;
  level = 0;

  constructor(private audio: AudioEngine) {}

  private build(stations: readonly Station[]) {
    const gr = this.audio.graph();
    if (!gr) return false;
    const { ctx, out, noise } = gr;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(hp);
    hp.connect(g);
    g.connect(out);
    src.start();
    this.src = src;
    this.staticGain = g;
    this.staticFilter = hp;
    for (const s of stations) {
      const vg = ctx.createGain();
      vg.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600 + s.weight * 4000;
      vg.connect(lp);
      lp.connect(out);
      const send = ctx.createGain();
      send.gain.value = 0.35;
      lp.connect(send);
      send.connect(gr.verb);
      this.voices.set(s.id, { g: vg, lp, next: ctx.currentTime + 0.1, i: 0 });
    }
    this.built = true;
    return true;
  }

  /**
   * Called every frame. `staticLevel` 0…1, `locked` stations play at full
   * strength whatever the dial says.
   */
  update(dial: number, stations: readonly Station[], staticLevel: number, locked: readonly Emotion[]) {
    if (!this.built && !this.build(stations)) return;
    const gr = this.audio.graph()!;
    const { ctx } = gr;
    const now = ctx.currentTime;
    this.staticGain!.gain.setTargetAtTime(0.16 * staticLevel ** 1.3, now, 0.05);
    this.staticFilter!.frequency.setTargetAtTime(300 + staticLevel * 1500, now, 0.1);
    let loudest = 0;
    for (const s of stations) {
      const v = this.voices.get(s.id);
      if (!v) continue;
      const lv = locked.includes(s.id) ? 1 : levelOf(dial, s);
      loudest = Math.max(loudest, lv);
      v.g.gain.setTargetAtTime(lv * 0.5, now, 0.06);
      // Schedule the tune a little ahead, only while it can be heard.
      const info = EMOTION[s.id];
      // After a pause (tab hidden, a card open) don't burst out the missed notes.
      if (v.next < now - 0.1) v.next = now + 0.05;
      while (v.next < now + 0.25) {
        const note = info.motif[v.i % info.motif.length];
        if (lv > 0.01 && note) this.note(v.g, midi(note), v.next, info.step, info.wave);
        v.next += info.step;
        v.i++;
      }
    }
    this.level = Math.max(loudest, staticLevel * 0.6);
    // Crackles in the static, more when it's loud.
    if (staticLevel > 0.3 && now > this.crackleAt) {
      this.audio.noise({ d: 0.03, g: 0.12 * staticLevel, type: 'highpass', f: 3000 });
      this.crackleAt = now + 0.05 + Math.random() * (0.5 / staticLevel);
    }
  }

  private note(dest: AudioNode, f: number, t: number, step: number, wave: OscillatorType) {
    const ctx = this.audio.graph()!.ctx;
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.value = f;
    const g = ctx.createGain();
    const d = Math.min(1.2, step * 1.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  /** One pass of a feeling's tune (album). */
  playMotif(id: Emotion) {
    const gr = this.audio.graph();
    if (!gr || this.audio.muted) return;
    const info = EMOTION[id];
    const g = gr.ctx.createGain();
    g.gain.value = 0.5;
    g.connect(gr.out);
    info.motif.forEach((n, i) => n && this.note(g, midi(n), gr.ctx.currentTime + 0.05 + i * info.step, info.step, info.wave));
  }

  stop() {
    const gr = this.audio.graph();
    if (!gr || !this.built) return;
    const now = gr.ctx.currentTime;
    this.staticGain?.gain.setTargetAtTime(0, now, 0.1);
    const voices = [...this.voices.values()];
    for (const v of voices) v.g.gain.setTargetAtTime(0, now, 0.3);
    this.src?.stop(now + 1.5);
    const g = this.staticGain;
    setTimeout(() => {
      g?.disconnect();
      for (const v of voices) v.lp.disconnect();
    }, 2000);
    this.voices.clear();
    this.built = false;
  }
}

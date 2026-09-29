import type { AudioEngine } from '../shared/audio';

/**
 * The monster's voice: a low growl while the shadow is huge, rising and
 * softening as it shrinks, until at real size it's just a little chirp.
 */
export class Roar {
  private nodes: { saw: OscillatorNode; sub: OscillatorNode; lfo: OscillatorNode; src: AudioBufferSourceNode; lp: BiquadFilterNode; g: GainNode } | null = null;
  private chirpAt = 0;

  constructor(private audio: AudioEngine) {}

  private build() {
    const gr = this.audio.graph();
    if (!gr) return false;
    const { ctx, out, noise } = gr;
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.35;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.value = 0;
    // A slow wobble makes it breathe like a creature.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 3.2;
    const lg = ctx.createGain();
    lg.gain.value = 6;
    lfo.connect(lg);
    lg.connect(saw.frequency);
    saw.connect(lp);
    sub.connect(lp);
    src.connect(ng);
    ng.connect(lp);
    lp.connect(g);
    g.connect(out);
    saw.start();
    sub.start();
    src.start();
    lfo.start();
    this.nodes = { saw, sub, lfo, src, lp, g };
    return true;
  }

  /** m: magnification, monster: 0…1. */
  update(m: number, monster: number) {
    if (!this.nodes && !this.build()) return;
    const n = this.nodes!;
    const ctx = this.audio.graph()!.ctx;
    const now = ctx.currentTime;
    const f = 55 * Math.pow(5 / Math.max(1.05, m), 1.3);
    n.saw.frequency.setTargetAtTime(f, now, 0.08);
    n.sub.frequency.setTargetAtTime(f / 2, now, 0.08);
    n.lp.frequency.setTargetAtTime(300 + (1 - monster) * 2200, now, 0.1);
    n.g.gain.setTargetAtTime(monster > 0.08 ? 0.05 + monster * 0.14 : 0, now, 0.12);
    // At real size the roar is gone: an occasional chirp instead.
    if (monster <= 0.08 && now > this.chirpAt) {
      this.audio.tone({ f: 2200, to: 3100, d: 0.08, g: 0.05 });
      this.audio.tone({ f: 2600, to: 3400, t: 0.1, d: 0.07, g: 0.04 });
      this.chirpAt = now + 1.6 + Math.random();
    }
  }

  /** A second monster roaring back (your own shadow). */
  burst() {
    this.audio.noise({ a: 0.05, d: 0.9, g: 0.35, type: 'lowpass', f: 500, to: 150, q: 3 });
    this.audio.tone({ f: 70, to: 45, type: 'sawtooth', a: 0.05, d: 0.9, g: 0.18, lp: 600 });
  }

  stop() {
    const n = this.nodes;
    const gr = this.audio.graph();
    if (!n || !gr) return;
    const now = gr.ctx.currentTime;
    n.g.gain.setTargetAtTime(0, now, 0.1);
    for (const o of [n.saw, n.sub, n.lfo, n.src]) o.stop(now + 0.6);
    setTimeout(() => n.g.disconnect(), 800);
    this.nodes = null;
  }
}

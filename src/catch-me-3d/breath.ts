import { h, reducedMotion, Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import { vibrate } from '../shared/haptics';
import { T } from './story';

/**
 * The breath, inside the world (not a separate screen): time slows, colours
 * fade, and an orb sits at the bottom. Hold for four seconds to breathe in
 * (the ring fills), let go for four seconds to breathe out (it empties).
 * Letting go early while breathing in starts the cycle again.
 *
 * The calm tool always works and is never sabotaged — Pesky never touches it.
 */

export const IN_S = 4;
export const OUT_S = 4;

export interface BreathResult {
  /** Cycles finished without letting go early. */
  clean: number;
  early: number;
}

const RING = 2 * Math.PI * 92;

export class BreathOrb {
  readonly el: HTMLElement;
  private ring: SVGCircleElement;
  private orb: HTMLButtonElement;
  private label = h('span', {});
  private title = h('h2', { class: 'c3-breath-title' });
  private desc = h('p', { class: 'c3-breath-desc' });
  private msg = h('p', { class: 'c3-breath-msg', 'aria-live': 'polite' });
  private count = h('div', { class: 'c3-breath-count', 'aria-hidden': 'true' });

  constructor(
    parent: HTMLElement,
    private audio: AudioEngine,
  ) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('class', 'c3-ring');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<circle cx="100" cy="100" r="92" class="track"/><circle cx="100" cy="100" r="92" class="prog" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>`;
    this.ring = svg.querySelector('.prog') as SVGCircleElement;
    this.orb = h('button', { class: 'c3-orb', type: 'button' }, this.label);
    this.el = h(
      'div',
      { class: 'c3-breath', hidden: true },
      h('div', { class: 'c3-breath-text' }, this.title, this.desc),
      h('div', { class: 'c3-orb-wrap' }, h('div', { class: 'c3-orb-halo' }), svg, this.orb, this.count),
      this.msg,
    );
    parent.append(this.el);
  }

  /** Breathe `cycles` times. Resolves once the last breath out is done. */
  run(o: { cycles: number; title: string; desc: string; onProgress?: (inhale: number) => void; endless?: boolean }): Promise<BreathResult> {
    const scope = new Scope();
    this.el.hidden = false;
    this.el.classList.remove('holding', 'out');
    this.title.textContent = o.title;
    this.desc.textContent = o.desc;
    this.msg.textContent = '';
    this.label.textContent = T.holdToStart;
    this.orb.focus({ preventScroll: true });
    const res: BreathResult = { clean: 0, early: 0 };
    let cycle = 0;
    let phase: 'in' | 'out' = 'in';
    let k = 0; // 0..1 breath in, then 1..0 breath out
    let shown = 0;
    let holding = false;
    let hadEarly = false;
    let beat = 0;
    const paintCount = () => {
      this.count.textContent = o.cycles > 1 && !o.endless ? `${Math.min(cycle + 1, o.cycles)}/${o.cycles}` : '';
    };
    paintCount();

    return new Promise((resolve) => {
      const press = (e?: Event) => {
        e?.preventDefault();
        if (holding) return;
        holding = true;
        this.el.classList.add('holding');
        if (phase === 'in') {
          this.label.textContent = T.inhale;
          this.msg.textContent = '';
          this.audio.breath(true, IN_S * (1 - k));
          vibrate(10);
        }
      };
      const release = () => {
        if (!holding) return;
        holding = false;
        this.el.classList.remove('holding');
        if (phase === 'in' && k < 1) {
          if (k > 0.04) {
            this.msg.textContent = T.early;
            this.audio.miss();
            vibrate(40);
            res.early++;
            hadEarly = true;
          }
          k = 0;
          this.label.textContent = T.holdToStart;
        }
      };

      scope.on(this.orb, 'pointerdown', press);
      scope.on(window, 'pointerup', release);
      scope.on(window, 'pointercancel', release);
      scope.on(window, 'blur', release);
      scope.on(this.orb, 'contextmenu', (e) => e.preventDefault());
      scope.on<KeyboardEvent>(window, 'keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) press(e);
      });
      scope.on<KeyboardEvent>(window, 'keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') release();
      });

      // Wall-clock time (not the frame-capped dt): four seconds are four seconds, even on a slow phone.
      let last = performance.now();
      scope.loop(() => {
        const now = performance.now();
        const dt = Math.min(0.25, (now - last) / 1000);
        last = now;
        if (phase === 'in') {
          if (holding) {
            k = Math.min(1, k + dt / IN_S);
            beat += dt;
            if (beat > 0.62 + k * 0.5) {
              beat = 0;
              this.audio.heartbeat();
            }
            if (k >= 1) {
              phase = 'out';
              this.el.classList.add('out');
              this.label.textContent = T.exhale;
            }
          }
        } else if (!holding) {
          // Breathing out happens with the finger lifted.
          if (k === 1) this.audio.breath(false, OUT_S);
          k = Math.max(0, k - dt / OUT_S);
          if (k <= 0) {
            cycle++;
            if (!hadEarly) res.clean++;
            hadEarly = false;
            phase = 'in';
            this.el.classList.remove('out');
            this.audio.bell(cycle * 2, 0.5);
            if (cycle >= o.cycles) return finish();
            this.label.textContent = T.holdToStart;
            this.msg.textContent = T.again;
            paintCount();
          }
        }
        shown += (k - shown) * Math.min(1, dt * (reducedMotion() ? 30 : 12));
        this.ring.style.strokeDashoffset = String(RING * (1 - shown));
        this.orb.style.setProperty('--grow', shown.toFixed(3));
        o.onProgress?.(phase === 'in' ? k * 0.5 : 0.5 + (1 - k) * 0.5);
      });

      const finish = () => {
        scope.dispose();
        this.el.classList.remove('holding', 'out');
        this.el.hidden = true;
        resolve(res);
      };
    });
  }
}

import { h, clamp } from '../../shared/dom';
import { vibrate } from '../../shared/haptics';
import type { Calm, CalmCtx } from './types';
import { tr } from '../../shared/i18n';

const COLS = 56;
const PASS = 0.36; // how much one slow sweep rakes a column (≈3 sweeps to finish)

/** A tiny zen garden. Only slow strokes rake the sand; rushing makes the stone skid. */
export class SlideCalm implements Calm {
  title = tr({ en: 'Rake the sand', he: 'לגרוף את החול', ar: 'مشّطوا الرمل' });
  hint = tr({ en: 'Drag the stone from side to side, slowly. Too fast — and it slips', he: 'גררו את האבן מצד לצד, לאט. מהר מדי — והיא מחליקה', ar: 'اسحبوا الحجر من جانب إلى جانب، ببطء. بسرعة زائدة — وسينزلق' });

  constructor(private c: CalmCtx) {}

  mount() {
    const { board, scope, audio } = this.c;
    const canvas = h('canvas', { class: 'garden-canvas' });
    const stone = h('div', { class: 'garden-stone', role: 'slider', 'aria-label': tr({ en: 'Stone for raking the sand', he: 'אבן לגריפת החול', ar: 'حجر لتمشيط الرمل' }), tabindex: '0' });
    const speedo = h('div', { class: 'garden-speed' }, h('i'));
    const garden = h('div', { class: 'garden' }, canvas, stone);
    board.append(h('div', { class: 'garden-wrap' }, garden, speedo, h('p', { class: 'garden-legend' }, tr({ en: 'Speed', he: 'מהירות', ar: 'السرعة' }))));

    const W = garden.clientWidth;
    const H = garden.clientHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const raked = new Float32Array(COLS);
    const colW = W / COLS;
    const stoneR = Math.min(34, H * 0.2);
    const maxV = W / 2.1; // px per second: one sweep should take ≥ ~2s
    let x = W / 2;
    let v = 0;
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let lastSlip = 0;
    let finished = false;
    stone.style.width = stone.style.height = `${stoneR * 2}px`;

    // Deterministic speckle so the sand has grain.
    const grains = Array.from({ length: 260 }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 61 + 13) % 1000) / 1000,
      r: 0.6 + ((i * 7) % 5) / 5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#f1e3c8');
      g.addColorStop(1, '#e2cfaa');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(120, 90, 50, .18)';
      for (const p of grains) {
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      const lines = 7;
      for (let l = 0; l < lines; l++) {
        const gy = (H / (lines + 1)) * (l + 1);
        for (let i = 0; i < COLS; i++) {
          const r = raked[i];
          if (r <= 0.01) continue;
          const x0 = i * colW;
          const x1 = x0 + colW + 0.5;
          const y0 = gy + Math.sin(x0 / 38 + l) * 4;
          const y1 = gy + Math.sin(x1 / 38 + l) * 4;
          ctx.strokeStyle = `rgba(150, 110, 60, ${0.5 * r})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x0, y0 + 2);
          ctx.lineTo(x1, y1 + 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255, 250, 238, ${0.8 * r})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x0, y0 - 1);
          ctx.lineTo(x1, y1 - 1);
          ctx.stroke();
        }
      }
    };

    const setStone = () => {
      stone.style.transform = `translate(${x - stoneR}px, ${H / 2 - stoneR}px)`;
    };
    setStone();
    draw();

    const toLocal = (e: PointerEvent) => e.clientX - garden.getBoundingClientRect().left;

    stone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (finished) return;
      dragging = true;
      stone.setPointerCapture(e.pointerId);
      lastX = toLocal(e);
      lastT = performance.now();
      stone.classList.add('grab');
    });
    stone.addEventListener('pointermove', (e) => {
      if (!dragging || finished) return;
      const now = performance.now();
      const nx = clamp(toLocal(e), stoneR, W - stoneR);
      const dt = Math.max(8, now - lastT) / 1000;
      const dx = nx - x;
      v = v * 0.6 + (Math.abs(nx - lastX) / dt) * 0.4;
      lastX = nx;
      lastT = now;
      const a = Math.min(x, nx);
      const b = Math.max(x, nx);
      x = nx;
      setStone();
      if (!dx) return;
      // Every column under the stone's footprint gets raked.
      const c0 = clamp(Math.floor((a - stoneR) / colW), 0, COLS - 1);
      const c1 = clamp(Math.floor((b + stoneR) / colW), 0, COLS - 1);
      if (v > maxV) {
        // Rushing scuffs the raked lines and heats you up.
        for (let i = c0; i <= c1; i++) raked[i] = Math.max(0, raked[i] - 0.08);
        stone.classList.add('fast');
        if (now - lastSlip > 450) {
          lastSlip = now;
          audio.slip();
          vibrate(30);
          const r = stone.getBoundingClientRect();
          this.c.heat(4, r.left + r.width / 2, r.top, tr({ en: 'slower', he: 'לאט יותר', ar: 'أبطأ' }));
          this.c.say(tr({ en: 'Too fast. Try dragging as if you were moving through honey', he: 'מהר מדי. נסו לגרור כאילו אתם בתוך דבש', ar: 'بسرعة زائدة. جرّبوا السحب كأنكم تتحركون داخل العسل' }));
        }
      } else {
        stone.classList.remove('fast');
        let gained = 0;
        const step = (PASS * Math.abs(dx)) / (2 * stoneR);
        for (let i = c0; i <= c1; i++) {
          const before = raked[i];
          raked[i] = Math.min(1, raked[i] + step);
          gained += raked[i] - before;
        }
        this.c.heat(-gained * 1.6);
      }
      draw();
    });
    const end = () => {
      dragging = false;
      v = 0;
      stone.classList.remove('grab', 'fast');
    };
    stone.addEventListener('pointerup', end);
    stone.addEventListener('pointercancel', end);
    stone.addEventListener('contextmenu', (e) => e.preventDefault());

    scope.loop(() => {
      if (finished) return;
      if (!dragging) v *= 0.85;
      speedo.style.setProperty('--v', String(clamp(v / maxV, 0, 1.3)));
      speedo.classList.toggle('over', v > maxV);
      // Edge columns are only half-covered by the stone, so measure the reachable middle.
      const edge = Math.floor(stoneR / colW);
      let sum = 0;
      for (let i = edge; i < COLS - edge; i++) sum += raked[i];
      const p = sum / (COLS - 2 * edge);
      garden.style.setProperty('--p', String(p));
      if (p >= 0.95) {
        finished = true;
        raked.fill(1);
        draw();
        garden.classList.add('complete');
        vibrate([20, 60, 20]);
        this.c.done();
      }
    });
  }
}

import { h, rand, reducedMotion } from '../shared/dom';

type Kind = 'steam' | 'spark' | 'ring' | 'confetti' | 'pebble' | 'ember';

interface P {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  // pebble flight
  sx?: number;
  sy?: number;
  tx?: number;
  ty?: number;
  cx?: number;
  cy?: number;
  delay?: number;
  done?: () => void;
}

/** Full-screen particle overlay (never intercepts input). */
export class FX {
  private canvas = h('canvas', { class: 'fx-canvas', 'aria-hidden': 'true' });
  private ctx = this.canvas.getContext('2d')!;
  private ps: P[] = [];
  private dpr = 1;
  private w = 0;
  private h = 0;
  private running = false;
  private textLayer = h('div', { class: 'fx-text', 'aria-hidden': 'true' });

  constructor(parent: HTMLElement) {
    parent.append(this.canvas, this.textLayer);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  private resize() {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
  }

  private add(p: Partial<P> & { kind: Kind; x: number; y: number }) {
    if (this.ps.length > 500) return;
    this.ps.push({ vx: 0, vy: 0, life: 0, max: 1, size: 6, color: '#fff', rot: 0, vr: 0, ...p });
    this.start();
  }

  private start() {
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.step(dt);
      if (this.ps.length) requestAnimationFrame(frame);
      else {
        this.running = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };
    requestAnimationFrame(frame);
  }

  private step(dt: number) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    const keep: P[] = [];
    for (const p of this.ps) {
      if (p.delay && p.delay > 0) {
        p.delay -= dt;
        keep.push(p);
        continue;
      }
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1) {
        p.done?.();
        continue;
      }
      keep.push(p);
      switch (p.kind) {
        case 'steam': {
          p.x += p.vx * dt + Math.sin(p.life * 3 + p.rot) * 12 * dt;
          p.y += p.vy * dt;
          const r = p.size * (1 + t * 2.2);
          c.globalAlpha = (1 - t) * 0.55;
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(p.x, p.y, r, 0, Math.PI * 2);
          c.fill();
          break;
        }
        case 'ember':
        case 'spark': {
          p.vy += (p.kind === 'spark' ? 420 : -30) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          c.globalAlpha = 1 - t;
          c.strokeStyle = p.color;
          c.lineWidth = p.size;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
          c.stroke();
          break;
        }
        case 'ring': {
          c.globalAlpha = (1 - t) * 0.9;
          c.strokeStyle = p.color;
          c.lineWidth = 3 * (1 - t) + 1;
          c.beginPath();
          c.arc(p.x, p.y, p.size * (0.3 + t), 0, Math.PI * 2);
          c.stroke();
          break;
        }
        case 'confetti': {
          p.vy += 260 * dt;
          p.vx *= 0.99;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          c.globalAlpha = Math.min(1, (1 - t) * 3);
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot);
          c.fillStyle = p.color;
          c.beginPath();
          c.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
          break;
        }
        case 'pebble': {
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const u = 1 - e;
          p.x = u * u * p.sx! + 2 * u * e * p.cx! + e * e * p.tx!;
          p.y = u * u * p.sy! + 2 * u * e * p.cy! + e * e * p.ty!;
          c.globalAlpha = 1;
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.rot + t * 4);
          c.fillStyle = '#2ec4b6';
          c.strokeStyle = '#2a1838';
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(0, 0, p.size, p.size * 0.75, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.beginPath();
          c.ellipse(-p.size * 0.3, -p.size * 0.3, p.size * 0.35, p.size * 0.18, -0.5, 0, Math.PI * 2);
          c.fill();
          c.restore();
          break;
        }
      }
    }
    c.globalAlpha = 1;
    this.ps = keep;
  }

  steam(x: number, y: number, n = 1, strength = 1) {
    for (let i = 0; i < n; i++)
      this.add({
        kind: 'steam',
        x: x + rand(-4, 4),
        y,
        vx: rand(-10, 10) - 18 * strength,
        vy: rand(-60, -35) * strength,
        max: rand(0.9, 1.6),
        size: rand(3, 6) * (0.7 + strength * 0.5),
        color: '#ffffff',
        rot: rand(0, 6),
      });
  }

  sparks(x: number, y: number, color = '#ff9f1c', n = 10) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(120, 320);
      this.add({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, max: rand(0.35, 0.6), size: rand(2, 3.5), color });
    }
  }

  embers(n = 1) {
    for (let i = 0; i < n; i++)
      this.add({
        kind: 'ember',
        x: rand(0, this.w),
        y: this.h + 10,
        vx: rand(-20, 20),
        vy: rand(-160, -90),
        max: rand(1.8, 3),
        size: rand(1.5, 3),
        color: Math.random() < 0.5 ? '#ffb347' : '#ff6b4a',
      });
  }

  ring(x: number, y: number, color = '#2ec4b6', size = 50) {
    this.add({ kind: 'ring', x, y, max: 0.55, size, color });
  }

  confetti(x: number, y: number, n = 30, colors = ['#2ec4b6', '#ffd447', '#ff8fab', '#b983ff', '#8cc084']) {
    if (reducedMotion()) n = Math.min(n, 8);
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, 0);
      const s = rand(160, 420);
      this.add({
        kind: 'confetti',
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        max: rand(1.1, 1.8),
        size: rand(4, 7),
        color: colors[i % colors.length],
        rot: rand(0, 6),
        vr: rand(-10, 10),
      });
    }
  }

  /** Pebbles arc from a point into a target element; onEach fires per arrival. */
  pebbles(from: { x: number; y: number }, to: Element, n: number, onEach: (i: number) => void) {
    const r = to.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const sx = from.x + rand(-30, 30);
      const sy = from.y + rand(-20, 20);
      this.add({
        kind: 'pebble',
        x: sx,
        y: sy,
        sx,
        sy,
        tx,
        ty,
        cx: (sx + tx) / 2 + rand(-120, 120),
        cy: Math.min(sy, ty) - rand(40, 160),
        max: rand(0.7, 1),
        delay: i * 0.06,
        size: 8,
        rot: rand(0, 6),
        done: () => onEach(i),
      });
    }
  }

  floatText(x: number, y: number, text: string, cls = '') {
    const el = h('div', { class: `float-text ${cls}`, style: { left: `${x}px`, top: `${y}px` } }, text);
    this.textLayer.append(el);
    setTimeout(() => el.remove(), 1300);
  }

  shake(el: HTMLElement, mag = 8, ms = 350) {
    if (reducedMotion()) return;
    const frames: Keyframe[] = [];
    for (let i = 0; i < 6; i++) {
      const k = 1 - i / 6;
      frames.push({ transform: `translate(${rand(-mag, mag) * k}px, ${rand(-mag, mag) * k}px) rotate(${rand(-1, 1) * k}deg)` });
    }
    frames.push({ transform: 'none' });
    el.animate(frames, { duration: ms, easing: 'ease-out' });
  }
}

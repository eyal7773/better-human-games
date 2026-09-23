import { h, pick, rand, ease, type Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import { vibrate } from '../shared/haptics';
import type { FX } from '../shared/fx';
import type { Task } from './tasks/types';
import { gremlinSVG, flySVG } from './art';
import { SHOUTS, NOTIFS, LURES } from './content';
import { tr } from '../shared/i18n';

export interface GCtx {
  scope: Scope;
  board: HTMLElement; // board-local mischief (thieves, shufflers)
  layer: HTMLElement; // full-screen mischief (shouts, notifications, flies)
  audio: AudioEngine;
  fx: FX;
  task: Task | null;
  heat(delta: number, x?: number, y?: number, label?: string): void;
}

export type Mischief = 'thief' | 'shouter' | 'shuffler' | 'fly' | 'notif' | 'flicker' | 'lure';

/** Tapping at mischief is the bait: it never helps and always heats you up. */
function baited(c: GCtx, el: HTMLElement, amount: number, label: string, after?: () => void) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    c.heat(amount, e.clientX, e.clientY, label);
    c.audio.giggle();
    vibrate(40);
    after?.();
  });
}

class Gremlin {
  el: HTMLElement;
  x = 0;
  y = 0;
  constructor(
    parent: HTMLElement,
    readonly size: number,
  ) {
    this.el = h('div', { class: 'gremlin', html: gremlinSVG() });
    this.el.style.width = this.el.style.height = `${size}px`;
    parent.append(this.el);
  }
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.el.style.transform = `translate(${x - this.size / 2}px, ${y - this.size / 2}px)`;
  }
  async go(scope: Scope, x: number, y: number, ms: number, step?: (x: number, y: number) => void) {
    const sx = this.x;
    const sy = this.y;
    this.el.classList.toggle('face-left', x < sx);
    this.el.classList.add('walking');
    await scope.tween(
      ms,
      (k) => {
        this.set(sx + (x - sx) * k, sy + (y - sy) * k);
        step?.(this.x, this.y);
      },
      ease.inOut,
    );
    this.el.classList.remove('walking');
  }
}

async function thief(c: GCtx) {
  const task = c.task;
  const victim = task?.victim();
  if (!task || !victim) return shouter(c);
  const W = c.board.clientWidth;
  const H = c.board.clientHeight;
  const g = new Gremlin(c.board, Math.min(78, W / 4.6));
  baited(c, g.el, 5, tr({ en: 'don’t take them on', he: 'לא להתעמת איתם', ar: 'لا تواجهوهم' }));
  const fromLeft = Math.random() < 0.5;
  g.set(fromLeft ? -60 : W + 60, rand(H * 0.3, H * 0.8));
  const t = task.center(victim);
  await g.go(c.scope, t.x, t.y - 12, 700);
  if (!task.detach(victim)) {
    await g.go(c.scope, fromLeft ? -60 : W + 60, g.y, 500);
    g.el.remove();
    return;
  }
  c.audio.giggle();
  c.heat(3);
  const dx = rand(W * 0.15, W * 0.85);
  const dy = rand(H * 0.15, H * 0.7);
  g.el.classList.add('carrying');
  await g.go(c.scope, dx, dy, 900, (x, y) => task.carry(victim, x, y + 16));
  task.drop(victim, dx, dy + 16);
  g.el.classList.remove('carrying');
  await g.go(c.scope, fromLeft ? W + 60 : -60, dy - 20, 650);
  g.el.remove();
}

async function shouter(c: GCtx) {
  const bubble = h('div', { class: 'shout-bubble' }, pick(SHOUTS));
  const el = h('div', { class: 'shouter', html: gremlinSVG() }, bubble);
  const side = pick(['left', 'right'] as const);
  el.classList.add(side);
  el.style.bottom = `${rand(14, 46)}%`;
  c.layer.append(el);
  baited(c, el, 5, tr({ en: 'don’t shout back', he: 'לא עונים בצעקה', ar: 'لا تردّوا بالصراخ' }));
  c.audio.whine();
  vibrate([30, 40, 30]);
  c.heat(4);
  await c.scope.sleep(1700);
  el.classList.add('leaving');
  await c.scope.sleep(350);
  el.remove();
}

async function shuffler(c: GCtx) {
  const W = c.board.clientWidth;
  const H = c.board.clientHeight;
  const g = new Gremlin(c.board, Math.min(90, W / 4));
  g.el.classList.add('spinning');
  g.set(W / 2, H / 2);
  baited(c, g.el, 5, tr({ en: 'don’t take them on', he: 'לא להתעמת איתם', ar: 'لا تواجهوهم' }));
  c.audio.whoosh();
  c.task?.shuffle();
  c.heat(3);
  await c.scope.sleep(900);
  g.el.classList.add('leaving');
  await c.scope.sleep(300);
  g.el.remove();
}

async function fly(c: GCtx) {
  const W = c.layer.clientWidth;
  const H = c.layer.clientHeight;
  const el = h('div', { class: 'fly', html: flySVG() });
  c.layer.append(el);
  let x = Math.random() < 0.5 ? -40 : W + 40;
  let y = rand(H * 0.25, H * 0.75);
  let tx = rand(40, W - 40);
  let ty = rand(80, H - 80);
  const stop = c.audio.buzz();
  c.scope.add(stop);
  baited(c, el, 5, tr({ en: 'wasted energy', he: 'בזבוז אנרגיה', ar: 'طاقة مهدورة' }), () => {
    // it always dodges
    tx = rand(40, W - 40);
    ty = rand(80, H - 80);
  });
  c.heat(2);
  const end = performance.now() + rand(4500, 6500);
  await new Promise<void>((res) => {
    c.scope.loop((dt) => {
      if (!el.isConnected) return;
      const now = performance.now();
      if (now > end) {
        tx = -80;
        ty = y - 60;
      }
      if (Math.hypot(tx - x, ty - y) < 20 && now <= end) {
        tx = rand(40, W - 40);
        ty = rand(80, H - 80);
      }
      const k = Math.min(1, dt * 3.2);
      x += (tx - x) * k + rand(-3, 3);
      y += (ty - y) * k + rand(-3, 3);
      el.style.transform = `translate(${x - 22}px, ${y - 18}px) rotate(${(tx - x) * 0.2}deg)`;
      if (now > end && x < -60) {
        el.remove();
        res();
      }
    });
  });
  stop();
}

async function notif(c: GCtx) {
  const n = pick(NOTIFS);
  const el = h(
    'div',
    { class: 'notif', role: 'status' },
    h('span', { class: 'notif-app', style: { background: n.color } }, n.app),
    h('div', { class: 'notif-text' }, h('b', {}, n.title), h('span', {}, n.body)),
    h('small', {}, tr({ en: 'now', he: 'עכשיו', ar: 'الآن' })),
  );
  c.layer.append(el);
  if (Math.random() < 0.4) c.audio.ring();
  else c.audio.notif();
  vibrate([60, 80, 60]);
  c.heat(3);
  baited(c, el, 5, tr({ en: 'it can wait', he: 'אפשר לענות אחר כך', ar: 'يمكن الرد لاحقًا' }), () => el.classList.add('leaving'));
  await c.scope.sleep(2600);
  el.classList.add('leaving');
  await c.scope.sleep(400);
  el.remove();
}

async function flicker(c: GCtx) {
  const el = h('div', { class: 'flicker' });
  c.layer.append(el);
  c.audio.sizzle();
  c.heat(2);
  await c.scope.sleep(1100);
  el.remove();
}

async function lure(c: GCtx) {
  const W = c.layer.clientWidth;
  const H = c.layer.clientHeight;
  const el = h('button', { class: 'lure', type: 'button' }, pick(LURES));
  el.style.left = `${rand(8, Math.max(10, W - 190))}px`;
  el.style.top = `${rand(H * 0.18, H * 0.72)}px`;
  c.layer.append(el);
  c.audio.pop();
  baited(c, el, 8, tr({ en: 'exactly what they wanted', he: 'זה בדיוק מה שהם רצו', ar: 'هذا بالضبط ما أرادوه' }), () => el.remove());
  await c.scope.sleep(3200);
  el.classList.add('leaving');
  await c.scope.sleep(300);
  el.remove();
}

const RUN: Record<Mischief, (c: GCtx) => Promise<void>> = { thief, shouter, shuffler, fly, notif, flicker, lure };

export function unleash(kind: Mischief, c: GCtx) {
  void RUN[kind](c);
}

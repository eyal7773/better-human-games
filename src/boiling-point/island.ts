import { h, Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import { vibrate } from '../shared/haptics';
import type { FX } from './fx';
import { pebbleSVG } from './art';
import { save, persist, todayKey, type Placed } from './save';

type Draw = (c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, stage: number, seed: number) => void;

interface ItemDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  slots: number[]; // empty = ambient, no position
  draw: Draw;
}

// Island-top coordinates: u ∈ [-1,1] across, v ∈ [-1,1] back→front.
const SLOTS: [number, number][] = [
  [-0.55, -0.3], // 0 tree
  [0.48, -0.42], // 1 tree
  [0.02, -0.62], // 2 tree
  [-0.12, 0.12], // 3 pond
  [0.56, 0.22], // 4 lantern
  [-0.72, 0.3], // 5 lantern
  [0.28, 0.52], // 6 stones
  [-0.4, 0.6], // 7 stones
  [0.8, -0.08], // 8 sakura
  [-0.86, -0.02], // 9 bench
  [0.3, -0.08], // 10 chimes
  [0.02, 0.74], // 11 flowers
  [-0.6, 0.1], // 12 flowers
  [0.78, 0.46], // 13 flowers
  [0.62, 0.9], // 14 waterfall (front edge)
];

const shadow = (c: CanvasRenderingContext2D, x: number, y: number, w: number) => {
  c.fillStyle = 'rgba(40, 60, 40, .22)';
  c.beginPath();
  c.ellipse(x, y, w, w * 0.32, 0, 0, Math.PI * 2);
  c.fill();
};

const blob = (c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
};

const drawTree: Draw = (c, x, y, s, t, stage, seed) => {
  const k = s * (0.45 + stage * 0.17);
  const sway = Math.sin(t * 1.3 + seed) * 2 * k;
  shadow(c, x, y, 26 * k);
  c.fillStyle = '#8a5a3c';
  c.beginPath();
  c.moveTo(x - 4 * k, y);
  c.lineTo(x - 2 * k + sway * 0.3, y - 34 * k);
  c.lineTo(x + 2 * k + sway * 0.3, y - 34 * k);
  c.lineTo(x + 4 * k, y);
  c.fill();
  const top = y - 40 * k;
  blob(c, x - 13 * k + sway, top + 6 * k, 15 * k, '#4f8f4c');
  blob(c, x + 13 * k + sway, top + 6 * k, 15 * k, '#4f8f4c');
  blob(c, x + sway, top - 8 * k, 18 * k, '#6aab5e');
  blob(c, x - 7 * k + sway, top - 2 * k, 12 * k, '#86c270');
  blob(c, x + 6 * k + sway, top - 14 * k, 8 * k, '#a5d98a');
};

const drawSakura: Draw = (c, x, y, s, t, _stage, seed) => {
  const k = s * 1.05;
  const sway = Math.sin(t * 1.1 + seed) * 2 * k;
  shadow(c, x, y, 30 * k);
  c.strokeStyle = '#6d4636';
  c.lineWidth = 5 * k;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x - 4 * k, y - 22 * k, x + sway, y - 38 * k);
  c.moveTo(x - 2 * k, y - 24 * k);
  c.lineTo(x - 16 * k + sway, y - 36 * k);
  c.stroke();
  const top = y - 44 * k;
  for (const [dx, dy, r, col] of [
    [-18, 8, 14, '#f29bbd'],
    [16, 6, 15, '#f29bbd'],
    [0, -6, 19, '#f7b6cf'],
    [-10, -12, 11, '#fcd3e2'],
    [12, -14, 10, '#fcd3e2'],
  ] as const)
    blob(c, x + dx * k + sway, top + dy * k, r * k, col);
};

const drawLantern: Draw = (c, x, y, s, t, _stage, seed) => {
  const k = s * 0.9;
  shadow(c, x, y, 14 * k);
  const glow = 0.55 + Math.sin(t * 2.2 + seed) * 0.15;
  const g = c.createRadialGradient(x, y - 26 * k, 1, x, y - 26 * k, 34 * k);
  g.addColorStop(0, `rgba(255, 214, 120, ${glow})`);
  g.addColorStop(1, 'rgba(255, 214, 120, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y - 26 * k, 34 * k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#a9a4b8';
  c.fillRect(x - 9 * k, y - 5 * k, 18 * k, 5 * k);
  c.fillRect(x - 3.5 * k, y - 18 * k, 7 * k, 14 * k);
  c.fillStyle = '#8f8aa0';
  c.fillRect(x - 8 * k, y - 32 * k, 16 * k, 14 * k);
  c.fillStyle = `rgba(255, 220, 130, ${0.7 + glow * 0.3})`;
  c.fillRect(x - 4.5 * k, y - 29 * k, 9 * k, 8 * k);
  c.fillStyle = '#76718a';
  c.beginPath();
  c.moveTo(x - 14 * k, y - 32 * k);
  c.quadraticCurveTo(x, y - 44 * k, x + 14 * k, y - 32 * k);
  c.fill();
  blob(c, x, y - 42 * k, 2.5 * k, '#76718a');
};

const drawStones: Draw = (c, x, y, s) => {
  const k = s * 0.9;
  shadow(c, x, y, 16 * k);
  const st: [number, number, number, string][] = [
    [0, -5, 13, '#8e8aa0'],
    [1, -14, 10, '#a39fb4'],
    [-1, -21, 7.5, '#b8b4c8'],
    [0, -27, 5, '#cfcbdd'],
  ];
  for (const [dx, dy, r, col] of st) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x + dx * k, y + dy * k, r * k, r * 0.55 * k, 0, 0, Math.PI * 2);
    c.fill();
  }
};

const drawPond: Draw = (c, x, y, s, t) => {
  const k = s;
  const rx = 38 * k;
  const ry = 15 * k;
  c.fillStyle = '#6f9e63';
  c.beginPath();
  c.ellipse(x, y + 2 * k, rx + 5 * k, ry + 4 * k, 0, 0, Math.PI * 2);
  c.fill();
  const g = c.createLinearGradient(0, y - ry, 0, y + ry);
  g.addColorStop(0, '#3e9fb0');
  g.addColorStop(1, '#6fd0d6');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.clip();
  for (let i = 0; i < 2; i++) {
    const a = t * 0.7 + i * Math.PI;
    const fx = x + Math.cos(a) * rx * 0.55;
    const fy = y + Math.sin(a) * ry * 0.5;
    c.save();
    c.translate(fx, fy);
    c.rotate(a + Math.PI / 2);
    c.fillStyle = i ? '#ff8a3d' : '#fff3e6';
    c.beginPath();
    c.ellipse(0, 0, 7 * k, 3 * k, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(-6 * k, 0);
    c.lineTo(-11 * k, -3 * k);
    c.lineTo(-11 * k, 3 * k);
    c.fill();
    c.restore();
  }
  c.strokeStyle = 'rgba(255,255,255,.55)';
  c.lineWidth = 1.5;
  const rr = ((t * 12) % 24) * k;
  c.beginPath();
  c.ellipse(x + 10 * k, y - 2 * k, rr, rr * 0.4, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  blob(c, x - 22 * k, y - 4 * k, 5 * k, '#5aa15a');
  blob(c, x - 18 * k, y + 5 * k, 4 * k, '#77bb6a');
};

const drawBench: Draw = (c, x, y, s) => {
  const k = s * 0.95;
  shadow(c, x, y, 22 * k);
  c.fillStyle = '#6d4636';
  c.fillRect(x - 17 * k, y - 10 * k, 3.5 * k, 10 * k);
  c.fillRect(x + 13.5 * k, y - 10 * k, 3.5 * k, 10 * k);
  c.fillStyle = '#b67a52';
  c.fillRect(x - 22 * k, y - 13 * k, 44 * k, 5 * k);
  c.fillRect(x - 22 * k, y - 24 * k, 44 * k, 4 * k);
  c.fillStyle = '#8a5a3c';
  c.fillRect(x - 20 * k, y - 22 * k, 3 * k, 10 * k);
  c.fillRect(x + 17 * k, y - 22 * k, 3 * k, 10 * k);
};

const drawChimes: Draw = (c, x, y, s, t) => {
  const k = s * 0.9;
  shadow(c, x, y, 8 * k);
  c.strokeStyle = '#6d4636';
  c.lineWidth = 3 * k;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - 52 * k);
  c.lineTo(x + 18 * k, y - 52 * k);
  c.stroke();
  const hx = x + 14 * k;
  c.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const sw = Math.sin(t * 2 + i * 1.3) * 3 * k;
    const px = hx - 6 * k + i * 4 * k;
    const len = (12 + i * 3) * k;
    c.strokeStyle = 'rgba(42,24,56,.6)';
    c.beginPath();
    c.moveTo(px, y - 52 * k);
    c.lineTo(px + sw, y - 52 * k + len);
    c.stroke();
    c.fillStyle = i % 2 ? '#e0c46c' : '#c9d6df';
    c.fillRect(px + sw - 1.5 * k, y - 52 * k + len, 3 * k, 9 * k);
  }
};

const drawFlowers: Draw = (c, x, y, s, t, _stage, seed) => {
  const k = s * 0.9;
  const cols = ['#ff8fab', '#ffd447', '#b983ff', '#ffffff'];
  for (let i = 0; i < 7; i++) {
    const a = seed * 3 + i * 2.1;
    const fx = x + Math.cos(a) * (6 + (i % 3) * 5) * k;
    const fy = y + Math.sin(a) * 4 * k;
    const sw = Math.sin(t * 1.8 + i) * 1.2 * k;
    c.strokeStyle = '#4f8f4c';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(fx + sw, fy - 9 * k);
    c.stroke();
    blob(c, fx + sw, fy - 10 * k, 3.4 * k, cols[(i + seed) % cols.length]);
    blob(c, fx + sw, fy - 10 * k, 1.3 * k, '#ffb347');
  }
};

const drawWaterfall: Draw = (c, x, y, s, t) => {
  const k = s;
  const w = 16 * k;
  const len = 120 * k;
  const g = c.createLinearGradient(0, y, 0, y + len);
  g.addColorStop(0, 'rgba(140, 220, 230, .95)');
  g.addColorStop(1, 'rgba(200, 245, 250, .35)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x + w / 2, y);
  c.lineTo(x + w * 0.8, y + len);
  c.lineTo(x - w * 0.8, y + len);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,.7)';
  c.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const off = ((t * 90 + i * 30) % len) + y;
    c.beginPath();
    c.moveTo(x - w * 0.3 + i * 3 * k, off);
    c.lineTo(x - w * 0.3 + i * 3 * k, off + 14 * k);
    c.stroke();
  }
  for (let i = 0; i < 5; i++) blob(c, x + (i - 2) * 7 * k, y + len + Math.sin(t * 4 + i) * 2, (5 + (i % 2) * 3) * k, 'rgba(255,255,255,.55)');
};

export const ITEMS: ItemDef[] = [
  { id: 'flowers', name: 'ערוגת פרחים', desc: 'קצת צבע', cost: 20, slots: [11, 12, 13], draw: drawFlowers },
  { id: 'stones', name: 'מגדל אבנים', desc: 'איזון, אבן על אבן', cost: 25, slots: [6, 7], draw: drawStones },
  { id: 'tree', name: 'עץ', desc: 'גדל עם כל סיבוב רגוע', cost: 30, slots: [0, 1, 2], draw: drawTree },
  { id: 'lantern', name: 'פנס אבן', desc: 'אור חמים לערב', cost: 45, slots: [4, 5], draw: drawLantern },
  { id: 'bench', name: 'ספסל', desc: 'מקום לשבת רגע', cost: 50, slots: [9], draw: drawBench },
  { id: 'fireflies', name: 'גחליליות', desc: 'נקודות אור מרחפות', cost: 60, slots: [], draw: () => {} },
  { id: 'chimes', name: 'פעמוני רוח', desc: 'מוסיף צלצולים לאי', cost: 70, slots: [10], draw: drawChimes },
  { id: 'pond', name: 'בריכת דגים', desc: 'שני דגי קוי', cost: 90, slots: [3], draw: drawPond },
  { id: 'sakura', name: 'עץ דובדבן', desc: 'עלי כותרת נושרים', cost: 110, slots: [8], draw: drawSakura },
  { id: 'waterfall', name: 'מפל', desc: 'מים שזורמים לים', cost: 140, slots: [14], draw: drawWaterfall },
];

const byId = (id: string) => ITEMS.find((i) => i.id === id)!;

function freeSlot(def: ItemDef): number | null {
  if (!def.slots.length) return save.placed.some((p) => p.id === def.id) ? null : -1;
  const used = new Set(save.placed.map((p) => p.slot));
  return def.slots.find((s) => !used.has(s)) ?? null;
}

const owned = (def: ItemDef) => save.placed.filter((p) => p.id === def.id).length;
const capacity = (def: ItemDef) => Math.max(1, def.slots.length);
const stageOf = (p: Placed) => Math.min(4, 1 + Math.floor((save.growth - p.plantedAt) / 2));

interface Layout {
  w: number;
  h: number;
  horizon: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  s: number;
}

function paintScene(c: CanvasRenderingContext2D, L: Layout, t: number, born: Map<Placed, number>, fireflies: boolean) {
  const { w, h: H, cx, rx, ry, horizon } = L;
  const bob = Math.sin(t * 0.8) * 4;
  const cy = L.cy + bob;

  // sky
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#8ecfd0');
  sky.addColorStop(0.55, '#f6e3c7');
  sky.addColorStop(1, '#ffcfa6');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizon);
  // sun
  const sg = c.createRadialGradient(w * 0.28, horizon - 30, 4, w * 0.28, horizon - 30, 90);
  sg.addColorStop(0, 'rgba(255, 244, 214, 1)');
  sg.addColorStop(0.35, 'rgba(255, 226, 170, .8)');
  sg.addColorStop(1, 'rgba(255, 226, 170, 0)');
  c.fillStyle = sg;
  c.fillRect(0, 0, w, horizon);
  // clouds
  c.fillStyle = 'rgba(255,255,255,.6)';
  for (let i = 0; i < 3; i++) {
    const x = ((t * (6 + i * 3) + i * 180) % (w + 200)) - 100;
    const y = horizon * (0.18 + i * 0.14);
    for (const [dx, dy, r] of [
      [0, 0, 18],
      [20, -8, 22],
      [44, 0, 16],
    ])
      blob(c, x + dx, y + dy, r, 'rgba(255,255,255,.55)');
  }
  // distant hills
  c.fillStyle = 'rgba(120, 170, 170, .55)';
  c.beginPath();
  c.moveTo(0, horizon);
  for (let x = 0; x <= w; x += 20) c.lineTo(x, horizon - 18 - Math.sin(x / 70) * 12 - Math.sin(x / 23) * 4);
  c.lineTo(w, horizon);
  c.fill();
  // sea
  const sea = c.createLinearGradient(0, horizon, 0, H);
  sea.addColorStop(0, '#7cc9c0');
  sea.addColorStop(1, '#357f86');
  c.fillStyle = sea;
  c.fillRect(0, horizon, w, H - horizon);
  c.strokeStyle = 'rgba(255,255,255,.35)';
  c.lineWidth = 1.5;
  for (let i = 0; i < 16; i++) {
    const y = horizon + 8 + i * i * 2.2;
    if (y > H) break;
    const off = (t * (8 + i) + i * 57) % 120;
    c.beginPath();
    for (let x = -off; x < w; x += 120) {
      c.moveTo(x, y);
      c.lineTo(x + 26 + i * 2, y);
    }
    c.stroke();
  }

  // island reflection
  c.save();
  c.globalAlpha = 0.18;
  c.fillStyle = '#2d5d4e';
  c.beginPath();
  c.ellipse(cx, cy + ry + rx * 0.62, rx * 0.9, rx * 0.22, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // island underside (cliff)
  const cliff = c.createLinearGradient(0, cy, 0, cy + rx * 0.7);
  cliff.addColorStop(0, '#b07b5b');
  cliff.addColorStop(1, '#6b4232');
  c.fillStyle = cliff;
  c.beginPath();
  c.moveTo(cx - rx, cy);
  c.bezierCurveTo(cx - rx * 0.9, cy + rx * 0.4, cx - rx * 0.3, cy + rx * 0.72, cx + rx * 0.05, cy + rx * 0.66);
  c.bezierCurveTo(cx + rx * 0.4, cy + rx * 0.6, cx + rx * 0.95, cy + rx * 0.35, cx + rx, cy);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(60, 35, 25, .25)';
  c.lineWidth = 2;
  for (let i = 1; i <= 3; i++) {
    c.beginPath();
    c.ellipse(cx, cy + i * rx * 0.1, rx * (1 - i * 0.12), ry * 0.9, 0, 0.15, Math.PI - 0.15);
    c.stroke();
  }
  // grass top
  c.fillStyle = '#6aa362';
  c.beginPath();
  c.ellipse(cx, cy + 5, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  const grass = c.createRadialGradient(cx - rx * 0.2, cy - ry * 0.4, 5, cx, cy, rx);
  grass.addColorStop(0, '#b3dc9b');
  grass.addColorStop(1, '#86c173');
  c.fillStyle = grass;
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.fill();

  // items, back to front
  const now = performance.now();
  const drawn = save.placed
    .filter((p) => p.slot >= 0)
    .map((p) => ({ p, pos: SLOTS[p.slot] }))
    .sort((a, b) => a.pos[1] - b.pos[1]);
  for (const { p, pos } of drawn) {
    const def = byId(p.id);
    const x = cx + pos[0] * rx * 0.86;
    const y = cy + pos[1] * ry * 0.8;
    const b = born.get(p);
    let pop = 1;
    if (b != null) {
      const k = Math.min(1, (now - b) / 600);
      pop = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.35 - (1 - k) * 0.8 : 1;
      if (k >= 1) born.delete(p);
    }
    c.save();
    c.translate(x, y);
    c.scale(pop, pop);
    def.draw(c, 0, 0, L.s, t, stageOf(p), p.slot);
    c.restore();
  }

  if (fireflies) {
    for (let i = 0; i < 16; i++) {
      const fx = cx + Math.sin(t * 0.5 + i * 1.7) * rx * 0.9;
      const fy = cy - 30 - Math.abs(Math.cos(t * 0.37 + i * 2.3)) * rx * 0.5;
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + i));
      const g = c.createRadialGradient(fx, fy, 0, fx, fy, 9);
      g.addColorStop(0, `rgba(255, 245, 160, ${a})`);
      g.addColorStop(1, 'rgba(255, 245, 160, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(fx, fy, 9, 0, Math.PI * 2);
      c.fill();
    }
  }
}

function thumb(def: ItemDef) {
  const cv = h('canvas', { class: 'shop-thumb', width: '128', height: '128', 'aria-hidden': 'true' });
  const c = cv.getContext('2d')!;
  c.scale(2, 2);
  const g = c.createRadialGradient(32, 40, 4, 32, 40, 40);
  g.addColorStop(0, '#d7f0cf');
  g.addColorStop(1, '#a9d69a');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(32, 46, 28, 11, 0, 0, Math.PI * 2);
  c.fill();
  if (def.id === 'fireflies') {
    for (const [x, y] of [
      [20, 20],
      [38, 14],
      [46, 30],
      [28, 34],
    ]) {
      const gg = c.createRadialGradient(x, y, 0, x, y, 8);
      gg.addColorStop(0, 'rgba(255,230,90,1)');
      gg.addColorStop(1, 'rgba(255,230,90,0)');
      c.fillStyle = gg;
      c.beginPath();
      c.arc(x, y, 8, 0, Math.PI * 2);
      c.fill();
    }
  } else if (def.id === 'waterfall') {
    def.draw(c, 32, 4, 0.36, 0, 1, 1);
  } else {
    const s = def.id === 'pond' ? 0.7 : def.id === 'sakura' || def.id === 'tree' ? 0.62 : 0.9;
    def.draw(c, 32, 50, s, 0, 3, 1);
  }
  return cv;
}

/** Mounts the island screen; returns a cleanup function. */
export function mountIsland(root: HTMLElement, audio: AudioEngine, fx: FX, onBack: () => void): () => void {
  const scope = new Scope();
  const canvas = h('canvas', { class: 'island-canvas', 'aria-hidden': 'true' });
  const zenNum = h('span', {}, String(save.zen));
  const zen = h('div', { class: 'hud-zen island-zen', html: pebbleSVG('pebble hud-pebble') }, zenNum);
  const note = h('p', { class: 'island-note', 'aria-live': 'polite' });
  const shop = h('div', { class: 'shop', role: 'list' });
  const realBtn = h('button', { class: 'real-pause', type: 'button' });
  const sheet = h(
    'section',
    { class: 'island-sheet', 'aria-label': 'חנות האי' },
    h('div', { class: 'sheet-head' }, h('h2', {}, 'אי השקט'), realBtn),
    note,
    shop,
  );
  const top = h(
    'header',
    { class: 'island-top' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'חזרה', onclick: onBack, html: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
    zen,
  );
  const screen = h('section', { class: 'screen island' }, canvas, top, sheet);
  root.append(screen);

  const born = new Map<Placed, number>();
  const ctx = canvas.getContext('2d')!;
  let L: Layout;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sheetH = sheet.getBoundingClientRect().height;
    const top = 60; // clear of the top bar
    const avail = H - sheetH - top;
    const rx = Math.min(w * 0.47, avail * 0.62, 280);
    const cy = top + avail * 0.52;
    L = { w, h: H, horizon: cy - rx * 0.12, cx: w / 2, cy, rx, ry: rx * 0.36, s: rx / 112 };
  };

  const setNote = () => {
    if (!save.placed.length) note.textContent = 'האי עוד ריק. כל רגע של שקט במשחק שווה נקודות זן — ובהן בונים כאן.';
    else if (save.placed.some((p) => p.id === 'tree')) note.textContent = 'העצים גדלים עם כל סיבוב שבו לא רתחתם.';
    else note.textContent = 'בחרו מה להוסיף לאי.';
  };

  const refreshReal = () => {
    const done = save.realPauseDay === todayKey();
    realBtn.disabled = done;
    realBtn.textContent = done ? 'נרשם להיום ✓' : 'עצרתי גם בבית היום (+25)';
  };
  realBtn.addEventListener('click', () => {
    if (save.realPauseDay === todayKey()) return;
    save.realPauseDay = todayKey();
    save.realPauses++;
    save.zen += 25;
    save.earned += 25;
    persist();
    audio.success();
    const r = realBtn.getBoundingClientRect();
    fx.confetti(r.left + r.width / 2, r.top, 30);
    note.textContent = 'זה האימון האמיתי. כל הכבוד.';
    refreshReal();
    render();
  });

  const cards = new Map<string, HTMLButtonElement>();
  const render = () => {
    zenNum.textContent = String(save.zen);
    for (const def of ITEMS) {
      const b = cards.get(def.id)!;
      const full = freeSlot(def) === null;
      const afford = save.zen >= def.cost;
      b.classList.toggle('full', full);
      b.classList.toggle('poor', !full && !afford);
      const cnt = b.querySelector('.shop-count')!;
      cnt.textContent = def.slots.length > 1 ? `${owned(def)}/${capacity(def)}` : full ? 'יש' : '';
      b.setAttribute('aria-label', `${def.name}, ${def.cost} נקודות${full ? ', כבר באי' : ''}`);
    }
  };

  for (const def of ITEMS) {
    const b = h(
      'button',
      { class: 'shop-item', type: 'button', role: 'listitem' },
      thumb(def),
      h('span', { class: 'shop-name' }, def.name),
      h('span', { class: 'shop-desc' }, def.desc),
      h('span', { class: 'shop-cost', html: pebbleSVG('pebble') }, String(def.cost)),
      h('span', { class: 'shop-count' }),
    );
    b.addEventListener('click', () => {
      const slot = freeSlot(def);
      if (slot === null) {
        note.textContent = `${def.name} כבר באי.`;
        return;
      }
      if (save.zen < def.cost) {
        audio.miss();
        b.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 });
        note.textContent = `חסרות ${def.cost - save.zen} נקודות זן. עוד ערב רגוע אחד וזה שלכם.`;
        return;
      }
      save.zen -= def.cost;
      const p: Placed = { id: def.id, slot, plantedAt: save.growth };
      save.placed.push(p);
      persist();
      born.set(p, performance.now());
      audio.bell(Math.floor(Math.random() * 5) * 2, 1);
      vibrate(20);
      if (def.id === 'chimes') audio.startChimes();
      if (slot >= 0) {
        const pos = SLOTS[slot];
        const r = canvas.getBoundingClientRect();
        fx.confetti(r.left + L.cx + pos[0] * L.rx * 0.86, r.top + L.cy + pos[1] * L.ry * 0.8 - 20, 22);
      }
      note.textContent = `${def.name} נוסף לאי.`;
      render();
    });
    cards.set(def.id, b);
    shop.append(b);
  }
  setNote();
  refreshReal();
  render();
  resize(); // after the shop is built, so the sheet height is real
  scope.on(window, 'resize', resize);

  audio.startPad('island');
  audio.startWaves();
  if (save.placed.some((p) => p.id === 'chimes')) audio.startChimes();

  let t = 0;
  const hasFireflies = () => save.placed.some((p) => p.id === 'fireflies');
  scope.loop((dt) => {
    t += dt;
    paintScene(ctx, L, t, born, hasFireflies());
  });

  return () => {
    scope.dispose();
    audio.stopPad();
    audio.stopExtras();
    screen.remove();
  };
}

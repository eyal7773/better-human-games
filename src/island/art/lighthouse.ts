import { along, blob, box, corners, roof, shade, shadow, type Ctx } from './kit';

/** Lighthouse Isle: old stone walls gone green, boats and nets, and the light. */

export function ivy(c: Ctx, t: number, _s: number, seed: number) {
  for (let i = 0; i < 9; i++) {
    const x = -16 + ((i * 13 + seed * 7) % 32);
    const y = -6 + ((i * 7 + seed * 5) % 12);
    const sw = Math.sin(t + i) * 0.5;
    c.fillStyle = i % 3 ? '#3f7d42' : '#5d9e55';
    c.beginPath();
    c.moveTo(x + sw, y - 9);
    c.quadraticCurveTo(x + 6, y - 4, x, y);
    c.quadraticCurveTo(x - 6, y - 4, x + sw, y - 9);
    c.fill();
  }
}

/** An old stone wall, mossy on top, linking with its neighbours (bit 1: +x, 2: +y, 4: −x, 8: −y). */
export function wall(c: Ctx, _t: number, _s: number, seed: number, links = 0) {
  const seg = (u: number, v: number) => {
    const [x, y] = along(0, 0, u / 2, v / 2);
    box(c, x, y, u ? 0.5 : 0.36, v ? 0.5 : 0.36, 16, '#9a96a8');
  };
  if (links & 4) seg(-1, 0);
  if (links & 8) seg(0, -1);
  box(c, 0, 0, 0.42, 0.42, 18, '#a7a3b4');
  if (links & 1) seg(1, 0);
  if (links & 2) seg(0, 1);
  // moss and a stone line on top
  c.fillStyle = 'rgba(90, 150, 80, .75)';
  for (let i = 0; i < 4; i++) blob(c, -6 + i * 4, -18 - (i % 2), 2.6, c.fillStyle as string);
  c.strokeStyle = 'rgba(60,55,75,.35)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-10, -9 + (seed % 3));
  c.lineTo(10, -7 + (seed % 3));
  c.stroke();
}

export function crate(c: Ctx) {
  shadow(c, 0, 0, 14, 6);
  box(c, 0, 0, 0.45, 0.4, 13, '#b88a5a');
  c.fillStyle = '#c9d6df';
  for (const [x, y] of [
    [-4, -15],
    [2, -16],
    [6, -14],
  ]) {
    c.beginPath();
    c.ellipse(x, y, 4, 1.6, 0.3, 0, Math.PI * 2);
    c.fill();
  }
}

export function net(c: Ctx, t: number) {
  shadow(c, 0, 0, 22, 8);
  for (const u of [-0.5, 0.5]) {
    const [x, y] = along(0, 0, u, 0);
    box(c, x, y, 0.08, 0.08, 34, '#8a5a3c');
  }
  const [ax, ay] = along(0, 0, -0.5, 0);
  const [bx, by] = along(0, 0, 0.5, 0);
  const sag = 10 + Math.sin(t) * 1.5;
  c.strokeStyle = 'rgba(80, 70, 60, .7)';
  c.lineWidth = 0.8;
  for (let k = 0; k <= 4; k++) {
    c.beginPath();
    c.moveTo(ax, ay - 32 + k * 5);
    c.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 - 32 + k * 5 + sag, bx, by - 32 + k * 5);
    c.stroke();
  }
  for (let k = 0; k <= 6; k++) {
    const x = ax + ((bx - ax) * k) / 6;
    const y = ay + ((by - ay) * k) / 6;
    const dip = Math.sin((k / 6) * Math.PI) * sag;
    c.beginPath();
    c.moveTo(x, y - 32 + dip * 0.9);
    c.lineTo(x, y - 12 + dip * 0.9);
    c.stroke();
  }
  blob(c, ax + 6, ay - 26, 3, '#ff8a3d');
}

export function buoyBell(c: Ctx, t: number) {
  shadow(c, 0, 0, 10, 4);
  const sw = Math.sin(t * 1.4) * 0.12;
  c.save();
  c.rotate(sw);
  c.fillStyle = '#e5443a';
  c.beginPath();
  c.moveTo(-9, 0);
  c.lineTo(-6, -18);
  c.lineTo(6, -18);
  c.lineTo(9, 0);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(-7.5, -10, 15, 4);
  c.strokeStyle = '#4a4a5a';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-5, -18);
  c.lineTo(0, -30);
  c.lineTo(5, -18);
  c.stroke();
  c.fillStyle = '#e0b43c';
  c.beginPath();
  c.moveTo(-4, -20);
  c.quadraticCurveTo(0, -28, 4, -20);
  c.fill();
  c.restore();
}

/** The Fortress's anger cannon, retired: flowers grow out of it. */
export function cannonPlanter(c: Ctx, t: number) {
  shadow(c, 0, 0, 22, 9);
  for (const s of [-1, 1]) blob(c, s * 9, -5, 6, '#6d4636');
  c.save();
  c.translate(0, -12);
  c.rotate(-0.45);
  c.fillStyle = '#4a4e5e';
  c.fillRect(-16, -6, 30, 12);
  c.fillStyle = '#3a3e4e';
  c.fillRect(12, -7.5, 5, 15);
  c.restore();
  // flowers spilling from the barrel
  const mx = 13;
  const my = -26;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.35;
    const sw = Math.sin(t * 1.6 + i) * 1;
    const x = mx + Math.cos(a) * 9 + sw;
    const y = my + Math.sin(a) * 9;
    c.strokeStyle = '#4f8f4c';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(mx, my + 2);
    c.lineTo(x, y);
    c.stroke();
    blob(c, x, y, 3, ['#ff8fab', '#ffd447', '#fff', '#b983ff'][i % 4]);
  }
}

export function rowboat(c: Ctx, t: number) {
  shadow(c, 0, 2, 34, 12);
  const [A, B, C, D] = corners(0, 0, 1.6, 0.55);
  const rock = Math.sin(t) * 1;
  c.fillStyle = '#e8e1d0';
  c.beginPath();
  c.moveTo(D[0], D[1] - 10 + rock);
  c.lineTo(C[0], C[1] - 10 + rock);
  c.quadraticCurveTo((B[0] + C[0]) / 2 + 10, (B[1] + C[1]) / 2 - 12, B[0], B[1] - 10 - rock);
  c.lineTo(C[0], C[1]);
  c.lineTo(D[0], D[1]);
  c.closePath();
  c.fill();
  c.fillStyle = '#3a9fd8';
  c.fillRect(D[0], D[1] - 4, C[0] - D[0], 3);
  c.fillStyle = '#8a5a3c';
  c.beginPath();
  c.moveTo(A[0], A[1] - 10);
  c.lineTo(B[0], B[1] - 10);
  c.lineTo(C[0], C[1] - 10);
  c.lineTo(D[0], D[1] - 10);
  c.fill();
  // oars
  c.strokeStyle = '#c08657';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-10, -12);
  c.lineTo(-22, 2);
  c.moveTo(10, -14);
  c.lineTo(24, -4);
  c.stroke();
}

export function keeperHouse(c: Ctx) {
  shadow(c, 0, 2, 56, 26);
  box(c, 0, 0, 1.6, 1.3, 32, '#f2ead8');
  const [, B, C, D] = corners(0, 0, 1.6, 1.3);
  c.fillStyle = '#3a6a9a';
  const mid = (p: number[], q: number[], k: number) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  for (const k of [0.3, 0.7]) {
    const [x, y] = mid(D, C, k);
    c.fillStyle = '#ffd98a';
    c.fillRect(x - 5, y - 24, 9, 9);
  }
  const [x, y] = mid(C, B, 0.5);
  c.fillStyle = '#3a6a9a';
  c.beginPath();
  c.moveTo(x - 5, y + 2);
  c.lineTo(x + 5, y - 2);
  c.lineTo(x + 5, y - 22);
  c.lineTo(x - 5, y - 18);
  c.fill();
  roof(c, 0, 0, 1.6, 1.3, 32, 26, '#b0413e', 0.25);
  box(c, ...along(0, 0, -0.3, -0.25), 0.16, 0.16, 18, '#9a96a8', 48);
}

/** The lighthouse: a striped tower whose lamp turns all night. */
export function lighthouse(c: Ctx, t: number) {
  shadow(c, 0, 2, 50, 23);
  box(c, 0, 0, 1.5, 1.5, 10, '#9a96a8');
  // tapered striped tower
  const H = 150;
  for (let i = 0; i < 6; i++) {
    const y0 = -10 - (i * H) / 6;
    const y1 = -10 - ((i + 1) * H) / 6;
    const w0 = 26 - (i / 6) * 9;
    const w1 = 26 - ((i + 1) / 6) * 9;
    const col = i % 2 ? '#e5443a' : '#fff8ec';
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-w0, y0);
    c.lineTo(-w1, y1);
    c.lineTo(w1, y1);
    c.lineTo(w0, y0);
    c.fill();
    c.fillStyle = shade(i % 2 ? '#e5443a' : '#fff8ec', -0.18);
    c.beginPath();
    c.moveTo(w0 * 0.25, y0);
    c.lineTo(w1 * 0.25, y1);
    c.lineTo(w1, y1);
    c.lineTo(w0, y0);
    c.fill();
  }
  const top = -10 - H;
  c.fillStyle = '#3a3e4e';
  c.fillRect(-20, top - 4, 40, 5);
  // lamp room
  const glow = 0.75 + Math.sin(t * 3) * 0.1;
  c.fillStyle = `rgba(255, 236, 160, ${glow})`;
  c.fillRect(-12, top - 22, 24, 18);
  c.strokeStyle = '#3a3e4e';
  c.lineWidth = 1.5;
  for (const x of [-6, 0, 6]) {
    c.beginPath();
    c.moveTo(x, top - 22);
    c.lineTo(x, top - 4);
    c.stroke();
  }
  c.fillStyle = '#3a3e4e';
  c.beginPath();
  c.moveTo(-15, top - 22);
  c.lineTo(0, top - 38);
  c.lineTo(15, top - 22);
  c.fill();
  // the turning beam
  const a = t * 0.9;
  const len = 210;
  const dir = Math.cos(a);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, top - 13, dir * len, top - 13);
  g.addColorStop(0, 'rgba(255, 240, 180, .55)');
  g.addColorStop(1, 'rgba(255, 240, 180, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, top - 13);
  c.lineTo(dir * len, top - 13 - 18 * Math.abs(Math.sin(a)) - 8);
  c.lineTo(dir * len, top - 13 + 18 * Math.abs(Math.sin(a)) + 8);
  c.closePath();
  c.fill();
  c.restore();
  blob(c, 0, top - 40, 2.5, '#e0b43c');
}

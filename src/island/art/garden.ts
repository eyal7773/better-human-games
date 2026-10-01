import { along, blob, box, corners, roof, shade, shadow, type Ctx } from './kit';

/** Height of the island's cliff below the grass, in world units. */
export const CLIFF = 62;

/**
 * The Garden of Calm's items. Each draws standing at (0, 0) on its footprint's
 * centre, in world units. Oriented things (benches, beds, bridges) run along
 * +x; the renderer mirrors them when flipped.
 */

export function tree(c: Ctx, t: number, stage: number, seed: number) {
  const k = 0.5 + stage * 0.17;
  const sway = Math.sin(t * 1.3 + seed) * 2 * k;
  shadow(c, 0, 0, 24 * k, 11 * k);
  c.fillStyle = '#8a5a3c';
  c.beginPath();
  c.moveTo(-4 * k, 0);
  c.lineTo(-2 * k + sway * 0.3, -34 * k);
  c.lineTo(2 * k + sway * 0.3, -34 * k);
  c.lineTo(4 * k, 0);
  c.fill();
  const top = -40 * k;
  blob(c, -13 * k + sway, top + 6 * k, 15 * k, '#3f7d42');
  blob(c, 13 * k + sway, top + 6 * k, 15 * k, '#3f7d42');
  blob(c, sway, top - 8 * k, 18 * k, '#5d9e55');
  blob(c, -7 * k + sway, top - 2 * k, 12 * k, '#7cba67');
  blob(c, 6 * k + sway, top - 14 * k, 8 * k, '#a5d98a');
}

export function sakura(c: Ctx, t: number, _s: number, seed: number) {
  const k = 1.05;
  const sway = Math.sin(t * 1.1 + seed) * 2 * k;
  shadow(c, 0, 0, 28 * k, 13 * k);
  c.strokeStyle = '#6d4636';
  c.lineWidth = 5 * k;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-4 * k, -22 * k, sway, -38 * k);
  c.moveTo(-2 * k, -24 * k);
  c.lineTo(-16 * k + sway, -36 * k);
  c.stroke();
  const top = -44 * k;
  for (const [dx, dy, r, col] of [
    [-18, 8, 14, '#e889ad'],
    [16, 6, 15, '#e889ad'],
    [0, -6, 19, '#f7b6cf'],
    [-10, -12, 11, '#fcd3e2'],
    [12, -14, 10, '#fcd3e2'],
  ] as const)
    blob(c, dx * k + sway, top + dy * k, r * k, col);
  // a few petals drifting down
  c.fillStyle = '#fbc6da';
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.25 + i / 3 + seed * 0.13) % 1;
    const px = Math.sin(p * 9 + i) * 18 + (i - 1) * 10;
    c.beginPath();
    c.ellipse(px, top + p * 46, 2.2, 1.3, p * 6, 0, Math.PI * 2);
    c.fill();
  }
}

export function lantern(c: Ctx, t: number, _s: number, seed: number) {
  const k = 0.9;
  shadow(c, 0, 0, 13 * k, 6 * k);
  const glow = 0.55 + Math.sin(t * 2.2 + seed) * 0.15;
  const g = c.createRadialGradient(0, -26 * k, 1, 0, -26 * k, 30 * k);
  g.addColorStop(0, `rgba(255, 214, 120, ${glow * 0.7})`);
  g.addColorStop(1, 'rgba(255, 214, 120, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, -26 * k, 30 * k, 0, Math.PI * 2);
  c.fill();
  box(c, 0, 0, 0.32, 0.32, 5, '#a9a4b8');
  box(c, 0, 0, 0.13, 0.13, 13, '#9d98ae', 5);
  box(c, 0, 0, 0.26, 0.26, 14, '#8f8aa0', 18);
  c.fillStyle = `rgba(255, 220, 130, ${0.7 + glow * 0.3})`;
  c.fillRect(-4 * k, -29 * k, 8 * k, 7 * k);
  roof(c, 0, 0, 0.3, 0.3, 32, 10, '#76718a', 0.12);
  blob(c, 0, -43, 2.5, '#76718a');
}

export function stones(c: Ctx) {
  const k = 0.9;
  shadow(c, 0, 0, 15 * k, 7 * k);
  const st: [number, number, number, string][] = [
    [0, -5, 13, '#8e8aa0'],
    [1, -14, 10, '#a39fb4'],
    [-1, -21, 7.5, '#b8b4c8'],
    [0, -27, 5, '#cfcbdd'],
  ];
  for (const [dx, dy, r, col] of st) {
    const g = c.createLinearGradient(-r, dy - r, r, dy + r);
    g.addColorStop(0, shade(col, 0.2));
    g.addColorStop(1, shade(col, -0.15));
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(dx * k, dy * k, r * k, r * 0.55 * k, 0, 0, Math.PI * 2);
    c.fill();
  }
}

export function bench(c: Ctx) {
  shadow(c, 0, 2, 30, 13);
  for (const u of [-0.6, 0.6]) {
    const [x, y] = along(0, 0, u, 0.05);
    box(c, x, y, 0.08, 0.3, 9, '#6d4636');
  }
  box(c, 0, 0, 1.6, 0.36, 3, '#c08657', 9);
  for (const u of [-0.6, 0.6]) {
    const [x, y] = along(0, 0, u, -0.16);
    box(c, x, y, 0.08, 0.06, 14, '#6d4636', 9);
  }
  const [bx, by] = along(0, 0, 0, -0.16);
  box(c, bx, by, 1.6, 0.06, 4, '#b67a52', 17);
  box(c, bx, by, 1.6, 0.06, 3, '#b67a52', 22);
}

export function chimes(c: Ctx, t: number) {
  const k = 0.9;
  shadow(c, 0, 0, 8 * k, 4 * k);
  box(c, 0, 0, 0.08, 0.08, 52 * k, '#6d4636');
  c.strokeStyle = '#6d4636';
  c.lineWidth = 3 * k;
  c.beginPath();
  c.moveTo(0, -52 * k);
  c.lineTo(18 * k, -52 * k + 9);
  c.stroke();
  const hx = 13 * k;
  c.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const sw = Math.sin(t * 2 + i * 1.3) * 3 * k;
    const px = hx - 6 * k + i * 4 * k;
    const top = -52 * k + 6 + i * 2;
    const len = (12 + i * 3) * k;
    c.strokeStyle = 'rgba(42,24,56,.6)';
    c.beginPath();
    c.moveTo(px, top);
    c.lineTo(px + sw, top + len);
    c.stroke();
    c.fillStyle = i % 2 ? '#e0c46c' : '#c9d6df';
    c.fillRect(px + sw - 1.5 * k, top + len, 3 * k, 9 * k);
  }
}

export function flowers(c: Ctx, t: number, _s: number, seed: number) {
  const cols = ['#ff8fab', '#ffd447', '#b983ff', '#ffffff', '#ff7a5c'];
  for (let i = 0; i < 9; i++) {
    const a = seed * 3 + i * 2.1;
    const fx = Math.cos(a) * (5 + (i % 3) * 6);
    const fy = Math.sin(a) * (3 + (i % 3) * 2.6);
    const sw = Math.sin(t * 1.8 + i) * 1.2;
    c.strokeStyle = '#4f8f4c';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(fx + sw, fy - 9);
    c.stroke();
    blob(c, fx + sw, fy - 10, 3.4, cols[(i + seed) % cols.length]);
    blob(c, fx + sw, fy - 10, 1.3, '#ffb347');
  }
}

export function pond(c: Ctx, t: number) {
  const rx = 50;
  const ry = 25;
  // stone rim
  c.fillStyle = '#9a96a8';
  c.beginPath();
  c.ellipse(0, 2, rx + 6, ry + 5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#b9b5c6';
  c.beginPath();
  c.ellipse(0, 0, rx + 6, ry + 4, 0, 0, Math.PI * 2);
  c.fill();
  const g = c.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, '#2f8ea0');
  g.addColorStop(1, '#6fd0d6');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 1, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.beginPath();
  c.ellipse(0, 1, rx, ry, 0, 0, Math.PI * 2);
  c.clip();
  for (let i = 0; i < 2; i++) {
    const a = t * 0.6 + i * Math.PI;
    const fx = Math.cos(a) * rx * 0.55;
    const fy = Math.sin(a) * ry * 0.5;
    c.save();
    c.translate(fx, fy);
    c.rotate(a + Math.PI / 2);
    c.fillStyle = i ? '#ff8a3d' : '#fff3e6';
    c.beginPath();
    c.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(-6, 0);
    c.lineTo(-11, -3);
    c.lineTo(-11, 3);
    c.fill();
    c.restore();
  }
  c.strokeStyle = 'rgba(255,255,255,.5)';
  c.lineWidth = 1.5;
  const rr = Math.abs(t * 12) % 24;
  c.beginPath();
  c.ellipse(12, -2, rr, rr * 0.45, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  // lily pads
  for (const [x, y, r] of [
    [-26, -6, 6],
    [-18, 8, 5],
    [28, 10, 5.5],
  ]) {
    c.fillStyle = '#5aa15a';
    c.beginPath();
    c.arc(x, y, r, 0.3, Math.PI * 2 - 0.1);
    c.lineTo(x, y);
    c.fill();
  }
  blob(c, -26, -8, 2.4, '#ffd1e0');
}

/** A waterfall pours over the front edge: side 1 is the +x edge, side 2 the +y edge. */
export function waterfall(c: Ctx, t: number, _s: number, _seed: number, side = 1) {
  const [ex, ey] = side === 2 ? along(0, 0, 0, 0.5) : along(0, 0, 0.5, 0);
  const span = (u: number): [number, number] => (side === 2 ? along(0, 0, u, 0.5) : along(0, 0, 0.5, u));
  // little pool and channel on top
  c.fillStyle = '#a9a4b8';
  c.beginPath();
  c.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#56b9c6';
  c.beginPath();
  c.ellipse(0, 0, 17, 8.5, 0, 0, Math.PI * 2);
  c.fill();
  // the falling sheet, down the cliff face
  const [ax, ay] = span(-0.3);
  const [bx, by] = span(0.3);
  const g = c.createLinearGradient(0, ey, 0, ey + CLIFF + 30);
  g.addColorStop(0, 'rgba(150, 225, 235, .95)');
  g.addColorStop(1, 'rgba(210, 248, 252, .4)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(ax, ay);
  c.lineTo(bx, by);
  c.lineTo(bx + (side === 2 ? -2 : 2), by + CLIFF + 30);
  c.lineTo(ax + (side === 2 ? 2 : -2), ay + CLIFF + 30);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,.75)';
  c.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const u = -0.22 + i * 0.11;
    const [sx, sy] = span(u);
    const off = (t * 70 + i * 23) % (CLIFF + 20);
    c.beginPath();
    c.moveTo(sx, sy + off);
    c.lineTo(sx, sy + off + 12);
    c.stroke();
  }
  for (let i = 0; i < 6; i++) blob(c, ex + (i - 2.5) * 6, ey + CLIFF + 30 + Math.sin(t * 4 + i) * 2, 4 + (i % 2) * 3, 'rgba(255,255,255,.6)');
}

export function bush(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 17, 8);
  const b = Math.sin(t * 1.4 + seed) * 0.6;
  blob(c, -8, -8, 10, '#3d7a3f');
  blob(c, 8, -8, 10, '#3d7a3f');
  blob(c, 0, -14 + b, 12, '#529450');
  blob(c, -4, -18 + b, 7, '#6fb262');
  if (seed % 2) for (const [x, y] of [[-7, -10], [6, -15], [9, -6]]) blob(c, x, y + b, 2, '#e04f6a');
}

export function bamboo(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 14, 7);
  const stalks: [number, number, number][] = [
    [-7, 2, 62],
    [0, -3, 74],
    [7, 1, 56],
    [3, 5, 44],
  ];
  for (const [i, [x, y, hgt]] of stalks.entries()) {
    const sw = Math.sin(t * 1.2 + seed + i) * 2.5;
    c.strokeStyle = i % 2 ? '#7fb24e' : '#93c45c';
    c.lineWidth = 3.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x, y - hgt * 0.6, x + sw, y - hgt);
    c.stroke();
    c.strokeStyle = '#5c8a38';
    c.lineWidth = 1.2;
    for (let s = 1; s < 5; s++) {
      const yy = y - (hgt * s) / 5;
      const xx = x + sw * Math.pow(s / 5, 2);
      c.beginPath();
      c.moveTo(xx - 2, yy);
      c.lineTo(xx + 2, yy);
      c.stroke();
    }
    c.fillStyle = '#6aa646';
    for (let l = 0; l < 3; l++) {
      const yy = y - hgt * (0.55 + l * 0.17);
      const xx = x + sw * (0.4 + l * 0.2);
      c.beginPath();
      c.ellipse(xx + (l % 2 ? 6 : -6), yy, 7, 2, l % 2 ? 0.4 : -0.4, 0, Math.PI * 2);
      c.fill();
    }
  }
}

export function vegBed(c: Ctx, t: number) {
  shadow(c, 0, 2, 34, 15);
  box(c, 0, 0, 1.7, 0.75, 8, '#9a6a45');
  const [A, B, C, D] = corners(0, -8, 1.55, 0.6);
  c.fillStyle = '#6b4a35';
  c.beginPath();
  c.moveTo(A[0], A[1]);
  c.lineTo(B[0], B[1]);
  c.lineTo(C[0], C[1]);
  c.lineTo(D[0], D[1]);
  c.fill();
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 2; j++) {
      const [x, y] = along(0, -8, -0.62 + i * 0.25, -0.15 + j * 0.3);
      const sw = Math.sin(t * 2 + i + j) * 0.8;
      if (i < 2) {
        blob(c, x - 2 + sw, y - 4, 3, '#4f9a45');
        blob(c, x + 2 + sw, y - 5, 3, '#63b155');
      } else if (i < 4) {
        c.strokeStyle = '#4f9a45';
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + sw, y - 9);
        c.moveTo(x, y);
        c.lineTo(x - 3 + sw, y - 7);
        c.stroke();
        blob(c, x, y, 1.8, '#f08a2c');
      } else {
        blob(c, x + sw, y - 6, 4, '#3f8a3e');
        blob(c, x + 2 + sw, y - 4, 2, '#e5443a');
        blob(c, x - 2 + sw, y - 8, 1.8, '#e5443a');
      }
    }
  }
}

export function bridge(c: Ctx) {
  // planks arch over the water along +x
  const n = 7;
  for (let i = 0; i < n; i++) {
    const u = -0.55 + (i * 1.1) / (n - 1);
    const lift = Math.sin(((i + 0.5) / n) * Math.PI) * 8;
    const [x, y] = along(0, 0, u, 0);
    box(c, x, y, 0.17, 0.62, 3, i % 2 ? '#b27a4e' : '#c08657', lift + 2);
  }
  // rails
  for (const v of [-0.3, 0.3]) {
    c.strokeStyle = '#8a5a3c';
    c.lineWidth = 2.4;
    c.beginPath();
    for (let i = 0; i <= 12; i++) {
      const u = -0.55 + (i * 1.1) / 12;
      const lift = Math.sin((i / 12) * Math.PI) * 8 + 16;
      const [x, y] = along(0, 0, u, v);
      if (i) c.lineTo(x, y - lift);
      else c.moveTo(x, y - lift);
    }
    c.stroke();
    for (const u of [-0.5, 0, 0.5]) {
      const lift = Math.sin(((u + 0.55) / 1.1) * Math.PI) * 8;
      const [x, y] = along(0, 0, u, v);
      c.beginPath();
      c.moveTo(x, y - lift - 2);
      c.lineTo(x, y - lift - 16);
      c.stroke();
    }
  }
}

export function hammock(c: Ctx, t: number) {
  shadow(c, 0, 2, 32, 12);
  const [ax, ay] = along(0, 0, -0.75, 0);
  const [bx, by] = along(0, 0, 0.75, 0);
  box(c, ax, ay, 0.12, 0.12, 40, '#8a5a3c');
  const sw = Math.sin(t * 0.9) * 3;
  c.strokeStyle = '#d9c7a3';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(ax, ay - 34);
  c.lineTo(ax + 10, ay - 26);
  c.moveTo(bx, by - 34);
  c.lineTo(bx - 10, by - 28);
  c.stroke();
  c.fillStyle = '#e8735a';
  c.beginPath();
  c.moveTo(ax + 10, ay - 26);
  c.quadraticCurveTo(sw, 2 - 10, bx - 10, by - 28);
  c.quadraticCurveTo(sw, -4 - 10, ax + 10, ay - 26);
  c.fill();
  c.strokeStyle = '#fff3c4';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(ax + 14, ay - 24);
  c.quadraticCurveTo(sw, -1 - 10, bx - 14, by - 26);
  c.stroke();
  box(c, bx, by, 0.12, 0.12, 40, '#8a5a3c');
}

export function willow(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 30, 13);
  c.fillStyle = '#7a5038';
  c.beginPath();
  c.moveTo(-6, 0);
  c.quadraticCurveTo(-2, -26, -6, -52);
  c.lineTo(5, -52);
  c.quadraticCurveTo(2, -26, 6, 0);
  c.fill();
  blob(c, 0, -60, 26, '#6e9e4c');
  blob(c, -10, -66, 16, '#86b65c');
  for (let i = 0; i < 16; i++) {
    const x = -30 + i * 4;
    const len = 34 + Math.sin(i * 1.7 + seed) * 8;
    const sw = Math.sin(t * 1.1 + i * 0.4 + seed) * 4;
    c.strokeStyle = i % 2 ? '#8fc066' : '#a7d47a';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    const top = -60 - Math.cos((x / 30) * 1.3) * 22;
    c.moveTo(x, top);
    c.quadraticCurveTo(x + sw * 0.5, top + len * 0.5, x + sw, top + len);
    c.stroke();
  }
}

export function pavilion(c: Ctx, t: number) {
  shadow(c, 0, 2, 60, 28);
  box(c, 0, 0, 1.7, 1.7, 6, '#c9c3d6');
  for (const [u, v] of [
    [-0.7, -0.7],
    [0.7, -0.7],
    [-0.7, 0.7],
    [0.7, 0.7],
  ]) {
    const [x, y] = along(0, 0, u, v);
    box(c, x, y, 0.12, 0.12, 40, '#b0413e', 6);
  }
  roof(c, 0, 0, 1.6, 1.6, 46, 34, '#2f7f78', 0.3);
  blob(c, 0, -82, 3.5, '#e0c46c');
  // a paper lantern under the roof
  const sw = Math.sin(t * 1.6) * 1.5;
  c.strokeStyle = 'rgba(40,30,30,.6)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, -44);
  c.lineTo(sw, -34);
  c.stroke();
  c.fillStyle = '#ff9a5a';
  c.beginPath();
  c.ellipse(sw, -28, 6, 7, 0, 0, Math.PI * 2);
  c.fill();
}

export function teahouse(c: Ctx) {
  shadow(c, 0, 2, 62, 30);
  box(c, 0, 0, 1.8, 1.8, 6, '#a9a4b8');
  box(c, 0, 0, 1.5, 1.5, 34, '#f4ead6', 6);
  // timber frame on the two visible walls
  const [, B, C, D] = corners(0, 0, 1.5, 1.5);
  c.strokeStyle = '#6d4636';
  c.lineWidth = 2.5;
  for (const [p, q] of [
    [D, C],
    [C, B],
  ] as const) {
    for (let i = 0; i <= 3; i++) {
      const x = p[0] + ((q[0] - p[0]) * i) / 3;
      const y = p[1] + ((q[1] - p[1]) * i) / 3;
      c.beginPath();
      c.moveTo(x, y - 6);
      c.lineTo(x, y - 40);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(p[0], p[1] - 22);
    c.lineTo(q[0], q[1] - 22);
    c.stroke();
  }
  // a warm window on the lit wall and a door on the shaded one
  const win = (p: [number, number], q: [number, number], k: number, fill: string, tall: number) => {
    const x = p[0] + (q[0] - p[0]) * k;
    const y = p[1] + (q[1] - p[1]) * k;
    const dx = (q[0] - p[0]) * 0.14;
    const dy = (q[1] - p[1]) * 0.14;
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(x - dx, y - dy - 10);
    c.lineTo(x + dx, y + dy - 10);
    c.lineTo(x + dx, y + dy - 10 - tall);
    c.lineTo(x - dx, y - dy - 10 - tall);
    c.fill();
  };
  win(D, C, 0.5, '#ffd98a', 10);
  win(C, B, 0.5, '#5a3a2a', 22);
  roof(c, 0, 0, 1.5, 1.5, 40, 30, '#4a4f63', 0.32);
  blob(c, 0, -71, 3, '#3a3e50');
}

/** The ancient tree grows through seven stages with every calm round; the last one blossoms. */
export function ancientTree(c: Ctx, t: number, stage: number, seed: number) {
  const k = 0.55 + stage * 0.09;
  const sway = Math.sin(t * 0.8 + seed) * 2;
  shadow(c, 0, 2, 58 * k, 26 * k);
  // roots
  c.fillStyle = '#6d4636';
  for (const a of [-1, -0.4, 0.5, 1.1]) {
    c.beginPath();
    c.ellipse(Math.cos(a) * 16 * k, 2 + Math.sin(a) * 4, 12 * k, 4 * k, a * 0.3, 0, Math.PI * 2);
    c.fill();
  }
  // gnarled trunk
  const g = c.createLinearGradient(-14 * k, 0, 14 * k, 0);
  g.addColorStop(0, '#9a6a48');
  g.addColorStop(1, '#5e3c2a');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-14 * k, 0);
  c.bezierCurveTo(-8 * k, -30 * k, -18 * k, -50 * k, -6 * k + sway * 0.3, -80 * k);
  c.lineTo(8 * k + sway * 0.3, -80 * k);
  c.bezierCurveTo(16 * k, -50 * k, 6 * k, -30 * k, 14 * k, 0);
  c.fill();
  const top = -92 * k;
  const blossom = stage >= 7;
  const leaf = blossom ? ['#e889ad', '#f3a8c6', '#fcd3e2'] : ['#3a7340', '#559650', '#78b866'];
  for (const [dx, dy, r, i] of [
    [-34, 16, 24, 0],
    [34, 14, 24, 0],
    [0, 4, 30, 1],
    [-22, -12, 22, 1],
    [22, -14, 22, 1],
    [0, -26, 22, 2],
    [-10, -8, 14, 2],
    [14, 0, 12, 2],
  ] as const)
    blob(c, dx * k + sway, top + dy * k, r * k, leaf[i]);
  if (blossom) {
    c.fillStyle = '#ffe3ee';
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.18 + i / 6) % 1;
      c.beginPath();
      c.ellipse(Math.sin(p * 7 + i * 2) * 40 * k, top + 20 * k + p * 90 * k, 2.4, 1.4, p * 5, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/** A bamboo fence post with rails toward its neighbours (bit 1: +x, 2: +y, 4: −x, 8: −y). */
export function fence(c: Ctx, _t: number, _stage: number, _seed: number, links = 0) {
  const rail = (u: number, v: number) => {
    const [x, y] = along(0, 0, u, v);
    c.strokeStyle = '#a7b75a';
    c.lineWidth = 3;
    c.lineCap = 'round';
    for (const z of [8, 15]) {
      c.beginPath();
      c.moveTo(0, -z);
      c.lineTo(x, y - z);
      c.stroke();
    }
  };
  // back rails first so the post covers them
  if (links & 4) rail(-0.5, 0);
  if (links & 8) rail(0, -0.5);
  box(c, 0, 0, 0.12, 0.12, 20, '#b8c868');
  blob(c, 0, -21, 2.2, '#d0dc8a');
  if (links & 1) rail(0.5, 0);
  if (links & 2) rail(0, 0.5);
}

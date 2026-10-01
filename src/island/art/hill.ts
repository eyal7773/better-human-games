import { along, blob, box, roof, shadow, type Ctx } from './kit';

/** The Hill of Wind: tall grass, kites, and everything that turns in a breeze. */

const wind = (t: number, seed = 0) => Math.sin(t * 1.6 + seed) * 0.6 + Math.sin(t * 0.7 + seed * 2) * 0.4;

export function tallGrass(c: Ctx, t: number, _s: number, seed: number) {
  for (let i = 0; i < 14; i++) {
    const x = -22 + ((i * 37 + seed * 11) % 44);
    const y = -8 + ((i * 23 + seed * 7) % 16);
    const hgt = 16 + ((i * 13) % 10);
    const sw = wind(t, x * 0.05) * 5;
    c.strokeStyle = i % 3 ? '#8fbf5a' : '#b5d877';
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + sw * 0.3, y - hgt * 0.6, x + sw, y - hgt);
    c.stroke();
  }
}

export function sunflowers(c: Ctx, t: number, _s: number, seed: number) {
  for (let i = 0; i < 4; i++) {
    const x = -16 + i * 11 + ((seed + i) % 3) * 2;
    const y = -4 + (i % 2) * 8;
    const hgt = 26 + ((i + seed) % 3) * 5;
    const sw = wind(t, i) * 2;
    c.strokeStyle = '#5c9a3c';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + sw, y - hgt);
    c.stroke();
    c.fillStyle = '#6fb24a';
    c.beginPath();
    c.ellipse(x + 4, y - hgt * 0.5, 4, 2, 0.5, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      blob(c, x + sw + Math.cos(a) * 5, y - hgt + Math.sin(a) * 5, 2.6, '#ffc61a');
    }
    blob(c, x + sw, y - hgt, 3.4, '#7a4a22');
  }
}

export function pinwheel(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 7, 3);
  c.strokeStyle = '#8a5a3c';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -34);
  c.stroke();
  const cols = ['#ff5a4e', '#ffc61a', '#3fcf6a', '#2f9bff'];
  const a0 = t * (3 + wind(t, seed) * 2);
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i * Math.PI) / 2;
    c.fillStyle = cols[(i + seed) % 4];
    c.beginPath();
    c.moveTo(0, -34);
    c.lineTo(Math.cos(a) * 11, -34 + Math.sin(a) * 11);
    c.lineTo(Math.cos(a + 0.8) * 8, -34 + Math.sin(a + 0.8) * 8);
    c.fill();
  }
  blob(c, 0, -34, 2, '#fff');
}

const KITE = ['#ff5a4e', '#ffc61a', '#3fcf6a', '#2f9bff', '#9a6bff'];

export function kite(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 6, 3);
  box(c, 0, 0, 0.08, 0.08, 10, '#8a5a3c');
  const kx = 24 + wind(t, seed) * 8;
  const ky = -96 + Math.sin(t * 1.3 + seed) * 6;
  c.strokeStyle = 'rgba(60,40,30,.5)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(0, -10);
  c.quadraticCurveTo(kx * 0.3, ky * 0.4, kx, ky + 12);
  c.stroke();
  const col = KITE[seed % KITE.length];
  c.save();
  c.translate(kx, ky);
  c.rotate(wind(t, seed) * 0.2);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, -14);
  c.lineTo(10, 0);
  c.lineTo(0, 14);
  c.lineTo(-10, 0);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)';
  c.beginPath();
  c.moveTo(0, -14);
  c.lineTo(10, 0);
  c.lineTo(0, 0);
  c.fill();
  // tail with bows
  c.strokeStyle = col;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 14);
  for (let i = 1; i <= 6; i++) c.lineTo(Math.sin(t * 3 + i) * 4, 14 + i * 5);
  c.stroke();
  for (let i = 2; i <= 6; i += 2) blob(c, Math.sin(t * 3 + i) * 4, 14 + i * 5, 2, '#fff');
  c.restore();
}

export function bunting(c: Ctx, t: number) {
  shadow(c, 0, 2, 30, 10);
  const [ax, ay] = along(0, 0, -0.75, 0);
  const [bx, by] = along(0, 0, 0.75, 0);
  box(c, ax, ay, 0.08, 0.08, 36, '#8a5a3c');
  box(c, bx, by, 0.08, 0.08, 36, '#8a5a3c');
  const cols = ['#ff5a4e', '#ffc61a', '#3fcf6a', '#2f9bff', '#ff8fab', '#9a6bff'];
  c.strokeStyle = 'rgba(60,40,30,.55)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(ax, ay - 34);
  c.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 - 22, bx, by - 34);
  c.stroke();
  for (let i = 1; i < 8; i++) {
    const k = i / 8;
    const x = ax + (bx - ax) * k;
    const y = ay + (by - ay) * k - 34 + Math.sin(k * Math.PI) * 12;
    const flap = Math.sin(t * 4 + i) * 1.5;
    c.fillStyle = cols[i % cols.length];
    c.beginPath();
    c.moveTo(x - 3.5, y);
    c.lineTo(x + 3.5, y);
    c.lineTo(x + flap, y + 9);
    c.fill();
  }
}

export function lookout(c: Ctx) {
  shadow(c, 0, 2, 30, 13);
  for (const u of [-0.6, 0.6]) {
    const [x, y] = along(0, 0, u, 0.05);
    box(c, x, y, 0.08, 0.3, 9, '#5a6b7a');
  }
  box(c, 0, 0, 1.6, 0.36, 3, '#7a9ab0', 9);
  const [bx, by] = along(0, 0, 0, -0.16);
  box(c, bx, by, 1.6, 0.06, 4, '#6b8aa0', 18);
  // a coin telescope beside it
  const [tx, ty] = along(0, 0, 0.75, 0.35);
  box(c, tx, ty, 0.1, 0.1, 22, '#5a6b7a');
  c.fillStyle = '#3a4a5a';
  c.save();
  c.translate(tx, ty - 24);
  c.rotate(-0.4);
  c.fillRect(-4, -3, 14, 6);
  c.restore();
}

export function birdhouse(c: Ctx, t: number) {
  shadow(c, 0, 0, 7, 3);
  box(c, 0, 0, 0.08, 0.08, 30, '#8a5a3c');
  box(c, 0, 0, 0.32, 0.32, 14, '#5fb0e0', 30);
  roof(c, 0, 0, 0.32, 0.32, 44, 10, '#ff5a4e', 0.12);
  const [x, y] = along(0, -36, 0, 0.16);
  blob(c, x, y, 3, '#2a1838');
  // a bird on the perch, now and then
  if (Math.sin(t * 0.4) > 0) {
    blob(c, x + 6, y + 2, 4, '#ffc61a');
    blob(c, x + 8, y - 1, 2.5, '#ffc61a');
    c.fillStyle = '#ff8a3d';
    c.beginPath();
    c.moveTo(x + 10, y - 1);
    c.lineTo(x + 13, y);
    c.lineTo(x + 10, y + 0.5);
    c.fill();
  }
}

export function bigChimes(c: Ctx, t: number) {
  shadow(c, 0, 0, 14, 6);
  box(c, 0, 0, 0.1, 0.1, 70, '#6d4636');
  c.strokeStyle = '#6d4636';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-20, -68);
  c.lineTo(20, -68);
  c.stroke();
  for (let i = 0; i < 6; i++) {
    const x = -16 + i * 6.4;
    const sw = wind(t, i) * 3;
    const len = 18 + i * 3;
    c.strokeStyle = 'rgba(42,24,56,.5)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x, -66);
    c.lineTo(x + sw, -66 + 6);
    c.stroke();
    const g = c.createLinearGradient(x - 2, 0, x + 2, 0);
    g.addColorStop(0, '#e9f0f4');
    g.addColorStop(1, '#9fb0bc');
    c.fillStyle = g;
    c.fillRect(x + sw - 2, -60, 4, len);
  }
}

export function treeSwing(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 26, 12);
  c.fillStyle = '#7a5038';
  c.fillRect(-14, -60, 6, 60);
  c.beginPath();
  c.moveTo(-11, -56);
  c.lineTo(24, -62);
  c.lineTo(24, -57);
  c.lineTo(-11, -50);
  c.fill();
  blob(c, -6, -76, 22, '#4f8f4c');
  blob(c, 14, -70, 16, '#5d9e55');
  blob(c, -16, -66, 14, '#5d9e55');
  blob(c, 2, -84, 12, '#7cba67');
  const a = Math.sin(t * 1.4 + seed) * 0.35;
  c.save();
  c.translate(16, -58);
  c.rotate(a);
  c.strokeStyle = '#d9c7a3';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-4, 0);
  c.lineTo(-4, 40);
  c.moveTo(4, 0);
  c.lineTo(4, 40);
  c.stroke();
  c.fillStyle = '#c08657';
  c.fillRect(-7, 39, 14, 3.5);
  c.restore();
}

export function windmill(c: Ctx, t: number) {
  shadow(c, 0, 2, 50, 22);
  c.fillStyle = '#f2ead8';
  c.beginPath();
  c.moveTo(-28, 0);
  c.lineTo(-16, -84);
  c.lineTo(16, -84);
  c.lineTo(28, 0);
  c.closePath();
  c.fill();
  c.fillStyle = '#ddd2b8';
  c.beginPath();
  c.moveTo(4, 0);
  c.lineTo(6, -84);
  c.lineTo(16, -84);
  c.lineTo(28, 0);
  c.closePath();
  c.fill();
  c.fillStyle = '#6d4636';
  c.fillRect(-6, -18, 12, 18);
  blob(c, -6, -50, 4, '#ffd98a');
  c.fillStyle = '#b0413e';
  c.beginPath();
  c.moveTo(-20, -82);
  c.lineTo(0, -110);
  c.lineTo(20, -82);
  c.fill();
  // sails
  const a0 = t * 0.8;
  c.save();
  c.translate(-2, -88);
  for (let i = 0; i < 4; i++) {
    c.rotate(Math.PI / 2);
    c.save();
    c.rotate(a0);
    c.fillStyle = '#8a5a3c';
    c.fillRect(-1.5, 0, 3, 54);
    c.fillStyle = 'rgba(255,250,235,.95)';
    c.fillRect(2, 12, 11, 40);
    c.strokeStyle = 'rgba(138,90,60,.5)';
    c.lineWidth = 0.8;
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(2, 16 + k * 10);
      c.lineTo(13, 16 + k * 10);
      c.stroke();
    }
    c.restore();
  }
  c.restore();
  blob(c, -2, -88, 4, '#6d4636');
}

export function balloon(c: Ctx, t: number, _s: number, seed: number) {
  const bob = Math.sin(t * 0.8 + seed) * 6;
  const y = -120 + bob;
  // its shadow far below
  c.fillStyle = 'rgba(30,50,40,.15)';
  c.beginPath();
  c.ellipse(4, 2, 16, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(60,40,30,.35)';
  c.lineWidth = 0.8;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, y + 30);
  c.stroke();
  c.setLineDash([]);
  box(c, 0, 0, 0.12, 0.12, 4, '#8a5a3c');
  const cols = ['#ff5a4e', '#ffc61a', '#ff5a4e', '#fff', '#ffc61a', '#ff5a4e'];
  for (let i = 0; i < 6; i++) {
    c.fillStyle = cols[i];
    c.beginPath();
    const x0 = -24 + i * 8;
    c.moveTo(0, y - 30);
    c.quadraticCurveTo(x0 * 1.6, y - 20, x0 * 0.9 + 4, y + 4);
    c.lineTo(x0 * 0.9 + 12, y + 4);
    c.quadraticCurveTo((x0 + 8) * 1.6, y - 20, 0, y - 30);
    c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,.3)';
  c.beginPath();
  c.ellipse(-10, y - 12, 5, 10, 0.3, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#6d4636';
  c.beginPath();
  c.moveTo(-6, y + 8);
  c.lineTo(-4, y + 20);
  c.moveTo(6, y + 8);
  c.lineTo(4, y + 20);
  c.stroke();
  c.fillStyle = '#a8784e';
  c.fillRect(-6, y + 20, 12, 9);
}

export function dragonKite(c: Ctx, t: number) {
  shadow(c, 0, 2, 20, 9);
  box(c, 0, 0, 0.3, 0.3, 14, '#8a5a3c');
  const hx = 40 + Math.sin(t * 0.6) * 10;
  const hy = -150 + Math.sin(t * 0.9) * 8;
  c.strokeStyle = 'rgba(60,40,30,.45)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, -14);
  c.quadraticCurveTo(hx * 0.2, hy * 0.5, hx, hy + 8);
  c.stroke();
  // the long body, segment by segment, waving
  for (let i = 14; i >= 0; i--) {
    const x = hx - i * 9;
    const y = hy + Math.sin(t * 3 - i * 0.6) * 9 + i * 2;
    const r = 8 - i * 0.35;
    blob(c, x, y, r, i % 2 ? '#e5443a' : '#ffc61a');
    if (i % 3 === 0) {
      c.fillStyle = '#3fcf6a';
      c.beginPath();
      c.moveTo(x - 3, y - r);
      c.lineTo(x, y - r - 6);
      c.lineTo(x + 3, y - r);
      c.fill();
    }
  }
  // head
  blob(c, hx + 6, hy, 11, '#e5443a');
  blob(c, hx + 10, hy - 3, 3, '#fff');
  blob(c, hx + 11, hy - 3, 1.5, '#2a1838');
  c.strokeStyle = '#ffc61a';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(hx + 14, hy + 4);
  c.quadraticCurveTo(hx + 26, hy + 2 + Math.sin(t * 4) * 3, hx + 30, hy + 10);
  c.moveTo(hx, hy - 9);
  c.lineTo(hx - 4, hy - 18);
  c.stroke();
}

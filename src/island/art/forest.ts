import { along, blob, box, corners, roof, shade, shadow, type Ctx } from './kit';

/** The Lantern Forest: always dusk, glowing mushrooms, and shadows that play. */

export function mushrooms(c: Ctx, t: number, _s: number, seed: number) {
  for (let i = 0; i < 5; i++) {
    const x = -14 + ((i * 17 + seed * 5) % 28);
    const y = -6 + ((i * 11 + seed * 3) % 12);
    const s = 0.7 + (i % 3) * 0.25;
    const glow = 0.6 + Math.sin(t * 1.7 + i + seed) * 0.25;
    const g = c.createRadialGradient(x, y - 8 * s, 0, x, y - 8 * s, 12 * s);
    g.addColorStop(0, `rgba(140, 240, 255, ${glow * 0.45})`);
    g.addColorStop(1, 'rgba(140, 240, 255, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y - 8 * s, 12 * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#e8f4f0';
    c.fillRect(x - 1.2 * s, y - 7 * s, 2.4 * s, 7 * s);
    c.fillStyle = `rgba(110, 220, 240, ${0.75 + glow * 0.25})`;
    c.beginPath();
    c.ellipse(x, y - 7 * s, 5 * s, 3.5 * s, 0, Math.PI, 0);
    c.fill();
    blob(c, x - 1.5 * s, y - 9 * s, 0.9 * s, '#fff');
  }
}

export function fern(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 16, 7);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.42 + Math.sin(t + i + seed) * 0.04;
    const len = 22 + (i % 2) * 6;
    c.strokeStyle = i % 2 ? '#4f8a52' : '#5f9e5c';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, 0);
    const ex = Math.cos(a) * len;
    const ey = Math.sin(a) * len * 0.9;
    c.quadraticCurveTo(ex * 0.5, ey * 0.7 - 6, ex, ey);
    c.stroke();
    c.fillStyle = c.strokeStyle;
    for (let k = 1; k < 6; k++) {
      const px = (ex * k) / 6;
      const py = (ey * k) / 6 - 3 * Math.sin((k / 6) * Math.PI);
      c.beginPath();
      c.ellipse(px, py, 3.5 - k * 0.4, 1.3, a + 1.2, 0, Math.PI * 2);
      c.fill();
    }
  }
}

export function paperLantern(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 6, 3);
  c.strokeStyle = '#4a3a30';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -42);
  c.lineTo(10, -46);
  c.stroke();
  const sw = Math.sin(t * 1.3 + seed) * 1.5;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(10, -46);
  c.lineTo(10 + sw, -40);
  c.stroke();
  const g = c.createRadialGradient(10 + sw, -32, 1, 10 + sw, -32, 9);
  g.addColorStop(0, '#fff2b0');
  g.addColorStop(1, '#ff7a3c');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(10 + sw, -32, 7, 8.5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(160,60,30,.4)';
  for (const dy of [-4, 0, 4]) {
    c.beginPath();
    c.moveTo(4 + sw, -32 + dy);
    c.lineTo(16 + sw, -32 + dy);
    c.stroke();
  }
}

export function pine(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 18, 8);
  c.fillStyle = '#5a3e2e';
  c.fillRect(-3, -14, 6, 14);
  const sw = Math.sin(t * 0.9 + seed) * 1.2;
  const layers: [number, number, string][] = [
    [-14, 22, '#2f5e46'],
    [-34, 18, '#3a6e52'],
    [-52, 13, '#47805e'],
  ];
  for (const [y, w, col] of layers) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-w, y);
    c.lineTo(sw, y - 30);
    c.lineTo(w, y);
    c.closePath();
    c.fill();
    c.fillStyle = shade(col, -0.2);
    c.beginPath();
    c.moveTo(sw, y - 30);
    c.lineTo(w, y);
    c.lineTo(w * 0.2, y);
    c.closePath();
    c.fill();
  }
}

export function lanternPost(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 9, 4);
  box(c, 0, 0, 0.1, 0.1, 50, '#3a3a48');
  const glow = 0.8 + Math.sin(t * 2 + seed) * 0.1;
  box(c, 0, 0, 0.24, 0.24, 14, '#2e2e3a', 50);
  c.fillStyle = `rgba(255, 214, 120, ${glow})`;
  c.fillRect(-4, -62, 8, 10);
  roof(c, 0, 0, 0.26, 0.26, 64, 8, '#2e2e3a', 0.1);
}

export function moonPool(c: Ctx, t: number) {
  // rocks around a dark pool with the moon in it
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    blob(c, Math.cos(a) * 54, Math.sin(a) * 26 + 2, 7 + (i % 3) * 2, i % 2 ? '#7d7a8c' : '#908da0');
  }
  const g = c.createRadialGradient(0, 0, 4, 0, 0, 52);
  g.addColorStop(0, '#2c4a7a');
  g.addColorStop(1, '#16264a');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, 50, 24, 0, 0, Math.PI * 2);
  c.fill();
  const mg = c.createRadialGradient(10, -2, 1, 10, -2, 22);
  mg.addColorStop(0, 'rgba(255,250,220,.9)');
  mg.addColorStop(0.35, 'rgba(255,250,220,.3)');
  mg.addColorStop(1, 'rgba(255,250,220,0)');
  c.fillStyle = mg;
  c.beginPath();
  c.ellipse(10, -2, 22, 11, 0, 0, Math.PI * 2);
  c.fill();
  blob(c, 10, -2, 6, '#fff8dc');
  c.strokeStyle = 'rgba(255,255,255,.35)';
  c.lineWidth = 1;
  const r = Math.abs(t * 8) % 20;
  c.beginPath();
  c.ellipse(-14, 4, r, r * 0.45, 0, 0, Math.PI * 2);
  c.stroke();
}

export function cabin(c: Ctx) {
  shadow(c, 0, 2, 58, 27);
  box(c, 0, 0, 1.6, 1.4, 30, '#8a5a3c');
  // log lines on the two visible walls
  const [, B, C, D] = corners(0, 0, 1.6, 1.4);
  c.strokeStyle = 'rgba(60,35,20,.45)';
  c.lineWidth = 1.5;
  for (let z = 6; z < 30; z += 6)
    for (const [p, q] of [
      [D, C],
      [C, B],
    ] as const) {
      c.beginPath();
      c.moveTo(p[0], p[1] - z);
      c.lineTo(q[0], q[1] - z);
      c.stroke();
    }
  const [wx, wy] = along(0, 0, -0.1, 0.7);
  c.fillStyle = '#ffd98a';
  c.fillRect(wx - 7, wy - 22, 10, 9);
  const [dx, dy] = along(0, 0, 0.8, 0.1);
  c.fillStyle = '#4a3020';
  c.beginPath();
  c.moveTo(dx - 4, dy + 2);
  c.lineTo(dx + 4, dy - 2);
  c.lineTo(dx + 4, dy - 22);
  c.lineTo(dx - 4, dy - 18);
  c.fill();
  roof(c, 0, 0, 1.6, 1.4, 30, 28, '#4a5a4a', 0.25);
  box(c, ...along(0, 0, 0.3, -0.3), 0.18, 0.18, 22, '#7a6a60', 48);
}

export function treehouse(c: Ctx, t: number) {
  shadow(c, 0, 2, 52, 24);
  c.fillStyle = '#6d4636';
  c.beginPath();
  c.moveTo(-12, 0);
  c.quadraticCurveTo(-6, -60, -10, -120);
  c.lineTo(10, -120);
  c.quadraticCurveTo(6, -60, 12, 0);
  c.fill();
  blob(c, 0, -130, 40, '#3a6e52');
  blob(c, -26, -112, 24, '#2f5e46');
  blob(c, 28, -110, 26, '#2f5e46');
  // platform and little house
  box(c, 0, 0, 1.3, 1.1, 4, '#a8784e', 62);
  box(c, 0, 0, 0.8, 0.7, 24, '#c08657', 66);
  roof(c, 0, 0, 0.8, 0.7, 90, 16, '#b0413e', 0.18);
  const [wx, wy] = along(0, -66, 0, 0.35);
  c.fillStyle = '#ffd98a';
  c.fillRect(wx - 4, wy - 16, 8, 8);
  // rope ladder
  c.strokeStyle = '#d9c7a3';
  c.lineWidth = 1;
  const sw = Math.sin(t) * 1.5;
  c.beginPath();
  c.moveTo(18, -62);
  c.lineTo(18 + sw, -4);
  c.moveTo(26, -60);
  c.lineTo(26 + sw, -2);
  for (let y = -54; y < -4; y += 8) {
    c.moveTo(18 + sw * ((y + 62) / 58), y);
    c.lineTo(26 + sw * ((y + 62) / 58), y + 1);
  }
  c.stroke();
}

/** Puppet shadows dance on the screen; a tap makes them bow. */
export function shadowTheater(c: Ctx, t: number) {
  shadow(c, 0, 2, 54, 24);
  box(c, 0, 0, 1.6, 0.5, 10, '#6d4636');
  const [lx, ly] = along(0, 0, -0.75, 0);
  const [rx, ry] = along(0, 0, 0.75, 0);
  box(c, lx, ly, 0.12, 0.12, 64, '#5a3a2a', 10);
  box(c, rx, ry, 0.12, 0.12, 64, '#5a3a2a', 10);
  // the lit paper screen
  const g = c.createLinearGradient(0, -74, 0, -16);
  g.addColorStop(0, '#ffe7b0');
  g.addColorStop(1, '#ffc27a');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(lx, ly - 70);
  c.lineTo(rx, ry - 70);
  c.lineTo(rx, ry - 16);
  c.lineTo(lx, ly - 16);
  c.closePath();
  c.fill();
  // two dancing shadows: a rabbit and a bird
  c.save();
  c.beginPath();
  c.moveTo(lx, ly - 70);
  c.lineTo(rx, ry - 70);
  c.lineTo(rx, ry - 16);
  c.lineTo(lx, ly - 16);
  c.clip();
  c.fillStyle = 'rgba(40,24,30,.75)';
  const hop = Math.abs(Math.sin(t * 2.2)) * 8;
  const x1 = -14 + Math.sin(t * 0.7) * 6;
  const y1 = -34 - hop;
  blob(c, x1, y1, 7, c.fillStyle as string);
  blob(c, x1 + 7, y1 - 6, 4.5, c.fillStyle as string);
  c.beginPath();
  c.ellipse(x1 + 6, y1 - 15, 1.8, 6, -0.2, 0, Math.PI * 2);
  c.ellipse(x1 + 10, y1 - 14, 1.8, 6, 0.3, 0, Math.PI * 2);
  c.fill();
  const x2 = 16 + Math.cos(t * 0.9) * 6;
  const y2 = -50 + Math.sin(t * 1.8) * 5;
  const flap = Math.sin(t * 8) * 6;
  c.beginPath();
  c.moveTo(x2 - 12, y2 - flap);
  c.quadraticCurveTo(x2 - 4, y2 - 2, x2, y2 + 2);
  c.quadraticCurveTo(x2 + 4, y2 - 2, x2 + 12, y2 - flap);
  c.quadraticCurveTo(x2, y2 + 6, x2 - 12, y2 - flap);
  c.fill();
  c.restore();
  // curtain top
  c.fillStyle = '#b0413e';
  c.beginPath();
  c.moveTo(lx - 4, ly - 76);
  c.lineTo(rx + 4, ry - 76);
  c.lineTo(rx + 4, ry - 68);
  c.lineTo(lx - 4, ly - 68);
  c.fill();
}

/** The Tree of Light: glowing orbs that drift up from its branches. */
export function lightTree(c: Ctx, t: number) {
  shadow(c, 0, 2, 50, 23);
  const halo = c.createRadialGradient(0, -90, 10, 0, -90, 90);
  halo.addColorStop(0, 'rgba(180, 230, 255, .35)');
  halo.addColorStop(1, 'rgba(180, 230, 255, 0)');
  c.fillStyle = halo;
  c.beginPath();
  c.arc(0, -90, 90, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#e8e2f4';
  c.lineCap = 'round';
  const branch = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(ex, ey);
    c.stroke();
    if (depth === 0) {
      const p = 0.6 + Math.sin(t * 2 + ex) * 0.3;
      blob(c, ex, ey, 4, `rgba(190, 240, 255, ${p})`);
      blob(c, ex, ey, 1.8, '#fff');
      return;
    }
    branch(ex, ey, a - 0.45, len * 0.72, w * 0.65, depth - 1);
    branch(ex, ey, a + 0.42, len * 0.7, w * 0.65, depth - 1);
  };
  branch(0, 0, -Math.PI / 2, 52, 9, 4);
  for (let i = 0; i < 6; i++) {
    const k = (t * 0.12 + i / 6) % 1;
    const x = Math.sin(i * 2.3 + t * 0.5) * 40;
    blob(c, x, -60 - k * 110, 2.5 * (1 - k) + 0.5, `rgba(200, 245, 255, ${1 - k})`);
  }
}

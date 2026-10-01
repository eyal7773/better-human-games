import { along, blob, box, corners, roof, shade, shadow, type Ctx } from './kit';

/** The Shore of Sounds: sand, shells, and things that make music. */

export function shells(c: Ctx, _t: number, _s: number, seed: number) {
  const cols = ['#fbe3d0', '#f7c6b0', '#fff1e0', '#f2b5a8'];
  for (let i = 0; i < 5; i++) {
    const a = seed + i * 2.4;
    const x = Math.cos(a) * (6 + (i % 2) * 9);
    const y = Math.sin(a) * (3 + (i % 2) * 4);
    c.fillStyle = cols[i % 4];
    c.beginPath();
    c.moveTo(x - 5, y);
    c.quadraticCurveTo(x, y - 9, x + 5, y);
    c.closePath();
    c.fill();
    c.strokeStyle = shade(cols[i % 4], -0.25);
    c.lineWidth = 0.8;
    for (const dx of [-2, 0, 2]) {
      c.beginPath();
      c.moveTo(x, y - 1);
      c.lineTo(x + dx * 1.6, y - 6);
      c.stroke();
    }
  }
  // a starfish
  c.fillStyle = '#ff8a5c';
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 2.5 : 7;
    const a = (k / 10) * Math.PI * 2 + seed;
    c.lineTo(10 + Math.cos(a) * r, 6 + Math.sin(a) * r * 0.55);
  }
  c.fill();
}

export function sandcastle(c: Ctx) {
  shadow(c, 0, 0, 22, 10);
  box(c, 0, 0, 0.8, 0.8, 12, '#e8c27a');
  for (const [u, v] of [
    [-0.32, -0.32],
    [0.32, -0.32],
    [-0.32, 0.32],
    [0.32, 0.32],
  ]) {
    const [x, y] = along(0, 0, u, v);
    box(c, x, y, 0.2, 0.2, 22, '#efcd88');
    c.fillStyle = '#e1b66a';
    c.beginPath();
    c.moveTo(x - 6, y - 22);
    c.lineTo(x, y - 30);
    c.lineTo(x + 6, y - 22);
    c.fill();
  }
  box(c, 0, 0, 0.3, 0.3, 30, '#f2d494');
  c.strokeStyle = '#6d4636';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, -30);
  c.lineTo(0, -44);
  c.stroke();
  c.fillStyle = '#ff5a4e';
  c.beginPath();
  c.moveTo(0, -44);
  c.lineTo(9, -41);
  c.lineTo(0, -38);
  c.fill();
}

export function beachChair(c: Ctx) {
  shadow(c, 0, 2, 22, 9);
  const [bx, by] = along(0, 0, 0, -0.25);
  // frame
  c.strokeStyle = '#8a5a3c';
  c.lineWidth = 2.4;
  for (const u of [-0.32, 0.32]) {
    const [x, y] = along(0, 0, u, 0.3);
    const [x2, y2] = along(bx, by, u, -0.1);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x2, y2 - 30);
    c.stroke();
  }
  // striped canvas
  const [a1, a2] = [along(0, 0, -0.3, 0.25), along(0, 0, 0.3, 0.25)];
  const [b1, b2] = [along(bx, by, -0.3, -0.1), along(bx, by, 0.3, -0.1)];
  for (let i = 0; i < 4; i++) {
    const k0 = i / 4;
    const k1 = (i + 1) / 4;
    const lerp2 = (p: number[], q: number[], k: number) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    const p0 = lerp2(a1, a2, k0);
    const p1 = lerp2(a1, a2, k1);
    const q0 = lerp2(b1, b2, k0);
    const q1 = lerp2(b1, b2, k1);
    c.fillStyle = i % 2 ? '#fff' : '#3a9fd8';
    c.beginPath();
    c.moveTo(p0[0], p0[1] - 8);
    c.lineTo(p1[0], p1[1] - 8);
    c.lineTo(q1[0], q1[1] - 28);
    c.lineTo(q0[0], q0[1] - 28);
    c.fill();
  }
}

export function parasol(c: Ctx, t: number, _s: number, seed: number) {
  shadow(c, 6, 4, 28, 13);
  const sw = Math.sin(t * 0.9 + seed) * 1.2;
  c.strokeStyle = '#d9d2c3';
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(sw, -46);
  c.stroke();
  const cols = ['#ff5a4e', '#fff', '#ffc61a', '#fff'];
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2;
    const a1 = ((i + 1) / 8) * Math.PI * 2;
    c.fillStyle = cols[i % 4];
    c.beginPath();
    c.moveTo(sw, -54);
    c.lineTo(sw + Math.cos(a0) * 30, -42 + Math.sin(a0) * 12);
    c.lineTo(sw + Math.cos(a1) * 30, -42 + Math.sin(a1) * 12);
    c.fill();
  }
  blob(c, sw, -55, 2.4, '#d9d2c3');
}

export function shellChimes(c: Ctx, t: number) {
  shadow(c, 0, 0, 8, 4);
  c.strokeStyle = '#c9b48f';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -50);
  c.moveTo(-14, -48);
  c.quadraticCurveTo(0, -54, 14, -48);
  c.stroke();
  for (let i = 0; i < 5; i++) {
    const x = -12 + i * 6;
    const sw = Math.sin(t * 2 + i * 1.1) * 2.5;
    const len = 12 + (i % 3) * 5;
    c.strokeStyle = 'rgba(60,40,30,.5)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x, -49);
    c.lineTo(x + sw, -49 + len);
    c.stroke();
    c.fillStyle = i % 2 ? '#fbe3d0' : '#f2b5a8';
    c.beginPath();
    c.moveTo(x + sw - 3, -49 + len);
    c.quadraticCurveTo(x + sw, -49 + len + 7, x + sw + 3, -49 + len);
    c.fill();
  }
}

export function singingStones(c: Ctx, t: number) {
  shadow(c, 0, 0, 22, 10);
  const glow = 0.5 + Math.sin(t * 1.5) * 0.15;
  for (const [x, y, r, col] of [
    [-11, -2, 9, '#7aa6b8'],
    [9, -4, 11, '#8fb8c6'],
    [0, 6, 7, '#a7c9d4'],
  ] as const) {
    const g = c.createLinearGradient(x - r, y - r * 2, x + r, y);
    g.addColorStop(0, shade(col, 0.3));
    g.addColorStop(1, shade(col, -0.2));
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y - r * 0.7, r, r * 0.8, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = `rgba(255,255,255,${glow})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(x, y - r * 0.7, r * 0.45, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  }
}

export function oldRadio(c: Ctx, t: number) {
  shadow(c, 0, 0, 18, 8);
  box(c, 0, 0, 0.55, 0.45, 12, '#b0875e');
  box(c, 0, 0, 0.5, 0.3, 18, '#c8743c', 12);
  const [x, y] = along(0, -12, 0, 0.15);
  c.fillStyle = '#fff3d0';
  c.fillRect(x - 6, y - 14, 9, 5);
  c.strokeStyle = '#e5443a';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 2, y - 14);
  c.lineTo(x - 2, y - 9);
  c.stroke();
  blob(c, x + 7, y - 8, 3.2, '#fff3d0');
  c.strokeStyle = '#2a1838';
  c.beginPath();
  c.moveTo(x - 4, y - 30);
  c.lineTo(x + 6, y - 46);
  c.stroke();
  // notes drifting up
  c.fillStyle = 'rgba(42,24,56,.55)';
  c.font = '9px sans-serif';
  const k = (t * 0.4) % 1;
  c.fillText('♪', 10 + k * 6, -34 - k * 18);
}

export function musicBox(c: Ctx, t: number) {
  shadow(c, 0, 0, 16, 7);
  box(c, 0, 0, 0.42, 0.42, 12, '#c25a7a');
  // open lid at the back
  const [A, B] = corners(0, -12, 0.42, 0.42);
  c.fillStyle = '#d97a98';
  c.beginPath();
  c.moveTo(A[0], A[1]);
  c.lineTo(B[0], B[1]);
  c.lineTo(B[0], B[1] - 14);
  c.lineTo(A[0], A[1] - 14);
  c.fill();
  // a tiny dancer turning
  const s = Math.cos(t * 2);
  c.fillStyle = '#fff';
  c.beginPath();
  c.ellipse(0, -18, 5 * Math.abs(s) + 1, 2.4, 0, 0, Math.PI * 2);
  c.fill();
  blob(c, 0, -24, 2, '#ffd1c1');
  c.strokeStyle = '#fff';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, -18);
  c.lineTo(0, -22);
  c.stroke();
}

export function lifeguard(c: Ctx, t: number) {
  shadow(c, 0, 2, 56, 26);
  for (const [u, v] of [
    [-0.55, -0.55],
    [0.55, -0.55],
    [-0.55, 0.55],
    [0.55, 0.55],
  ]) {
    const [x, y] = along(0, 0, u, v);
    box(c, x, y, 0.1, 0.1, 30, '#e8e1d0');
  }
  box(c, 0, 0, 1.4, 1.4, 4, '#d9c7a3', 30);
  box(c, 0, 0, 1.1, 1.1, 26, '#ff5a4e', 34);
  const [x, y] = along(0, -46, 0, 0.55);
  c.fillStyle = '#fff';
  c.fillRect(x - 8, y - 4, 16, 3);
  c.fillRect(x - 1.5, y - 10, 3, 15);
  roof(c, 0, 0, 1.1, 1.1, 60, 18, '#fff4dc', 0.25);
  // a flag on top
  c.strokeStyle = '#6d4636';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, -78);
  c.lineTo(0, -98);
  c.stroke();
  const w = Math.sin(t * 4) * 2;
  c.fillStyle = '#ffc61a';
  c.beginPath();
  c.moveTo(0, -98);
  c.quadraticCurveTo(7, -96 + w, 14, -94);
  c.lineTo(0, -90);
  c.fill();
}

export function boat(c: Ctx) {
  shadow(c, 0, 2, 40, 14);
  const [A, B, C, D] = corners(0, 0, 1.7, 0.6);
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const bow = mid(B, C);
  const stern = mid(A, D);
  // hull
  c.fillStyle = '#3a7bc8';
  c.beginPath();
  c.moveTo(D[0], D[1] - 12);
  c.quadraticCurveTo(stern[0] - 4, stern[1] + 4, D[0], D[1]);
  c.lineTo(C[0], C[1]);
  c.lineTo(bow[0] + 8, bow[1] - 16);
  c.lineTo(C[0], C[1] - 12);
  c.closePath();
  c.fill();
  c.fillStyle = '#2c5f9e';
  c.beginPath();
  c.moveTo(C[0], C[1]);
  c.lineTo(B[0], B[1]);
  c.lineTo(bow[0] + 8, bow[1] - 16);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(D[0], D[1] - 13, C[0] - D[0], 2.5);
  // inside and a mast
  c.fillStyle = '#8a5a3c';
  c.beginPath();
  c.moveTo(A[0], A[1] - 12);
  c.lineTo(B[0], B[1] - 12);
  c.lineTo(C[0], C[1] - 12);
  c.lineTo(D[0], D[1] - 12);
  c.fill();
  c.strokeStyle = '#6d4636';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, -10);
  c.lineTo(0, -56);
  c.stroke();
  c.fillStyle = '#fff8ec';
  c.beginPath();
  c.moveTo(1, -54);
  c.lineTo(22, -18);
  c.lineTo(1, -16);
  c.fill();
}

export function bandstand(c: Ctx, t: number) {
  shadow(c, 0, 2, 58, 27);
  c.fillStyle = '#e9e2d2';
  c.beginPath();
  c.ellipse(0, 0, 54, 27, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#d7cdb7';
  c.beginPath();
  c.ellipse(0, -6, 54, 27, 0, 0, Math.PI);
  c.lineTo(-54, 0);
  c.fill();
  c.fillStyle = '#f4eee0';
  c.beginPath();
  c.ellipse(0, -6, 52, 26, 0, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 44;
    const y = -6 + Math.sin(a) * 22;
    c.fillStyle = Math.sin(a) > 0 ? '#ffffff' : '#ece6d8';
    c.fillRect(x - 2, y - 42, 4, 42);
  }
  // a little horn player on the stage
  blob(c, -8, -14, 5, '#ffc61a');
  blob(c, 8, -16, 5, '#ff8fab');
  c.fillStyle = '#e0c46c';
  c.beginPath();
  c.ellipse(-2, -18, 4, 2, 0.5, 0, Math.PI * 2);
  c.fill();
  // round roof
  c.fillStyle = '#3a9fd8';
  c.beginPath();
  c.ellipse(0, -48, 58, 28, 0, 0, Math.PI);
  c.lineTo(0, -86);
  c.closePath();
  c.fill();
  c.fillStyle = '#2f86bd';
  c.beginPath();
  c.moveTo(-58, -48);
  c.lineTo(0, -86);
  c.lineTo(0, -20);
  c.fill();
  blob(c, 0, -88, 3.5, '#e0c46c');
  c.fillStyle = 'rgba(42,24,56,.5)';
  c.font = '10px sans-serif';
  const k = (t * 0.5) % 1;
  c.fillText('♫', 18 + k * 8, -30 - k * 20);
}

export function bellTower(c: Ctx, t: number) {
  shadow(c, 0, 2, 56, 26);
  box(c, 0, 0, 1.4, 1.4, 10, '#c9c3d6');
  box(c, 0, 0, 1.0, 1.0, 80, '#f2ead8', 10);
  // arches with the bell
  const swing = Math.sin(t * 1.5) * 0.12;
  box(c, 0, 0, 1.0, 1.0, 6, '#d8ccb0', 90);
  for (const [u, v] of [
    [-0.42, -0.42],
    [0.42, -0.42],
    [-0.42, 0.42],
    [0.42, 0.42],
  ]) {
    const [x, y] = along(0, 0, u, v);
    box(c, x, y, 0.12, 0.12, 30, '#f2ead8', 96);
  }
  c.save();
  c.translate(0, -122);
  c.rotate(swing);
  c.fillStyle = '#e0b43c';
  c.beginPath();
  c.moveTo(-9, 16);
  c.quadraticCurveTo(-8, 0, 0, 0);
  c.quadraticCurveTo(8, 0, 9, 16);
  c.closePath();
  c.fill();
  blob(c, 0, 17, 2.5, '#b98a1c');
  c.restore();
  roof(c, 0, 0, 1.0, 1.0, 126, 40, '#3a9fd8', 0.3);
  blob(c, 0, -168, 3, '#e0c46c');
  // a clock face on the lit wall
  const [x, y] = along(0, -50, 0, 0.5);
  blob(c, x, y, 8, '#fff');
  c.strokeStyle = '#2a1838';
  c.lineWidth = 1.4;
  const hr = new Date().getHours() % 12;
  const mn = new Date().getMinutes();
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + Math.sin((hr / 12) * Math.PI * 2) * 4, y - Math.cos((hr / 12) * Math.PI * 2) * 4);
  c.moveTo(x, y);
  c.lineTo(x + Math.sin((mn / 60) * Math.PI * 2) * 6, y - Math.cos((mn / 60) * Math.PI * 2) * 6);
  c.stroke();
}

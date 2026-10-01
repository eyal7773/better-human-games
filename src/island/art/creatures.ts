import { blob, shadow, type Ctx } from './kit';

/**
 * Visitors: small round toy animals, drawn facing right at (0, 0) on the
 * ground. `moving` adds a walking bob; the renderer mirrors them to face left.
 */
export type CreatureDraw = (c: Ctx, t: number, moving: boolean) => void;

const eye = (c: Ctx, x: number, y: number, r = 1.6) => {
  blob(c, x, y, r, '#1d2b4f');
  blob(c, x + r * 0.35, y - r * 0.35, r * 0.4, '#fff');
};
const bob = (t: number, moving: boolean, k = 1) => (moving ? Math.abs(Math.sin(t * 10)) * 2 * k : Math.sin(t * 2) * 0.4);

export const duck: CreatureDraw = (c, t, moving) => {
  const y = -bob(t, moving, 0.5);
  c.fillStyle = 'rgba(255,255,255,.4)';
  c.beginPath();
  c.ellipse(0, 1, 11, 4, 0, 0, Math.PI * 2);
  c.fill();
  blob(c, 0, y - 5, 8, '#fff8e8');
  blob(c, 6, y - 12, 5, '#fff8e8');
  c.fillStyle = '#ff9a2c';
  c.beginPath();
  c.moveTo(10, y - 12);
  c.lineTo(15, y - 11);
  c.lineTo(10, y - 9.5);
  c.fill();
  eye(c, 7.5, y - 13, 1.2);
  c.fillStyle = '#efe4cc';
  c.beginPath();
  c.ellipse(-2, y - 5, 5, 3, -0.3, 0, Math.PI * 2);
  c.fill();
};

export const frog: CreatureDraw = (c, t, moving) => {
  const y = -(moving ? Math.abs(Math.sin(t * 6)) * 6 : 0);
  shadow(c, 0, 0, 8, 3);
  blob(c, 0, y - 6, 8, '#5fbf4a');
  blob(c, -3, y - 12, 3.6, '#5fbf4a');
  blob(c, 4, y - 12, 3.6, '#5fbf4a');
  eye(c, -3, y - 13, 1.6);
  eye(c, 4, y - 13, 1.6);
  c.strokeStyle = '#2f6e2a';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0.5, y - 7, 3, 0.2, Math.PI - 0.2);
  c.stroke();
  blob(c, -6, y - 1, 2.5, '#4aa63a');
  blob(c, 6, y - 1, 2.5, '#4aa63a');
};

export const cat: CreatureDraw = (c, t, moving) => {
  const y = -bob(t, moving);
  shadow(c, 0, 0, 10, 4);
  const tail = Math.sin(t * 2.5) * 4;
  c.strokeStyle = '#f0a050';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-7, y - 6);
  c.quadraticCurveTo(-14, y - 10, -12 + tail * 0.3, y - 18 + tail * 0.2);
  c.stroke();
  blob(c, 0, y - 7, 8, '#f6b066');
  blob(c, 6, y - 15, 6, '#f6b066');
  c.fillStyle = '#f6b066';
  for (const dx of [2, 9]) {
    c.beginPath();
    c.moveTo(dx - 2.5, y - 19);
    c.lineTo(dx, y - 25);
    c.lineTo(dx + 2.5, y - 19);
    c.fill();
  }
  eye(c, 5, y - 16, 1.2);
  eye(c, 9, y - 16, 1.2);
  blob(c, 7.5, y - 13, 1, '#e5607a');
};

export const turtle: CreatureDraw = (c, t, moving) => {
  shadow(c, 0, 0, 11, 4);
  const step = moving ? Math.sin(t * 6) * 1.5 : 0;
  blob(c, -6 + step, -2, 2.5, '#8bc06a');
  blob(c, 5 - step, -2, 2.5, '#8bc06a');
  blob(c, 11, -6, 3.6, '#8bc06a');
  eye(c, 12.5, -7, 1);
  c.fillStyle = '#5a8a3c';
  c.beginPath();
  c.ellipse(0, -6, 10, 7, 0, Math.PI, 0);
  c.fill();
  c.fillStyle = '#7aaa50';
  for (const x of [-5, 0, 5]) {
    c.beginPath();
    c.arc(x, -7, 2.4, 0, Math.PI * 2);
    c.fill();
  }
};

export const crab: CreatureDraw = (c, t, moving) => {
  const y = -bob(t, moving, 0.6);
  shadow(c, 0, 0, 9, 3);
  c.strokeStyle = '#d9483a';
  c.lineWidth = 1.4;
  for (const s of [-1, 1])
    for (const k of [0, 1, 2]) {
      c.beginPath();
      c.moveTo(s * 4, y - 3);
      c.lineTo(s * (8 + k), y + 1 + (moving ? Math.sin(t * 14 + k) : 0));
      c.stroke();
    }
  blob(c, 0, y - 5, 6.5, '#ef5b47');
  for (const s of [-1, 1]) {
    blob(c, s * 9, y - 9, 3, '#ef5b47');
    c.strokeStyle = '#ef5b47';
    c.beginPath();
    c.moveTo(s * 2, y - 9);
    c.lineTo(s * 2, y - 13);
    c.stroke();
    eye(c, s * 2, y - 14, 1.3);
  }
};

export const rabbit: CreatureDraw = (c, t, moving) => {
  const y = -(moving ? Math.abs(Math.sin(t * 7)) * 5 : 0);
  shadow(c, 0, 0, 8, 3);
  blob(c, -1, y - 6, 7, '#f4efe8');
  blob(c, 5, y - 12, 5, '#f4efe8');
  c.fillStyle = '#f4efe8';
  c.beginPath();
  c.ellipse(3, y - 21, 1.8, 6, -0.15, 0, Math.PI * 2);
  c.ellipse(7, y - 20, 1.8, 6, 0.25, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f5b8c6';
  c.beginPath();
  c.ellipse(3, y - 21, 0.8, 4, -0.15, 0, Math.PI * 2);
  c.fill();
  eye(c, 7, y - 13, 1.2);
  blob(c, -8, y - 6, 2.6, '#fff');
};

export const sheep: CreatureDraw = (c, t, moving) => {
  const y = -bob(t, moving, 0.5);
  shadow(c, 0, 0, 12, 4);
  c.fillStyle = '#3a3040';
  for (const x of [-5, 5]) c.fillRect(x - 1, y - 4, 2.4, 5);
  for (const [x, yy, r] of [
    [-6, -9, 6],
    [0, -11, 7],
    [6, -9, 6],
    [-2, -6, 6],
    [3, -6, 6],
  ])
    blob(c, x, y + yy, r, '#fbf7f0');
  blob(c, 11, y - 11, 4.5, '#3a3040');
  eye(c, 12.5, y - 12, 1);
};

export const owl: CreatureDraw = (c, t) => {
  const blink = Math.sin(t * 0.9) > 0.97;
  blob(c, 0, -9, 8, '#9a7556');
  blob(c, 0, -6, 5.5, '#d9c0a0');
  c.fillStyle = '#9a7556';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * 3, -15);
    c.lineTo(s * 7, -20);
    c.lineTo(s * 7, -13);
    c.fill();
  }
  for (const s of [-1, 1]) {
    blob(c, s * 3.4, -11, 3.2, '#fff');
    if (!blink) eye(c, s * 3.4, -11, 1.8);
    else {
      c.strokeStyle = '#1d2b4f';
      c.beginPath();
      c.moveTo(s * 3.4 - 2, -11);
      c.lineTo(s * 3.4 + 2, -11);
      c.stroke();
    }
  }
  c.fillStyle = '#ffb347';
  c.beginPath();
  c.moveTo(-1.2, -8.5);
  c.lineTo(1.2, -8.5);
  c.lineTo(0, -6);
  c.fill();
};

export const fox: CreatureDraw = (c, t, moving) => {
  const y = -bob(t, moving);
  shadow(c, 0, 0, 11, 4);
  const tail = Math.sin(t * 2) * 3;
  c.fillStyle = '#ef7a3c';
  c.beginPath();
  c.ellipse(-11, y - 9 + tail * 0.3, 7, 3.5, -0.6, 0, Math.PI * 2);
  c.fill();
  blob(c, -15, y - 13 + tail * 0.3, 2.4, '#fff');
  blob(c, 0, y - 7, 7.5, '#ef7a3c');
  blob(c, 7, y - 14, 5.5, '#ef7a3c');
  c.fillStyle = '#ef7a3c';
  for (const dx of [4, 9]) {
    c.beginPath();
    c.moveTo(dx - 2.5, y - 18);
    c.lineTo(dx, y - 24);
    c.lineTo(dx + 2.5, y - 18);
    c.fill();
  }
  c.fillStyle = '#fff4e8';
  c.beginPath();
  c.moveTo(7, y - 13);
  c.lineTo(15, y - 12);
  c.lineTo(8, y - 9);
  c.fill();
  blob(c, 14.5, y - 12, 1.2, '#1d2b4f');
  eye(c, 8, y - 15, 1.1);
};

export const deer: CreatureDraw = (c, t, moving) => {
  const y = -bob(t, moving, 0.6);
  shadow(c, 0, 0, 11, 4);
  c.fillStyle = '#9a6a48';
  for (const x of [-5, 5]) c.fillRect(x - 1, y - 8, 2, 8);
  blob(c, 0, y - 12, 8, '#b57f55');
  blob(c, 8, y - 22, 4.5, '#b57f55');
  c.fillStyle = '#b57f55';
  c.fillRect(5, y - 22, 4, 9);
  for (const [x, yy] of [
    [-3, -14],
    [1, -10],
    [-1, -16],
  ])
    blob(c, x, y + yy, 1, '#fff4e0');
  c.strokeStyle = '#7a5038';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(7, y - 26);
  c.lineTo(5, y - 32);
  c.lineTo(3, y - 34);
  c.moveTo(5, y - 32);
  c.lineTo(7, y - 35);
  c.stroke();
  eye(c, 9.5, y - 23, 1.1);
};

/** The whale only surfaces now and then, out at sea: a back, a spout, a tail. */
export const whale: CreatureDraw = (c, t) => {
  const phase = (t * 0.12) % 1;
  if (phase > 0.45) return;
  const k = Math.sin((phase / 0.45) * Math.PI);
  c.fillStyle = '#4a6a9a';
  c.beginPath();
  c.ellipse(0, 0, 30 * k + 1, 9 * k + 0.5, 0, Math.PI, 0);
  c.fill();
  c.fillStyle = '#6a8aba';
  c.beginPath();
  c.ellipse(-6, -3 * k, 12 * k, 3 * k + 0.1, 0, Math.PI, 0);
  c.fill();
  if (k > 0.6) {
    c.strokeStyle = `rgba(255,255,255,${(k - 0.6) * 2})`;
    c.lineWidth = 2;
    for (const a of [-0.5, 0, 0.5]) {
      c.beginPath();
      c.moveTo(10, -8);
      c.quadraticCurveTo(10 + a * 8, -26, 10 + a * 14, -22);
      c.stroke();
    }
  }
  c.strokeStyle = 'rgba(255,255,255,.5)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(0, 1, 34 * k + 2, 6, 0, 0, Math.PI * 2);
  c.stroke();
};

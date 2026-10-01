import { along, blob, box, shadow, type Ctx } from './kit';

/** Achievement items: each stands on a little stone plinth with a gold rim. */

function plinth(c: Ctx, h = 10) {
  shadow(c, 0, 0, 18, 8);
  box(c, 0, 0, 0.5, 0.5, h, '#c9c3d6');
  box(c, 0, 0, 0.54, 0.54, 2, '#e0b43c', h);
}

export function kettleStatue(c: Ctx, t: number) {
  plinth(c);
  const y = -12;
  blob(c, 0, y - 12, 11, '#3fdcc2');
  c.fillStyle = '#10b09a';
  c.fillRect(-11, y - 10, 22, 4);
  c.strokeStyle = '#1d2b4f';
  c.lineWidth = 2.4;
  c.beginPath();
  c.arc(0, y - 18, 9, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.fillStyle = '#3fdcc2';
  c.beginPath();
  c.moveTo(9, y - 12);
  c.lineTo(17, y - 19);
  c.lineTo(15, y - 10);
  c.fill();
  // calm face
  c.strokeStyle = '#1d2b4f';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(-4, y - 13, 1.8, Math.PI * 1.1, Math.PI * 1.9);
  c.arc(4, y - 13, 1.8, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.beginPath();
  c.arc(0, y - 10, 2.5, 0.2, Math.PI - 0.2);
  c.stroke();
  // a gentle wisp, never steam
  c.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(t) * 0.2})`;
  c.beginPath();
  c.moveTo(16, y - 21);
  c.quadraticCurveTo(20, y - 28, 16, y - 34);
  c.stroke();
}

export function antenna(c: Ctx, t: number) {
  plinth(c, 6);
  c.strokeStyle = '#6a6e80';
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-8, -8);
  c.lineTo(0, -74);
  c.lineTo(8, -8);
  for (let y = -16; y > -70; y -= 10) {
    const w = 8 * ((y + 74) / 66);
    c.moveTo(-w, y);
    c.lineTo(w, y - 6);
  }
  c.stroke();
  // six station lights, one per feeling
  const cols = ['#ff7aa2', '#8a7bff', '#58a6ff', '#3fb8a8', '#9aa6c2', '#ffb14a'];
  cols.forEach((col, i) => {
    const on = Math.sin(t * 2 - i * 0.9) > -0.2;
    blob(c, (i % 2 ? 1 : -1) * (6 - i * 0.8), -18 - i * 9, 2.4, on ? col : 'rgba(120,120,140,.5)');
  });
  blob(c, 0, -76, 3, '#ff5a4e');
}

export function feather(c: Ctx, t: number) {
  plinth(c);
  const sw = Math.sin(t * 0.8) * 0.06;
  c.save();
  c.translate(0, -12);
  c.rotate(-0.25 + sw);
  c.strokeStyle = '#d9c7a3';
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(3, -30, 0, -60);
  c.stroke();
  for (let i = 1; i < 14; i++) {
    const y = -i * 4.2;
    const len = 10 * Math.sin((i / 14) * Math.PI) + 3;
    c.strokeStyle = i % 3 ? '#9fd6f5' : '#ffd1e0';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(1, y);
    c.quadraticCurveTo(len * 0.6, y - 2, len, y - 6);
    c.moveTo(1, y);
    c.quadraticCurveTo(-len * 0.6, y - 2, -len, y - 6);
    c.stroke();
  }
  c.restore();
}

/** A lamp that throws its object's real-sized shadow. */
export function shadowLamp(c: Ctx, t: number) {
  plinth(c, 6);
  c.fillStyle = 'rgba(40,24,40,.35)';
  c.beginPath();
  c.ellipse(-16, 6, 9, 4, 0, 0, Math.PI * 2);
  c.fill();
  box(c, 0, 0, 0.08, 0.08, 34, '#3a3e4e', 8);
  const glow = 0.8 + Math.sin(t * 2) * 0.1;
  c.fillStyle = `rgba(255, 225, 140, ${glow})`;
  c.beginPath();
  c.moveTo(-8, -40);
  c.lineTo(8, -40);
  c.lineTo(4, -50);
  c.lineTo(-4, -50);
  c.fill();
  blob(c, 6, -12, 4, '#ff8a3d');
  c.fillStyle = '#fff';
  c.fillRect(4, -18, 4, 3);
}

export function stoneShield(c: Ctx) {
  plinth(c);
  c.fillStyle = '#8f8aa0';
  c.beginPath();
  c.moveTo(-16, -50);
  c.lineTo(16, -50);
  c.lineTo(16, -26);
  c.quadraticCurveTo(14, -14, 0, -10);
  c.quadraticCurveTo(-14, -14, -16, -26);
  c.closePath();
  c.fill();
  c.fillStyle = '#a9a4b8';
  c.beginPath();
  c.moveTo(-16, -50);
  c.lineTo(0, -50);
  c.lineTo(0, -10);
  c.quadraticCurveTo(-14, -14, -16, -26);
  c.closePath();
  c.fill();
  c.strokeStyle = '#e0b43c';
  c.lineWidth = 2;
  c.stroke();
  blob(c, 0, -34, 5, '#3fdcc2');
}

/** The bench for real-life pauses: a plaque with a pause sign. */
export function realBench(c: Ctx) {
  shadow(c, 0, 2, 30, 13);
  for (const u of [-0.6, 0.6]) {
    const [x, y] = along(0, 0, u, 0.05);
    box(c, x, y, 0.08, 0.3, 9, '#b98a1c');
  }
  box(c, 0, 0, 1.6, 0.36, 3, '#e0b43c', 9);
  const [bx, by] = along(0, 0, 0, -0.16);
  box(c, bx, by, 1.6, 0.06, 10, '#d9a82c', 14);
  c.fillStyle = '#fff8dc';
  c.fillRect(bx - 7, by - 24, 14, 7);
  c.fillStyle = '#1d2b4f';
  c.fillRect(bx - 3, by - 23, 2, 5);
  c.fillRect(bx + 1, by - 23, 2, 5);
}

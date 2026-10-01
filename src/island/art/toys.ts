import { along, blob, box, corners, roof, shadow, type Ctx } from './kit';

/** Toy Island: bright plastic, wooden blocks, and things that bounce and turn. */

const TOY = ['#ff5a4e', '#ffc61a', '#3fcf6a', '#2f9bff', '#9a6bff', '#ff8fab'];

export function blocks(c: Ctx, _t: number, _s: number, seed: number) {
  shadow(c, 0, 0, 18, 8);
  const stack: [number, number, number][] = [
    [-0.15, 0.1, 0],
    [0.2, -0.05, 0],
    [0.02, 0.02, 13],
  ];
  stack.forEach(([u, v, z], i) => {
    const [x, y] = along(0, 0, u, v);
    box(c, x, y, 0.3, 0.3, 13, TOY[(i + seed) % TOY.length], z);
  });
  // a letter on the top block
  c.fillStyle = 'rgba(255,255,255,.85)';
  c.font = 'bold 9px sans-serif';
  c.textAlign = 'center';
  c.fillText('ABC'[seed % 3], -2, -18);
}

/** Giant buttons, the kind Pesky loves to push. */
export function bigButtons(c: Ctx, t: number, _s: number, seed: number) {
  for (const [i, [u, v]] of [
    [-0.2, -0.1],
    [0.22, 0.05],
    [-0.05, 0.25],
  ].entries()) {
    const [x, y] = along(0, 0, u, v);
    const press = Math.max(0, Math.sin(t * 2 + i * 2 + seed)) * 2;
    const col = TOY[(i * 2 + seed) % TOY.length];
    c.fillStyle = 'rgba(30,40,60,.25)';
    c.beginPath();
    c.ellipse(x, y, 11, 5.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#e8e1d0';
    c.beginPath();
    c.ellipse(x, y - 2, 11, 5.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y - 7 + press, 8, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x - 8, y - 7 + press, 16, 4 - press);
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath();
    c.ellipse(x - 2, y - 8 + press, 3, 1.3, 0, 0, Math.PI * 2);
    c.fill();
  }
}

export function jackBox(c: Ctx, t: number) {
  shadow(c, 0, 0, 14, 6);
  box(c, 0, 0, 0.42, 0.42, 18, '#2f9bff');
  const k = (t * 0.35) % 1;
  const pop = k < 0.1 ? k / 0.1 : k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.15);
  const spring = 4 + pop * 18;
  c.strokeStyle = '#c9d6df';
  c.lineWidth = 1.5;
  c.beginPath();
  for (let i = 0; i <= 8; i++) c.lineTo((i % 2 ? 4 : -4) * (0.4 + pop * 0.6), -20 - (spring * i) / 8);
  c.stroke();
  const hy = -24 - spring;
  blob(c, 0, hy, 7, '#ffd1c1');
  c.fillStyle = '#ff5a4e';
  c.beginPath();
  c.moveTo(-7, hy - 3);
  c.lineTo(0, hy - 16);
  c.lineTo(7, hy - 3);
  c.fill();
  blob(c, 0, hy - 16, 2, '#ffc61a');
  blob(c, -2.5, hy - 1, 1.1, '#1d2b4f');
  blob(c, 2.5, hy - 1, 1.1, '#1d2b4f');
  // the lid, open
  c.fillStyle = '#5fb0ff';
  c.save();
  c.translate(-9, -19);
  c.rotate(-1.1 * Math.max(pop, 0.15));
  c.fillRect(-1, -2, 18, 3);
  c.restore();
}

export function trampoline(c: Ctx, t: number) {
  shadow(c, 0, 2, 26, 12);
  for (const a of [0.6, 2.2, 3.8, 5.3]) {
    const x = Math.cos(a) * 22;
    const y = Math.sin(a) * 11;
    c.fillStyle = '#4a4e5e';
    c.fillRect(x - 1.2, y - 10, 2.4, 10);
  }
  const bounce = Math.abs(Math.sin(t * 3)) * 3;
  c.fillStyle = '#2f9bff';
  c.beginPath();
  c.ellipse(0, -10, 25, 12.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#1d2b4f';
  c.beginPath();
  c.ellipse(0, -10 + bounce, 20, 9.5, 0, 0, Math.PI * 2);
  c.fill();
  // a ball bouncing on it
  const by = -16 - Math.abs(Math.sin(t * 3)) * 26;
  blob(c, 2, by, 5, '#ff5a4e');
  blob(c, 0.5, by - 1.5, 1.6, 'rgba(255,255,255,.7)');
}

export function slide(c: Ctx) {
  shadow(c, 0, 2, 30, 12);
  const [lx, ly] = along(0, 0, -0.55, 0);
  box(c, lx, ly, 0.35, 0.35, 34, '#ffc61a');
  box(c, lx, ly, 0.42, 0.42, 3, '#ff5a4e', 34);
  // ladder
  c.strokeStyle = '#9a6bff';
  c.lineWidth = 2;
  const [bx, by] = along(0, 0, -0.85, 0);
  c.beginPath();
  c.moveTo(bx - 4, by);
  c.lineTo(lx - 6, ly - 36);
  c.moveTo(bx + 3, by + 2);
  c.lineTo(lx + 1, ly - 34);
  c.stroke();
  // the chute
  const [ex, ey] = along(0, 0, 0.75, 0);
  c.fillStyle = '#3fcf6a';
  c.beginPath();
  c.moveTo(lx + 2, ly - 38);
  c.quadraticCurveTo((lx + ex) / 2, (ly + ey) / 2 - 6, ex, ey - 4);
  c.lineTo(ex + 6, ey);
  c.quadraticCurveTo((lx + ex) / 2 + 8, (ly + ey) / 2 - 2, lx + 10, ly - 34);
  c.closePath();
  c.fill();
}

export function carousel(c: Ctx, t: number) {
  shadow(c, 0, 2, 58, 26);
  c.fillStyle = '#c25a7a';
  c.beginPath();
  c.ellipse(0, -2, 54, 26, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffe7f0';
  c.beginPath();
  c.ellipse(0, -8, 52, 25, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#e0b43c';
  c.fillRect(-3, -86, 6, 80);
  // horses going round (back ones first)
  const horses = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = t * 0.6 + (i / 6) * Math.PI * 2;
    return { i, a, x: Math.cos(a) * 40, y: -8 + Math.sin(a) * 19 };
  });
  horses.sort((p, q) => p.y - q.y);
  for (const h of horses) {
    const up = Math.sin(t * 2 + h.i) * 4;
    c.strokeStyle = '#e0b43c';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(h.x, h.y);
    c.lineTo(h.x, -78 + Math.sin(h.a) * 19 * 0.4);
    c.stroke();
    const col = TOY[h.i % TOY.length];
    blob(c, h.x, h.y - 20 + up, 7, col);
    blob(c, h.x + 6 * Math.sign(-Math.sin(h.a) || 1), h.y - 26 + up, 4, col);
  }
  // striped canopy
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2;
    const a1 = ((i + 1) / 12) * Math.PI * 2;
    c.fillStyle = i % 2 ? '#fff' : '#ff5a4e';
    c.beginPath();
    c.moveTo(0, -112);
    c.lineTo(Math.cos(a0) * 58, -80 + Math.sin(a0) * 26);
    c.lineTo(Math.cos(a1) * 58, -80 + Math.sin(a1) * 26);
    c.fill();
  }
  blob(c, 0, -114, 4, '#e0b43c');
}

/** The doll's house: a big open-fronted toy house, lit room by room. */
export function dollhouse(c: Ctx, t: number) {
  shadow(c, 0, 2, 60, 28);
  box(c, 0, 0, 1.6, 1.4, 70, '#ffd1dc');
  const [, B, C, D] = corners(0, 0, 1.6, 1.4);
  const at = (p: number[], q: number[], k: number, z: number) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k - z];
  // windows on both visible walls, glowing one after another
  for (const [p, q] of [
    [D, C],
    [C, B],
  ] as const)
    for (const z of [18, 48])
      for (const k of [0.3, 0.7]) {
        const [x, y] = at(p, q, k, z);
        const lit = Math.sin(t * 0.8 + k * 5 + z) > 0;
        c.fillStyle = lit ? '#ffe9a0' : '#7a8ab0';
        c.fillRect(x - 5, y - 10, 10, 10);
        c.strokeStyle = '#fff';
        c.lineWidth = 1.2;
        c.strokeRect(x - 5, y - 10, 10, 10);
      }
  const [dx, dy] = at(D, C, 0.5, 0);
  c.fillStyle = '#9a6bff';
  c.fillRect(dx - 5, dy - 16, 10, 16);
  roof(c, 0, 0, 1.6, 1.4, 70, 34, '#ff5a4e', 0.25);
  box(c, ...along(0, 0, 0.35, -0.3), 0.18, 0.18, 22, '#ffc61a', 92);
  blob(c, 0, -106, 3, '#ffc61a');
}

/** A little steam train that runs back and forth along the tracks you laid. */
export function train(c: Ctx, t: number, left: boolean) {
  if (left) c.scale(-1, 1);
  shadow(c, 0, 0, 20, 6);
  box(c, -6, 0, 0.32, 0.22, 12, '#ff5a4e', 3);
  box(c, 6, 3, 0.28, 0.22, 16, '#2f9bff', 3);
  blob(c, -12, -20, 2.5, '#1d2b4f');
  c.fillStyle = '#1d2b4f';
  c.fillRect(-13, -26, 3, 8);
  for (const x of [-10, -2, 6, 12]) blob(c, x, 2, 2.6, '#1d2b4f');
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.8 + i / 3) % 1;
    blob(c, -12 - k * 10, -28 - k * 16, 2 + k * 4, `rgba(255,255,255,${0.8 - k * 0.8})`);
  }
}

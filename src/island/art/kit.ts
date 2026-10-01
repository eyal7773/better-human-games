import { TH, TW } from '../iso';

/**
 * Drawing helpers for the islands, in world units (a cell is TW × TH). Light
 * always comes from the upper left: tops are lightest, the left face is lit,
 * the right face is in shade.
 */

export type Ctx = CanvasRenderingContext2D;
/** Draws an item standing at (0, 0). `stage` is the growth stage, `seed` varies copies. */
/** `extra` carries item-specific detail: a waterfall's edge, a fence's links. */
export type Draw = (c: Ctx, t: number, stage: number, seed: number, extra?: number) => void;

const EX = { x: TW / 2, y: TH / 2 }; // one cell along +x
const EY = { x: -TW / 2, y: TH / 2 }; // one cell along +y

/** Mixes a #rrggbb colour toward white (k > 0) or black (k < 0). */
export function shade(hex: string, k: number) {
  const t = k > 0 ? 255 : 0;
  const a = Math.abs(k);
  const c = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - a) + t * a));
  return `rgb(${c.join(',')})`;
}

export function blob(c: Ctx, x: number, y: number, r: number, color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

/** Soft contact shadow on the ground, offset away from the light. */
export function shadow(c: Ctx, x: number, y: number, rx: number, ry = rx * 0.5) {
  c.fillStyle = 'rgba(30, 50, 40, .22)';
  c.beginPath();
  c.ellipse(x + rx * 0.18, y + ry * 0.12, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function poly(c: Ctx, pts: [number, number][], fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) c.lineTo(x, y);
  c.closePath();
  c.fill();
}

/** The four ground corners of a w × d (cells) rectangle centred on (cx, cy): back, right, front, left. */
export function corners(cx: number, cy: number, w: number, d: number): [number, number][] {
  const ax = (EX.x * w) / 2;
  const ay = (EX.y * w) / 2;
  const bx = (EY.x * d) / 2;
  const by = (EY.y * d) / 2;
  return [
    [cx - ax - bx, cy - ay - by],
    [cx + ax - bx, cy + ay - by],
    [cx + ax + bx, cy + ay + by],
    [cx - ax + bx, cy - ay + by],
  ];
}

/** A lit box: w × d cells on the ground, `z` above it, `h` tall. */
export function box(c: Ctx, cx: number, cy: number, w: number, d: number, h: number, color: string, z = 0) {
  const [A, B, C, D] = corners(cx, cy - z, w, d);
  const up = (p: [number, number]): [number, number] => [p[0], p[1] - h];
  poly(c, [D, C, up(C), up(D)], shade(color, -0.08)); // left face, lit
  poly(c, [C, B, up(B), up(C)], shade(color, -0.3)); // right face, in shade
  poly(c, [up(A), up(B), up(C), up(D)], shade(color, 0.12));
}

/** A hip roof over a w × d footprint, eaves at height z, ridge `h` above them. */
export function roof(c: Ctx, cx: number, cy: number, w: number, d: number, z: number, h: number, color: string, overhang = 0.18) {
  const [, B, C, D] = corners(cx, cy - z, w + overhang * 2, d + overhang * 2);
  const peak: [number, number] = [cx, cy - z - h];
  const ridge = Math.abs(w - d) * 0.5;
  if (ridge < 0.01) {
    poly(c, [D, C, peak], shade(color, 0.05));
    poly(c, [C, B, peak], shade(color, -0.22));
    return;
  }
  // a ridge along the longer side
  const along = w > d ? EX : EY;
  const r1: [number, number] = [peak[0] - (along.x * ridge) / 2, peak[1] - (along.y * ridge) / 2];
  const r2: [number, number] = [peak[0] + (along.x * ridge) / 2, peak[1] + (along.y * ridge) / 2];
  if (w > d) {
    poly(c, [D, C, r2, r1], shade(color, 0.05));
    poly(c, [C, B, r2], shade(color, -0.22));
  } else {
    poly(c, [D, C, r2], shade(color, 0.05));
    poly(c, [C, B, r1, r2], shade(color, -0.22));
  }
}

/** A point `u` cells along x and `v` cells along y from (cx, cy). */
export const along = (cx: number, cy: number, u: number, v: number): [number, number] => [cx + EX.x * u + EY.x * v, cy + EX.y * u + EY.y * v];

/** A filled diamond for one cell, inset by `k` (1 = the full cell). */
export function diamond(c: Ctx, cx: number, cy: number, k: number, fill: string | CanvasGradient) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(cx, cy - (TH / 2) * k);
  c.lineTo(cx + (TW / 2) * k, cy);
  c.lineTo(cx, cy + (TH / 2) * k);
  c.lineTo(cx - (TW / 2) * k, cy);
  c.closePath();
  c.fill();
}

/** Deterministic pseudo-random in [0, 1) from integers. */
export function hash(a: number, b = 0, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

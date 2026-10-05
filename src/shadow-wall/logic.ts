import type { Stars } from '../shared/progress';

/**
 * Shadow on the Wall — the physics and rules, without canvas.
 *
 * Seen from the front: the wall at depth 0, the puppet at depth ZO, the
 * flashlight at depth zl > ZO (towards you). A point p of the puppet lands on
 * the wall at  s = L + (p − L) · m,  with magnification  m = zl / (zl − ZO).
 * Light close to the puppet → a huge shadow; light far → almost true size.
 * Moving the light left moves the shadow right. Horizontal positions are in
 * wall widths (0…1); the light sits at the puppet's height.
 */

export const ZO = 1;
export const ZL_MIN = 1.08;
export const ZL_MAX = 4.2;
/** A shadow at most this magnified counts as "its real size". */
export const TRUE_M = 1.45;
/** …when its centre is this close to the frame (wall widths). */
export const FRAME_TOL = 0.05;
/** Stay framed this long (s) to confirm. */
export const FRAME_HOLD = 0.8;

export const magnification = (zl: number) => zl / (zl - ZO);

/** Where a puppet point at x lands on the wall. */
export const project = (x: number, lightX: number, m: number) => lightX + (x - lightX) * m;

/** 0 (floor of the drag area, near the wall) … 1 (bottom, near you) → light depth. */
export const depthAt = (k: number) => ZL_MIN + Math.max(0, Math.min(1, k)) * (ZL_MAX - ZL_MIN);

/** How much of the monster is left: 1 at full scare, down to `floor` near true size. */
export function monsterness(m: number, floor = 0) {
  // Exactly zero at true size: the frame locks there, and nothing of the monster may hide the object.
  return Math.max(floor, Math.min(1, (m - TRUE_M) / (4 - TRUE_M)));
}

/** Blur of the shadow's edge, in wall widths: the flashlight is not a point. */
export const penumbra = (m: number) => 0.004 + (m - 1) * 0.006;

export function inFrame(shadowX: number, m: number, frameX: number, tol = FRAME_TOL) {
  return m <= TRUE_M && Math.abs(shadowX - frameX) <= tol;
}

/** Where to put the light (x) so the shadow of a puppet at objX lands on targetX, at magnification m. */
export const lightFor = (objX: number, targetX: number, m: number) => (objX * m - targetX) / (m - 1);

export type Response = 'let' | 'boundary' | 'roar';

export interface ShadowResult {
  framed: boolean;
  /** Both lenses were used before the first response. */
  looked: boolean;
  firstChoice: Response | null;
  right: Response;
}

/** ⭐ real size · ⭐ looked through both lenses first · ⭐ a fitting response, first time. */
export function starsFor(r: ShadowResult): Stars {
  return [r.framed, r.framed && r.looked, r.framed && r.firstChoice === r.right];
}

// ---------------------------------------------------------------- levels

export interface ShadowLevel {
  id: string;
  /** Something real is there: the right answer is a calm boundary. */
  real: boolean;
  /** Which scenes can come up (their difficulty). */
  diff: [number, number];
  /** How far the puppet may stand from the middle of the wall ('edge': well off to one side). */
  puppet: number | 'edge';
  /** How far the true-size frame may sit from the puppet. */
  offset: number;
  /** How close the shadow must sit to the frame's centre, and for how long (s). */
  tol: number;
  hold: number;
  /** Steady hand: how much a hurried flashlight trembles (0 = never). */
  jitter: 0 | 1 | 2 | 3;
  /** The shadow sways slowly, at breathing pace. */
  breathe?: boolean;
}

/**
 * Twelve levels. Each draws a scene that fits the player's home (content
 * library); three of them always hold something real.
 */
export const LEVELS: ShadowLevel[] = [
  { id: 'l1', real: false, diff: [1, 1], puppet: 0, offset: 0.03, tol: 0.06, hold: 0.8, jitter: 0 },
  { id: 'l2', real: false, diff: [1, 2], puppet: 0.05, offset: 0.08, tol: 0.06, hold: 0.8, jitter: 0 },
  { id: 'l3', real: false, diff: [1, 2], puppet: 0.1, offset: 0.12, tol: 0.05, hold: 0.9, jitter: 0 },
  { id: 'l4', real: true, diff: [1, 4], puppet: 0.08, offset: 0.1, tol: 0.05, hold: 0.9, jitter: 0 },
  { id: 'l5', real: false, diff: [1, 3], puppet: 0.12, offset: 0.14, tol: 0.045, hold: 1, jitter: 1 },
  { id: 'l6', real: false, diff: [2, 3], puppet: 'edge', offset: 0.14, tol: 0.045, hold: 1, jitter: 1 },
  { id: 'l7', real: false, diff: [1, 3], puppet: 0.15, offset: 0.15, tol: 0.04, hold: 1.1, jitter: 2 },
  { id: 'l8', real: true, diff: [1, 4], puppet: 0.15, offset: 0.15, tol: 0.04, hold: 1.1, jitter: 2 },
  { id: 'l9', real: false, diff: [2, 4], puppet: 0.18, offset: 0.15, tol: 0.035, hold: 1.2, jitter: 2, breathe: true },
  { id: 'l10', real: false, diff: [1, 4], puppet: 'edge', offset: 0.15, tol: 0.035, hold: 1.2, jitter: 2, breathe: true },
  { id: 'l11', real: true, diff: [1, 4], puppet: 0.18, offset: 0.15, tol: 0.035, hold: 1.2, jitter: 2, breathe: true },
  { id: 'l12', real: false, diff: [2, 4], puppet: 0.2, offset: 0.15, tol: 0.03, hold: 1.3, jitter: 3, breathe: true },
];

/** Breathing sway: 4 s in, 4 s out, this far either way (wall widths). */
export const BREATH_PERIOD = 8;
export const BREATH_SWAY = 0.025;

/** Light positions the flashlight can take (across the wall). */
const U_MIN = 0.02;
const U_MAX = 0.98;

/** Can the shadow of a puppet at objX be laid on frameX, both with the light far back and just at true size? */
export function reachable(objX: number, frameX: number) {
  return [magnification(ZL_MAX), TRUE_M - 0.01].every((m) => {
    const u = lightFor(objX, frameX, m);
    return u >= U_MIN + 0.02 && u <= U_MAX - 0.02;
  });
}

export interface Placement {
  /** Where the puppet stands, the frame hangs, and the flashlight starts (wall widths; k = depth). */
  objX: number;
  frameX: number;
  lightU: number;
  lightK: number;
}

/** Lays out a level: puppet and frame within its ranges (always reachable), and a flashlight that starts close and somewhere new. */
export function place(l: ShadowLevel, rnd = Math.random): Placement {
  const side = rnd() < 0.5 ? -1 : 1;
  for (let i = 0; i < 60; i++) {
    const objX = 0.5 + (l.puppet === 'edge' ? side * (0.17 + rnd() * 0.05) : (rnd() * 2 - 1) * l.puppet);
    // Edge levels hang the frame further out: the shadow has to travel the "wrong" way.
    const away = l.puppet === 'edge' ? side : rnd() < 0.5 ? -1 : 1;
    const frameX = objX + away * l.offset * (0.6 + rnd() * 0.4);
    if (reachable(objX, frameX)) return { objX, frameX, lightU: 0.15 + rnd() * 0.7, lightK: rnd() * 0.1 };
  }
  return { objX: 0.5, frameX: 0.5, lightU: 0.5, lightK: 0.08 };
}

/** How much a hurried flashlight trembles (wall widths), from how fast it moves (wall widths per second). */
export function tremble(level: 0 | 1 | 2 | 3, speed: number) {
  if (!level) return 0;
  const calm = 0.9 - level * 0.12; // faster than this starts to shake
  return Math.max(0, Math.min(1, (speed - calm) / 1.2)) * (0.02 + level * 0.012);
}

/** Levels used to be the eight scenes themselves; their progress moves to the level in the same place. */
const OLD_IDS = ['juice', 'marker', 'late', 'phone', 'traffic', 'mug', 'joke', 'email'];

/** Moves old scene-keyed progress to level ids, once. True when something changed. */
export function migrateLevels(p: { done: string[]; stars: Record<string, Stars>; rewarded: Record<string, Stars> }) {
  let changed = false;
  OLD_IDS.forEach((old, i) => {
    const id = LEVELS[i].id;
    if (p.done.includes(old)) {
      p.done = p.done.filter((x) => x !== old);
      if (!p.done.includes(id)) p.done.push(id);
      changed = true;
    }
    for (const rec of [p.stars, p.rewarded])
      if (rec[old]) {
        rec[id] = rec[old];
        delete rec[old];
        changed = true;
      }
  });
  return changed;
}

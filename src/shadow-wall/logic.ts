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
  return Math.max(floor, Math.min(1, (m - 1.4) / 2.6));
}

/** Blur of the shadow's edge, in wall widths: the flashlight is not a point. */
export const penumbra = (m: number) => 0.004 + (m - 1) * 0.006;

export function inFrame(shadowX: number, m: number, frameX: number) {
  return m <= TRUE_M && Math.abs(shadowX - frameX) <= FRAME_TOL;
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

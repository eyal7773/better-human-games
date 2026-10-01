/**
 * Isometric grid maths, in world units. A cell's diamond is TW wide and TH
 * tall; screen = iso(gx, gy) is the diamond's centre when gx/gy are cell
 * centres (x + .5). Pure, no DOM.
 */

export const TW = 64;
export const TH = 32;
/** The full grid; an island's land is a centred square inside it that grows with each expansion. */
export const GRID = 12;
export const START_SIZE = 8;

export const iso = (gx: number, gy: number) => ({ x: ((gx - gy) * TW) / 2, y: ((gx + gy) * TH) / 2 });

/** Inverse of iso: continuous grid coordinates. */
export const unIso = (x: number, y: number) => ({ gx: y / TH + x / TW, gy: y / TH - x / TW });

/** Land bounds [lo, hi) for a number of expansions. */
export function landBounds(expansions: number) {
  const lo = (GRID - START_SIZE) / 2 - expansions;
  return { lo, hi: GRID - lo };
}

/** Footprint along x/y. Flipping mirrors the item, which swaps its axes. */
export const footprint = (def: { w: number; d: number }, flip: boolean) => (flip ? { w: def.d, d: def.w } : { w: def.w, d: def.d });

export function cellsOf(x: number, y: number, w: number, d: number) {
  const out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([x + i, y + j]);
  return out;
}

/** The ground point an item stands on: the centre of its footprint. */
export const anchor = (x: number, y: number, w: number, d: number) => iso(x + w / 2, y + d / 2);

/** Painter's order: further back first. */
export const depth = (x: number, y: number, w: number, d: number) => x + w + y + d + (x + w) * 0.001;

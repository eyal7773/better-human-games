import { cellsOf, footprint, landBounds } from './iso';

/**
 * The islands' rules as pure functions: what you own, where things may go,
 * what land costs, and how the old one-screen island maps onto the grid.
 * Everything here works on plain data so it can be tested without a DOM.
 */

export type Kind = 'item' | 'ground' | 'ambient';

export interface Rule {
  id: string;
  isle: string;
  kind: Kind;
  cost: number;
  /** How many you can own, placed or stored. Infinity for ground tiles. */
  cap: number;
  w: number;
  d: number;
  /** 'is': this ground tile is water. 'on': this item must stand on water (a bridge). */
  water?: 'is' | 'on';
  /** Must touch the island's front edge (a waterfall pours over it). */
  edge?: boolean;
}

export interface Placed {
  id: string;
  isle: string;
  x: number;
  y: number;
  flip: boolean;
  /** The wallet's `growth` when it was planted; trees grow from there. */
  at: number;
}

export interface IslandState {
  placed: Placed[];
  /** Items put away, by id. Bringing them back is free. */
  stored: Record<string, number>;
  /** Expansions bought, by island. */
  land: Record<string, number>;
}

export type Rules = (id: string) => Rule | undefined;

/** Land expansions per island: 8×8 → 10×10 → 12×12. */
export const EXPANSIONS: Record<string, number[]> = {
  garden: [250, 700],
  shore: [300, 800],
  hill: [400, 1000],
  forest: [600, 1500],
};

/** How many of each item an island has (placed only; the shed doesn't count). */
export function counter(s: IslandState, isle: string) {
  const n = new Map<string, number>();
  for (const p of s.placed) if (p.isle === isle) n.set(p.id, (n.get(p.id) ?? 0) + 1);
  return (id: string) => n.get(id) ?? 0;
}

export const expansionsOf = (s: IslandState, isle: string) => s.land[isle] ?? 0;

/** The price of the next expansion, or null when the island is as big as it gets. */
export function nextExpansion(s: IslandState, isle: string) {
  return EXPANSIONS[isle]?.[expansionsOf(s, isle)] ?? null;
}

export const ownedCount = (s: IslandState, id: string) => s.placed.filter((p) => p.id === id).length + (s.stored[id] ?? 0);

export const canOwnMore = (s: IslandState, r: Rule) => ownedCount(s, r.id) < r.cap;

export function cellsOfPlaced(p: Placed, r: Rule) {
  const f = footprint(r, p.flip);
  return cellsOf(p.x, p.y, f.w, f.d);
}

/** What stands on a cell: the ground tile and the item (either may be missing). */
export function at(s: IslandState, rules: Rules, isle: string, x: number, y: number, ignore?: Placed) {
  let ground: Placed | undefined;
  let item: Placed | undefined;
  for (const p of s.placed) {
    if (p === ignore || p.isle !== isle) continue;
    const r = rules(p.id);
    if (!r || r.kind === 'ambient') continue;
    if (!cellsOfPlaced(p, r).some(([cx, cy]) => cx === x && cy === y)) continue;
    if (r.kind === 'ground') ground = p;
    else item = p;
  }
  return { ground, item };
}

const isWater = (rules: Rules, p?: Placed) => !!p && rules(p.id)?.water === 'is';

export type Refusal = 'land' | 'taken' | 'water' | 'needs-water' | 'edge' | 'under';

/** Why `r` can't go at x/y, or null if it can. `ignore` is the item being moved. */
export function refusal(s: IslandState, rules: Rules, r: Rule, isle: string, x: number, y: number, flip: boolean, ignore?: Placed): Refusal | null {
  const { lo, hi } = landBounds(expansionsOf(s, isle));
  const f = footprint(r, flip);
  const cells = cellsOf(x, y, f.w, f.d);
  if (cells.some(([cx, cy]) => cx < lo || cy < lo || cx >= hi || cy >= hi)) return 'land';
  if (r.edge && x + f.w !== hi && y + f.d !== hi) return 'edge';
  for (const [cx, cy] of cells) {
    const here = at(s, rules, isle, cx, cy, ignore);
    if (r.kind === 'ground') {
      // A new tile replaces another tile, but never slips under an item.
      if (here.item) return 'under';
      if (here.ground && here.ground.id === r.id) return 'taken';
      // Water under a bridge has to stay water.
      continue;
    }
    if (here.item) return 'taken';
    if (r.water === 'on' && !isWater(rules, here.ground)) return 'needs-water';
    if (r.water !== 'on' && isWater(rules, here.ground)) return 'water';
  }
  return null;
}

/** The free spot nearest to x/y (by rings), or null if there is none. */
export function findSpot(s: IslandState, rules: Rules, r: Rule, isle: string, x: number, y: number, flip: boolean, ignore?: Placed) {
  for (let ring = 0; ring < 14; ring++) {
    let best: { x: number; y: number; d: number } | null = null;
    for (let dx = -ring; dx <= ring; dx++)
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        if (refusal(s, rules, r, isle, x + dx, y + dy, flip, ignore)) continue;
        const d = dx * dx + dy * dy;
        if (!best || d < best.d) best = { x: x + dx, y: y + dy, d };
      }
    if (best) return { x: best.x, y: best.y };
  }
  return null;
}

/** Positions of the old island's 15 fixed slots: u across, v back → front, both in [-1, 1]. */
const OLD_SLOTS: [number, number][] = [
  [-0.55, -0.3], [0.48, -0.42], [0.02, -0.62], [-0.12, 0.12], [0.56, 0.22],
  [-0.72, 0.3], [0.28, 0.52], [-0.4, 0.6], [0.8, -0.08], [-0.86, -0.02],
  [0.3, -0.08], [0.02, 0.74], [-0.6, 0.1], [0.78, 0.46], [0.62, 0.9],
];

/** Where an old slot lands on the starting 8×8 garden: across = x − y, depth = x + y. */
export function oldSlotCell(slot: number) {
  const [u, v] = OLD_SLOTS[slot] ?? [0, 0];
  const { lo, hi } = landBounds(0);
  const mid = (lo + hi - 1) / 2;
  // the old island was wide and shallow; spread it over the whole diamond
  const across = u * 6;
  const deep = v * 4.5;
  const clampCell = (n: number) => Math.min(hi - 1, Math.max(lo, Math.round(n)));
  return { x: clampCell(mid + (deep + across) / 2), y: clampCell(mid + (deep - across) / 2) };
}

/**
 * Brings the old island's items onto the garden, as close as possible to where
 * they stood. Nothing bought is ever lost: anything that can't fit is stored.
 */
export function migrateOld(s: IslandState, rules: Rules, old: { id: string; slot: number; plantedAt: number }[]) {
  for (const o of old) {
    const r = rules(o.id);
    if (!r) continue;
    if (r.kind === 'ambient') {
      if (!s.placed.some((p) => p.id === r.id)) s.placed.push({ id: r.id, isle: r.isle, x: 0, y: 0, flip: false, at: o.plantedAt });
      continue;
    }
    const want = oldSlotCell(o.slot);
    const spot = findSpot(s, rules, r, r.isle, want.x, want.y, false);
    if (spot) s.placed.push({ id: r.id, isle: r.isle, x: spot.x, y: spot.y, flip: false, at: o.plantedAt });
    else s.stored[r.id] = (s.stored[r.id] ?? 0) + 1;
  }
  return s;
}

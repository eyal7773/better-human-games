import { describe, expect, it } from 'vitest';
import { findSpot, nextExpansion, oldSlotCell, ownedCount, refusal, type IslandState, type Rule } from './economy';
import { firstIsland, sanitizeIsland } from './save';
import { iso, landBounds, unIso } from './iso';

const R: Record<string, Rule> = {
  tree: { id: 'tree', isle: 'garden', kind: 'item', cost: 30, cap: 4, w: 1, d: 1 },
  bench: { id: 'bench', isle: 'garden', kind: 'item', cost: 50, cap: 2, w: 2, d: 1 },
  pond: { id: 'pond', isle: 'garden', kind: 'item', cost: 90, cap: 1, w: 2, d: 2 },
  stream: { id: 'stream', isle: 'garden', kind: 'ground', cost: 8, cap: Infinity, w: 1, d: 1, water: 'is' },
  path: { id: 'path', isle: 'garden', kind: 'ground', cost: 5, cap: Infinity, w: 1, d: 1 },
  bridge: { id: 'bridge', isle: 'garden', kind: 'item', cost: 120, cap: 2, w: 1, d: 1, water: 'on' },
  waterfall: { id: 'waterfall', isle: 'garden', kind: 'item', cost: 140, cap: 1, w: 1, d: 1, edge: true },
  fireflies: { id: 'fireflies', isle: 'garden', kind: 'ambient', cost: 60, cap: 1, w: 0, d: 0 },
};
const rules = (id: string) => R[id];
const empty = (): IslandState => ({ placed: [], stored: {}, land: {} });
const put = (s: IslandState, id: string, x: number, y: number, flip = false) => {
  const p = { id, isle: 'garden', x, y, flip, at: 0 };
  s.placed.push(p);
  return p;
};

describe('iso', () => {
  it('round-trips screen and grid coordinates', () => {
    const p = iso(3.5, 7.25);
    const g = unIso(p.x, p.y);
    expect(g.gx).toBeCloseTo(3.5);
    expect(g.gy).toBeCloseTo(7.25);
  });

  it('starts with a centred 8×8 and grows a ring per expansion', () => {
    expect(landBounds(0)).toEqual({ lo: 2, hi: 10 });
    expect(landBounds(2)).toEqual({ lo: 0, hi: 12 });
  });
});

describe('placement', () => {
  it('keeps items on the land and off each other', () => {
    const s = empty();
    expect(refusal(s, rules, R.tree, 'garden', 1, 5, false)).toBe('land');
    expect(refusal(s, rules, R.tree, 'garden', 2, 5, false)).toBeNull();
    put(s, 'bench', 4, 4);
    expect(refusal(s, rules, R.tree, 'garden', 5, 4, false)).toBe('taken');
    expect(refusal(s, rules, R.tree, 'garden', 4, 5, false)).toBeNull();
  });

  it('swaps a flipped item’s footprint', () => {
    const s = empty();
    put(s, 'bench', 4, 4, true); // now 1 wide, 2 deep
    expect(refusal(s, rules, R.tree, 'garden', 4, 5, false)).toBe('taken');
    expect(refusal(s, rules, R.tree, 'garden', 5, 4, false)).toBeNull();
    // the right edge refuses a bench that would hang over it
    expect(refusal(s, rules, R.bench, 'garden', 9, 2, false)).toBe('land');
    expect(refusal(s, rules, R.bench, 'garden', 9, 2, true)).toBeNull();
  });

  it('lets an item ignore itself while it is being moved', () => {
    const s = empty();
    const p = put(s, 'pond', 4, 4);
    expect(refusal(s, rules, R.pond, 'garden', 5, 5, false)).toBe('taken');
    expect(refusal(s, rules, R.pond, 'garden', 5, 5, false, p)).toBeNull();
  });

  it('keeps items out of streams, except bridges which need one', () => {
    const s = empty();
    put(s, 'stream', 5, 5);
    put(s, 'path', 6, 5);
    expect(refusal(s, rules, R.tree, 'garden', 5, 5, false)).toBe('water');
    expect(refusal(s, rules, R.tree, 'garden', 6, 5, false)).toBeNull(); // paths are fine underfoot
    expect(refusal(s, rules, R.bridge, 'garden', 5, 5, false)).toBeNull();
    expect(refusal(s, rules, R.bridge, 'garden', 6, 5, false)).toBe('needs-water');
  });

  it('never slips a tile under an item, nor doubles one', () => {
    const s = empty();
    put(s, 'tree', 3, 3);
    put(s, 'path', 4, 3);
    expect(refusal(s, rules, R.path, 'garden', 3, 3, false)).toBe('under');
    expect(refusal(s, rules, R.path, 'garden', 4, 3, false)).toBe('taken');
    expect(refusal(s, rules, R.stream, 'garden', 4, 3, false)).toBeNull(); // replaces the path
  });

  it('puts a waterfall only on the front edges', () => {
    const s = empty();
    expect(refusal(s, rules, R.waterfall, 'garden', 5, 5, false)).toBe('edge');
    expect(refusal(s, rules, R.waterfall, 'garden', 9, 5, false)).toBeNull();
    expect(refusal(s, rules, R.waterfall, 'garden', 5, 9, false)).toBeNull();
    expect(refusal(s, rules, R.waterfall, 'garden', 2, 5, false)).toBe('edge');
  });

  it('finds the nearest free spot', () => {
    const s = empty();
    put(s, 'tree', 5, 5);
    const spot = findSpot(s, rules, R.tree, 'garden', 5, 5, false)!;
    expect(Math.max(Math.abs(spot.x - 5), Math.abs(spot.y - 5))).toBe(1);
    expect(findSpot(s, rules, R.waterfall, 'garden', 5, 5, false)).toMatchObject({ x: expect.any(Number) });
  });

  it('counts stored items as owned, and prices expansions until the island is full size', () => {
    const s = empty();
    put(s, 'tree', 3, 3);
    s.stored.tree = 2;
    expect(ownedCount(s, 'tree')).toBe(3);
    expect(nextExpansion(s, 'garden')).toBe(250);
    s.land.garden = 2;
    expect(nextExpansion(s, 'garden')).toBeNull();
  });
});

describe('the old island', () => {
  it('maps every old slot onto the starting garden', () => {
    const { lo, hi } = landBounds(0);
    for (let i = 0; i < 15; i++) {
      const c = oldSlotCell(i);
      expect(c.x).toBeGreaterThanOrEqual(lo);
      expect(c.y).toBeLessThan(hi);
    }
  });

  it('carries every bought item over, without overlaps', () => {
    const old = [
      { id: 'tree', slot: 0, plantedAt: 2 },
      { id: 'tree', slot: 1, plantedAt: 4 },
      { id: 'pond', slot: 3, plantedAt: 0 },
      { id: 'bench', slot: 9, plantedAt: 0 },
      { id: 'waterfall', slot: 14, plantedAt: 0 },
      { id: 'fireflies', slot: -1, plantedAt: 0 },
      { id: 'gone-item', slot: 2, plantedAt: 0 },
    ];
    const s = firstIsland({ placed: old, muted: true, zen: 99 }, rules);
    expect(s.muted).toBe(true);
    expect(s.placed.map((p) => p.id).sort()).toEqual(['bench', 'fireflies', 'pond', 'tree', 'tree', 'waterfall']);
    expect(s.placed.find((p) => p.id === 'tree' && p.at === 4)).toBeTruthy();
    const taken = new Set<string>();
    for (const p of s.placed.filter((q) => q.id !== 'fireflies')) {
      const r = R[p.id];
      for (let i = 0; i < r.w; i++)
        for (let j = 0; j < r.d; j++) {
          const k = `${p.x + i},${p.y + j}`;
          expect(taken.has(k)).toBe(false);
          taken.add(k);
        }
    }
    const wf = s.placed.find((p) => p.id === 'waterfall')!;
    expect(wf.x === 9 || wf.y === 9).toBe(true);
  });

  it('drops what it doesn’t understand from a stored save', () => {
    const s = sanitizeIsland({ placed: [{ id: 'tree', x: 3, y: 3 }, { id: 'nope', x: 1, y: 1 }, { id: 'tree', x: 'a' }], stored: { tree: 2, nope: 1, bench: -1 }, clock: 'noon' }, rules);
    expect(s.placed).toHaveLength(1);
    expect(s.stored).toEqual({ tree: 2 });
    expect(s.clock).toBe('auto');
  });
});

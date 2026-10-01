import { describe, expect, it } from 'vitest';
import { findPath } from './path';
import { openIsles } from '../shared/isles';

describe('findPath', () => {
  const grid = (rows: string[]) => (x: number, y: number) => rows[y]?.[x] === '.';

  it('walks straight across open ground', () => {
    const p = findPath({ x: 0, y: 0 }, { x: 3, y: 0 }, grid(['....']))!;
    expect(p).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
  });

  it('goes around walls without cutting corners', () => {
    const walk = grid(['.#.', '.#.', '...']);
    const p = findPath({ x: 0, y: 0 }, { x: 2, y: 0 }, walk)!;
    expect(p.at(-1)).toEqual({ x: 2, y: 0 });
    for (const c of p) expect(walk(c.x, c.y)).toBe(true);
    expect(p.some((c) => c.y === 2)).toBe(true);
  });

  it('gives up when the goal is blocked or walled off', () => {
    expect(findPath({ x: 0, y: 0 }, { x: 1, y: 0 }, grid(['.#']))).toBeNull();
    expect(findPath({ x: 0, y: 0 }, { x: 2, y: 0 }, grid(['.#.', '##.']))).toBeNull();
  });
});

describe('openIsles', () => {
  it('opens an island by its game or by lifetime zen', () => {
    expect(openIsles(0, () => false)).toEqual(['garden']);
    expect(openIsles(0, (g) => g === 'words-in-flight')).toEqual(['garden', 'hill']);
    expect(openIsles(950, () => false)).toEqual(['garden', 'shore', 'hill']);
    expect(openIsles(3000, () => false)).toHaveLength(5);
    expect(openIsles(5000, () => false)).toHaveLength(6);
    expect(openIsles(0, (g) => g === 'catch-me-3d')).toEqual(['garden', 'toys']);
  });
});

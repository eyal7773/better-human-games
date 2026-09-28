import { describe, expect, it } from 'vitest';
import { starsFor, newStarCount, mergeStars, ZEN_PER_STAR, type LevelStats } from './stars';
import { recordLevel, sanitize, unlocked } from './save';

const stats = (o: Partial<LevelStats> = {}): LevelStats => ({
  completed: true,
  noticedInTime: 0,
  boils: 0,
  cleanBreaths: 0,
  slips: 0,
  ...o,
});

describe('starsFor', () => {
  it('gives nothing for an unfinished level', () => {
    expect(starsFor(stats({ completed: false, noticedInTime: 3, cleanBreaths: 2 }), true)).toEqual([false, false, false]);
  });
  it('rewards noticing in time, or never boiling', () => {
    expect(starsFor(stats({ boils: 1 }), true)[1]).toBe(false);
    expect(starsFor(stats({ boils: 1, noticedInTime: 1 }), true)[1]).toBe(true);
    expect(starsFor(stats({ boils: 0 }), true)[1]).toBe(true);
  });
  it('rewards a clean breath where there is breathing', () => {
    expect(starsFor(stats({ cleanBreaths: 0 }), true)[2]).toBe(false);
    expect(starsFor(stats({ cleanBreaths: 1 }), true)[2]).toBe(true);
  });
  it('in level 1 (no breathing) rewards catching without a slip instead', () => {
    expect(starsFor(stats({ slips: 0 }), false)[2]).toBe(true);
    expect(starsFor(stats({ slips: 1 }), false)[2]).toBe(false);
  });
});

describe('zen for new stars only', () => {
  it('counts only stars never rewarded', () => {
    expect(newStarCount(undefined, [true, true, false])).toBe(2);
    expect(newStarCount([true, false, false], [true, true, false])).toBe(1);
    expect(newStarCount([true, true, true], [true, true, true])).toBe(0);
  });
  it('merges stars as a union', () => {
    expect(mergeStars([true, false, false], [false, false, true])).toEqual([true, false, true]);
  });
  it('recordLevel pays once per star and never again', () => {
    const s = sanitize({});
    expect(recordLevel(s, 1, [true, true, false])).toBe(2 * ZEN_PER_STAR);
    expect(recordLevel(s, 1, [true, true, false])).toBe(0);
    expect(recordLevel(s, 1, [true, false, true])).toBe(ZEN_PER_STAR);
    expect(s.stars['1']).toEqual([true, true, true]);
    expect(s.done).toEqual([1]);
  });
});

describe('save', () => {
  it('unlocks a level when the previous one is done', () => {
    const s = sanitize({});
    expect(unlocked(s, 1)).toBe(true);
    expect(unlocked(s, 2)).toBe(false);
    recordLevel(s, 1, [true, false, false]);
    expect(unlocked(s, 2)).toBe(true);
  });
  it('sanitizes junk', () => {
    const s = sanitize({ done: [1, 1, -2, 'x'] as never, tricks: ['hide', 'nope'] as never, baseline: -1, endlessBest: NaN, stars: { 1: [1, 0] } as never });
    expect(s.done).toEqual([1]);
    expect(s.tricks).toEqual(['hide']);
    expect(s.baseline).toBeNull();
    expect(s.endlessBest).toBe(0);
    expect(s.stars['1']).toEqual([true, false, false]);
  });
});

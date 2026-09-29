import { describe, expect, it } from 'vitest';
import { bump, discover, nextLevel, recordLevel, sanitizeProgress, unlocked, ZEN_PER_STAR } from './progress';

describe('progress', () => {
  it('sanitizes junk into a usable save', () => {
    const p = sanitizeProgress({ muted: 'yes', stars: { a: [1, 0, 1], b: 'x' }, best: { x: -3, y: 7.8 }, album: ['a', 'a', 3], done: null });
    expect(p.muted).toBe(false);
    expect(p.stars).toEqual({ a: [true, false, true] });
    expect(p.best).toEqual({ y: 7 });
    expect(p.album).toEqual(['a']);
    expect(p.done).toEqual([]);
    expect(sanitizeProgress(null).v).toBe(1);
  });

  it('pays zen only for stars earned for the first time', () => {
    const p = sanitizeProgress({});
    expect(recordLevel(p, 'a', [true, false, false])).toBe(ZEN_PER_STAR);
    expect(recordLevel(p, 'a', [true, true, false])).toBe(ZEN_PER_STAR);
    expect(recordLevel(p, 'a', [true, true, false])).toBe(0);
    expect(p.stars.a).toEqual([true, true, false]);
    expect(p.done).toEqual(['a']);
  });

  it('opens levels in order and points "continue" at the first undone one', () => {
    const p = sanitizeProgress({ done: ['a'] });
    const ids = ['a', 'b', 'c'];
    expect(unlocked(p, ids, 'a')).toBe(true);
    expect(unlocked(p, ids, 'b')).toBe(true);
    expect(unlocked(p, ids, 'c')).toBe(false);
    expect(unlocked(p, ids, 'zz')).toBe(false);
    expect(nextLevel(p, ids)).toBe('b');
    p.done.push('b', 'c');
    expect(nextLevel(p, ids)).toBe('c');
  });

  it('keeps personal bests and the album', () => {
    const p = sanitizeProgress({});
    expect(bump(p, 'k', 3)).toBe(true);
    expect(bump(p, 'k', 2)).toBe(false);
    expect(p.best.k).toBe(3);
    expect(discover(p, 'x')).toBe(true);
    expect(discover(p, 'x')).toBe(false);
  });
});

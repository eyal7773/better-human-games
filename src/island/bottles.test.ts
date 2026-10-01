import { describe, expect, it } from 'vitest';
import { MAX_BOTTLES, NOTES, openBottle, sanitizeBeach, washUp, weatherOf, type Beach } from './bottles';

const fresh = (): Beach => ({ day: '', pending: [], letters: [] });

describe('bottles', () => {
  it('washes up one to three bottles once a day, on open islands', () => {
    const b = washUp(fresh(), '2026-10-1', ['garden', 'shore']);
    expect(b.pending.length).toBeGreaterThanOrEqual(1);
    expect(b.pending.length).toBeLessThanOrEqual(3);
    for (const p of b.pending) expect(['garden', 'shore']).toContain(p.isle);
    const n = b.pending.length;
    washUp(b, '2026-10-1', ['garden']);
    expect(b.pending).toHaveLength(n);
  });

  it('never keeps more than three waiting, however many days are skipped', () => {
    const b = fresh();
    for (let d = 1; d <= 20; d++) washUp(b, `2026-10-${d}`, ['garden']);
    expect(b.pending.length).toBe(MAX_BOTTLES);
  });

  it('is the same for everyone on the same day', () => {
    expect(washUp(fresh(), '2026-11-5', ['garden', 'hill'])).toEqual(washUp(fresh(), '2026-11-5', ['garden', 'hill']));
  });

  it('prefers letters not read yet, and collects each once', () => {
    const b = fresh();
    for (let d = 1; d <= 40; d++) {
      washUp(b, `2026-12-${d}`, ['garden']);
      for (const p of [...b.pending]) openBottle(b, p.id);
    }
    expect(new Set(b.letters).size).toBe(b.letters.length);
    expect(b.letters.length).toBe(NOTES.length);
    expect(openBottle(b, 'nope')).toBeNull();
  });

  it('drops what it doesn’t understand', () => {
    const b = sanitizeBeach({ day: 3, pending: [{ id: 'a', isle: 'garden', note: 1 }, { id: 'b', note: 999 }, null], letters: [1, 1, -2, 'x'] });
    expect(b).toEqual({ day: '', pending: [{ id: 'a', isle: 'garden', note: 1 }], letters: [1] });
  });

  it('keeps the weather mild and steady through the day', () => {
    const kinds = new Set<string>();
    for (let d = 1; d <= 60; d++) {
      const w = weatherOf(`2026-${(d % 12) + 1}-${d}`, 'garden', 8);
      kinds.add(w);
      expect(weatherOf(`2026-${(d % 12) + 1}-${d}`, 'garden', 8)).toBe(w);
    }
    expect(kinds.has('clear')).toBe(true);
    expect(kinds.has('leaves')).toBe(false);
  });
});

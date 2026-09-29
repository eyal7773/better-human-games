import { describe, expect, it } from 'vitest';
import { AUDIBLE, EDGE, MIN_GAP, clarity, foundStrong, hasBlame, lockable, moodOf, placeStations, stationAt, starsFor, type Station } from './logic';
import { SCENES } from './content';

const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

describe('inner radio', () => {
  it('places stations apart and inside the dial', () => {
    for (let k = 0; k < 200; k++) {
      const st = placeStations(['hurt', 'fear', 'tired', 'sad', 'lonely', 'shame'], {});
      const pos = st.map((s) => s.pos).sort((a, b) => a - b);
      expect(pos[0]).toBeGreaterThanOrEqual(EDGE - 1e-9);
      expect(pos[pos.length - 1]).toBeLessThanOrEqual(1 - EDGE + 1e-9);
      for (let i = 1; i < pos.length; i++) expect(pos[i] - pos[i - 1]).toBeGreaterThanOrEqual(MIN_GAP - 1e-9);
    }
    const st = placeStations(['hurt', 'fear'], { hurt: 0.9 }, seq([0.5, 0.1, 0.9]));
    expect(st.find((s) => s.id === 'hurt')!.weight).toBe(0.9);
    expect(st.find((s) => s.id === 'fear')!.weight).toBe(0);
  });

  it('is pure static away from stations and clear on a strong one', () => {
    const st: Station[] = [{ id: 'hurt', pos: 0.5, weight: 0.9 }];
    expect(clarity(0.5 + AUDIBLE * 1.01, st)).toBe(0);
    expect(clarity(0.5, st)).toBeCloseTo(0.9);
    expect(stationAt(0.51, st)?.id).toBe('hurt');
    expect(stationAt(0.6, st)).toBeNull();
  });

  it('has no wrong feelings, only faint ones', () => {
    expect(lockable({ id: 'hurt', pos: 0, weight: 0.35 })).toBe(true);
    expect(lockable({ id: 'hurt', pos: 0, weight: 0.1 })).toBe(false);
    const st: Station[] = [
      { id: 'hurt', pos: 0.2, weight: 0.8 },
      { id: 'lonely', pos: 0.5, weight: 0.7 },
      { id: 'sad', pos: 0.8, weight: 0.4 },
    ];
    expect(foundStrong(st, ['hurt'])).toBe(false);
    expect(foundStrong(st, ['lonely', 'hurt'])).toBe(true);
  });

  it('reads blame louder than kindness', () => {
    expect(moodOf([1, 1, 1])).toBeGreaterThan(0.5);
    expect(moodOf([1, 1, -1])).toBeLessThan(moodOf([1, 1, 1]));
    expect(moodOf([-1, 1, -1, -1])).toBe(-1);
    expect(hasBlame([1, 0, 1])).toBe(false);
  });

  it('gives stars for the sentence, never for speed', () => {
    const stations: Station[] = [{ id: 'hurt', pos: 0.5, weight: 0.9 }, { id: 'tired', pos: 0.2, weight: 0.35 }];
    expect(starsFor({ locked: ['tired'], stations, firstTry: [-1, 1, 1, 1] })).toEqual([true, false, false]);
    expect(starsFor({ locked: ['hurt'], stations, firstTry: [1, 1, 0, 1] })).toEqual([true, true, true]);
    expect(starsFor({ locked: [], stations, firstTry: [] })).toEqual([false, false, false]);
  });

  it('has scenes that can be solved', () => {
    for (const s of SCENES) {
      const strong = s.stations.filter((id) => (s.weights[id] ?? 0) >= 0.6);
      expect(strong.length, s.id).toBeGreaterThan(0);
      expect(strong.length, s.id).toBeLessThanOrEqual(2);
      for (const id of Object.keys(s.weights)) expect(s.stations, s.id).toContain(id);
      expect(s.when[0].v).toBe(-1);
      expect(s.because[0].v).toBe(-1);
      expect(s.when.some((t) => t.v === 1) && s.because.some((t) => t.v === 1)).toBe(true);
    }
  });
});

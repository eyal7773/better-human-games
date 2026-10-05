import { describe, expect, it } from 'vitest';
import { FRAME_TOL, LEVELS, TRUE_M, ZL_MAX, ZL_MIN, depthAt, inFrame, lightFor, magnification, migrateLevels, monsterness, place, project, starsFor, tremble } from './logic';
import { SCENES } from './content';

describe('shadow physics', () => {
  it('magnifies more the closer the light is to the puppet', () => {
    expect(magnification(ZL_MIN)).toBeGreaterThan(10);
    expect(magnification(2)).toBeCloseTo(2);
    expect(magnification(ZL_MAX)).toBeLessThan(TRUE_M);
    expect(depthAt(-1)).toBe(ZL_MIN);
    expect(depthAt(2)).toBe(ZL_MAX);
  });

  it('throws the shadow away from the light', () => {
    // Light left of the puppet → shadow lands right of it, and further the bigger it is.
    expect(project(0.5, 0.3, 1.5)).toBeGreaterThan(0.5);
    expect(project(0.5, 0.3, 3)).toBeGreaterThan(project(0.5, 0.3, 1.5));
    expect(project(0.5, 0.5, 4)).toBe(0.5);
  });

  it('keeps some monster when something real is there', () => {
    expect(monsterness(6)).toBe(1);
    expect(monsterness(1.3)).toBe(0);
    expect(monsterness(1.3, 0.4)).toBe(0.4);
    expect(monsterness(TRUE_M)).toBe(0);
    expect(monsterness(TRUE_M - 0.001)).toBe(0);
  });

  it('only counts true size inside the frame', () => {
    expect(inFrame(0.5, 1.4, 0.5 + FRAME_TOL * 0.9)).toBe(true);
    expect(inFrame(0.5, 1.4, 0.5 + FRAME_TOL * 1.1)).toBe(false);
    expect(inFrame(0.5, 2, 0.5)).toBe(false);
  });

  it('lays out every level so the frame can always be reached, within its ranges', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const l of LEVELS)
      for (let i = 0; i < 300; i++) {
        const p = place(l, rnd);
        for (const m of [magnification(ZL_MAX), TRUE_M - 0.01]) {
          const u = lightFor(p.objX, p.frameX, m);
          expect(u, l.id).toBeGreaterThan(0.02);
          expect(u, l.id).toBeLessThan(0.98);
          expect(project(p.objX, u, m)).toBeCloseTo(p.frameX);
        }
        if (l.puppet !== 'edge') expect(Math.abs(p.objX - 0.5), l.id).toBeLessThanOrEqual(l.puppet + 1e-9);
        expect(Math.abs(p.frameX - p.objX), l.id).toBeLessThanOrEqual(l.offset + 1e-9);
        // The flashlight starts close, so the shadow starts as a monster.
        expect(magnification(depthAt(p.lightK)), l.id).toBeGreaterThan(3);
      }
  });

  it('gets harder as it goes: tighter frames, longer holds, a steadier hand', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].tol).toBeLessThanOrEqual(LEVELS[i - 1].tol);
      expect(LEVELS[i].hold).toBeGreaterThanOrEqual(LEVELS[i - 1].hold);
      expect(LEVELS[i].jitter).toBeGreaterThanOrEqual(LEVELS[i - 1].jitter);
    }
  });

  it('only shakes a hurried hand', () => {
    expect(tremble(0, 5)).toBe(0);
    expect(tremble(2, 0.3)).toBe(0);
    expect(tremble(2, 3)).toBeGreaterThan(tremble(1, 3));
    expect(tremble(3, 1.5)).toBeGreaterThan(0);
  });

  it('stars: real size, both lenses, a fitting first answer', () => {
    expect(starsFor({ framed: true, looked: true, firstChoice: 'let', right: 'let' })).toEqual([true, true, true]);
    expect(starsFor({ framed: true, looked: false, firstChoice: 'roar', right: 'let' })).toEqual([true, false, false]);
    expect(starsFor({ framed: false, looked: true, firstChoice: 'let', right: 'let' })).toEqual([false, false, false]);
  });

  it('has real boundaries in the mix, but mostly small things', () => {
    const real = SCENES.filter((s) => s.real);
    expect(real.length).toBeGreaterThanOrEqual(LEVELS.filter((l) => l.real).length);
    expect(real.every((s) => s.right === 'boundary' && s.threat > 10)).toBe(true);
    expect(SCENES.filter((s) => !s.real).every((s) => s.threat < 10)).toBe(true);
  });
});

describe('levels', () => {
  it('moves old scene-keyed progress to the level in the same place', () => {
    const p = { done: ['juice', 'phone', 'l9'], stars: { juice: [true, true, false] as [boolean, boolean, boolean] }, rewarded: { phone: [true, false, false] as [boolean, boolean, boolean] } };
    expect(migrateLevels(p)).toBe(true);
    expect(p.done.sort()).toEqual(['l1', 'l4', 'l9']);
    expect(p.stars).toEqual({ l1: [true, true, false] });
    expect(p.rewarded).toEqual({ l4: [true, false, false] });
    expect(migrateLevels(p)).toBe(false);
  });
});

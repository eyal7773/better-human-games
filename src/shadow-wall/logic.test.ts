import { describe, expect, it } from 'vitest';
import { FRAME_TOL, LEVELS, TRUE_M, ZL_MAX, ZL_MIN, depthAt, inFrame, lightFor, magnification, migrateLevels, monsterness, project, starsFor } from './logic';
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

  it('can frame every scene with the light on the floor', () => {
    for (const s of SCENES) {
      const target = 0.5 + s.frameDx;
      for (const m of [magnification(ZL_MAX), TRUE_M - 0.01]) {
        const u = lightFor(0.5, target, m);
        expect(u, s.id).toBeGreaterThan(0.02);
        expect(u, s.id).toBeLessThan(0.98);
        expect(project(0.5, u, m)).toBeCloseTo(target);
      }
    }
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

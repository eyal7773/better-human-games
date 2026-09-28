import { describe, expect, it } from 'vitest';
import { LEVELS, MECHANICS, newTricks, TRICKS } from './levels';

describe('levels', () => {
  it('are numbered 1..n in order', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(LEVELS.map((_, i) => i + 1));
  });
  it('each need at least one catch', () => {
    for (const l of LEVELS) expect(l.catches).toBeGreaterThan(0);
  });
  it('only use known tricks', () => {
    for (const l of LEVELS) for (const t of l.tricks) expect(TRICKS).toContain(t);
  });
  it('each teach exactly one new mechanic', () => {
    const seen = LEVELS.map((l) => l.mechanic);
    expect(new Set(seen).size).toBe(LEVELS.length);
    for (const m of seen) expect(MECHANICS).toContain(m);
  });
  it('bring in at most one or two new tricks at a time (a trick pair shares one level idea)', () => {
    for (const l of LEVELS) expect(newTricks(l).length).toBeLessThanOrEqual(l.id === 3 ? 2 : 1);
  });
  it('introduce breathing before the notice button, and the notice button before its helper fades', () => {
    const firstBoil = LEVELS.find((l) => l.forcedBoil)!.id;
    const firstNotice = LEVELS.find((l) => l.notice)!.id;
    expect(firstBoil).toBeLessThan(firstNotice);
    const lastPulse = Math.max(...LEVELS.filter((l) => l.noticePulse).map((l) => l.id));
    expect(LEVELS.find((l) => l.id === lastPulse + 1)?.notice).toBe(true);
    for (const l of LEVELS) if (l.noticePulse) expect(l.notice).toBe(true);
  });
  it('level 1 has no forced boil and trips more often', () => {
    const [one, two] = LEVELS;
    expect(one.forcedBoil).toBe(false);
    expect(one.tripPerSec).toBeGreaterThan(two.tripPerSec);
  });
});

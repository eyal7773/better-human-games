import { describe, expect, it } from 'vitest';
import {
  CANNON_COST,
  ENERGY_START,
  LEVELS,
  POP_GAIN,
  RECOIL,
  SHIELD_COST,
  THREAT_DAMAGE,
  TRAVEL,
  endlessWave,
  fire,
  looksThreat,
  newState,
  schedule,
  shield,
  spawn,
  standing,
  starsFor,
  step,
  type Kind,
} from './logic';

const add = (s = newState(), kind: Kind = 'bubble', disguised = false) => ({
  s,
  x: spawn(s, { kind, item: 0, pillar: 'family', angle: 0, speed: 1, disguised }),
});

describe('the fortress', () => {
  it('lets bubbles pop on the wall and gives energy back', () => {
    const { s } = add();
    s.energy = 50;
    step(s, TRAVEL + 0.01);
    expect(s.letGo).toBe(1);
    expect(s.energy).toBeCloseTo(Math.min(100, 50 + TRAVEL + 0.01 + POP_GAIN), 0);
    expect(s.hassles).toHaveLength(1); // arrived this step…
    step(s, 0.01);
    expect(s.hassles).toHaveLength(0); // …and gone after.
    expect(standing(s)).toBe(true);
  });

  it('makes the cannon cost energy and crack the relationships', () => {
    const { s, x } = add();
    expect(fire(s, x)).toBeNull();
    expect(s.energy).toBe(ENERGY_START - CANNON_COST);
    expect(s.wall).toBe(100 - RECOIL);
    expect(fire(s, x)).toBe('gone');
    s.energy = 10;
    expect(fire(s, add(s).x)).toBe('energy');
  });

  it('hurts a pillar when a threat gets through without a shield', () => {
    const { s } = add(undefined, 'threat');
    step(s, TRAVEL + 1);
    expect(s.pillars.family).toBe(100 - THREAT_DAMAGE);
    expect(s.hits).toBe(1);
    add(s, 'threat');
    step(s, TRAVEL + 1);
    add(s, 'threat');
    step(s, TRAVEL + 1);
    expect(standing(s)).toBe(false);
  });

  it('blocks threats with a shield, and counts a shield on a bubble as wasted', () => {
    const { s, x } = add(undefined, 'threat');
    expect(shield(s, x)).toBeNull();
    expect(s.energy).toBe(ENERGY_START - SHIELD_COST);
    expect(s.blocked).toBe(1);
    const b = add(s).x;
    shield(s, b);
    expect(s.shieldsWasted).toBe(1);
    step(s, TRAVEL + 1);
    expect(s.pillars.family).toBe(100);
  });

  it('reveals disguised threats up close or when inspected', () => {
    const { x } = add(undefined, 'threat', true);
    expect(looksThreat(x)).toBe(false);
    x.dist = 0.5;
    expect(looksThreat(x)).toBe(true);
    x.dist = 0.9;
    x.inspected = true;
    expect(looksThreat(x)).toBe(true);
  });

  it('lets the patient player win: energy wasted on bubbles leaves none for a threat', () => {
    const s = newState();
    for (let i = 0; i < 3; i++) fire(s, add(s).x);
    const threat = add(s, 'threat').x;
    expect(shield(s, threat)).toBe('energy');
  });

  it('schedules waves with threats never first', () => {
    for (let k = 0; k < 50; k++) {
      const plan = schedule({ n: 6, threats: 2 });
      expect(plan).toHaveLength(6);
      expect(plan.filter((p) => p.kind === 'threat')).toHaveLength(2);
      expect(plan[0].kind).toBe('bubble');
      for (let i = 1; i < plan.length; i++) expect(plan[i].at).toBeGreaterThan(plan[i - 1].at);
    }
  });

  it('stars: standing, calm hand, boundaries where they mattered', () => {
    const lv = LEVELS[1];
    const s = newState();
    expect(starsFor(s, LEVELS[0], true)).toEqual([true, true, true]);
    s.threats = 1;
    expect(starsFor(s, lv, true)).toEqual([true, true, false]);
    s.blocked = 1;
    s.shots = 2;
    expect(starsFor(s, lv, true)).toEqual([true, false, true]);
    s.wall = 0;
    expect(starsFor(s, lv, true)).toEqual([false, false, false]);
    expect(starsFor(newState(), lv, false)[0]).toBe(false);
  });

  it('grows endless waves with a ceiling on speed', () => {
    expect(endlessWave(10).wave.n).toBeGreaterThan(endlessWave(0).wave.n);
    expect(endlessWave(100).speed).toBe(2.2);
    expect(endlessWave(0).wave.threats).toBeGreaterThanOrEqual(1);
  });
});

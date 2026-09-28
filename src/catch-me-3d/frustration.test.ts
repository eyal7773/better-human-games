import { describe, expect, it } from 'vitest';
import {
  BoilGate,
  BREATH_GAP_MS,
  Calibrator,
  F,
  FIRST_BREATH_MS,
  Frustration,
  Grip,
  LIFTED_MS,
  MAX_WAIT_MS,
  QUIET_MS,
  type GateState,
} from './frustration';

describe('Frustration', () => {
  it('rises on misses, almosts and slips', () => {
    const m = new Frustration(2);
    m.miss();
    expect(m.f).toBe(F.miss);
    m.miss(true);
    expect(m.f).toBe(F.miss + F.almost);
    m.slip();
    expect(m.f).toBe(F.miss + F.almost + F.slip);
  });

  it('stays within 0..100', () => {
    const m = new Frustration(2);
    for (let i = 0; i < 40; i++) m.slip();
    expect(m.f).toBe(100);
    expect(m.boiling).toBe(true);
    m.update(100, 1e9);
    expect(m.f).toBe(0);
  });

  it('stays boiling once it reached 100, until cooled by a breath', () => {
    const m = new Frustration(2);
    m.f = 100;
    m.update(0.01, 0);
    m.update(10, 1e9);
    expect(m.f).toBeLessThan(100);
    expect(m.boiling).toBe(true);
    m.cool();
    expect(m.boiling).toBe(false);
  });

  it('warms while chasing and cools once the finger rests', () => {
    const m = new Frustration(2);
    m.tap(0);
    m.update(1, 500); // tapped half a second ago: still chasing
    expect(m.f).toBeCloseTo(F.chasePerSec);
    m.f = 50;
    m.update(1, QUIET_MS + 1);
    expect(m.f).toBeCloseTo(50 - F.calmPerSec);
  });

  it('flags a tap within 250ms of the previous one as rage', () => {
    const m = new Frustration(2);
    expect(m.tap(0)).toBe(false);
    expect(m.tap(200)).toBe(true);
    expect(m.f).toBe(F.rage);
  });

  it('flags rage relative to the player’s own baseline', () => {
    // Taps 300ms apart: 6-7 taps in the 2s window ≈ 3.3/s.
    const calm = new Frustration(2); // 2.5× = 5/s → not rage
    const slow = new Frustration(1); // 2.5× = 2.5/s → rage
    let rageCalm = false;
    let rageSlow = false;
    for (let t = 0; t <= 2000; t += 300) {
      rageCalm = calm.tap(t) || rageCalm;
      rageSlow = slow.tap(t) || rageSlow;
    }
    expect(rageCalm).toBe(false);
    expect(rageSlow).toBe(true);
  });

  it('classifies noticing by F', () => {
    const m = new Frustration(2);
    m.f = 44;
    expect(m.notice()).toBe('early');
    m.f = 45;
    expect(m.notice()).toBe('inTime');
    m.f = 85;
    expect(m.notice()).toBe('inTime');
    m.f = 86;
    expect(m.notice()).toBe('late');
  });

  it('shields only above 75', () => {
    const m = new Frustration(2);
    m.f = 75;
    expect(m.shield).toBe(false);
    m.f = 76;
    expect(m.shield).toBe(true);
  });

  it('remembers the peak tap rate for the mirror line, until cooled', () => {
    const m = new Frustration(2);
    for (let t = 0; t < 1000; t += 100) m.tap(t);
    expect(m.peakRate).toBeGreaterThanOrEqual(5);
    m.cool();
    expect(m.peakRate).toBe(0);
    expect(m.f).toBe(0);
  });
});

describe('Calibrator', () => {
  it('measures taps per second over the first ten seconds', () => {
    const c = new Calibrator(0);
    for (let t = 0; t < 10000; t += 400) c.tap(t); // 25 taps
    expect(c.result(9000)).toBeNull();
    expect(c.result(10000)).toBeCloseTo(2.5);
  });
  it('gives no baseline from too few taps', () => {
    const c = new Calibrator(0);
    c.tap(100);
    expect(c.result(20000)).toBeNull();
  });
  it('ignores taps after the window', () => {
    const c = new Calibrator(0);
    for (let t = 0; t < 10000; t += 1000) c.tap(t); // 10
    for (let t = 11000; t < 20000; t += 50) c.tap(t);
    expect(c.result(20000)).toBe(1);
  });
});

describe('BoilGate', () => {
  const base: GateState = {
    now: 20000,
    chaseStart: 0,
    lastBreathEnd: null,
    fingerDown: false,
    fingerUpAt: 0,
    celebrating: false,
    boiling: true,
  };

  it('waits for the first 10 seconds of chase', () => {
    const g = new BoilGate();
    expect(g.check({ ...base, now: FIRST_BREATH_MS - 1 })).toBe(false);
    expect(g.check({ ...base, now: FIRST_BREATH_MS })).toBe(true);
  });

  it('keeps 8 seconds between breaths', () => {
    const g = new BoilGate();
    expect(g.check({ ...base, lastBreathEnd: base.now - BREATH_GAP_MS + 1 })).toBe(false);
    expect(g.check({ ...base, lastBreathEnd: base.now - BREATH_GAP_MS })).toBe(true);
  });

  it('never interrupts a catch celebration', () => {
    const g = new BoilGate();
    expect(g.check({ ...base, celebrating: true })).toBe(false);
  });

  it('does nothing unless boiling', () => {
    expect(new BoilGate().check({ ...base, boiling: false })).toBe(false);
  });

  it('waits for a lifted finger (+250ms)…', () => {
    const g = new BoilGate();
    expect(g.check({ ...base, fingerUpAt: base.now - LIFTED_MS + 1 })).toBe(false);
    expect(g.check({ ...base, now: base.now + 1, fingerUpAt: base.now - LIFTED_MS + 1 })).toBe(true);
  });

  it('…but at most 1.5 seconds', () => {
    const g = new BoilGate();
    const down = { ...base, fingerDown: true };
    expect(g.check(down)).toBe(false);
    expect(g.check({ ...down, now: base.now + MAX_WAIT_MS - 1 })).toBe(false);
    expect(g.check({ ...down, now: base.now + MAX_WAIT_MS })).toBe(true);
  });
});

describe('Grip (shield + safety net)', () => {
  it('always catches without the shield', () => {
    const g = new Grip();
    expect(g.resolve(false)).toBe('catch');
    expect(g.slips).toBe(0);
  });
  it('lets the next catch count after two slips in a row', () => {
    const g = new Grip();
    expect(g.resolve(true)).toBe('slip');
    expect(g.resolve(true)).toBe('slip');
    expect(g.resolve(true)).toBe('catch');
    expect(g.resolve(true)).toBe('slip');
    expect(g.slips).toBe(3);
  });
  it('a real catch resets the streak', () => {
    const g = new Grip();
    g.resolve(true);
    g.resolve(false);
    expect(g.slipsInRow).toBe(0);
  });
});

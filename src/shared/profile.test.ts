import { describe, expect, it } from 'vitest';
import { heSelf, MAX_HOT, sanitize, weightedShuffle, type Profile } from './profile';

const p = (o: Partial<Profile> = {}): Profile => sanitize({ status: 'done', ...o });

describe('weightedShuffle', () => {
  it('keeps every item exactly once', () => {
    const out = weightedShuffle([1, 2, 3, 4], () => 1);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
  });
  it('puts heavier items first more often', () => {
    let first = 0;
    for (let i = 0; i < 2000; i++) if (weightedShuffle(['light', 'heavy'], (x) => (x === 'heavy' ? 2 : 1))[0] === 'heavy') first++;
    // With weights 2:1 the heavy item leads about two thirds of the time.
    expect(first / 2000).toBeGreaterThan(0.6);
    expect(first / 2000).toBeLessThan(0.73);
  });
});

describe('sanitize', () => {
  it('fills defaults for an empty store', () => {
    expect(sanitize({})).toMatchObject({ status: 'new', address: 'x', household: [], hot: [], rewarded: false });
  });
  it('drops unknown or invalid values', () => {
    const out = sanitize({
      status: 'weird' as Profile['status'],
      address: 'q' as Profile['address'],
      shape: -3,
      household: ['partner', 'aliens', 'partner'] as Profile['household'],
      hot: ['mess', 'chores', 'money', 'noise'],
    });
    expect(out.status).toBe('new');
    expect(out.address).toBe('x');
    expect(out.shape).toBe(0);
    expect(out.household).toEqual(['partner']);
    expect(out.hot).toHaveLength(MAX_HOT);
  });
});

describe('heSelf', () => {
  it('agrees with how the player wants to be addressed', () => {
    expect(heSelf('מרגיש', 'מרגישה', p({ address: 'm' }))).toBe('מרגיש');
    expect(heSelf('מרגיש', 'מרגישה', p({ address: 'f' }))).toBe('מרגישה');
    expect(heSelf('מרגיש', 'מרגישה', p({ address: 'x' }))).toBe('מרגיש/ה');
  });
});

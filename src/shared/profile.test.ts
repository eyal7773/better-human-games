import { describe, expect, it } from 'vitest';
import { allowed, fits, MAX_HOT, sanitize, weight, weightedShuffle, type Profile } from './profile';
import type { Tag } from './tags';

const p = (o: Partial<Profile> = {}): Profile => sanitize({ status: 'done', ...o });

describe('allowed', () => {
  it('lets neutral content through for everyone', () => {
    expect(allowed(['partner', 'chores'], p({ address: 'x' }))).toBe(true);
  });
  it('keeps gender-specific content for the matching form of address only', () => {
    expect(allowed(['women', 'partner'], p({ address: 'f' }))).toBe(true);
    expect(allowed(['women', 'partner'], p({ address: 'm' }))).toBe(false);
    expect(allowed(['men'], p({ address: 'x' }))).toBe(false);
  });
  it('applies even without a finished profile', () => {
    expect(allowed(['women'], p({ status: 'new', address: 'x' }))).toBe(false);
  });
});

describe('fits', () => {
  it('fits everything allowed when the home is not described', () => {
    expect(fits(['parent-teen'], p({ status: 'skipped', household: ['partner'] }))).toBe(true);
    expect(fits(['parent-teen'], p({ household: [] }))).toBe(true);
  });
  it('needs a shared audience once the home is described', () => {
    const home = p({ household: ['partner', 'no-kids'] });
    expect(fits(['partner', 'money'], home)).toBe(true);
    expect(fits(['parent-teen', 'curfew' as Tag], home)).toBe(false);
  });
  it('fits content without an audience tag', () => {
    expect(fits(['men', 'work-life'], p({ address: 'm', household: ['grandparent'] }))).toBe(true);
  });
  it('never fits disallowed gender content', () => {
    expect(fits(['women', 'partner'], p({ address: 'x', household: ['partner'] }))).toBe(false);
  });
});

describe('weight', () => {
  it('doubles hot topics', () => {
    const home = p({ hot: ['money'] });
    expect(weight(['partner', 'money'], home)).toBe(2);
    expect(weight(['partner', 'chores'], home)).toBe(1);
  });
});

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

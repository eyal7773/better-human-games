import { describe, expect, it } from 'vitest';
import { agree, sanitize, type Profile } from '../profile';
import { eligible, markSeen, query, spread, type Meta, type Seen } from './index';
import { checkEntry, PERSONAS } from './classify';

const p = (o: Partial<Profile> = {}): Profile => sanitize({ status: 'done', address: 'x', ...o });
const m = (id: string, o: Partial<Meta> = {}): Meta => ({ id, with: ['none'], topics: ['household'], setting: 'home', diff: 1, ...o });
const fresh = (): Seen => ({ n: 0, seen: {} });
const rng = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('eligible', () => {
  it('keeps kid content away from a home without kids', () => {
    const teen = m('t', { with: ['teen'] });
    expect(eligible(teen, PERSONAS['lives alone'])).toBe(false);
    expect(eligible(teen, PERSONAS['parent of a teen'])).toBe(true);
  });
  it('lets everyone have universal content', () => {
    for (const persona of Object.values(PERSONAS)) expect(eligible(m('boss', { with: ['boss'] }), persona)).toBe(true);
  });
  it('fits any of several "others"', () => {
    const shoes = m('s', { with: ['child', 'partner'] });
    expect(eligible(shoes, PERSONAS['couple, no kids'])).toBe(true);
    expect(eligible(shoes, PERSONAS['lives alone'])).toBe(false);
  });
  it('needs the required home too', () => {
    const x = m('x', { with: ['partner'], requires: ['parent-young-child'] });
    expect(eligible(x, PERSONAS['couple, no kids'])).toBe(false);
    expect(eligible(x, PERSONAS['parent of little kids'])).toBe(true);
  });
  it('a single parent gets kid content without ticking every age', () => {
    expect(eligible(m('y', { with: ['young-child'] }), p({ household: ['single-parent'] }))).toBe(true);
  });
  it('gender content only for that form of address, profile or not', () => {
    const w = m('w', { gender: 'women' });
    expect(eligible(w, p({ address: 'f' }))).toBe(true);
    expect(eligible(w, p({ address: 'x' }))).toBe(false);
    expect(eligible(w, sanitize({ address: 'm' }))).toBe(false);
  });
  it('everything (but gender) without a described home', () => {
    expect(eligible(m('t', { with: ['teen'] }), PERSONAS['no profile'])).toBe(true);
  });
});

describe('query', () => {
  const pool = [m('a'), m('b'), m('c'), m('d', { with: ['teen'] })];
  it('never falls back to content that does not fit', () => {
    const got = query(pool, { count: 10, profile: PERSONAS['lives alone'], seen: fresh(), random: rng() });
    expect(got.map((x) => x.id).sort()).toEqual(['a', 'b', 'c']);
  });
  it('prefers never-seen, then the longest unseen', () => {
    const seen: Seen = { n: 5, seen: { a: 5, b: 1 } };
    const got = query(pool, { count: 3, profile: PERSONAS['lives alone'], seen, random: rng() });
    expect(got.map((x) => x.id)).toContain('c');
    expect(got.map((x) => x.id).indexOf('b')).toBeLessThan(got.map((x) => x.id).indexOf('a'));
  });
  it('filters by difficulty and exclusions', () => {
    const got = query([m('e', { diff: 1 }), m('f', { diff: 3 }), m('g', { diff: 3 })], { count: 5, diff: [2, 3], exclude: ['g'], seen: fresh() });
    expect(got.map((x) => x.id)).toEqual(['f']);
  });
  it('caps hot topics at half, unless there is nothing else', () => {
    const hot = Array.from({ length: 8 }, (_, i) => m(`h${i}`, { topics: ['money'] }));
    const cold = Array.from({ length: 8 }, (_, i) => m(`c${i}`));
    const me = p({ household: ['no-kids'], hot: ['money'] });
    for (let s = 1; s < 20; s++) {
      const got = query([...hot, ...cold], { count: 6, profile: me, seen: fresh(), random: rng(s) });
      expect(got.filter((x) => x.topics.includes('money')).length).toBeLessThanOrEqual(3);
    }
    expect(query(hot, { count: 6, profile: me, seen: fresh() })).toHaveLength(6);
  });
  it('at most one heavy item, and none when gentle', () => {
    const heavy = Array.from({ length: 5 }, (_, i) => m(`x${i}`, { heavy: true }));
    const light = Array.from({ length: 5 }, (_, i) => m(`l${i}`));
    const got = query([...heavy, ...light], { count: 5, seen: fresh(), random: rng() });
    expect(got.filter((x) => x.heavy)).toHaveLength(1);
    expect(query([...heavy, ...light], { count: 5, gentle: true, seen: fresh() }).filter((x) => x.heavy)).toHaveLength(0);
  });
  it('without a home, gentle levels lean to content for everyone', () => {
    const kids = Array.from({ length: 10 }, (_, i) => m(`k${i}`, { with: ['young-child'] }));
    const all = Array.from({ length: 10 }, (_, i) => m(`u${i}`, { with: ['friend'] }));
    let universal = 0;
    for (let s = 1; s < 40; s++) universal += query([...kids, ...all], { count: 4, gentle: true, profile: PERSONAS['no profile'], seen: fresh(), random: rng(s) }).filter((x) => x.id.startsWith('u')).length;
    expect(universal / (39 * 4)).toBeGreaterThan(0.65);
  });
});

describe('spread', () => {
  it('avoids the same "other" twice in a row when it can', () => {
    const got = spread([m('a', { with: ['teen'] }), m('b', { with: ['teen'] }), m('c', { with: ['partner'] })]);
    expect(got.map((x) => x.with[0])).toEqual(['teen', 'partner', 'teen']);
  });
});

describe('markSeen', () => {
  it('ticks the counter and remembers when', () => {
    const s = markSeen(['a'], fresh(), false);
    markSeen(['b'], s, false);
    expect(s).toEqual({ n: 2, seen: { a: 1, b: 2 } });
  });
});

describe('agree', () => {
  it('picks the player’s form, or the slash form', () => {
    const t = 'אני {מרגיש|מרגישה}, {יכול|יכולה}, תתמסד{|י}';
    expect(agree(t, p({ address: 'm' }))).toBe('אני מרגיש, יכול, תתמסד');
    expect(agree(t, p({ address: 'f' }))).toBe('אני מרגישה, יכולה, תתמסדי');
    expect(agree(t, p({ address: 'x' }))).toBe('אני מרגיש/ה, יכול/ה, תתמסד/י');
    expect(agree('{אתה|את|אתם}', p({ address: 'x' }))).toBe('אתם');
  });
});

describe('checkEntry', () => {
  it('catches text about kids that reaches homes without kids', () => {
    expect(checkEntry(m('bad', { with: ['boss'] }), ['Your boss calls while the kids are fighting.'])).not.toEqual([]);
    expect(checkEntry(m('bad2', { with: ['friend'] }), ['הילדים צועקים'])).not.toEqual([]);
    expect(checkEntry(m('ok', { with: ['kids'] }), ['The kids are fighting.'])).toEqual([]);
  });
  it('catches kid topics and unknown tags', () => {
    expect(checkEntry(m('hw', { topics: ['homework'] }), ['x'])).not.toEqual([]);
    expect(checkEntry(m('u', { topics: ['nope' as never] }), ['x'])).not.toEqual([]);
  });
  it('does not mistake look-alike Hebrew words', () => {
    expect(checkEntry(m('w'), ['שבת בבוקר', 'בן הזוג', 'זה לא הוגן', 'פתרון משותף', 'אהבת אותו'])).toEqual(['w: mentions a partner (“בן הזוג”) but reaches homes without them']);
  });
});

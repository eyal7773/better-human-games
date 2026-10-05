import { load, store } from '../storage';
import { profile as currentProfile, weightedShuffle, type Address, type Profile } from '../profile';
import type { GenderTag, HouseholdTag, TopicTag } from '../tags';

/**
 * The content library: every situation in every game says who it happens
 * with, and one query picks what fits the player's home. See
 * docs/content-library-spec.md.
 */

/** Who's on the other side of the situation. */
export type Other =
  | 'young-child' // 0–6
  | 'child' // 6–12
  | 'teen'
  | 'teen-girl'
  | 'kids' // several kids, or a kid of any age
  | 'partner'
  | 'partner-f'
  | 'partner-m'
  | 'ageing-parent'
  | 'grandchild'
  | 'family' // extended family: in-laws, grown siblings, cousins
  | 'boss'
  | 'coworker'
  | 'friend'
  | 'neighbor'
  | 'roommate'
  | 'stranger' // drivers, queues, customer service
  | 'none'; // no one: traffic, a dead battery

export type Setting = 'home' | 'work' | 'road' | 'public' | 'online';
export type Diff = 1 | 2 | 3 | 4 | 5;

export interface Meta {
  /** Stable forever: history, albums and saves lean on it. */
  id: string;
  /** Any of these (the situation fits a home with any one of them). */
  with: Other[];
  /** Also needed in the player's home, any of — for situations about the player's own setup. */
  requires?: HouseholdTag[];
  /** Only when the situation is truly specific to it; never a fallback. */
  gender?: GenderTag;
  topics: TopicTag[];
  setting: Setting;
  diff: Diff;
  /** Emotionally loaded: kept out of first levels, at most one per level. */
  heavy?: boolean;
}

const KIDS: HouseholdTag[] = ['parent-young-child', 'parent-school-age', 'parent-teen', 'single-parent'];

/** Which homes each "other" belongs to; null = it happens to everyone. */
export const AUDIENCE: Record<Other, HouseholdTag[] | null> = {
  'young-child': ['parent-young-child', 'single-parent'],
  child: ['parent-school-age', 'single-parent'],
  teen: ['parent-teen', 'single-parent'],
  'teen-girl': ['parent-teen', 'single-parent'],
  kids: KIDS,
  partner: ['partner'],
  'partner-f': ['partner'],
  'partner-m': ['partner'],
  'ageing-parent': ['adult-child'],
  grandchild: ['grandparent'],
  roommate: ['roommates'],
  family: null,
  boss: null,
  coworker: null,
  friend: null,
  neighbor: null,
  stranger: null,
  none: null,
};
export const OTHERS = Object.keys(AUDIENCE) as Other[];

/** Happens to everyone, whatever their home. */
export const universal = (m: Pick<Meta, 'with'>) => m.with.some((o) => AUDIENCE[o] === null);

const ADDRESS_GENDER: Record<Address, GenderTag | null> = { f: 'women', m: 'men', x: null };

/** The home is described: from here on, content must fit it. */
export const described = (p: Profile) => p.status === 'done' && p.household.length > 0;

/** Kids (or grandkids) around — or a home not described yet, which gets everything. */
export const kidsAround = (p: Profile = currentProfile) =>
  !described(p) || p.household.some((t) => KIDS.includes(t) || t === 'grandparent');

/** Can this player get this item at all? */
export function eligible(m: Meta, p: Profile = currentProfile): boolean {
  if (m.gender && ADDRESS_GENDER[p.address] !== m.gender) return false;
  if (!described(p)) return true;
  const home = p.household;
  if (m.requires?.length && !m.requires.some((t) => home.includes(t))) return false;
  return m.with.some((o) => {
    const a = AUDIENCE[o];
    return a === null || a.some((t) => home.includes(t));
  });
}

// ---------------------------------------------------------------- history

const KEY = 'bhg.library.v1';
const MAX_SEEN = 2000;

/** When each item was last shown, as a global play counter (no clock needed). */
export interface Seen {
  n: number;
  seen: Record<string, number>;
}

export const loadSeen = (): Seen => {
  const raw = load<Seen>(KEY, { n: 0, seen: {} });
  const seen: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.seen ?? {})) if (typeof v === 'number') seen[k] = v;
  return { n: typeof raw.n === 'number' ? raw.n : 0, seen };
};

/** Marks items as shown now (one play = one tick) and drops the oldest past the cap. */
export function markSeen(ids: readonly string[], s: Seen = loadSeen(), persist = true): Seen {
  s.n++;
  for (const id of ids) s.seen[id] = s.n;
  const all = Object.entries(s.seen);
  if (all.length > MAX_SEEN) {
    all.sort((a, b) => a[1] - b[1]);
    for (const [id] of all.slice(0, all.length - MAX_SEEN)) delete s.seen[id];
  }
  if (persist) store(KEY, s);
  return s;
}

// ---------------------------------------------------------------- query

export interface QueryOpts {
  count: number;
  /** Inclusive range of content difficulty. */
  diff?: [number, number];
  /** First levels of a game: no heavy content, and without a home, "everyone" content first. */
  gentle?: boolean;
  /** Ids to leave out (e.g. already used this run). */
  exclude?: readonly string[];
  profile?: Profile;
  seen?: Seen;
  random?: () => number;
}

/**
 * Picks `count` items for this player: only eligible ones; never-seen first,
 * then the longest-unseen; hot topics weighted up but at most half; at most
 * one heavy item; and no two in a row with the same "other" when avoidable.
 * Returns fewer only when the eligible pool itself is smaller.
 */
export function query<T extends Meta>(pool: readonly T[], o: QueryOpts): T[] {
  const p = o.profile ?? currentProfile;
  const s = o.seen ?? loadSeen();
  const random = o.random ?? Math.random;
  const [lo, hi] = o.diff ?? [1, 5];
  const skip = new Set(o.exclude ?? []);
  const items = pool.filter((m) => m.diff >= lo && m.diff <= hi && !skip.has(m.id) && eligible(m, p) && !(o.gentle && m.heavy));
  const isHot = (m: Meta) => m.topics.some((t) => p.hot.includes(t));
  const preferUniversal = o.gentle && !described(p);
  const w = (m: Meta) => (isHot(m) ? 2 : 1) * (preferUniversal && universal(m) ? 3 : 1);

  const fresh = weightedShuffle(
    items.filter((m) => !(m.id in s.seen)),
    w,
    random,
  );
  // Seen ones: oldest first; a random tie-break keeps equal ages from always coming out in pool order.
  const stale = items
    .filter((m) => m.id in s.seen)
    .map((m) => ({ m, k: s.seen[m.id] + random() * 0.5 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.m);
  const ordered = [...fresh, ...stale];

  const hotCap = Math.ceil(o.count / 2);
  const picked: T[] = [];
  let hot = 0;
  let heavy = 0;
  const take = (m: T) => {
    picked.push(m);
    if (isHot(m)) hot++;
    if (m.heavy) heavy++;
  };
  for (const m of ordered) {
    if (picked.length >= o.count) break;
    if (isHot(m) && hot >= hotCap) continue;
    if (m.heavy && heavy >= 1) continue;
    take(m);
  }
  // Not enough under the caps: relax them rather than come up short (never eligibility).
  for (const m of ordered) {
    if (picked.length >= o.count) break;
    if (!picked.includes(m)) take(m);
  }
  return spread(picked);
}

/** Reorders so no two neighbours share an "other", when that's possible (greedy). */
export function spread<T extends Meta>(items: readonly T[]): T[] {
  const left = [...items];
  const out: T[] = [];
  const key = (m: Meta) => m.with.join('+');
  while (left.length) {
    const prev = out.at(-1);
    const i = prev ? left.findIndex((m) => key(m) !== key(prev)) : 0;
    out.push(...left.splice(Math.max(0, i), 1));
  }
  return out;
}

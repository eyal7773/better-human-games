import { load, store } from './storage';
import { GENDER_TAGS, HOUSEHOLD_TAGS, type GenderTag, type HouseholdTag, type Tag, type TopicTag } from './tags';

/**
 * Who the player is, site-wide. Set in the "My home" character builder on the
 * hub and used by games to pick content that fits. No names, no ages.
 */
export type Address = 'f' | 'm' | 'x'; // "את" / "אתה" / "אתם" — how to talk to you, not who you are

export interface Profile {
  v: 1;
  status: 'new' | 'skipped' | 'done';
  shape: number;
  color: number;
  address: Address;
  household: HouseholdTag[];
  hot: TopicTag[]; // up to MAX_HOT topics that get picked more often
  rewarded: boolean; // the one-time reward for finishing; survives a reset
}

export const MAX_HOT = 3;
const KEY = 'bhg.profile.v1';

const DEFAULTS: Profile = {
  v: 1,
  status: 'new',
  shape: 0,
  color: 0,
  address: 'x',
  household: [],
  hot: [],
  rewarded: false,
};

const STATUSES: readonly Profile['status'][] = ['new', 'skipped', 'done'];
const ADDRESSES: readonly Address[] = ['f', 'm', 'x'];

/** Stored data may be old, hand-edited or corrupt: keep only what we understand. */
export function sanitize(raw: Partial<Profile>): Profile {
  const p = { ...structuredClone(DEFAULTS), ...raw };
  const int = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    v: 1,
    status: STATUSES.includes(p.status) ? p.status : 'new',
    shape: int(p.shape),
    color: int(p.color),
    address: ADDRESSES.includes(p.address) ? p.address : 'x',
    household: [...new Set(list(p.household).filter((t): t is HouseholdTag => HOUSEHOLD_TAGS.includes(t)))],
    hot: [...new Set(list(p.hot).filter((t): t is TopicTag => typeof t === 'string'))].slice(0, MAX_HOT),
    rewarded: p.rewarded === true,
  };
}

export const profile: Profile = sanitize(load<Partial<Profile>>(KEY, {}));

export function saveProfile() {
  store(KEY, profile);
}

/** Forget the home, but not that the reward was already given. */
export function resetProfile() {
  Object.assign(profile, structuredClone(DEFAULTS), { status: 'skipped', rewarded: profile.rewarded });
  saveProfile();
}

const ADDRESS_GENDER: Record<Address, GenderTag | null> = { f: 'women', m: 'men', x: null };

const isGender = (t: Tag): t is GenderTag => GENDER_TAGS.includes(t as GenderTag);
const isHousehold = (t: Tag): t is HouseholdTag => HOUSEHOLD_TAGS.includes(t as HouseholdTag);

/**
 * Gender-specific content only goes to players who chose that form of
 * address — with or without a profile. It is never an acceptable fallback.
 */
export function allowed(tags: readonly Tag[], p: Profile = profile): boolean {
  const gender = tags.filter(isGender);
  const mine = ADDRESS_GENDER[p.address];
  return !gender.length || (mine !== null && gender.includes(mine));
}

/**
 * Whether content suits the player's home: it shares an audience with it, has
 * no audience at all, or the player hasn't described their home.
 */
export function fits(tags: readonly Tag[], p: Profile = profile): boolean {
  if (!allowed(tags, p)) return false;
  if (p.status !== 'done' || !p.household.length) return true;
  const audience = tags.filter(isHousehold);
  return !audience.length || audience.some((t) => p.household.includes(t));
}

/** Hot-button topics come up twice as often. */
export function weight(tags: readonly Tag[], p: Profile = profile): number {
  return tags.some((t) => p.hot.includes(t as TopicTag)) ? 2 : 1;
}

/** Random order where heavier items tend to come first (weighted sampling). */
export function weightedShuffle<T>(items: readonly T[], w: (item: T) => number, random = Math.random): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(random(), 1 / w(item)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

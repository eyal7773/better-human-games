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
  rewarded: boolean;
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

export const profile: Profile = load(KEY, DEFAULTS);

export function saveProfile() {
  store(KEY, profile);
}

export function resetProfile() {
  Object.assign(profile, structuredClone(DEFAULTS), { status: 'skipped' });
  saveProfile();
}

const ADDRESS_GENDER: Record<Address, GenderTag | null> = { f: 'women', m: 'men', x: null };

/**
 * Whether content with these tags suits the player. Gender-specific content
 * only goes to players who chose that form of address — with or without a
 * profile. Otherwise content fits when it shares an audience with the home,
 * or when the player hasn't described their home.
 */
export function fits(tags: readonly Tag[], p: Profile = profile): boolean {
  const gender = tags.filter((t): t is GenderTag => GENDER_TAGS.includes(t as GenderTag));
  if (gender.length && !gender.includes(ADDRESS_GENDER[p.address]!)) return false;
  if (p.status !== 'done' || !p.household.length) return true;
  const audience = tags.filter((t): t is HouseholdTag => HOUSEHOLD_TAGS.includes(t as HouseholdTag));
  return !audience.length || audience.some((t) => p.household.includes(t));
}

/** Gender-specific content that doesn't match is never an acceptable fallback. */
export function allowed(tags: readonly Tag[], p: Profile = profile): boolean {
  return fits(tags, { ...p, status: 'new' });
}

/** Hot-button topics come up twice as often. */
export function weight(tags: readonly Tag[], p: Profile = profile): number {
  return tags.some((t) => p.hot.includes(t as TopicTag)) ? 2 : 1;
}

/** Random order where heavier items tend to come first (weighted sampling). */
export function weightedShuffle<T>(items: T[], w: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(Math.random(), 1 / w(item)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

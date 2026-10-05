import { load, store } from './storage';
import { HOUSEHOLD_TAGS, type HouseholdTag, type TopicTag } from './tags';

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

/**
 * A Hebrew first-person word that agrees with the player: masculine, feminine,
 * or both with a slash ("מרגיש/ה") when they chose not to say.
 */
export function heSelf(m: string, f: string, p: Profile = profile) {
  return p.address === 'f' ? f : p.address === 'm' ? m : `${m}/ה`;
}

/**
 * Resolves the player's grammatical gender in content text: "{m|f}" or
 * "{m|f|x}". Without a choice it's the slash form ("מרגיש/ה"), unless an
 * explicit neutral form is given.
 */
export function agree(text: string, p: Profile = profile) {
  return text.replace(/\{([^{}|]*)\|([^{}|]*)(?:\|([^{}|]*))?\}/g, (_, m: string, f: string, x?: string) => {
    if (m === f) return m;
    if (p.address === 'm') return m;
    if (p.address === 'f') return f;
    if (x !== undefined) return x;
    return f === `${m}ה` ? `${m}/ה` : `${m}/${f}`;
  });
}

export function saveProfile() {
  store(KEY, profile);
}

/** Forget the home, but not that the reward was already given. */
export function resetProfile() {
  Object.assign(profile, structuredClone(DEFAULTS), { status: 'skipped', rewarded: profile.rewarded });
  saveProfile();
}

/** Random order where heavier items tend to come first (weighted sampling). */
export function weightedShuffle<T>(items: readonly T[], w: (item: T) => number, random = Math.random): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(random(), 1 / w(item)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

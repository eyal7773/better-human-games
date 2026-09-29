import { load, store } from './storage';

/**
 * Level progress shared by the small games: three stars a level, zen for
 * stars reached for the first time only (no farming), personal bests and an
 * album of things discovered. Pure functions plus a thin load/store wrapper.
 */

export type Stars = [boolean, boolean, boolean];

export const ZEN_PER_STAR = 5;

export const noStars = (): Stars => [false, false, false];

export function mergeStars(a: readonly boolean[] | undefined, b: readonly boolean[]): Stars {
  return [0, 1, 2].map((i) => Boolean(a?.[i]) || Boolean(b[i])) as Stars;
}

/** How many of `earned` have never been rewarded before. */
export function newStarCount(rewarded: readonly boolean[] | undefined, earned: readonly boolean[]) {
  return [0, 1, 2].filter((i) => earned[i] && !rewarded?.[i]).length;
}

export const countStars = (s: readonly boolean[] | undefined) => (s ?? []).filter(Boolean).length;

export interface Progress {
  v: 1;
  muted: boolean;
  /** Best stars per level id (union of every play). */
  stars: Record<string, Stars>;
  /** Stars already paid out in zen, per level id. */
  rewarded: Record<string, Stars>;
  /** Personal bests by name (higher is better). */
  best: Record<string, number>;
  /** Ids of things discovered (stations, shadows…), in order found. */
  album: string[];
  /** Level ids completed (first star) at least once. */
  done: string[];
}

const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const strings = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : []);

/** Stored data may be old, hand-edited or corrupt: keep only what we understand. */
export function sanitizeProgress(raw: unknown): Progress {
  const r = obj(raw);
  const stars = (v: unknown) => {
    const out: Record<string, Stars> = {};
    for (const [k, x] of Object.entries(obj(v))) if (Array.isArray(x)) out[k] = mergeStars(undefined, x as boolean[]);
    return out;
  };
  const best: Record<string, number> = {};
  for (const [k, x] of Object.entries(obj(r.best))) if (typeof x === 'number' && Number.isFinite(x) && x > 0) best[k] = Math.floor(x);
  return {
    v: 1,
    muted: r.muted === true,
    stars: stars(r.stars),
    rewarded: stars(r.rewarded),
    best,
    album: strings(r.album),
    done: strings(r.done),
  };
}

/** Folds one finished level into the progress. Returns the zen earned. */
export function recordLevel(p: Progress, id: string, earned: Stars): number {
  const fresh = newStarCount(p.rewarded[id], earned);
  p.stars[id] = mergeStars(p.stars[id], earned);
  p.rewarded[id] = mergeStars(p.rewarded[id], earned);
  if (earned[0] && !p.done.includes(id)) p.done.push(id);
  return fresh * ZEN_PER_STAR;
}

/** Levels open in order: the first always, each next one once the previous is done. */
export function unlocked(p: Progress, ids: readonly string[], id: string) {
  const i = ids.indexOf(id);
  return i === 0 || (i > 0 && p.done.includes(ids[i - 1]));
}

/** The level "Continue" should start: the first one not done yet, else the last. */
export function nextLevel(p: Progress, ids: readonly string[]) {
  return ids.find((id) => !p.done.includes(id)) ?? ids[ids.length - 1];
}

/** Records a personal best. True if it beat the old one. */
export function bump(p: Progress, key: string, value: number) {
  if (!(value > (p.best[key] ?? 0))) return false;
  p.best[key] = Math.floor(value);
  return true;
}

/** Adds to the album. True the first time. */
export function discover(p: Progress, id: string) {
  if (p.album.includes(id)) return false;
  p.album.push(id);
  return true;
}

export const loadProgress = (key: string) => sanitizeProgress(load<Record<string, unknown>>(key, {}));
export const saveProgress = (key: string, p: Progress) => store(key, p);

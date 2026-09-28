import { load, store } from '../shared/storage';
import { PLAYABLE, TRICKS, type Trick } from './levels';
import { countStars, mergeStars, newStarCount, ZEN_PER_STAR, type Stars } from './stars';

/** Progress in the 3D story. The hub reads `finished` to seat Pesky in "My home". */
export interface Save3D {
  v: 1;
  muted: boolean;
  /** Level ids completed at least once. */
  done: number[];
  /** Best stars per level id (union of every play). */
  stars: Record<string, Stars>;
  /** Stars already paid out in zen, per level id. */
  rewarded: Record<string, Stars>;
  tricks: Trick[];
  /** Taps per second measured at the start of level 1. */
  baseline: number | null;
  /** Endless mode: most calm stars in one run. */
  endlessBest: number;
  finished: boolean;
}

export const SAVE_KEY = 'bhg.catch-me-3d.v1';

const DEFAULTS: Save3D = {
  v: 1,
  muted: false,
  done: [],
  stars: {},
  rewarded: {},
  tricks: [],
  baseline: null,
  endlessBest: 0,
  finished: false,
};

/** Stored data may be old, hand-edited or corrupt: keep only what we understand. */
export function sanitize(raw: Partial<Save3D>): Save3D {
  const s = { ...structuredClone(DEFAULTS), ...raw };
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const stars = (v: unknown) => {
    const out: Record<string, Stars> = {};
    for (const [k, x] of Object.entries(obj(v))) if (Array.isArray(x)) out[k] = mergeStars(undefined, x as boolean[]);
    return out;
  };
  return {
    v: 1,
    muted: s.muted === true,
    done: Array.isArray(s.done) ? [...new Set(s.done.filter((n) => Number.isInteger(n) && n > 0))] : [],
    stars: stars(s.stars),
    rewarded: stars(s.rewarded),
    tricks: Array.isArray(s.tricks) ? [...new Set(s.tricks.filter((t) => TRICKS.includes(t)))] : [],
    baseline: typeof s.baseline === 'number' && s.baseline > 0 ? s.baseline : null,
    endlessBest: Number.isFinite(s.endlessBest) && s.endlessBest > 0 ? Math.floor(s.endlessBest) : 0,
    finished: s.finished === true,
  };
}

export function loadSave(): Save3D {
  return sanitize(load<Partial<Save3D>>(SAVE_KEY, {}));
}

export function persist(save: Save3D) {
  store(SAVE_KEY, save);
}

/**
 * Folds one finished level into the save. Returns the zen earned: only stars
 * reached for the first time pay out.
 */
export function recordLevel(save: Save3D, id: number, earned: Stars): number {
  const key = String(id);
  const fresh = newStarCount(save.rewarded[key], earned);
  save.stars[key] = mergeStars(save.stars[key], earned);
  save.rewarded[key] = mergeStars(save.rewarded[key], earned);
  if (earned[0] && !save.done.includes(id)) save.done.push(id);
  return fresh * ZEN_PER_STAR;
}

/** A level is open once the one before it is done; done levels can be replayed. */
export const unlocked = (save: Save3D, id: number) => id <= PLAYABLE && (id === 1 || save.done.includes(id - 1));

export const totalStars = (save: Save3D) => Object.values(save.stars).reduce((n, s) => n + countStars(s), 0);

export function seeTrick(save: Save3D, t: Trick): boolean {
  if (save.tricks.includes(t)) return false;
  save.tricks.push(t);
  return true;
}

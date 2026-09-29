import type { Stars } from '../shared/progress';

/**
 * Inner Radio's rules, free of DOM and audio so they can be tested.
 * The dial runs 0…1. Feelings broadcast at stations on it; anger is the
 * static on top. A station's "weight" is how strongly that feeling is present
 * in the scene — there are no wrong feelings, only fainter and louder ones.
 */

export const EMOTIONS = ['hurt', 'fear', 'tired', 'sad', 'lonely', 'shame'] as const;
export type Emotion = (typeof EMOTIONS)[number];

/** Within this distance a station is audible at all. */
export const AUDIBLE = 0.09;
/** Within this distance of a station the lock ring fills. */
export const LOCK = 0.022;
/** Hold inside the lock window this long to lock. */
export const LOCK_MS = 1100;
/** A station at least this strong can be locked ("that's there too"). */
export const VALID = 0.3;
/** A station at least this strong is one of the loud ones (the star). */
export const STRONG = 0.6;
/** Stations keep at least this far apart, and away from the ends. */
export const MIN_GAP = 0.15;
export const EDGE = 0.07;

export interface Station {
  id: Emotion;
  pos: number;
  weight: number;
}

/** Spreads stations over the dial at random, never overlapping. */
export function placeStations(ids: readonly Emotion[], weights: Partial<Record<Emotion, number>>, rnd = Math.random): Station[] {
  const span = 1 - 2 * EDGE - MIN_GAP * (ids.length - 1);
  // Random gaps that sum to the free span, then fixed minimum gaps between.
  const cuts = Array.from({ length: ids.length }, () => rnd()).sort((a, b) => a - b);
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((id, i) => ({ id, pos: EDGE + cuts[i] * Math.max(0, span) + i * MIN_GAP, weight: weights[id] ?? 0 }));
}

export const proximity = (dial: number, pos: number) => Math.max(0, 1 - Math.abs(dial - pos) / AUDIBLE);

/** How much a station is heard at this dial position (0…1). */
export const levelOf = (dial: number, s: Station) => proximity(dial, s.pos) ** 2 * s.weight;

/** 0 = pure static, 1 = a strong station perfectly tuned. */
export function clarity(dial: number, stations: readonly Station[]) {
  let best = 0;
  for (const s of stations) best = Math.max(best, proximity(dial, s.pos) * s.weight);
  return best;
}

/** The station whose lock window the dial is in, if any. */
export function stationAt(dial: number, stations: readonly Station[]) {
  return stations.find((s) => Math.abs(dial - s.pos) <= LOCK) ?? null;
}

export const lockable = (s: Station) => s.weight >= VALID;

/** Every loud feeling in the scene has been found. */
export function foundStrong(stations: readonly Station[], locked: readonly Emotion[]) {
  return stations.filter((s) => s.weight >= STRONG).every((s) => locked.includes(s.id));
}

// ---------------------------------------------------------------- sentence

/** +1 direct and kind, 0 vague, −1 blaming. */
export type Tone = 1 | 0 | -1;

export interface Tile {
  text: string;
  v: Tone;
}

/**
 * How the listener's face reacts to the sentence so far, −1…1. Blame weighs
 * more than kindness: one "you always" can undo a lot of care.
 */
export function moodOf(tones: readonly Tone[]) {
  let m = 0;
  for (const t of tones) m += t > 0 ? 0.3 : t < 0 ? -0.55 : -0.05;
  return Math.max(-1, Math.min(1, m));
}

export const hasBlame = (tones: readonly Tone[]) => tones.some((t) => t < 0);

export interface RadioResult {
  locked: Emotion[];
  stations: Station[];
  /** Tones of the first sentence sent. */
  firstTry: Tone[];
}

/** ⭐ tuned in and said it · ⭐ found every loud signal · ⭐ first sentence had no blame. */
export function starsFor(r: RadioResult): Stars {
  const done = r.locked.length > 0 && r.firstTry.length > 0;
  return [done, done && foundStrong(r.stations, r.locked), done && !hasBlame(r.firstTry)];
}

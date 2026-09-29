import type { Stars } from '../shared/progress';

/**
 * Words in Flight — rules without DOM or canvas. A sentence is a row of
 * tokens (short phrases, so "thank you" and "you always" are different
 * things). Toxic ones can be cut in flight and turn into their honest
 * version; feelings must never be cut.
 */

/** t: toxic (cut it) · n: neutral · f: a feeling (never cut) · x: an honest version, born from a cut. */
export type Kind = 't' | 'n' | 'f' | 'x';

export interface Token {
  kind: Kind;
  text: string;
  /** For toxic tokens: what it becomes when caught. */
  fix?: string;
}

/**
 * Parses the compact sentence notation used in the content:
 * tokens split by " | ", "!" marks toxic with "→" before its honest version,
 * "+" marks a feeling. Everything else is neutral.
 */
export function parse(s: string): Token[] {
  return s.split(' | ').map((raw) => {
    const p = raw.trim();
    if (p.startsWith('!')) {
      const [text, fix] = p.slice(1).split('→');
      return { kind: 't', text: text.trim(), fix: (fix ?? '').trim() };
    }
    if (p.startsWith('+')) return { kind: 'f', text: p.slice(1).trim() };
    return { kind: 'n', text: p };
  });
}

// Connection changes, 0…100 (it starts at START).
export const START = 60;
export const HIT = -14;
export const CUT_FEELING = -8;
export const LAND: Record<Kind, number> = { t: HIT, n: 1, f: 3, x: 4 };

export const clampConn = (c: number) => Math.max(0, Math.min(100, c));

/** What happened to each token of one sentence. */
export interface SentenceTally {
  toxic: number;
  caught: number;
  /** Toxic tokens that reached the listener. */
  hits: number;
  feelingsCut: number;
  neutralsCut: number;
}

export const emptyTally = (tokens: readonly Token[]): SentenceTally => ({
  toxic: tokens.filter((t) => t.kind === 't').length,
  caught: 0,
  hits: 0,
  feelingsCut: 0,
  neutralsCut: 0,
});

/** Honest: every toxic token caught, and nothing else cut. */
export const honest = (s: SentenceTally) => s.caught === s.toxic && s.feelingsCut === 0 && s.neutralsCut === 0;

/** Tracks the honesty streak (consecutive honest sentences). */
export function nextStreak(streak: number, s: SentenceTally) {
  return honest(s) ? streak + 1 : 0;
}

export interface Level {
  id: string;
  sentences: number;
  /** Flight and launch speed multiplier. */
  speed: number;
  /** Honest sentences in a row needed for the streak star. */
  streak: number;
}

export const LEVELS: Level[] = [
  { id: 'calm', sentences: 5, speed: 1, streak: 1 },
  { id: 'dishes', sentences: 6, speed: 1.15, streak: 2 },
  { id: 'screens', sentences: 6, speed: 1.3, streak: 3 },
  { id: 'school', sentences: 7, speed: 1.5, streak: 3 },
  { id: 'argument', sentences: 8, speed: 1.75, streak: 3 },
];

/** Seconds a token takes from your mouth to their face. */
export const flightTime = (speed: number) => 3.1 / speed;
/** Seconds between two tokens of a sentence leaving your mouth. */
export const launchGap = (speed: number) => 0.8 / speed;

export interface RunResult {
  finished: boolean;
  connection: number;
  bestStreak: number;
  hits: number;
}

/** ⭐ finished with them still in the room · ⭐ honesty streak · ⭐ no word hurt them. */
export function starsFor(r: RunResult, level: Level): Stars {
  const done = r.finished && r.connection > 0;
  return [done, done && r.bestStreak >= level.streak, done && r.hits === 0];
}

/** Endless mode speeds up a little with every sentence. */
export const endlessSpeed = (n: number) => Math.min(2.6, 1.1 * Math.pow(1.045, n));

// ---------------------------------------------------------------- geometry

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Does the segment a→b cross (or lie inside) the rectangle? Liang–Barsky clipping. */
export function segmentHitsRect(ax: number, ay: number, bx: number, by: number, r: Rect) {
  const dx = bx - ax;
  const dy = by - ay;
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, ax - r.x],
    [dx, r.x + r.w - ax],
    [-dy, ay - r.y],
    [dy, r.y + r.h - ay],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
  }
  return t0 <= t1;
}

/**
 * Three stars a level — all of them for calm, none for speed or tap counts.
 * Zen points go only to stars earned for the first time (no farming).
 */

export type Stars = [boolean, boolean, boolean];

export interface LevelStats {
  completed: boolean;
  /** Times "I'm getting angry" was pressed with 45 ≤ F ≤ 85. */
  noticedInTime: number;
  boils: number;
  /** Breath cycles finished without letting go early. */
  cleanBreaths: number;
  /** Catches that slipped out of the hand (shield). */
  slips: number;
}

export const ZEN_PER_STAR = 5;

/**
 * ⭐ finished · ⭐ noticed in time at least once, or never boiled ·
 * ⭐ one clean breath (level 1 has none: a level with no slips instead).
 */
export function starsFor(s: LevelStats, hasBreath: boolean): Stars {
  if (!s.completed) return [false, false, false];
  return [true, s.noticedInTime > 0 || s.boils === 0, hasBreath ? s.cleanBreaths > 0 : s.slips === 0];
}

export const noStars = (): Stars => [false, false, false];

export function mergeStars(a: readonly boolean[] | undefined, b: readonly boolean[]): Stars {
  return [0, 1, 2].map((i) => Boolean(a?.[i]) || Boolean(b[i])) as Stars;
}

/** How many of `earned` have never been rewarded before. */
export function newStarCount(rewarded: readonly boolean[] | undefined, earned: readonly boolean[]) {
  return [0, 1, 2].filter((i) => earned[i] && !rewarded?.[i]).length;
}

export const countStars = (s: readonly boolean[] | undefined) => (s ?? []).filter(Boolean).length;

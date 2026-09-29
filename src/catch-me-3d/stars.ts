import type { Stars } from '../shared/progress';

/**
 * Three stars a level — all of them for calm, none for speed or tap counts.
 * Zen points go only to stars earned for the first time (no farming); the
 * star bookkeeping itself is shared with the other games.
 */
export { noStars, mergeStars, newStarCount, countStars, ZEN_PER_STAR, type Stars } from '../shared/progress';

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

/**
 * ⭐ finished · ⭐ noticed in time at least once, or never boiled ·
 * ⭐ one clean breath (level 1 has none: a level with no slips instead).
 */
export function starsFor(s: LevelStats, hasBreath: boolean): Stars {
  if (!s.completed) return [false, false, false];
  return [true, s.noticedInTime > 0 || s.boils === 0, hasBreath ? s.cleanBreaths > 0 : s.slips === 0];
}

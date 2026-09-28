/**
 * The story's levels, as data. Each one teaches exactly one new mechanic and
 * shows at most one new trick (docs/catch-me-3d-spec.md §3).
 */

export const TRICKS = ['zigzag', 'hide', 'decoy', 'bed', 'clones', 'portals'] as const;
export type Trick = (typeof TRICKS)[number];

export const MECHANICS = ['chase', 'breath', 'notice', 'shield', 'hint', 'inversion'] as const;
export type Mechanic = (typeof MECHANICS)[number];

export type RoomId = 'living' | 'kitchen' | 'kids' | 'garden' | 'roof' | 'box';

export interface Level {
  id: number;
  room: RoomId;
  /** Catches that finish the level. */
  catches: number;
  /** Tricks the runner uses here. */
  tricks: Trick[];
  /** The one new thing the player learns. */
  mechanic: Mechanic;
  /** Boiling over (F = 100) forces a breath. */
  forcedBoil: boolean;
  /** The "I'm getting angry" button is available. */
  notice: boolean;
  /** …and pulses once F passes 45 (a helper that fades away by level 5). */
  noticePulse: boolean;
  /** Chance per second of tripping mid-jog — the catch window. */
  tripPerSec: number;
}

export const LEVELS: Level[] = [
  { id: 1, room: 'living', catches: 2, tricks: ['zigzag'], mechanic: 'chase', forcedBoil: false, notice: false, noticePulse: false, tripPerSec: 0.15 },
  { id: 2, room: 'kitchen', catches: 3, tricks: ['zigzag', 'hide'], mechanic: 'breath', forcedBoil: true, notice: false, noticePulse: false, tripPerSec: 0.1 },
  { id: 3, room: 'kids', catches: 3, tricks: ['zigzag', 'decoy', 'bed'], mechanic: 'notice', forcedBoil: true, notice: true, noticePulse: true, tripPerSec: 0.09 },
  { id: 4, room: 'garden', catches: 3, tricks: ['zigzag', 'clones'], mechanic: 'shield', forcedBoil: true, notice: true, noticePulse: true, tripPerSec: 0.09 },
  { id: 5, room: 'roof', catches: 3, tricks: ['zigzag', 'portals'], mechanic: 'hint', forcedBoil: true, notice: true, noticePulse: false, tripPerSec: 0.08 },
  { id: 6, room: 'box', catches: 1, tricks: [], mechanic: 'inversion', forcedBoil: false, notice: false, noticePulse: false, tripPerSec: 0 },
];

export const FINAL_LEVEL = LEVELS.length;
/** Rooms built so far (the rest show as coming soon). */
export const PLAYABLE = 5;

/** A level is soft-capped here, and hard-capped at MAX_LEVEL_MS. */
export const TIRED_AT_MS = 150000;
export const MAX_LEVEL_MS = 180000;

/** Tricks first shown in a level (not seen in any earlier one). */
export function newTricks(level: Level): Trick[] {
  const before = new Set(LEVELS.filter((l) => l.id < level.id).flatMap((l) => l.tricks));
  return level.tricks.filter((t) => !before.has(t));
}

export const level = (id: number) => LEVELS.find((l) => l.id === id);

/** Endless mode: a random room from the story, all tricks, escalating. */
export const ENDLESS_ROOMS: RoomId[] = ['living', 'kitchen', 'kids', 'garden', 'roof'];
export const ENDLESS_BOILS = 3;

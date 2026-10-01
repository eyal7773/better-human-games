import { load, store } from '../shared/storage';

export interface Save {
  evenings: number;
  rounds: number;
  calmRounds: number;
  noticed: number;
  boils: number;
  bestChoices: number;
  muted: boolean;
  choiceSeconds: number;
  seenHowTo: boolean;
  recentDilemmas: string[];
}

// The zen wallet, growth, real pauses and the old island's items used to be
// kept here too; they moved to src/shared/zen.ts and the Calm Islands.
const KEY = 'bhg.boiling-point.v1';

const DEFAULTS: Save = {
  evenings: 0,
  rounds: 0,
  calmRounds: 0,
  noticed: 0,
  boils: 0,
  bestChoices: 0,
  muted: false,
  choiceSeconds: 15,
  seenHowTo: false,
  recentDilemmas: [],
};

export const save: Save = load(KEY, DEFAULTS);

// The answer time used to be 5/8/12 seconds, which was too short to read the
// answers; it's now three times that. Saved choices move up with it.
const OLD_CHOICE: Record<number, number> = { 5: 15, 8: 24, 12: 36 };
if (OLD_CHOICE[save.choiceSeconds]) save.choiceSeconds = OLD_CHOICE[save.choiceSeconds];

export function persist() {
  store(KEY, save);
}

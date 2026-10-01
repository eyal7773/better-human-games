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
  readSeconds: number; // reading time before the response options appear
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
  choiceSeconds: 5,
  readSeconds: 4,
  seenHowTo: false,
  recentDilemmas: [],
};

export const save: Save = load(KEY, DEFAULTS);

export function persist() {
  store(KEY, save);
}

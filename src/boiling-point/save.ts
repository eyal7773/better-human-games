import { load, store } from '../shared/storage';

export interface Placed {
  id: string;
  slot: number;
  plantedAt: number; // value of `growth` when bought
}

export interface Save {
  zen: number;
  earned: number;
  evenings: number;
  rounds: number;
  calmRounds: number;
  noticed: number;
  boils: number;
  bestChoices: number;
  placed: Placed[];
  growth: number; // +1 for every round finished without boiling over
  muted: boolean;
  choiceSeconds: number;
  seenHowTo: boolean;
  recentDilemmas: string[];
  realPauseDay: string | null;
  realPauses: number;
}

const KEY = 'bhg.boiling-point.v1';

const DEFAULTS: Save = {
  zen: 0,
  earned: 0,
  evenings: 0,
  rounds: 0,
  calmRounds: 0,
  noticed: 0,
  boils: 0,
  bestChoices: 0,
  placed: [],
  growth: 0,
  muted: false,
  choiceSeconds: 5,
  seenHowTo: false,
  recentDilemmas: [],
  realPauseDay: null,
  realPauses: 0,
};

export const save: Save = load(KEY, DEFAULTS);

export function persist() {
  store(KEY, save);
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

import type { Stars } from '../shared/progress';

/**
 * The Fortress — a reverse tower defence, as a pure simulation.
 *
 * Hassles drift in from the edge (dist 1) to the wall (dist 0). Bubbles that
 * reach the wall just pop — and give energy back. The anger cannon destroys
 * anything but costs energy and its recoil cracks the wall of your
 * relationships. A shield (a calm boundary) costs less; it's what real
 * threats need. Waste energy on bubbles and there's none left when it counts.
 */

export const PILLARS = ['health', 'family', 'home', 'worth'] as const;
export type Pillar = (typeof PILLARS)[number];

export const ENERGY_START = 60;
export const ENERGY_MAX = 100;
export const REGEN = 1; // per second
export const POP_GAIN = 6;
export const CANNON_COST = 25;
export const RECOIL = 10;
export const SHIELD_COST = 15;
export const THREAT_DAMAGE = 34;
/** Seconds from the edge to the wall at speed 1. */
export const TRAVEL = 14;
/** Disguised threats show their thorns from this distance on. */
export const REVEAL_AT = 0.55;

export type Kind = 'bubble' | 'threat';
export type Fate = 'flying' | 'popped' | 'shot' | 'shielded' | 'hit';

export interface Hassle {
  id: number;
  kind: Kind;
  /** Index into the bubble or threat content list. */
  item: number;
  pillar: Pillar;
  angle: number;
  dist: number;
  speed: number;
  disguised: boolean;
  inspected: boolean;
  fate: Fate;
}

export interface Wave {
  n: number;
  threats: number;
}

export interface Level {
  id: string;
  waves: Wave[];
  speed: number;
  disguise: boolean;
  /** Cannon shots allowed for the "calm hand" star. */
  shots: number;
}

export const LEVELS: Level[] = [
  { id: 'morning', waves: [{ n: 5, threats: 0 }, { n: 5, threats: 0 }], speed: 1, disguise: false, shots: 0 },
  { id: 'work', waves: [{ n: 5, threats: 0 }, { n: 5, threats: 1 }, { n: 4, threats: 0 }], speed: 1.1, disguise: false, shots: 1 },
  { id: 'evening', waves: [{ n: 6, threats: 1 }, { n: 6, threats: 0 }, { n: 6, threats: 1 }], speed: 1.2, disguise: false, shots: 1 },
  { id: 'family', waves: [{ n: 6, threats: 0 }, { n: 7, threats: 1 }, { n: 7, threats: 1 }], speed: 1.25, disguise: true, shots: 1 },
  { id: 'bigday', waves: [{ n: 6, threats: 1 }, { n: 7, threats: 0 }, { n: 7, threats: 1 }, { n: 6, threats: 1 }], speed: 1.35, disguise: true, shots: 1 },
];

/** Endless: every wave a little bigger and faster, about one threat in eight. */
export function endlessWave(i: number): { wave: Wave; speed: number; disguise: boolean } {
  const n = 5 + i;
  return { wave: { n, threats: Math.max(1, Math.round(n / 8)) }, speed: Math.min(2.2, 1.1 + i * 0.06), disguise: i >= 2 };
}

/** Seconds a wave lasts before the next one starts arriving. */
export const WAVE_SECONDS = 32;

/** Spawn times for a wave, spread out with a little jitter; which slots are threats. */
export function schedule(w: Wave, rnd = Math.random): { at: number; kind: Kind }[] {
  const gap = WAVE_SECONDS / w.n;
  const slots = Array.from({ length: w.n }, (_, i) => ({ at: i * gap + rnd() * gap * 0.6, kind: 'bubble' as Kind }));
  // Threats never open a wave: they come once you've settled in.
  const candidates = slots.map((_, i) => i).filter((i) => i >= 1);
  for (let k = 0; k < Math.min(w.threats, candidates.length); k++) {
    const j = Math.floor(rnd() * candidates.length);
    slots[candidates.splice(j, 1)[0]].kind = 'threat';
  }
  return slots;
}

export interface State {
  energy: number;
  wall: number;
  pillars: Record<Pillar, number>;
  hassles: Hassle[];
  letGo: number;
  shots: number;
  shields: number;
  shieldsWasted: number;
  threats: number;
  blocked: number;
  hits: number;
  nextId: number;
}

export function newState(): State {
  return {
    energy: ENERGY_START,
    wall: 100,
    pillars: { health: 100, family: 100, home: 100, worth: 100 },
    hassles: [],
    letGo: 0,
    shots: 0,
    shields: 0,
    shieldsWasted: 0,
    threats: 0,
    blocked: 0,
    hits: 0,
    nextId: 1,
  };
}

export function spawn(s: State, h: Omit<Hassle, 'id' | 'dist' | 'fate' | 'inspected'>): Hassle {
  const x: Hassle = { ...h, id: s.nextId++, dist: 1, fate: 'flying', inspected: false };
  if (x.kind === 'threat') s.threats++;
  s.hassles.push(x);
  return x;
}

/** A threat shows as one once inspected or close enough — disguised ones look like bubbles until then. */
export const looksThreat = (h: Hassle) => h.kind === 'threat' && (!h.disguised || h.inspected || h.dist < REVEAL_AT);

/** Advances time. Returns the hassles that reached the wall this step. */
export function step(s: State, dt: number): Hassle[] {
  s.energy = Math.min(ENERGY_MAX, s.energy + REGEN * dt);
  const arrived: Hassle[] = [];
  for (const h of s.hassles) {
    if (h.fate !== 'flying') continue;
    h.dist -= (dt * h.speed) / TRAVEL;
    if (h.dist > 0) continue;
    h.dist = 0;
    if (h.kind === 'bubble') {
      h.fate = 'popped';
      s.letGo++;
      s.energy = Math.min(ENERGY_MAX, s.energy + POP_GAIN);
    } else {
      h.fate = 'hit';
      s.hits++;
      s.pillars[h.pillar] = Math.max(0, s.pillars[h.pillar] - THREAT_DAMAGE);
    }
    arrived.push(h);
  }
  s.hassles = s.hassles.filter((h) => h.fate === 'flying' || arrived.includes(h));
  return arrived;
}

export type Refusal = 'energy' | 'gone';

/** 🔥 Destroys the hassle; costs energy and cracks the relationship wall. */
export function fire(s: State, h: Hassle): Refusal | null {
  if (h.fate !== 'flying') return 'gone';
  if (s.energy < CANNON_COST) return 'energy';
  s.energy -= CANNON_COST;
  s.wall = Math.max(0, s.wall - RECOIL);
  s.shots++;
  h.fate = 'shot';
  return null;
}

/** 🛡️ A calm boundary: stops the hassle. On a mere bubble it's energy spent for nothing. */
export function shield(s: State, h: Hassle): Refusal | null {
  if (h.fate !== 'flying') return 'gone';
  if (s.energy < SHIELD_COST) return 'energy';
  s.energy -= SHIELD_COST;
  s.shields++;
  h.fate = 'shielded';
  if (h.kind === 'threat') s.blocked++;
  else s.shieldsWasted++;
  return null;
}

export const standing = (s: State) => s.wall > 0 && PILLARS.every((p) => s.pillars[p] > 0);

/** ⭐ the fortress stands · ⭐ a calm hand on the cannon · ⭐ a boundary for every real threat (and none wasted when there were none). */
export function starsFor(s: State, level: Level, finished: boolean): Stars {
  const ok = finished && standing(s);
  const boundary = s.threats > 0 ? s.blocked === s.threats : s.shieldsWasted === 0;
  return [ok, ok && s.shots <= level.shots, ok && boundary];
}

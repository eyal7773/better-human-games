import { load, store } from '../shared/storage';
import { BP_KEY } from '../shared/zen';
import { migrateOld, type IslandState, type Placed, type Rules } from './economy';

export type Clock = 'auto' | 'day' | 'night';

export interface IslandSave extends IslandState {
  v: 1;
  muted: boolean;
  clock: Clock;
  /** The three-bubble guide was seen (or skipped). */
  guided: boolean;
}

const KEY = 'bhg.island.v1';

const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : null);

/** Stored data may be old, hand-edited or corrupt: keep only what we understand. */
export function sanitizeIsland(raw: unknown, rules: Rules): IslandSave {
  const r = obj(raw);
  const placed: Placed[] = [];
  for (const x of Array.isArray(r.placed) ? r.placed : []) {
    const p = obj(x);
    const rule = typeof p.id === 'string' ? rules(p.id) : undefined;
    const px = int(p.x);
    const py = int(p.y);
    if (!rule || px == null || py == null) continue;
    placed.push({ id: rule.id, isle: rule.isle, x: px, y: py, flip: p.flip === true, at: Math.max(0, int(p.at) ?? 0) });
  }
  const counts = (v: unknown) => {
    const out: Record<string, number> = {};
    for (const [k, n] of Object.entries(obj(v))) if (int(n) && (n as number) > 0) out[k] = n as number;
    return out;
  };
  const stored = counts(r.stored);
  for (const k of Object.keys(stored)) if (!rules(k)) delete stored[k];
  return {
    v: 1,
    placed,
    stored,
    land: counts(r.land),
    muted: r.muted === true,
    clock: r.clock === 'day' || r.clock === 'night' ? r.clock : 'auto',
    guided: r.guided === true,
  };
}

/** A fresh save, carrying over whatever the old Boiling Point island had. */
export function firstIsland(bp: unknown, rules: Rules): IslandSave {
  const s = sanitizeIsland({}, rules);
  const b = obj(bp);
  s.muted = b.muted === true;
  const old = (Array.isArray(b.placed) ? b.placed : [])
    .map(obj)
    .filter((p) => typeof p.id === 'string' && int(p.slot) != null)
    .map((p) => ({ id: p.id as string, slot: p.slot as number, plantedAt: Math.max(0, int(p.plantedAt) ?? 0) }));
  migrateOld(s, rules, old);
  return s;
}

export function loadIsland(rules: Rules): IslandSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitizeIsland(JSON.parse(raw), rules);
    const s = firstIsland(load(BP_KEY, {}), rules);
    store(KEY, s);
    return s;
  } catch {
    return sanitizeIsland({}, rules);
  }
}

export const saveIsland = (s: IslandSave) => store(KEY, s);

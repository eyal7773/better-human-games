import { load, store } from './storage';

/**
 * The zen wallet every game pays into and the Calm Islands spend from. It used
 * to live inside Boiling Point's save; the first load moves it here.
 */

export interface Wallet {
  v: 1;
  zen: number;
  /** Everything ever earned (spending doesn't lower it). */
  earned: number;
  /** +1 for every Boiling Point round finished without boiling over: the trees grow with it. */
  growth: number;
  realPauseDay: string | null;
  realPauses: number;
  /** Day key of the last daily bonus, per game. */
  daily: Record<string, string>;
}

export const DAILY_BONUS = 10;
export const REAL_PAUSE_ZEN = 25;
const KEY = 'bhg.zen.v1';
export const BP_KEY = 'bhg.boiling-point.v1';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Stored data may be old, hand-edited or corrupt: keep only what we understand. */
export function sanitizeWallet(raw: unknown): Wallet {
  const r = obj(raw);
  const daily: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(r.daily))) if (typeof v === 'string') daily[k] = v;
  const zen = num(r.zen);
  return {
    v: 1,
    zen,
    earned: Math.max(num(r.earned), zen),
    growth: num(r.growth),
    realPauseDay: typeof r.realPauseDay === 'string' ? r.realPauseDay : null,
    realPauses: num(r.realPauses),
    daily,
  };
}

/** The wallet as it was kept inside Boiling Point's save. */
export const fromBoilingPoint = (bp: unknown) => sanitizeWallet({ ...obj(bp), daily: {} });

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** The daily bonus for `game`, once per day. Returns the zen added. */
export function claimDaily(w: Wallet, game: string, day: string) {
  if (w.daily[game] === day) return 0;
  w.daily[game] = day;
  w.zen += DAILY_BONUS;
  w.earned += DAILY_BONUS;
  return DAILY_BONUS;
}

/** "I paused at home today too": once a day. Returns the zen added. */
export function claimRealPause(w: Wallet, day: string) {
  if (w.realPauseDay === day) return 0;
  w.realPauseDay = day;
  w.realPauses++;
  w.zen += REAL_PAUSE_ZEN;
  w.earned += REAL_PAUSE_ZEN;
  return REAL_PAUSE_ZEN;
}

function read(): Wallet {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitizeWallet(JSON.parse(raw));
    const bp = localStorage.getItem(BP_KEY);
    const w = fromBoilingPoint(bp ? JSON.parse(bp) : {});
    store(KEY, w);
    return w;
  } catch {
    return sanitizeWallet(load(KEY, {}));
  }
}

export const wallet: Wallet = read();

/** Re-reads storage, so changes made on another page since this one loaded aren't overwritten. */
export function refreshWallet() {
  Object.assign(wallet, read());
  return wallet;
}

const persist = () => store(KEY, wallet);

export function addZen(n: number, o: { growth?: boolean } = {}) {
  refreshWallet();
  wallet.zen += Math.max(0, Math.floor(n));
  wallet.earned += Math.max(0, Math.floor(n));
  if (o.growth) wallet.growth++;
  persist();
}

/** Takes zen if there's enough. False (and nothing changes) otherwise. */
export function spendZen(n: number) {
  refreshWallet();
  if (wallet.zen < n) return false;
  wallet.zen -= n;
  persist();
  return true;
}

/** Gives back zen from an undone purchase (it was never "earned" twice). */
export function refundZen(n: number) {
  refreshWallet();
  wallet.zen += Math.max(0, Math.floor(n));
  persist();
}

export function dailyBonus(game: string) {
  refreshWallet();
  const z = claimDaily(wallet, game, todayKey());
  if (z) persist();
  return z;
}

export function realPause() {
  refreshWallet();
  const z = claimRealPause(wallet, todayKey());
  if (z) persist();
  return z;
}

/** Link to the islands that brings you back to this game. */
export function islandHref() {
  const slug = location.pathname.split('/').filter(Boolean).pop() ?? '';
  return `${import.meta.env.BASE_URL}island/${slug && slug !== 'better-human-games' ? `?from=${encodeURIComponent(slug)}` : ''}`;
}

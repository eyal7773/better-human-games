import { describe, expect, it } from 'vitest';
import { claimDaily, claimRealPause, DAILY_BONUS, fromBoilingPoint, sanitizeWallet } from './zen';

describe('wallet', () => {
  it('moves zen, growth and real pauses out of an old Boiling Point save', () => {
    const w = fromBoilingPoint({ zen: 140, earned: 600, growth: 7, realPauseDay: '2026-9-30', realPauses: 3, placed: [{ id: 'tree' }], muted: true });
    expect(w).toEqual({ v: 1, zen: 140, earned: 600, growth: 7, realPauseDay: '2026-9-30', realPauses: 3, daily: {} });
  });

  it('never lets lifetime earnings sit below what is in the wallet', () => {
    expect(fromBoilingPoint({ zen: 90, earned: 20 }).earned).toBe(90);
  });

  it('keeps only what it understands from corrupt data', () => {
    expect(sanitizeWallet({ zen: -5, earned: 'lots', growth: 2.7, daily: { radio: '2026-10-1', bad: 4 } })).toEqual({
      v: 1,
      zen: 0,
      earned: 0,
      growth: 2,
      realPauseDay: null,
      realPauses: 0,
      daily: { radio: '2026-10-1' },
    });
    expect(sanitizeWallet(null).zen).toBe(0);
  });

  it('pays the daily bonus once a day per game', () => {
    const w = sanitizeWallet({ zen: 5 });
    expect(claimDaily(w, 'fortress', 'd1')).toBe(DAILY_BONUS);
    expect(claimDaily(w, 'fortress', 'd1')).toBe(0);
    expect(claimDaily(w, 'shadow-wall', 'd1')).toBe(DAILY_BONUS);
    expect(claimDaily(w, 'fortress', 'd2')).toBe(DAILY_BONUS);
    expect(w.zen).toBe(5 + 3 * DAILY_BONUS);
    expect(w.earned).toBe(5 + 3 * DAILY_BONUS);
  });

  it('logs the real-life pause once a day', () => {
    const w = sanitizeWallet({});
    expect(claimRealPause(w, 'd1')).toBe(25);
    expect(claimRealPause(w, 'd1')).toBe(0);
    expect(w).toMatchObject({ zen: 25, realPauses: 1, realPauseDay: 'd1' });
  });
});

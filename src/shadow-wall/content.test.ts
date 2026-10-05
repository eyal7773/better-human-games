import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from './logic';
import { checkPool, PERSONAS } from '../shared/library/classify';
import { query, type Seen } from '../shared/library';

/** Scenes in every language, so the classifier sees all the words. */
async function scenesIn(lang: 'en' | 'he' | 'ar') {
  vi.resetModules();
  vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'bhg.lang' ? lang : null), setItem: () => {}, removeItem: () => {} });
  const { SCENES } = await import('./content');
  vi.unstubAllGlobals();
  return SCENES;
}

describe('shadow scenes', () => {
  it('are classified so they only reach the homes they belong to', async () => {
    const langs = await Promise.all((['en', 'he', 'ar'] as const).map(scenesIn));
    const items = langs[0].map((s, i) => ({ meta: s, texts: langs.flatMap((l) => [l[i].name, l[i].event, l[i].anchor, ...l[i].losses]) }));
    expect(checkPool(items)).toEqual([]);
  });

  it('each have their own object, never the shapeless blob', async () => {
    const SCENES = await scenesIn('en');
    expect(SCENES.filter((s) => s.puppet === 'blob').map((s) => s.id)).toEqual([]);
  });

  it('fill all twelve levels without a repeat, for every kind of home', async () => {
    const SCENES = await scenesIn('en');
    const short: string[] = [];
    for (const [name, profile] of Object.entries(PERSONAS))
      for (let run = 1; run <= 5; run++) {
        let seed = run * 7919;
        const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const used: string[] = [];
        const seen: Seen = { n: 0, seen: {} };
        LEVELS.forEach((l, i) => {
          const [got] = query(SCENES.filter((s) => s.real === l.real), { count: 1, diff: l.diff, gentle: i < 2, exclude: used, profile, seen, random });
          if (!got) short.push(`${name}, level ${i + 1}`);
          else used.push(got.id);
        });
      }
    expect([...new Set(short)]).toEqual([]);
  });
});

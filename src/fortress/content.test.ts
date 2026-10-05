import { describe, expect, it, vi } from 'vitest';
import { LEVELS } from './logic';
import { checkPool, PERSONAS } from '../shared/library/classify';
import { eligible } from '../shared/library';

async function contentIn(lang: 'en' | 'he' | 'ar') {
  vi.resetModules();
  vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'bhg.lang' ? lang : null), setItem: () => {}, removeItem: () => {} });
  const c = await import('./content');
  vi.unstubAllGlobals();
  return c;
}

describe('fortress hassles', () => {
  it('are classified so they only reach the homes they belong to', async () => {
    const langs = await Promise.all((['en', 'he', 'ar'] as const).map(contentIn));
    const bubbles = langs[0].BUBBLES.map((b, i) => ({ meta: b, texts: langs.flatMap((l) => [l.BUBBLES[i].label, l.BUBBLES[i].takes]) }));
    const threats = langs[0].THREATS.map((t, i) => ({ meta: t, texts: langs.flatMap((l) => [l.THREATS[i].label, l.THREATS[i].boundary]) }));
    expect(checkPool([...bubbles, ...threats])).toEqual([]);
  });

  it('give every home enough variety: bubbles to let go, and threats for the busiest level without repeats', async () => {
    const { BUBBLES, THREATS } = await contentIn('en');
    const most = Math.max(...LEVELS.map((l) => l.waves.reduce((n, w) => n + w.threats, 0)));
    const short: string[] = [];
    for (const [name, p] of Object.entries(PERSONAS)) {
      const b = BUBBLES.filter((x) => eligible(x, p)).length;
      const t = THREATS.filter((x) => eligible(x, p)).length;
      if (b < 20) short.push(`${name}: ${b} bubbles`);
      if (t < most) short.push(`${name}: ${t} threats (need ${most})`);
    }
    expect(short).toEqual([]);
  });
});

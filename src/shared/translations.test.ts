import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * tr() falls back to English when a language is missing, so a forgotten
 * translation would ship silently. Load the anger games' content in each
 * language and check every player-facing string is really in that script.
 */

const SCRIPT = { he: /[֐-׿]/, ar: /[؀-ۿ]/ } as const;

async function contentIn(lang: 'he' | 'ar') {
  vi.resetModules();
  vi.stubGlobal('localStorage', { getItem: () => lang, setItem: () => {}, removeItem: () => {} });
  const words = await import('../words-in-flight/content');
  const shadow = await import('../shadow-wall/content');
  const fortress = await import('../fortress/content');
  const anchors = await import('./anchors');
  const strings: string[] = [
    ...words.SENTENCES.flatMap((s) => s.tokens.flatMap((t) => (t.fix ? [t.text, t.fix] : [t.text]))),
    ...words.LEVEL_NAMES,
    ...Object.values(words.REPLY).flat(),
    ...shadow.SCENES.flatMap((s) => [s.name, s.event, s.anchor, ...s.losses]),
    ...shadow.MY_LOSSES,
    ...fortress.BUBBLES.flatMap((b) => [b.label, b.takes]),
    ...fortress.THREATS.flatMap((t) => [t.label, t.boundary]),
    ...Object.values(fortress.PILLAR_INFO).map((p) => p.name),
    ...fortress.LEVEL_NAMES,
    ...Object.values(anchors.ANCHOR),
  ];
  return strings;
}

describe('translations', () => {
  afterEach(() => vi.unstubAllGlobals());

  for (const lang of ['he', 'ar'] as const) {
    it(`has every anger-game string in ${lang}`, async () => {
      const strings = await contentIn(lang);
      expect(strings.length).toBeGreaterThan(200);
      // The language really switched (otherwise the check below proves nothing).
      expect(strings.filter((s) => SCRIPT[lang].test(s)).length).toBeGreaterThan(200);
      // Tokens without letters (a dash, "…") are fine; anything with Latin letters and none of the script is not.
      const missing = strings.filter((s) => /[A-Za-z]/.test(s) && !SCRIPT[lang].test(s));
      expect(missing).toEqual([]);
    });
  }
});

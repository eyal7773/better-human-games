import { describe, expect, it } from 'vitest';
import { LEVELS, emptyTally, endlessSpeed, honest, nextStreak, parse, segmentHitsRect, starsFor } from './logic';
import { RAW_SENTENCES } from './content';

describe('words in flight', () => {
  it('parses a sweet sting as toxic, dressed as friendly', () => {
    expect(parse('~Oh, great job→I’m upset')).toEqual([{ kind: 't', text: 'Oh, great job', fix: 'I’m upset', sweet: true }]);
  });

  it('parses the sentence notation', () => {
    expect(parse('!You never→I’d love | help | +please')).toEqual([
      { kind: 't', text: 'You never', fix: 'I’d love' },
      { kind: 'n', text: 'help' },
      { kind: 'f', text: 'please' },
    ]);
  });

  it('gives every toxic phrase an honest version, in every language', () => {
    for (const r of RAW_SENTENCES)
      for (const lang of ['en', 'he', 'ar'] as const) {
        const toks = parse(r[lang].replace(/\{([^{}|]*)\|[^{}]*\}/g, '$1'));
        const toxic = toks.filter((t) => t.kind === 't');
        expect(toxic.length, `${lang}: ${r[lang]}`).toBeGreaterThan(0);
        for (const t of toxic) expect(t.fix, `${lang}: ${t.text}`).toBeTruthy();
        for (const t of toks) expect(t.text.length, `${lang}: ${r[lang]}`).toBeGreaterThan(0);
      }
  });


  it('counts a sentence honest only if every toxic word was caught and nothing else cut', () => {
    const t = emptyTally(parse('!a→b | c | +d'));
    expect(honest(t)).toBe(false);
    t.caught = 1;
    expect(honest(t)).toBe(true);
    expect(nextStreak(2, t)).toBe(3);
    t.feelingsCut = 1;
    expect(honest(t)).toBe(false);
    expect(nextStreak(2, t)).toBe(0);
  });

  it('hits rectangles with swipe segments', () => {
    const r = { x: 10, y: 10, w: 20, h: 10 };
    expect(segmentHitsRect(0, 15, 40, 15, r)).toBe(true); // straight through
    expect(segmentHitsRect(12, 12, 14, 14, r)).toBe(true); // inside
    expect(segmentHitsRect(0, 0, 40, 0, r)).toBe(false); // above
    expect(segmentHitsRect(0, 0, 9, 30, r)).toBe(false); // beside
    expect(segmentHitsRect(0, 30, 40, 0, r)).toBe(true); // diagonal
  });

  it('stars need them to still be in the room', () => {
    const l = LEVELS[3];
    expect(starsFor({ finished: true, connection: 0, bestStreak: 9, hits: 0 }, l)).toEqual([false, false, false]);
    expect(starsFor({ finished: true, connection: 40, bestStreak: 3, hits: 1 }, l)).toEqual([true, true, false]);
    expect(starsFor({ finished: true, connection: 90, bestStreak: 2, hits: 0 }, l)).toEqual([true, false, true]);
  });

  it('speeds up endless mode, with a ceiling', () => {
    expect(endlessSpeed(10)).toBeGreaterThan(endlessSpeed(0));
    expect(endlessSpeed(1000)).toBe(2.6);
  });
});

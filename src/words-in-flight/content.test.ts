import { describe, expect, it } from 'vitest';
import { RAW } from './sentences';
import { LEVELS, parse } from './logic';
import { checkPool, PERSONAS } from '../shared/library/classify';
import { query, type Seen } from '../shared/library';

const plain = (t: string) => t.replace(/\{([^{}|]*)\|[^{}]*\}/g, '$1');
const toks = (t: string) => parse(plain(t));

describe('sentences', () => {
  it('are classified so they only reach the homes they belong to', () => {
    expect(checkPool(RAW.map(({ en, he, ar, ...meta }) => ({ meta, texts: [en, he, ar].flatMap((t) => toks(t).flatMap((k) => [k.text, k.fix ?? ''])).filter(Boolean) })))).toEqual([]);
  });

  it('keep their difficulty promises', () => {
    for (const r of RAW)
      for (const lang of ['en', 'he', 'ar'] as const) {
        const t = toks(r[lang]);
        // Sweet stings only from level 7 on (difficulty 5).
        if (t.some((k) => k.sweet)) expect(r.diff, `${r.id} ${lang}: sweet sting below difficulty 5`).toBe(5);
        // The feelings level's sentences always carry a feeling not to cut.
        if (r.diff === 2) expect(t.some((k) => k.kind === 'f'), `${r.id} ${lang}: no feeling`).toBe(true);
      }
  });

  it('write the speaker’s Hebrew gender as {m|f}, never with a slash', () => {
    // Slashes are allowed only for the listener (a partner of either gender), so only check first person.
    for (const r of RAW) expect(r.he, r.id).not.toMatch(/אני \S+\/[הת]\b/);
  });

  it('fill all ten levels without a repeat, for every kind of home', () => {
    const short: string[] = [];
    for (const [name, profile] of Object.entries(PERSONAS))
      for (let run = 1; run <= 5; run++) {
        let seed = run * 7919;
        const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const used: string[] = [];
        const seen: Seen = { n: 0, seen: {} };
        LEVELS.forEach((l, i) => {
          const got = query(RAW, { count: l.sentences, diff: l.diff, gentle: i < 2, exclude: used, profile, seen, random });
          if (got.length < l.sentences) short.push(`${name}, level ${i + 1}: ${got.length}/${l.sentences}`);
          if (i < 2 && got.some((s) => s.heavy)) short.push(`${name}, level ${i + 1}: heavy content`);
          used.push(...got.map((s) => s.id));
        });
      }
    expect([...new Set(short)]).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { en } from './content/en';
import { he } from './content/he';
import { ar } from './content/ar';
import { DILEMMA_META } from './content/meta';
import { checkPool, PERSONAS } from '../shared/library/classify';
import { eligible } from '../shared/library';

const langs = { en, he, ar };

describe('dilemmas', () => {
  it('have the same ids, in the same order, in every language and in the meta', () => {
    const ids = DILEMMA_META.map((m) => m.id);
    for (const c of Object.values(langs)) expect(c.dilemmas.map((d) => d.id)).toEqual(ids);
  });

  for (const [lang, content] of Object.entries(langs)) {
    it(`${lang}: one best, one ok and two bad options each`, () => {
      for (const d of content.dilemmas) {
        const count = (v: string) => d.options.filter((o) => o.v === v).length;
        expect([d.id, count('best'), count('ok'), count('bad')]).toEqual([d.id, 1, 1, 2]);
      }
    });
  }

  it('are classified so they only reach the homes they belong to', () => {
    const texts = (id: string) =>
      Object.values(langs).flatMap((c) => {
        const d = c.dilemmas.find((x) => x.id === id)!;
        return [d.situation, d.why, ...d.options.map((o) => o.text)];
      });
    expect(checkPool(DILEMMA_META.map((meta) => ({ meta, texts: texts(meta.id) })))).toEqual([]);
  });

  it('has enough for every home: three evenings without a repeat', () => {
    const short: string[] = [];
    for (const [name, p] of Object.entries(PERSONAS)) {
      const n = DILEMMA_META.filter((m) => eligible(m, p)).length;
      if (n < MIN_PER_HOME) short.push(`${name}: ${n}`);
    }
    expect(short).toEqual([]);
  });
});

/** Three rounds an evening; enough that a home sees fresh ones for a while (spec 6). */
const MIN_PER_HOME = 25;

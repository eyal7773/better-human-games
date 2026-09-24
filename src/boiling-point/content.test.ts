import { describe, expect, it } from 'vitest';
import { en } from './content/en';
import { he } from './content/he';
import { ar } from './content/ar';
import { GENDER_TAGS, HOUSEHOLD_TAGS } from '../shared/tags';

const langs = { en, he, ar };

describe('dilemmas', () => {
  it('have the same ids and tags in every language', () => {
    const shape = (c: typeof en) => c.dilemmas.map((d) => ({ id: d.id, tags: d.tags }));
    expect(shape(he)).toEqual(shape(en));
    expect(shape(ar)).toEqual(shape(en));
  });

  it('have unique ids', () => {
    const ids = en.dilemmas.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const [lang, content] of Object.entries(langs)) {
    it(`${lang}: one best, one ok and two bad options each`, () => {
      for (const d of content.dilemmas) {
        const count = (v: string) => d.options.filter((o) => o.v === v).length;
        expect([d.id, count('best'), count('ok'), count('bad')]).toEqual([d.id, 1, 1, 2]);
      }
    });
  }

  it('each have an audience or a gender, and a topic', () => {
    const audience = [...HOUSEHOLD_TAGS, ...GENDER_TAGS] as string[];
    for (const d of en.dilemmas) {
      expect(d.tags.some((t) => audience.includes(t)), d.id).toBe(true);
      expect(d.tags.some((t) => !audience.includes(t)), d.id).toBe(true);
    }
  });
});

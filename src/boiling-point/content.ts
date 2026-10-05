import { tr } from '../shared/i18n';
import { agree } from '../shared/profile';
import type { Meta } from '../shared/library';
import { DILEMMA_META } from './content/meta';
import { en } from './content/en';
import { he } from './content/he';
import { ar } from './content/ar';

export type Verdict = 'best' | 'ok' | 'bad';

export type { AudienceTag, TopicTag, Tag } from '../shared/tags';

/** The words of a dilemma, per language. */
export interface DilemmaText {
  id: string;
  situation: string;
  options: { text: string; v: Verdict }[];
  why: string;
}

/** A dilemma as the game uses it: words in the player's language and grammar, plus who it happens with. */
export type Dilemma = DilemmaText & Meta;

/**
 * Family-life flashpoints. Each has one constructive response, one that is
 * fine but misses something, and two "boiling" ones (explosive / passive).
 * Every language keeps the same dilemma ids, so saved history carries over.
 */
export interface Content {
  dilemmas: DilemmaText[];
  shouts: string[];
  notifs: { app: string; color: string; title: string; body: string }[];
  lures: string[];
}

const content = tr({ en, he, ar });

const META = new Map(DILEMMA_META.map((m) => [m.id, m]));

export const DILEMMAS: Dilemma[] = content.dilemmas.map((d) => ({
  ...META.get(d.id)!,
  ...d,
  situation: agree(d.situation),
  options: d.options.map((o) => ({ ...o, text: agree(o.text) })),
  why: agree(d.why),
}));
export const SHOUTS = content.shouts;
export const NOTIFS = content.notifs;
export const LURES = content.lures;

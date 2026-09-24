import { tr } from '../shared/i18n';
import type { Tag } from '../shared/tags';
import { en } from './content/en';
import { he } from './content/he';
import { ar } from './content/ar';

export type Verdict = 'best' | 'ok' | 'bad';

export type { AudienceTag, TopicTag, Tag } from '../shared/tags';

export interface Dilemma {
  id: string;
  tags: Tag[];
  situation: string;
  options: { text: string; v: Verdict }[];
  why: string;
}

/**
 * Family-life flashpoints. Each has one constructive response, one that is
 * fine but misses something, and two "boiling" ones (explosive / passive).
 * Every language keeps the same dilemma ids, so saved history carries over.
 */
export interface Content {
  dilemmas: Dilemma[];
  shouts: string[];
  notifs: { app: string; color: string; title: string; body: string }[];
  lures: string[];
}

const content = tr({ en, he, ar });

export const DILEMMAS = content.dilemmas;
export const SHOUTS = content.shouts;
export const NOTIFS = content.notifs;
export const LURES = content.lures;

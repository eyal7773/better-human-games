import { tr } from '../shared/i18n';
import { en } from './content/en';
import { he } from './content/he';
import { ar } from './content/ar';

export type Verdict = 'best' | 'ok' | 'bad';

/**
 * Tags let us match dilemmas to the player. They are always English, and the
 * same in every language file.
 * - Who it fits: a dilemma may fit several audiences. A gender tag is added only
 *   when the situation is specific to it; no gender tag means it fits everyone.
 * - What it's about: the kind of flashpoint.
 */
export type AudienceTag =
  | 'parent-young-child' // ages 0–6
  | 'parent-school-age' // ages 6–12
  | 'parent-teen'
  | 'partner'
  | 'adult-child' // grown son or daughter of an ageing parent
  | 'grandparent'
  | 'men'
  | 'women';
export type TopicTag =
  | 'mess'
  | 'chores'
  | 'mealtime'
  | 'bedtime'
  | 'morning-rush'
  | 'siblings'
  | 'homework'
  | 'noise'
  | 'work-life'
  | 'household'
  | 'screens'
  | 'money'
  | 'in-laws' // grandparents and in-laws stepping into your parenting
  | 'caregiving'
  | 'health'
  | 'mental-load' // the invisible work of noticing, planning and remembering
  | 'respect'
  | 'independence'
  | 'honesty'
  | 'public'
  | 'connection';
export type Tag = AudienceTag | TopicTag;

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

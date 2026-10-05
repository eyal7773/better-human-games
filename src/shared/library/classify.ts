import { sanitize, type Profile } from '../profile';
import { TOPIC_TAGS, type HouseholdTag, type TopicTag } from '../tags';
import { eligible, OTHERS, type Meta } from './index';

/**
 * Classification rules every content item must pass (used by each game's
 * tests). The point: whatever the text talks about, the tags must keep it
 * away from homes it doesn't belong to.
 */

const home = (household: HouseholdTag[]): Profile => sanitize({ status: 'done', address: 'x', household });

/** A home with no kids and no grandkids — but everyone else. */
const NO_KIDS = home(['no-kids', 'partner', 'adult-child', 'roommates']);
/** A home with everyone but a partner. */
const NO_PARTNER = home(['parent-young-child', 'parent-school-age', 'parent-teen', 'adult-child', 'grandparent', 'roommates']);
/** A home with everyone but an ageing parent in their care. */
const NO_CARE = home(['parent-young-child', 'parent-school-age', 'parent-teen', 'partner', 'grandparent', 'roommates']);
/** A home with everyone but roommates. */
const NO_ROOMMATES = home(['parent-young-child', 'parent-school-age', 'parent-teen', 'partner', 'adult-child', 'grandparent']);

/** Topics that only exist with kids (or grandkids) around. */
const KID_TOPICS: TopicTag[] = ['homework', 'bedtime', 'siblings', 'morning-rush'];

/** A Hebrew word with its attached prefixes (ה, ו, ש, ל, ב, כ), standing alone. Short words like בן/בת are left out: too ambiguous (בן הזוג, שבת). */
const he = (words: string) => `(?<![\u0590-\u05ff])[הושלבכ]{0,3}(?:${words})(?![\u0590-\u05ff])`;
const en = (words: string) => `\\b(?:${words})\\b`;
const words = (e: string, h: string) => new RegExp(`${en(e)}|${he(h)}`, 'i');

/** Words that place a situation in a home. English is the source text; Hebrew is checked too. */
const WORDS: { re: RegExp; not: Profile; what: string }[] = [
  {
    re: words(
      'kids?|child|children|son|daughter|teens?|teenager|baby|toddler|little one|daycare|kindergarten|school|homework|curfew',
      'ילד|ילדה|ילדים|ילדיך|הבן שלכם|הבת שלכם|בנך|בתך|תינוק|תינוקת|פעוט|גן הילדים|בית הספר|בית ספר|שיעורי בית|מתבגר|מתבגרת|נער|נערה',
    ),
    not: NO_KIDS,
    what: 'kids',
  },
  { re: words('partner|husband|wife|spouse', 'בן הזוג|בת הזוג|בן או בת הזוג|בן/בת הזוג|בעלך|אשתך|בעלי|אשתי'), not: NO_PARTNER, what: 'a partner' },
  { re: words('roommates?|flatmates?', 'שותף|שותפה|שותפים|שותפות|שותפך|שותפתך'), not: NO_ROOMMATES, what: 'roommates' },
];

/** Problems with one item (empty when it's fine). `texts` = all its words, in every language. */
export function checkEntry(m: Meta, texts: readonly string[]): string[] {
  const out: string[] = [];
  const bad = (msg: string) => out.push(`${m.id}: ${msg}`);
  if (!m.id) bad('no id');
  if (!m.with.length) bad('no "with"');
  for (const o of m.with) if (!OTHERS.includes(o)) bad(`unknown "with" ${o}`);
  if (!m.topics.length) bad('no topic');
  for (const t of m.topics) if (!TOPIC_TAGS.includes(t)) bad(`unknown topic ${t}`);
  if (!(m.diff >= 1 && m.diff <= 5)) bad(`diff ${m.diff}`);
  if (m.topics.some((t) => KID_TOPICS.includes(t)) && eligible(m, NO_KIDS)) bad('a kid topic that reaches homes without kids');
  if (m.topics.includes('caregiving') && eligible(m, NO_CARE)) bad('caregiving that reaches homes without an ageing parent');
  const all = texts.join('\n');
  for (const w of WORDS) if (w.re.test(all) && eligible(m, w.not)) bad(`mentions ${w.what} (“${all.match(w.re)?.[0]}”) but reaches homes without them`);
  if (!texts.length || texts.some((t) => !t.trim())) bad('empty text');
  return out;
}

/** All problems in a pool, including duplicate ids. */
export function checkPool(items: readonly { meta: Meta; texts: readonly string[] }[]): string[] {
  const out = items.flatMap((x) => checkEntry(x.meta, x.texts));
  const ids = items.map((x) => x.meta.id);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) out.push(`${id}: duplicate id`);
  return out;
}

/** Representative homes every game must have enough content for (spec 3.5). */
export const PERSONAS: Record<string, Profile> = {
  'parent of little kids': home(['parent-young-child', 'partner']),
  'parent of a teen': home(['parent-teen', 'partner']),
  'single parent': home(['single-parent', 'parent-school-age']),
  'couple, no kids': home(['partner', 'no-kids']),
  'lives alone': home(['no-kids', 'lives-alone']),
  roommates: home(['no-kids', 'roommates']),
  'cares for a parent': home(['adult-child', 'no-kids']),
  grandparent: home(['grandparent', 'partner']),
  'no profile': sanitize({}),
};

import { tr } from './i18n';
import { load } from './storage';
import { wallet } from './zen';

/**
 * Which Calm Islands are open. Each island belongs to a game and opens the
 * first time you finish a level there — or once you've earned enough zen
 * anywhere, so nobody who sticks to one game gets stuck. Kept apart from the
 * island page so every game can tell you when you opened one.
 */

export interface IsleMeta {
  id: string;
  emoji: string;
  name: string;
  /** The game's page slug; its first finished level opens the island. */
  game: string;
  gameName: string;
  /** Lifetime zen that opens it too. */
  threshold: number;
}

export const ISLES: IsleMeta[] = [
  { id: 'garden', emoji: '🌸', game: 'boiling-point', threshold: 0, name: tr({ en: 'Garden of Calm', he: 'גן השקט', ar: 'حديقة السكينة' }), gameName: tr({ en: 'Boiling Point', he: 'נקודת רתיחה', ar: 'نقطة الغليان' }) },
  { id: 'shore', emoji: '🐚', game: 'inner-radio', threshold: 300, name: tr({ en: 'Shore of Sounds', he: 'חוף הצלילים', ar: 'شاطئ الأصوات' }), gameName: tr({ en: 'Inner Radio', he: 'רדיו פנימי', ar: 'الراديو الداخلي' }) },
  { id: 'hill', emoji: '🪁', game: 'words-in-flight', threshold: 900, name: tr({ en: 'Hill of Wind', he: 'גבעת הרוח', ar: 'تلة الريح' }), gameName: tr({ en: 'Words in Flight', he: 'מילים באוויר', ar: 'كلمات في الهواء' }) },
  { id: 'forest', emoji: '🏮', game: 'shadow-wall', threshold: 1800, name: tr({ en: 'Lantern Forest', he: 'יער הפנסים', ar: 'غابة الفوانيس' }), gameName: tr({ en: 'Shadow on the Wall', he: 'צל על הקיר', ar: 'ظلّ على الحائط' }) },
];

export const isleMeta = (id: string) => ISLES.find((i) => i.id === id);

/** The islands open for these lifetime earnings and finished games. */
export function openIsles(earned: number, played: (game: string) => boolean) {
  return ISLES.filter((i) => i.threshold <= earned || played(i.game)).map((i) => i.id);
}

/** True once a level of that game is finished (its saved progress lists one as done). */
export function finishedALevel(game: string) {
  const p = load<{ done?: unknown }>(`bhg.${game}.v1`, {});
  return Array.isArray(p.done) && p.done.length > 0;
}

export const currentlyOpen = () => openIsles(wallet.earned, finishedALevel);

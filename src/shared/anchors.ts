import { tr } from './i18n';
import { heSelf } from './profile';

/**
 * Anchor sentences: the exact words the games end on, identical in every game
 * so they are the same words you reach for at home.
 */

export const ANCHOR = {
  underneath: tr({
    en: 'What am I feeling under the anger?',
    he: `מה אני ${heSelf('מרגיש', 'מרגישה')} מתחת לכעס?`,
    ar: 'ماذا أشعر تحت الغضب؟',
  }),
  sentence: tr({
    en: '“I feel ___ when ___, because ___ matters to me.”',
    he: `"אני ${heSelf('מרגיש', 'מרגישה')} ___ כש___, כי ___ חשוב לי."`,
    ar: '«أشعر بـ___ عندما ___، لأن ___ مهمّ لي.»',
  }),
  taken: tr({ en: 'What was really taken from me?', he: 'מה באמת לקחו לי?', ar: 'ما الذي أُخذ منّي حقًّا؟' }),
  threat: tr({
    en: 'Does this threaten what really matters to me?',
    he: 'זה מאיים על מה שחשוב לי באמת?',
    ar: 'هل يهدّد هذا ما يهمّني حقًّا؟',
  }),
  boundary: tr({
    en: '“I’m not okay with this. Let’s talk when we’re calm.”',
    he: `"אני לא ${heSelf('מסכים', 'מסכימה')} לזה. בואו נדבר כשנירגע."`,
    ar: '«أنا لا أقبل بهذا. لنتحدّث عندما نهدأ.»',
  }),
};

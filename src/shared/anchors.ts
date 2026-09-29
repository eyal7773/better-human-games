import { tr } from './i18n';
import { profile } from './profile';

/**
 * Anchor sentences: the exact words the games end on, identical in every game
 * so they are the same words you reach for at home.
 */

const heMe = (m: string, f: string) => (profile.address === 'f' ? f : profile.address === 'm' ? m : `${m}/ה`);

export const ANCHOR = {
  underneath: tr({
    en: 'What am I feeling under the anger?',
    he: `מה אני ${heMe('מרגיש', 'מרגישה')} מתחת לכעס?`,
    ar: 'ماذا أشعر تحت الغضب؟',
  }),
  sentence: tr({
    en: '“I feel ___ when ___, because ___ matters to me.”',
    he: `"אני ${heMe('מרגיש', 'מרגישה')} ___ כש___, כי ___ חשוב לי."`,
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
    he: `"אני לא ${heMe('מסכים', 'מסכימה')} לזה. בואו נדבר כשנירגע."`,
    ar: '«أنا لا أقبل بهذا. لنتحدّث عندما نهدأ.»',
  }),
};

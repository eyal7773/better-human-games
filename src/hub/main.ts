import '../shared/base.css';
import './hub.css';
import { kettleSVG, setKettleMood } from '../shared/kettle';
import { lang, langSwitcher, tr } from '../shared/i18n';

// The page ships in English; other languages swap text in by data-i18n key.
const TEXT: Record<string, { he: string; ar: string }> = {
  wordmark: { he: 'בן אדם טוב יותר', ar: 'إنسان أفضل' },
  title: { he: 'משחקים לרגעים שבהם הכי קל לאבד את זה', ar: 'ألعاب للّحظات التي يسهل فيها أن نفقد أعصابنا' },
  lede: {
    he: 'כל משחק מאמן תגובה אחת מהחיים האמיתיים. כמה דקות בטלפון, ובפעם הבאה שזה קורה באמת — הגוף כבר מכיר את הדרך.',
    ar: 'كل لعبة تدرّب ردّ فعل واحدًا من الحياة الحقيقية. بضع دقائق على الهاتف، وفي المرة القادمة التي يحدث فيها ذلك فعلًا — يعرف الجسد الطريق.',
  },
  bpTitle: { he: 'נקודת רתיחה', ar: 'نقطة الغليان' },
  bpBody: {
    he: 'המשחק מעצבן אתכם בכוונה. אתם מתרגלים לשים לב לחום כשהוא רק מתחיל, לעצור, לנשום — ולבחור תגובה שלא תצטערו עליה.',
    ar: 'هذه اللعبة تستفزّكم عن قصد. تتدرّبون على ملاحظة الحرارة وهي تبدأ، على التوقّف، على التنفّس — وعلى اختيار ردّ لن تندموا عليه.',
  },
  bpMeta: { he: 'על כעס בבית ובמשפחה. בערך 5 דקות לערב.', ar: 'عن الغضب في البيت والعائلة. حوالي 5 دقائق في المساء.' },
  play: { he: 'לשחק', ar: 'العبوا' },
  next: { he: 'עוד משחקים בדרך.', ar: 'المزيد من الألعاب في الطريق.' },
  source: { he: 'קוד פתוח ב־GitHub', ar: 'مفتوح المصدر على GitHub' },
};

if (lang !== 'en') {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const t = TEXT[el.dataset.i18n!];
    if (t) el.textContent = t[lang as 'he' | 'ar'];
  });
}
document.title = tr({ en: 'Better Human', he: 'בן אדם טוב יותר', ar: 'إنسان أفضل' });
document
  .querySelector('meta[name="description"]')
  ?.setAttribute(
    'content',
    tr({
      en: 'Short mobile games that train life’s hard moments: notice, pause, and choose a response.',
      he: 'משחקים קצרים לנייד שמאמנים את הרגעים הקשים של החיים: לשים לב, לעצור, ולבחור תגובה.',
      ar: 'ألعاب قصيرة للهاتف تدرّب على لحظات الحياة الصعبة: أن نلاحظ، أن نتوقف، وأن نختار ردًّا.',
    }),
  );
document.querySelector('.hub-bar')?.append(langSwitcher());
document.documentElement.removeAttribute('data-i18n-pending');

const holder = document.getElementById('hub-kettle');
if (holder) {
  holder.innerHTML = kettleSVG();
  const svg = holder.querySelector('svg');
  const card = holder.closest('.game-card');
  // Hovering or pressing the card heats the kettle up — a tiny preview of the game.
  const heat = (on: boolean) => setKettleMood(svg, on ? 0.9 : 0);
  card?.addEventListener('pointerenter', () => heat(true));
  card?.addEventListener('pointerleave', () => heat(false));
  card?.addEventListener('focus', () => heat(true));
  card?.addEventListener('blur', () => heat(false));
}

import '../shared/base.css';
import './hub.css';
import './home-builder.css';
import { kettleSVG, setKettleMood } from '../shared/kettle';
import { lang, langSwitcher, tr } from '../shared/i18n';
import { buddySVG } from '../catch-me/buddy';
import { h } from '../shared/dom';
import { avatarSVG } from '../shared/avatar';
import { profile } from '../shared/profile';
import { openHomeBuilder } from './home-builder';
import { loadSave as loadCatchMe } from '../catch-me-3d/save';
import { mountIslandBanner } from './island-banner';
import { angryNowLabel } from '../angry-now/label';

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
  c3Title: { he: 'תפוס אותי', ar: 'امسكني' },
  c3Bubble: { he: 'תפוס אותי!', ar: 'امسكني!' },
  c3Body: {
    he: 'ציקי, הכפתור האדום, לוחץ לכולם על הכפתורים. רודפים אחריו חדר אחרי חדר בבית צעצוע בתלת־ממד — וככל שאתם כועסים יותר, הוא חזק יותר. לשים לב ולנשום — ככה מנצחים.',
    ar: 'زِنّو، الزر الأحمر، يضغط على أزرار الجميع. طاردوه غرفةً غرفة في بيت ألعاب ثلاثي الأبعاد — وكلما غضبتم أكثر، صار أقوى. أن تلاحظوا وتتنفّسوا — هكذا تفوزون.',
  },
  c3Meta: { he: 'סיפור בשישה חדרים. 2–3 דקות לחדר.', ar: 'قصة في ست غرف. 2–3 دقائق لكل غرفة.' },
  irTitle: { he: 'רדיו פנימי', ar: 'الراديو الداخلي' },
  irBody: {
    he: 'הכעס הוא רעש סטטי חזק. סובבו את החוגה עד שהרגש שמתחתיו נשמע — עלבון, דאגה, עייפות — ואז אמרו אותו ישר, בלי להאשים.',
    ar: 'الغضب تشويش عالٍ. أديروا المؤشر حتى يُسمع الشعور الذي تحته — إهانة، قلق، تعب — ثم قولوه مباشرة، بلا اتهام.',
  },
  irMeta: { he: 'על מה שמרגישים מתחת לכעס. דקה־שתיים לסצנה.', ar: 'عمّا نشعر به تحت الغضب. دقيقة أو اثنتان لكل مشهد.' },
  wfTitle: { he: 'מילים באוויר', ar: 'كلمات في الهواء' },
  wfW1: { he: 'אתה תמיד', ar: 'أنت دائمًا' },
  wfW2: { he: 'אני עייף/ה', ar: 'أنا متعب' },
  wfW3: { he: 'אשמח לעזרה', ar: 'أحتاج مساعدة' },
  wfBody: {
    he: 'המילים הכועסות יוצאות לפני שחושבים. החליקו כדי לתפוס באוויר את ה"תמיד", ה"אף פעם" והעלבונות — ותנו למה שאתם באמת מרגישים לנחות.',
    ar: 'الكلمات الغاضبة تخرج قبل التفكير. اسحبوا لتلتقطوا في الهواء «دائمًا» و«أبدًا» والإهانات — ودعوا ما تشعرون به حقًا يصل.',
  },
  wfMeta: { he: 'משחק ארקייד על לומר את זה ישירות. בערך דקה לשלב.', ar: 'لعبة أركيد عن قول الأشياء مباشرة. حوالي دقيقة لكل مرحلة.' },
  swTitle: { he: 'צל על הקיר', ar: 'ظلّ على الحائط' },
  swBody: {
    he: 'מיץ שנשפך מטיל צל של מפלצת. הזיזו את האור כדי לראות את הגודל האמיתי, ואז שאלו: מה באמת לקחו לי? זה באמת מאיים?',
    ar: 'عصير مسكوب يُلقي ظلّ وحش. حرّكوا الضوء لتروا حجمه الحقيقي، ثم اسألوا: ما الذي أُخذ مني حقًا؟ هل هو تهديد فعلًا؟',
  },
  swMeta: { he: 'על מה שבאמת על הכף. דקה־שתיים לסצנה.', ar: 'عمّا هو على المحك حقًا. دقيقة أو اثنتان لكل مشهد.' },
  foTitle: { he: 'המבצר', ar: 'الحصن' },
  foBody: {
    he: 'טאואר דיפנס הפוך. רוב הטרדות הן בועות שמתפוצצות על החומה. תותח הכעס סודק את היחסים — שמרו את האנרגיה למגן רגוע מול האיומים האמיתיים המעטים.',
    ar: 'دفاع أبراج معكوس. معظم المضايقات فقاعات تنفجر على السور. مدفع الغضب يشقّ العلاقات — احفظوا طاقتكم لدرع هادئ أمام التهديدات الحقيقية القليلة.',
  },
  foMeta: { he: 'על מה שבאמת מאיים על מה שחשוב. 2 דקות לשלב.', ar: 'عمّا يهدّد حقًا ما يهمّ. دقيقتان لكل مرحلة.' },
  cmTitle: { he: 'תפוס אותי פשוט', ar: 'امسكني البسيط' },
  cmBubble: { he: 'תפוס אותי!', ar: 'امسكني!' },
  cmBody: {
    he: 'כפתור קטן שממש לא רוצה שילחצו עליו. אתם רודפים אחריו, התסכול עולה — וכשזה רותח, מחזיקים ונושמים ארבע שניות.',
    ar: 'زرّ صغير لا يريد أبدًا أن يُضغط عليه. تطاردونه، والإحباط يرتفع — وعندما يغلي، تضغطون مطوّلًا وتتنفّسون أربع ثوانٍ.',
  },
  cmMeta: { he: 'על תסכולים קטנים. דקה־שתיים, מתי שבא.', ar: 'عن الإحباطات الصغيرة. دقيقة أو اثنتان، متى شئتم.' },
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
// "My home": your character sits next to the language switch and opens the builder.
const meBtn = h('button', { class: 'hub-me', type: 'button', 'aria-label': tr({ en: 'My home', he: 'הבית שלי', ar: 'بيتي' }) });
// Once the Catch Me story is finished, Pesky lives in your home, next to you.
const peskyHome = loadCatchMe().finished;
// "I'm angry right now": a red stop-sign distress button at the bar's end, for the real moment.
const helpBtn = h('a', {
  class: 'hub-help',
  href: './angry-now/',
  html: `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="29.3,0 70.7,0 100,29.3 100,70.7 70.7,100 29.3,100 0,70.7 0,29.3" fill="#fff"/><polygon points="31.4,5 68.6,5 95,31.4 95,68.6 68.6,95 31.4,95 5,68.6 5,31.4" fill="#e3262d"/><text x="50" y="51" text-anchor="middle" dominant-baseline="central" fill="#fff">HELP</text></svg>`,
});
const paintAngry = () => {
  const label = angryNowLabel();
  helpBtn.setAttribute('aria-label', label);
  helpBtn.title = label;
};
const paintMe = () => {
  paintAngry();
  if (profile.status === 'done') meBtn.innerHTML = avatarSVG(profile.shape, profile.color);
  else meBtn.textContent = '🏠';
  if (peskyHome) meBtn.append(h('span', { class: 'hub-pesky', html: buddySVG() }));
};
paintMe();
meBtn.addEventListener('click', () => openHomeBuilder({ edit: true, onChange: paintMe }));
const tools = h('div', { class: 'hub-tools' }, meBtn, langSwitcher());
document.querySelector('.hub-bar')?.append(tools, helpBtn);
mountIslandBanner(document.querySelector('.game-card'), tools);
document.documentElement.removeAttribute('data-i18n-pending');
document
  .querySelector('.hub-foot')
  ?.append(h('span', { class: 'hub-version' }, `${tr({ en: 'Version', he: 'גרסה', ar: 'الإصدار' })} ${__APP_VERSION__}`));

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

// The runaway button sidesteps your pointer on its card, like in the game.
for (const id of ['hub-buddy', 'hub-buddy3d']) {
  const buddy = document.getElementById(id);
  if (!buddy) continue;
  buddy.insertAdjacentHTML('afterbegin', buddySVG());
  const card = buddy.closest('.game-card');
  card?.addEventListener('pointerenter', () => buddy.classList.add('dodge'));
  card?.addEventListener('pointerleave', () => buddy.classList.remove('dodge'));
}

// First visit opens the builder once; games link back here with ?profile=edit.
const params = new URLSearchParams(location.search);
if (params.get('profile') === 'edit') {
  params.delete('profile');
  const rest = params.toString();
  history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);
  openHomeBuilder({ edit: true, onChange: paintMe });
} else if (profile.status === 'new') {
  openHomeBuilder({ onChange: paintMe });
}

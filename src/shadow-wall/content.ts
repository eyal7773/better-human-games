import { tr } from '../shared/i18n';
import type { Response } from './logic';
import type { Meta } from '../shared/library';
import { agree } from '../shared/profile';

type L = { en: string; he: string; ar: string };
type LL = { en: string[]; he: string[]; ar: string[] };

export type Puppet = 'cup' | 'marker' | 'clock' | 'phone' | 'car' | 'mug' | 'mouth' | 'envelope' | 'blob';

export interface Scene extends Meta {
  name: string;
  event: string;
  puppet: Puppet;
  emoji: string;
  losses: string[];
  /** The real threat to your existence, 0…100 (%). */
  threat: number;
  right: Exclude<Response, 'roar'>;
  /** Something real is here: the monster never fully goes away. */
  real: boolean;
  /** Where the true-size frame sits, relative to the puppet (wall widths). */
  frameDx: number;
  anchor: string;
}

const S = (o: Omit<Meta, 'id'> & {
  id: string;
  name: L;
  event: L;
  puppet: Puppet;
  emoji: string;
  losses: LL;
  threat: number;
  right: 'let' | 'boundary';
  frameDx: number;
  anchor: L;
}): Scene => ({
  with: o.with,
  requires: o.requires,
  gender: o.gender,
  topics: o.topics,
  setting: o.setting,
  diff: o.diff,
  heavy: o.heavy,
  id: o.id,
  name: agree(tr(o.name)),
  event: agree(tr(o.event)),
  puppet: o.puppet,
  emoji: o.emoji,
  losses: tr(o.losses).map((l) => agree(l)),
  threat: o.threat,
  right: o.right,
  real: o.right === 'boundary',
  frameDx: o.frameDx,
  anchor: agree(tr(o.anchor)),
});

export const SCENES: Scene[] = [
  S({
    id: 'juice',
    with: ['young-child', 'child'], topics: ['mess'], setting: 'home', diff: 1,
    name: { en: 'Juice on the sofa', he: 'מיץ על הספה', ar: 'عصير على الكنبة' },
    event: {
      en: 'The kids spilled a whole glass of juice on the new sofa.',
      he: 'הילדים שפכו כוס מיץ שלמה על הספה החדשה.',
      ar: 'سكب الأولاد كوب عصير كاملًا على الكنبة الجديدة.',
    },
    puppet: 'cup',
    emoji: '🥤',
    losses: { en: ['10 minutes of cleaning', 'a wet cushion'], he: ['10 דקות ניקיון', 'כרית רטובה'], ar: ['10 دقائق تنظيف', 'وسادة مبللة'] },
    threat: 2,
    right: 'let',
    frameDx: -0.05,
    anchor: { en: 'What was really taken from me? Ten minutes.', he: 'מה באמת לקחו לי? עשר דקות.', ar: 'ما الذي أُخذ مني حقًا؟ عشر دقائق.' },
  }),
  S({
    id: 'marker',
    with: ['young-child'], topics: ['mess'], setting: 'home', diff: 1,
    name: { en: 'A marker on the wall', he: 'טוש על הקיר', ar: 'قلم على الحائط' },
    event: {
      en: 'Your four-year-old drew a big purple sun on the hallway wall.',
      he: 'הבת בת הארבע ציירה שמש סגולה ענקית על קיר המסדרון.',
      ar: 'رسمت ابنتكم ذات الأربع سنوات شمسًا بنفسجية كبيرة على حائط الممر.',
    },
    puppet: 'marker',
    emoji: '🖍️',
    losses: { en: ['a magic sponge', 'a bit of paint'], he: ['ספוג קסם', 'קצת צבע'], ar: ['إسفنجة سحرية', 'قليل من الطلاء'] },
    threat: 1,
    right: 'let',
    frameDx: 0.06,
    anchor: {
      en: 'A sponge. And maybe a photo of the sun first.',
      he: 'ספוג. ואולי קודם תמונה של השמש.',
      ar: 'إسفنجة. وربما صورة للشمس أولًا.',
    },
  }),
  S({
    id: 'late',
    with: ['partner'], topics: ['mealtime'], setting: 'home', diff: 2,
    name: { en: 'Twenty minutes late', he: 'עשרים דקות איחור', ar: 'عشرون دقيقة تأخير' },
    event: {
      en: 'Your partner is 20 minutes late for dinner. Again.',
      he: 'בן או בת הזוג מאחרים לארוחה בעשרים דקות. שוב.',
      ar: 'شريككم تأخر عشرين دقيقة عن العشاء. مرة أخرى.',
    },
    puppet: 'clock',
    emoji: '⏰',
    losses: { en: ['20 minutes', 'a lukewarm dinner'], he: ['20 דקות', 'אוכל פושר'], ar: ['20 دقيقة', 'عشاء فاتر'] },
    threat: 3,
    right: 'let',
    frameDx: -0.07,
    anchor: {
      en: 'Twenty minutes and a microwave. We can talk about the “again” calmly, later.',
      he: 'עשרים דקות ומיקרוגל. על ה"שוב" אפשר לדבר ברוגע, אחר כך.',
      ar: 'عشرون دقيقة وميكروويف. عن «مرة أخرى» نتكلم بهدوء لاحقًا.',
    },
  }),
  S({
    id: 'phone',
    with: ['teen'], topics: ['honesty', 'respect'], setting: 'home', diff: 3,
    name: { en: 'Your messages, read', he: 'ההודעות שלכם נקראו', ar: 'رسائلكم قُرئت' },
    event: {
      en: 'You find out your teen read the private messages on your phone.',
      he: 'גיליתם שהנער קרא את ההודעות הפרטיות בטלפון שלכם.',
      ar: 'اكتشفتم أن ابنكم المراهق قرأ الرسائل الخاصة في هاتفكم.',
    },
    puppet: 'phone',
    emoji: '📱',
    losses: { en: ['privacy', 'trust'], he: ['פרטיות', 'אמון'], ar: ['الخصوصية', 'الثقة'] },
    threat: 22,
    right: 'boundary',
    frameDx: 0.04,
    anchor: {
      en: '“My phone is private. I’m upset, and we’ll talk about trust after dinner.”',
      he: '"הטלפון שלי פרטי. אני {כועס|כועסת}, ונדבר על אמון אחרי ארוחת הערב."',
      ar: '«هاتفي خاص. أنا منزعج، وسنتحدث عن الثقة بعد العشاء.»',
    },
  }),
  S({
    id: 'traffic',
    with: ['none'], topics: ['road'], setting: 'road', diff: 1,
    name: { en: 'Traffic jam', he: 'פקק', ar: 'زحمة سير' },
    event: {
      en: 'Bumper to bumper. You’ll be fifteen minutes late for work.',
      he: 'פקק צפוף. תאחרו לעבודה ברבע שעה.',
      ar: 'زحمة خانقة. ستتأخرون عن العمل ربع ساعة.',
    },
    puppet: 'car',
    emoji: '🚗',
    losses: { en: ['15 minutes', 'an awkward “good morning”'], he: ['רבע שעה', '"בוקר טוב" מביך'], ar: ['ربع ساعة', '«صباح الخير» محرجة'] },
    threat: 4,
    right: 'let',
    frameDx: 0.08,
    anchor: {
      en: 'Fifteen minutes. A message to the boss, and some music.',
      he: 'רבע שעה. הודעה לבוס, וקצת מוזיקה.',
      ar: 'ربع ساعة. رسالة للمدير، وبعض الموسيقى.',
    },
  }),
  S({
    id: 'mug',
    with: ['none'], topics: ['household'], setting: 'home', diff: 1,
    name: { en: 'The favorite mug', he: 'הספל האהוב', ar: 'الكوب المفضّل' },
    event: {
      en: 'Your favorite mug — a gift from a dear friend — slips and breaks.',
      he: 'הספל האהוב שלכם, מתנה מחבר קרוב, מחליק ונשבר.',
      ar: 'كوبكم المفضل، هدية من صديق عزيز، ينزلق وينكسر.',
    },
    puppet: 'mug',
    emoji: '☕',
    losses: { en: ['a mug', '(the memory stays)'], he: ['ספל', '(הזיכרון נשאר)'], ar: ['كوب', '(الذكرى باقية)'] },
    threat: 0,
    right: 'let',
    frameDx: -0.03,
    anchor: {
      en: 'It’s okay to be sad about it. The memory wasn’t in the clay.',
      he: 'מותר להצטער על זה. הזיכרון לא היה בחרסינה.',
      ar: 'لا بأس بالحزن عليه. الذكرى لم تكن في الفخار.',
    },
  }),
  S({
    id: 'joke',
    with: ['family'], requires: ['parent-young-child', 'parent-school-age', 'parent-teen', 'single-parent'], topics: ['respect', 'in-laws'], setting: 'home', diff: 4, heavy: true,
    name: { en: 'A cruel joke', he: 'בדיחה אכזרית', ar: 'نكتة قاسية' },
    event: {
      en: 'At a family dinner, an uncle mocks your son’s weight. Everyone laughs.',
      he: 'בארוחה משפחתית, דוד לועג למשקל של הבן שלכם. כולם צוחקים.',
      ar: 'في عشاء عائلي، يسخر عمّ من وزن ابنكم. الجميع يضحك.',
    },
    puppet: 'mouth',
    emoji: '😬',
    losses: {
      en: ['your child’s dignity', 'his sense of safety'],
      he: ['הכבוד של הילד', 'תחושת הביטחון שלו'],
      ar: ['كرامة طفلكم', 'إحساسه بالأمان'],
    },
    threat: 25,
    right: 'boundary',
    frameDx: -0.06,
    anchor: {
      en: '“That’s not okay to say about him. We don’t joke like that in our family.”',
      he: '"זה לא בסדר להגיד עליו. אצלנו לא צוחקים ככה."',
      ar: '«ليس مقبولًا أن يُقال هذا عنه. نحن لا نمزح هكذا في عائلتنا.»',
    },
  }),
  S({
    id: 'email',
    with: ['boss'], topics: ['work', 'work-life'], setting: 'online', diff: 2,
    name: { en: '“We need to talk”', he: '"צריך לדבר"', ar: '«يجب أن نتحدث»' },
    event: {
      en: '10 p.m. An email from your boss: “We need to talk tomorrow.” Nothing else.',
      he: 'עשר בלילה. מייל מהבוס: "צריך לדבר מחר." זהו.',
      ar: 'العاشرة ليلًا. بريد من المدير: «يجب أن نتحدث غدًا.» لا شيء آخر.',
    },
    puppet: 'envelope',
    emoji: '✉️',
    losses: {
      en: ['a calm evening — only if you let it'],
      he: ['ערב רגוע — רק אם תתנו לו'],
      ar: ['مساء هادئ — فقط إن سمحتم له'],
    },
    threat: 8,
    right: 'let',
    frameDx: 0.05,
    anchor: {
      en: 'Tomorrow’s conversation happens tomorrow. Tonight is mine.',
      he: 'השיחה של מחר קורית מחר. הערב שלי.',
      ar: 'حديث الغد يحدث غدًا. الليلة لي.',
    },
  }),

  // ---------------------------------------------------------------- for everyone
  S({
    id: 'parking',
    with: ['stranger'], topics: ['road'], setting: 'road', diff: 1,
    name: { en: 'The parking spot', he: 'החניה', ar: 'موقف السيارة' },
    event: {
      en: 'You waited with your signal on. Someone zipped into the spot from the other side.',
      he: 'חיכיתם עם איתות. מישהו נכנס לחניה בזריזות מהצד השני.',
      ar: 'انتظرتم والإشارة مضاءة. أحدهم دخل الموقف بسرعة من الجهة الأخرى.',
    },
    puppet: 'car',
    emoji: '🅿️',
    losses: { en: ['three minutes of circling'], he: ['שלוש דקות של סיבובים'], ar: ['ثلاث دقائق من الدوران'] },
    threat: 1,
    right: 'let',
    frameDx: 0.07,
    anchor: { en: 'Three minutes. There’s another spot around the corner.', he: 'שלוש דקות. יש עוד חניה מעבר לפינה.', ar: 'ثلاث دقائق. هناك موقف آخر خلف الزاوية.' },
  }),
  S({
    id: 'queue',
    with: ['stranger'], topics: ['public'], setting: 'public', diff: 1,
    name: { en: 'Cutting the line', he: 'עוקף בתור', ar: 'تخطّي الطابور' },
    event: {
      en: 'Someone walks straight to the front of the supermarket line, as if you weren’t there.',
      he: 'מישהו הולך ישר לראש התור בסופר, כאילו אתם לא שם.',
      ar: 'أحدهم يذهب مباشرة إلى مقدمة طابور السوبرماركت، كأنكم غير موجودين.',
    },
    puppet: 'blob',
    emoji: '🛒',
    losses: { en: ['two minutes'], he: ['שתי דקות'], ar: ['دقيقتان'] },
    threat: 1,
    right: 'let',
    frameDx: -0.06,
    anchor: { en: 'Two minutes — and one calm sentence if I want.', he: 'שתי דקות, ומשפט רגוע אחד אם בא לי.', ar: 'دقيقتان — وجملة هادئة واحدة إن أردت.' },
  }),
  S({
    id: 'package',
    with: ['stranger'], topics: ['public', 'money'], setting: 'online', diff: 1,
    name: { en: '“Delivered”', he: '"נמסר"', ar: '«تم التسليم»' },
    event: {
      en: 'The app says your package was delivered. It’s not at your door.',
      he: 'באפליקציה כתוב שהחבילה נמסרה. היא לא ליד הדלת.',
      ar: 'التطبيق يقول إن الطرد سُلّم. لكنه ليس عند الباب.',
    },
    puppet: 'envelope',
    emoji: '📦',
    losses: { en: ['a phone call', 'a few days of waiting'], he: ['שיחת טלפון', 'כמה ימי המתנה'], ar: ['مكالمة هاتفية', 'بضعة أيام انتظار'] },
    threat: 3,
    right: 'let',
    frameDx: 0.05,
    anchor: { en: 'A claim with a photo. The package or the money comes back.', he: 'תלונה עם תמונה. החבילה, או הכסף, יחזרו.', ar: 'شكوى مع صورة. الطرد أو المال سيعود.' },
  }),
  S({
    id: 'drill',
    with: ['neighbor'], topics: ['neighbors', 'noise'], setting: 'home', diff: 2,
    name: { en: 'Saturday drilling', he: 'קדיחה בשבת', ar: 'حفر يوم السبت' },
    event: {
      en: 'Saturday, 8 a.m. — your one morning to sleep in. The neighbor starts drilling.',
      he: 'שבת, שמונה בבוקר, הבוקר היחיד לישון בו. השכן מתחיל לקדוח.',
      ar: 'السبت، الثامنة صباحًا — الصباح الوحيد للنوم. الجار يبدأ بالحفر.',
    },
    puppet: 'blob',
    emoji: '🔩',
    losses: { en: ['an hour of sleep'], he: ['שעת שינה'], ar: ['ساعة نوم'] },
    threat: 2,
    right: 'let',
    frameDx: 0.04,
    anchor: { en: 'An hour of sleep, and a friendly word about next Saturday.', he: 'שעת שינה, ומילה נעימה על השבת הבאה.', ar: 'ساعة نوم، وكلمة لطيفة بشأن السبت القادم.' },
  }),
  S({
    id: 'laptop',
    with: ['none'], topics: ['work'], setting: 'work', diff: 2,
    name: { en: 'Unsaved', he: 'לא נשמר', ar: 'غير محفوظ' },
    event: {
      en: 'The computer freezes and restarts. An hour of unsaved work is gone.',
      he: 'המחשב קופא ונכבה. שעה של עבודה לא שמורה נעלמה.',
      ar: 'الحاسوب يتجمّد ويُعيد التشغيل. ساعة عمل غير محفوظة ضاعت.',
    },
    puppet: 'phone',
    emoji: '💻',
    losses: { en: ['an hour — the second time is faster'], he: ['שעה, ובפעם השנייה זה מהר יותר'], ar: ['ساعة — والمرة الثانية أسرع'] },
    threat: 4,
    right: 'let',
    frameDx: -0.05,
    anchor: { en: 'An hour. I know the way now; the second time is quicker.', he: 'שעה. אני כבר {יודע|יודעת} את הדרך, ובפעם השנייה זה מהיר יותר.', ar: 'ساعة. أعرف الطريق الآن؛ المرة الثانية أسرع.' },
  }),
  S({
    id: 'cancel',
    with: ['friend'], topics: ['connection'], setting: 'online', diff: 2,
    name: { en: 'Cancelled again', he: 'ביטול, שוב', ar: 'إلغاء، مرة أخرى' },
    event: {
      en: 'A friend cancels an hour before you meet — the third time this month.',
      he: 'חבר מבטל שעה לפני הפגישה, בפעם השלישית החודש.',
      ar: 'صديق يلغي قبل اللقاء بساعة — للمرة الثالثة هذا الشهر.',
    },
    puppet: 'phone',
    emoji: '💬',
    losses: { en: ['an evening I was looking forward to'], he: ['ערב {שחיכיתי|שחיכיתי} לו'], ar: ['أمسية كنت أنتظرها'] },
    threat: 3,
    right: 'let',
    frameDx: 0.06,
    anchor: { en: 'An evening. And a question worth asking: “Is something going on?”', he: 'ערב. ושאלה ששווה לשאול: "קורה משהו?"', ar: 'أمسية. وسؤال يستحق: «هل يحدث شيء؟»' },
  }),
  S({
    id: 'partyupstairs',
    with: ['neighbor'], topics: ['neighbors', 'noise'], setting: 'home', diff: 2,
    name: { en: 'Party upstairs', he: 'מסיבה למעלה', ar: 'حفلة في الأعلى' },
    event: {
      en: '1 a.m. on a work night, and the neighbors upstairs are having a loud party.',
      he: 'אחת בלילה, באמצע השבוע, והשכנים מלמעלה עושים מסיבה רועשת.',
      ar: 'الواحدة ليلًا في منتصف الأسبوع، والجيران في الأعلى يقيمون حفلة صاخبة.',
    },
    puppet: 'blob',
    emoji: '🎶',
    losses: { en: ['some sleep', 'a fresh morning'], he: ['קצת שינה', 'בוקר רענן'], ar: ['بعض النوم', 'صباح منتعش'] },
    threat: 3,
    right: 'let',
    frameDx: -0.07,
    anchor: { en: 'One knock and a kind request usually does it.', he: 'דפיקה אחת ובקשה נעימה בדרך כלל מספיקות.', ar: 'طرقة واحدة وطلب لطيف يكفيان عادةً.' },
  }),
  S({
    id: 'birthday',
    with: ['friend'], topics: ['connection'], setting: 'online', diff: 3,
    name: { en: 'A forgotten birthday', he: 'יום הולדת שנשכח', ar: 'عيد ميلاد منسي' },
    event: {
      en: 'Evening. Your best friend hasn’t remembered your birthday.',
      he: 'ערב. החבר הכי טוב שלכם לא זכר את יום ההולדת שלכם.',
      ar: 'المساء. صديقكم المقرّب لم يتذكّر عيد ميلادكم.',
    },
    puppet: 'phone',
    emoji: '🎂',
    losses: { en: ['a message I was hoping for'], he: ['הודעה {שקיוויתי|שקיוויתי} לה'], ar: ['رسالة كنت أتمنّاها'] },
    threat: 4,
    right: 'let',
    frameDx: 0.03,
    anchor: { en: 'It’s okay to be sad. And okay to call and say: “I wanted to hear from you.”', he: 'מותר להיות עצוב. ומותר להתקשר ולהגיד: "רציתי לשמוע ממך."', ar: 'لا بأس بالحزن. ولا بأس بالاتصال والقول: «أردت أن أسمع منك.»' },
  }),
  S({
    id: 'compare',
    with: ['family'], topics: ['respect'], setting: 'home', diff: 3,
    name: { en: '“Like your brother”', he: '"כמו אחיך"', ar: '«مثل أخيك»' },
    event: {
      en: 'At a family meal, your mother asks why you can’t be more like your brother.',
      he: 'בארוחה משפחתית, אמא שלכם שואלת למה אתם לא קצת יותר כמו אחיכם.',
      ar: 'في وجبة عائلية، تسأل أمكم لماذا لا تكونون أكثر مثل أخيكم.',
    },
    puppet: 'mouth',
    emoji: '⚖️',
    losses: { en: ['a pleasant meal', 'a little pride'], he: ['ארוחה נעימה', 'קצת גאווה'], ar: ['وجبة لطيفة', 'قليل من الكبرياء'] },
    threat: 8,
    right: 'let',
    frameDx: -0.04,
    anchor: { en: 'It stings — and it says more about her worry than about me. We can talk later.', he: 'זה עוקץ, וזה אומר יותר על הדאגה שלה מאשר עליי. אפשר לדבר אחר כך.', ar: 'هذا يلسع — ويقول عن قلقها أكثر مما يقول عني. يمكننا التحدث لاحقًا.' },
  }),
  S({
    id: 'credit',
    with: ['coworker'], topics: ['work', 'respect'], setting: 'work', diff: 3,
    name: { en: 'My idea, his name', he: 'הרעיון שלי, השם שלו', ar: 'فكرتي، باسمه' },
    event: {
      en: 'In the meeting, a coworker presents your idea as his own. Third time this quarter.',
      he: 'בישיבה, עמית מציג את הרעיון שלכם כאילו הוא שלו. פעם שלישית ברבעון.',
      ar: 'في الاجتماع، يعرض زميل فكرتكم كأنها فكرته. للمرة الثالثة هذا الربع.',
    },
    puppet: 'mouth',
    emoji: '💡',
    losses: { en: ['credit for my work', 'a fair shot at promotion'], he: ['קרדיט על העבודה שלי', 'סיכוי הוגן לקידום'], ar: ['الفضل في عملي', 'فرصة عادلة للترقية'] },
    threat: 20,
    right: 'boundary',
    frameDx: 0.05,
    anchor: { en: '“That was my idea. From now on, we present together.”', he: '"זה היה הרעיון שלי. מעכשיו מציגים ביחד."', ar: '«كانت تلك فكرتي. من الآن نعرض معًا.»' },
  }),
  S({
    id: 'bossyell',
    with: ['boss'], topics: ['work', 'respect'], setting: 'work', diff: 4, heavy: true,
    name: { en: 'Shouted at', he: 'צעקה מול כולם', ar: 'صراخ أمام الجميع' },
    event: {
      en: 'Your boss shouts at you in front of the whole team, over a mistake that wasn’t yours.',
      he: 'הבוס צועק עליכם מול כל הצוות, על טעות שבכלל לא הייתה שלכם.',
      ar: 'المدير يصرخ عليكم أمام الفريق كله، بسبب خطأ لم يكن خطأكم.',
    },
    puppet: 'mouth',
    emoji: '📢',
    losses: { en: ['dignity at work', 'feeling safe there'], he: ['כבוד בעבודה', 'תחושת ביטחון שם'], ar: ['الكرامة في العمل', 'الإحساس بالأمان هناك'] },
    threat: 28,
    right: 'boundary',
    frameDx: -0.06,
    anchor: { en: '“I won’t be spoken to like that. Let’s talk privately, with the facts.”', he: '"אני לא {מסכים|מסכימה} שידברו אליי ככה. בוא נדבר ביחידות, עם העובדות."', ar: '«لا أقبل أن يُكلَّم معي هكذا. لنتحدث على انفراد، بالوقائع.»' },
  }),
  S({
    id: 'loan',
    with: ['friend'], topics: ['money'], setting: 'online', diff: 4, heavy: true,
    name: { en: 'The money I lent', he: 'הכסף שהלוויתי', ar: 'المال الذي أقرضته' },
    event: {
      en: 'A friend still hasn’t returned money you need for rent. Today he posted vacation photos.',
      he: 'חבר עדיין לא החזיר כסף שאתם צריכים לשכירות. היום הוא העלה תמונות מחופשה.',
      ar: 'صديق لم يُرجع بعد مالًا تحتاجونه للإيجار. اليوم نشر صور عطلة.',
    },
    puppet: 'envelope',
    emoji: '💸',
    losses: { en: ['money I need for rent', 'trust'], he: ['כסף שאני {צריך|צריכה} לשכירות', 'אמון'], ar: ['مال أحتاجه للإيجار', 'الثقة'] },
    threat: 22,
    right: 'boundary',
    frameDx: 0.04,
    anchor: { en: '“I need the money back by the first. Let’s set it now.”', he: '"אני {צריך|צריכה} את הכסף בחזרה עד הראשון לחודש. בוא נקבע עכשיו."', ar: '«أحتاج المال حتى أول الشهر. لنحدد ذلك الآن.»' },
  }),
  S({
    id: 'mocked',
    with: ['friend'], topics: ['respect'], setting: 'public', diff: 3,
    name: { en: 'The running joke', he: 'הבדיחה הקבועה', ar: 'النكتة المتكررة' },
    event: {
      en: 'At every get-together, the same friend makes fun of you in front of everyone. Tonight again.',
      he: 'בכל מפגש, אותו חבר צוחק עליכם מול כולם. גם הערב.',
      ar: 'في كل لقاء، الصديق نفسه يسخر منكم أمام الجميع. الليلة أيضًا.',
    },
    puppet: 'mouth',
    emoji: '🎭',
    losses: { en: ['respect in my group', 'enjoying the evenings'], he: ['כבוד בחבורה', 'ההנאה מהערבים'], ar: ['الاحترام في المجموعة', 'الاستمتاع بالأمسيات'] },
    threat: 16,
    right: 'boundary',
    frameDx: -0.03,
    anchor: { en: '“I don’t find it funny anymore. Please stop.”', he: '"זה כבר לא מצחיק אותי. בבקשה תפסיק."', ar: '«لم يعد هذا مضحكًا لي. من فضلك توقّف.»' },
  }),
  // ---------------------------------------------------------------- particular homes
  S({
    id: 'rmdishes',
    with: ['roommate'], topics: ['chores', 'mess'], setting: 'home', diff: 1,
    name: { en: 'The full sink', he: 'הכיור המלא', ar: 'المغسلة الممتلئة' },
    event: {
      en: 'Your roommate’s dishes have been in the sink for four days.',
      he: 'הכלים של השותף בכיור כבר ארבעה ימים.',
      ar: 'صحون شريك السكن في المغسلة منذ أربعة أيام.',
    },
    puppet: 'cup',
    emoji: '🍽️',
    losses: { en: ['a clean sink — for now'], he: ['כיור נקי, לבינתיים'], ar: ['مغسلة نظيفة — مؤقتًا'] },
    threat: 2,
    right: 'let',
    frameDx: 0.06,
    anchor: { en: 'A rule we agree on together beats a war of notes.', he: 'כלל שמסכימים עליו ביחד עדיף על מלחמת פתקים.', ar: 'قاعدة نتفق عليها معًا أفضل من حرب الأوراق.' },
  }),
  S({
    id: 'rmrent',
    with: ['roommate'], topics: ['money'], setting: 'home', diff: 4, heavy: true,
    name: { en: 'Rent, again', he: 'שכירות, שוב', ar: 'الإيجار، مرة أخرى' },
    event: {
      en: 'Rent is due tomorrow. For the third month, your roommate hasn’t paid their share.',
      he: 'מחר משלמים שכירות. זה החודש השלישי שהשותף לא משלם את החלק שלו.',
      ar: 'الإيجار مستحق غدًا. للشهر الثالث، شريك السكن لم يدفع حصته.',
    },
    puppet: 'envelope',
    emoji: '🏠',
    losses: { en: ['money I can’t spare', 'feeling safe at home'], he: ['כסף שאין לי', 'ביטחון בבית'], ar: ['مال لا أملكه', 'الأمان في البيت'] },
    threat: 24,
    right: 'boundary',
    frameDx: -0.05,
    anchor: { en: '“I can’t cover your share again. What can you pay by tomorrow?”', he: '"אני לא {יכול|יכולה} לכסות את החלק שלך שוב. כמה תוכל לשלם עד מחר?"', ar: '«لا أستطيع تغطية حصتك مرة أخرى. كم تستطيع أن تدفع حتى الغد؟»' },
  }),
  S({
    id: 'towel',
    with: ['partner'], topics: ['mess'], setting: 'home', diff: 1,
    name: { en: 'Wet towel', he: 'מגבת רטובה', ar: 'منشفة مبللة' },
    event: {
      en: 'A wet towel on your side of the bed. Again.',
      he: 'מגבת רטובה בצד שלכם של המיטה. שוב.',
      ar: 'منشفة مبللة على جهتكم من السرير. مرة أخرى.',
    },
    puppet: 'blob',
    emoji: '🛏️',
    losses: { en: ['a dry pillow'], he: ['כרית יבשה'], ar: ['وسادة جافة'] },
    threat: 1,
    right: 'let',
    frameDx: 0.08,
    anchor: { en: 'A towel. A hook. One small request.', he: 'מגבת. וו. בקשה קטנה אחת.', ar: 'منشفة. علّاقة. طلب صغير واحد.' },
  }),
  S({
    id: 'dadcar',
    with: ['ageing-parent'], topics: ['caregiving', 'health', 'independence'], setting: 'road', diff: 4, heavy: true,
    name: { en: 'Dad’s driving', he: 'הנהיגה של אבא', ar: 'قيادة أبي' },
    event: {
      en: 'Your father scraped the car again — and insists he’s driving just fine.',
      he: 'אבא שלכם שוב שרט את האוטו, ומתעקש שהוא נוהג מצוין.',
      ar: 'أبوكم خدش السيارة مرة أخرى — ويصرّ أنه يقود جيدًا.',
    },
    puppet: 'car',
    emoji: '🚙',
    losses: { en: ['his safety — and others’'], he: ['הביטחון שלו, ושל אחרים'], ar: ['سلامته — وسلامة الآخرين'] },
    threat: 30,
    right: 'boundary',
    frameDx: 0.03,
    anchor: { en: '“I love you, and I’m scared. Let’s get your driving checked together.”', he: '"אני {אוהב|אוהבת} אותך, ואני {מפחד|מפחדת}. בוא נבדוק את הנהיגה שלך ביחד."', ar: '«أحبك، وأنا خائف. لنفحص قيادتك معًا.»' },
  }),
  S({
    id: 'curfew',
    with: ['teen'], topics: ['independence'], setting: 'home', diff: 3,
    name: { en: 'Forty minutes late', he: 'ארבעים דקות איחור', ar: 'أربعون دقيقة تأخير' },
    event: {
      en: 'Your teen is forty minutes past curfew and isn’t answering. Then the door opens.',
      he: 'המתבגר שלכם מאחר בארבעים דקות ולא עונה. ואז הדלת נפתחת.',
      ar: 'ابنكم المراهق متأخر أربعين دقيقة ولا يردّ. ثم يُفتح الباب.',
    },
    puppet: 'clock',
    emoji: '🚪',
    losses: { en: ['forty minutes of fear', 'knowing he’s safe'], he: ['ארבעים דקות של פחד', 'לדעת שהוא בטוח'], ar: ['أربعون دقيقة من الخوف', 'معرفة أنه بأمان'] },
    threat: 15,
    right: 'boundary',
    frameDx: -0.08,
    anchor: { en: '“I’m relieved you’re home. Next time, a message. We’ll talk tomorrow.”', he: '"הוקל לי שאתה בבית. בפעם הבאה, הודעה. נדבר מחר."', ar: '«ارتحت لأنك في البيت. في المرة القادمة، رسالة. سنتحدث غدًا.»' },
  }),
  S({
    id: 'grandvisit',
    with: ['family'], requires: ['grandparent'], topics: ['connection'], setting: 'home', diff: 2,
    name: { en: 'The visit that wasn’t', he: 'הביקור שלא היה', ar: 'الزيارة التي لم تحدث' },
    event: {
      en: 'Your daughter cancels the grandkids’ visit at the last minute. You’d already baked.',
      he: 'הבת שלכם מבטלת את הביקור של הנכדים ברגע האחרון. וכבר אפיתם.',
      ar: 'ابنتكم تلغي زيارة الأحفاد في اللحظة الأخيرة. وكنتم قد خبزتم.',
    },
    puppet: 'clock',
    emoji: '🍰',
    losses: { en: ['an afternoon with them — this week'], he: ['אחר צהריים איתם, השבוע'], ar: ['عصر معهم — هذا الأسبوع'] },
    threat: 3,
    right: 'let',
    frameDx: 0.05,
    anchor: { en: 'The cake freezes. A new date, set now.', he: 'העוגה נכנסת למקפיא. תאריך חדש, עכשיו.', ar: 'الكعكة تُجمَّد. موعد جديد، الآن.' },
  }),
];

/** Choices for "My shadow": what was taken, in the player's own words. */
export const MY_LOSSES = tr({
  en: ['time', 'money', 'respect', 'quiet', 'something broke', 'a plan', 'something else'],
  he: ['זמן', 'כסף', 'כבוד', 'שקט', 'משהו נשבר', 'תוכנית', 'משהו אחר'],
  ar: ['وقت', 'مال', 'احترام', 'هدوء', 'شيء انكسر', 'خطة', 'شيء آخر'],
});

/** Levels are named for what they practise; the scene inside fits the player's home. */
export const LEVEL_NAMES = [
  tr({ en: 'The first shadow', he: 'הצל הראשון', ar: 'الظل الأول' }),
  tr({ en: 'Just looks big', he: 'רק נראה גדול', ar: 'يبدو كبيرًا فقط' }),
  tr({ en: 'What was taken?', he: 'מה לקחו?', ar: 'ما الذي أُخذ؟' }),
  tr({ en: 'Something real', he: 'משהו אמיתי', ar: 'شيء حقيقي' }),
  tr({ en: 'A stubborn shadow', he: 'צל עקשן', ar: 'ظل عنيد' }),
  tr({ en: 'Two lenses', he: 'שתי עדשות', ar: 'عدستان' }),
  tr({ en: 'Almost gone', he: 'כמעט נעלם', ar: 'يكاد يختفي' }),
  tr({ en: 'Real again', he: 'שוב אמיתי', ar: 'حقيقي مرة أخرى' }),
  tr({ en: 'A long night', he: 'לילה ארוך', ar: 'ليلة طويلة' }),
  tr({ en: 'The right size', he: 'בגודל הנכון', ar: 'بالحجم الصحيح' }),
  tr({ en: 'A calm boundary', he: 'גבול בנחת', ar: 'حدّ بهدوء' }),
  tr({ en: 'The last lantern', he: 'הפנס האחרון', ar: 'الفانوس الأخير' }),
];

/** One icon per level, for the "next level" button. */
export const LEVEL_ICONS = ['🔦', '👻', '🔍', '🌵', '🦔', '🟠', '🌫️', '🌵', '🌙', '📏', '🗣️', '🏮'];

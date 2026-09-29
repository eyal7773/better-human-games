import { tr } from '../shared/i18n';
import type { Response } from './logic';

type L = { en: string; he: string; ar: string };
type LL = { en: string[]; he: string[]; ar: string[] };

export type Puppet = 'cup' | 'marker' | 'clock' | 'phone' | 'car' | 'mug' | 'mouth' | 'envelope' | 'blob';

export interface Scene {
  id: string;
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

const S = (o: {
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
  id: o.id,
  name: tr(o.name),
  event: tr(o.event),
  puppet: o.puppet,
  emoji: o.emoji,
  losses: tr(o.losses),
  threat: o.threat,
  right: o.right,
  real: o.right === 'boundary',
  frameDx: o.frameDx,
  anchor: tr(o.anchor),
});

export const SCENES: Scene[] = [
  S({
    id: 'juice',
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
      he: '"הטלפון שלי פרטי. אני כועס/ת, ונדבר על אמון אחרי ארוחת הערב."',
      ar: '«هاتفي خاص. أنا منزعج، وسنتحدث عن الثقة بعد العشاء.»',
    },
  }),
  S({
    id: 'traffic',
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
];

/** Choices for "My shadow": what was taken, in the player's own words. */
export const MY_LOSSES = tr({
  en: ['time', 'money', 'respect', 'quiet', 'something broke', 'a plan', 'something else'],
  he: ['זמן', 'כסף', 'כבוד', 'שקט', 'משהו נשבר', 'תוכנית', 'משהו אחר'],
  ar: ['وقت', 'مال', 'احترام', 'هدوء', 'شيء انكسر', 'خطة', 'شيء آخر'],
});

import { tr } from '../shared/i18n';
import type { Pillar } from './logic';

type L = { en: string; he: string; ar: string };

export interface BubbleItem {
  emoji: string;
  label: string;
  /** What it really takes from you. */
  takes: string;
}

export interface ThreatItem {
  emoji: string;
  label: string;
  pillar: Pillar;
  /** The calm boundary that meets it. */
  boundary: string;
}

const B = (emoji: string, label: L, takes: L): BubbleItem => ({ emoji, label: tr(label), takes: tr(takes) });
const X = (emoji: string, pillar: Pillar, label: L, boundary: L): ThreatItem => ({ emoji, pillar, label: tr(label), boundary: tr(boundary) });

export const BUBBLES: BubbleItem[] = [
  B('🚗', { en: 'Traffic jam', he: 'פקק', ar: 'زحمة سير' }, { en: '15 minutes', he: 'רבע שעה', ar: 'ربع ساعة' }),
  B('🥛', { en: 'Spilled milk', he: 'חלב נשפך', ar: 'حليب مسكوب' }, { en: 'a cloth and 2 minutes', he: 'סמרטוט ושתי דקות', ar: 'قطعة قماش ودقيقتان' }),
  B('📢', { en: 'A driver honked', he: 'נהג צפר', ar: 'سائق زمّر' }, { en: 'one second of noise', he: 'שנייה של רעש', ar: 'ثانية ضجيج' }),
  B('🎒', { en: 'Forgot the school bag', he: 'שכחו את התיק', ar: 'نسوا الحقيبة' }, { en: 'a trip back', he: 'נסיעה חזרה', ar: 'مشوار رجوع' }),
  B('📺', { en: 'Where’s the remote?', he: 'איפה השלט?', ar: 'أين جهاز التحكم؟' }, { en: '5 minutes of searching', he: '5 דקות חיפוש', ar: '5 دقائق بحث' }),
  B('🧦', { en: 'Socks on the floor', he: 'גרביים על הרצפה', ar: 'جوارب على الأرض' }, { en: '10 seconds', he: '10 שניות', ar: '10 ثوانٍ' }),
  B('📧', { en: 'An annoying email', he: 'מייל מעצבן', ar: 'بريد مزعج' }, { en: 'a reply tomorrow', he: 'תשובה מחר', ar: 'ردّ غدًا' }),
  B('🌧️', { en: 'It’s raining', he: 'יורד גשם', ar: 'إنها تمطر' }, { en: 'a wet coat', he: 'מעיל רטוב', ar: 'معطف مبلل' }),
  B('🔋', { en: 'Phone at 5%', he: 'טלפון על 5%', ar: 'الهاتف على 5%' }, { en: 'a charger', he: 'מטען', ar: 'شاحن' }),
  B('🍝', { en: 'Burnt pasta', he: 'פסטה שנשרפה', ar: 'معكرونة محروقة' }, { en: 'another pot', he: 'עוד סיר', ar: 'قدر آخر' }),
  B('🐶', { en: 'The dog won’t stop barking', he: 'הכלב לא מפסיק לנבוח', ar: 'الكلب لا يتوقف عن النباح' }, { en: 'a moment of quiet', he: 'רגע של שקט', ar: 'لحظة هدوء' }),
  B('⏳', { en: 'A long line', he: 'תור ארוך', ar: 'طابور طويل' }, { en: '10 minutes', he: '10 דקות', ar: '10 دقائق' }),
  B('🙄', { en: 'An eye-roll', he: 'גלגול עיניים', ar: 'تدوير عينين' }, { en: 'a little pride', he: 'קצת גאווה', ar: 'قليل من الكبرياء' }),
  B('🍪', { en: 'Crumbs on the sofa', he: 'פירורים על הספה', ar: 'فتات على الكنبة' }, { en: 'a quick wipe', he: 'ניגוב מהיר', ar: 'مسحة سريعة' }),
];

export const THREATS: ThreatItem[] = [
  X('🧑‍💼', 'worth', { en: 'The boss mocks you in front of everyone', he: 'הבוס לועג לכם מול כולם', ar: 'المدير يسخر منكم أمام الجميع' }, {
    en: '“Please don’t speak to me like that.”',
    he: '"בבקשה אל תדבר אליי ככה."',
    ar: '«من فضلك لا تكلّمني بهذه الطريقة.»',
  }),
  X('🚸', 'family', { en: 'Someone shoves your kid', he: 'מישהו דוחף את הילד שלכם', ar: 'أحدهم يدفع طفلكم' }, {
    en: '“Stop. Don’t touch my child.”',
    he: '"די. אל תיגע בילד שלי."',
    ar: '«توقّف. لا تلمس طفلي.»',
  }),
  X('📵', 'health', { en: 'Work calls at 11 p.m., every night', he: 'מהעבודה מתקשרים ב-23:00, כל לילה', ar: 'العمل يتصل في الحادية عشرة ليلًا، كل ليلة' }, {
    en: '“I answer between 8 and 6.”',
    he: '"אני עונה בין 8 ל-6."',
    ar: '«أردّ بين الثامنة والسادسة.»',
  }),
  X('🚪', 'home', { en: 'A relative walks in without asking', he: 'קרוב משפחה נכנס בלי לשאול', ar: 'قريب يدخل دون استئذان' }, {
    en: '“Please call before you come over.”',
    he: '"בבקשה תתקשרו לפני שאתם באים."',
    ar: '«من فضلكم اتصلوا قبل أن تأتوا.»',
  }),
  X('🗯️', 'worth', { en: 'Being called stupid', he: 'קוראים לכם טיפשים', ar: 'يُقال عنكم أغبياء' }, {
    en: '“I’m not okay with being spoken to like that.”',
    he: '"אני לא מסכים/ה שידברו אליי ככה."',
    ar: '«لا أقبل أن يُتحدّث إليّ هكذا.»',
  }),
  X('💸', 'home', { en: 'Pushed to lend money you need', he: 'לוחצים עליכם להלוות כסף שאתם צריכים', ar: 'ضغط لإقراض مال تحتاجونه' }, {
    en: '“No — I can’t this time.”',
    he: '"לא — הפעם אני לא יכול/ה."',
    ar: '«لا — لا أستطيع هذه المرة.»',
  }),
  X('🍷', 'health', { en: 'Pressed to drink before driving', he: 'לוחצים עליכם לשתות לפני נהיגה', ar: 'ضغط للشرب قبل القيادة' }, {
    en: '“No thanks, I’m driving.”',
    he: '"לא תודה, אני נוהג/ת."',
    ar: '«لا شكرًا، أنا أقود.»',
  }),
];

export const PILLAR_INFO: Record<Pillar, { emoji: string; name: string; color: string }> = {
  health: { emoji: '❤️', name: tr({ en: 'Health', he: 'בריאות', ar: 'الصحة' }), color: '#ff5a6e' },
  family: { emoji: '👨‍👩‍👧', name: tr({ en: 'Family', he: 'משפחה', ar: 'العائلة' }), color: '#ffb14a' },
  home: { emoji: '🏠', name: tr({ en: 'Home', he: 'בית', ar: 'البيت' }), color: '#3fb8a8' },
  worth: { emoji: '⭐', name: tr({ en: 'Self-worth', he: 'ערך עצמי', ar: 'قيمة الذات' }), color: '#8a7bff' },
};

export const LEVEL_NAMES = [
  tr({ en: 'Morning rush', he: 'בוקר לחוץ', ar: 'صباح مستعجل' }),
  tr({ en: 'A workday', he: 'יום עבודה', ar: 'يوم عمل' }),
  tr({ en: 'Evening', he: 'ערב', ar: 'المساء' }),
  tr({ en: 'Weekend with family', he: 'שבת אצל המשפחה', ar: 'عطلة مع العائلة' }),
  tr({ en: 'The big day', he: 'היום הגדול', ar: 'اليوم الكبير' }),
];

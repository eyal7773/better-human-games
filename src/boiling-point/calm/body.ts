import { h, pick } from '../../shared/dom';
import { vibrate } from '../../shared/haptics';
import { tr } from '../../shared/i18n';
import type { Calm, CalmCtx } from './types';

/**
 * "Where do you feel it?" — touch up to two places in the body where the anger
 * sits, name the feeling family that blooms out of them, then sharpen it to
 * the closest word. Noticing cools a little and naming cools more; there is no
 * wrong place and no wrong feeling.
 */

type EmotionId =
  | 'frustration'
  | 'anger'
  | 'tension'
  | 'hurt'
  | 'fear'
  | 'shame'
  | 'surprise'
  | 'boredom'
  | 'confusion'
  | 'power'
  | 'longing'
  | 'love'
  | 'calm'
  | 'desire'
  | 'joy'
  | 'satisfaction';
type RegionId = 'head' | 'jaw' | 'throat' | 'shoulders' | 'chest' | 'belly' | 'hands';

interface Emotion {
  id: EmotionId;
  icon: string;
  color: string;
  /** Chip label (a noun). */
  name: string;
  /** Shown after choosing: "Right now …". */
  line: string;
  /** First-person phrase used inside the reminders. */
  feel: string;
  /** What the feeling is — a definition, never advice. */
  def: string;
  /** "From the … family.", shown under a sharper word. */
  fam: string;
  /** Sharper words in this family, to pick the closest one. */
  subs: string[];
}

const EMOTIONS: Emotion[] = [
  {
    id: 'frustration',
    fam: tr({ en: 'From the frustration family.', he: 'ממשפחת התסכול.', ar: 'من عائلة الإحباط.' }),
    subs: tr({
      en: ['Helplessness', 'Dejection', 'Bitterness', 'Despair', 'Depression'],
      he: ['חוסר אונים', 'דכדוך', 'מרמור', 'יאוש', 'דיכאון'],
      ar: ['عجز', 'غمّ', 'مرارة', 'يأس', 'اكتئاب'],
    }),
    icon: '😤',
    color: '#ff9f45',
    name: tr({ en: 'Frustration', he: 'תסכול', ar: 'إحباط' }),
    line: tr({ en: 'Right now, I feel frustrated.', he: 'עכשיו יש בי תסכול.', ar: 'الآن أشعر بالإحباط.' }),
    feel: tr({ en: 'I feel frustrated', he: 'יש בי תסכול', ar: 'أشعر بالإحباط' }),
    def: tr({
      en: 'Anger at something that isn’t working out.',
      he: 'כעס על משהו שלא מצליח או לא מסתדר.',
      ar: 'غضب من شيء لا ينجح أو لا يسير كما يجب.',
    }),
  },
  {
    id: 'anger',
    fam: tr({ en: 'From the anger family.', he: 'ממשפחת הכעס.', ar: 'من عائلة الغضب.' }),
    subs: tr({
      en: ['Resentment', 'Hatred', 'Gloating', 'Disapproval', 'Contempt', 'Rejection', 'Hostility', 'Disgust', 'Loathing'],
      he: ['טינה', 'שנאה', 'שמחה לאיד', 'הסתייגות', 'בוז', 'דחייה', 'עוינות', 'גועל', 'תיעוב'],
      ar: ['ضغينة', 'كراهية', 'شماتة', 'تحفّظ', 'احتقار', 'نفور', 'عداء', 'قرف', 'مقت'],
    }),
    icon: '😠',
    color: '#e5383b',
    name: tr({ en: 'Anger', he: 'כעס', ar: 'غضب' }),
    line: tr({ en: 'Right now, I feel angry.', he: 'עכשיו יש בי כעס.', ar: 'الآن أشعر بالغضب.' }),
    feel: tr({ en: 'I feel angry', he: 'יש בי כעס', ar: 'أشعر بالغضب' }),
    def: tr({
      en: 'A reaction to something that seems unfair or hurtful.',
      he: 'תגובה למשהו שנראה לא הוגן או פוגע.',
      ar: 'ردّ فعل على شيء يبدو غير عادل أو مؤذيًا.',
    }),
  },
  {
    id: 'tension',
    fam: tr({ en: 'From the tension family.', he: 'ממשפחת המתח.', ar: 'من عائلة التوتر.' }),
    subs: tr({
      en: ['Discomfort', 'Pressure', 'Distress', 'Irritability', 'Impatience', 'A heavy heart', 'Feeling bothered', 'Withdrawal', 'Sensitivity'],
      he: ['אי-נוחות', 'לחץ', 'מצוקה', 'עצבנות', 'חוסר סבלנות', 'מועקה', 'מוטרדות', 'היסגרות', 'רגישות'],
      ar: ['انزعاج', 'ضغط', 'ضيق', 'عصبية', 'نفاد صبر', 'غصّة', 'انشغال بال', 'انغلاق', 'حساسية'],
    }),
    icon: '😬',
    color: '#ffd447',
    name: tr({ en: 'Tension', he: 'מתח', ar: 'توتر' }),
    line: tr({ en: 'Right now, I feel tense.', he: 'עכשיו יש בי מתח.', ar: 'الآن أشعر بالتوتر.' }),
    feel: tr({ en: 'I feel tense', he: 'יש בי מתח', ar: 'أشعر بالتوتر' }),
    def: tr({
      en: 'The body is braced for something and won’t let go.',
      he: 'הגוף דרוך לקראת משהו, ולא משתחרר.',
      ar: 'الجسد متأهّب لشيء ما، ولا يسترخي.',
    }),
  },
  {
    id: 'hurt',
    fam: tr({ en: 'From the hurt family.', he: 'ממשפחת הכאב.', ar: 'من عائلة الألم.' }),
    subs: tr({
      en: ['Feeling insulted', 'Feeling wounded', 'Disappointment', 'Sorrow', 'Suffering', 'Sadness', 'Loneliness', 'Jealousy'],
      he: ['עלבון', 'פגיעה', 'אכזבה', 'צער', 'סבל', 'עצב', 'בדידות', 'קנאה'],
      ar: ['إهانة', 'جرح', 'خيبة أمل', 'أسى', 'معاناة', 'حزن', 'وحدة', 'غيرة'],
    }),
    icon: '💔',
    color: '#ff5fa2',
    name: tr({ en: 'Hurt', he: 'כאב', ar: 'ألم' }),
    line: tr({ en: 'Right now, it hurts.', he: 'עכשיו כואב לי.', ar: 'الآن أشعر بالألم.' }),
    feel: tr({ en: 'It hurts', he: 'כואב לי', ar: 'أشعر بالألم' }),
    def: tr({
      en: 'The feeling that something or someone has hurt you.',
      he: 'התחושה שמשהו או מישהו פגע בכם.',
      ar: 'الشعور بأن شيئًا أو شخصًا ما قد آذاكم.',
    }),
  },
  {
    id: 'fear',
    fam: tr({ en: 'From the fear family.', he: 'ממשפחת הפחד.', ar: 'من عائلة الخوف.' }),
    subs: tr({
      en: ['Worry', 'Apprehension', 'Panic', 'Feeling frozen', 'Terror', 'Anxiety'],
      he: ['דאגה', 'חשש', 'בהלה', 'שיתוק', 'אימה', 'חרדה'],
      ar: ['همّ', 'توجّس', 'ذعر', 'تجمّد', 'رعب', 'قلق'],
    }),
    icon: '😨',
    color: '#b983ff',
    name: tr({ en: 'Fear', he: 'פחד', ar: 'خوف' }),
    line: tr({ en: 'Right now, I feel afraid.', he: 'עכשיו יש בי פחד.', ar: 'الآن أشعر بالخوف.' }),
    feel: tr({ en: 'I feel afraid', he: 'יש בי פחד', ar: 'أشعر بالخوف' }),
    def: tr({
      en: 'The feeling that something bad might happen.',
      he: 'התחושה שמשהו רע עלול לקרות.',
      ar: 'الشعور بأن شيئًا سيئًا قد يحدث.',
    }),
  },
  {
    id: 'shame',
    fam: tr({ en: 'From the shame family.', he: 'ממשפחת הבושה.', ar: 'من عائلة الخجل.' }),
    subs: tr({
      en: ['Guilt', 'Embarrassment', 'Regret', 'A guilty conscience', 'Feeling inferior'],
      he: ['אשמה', 'מבוכה', 'חרטה', 'נקיפות מצפון', 'רגשי נחיתות'],
      ar: ['ذنب', 'إحراج', 'ندم', 'تأنيب ضمير', 'شعور بالنقص'],
    }),
    icon: '😳',
    color: '#ff8a6b',
    name: tr({ en: 'Shame', he: 'בושה', ar: 'خجل' }),
    line: tr({ en: 'Right now, I feel ashamed.', he: 'עכשיו יש בי בושה.', ar: 'الآن أشعر بالخجل.' }),
    feel: tr({ en: 'I feel ashamed', he: 'יש בי בושה', ar: 'أشعر بالخجل' }),
    def: tr({
      en: 'The feeling that others see you in a bad light.',
      he: 'התחושה שאחרים רואים אתכם באור לא טוב.',
      ar: 'الشعور بأن الآخرين يرونكم بصورة سيئة.',
    }),
  },
  {
    id: 'surprise',
    fam: tr({ en: 'From the surprise family.', he: 'ממשפחת ההפתעה.', ar: 'من عائلة المفاجأة.' }),
    subs: tr({
      en: ['Puzzlement', 'Shock', 'Feeling shaken'],
      he: ['תמיהה', 'הלם', 'זעזוע'],
      ar: ['استغراب', 'صدمة', 'هزّة'],
    }),
    icon: '😲',
    color: '#4d96ff',
    name: tr({ en: 'Surprise', he: 'הפתעה', ar: 'مفاجأة' }),
    line: tr({ en: 'Right now, I feel caught off guard.', he: 'עכשיו זה הפתיע אותי.', ar: 'الآن فاجأني ما حدث.' }),
    feel: tr({ en: 'That caught me off guard', he: 'זה הפתיע אותי', ar: 'فاجأني ما حدث' }),
    def: tr({
      en: 'Something happened that you didn’t expect.',
      he: 'קרה משהו שלא ציפיתם לו.',
      ar: 'حدث شيء لم تتوقّعوه.',
    }),
  },
  {
    id: 'boredom',
    fam: tr({ en: 'From the boredom family.', he: 'ממשפחת השעמום.', ar: 'من عائلة الملل.' }),
    subs: tr({
      en: ['Emptiness', 'Indifference', 'Tiredness', 'Heaviness'],
      he: ['ריקנות', 'אדישות', 'עייפות', 'כבדות'],
      ar: ['فراغ', 'لامبالاة', 'تعب', 'ثِقل'],
    }),
    icon: '🥱',
    color: '#8d99ae',
    name: tr({ en: 'Boredom', he: 'שעמום', ar: 'ملل' }),
    line: tr({ en: 'Right now, I feel bored.', he: 'עכשיו משעמם לי.', ar: 'الآن أشعر بالملل.' }),
    feel: tr({ en: 'I feel bored', he: 'משעמם לי', ar: 'أشعر بالملل' }),
    def: tr({
      en: 'Nothing to engage with, and time drags on.',
      he: 'אין במה להתעסק, והזמן נגרר.',
      ar: 'لا شيء يشغلكم، والوقت يمضي ببطء.',
    }),
  },
  {
    id: 'confusion',
    fam: tr({ en: 'From the confusion family.', he: 'ממשפחת הבלבול.', ar: 'من عائلة الارتباك.' }),
    subs: tr({
      en: ['Hesitation', 'Doubt', 'Uncertainty', 'Mixed feelings', 'Feeling unsettled', 'Scattered', 'Emotional turmoil'],
      he: ['היסוס', 'ספק', 'אי-ודאות', 'אמביוולנטיות', 'ערעור', 'פיזור', 'סערת-רגשות'],
      ar: ['تردّد', 'شكّ', 'عدم يقين', 'مشاعر متضاربة', 'تزعزع', 'تشتّت', 'عاصفة مشاعر'],
    }),
    icon: '😵',
    color: '#3ecf8e',
    name: tr({ en: 'Confusion', he: 'בלבול', ar: 'ارتباك' }),
    line: tr({ en: 'Right now, I feel confused.', he: 'עכשיו יש בי בלבול.', ar: 'الآن أشعر بالارتباك.' }),
    feel: tr({ en: 'I feel confused', he: 'יש בי בלבול', ar: 'أشعر بالارتباك' }),
    def: tr({
      en: 'Too much is happening, and it isn’t clear what to do.',
      he: 'קורה יותר מדי, ולא ברור מה לעשות.',
      ar: 'يحدث الكثير، وليس واضحًا ما العمل.',
    }),
  },
  {
    id: 'power',
    fam: tr({ en: 'From the strength family.', he: 'ממשפחת העוצמה.', ar: 'من عائلة القوة.' }),
    subs: tr({
      en: ['A sense of strength', 'Vitality', 'Determination', 'Courage'],
      he: ['תחושת כוח', 'חיוניות', 'נחישות', 'אומץ'],
      ar: ['إحساس بالقوة', 'حيوية', 'عزيمة', 'شجاعة'],
    }),
    icon: '💪',
    color: '#e76f51',
    name: tr({ en: 'Strength', he: 'עוצמה', ar: 'قوة' }),
    line: tr({ en: 'Right now, I feel strong.', he: 'עכשיו יש בי עוצמה.', ar: 'الآن أشعر بالقوة.' }),
    feel: tr({ en: 'I feel strong', he: 'יש בי עוצמה', ar: 'أشعر بالقوة' }),
    def: tr({
      en: 'A surge of energy and strength in the body.',
      he: 'גל של אנרגיה וכוח בגוף.',
      ar: 'اندفاع من الطاقة والقوة في الجسد.',
    }),
  },
  {
    id: 'longing',
    fam: tr({ en: 'From the longing family.', he: 'ממשפחת הגעגוע.', ar: 'من عائلة الحنين.' }),
    subs: tr({
      en: ['Anticipation', 'Yearning'],
      he: ['ציפיה', 'כמיהה'],
      ar: ['ترقّب', 'توق'],
    }),
    icon: '💭',
    color: '#8fa8ff',
    name: tr({ en: 'Longing', he: 'געגוע', ar: 'حنين' }),
    line: tr({ en: 'Right now, I feel a longing.', he: 'עכשיו יש בי געגוע.', ar: 'الآن أشعر بالحنين.' }),
    feel: tr({ en: 'I feel a longing', he: 'יש בי געגוע', ar: 'أشعر بالحنين' }),
    def: tr({
      en: 'Missing someone or something that isn’t here.',
      he: 'חסר מישהו או משהו שלא נמצא כאן.',
      ar: 'افتقاد شخص أو شيء ليس هنا.',
    }),
  },
  {
    id: 'love',
    fam: tr({ en: 'From the love family.', he: 'ממשפחת האהבה.', ar: 'من عائلة الحب.' }),
    subs: tr({
      en: ['Affection', 'Closeness', 'Tolerance', 'Relating to them', 'Empathy', 'Compassion'],
      he: ['חיבה', 'קרבה', 'סובלנות', 'הזדהות', 'אמפתיה', 'חמלה'],
      ar: ['مودّة', 'قُرب', 'تسامح', 'تماهٍ', 'تعاطف', 'رحمة'],
    }),
    icon: '🥰',
    color: '#ff6f91',
    name: tr({ en: 'Love', he: 'אהבה', ar: 'حب' }),
    line: tr({ en: 'Right now, I feel love.', he: 'עכשיו יש בי אהבה.', ar: 'الآن أشعر بالحب.' }),
    feel: tr({ en: 'I feel love', he: 'יש בי אהבה', ar: 'أشعر بالحب' }),
    def: tr({
      en: 'Warmth and closeness toward someone.',
      he: 'חום וקרבה כלפי מישהו.',
      ar: 'دفء وقرب تجاه شخص ما.',
    }),
  },
  {
    id: 'calm',
    fam: tr({ en: 'From the calm family.', he: 'ממשפחת הרוגע.', ar: 'من عائلة الهدوء.' }),
    subs: tr({
      en: ['Relief', 'Security', 'Hope', 'Serenity', 'Pleasantness', 'Peace of mind', 'Gratitude'],
      he: ['הקלה', 'ביטחון', 'תקווה', 'שלווה', 'נעימות', 'נחת רוח', 'הכרת תודה'],
      ar: ['ارتياح', 'أمان', 'أمل', 'سكينة', 'انشراح', 'راحة بال', 'امتنان'],
    }),
    icon: '😌',
    color: '#4fc3b5',
    name: tr({ en: 'Calm', he: 'רוגע', ar: 'هدوء' }),
    line: tr({ en: 'Right now, I feel calm.', he: 'עכשיו יש בי רוגע.', ar: 'الآن أشعر بالهدوء.' }),
    feel: tr({ en: 'I feel calm', he: 'יש בי רוגע', ar: 'أشعر بالهدوء' }),
    def: tr({
      en: 'The body slows down, and things feel manageable.',
      he: 'הגוף מאט, והדברים מרגישים אפשריים.',
      ar: 'يتباطأ الجسد، وتبدو الأمور ممكنة.',
    }),
  },
  {
    id: 'desire',
    fam: tr({ en: 'From the desire family.', he: 'ממשפחת התשוקה.', ar: 'من عائلة الرغبة.' }),
    subs: tr({
      en: ['Wanting', 'Urge', 'Pleasure', 'Craving', 'Lust'],
      he: ['חשק', 'דחף', 'עונג', 'השתוקקות', 'תאווה'],
      ar: ['اشتهاء', 'اندفاع', 'متعة', 'تلهّف', 'شهوة'],
    }),
    icon: '🔥',
    color: '#d65db1',
    name: tr({ en: 'Desire', he: 'תשוקה', ar: 'رغبة' }),
    line: tr({ en: 'Right now, I feel desire.', he: 'עכשיו יש בי תשוקה.', ar: 'الآن أشعر بالرغبة.' }),
    feel: tr({ en: 'I feel desire', he: 'יש בי תשוקה', ar: 'أشعر بالرغبة' }),
    def: tr({
      en: 'A strong pull toward something you want.',
      he: 'משיכה חזקה אל משהו שרוצים.',
      ar: 'انجذاب قوي نحو شيء تريدونه.',
    }),
  },
  {
    id: 'joy',
    fam: tr({ en: 'From the joy family.', he: 'ממשפחת השמחה.', ar: 'من عائلة الفرح.' }),
    subs: tr({
      en: ['Happiness', 'Enjoyment', 'Excitement', 'Enthusiasm', 'Optimism', 'Quiet joy', 'Pride'],
      he: ['אושר', 'הנאה', 'התרגשות', 'התלהבות', 'אופטימיות', 'נחת', 'גאווה'],
      ar: ['سعادة', 'استمتاع', 'تأثّر', 'حماسة', 'تفاؤل', 'سرور', 'فخر'],
    }),
    icon: '😄',
    color: '#ffc93c',
    name: tr({ en: 'Joy', he: 'שמחה', ar: 'فرح' }),
    line: tr({ en: 'Right now, I feel joy.', he: 'עכשיו יש בי שמחה.', ar: 'الآن أشعر بالفرح.' }),
    feel: tr({ en: 'I feel joy', he: 'יש בי שמחה', ar: 'أشعر بالفرح' }),
    def: tr({
      en: 'Something good is happening, and the body feels light.',
      he: 'קורה משהו טוב, והגוף מרגיש קל.',
      ar: 'يحدث شيء جيد، والجسد يشعر بالخفة.',
    }),
  },
  {
    id: 'satisfaction',
    fam: tr({ en: 'From the satisfaction family.', he: 'ממשפחת הסיפוק.', ar: 'من عائلة الرضا.' }),
    subs: tr({
      en: ['Contentment'],
      he: ['שביעות רצון'],
      ar: ['قناعة'],
    }),
    icon: '😊',
    color: '#8ac926',
    name: tr({ en: 'Satisfaction', he: 'סיפוק', ar: 'رضا' }),
    line: tr({ en: 'Right now, I feel satisfied.', he: 'עכשיו יש בי סיפוק.', ar: 'الآن أشعر بالرضا.' }),
    feel: tr({ en: 'I feel satisfied', he: 'יש בי סיפוק', ar: 'أشعر بالرضا' }),
    def: tr({
      en: 'Something got done or worked out, and that feels good.',
      he: 'משהו הושלם או הסתדר, וזה מרגיש טוב.',
      ar: 'شيء ما اكتمل أو نجح، وهذا شعور جيد.',
    }),
  },
];

/** Reminders to put the feeling into words. {feel} and {name} are filled in. */
const REMINDERS = tr({
  en: [
    'Now that it has a name, you can say it out loud.',
    'Try saying to yourself: “{feel}.”',
    'The people around you can’t see what’s going on inside. You can tell them.',
    'One word — “{name}” — says a lot. You can say it.',
    'Before you react, you can simply say what you feel.',
    '“{feel}” is a whole sentence. It’s okay to say it.',
  ],
  he: [
    'עכשיו, כשיש לזה שם, אפשר להגיד את זה בקול.',
    'נסו להגיד לעצמכם: "{feel}".',
    'מי שלידכם לא יודע מה קורה בפנים. אפשר לספר לו.',
    'מילה אחת, "{name}", אומרת הרבה. אפשר להגיד אותה.',
    'לפני שמגיבים, אפשר פשוט לומר מה מרגישים.',
    '"{feel} עכשיו" זה משפט שלם. מותר להגיד אותו.',
  ],
  ar: [
    'الآن وقد صار لهذا اسم، يمكن أن تقولوه بصوت عالٍ.',
    'جرّبوا أن تقولوا لأنفسكم: «{feel}».',
    'من حولكم لا يعرفون ما يجري في داخلكم. يمكنكم أن تخبروهم.',
    'كلمة واحدة، «{name}»، تقول الكثير. يمكنكم قولها.',
    'قبل أن تردّوا، يمكنكم ببساطة أن تقولوا ما تشعرون به.',
    '«{feel}» جملة كاملة. لا بأس أن تقولوها.',
  ],
});

interface Region {
  id: RegionId;
  label: string;
  /** Feelings commonly felt here: they bloom first and closest. */
  near: EmotionId[];
  /** Where feelings bloom from and the label lands, in the silhouette's viewBox. */
  at: [number, number];
}

const REGIONS: Region[] = [
  { id: 'head', label: tr({ en: 'Head', he: 'ראש ומצח', ar: 'الرأس والجبين' }), near: ['confusion', 'tension', 'frustration'], at: [100, 26] },
  { id: 'jaw', label: tr({ en: 'Jaw and face', he: 'לסת ופנים', ar: 'الفك والوجه' }), near: ['anger', 'frustration', 'tension'], at: [100, 62] },
  { id: 'throat', label: tr({ en: 'Throat', he: 'גרון', ar: 'الحلق' }), near: ['hurt', 'shame', 'fear'], at: [100, 88] },
  { id: 'shoulders', label: tr({ en: 'Shoulders and neck', he: 'כתפיים וצוואר', ar: 'الكتفان والرقبة' }), near: ['tension', 'frustration', 'anger'], at: [100, 108] },
  { id: 'chest', label: tr({ en: 'Chest', he: 'חזה', ar: 'الصدر' }), near: ['tension', 'fear', 'hurt'], at: [100, 146] },
  { id: 'belly', label: tr({ en: 'Belly', he: 'בטן', ar: 'البطن' }), near: ['fear', 'shame', 'tension'], at: [100, 206] },
  { id: 'hands', label: tr({ en: 'Hands', he: 'ידיים', ar: 'اليدان' }), near: ['anger', 'frustration', 'tension'], at: [172, 204] },
];

const NOTICE_COOL = 10;
const NAME_COOL = 18;
const LINGER_MS = 3200;

// The silhouette: head, neck and torso are one clip; arms are drawn as thick strokes.
const TORSO = 'M89 84 L89 94 Q62 96 52 108 Q44 118 46 140 L51 196 Q53 236 72 240 L128 240 Q147 236 149 196 L154 140 Q156 118 148 108 Q138 96 111 94 L111 84 Z';
const ARM_L = 'M54 112 Q34 120 31 150 L28 192';
const ARM_R = 'M146 112 Q166 120 169 150 L172 192';

function silhouette() {
  const clip = 'url(#bc-clip)';
  const band = (id: RegionId, y: number, hgt: number, x = 20, w = 160) =>
    `<rect class="bc-region" data-region="${id}" x="${x}" y="${y}" width="${w}" height="${hgt}" clip-path="${clip}"/>`;
  return `
<svg class="bc-body" viewBox="0 0 200 250" aria-hidden="true">
  <defs>
    <clipPath id="bc-clip">
      <ellipse cx="100" cy="44" rx="29" ry="33"/>
      <rect x="89" y="70" width="22" height="30"/>
      <path d="${TORSO}"/>
    </clipPath>
    <radialGradient id="bc-hot"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="bc-cool"><stop offset="0" stop-color="#2ec4b6" stop-opacity=".8"/><stop offset="1" stop-color="#2ec4b6" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="100" cy="244" rx="62" ry="6" fill="rgba(42,24,56,.12)"/>
  <g class="bc-arms">
    <path d="${ARM_L}" class="bc-arm-edge"/><path d="${ARM_R}" class="bc-arm-edge"/>
    <circle cx="28" cy="204" r="15" class="bc-skin bc-edge"/><circle cx="172" cy="204" r="15" class="bc-skin bc-edge"/>
    <path d="${ARM_L}" class="bc-arm-fill"/><path d="${ARM_R}" class="bc-arm-fill"/>
  </g>
  <g class="bc-skin bc-edge">
    <rect x="89" y="70" width="22" height="28"/>
    <path d="${TORSO}"/>
    <ellipse cx="100" cy="44" rx="29" ry="33"/>
  </g>
  <g class="bc-heat" clip-path="${clip}">
    <circle class="bc-blob b1" cx="100" cy="150" r="46"/>
    <circle class="bc-blob b2" cx="80" cy="60" r="34"/>
    <circle class="bc-blob b3" cx="124" cy="200" r="40"/>
    <circle class="bc-blob b4" cx="100" cy="112" r="36"/>
  </g>
  <g class="bc-heat bc-heat-hands">
    <circle class="bc-blob b2" cx="28" cy="204" r="16"/>
    <circle class="bc-blob b3" cx="172" cy="204" r="16"/>
  </g>
  ${band('head', 8, 38)}
  ${band('jaw', 46, 32)}
  ${band('throat', 78, 18)}
  ${band('shoulders', 96, 24)}
  ${band('chest', 120, 52)}
  ${band('belly', 172, 72)}
  <g class="bc-region" data-region="hands">
    <path d="${ARM_L}" class="bc-arm-hit"/><path d="${ARM_R}" class="bc-arm-hit"/>
    <circle cx="28" cy="204" r="17"/><circle cx="172" cy="204" r="17"/>
  </g>
  <g class="bc-lines" fill="none" stroke="#2a1838" stroke-width="2.4" stroke-linecap="round" opacity=".5">
    <path d="M88 44 q4 -3 8 0 M104 44 q4 -3 8 0"/>
    <path d="M93 60 q7 4 14 0"/>
  </g>
</svg>`;
}

export interface BodyResult {
  /** The places touched, as labels. */
  places: string[];
  /** The word chosen: a family's name or a sharper word in it. */
  feeling: string;
  icon: string;
}

/** Anger usually sits in more than one place; two keeps it quick. */
const MAX_PLACES = 2;

export class BodyCalm implements Calm {
  title = tr({ en: 'Where do you feel it?', he: 'איפה אתם מרגישים את זה?', ar: 'أين تشعرون بذلك؟' });
  hint = tr({
    en: 'Touch the place in your body where you feel the heat',
    he: 'געו במקום בגוף שבו מרגישים את החום',
    ar: 'المسوا المكان في جسدكم حيث تشعرون بالحرارة',
  });
  /** Naming a feeling needs a little quiet: fewer interruptions than the other calms. */
  mischiefScale = 1.7;
  /** Filled in once a feeling is named. */
  result: BodyResult | null = null;

  constructor(private c: CalmCtx) {}

  mount() {
    const { board, scope, audio } = this.c;
    const stage = h('div', { class: 'bc-stage', html: silhouette() });
    const chips = h('div', { class: 'bc-chips', role: 'group', 'aria-label': tr({ en: 'What is it?', he: 'מה זה?', ar: 'ما هو؟' }) });
    const lines = h('div', { class: 'bc-lines-text', 'aria-live': 'polite' });
    const wrap = h('div', { class: 'bodycalm' }, stage, chips, lines);
    board.append(wrap);

    const svg = stage.querySelector('svg')!;
    const regionEls = [...svg.querySelectorAll<SVGElement>('.bc-region')];
    const picked: Region[] = [];
    let family: Emotion | null = null;
    let chosen = false;
    let noticed = false;

    const HINT_PICK = tr({ en: 'What is it? Pick the closest one', he: 'מה זה? בחרו את מה שהכי קרוב', ar: 'ما هو؟ اختاروا الأقرب' });
    const HINT_MORE = tr({
      en: 'What is it? Pick the closest one. You can mark one more place',
      he: 'מה זה? בחרו את מה שהכי קרוב. אפשר לסמן עוד מקום אחד',
      ar: 'ما هو؟ اختاروا الأقرب. يمكنكم تحديد مكان آخر',
    });
    const HINT_SHARPEN = tr({ en: 'Which word fits best?', he: 'איזו מילה מתאימה הכי הרבה?', ar: 'أيّ كلمة تناسب أكثر؟' });
    const pickHint = () => (picked.length < MAX_PLACES ? HINT_MORE : HINT_PICK);

    /** A region's anchor in viewport pixels (the layout moves as chips come and go). */
    const anchorOf = (r: Region) => {
      const pt = new DOMPoint(r.at[0], r.at[1]).matrixTransform(svg.getScreenCTM() ?? new DOMMatrix());
      return { x: pt.x, y: pt.y };
    };

    /** Families felt in the touched places come first. */
    const ordered = () => {
      const near = [...new Set(picked.flatMap((r) => r.near))];
      return [...near.map((id) => EMOTIONS.find((e) => e.id === id)!), ...EMOTIONS.filter((e) => !near.includes(e.id))];
    };

    const chip = (icon: string | null, text: string, color: string, cls = '') =>
      h(
        'button',
        { class: `bc-chip ${cls}`, type: 'button', style: `--c: ${color}` },
        icon && h('span', { class: 'bc-chip-icon', 'aria-hidden': 'true' }, icon),
        h('span', {}, text),
      );

    /** Chips fly out of the point they came from. */
    const popIn = (buttons: HTMLElement[], from: { x: number; y: number }) =>
      buttons.forEach((b, i) => {
        const br = b.getBoundingClientRect();
        b.animate(
          [
            { transform: `translate(${from.x - (br.left + br.width / 2)}px, ${from.y - (br.top + br.height / 2)}px) scale(0.2)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 460, delay: i * 30, easing: 'cubic-bezier(0.34, 1.35, 0.64, 1)', fill: 'backwards' },
        );
      });

    const showFamilies = (from: { x: number; y: number }) => {
      family = null;
      chips.classList.remove('bc-sharpen');
      const list = ordered();
      const buttons = list.map((e) => chip(e.icon, e.name, e.color));
      chips.replaceChildren(...buttons);
      popIn(buttons, from); // measured after the chips take their space
      buttons.forEach((b, i) => b.addEventListener('click', () => sharpen(list[i], b)));
    };

    /** The family's own name stays a choice; the sharper words sit beside it. */
    const sharpen = (e: Emotion, from: HTMLElement) => {
      if (chosen) return;
      family = e;
      const fr = from.getBoundingClientRect();
      audio.pluck(4);
      vibrate(10);
      this.c.say(HINT_SHARPEN);
      const back = h('button', { class: 'bc-chip bc-back', type: 'button', 'aria-label': tr({ en: 'Back to all feelings', he: 'חזרה לכל הרגשות', ar: 'العودة إلى كل المشاعر' }) }, '↩');
      const head = chip(e.icon, e.name, e.color, 'bc-head');
      const subs = e.subs.map((w) => chip(null, w, e.color));
      chips.classList.add('bc-sharpen');
      chips.replaceChildren(back, head, ...subs);
      popIn([head, ...subs], { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 });
      back.addEventListener('click', () => {
        this.c.say(pickHint());
        showFamilies(anchorOf(picked[0]));
      });
      head.addEventListener('click', () => choose(e, null, head));
      subs.forEach((b, i) => b.addEventListener('click', () => choose(e, e.subs[i], b)));
    };

    /** Touching a place marks it (the oldest gives way past two); touching it again lets it go. */
    const touch = (id: RegionId) => {
      if (chosen) return;
      const r = REGIONS.find((x) => x.id === id)!;
      const at = picked.indexOf(r);
      if (at >= 0) picked.splice(at, 1);
      else {
        picked.push(r);
        if (picked.length > MAX_PLACES) picked.shift();
      }
      regionEls.forEach((el) => el.classList.toggle('sel', picked.some((p) => p.id === el.dataset.region)));
      audio.pluck(3);
      vibrate(12);
      if (!picked.length) {
        family = null;
        chips.replaceChildren();
        this.c.say(this.hint);
        return;
      }
      if (at < 0) {
        const a = anchorOf(r);
        this.c.fx.ring(a.x, a.y, '#2ec4b6', 44);
        if (!noticed) {
          noticed = true;
          this.c.heat(-NOTICE_COOL);
        }
      }
      // Already sharpening a feeling: the places change, the words stay.
      if (family) return;
      this.c.say(pickHint());
      showFamilies(anchorOf(at < 0 ? r : picked[0]));
    };

    regionEls.forEach((el) => {
      const id = el.dataset.region as RegionId;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', REGIONS.find((r) => r.id === id)!.label);
      el.addEventListener('click', () => touch(id));
      el.addEventListener('keydown', (e) => {
        const k = (e as KeyboardEvent).key;
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          touch(id);
        }
      });
    });
    // The picture itself should be reachable by keyboard and screen readers, not hidden.
    svg.removeAttribute('aria-hidden');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', this.title);

    const choose = (e: Emotion, word: string | null, btn: HTMLElement) => {
      if (chosen || !picked.length) return;
      chosen = true;
      const r = picked[0];
      const a = anchorOf(r);
      const br = btn.getBoundingClientRect();
      for (const other of chips.children) {
        if (other !== btn) (other as HTMLElement).animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.8)' }], { duration: 220, fill: 'forwards' });
      }
      btn.animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: `translate(${a.x - (br.left + br.width / 2)}px, ${a.y - (br.top + br.height / 2)}px) scale(0.5)`, opacity: 0 },
        ],
        { duration: 420, easing: 'ease-in', fill: 'forwards' },
      );
      this.result = { places: picked.map((p) => p.label), feeling: word ?? e.name, icon: e.icon };
      audio.bell(2, 0.6);
      vibrate([15, 40, 15]);
      scope.timeout(() => {
        svg.classList.add('cooled');
        this.c.say('');
        showLines(e, word); // first, so the body settles into its final size
        placeTag(r, `${e.icon} ${word ?? e.name}`);
        this.c.heat(-NAME_COOL);
        for (const p of picked) {
          const now = anchorOf(p);
          this.c.fx.ring(now.x, now.y, '#2ec4b6', 60);
        }
      }, 380);
    };

    /** The label lives inside the SVG, so it stays on the body however the layout shifts. */
    const placeTag = (r: Region, text: string) => {
      const NS = 'http://www.w3.org/2000/svg';
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'bc-tag');
      const rect = document.createElementNS(NS, 'rect');
      const label = document.createElementNS(NS, 'text');
      label.textContent = text;
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'central');
      label.setAttribute('direction', document.documentElement.dir || 'ltr');
      g.append(rect, label);
      svg.append(g);
      const b = label.getBBox();
      const w = b.width + 16;
      const hh = b.height + 6;
      const x = Math.min(200 - w / 2 + 6, Math.max(w / 2 - 6, r.at[0]));
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(r.at[1]));
      rect.setAttribute('x', String(x - w / 2));
      rect.setAttribute('y', String(r.at[1] - hh / 2));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(hh));
      rect.setAttribute('rx', String(hh / 2));
    };

    /** A family's own line and definition; a sharper word gets its family instead. */
    const showLines = (e: Emotion, word: string | null) => {
      chips.hidden = true;
      const texts = word
        ? [
            tr({ en: `What I feel right now: ${word.toLowerCase()}.`, he: `עכשיו יש בי ${word}.`, ar: `ما أشعر به الآن: ${word}.` }),
            e.fam,
            pick(REMINDERS.filter((t) => !t.includes('{feel}'))).replace('{name}', word.toLowerCase()),
          ]
        : [e.line, e.def, pick(REMINDERS).replace('{feel}', e.feel).replace('{name}', e.name.toLowerCase())];
      const classes = ['bc-name', 'bc-def', 'bc-remind'];
      texts.forEach((t, i) => {
        const p = h('p', { class: classes[i] }, t);
        lines.append(p);
        p.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
          duration: 320,
          delay: i * 420,
          fill: 'backwards',
          easing: 'ease-out',
        });
      });
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.c.done();
      };
      const shownFor = (texts.length - 1) * 420 + LINGER_MS;
      scope.timeout(finish, shownFor);
      // A tap moves on sooner, once the words have had a moment.
      scope.timeout(() => scope.on(wrap, 'click', finish), 900);
    };
  }
}

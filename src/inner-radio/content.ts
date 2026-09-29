import { tr } from '../shared/i18n';
import { profile } from '../shared/profile';
import type { Who } from '../shared/face';
import type { Emotion, Tile } from './logic';

/** Hebrew verbs agree with the speaker: the player picks how to be addressed in "My home". */
const heMe = (m: string, f: string) => (profile.address === 'f' ? f : profile.address === 'm' ? m : `${m}/ה`);

type L = { en: string; he: string; ar: string };

export interface EmotionInfo {
  /** Shown on the dial and in the album. */
  name: string;
  /** Joins the sentence after "I feel" (in Arabic it follows "بـ"). */
  word: string;
  body: string;
  example: string;
  color: string;
  /** MIDI notes of its little tune, a step length (s) and a voice. */
  motif: number[];
  step: number;
  wave: OscillatorType;
}

const E = (o: { name: L; word: L; body: L; example: L; color: string; motif: number[]; step: number; wave: OscillatorType }): EmotionInfo => ({
  name: tr(o.name),
  word: tr(o.word),
  body: tr(o.body),
  example: tr(o.example),
  color: o.color,
  motif: o.motif,
  step: o.step,
  wave: o.wave,
});

export const EMOTION: Record<Emotion, EmotionInfo> = {
  hurt: E({
    name: { en: 'Hurt', he: 'עלבון', ar: 'إهانة' },
    word: { en: 'hurt', he: 'עלבון', ar: 'الإهانة' },
    body: {
      en: 'Heat in the cheeks. Wanting to hit back — or to disappear.',
      he: 'חום בלחיים. רצון להחזיר — או להיעלם.',
      ar: 'حرارة في الخدّين. رغبة في الردّ — أو في الاختفاء.',
    },
    example: {
      en: '“I feel hurt when I’m not answered, because I want to matter to you.”',
      he: '"אני מרגיש/ה עלבון כשלא עונים לי, כי חשוב לי להיות חשוב/ה לכם."',
      ar: '«أشعر بالإهانة عندما لا يُردّ عليّ، لأنني أريد أن أكون مهمًّا لكم.»',
    },
    color: '#ff7aa2',
    motif: [69, 67, 64, 62, 64, 60],
    step: 0.5,
    wave: 'sine',
  }),
  fear: E({
    name: { en: 'Worry', he: 'דאגה', ar: 'قلق' },
    word: { en: 'worried', he: 'דאגה', ar: 'القلق' },
    body: {
      en: 'A tight chest and a racing mind: what if…?',
      he: 'לחץ בחזה וראש שרץ: ומה אם...?',
      ar: 'ضيق في الصدر وعقل يركض: وماذا لو...؟',
    },
    example: {
      en: '“I feel worried when I don’t hear from you, because your safety matters to me.”',
      he: '"אני מרגיש/ה דאגה כשאין ממך הודעה, כי חשוב לי שיהיה לך טוב."',
      ar: '«أشعر بالقلق عندما لا تصلني منك رسالة، لأن سلامتك تهمّني.»',
    },
    color: '#8a7bff',
    motif: [76, 77, 76, 74, 76, 77, 79, 77],
    step: 0.2,
    wave: 'triangle',
  }),
  tired: E({
    name: { en: 'Tired', he: 'עייפות', ar: 'تعب' },
    word: { en: 'tired', he: 'עייפות', ar: 'التعب' },
    body: {
      en: 'Heavy arms, a short fuse. Everything is too much.',
      he: 'ידיים כבדות ופתיל קצר. הכל יותר מדי.',
      ar: 'ذراعان ثقيلتان وفتيل قصير. كل شيء أكثر من اللازم.',
    },
    example: {
      en: '“I feel tired tonight, so I need ten quiet minutes before we talk.”',
      he: '"אני מרגיש/ה עייפות הערב, אז אני צריך/ה עשר דקות שקט לפני שנדבר."',
      ar: '«أشعر بالتعب الليلة، لذلك أحتاج عشر دقائق هادئة قبل أن نتكلم.»',
    },
    color: '#58a6ff',
    motif: [52, 55, 57, 55],
    step: 0.85,
    wave: 'sine',
  }),
  sad: E({
    name: { en: 'Disappointed', he: 'אכזבה', ar: 'خيبة أمل' },
    word: { en: 'disappointed', he: 'אכזבה', ar: 'خيبة الأمل' },
    body: {
      en: 'A sinking feeling: it was supposed to be different.',
      he: 'משהו שוקע בבטן: זה היה אמור להיות אחרת.',
      ar: 'شيء يهبط في البطن: كان يُفترض أن يكون مختلفًا.',
    },
    example: {
      en: '“I feel disappointed, because I was really looking forward to this.”',
      he: '"אני מרגיש/ה אכזבה, כי מאוד חיכיתי לזה."',
      ar: '«أشعر بخيبة الأمل، لأنني كنت أنتظر هذا كثيرًا.»',
    },
    color: '#3fb8a8',
    motif: [67, 62, 64, 60],
    step: 0.55,
    wave: 'triangle',
  }),
  lonely: E({
    name: { en: 'Alone', he: 'בדידות', ar: 'وحدة' },
    word: { en: 'alone', he: 'בדידות', ar: 'الوحدة' },
    body: {
      en: 'Nobody is in this with me.',
      he: 'אף אחד לא איתי בזה.',
      ar: 'لا أحد معي في هذا.',
    },
    example: {
      en: '“I feel alone with this, and I’d love us to do it together.”',
      he: '"אני מרגיש/ה בדידות עם זה, והייתי שמח/ה שנעשה את זה יחד."',
      ar: '«أشعر بالوحدة في هذا، وأتمنى أن نفعله معًا.»',
    },
    color: '#9aa6c2',
    motif: [72, 0, 0, 72, 0, 67],
    step: 0.45,
    wave: 'sine',
  }),
  shame: E({
    name: { en: 'Embarrassed', he: 'מבוכה', ar: 'إحراج' },
    word: { en: 'embarrassed', he: 'מבוכה', ar: 'الإحراج' },
    body: {
      en: 'Wanting the floor to swallow you. Everyone’s eyes on you.',
      he: 'רצון שהאדמה תבלע אותך. כל העיניים עליך.',
      ar: 'رغبة في أن تبتلعك الأرض. كل العيون عليك.',
    },
    example: {
      en: '“I feel embarrassed, and I need a minute before I can think clearly.”',
      he: '"אני מרגיש/ה מבוכה, ואני צריך/ה רגע לפני שאוכל לחשוב בבהירות."',
      ar: '«أشعر بالإحراج، وأحتاج لحظة قبل أن أستطيع التفكير بوضوح.»',
    },
    color: '#ffb14a',
    motif: [64, 65, 66, 65, 64],
    step: 0.35,
    wave: 'triangle',
  }),
};

/** The feeling tile for one or two locked stations: "hurt and alone". */
export function feelingText(ids: readonly Emotion[]) {
  const w = ids.map((id) => EMOTION[id].word);
  return tr({
    en: w.join(' and '),
    he: w.join(' ו'),
    ar: `ب${w.join(' و')}`,
  });
}

// Openers are the same everywhere: the angry one blames, the direct one owns the feeling.
export const OPENERS: Tile[] = [
  { v: -1, text: tr({ en: 'You always make me feel', he: `בגללך אני תמיד ${heMe('מרגיש', 'מרגישה')}`, ar: 'بسببك أشعر دائمًا' }) },
  { v: 1, text: tr({ en: 'I feel', he: `אני ${heMe('מרגיש', 'מרגישה')}`, ar: 'أشعر' }) },
];

const VAGUE: Tile = { v: 0, text: tr({ en: 'when… you know', he: 'כש... נו, ברור', ar: 'عندما... مفهوم' }) };

export interface Scene {
  id: string;
  name: string;
  who: Who;
  stations: Emotion[];
  weights: Partial<Record<Emotion, number>>;
  text: string;
  thought: string;
  /** Options for "when…" and "because…"; the first of each is the angry one pre-filled. */
  when: Tile[];
  because: Tile[];
  good: string;
  bad: string;
}

const t = (v: Tile['v'], s: L): Tile => ({ v, text: tr(s) });

const ALL: Emotion[] = ['hurt', 'fear', 'tired', 'sad', 'lonely', 'shame'];
const FOUR: Emotion[] = ['hurt', 'fear', 'tired', 'sad'];

export const SCENES: Scene[] = [
  {
    id: 'phone',
    name: tr({ en: 'Phone at dinner', he: 'טלפון בארוחה', ar: 'هاتف على العشاء' }),
    who: 'teen',
    stations: ['hurt', 'tired'],
    weights: { hurt: 0.9, tired: 0.35 },
    text: tr({
      en: 'You’ve asked three times to put the phone away at dinner. He doesn’t even look up.',
      he: 'ביקשתם שלוש פעמים להניח את הטלפון בארוחה. הוא אפילו לא מרים את העיניים.',
      ar: 'طلبتم ثلاث مرات أن يترك الهاتف على العشاء. لا يرفع عينيه حتى.',
    }),
    thought: tr({ en: 'He doesn’t see me at all.', he: 'הוא לא רואה אותי בכלל.', ar: 'إنه لا يراني أبدًا.' }),
    when: [
      t(-1, { en: 'when you’re this rude', he: 'כשאתה כזה חצוף', ar: 'عندما تكون وقحًا هكذا' }),
      t(1, { en: 'when the phone stays out at dinner', he: 'כשהטלפון נשאר על השולחן בארוחה', ar: 'عندما يبقى الهاتف على طاولة العشاء' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so cut it out already!', he: 'אז די כבר!', ar: 'فكفى!' }),
      t(1, { en: 'because our dinners together matter to me.', he: 'כי הארוחות שלנו ביחד חשובות לי.', ar: 'لأن عشاءنا معًا مهم لي.' }),
    ],
    good: tr({
      en: '…Okay. I didn’t know it got to you like that. Phone’s away.',
      he: '...אוקיי. לא ידעתי שזה מגיע אליך ככה. הנה, הנחתי.',
      ar: '...حسنًا. لم أعرف أن هذا يزعجك هكذا. ها قد تركته.',
    }),
    bad: tr({ en: 'Here we go again…', he: 'הנה זה מתחיל שוב...', ar: 'ها نحن نبدأ من جديد...' }),
  },
  {
    id: 'late',
    name: tr({ en: 'An hour late', he: 'שעה איחור', ar: 'ساعة تأخير' }),
    who: 'partner',
    stations: ['fear', 'hurt', 'tired'],
    weights: { fear: 0.9, hurt: 0.4 },
    text: tr({
      en: 'Your partner is an hour late. No call, no message. Dinner is cold.',
      he: 'בן או בת הזוג מאחרים בשעה. בלי טלפון, בלי הודעה. האוכל התקרר.',
      ar: 'شريككم متأخر ساعة. لا اتصال ولا رسالة. العشاء برد.',
    }),
    thought: tr({
      en: 'Something must have happened… or they just don’t care.',
      he: 'משהו קרה... או שפשוט לא אכפת.',
      ar: 'حدث شيء ما... أو أنه ببساطة لا يهتم.',
    }),
    when: [
      t(-1, { en: 'when you’re this selfish', he: 'כשאכפת לך רק מעצמך', ar: 'عندما لا تهتم إلا بنفسك' }),
      t(1, { en: 'when you’re late without a message', he: 'כשיש איחור בלי שום הודעה', ar: 'عندما تتأخر بلا أي رسالة' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so don’t bother coming home!', he: 'אז בכלל לא צריך לחזור!', ar: 'فلا داعي أن تعود أصلًا!' }),
      t(1, { en: 'because I need to know you’re safe.', he: 'כי חשוב לי לדעת שהכל בסדר איתך.', ar: 'لأنني أحتاج أن أعرف أنك بخير.' }),
    ],
    good: tr({
      en: 'I’m sorry. My battery died. I should have called from work.',
      he: 'סליחה. נגמרה לי הסוללה. הייתי צריך להתקשר מהעבודה.',
      ar: 'آسف. نفدت البطارية. كان عليّ أن أتصل من العمل.',
    }),
    bad: tr({ en: 'Wow. Nice welcome.', he: 'וואו. קבלת פנים נחמדה.', ar: 'واو. استقبال لطيف.' }),
  },
  {
    id: 'morning',
    name: tr({ en: 'Six a.m.', he: 'שש בבוקר', ar: 'السادسة صباحًا' }),
    who: 'child',
    stations: FOUR,
    weights: { tired: 0.9, sad: 0.3 },
    text: tr({
      en: '6 a.m., after a sleepless night. The kids are already fighting over the remote — loudly.',
      he: 'שש בבוקר, אחרי לילה לבן. הילדים כבר רבים על השלט — בצעקות.',
      ar: 'السادسة صباحًا بعد ليلة بلا نوم. الأولاد يتشاجرون على جهاز التحكم — بالصراخ.',
    }),
    thought: tr({ en: 'I can’t take one more minute of this.', he: 'אין לי כוח לזה עוד דקה.', ar: 'لا أحتمل دقيقة أخرى.' }),
    when: [
      t(-1, { en: 'when you two act like wild animals', he: 'כשאתם מתנהגים כמו חיות', ar: 'عندما تتصرفان كالحيوانات' }),
      t(1, { en: 'when there’s shouting this early', he: 'כשיש צעקות כל כך מוקדם', ar: 'عندما يكون هناك صراخ في هذا الوقت المبكر' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so hand it over — no TV for a week!', he: 'אז תביאו את השלט — אין טלוויזיה שבוע!', ar: 'هاتوا جهاز التحكم — لا تلفاز لأسبوع!' }),
      t(1, { en: 'because I need a quiet morning to have patience.', he: 'כי בלי בוקר שקט אין לי סבלנות.', ar: 'لأنني أحتاج صباحًا هادئًا كي يكون لي صبر.' }),
    ],
    good: tr({
      en: '…Sorry. We’ll take turns. Quietly.',
      he: '...סליחה. נתחלק בתורות. בשקט.',
      ar: '...آسفون. سنتناوب. بهدوء.',
    }),
    bad: tr({ en: 'But HE started it!', he: 'אבל הוא התחיל!', ar: 'لكنه هو من بدأ!' }),
  },
  {
    id: 'grandma',
    name: tr({ en: 'Grandma’s remark', he: 'ההערה של סבתא', ar: 'ملاحظة الجدة' }),
    who: 'grandma',
    stations: FOUR,
    weights: { hurt: 0.9, fear: 0.3 },
    text: tr({
      en: 'At Friday dinner, Grandma says in front of the kids: “In my day, children listened to their parents.”',
      he: 'בארוחת שישי סבתא אומרת מול הילדים: "פעם ילדים הקשיבו להורים שלהם."',
      ar: 'على عشاء الجمعة تقول الجدة أمام الأولاد: «في أيامنا كان الأولاد يسمعون كلام أهلهم.»',
    }),
    thought: tr({ en: 'She thinks I’m a bad parent.', he: 'היא חושבת שאני הורה גרוע.', ar: 'تظنّني والدًا سيئًا.' }),
    when: [
      t(-1, { en: 'when you stick your nose in, like always', he: 'כשאת מתערבת, כמו תמיד', ar: 'عندما تتدخلين، كالعادة' }),
      t(1, { en: 'when my parenting comes up in front of the kids', he: 'כשמעירים על החינוך שלי מול הילדים', ar: 'عندما يُعلَّق على تربيتي أمام الأولاد' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so maybe just stay out of it!', he: 'אז אולי פשוט אל תתערבי!', ar: 'فمن الأفضل ألا تتدخلي!' }),
      t(1, { en: 'because I want the kids to see us on the same team.', he: 'כי חשוב לי שהילדים יראו שאנחנו באותו צוות.', ar: 'لأنني أريد أن يرانا الأولاد في الفريق نفسه.' }),
    ],
    good: tr({
      en: 'Oh. I didn’t mean it like that. You’re doing a good job, you know.',
      he: 'אה. לא התכוונתי ככה. אתם עושים עבודה טובה, שתדעו.',
      ar: 'آه. لم أقصد ذلك. أنتم تقومون بعمل جيد، أتعرفون.',
    }),
    bad: tr({ en: 'Well! I’m only trying to help.', he: 'נו! אני רק מנסה לעזור.', ar: 'طيب! أنا أحاول المساعدة فقط.' }),
  },
  {
    id: 'trip',
    name: tr({ en: 'The family trip', he: 'הטיול המשפחתי', ar: 'الرحلة العائلية' }),
    who: 'partner',
    stations: FOUR,
    weights: { sad: 0.9, tired: 0.45 },
    text: tr({
      en: 'You planned this day trip for weeks. Ten minutes in the car and everyone is complaining.',
      he: 'תכננתם את הטיול הזה שבועות. עשר דקות באוטו וכולם כבר מתלוננים.',
      ar: 'خطّطتم لهذه الرحلة منذ أسابيع. عشر دقائق في السيارة والجميع يتذمّر.',
    }),
    thought: tr({ en: 'Why do I even bother?', he: 'בשביל מה בכלל להתאמץ?', ar: 'لماذا أتعب نفسي أصلًا؟' }),
    when: [
      t(-1, { en: 'when you’re all so ungrateful', he: 'כשכולכם כפויי טובה', ar: 'عندما تكونون جميعًا ناكرين للجميل' }),
      t(1, { en: 'when the trip starts with complaints', he: 'כשהטיול מתחיל בתלונות', ar: 'عندما تبدأ الرحلة بالتذمّر' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so we’re turning around — happy now?', he: 'אז חוזרים הביתה — מרוצים?', ar: 'إذن سنعود إلى البيت — مبسوطين؟' }),
      t(1, { en: 'because I put my heart into this day.', he: 'כי השקעתי את הלב ביום הזה.', ar: 'لأنني وضعت قلبي في هذا اليوم.' }),
    ],
    good: tr({
      en: 'You’re right. You worked hard on this. Okay, everyone — fresh start?',
      he: 'צודקים. השקעת בזה המון. יאללה, כולם — מתחילים מחדש?',
      ar: 'معك حق. تعبت كثيرًا على هذا. هيا يا جماعة — نبدأ من جديد؟',
    }),
    bad: tr({ en: 'We didn’t even want to come…', he: 'בכלל לא רצינו לבוא...', ar: 'لم نكن نريد المجيء أصلًا...' }),
  },
  {
    id: 'school',
    name: tr({ en: 'A note from school', he: 'פתק מבית הספר', ar: 'ورقة من المدرسة' }),
    who: 'child',
    stations: ALL,
    weights: { fear: 0.85, shame: 0.7, hurt: 0.3 },
    text: tr({
      en: 'A note from school: your son hit another kid at recess. The other parents are in the class group chat.',
      he: 'פתק מבית הספר: הבן שלכם הרביץ לילד בהפסקה. כל ההורים בקבוצת הווטסאפ של הכיתה.',
      ar: 'ورقة من المدرسة: ابنكم ضرب ولدًا في الاستراحة. كل الأهالي في مجموعة الصف.',
    }),
    thought: tr({
      en: 'What will everyone think of us? What’s going on with him?',
      he: 'מה כולם יחשבו עלינו? מה קורה איתו?',
      ar: 'ماذا سيظن الجميع بنا؟ ما الذي يحدث معه؟',
    }),
    when: [
      t(-1, { en: 'when you embarrass me like this', he: 'כשאתה מבייש אותי ככה', ar: 'عندما تُحرجني هكذا' }),
      t(1, { en: 'when I read that you hit someone', he: 'כשכתוב פה שהרבצת למישהו', ar: 'عندما أقرأ أنك ضربت أحدًا' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so go to your room — now!', he: 'אז לחדר, עכשיו!', ar: 'إلى غرفتك، الآن!' }),
      t(1, { en: 'because I care what’s going on with you.', he: 'כי אכפת לי מה עובר עליך.', ar: 'لأنني أهتم بما يحدث معك.' }),
    ],
    good: tr({
      en: '…He grabbed my snack and laughed at me. I got really mad.',
      he: '...הוא חטף לי את הכריך וצחק עליי. התעצבנתי מאוד.',
      ar: '...خطف مني الساندويتش وضحك عليّ. غضبت كثيرًا.',
    }),
    bad: tr({ en: 'Nobody ever listens to me anyway!', he: 'אף אחד לא מקשיב לי בכלל!', ar: 'لا أحد يسمعني أصلًا!' }),
  },
  {
    id: 'birthday',
    name: tr({ en: 'Forgotten birthday', he: 'יום הולדת נשכח', ar: 'عيد ميلاد منسي' }),
    who: 'partner',
    stations: ALL,
    weights: { hurt: 0.8, lonely: 0.7, sad: 0.4 },
    text: tr({
      en: 'It’s your birthday. It’s 9 p.m. Nobody at home has said a word.',
      he: 'היום יום ההולדת שלכם. תשע בערב. אף אחד בבית לא אמר מילה.',
      ar: 'اليوم عيد ميلادكم. التاسعة مساءً. لم يقل أحد في البيت كلمة.',
    }),
    thought: tr({
      en: 'I remember everyone’s birthday. Nobody remembers mine.',
      he: 'את ימי ההולדת של כולם זוכרים בזכותי. את שלי — אף אחד.',
      ar: 'أتذكر أعياد ميلاد الجميع. عيدي لا أحد يتذكره.',
    }),
    when: [
      t(-1, { en: 'when you only think about yourself', he: 'כשאין לך טיפת התחשבות', ar: 'عندما لا تفكر إلا بنفسك' }),
      t(1, { en: 'when my birthday goes by without a word', he: 'כשיום ההולדת שלי עובר בלי מילה', ar: 'عندما يمرّ عيد ميلادي بلا كلمة' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so forget it, I don’t need anything from you.', he: 'אז עזבו, לא צריך כלום.', ar: 'انسَ الأمر، لا أحتاج شيئًا منك.' }),
      t(1, { en: 'because feeling remembered matters to me.', he: 'כי חשוב לי להרגיש שזוכרים אותי.', ar: 'لأنه يهمني أن أشعر أنكم تتذكرونني.' }),
    ],
    good: tr({
      en: 'Oh no. I’m so sorry. You deserve better — tomorrow we celebrate properly.',
      he: 'אוי, לא. סליחה ענקית. מגיע לך יותר — מחר חוגגים כמו שצריך.',
      ar: 'يا إلهي. آسف جدًا. تستحق أكثر — غدًا نحتفل كما يجب.',
    }),
    bad: tr({ en: 'It’s just a birthday — why the drama?', he: 'זה סתם יום הולדת — למה הדרמה?', ar: 'إنه مجرد عيد ميلاد — لماذا الدراما؟' }),
  },
  {
    id: 'door',
    name: tr({ en: 'The slammed door', he: 'הדלת שנטרקה', ar: 'الباب المصفوق' }),
    who: 'teenGirl',
    stations: ALL,
    weights: { fear: 0.75, hurt: 0.7, lonely: 0.35 },
    text: tr({
      en: 'Your daughter yells “You don’t understand anything!” and slams her door.',
      he: 'הבת שלכם צועקת "אתם לא מבינים כלום!" וטורקת את הדלת.',
      ar: 'ابنتكم تصرخ «أنتم لا تفهمون شيئًا!» وتصفق الباب.',
    }),
    thought: tr({ en: 'I’m losing her.', he: 'היא מתרחקת ממני.', ar: 'إنني أفقدها.' }),
    when: [
      t(-1, { en: 'when you act like a spoiled brat', he: 'כשאת מתנהגת כמו מפונקת', ar: 'عندما تتصرفين كطفلة مدللة' }),
      t(1, { en: 'when the door slams between us', he: 'כשהדלת נטרקת בינינו', ar: 'عندما يُغلق الباب بيننا بقوة' }),
      VAGUE,
    ],
    because: [
      t(-1, { en: 'so don’t come out until you apologize!', he: 'אז אל תצאי עד שתתנצלי!', ar: 'فلا تخرجي حتى تعتذري!' }),
      t(1, { en: 'because I want to understand you — really.', he: 'כי אני רוצה להבין אותך — באמת.', ar: 'لأنني أريد أن أفهمك — حقًا.' }),
    ],
    good: tr({
      en: '(through the door) …Fine. You can come in. Just listen, okay?',
      he: '(מאחורי הדלת) ...טוב. אפשר להיכנס. רק תקשיבו, בסדר?',
      ar: '(من وراء الباب) ...حسنًا. ادخلوا. فقط اسمعوني، اتفقنا؟',
    }),
    bad: tr({ en: 'See? This is exactly what I mean!', he: 'רואים? בדיוק על זה אני מדברת!', ar: 'أرأيتم؟ هذا بالضبط ما أقصده!' }),
  },
];

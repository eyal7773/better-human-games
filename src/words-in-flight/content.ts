import { tr } from '../shared/i18n';
import type { Who } from '../shared/face';
import { parse, type Token } from './logic';

/**
 * The sentences that fly. Notation (see parse()): tokens split by " | ",
 * "!toxic→honest version", "+feeling", anything else neutral. Each language
 * has its own token list, so the grammar can be natural in each; the honest
 * versions are written so the sentence that lands still reads well — the
 * feeling still arrives, it just stops being an attack.
 */

interface Raw {
  /** First level the sentence can appear in. */
  lvl: number;
  who: Who;
  en: string;
  he: string;
  ar: string;
}

const RAW: Raw[] = [
  // ---- 1: always / never
  {
    lvl: 1,
    who: 'teen',
    en: '!You never clean→I’d be glad if you cleaned | your room | !— not once!→— this week.',
    he: '!אתה אף פעם לא מסדר→הייתי שמח אם תסדר | את החדר שלך | !— אף פעם!→— השבוע.',
    ar: '!أنت لا ترتب أبدًا→أتمنى أن ترتب | غرفتك | !— ولا مرة!→— هذا الأسبوع.',
  },
  {
    lvl: 1,
    who: 'child',
    en: '!You ALWAYS leave→I keep tripping over | your shoes | in the hallway | +— please put them away.',
    he: '!אתה תמיד משאיר את הנעליים→אני כל הזמן נתקל בנעליים | במסדרון | +— בבקשה תשים אותן בארון.',
    ar: '!أنت دائمًا تترك حذاءك→أتعثّر دائمًا بحذائك | في الممر | +— أرجوك ضعه في مكانه.',
  },
  {
    lvl: 1,
    who: 'teen',
    en: '!You NEVER listen→I don’t feel heard | when I ask | for help | +— it matters to me.',
    he: '!אתה אף פעם לא מקשיב→אני לא מרגיש שמקשיבים לי | כשאני מבקש | עזרה | +— זה חשוב לי.',
    ar: '!أنت لا تسمعني أبدًا→لا أشعر أنك تسمعني | عندما أطلب | المساعدة | +— هذا مهم لي.',
  },
  {
    lvl: 1,
    who: 'partner',
    en: '!You’re ALWAYS on your phone→Lately there’s a lot of phone between us | !— always!→— and I miss you.',
    he: '!תמיד את/ה בטלפון→לאחרונה יש הרבה טלפון בינינו | !— כל הזמן!→— ואני מתגעגע/ת.',
    ar: '!أنت دائمًا على الهاتف→مؤخرًا الهاتف بيننا كثيرًا | !— دائمًا!→— وأشتاق إليك.',
  },
  {
    lvl: 1,
    who: 'child',
    en: '!You never clear→It would help me if you cleared | the dishes | !— ever!→— tonight.',
    he: '!אתה אף פעם לא מפנה→יעזור לי אם תפנה | את הכלים | !— אף פעם!→— הערב.',
    ar: '!أنت لا ترفع أبدًا→سيساعدني أن ترفع | الصحون | !— أبدًا!→— الليلة.',
  },
  // ---- 2: feelings you must not cut
  {
    lvl: 2,
    who: 'partner',
    en: '+I’m tired | and | !you NEVER help→I could really use help | with dinner.',
    he: '+אני עייף/ה | ו | !את/ה אף פעם לא עוזר/ת→ממש אשמח לעזרה | עם ארוחת הערב.',
    ar: '+أنا متعب | و | !أنت لا تساعد أبدًا→أحتاج حقًا إلى مساعدة | في العشاء.',
  },
  {
    lvl: 2,
    who: 'teen',
    en: '+I feel worried | when | !you’re ALWAYS out late→you come home late | and don’t call.',
    he: '+אני דואג/ת | כש | !אתה תמיד חוזר מאוחר→אתה חוזר מאוחר | ולא מתקשר.',
    ar: '+أنا قلق | عندما | !تتأخر دائمًا→تعود متأخرًا | ولا تتصل.',
  },
  {
    lvl: 2,
    who: 'child',
    en: '+Please | !stop being so annoying→give me five quiet minutes | +— I need it.',
    he: '+בבקשה | !תפסיק להיות כזה מעצבן→תן לי חמש דקות שקט | +— אני צריך/ה את זה.',
    ar: '+من فضلك | !كفّ عن إزعاجي→أعطني خمس دقائق هدوء | +— أحتاج ذلك.',
  },
  {
    lvl: 2,
    who: 'partner',
    en: '+I love you, | !but you NEVER plan anything→and I’d love us to plan | a night out.',
    he: '+אני אוהב/ת אותך, | !אבל את/ה אף פעם לא מתכנן/ת כלום→והייתי שמח/ה שנתכנן | ערב בחוץ.',
    ar: '+أحبك، | !لكنك لا تخطط لأي شيء أبدًا→وأتمنى أن نخطط | لسهرة معًا.',
  },
  {
    lvl: 2,
    who: 'teen',
    en: '+I miss you. | !You’re ALWAYS in your room→We barely see each other | lately.',
    he: '+אני מתגעגע/ת אליך. | !אתה כל הזמן בחדר→אנחנו כמעט לא מתראים | לאחרונה.',
    ar: '+اشتقت إليك. | !أنت دائمًا في غرفتك→بالكاد نرى بعضنا | مؤخرًا.',
  },
  // ---- 3: labels and insults
  {
    lvl: 3,
    who: 'child',
    en: '!You’re so lazy!→I’m exhausted | — the toys | are still | on the floor.',
    he: '!אתה כזה עצלן!→אני גמור/ה מעייפות | — הצעצועים | עדיין | על הרצפה.',
    ar: '!أنت كسول جدًا!→أنا منهك | — الألعاب | ما زالت | على الأرض.',
  },
  {
    lvl: 3,
    who: 'teen',
    en: '!What are you, a baby?→I can see it’s hard. | Let’s | try again | +together.',
    he: '!מה אתה, תינוק?→אני רואה שזה קשה. | בוא | ננסה שוב | +ביחד.',
    ar: '!ماذا، هل أنت طفل؟→أرى أن الأمر صعب. | هيا | نحاول مجددًا | +معًا.',
  },
  {
    lvl: 3,
    who: 'partner',
    en: '!That’s ridiculous!→I see it differently. | +I feel hurt | when | !you mock me→my ideas get laughed at.',
    he: '!זה מגוחך!→אני רואה את זה אחרת. | +אני מרגיש/ה פגוע/ה | כש | !את/ה לועג/ת לי→צוחקים על הרעיונות שלי.',
    ar: '!هذا سخيف!→أرى الأمر بشكل مختلف. | +أشعر بالأذى | عندما | !تسخر مني→يُضحك على أفكاري.',
  },
  {
    lvl: 3,
    who: 'child',
    en: '!You’re impossible!→I’m at the end of my rope. | Screens | off | +— please.',
    he: '!אתה בלתי אפשרי!→נגמר לי הכוח. | מסכים | כבים | +— בבקשה.',
    ar: '!أنت مستحيل!→نفد صبري. | الشاشات | تُطفأ | +— من فضلك.',
  },
  {
    lvl: 3,
    who: 'teen',
    en: '!Stop being so selfish→I need a hand | with the groceries | +— thank you!',
    he: '!תפסיק להיות כזה אנוכי→אני צריך/ה עזרה | עם הקניות | +— תודה!',
    ar: '!كفّ عن الأنانية→أحتاج مساعدة | في المشتريات | +— شكرًا!',
  },
  // ---- 4: "thank you" is not "you always"
  {
    lvl: 4,
    who: 'child',
    en: '+Thank you | for trying, | !but you ALWAYS spill→and next time let’s use | the small cup.',
    he: '+תודה | שניסית, | !אבל אתה תמיד שופך→ובפעם הבאה ניקח | את הכוס הקטנה.',
    ar: '+شكرًا لك | لأنك حاولت، | !لكنك دائمًا تسكب→والمرة القادمة لنأخذ | الكوب الصغير.',
  },
  {
    lvl: 4,
    who: 'partner',
    en: '+You matter to me, | !and you NEVER notice→and I need you to notice | when I’m | overwhelmed.',
    he: '+אכפת לי ממך, | !ואת/ה אף פעם לא שם/ה לב→ואני צריך/ה שתשים/י לב | כשאני | מוצף/ת.',
    ar: '+أنت تهمّني، | !وأنت لا تلاحظ أبدًا→وأحتاج أن تلاحظ | عندما أكون | مرهقًا.',
  },
  {
    lvl: 4,
    who: 'teenGirl',
    en: '+Thank you for telling me. | !You ALWAYS hide things→I’d rather hear things | from you | +first.',
    he: '+תודה שסיפרת לי. | !את תמיד מסתירה ממני→הייתי מעדיף/ה לשמוע | ממך | +קודם.',
    ar: '+شكرًا لأنك أخبرتني. | !أنتِ دائمًا تخفين الأشياء→أفضّل أن أسمع | منكِ | +أولًا.',
  },
  {
    lvl: 4,
    who: 'teen',
    en: '!You never→It’s rare that you | say | +thank you, | !you ungrateful kid→and I’d love to hear it.',
    he: '!אף פעם אתה לא→רק לעתים רחוקות אתה | אומר | +תודה, | !ילד כפוי טובה→והייתי שמח/ה לשמוע.',
    ar: '!أنت لا تقول أبدًا→نادرًا ما تقول | +شكرًا، | !يا ناكر الجميل→وأحب أن أسمعها.',
  },
  // ---- 5: the big argument
  {
    lvl: 5,
    who: 'partner',
    en: '!You ALWAYS do this!→This keeps happening, | +and I feel alone | with the bills. | !You NEVER care→I need us to sit down | together | +— tonight?',
    he: '!את/ה תמיד עושה את זה!→זה קורה שוב ושוב, | +ואני מרגיש/ה לבד | עם החשבונות. | !לא אכפת לך בכלל→אני צריך/ה שנשב | ביחד | +— הערב?',
    ar: '!أنت دائمًا تفعل هذا!→هذا يتكرر، | +وأشعر بالوحدة | مع الفواتير. | !أنت لا تهتم أبدًا→أحتاج أن نجلس | معًا | +— الليلة؟',
  },
  {
    lvl: 5,
    who: 'teen',
    en: '!You’re grounded forever!→I get scared | when you | don’t answer | your phone. | !You NEVER think→Next time, | a text | +is enough.',
    he: '!אתה מרותק לנצח!→אני נבהל/ת | כשאתה | לא עונה | לטלפון. | !אתה אף פעם לא חושב→בפעם הבאה, | הודעה | +מספיקה.',
    ar: '!أنت معاقب إلى الأبد!→أخاف | عندما | لا تردّ | على هاتفك. | !أنت لا تفكر أبدًا→في المرة القادمة، | رسالة | +تكفي.',
  },
  {
    lvl: 5,
    who: 'grandma',
    en: '!You ALWAYS criticize me!→It stings | when | my cooking | gets comments. | +I love you | !but stop it→and I’d love a compliment | +sometimes.',
    he: '!את תמיד מבקרת אותי!→זה צורב | כש | על הבישול שלי | יש הערות. | +אני אוהב/ת אותך | !אבל די כבר→והייתי שמח/ה למחמאה | +לפעמים.',
    ar: '!أنتِ دائمًا تنتقدينني!→يؤلمني | عندما | طبخي | يُنتقد. | +أحبك | !لكن كفى→وأحب مديحًا | +أحيانًا.',
  },
];

export interface Sentence {
  lvl: number;
  who: Who;
  tokens: Token[];
}

export const SENTENCES: Sentence[] = RAW.map((r) => ({ lvl: r.lvl, who: r.who, tokens: parse(tr(r)) }));

/** Every language's version, for tests. */
export const RAW_SENTENCES = RAW;

export const LEVEL_NAMES = [
  tr({ en: 'A calm evening', he: 'ערב רגוע', ar: 'مساء هادئ' }),
  tr({ en: 'Dishes in the sink', he: 'כלים בכיור', ar: 'صحون في المغسلة' }),
  tr({ en: 'Screen time', he: 'מסכים', ar: 'وقت الشاشات' }),
  tr({ en: 'The school run', he: 'בדרך לבית הספר', ar: 'في الطريق إلى المدرسة' }),
  tr({ en: 'The big argument', he: 'ויכוח גדול', ar: 'الجدال الكبير' }),
];

/** Replies from the listener after each sentence, by how it landed. */
export const REPLY = {
  honest: tr({
    en: ['…Okay. I hear you.', 'Oh. I didn’t know.', 'Fair enough.', 'Okay, I’ll help.', 'Thanks for telling me.'],
    he: ['...אוקיי. שומע/ת אותך.', 'אה. לא ידעתי.', 'הוגן.', 'אוקיי, אני אעזור.', 'תודה שאמרת לי.'],
    ar: ['...حسنًا. أسمعك.', 'آه. لم أكن أعرف.', 'معك حق.', 'حسنًا، سأساعد.', 'شكرًا لأنك أخبرتني.'],
  }),
  hurt: tr({
    en: ['Ouch.', 'Why are you yelling?', 'Fine. Whatever.', 'That’s not fair!'],
    he: ['אאוץ׳.', 'למה את/ה צועק/ת?', 'טוב. לא משנה.', 'זה לא פייר!'],
    ar: ['آخ.', 'لماذا تصرخ؟', 'طيب. لا يهم.', 'هذا ليس عدلًا!'],
  }),
  muddled: tr({
    en: ['Wait, what did you mean?', 'Huh?', 'I lost you there.'],
    he: ['רגע, מה התכוונת?', 'הא?', 'איבדתי אותך.'],
    ar: ['لحظة، ماذا قصدت؟', 'هاه؟', 'لم أفهمك.'],
  }),
};

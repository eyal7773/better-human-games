import { tr } from '../shared/i18n';
import type { Who } from '../shared/face';
import { agree } from '../shared/profile';
import type { Meta, Other } from '../shared/library';
import { parse, type Token } from './logic';
import { RAW } from './sentences';

/**
 * The sentences that fly. Notation (see parse()): tokens split by " | ",
 * "!toxic→honest version", "+feeling", anything else neutral. Each language
 * has its own token list, so the grammar can be natural in each; the honest
 * versions are written so the sentence that lands still reads well — the
 * feeling still arrives, it just stops being an attack.
 */

/** A sentence as written: who it's said to, and its words in each language. */
export interface Raw extends Meta {
  /** The listener's face. */
  face: Who;
  en: string;
  he: string;
  ar: string;
}

/** A sentence ready to fly: in the player's language, agreeing with the player's gender. */
export interface Sentence extends Meta {
  face: Who;
  tokens: Token[];
}

export const SENTENCES: Sentence[] = RAW.map(({ en, he, ar, ...meta }) => ({ ...meta, tokens: parse(agree(tr({ en, he, ar }))) }));

/** Every language's version, for tests. */
export const RAW_SENTENCES = RAW;

export const LEVEL_NAMES = [
  tr({ en: 'A calm evening', he: 'ערב רגוע', ar: 'مساء هادئ' }),
  agree(tr({ en: 'What I really feel', he: 'מה אני באמת {מרגיש|מרגישה}', ar: 'ما أشعر به حقًّا' })),
  tr({ en: 'Labels', he: 'תוויות', ar: 'ألقاب' }),
  tr({ en: 'Words that only look scary', he: 'מילים שרק נראות מפחידות', ar: 'كلمات تبدو مخيفة فقط' }),
  tr({ en: 'Thank you, not “always”', he: 'תודה, לא "תמיד"', ar: 'شكرًا، لا «دائمًا»' }),
  tr({ en: 'Two at once', he: 'שתיים ביחד', ar: 'اثنتان معًا' }),
  tr({ en: 'Sweet with a sting', he: 'מתוק עם עוקץ', ar: 'حلو مع لسعة' }),
  tr({ en: 'A long day', he: 'יום ארוך', ar: 'يوم طويل' }),
  tr({ en: 'No pause', he: 'בלי הפסקה', ar: 'بلا توقف' }),
  tr({ en: 'The big argument', he: 'הוויכוח הגדול', ar: 'الجدال الكبير' }),
];

/** Replies from the listener after each sentence, by how it landed. */
/** One icon per level, for the "next level" button. */
export const LEVEL_ICONS = ['🌙', '🌱', '🏷️', '👻', '🙏', '✌️', '🍬', '🌅', '⏩', '⛈️'];

/** How the listener answers depends on who they are: a kid, someone close, or someone outside the home. */
export type ReplyGroup = 'kid' | 'close' | 'formal';
export const replyGroup = (with_: readonly Other[]): ReplyGroup => {
  const o = with_[0];
  if (o === 'young-child' || o === 'child' || o === 'teen' || o === 'teen-girl' || o === 'kids' || o === 'grandchild') return 'kid';
  if (o === 'boss' || o === 'coworker' || o === 'neighbor' || o === 'stranger') return 'formal';
  return 'close';
};

type Replies = Record<ReplyGroup, Record<'honest' | 'hurt' | 'muddled', string[]>>;
const REPLY_TEXT: Replies = {
  kid: {
    honest: tr({
      en: ['…Okay.', 'Oh. Okay, I’ll do it.', 'Sorry.', 'Fine, I get it.', 'Can you help me?'],
      he: ['...אוקיי.', 'אה. טוב, אני אעשה.', 'סליחה.', 'בסדר, הבנתי.', '{תעזור|תעזרי} לי?'],
      ar: ['...حسنًا.', 'آه. حسنًا، سأفعل.', 'آسف.', 'طيب، فهمت.', 'هل تساعدني؟'],
    }),
    hurt: tr({
      en: ['You’re mean!', 'Why are you yelling?', 'I hate this!', 'That’s not fair!'],
      he: ['{אתה רע|את רעה}!', 'למה {אתה צועק|את צועקת}?', 'אני שונא את זה!', 'זה לא פייר!'],
      ar: ['أنت شرير!', 'لماذا تصرخ؟', 'أكره هذا!', 'هذا ليس عدلًا!'],
    }),
    muddled: tr({ en: ['Huh?', 'What did I do?', 'I don’t get it.'], he: ['מה?', 'מה עשיתי?', 'לא הבנתי.'], ar: ['هاه؟', 'ماذا فعلت؟', 'لم أفهم.'] }),
  },
  close: {
    honest: tr({
      en: ['…Okay. I hear you.', 'Oh. I didn’t know.', 'Fair enough.', 'Okay, I’ll help.', 'Thanks for telling me.'],
      he: ['...אוקיי. שומע/ת אותך.', 'אה. לא ידעתי.', 'הוגן.', 'אוקיי, אני אעזור.', 'תודה שאמרת לי.'],
      ar: ['...حسنًا. أسمعك.', 'آه. لم أكن أعرف.', 'معك حق.', 'حسنًا، سأساعد.', 'شكرًا لأنك أخبرتني.'],
    }),
    hurt: tr({
      en: ['Ouch.', 'Why are you yelling?', 'Fine. Whatever.', 'That’s not fair!'],
      he: ['אאוץ׳.', 'למה {אתה צועק|את צועקת}?', 'טוב. לא משנה.', 'זה לא פייר!'],
      ar: ['آخ.', 'لماذا تصرخ؟', 'طيب. لا يهم.', 'هذا ليس عدلًا!'],
    }),
    muddled: tr({
      en: ['Wait, what did you mean?', 'Huh?', 'I lost you there.'],
      he: ['רגע, מה התכוונת?', 'הא?', 'איבדתי אותך.'],
      ar: ['لحظة، ماذا قصدت؟', 'هاه؟', 'لم أفهمك.'],
    }),
  },
  formal: {
    honest: tr({
      en: ['Understood. Let’s fix it.', 'Fair point.', 'I didn’t realize. Sorry.', 'Okay — thanks for saying it.', 'Let’s find a way.'],
      he: ['מובן. {בוא|בואי} נסדר את זה.', 'נקודה הוגנת.', 'לא שמתי לב. סליחה.', 'אוקיי, תודה {שאמרת|שאמרת}.', '{בוא|בואי} נמצא דרך.'],
      ar: ['مفهوم. لنُصلح ذلك.', 'نقطة عادلة.', 'لم أنتبه. آسف.', 'حسنًا — شكرًا لأنك قلت.', 'لنجد طريقة.'],
    }),
    hurt: tr({
      en: ['Excuse me?!', 'Don’t talk to me like that.', 'Wow. Okay.', 'There’s no need to shout.'],
      he: ['סליחה?!', 'אל {תדבר|תדברי} אליי ככה.', 'וואו. אוקיי.', 'אין צורך לצעוק.'],
      ar: ['عفوًا؟!', 'لا تكلّمني هكذا.', 'واو. حسنًا.', 'لا داعي للصراخ.'],
    }),
    muddled: tr({
      en: ['Sorry, what exactly do you need?', 'I’m not sure I follow.', 'Can you say that again?'],
      he: ['סליחה, מה בדיוק {אתה צריך|את צריכה}?', 'לא בטוח שהבנתי.', 'אפשר שוב?'],
      ar: ['عفوًا، ماذا تحتاج بالضبط؟', 'لست متأكدًا أنني فهمت.', 'هل تعيد ذلك؟'],
    }),
  },
};

/** The listener's replies, speaking to the player in the player's own form. */
export const REPLY = Object.fromEntries(
  Object.entries(REPLY_TEXT).map(([g, r]) => [g, Object.fromEntries(Object.entries(r).map(([k, list]) => [k, list.map((t) => agree(t))]))]),
) as Replies;

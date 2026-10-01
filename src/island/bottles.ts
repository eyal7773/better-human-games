import { ANCHOR } from '../shared/anchors';
import { tr } from '../shared/i18n';
import { heSelf } from '../shared/profile';

/**
 * Bottles washed up on the beaches: a few a day, never more than three
 * waiting, and nothing lost if you skip days. Each holds a short letter — an
 * anchor sentence or a tip from one of the games — and 5 zen.
 */

export interface Bottle {
  id: string;
  isle: string;
  note: number;
}

export interface Beach {
  /** The last day bottles washed up. */
  day: string;
  pending: Bottle[];
  /** Letters read, by note index, in the order found. */
  letters: number[];
}

export const MAX_BOTTLES = 3;
export const BOTTLE_ZEN = 5;

export const NOTES: string[] = [
  ANCHOR.underneath,
  ANCHOR.sentence,
  ANCHOR.taken,
  ANCHOR.threat,
  ANCHOR.boundary,
  tr({ en: 'Anger is a signal, not a crime. It tells you something matters.', he: 'כעס הוא אות, לא חטא. הוא אומר לכם שמשהו חשוב.', ar: 'الغضب إشارة لا جريمة. يخبركم أن شيئًا ما مهم.' }),
  tr({ en: 'Notice the heat while it’s still small. 40° is easier than 90°.', he: 'שימו לב לחום כשהוא עוד קטן. קל יותר לעצור ב־40° מאשר ב־90°.', ar: 'لاحظوا الحرارة وهي ما زالت صغيرة. التوقّف عند 40° أسهل من 90°.' }),
  tr({ en: 'One long breath out is already a pause.', he: 'נשיפה ארוכה אחת היא כבר עצירה.', ar: 'زفير طويل واحد هو توقّف بحدّ ذاته.' }),
  tr({ en: '“Always” and “never” are rarely true — and always hurt.', he: '"תמיד" ו"אף פעם" כמעט אף פעם לא נכונים — ותמיד פוגעים.', ar: '«دائمًا» و«أبدًا» نادرًا ما تكونان صحيحتين — وتؤلمان دائمًا.' }),
  tr({ en: 'Under “you’re so lazy” there’s often “I’m so tired”.', he: `מתחת ל"אתה עצלן" מסתתר הרבה פעמים "אני ${heSelf('גמור', 'גמורה')} מעייפות".`, ar: 'تحت «أنت كسول» غالبًا ما يختبئ «أنا منهك».' }),
  tr({ en: 'Move the light: most shadows are much smaller than they look.', he: 'הזיזו את האור: רוב הצללים קטנים בהרבה ממה שהם נראים.', ar: 'حرّكوا الضوء: معظم الظلال أصغر بكثير مما تبدو.' }),
  tr({ en: 'Most bubbles pop on the wall by themselves. Save your shield for real threats.', he: 'רוב הבועות מתפוצצות על החומה לבד. שמרו את המגן לאיומים אמיתיים.', ar: 'معظم الفقاعات تنفجر على السور وحدها. احفظوا الدرع للتهديدات الحقيقية.' }),
  tr({ en: 'Chasing harder makes Pesky stronger. Breathing makes him clumsy.', he: 'ככל שרודפים חזק יותר, ציקי מתחזק. נשימה הופכת אותו למגושם.', ar: 'كلما طاردتم بقوة أكبر صار زِنّو أقوى. التنفّس يجعله أخرق.' }),
  tr({ en: 'A calm “no” is still a no. You don’t need to shout for it to count.', he: '"לא" רגוע הוא עדיין "לא". לא צריך לצעוק כדי שזה ייחשב.', ar: '«لا» الهادئة تبقى «لا». لا داعي للصراخ لكي تُحتسب.' }),
  tr({ en: 'It’s fine to say: “I need five minutes, then let’s talk.”', he: `מותר לומר: "אני ${heSelf('צריך', 'צריכה')} חמש דקות, ואז נדבר."`, ar: 'لا بأس أن تقولوا: «أحتاج خمس دقائق، ثم نتحدّث.»' }),
  tr({ en: 'Boiling over happens. What matters is noticing earlier next time.', he: 'רתיחה קורה. מה שחשוב הוא לשים לב מוקדם יותר בפעם הבאה.', ar: 'الغليان يحدث. المهمّ أن تلاحظوا أبكر في المرة القادمة.' }),
  tr({ en: 'Name it to tame it: “I’m angry” already turns the heat down a little.', he: `לתת שם לרגש מרגיע אותו: "אני ${heSelf('כועס', 'כועסת')}" כבר מוריד קצת את החום.`, ar: 'سمّوه لتروّضوه: «أنا غاضب» تخفّف الحرارة قليلًا.' }),
  tr({ en: 'Sorry after a blow-up is a skill too. It repairs the wall.', he: 'גם "סליחה" אחרי פיצוץ היא מיומנות. היא מתקנת את החומה.', ar: 'الاعتذار بعد الانفجار مهارة أيضًا. إنه يرمّم السور.' }),
];

/** A small deterministic hash of a string. */
export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Washes today's bottles up (once a day): one to three, never more than
 * three waiting in all, on open islands, preferring letters not read yet.
 */
export function washUp(b: Beach, today: string, open: string[]) {
  if (b.day === today || !open.length) return b;
  b.day = today;
  const count = Math.min(MAX_BOTTLES - b.pending.length, 1 + Math.floor(hashStr(today) * 3));
  for (let k = 0; k < count; k++) {
    const isle = open[Math.floor(hashStr(`${today}:${k}:isle`) * open.length)];
    const taken = new Set([...b.letters, ...b.pending.map((p) => p.note)]);
    const unread = NOTES.map((_, i) => i).filter((i) => !taken.has(i));
    const pool = unread.length ? unread : NOTES.map((_, i) => i);
    const note = pool[Math.floor(hashStr(`${today}:${k}:note`) * pool.length)];
    b.pending.push({ id: `${today}:${k}`, isle, note });
  }
  return b;
}

/** Opens a bottle: it leaves the beach and its letter joins the collection. */
export function openBottle(b: Beach, id: string) {
  const i = b.pending.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const [bottle] = b.pending.splice(i, 1);
  if (!b.letters.includes(bottle.note)) b.letters.push(bottle.note);
  return bottle;
}

export function sanitizeBeach(raw: unknown): Beach {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const ok = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < NOTES.length;
  const pending = (Array.isArray(r.pending) ? r.pending : [])
    .filter((p): p is Bottle => !!p && typeof p === 'object' && typeof (p as Bottle).id === 'string' && typeof (p as Bottle).isle === 'string' && ok((p as Bottle).note))
    .slice(0, MAX_BOTTLES)
    .map((p) => ({ id: p.id, isle: p.isle, note: p.note }));
  return {
    day: typeof r.day === 'string' ? r.day : '',
    pending,
    letters: Array.isArray(r.letters) ? [...new Set(r.letters.filter(ok))] : [],
  };
}

// ---------------------------------------------------------------- weather

export type Weather = 'clear' | 'rain' | 'mist' | 'leaves';

/** Today's weather on an island: mostly clear, never a storm. Same all day. */
export function weatherOf(day: string, isle: string, hour: number): Weather {
  const r = hashStr(`${day}:${isle}:weather`);
  if (isle === 'forest' && r < 0.45) return 'leaves';
  if (r > 0.86) return 'rain';
  if (r > 0.7 && hour < 10) return 'mist';
  return 'clear';
}

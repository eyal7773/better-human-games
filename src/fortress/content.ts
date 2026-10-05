import { tr } from '../shared/i18n';
import type { Pillar } from './logic';
import { agree } from '../shared/profile';
import type { Meta, Other } from '../shared/library';
import type { HouseholdTag, TopicTag } from '../shared/tags';

type L = { en: string; he: string; ar: string };

export interface BubbleItem extends Meta {
  emoji: string;
  label: string;
  /** What it really takes from you. */
  takes: string;
}

export interface ThreatItem extends Meta {
  emoji: string;
  label: string;
  pillar: Pillar;
  /** The calm boundary that meets it. */
  boundary: string;
}

/** Who it happens with and what it's about, in the content library's terms (diff is unused here: speed is the difficulty). */
type M = { with: Other[]; topics: TopicTag[]; requires?: HouseholdTag[]; heavy?: boolean };
const meta = (id: string, m: M): Meta => ({ id, setting: 'home', diff: 1, ...m });

const B = (id: string, emoji: string, m: M, label: L, takes: L): BubbleItem => ({ ...meta(id, m), emoji, label: agree(tr(label)), takes: agree(tr(takes)) });
const X = (id: string, emoji: string, pillar: Pillar, m: M, label: L, boundary: L): ThreatItem => ({
  ...meta(id, m),
  emoji,
  pillar,
  label: agree(tr(label)),
  boundary: agree(tr(boundary)),
});

const KIDS: HouseholdTag[] = ['parent-young-child', 'parent-school-age', 'parent-teen', 'single-parent'];
const anyone = (...topics: TopicTag[]): M => ({ with: ['none'], topics });
const said = (o: Other, ...topics: TopicTag[]): M => ({ with: [o], topics });

export const BUBBLES: BubbleItem[] = [
  B('traffic', '🚗', anyone('road'), { en: 'Traffic jam', he: 'פקק', ar: 'زحمة سير' }, { en: '15 minutes', he: 'רבע שעה', ar: 'ربع ساعة' }),
  B('milk', '🥛', anyone('mess'), { en: 'Spilled milk', he: 'חלב נשפך', ar: 'حليب مسكوب' }, { en: 'a cloth and 2 minutes', he: 'סמרטוט ושתי דקות', ar: 'قطعة قماش ودقيقتان' }),
  B('honk', '📢', said('stranger', 'road'), { en: 'A driver honked', he: 'נהג צפר', ar: 'سائق زمّر' }, { en: 'one second of noise', he: 'שנייה של רעש', ar: 'ثانية ضجيج' }),
  B('schoolbag', '🎒', { with: ['child', 'teen'], topics: ['morning-rush'] }, { en: 'Forgot the school bag', he: 'שכחו את התיק', ar: 'نسوا الحقيبة' }, { en: 'a trip back', he: 'נסיעה חזרה', ar: 'مشوار رجوع' }),
  B('remote', '📺', anyone('household'), { en: 'Where’s the remote?', he: 'איפה השלט?', ar: 'أين جهاز التحكم؟' }, { en: '5 minutes of searching', he: '5 דקות חיפוש', ar: '5 دقائق بحث' }),
  B('socks', '🧦', anyone('mess'), { en: 'Socks on the floor', he: 'גרביים על הרצפה', ar: 'جوارب على الأرض' }, { en: '10 seconds', he: '10 שניות', ar: '10 ثوانٍ' }),
  B('email', '📧', said('coworker', 'work'), { en: 'An annoying email', he: 'מייל מעצבן', ar: 'بريد مزعج' }, { en: 'a reply tomorrow', he: 'תשובה מחר', ar: 'ردّ غدًا' }),
  B('rain', '🌧️', anyone('public'), { en: 'It’s raining', he: 'יורד גשם', ar: 'إنها تمطر' }, { en: 'a wet coat', he: 'מעיל רטוב', ar: 'معطف مبلل' }),
  B('battery', '🔋', anyone('household'), { en: 'Phone at 5%', he: 'טלפון על 5%', ar: 'الهاتف على 5%' }, { en: 'a charger', he: 'מטען', ar: 'شاحن' }),
  B('pasta', '🍝', anyone('household'), { en: 'Burnt pasta', he: 'פסטה שנשרפה', ar: 'معكرونة محروقة' }, { en: 'another pot', he: 'עוד סיר', ar: 'قدر آخر' }),
  B('dog', '🐶', said('neighbor', 'neighbors', 'noise'), { en: 'The dog won’t stop barking', he: 'הכלב לא מפסיק לנבוח', ar: 'الكلب لا يتوقف عن النباح' }, { en: 'a moment of quiet', he: 'רגע של שקט', ar: 'لحظة هدوء' }),
  B('line', '⏳', said('stranger', 'public'), { en: 'A long line', he: 'תור ארוך', ar: 'طابور طويل' }, { en: '10 minutes', he: '10 דקות', ar: '10 دقائق' }),
  B('eyeroll', '🙄', said('family', 'respect'), { en: 'An eye-roll', he: 'גלגול עיניים', ar: 'تدوير عينين' }, { en: 'a little pride', he: 'קצת גאווה', ar: 'قليل من الكبرياء' }),
  B('crumbs', '🍪', anyone('mess'), { en: 'Crumbs on the sofa', he: 'פירורים על הספה', ar: 'فتات على الكنبة' }, { en: 'a quick wipe', he: 'ניגוב מהיר', ar: 'مسحة سريعة' }),
  // ---- for everyone
  B('wrongorder', '☕', said('stranger', 'public'), { en: 'Wrong coffee order', he: 'קפה לא נכון', ar: 'قهوة خاطئة' }, { en: 'one sip of the wrong taste', he: 'לגימה בטעם לא נכון', ar: 'رشفة بطعم خاطئ' }),
  B('wifi', '📶', anyone('household'), { en: 'The Wi-Fi is down', he: 'האינטרנט נפל', ar: 'الإنترنت مقطوع' }, { en: 'twenty offline minutes', he: 'עשרים דקות בלי רשת', ar: 'عشرون دقيقة بلا شبكة' }),
  B('meetingmoved', '📅', said('coworker', 'work'), { en: 'The meeting moved again', he: 'הפגישה זזה שוב', ar: 'الاجتماع تأجّل مرة أخرى' }, { en: 'a new slot in the calendar', he: 'משבצת חדשה ביומן', ar: 'موعد جديد في التقويم' }),
  B('spam', '📞', said('stranger', 'public'), { en: 'A spam call', he: 'שיחת ספאם', ar: 'مكالمة مزعجة' }, { en: 'ten seconds and a block', he: 'עשר שניות וחסימה', ar: 'عشر ثوانٍ وحظر' }),
  B('bus', '🚌', said('stranger', 'road'), { en: 'The bus didn’t stop', he: 'האוטובוס לא עצר', ar: 'الحافلة لم تتوقف' }, { en: 'the next bus', he: 'האוטובוס הבא', ar: 'الحافلة التالية' }),
  B('coffeeshirt', '👕', anyone('mess'), { en: 'Coffee on your shirt', he: 'קפה על החולצה', ar: 'قهوة على القميص' }, { en: 'a wash', he: 'כביסה', ar: 'غسلة' }),
  B('printer', '🖨️', anyone('work'), { en: 'The printer jammed', he: 'המדפסת נתקעה', ar: 'الطابعة علقت' }, { en: 'a minute and some patience', he: 'דקה וקצת סבלנות', ar: 'دقيقة وبعض الصبر' }),
  B('k', '💬', said('friend', 'connection'), { en: 'A friend replied “k”', he: 'חבר ענה "אוקי" יבש', ar: 'صديق ردّ «ك» فقط' }, { en: 'probably nothing', he: 'כנראה כלום', ar: 'على الأرجح لا شيء' }),
  B('train', '🚆', anyone('road'), { en: 'Missed the train', he: 'פספסתם את הרכבת', ar: 'فاتكم القطار' }, { en: 'twenty minutes', he: 'עשרים דקות', ar: 'عشرون دقيقة' }),
  B('toe', '🦶', anyone('household'), { en: 'Stubbed your toe', he: 'נתקעתם עם הבוהן', ar: 'اصطدم إصبع قدمكم' }, { en: 'one loud “ow”', he: '"איי" אחד חזק', ar: '«آخ» واحدة عالية' }),
  B('groupchat', '📱', said('friend', 'connection'), { en: '99 messages in the group', he: '99 הודעות בקבוצה', ar: '99 رسالة في المجموعة' }, { en: 'nothing — mute it', he: 'כלום, משתיקים', ar: 'لا شيء — كتم الصوت' }),
  B('elevator', '🛗', said('neighbor', 'neighbors'), { en: 'The elevator is broken', he: 'המעלית מקולקלת', ar: 'المصعد معطّل' }, { en: 'four flights of stairs', he: 'ארבע קומות ברגל', ar: 'أربعة طوابق مشيًا' }),
  B('loudcall', '🗣️', said('coworker', 'work', 'noise'), { en: 'A coworker’s loud call', he: 'שיחה רועשת של עמית', ar: 'مكالمة زميل صاخبة' }, { en: 'headphones', he: 'אוזניות', ar: 'سماعات' }),
  B('typo', '⌨️', anyone('work'), { en: 'A typo — already sent', he: 'שגיאת כתיב, כבר נשלחה', ar: 'خطأ إملائي — أُرسل' }, { en: 'a smile, maybe', he: 'חיוך, אולי', ar: 'ابتسامة ربما' }),
  B('parkingspot', '🅿️', said('stranger', 'road'), { en: 'Someone took your spot', he: 'מישהו לקח לכם את החניה', ar: 'أحدهم أخذ موقفكم' }, { en: 'one more round', he: 'עוד סיבוב', ar: 'جولة أخرى' }),
  // ---- particular homes
  B('toys', '🧸', { with: ['young-child', 'child'], topics: ['mess'] }, { en: 'Toys on the stairs', he: 'צעצועים על המדרגות', ar: 'ألعاب على الدرج' }, { en: 'a box and a minute', he: 'ארגז ודקה', ar: 'صندوق ودقيقة' }),
  B('babyup', '👶', { with: ['young-child'], topics: ['bedtime'] }, { en: 'The baby woke up', he: 'התינוק התעורר', ar: 'الرضيع استيقظ' }, { en: 'twenty minutes of rocking', he: 'עשרים דקות של נדנוד', ar: 'عشرون دقيقة من الهزّ' }),
  B('lunchbox', '🥪', { with: ['child'], topics: ['mealtime'] }, { en: 'Lunchbox came back full', he: 'הקופסה חזרה מלאה', ar: 'علبة الغداء عادت ممتلئة' }, { en: 'one sandwich', he: 'כריך אחד', ar: 'شطيرة واحدة' }),
  B('doorslam', '🚪', { with: ['teen'], topics: ['respect'] }, { en: 'A teenage door slam', he: 'טריקת דלת של מתבגר', ar: 'صفقة باب مراهق' }, { en: 'a little quiet — for now', he: 'קצת שקט, לבינתיים', ar: 'قليل من الهدوء — مؤقتًا' }),
  B('partnermilk', '🛒', { with: ['partner'], topics: ['household'] }, { en: 'Partner forgot the milk', he: 'בן הזוג שכח חלב', ar: 'الشريك نسي الحليب' }, { en: 'black coffee tomorrow', he: 'קפה שחור מחר', ar: 'قهوة سوداء غدًا' }),
  B('towel', '🛏️', { with: ['partner'], topics: ['mess'] }, { en: 'Wet towel on the bed', he: 'מגבת רטובה על המיטה', ar: 'منشفة مبللة على السرير' }, { en: 'a dry pillow', he: 'כרית יבשה', ar: 'وسادة جافة' }),
  B('rmdishes', '🍽️', { with: ['roommate'], topics: ['chores'] }, { en: 'Roommate’s dishes', he: 'הכלים של השותף', ar: 'صحون شريك السكن' }, { en: 'room in the sink', he: 'מקום בכיור', ar: 'مكان في المغسلة' }),
  B('rmshower', '🚿', { with: ['roommate'], topics: ['household'] }, { en: 'Roommate’s guest in the shower', he: 'האורח של השותפה במקלחת', ar: 'ضيف شريكة السكن في الحمّام' }, { en: 'ten minutes', he: 'עשר דקות', ar: 'عشر دقائق' }),
  B('momcalls', '☎️', { with: ['ageing-parent'], topics: ['caregiving'] }, { en: 'Mom calls for the fourth time', he: 'אמא מתקשרת בפעם הרביעית', ar: 'أمي تتصل للمرة الرابعة' }, { en: 'two minutes — and a smile for her', he: 'שתי דקות, וחיוך בשבילה', ar: 'دقيقتان — وابتسامة لها' }),
  B('stickywindow', '🖐️', { with: ['grandchild'], topics: ['mess'] }, { en: 'Little hands on the window', he: 'ידיים קטנות על החלון', ar: 'أيادٍ صغيرة على النافذة' }, { en: 'a wipe — and a memory', he: 'ניגוב, וזיכרון', ar: 'مسحة — وذكرى' }),
];

export const THREATS: ThreatItem[] = [
  X('bossmock', '🧑‍💼', 'worth', said('boss', 'work', 'respect'), { en: 'The boss mocks you in front of everyone', he: 'הבוס לועג לכם מול כולם', ar: 'المدير يسخر منكم أمام الجميع' }, {
    en: '“Please don’t speak to me like that.”',
    he: '"בבקשה אל תדבר אליי ככה."',
    ar: '«من فضلك لا تكلّمني بهذه الطريقة.»',
  }),
  X('shove', '🚸', 'family', { with: ['kids'], topics: ['public'], requires: KIDS }, { en: 'Someone shoves your kid', he: 'מישהו דוחף את הילד שלכם', ar: 'أحدهم يدفع طفلكم' }, {
    en: '“Stop. Don’t touch my child.”',
    he: '"די. אל תיגע בילד שלי."',
    ar: '«توقّف. لا تلمس طفلي.»',
  }),
  X('latecalls', '📵', 'health', said('boss', 'work', 'work-life'), { en: 'Work calls at 11 p.m., every night', he: 'מהעבודה מתקשרים ב-23:00, כל לילה', ar: 'العمل يتصل في الحادية عشرة ليلًا، كل ليلة' }, {
    en: '“I answer between 8 and 6.”',
    he: '"אני {עונה|עונה} בין 8 ל-6."',
    ar: '«أردّ بين الثامنة والسادسة.»',
  }),
  X('walkin', '🚪', 'home', said('family', 'in-laws'), { en: 'A relative walks in without asking', he: 'קרוב משפחה נכנס בלי לשאול', ar: 'قريب يدخل دون استئذان' }, {
    en: '“Please call before you come over.”',
    he: '"בבקשה תתקשרו לפני שאתם באים."',
    ar: '«من فضلكم اتصلوا قبل أن تأتوا.»',
  }),
  X('stupid', '🗯️', 'worth', { with: ['family', 'friend', 'coworker'], topics: ['respect'] }, { en: 'Being called stupid', he: 'קוראים לכם טיפשים', ar: 'يُقال عنكم أغبياء' }, {
    en: '“I’m not okay with being spoken to like that.”',
    he: '"אני לא {מסכים|מסכימה} שידברו אליי ככה."',
    ar: '«لا أقبل أن يُتحدّث إليّ هكذا.»',
  }),
  X('lend', '💸', 'home', { with: ['friend', 'family'], topics: ['money'] }, { en: 'Pushed to lend money you need', he: 'לוחצים עליכם להלוות כסף שאתם צריכים', ar: 'ضغط لإقراض مال تحتاجونه' }, {
    en: '“No — I can’t this time.”',
    he: '"לא, הפעם אני לא {יכול|יכולה}."',
    ar: '«لا — لا أستطيع هذه المرة.»',
  }),
  X('drink', '🍷', 'health', said('friend', 'health'), { en: 'Pressed to drink before driving', he: 'לוחצים עליכם לשתות לפני נהיגה', ar: 'ضغط للشرب قبل القيادة' }, {
    en: '“No thanks, I’m driving.”',
    he: '"לא תודה, אני {נוהג|נוהגת}."',
    ar: '«لا شكرًا، أنا أقود.»',
  }),
  // ---- for everyone
  X('vacation', '🏖️', 'health', said('boss', 'work', 'work-life'), { en: 'Told to work through your vacation', he: 'דורשים שתעבדו בחופשה', ar: 'يُطلب منكم العمل خلال إجازتكم' }, {
    en: '“I’m off that week. Let’s plan the handover now.”',
    he: '"אני בחופש באותו שבוע. בואו נתכנן העברה עכשיו."',
    ar: '«أنا في إجازة ذلك الأسبوع. لنخطط للتسليم الآن.»',
  }),
  X('rumors', '🐍', 'worth', said('coworker', 'work', 'honesty'), { en: 'A coworker spreads rumors about you', he: 'עמית מפיץ עליכם שמועות', ar: 'زميل ينشر عنكم شائعات' }, {
    en: '“I heard what you’ve been saying. It stops now.”',
    he: '"{שמעתי|שמעתי} מה אתה מספר. זה נגמר עכשיו."',
    ar: '«سمعت ما تقوله. هذا يتوقف الآن.»',
  }),
  X('tailgate', '🚘', 'health', said('stranger', 'road'), { en: 'A driver tailgates and threatens you', he: 'נהג נצמד אליכם ומאיים', ar: 'سائق يلتصق بكم ويهدّد' }, {
    en: 'Pull over, lock the doors, let him pass.',
    he: 'עוצרים בצד, נועלים, נותנים לו לעבור.',
    ar: 'تتوقفون جانبًا، تقفلون الأبواب، وتتركونه يمرّ.',
  }),
  X('photos', '📸', 'worth', said('friend', 'honesty'), { en: 'A friend posts a private photo of you', he: 'חבר מפרסם תמונה פרטית שלכם', ar: 'صديق ينشر صورة خاصة لكم' }, {
    en: '“Take it down, please. Now.”',
    he: '"תוריד את זה, בבקשה. עכשיו."',
    ar: '«احذفها من فضلك. الآن.»',
  }),
  X('landlord', '🔑', 'home', said('stranger', 'household'), { en: 'The landlord lets himself in', he: 'בעל הבית נכנס בלי להודיע', ar: 'المالك يدخل دون إذن' }, {
    en: '“Please give notice before you come in.”',
    he: '"בבקשה להודיע לפני שנכנסים."',
    ar: '«من فضلك أبلغ قبل أن تدخل.»',
  }),
  X('fence', '🧱', 'home', said('neighbor', 'neighbors'), { en: 'A neighbor builds into your yard', he: 'שכן בונה לתוך החצר שלכם', ar: 'جار يبني داخل ساحتكم' }, {
    en: '“That’s our land. Let’s look at the plans together.”',
    he: '"זה השטח שלנו. בוא נסתכל על התוכניות ביחד."',
    ar: '«هذه أرضنا. لننظر إلى المخططات معًا.»',
  }),
  X('stoptexting', '📲', 'worth', said('stranger', 'respect'), { en: 'Someone keeps texting after you said stop', he: 'מישהו ממשיך לשלוח הודעות אחרי שאמרתם די', ar: 'أحدهم يواصل الرسائل بعد أن قلتم كفى' }, {
    en: 'Block. Report. No more replies.',
    he: 'חוסמים. מדווחים. לא עונים יותר.',
    ar: 'حظر. إبلاغ. لا ردود بعد الآن.',
  }),
  X('signnow', '✍️', 'home', said('stranger', 'money'), { en: 'Pressed to sign without reading', he: 'לוחצים עליכם לחתום בלי לקרוא', ar: 'ضغط للتوقيع دون قراءة' }, {
    en: '“I’ll read it at home and get back to you.”',
    he: '"אקרא את זה בבית ואחזור אליכם."',
    ar: '«سأقرؤه في البيت وأعود إليكم.»',
  }),
  X('familyinsult', '🎯', 'worth', said('family', 'respect', 'in-laws'), { en: 'A relative mocks your choices at dinner', he: 'קרוב משפחה לועג לבחירות שלכם בארוחה', ar: 'قريب يسخر من خياراتكم على العشاء' }, {
    en: '“That’s my choice. Let’s change the subject.”',
    he: '"זו הבחירה שלי. בואו נחליף נושא."',
    ar: '«هذا خياري. لنغيّر الموضوع.»',
  }),
  // ---- particular homes
  X('onlinestranger', '👾', 'family', { with: ['child', 'teen'], topics: ['screens'], heavy: true }, { en: 'A stranger messages your kid online', he: 'זר שולח הודעות לילד שלכם ברשת', ar: 'غريب يراسل طفلكم عبر الإنترنت' }, {
    en: '“Show me — we’ll block and report it together.”',
    he: '"תראה לי. נחסום ונדווח ביחד."',
    ar: '«أرني — سنحظره ونبلّغ عنه معًا.»',
  }),
  X('partnerphone', '🔍', 'worth', { with: ['partner'], topics: ['honesty', 'respect'] }, { en: 'Your partner goes through your phone', he: 'בן הזוג עובר לכם על הטלפון', ar: 'الشريك يفتّش هاتفكم' }, {
    en: '“My phone is private. If something worries you, ask me.”',
    he: '"הטלפון שלי פרטי. אם משהו מדאיג אותך, תשאל אותי."',
    ar: '«هاتفي خاص. إن كان شيء يقلقك، اسألني.»',
  }),
  X('rmstrangers', '🛋️', 'home', { with: ['roommate'], topics: ['household'] }, { en: 'Roommate brings strangers to sleep over', he: 'השותף מביא זרים לישון אצלכם', ar: 'شريك السكن يُحضر غرباء للمبيت' }, {
    en: '“Not without asking me first. This is my home too.”',
    he: '"לא בלי לשאול אותי קודם. זה גם הבית שלי."',
    ar: '«ليس دون أن تسألني أولًا. هذا بيتي أيضًا.»',
  }),
  X('scam', '🎣', 'family', { with: ['ageing-parent'], topics: ['caregiving', 'money'], heavy: true }, { en: 'A scammer calls Mom for her bank details', he: 'נוכל מתקשר לאמא ומבקש פרטי בנק', ar: 'محتال يتصل بأمي يطلب بيانات البنك' }, {
    en: '“Mom, hang up. Banks never ask that. I’ll call them with you.”',
    he: '"אמא, תנתקי. בנק אף פעם לא מבקש את זה. {אתקשר|אתקשר} איתך אליהם."',
    ar: '«أمي، أغلقي الخط. البنوك لا تطلب ذلك أبدًا. سأتصل بهم معك.»',
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
  tr({ en: 'The weekend', he: 'סוף השבוע', ar: 'عطلة نهاية الأسبوع' }),
  tr({ en: 'The big day', he: 'היום הגדול', ar: 'اليوم الكبير' }),
  tr({ en: 'Two at once', he: 'שניים ביחד', ar: 'اثنان معًا' }),
  tr({ en: 'Looks scary', he: 'נראה מפחיד', ar: 'يبدو مخيفًا' }),
  tr({ en: 'A whole week', he: 'שבוע שלם', ar: 'أسبوع كامل' }),
];

import { tr } from '../shared/i18n';
import type { Trick } from './levels';

/**
 * Every string in the 3D game. Story beats stay short: two or three lines a
 * level, twelve words at most each, always skippable. Taunts are about the
 * game and its pace — never about the player (spec §9).
 * The Arabic name and taunts still need checking by an Arabic speaker.
 */

export const NAME = tr({ en: 'Pesky', he: 'ציקי', ar: 'زِنّو' });

export const T = {
  title: tr({ en: 'Catch Me', he: 'תפוס אותי', ar: 'امسكني' }),
  lede: tr({
    en: `Pesky pushes everyone’s buttons. Chase him through the house — and notice what happens to you.`,
    he: 'ציקי לוחץ לכולם על הכפתורים. רדפו אחריו ברחבי הבית — ושימו לב מה קורה לכם.',
    ar: 'زِنّو يضغط على أزرار الجميع. طاردوه في أنحاء البيت — ولاحظوا ما يحدث لكم.',
  }),
  play: tr({ en: 'Let’s go', he: 'יאללה', ar: 'يلّا' }),
  house: tr({ en: 'Pesky’s house', he: 'הבית של ציקי', ar: 'بيت زِنّو' }),
  home: tr({ en: 'All games', he: 'לכל המשחקים', ar: 'كل الألعاب' }),
  map: tr({ en: 'Back to the house', he: 'חזרה לבית', ar: 'العودة إلى البيت' }),
  soundOn: tr({ en: 'Sound on', he: 'הפעלת צליל', ar: 'تشغيل الصوت' }),
  mute: tr({ en: 'Mute', he: 'השתקה', ar: 'كتم الصوت' }),
  skip: tr({ en: 'Skip', he: 'דלגו', ar: 'تخطّوا' }),
  next: tr({ en: 'Next', he: 'הבא', ar: 'التالي' }),
  go: tr({ en: 'Catch him!', he: 'לתפוס אותו!', ar: 'امسكوه!' }),
  locked: tr({ en: 'Locked', he: 'נעול', ar: 'مقفل' }),
  catches: (n: number, of: number) => tr({ en: `Caught ${n} of ${of}`, he: `נתפס ${n} מתוך ${of}`, ar: `أمسكتموه ${n} من ${of}` }),
  noWebgl: tr({
    en: 'This game needs a device that supports 3D.',
    he: 'המשחק הזה צריך מכשיר שתומך בתלת־ממד.',
    ar: 'هذه اللعبة تحتاج جهازًا يدعم الأبعاد الثلاثية.',
  }),
  simple: tr({ en: 'Play Catch Me Simple', he: 'לשחק ב"תפוס אותי פשוט"', ar: 'العبوا "امسكني البسيط"' }),
  loading: tr({ en: 'Loading…', he: 'טוען…', ar: 'جارٍ التحميل…' }),
  pesky: tr({ en: 'Pesky — catch him!', he: 'ציקי — תפסו אותו!', ar: 'زِنّو — امسكوه!' }),

  // Breathing
  inhale: tr({ en: 'Hold — breathe in…', he: 'החזיקו — שואפים…', ar: 'اضغطوا — شهيق…' }),
  exhale: tr({ en: 'Let go — breathe out…', he: 'עזבו — נושפים…', ar: 'اتركوا — زفير…' }),
  holdToStart: tr({ en: 'Press and hold to breathe in', he: 'לחצו והחזיקו כדי לשאוף', ar: 'اضغطوا مطوّلًا لتأخذوا شهيقًا' }),
  early: tr({ en: 'You let go too early! Start the breath again.', he: 'עזבתם מוקדם מדי! מתחילים את הנשימה מחדש.', ar: 'تركتم مبكرًا جدًا! نبدأ النفَس من جديد.' }),
  again: tr({ en: 'One more breath', he: 'עוד נשימה אחת', ar: 'نفَس آخر' }),
  boilTitle: tr({ en: 'Boiling point!', he: 'מצב רתיחה!', ar: 'نقطة الغليان!' }),
  noticedTitle: tr({ en: 'You noticed in time! ⭐', he: 'שמתם לב בזמן! ⭐', ar: 'لاحظتم في الوقت! ⭐' }),
  noticeTitle: tr({ en: 'Good idea — a breath', he: 'רעיון טוב — נשימה', ar: 'فكرة جيدة — نفَس' }),
  breathDesc: tr({ en: 'Hold the orb to breathe in, let go to breathe out.', he: 'מחזיקים את הכדור כדי לשאוף, עוזבים כדי לנשוף.', ar: 'اضغطوا على الكرة للشهيق، واتركوها للزفير.' }),
  mirror: (a: string, b: string) =>
    tr({
      en: `Your fingers sped up: ${a} → ${b} taps a second. That’s what the anger did.`,
      he: `האצבעות שלך האיצו: ${a} ← ${b} הקשות בשנייה. זה מה שהכעס עשה.`,
      ar: `أصابعك تسارعت: ${a} ← ${b} نقرات في الثانية. هذا ما فعله الغضب.`,
    }),
  mirrorPlain: tr({ en: 'The heat climbed all the way up. That’s what anger does.', he: 'החום טיפס עד למעלה. זה מה שכעס עושה.', ar: 'الحرارة صعدت حتى القمة. هذا ما يفعله الغضب.' }),
  calmPower: tr({ en: 'Calm power!', he: 'כוח רוגע!', ar: 'قوة الهدوء!' }),
  slowed: tr({ en: 'See? He slowed down.', he: 'ראיתם? הוא האט.', ar: 'رأيتم؟ لقد أبطأ.' }),
  demoTitle: tr({ en: 'The kettle is boiling!', he: 'הקומקום רותח!', ar: 'الغلاية تغلي!' }),
  demoDesc: tr({ en: 'Let’s breathe together first. Hold the orb, then let go.', he: 'בואו ננשום יחד קודם. מחזיקים את הכדור, ואז עוזבים.', ar: 'لنتنفّس معًا أولًا. اضغطوا على الكرة ثم اتركوها.' }),
  angry: tr({ en: '🔥 I’m getting angry', he: '🔥 אני מתעצבן', ar: '🔥 بدأت أغضب' }),
  tired: tr({ en: 'Phew… I’m out of breath…', he: 'אוף… נגמר לי האוויר…', ar: 'أُف… انقطع نفَسي…' }),
  gaveUp: tr({ en: 'Okay, okay — you got me!', he: 'טוב, טוב — תפסת אותי!', ar: 'طيب، طيب — أمسكتني!' }),
  shieldTitle: tr({ en: 'When you’re angry — he’s strong', he: 'כשאתם כועסים — הוא חזק', ar: 'عندما تغضبون — يصبح قويًّا' }),
  shieldCalm: tr({ en: 'When you’re calm — he’s clumsy', he: 'כשאתם רגועים — הוא מגושם', ar: 'عندما تهدؤون — يصبح أخرق' }),

  // Results
  done: tr({ en: 'Room done!', he: 'החדר הושלם!', ar: 'أنهيتم الغرفة!' }),
  star1: tr({ en: 'Finished the room', he: 'השלמתם את החדר', ar: 'أنهيتم الغرفة' }),
  star2: tr({ en: 'Noticed in time — or never boiled', he: 'שמתם לב בזמן — או שלא רתחתם', ar: 'لاحظتم في الوقت — أو لم تغلوا' }),
  star3: tr({ en: 'A full breath without letting go', he: 'נשימה שלמה בלי לעזוב מוקדם', ar: 'نفَس كامل دون ترك مبكر' }),
  star3noBreath: tr({ en: 'Caught him without a single slip', he: 'תפסתם בלי אף החלקה', ar: 'أمسكتموه دون أي انزلاق' }),
  zen: (n: number) => tr({ en: `+${n} zen for the Calm Islands`, he: `+${n} נקודות זן לאיי השקט`, ar: `+${n} نقاط زن لجزر السكينة` }),
  island: tr({ en: 'To the Calm Islands 🏝️', he: 'לאיי השקט 🏝️', ar: 'إلى جزر السكينة 🏝️' }),
  again2: tr({ en: 'Play again', he: 'לשחק שוב', ar: 'العبوا مجددًا' }),
  nextRoom: tr({ en: 'Next room', he: 'לחדר הבא', ar: 'الغرفة التالية' }),
  newTrick: tr({ en: 'New trick for your collection!', he: 'טריק חדש לאוסף!', ar: 'خدعة جديدة لمجموعتكم!' }),
  tricksTitle: tr({ en: 'Trick collection', he: 'אוסף הטריקים', ar: 'مجموعة الخدع' }),
  exitConfirm: tr({ en: 'Leave the room?', he: 'לצאת מהחדר?', ar: 'مغادرة الغرفة؟' }),

  // Endless
  endless: tr({ en: 'Pesky’s bored again', he: 'ציקי שוב משתעמם', ar: 'زِنّو يشعر بالملل مجددًا' }),
  endlessDesc: tr({ en: 'Any room, every trick. The run ends after three boils.', he: 'חדר אקראי, כל הטריקים. הסבב נגמר אחרי 3 רתיחות.', ar: 'غرفة عشوائية، كل الخدع. تنتهي الجولة بعد ثلاث مرات غليان.' }),
  best: (n: number) => tr({ en: `Best: ${n} calm stars`, he: `שיא: ${n} כוכבי רוגע`, ar: `الأفضل: ${n} نجوم هدوء` }),
  calmStars: (n: number) => tr({ en: `${n} calm stars`, he: `${n} כוכבי רוגע`, ar: `${n} نجوم هدوء` }),
  newBest: tr({ en: 'A new personal best!', he: 'שיא אישי חדש!', ar: 'رقم شخصي جديد!' }),
  boilsLeft: (n: number) => tr({ en: `Boils left: ${n}`, he: `רתיחות שנשארו: ${n}`, ar: `مرات الغليان المتبقية: ${n}` }),
  runOver: tr({ en: 'Run over', he: 'הסבב נגמר', ar: 'انتهت الجولة' }),

  // Finale
  friendHint: tr({ en: 'Gently…', he: 'בעדינות…', ar: 'بلطف…' }),
  friends: tr({ en: 'Friends!', he: 'חברים!', ar: 'أصدقاء!' }),
  startled: tr({ en: 'Eek! Too fast!', he: 'אִי! מהר מדי!', ar: 'آه! بسرعة كبيرة!' }),
  toHome: tr({ en: 'See him in My home', he: 'לראות אותו ב"הבית שלי"', ar: 'شاهدوه في "بيتي"' }),
};

export const LEVEL_NAMES: Record<number, string> = {
  1: tr({ en: 'Living room', he: 'סלון', ar: 'غرفة الجلوس' }),
  2: tr({ en: 'Kitchen', he: 'מטבח', ar: 'المطبخ' }),
  3: tr({ en: 'Kids’ room', he: 'חדר ילדים', ar: 'غرفة الأطفال' }),
  4: tr({ en: 'Garden', he: 'גינה', ar: 'الحديقة' }),
  5: tr({ en: 'Roof', he: 'גג', ar: 'السطح' }),
  6: tr({ en: 'Pesky’s box', he: 'הקופסה של ציקי', ar: 'صندوق زِنّو' }),
};

export const STORY: Record<number, string[]> = {
  1: tr({
    en: ['The red button jumped off the TV remote!', 'That’s Pesky. He pushes everyone’s buttons.', 'Catch him when he trips!'],
    he: ['הכפתור האדום קפץ מהשלט של הטלוויזיה!', 'זה ציקי. הוא לוחץ לכולם על הכפתורים.', 'תפסו אותו כשהוא מועד!'],
    ar: ['الزر الأحمر قفز من جهاز التحكم بالتلفاز!', 'هذا زِنّو. يضغط على أزرار الجميع.', 'امسكوه عندما يتعثّر!'],
  }),
  2: tr({
    en: ['Pesky pushed the kettle’s buttons. It’s boiling!', 'Let’s breathe with the kettle first.', 'A calm breath makes him slow and clumsy.'],
    he: ['ציקי לחץ לקומקום על הכפתורים. הוא רותח!', 'בואו ננשום קודם יחד עם הקומקום.', 'נשימה רגועה הופכת אותו לאיטי ומגושם.'],
    ar: ['زِنّو ضغط على أزرار الغلاية. إنها تغلي!', 'لنتنفّس أولًا مع الغلاية.', 'النفَس الهادئ يجعله بطيئًا وأخرق.'],
  }),
  3: tr({
    en: ['Now he’s bugging the toy robot.', 'Feel the heat rising? Press “I’m getting angry”.', 'Careful — not every red ball is him!'],
    he: ['עכשיו הוא מציק לרובוט הצעצוע.', 'מרגישים שזה מתחמם? לחצו "אני מתעצבן".', 'זהירות — לא כל כדור אדום זה הוא!'],
    ar: ['الآن يزعج الروبوت اللعبة.', 'تشعرون بالحرارة؟ اضغطوا "بدأت أغضب".', 'انتبهوا — ليست كل كرة حمراء هي هو!'],
  }),
  4: tr({
    en: ['He’s pushing the garden gnome’s buttons.', 'Three of him? The real one’s laces flash.'],
    he: ['הוא לוחץ לגמד הגינה על הכפתורים.', 'שלושה ציקים? לאמיתי יש שרוכים מהבהבים.'],
    ar: ['يضغط على أزرار قزم الحديقة.', 'ثلاثة منه؟ الحقيقي أربطة حذائه تومض.'],
  }),
  5: tr({
    en: ['Up on the roof, at sunset.', 'He dives into doors and chimneys!'],
    he: ['למעלה על הגג, בשקיעה.', 'הוא צולל לדלתות ולארובות!'],
    ar: ['فوق السطح، عند الغروب.', 'يغوص في الأبواب والمداخن!'],
  }),
  6: tr({
    en: ['Pesky’s own box. It’s very quiet here.', 'He’s all alone in there.', 'What does he really want?'],
    he: ['הקופסה של ציקי. שקט כאן.', 'הוא לגמרי לבד פה.', 'מה הוא באמת רוצה?'],
    ar: ['صندوق زِنّو. المكان هادئ جدًا.', 'إنه وحيد تمامًا هنا.', 'ماذا يريد حقًّا؟'],
  }),
};

export const ROOSTER_HINT = tr({ en: 'He only comes close to someone calm.', he: 'הוא מתקרב רק למי שרגוע.', ar: 'لا يقترب إلا ممّن هو هادئ.' });

export const ENDING = tr({
  en: ['Pesky just wanted someone to play with.', 'He gives everyone their buttons back.', 'Now he lives in your home. Friends!'],
  he: ['ציקי רק רצה שמישהו ישחק איתו.', 'הוא מחזיר לכולם את הכפתורים.', 'עכשיו הוא גר אצלכם בבית. חברים!'],
  ar: ['زِنّو أراد فقط من يلعب معه.', 'يعيد للجميع أزرارهم.', 'الآن يعيش في بيتكم. أصدقاء!'],
});

export const TRICK_INFO: Record<Trick, { icon: string; name: string }> = {
  zigzag: { icon: '⚡', name: tr({ en: 'Zigzag', he: 'זיגזג', ar: 'تعرّج' }) },
  hide: { icon: '🪑', name: tr({ en: 'Hide & peek', he: 'מתחבא', ar: 'يختبئ' }) },
  decoy: { icon: '🔴', name: tr({ en: 'Decoy balls', he: 'פיתיונות', ar: 'كرات خدّاعة' }) },
  bed: { icon: '🛏️', name: tr({ en: 'Bed bounce', he: 'קפיצה על המיטה', ar: 'القفز على السرير' }) },
  clones: { icon: '👯', name: tr({ en: 'Copies', he: 'שכפולים', ar: 'نسخ' }) },
  portals: { icon: '🚪', name: tr({ en: 'Doors & chimneys', he: 'דלתות וארובות', ar: 'أبواب ومداخن' }) },
};

export const TAUNTS = tr({
  en: ['Catch me!', 'Too slow!', 'So close!', 'Not this time!', 'Over here!', 'Hee hee!', 'Oh, come on!', 'Faster!', 'Missed me!'],
  he: ['תפוס אותי!', 'לאט מדי!', 'כמעט!', 'לא הפעם!', 'פה! פה!', 'חי חי חי', 'נו, באמת?', 'יותר מהר!', 'פספסת!'],
  ar: ['امسكني!', 'بطيء جدًا!', 'قرّبت!', 'مش هالمرّة!', 'هون! هون!', 'هههه', 'يلّا عاد!', 'أسرع!', 'ما لحقتني!'],
});
export const MOCKS = tr({
  en: ['Ha ha!', 'Nope!', 'Hee hee!'],
  he: ['חחח!', 'לא־לא!', 'חי חי!'],
  ar: ['هههه!', 'لا لا!', 'هيهي!'],
});
export const FEINTS = tr({
  en: ['Phew, I’m tired…', 'Okay, you win…', 'Fine, catch me…'],
  he: ['אוף, התעייפתי…', 'טוב, ניצחת…', 'נו, תתפוס…'],
  ar: ['أُف، تعبت…', 'طيب، ربحت…', 'يلّا، امسكني…'],
});
export const GOTCHAS = tr({
  en: ['Just kidding!', 'Gotcha!', 'Almost!'],
  he: ['סתם!', 'עבדתי עליך!', 'כמעט!'],
  ar: ['بمزح!', 'ضحكت عليك!', 'تقريبًا!'],
});
export const BED = tr({
  en: ['Boing! Boing!', 'Wheee!', 'Trampoline!'],
  he: ['בוינג! בוינג!', 'ויייי!', 'טרמפולינה!'],
  ar: ['بوينغ! بوينغ!', 'ويييي!', 'ترامبولين!'],
});

/** Feedback at your finger: what just happened to *your* tap. */
export const R = {
  miss: tr({ en: '✗ Missed!', he: '✗ פספסת!', ar: '✗ فاتك!' }),
  almost: tr({ en: 'Almost!', he: 'כמעט!', ar: 'تقريبًا!' }),
  hit: tr({ en: '✓ Got it!', he: '✓ תפסת!', ar: '✓ أمسكته!' }),
  notReally: tr({ en: '…or not!', he: '…או שלא!', ar: '…أو لا!' }),
  caught: tr({ en: '✓ Caught him!', he: '✓ תפסת אותו!', ar: '✓ أمسكته!' }),
  fooled: tr({ en: '✗ He fooled you!', he: '✗ הוא עבד עליך!', ar: '✗ ضحك عليك!' }),
  notHim: tr({ en: '✗ Not him!', he: '✗ לא הוא!', ar: '✗ ليس هو!' }),
  streak: (n: number) => tr({ en: `${n} misses in a row!`, he: `${n} פספוסים ברצף!`, ar: `${n} مرات فاتك على التوالي!` }),
};

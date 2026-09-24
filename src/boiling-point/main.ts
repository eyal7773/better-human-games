import '../shared/base.css';
import './styles.css';
import { h, ltr, shuffle } from '../shared/dom';
import { tr, langSwitcher } from '../shared/i18n';
import { AudioEngine } from '../shared/audio';
import { kettleSVG } from '../shared/kettle';
import { FX } from '../shared/fx';
import { HUD } from './hud';
import { save, persist } from './save';
import { DILEMMAS, type Dilemma } from './content';
import { allowed, fits, weight, weightedShuffle } from '../shared/profile';
import { playRound, type CalmKind, type PlayView, type RoundResult, type TaskKind } from './round';
import { showSummary } from './summary';
import { mountIsland } from './island';
import { pebbleSVG } from './art';

/** Strings used in more than one place. */
const T = {
  title: tr({ en: 'Boiling Point', he: 'נקודת רתיחה', ar: 'نقطة الغليان' }),
  island: tr({ en: 'Island of Calm', he: 'אי השקט', ar: 'جزيرة السكينة' }),
  howTo: tr({ en: 'How to play', he: 'איך משחקים', ar: 'كيف نلعب' }),
  settings: tr({ en: 'Settings', he: 'הגדרות', ar: 'الإعدادات' }),
  choiceTime: tr({ en: 'Time to choose a response', he: 'זמן לבחירת תגובה', ar: 'وقت اختيار الرد' }),
  pausesInTime: tr({ en: 'Paused in time', he: 'עצירות בזמן', ar: 'توقّفات في الوقت' }),
  calmResponses: tr({ en: 'Calm responses', he: 'תגובות רגועות', ar: 'ردود هادئة' }),
  zenPoints: tr({ en: 'Zen points', he: 'נקודות זן', ar: 'نقاط الهدوء' }),
};

document.title = T.title;

const app = document.getElementById('app')!;
const audio = new AudioEngine(save.muted);
const fx = new FX(document.body);

let teardown: (() => void) | null = null;
const clear = () => {
  teardown?.();
  teardown = null;
  app.replaceChildren();
};

// Browsers only allow audio after a gesture; unlock on the very first touch.
addEventListener('pointerdown', () => audio.unlock(), { once: true, capture: true });
document.addEventListener('visibilitychange', () => audio.setBackground(document.hidden));

// ---------------------------------------------------------------- home

function home() {
  clear();
  audio.startPad('home');
  const soundBtn = h('button', { class: 'icon-btn', type: 'button' });
  const paintSound = () => {
    soundBtn.innerHTML = save.muted
      ? '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    soundBtn.setAttribute('aria-label', save.muted ? tr({ en: 'Sound on', he: 'הפעלת צליל', ar: 'تشغيل الصوت' }) : tr({ en: 'Mute', he: 'השתקה', ar: 'كتم الصوت' }));
  };
  paintSound();
  soundBtn.addEventListener('click', () => {
    save.muted = !save.muted;
    persist();
    audio.setMuted(save.muted);
    if (!save.muted) {
      audio.unlock();
      audio.startPad('home');
    } else audio.stopPad();
    paintSound();
  });

  const kettleWrap = h('div', { class: 'home-kettle', html: kettleSVG() });
  const stat = (n: number, label: string) => h('div', { class: 'stat' }, h('b', {}, String(n)), h('span', {}, label));
  const screen = h(
    'section',
    { class: 'screen home' },
    h(
      'header',
      { class: 'home-top' },
      h('a', {
        class: 'icon-btn',
        href: import.meta.env.BASE_URL,
        'aria-label': tr({ en: 'All games', he: 'לכל המשחקים', ar: 'كل الألعاب' }),
        html: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/></svg>',
      }),
      h('div', { class: 'hud-zen', html: pebbleSVG('pebble hud-pebble') }, h('span', {}, String(save.zen))),
      soundBtn,
    ),
    h('div', { class: 'home-hero' }, h('div', { class: 'home-temp', 'aria-hidden': 'true' }, '100°'), kettleWrap),
    h('h1', { class: 'home-title' }, T.title),
    h(
      'p',
      { class: 'home-lede' },
      tr({
        en: 'This game annoys you on purpose. The goal: notice the heat as it starts, pause, calm down — and choose a response you won’t regret.',
        he: 'המשחק מעצבן אתכם בכוונה. המטרה: לשים לב לחום כשהוא רק מתחיל, לעצור, להירגע — ולבחור תגובה שלא תצטערו עליה.',
        ar: 'هذه اللعبة تستفزّكم عن قصد. الهدف: أن تلاحظوا الحرارة وهي تبدأ، أن تتوقفوا، أن تهدأوا — وأن تختاروا ردًّا لن تندموا عليه.',
      }),
    ),
    h(
      'div',
      { class: 'home-actions' },
      h('button', { class: 'btn', type: 'button', onclick: () => void evening() }, save.evenings ? tr({ en: 'Start a new evening', he: 'להתחיל ערב חדש', ar: 'ابدأوا مساءً جديدًا' }) : tr({ en: 'Start the evening', he: 'להתחיל את הערב', ar: 'ابدأوا المساء' })),
      h('button', { class: 'btn ghost', type: 'button', onclick: island }, T.island),
    ),
    save.rounds
      ? h('div', { class: 'home-stats' }, stat(save.evenings, tr({ en: 'Evenings', he: 'ערבים', ar: 'أمسيات' })), stat(save.noticed, T.pausesInTime), stat(save.bestChoices, T.calmResponses))
      : null,
    h(
      'nav',
      { class: 'home-links' },
      h('button', { class: 'link', type: 'button', onclick: () => howTo() }, T.howTo),
      h('button', { class: 'link', type: 'button', onclick: settings }, T.settings),
    ),
  );
  app.append(screen);

  // Idle steam from the hero kettle.
  let alive = true;
  const puff = () => {
    if (!alive) return;
    const r = kettleWrap.getBoundingClientRect();
    if (r.width) fx.steam(r.left + r.width * 0.08, r.top + r.height * 0.36, 1, 0.6);
    setTimeout(puff, 380);
  };
  puff();
  teardown = () => {
    alive = false;
  };

  if (!save.seenHowTo) howTo();
}

// ---------------------------------------------------------------- how to

const STEPS: [string, string, string][] = tr({
  en: [
    ['🧺', 'A small chore at home', 'Tidy up, make something, match pairs. Halfway through, the nudniks show up and start interfering — on purpose.'],
    ['🌡️', 'Notice the heat', 'The thermometer rises. When you feel it starting — tap ✋ Pause. The earlier you pause, the more points.'],
    ['🫁', 'Calm down slowly', 'A long breath, finding where you feel it in your body and naming it, or tapping to a heartbeat. Fast, agitated tapping heats you up.'],
    ['💬', 'Choose a response', 'A real situation from home and a few seconds to decide. The calm response is worth the most zen points.'],
  ],
  he: [
    ['🧺', 'משימה קטנה מהבית', 'מסדרים, מכינים, מחפשים זוגות. באמצע מגיעים הנודניקים ומתחילים להפריע — בכוונה.'],
    ['🌡️', 'שמים לב לחום', 'המדחום עולה. כשמרגישים שזה מתחיל — לוחצים ✋ עצירה. ככל שמוקדם יותר, יותר נקודות.'],
    ['🫁', 'נרגעים לאט', 'נשימה ארוכה, לזהות איפה זה בגוף ולתת לזה שם, או הקשה בקצב הלב. לחיצות מהירות ועצבניות מחממות.'],
    ['💬', 'בוחרים תגובה', 'מצב אמיתי מהבית וכמה שניות להחליט. התגובה הרגועה שווה הכי הרבה נקודות זן.'],
  ],
  ar: [
    ['🧺', 'مهمة صغيرة في البيت', 'ترتيب، تحضير، البحث عن أزواج. في المنتصف يصل المزعجون ويبدأون بالتشويش — عن قصد.'],
    ['🌡️', 'لاحظوا الحرارة', 'ميزان الحرارة يرتفع. عندما تشعرون أن الأمر بدأ — اضغطوا ✋ توقّف. كلما توقفتم أبكر، زادت النقاط.'],
    ['🫁', 'اهدأوا ببطء', 'نفَس طويل، أن تحدّدوا أين تشعرون بذلك في الجسد وتسمّوه، أو النقر على إيقاع القلب. النقرات السريعة والعصبية ترفع الحرارة.'],
    ['💬', 'اختاروا ردًّا', 'موقف حقيقي من البيت وبضع ثوانٍ للقرار. الرد الهادئ يساوي أكبر عدد من نقاط الهدوء.'],
  ],
});

function howTo() {
  const close = () => {
    save.seenHowTo = true;
    persist();
    overlay.remove();
  };
  const overlay = h(
    'div',
    { class: 'sheet-overlay', onclick: (e: Event) => e.target === overlay && close() },
    h(
      'div',
      { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'howto-title' },
      h('h2', { id: 'howto-title' }, T.howTo),
      h(
        'ol',
        { class: 'steps' },
        ...STEPS.map(([icon, title, body]) =>
          h('li', {}, h('span', { class: 'step-icon', 'aria-hidden': 'true' }, icon), h('div', {}, h('b', {}, title), h('p', {}, body))),
        ),
      ),
      h(
        'p',
        { class: 'sheet-note' },
        tr({
          en: 'Zen points build your Island of Calm. And at home, when you feel the heat rising — you’ll already know what to do.',
          he: 'נקודות הזן בונות את אי השקט שלכם. ובבית, כשתרגישו את החום עולה — כבר תדעו מה לעשות.',
          ar: 'نقاط الهدوء تبني جزيرة السكينة الخاصة بكم. وفي البيت، عندما تشعرون بالحرارة ترتفع — ستعرفون ما يجب فعله.',
        }),
      ),
      h('button', { class: 'btn', type: 'button', onclick: close }, tr({ en: 'Got it', he: 'הבנתי', ar: 'فهمت' })),
    ),
  );
  app.append(overlay);
  (overlay.querySelector('.btn') as HTMLElement).focus({ preventScroll: true });
}

// ---------------------------------------------------------------- settings

function settings() {
  const close = () => overlay.remove();
  const times = [5, 8, 12];
  const seg = h(
    'div',
    { class: 'segmented', role: 'radiogroup', 'aria-label': T.choiceTime },
    ...times.map((t) => {
      const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(save.choiceSeconds === t) }, tr({ en: `${t} sec`, he: `${t} שניות`, ar: `${t} ثوانٍ` }));
      b.addEventListener('click', () => {
        save.choiceSeconds = t;
        persist();
        seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      });
      return b;
    }),
  );
  let armed = false;
  const reset = h('button', { class: 'btn ghost danger', type: 'button' }, tr({ en: 'Reset progress', he: 'איפוס ההתקדמות', ar: 'إعادة ضبط التقدّم' }));
  reset.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      reset.textContent = tr({ en: 'Sure? Tap again to erase everything', he: 'בטוח? לחצו שוב כדי למחוק הכל', ar: 'متأكدون؟ اضغطوا مرة أخرى لحذف كل شيء' });
      return;
    }
    try {
      localStorage.removeItem('bhg.boiling-point.v1');
    } catch {
      /* nothing stored */
    }
    location.reload();
  });
  const overlay = h(
    'div',
    { class: 'sheet-overlay', onclick: (e: Event) => e.target === overlay && close() },
    h(
      'div',
      { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'settings-title' },
      h('h2', { id: 'settings-title' }, T.settings),
      h('h3', {}, tr({ en: 'Language', he: 'שפה', ar: 'اللغة' })),
      langSwitcher('segmented lang-switch'),
      h('h3', {}, tr({ en: 'My home', he: 'הבית שלי', ar: 'بيتي' })),
      h(
        'a',
        { class: 'btn ghost', href: new URL('../?profile=edit', location.href).href },
        tr({ en: 'Edit my home', he: 'עריכת הבית שלי', ar: 'تعديل بيتي' }),
      ),
      h('h3', {}, T.choiceTime),
      seg,
      h(
        'p',
        { class: 'sheet-note' },
        tr({
          en: 'Default: 5 seconds, like a real moment. You can make it longer to have time to read.',
          he: 'במקור: 5 שניות, כמו ברגע אמיתי. אפשר להאריך כדי להספיק לקרוא.',
          ar: 'الافتراضي: 5 ثوانٍ، كما في لحظة حقيقية. يمكن إطالتها ليتسنّى لكم القراءة.',
        }),
      ),
      reset,
      h('button', { class: 'btn', type: 'button', onclick: close }, tr({ en: 'Close', he: 'סגירה', ar: 'إغلاق' })),
    ),
  );
  app.append(overlay);
}

// ---------------------------------------------------------------- island

function island() {
  clear();
  audio.unlock();
  teardown = mountIsland(app, audio, fx, home);
}

// ---------------------------------------------------------------- evening

const CLOCKS = ['18:30', '19:15', '20:00'];

/**
 * Prefer fresh dilemmas that fit the player's home (hot topics weighted up),
 * then fitting ones seen lately, then any that are allowed at all.
 */
function pickDilemmas(n: number) {
  const recent = (d: Dilemma) => save.recentDilemmas.includes(d.id);
  const allowedAll = DILEMMAS.filter((d) => allowed(d.tags));
  const fitting = allowedAll.filter((d) => fits(d.tags));
  const w = (d: Dilemma) => weight(d.tags);
  const tiers = [
    fitting.filter((d) => !recent(d)),
    fitting.filter(recent),
    allowedAll.filter((d) => !fitting.includes(d)),
  ];
  const chosen = tiers.flatMap((tier) => weightedShuffle(tier, w)).slice(0, n);
  save.recentDilemmas = [...save.recentDilemmas, ...chosen.map((d) => d.id)].slice(-8);
  return chosen;
}

function buildPlayView(onMenu: () => void): PlayView {
  const hud = new HUD(onMenu);
  hud.setZen(save.zen);
  const clock = h('div', { class: 'scene-clock' });
  const title = h('h2', { class: 'scene-title' });
  const hint = h('p', { class: 'scene-hint', 'aria-live': 'polite' });
  const kettleHolder = h('div', { class: 'scene-kettle', html: kettleSVG() });
  const board = h('div', { class: 'board' });
  const pauseBtn = h(
    'button',
    { class: 'pause-btn', type: 'button', hidden: true },
    h('span', { class: 'pause-hand', 'aria-hidden': 'true' }, '✋'),
    h('span', {}, tr({ en: 'Pause', he: 'עצירה', ar: 'توقّف' })),
  );
  const layer = h('div', { class: 'mischief-layer' });
  const modal = h('div', { class: 'modal-layer' });
  const root = h(
    'section',
    { class: 'screen play' },
    hud.el,
    h('div', { class: 'scene' }, h('div', { class: 'scene-text' }, h('div', { class: 'scene-row' }, clock, title), hint), kettleHolder),
    h('div', { class: 'board-wrap' }, board),
    h('div', { class: 'dock' }, pauseBtn),
    h('div', { class: 'vignette', 'aria-hidden': 'true' }),
    layer,
    modal,
  );
  app.append(root);
  return { root, hud, clock, title, hint, kettle: kettleHolder.querySelector('svg')!, board, pauseBtn, layer, modal };
}

async function evening() {
  clear();
  audio.unlock();
  audio.stopPad();
  let quit = false;
  let view!: PlayView;
  const onMenu = () => {
    const box = h(
      'div',
      { class: 'sheet-overlay' },
      h(
        'div',
        { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
        h('h2', {}, tr({ en: 'Leave the evening?', he: 'לצאת מהערב?', ar: 'الخروج من المساء؟' })),
        h('p', { class: 'sheet-note' }, tr({ en: 'Points from finished rounds are already saved.', he: 'הנקודות מסיבובים שהסתיימו כבר שמורות.', ar: 'نقاط الجولات المنتهية محفوظة بالفعل.' })),
        h('div', { class: 'sheet-actions' },
          h('button', { class: 'btn', type: 'button', onclick: () => box.remove() }, tr({ en: 'Keep playing', he: 'להמשיך לשחק', ar: 'متابعة اللعب' })),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { quit = true; abortRound?.(); home(); } }, tr({ en: 'Exit to menu', he: 'יציאה לתפריט', ar: 'الخروج إلى القائمة' })),
        ),
      ),
    );
    view.root.append(box);
  };
  let abortRound: (() => void) | null = null;
  view = buildPlayView(onMenu);
  teardown = () => {
    quit = true;
    abortRound?.();
    audio.setWhistle(0);
  };

  const tasks = shuffle<TaskKind>(['order', 'sort', 'pairs']);
  const calmsBase: CalmKind[] = ['breath', 'body', 'heart'];
  const shift = save.evenings % 3;
  const calms = [...calmsBase.slice(shift), ...calmsBase.slice(0, shift)];
  const dilemmas = pickDilemmas(3);
  const baseLevel = Math.min(3, save.evenings * 0.5);
  const results: RoundResult[] = [];

  for (let i = 0; i < 3; i++) {
    const round = playRound(
      view,
      {
        clock: CLOCKS[i],
        task: tasks[i],
        calm: calms[i],
        dilemma: dilemmas[i],
        level: baseLevel + i * 0.6,
        coach: save.rounds < 2,
        choiceSeconds: save.choiceSeconds,
      },
      audio,
      fx,
    );
    abortRound = round.abort;
    const r = await round.done;
    if (quit) return;
    const zenBefore = save.zen;
    save.zen += r.total;
    save.earned += r.total;
    save.rounds++;
    if (r.outcome !== 'boiled') {
      save.calmRounds++;
      save.growth++;
    } else save.boils++;
    if (r.outcome === 'noticed') save.noticed++;
    if (r.choice === 'best') save.bestChoices++;
    persist();
    results.push(r);
    await showSummary(view.modal, r, { fx, hud: view.hud, audio, zenBefore, last: i === 2 });
    if (quit) return;
  }
  save.evenings++;
  persist();
  eveningEnd(results);
}

function eveningEnd(results: RoundResult[]) {
  clear();
  audio.startPad('home');
  const total = results.reduce((s, r) => s + r.total, 0);
  const noticed = results.filter((r) => r.outcome === 'noticed').length;
  const boiled = results.filter((r) => r.outcome === 'boiled').length;
  const best = results.filter((r) => r.choice === 'best').length;
  const headline =
    boiled === 0 && noticed === 3
      ? tr({ en: 'A peaceful evening', he: 'ערב של שקט', ar: 'مساء هادئ' })
      : boiled === 0
        ? tr({ en: 'You got through the evening without boiling', he: 'עברתם את הערב בלי לרתוח', ar: 'مرّ المساء دون أن تغلوا' })
        : boiled === 3
          ? tr({ en: 'A stormy evening', he: 'ערב סוער', ar: 'مساء عاصف' })
          : tr({ en: 'An evening of ups and downs', he: 'ערב עם עליות ומורדות', ar: 'مساء من الصعود والهبوط' });
  const icon = (r: RoundResult) => ({ noticed: '✋', forced: '♨', finished: '✓', boiled: '💥' })[r.outcome];
  const outcomeText = (r: RoundResult) =>
    ({
      noticed: tr({ en: `Paused at ${ltr(`${r.pauseC}°`)}`, he: `עצירה ב־${ltr(`${r.pauseC}°`)}`, ar: `توقّف عند ${ltr(`${r.pauseC}°`)}` }),
      forced: tr({ en: 'The kettle whistled', he: 'הקומקום שרק', ar: 'صفّر الإبريق' }),
      finished: tr({ en: 'Chore done', he: 'משימה הושלמה', ar: 'اكتملت المهمة' }),
      boiled: tr({ en: 'Boiled over', he: 'רתיחה', ar: 'غليان' }),
    })[r.outcome];
  const screen = h(
    'section',
    { class: 'screen night' },
    h('div', { class: 'night-sky', 'aria-hidden': 'true' }, ...Array.from({ length: 28 }, (_, i) => h('i', { style: { left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, animationDelay: `${(i % 7) * 0.4}s` } }))),
    h('div', { class: 'night-clock' }, '20:30'),
    h('p', { class: 'night-kicker' }, tr({ en: 'The kids are asleep', he: 'הילדים ישנים', ar: 'الأولاد نائمون' })),
    h('h1', { class: 'night-title' }, headline),
    h(
      'ol',
      { class: 'night-rounds' },
      ...results.map((r, i) =>
        h('li', {}, h('span', { class: 'nr-clock' }, CLOCKS[i]), h('span', { class: 'nr-icon', 'aria-hidden': 'true' }, icon(r)), h('span', { class: 'nr-text' }, outcomeText(r)), h('b', {}, ltr(`+${r.total}`))),
      ),
    ),
    h(
      'div',
      { class: 'night-facts' },
      h('div', {}, h('b', {}, `${noticed}/3`), h('span', {}, T.pausesInTime)),
      h('div', {}, h('b', {}, `${best}/3`), h('span', {}, T.calmResponses)),
      h('div', {}, h('b', {}, ltr(`+${total}`)), h('span', {}, T.zenPoints)),
    ),
    h(
      'div',
      { class: 'home-actions' },
      h('button', { class: 'btn', type: 'button', onclick: island }, tr({ en: 'Build on the island', he: 'לבנות באי השקט', ar: 'ابنوا في الجزيرة' })),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => void evening() }, tr({ en: 'Another evening', he: 'ערב נוסף', ar: 'مساء آخر' })),
    ),
    h('button', { class: 'link', type: 'button', onclick: home }, tr({ en: 'Menu', he: 'לתפריט', ar: 'القائمة' })),
  );
  app.append(screen);
  audio.bell(0, 0.8);
  setTimeout(() => audio.bell(4, 0.6), 400);
  const r = screen.querySelector('.night-title')!.getBoundingClientRect();
  if (boiled === 0) fx.confetti(r.left + r.width / 2, r.top, 40, ['#ffd447', '#fff3c4', '#b983ff', '#8ecfd0']);
}

home();

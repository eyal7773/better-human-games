import '../shared/base.css';
import './styles.css';
import { h, ltr, shuffle } from '../shared/dom';
import { AudioEngine } from '../shared/audio';
import { kettleSVG } from '../shared/kettle';
import { FX } from './fx';
import { HUD } from './hud';
import { save, persist } from './save';
import { DILEMMAS } from './content';
import { playRound, type CalmKind, type PlayView, type RoundResult, type TaskKind } from './round';
import { showSummary } from './summary';
import { mountIsland } from './island';
import { pebbleSVG } from './art';

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
    soundBtn.setAttribute('aria-label', save.muted ? 'הפעלת צליל' : 'השתקה');
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
        'aria-label': 'לכל המשחקים',
        html: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/></svg>',
      }),
      h('div', { class: 'hud-zen', html: pebbleSVG('pebble hud-pebble') }, h('span', {}, String(save.zen))),
      soundBtn,
    ),
    h('div', { class: 'home-hero' }, h('div', { class: 'home-temp', 'aria-hidden': 'true' }, '100°'), kettleWrap),
    h('h1', { class: 'home-title' }, 'נקודת רתיחה'),
    h(
      'p',
      { class: 'home-lede' },
      'המשחק מעצבן אתכם בכוונה. המטרה: לשים לב לחום כשהוא רק מתחיל, לעצור, להירגע — ולבחור תגובה שלא תצטערו עליה.',
    ),
    h(
      'div',
      { class: 'home-actions' },
      h('button', { class: 'btn', type: 'button', onclick: () => void evening() }, save.evenings ? 'להתחיל ערב חדש' : 'להתחיל את הערב'),
      h('button', { class: 'btn ghost', type: 'button', onclick: island }, 'אי השקט'),
    ),
    save.rounds
      ? h('div', { class: 'home-stats' }, stat(save.evenings, 'ערבים'), stat(save.noticed, 'עצירות בזמן'), stat(save.bestChoices, 'תגובות רגועות'))
      : null,
    h(
      'nav',
      { class: 'home-links' },
      h('button', { class: 'link', type: 'button', onclick: () => howTo() }, 'איך משחקים'),
      h('button', { class: 'link', type: 'button', onclick: settings }, 'הגדרות'),
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

const STEPS: [string, string, string][] = [
  ['🧺', 'משימה קטנה מהבית', 'מסדרים, מכינים, מחפשים זוגות. באמצע מגיעים הנודניקים ומתחילים להפריע — בכוונה.'],
  ['🌡️', 'שמים לב לחום', 'המדחום עולה. כשמרגישים שזה מתחיל — לוחצים ✋ עצירה. ככל שמוקדם יותר, יותר נקודות.'],
  ['🫁', 'נרגעים לאט', 'נשימה ארוכה, גריפת חול איטית או הקשה בקצב הלב. לחיצות מהירות ועצבניות מחממות.'],
  ['💬', 'בוחרים תגובה', 'מצב אמיתי מהבית וכמה שניות להחליט. התגובה הרגועה שווה הכי הרבה נקודות זן.'],
];

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
      h('h2', { id: 'howto-title' }, 'איך משחקים'),
      h(
        'ol',
        { class: 'steps' },
        ...STEPS.map(([icon, title, body]) =>
          h('li', {}, h('span', { class: 'step-icon', 'aria-hidden': 'true' }, icon), h('div', {}, h('b', {}, title), h('p', {}, body))),
        ),
      ),
      h('p', { class: 'sheet-note' }, 'נקודות הזן בונות את אי השקט שלכם. ובבית, כשתרגישו את החום עולה — כבר תדעו מה לעשות.'),
      h('button', { class: 'btn', type: 'button', onclick: close }, 'הבנתי'),
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
    { class: 'segmented', role: 'radiogroup', 'aria-label': 'זמן לבחירת תגובה' },
    ...times.map((t) => {
      const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(save.choiceSeconds === t) }, `${t} שניות`);
      b.addEventListener('click', () => {
        save.choiceSeconds = t;
        persist();
        seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      });
      return b;
    }),
  );
  let armed = false;
  const reset = h('button', { class: 'btn ghost danger', type: 'button' }, 'איפוס ההתקדמות');
  reset.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      reset.textContent = 'בטוח? לחצו שוב כדי למחוק הכל';
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
      h('h2', { id: 'settings-title' }, 'הגדרות'),
      h('h3', {}, 'זמן לבחירת תגובה'),
      seg,
      h('p', { class: 'sheet-note' }, 'במקור: 5 שניות, כמו ברגע אמיתי. אפשר להאריך כדי להספיק לקרוא.'),
      reset,
      h('button', { class: 'btn', type: 'button', onclick: close }, 'סגירה'),
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

function pickDilemmas(n: number) {
  const fresh = DILEMMAS.filter((d) => !save.recentDilemmas.includes(d.id));
  const pool = shuffle(fresh.length >= n ? fresh : [...DILEMMAS]);
  const chosen = pool.slice(0, n);
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
    h('span', {}, 'עצירה'),
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
        h('h2', {}, 'לצאת מהערב?'),
        h('p', { class: 'sheet-note' }, 'הנקודות מסיבובים שהסתיימו כבר שמורות.'),
        h('div', { class: 'sheet-actions' },
          h('button', { class: 'btn', type: 'button', onclick: () => box.remove() }, 'להמשיך לשחק'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { quit = true; abortRound?.(); home(); } }, 'יציאה לתפריט'),
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
  const calmsBase: CalmKind[] = ['breath', 'slide', 'heart'];
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
    boiled === 0 && noticed === 3 ? 'ערב של שקט' : boiled === 0 ? 'עברתם את הערב בלי לרתוח' : boiled === 3 ? 'ערב סוער' : 'ערב עם עליות ומורדות';
  const icon = (r: RoundResult) => ({ noticed: '✋', forced: '♨', finished: '✓', boiled: '💥' })[r.outcome];
  const outcomeText = (r: RoundResult) =>
    ({ noticed: `עצירה ב־${ltr(`${r.pauseC}°`)}`, forced: 'הקומקום שרק', finished: 'משימה הושלמה', boiled: 'רתיחה' })[r.outcome];
  const screen = h(
    'section',
    { class: 'screen night' },
    h('div', { class: 'night-sky', 'aria-hidden': 'true' }, ...Array.from({ length: 28 }, (_, i) => h('i', { style: { left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, animationDelay: `${(i % 7) * 0.4}s` } }))),
    h('div', { class: 'night-clock' }, '20:30'),
    h('p', { class: 'night-kicker' }, 'הילדים ישנים'),
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
      h('div', {}, h('b', {}, `${noticed}/3`), h('span', {}, 'עצירות בזמן')),
      h('div', {}, h('b', {}, `${best}/3`), h('span', {}, 'תגובות רגועות')),
      h('div', {}, h('b', {}, ltr(`+${total}`)), h('span', {}, 'נקודות זן')),
    ),
    h(
      'div',
      { class: 'home-actions' },
      h('button', { class: 'btn', type: 'button', onclick: island }, 'לבנות באי השקט'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => void evening() }, 'ערב נוסף'),
    ),
    h('button', { class: 'link', type: 'button', onclick: home }, 'לתפריט'),
  );
  app.append(screen);
  audio.bell(0, 0.8);
  setTimeout(() => audio.bell(4, 0.6), 400);
  const r = screen.querySelector('.night-title')!.getBoundingClientRect();
  if (boiled === 0) fx.confetti(r.left + r.width / 2, r.top, 40, ['#ffd447', '#fff3c4', '#b983ff', '#8ecfd0']);
}

home();

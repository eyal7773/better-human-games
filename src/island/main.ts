import '../shared/base.css';
import './styles.css';
import { h, ltr, Scope, reducedMotion } from '../shared/dom';
import { isRTL, tr } from '../shared/i18n';
import { AudioEngine } from '../shared/audio';
import { FX } from '../shared/fx';
import { vibrate } from '../shared/haptics';
import { realPause, refreshWallet, refundZen, spendZen, todayKey, wallet } from '../shared/zen';
import { CATEGORIES, def, ITEMS, type Category, type ItemDef } from './catalog';
import { at, canOwnMore, findSpot, nextExpansion, ownedCount, refusal, type Placed, type Refusal } from './economy';
import { footprint, cellsOf, landBounds, iso, START_SIZE } from './iso';
import { daylight, Scene, type Ghost, type View } from './render';
import { loadIsland, saveIsland } from './save';
import { thumb } from './thumbs';
import { pebbleSVG } from '../boiling-point/art';

/**
 * The Calm Islands page. Phase one: the Garden of Calm on an isometric grid,
 * with a build mode (buy, place, move, flip, store, undo) and land expansions.
 */

const ISLE = 'garden';
const save = loadIsland(def);
const persist = () => {
  saveIsland(save);
  view.rev++;
};

const T = {
  title: tr({ en: 'Calm Islands', he: 'איי השקט', ar: 'جزر السكينة' }),
  garden: tr({ en: 'Garden of Calm', he: 'גן השקט', ar: 'حديقة السكينة' }),
  back: tr({ en: 'Back to the game', he: 'חזרה למשחק', ar: 'العودة إلى اللعبة' }),
  home: tr({ en: 'All games', he: 'לכל המשחקים', ar: 'كل الألعاب' }),
  zen: (n: number) => tr({ en: `${n} zen points`, he: `${n} נקודות זן`, ar: `${n} نقطة سكينة` }),
  build: tr({ en: '🔨 Build', he: '🔨 לבנות', ar: '🔨 ابنوا' }),
  done: tr({ en: 'Done', he: 'סיימתי', ar: 'انتهيت' }),
  undo: tr({ en: '↶ Undo', he: '↶ ביטול', ar: '↶ تراجع' }),
  place: tr({ en: 'Put it here', he: 'לשים כאן', ar: 'ضعوه هنا' }),
  cancel: tr({ en: 'Cancel', he: 'ביטול', ar: 'إلغاء' }),
  flip: tr({ en: 'Turn', he: 'היפוך', ar: 'تدوير' }),
  move: tr({ en: 'Move', he: 'הזזה', ar: 'نقل' }),
  store: tr({ en: 'Put away', he: 'למחסן', ar: 'إلى المخزن' }),
  land: tr({ en: 'Land', he: 'שטח', ar: 'أرض' }),
  pick: tr({
    en: 'Choose something to add. Tap anything on the island to move it or put it away.',
    he: 'בחרו מה להוסיף. לחיצה על משהו באי מאפשרת להזיז אותו או להעביר למחסן.',
    ar: 'اختاروا ما تضيفونه. اضغطوا على أي شيء في الجزيرة لنقله أو وضعه في المخزن.',
  }),
  soon: tr({
    en: 'Coming soon: more islands, which open as you play the other games.',
    he: 'בקרוב: עוד איים, שנפתחים כשמשחקים במשחקים האחרים.',
    ar: 'قريبًا: جزر أخرى تُفتح عندما تلعبون الألعاب الأخرى.',
  }),
  realPause: tr({ en: 'I paused at home today too (+25)', he: 'עצרתי גם בבית היום (+25)', ar: 'توقفت في البيت اليوم أيضًا (+25)' }),
  realDone: tr({ en: 'Logged for today ✓', he: 'נרשם להיום ✓', ar: 'سُجّل لليوم ✓' }),
  realThanks: tr({ en: 'That’s the real practice. Well done.', he: 'זה האימון האמיתי. כל הכבוד.', ar: 'هذا هو التمرين الحقيقي. أحسنتم.' }),
  empty: tr({
    en: 'Every calm moment in the games earns zen points — and you build with them here. Tap “Build” to start.',
    he: 'כל רגע של שקט במשחקים שווה נקודות זן — ובהן בונים כאן. לחצו על "לבנות" כדי להתחיל.',
    ar: 'كل لحظة هدوء في الألعاب تساوي نقاط سكينة — وبها تبنون هنا. اضغطوا «ابنوا» لتبدأوا.',
  }),
  welcome: tr({ en: 'Welcome back to your garden.', he: 'ברוכים השבים לגן שלכם.', ar: 'أهلًا بعودتكم إلى حديقتكم.' }),
  short: (n: number) =>
    tr({
      en: `${n} more zen points needed. One more calm evening and it’s yours.`,
      he: `חסרות ${n} נקודות זן. עוד ערב רגוע אחד וזה שלכם.`,
      ar: `ينقصكم ${n} نقطة سكينة. مساء هادئ واحد آخر ويصبح لكم.`,
    }),
  full: (name: string) => tr({ en: `You have all the ${name} there can be.`, he: `יש לכם כבר את כל ה${name} האפשריים.`, ar: `لديكم كل ما يمكن من ${name}.` }),
  added: (name: string) => tr({ en: `${name} added to the island.`, he: `${name} נוסף לאי.`, ar: `أُضيف ${name} إلى الجزيرة.` }),
  stored: (name: string) => tr({ en: `${name} is in the shed. Bringing it back is free.`, he: `${name} במחסן. להחזיר אותו לא עולה כלום.`, ar: `${name} في المخزن. إعادته مجانية.` }),
  inShed: (n: number) => tr({ en: `${n} in the shed`, he: `${n} במחסן`, ar: `${n} في المخزن` }),
  owned: tr({ en: 'On the island', he: 'כבר באי', ar: 'في الجزيرة' }),
  noRoom: tr({
    en: 'There’s no free spot for it. You can make the island bigger, or put something in the shed.',
    he: 'אין לזה מקום פנוי. אפשר להגדיל את האי או להעביר משהו למחסן.',
    ar: 'لا يوجد مكان فارغ له. يمكنكم توسيع الجزيرة أو وضع شيء في المخزن.',
  }),
  needStream: tr({
    en: 'A bridge goes over a stream. Lay a stream first (Water & paths), then put the bridge on it.',
    he: 'גשר עומד מעל נחל. קודם סוללים נחל (מים ושבילים), ואז שמים עליו גשר.',
    ar: 'الجسر يُوضع فوق جدول. ارصفوا جدولًا أولًا (ماء وممرات)، ثم ضعوا الجسر عليه.',
  }),
  paint: (name: string) => tr({ en: `Drag your finger over the island to lay ${name}.`, he: `גררו את האצבע על האי כדי להניח ${name}.`, ar: `اسحبوا إصبعكم على الجزيرة لوضع ${name}.` }),
  drag: tr({ en: 'Drag it to where you like, then tap ✓.', he: 'גררו למקום שתרצו ולחצו ✓.', ar: 'اسحبوه إلى حيث تريدون، ثم اضغطوا ✓.' }),
  grow: (size: number) => tr({ en: `Make the island ${size}×${size}`, he: `להגדיל את האי ל־${ltr(`${size}×${size}`)}`, ar: `توسيع الجزيرة إلى ${ltr(`${size}×${size}`)}` }),
  growDesc: tr({ en: 'A new ring of land all around', he: 'טבעת חדשה של אדמה מסביב', ar: 'حلقة أرض جديدة حول الجزيرة' }),
  grown: tr({ en: 'The island grew. More room to build.', he: 'האי גדל. יש עוד מקום לבנות.', ar: 'كبرت الجزيرة. مساحة أكبر للبناء.' }),
  maxLand: tr({ en: 'The island is as big as it gets.', he: 'האי בגודל המלא.', ar: 'الجزيرة بأكبر حجم لها.' }),
  bridgeOnWater: tr({ en: 'Move the bridge off it first.', he: 'קודם מזיזים את הגשר שעליו.', ar: 'انقلوا الجسر عنه أولًا.' }),
  clock: { auto: tr({ en: 'Time: like outside', he: 'שעה: כמו בחוץ', ar: 'الوقت: كما في الخارج' }), day: tr({ en: 'Time: always day', he: 'שעה: תמיד יום', ar: 'الوقت: نهار دائمًا' }), night: tr({ en: 'Time: always night', he: 'שעה: תמיד לילה', ar: 'الوقت: ليل دائمًا' }) },
  soundOn: tr({ en: 'Sound on', he: 'הפעלת צליל', ar: 'تشغيل الصوت' }),
  mute: tr({ en: 'Mute', he: 'השתקה', ar: 'كتم الصوت' }),
  skip: tr({ en: 'Skip', he: 'דלגו', ar: 'تخطّوا' }),
  next: tr({ en: 'Next', he: 'הבא', ar: 'التالي' }),
  guide: [
    tr({ en: 'This is your zen. You earn it by staying calm in the games — and build with it here.', he: 'זה הזן שלכם. מרוויחים אותו כשנשארים רגועים במשחקים — ובונים איתו כאן.', ar: 'هذه سكينتكم. تكسبونها حين تبقون هادئين في الألعاب — وتبنون بها هنا.' }),
    tr({ en: 'Tap “Build” and choose something.', he: 'לחצו על "לבנות" ובחרו משהו.', ar: 'اضغطوا «ابنوا» واختاروا شيئًا.' }),
    tr({ en: 'Drag it to where you like, then tap ✓.', he: 'גררו אותו למקום שתרצו ולחצו ✓.', ar: 'اسحبوه إلى حيث تريدون، ثم اضغطوا ✓.' }),
  ],
};

const REFUSAL: Record<Refusal, string> = {
  land: tr({ en: 'That’s off the island.', he: 'זה מחוץ לאי.', ar: 'هذا خارج الجزيرة.' }),
  taken: tr({ en: 'Something is already there.', he: 'יש שם כבר משהו.', ar: 'يوجد شيء هناك.' }),
  under: tr({ en: 'Something is standing there.', he: 'משהו עומד שם.', ar: 'يقف شيء هناك.' }),
  water: tr({ en: 'Not on the water.', he: 'לא על המים.', ar: 'ليس على الماء.' }),
  'needs-water': tr({ en: 'A bridge goes over a stream.', he: 'גשר עומד רק מעל נחל.', ar: 'الجسر يوضع فوق جدول فقط.' }),
  edge: tr({ en: 'It goes on the front edge of the island.', he: 'הוא עומד על הקצה הקדמי של האי.', ar: 'يوضع على الحافة الأمامية للجزيرة.' }),
};

const ICON = {
  back: `<svg viewBox="0 0 24 24"><path d="${isRTL ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  muted: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
};

// ---------------------------------------------------------------- page

document.title = T.title;
const from = new URLSearchParams(location.search).get('from');
const backHref = from && /^[a-z0-9-]+$/.test(from) ? `${import.meta.env.BASE_URL}${from}/` : import.meta.env.BASE_URL;

const app = document.getElementById('app')!;
const audio = new AudioEngine(save.muted);
const fx = new FX(document.body);
const scope = new Scope();

const canvas = h('canvas', { class: 'isl-canvas', 'aria-hidden': 'true' });
const scene = new Scene(canvas);
const zenNum = h('b', {}, String(wallet.zen));
const zenPill = h('div', { class: 'isl-zen', role: 'status', html: pebbleSVG('pebble') }, zenNum);
const clockBtn = h('button', { class: 'icon-btn isl-clock', type: 'button' });
const soundBtn = h('button', { class: 'icon-btn', type: 'button' });
const top = h(
  'header',
  { class: 'isl-top' },
  h('a', { class: 'icon-btn', href: backHref, 'aria-label': from ? T.back : T.home, html: from ? ICON.back : ICON.home }),
  h('div', { class: 'isl-name' }, h('small', {}, T.title), h('span', {}, T.garden)),
  zenPill,
  clockBtn,
  soundBtn,
);
const note = h('p', { class: 'isl-note', 'aria-live': 'polite' });
const buildBtn = h('button', { class: 'btn warm isl-build', type: 'button' }, T.build);
const realBtn = h('button', { class: 'isl-real', type: 'button' });
const viewBar = h('div', { class: 'isl-panel isl-view' }, note, h('div', { class: 'isl-actions' }, buildBtn, realBtn), h('p', { class: 'isl-soon' }, T.soon));

const tabs = h('div', { class: 'isl-tabs', role: 'tablist' });
const cards = h('div', { class: 'isl-cards' });
const undoBtn = h('button', { class: 'btn ghost isl-undo', type: 'button' }, T.undo);
const doneBtn = h('button', { class: 'btn isl-done', type: 'button' }, T.done);
const sheetNote = h('p', { class: 'isl-note', 'aria-live': 'polite' });
const sheet = h('div', { class: 'isl-panel isl-sheet', hidden: true }, sheetNote, tabs, cards, h('div', { class: 'isl-foot' }, undoBtn, doneBtn));

const barName = h('div', { class: 'isl-bar-name' });
const barHint = h('p', { class: 'isl-bar-hint', 'aria-live': 'polite' });
const barBtns = h('div', { class: 'isl-bar-btns' });
const bar = h('div', { class: 'isl-panel isl-bar', hidden: true }, barName, barHint, barBtns);

const tip = h('div', { class: 'isl-tip', hidden: true, role: 'dialog' });
const screen = h('section', { class: 'isl' }, canvas, top, viewBar, sheet, bar, tip);
app.append(screen);

// ---------------------------------------------------------------- state

type Mode =
  | { k: 'view' }
  | { k: 'build' }
  | { k: 'place'; def: ItemDef; x: number; y: number; flip: boolean; fromStore: boolean; moving?: { p: Placed; x: number; y: number; flip: boolean } }
  | { k: 'paint'; def: ItemDef; cells: { x: number; y: number }[] }
  | { k: 'select'; p: Placed };

type Undo =
  | { k: 'buy'; p: Placed; cost: number; fromStore: boolean }
  | { k: 'paint'; ps: Placed[]; cost: number; fromStore: number; replaced: Placed[] }
  | { k: 'move'; p: Placed; x: number; y: number; flip: boolean }
  | { k: 'store'; p: Placed };

let mode: Mode = { k: 'view' };
let tab: Category | 'land' = 'plants';
let undo: Undo[] = [];
const view: View = { rev: 0, state: save, isle: ISLE, growth: wallet.growth, daylight: daylight(12), build: false, born: new Map(), poke: new Map() };

const stored = (id: string) => save.stored[id] ?? 0;
const unstore = (id: string, n = 1) => {
  save.stored[id] = stored(id) - n;
  if (save.stored[id] <= 0) delete save.stored[id];
};

function say(text: string, el = mode.k === 'view' ? note : mode.k === 'build' ? sheetNote : barHint) {
  el.textContent = text;
}

function paintZen(bump = false) {
  zenNum.textContent = String(wallet.zen);
  zenPill.setAttribute('aria-label', T.zen(wallet.zen));
  if (bump && !reducedMotion()) zenPill.animate([{ transform: 'scale(1.18)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
}

function paintSound() {
  soundBtn.innerHTML = save.muted ? ICON.muted : ICON.sound;
  soundBtn.setAttribute('aria-label', save.muted ? T.soundOn : T.mute);
}

function paintClock() {
  clockBtn.textContent = { auto: '🕒', day: '☀️', night: '🌙' }[save.clock];
  clockBtn.setAttribute('aria-label', T.clock[save.clock]);
  clockBtn.title = T.clock[save.clock];
}

function paintReal() {
  const done = wallet.realPauseDay === todayKey();
  realBtn.disabled = done;
  realBtn.textContent = done ? T.realDone : T.realPause;
}

// ---------------------------------------------------------------- layout

function insets() {
  const topH = top.getBoundingClientRect().bottom;
  const panel = [viewBar, sheet, bar].find((p) => !p.hidden);
  const bottom = panel ? scene.h - panel.getBoundingClientRect().top : 0;
  return { top: topH + 8, bottom: bottom + 8 };
}

function refit() {
  scene.resize();
  const i = insets();
  scene.fit(save.land[ISLE] ?? 0, i.top, i.bottom);
}

// ---------------------------------------------------------------- modes

function setMode(m: Mode) {
  mode = m;
  view.rev++;
  view.build = m.k !== 'view';
  viewBar.hidden = m.k !== 'view';
  sheet.hidden = m.k !== 'build';
  bar.hidden = !(m.k === 'place' || m.k === 'paint' || m.k === 'select');
  view.selected = m.k === 'select' ? m.p : null;
  updateGhost();
  if (m.k === 'build') {
    sheetNote.textContent = T.pick;
    renderSheet();
  }
  if (m.k === 'place' || m.k === 'paint' || m.k === 'select') renderBar();
  if (m.k === 'view') {
    undo = [];
    note.textContent = save.placed.some((p) => p.isle === ISLE) ? T.welcome : T.empty;
  }
  requestAnimationFrame(refit);
}

function updateGhost() {
  if (mode.k === 'place') {
    const f = footprint(mode.def, mode.flip);
    const why = refusal(save, def, mode.def, ISLE, mode.x, mode.y, mode.flip);
    view.ghost = { def: mode.def, x: mode.x, y: mode.y, flip: mode.flip, ok: !why, cells: cellsOf(mode.x, mode.y, f.w, f.d).map(([x, y]) => ({ x, y })) };
    return why;
  }
  if (mode.k === 'paint') {
    view.ghost = { def: mode.def, x: 0, y: 0, flip: false, ok: true, cells: mode.cells, brush: true } satisfies Ghost;
    return null;
  }
  view.ghost = null;
  return null;
}

function renderSheet() {
  tabs.replaceChildren(
    ...[...CATEGORIES.map((c) => ({ id: c.id as Category | 'land', label: `${c.icon} ${c.label}` })), { id: 'land' as const, label: `🏝️ ${T.land}` }].map((c) => {
      const b = h('button', { class: `isl-tab${c.id === tab ? ' on' : ''}`, type: 'button', role: 'tab', 'aria-selected': String(c.id === tab) }, c.label);
      b.addEventListener('click', () => {
        tab = c.id;
        renderSheet();
      });
      return b;
    }),
  );
  undoBtn.hidden = !undo.length;
  if (tab === 'land') {
    const cost = nextExpansion(save, ISLE);
    const size = START_SIZE + 2 * ((save.land[ISLE] ?? 0) + 1);
    const card = h(
      'button',
      { class: `isl-card isl-card-land${cost == null ? ' full' : wallet.zen < (cost ?? 0) ? ' poor' : ''}`, type: 'button' },
      h('span', { class: 'isl-card-art', 'aria-hidden': 'true' }, '🏝️'),
      h('span', { class: 'isl-card-name' }, cost == null ? T.maxLand : T.grow(size)),
      cost == null ? null : h('span', { class: 'isl-card-cost', html: pebbleSVG('pebble') }, String(cost)),
      h('span', { class: 'isl-card-desc' }, cost == null ? '' : T.growDesc),
    );
    card.addEventListener('click', () => expand(card));
    cards.replaceChildren(card);
    return;
  }
  cards.replaceChildren(
    ...ITEMS.filter((d) => d.isle === ISLE && d.cat === tab)
      .sort((a, b) => a.cost - b.cost)
      .map((d) => {
      const n = ownedCount(save, d.id);
      const full = !canOwnMore(save, d) && !stored(d.id);
      const free = stored(d.id) > 0;
      const card = h(
        'button',
        { class: `isl-card${full ? ' full' : !free && wallet.zen < d.cost ? ' poor' : ''}${d.icon ? ' icon' : ''}`, type: 'button' },
        thumb(d),
        h('span', { class: 'isl-card-name' }, d.name),
        h('span', { class: 'isl-card-desc' }, d.desc),
        h('span', { class: 'isl-card-cost' }, free ? T.inShed(stored(d.id)) : full ? T.owned : h('span', { html: pebbleSVG('pebble') }, String(d.cost))),
        d.cap !== Infinity && d.cap > 1 ? h('span', { class: 'isl-card-count' }, ltr(`${n}/${d.cap}`)) : null,
      );
      card.addEventListener('click', () => choose(d, card));
      return card;
    }),
  );
}

function renderBar() {
  barBtns.replaceChildren();
  const btn = (label: string, cls: string, fn: () => void) => {
    const b = h('button', { class: `btn ${cls}`, type: 'button' }, label);
    b.addEventListener('click', fn);
    barBtns.append(b);
    return b;
  };
  if (mode.k === 'place') {
    const m = mode;
    barName.textContent = `${m.def.name}${m.fromStore || m.moving ? '' : ` · ${m.def.cost}`}`;
    btn(T.cancel, 'ghost', cancelPlace);
    if (m.def.w !== m.def.d || m.def.id === 'waterfall' || m.def.id === 'bench')
      btn(T.flip, 'ghost', () => {
        m.flip = !m.flip;
        renderBar();
      });
    const why = updateGhost();
    const ok = btn(`✓ ${T.place}`, 'warm', confirmPlace);
    ok.disabled = !!why;
    barHint.textContent = why ? REFUSAL[why] : T.drag;
  } else if (mode.k === 'paint') {
    const m = mode;
    const cost = paintCost(m);
    barName.textContent = `${m.def.name} · ${ltr(`×${m.cells.length}`)}${cost ? ` · ${cost}` : ''}`;
    btn(T.cancel, 'ghost', () => setMode({ k: 'build' }));
    const ok = btn(`✓ ${T.place}`, 'warm', confirmPaint);
    ok.disabled = !m.cells.length;
    if (!barHint.textContent) barHint.textContent = T.paint(m.def.name);
  } else if (mode.k === 'select') {
    const p = mode.p;
    const d = def(p.id)!;
    barName.textContent = d.name;
    barHint.textContent = '';
    btn('✕', 'ghost', () => setMode({ k: 'build' }));
    if (d.kind === 'item') btn(T.move, 'ghost', () => startMove(p));
    if (d.kind === 'item' && d.w !== d.d) btn(T.flip, 'ghost', () => flipPlaced(p));
    btn(T.store, 'ghost', () => storePlaced(p));
  }
}

const paintCost = (m: Extract<Mode, { k: 'paint' }>) => Math.max(0, m.cells.length - stored(m.def.id)) * m.def.cost;

// ---------------------------------------------------------------- actions

function centreCell() {
  const { lo, hi } = landBounds(save.land[ISLE] ?? 0);
  const mid = Math.floor((lo + hi) / 2);
  return { x: mid, y: mid };
}

function choose(d: ItemDef, card: HTMLElement) {
  const free = stored(d.id) > 0;
  if (!free && !canOwnMore(save, d)) return say(T.full(d.name));
  if (!free && wallet.zen < d.cost) {
    audio.miss();
    if (!reducedMotion()) card.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 });
    return say(T.short(d.cost - wallet.zen));
  }
  if (d.kind === 'ambient') {
    if (!free && !spendZen(d.cost)) return;
    if (free) unstore(d.id);
    const p: Placed = { id: d.id, isle: ISLE, x: 0, y: 0, flip: false, at: wallet.growth };
    save.placed.push(p);
    persist();
    undo.push({ k: 'buy', p, cost: free ? 0 : d.cost, fromStore: free });
    celebrate(d, null);
    renderSheet();
    return;
  }
  if (d.brush) {
    barHint.textContent = '';
    return setMode({ k: 'paint', def: d, cells: [] });
  }
  const c = centreCell();
  const spot = findSpot(save, def, d, ISLE, c.x, c.y, false);
  if (!spot) return say(d.water === 'on' ? T.needStream : T.noRoom);
  setMode({ k: 'place', def: d, x: spot.x, y: spot.y, flip: false, fromStore: free });
  guideStep(2);
}

function confirmPlace() {
  if (mode.k !== 'place') return;
  const m = mode;
  if (refusal(save, def, m.def, ISLE, m.x, m.y, m.flip)) return;
  if (m.moving) {
    const p = m.moving.p;
    Object.assign(p, { x: m.x, y: m.y, flip: m.flip });
    save.placed.push(p);
    undo.push({ k: 'move', p, x: m.moving.x, y: m.moving.y, flip: m.moving.flip });
    persist();
    audio.pluck(3);
    vibrate(12);
    setMode({ k: 'build' });
    return;
  }
  if (!m.fromStore && !spendZen(m.def.cost)) return say(T.short(m.def.cost - wallet.zen));
  if (m.fromStore) unstore(m.def.id);
  const p: Placed = { id: m.def.id, isle: ISLE, x: m.x, y: m.y, flip: m.flip, at: wallet.growth };
  save.placed.push(p);
  persist();
  undo.push({ k: 'buy', p, cost: m.fromStore ? 0 : m.def.cost, fromStore: m.fromStore });
  view.born.set(p, performance.now());
  celebrate(m.def, p);
  guideDone();
  setMode({ k: 'build' });
}

function cancelPlace() {
  if (mode.k === 'place' && mode.moving) {
    const mv = mode.moving;
    Object.assign(mv.p, { x: mv.x, y: mv.y, flip: mv.flip });
    save.placed.push(mv.p);
  }
  setMode({ k: 'build' });
}

function confirmPaint() {
  if (mode.k !== 'paint' || !mode.cells.length) return;
  const m = mode;
  const cost = paintCost(m);
  if (cost && !spendZen(cost)) return say(T.short(cost - wallet.zen));
  const fromStore = Math.min(stored(m.def.id), m.cells.length);
  if (fromStore) unstore(m.def.id, fromStore);
  const replaced: Placed[] = [];
  const ps: Placed[] = [];
  for (const cell of m.cells) {
    const old = m.def.kind === 'ground' ? at(save, def, ISLE, cell.x, cell.y).ground : undefined;
    if (old) {
      save.placed.splice(save.placed.indexOf(old), 1);
      save.stored[old.id] = stored(old.id) + 1;
      replaced.push(old);
    }
    const p: Placed = { id: m.def.id, isle: ISLE, x: cell.x, y: cell.y, flip: false, at: wallet.growth };
    save.placed.push(p);
    ps.push(p);
  }
  persist();
  undo.push({ k: 'paint', ps, cost, fromStore, replaced });
  audio.pluck(5);
  vibrate(15);
  paintZen(true);
  setMode({ k: 'build' });
  say(T.added(m.def.name));
}

function startMove(p: Placed) {
  const d = def(p.id)!;
  save.placed.splice(save.placed.indexOf(p), 1);
  setMode({ k: 'place', def: d, x: p.x, y: p.y, flip: p.flip, fromStore: true, moving: { p, x: p.x, y: p.y, flip: p.flip } });
}

function flipPlaced(p: Placed) {
  const d = def(p.id)!;
  if (refusal(save, def, d, ISLE, p.x, p.y, !p.flip, p)) {
    // no room turned around here: pick it up and let them find a spot
    startMove(p);
    if (mode.k === 'place') {
      mode.flip = !mode.flip;
      renderBar();
    }
    return;
  }
  undo.push({ k: 'move', p, x: p.x, y: p.y, flip: p.flip });
  p.flip = !p.flip;
  persist();
  view.poke.set(p, performance.now());
  audio.pluck(2);
  renderBar();
}

function storePlaced(p: Placed) {
  const d = def(p.id)!;
  if (d.kind === 'ground' && at(save, def, ISLE, p.x, p.y).item) return say(T.bridgeOnWater, barHint);
  save.placed.splice(save.placed.indexOf(p), 1);
  save.stored[p.id] = stored(p.id) + 1;
  persist();
  undo.push({ k: 'store', p });
  if (p.id === 'chimes' && !save.placed.some((q) => q.id === 'chimes')) {
    // the chimes loop lives with the waves; restart the sea without it
    audio.stopExtras();
    startAmbience(true);
  }
  audio.pop();
  setMode({ k: 'build' });
  say(T.stored(d.name), sheetNote);
}

function undoLast() {
  const u = undo.pop();
  if (!u) return;
  const drop = (p: Placed) => {
    const i = save.placed.indexOf(p);
    if (i >= 0) save.placed.splice(i, 1);
  };
  if (u.k === 'buy') {
    drop(u.p);
    if (u.fromStore) save.stored[u.p.id] = stored(u.p.id) + 1;
    else refundZen(u.cost);
  } else if (u.k === 'paint') {
    u.ps.forEach(drop);
    if (u.fromStore) save.stored[u.ps[0].id] = stored(u.ps[0].id) + u.fromStore;
    for (const r of u.replaced) {
      unstore(r.id);
      save.placed.push(r);
    }
    if (u.cost) refundZen(u.cost);
  } else if (u.k === 'move') {
    Object.assign(u.p, { x: u.x, y: u.y, flip: u.flip });
  } else {
    unstore(u.p.id);
    save.placed.push(u.p);
  }
  persist();
  refreshWallet();
  paintZen();
  audio.pop();
  renderSheet();
}

function expand(card: HTMLElement) {
  const cost = nextExpansion(save, ISLE);
  if (cost == null) return say(T.maxLand, sheetNote);
  if (!spendZen(cost)) {
    audio.miss();
    if (!reducedMotion()) card.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 });
    return say(T.short(cost - wallet.zen), sheetNote);
  }
  save.land[ISLE] = (save.land[ISLE] ?? 0) + 1;
  persist();
  paintZen(true);
  audio.gong();
  vibrate([20, 40, 30]);
  refit();
  fx.confetti(scene.w / 2, scene.h * 0.4, 50);
  say(T.grown, sheetNote);
  renderSheet();
}

function celebrate(d: ItemDef, p: Placed | null) {
  paintZen(true);
  audio.bell(Math.floor(Math.random() * 5) * 2, 1);
  vibrate(20);
  if (d.id === 'chimes' && save.placed.filter((q) => q.id === 'chimes').length === 1) audio.startChimes();
  let x = scene.w / 2;
  let y = scene.h * 0.4;
  if (p) {
    const f = footprint(d, p.flip);
    const a = scene.toScreen(iso(p.x + f.w / 2, p.y + f.d / 2).x, iso(p.x + f.w / 2, p.y + f.d / 2).y - d.h / 2);
    x = a.x;
    y = a.y;
  }
  fx.confetti(x, y, d.icon ? 60 : 22);
  say(T.added(d.name), sheetNote);
}

function poke(p: Placed) {
  const d = def(p.id)!;
  view.poke.set(p, performance.now());
  const r = () => Math.floor(Math.random() * 5);
  switch (d.sound) {
    case 'bell':
      audio.bell(r() * 2, 0.7);
      break;
    case 'chime':
      for (let i = 0; i < 3; i++) setTimeout(() => audio.bell(4 + r() * 2, 0.4), i * 140);
      break;
    case 'splash':
      audio.whoosh();
      break;
    case 'wood':
      audio.tick(true);
      break;
    case 'stone':
      audio.pluck(0);
      break;
    default:
      audio.pluck(2 + r());
  }
  vibrate(8);
}

// ---------------------------------------------------------------- pointer

const pointers = new Map<number, { x: number; y: number }>();
let gesture: { kind: 'pan' | 'drag' | 'paint' | 'pinch'; sx: number; sy: number; cx: number; cy: number; moved: boolean; dist?: number; zoom?: number; last?: { x: number; y: number } } | null = null;

function local(e: PointerEvent) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function paintAt(x: number, y: number) {
  if (mode.k !== 'paint') return;
  const c = scene.cellAt(x, y);
  if (mode.cells.some((q) => q.x === c.x && q.y === c.y)) return;
  const why = refusal(save, def, mode.def, ISLE, c.x, c.y, false);
  if (why) {
    if (why !== 'taken') barHint.textContent = REFUSAL[why];
    return;
  }
  const next = { ...mode, cells: [...mode.cells, c] };
  if (paintCost(next) > wallet.zen) {
    barHint.textContent = T.short(paintCost(next) - wallet.zen);
    return;
  }
  mode.cells.push(c);
  barHint.textContent = '';
  audio.tick();
  renderBar();
}

canvas.addEventListener('pointerdown', (e) => {
  audio.unlock();
  startAmbience();
  canvas.setPointerCapture(e.pointerId);
  const p = local(e);
  pointers.set(e.pointerId, p);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    gesture = { kind: 'pinch', sx: 0, sy: 0, cx: scene.cam.x, cy: scene.cam.y, moved: true, dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: scene.cam.zoom };
    return;
  }
  const kind = mode.k === 'place' ? 'drag' : mode.k === 'paint' ? 'paint' : 'pan';
  gesture = { kind, sx: p.x, sy: p.y, cx: scene.cam.x, cy: scene.cam.y, moved: false };
  if (kind === 'paint') paintAt(p.x, p.y);
});

canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId) || !gesture) return;
  const p = local(e);
  pointers.set(e.pointerId, p);
  if (gesture.kind === 'pinch' && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    scene.cam.zoom = Math.min(3, Math.max(0.35, (gesture.zoom! * d) / gesture.dist!));
    return;
  }
  if (Math.hypot(p.x - gesture.sx, p.y - gesture.sy) > 8) gesture.moved = true;
  if (gesture.kind === 'pan' && gesture.moved) {
    scene.cam.x = gesture.cx - (p.x - gesture.sx) / scene.cam.zoom;
    scene.cam.y = gesture.cy - (p.y - gesture.sy) / scene.cam.zoom;
  } else if (gesture.kind === 'drag' && mode.k === 'place') {
    // Keep the item a little above the finger so it stays visible.
    const c = scene.cellAt(p.x, p.y - 24);
    const f = footprint(mode.def, mode.flip);
    const x = c.x - Math.floor((f.w - 1) / 2);
    const y = c.y - Math.floor((f.d - 1) / 2);
    if (x !== mode.x || y !== mode.y) {
      mode.x = x;
      mode.y = y;
      audio.tick();
      renderBar();
    }
  } else if (gesture.kind === 'paint') {
    // fill in between pointer events so a fast stroke leaves no gaps
    const from = gesture.last ?? { x: gesture.sx, y: gesture.sy };
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / 6));
    for (let k = 1; k <= steps; k++) paintAt(from.x + ((p.x - from.x) * k) / steps, from.y + ((p.y - from.y) * k) / steps);
    gesture.last = p;
  }
});

function pointerEnd(e: PointerEvent) {
  if (!pointers.delete(e.pointerId)) return;
  const g = gesture;
  if (pointers.size) return;
  gesture = null;
  if (!g || g.moved || g.kind === 'pinch') return;
  const p = local(e);
  if (g.kind === 'drag' && mode.k === 'place') {
    const c = scene.cellAt(p.x, p.y);
    const f = footprint(mode.def, mode.flip);
    mode.x = c.x - Math.floor((f.w - 1) / 2);
    mode.y = c.y - Math.floor((f.d - 1) / 2);
    renderBar();
    return;
  }
  if (g.kind !== 'pan') return;
  const hit = scene.hit(view, p.x, p.y);
  if (mode.k === 'view' && hit && def(hit.id)!.kind === 'item') poke(hit);
  else if (mode.k === 'build' || mode.k === 'select') {
    if (hit) {
      view.poke.set(hit, performance.now());
      audio.pluck(4);
      setMode({ k: 'select', p: hit });
    } else if (mode.k === 'select') setMode({ k: 'build' });
  }
}
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', pointerEnd);
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    scene.cam.zoom = Math.min(3, Math.max(0.35, scene.cam.zoom * Math.exp(-e.deltaY * 0.0015)));
  },
  { passive: false },
);

// ---------------------------------------------------------------- guide

function showTip(i: number, target: HTMLElement) {
  const r = target.getBoundingClientRect();
  tip.hidden = false;
  tip.replaceChildren(
    h('p', {}, T.guide[i]),
    h(
      'div',
      { class: 'isl-tip-btns' },
      h('button', { class: 'link', type: 'button', onclick: guideDone }, T.skip),
      i === 0 ? h('button', { class: 'btn', type: 'button', onclick: () => guideStep(1) }, T.next) : null,
    ),
  );
  const below = r.top < scene.h / 2;
  tip.classList.toggle('below', below);
  const x = Math.min(scene.w - 150, Math.max(150, r.left + r.width / 2));
  tip.style.left = `${x}px`;
  tip.style.top = below ? `${r.bottom + 14}px` : '';
  tip.style.bottom = below ? '' : `${scene.h - r.top + 14}px`;
  tip.style.setProperty('--arrow', `${r.left + r.width / 2 - x}px`);
}

let guide = save.guided ? -1 : 0;
function guideStep(i: number) {
  if (guide < 0 || i < guide) return;
  guide = i;
  if (i === 0) showTip(0, zenPill);
  else if (i === 1) showTip(1, buildBtn);
  // wait for the bar to finish sliding up before measuring it
  else if (i === 2) setTimeout(() => guide === 2 && showTip(2, bar), 320);
}
function guideDone() {
  guide = -1;
  tip.hidden = true;
  if (!save.guided) {
    save.guided = true;
    persist();
  }
}

// ---------------------------------------------------------------- wiring

let ambience = false;
function startAmbience(force = false) {
  if ((ambience && !force) || save.muted || !audio.ctx) return;
  ambience = true;
  audio.startPad('island');
  audio.startWaves();
  if (save.placed.some((p) => p.id === 'chimes')) audio.startChimes();
}

buildBtn.addEventListener('click', () => {
  audio.unlock();
  startAmbience();
  setMode({ k: 'build' });
  if (guide === 1) tip.hidden = true;
});
doneBtn.addEventListener('click', () => setMode({ k: 'view' }));
undoBtn.addEventListener('click', undoLast);
realBtn.addEventListener('click', () => {
  const z = realPause();
  if (!z) return paintReal();
  audio.success();
  const r = realBtn.getBoundingClientRect();
  fx.confetti(r.left + r.width / 2, r.top, 30);
  say(T.realThanks, note);
  paintZen(true);
  paintReal();
});
soundBtn.addEventListener('click', () => {
  save.muted = !save.muted;
  persist();
  audio.setMuted(save.muted);
  if (save.muted) {
    audio.stopPad();
    audio.stopExtras();
    ambience = false;
  } else {
    audio.unlock();
    startAmbience();
  }
  paintSound();
});
clockBtn.addEventListener('click', () => {
  save.clock = save.clock === 'auto' ? 'day' : save.clock === 'day' ? 'night' : 'auto';
  persist();
  paintClock();
  say(T.clock[save.clock]);
});
document.addEventListener('visibilitychange', () => {
  audio.setBackground(document.hidden);
  if (!document.hidden) {
    refreshWallet();
    view.growth = wallet.growth;
    paintZen();
    paintReal();
  }
});
scope.on(window, 'resize', refit);

paintZen();
paintSound();
paintClock();
paintReal();
setMode({ k: 'view' });
refit();
if (guide === 0) setTimeout(() => guideStep(0), 600);

const hourNow = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};
let t = 0;
scope.loop((dt) => {
  t += dt;
  view.daylight = daylight(save.clock === 'day' ? 12 : save.clock === 'night' ? 23 : hourNow());
  screen.classList.toggle('dark', view.daylight.dark > 0.5);
  scene.draw(view, reducedMotion() ? 0 : t);
});

// for tests and tuning
(window as unknown as { __isl: unknown }).__isl = { save, wallet, view, scene, setMode: (k: string) => setMode({ k } as Mode), landBounds };

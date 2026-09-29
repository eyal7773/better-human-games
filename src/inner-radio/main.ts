// The shell first, so each game's styles come after (and win over) the shared ones.
import { Shell } from '../shared/shell';
import './styles.css';
import { h, clamp, pick, rand, reducedMotion, Scope } from '../shared/dom';
import { tr } from '../shared/i18n';
import { vibrate } from '../shared/haptics';
import { faceSVG, setFaceMood } from '../shared/face';
import { ANCHOR } from '../shared/anchors';
import { discover } from '../shared/progress';
import {
  EMOTIONS,
  LOCK,
  LOCK_MS,
  STRONG,
  clarity,
  hasBlame,
  lockable,
  moodOf,
  placeStations,
  stationAt,
  starsFor,
  type Emotion,
  type Station,
  type Tile,
  type Tone,
} from './logic';
import { EMOTION, OPENERS, SCENES, feelingText, type Scene } from './content';
import { RadioSound } from './sound';

/**
 * Inner Radio: anger is loud static; under it a feeling is broadcasting.
 * Turn the knob until a tune comes through, hold steady to lock it, then
 * edit the angry sentence on the tip of your tongue into a direct one.
 */

const T = {
  title: tr({ en: 'Inner Radio', he: 'רדיו פנימי', ar: 'الراديو الداخلي' }),
  lede: tr({
    en: 'Anger is loud static. Underneath it, a feeling is broadcasting. Tune in, find it — and say it straight.',
    he: 'הכעס הוא רעש סטטי חזק. מתחתיו משדר רגש. כוונו, מצאו אותו — ואמרו אותו ישר.',
    ar: 'الغضب تشويش عالٍ. تحته يبثّ شعور. اضبطوا الموجة، جدوه — وقولوه مباشرة.',
  }),
  album: tr({ en: '📻 Stations I found', he: '📻 תחנות שגיליתי', ar: '📻 محطات اكتشفتها' }),
  free: tr({ en: '🎲 Free radio', he: '🎲 רדיו חופשי', ar: '🎲 راديو حر' }),
  freeLocked: tr({ en: 'Opens after level 8', he: 'נפתח אחרי שלב 8', ar: 'تُفتح بعد المرحلة 8' }),
  tuneIn: tr({ en: 'Tune in', he: 'לכוונן', ar: 'اضبطوا الموجة' }),
  knob: tr({ en: 'Tuning knob', he: 'חוגת כוונון', ar: 'زر الضبط' }),
  hintTurn: tr({
    en: 'Turn the knob. Listen for a tune under the static.',
    he: 'סובבו את החוגה. הקשיבו למנגינה מתחת לרעש.',
    ar: 'أديروا الزر. أنصتوا إلى لحن تحت التشويش.',
  }),
  hintHold: tr({ en: 'There! Hold steady…', he: 'שם! להחזיק יציב...', ar: 'هناك! اثبتوا...' }),
  faint: tr({ en: 'Faint here… keep looking.', he: 'חלש כאן... ממשיכים לחפש.', ar: 'ضعيف هنا... واصلوا البحث.' }),
  strong: (n: string) => tr({ en: `${n}: that’s the loud signal here.`, he: `${n}: זה האות החזק כאן.`, ar: `${n}: هذه هي الإشارة القوية هنا.` }),
  alsoThere: (n: string) => tr({ en: `${n}: that’s there too.`, he: `${n}: גם זה נמצא שם.`, ar: `${n}: هذا موجود أيضًا.` }),
  another: tr({
    en: 'There’s another strong signal under this one…',
    he: 'יש עוד אות חזק מתחת לזה...',
    ar: 'هناك إشارة قوية أخرى تحت هذه...',
  }),
  louder: tr({
    en: 'There’s a louder signal somewhere on the dial.',
    he: 'יש אות חזק יותר איפשהו על הפס.',
    ar: 'هناك إشارة أقوى في مكان ما على الموجة.',
  }),
  keep: tr({ en: 'Keep tuning', he: 'להמשיך לכוונן', ar: 'واصلوا الضبط' }),
  enough: tr({ en: 'Go with this', he: 'ללכת עם זה', ar: 'لنكمل بهذا' }),
  under: tr({
    en: 'Anger is loud because something under it matters. It’s the alarm, not the problem.',
    he: 'הכעס רועש כי משהו מתחתיו חשוב. הוא האזעקה, לא הבעיה.',
    ar: 'الغضب عالٍ لأن شيئًا تحته مهمّ. إنه جرس الإنذار، لا المشكلة.',
  }),
  edit: tr({
    en: 'This is what’s on the tip of your tongue. Swap the parts until it says what you feel.',
    he: 'זה מה שעומד לצאת לכם מהפה. החליפו חלקים עד שזה אומר מה שאתם מרגישים.',
    ar: 'هذا ما على طرف لسانكم. بدّلوا الأجزاء حتى تقول ما تشعرون به.',
  }),
  rows: [
    tr({ en: 'Start', he: 'פתיחה', ar: 'البداية' }),
    tr({ en: 'When…', he: 'כש...', ar: 'عندما...' }),
    tr({ en: 'Because…', he: 'כי...', ar: 'لأن...' }),
  ],
  say: tr({ en: '🗣️ Say it', he: '🗣️ לומר את זה', ar: '🗣️ قولوها' }),
  retry: tr({
    en: 'Ouch — that landed as blame. Swap the prickly parts and try again.',
    he: 'אאוץ׳ — זה נחת כהאשמה. החליפו את החלקים הדוקרניים ונסו שוב.',
    ar: 'آخ — وصلت كاتّهام. بدّلوا الأجزاء الشائكة وحاولوا مجددًا.',
  }),
  vague: tr({
    en: 'It landed. Clear words land even better.',
    he: 'זה נחת. מילים ברורות נוחתות עוד יותר טוב.',
    ar: 'وصلت. والكلمات الواضحة تصل أفضل.',
  }),
  meh: tr({ en: 'Mm… okay. I think I get it.', he: 'אממ... אוקיי. נראה לי שהבנתי.', ar: 'امم... حسنًا. أظن أنني فهمت.' }),
  doneTitle: tr({ en: 'Said it straight', he: 'אמרתם את זה ישר', ar: 'قلتموها مباشرة' }),
  stars: [
    tr({ en: 'Tuned in and said it', he: 'כיוונתם ואמרתם', ar: 'ضبطتم الموجة وقلتموها' }),
    tr({ en: 'Found every loud signal', he: 'מצאתם את האות החזק', ar: 'وجدتم الإشارة القوية' }),
    tr({ en: 'No blame on the first try', he: 'בלי האשמה כבר בפעם הראשונה', ar: 'بلا اتهام من المحاولة الأولى' }),
  ],
  albumEmpty: tr({ en: 'Not found yet', he: 'עוד לא נמצאה', ar: 'لم تُكتشف بعد' }),
  albumTap: tr({ en: 'Tap a station to hear its tune.', he: 'הקישו על תחנה כדי לשמוע את המנגינה שלה.', ar: 'اضغطوا على محطة لتسمعوا لحنها.' }),
  static: tr({ en: 'static', he: 'רעש', ar: 'تشويش' }),
};

const KEY = 'bhg.inner-radio.v1';
const shell = new Shell(KEY, T.title, 'ir-theme');
const sound = new RadioSound(shell.audio);
const LEVELS = SCENES.map((s) => ({ id: s.id, name: s.name }));

const radioArt = () =>
  h('div', {
    class: 'ir-art',
    html: `<svg viewBox="0 0 200 130" aria-hidden="true"><rect x="10" y="22" width="180" height="100" rx="22" fill="#c8743a" stroke="#1d2b4f" stroke-width="4"/>
    <line x1="60" y1="22" x2="40" y2="2" stroke="#1d2b4f" stroke-width="4" stroke-linecap="round"/>
    <rect x="26" y="38" width="88" height="30" rx="8" fill="#fff4d6" stroke="#1d2b4f" stroke-width="3"/>
    <line x1="72" y1="40" x2="72" y2="66" stroke="#f0433a" stroke-width="3"/>
    <circle cx="150" cy="72" r="26" fill="#fff4d6" stroke="#1d2b4f" stroke-width="4"/><line x1="150" y1="72" x2="150" y2="52" stroke="#1d2b4f" stroke-width="4" stroke-linecap="round"/>
    <g fill="#7a4420">${Array.from({ length: 12 }, (_, i) => `<circle cx="${34 + (i % 6) * 14}" cy="${86 + Math.floor(i / 6) * 14}" r="4"/>`).join('')}</g></svg>`,
  });

function showMenu() {
  sound.stop();
  const allDone = SCENES.every((s) => shell.progress.done.includes(s.id));
  shell.menu({
    lede: T.lede,
    art: radioArt(),
    levels: LEVELS,
    extras: [
      { label: T.album, onClick: showAlbum },
      { label: T.free, locked: !allDone, lockedHint: T.freeLocked, onClick: () => void play(pick(SCENES), true) },
    ],
    onPlay: (id) => void play(SCENES.find((s) => s.id === id)!, false),
  });
}

async function showAlbum() {
  const found = shell.progress.album;
  const items = EMOTIONS.map((id) => {
    const e = EMOTION[id];
    const on = found.includes(id);
    const b = h(
      'button',
      { class: `ir-station-card${on ? '' : ' off'}`, type: 'button', style: { '--c': e.color } as Partial<CSSStyleDeclaration> },
      h('b', {}, on ? e.name : '? ? ?'),
      h('span', {}, on ? e.body : T.albumEmpty),
      on ? h('i', {}, e.example) : null,
    );
    if (on) b.addEventListener('click', () => sound.playMotif(id));
    else b.disabled = true;
    return b;
  });
  await shell.sheet(T.album, [h('p', { class: 'ir-album-note' }, T.albumTap), h('div', { class: 'ir-album' }, ...items)]);
}

// ------------------------------------------------------------------ play

interface Slot {
  el: HTMLElement;
  tile: Tile;
}

async function play(scene: Scene, free: boolean) {
  const scope = new Scope();
  sound.stop();
  shell.clearStage();
  shell.setTitle(scene.name);
  shell.setBack(() => {
    scope.dispose();
    showMenu();
  });

  // --- layout
  const face = h('div', { class: 'ir-face', html: faceSVG(scene.who) });
  const faceSvg = face.querySelector('svg');
  const noise = h('canvas', { class: 'ir-noise', width: 96, height: 72, 'aria-hidden': 'true' });
  const say = h('div', { class: 'ir-say', 'aria-hidden': 'true' });
  const tv = h('div', { class: 'ir-tv' }, h('div', { class: 'ir-screen' }, face, noise), say);
  const hint = h('p', { class: 'sh-hint', 'aria-live': 'polite' });

  const slotEls = [0, 1, 2, 3].map((i) => h('span', { class: `ir-slot ir-slot-${i}` }));
  const sentence = h('div', { class: 'ir-sentence' }, ...slotEls);

  const needle = h('i', { class: 'ir-needle' });
  const labels = h('div', { class: 'ir-labels' });
  const dialWin = h('div', { class: 'ir-window', 'aria-hidden': 'true' }, h('div', { class: 'ir-ticks' }), labels, needle);
  const leds = h('div', { class: 'ir-leds', 'aria-hidden': 'true' }, ...Array.from({ length: 5 }, () => h('i')));
  const RING = 2 * Math.PI * 56;
  const knob = h('button', {
    class: 'ir-knob',
    type: 'button',
    role: 'slider',
    'aria-label': T.knob,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    html: `<svg viewBox="0 0 128 128"><circle class="ir-ring-track" cx="64" cy="64" r="56"/><circle class="ir-ring" cx="64" cy="64" r="56" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>
      <g class="ir-knob-cap"><circle cx="64" cy="64" r="44"/>${Array.from({ length: 16 }, (_, i) => `<rect x="62" y="22" width="4" height="10" rx="2" transform="rotate(${i * 22.5} 64 64)"/>`).join('')}<rect class="ir-knob-mark" x="60" y="26" width="8" height="24" rx="4"/></g></svg>`,
  });
  const ringEl = knob.querySelector('.ir-ring') as SVGCircleElement;
  const cap = knob.querySelector('.ir-knob-cap') as SVGGElement;
  const speaker = h('div', { class: 'ir-speaker', 'aria-hidden': 'true' });
  const radio = h('div', { class: 'ir-radio', dir: 'ltr' }, h('div', { class: 'ir-panel' }, dialWin, leds, speaker), knob);
  const tray = h('div', { class: 'ir-tray', hidden: true });
  const root = h('div', { class: 'ir-play' }, hint, tv, sentence, h('div', { class: 'ir-bottom' }, radio, tray));
  shell.stage.append(root);

  // --- sentence state: the angry version comes pre-filled, as it does in life
  const staticTile: Tile = { v: 0, text: '▒▒▒▒' };
  const slots: Slot[] = [OPENERS[0], staticTile, scene.when[0], scene.because[0]].map((tile, i) => ({ el: slotEls[i], tile }));
  const paintSlot = (s: Slot, preview?: Tile) => {
    const t = preview ?? s.tile;
    s.el.textContent = t.text;
    s.el.dataset.v = String(t.v);
    s.el.classList.toggle('preview', Boolean(preview));
  };
  slots.forEach((s) => paintSlot(s));
  slotEls[1].classList.add('static');
  slotEls[1].setAttribute('aria-label', T.static);

  let mood = -0.2;
  let spikes = 0;
  let heat = 0.3;
  const showSay = (text: string, cls = '') => {
    say.textContent = text;
    say.className = `ir-say show ${cls}`;
    shell.announce(text);
  };

  // --- the static on the screen
  const nctx = noise.getContext('2d')!;
  const img = nctx.createImageData(noise.width, noise.height);
  let staticLevel = 1;
  const drawNoise = () => {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    noise.style.opacity = (staticLevel * 0.92).toFixed(3);
  };

  // Scene card first: the moment, and the hot thought in a bubble.
  const go = await shell.card({
    cls: 'ir-scene-card',
    title: scene.name,
    art: h('div', { class: 'ir-card-face', html: faceSVG(scene.who) }),
    lines: [scene.text, h('p', { class: 'ir-thought' }, `💭 ${scene.thought}`)],
    buttons: [{ id: 'go', label: T.tuneIn, cls: 'warm' }],
  });
  if (!scope.alive || go !== 'go') return;

  // ============================================================ tuning
  const stations: Station[] = placeStations(scene.stations, scene.weights);
  const locked: Emotion[] = [];
  // Start on the dial somewhere with only static.
  let dial = 0.5;
  for (let k = 0; k < 20; k++) {
    dial = rand(0.05, 0.95);
    if (clarity(dial, stations) === 0) break;
  }
  let angle = 0;
  let lockT = 0;
  let paused = false;
  let faintShown = false;
  let t = 0;
  hint.textContent = T.hintTurn;

  const setDial = (v: number, turned: number) => {
    dial = clamp(v, 0, 1);
    angle += turned;
    knob.setAttribute('aria-valuenow', String(Math.round(dial * 100)));
  };

  // Turning the knob: the change in finger angle around its centre moves the dial.
  let knobPtr: { id: number; a: number } | null = null;
  const angleAt = (e: PointerEvent) => {
    const r = knob.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  scope.on<PointerEvent>(knob, 'pointerdown', (e) => {
    knob.setPointerCapture(e.pointerId);
    knobPtr = { id: e.pointerId, a: angleAt(e) };
  });
  scope.on<PointerEvent>(knob, 'pointermove', (e) => {
    if (!knobPtr || e.pointerId !== knobPtr.id || paused) return;
    const a = angleAt(e);
    let d = a - knobPtr.a;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    knobPtr.a = a;
    setDial(dial + (d / (Math.PI * 2)) * 0.45, d);
  });
  const endKnob = () => (knobPtr = null);
  scope.on(knob, 'pointerup', endKnob);
  scope.on(knob, 'pointercancel', endKnob);
  scope.on<KeyboardEvent>(knob, 'keydown', (e) => {
    const step = e.key === 'PageUp' || e.key === 'PageDown' ? 0.05 : 0.004;
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown' ? -1 : 0;
    if (!dir || paused) return;
    e.preventDefault();
    setDial(dial + dir * step, dir * step * 14);
  });
  // Dragging straight on the dial window is a coarse shortcut.
  let winPtr = -1;
  const winTo = (e: PointerEvent) => {
    const r = dialWin.getBoundingClientRect();
    const v = (e.clientX - r.left) / r.width;
    setDial(v, (v - dial) * 14);
  };
  scope.on<PointerEvent>(dialWin, 'pointerdown', (e) => {
    if (paused) return;
    winPtr = e.pointerId;
    dialWin.setPointerCapture(e.pointerId);
    winTo(e);
  });
  scope.on<PointerEvent>(dialWin, 'pointermove', (e) => e.pointerId === winPtr && !paused && winTo(e));
  scope.on(dialWin, 'pointerup', () => (winPtr = -1));

  const addLabel = (s: Station) => {
    const e = EMOTION[s.id];
    labels.append(h('span', { class: 'ir-label', style: { left: `${s.pos * 100}%`, '--c': e.color } as Partial<CSSStyleDeclaration> }, e.name));
  };

  let doneTuning: () => void = () => {};
  const tuned = new Promise<void>((res) => (doneTuning = res));
  let tuning = true;
  let finished = false;

  const lock = async (s: Station) => {
    locked.push(s.id);
    lockT = 0;
    heat *= 0.5;
    addLabel(s);
    if (discover(shell.progress, s.id)) shell.persist();
    shell.audio.tone({ f: 1800, d: 0.03, g: 0.12, type: 'square', lp: 4000 });
    shell.audio.bell(0, 0.8);
    vibrate(30);
    const r = knob.getBoundingClientRect();
    shell.fx.ring(r.left + r.width / 2, r.top + r.height / 2, EMOTION[s.id].color, 70);
    const name = EMOTION[s.id].name;
    const strong = s.weight >= STRONG;
    hint.textContent = strong ? T.strong(name) : T.alsoThere(name);
    shell.announce(hint.textContent);
    const remaining = stations.filter((x) => x.weight >= STRONG && !locked.includes(x.id));
    if (locked.length >= 2 || remaining.length === 0) {
      tuning = false;
      doneTuning();
      return;
    }
    paused = true;
    await scope.sleep(700);
    const choice = await shell.card({
      title: strong ? T.another : T.louder,
      lines: [hint.textContent],
      buttons: [
        { id: 'keep', label: T.keep, cls: 'warm' },
        { id: 'enough', label: T.enough, cls: 'ghost' },
      ],
    });
    if (!scope.alive) return;
    paused = false;
    if (choice === 'enough') {
      tuning = false;
      doneTuning();
    } else hint.textContent = T.hintTurn;
  };

  scope.loop((dt) => {
    t += dt;
    if (tuning && !paused) heat = Math.min(1, heat + dt / 70);
    // The heat makes the needle tremble and drift: tuning in takes a steady hand.
    const amp = tuning ? 0.003 + 0.009 * heat : 0;
    const wob = amp * (Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.9 + 1) * 0.4);
    const eff = clamp(dial + wob, 0, 1);
    needle.style.left = `${eff * 100}%`;
    cap.style.transform = `rotate(${angle}rad)`;
    const open = stations.filter((s) => !locked.includes(s.id));
    const clar = clarity(eff, open);
    if (finished) staticLevel = Math.max(0, staticLevel - dt * 0.8);
    else staticLevel = (1 - clar) * (locked.length ? 0.35 : 1);
    leds.querySelectorAll('i').forEach((l, i) => l.classList.toggle('on', clar * 5 > i + 0.25));
    if (tuning && !paused) {
      const at = stationAt(eff, open);
      if (at && lockable(at)) {
        if (lockT === 0) hint.textContent = T.hintHold;
        lockT += (dt * 1000) / LOCK_MS;
        if (lockT >= 1) void lock(at);
      } else lockT = Math.max(0, lockT - dt * 3);
      // Near a faint station: say so once per visit — never "wrong".
      const near = open.find((s) => Math.abs(eff - s.pos) < LOCK * 2 && !lockable(s));
      if (near && !faintShown) {
        faintShown = true;
        hint.textContent = T.faint;
      } else if (!near) faintShown = false;
    }
    ringEl.style.strokeDashoffset = String(RING * (1 - lockT));
    drawNoise();
    speaker.style.setProperty('--pulse', (1 + sound.level * 0.05 * Math.sin(t * 38)).toFixed(3));
    sound.update(eff, stations, staticLevel, locked);
    if (tuning) mood = -0.15 - heat * 0.45;
    spikes = Math.max(0, spikes - dt * 0.8);
    setFaceMood(faceSvg, mood, spikes);
  });

  await tuned;
  if (!scope.alive) return;

  // ============================================================ the sentence
  const feeling: Tile = { v: 1, text: feelingText(locked) };
  slots[1].tile = feeling;
  slotEls[1].classList.remove('static');
  slotEls[1].removeAttribute('aria-label');
  slotEls[1].style.setProperty('--c', EMOTION[locked[0]].color);
  paintSlot(slots[1]);
  if (!reducedMotion()) slotEls[1].animate([{ transform: 'scale(1.3)' }, { transform: 'none' }], { duration: 400, easing: 'ease-out' });
  const editable = [0, 2, 3];
  const options = [OPENERS, scene.when, scene.because];
  const tones = () => slots.map((s) => s.tile.v) as Tone[];
  const refreshMood = (preview?: { slot: number; tile: Tile }) => {
    const ts = slots.map((s, i) => (preview && preview.slot === i ? preview.tile.v : s.tile.v));
    mood = moodOf(ts);
  };
  refreshMood();
  await scope.sleep(600);
  if (!scope.alive) return;
  showSay(T.under, 'note');
  hint.textContent = T.edit;
  radio.hidden = true;
  tray.hidden = false;
  root.classList.add('editing');

  const rowEls = options.map((opts, r) => {
    const slotIdx = editable[r];
    const tiles = opts.map((tile) => {
      const b = h('button', { class: 'ir-tile', type: 'button', 'data-v': String(tile.v) }, tile.text);
      bindTile(b, slotIdx, tile);
      return b;
    });
    return h('div', { class: 'ir-row' }, h('span', { class: 'ir-row-name' }, T.rows[r]), h('div', { class: 'ir-row-tiles' }, ...tiles));
  });
  const markChosen = () =>
    rowEls.forEach((row, r) =>
      row.querySelectorAll<HTMLButtonElement>('.ir-tile').forEach((b, k) => b.setAttribute('aria-pressed', String(options[r][k] === slots[editable[r]].tile))),
    );
  const sayBtn = h('button', { class: 'btn warm ir-say-btn', type: 'button' }, T.say);
  tray.append(...rowEls, sayBtn);
  markChosen();

  /**
   * Press a tile to preview how it would land (the face reacts right away),
   * drag it onto the sentence or just tap it to place it.
   */
  function bindTile(b: HTMLButtonElement, slotIdx: number, tile: Tile) {
    let start: { x: number; y: number; id: number } | null = null;
    let ghost: HTMLElement | null = null;
    const overSentence = (e: PointerEvent) => {
      const r = sentence.getBoundingClientRect();
      return e.clientY > r.top - 30 && e.clientY < r.bottom + 30;
    };
    const cleanup = () => {
      ghost?.remove();
      ghost = null;
      start = null;
      paintSlot(slots[slotIdx]);
      refreshMood();
    };
    scope.on<PointerEvent>(b, 'pointerdown', (e) => {
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      b.setPointerCapture(e.pointerId);
      paintSlot(slots[slotIdx], tile);
      refreshMood({ slot: slotIdx, tile });
    });
    scope.on<PointerEvent>(b, 'pointermove', (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
        ghost = h('div', { class: 'ir-ghost', 'data-v': String(tile.v) }, tile.text);
        document.body.append(ghost);
      }
      if (ghost) {
        ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -120%)`;
        const over = overSentence(e);
        paintSlot(slots[slotIdx], over ? tile : undefined);
        refreshMood(over ? { slot: slotIdx, tile } : undefined);
      }
    });
    scope.on<PointerEvent>(b, 'pointerup', (e) => {
      if (!start) return;
      const place = !ghost || overSentence(e);
      if (place) {
        slots[slotIdx].tile = tile;
        shell.audio.pluck(tile.v > 0 ? 4 : tile.v < 0 ? 0 : 2);
        markChosen();
      }
      cleanup();
    });
    scope.on(b, 'pointercancel', cleanup);
    // Keyboard and screen readers: a click without a pointer places the tile.
    scope.on<MouseEvent>(b, 'click', (e) => {
      if (e.detail !== 0) return;
      slots[slotIdx].tile = tile;
      paintSlot(slots[slotIdx]);
      refreshMood();
      markChosen();
    });
  }

  let firstTry: Tone[] = [];
  const said = new Promise<void>((resolve) => {
    scope.on(sayBtn, 'click', async () => {
      const ts = tones();
      if (!firstTry.length) firstTry = ts;
      if (hasBlame(ts)) {
        spikes = 1;
        mood = -1;
        showSay(scene.bad, 'bad');
        hint.textContent = T.retry;
        shell.audio.noise({ d: 0.25, g: 0.3, type: 'lowpass', f: 900, to: 200 });
        shell.audio.tone({ f: 300, to: 120, type: 'sawtooth', d: 0.3, g: 0.08, lp: 900 });
        vibrate([20, 40, 20]);
        slots.forEach((s) => s.tile.v < 0 && !reducedMotion() && s.el.animate([{ transform: 'translateY(-10px) rotate(-4deg)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' }));
        await scope.sleep(1400);
        if (scope.alive) refreshMood();
        return;
      }
      sayBtn.disabled = true;
      tray.querySelectorAll('button').forEach((x) => ((x as HTMLButtonElement).disabled = true));
      finished = true;
      mood = 1;
      const vague = ts.some((v) => v === 0);
      showSay(vague ? T.meh : scene.good, 'good');
      hint.textContent = vague ? T.vague : '';
      shell.audio.success();
      const r = face.getBoundingClientRect();
      shell.fx.confetti(r.left + r.width / 2, r.top + r.height / 2, 24);
      await scope.sleep(2600);
      resolve();
    });
  });
  await said;
  if (!scope.alive) return;

  // ============================================================ end
  const stars = starsFor({ locked, stations, firstTry });
  const zen = free ? 0 : shell.finishLevel(scene.id, stars);
  const idx = SCENES.indexOf(scene);
  const next = await shell.end({
    title: T.doneTitle,
    stars: stars.map((on, i) => ({ on, label: T.stars[i] })),
    zen,
    lines: [h('p', { class: 'ir-final' }, slots.map((s) => s.tile.text).join(' '))],
    anchor: `${ANCHOR.underneath} ${ANCHOR.sentence}`,
    hasNext: !free && idx < SCENES.length - 1,
  });
  scope.dispose();
  if (next === 'next') void play(SCENES[idx + 1], false);
  else if (next === 'again') void play(free ? pick(SCENES.filter((s) => s !== scene)) : scene, free);
  else showMenu();
}

showMenu();

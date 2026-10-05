// The shell first, so each game's styles come after (and win over) the shared ones.
import { Shell } from '../shared/shell';
import './styles.css';
import { h, clamp, lerp, pick, rand, reducedMotion, shuffle, Scope } from '../shared/dom';
import { tr, isRTL } from '../shared/i18n';
import { vibrate } from '../shared/haptics';
import { faceSVG, setFaceMood } from '../shared/face';
import { avatarSVG } from '../shared/avatar';
import { profile } from '../shared/profile';
import { ANCHOR } from '../shared/anchors';
import { bump, discover } from '../shared/progress';
import {
  CUT_FEELING,
  LAND,
  LEVELS,
  START,
  clampConn,
  emptyTally,
  endlessSpeed,
  flightTime,
  honest,
  launchGap,
  nextStreak,
  segmentHitsRect,
  starsFor,
  type Kind,
  type Level,
  type SentenceTally,
} from './logic';
import { LEVEL_NAMES, REPLY, SENTENCES, type Sentence } from './content';

/**
 * Words in Flight: when you're hot, words leave your mouth before you've
 * thought. Swipe across the hurtful ones in flight and they turn into their
 * honest version — the feeling still lands, it just stops being an attack.
 * Feelings themselves must never be cut.
 */

const T = {
  title: tr({ en: 'Words in Flight', he: 'מילים באוויר', ar: 'كلمات في الهواء' }),
  lede: tr({
    en: 'When you’re hot, words fly out before you think. Catch the ones that hurt — and let what you really feel land.',
    he: 'כשחם, מילים יוצאות לפני שחושבים. תפסו את אלה שפוגעות — ותנו למה שאתם באמת מרגישים לנחות.',
    ar: 'حين تحتدّون، تطير الكلمات قبل التفكير. التقطوا الجارحة منها — ودعوا ما تشعرون به حقًا يصل.',
  }),
  endless: tr({ en: '♾️ Endless evening', he: '♾️ ערב אינסופי', ar: '♾️ مساء بلا نهاية' }),
  endlessLocked: tr({ en: 'Opens after level 5', he: 'נפתח אחרי שלב 5', ar: 'تُفتح بعد المرحلة 5' }),
  endlessBest: (n: number) => tr({ en: `Best honesty streak: ${n}`, he: `רצף הכנות הכי ארוך: ${n}`, ar: `أطول سلسلة صدق: ${n}` }),
  breathe: tr({ en: 'Breathe — slow time down', he: 'לנשום — להאט את הזמן', ar: 'تنفّسوا — أبطئوا الوقت' }),
  connection: tr({ en: 'Connection', he: 'חיבור', ar: 'التواصل' }),
  hint1: tr({ en: 'Swipe across the red words before they land.', he: 'החליקו על המילים האדומות לפני שהן נוחתות.', ar: 'اسحبوا عبر الكلمات الحمراء قبل أن تصل.' }),
  coach: tr({
    en: 'Words flying too fast? Tap here to breathe — time slows down.',
    he: 'המילים עפות מהר מדי? הקישו כאן כדי לנשום — הזמן מאט.',
    ar: 'الكلمات تطير بسرعة؟ اضغطوا هنا لتتنفّسوا — يتباطأ الوقت.',
  }),
  nudge: tr({ en: 'Too fast? Breathe', he: 'מהר מדי? נשמו', ar: 'سريع جدًا؟ تنفّسوا' }),
  hint2: tr({
    en: 'Green words are your feelings. Let them land!',
    he: 'המילים הירוקות הן הרגשות שלכם. תנו להן לנחות!',
    ar: 'الكلمات الخضراء هي مشاعركم. دعوها تصل!',
  }),
  hint4: tr({
    en: '“Thank you” is not “you always”. Read before you swipe.',
    he: '"תודה" זה לא "אתה תמיד". קראו לפני שמחליקים.',
    ar: '«شكرًا» ليست «أنت دائمًا». اقرؤوا قبل أن تسحبوا.',
  }),
  cutFeeling: tr({ en: '✗ You cut off what you felt', he: '✗ חתכתם את מה שהרגשתם', ar: '✗ قطعتم ما شعرتم به' }),
  caught: tr({ en: '✓ Caught', he: '✓ נתפס', ar: '✓ التقطتموها' }),
  streak: (n: number) => tr({ en: `Honesty streak ×${n}`, he: `רצף כנות ×${n}`, ar: `سلسلة صدق ×${n}` }),
  streakBig: tr({ en: 'Honesty streak!', he: 'רצף כנות!', ar: 'سلسلة صدق!' }),
  leftTitle: tr({ en: 'They left the room', he: 'יצאו מהחדר', ar: 'خرجوا من الغرفة' }),
  leftLine: tr({ en: '“Okay. Let’s talk later.”', he: '"טוב. נדבר אחר כך."', ar: '«طيب. نتكلم لاحقًا.»' }),
  leftTip: tr({
    en: 'It happens to everyone. Try again — and remember the 🌬️.',
    he: 'זה קורה לכולם. נסו שוב — וזכרו את ה-🌬️.',
    ar: 'يحدث هذا للجميع. حاولوا مجددًا — وتذكّروا 🌬️.',
  }),
  retry: tr({ en: 'Try again', he: 'לנסות שוב', ar: 'حاولوا مجددًا' }),
  menu: tr({ en: 'Levels', he: 'שלבים', ar: 'المراحل' }),
  doneTitle: tr({ en: 'The words landed', he: 'המילים נחתו', ar: 'وصلت الكلمات' }),
  endlessTitle: tr({ en: 'End of the evening', he: 'סוף הערב', ar: 'نهاية المساء' }),
  stars: [
    tr({ en: 'Finished — still talking', he: 'סיימתם — ועדיין מדברים', ar: 'أنهيتم — وما زلتم تتحدثون' }),
    tr({ en: 'Honesty streak', he: 'רצף כנות', ar: 'سلسلة صدق' }),
    tr({ en: 'No word hurt them', he: 'אף מילה לא פגעה', ar: 'لم تجرح أي كلمة' }),
  ],
  summary: (caught: number, hits: number, streak: number) =>
    tr({
      en: `Caught: ${caught} · Landed as hurt: ${hits} · Longest streak: ${streak}`,
      he: `נתפסו: ${caught} · פגעו: ${hits} · הרצף הארוך: ${streak}`,
      ar: `التُقطت: ${caught} · جرحت: ${hits} · أطول سلسلة: ${streak}`,
    }),
};

const KEY = 'bhg.words-in-flight.v1';
const shell = new Shell(KEY, T.title, 'wf-theme');
const LIST = LEVELS.map((l, i) => ({ id: l.id, name: LEVEL_NAMES[i] }));

const art = () =>
  h(
    'div',
    { class: 'wf-art' },
    h('span', { class: 'wf-art-word t' }, tr({ en: 'you ALWAYS', he: 'אתה תמיד', ar: 'أنت دائمًا' })),
    h('span', { class: 'wf-art-word f' }, tr({ en: 'I feel', he: 'אני מרגיש/ה', ar: 'أشعر' })),
    h('span', { class: 'wf-art-word x' }, tr({ en: 'I need help', he: 'אני צריך/ה עזרה', ar: 'أحتاج مساعدة' })),
  );

function showMenu() {
  const allDone = LEVELS.every((l) => shell.progress.done.includes(l.id));
  const best = shell.progress.best.endless ?? 0;
  shell.menu({
    lede: T.lede,
    art: art(),
    levels: LIST,
    extras: [
      {
        label: best ? `${T.endless} · ${best}` : T.endless,
        locked: !allDone,
        lockedHint: T.endlessLocked,
        onClick: () => void play(null),
      },
    ],
    onPlay: (id) => void play(LEVELS.find((l) => l.id === id)!),
  });
}

/** Picks a level's sentences: new ones for this level first, then earlier ones. */
function sentencesFor(level: Level, n: number): Sentence[] {
  const lvl = LEVELS.indexOf(level) + 1;
  const fresh = shuffle(SENTENCES.filter((s) => s.lvl === lvl));
  const older = shuffle(SENTENCES.filter((s) => s.lvl < lvl));
  const list = [...fresh.slice(0, Math.ceil(n * 0.6)), ...older, ...fresh.slice(Math.ceil(n * 0.6))].slice(0, n);
  // Level 1 opens with its easiest sentence; otherwise mix the order.
  return lvl === 1 ? list : shuffle(list);
}

interface Flyer {
  kind: Kind;
  text: string;
  fix?: string;
  /** Index of the token in its sentence. */
  idx: number;
  t: number;
  dur: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  arc: number;
  x: number;
  y: number;
  w: number;
  h: number;
  flash: number;
}

interface Outcome {
  text: string;
  cls: 'hit' | 'fix' | 'feel' | 'cut' | 'plain';
}

async function play(level: Level | null) {
  const scope = new Scope();
  const endless = level === null;
  const lvlN = level ? LEVELS.indexOf(level) + 1 : 0;
  shell.clearStage();
  shell.setTitle(level ? LEVEL_NAMES[lvlN - 1] : T.endless);
  shell.setBack(() => {
    scope.dispose();
    showMenu();
  });

  // --- layout
  const canvas = h('canvas', { class: 'wf-canvas', 'aria-hidden': 'true' });
  const ctx = canvas.getContext('2d')!;
  const faceBox = h('div', { class: 'wf-them' });
  const reply = h('div', { class: 'wf-reply', 'aria-hidden': 'true' });
  const heartFill = h('i');
  const meter = h('div', { class: 'wf-meter', role: 'meter', 'aria-label': T.connection, 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('span', { 'aria-hidden': 'true' }, '❤️'), h('b', {}, heartFill));
  const line = h('p', { class: 'wf-line', 'aria-live': 'polite' });
  const me = h('div', { class: 'wf-me', html: avatarSVG(profile.shape, profile.status === 'done' ? profile.color : 1) });
  const breathRing = h('i', { class: 'wf-breath-ring' });
  const breathBtn = h('button', { class: 'wf-breath', type: 'button', 'aria-label': T.breathe }, breathRing, h('span', { 'aria-hidden': 'true' }, '🌬️'));
  const hint = h('p', { class: 'sh-hint wf-hint' });
  const streakEl = h('div', { class: 'wf-streak', 'aria-hidden': 'true' });
  // Teaching the breath: a one-time guided tap, then a nudge when a word hurts.
  const coach = h('div', { class: 'wf-coach', hidden: true }, h('p', { class: 'wf-coach-tip' }, T.coach), h('span', { class: 'wf-coach-hand', 'aria-hidden': 'true' }, '👇'));
  const nudge = h('div', { class: 'wf-nudge', 'aria-hidden': 'true' }, T.nudge);
  const root = h('div', { class: 'wf-play' }, canvas, meter, faceBox, reply, line, streakEl, me, coach, nudge, breathBtn, hint);
  shell.stage.append(root);

  let W = 0;
  let H = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const resize = () => {
    W = root.clientWidth;
    H = root.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  };
  resize();
  scope.on(window, 'resize', resize);
  const target = () => ({ x: W / 2, y: 118 });
  const mouth = () => ({ x: W / 2, y: H - 104 });

  // --- state
  let conn = START;
  let flinch = 0;
  let joy = 0;
  let hitsTotal = 0;
  let caughtTotal = 0;
  let streak = 0;
  let bestStreak = 0;
  let slowFor = 0;
  let cooldown = 0;
  const COOLDOWN = 9;
  /** Learned the breath in some earlier game: no guided tap any more. */
  const learned = shell.progress.album.includes('breath');
  let coached = false;
  /** Time stands still while the guided tap waits for the player. */
  let frozen = false;
  let breathed = false;
  let nudgedAt = -Infinity;
  let over = false;
  let flyers: Flyer[] = [];
  let faceSvg: Element | null = null;
  let sentenceIndex = 0;

  const setFace = (s: Sentence) => {
    faceBox.innerHTML = faceSVG(s.who);
    faceSvg = faceBox.querySelector('svg');
    if (!reducedMotion()) faceBox.animate([{ transform: 'translateY(-20px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'ease-out' });
  };
  const say = (text: string, cls: string) => {
    reply.textContent = text;
    reply.className = `wf-reply show ${cls}`;
    shell.announce(text);
  };
  const paintMeter = () => {
    // Out of connection: they walk out mid-sentence.
    if (conn <= 0 && !over) {
      over = true;
      flyers = [];
    }
    heartFill.style.width = `${conn}%`;
    heartFill.classList.toggle('low', conn < 30);
    meter.setAttribute('aria-valuenow', String(Math.round(conn)));
  };
  paintMeter();

  const font = (px: number) => `600 ${px}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body') || 'sans-serif'}`;
  const FONT = font(16);
  const measure = (text: string) => {
    ctx.font = FONT;
    return ctx.measureText(text).width + 26;
  };

  // --- the breath: slow motion, then a cooldown
  scope.on(breathBtn, 'click', () => {
    if (cooldown > 0 || over) return;
    if (frozen) {
      frozen = false;
      coach.hidden = true;
      root.classList.remove('coaching');
    }
    breathed = true;
    nudge.classList.remove('show');
    if (discover(shell.progress, 'breath')) shell.persist();
    slowFor = 3;
    cooldown = COOLDOWN;
    shell.audio.breath(false, 3);
    root.classList.add('slow');
    vibrate(20);
  });

  // --- swiping
  let last: { x: number; y: number } | null = null;
  const trail: { x: number; y: number; age: number }[] = [];
  let tally: SentenceTally = emptyTally([]);
  let outcomes: Outcome[] = [];
  /** One placeholder per word, laid out in sentence order before anything flies. */
  let slots: HTMLElement[] = [];
  /** Records how a word ended and shows it in its own place in the sentence. */
  const settle = (idx: number, o: Outcome) => {
    outcomes[idx] = o;
    const el = slots[idx];
    if (!el) return;
    el.textContent = o.text;
    el.className = `wf-o ${o.cls}`;
    if (!reducedMotion()) el.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
  };
  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** Cuts every word the stroke a→b crosses; a tap is a stroke of zero length. A finger gets a wider margin. */
  const sweep = (a: { x: number; y: number }, b: { x: number; y: number }, touch: boolean) => {
    const pad = touch ? 12 : 4;
    for (const f of [...flyers]) {
      if (f.kind === 'x') continue;
      const r = { x: f.x - f.w / 2 - pad, y: f.y - f.h / 2 - pad, w: f.w + pad * 2, h: f.h + pad * 2 };
      if (segmentHitsRect(a.x, a.y, b.x, b.y, r)) cut(f);
    }
  };
  scope.on<PointerEvent>(canvas, 'pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    last = local(e);
    sweep(last, last, e.pointerType !== 'mouse');
    trail.push({ ...last, age: 0 });
  });
  scope.on<PointerEvent>(canvas, 'pointermove', (e) => {
    if (!last) return;
    const p = local(e);
    sweep(last, p, e.pointerType !== 'mouse');
    last = p;
    trail.push({ ...p, age: 0 });
  });
  const lift = () => (last = null);
  scope.on(canvas, 'pointerup', lift);
  scope.on(canvas, 'pointercancel', lift);

  const screenAt = (f: Flyer) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + f.x, y: r.top + f.y };
  };

  function cut(f: Flyer) {
    const s = screenAt(f);
    if (f.kind === 't') {
      tally.caught++;
      caughtTotal++;
      f.kind = 'x';
      f.text = f.fix || '…';
      f.w = measure(f.text);
      f.flash = 1;
      outcomes[f.idx] = { text: f.text, cls: 'fix' };
      shell.fx.sparks(s.x, s.y, '#ff5a4e', 12);
      shell.audio.pluck(2 + tally.caught + streak);
      shell.audio.slip();
      vibrate(12);
    } else if (f.kind === 'f') {
      tally.feelingsCut++;
      conn = clampConn(conn + CUT_FEELING);
      paintMeter();
      remove(f);
      settle(f.idx, { text: f.text, cls: 'cut' });
      shell.fx.floatText(s.x, s.y, T.cutFeeling, 'hot');
      shell.audio.miss();
      vibrate([15, 30, 15]);
    } else if (f.kind === 'n') {
      tally.neutralsCut++;
      remove(f);
      settle(f.idx, { text: f.text, cls: 'cut' });
      shell.audio.pop();
    }
  }
  const remove = (f: Flyer) => (flyers = flyers.filter((x) => x !== f));

  function land(f: Flyer) {
    remove(f);
    conn = clampConn(conn + LAND[f.kind]);
    paintMeter();
    if (f.kind === 't') {
      tally.hits++;
      hitsTotal++;
      flinch = 1;
      settle(f.idx, { text: f.text, cls: 'hit' });
      shell.fx.shake(faceBox, 10, 380);
      nudgeBreath();
      shell.audio.tone({ f: 180, to: 90, type: 'sawtooth', d: 0.22, g: 0.14, lp: 1200 });
      shell.audio.noise({ d: 0.12, g: 0.25, type: 'lowpass', f: 700 });
      vibrate(40);
    } else {
      if (f.kind !== 'n') joy = 1;
      settle(f.idx, { text: f.text, cls: f.kind === 'n' ? 'plain' : f.kind === 'f' ? 'feel' : 'fix' });
      const r = faceBox.getBoundingClientRect();
      if (f.kind !== 'n') shell.fx.floatText(r.left + r.width / 2 + rand(-30, 30), r.bottom, '❤', 'wf-heart');
      shell.audio.tone({ f: f.kind === 'n' ? 520 : 780, d: 0.12, g: 0.06, verb: 0.2 });
    }
  }

  scope.on(nudge, 'animationend', () => nudge.classList.remove('show'));
  /** A hurtful word just landed and the breath sat unused: point at it, right now. */
  function nudgeBreath() {
    const now = performance.now() / 1000;
    if (breathed || cooldown > 0 || slowFor > 0 || now - nudgedAt < 6) return;
    nudgedAt = now;
    nudge.classList.remove('show');
    void nudge.offsetWidth;
    nudge.classList.add('show');
    if (!reducedMotion()) breathBtn.animate([{ scale: '1' }, { scale: '1.25' }, { scale: '0.95' }, { scale: '1.1' }, { scale: '1' }], { duration: 700, easing: 'ease-out' });
  }
  /** The first red word of level 1 freezes mid-air until the player breathes once. */
  function startCoach() {
    coached = true;
    frozen = true;
    coach.style.setProperty('--cx', isRTL ? '52px' : 'calc(100% - 52px)');
    coach.hidden = false;
    root.classList.add('coaching');
    last = null;
    shell.announce(T.coach);
    shell.audio.tone({ f: 660, d: 0.18, g: 0.06, verb: 0.3 });
  }

  // --- one sentence at a time
  const speedAt = () => (level ? level.speed : endlessSpeed(sentenceIndex));
  async function runSentence(s: Sentence): Promise<void> {
    setFace(s);
    tally = emptyTally(s.tokens);
    outcomes = [];
    slots = s.tokens.map((tok) => h('span', { class: 'wf-o slot' }, tok.text));
    line.replaceChildren(...slots);
    const speed = speedAt();
    const tg = target();
    const m = mouth();
    for (let i = 0; i < s.tokens.length; i++) {
      if (!scope.alive || over) return;
      const tok = s.tokens[i];
      const w = measure(tok.text);
      // Alternate sides so consecutive words don't stack on top of each other.
      const side = (i % 2 ? 1 : -1) * (isRTL ? -1 : 1);
      flyers.push({
        kind: tok.kind,
        text: tok.text,
        fix: tok.fix,
        idx: i,
        t: 0,
        dur: flightTime(speed) * rand(0.92, 1.08),
        x0: m.x,
        y0: m.y,
        x1: tg.x + rand(-20, 20),
        y1: tg.y + 40,
        arc: side * rand(0.18, 0.34) * W,
        x: m.x,
        y: m.y,
        w,
        h: 34,
        flash: 0,
      });
      shell.audio.tone({ f: 300 + i * 30, d: 0.06, g: 0.04, type: 'triangle' });
      await gameSleep(launchGap(speed) * (tok.text.length > 18 ? 1.35 : 1));
    }
    // Wait for the last word to land or be caught.
    while (scope.alive && !over && flyers.length) await scope.sleep(80);
  }

  /** Sleeps in game time, so the breath's slow motion slows launches too. */
  const gameSleep = async (sec: number) => {
    let left = sec;
    while (left > 0 && scope.alive) {
      await scope.sleep(50);
      if (!frozen) left -= 0.05 * (slowFor > 0 ? 0.35 : 1);
    }
  };

  // --- frame loop
  scope.loop((dt) => {
    const scale = frozen ? 0 : slowFor > 0 ? 0.35 : 1;
    if (slowFor > 0 && !frozen) {
      slowFor -= dt;
      if (slowFor <= 0) root.classList.remove('slow');
    }
    if (!frozen) cooldown = Math.max(0, cooldown - dt);
    breathRing.style.setProperty('--p', String(1 - cooldown / COOLDOWN));
    breathBtn.classList.toggle('ready', cooldown === 0);
    const gdt = dt * scale;
    if (lvlN === 1 && !learned && !coached && flyers.some((f) => f.kind === 't' && f.t >= 0.4)) startCoach();
    for (const f of [...flyers]) {
      f.t += gdt / f.dur;
      const e = f.t;
      f.x = clamp(lerp(f.x0, f.x1, e) + f.arc * Math.sin(Math.PI * Math.min(1, e)), f.w / 2 + 10, W - f.w / 2 - 10);
      f.y = lerp(f.y0, f.y1, e);
      f.flash = Math.max(0, f.flash - dt * 3);
      if (f.t >= 1) land(f);
    }
    flinch = Math.max(0, flinch - dt * 1.2);
    joy = Math.max(0, joy - dt * 1.5);
    setFaceMood(faceSvg, clamp((conn - 50) / 45 - flinch * 1.4 + joy * 0.4, -1, 1), flinch > 0.6 ? flinch - 0.4 : 0);
    draw(dt);
  });

  function draw(dt: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Swipe trail.
    for (const p of trail) p.age += dt;
    while (trail.length && trail[0].age > 0.18) trail.shift();
    if (trail.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = 1 - trail[i].age / 0.18;
        ctx.strokeStyle = `rgba(255,255,255,${(a * 0.9).toFixed(3)})`;
        ctx.lineWidth = 2 + a * 6;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
    }
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = isRTL ? 'rtl' : 'ltr';
    for (const f of flyers) {
      const grow = Math.min(1, 0.55 + f.t * 4);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(grow, grow);
      const w = f.w;
      const hh = f.h;
      if (f.kind === 't') spikes(w, hh);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -hh / 2, w, hh, 17);
      ctx.fillStyle = f.kind === 't' ? '#ff5a4e' : f.kind === 'f' ? '#c6f3da' : f.kind === 'x' ? '#dff0ff' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = f.kind === 't' ? '#b3261e' : f.kind === 'f' ? '#1f9e6d' : f.kind === 'x' ? '#2f7fd8' : 'rgba(29,43,79,.25)';
      ctx.stroke();
      if (f.flash > 0) {
        ctx.globalAlpha = f.flash;
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = f.kind === 't' ? '#fff' : f.kind === 'f' ? '#0a5e43' : f.kind === 'x' ? '#134a8c' : '#1d2b4f';
      ctx.fillText(f.kind === 'f' ? `🌱 ${f.text}` : f.text, 0, 1);
      ctx.restore();
    }
  }
  /** Little thorns around a toxic bubble. */
  function spikes(w: number, hh: number) {
    ctx.fillStyle = '#b3261e';
    const n = Math.max(4, Math.round(w / 22));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 12 + (i * (w - 24)) / (n - 1);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x - 5, (s * hh) / 2);
        ctx.lineTo(x, (s * hh) / 2 + s * 8);
        ctx.lineTo(x + 5, (s * hh) / 2);
        ctx.fill();
      }
    }
  }

  // --- the evening
  const total = level ? level.sentences : Infinity;
  const queue = level ? sentencesFor(level, level.sentences) : [];
  hint.textContent = lvlN === 1 ? T.hint1 : lvlN === 2 ? T.hint2 : lvlN === 4 ? T.hint4 : '';
  await scope.sleep(900);
  let lastSentence: Sentence | null = null;
  while (scope.alive && sentenceIndex < total) {
    const s = level ? queue[sentenceIndex] : pick(SENTENCES.filter((x) => x !== lastSentence));
    lastSentence = s;
    await runSentence(s);
    if (!scope.alive) return;
    if (conn <= 0) {
      over = true;
      break;
    }
    // What actually landed is already in the line; now how they took it.
    const wasHonest = honest(tally);
    streak = nextStreak(streak, tally);
    bestStreak = Math.max(bestStreak, streak);
    if (wasHonest) {
      say(pick(REPLY.honest), 'good');
      if (streak >= 2) {
        streakEl.textContent = streak >= 3 && streak === (level?.streak ?? 3) ? T.streakBig : T.streak(streak);
        streakEl.classList.remove('show');
        void streakEl.offsetWidth;
        streakEl.classList.add('show');
      }
      if (streak === (level?.streak ?? 3) || (endless && streak > 0 && streak % 3 === 0)) {
        const r = streakEl.getBoundingClientRect();
        shell.fx.confetti(r.left + r.width / 2, r.top + r.height / 2, 30);
        shell.audio.success();
      }
    } else if (tally.hits) say(pick(REPLY.hurt), 'bad');
    else say(pick(REPLY.muddled), '');
    if (sentenceIndex >= 1) hint.textContent = '';
    sentenceIndex++;
    await scope.sleep(1500);
  }
  if (!scope.alive) return;

  // --- endings
  if (over && !endless) {
    faceBox.classList.add('gone');
    shell.audio.tone({ f: 90, to: 50, d: 0.3, g: 0.3 });
    shell.fx.shake(root, 6, 300);
    const c = await shell.card({
      title: T.leftTitle,
      lines: [T.leftLine, T.leftTip],
      buttons: [
        { id: 'retry', label: T.retry, cls: 'warm' },
        { id: 'menu', label: T.menu, cls: 'ghost' },
      ],
    });
    scope.dispose();
    if (c === 'retry') void play(level);
    else showMenu();
    return;
  }
  const summary = h('p', { class: 'wf-summary' }, T.summary(caughtTotal, hitsTotal, bestStreak));
  if (endless) {
    const record = bump(shell.progress, 'endless', bestStreak);
    shell.persist();
    const c = await shell.end({
      title: T.endlessTitle,
      stars: [],
      zen: 0,
      lines: [summary, h('p', {}, T.endlessBest(shell.progress.best.endless ?? 0))],
      record,
      anchor: ANCHOR.sentence,
      hasNext: false,
    });
    scope.dispose();
    if (c === 'again') void play(null);
    else showMenu();
    return;
  }
  const lv = level!;
  const stars = starsFor({ finished: true, connection: conn, bestStreak, hits: hitsTotal }, lv);
  const zen = shell.finishLevel(lv.id, stars);
  const c = await shell.end({
    title: T.doneTitle,
    stars: stars.map((on, i) => ({ on, label: T.stars[i] })),
    zen,
    lines: [summary],
    anchor: ANCHOR.sentence,
    hasNext: lvlN < LEVELS.length,
  });
  scope.dispose();
  if (c === 'next') void play(LEVELS[lvlN]);
  else if (c === 'again') void play(lv);
  else showMenu();
}

showMenu();

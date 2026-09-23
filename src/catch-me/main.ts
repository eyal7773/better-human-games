import '../shared/base.css';
import './styles.css';
import { h, clamp, lerp, pick, rand, ease, reducedMotion, Scope } from '../shared/dom';
import { tr } from '../shared/i18n';
import { AudioEngine } from '../shared/audio';
import { FX } from '../shared/fx';
import { vibrate } from '../shared/haptics';
import { load, store } from '../shared/storage';
import { Buddy } from './buddy';

/**
 * Catch Me — the original prototype, polished: a button runs away from you,
 * and when the frustration boils over you press and hold to breathe for four
 * seconds. Let go early and you start the breath again. No levels, no score.
 */

const HOLD_SECONDS = 4;
const FIRST_BOIL_MS = 6000;

const T = {
  title: tr({ en: 'Catch Me', he: 'תפוס אותי', ar: 'امسكني' }),
  lede: tr({
    en: 'A little button that really doesn’t want to be pressed. Try to catch it — and notice what happens to you.',
    he: 'כפתור קטן שממש לא רוצה שילחצו עליו. נסו לתפוס אותו — ושימו לב מה קורה לכם.',
    ar: 'زرّ صغير لا يريد أبدًا أن يُضغط عليه. حاولوا الإمساك به — ولاحظوا ما يحدث لكم.',
  }),
  start: tr({ en: 'Let’s go', he: 'יאללה', ar: 'يلّا' }),
  hint: tr({ en: 'Try to catch the red button…', he: 'נסו לתפוס את הכפתור האדום…', ar: 'حاولوا الإمساك بالزر الأحمر…' }),
  buddy: tr({ en: 'Catch me!', he: 'תפוס אותי!', ar: 'امسكني!' }),
  boilTitle: tr({ en: 'Boiling point!', he: 'מצב רתיחה!', ar: 'نقطة الغليان!' }),
  boilDesc: tr({
    en: 'The nerves are rising. Instead of pressing hard and fast, press and hold the green button to breathe.',
    he: 'העצבים עולים. במקום ללחוץ חזק ומהר, לחצו והחזיקו את הכפתור הירוק ברצף כדי לנשום.',
    ar: 'الأعصاب ترتفع. بدل الضغط بقوة وبسرعة، اضغطوا مطوّلًا على الزر الأخضر لتتنفّسوا.',
  }),
  caughtTitle: tr({ en: 'Caught it… and still boiling', he: 'תפסתם… ועדיין רותחים', ar: 'أمسكتموه… وما زلتم تغلون' }),
  orb: tr({ en: 'Hold to breathe', he: 'החזיקו כדי לנשום', ar: 'اضغطوا مطوّلًا لتتنفّسوا' }),
  holding: tr({ en: 'Breathing… keep holding…', he: 'נושמים… ממשיכים להחזיק…', ar: 'تتنفّسون… استمرّوا بالضغط…' }),
  early: tr({ en: 'You let go too early! Lost focus.', he: 'עזבתם מוקדם מדי! איבדתם ריכוז.', ar: 'تركتم مبكرًا جدًا! فقدتم التركيز.' }),
  calmTitle: tr({ en: 'You calmed down!', he: 'נרגעתם!', ar: 'هدأتم!' }),
  calmDesc: tr({
    en: 'Four seconds of breathing, and the heat passed — even with someone teasing you.',
    he: 'ארבע שניות של נשימה, והחום עבר — גם כשמישהו מתגרה בכם.',
    ar: 'أربع ثوانٍ من التنفّس، ومرّت الحرارة — حتى مع من يستفزّكم.',
  }),
  home: tr({ en: 'All games', he: 'לכל המשחקים', ar: 'كل الألعاب' }),
  soundOn: tr({ en: 'Sound on', he: 'הפעלת צליל', ar: 'تشغيل الصوت' }),
  mute: tr({ en: 'Mute', he: 'השתקה', ar: 'كتم الصوت' }),
};

const TAUNTS = tr({
  en: ['Catch me!', 'Too slow!', 'So close!', 'Not this time!', 'Over here!', 'Hee hee!', 'Oh, come on!', 'Faster!', 'Missed me!'],
  he: ['תפוס אותי!', 'לאט מדי!', 'כמעט!', 'לא הפעם!', 'פה! פה!', 'חי חי חי', 'נו, באמת?', 'יותר מהר!', 'פספסת!'],
  ar: ['امسكني!', 'بطيء جدًا!', 'قرّبت!', 'مش هالمرّة!', 'هون! هون!', 'هههه', 'يلّا عاد!', 'أسرع!', 'ما لحقتني!'],
});
const MOCKS = tr({
  en: ['Ha ha!', 'Grumpy?', 'Hee hee!'],
  he: ['חחח!', 'עצבני?', 'חי חי!'],
  ar: ['هههه!', 'معصّب؟', 'هيهي!'],
});

document.title = T.title;

const save = load('bhg.catch-me.v1', { muted: false });
const audio = new AudioEngine(save.muted);
const fx = new FX(document.body);
addEventListener('pointerdown', () => audio.unlock(), { capture: true });
document.addEventListener('visibilitychange', () => audio.setBackground(document.hidden));

const ICON_HOME = '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/></svg>';
const ICON_SOUND =
  '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const ICON_MUTED =
  '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

// ------------------------------------------------------------------ layout

const soundBtn = h('button', { class: 'icon-btn', type: 'button' });
const paintSound = () => {
  soundBtn.innerHTML = save.muted ? ICON_MUTED : ICON_SOUND;
  soundBtn.setAttribute('aria-label', save.muted ? T.soundOn : T.mute);
};
paintSound();
soundBtn.addEventListener('click', () => {
  save.muted = !save.muted;
  store('bhg.catch-me.v1', save);
  audio.setMuted(save.muted);
  if (!save.muted) {
    audio.unlock();
    if (root.dataset.phase === 'chase') audio.startPad('home');
  } else {
    audio.stopPad();
    audio.setWhistle(0);
  }
  paintSound();
});

const hint = h('p', { class: 'cm-hint' }, T.hint);
const field = h('div', { class: 'cm-field' });
const shadow = h('div', { class: 'cm-shadow', 'aria-hidden': 'true' });
const runner = new Buddy('cm-runner');
const bubble = h('div', { class: 'cm-bubble', 'aria-hidden': 'true' });
const runnerBtn = h('button', { class: 'cm-runner-btn', type: 'button', 'aria-label': T.buddy }, runner.el, bubble);
field.append(shadow, runnerBtn);

const boilTitle = h('h2', { class: 'cm-boil-title' });
const boilDesc = h('p', { class: 'cm-boil-desc' });
const message = h('p', { class: 'cm-message', 'aria-live': 'polite' });
const RING = 2 * Math.PI * 92;
const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
ring.setAttribute('viewBox', '0 0 200 200');
ring.setAttribute('class', 'cm-ring');
ring.setAttribute('aria-hidden', 'true');
ring.innerHTML = `<circle cx="100" cy="100" r="92" class="track"/><circle cx="100" cy="100" r="92" class="prog" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>`;
const ringProg = ring.querySelector('.prog') as SVGCircleElement;
const orb = h('button', { class: 'cm-orb', type: 'button' }, h('span', {}, T.orb));
const orbWrap = h('div', { class: 'cm-orb-wrap' }, h('div', { class: 'cm-orb-halo' }), ring, orb);
const mocker = new Buddy('cm-mocker');
const mockBubble = h('div', { class: 'cm-bubble cm-mock-bubble', 'aria-hidden': 'true' });
const boil = h(
  'div',
  { class: 'cm-boil', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cm-boil-title' },
  h('div', { class: 'cm-mocker-wrap' }, mocker.el, mockBubble),
  h('div', { class: 'cm-boil-text' }, boilTitle, boilDesc),
  orbWrap,
  message,
);
boilTitle.id = 'cm-boil-title';

const intro = h(
  'div',
  { class: 'cm-intro' },
  h('h1', { class: 'cm-title' }, T.title),
  h('p', { class: 'cm-lede' }, T.lede),
  h('button', { class: 'btn warm cm-start', type: 'button', onclick: () => void begin() }, T.start),
);

const root = h(
  'section',
  { class: 'cm' },
  h('div', { class: 'cm-bg cm-bg-warm', 'aria-hidden': 'true' }),
  h('div', { class: 'cm-bg cm-bg-boil', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
  h('div', { class: 'cm-bg cm-bg-calm', 'aria-hidden': 'true' }),
  h(
    'header',
    { class: 'cm-top' },
    h('a', { class: 'icon-btn', href: import.meta.env.BASE_URL, 'aria-label': T.home, html: ICON_HOME }),
    h('span', { class: 'cm-top-title' }, T.title),
    soundBtn,
  ),
  hint,
  field,
  boil,
  intro,
);
root.dataset.phase = 'intro';
document.getElementById('app')!.append(root);

const setVar = (name: string, v: number) => root.style.setProperty(name, v.toFixed(3));

// ------------------------------------------------------------------ runner

const pos = { x: 0, y: 0, size: 100 };
let hopping = false;

function bounds() {
  const w = field.clientWidth;
  const hgt = field.clientHeight;
  pos.size = clamp(Math.min(w, hgt) * 0.24, 82, 128);
  const pad = pos.size * 0.62;
  return { w, h: hgt, minX: pad, maxX: w - pad, minY: pad + 26, maxY: hgt - pad * 0.8 };
}

function place(lift = 0) {
  const s = pos.size;
  runnerBtn.style.width = `${s}px`;
  runnerBtn.style.height = `${s * 1.12}px`;
  runnerBtn.style.transform = `translate(${pos.x - s / 2}px, ${pos.y - s * 0.56 - lift}px)`;
  const k = 1 - Math.min(0.45, lift / 160);
  shadow.style.width = `${s * 0.78}px`;
  shadow.style.transform = `translate(${pos.x - s * 0.39}px, ${pos.y + s * 0.5}px) scale(${k})`;
  shadow.style.opacity = String(0.9 * k);
}

function center() {
  const b = bounds();
  pos.x = b.w / 2;
  // Above the intro card while it is showing.
  pos.y = root.dataset.phase === 'intro' ? Math.max(b.minY, b.h * 0.26) : b.h * 0.5;
  place();
}

let bubbleTimer = 0;
function say(text: string, el = bubble, ms = 1100) {
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => el.classList.remove('show'), ms);
}

/** Pick a landing spot well away from the pointer, inside the field. */
function escapeFrom(px: number, py: number) {
  const b = bounds();
  let best = { x: pos.x, y: pos.y, score: -1 };
  for (let i = 0; i < 12; i++) {
    const x = rand(b.minX, Math.max(b.minX, b.maxX));
    const y = rand(b.minY, Math.max(b.minY, b.maxY));
    const away = Math.hypot(x - px, y - py);
    const travel = Math.hypot(x - pos.x, y - pos.y);
    // Far from the finger, but not always across the whole screen.
    const score = away - Math.max(0, travel - b.w * 0.8) * 0.5 + rand(0, 70);
    if (score > best.score) best = { x, y, score };
  }
  return best;
}

async function hop(scope: Scope, px: number, py: number) {
  hopping = true;
  const to = escapeFrom(px, py);
  const sx = pos.x;
  const sy = pos.y;
  const dist = Math.hypot(to.x - sx, to.y - sy);
  runner.el.classList.toggle('flip', to.x < sx);
  runner.el.classList.add('running');
  runner.face(Math.random() < 0.5 ? 'run' : 'laugh');
  audio.whoosh();
  if (Math.random() < 0.35) audio.giggle();
  const r = field.getBoundingClientRect();
  fx.steam(r.left + sx, r.top + sy + pos.size * 0.5, 3, 0.5);
  const dur = clamp(dist / 1.7, 240, 430);
  const height = Math.min(70, 26 + dist * 0.18);
  await scope.tween(
    dur,
    (k) => {
      pos.x = lerp(sx, to.x, k);
      pos.y = lerp(sy, to.y, k);
      place(Math.sin(Math.PI * k) * height);
    },
    ease.inOut,
  );
  runner.el.classList.remove('running');
  if (!reducedMotion()) {
    runner.el.animate(
      [{ transform: 'scale(1.18, 0.8)' }, { transform: 'scale(0.94, 1.06)' }, { transform: 'none' }],
      { duration: 240, easing: 'ease-out' },
    );
  }
  fx.steam(r.left + pos.x, r.top + pos.y + pos.size * 0.5, 2, 0.4);
  audio.pop();
  hopping = false;
}

// ------------------------------------------------------------------ phases

/** Chase until the button is caught or the frustration boils over on its own. */
function chase(ms: number): Promise<'caught' | 'time'> {
  root.dataset.phase = 'chase';
  audio.startPad('home');
  // A hop cut short by the previous boil never finished its tween, so reset the
  // runner here — otherwise `hopping` stays true and it ignores every tap.
  hopping = false;
  runner.el.classList.remove('running', 'stumble');
  runner.face('tease');
  place();
  const scope = new Scope();
  let warm = 0;
  let dodges = 0;
  let stumbling = false;
  setVar('--warm', 0);

  return new Promise((resolve) => {
    const done = (why: 'caught' | 'time') => {
      scope.dispose();
      resolve(why);
    };
    const heat = (d: number) => {
      warm = clamp(warm + d, 0, 0.9);
      setVar('--warm', warm);
    };

    const dodge = async (px: number, py: number) => {
      if (hopping || stumbling) return;
      dodges++;
      heat(0.07);
      vibrate(12);
      if (Math.random() < 0.45) say(pick(TAUNTS));
      await hop(scope, px, py);
      if (!scope.alive) return;
      runner.face('tease');
      // Now and then it trips over its own sneakers — the only way to catch it.
      if (dodges >= 3 && Math.random() < 0.2) {
        stumbling = true;
        runner.face('dizzy');
        runner.el.classList.add('stumble');
        audio.slip();
        scope.timeout(() => {
          stumbling = false;
          runner.el.classList.remove('stumble');
          runner.face('tease');
        }, 750);
      }
    };

    const local = (e: PointerEvent) => {
      const r = field.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const near = (p: { x: number; y: number }, k: number) => Math.hypot(p.x - pos.x, p.y - pos.y) < pos.size * k;

    // A mouse gets close → it runs (the prototype moved on hover).
    scope.on<PointerEvent>(field, 'pointermove', (e) => {
      const p = local(e);
      runner.look(p.x - pos.x, p.y - pos.y);
      if (e.pointerType === 'mouse' && near(p, 0.95)) {
        if (!stumbling && !hopping) runner.face('shock');
        void dodge(p.x, p.y);
      }
    });
    scope.on<PointerEvent>(field, 'pointerdown', (e) => {
      const p = local(e);
      runner.look(p.x - pos.x, p.y - pos.y);
      if (stumbling && near(p, 0.8)) return catchIt(e);
      if (near(p, 1.25)) {
        runner.face('shock');
        void dodge(p.x, p.y);
      } else {
        fx.ring(e.clientX, e.clientY, 'rgba(229, 56, 59, 0.55)', 30);
        heat(0.02);
      }
    });
    // Keyboard players get the same runaround.
    scope.on(runnerBtn, 'click', (e) => {
      if ((e as MouseEvent).detail === 0) {
        if (stumbling) return catchIt();
        const b = bounds();
        void dodge(pos.x + rand(-1, 1) * b.w * 0.1, pos.y + rand(-1, 1) * b.h * 0.1);
      }
    });

    const catchIt = (e?: PointerEvent) => {
      stumbling = false;
      runner.el.classList.remove('stumble');
      const r = runnerBtn.getBoundingClientRect();
      fx.sparks(e?.clientX ?? r.left + r.width / 2, e?.clientY ?? r.top + r.height / 2, '#ff6b4a', 16);
      audio.sizzle();
      done('caught');
    };

    scope.interval(() => {
      if (!hopping && !stumbling && Math.random() < 0.6) {
        say(pick(TAUNTS));
        runner.el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'none' }], {
          duration: 320,
          easing: 'ease-out',
        });
      }
    }, 2400);
    scope.loop((dt) => heat(dt * 0.035));
    scope.on(window, 'resize', () => {
      const b = bounds();
      pos.x = clamp(pos.x, b.minX, b.maxX);
      pos.y = clamp(pos.y, b.minY, b.maxY);
      place();
    });
    scope.timeout(() => done('time'), ms);
  });
}

/** Press and hold the orb for four unbroken seconds. */
function breathe(caught: boolean): Promise<void> {
  root.dataset.phase = 'boil';
  audio.stopPad();
  audio.boilOver();
  vibrate([120, 60, 180]);
  if (!reducedMotion()) fx.shake(root, 12, 600);
  boilTitle.textContent = caught ? T.caughtTitle : T.boilTitle;
  boilDesc.textContent = T.boilDesc;
  message.textContent = '';
  mocker.face('laugh');
  setVar('--calm', 0);
  ringProg.style.strokeDashoffset = String(RING);
  orb.style.removeProperty('--grow');
  orb.focus({ preventScroll: true });
  const r0 = root.getBoundingClientRect();
  for (let i = 0; i < 16; i++) fx.steam(r0.left + rand(0.1, 0.9) * r0.width, r0.bottom - 10, 1, 1.8);

  const scope = new Scope();
  let progress = 0;
  let holding = false;
  let beatAcc = 0;
  let whistle = 0.85;
  audio.setWhistle(whistle);
  scope.timeout(() => {
    say(pick(MOCKS), mockBubble, 1300);
    audio.giggle();
  }, 700);

  return new Promise((resolve) => {
    const press = (e?: Event) => {
      e?.preventDefault();
      if (holding || progress >= 1) return;
      holding = true;
      orbWrap.classList.add('holding');
      message.textContent = T.holding;
      audio.breath(true, HOLD_SECONDS);
      vibrate(10);
    };
    const release = () => {
      if (!holding || progress >= 1) return;
      holding = false;
      orbWrap.classList.remove('holding');
      if (progress > 0.04) {
        message.textContent = T.early;
        audio.miss();
        vibrate(40);
        mocker.face('laugh');
        say(pick(MOCKS), mockBubble, 1100);
        if (!reducedMotion()) fx.shake(orbWrap, 6, 260);
      } else message.textContent = '';
      progress = 0;
    };

    scope.on(orb, 'pointerdown', press);
    scope.on(window, 'pointerup', release);
    scope.on(window, 'pointercancel', release);
    scope.on(orb, 'contextmenu', (e) => e.preventDefault());
    scope.on<KeyboardEvent>(orb, 'keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) press(e);
    });
    scope.on<KeyboardEvent>(orb, 'keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') release();
    });
    scope.on(window, 'blur', release);

    let shown = 0;
    scope.loop((dt) => {
      if (holding) {
        progress = Math.min(1, progress + dt / HOLD_SECONDS);
        beatAcc += dt;
        // A heartbeat that slows as the breath goes on.
        if (beatAcc > 0.62 + progress * 0.5) {
          beatAcc = 0;
          audio.heartbeat();
        }
      }
      // The ring and colours ease toward the true progress, so a reset glides back.
      shown += (progress - shown) * Math.min(1, dt * (holding ? 20 : 9));
      ringProg.style.strokeDashoffset = String(RING * (1 - shown));
      orb.style.setProperty('--grow', shown.toFixed(3));
      setVar('--calm', shown);
      const target = 0.85 * (1 - shown);
      if (Math.abs(target - whistle) > 0.01) {
        whistle = target;
        audio.setWhistle(whistle);
      }
      if (holding) mocker.face(shown > 0.8 ? 'calm' : shown > 0.4 ? 'shock' : 'laugh');
      if (progress >= 1 && shown > 0.985) finish();
    });

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      holding = false;
      orbWrap.classList.remove('holding');
      scope.dispose();
      void calmDown().then(resolve);
    };
  });
}

async function calmDown() {
  root.dataset.phase = 'calm';
  audio.setWhistle(0);
  audio.success();
  setTimeout(() => audio.bell(4, 0.7), 260);
  vibrate([20, 40, 20]);
  boilTitle.textContent = T.calmTitle;
  boilDesc.textContent = T.calmDesc;
  message.textContent = '';
  mocker.face('calm');
  mocker.el.classList.add('waving');
  setVar('--calm', 1);
  const r = orb.getBoundingClientRect();
  fx.confetti(r.left + r.width / 2, r.top + r.height / 2, 44, ['#2ec4b6', '#ffd447', '#fff3c4', '#8cc084', '#ff8fab']);
  await new Promise((res) => setTimeout(res, 2600));
  mocker.el.classList.remove('waving');
  setVar('--warm', 0);
}

// ------------------------------------------------------------------ loop

let started = false;
async function begin() {
  if (started) return;
  started = true;
  audio.unlock();
  intro.remove();
  center();
  say(T.buddy, bubble, 1600);
  let wait = FIRST_BOIL_MS;
  for (;;) {
    const why = await chase(wait);
    await breathe(why === 'caught');
    say(pick(TAUNTS), bubble, 1400);
    wait = rand(4000, 9000);
  }
}

// Place the runner behind the intro card so it is already on stage.
requestAnimationFrame(center);

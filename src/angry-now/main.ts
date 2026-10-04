import '../shared/base.css';
import '../boiling-point/calm/calm.css';
import './styles.css';
import { h, Scope } from '../shared/dom';
import { tr } from '../shared/i18n';
import { AudioEngine } from '../shared/audio';
import { FX } from '../shared/fx';
import { load, store } from '../shared/storage';
import { BreathCalm } from '../boiling-point/calm/breath';
import { BodyCalm, type BodyResult } from '../boiling-point/calm/body';
import type { Calm, CalmCtx } from '../boiling-point/calm/types';
import { angryNowLabel } from './label';

/**
 * "I'm angry right now": not a game — no thermometer, no nudniks, no points.
 * Two slow breaths, then finding where the anger sits in the body and naming it.
 */

const BREATHS = 2;
const KEY = 'bhg.angry-now.v1';
const prefs = load<{ muted: boolean }>(KEY, { muted: false });

document.title = angryNowLabel();

const app = document.getElementById('app')!;
const audio = new AudioEngine(prefs.muted);
const fx = new FX(document.body);

// Browsers only allow audio after a gesture; unlock on the very first touch.
addEventListener('pointerdown', () => audio.unlock(), { once: true, capture: true });
document.addEventListener('visibilitychange', () => audio.setBackground(document.hidden));
audio.startPad('home');

// ---------------------------------------------------------------- layout

const closeBtn = h('a', {
  class: 'icon-btn',
  href: '../',
  'aria-label': tr({ en: 'Back', he: 'חזרה', ar: 'رجوع' }),
  html: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
});

const soundBtn = h('button', { class: 'icon-btn', type: 'button' });
const paintSound = () => {
  soundBtn.innerHTML = prefs.muted
    ? '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  soundBtn.setAttribute('aria-label', prefs.muted ? tr({ en: 'Sound on', he: 'הפעלת צליל', ar: 'تشغيل الصوت' }) : tr({ en: 'Mute', he: 'השתקה', ar: 'كتم الصوت' }));
};
paintSound();
soundBtn.addEventListener('click', () => {
  prefs.muted = !prefs.muted;
  audio.setMuted(prefs.muted);
  store(KEY, prefs);
  paintSound();
});

const STEPS = [
  { mark: '1', name: tr({ en: 'Breathe', he: 'נשימה', ar: 'تنفّس' }) },
  { mark: '2', name: tr({ en: 'Body', he: 'בגוף', ar: 'في الجسد' }) },
  { mark: '✓', name: tr({ en: 'Done', he: 'סיום', ar: 'انتهى' }) },
];
const stepEls = STEPS.map((s) => h('li', {}, h('span', { class: 'an-mark' }, s.mark), h('span', { class: 'an-name' }, s.name)));
const steps = h('ol', { class: 'an-steps', 'aria-label': tr({ en: 'Steps', he: 'שלבים', ar: 'المراحل' }) }, ...stepEls);
const setStep = (i: number) =>
  stepEls.forEach((el, k) => {
    el.classList.toggle('done', k < i);
    el.classList.toggle('on', k === i);
    if (k === i) el.setAttribute('aria-current', 'step');
    else el.removeAttribute('aria-current');
  });

const title = h('h1', { class: 'an-title' });
const hint = h('p', { class: 'an-hint', 'aria-live': 'polite' });
const board = h('div', { class: 'an-board' });

app.append(
  h(
    'main',
    { class: 'an' },
    h('header', { class: 'an-bar' }, closeBtn, steps, soundBtn),
    h('div', { class: 'an-text' }, title, hint),
    board,
  ),
);

// ---------------------------------------------------------------- flow

let scope: Scope | null = null;
let breaths = 0;
let felt: BodyResult | null = null;

/** `onComplete` runs the moment the exercise ends; `onDone` after a short pause. */
function mount(make: (c: CalmCtx) => Calm, onDone: () => void, onComplete?: () => void) {
  scope?.dispose();
  const s = (scope = new Scope());
  board.replaceChildren();
  const calm = make({
    board,
    scope: s,
    audio,
    fx,
    heat: () => {},
    say: (t) => (hint.textContent = t),
    done: () => {
      onComplete?.();
      s.timeout(onDone, 900);
    },
  });
  title.textContent = calm.title;
  hint.textContent = calm.hint;
  calm.mount();
  return calm;
}

function breathe(n: number, of: number, then: () => void) {
  setStep(0);
  const dots = Array.from({ length: of }, (_, k) => h('i', { class: k < n - 1 ? 'done' : k === n - 1 ? 'on' : '' }));
  mount(
    (c) => new BreathCalm(c),
    () => (n < of ? breathe(n + 1, of, then) : then()),
    () => {
      breaths++;
      dots[n - 1].className = 'done';
    },
  );
  if (of > 1)
    board.append(
      h('div', { class: 'an-dots', role: 'img', 'aria-label': tr({ en: `Breath ${n} of ${of}`, he: `נשימה ${n} מתוך ${of}`, ar: `نفَس ${n} من ${of}` }) }, ...dots),
    );
}

function body() {
  setStep(1);
  const calm = mount((c) => new BodyCalm(c), finish, () => (felt = calm.result)) as BodyCalm;
}

const breathCount = (n: number) =>
  tr({
    en: n === 1 ? 'One breath' : `${n} breaths`,
    he: n === 1 ? 'נשימה אחת' : n === 2 ? 'שתי נשימות' : `${n} נשימות`,
    ar: n === 1 ? 'نفَس واحد' : n === 2 ? 'نفَسان' : `${n} أنفاس`,
  });

function finish() {
  scope?.dispose();
  scope = null;
  setStep(2);
  audio.success();
  title.textContent = tr({ en: 'You paused', he: 'עצרתם רגע', ar: 'توقّفتم لحظة' });
  hint.textContent = '';
  const again = h('button', { class: 'btn ghost', type: 'button' }, tr({ en: 'One more breath', he: 'עוד נשימה', ar: 'نفَس آخر' }));
  again.addEventListener('click', () => breathe(1, 1, finish));
  board.replaceChildren(
    h(
      'div',
      { class: 'an-done' },
      h('div', { class: 'an-leaf', 'aria-hidden': 'true' }, '🌿'),
      h(
        'ul',
        { class: 'an-recap' },
        h('li', {}, h('span', { 'aria-hidden': 'true' }, '🫁'), breathCount(breaths)),
        felt && h('li', {}, h('span', { 'aria-hidden': 'true' }, '📍'), felt.places.join(' · ')),
        felt && h('li', {}, h('span', { 'aria-hidden': 'true' }, felt.icon), felt.feeling),
      ),
      h(
        'p',
        {},
        tr({
          en: 'The anger is allowed to be here. Now it’s a little quieter, and you can choose what to do next.',
          he: 'הכעס יכול להיות כאן. עכשיו הוא קצת יותר שקט, ואפשר לבחור מה עושים הלאה.',
          ar: 'مسموح للغضب أن يكون هنا. الآن صار أهدأ قليلًا، ويمكنكم اختيار ما تفعلونه بعد ذلك.',
        }),
      ),
      h('div', { class: 'an-actions' }, again, h('a', { class: 'btn', href: '../' }, tr({ en: 'Done', he: 'סיימתי', ar: 'انتهيت' }))),
    ),
  );
}

breathe(1, BREATHS, body);

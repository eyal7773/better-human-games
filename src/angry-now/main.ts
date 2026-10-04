import '../shared/base.css';
import '../boiling-point/calm/calm.css';
import './styles.css';
import { h, Scope } from '../shared/dom';
import { tr } from '../shared/i18n';
import { AudioEngine } from '../shared/audio';
import { FX } from '../shared/fx';
import { load, store } from '../shared/storage';
import { BreathCalm } from '../boiling-point/calm/breath';
import { BodyCalm } from '../boiling-point/calm/body';
import type { Calm, CalmCtx } from '../boiling-point/calm/types';
import { angryNowLabel } from './label';

/**
 * "I'm angry right now": not a game — no thermometer, no nudniks, no points.
 * A few slow breaths, then finding where the anger sits in the body.
 */

const BREATHS = 3;
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

const kicker = h('p', { class: 'an-kicker' });
const title = h('h1', { class: 'an-title' });
const hint = h('p', { class: 'an-hint', 'aria-live': 'polite' });
const board = h('div', { class: 'an-board' });

app.append(
  h(
    'main',
    { class: 'an' },
    h('header', { class: 'an-bar' }, closeBtn, steps, soundBtn),
    h('div', { class: 'an-text' }, kicker, title, hint),
    board,
  ),
);

// ---------------------------------------------------------------- flow

let scope: Scope | null = null;

function mount(make: (c: CalmCtx) => Calm, onDone: () => void) {
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
    done: () => s.timeout(onDone, 900),
  });
  title.textContent = calm.title;
  hint.textContent = calm.hint;
  calm.mount();
}

function breathe(n: number, of: number, then: () => void) {
  setStep(0);
  mount(
    (c) => new BreathCalm(c),
    () => (n < of ? breathe(n + 1, of, then) : then()),
  );
  kicker.textContent = of > 1 ? tr({ en: `Breath ${n} of ${of}`, he: `נשימה ${n} מתוך ${of}`, ar: `نفَس ${n} من ${of}` }) : '';
}

function body() {
  setStep(1);
  kicker.textContent = '';
  mount((c) => new BodyCalm(c), finish);
}

function finish() {
  scope?.dispose();
  scope = null;
  setStep(2);
  audio.success();
  kicker.textContent = '';
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

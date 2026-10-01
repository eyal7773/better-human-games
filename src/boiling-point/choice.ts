import { clamp, h, reducedMotion, shuffle, type Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import { vibrate } from '../shared/haptics';
import type { Dilemma, Verdict } from './content';
import { isRTL, tr } from '../shared/i18n';

export type ChoiceOutcome = Verdict | 'timeout';

const VERDICT_TEXT: Record<ChoiceOutcome, string> = {
  best: tr({ en: 'A calm, constructive response.', he: 'תגובה רגועה ובונה.', ar: 'رد هادئ وبنّاء.' }),
  ok: tr({ en: 'Not bad at all. There’s also a way that connects more.', he: 'לא רע בכלל. יש גם דרך שמחברת יותר.', ar: 'ليس سيئًا أبدًا. هناك أيضًا طريقة تقرّب أكثر.' }),
  bad: tr({ en: 'That’s the boiling-moment response. Understandable — but it usually heats things up even more.', he: 'זו התגובה של הרגע הרותח. מובנת — אבל בדרך כלל מחממת עוד יותר.', ar: 'هذا رد لحظة الغليان. مفهوم — لكنه عادةً يزيد الحرارة أكثر.' }),
  timeout: tr({ en: 'Time ran out. That happens too — here’s what would have helped:', he: 'הזמן עבר. גם זה קורה — הנה מה שהיה עוזר:', ar: 'انتهى الوقت. هذا يحدث أيضًا — إليكم ما كان سيساعد:' }),
};

const T = {
  title: tr({ en: 'How will you choose to respond?', he: 'איך תבחרו להגיב?', ar: 'كيف ستختارون أن تردّوا؟' }),
  slide: tr({ en: 'Slide when you’ve thought it through', he: 'החליקו כשסיימתם לחשוב', ar: 'اسحبوا حين تنتهون من التفكير' }),
  coach: tr({ en: 'Before you respond — pause and think.', he: 'לפני שמגיבים — עוצרים לחשוב.', ar: 'قبل أن تردّوا — توقّفوا وفكّروا.' }),
};

type Mood = 'angry' | 'thinking' | 'calm';

/**
 * A round face that cools down as you think: angry → thinking → calm.
 * With `hand`, it also rests its chin on a hand and thought bubbles rise.
 */
function faceSVG(mood: Mood, hand: boolean) {
  const skin = mood === 'angry' ? '#ff8a5c' : '#ffc61a';
  const eyes =
    mood === 'calm'
      ? '<path d="M17 25 q4 3 8 0 M27 25 q4 3 8 0" fill="none" stroke="#1d2b4f" stroke-width="2" stroke-linecap="round"/>'
      : '<circle cx="21" cy="25" r="2.2" fill="#1d2b4f"/><circle cx="31" cy="25" r="2.2" fill="#1d2b4f"/><circle cx="21.8" cy="24.1" r=".8" fill="#fff"/><circle cx="31.8" cy="24.1" r=".8" fill="#fff"/>';
  const brows =
    mood === 'angry'
      ? '<path d="M16 19 l8 3 M36 19 l-8 3" stroke="#1d2b4f" stroke-width="2" stroke-linecap="round"/>'
      : mood === 'thinking'
        ? '<path d="M18 20 q3 -2 6 0 M28 19 q3 -1.5 6 .5" fill="none" stroke="#1d2b4f" stroke-width="1.6" stroke-linecap="round"/>'
        : '';
  const mouth =
    mood === 'angry'
      ? '<path d="M20 38 q6 -5 12 0" fill="none" stroke="#1d2b4f" stroke-width="2.2" stroke-linecap="round"/>'
      : mood === 'thinking'
        ? '<path d="M22 37 h6" stroke="#1d2b4f" stroke-width="2" stroke-linecap="round"/>'
        : '<path d="M20 35 q6 5 12 0" fill="none" stroke="#1d2b4f" stroke-width="2.2" stroke-linecap="round"/><circle cx="15" cy="32" r="2.6" fill="#ff7aa2" opacity=".55"/><circle cx="37" cy="32" r="2.6" fill="#ff7aa2" opacity=".55"/>';
  const extra = hand
    ? `<circle class="th-b1" cx="44" cy="17" r="3" fill="#fff" stroke="#1d2b4f" stroke-width="1.6"/>
  <circle class="th-b2" cx="51" cy="10" r="4" fill="#fff" stroke="#1d2b4f" stroke-width="1.6"/>
  <ellipse class="th-b3" cx="57" cy="4.5" rx="5.5" ry="3.8" fill="#fff" stroke="#1d2b4f" stroke-width="1.6"/>`
    : '';
  const chin = hand ? `<path d="M34 50 q-4 -8 -2 -12 q2 -3 5 -1 q2 2 0 6" fill="${skin}" stroke="#1d2b4f" stroke-width="2" stroke-linejoin="round"/>` : '';
  return `<svg viewBox="${hand ? '0 0 64 56' : '5 11 38 38'}" aria-hidden="true">${extra}
  <circle cx="26" cy="30" r="17" fill="${skin}" stroke="#1d2b4f" stroke-width="2.2"/>
  <ellipse cx="19" cy="21" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-30 19 21)"/>
  ${eyes}${brows}${mouth}${chin}</svg>`;
}

const moodAt = (p: number): Mood => (p < 0.34 ? 'angry' : p < 0.8 ? 'thinking' : 'calm');

/** Seconds the slider needs, at the very least, end to end: about one slow breath out. */
const MIN_SLIDE = 1.2;
const BUBBLES = ['💭', '🫁', '💙'];

/**
 * The situation → "How will you choose to respond?" → a "thinking" slider you
 * slide to the end once you've thought (the face cools from angry to calm on
 * the way) → the four responses open and only then is the fuse lit.
 */
export function runChoice(
  layer: HTMLElement,
  scope: Scope,
  audio: AudioEngine,
  d: Dilemma,
  timing: { choiceSeconds: number; coach: boolean },
): Promise<ChoiceOutcome> {
  const { choiceSeconds: seconds } = timing;
  return new Promise((resolve) => {
    const fuse = h('div', { class: 'fuse' }, h('div', { class: 'fuse-line' }), h('div', { class: 'fuse-spark' }));
    const list = h('div', { class: 'choice-options', role: 'group', 'aria-label': T.title });
    const feedback = h('div', { class: 'choice-feedback', 'aria-live': 'polite' });

    // the slider: a track that fills, a face that cools down, a line of text that fades
    const titleFace = h('span', { class: 'thinker', html: faceSVG('angry', true) });
    const knob = h('div', { class: 'think-knob', html: faceSVG('angry', false) });
    const fill = h('div', { class: 'think-fill' });
    const label = h('span', { class: 'think-label' }, h('span', {}, T.slide), h('span', { class: 'think-arrows', 'aria-hidden': 'true' }, isRTL ? '‹‹' : '››'));
    const track = h(
      'div',
      { class: 'think', role: 'slider', tabindex: '0', 'aria-label': T.slide, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' },
      fill,
      label,
      knob,
    );
    const coach = timing.coach ? h('p', { class: 'think-coach' }, T.coach) : null;
    const card = h(
      'div',
      { class: 'choice-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': T.title },
      // the situation first, then the question it raises, right above the slider
      h('p', { class: 'choice-situation' }, d.situation),
      h('h2', { class: 'choice-title' }, titleFace, h('span', {}, T.title)),
      track,
      coach,
      fuse,
      list,
      feedback,
    );
    const overlay = h('div', { class: 'choice-overlay' }, card);
    layer.append(overlay);

    const opts = shuffle(d.options.map((o) => ({ ...o })));
    const buttons = opts.map((o) => h('button', { class: 'choice-opt', type: 'button', disabled: true }, h('span', {}, o.text)));
    list.append(...buttons);

    let settled = false;
    let remaining = seconds;

    const settle = (outcome: ChoiceOutcome, picked?: number) => {
      if (settled) return;
      settled = true;
      overlay.classList.add('settled');
      buttons.forEach((b, i) => {
        b.disabled = true;
        b.classList.add(`v-${opts[i].v}`);
        if (i === picked) b.classList.add('picked');
      });
      if (outcome === 'best') {
        audio.success();
        vibrate([20, 40, 20]);
      } else if (outcome === 'timeout') audio.miss();
      else if (outcome === 'bad') audio.sizzle();
      else audio.pluck(2);
      const cont = h('button', { class: 'btn', type: 'button' }, tr({ en: 'Continue', he: 'המשך', ar: 'متابعة' }));
      feedback.append(h('p', { class: `verdict verdict-${outcome}` }, VERDICT_TEXT[outcome]), h('p', { class: 'why' }, d.why), cont);
      cont.focus({ preventScroll: true });
      cont.addEventListener('click', () => {
        overlay.classList.add('closing');
        overlay.style.pointerEvents = 'none';
        // Plain timer: the round's scope is disposed right after we resolve.
        setTimeout(() => overlay.remove(), 260);
        resolve(outcome);
      });
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => settle(opts[i].v, i)));

    /** Done thinking: the slider folds away, the responses come out and the fuse is lit. */
    let open = false;
    const reveal = (byKeyboard: boolean) => {
      if (open) return;
      open = true;
      track.classList.add('done');
      audio.success();
      vibrate([10, 30, 10]);
      scope.timeout(() => track.classList.add('gone'), 280);
      coach?.remove();
      scope.timeout(() => {
        overlay.classList.add('live');
        buttons.forEach((b, i) => {
          b.disabled = false;
          b.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: i * 70, fill: 'backwards', easing: 'ease-out' });
        });
        // keyboard users continue to the first answer; on touch nothing is pre-selected
        if (byKeyboard) buttons[0]?.focus({ preventScroll: true });
        scope.timeout(() => buttons[buttons.length - 1]?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }), 420);
        fuse.style.setProperty('--dur', `${seconds}s`);
        fuse.classList.add('lit');
        const tick = () => {
          if (settled) return;
          remaining--;
          // only the last five seconds tick, so the long fuse stays quiet while reading
          if (remaining <= 5) audio.tick(remaining <= 2);
          if (remaining <= 0) settle('timeout');
          else scope.timeout(tick, 1000);
        };
        scope.timeout(tick, 1000);
      }, 520);
    };

    // ---- the slider's motion: the knob follows the finger, but never faster than one slow breath
    let p = 0; // where it is, 0–1
    let target = 0; // where the finger wants it
    let byKey = false;
    let mood: Mood = 'angry';
    let quarter = 0;
    let bubbleAt = 0;
    const travel = () => track.clientWidth - knob.offsetWidth - 8;
    const dirSign = isRTL ? -1 : 1;
    const paint = () => {
      const px = p * travel();
      knob.style.transform = `translateX(${dirSign * px}px)`;
      fill.style.width = `${px + knob.offsetWidth + 8}px`;
      label.style.opacity = String(Math.max(0, 1 - p * 1.8));
      track.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      const m = moodAt(p);
      if (m !== mood) {
        mood = m;
        knob.innerHTML = faceSVG(m, false);
        titleFace.innerHTML = faceSVG(m, true);
      }
    };
    const bubble = () => {
      if (reducedMotion()) return;
      const b = h('span', { class: 'think-bubble', 'aria-hidden': 'true' }, BUBBLES[Math.floor(Math.random() * BUBBLES.length)]);
      b.style.insetInlineStart = `${p * travel() + 20}px`;
      track.append(b);
      setTimeout(() => b.remove(), 900);
    };
    scope.loop((dt) => {
      if (open) return;
      const step = dt / MIN_SLIDE;
      const before = p;
      p = clamp(p + clamp(target - p, -step, step), 0, 1);
      if (p === before) return;
      paint();
      const q = Math.floor(p * 4);
      if (q > quarter && q < 4) {
        quarter = q;
        audio.pluck(2 + q * 2);
        vibrate(8);
      }
      if (p - bubbleAt > 0.14) {
        bubbleAt = p;
        bubble();
      }
      if (p >= 0.97) {
        p = 1;
        paint();
        reveal(byKey);
      }
    });

    /** A see-through face slides along the track to show the move. */
    let demoing = false;
    const demo = () => {
      if (open || demoing || reducedMotion() || p > 0.05) return;
      demoing = true;
      const ghost = h('div', { class: 'think-ghost', html: faceSVG('thinking', false) });
      track.append(ghost);
      const to = dirSign * travel();
      ghost.animate(
        [
          { transform: 'translateX(0)', opacity: 0 },
          { transform: 'translateX(0)', opacity: 0.6, offset: 0.15 },
          { transform: `translateX(${to}px)`, opacity: 0.6, offset: 0.8 },
          { transform: `translateX(${to}px)`, opacity: 0 },
        ],
        { duration: 1600, easing: 'ease-in-out' },
      ).onfinish = () => {
        ghost.remove();
        demoing = false;
      };
    };
    if (timing.coach) scope.timeout(demo, 1000);

    let drag: { id: number; x: number; from: number; moved: boolean } | null = null;
    track.addEventListener('pointerdown', (e) => {
      if (open) return;
      e.preventDefault();
      track.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, from: p, moved: false };
      byKey = false;
      track.classList.add('held');
      audio.unlock();
    });
    track.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = (e.clientX - drag.x) * dirSign;
      if (Math.abs(dx) > 6) drag.moved = true;
      target = clamp(drag.from + dx / Math.max(1, travel()), 0, 1);
    });
    const release = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      track.classList.remove('held');
      // let go halfway: it stays where it got to — thinking isn't lost
      target = p;
      if (!moved) demo();
    };
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    // keyboards and screen readers: arrows move it a quarter, Enter or Space all the way
    track.addEventListener('keydown', (e) => {
      if (open) return;
      const fwd = isRTL ? 'ArrowLeft' : 'ArrowRight';
      const back = isRTL ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === fwd || e.key === back) target = clamp(target + (e.key === fwd ? 0.25 : -0.25), 0, 1);
      else if (e.key === 'Enter' || e.key === ' ') target = 1;
      else return;
      e.preventDefault();
      byKey = true;
    });
    requestAnimationFrame(paint);
    track.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  });
}

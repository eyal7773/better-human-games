import { h, reducedMotion, shuffle, type Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import { vibrate } from '../shared/haptics';
import type { Dilemma, Verdict } from './content';
import { tr } from '../shared/i18n';

export type ChoiceOutcome = Verdict | 'timeout';

const VERDICT_TEXT: Record<ChoiceOutcome, string> = {
  best: tr({ en: 'A calm, constructive response.', he: 'תגובה רגועה ובונה.', ar: 'رد هادئ وبنّاء.' }),
  ok: tr({ en: 'Not bad at all. There’s also a way that connects more.', he: 'לא רע בכלל. יש גם דרך שמחברת יותר.', ar: 'ليس سيئًا أبدًا. هناك أيضًا طريقة تقرّب أكثر.' }),
  bad: tr({ en: 'That’s the boiling-moment response. Understandable — but it usually heats things up even more.', he: 'זו התגובה של הרגע הרותח. מובנת — אבל בדרך כלל מחממת עוד יותר.', ar: 'هذا رد لحظة الغليان. مفهوم — لكنه عادةً يزيد الحرارة أكثر.' }),
  timeout: tr({ en: 'Time ran out. That happens too — here’s what would have helped:', he: 'הזמן עבר. גם זה קורה — הנה מה שהיה עוזר:', ar: 'انتهى الوقت. هذا يحدث أيضًا — إليكم ما كان سيساعد:' }),
};

/** Someone thinking it over: a round face, hand on chin, eyes up, thought bubbles rising. */
const THINKER = `<svg viewBox="0 0 64 56" aria-hidden="true">
  <circle class="th-b1" cx="44" cy="17" r="3" fill="#fff" stroke="#1d2b4f" stroke-width="1.6"/>
  <circle class="th-b2" cx="51" cy="10" r="4" fill="#fff" stroke="#1d2b4f" stroke-width="1.6"/>
  <ellipse class="th-b3" cx="57" cy="4.5" rx="5.5" ry="3.8" fill="#fff" stroke="#1d2b4f" stroke-width="1.6"/>
  <circle cx="24" cy="30" r="17" fill="#ffc61a" stroke="#1d2b4f" stroke-width="2.2"/>
  <ellipse cx="17" cy="21" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-30 17 21)"/>
  <circle cx="21" cy="25" r="2.2" fill="#1d2b4f"/><circle cx="31" cy="25" r="2.2" fill="#1d2b4f"/>
  <circle cx="21.8" cy="24.1" r=".8" fill="#fff"/><circle cx="31.8" cy="24.1" r=".8" fill="#fff"/>
  <path d="M18 20 q3 -2 6 0 M28 19 q3 -1.5 6 .5" fill="none" stroke="#1d2b4f" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M22 37 h6" stroke="#1d2b4f" stroke-width="2" stroke-linecap="round"/>
  <path d="M34 50 q-4 -8 -2 -12 q2 -3 5 -1 q2 2 0 6" fill="#ffc61a" stroke="#1d2b4f" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

const G = {
  title: tr({ en: 'How will you choose to respond?', he: 'איך תבחרו להגיב?', ar: 'كيف ستختارون أن تردّوا؟' }),
  what: tr({ en: 'What actually happened?', he: 'מה קרה בעצם?', ar: 'ما الذي حدث فعلًا؟' }),
  mine: tr({ en: 'What do I want to happen now?', he: 'מה אני רוצה שיקרה עכשיו?', ar: 'ماذا أريد أن يحدث الآن؟' }),
  hint: tr({ en: 'Drag ✋ into the space', he: 'גררו את ✋ אל הרווח', ar: 'اسحبوا ✋ إلى المسافة' }),
  coach: tr({
    en: 'Between what happened and your response there is a space. That’s where you pause.',
    he: 'בין מה שקרה לבין התגובה שלכם יש רווח. שם עוצרים.',
    ar: 'بين ما حدث وبين ردّكم مسافة. هناك نتوقّف.',
  }),
  hand: tr({ en: 'Pause in the space', he: 'לעצור ברווח', ar: 'توقّفوا في المسافة' }),
};

/** How close (css px) the hand must come to the space to snap in: it's about pausing, not aiming. */
const SNAP = 56;

/**
 * "How will you choose to respond?" → the situation → you put the pause hand
 * into the space between "What actually happened?" and "What do I want to
 * happen now?" → the top folds away, the second question heads the
 * responses, and the fuse is lit.
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
    const list = h('div', { class: 'choice-options', role: 'group', 'aria-label': G.mine });
    const feedback = h('div', { class: 'choice-feedback', 'aria-live': 'polite' });
    // What actually happened? — a space with the pause hand beside it — What do I want to happen now?
    // Read top to bottom, in the order it happens; the hand comes in from the side.
    const slot = h('div', { class: 'gap-slot', 'aria-hidden': 'true' }, '✋');
    const lockIcon = h('span', { class: 'gap-lock', 'aria-hidden': 'true' }, '🔒');
    const hand = h('button', { class: 'gap-hand', type: 'button', 'aria-label': G.hand }, '✋');
    const hint = h('p', { class: 'gap-hint' }, timing.coach ? G.coach : G.hint);
    const gate = h(
      'div',
      { class: 'gap' },
      h('div', { class: 'gap-card gap-what' }, h('span', { 'aria-hidden': 'true' }, '💥'), h('span', {}, G.what)),
      h('div', { class: 'gap-mid' }, h('span', {}), slot, h('div', { class: 'gap-home' }, hand)),
      h('div', { class: 'gap-card gap-mine' }, h('span', { 'aria-hidden': 'true' }, '💬'), h('span', {}, G.mine), lockIcon),
      hint,
    );
    const card = h(
      'div',
      { class: 'choice-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': G.title },
      h('h2', { class: 'choice-title' }, h('span', { class: 'thinker', html: THINKER }), h('span', {}, G.title)),
      h('p', { class: 'choice-situation' }, d.situation),
      gate,
      fuse,
      list,
      feedback,
    );
    const overlay = h('div', { class: 'choice-overlay' }, card);
    layer.append(overlay);

    const opts = shuffle(d.options.map((o) => ({ ...o })));
    const buttons = opts.map((o) =>
      h('button', { class: 'choice-opt', type: 'button', disabled: true }, h('span', {}, o.text)),
    );
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
      feedback.append(
        h('p', { class: `verdict verdict-${outcome}` }, VERDICT_TEXT[outcome]),
        h('p', { class: 'why' }, d.why),
        cont,
      );
      cont.focus({ preventScroll: true });
      cont.addEventListener('click', () => {
        overlay.classList.add('closing');
        overlay.style.pointerEvents = 'none';
        // Plain timer: the round's scope is disposed right after we resolve.
        setTimeout(() => overlay.remove(), 260);
        resolve(outcome);
      });
    };

    buttons.forEach((b, i) =>
      b.addEventListener('click', () => {
        settle(opts[i].v, i);
      }),
    );

    /** The pause is in: the space opens, the responses come out and the fuse is lit. */
    let open = false;
    const unlock = (byKeyboard = false) => {
      if (open) return;
      open = true;
      gate.classList.add('paused');
      lockIcon.textContent = '🔓';
      hand.disabled = true;
      audio.pluck(4);
      vibrate(15);
      scope.timeout(() => {
        overlay.classList.add('live');
        buttons.forEach((b, i) => {
          b.disabled = false;
          b.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
            duration: 260,
            delay: i * 70,
            fill: 'backwards',
            easing: 'ease-out',
          });
        });
        // keyboard users continue to the first answer; on touch nothing is pre-selected
        if (byKeyboard) buttons[0]?.focus({ preventScroll: true });
        // on a short screen, make sure every answer is in view (the title has done its job)
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
      }, 380);
    };

    const centre = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    /** Moves the hand by (dx, dy) from where it rests. */
    const place = (dx: number, dy: number, glide = false) => {
      hand.style.transition = glide ? 'transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1)' : 'none';
      hand.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const toSlot = () => {
      const a = centre(hand.parentElement!);
      const b = centre(slot);
      return { dx: b.x - a.x, dy: b.y - a.y };
    };
    const snapIn = (byKeyboard = false) => {
      if (open) return;
      const { dx, dy } = toSlot();
      place(dx, dy, true);
      hand.disabled = true;
      // once it lands, the space takes the hand and opens up
      scope.timeout(() => unlock(byKeyboard), 240);
    };

    /** A see-through hand shows the move: from the hand into the space. */
    let demoing = false;
    const demo = () => {
      if (open || demoing || reducedMotion()) return;
      demoing = true;
      hint.classList.add('nudge');
      const ghost = h('span', { class: 'gap-ghost', 'aria-hidden': 'true' }, '✋');
      hand.parentElement!.append(ghost);
      const { dx, dy } = toSlot();
      const anim = ghost.animate(
        [
          { transform: 'translate(0, 0)', opacity: 0 },
          { transform: 'translate(0, 0)', opacity: 0.7, offset: 0.15 },
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.7, offset: 0.75 },
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
        ],
        { duration: 1300, easing: 'ease-in-out' },
      );
      anim.onfinish = () => {
        ghost.remove();
        hint.classList.remove('nudge');
        demoing = false;
      };
    };
    if (timing.coach) scope.timeout(demo, 1200);

    let drag: { id: number; x: number; y: number; moved: boolean } | null = null;
    hand.addEventListener('pointerdown', (e) => {
      if (open) return;
      e.preventDefault();
      hand.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      hand.classList.add('held');
    });
    hand.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      place(dx, dy);
      const near = Math.hypot(centre(hand).x - centre(slot).x, centre(hand).y - centre(slot).y) < SNAP;
      slot.classList.toggle('near', near);
    });
    const release = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      hand.classList.remove('held');
      slot.classList.remove('near');
      if (Math.hypot(centre(hand).x - centre(slot).x, centre(hand).y - centre(slot).y) < SNAP) return snapIn();
      place(0, 0, true);
      // a tap instead of a drag: show how it's done
      if (!moved) demo();
    };
    hand.addEventListener('pointerup', release);
    hand.addEventListener('pointercancel', release);
    // keyboards and screen readers: Enter or Space puts the hand in the space
    hand.addEventListener('click', (e) => {
      if ((e as MouseEvent).detail === 0) snapIn(true);
    });
    hand.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  });
}

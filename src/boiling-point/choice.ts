import { h, shuffle, type Scope } from '../shared/dom';
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

/** Situation → a few seconds to read → pick a response before the fuse burns out. */
export function runChoice(
  layer: HTMLElement,
  scope: Scope,
  audio: AudioEngine,
  d: Dilemma,
  timing: { readSeconds: number; choiceSeconds: number },
): Promise<ChoiceOutcome> {
  const { readSeconds, choiceSeconds: seconds } = timing;
  return new Promise((resolve) => {
    const fuse = h('div', { class: 'fuse' }, h('div', { class: 'fuse-line' }), h('div', { class: 'fuse-spark' }));
    const list = h('div', { class: 'choice-options', role: 'group', 'aria-label': tr({ en: 'How do you respond?', he: 'איך מגיבים?', ar: 'كيف تردّون؟' }) });
    const feedback = h('div', { class: 'choice-feedback', 'aria-live': 'polite' });
    const card = h(
      'div',
      { class: 'choice-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': tr({ en: 'A moment before you respond', he: 'רגע לפני שמגיבים', ar: 'لحظة قبل أن تردّوا' }) },
      h('p', { class: 'choice-kicker' }, h('span', { class: 'thinker', html: THINKER }), h('span', {}, tr({ en: 'A moment before you respond', he: 'רגע לפני שמגיבים', ar: 'لحظة قبل أن تردّوا' }))),
      h('p', { class: 'choice-situation' }, d.situation),
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

    // Reading head start, then the fuse is lit.
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
    }, readSeconds * 1000);
  });
}

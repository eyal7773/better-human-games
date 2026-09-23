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

/** Situation → a few seconds to read → pick a response before the fuse burns out. */
export function runChoice(
  layer: HTMLElement,
  scope: Scope,
  audio: AudioEngine,
  d: Dilemma,
  seconds: number,
): Promise<ChoiceOutcome> {
  return new Promise((resolve) => {
    const fuse = h('div', { class: 'fuse' }, h('div', { class: 'fuse-line' }), h('div', { class: 'fuse-spark' }));
    const list = h('div', { class: 'choice-options', role: 'group', 'aria-label': tr({ en: 'How do you respond?', he: 'איך מגיבים?', ar: 'كيف تردّون؟' }) });
    const feedback = h('div', { class: 'choice-feedback', 'aria-live': 'polite' });
    const card = h(
      'div',
      { class: 'choice-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': tr({ en: 'A moment before you respond', he: 'רגע לפני שמגיבים', ar: 'لحظة قبل أن تردّوا' }) },
      h('p', { class: 'choice-kicker' }, tr({ en: 'A moment before you respond', he: 'רגע לפני שמגיבים', ar: 'لحظة قبل أن تردّوا' })),
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
        audio.tick(remaining <= 2);
        if (remaining <= 0) settle('timeout');
        else scope.timeout(tick, 1000);
      };
      scope.timeout(tick, 1000);
    }, 2000);
  });
}

import { h, shuffle, type Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import { vibrate } from '../shared/haptics';
import type { Dilemma, Verdict } from './content';

export type ChoiceOutcome = Verdict | 'timeout';

const VERDICT_TEXT: Record<ChoiceOutcome, string> = {
  best: 'תגובה רגועה ובונה.',
  ok: 'לא רע בכלל. יש גם דרך שמחברת יותר.',
  bad: 'זו התגובה של הרגע הרותח. מובנת — אבל בדרך כלל מחממת עוד יותר.',
  timeout: 'הזמן עבר. גם זה קורה — הנה מה שהיה עוזר:',
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
    const list = h('div', { class: 'choice-options', role: 'group', 'aria-label': 'איך מגיבים?' });
    const feedback = h('div', { class: 'choice-feedback', 'aria-live': 'polite' });
    const card = h(
      'div',
      { class: 'choice-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'רגע לפני שמגיבים' },
      h('p', { class: 'choice-kicker' }, 'רגע לפני שמגיבים'),
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
      const cont = h('button', { class: 'btn', type: 'button' }, 'המשך');
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

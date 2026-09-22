import { h } from '../../shared/dom';
import { vibrate } from '../../shared/haptics';
import type { Calm, CalmCtx } from './types';

const NEED = 10;
const WINDOW = 230; // ms either side of the beat
const BPM_FROM = 84;
const BPM_TO = 54;

/** Tap on the beat while the heart slows down. Rushing ahead of it heats you up. */
export class HeartCalm implements Calm {
  title = 'להאט את הדופק';
  hint = 'הקישו על הלב בדיוק כשהטבעת נסגרת עליו';

  constructor(private c: CalmCtx) {}

  mount() {
    const { board, scope, audio, fx } = this.c;
    const approach = h('div', { class: 'heart-approach' });
    const heart = h('button', {
      class: 'heart',
      type: 'button',
      'aria-label': 'הקישו בקצב הלב',
      html: `<svg viewBox="0 0 100 92" aria-hidden="true"><path d="M50 88 C20 66 4 50 4 28 C4 12 16 3 29 3 C39 3 46 9 50 17 C54 9 61 3 71 3 C84 3 96 12 96 28 C96 50 80 66 50 88Z"/></svg>`,
    });
    const bpmEl = h('div', { class: 'heart-bpm' }, String(BPM_FROM));
    const dots = h('div', { class: 'heart-dots' }, ...Array.from({ length: NEED }, () => h('i')));
    board.append(h('div', { class: 'heartbeat' }, h('div', { class: 'heart-stage' }, approach, heart), bpmEl, dots));

    let hits = 0;
    let finished = false;
    const bpm = () => BPM_FROM + (BPM_TO - BPM_FROM) * (hits / NEED);
    const interval = () => 60000 / bpm();
    let lastBeat = performance.now();
    let nextBeat = lastBeat + interval();
    let beat = 0; // index of lastBeat
    let hitBeat = -1; // index of the last beat that was scored
    let lastTap = 0;

    heart.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (finished) return;
      const now = performance.now();
      const toPrev = now - lastBeat;
      const toNext = nextBeat - now;
      const target = toPrev <= WINDOW ? beat : toNext <= WINDOW ? beat + 1 : null;
      const sinceTap = now - lastTap;
      lastTap = now;
      if (target !== null && target !== hitBeat) {
        hitBeat = target;
        hits++;
        dots.children[hits - 1]?.classList.add('on');
        fx.ring(e.clientX, e.clientY, '#2ec4b6', 70);
        audio.pluck(hits);
        this.c.heat(-7);
        vibrate(15);
        this.c.say(hits < NEED ? 'בדיוק. עוד אחת, לאט' : 'הלב נרגע');
        if (hits >= NEED) {
          finished = true;
          heart.classList.add('complete');
          bpmEl.textContent = String(BPM_TO);
          this.c.done();
        }
      } else if (sinceTap < interval() * 0.55 || target === hitBeat) {
        this.c.heat(3, e.clientX, e.clientY, 'מהר מדי');
        audio.sizzle();
        this.c.say('מהר מדי. חכו שהטבעת תיסגר');
      } else {
        this.c.say('כמעט. הקשה אחת בדיוק כשהטבעת פוגשת את הלב');
      }
    });
    heart.addEventListener('contextmenu', (e) => e.preventDefault());

    scope.loop(() => {
      if (finished) return;
      const now = performance.now();
      if (now >= nextBeat) {
        lastBeat = nextBeat;
        nextBeat = lastBeat + interval();
        beat++;
        audio.heartbeat();
        heart.animate([{ transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
        bpmEl.textContent = String(Math.round(bpm()));
      }
      // The ring shrinks onto the heart exactly at the next beat.
      const k = Math.min(1, (now - lastBeat) / (nextBeat - lastBeat));
      approach.style.transform = `translate(-50%, -50%) scale(${(1.9 - 0.9 * k).toFixed(3)})`;
      approach.style.opacity = String(0.25 + 0.75 * k);
    });
  }
}

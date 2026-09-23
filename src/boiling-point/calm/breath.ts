import { h } from '../../shared/dom';
import { vibrate } from '../../shared/haptics';
import type { Calm, CalmCtx } from './types';
import { tr } from '../../shared/i18n';

const IN = 4;
const OUT = 6;
const TOTAL = IN + OUT;
const RING = 2 * Math.PI * 46;

/** Press and hold through one slow breath: 4 seconds in, 6 seconds out. */
export class BreathCalm implements Calm {
  title = tr({ en: 'One long breath', he: 'נשימה אחת ארוכה', ar: 'نفَس واحد طويل' });
  hint = tr({ en: 'Press and hold the circle, and breathe with it', he: 'לחצו והחזיקו את העיגול, ונשמו איתו', ar: 'اضغطوا مطوّلًا على الدائرة، وتنفّسوا معها' });

  constructor(private c: CalmCtx) {}

  mount() {
    const { board, scope, audio } = this.c;
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ring.setAttribute('viewBox', '0 0 100 100');
    ring.setAttribute('class', 'breath-ring');
    ring.innerHTML = `<circle cx="50" cy="50" r="46" class="track"/><circle cx="50" cy="50" r="46" class="prog" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/>`;
    const prog = ring.querySelector('.prog') as SVGCircleElement;
    const label = h('div', { class: 'breath-label' }, tr({ en: 'Hold', he: 'החזיקו', ar: 'اضغطوا' }));
    const count = h('div', { class: 'breath-count' }, '');
    const orb = h('button', { class: 'breath-orb', type: 'button', 'aria-label': tr({ en: 'Press and hold to breathe', he: 'לחצו והחזיקו כדי לנשום', ar: 'اضغطوا مطوّلًا لتتنفّسوا' }) }, label, count);
    const wrap = h('div', { class: 'breath' }, h('div', { class: 'breath-halo' }), ring, orb);
    board.append(wrap);

    let held = 0;
    let holding = false;
    let phase: 'in' | 'out' | null = null;
    let finished = false;

    const press = (e: PointerEvent) => {
      e.preventDefault();
      if (finished) return;
      holding = true;
      orb.setPointerCapture(e.pointerId);
      wrap.classList.add('holding');
      phase = null;
      vibrate(10);
    };
    const release = () => {
      if (!holding || finished) return;
      holding = false;
      wrap.classList.remove('holding');
      if (held > 0.6) {
        const r = orb.getBoundingClientRect();
        this.c.heat(3, r.left + r.width / 2, r.top, tr({ en: 'let go early', he: 'עזבתם מוקדם', ar: 'تركتم مبكرًا' }));
        this.c.say(tr({ en: 'That’s okay. Press again and continue from the same point', he: 'זה בסדר. לוחצים שוב וממשיכים מאותה נקודה', ar: 'لا بأس. اضغطوا مجددًا وتابعوا من النقطة نفسها' }));
      }
    };
    orb.addEventListener('pointerdown', press);
    orb.addEventListener('pointerup', release);
    orb.addEventListener('pointercancel', release);
    orb.addEventListener('lostpointercapture', release);
    orb.addEventListener('contextmenu', (e) => e.preventDefault());

    scope.loop((dt) => {
      if (finished) return;
      if (holding) {
        held += dt;
        this.c.heat(-7 * dt);
      } else held = Math.max(0, held - 0.9 * dt);

      const now: 'in' | 'out' = held < IN ? 'in' : 'out';
      if (holding && now !== phase) {
        phase = now;
        audio.breath(now === 'in', now === 'in' ? IN - held : TOTAL - held);
        this.c.say(now === 'in' ? tr({ en: 'A long breath in through the nose…', he: 'שאיפה ארוכה דרך האף…', ar: 'شهيق طويل من الأنف…' }) : tr({ en: 'And now a slow breath out, even longer…', he: 'ועכשיו נשיפה איטית, ארוכה יותר…', ar: 'والآن زفير بطيء، أطول…' }));
      }
      const scale = held < IN ? 0.7 + 0.45 * (held / IN) : 1.15 - 0.45 * ((held - IN) / OUT);
      orb.style.transform = `scale(${scale.toFixed(3)})`;
      wrap.style.setProperty('--glow', String(Math.min(1, held / TOTAL)));
      prog.setAttribute('stroke-dashoffset', String(RING * (1 - Math.min(1, held / TOTAL))));
      label.textContent = holding ? (now === 'in' ? tr({ en: 'In', he: 'שאיפה', ar: 'شهيق' }) : tr({ en: 'Out', he: 'נשיפה', ar: 'زفير' })) : held > 0 ? tr({ en: 'Keep going', he: 'המשיכו', ar: 'تابعوا' }) : tr({ en: 'Hold', he: 'החזיקו', ar: 'اضغطوا' });
      count.textContent = holding ? String(Math.max(1, Math.ceil((now === 'in' ? IN : TOTAL) - held))) : '';

      if (held >= TOTAL) {
        finished = true;
        wrap.classList.add('complete');
        label.textContent = tr({ en: 'Lovely', he: 'יופי', ar: 'رائع' });
        count.textContent = '';
        vibrate([20, 60, 20]);
        this.c.done();
      }
    });
  }
}

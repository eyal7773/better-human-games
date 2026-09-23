import { h, pick, shuffle } from '../../shared/dom';
import { vibrate } from '../../shared/haptics';
import { sockSVG } from '../art';
import { type Task, type TaskCtx, toClient } from './types';
import { tr } from '../../shared/i18n';

interface Card {
  el: HTMLElement;
  kind: number;
  slot: number;
  open: boolean;
  matched: boolean;
  carried: boolean;
}

/** Classic memory: match the sock pairs from the laundry pile. */
export class PairsTask implements Task {
  title = tr({ en: 'Find the sock pairs', he: 'למצוא זוגות גרביים', ar: 'ابحثوا عن أزواج الجوارب' });
  hint = tr({ en: 'Flip two cards. A matching pair stays open', he: 'הפכו שני קלפים. זוג זהה נשאר פתוח', ar: 'اقلبوا بطاقتين. الزوج المتطابق يبقى مكشوفًا' });
  private cards: Card[] = [];
  private slots: { x: number; y: number }[] = [];
  private cw = 0;
  private ch = 0;
  private openCards: Card[] = [];
  private frozen = false;
  private matches = 0;
  private pairs = 6;

  constructor(private c: TaskCtx) {}

  mount() {
    const { board } = this.c;
    const W = board.clientWidth;
    const H = board.clientHeight;
    const cols = 3;
    const rows = 4;
    const gap = 10;
    this.cw = Math.min((W - gap * (cols + 1)) / cols, ((H - gap * (rows + 1)) / rows) * 0.8);
    this.ch = Math.min(this.cw * 1.25, (H - gap * (rows + 1)) / rows);
    const gridW = cols * this.cw + (cols - 1) * gap;
    const gridH = rows * this.ch + (rows - 1) * gap;
    const ox = (W - gridW) / 2;
    const oy = (H - gridH) / 2;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this.slots.push({ x: ox + c * (this.cw + gap) + this.cw / 2, y: oy + r * (this.ch + gap) + this.ch / 2 });

    const kinds = shuffle(Array.from({ length: this.pairs * 2 }, (_, i) => i % this.pairs));
    kinds.forEach((kind, i) => {
      const el = h(
        'button',
        { class: 'card', type: 'button', 'aria-label': tr({ en: 'Face-down card', he: 'קלף סגור', ar: 'بطاقة مقلوبة' }) },
        h(
          'div',
          { class: 'card-inner' },
          h('div', { class: 'card-back' }, h('span', {}, '?')),
          h('div', { class: 'card-face', html: sockSVG(kind) }),
        ),
      );
      el.style.width = `${this.cw}px`;
      el.style.height = `${this.ch}px`;
      const card: Card = { el, kind, slot: i, open: false, matched: false, carried: false };
      this.put(card, this.slots[i].x, this.slots[i].y);
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.tap(card);
      });
      this.cards.push(card);
      board.append(el);
      el.animate([{ transform: 'scale(0) rotate(-20deg)' }, { transform: 'none' }], {
        duration: 380,
        delay: i * 35,
        easing: 'cubic-bezier(.34,1.56,.64,1)',
        fill: 'backwards',
      });
    });
  }

  private put(card: Card, cx: number, cy: number) {
    card.el.style.left = `${cx - this.cw / 2}px`;
    card.el.style.top = `${cy - this.ch / 2}px`;
  }

  private setOpen(card: Card, open: boolean) {
    card.open = open;
    card.el.classList.toggle('open', open);
    card.el.setAttribute('aria-label', open ? tr({ en: 'Sock', he: 'גרב', ar: 'جورب' }) : tr({ en: 'Face-down card', he: 'קלף סגור', ar: 'بطاقة مقلوبة' }));
  }

  private tap(card: Card) {
    if (this.frozen || card.open || card.matched || card.carried || this.openCards.length >= 2) return;
    this.setOpen(card, true);
    this.c.audio.pop();
    this.openCards.push(card);
    if (this.openCards.length < 2) return;
    const [a, b] = this.openCards;
    if (a.kind === b.kind) {
      a.matched = b.matched = true;
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      this.openCards = [];
      this.matches++;
      vibrate(15);
      const s = this.slots[b.slot];
      const p = toClient(this.c.board, s.x, s.y);
      this.c.progress(this.matches, p.x, p.y);
      if (this.matches >= this.pairs) this.c.complete();
    } else {
      this.c.scope.timeout(() => {
        if (a.open && !a.matched) this.setOpen(a, false);
        if (b.open && !b.matched) this.setOpen(b, false);
        this.openCards = [];
      }, 650);
    }
  }

  private card(el: HTMLElement) {
    return this.cards.find((c) => c.el === el);
  }

  private hidden() {
    return this.cards.filter((c) => !c.open && !c.matched && !c.carried);
  }

  victim() {
    const hidden = this.hidden();
    return hidden.length ? pick(hidden).el : null;
  }

  center(el: HTMLElement) {
    const c = this.card(el);
    return c ? this.slots[c.slot] : { x: 0, y: 0 };
  }

  detach(el: HTMLElement) {
    const c = this.card(el);
    if (!c || c.open || c.matched || c.carried) return false;
    c.carried = true;
    el.classList.add('carried');
    return true;
  }

  carry(el: HTMLElement, x: number, y: number) {
    const c = this.card(el);
    if (c) this.put(c, x, y);
  }

  /** Dropping swaps the stolen card with whichever card sits nearest. */
  drop(el: HTMLElement, x: number, y: number) {
    const c = this.card(el);
    if (!c) return;
    let best = c.slot;
    let bestD = Infinity;
    this.slots.forEach((s, i) => {
      if (i === c.slot) return;
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const other = this.cards.find((o) => o.slot === best && o !== c);
    if (other && !other.carried) {
      other.slot = c.slot;
      this.glide(other, this.slots[other.slot]);
    }
    c.slot = best;
    c.carried = false;
    el.classList.remove('carried');
    this.glide(c, this.slots[best], { x, y });
  }

  private glide(card: Card, to: { x: number; y: number }, from?: { x: number; y: number }) {
    const r = card.el;
    const sx = from?.x ?? parseFloat(r.style.left) + this.cw / 2;
    const sy = from?.y ?? parseFloat(r.style.top) + this.ch / 2;
    void this.c.scope.tween(360, (k) => {
      if (!card.carried) this.put(card, sx + (to.x - sx) * k, sy + (to.y - sy) * k);
    });
  }

  /** Swap two hidden cards — and sometimes un-match a finished pair. Pure mischief. */
  shuffle() {
    const matched = this.cards.filter((c) => c.matched);
    if (matched.length && Math.random() < 0.35) {
      const kind = pick(matched).kind;
      for (const c of this.cards.filter((m) => m.kind === kind)) {
        c.matched = false;
        c.el.classList.remove('matched');
        this.setOpen(c, false);
      }
      this.matches--;
    }
    const hidden = shuffle(this.hidden());
    for (let i = 0; i + 1 < hidden.length && i < 4; i += 2) {
      const a = hidden[i];
      const b = hidden[i + 1];
      [a.slot, b.slot] = [b.slot, a.slot];
      this.glide(a, this.slots[a.slot]);
      this.glide(b, this.slots[b.slot]);
    }
  }

  freeze() {
    this.frozen = true;
  }
}

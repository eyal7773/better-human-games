import { h, clamp, pick, shuffle, rand } from '../../shared/dom';
import { vibrate } from '../../shared/haptics';
import { type Task, type TaskCtx, toClient } from './types';

const TOYS = ['🧸', '🚗', '🧩', '🪀', '⚽', '🦖', '🪁', '🎲'];
const CLOTHES = ['🧦', '👕', '👖', '🩳', '🧢', '👗', '🧤', '🧣'];

type Kind = 'toy' | 'clothes';

interface Item {
  el: HTMLElement;
  kind: Kind;
  emoji: string;
  x: number;
  y: number;
  sorted: boolean;
  carried: boolean;
  dragging: boolean;
  mini?: HTMLElement;
}

/** Drag toys into the toy box and clothes into the laundry basket. */
export class SortTask implements Task {
  title = 'לאסוף את הבלגן מהסלון';
  hint = 'גררו צעצועים לארגז, ובגדים לסל הכביסה';
  private items: Item[] = [];
  private bins!: Record<Kind, { el: HTMLElement; stack: HTMLElement }>;
  private size = 64;
  private floorH = 0;
  private frozen = false;
  private sortedCount = 0;

  constructor(private c: TaskCtx) {}

  mount() {
    const { board } = this.c;
    const W = board.clientWidth;
    const H = board.clientHeight;
    const binH = clamp(H * 0.26, 96, 140);
    this.floorH = H - binH - 14;
    this.size = clamp(Math.min(W / 5.2, this.floorH / 4.2), 50, 72);

    const mkBin = (kind: Kind, label: string, icon: string) => {
      const stack = h('div', { class: 'bin-stack' });
      const el = h(
        'div',
        { class: `bin bin-${kind}`, style: { height: `${binH}px` } },
        stack,
        h('div', { class: 'bin-front' }, h('span', { class: 'bin-icon' }, icon), h('span', { class: 'bin-label' }, label)),
      );
      board.append(el);
      return { el, stack };
    };
    this.bins = { toy: mkBin('toy', 'צעצועים', '🧸'), clothes: mkBin('clothes', 'כביסה', '🧺') };

    const n = 4 + (this.c.level >= 2 ? 1 : 0);
    const pool: { kind: Kind; emoji: string }[] = [
      ...shuffle([...TOYS]).slice(0, n).map((emoji) => ({ kind: 'toy' as Kind, emoji })),
      ...shuffle([...CLOTHES]).slice(0, n).map((emoji) => ({ kind: 'clothes' as Kind, emoji })),
    ];
    shuffle(pool);
    const cols = 4;
    const rows = Math.ceil(pool.length / cols);
    const cellW = W / cols;
    const cellH = this.floorH / rows;
    pool.forEach((p, i) => {
      const el = h('div', { class: 'token', role: 'img', 'aria-label': p.emoji }, p.emoji);
      el.style.width = el.style.height = `${this.size}px`;
      el.style.fontSize = `${this.size * 0.62}px`;
      const it: Item = { el, ...p, x: 0, y: 0, sorted: false, carried: false, dragging: false };
      this.place(it, (i % cols) * cellW + cellW / 2 + rand(-12, 12), Math.floor(i / cols) * cellH + cellH / 2 + rand(-10, 10));
      el.style.setProperty('--tilt', `${rand(-18, 18).toFixed(0)}deg`);
      this.bindDrag(it);
      this.items.push(it);
      board.append(el);
      el.animate([{ transform: 'translateY(-40px) scale(.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
        duration: 420,
        delay: i * 40,
        easing: 'cubic-bezier(.34,1.56,.64,1)',
        fill: 'backwards',
      });
    });
  }

  private place(it: Item, cx: number, cy: number, anywhere = false) {
    const W = this.c.board.clientWidth;
    const H = this.c.board.clientHeight;
    const s = this.size;
    it.x = clamp(cx, s / 2 + 2, W - s / 2 - 2);
    it.y = clamp(cy, s / 2 + 2, (anywhere ? H : this.floorH) - s / 2);
    it.el.style.left = `${it.x - s / 2}px`;
    it.el.style.top = `${it.y - s / 2}px`;
  }

  private binAt(x: number, y: number): Kind | null {
    const br = this.c.board.getBoundingClientRect();
    for (const k of ['toy', 'clothes'] as Kind[]) {
      const r = this.bins[k].el.getBoundingClientRect();
      const lx = r.left - br.left;
      const ly = r.top - br.top;
      if (x > lx - 10 && x < lx + r.width + 10 && y > ly - 30 && y < ly + r.height) return k;
    }
    return null;
  }

  private binCenter(k: Kind) {
    const br = this.c.board.getBoundingClientRect();
    const r = this.bins[k].el.getBoundingClientRect();
    return { x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height * 0.35 };
  }

  private bindDrag(it: Item) {
    let ox = 0;
    let oy = 0;
    let startX = 0;
    let startY = 0;
    const el = it.el;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.frozen || it.sorted || it.carried) return;
      it.dragging = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      const br = this.c.board.getBoundingClientRect();
      ox = e.clientX - br.left - it.x;
      oy = e.clientY - br.top - it.y;
      startX = it.x;
      startY = it.y;
      this.c.audio.pop();
    });
    el.addEventListener('pointermove', (e) => {
      if (!it.dragging) return;
      const br = this.c.board.getBoundingClientRect();
      this.place(it, e.clientX - br.left - ox, e.clientY - br.top - oy, true);
      const over = this.binAt(it.x, it.y);
      for (const k of ['toy', 'clothes'] as Kind[]) this.bins[k].el.classList.toggle('hover', over === k);
    });
    const end = () => {
      if (!it.dragging) return;
      it.dragging = false;
      el.classList.remove('dragging');
      for (const k of ['toy', 'clothes'] as Kind[]) this.bins[k].el.classList.remove('hover');
      if (this.frozen) {
        this.place(it, startX, startY);
        return;
      }
      const bin = this.binAt(it.x, it.y);
      const p = toClient(this.c.board, it.x, it.y);
      if (!bin) {
        this.place(it, it.x, it.y);
      } else if (bin !== it.kind) {
        this.c.miss(p.x, p.y);
        this.bins[bin].el.animate([{ transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'none' }], { duration: 240 });
        void this.c.scope.tween(260, (k) => this.place(it, it.x + (startX - it.x) * k, it.y + (startY - it.y) * k, true));
      } else {
        this.absorb(it, p);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  private absorb(it: Item, p: { x: number; y: number }) {
    it.sorted = true;
    this.sortedCount++;
    vibrate(12);
    const target = this.binCenter(it.kind);
    const sx = it.x;
    const sy = it.y;
    void this.c.scope
      .tween(220, (k) => {
        it.el.style.left = `${sx + (target.x - sx) * k - this.size / 2}px`;
        it.el.style.top = `${sy + (target.y - sy) * k - this.size / 2}px`;
        it.el.style.transform = `scale(${1 - 0.6 * k})`;
      })
      .then(() => {
        if (!it.sorted) return;
        it.el.style.display = 'none';
        it.el.style.transform = '';
        it.mini = h('span', { class: 'bin-mini', style: { rotate: `${rand(-25, 25).toFixed(0)}deg` } }, it.emoji);
        this.bins[it.kind].stack.append(it.mini);
      });
    this.c.progress(this.sortedCount, p.x, p.y);
    if (this.sortedCount >= this.items.length) this.c.complete();
  }

  private item(el: HTMLElement) {
    return this.items.find((i) => i.el === el);
  }

  victim() {
    const inBins = this.items.filter((i) => i.sorted && i.mini);
    const loose = this.items.filter((i) => !i.sorted && !i.carried && !i.dragging);
    if (inBins.length && (Math.random() < 0.7 || !loose.length)) return pick(inBins).el;
    return loose.length ? pick(loose).el : null;
  }

  center(el: HTMLElement) {
    const it = this.item(el);
    if (!it) return { x: 0, y: 0 };
    return it.sorted ? this.binCenter(it.kind) : { x: it.x, y: it.y };
  }

  detach(el: HTMLElement) {
    const it = this.item(el);
    if (!it || it.carried || it.dragging) return false;
    if (it.sorted) {
      if (!it.mini) return false;
      it.mini.remove();
      it.mini = undefined;
      it.sorted = false;
      this.sortedCount--;
      const c = this.binCenter(it.kind);
      it.el.style.display = '';
      it.el.style.transform = '';
      this.place(it, c.x, c.y, true);
    }
    it.carried = true;
    el.classList.add('carried');
    return true;
  }

  carry(el: HTMLElement, x: number, y: number) {
    const it = this.item(el);
    if (it) this.place(it, x, y, true);
  }

  drop(el: HTMLElement, x: number, y: number) {
    const it = this.item(el);
    if (!it) return;
    it.carried = false;
    el.classList.remove('carried');
    this.place(it, x, y);
  }

  shuffle() {
    const W = this.c.board.clientWidth;
    for (const it of this.items) {
      if (it.sorted || it.carried || it.dragging) continue;
      const sx = it.x;
      const sy = it.y;
      const tx = rand(this.size, W - this.size);
      const ty = rand(this.size, this.floorH - this.size / 2);
      void this.c.scope.tween(
        500,
        (k) => {
          if (!it.dragging && !it.carried && !it.sorted) this.place(it, sx + (tx - sx) * k, sy + (ty - sy) * k - Math.sin(k * Math.PI) * 40);
        },
      );
    }
  }

  freeze() {
    this.frozen = true;
  }
}

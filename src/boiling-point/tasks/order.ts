import { h, clamp, pick, shuffle, rand, ease } from '../../shared/dom';
import { vibrate } from '../../shared/haptics';
import { type Task, type TaskCtx, toClient } from './types';

const RECIPES = [
  { title: 'להכין כריך לגן', items: ['🍞', '🧈', '🧀', '🥬', '🍅', '🥒'] },
  { title: 'לערוך שולחן לארוחת ערב', items: ['🍽️', '🍴', '🥄', '🥛', '🍝', '🧂'] },
  { title: 'לארוז תיק לגן', items: ['🎒', '🥪', '💧', '🍎', '🧢', '🧥'] },
];
const DISTRACTORS = ['🍩', '🧃', '🍫', '🍭'];

interface Tile {
  el: HTMLElement;
  item: string;
  x: number;
  y: number;
  gone: boolean;
  carried: boolean;
}

/** Tap the items in the order shown on the strip. */
export class OrderTask implements Task {
  title: string;
  hint = 'הקישו על הפריטים לפי הסדר שבפס העליון';
  private recipe = pick(RECIPES);
  private tiles: Tile[] = [];
  private slots: HTMLElement[] = [];
  private next = 0;
  private size = 72;
  private top = 84;
  private frozen = false;

  constructor(private c: TaskCtx) {
    this.title = this.recipe.title;
  }

  mount() {
    const { board } = this.c;
    const W = board.clientWidth;
    const H = board.clientHeight;
    this.slots = this.recipe.items.map((it) => h('span', { class: 'recipe-slot' }, it));
    board.append(h('div', { class: 'recipe' }, ...this.slots));
    this.slots[0].classList.add('next');

    const items = [...this.recipe.items];
    if (this.c.level >= 2) items.push(...shuffle([...DISTRACTORS]).slice(0, this.c.level >= 3 ? 2 : 1));
    const cols = 3;
    const rows = Math.ceil(items.length / cols) + 1;
    const areaH = H - this.top - 8;
    this.size = clamp(Math.min(W / 4.2, areaH / (rows + 0.6)), 54, 92);
    const cellW = W / cols;
    const cellH = areaH / rows;
    const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, items.length);

    items.forEach((item, i) => {
      const cell = cells[i];
      const cx = (cell % cols) * cellW + cellW / 2 + rand(-cellW, cellW) * 0.18;
      const cy = this.top + Math.floor(cell / cols) * cellH + cellH / 2 + rand(-cellH, cellH) * 0.15;
      const el = h('button', { class: 'tile', type: 'button', 'aria-label': item }, item);
      el.style.width = el.style.height = `${this.size}px`;
      el.style.fontSize = `${this.size * 0.52}px`;
      const t: Tile = { el, item, x: 0, y: 0, gone: false, carried: false };
      this.place(t, cx, cy);
      el.style.setProperty('--tilt', `${rand(-8, 8).toFixed(1)}deg`);
      el.addEventListener('pointerdown', (e) => this.tap(t, e));
      this.tiles.push(t);
      board.append(el);
      el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        duration: 380,
        delay: i * 45,
        easing: 'cubic-bezier(.34,1.56,.64,1)',
        fill: 'backwards',
      });
    });
  }

  private place(t: Tile, cx: number, cy: number) {
    const W = this.c.board.clientWidth;
    const H = this.c.board.clientHeight;
    const s = this.size;
    t.x = clamp(cx, s / 2 + 4, W - s / 2 - 4);
    t.y = clamp(cy, this.top + s / 2, H - s / 2 - 4);
    t.el.style.left = `${t.x - s / 2}px`;
    t.el.style.top = `${t.y - s / 2}px`;
  }

  private tap(t: Tile, e: PointerEvent) {
    e.preventDefault();
    if (this.frozen || t.gone || t.carried) return;
    const want = this.recipe.items[this.next];
    const p = toClient(this.c.board, t.x, t.y);
    if (t.item !== want) {
      t.el.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }],
        { duration: 220 },
      );
      this.c.miss(p.x, p.y);
      return;
    }
    t.gone = true;
    const slot = this.slots[this.next];
    this.next++;
    this.c.progress(this.next, p.x, p.y);
    vibrate(12);
    const br = this.c.board.getBoundingClientRect();
    const sr = slot.getBoundingClientRect();
    const tx = sr.left - br.left + sr.width / 2;
    const ty = sr.top - br.top + sr.height / 2;
    const sx = t.x;
    const sy = t.y;
    t.el.classList.add('flying');
    void this.c.scope
      .tween(
        320,
        (k) => {
          t.el.style.left = `${sx + (tx - sx) * k - this.size / 2}px`;
          t.el.style.top = `${sy + (ty - sy) * k - this.size / 2}px`;
          t.el.style.transform = `scale(${1 - k * 0.5})`;
        },
        ease.inOut,
      )
      .then(() => {
        t.el.remove();
        slot.classList.remove('next');
        slot.classList.add('done');
        this.slots[this.next]?.classList.add('next');
      });
    if (this.next >= this.recipe.items.length) this.c.complete();
  }

  victim() {
    const left = this.tiles.filter((t) => !t.gone && !t.carried);
    if (!left.length) return null;
    const needed = left.find((t) => t.item === this.recipe.items[this.next]);
    return (needed && Math.random() < 0.6 ? needed : pick(left)).el;
  }

  private tile(el: HTMLElement) {
    return this.tiles.find((t) => t.el === el);
  }

  center(el: HTMLElement) {
    const t = this.tile(el);
    return t ? { x: t.x, y: t.y } : { x: 0, y: 0 };
  }

  detach(el: HTMLElement) {
    const t = this.tile(el);
    if (!t || t.gone || t.carried) return false;
    t.carried = true;
    el.classList.add('carried');
    return true;
  }

  carry(el: HTMLElement, x: number, y: number) {
    const t = this.tile(el);
    if (!t) return;
    t.x = x;
    t.y = y;
    el.style.left = `${x - this.size / 2}px`;
    el.style.top = `${y - this.size / 2}px`;
  }

  drop(el: HTMLElement, x: number, y: number) {
    const t = this.tile(el);
    if (!t) return;
    t.carried = false;
    el.classList.remove('carried');
    this.place(t, x, y);
  }

  shuffle() {
    const left = shuffle(this.tiles.filter((t) => !t.gone && !t.carried));
    for (let i = 0; i + 1 < left.length && i < 4; i += 2) {
      const a = left[i];
      const b = left[i + 1];
      const [ax, ay, bx, by] = [a.x, a.y, b.x, b.y];
      void this.c.scope.tween(420, (k) => {
        if (!a.gone && !a.carried) this.place(a, ax + (bx - ax) * k, ay + (by - ay) * k);
        if (!b.gone && !b.carried) this.place(b, bx + (ax - bx) * k, by + (ay - by) * k);
      });
    }
  }

  freeze() {
    this.frozen = true;
  }
}

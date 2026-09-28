import { h } from '../shared/dom';

/** Tuning overlay, shown with ?debug=1: F, tap rates, Pesky's state, fps and resolution. */
export class Debug {
  private el = h('pre', { class: 'c3-debug', 'aria-hidden': 'true' });
  private acc = 0;

  static wanted() {
    try {
      return new URLSearchParams(location.search).get('debug') === '1';
    } catch {
      return false;
    }
  }

  constructor(parent: HTMLElement) {
    parent.append(this.el);
  }

  update(dt: number, rows: Record<string, string | number | boolean>) {
    this.acc += dt;
    if (this.acc < 0.1) return;
    this.acc = 0;
    this.el.textContent = Object.entries(rows)
      .map(([k, v]) => `${k.padEnd(9)} ${typeof v === 'number' ? v.toFixed(2) : String(v)}`)
      .join('\n');
  }

  clear() {
    this.el.textContent = '';
  }
}

import { h } from '../shared/dom';
import { blob, diamond } from './art/kit';
import type { ItemDef } from './catalog';
import { footprint } from './iso';

/** A shop picture: the item standing on its own patch of grass. */
export function thumb(d: ItemDef) {
  const cv = h('canvas', { class: 'isl-thumb', width: '144', height: '144', 'aria-hidden': 'true' });
  const c = cv.getContext('2d')!;
  const f = footprint(d, false);
  const span = Math.max(f.w, f.d);
  // fit width (the footprint) and height (the item) into 72 css px
  const s = Math.min(1.05 / span, 58 / Math.max(30, d.h + (span * 32) / 2));
  c.scale(2, 2);
  c.translate(36, 44 + (d.h * s) / 2.4);
  c.scale(s, s);
  const ground = (k: number) => {
    for (let i = 0; i < f.w; i++)
      for (let j = 0; j < f.d; j++) diamond(c, ((i - j) * 64) / 2 + ((f.d - f.w) * 64) / 4, ((i + j) * 32) / 2 - ((f.w + f.d - 2) * 32) / 4, k, (i + j) % 2 ? '#8cc674' : '#86c070');
  };
  if (d.kind === 'ground') {
    diamond(c, 0, 0, 1.4, '#86c070');
    diamond(c, 0, 0, 1, d.id === 'stream' ? '#4fb6c6' : '#e3cfa5');
    return cv;
  }
  if (d.kind === 'ambient') {
    diamond(c, 0, 0, 1.3, '#86c070');
    for (const [x, y] of [
      [-18, -30],
      [10, -44],
      [22, -20],
      [-4, -14],
    ]) {
      const g = c.createRadialGradient(x, y, 0, x, y, 12);
      g.addColorStop(0, 'rgba(255,220,80,1)');
      g.addColorStop(1, 'rgba(255,220,80,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, 12, 0, Math.PI * 2);
      c.fill();
      blob(c, x, y, 2.5, '#fff6b0');
    }
    return cv;
  }
  ground(1);
  if (d.water === 'on') diamond(c, 0, 0, 1, '#4fb6c6');
  d.draw?.(c, 0, d.stages ?? 3, 3, d.id === 'waterfall' ? 1 : d.id === 'fence' ? 5 : 0);
  return cv;
}

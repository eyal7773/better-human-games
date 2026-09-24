import { h, clamp, lerp } from '../shared/dom';
import { pebbleSVG } from './art';
import { tr } from '../shared/i18n';

type RGB = [number, number, number];
const hex = (s: string): RGB => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;

// Colour temperature of the room: cool sky → sunny afternoon → scorching.
const STOPS: { at: number; top: RGB; bottom: RGB }[] = [
  { at: 0, top: hex('#bfe7ff'), bottom: hex('#8fd2ff') },
  // A pale midpoint keeps blue → yellow from passing through grey.
  { at: 0.25, top: hex('#eef9ff'), bottom: hex('#dcf1ff') },
  { at: 0.45, top: hex('#fff4c2'), bottom: hex('#ffd45a') },
  { at: 0.75, top: hex('#ffc27a'), bottom: hex('#ff7a3c') },
  { at: 1, top: hex('#ff7a5c'), bottom: hex('#e0262f') },
];

export function heatGradient(heat01: number) {
  const t = clamp(heat01, 0, 1);
  let i = 0;
  while (i < STOPS.length - 2 && t > STOPS[i + 1].at) i++;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const k = (t - a.at) / (b.at - a.at);
  return `linear-gradient(180deg, ${mix(a.top, b.top, k)} 0%, ${mix(a.bottom, b.bottom, k)} 100%)`;
}

export const toCelsius = (heat: number) => Math.round(20 + clamp(heat, 0, 100) * 0.8);

export class HUD {
  el: HTMLElement;
  private temp: HTMLElement;
  private cover: HTMLElement; // hides the part of the gradient above the current heat
  private zenNum: HTMLElement;
  zenEl: HTMLElement;
  private shown = -1;

  constructor(onMenu: () => void) {
    this.temp = h('div', { class: 'hud-temp', 'aria-live': 'off' }, '20°');
    this.cover = h('div', { class: 'hud-cover' });
    this.zenNum = h('span', { class: 'hud-zen-num' }, '0');
    this.zenEl = h('div', { class: 'hud-zen', title: tr({ en: 'Zen points', he: 'נקודות זן', ar: 'نقاط الهدوء' }), html: pebbleSVG('pebble hud-pebble') });
    this.zenEl.append(this.zenNum);
    this.el = h(
      'header',
      { class: 'hud' },
      h('button', { class: 'hud-menu', 'aria-label': tr({ en: 'Menu', he: 'תפריט', ar: 'القائمة' }), onclick: onMenu, html: '<span></span><span></span>' }),
      h(
        'div',
        { class: 'hud-thermo' },
        this.temp,
        h(
          'div',
          { class: 'hud-track', role: 'meter', 'aria-label': tr({ en: 'Temperature', he: 'טמפרטורה', ar: 'درجة الحرارة' }), 'aria-valuemin': '20', 'aria-valuemax': '100' },
          this.cover,
          h('i', { class: 'hud-mark', style: { insetInlineStart: '45%' } }),
          h('i', { class: 'hud-mark', style: { insetInlineStart: '80%' } }),
        ),
      ),
      this.zenEl,
    );
  }

  setHeat(heat: number) {
    const c = toCelsius(heat);
    this.cover.style.width = `${100 - clamp(heat, 0, 100)}%`;
    if (c !== this.shown) {
      this.shown = c;
      this.temp.textContent = `${c}°`;
      this.el.querySelector('.hud-track')?.setAttribute('aria-valuenow', String(c));
    }
    this.el.dataset.level = heat < 45 ? 'cool' : heat < 80 ? 'warm' : 'hot';
  }

  setZen(n: number, bump = false) {
    this.zenNum.textContent = String(n);
    if (bump) this.zenEl.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' });
  }
}

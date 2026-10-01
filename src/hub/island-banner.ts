import { h } from '../shared/dom';
import { tr } from '../shared/i18n';
import { wallet } from '../shared/zen';
import { pebbleSVG } from '../boiling-point/art';
import { def, ITEMS } from '../island/catalog';
import { canOwnMore } from '../island/economy';
import { daylight, Scene, type View } from '../island/render';
import { loadIsland } from '../island/save';

/**
 * The Calm Islands on the hub: a live little view of your garden, your zen,
 * and one line on what it's enough for. Plus a 🏝️ button in the top bar.
 */

const T = {
  title: tr({ en: 'Calm Islands', he: 'איי השקט', ar: 'جزر السكينة' }),
  zen: (n: number) => tr({ en: `${n} zen points`, he: `${n} נקודות זן`, ar: `${n} نقطة سكينة` }),
  points: tr({ en: 'zen points', he: 'נקודות זן', ar: 'نقطة سكينة' }),
  empty: tr({ en: 'Every calm moment in the games builds something here.', he: 'כל רגע של שקט במשחקים בונה כאן משהו.', ar: 'كل لحظة هدوء في الألعاب تبني شيئًا هنا.' }),
  enough: (name: string) => tr({ en: `Enough for: ${name}`, he: `מספיק בשביל: ${name}`, ar: `يكفي لـ: ${name}` }),
  toward: (n: number, name: string) => tr({ en: `${n} more for: ${name}`, he: `עוד ${n} בשביל: ${name}`, ar: `${n} أخرى لـ: ${name}` }),
  go: tr({ en: 'To the islands', he: 'לאיי השקט', ar: 'إلى الجزر' }),
};

function pitch() {
  if (!wallet.earned) return T.empty;
  const save = loadIsland(def);
  const open = ITEMS.filter((d) => d.cap !== Infinity && canOwnMore(save, d)).sort((a, b) => a.cost - b.cost);
  const affordable = open.filter((d) => d.cost <= wallet.zen).pop();
  if (affordable) return T.enough(affordable.name);
  const next = open[0];
  return next ? T.toward(next.cost - wallet.zen, next.name) : T.empty;
}

export function mountIslandBanner(before: Element | null, bar: Element | null) {
  const href = `${import.meta.env.BASE_URL}island/`;
  const canvas = h('canvas', { class: 'ib-canvas', 'aria-hidden': 'true' });
  const banner = h(
    'a',
    { class: 'island-banner', href },
    canvas,
    h(
      'div',
      { class: 'ib-body' },
      h('h2', {}, `🏝️ ${T.title}`),
      h('p', { class: 'ib-zen', html: pebbleSVG('pebble') }, h('b', {}, String(wallet.zen)), h('span', {}, T.points)),
      h('p', { class: 'ib-pitch' }, pitch()),
      h('span', { class: 'btn warm ib-cta' }, T.go),
    ),
  );
  before?.parentElement?.insertBefore(banner, before);
  bar?.prepend(h('a', { class: 'hub-isl', href, 'aria-label': `${T.title}: ${T.zen(wallet.zen)}` }, h('span', { 'aria-hidden': 'true' }, '🏝️'), h('b', {}, String(wallet.zen))));

  const save = loadIsland(def);
  const scene = new Scene(canvas);
  const view: View = { rev: 0, state: save, isle: 'garden', growth: wallet.growth, daylight: daylight(12), build: false, born: new Map(), poke: new Map() };
  const fit = () => {
    scene.resize();
    scene.fit(save.land.garden ?? 0, 6, 0);
  };
  let visible = false;
  let raf = 0;
  let t = 0;
  let last = performance.now();
  const tick = (now: number) => {
    t += Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const d = new Date();
    view.daylight = daylight(save.clock === 'day' ? 12 : save.clock === 'night' ? 23 : d.getHours() + d.getMinutes() / 60);
    scene.draw(view, t);
    raf = visible ? requestAnimationFrame(tick) : 0;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }).observe(canvas);
  addEventListener('resize', fit);
  fit();
  scene.draw(view, 0);
}

import { h, ltr } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import type { FX } from './fx';
import type { HUD } from './hud';
import type { RoundResult } from './round';

const HEAD: Record<RoundResult['outcome'], (r: RoundResult) => [string, string]> = {
  noticed: (r) => ['עצרתם בזמן', `שמתם לב ב־${ltr(`${r.pauseC}°`)} ועצרתם לפני שזה התפוצץ.`],
  forced: () => ['נרגעתם, בסוף', 'הפעם הקומקום שרק לפני שעצרתם. נסו ללחוץ ✋ כבר כשמרגישים את החום הראשון.'],
  finished: () => ['המשימה הושלמה', 'אבל לא עצרתם לנשום באמצע. לשים לב לחום זה חלק מהמשחק.'],
  boiled: () => ['רתחתם', 'הלחץ ניצח הפעם. בסיבוב הבא: לעצור מוקדם, ולהימנע מלחיצות עצבניות.'],
};

/** A small heat-over-time chart, with the moment you paused marked. */
function heatChart(r: RoundResult) {
  const W = 300;
  const H = 110;
  const s = r.samples.length ? r.samples : [10];
  const n = Math.max(2, s.length);
  // RTL: time flows from right to left, like the text.
  const x = (i: number) => W - (i / (n - 1)) * W;
  const y = (v: number) => H - 6 - (v / 100) * (H - 12);
  const pts = s.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${x(0)},${H} ${pts} ${x(s.length - 1)},${H}`;
  const forcedY = y(85);
  let marker = '';
  if (r.pauseSample != null) {
    const i = Math.min(s.length - 1, r.pauseSample);
    marker = `<line x1="${x(i)}" x2="${x(i)}" y1="0" y2="${H}" class="ch-pause"/><circle cx="${x(i)}" cy="${y(s[i])}" r="6" class="ch-dot"/>`;
  }
  return `
<svg viewBox="0 0 ${W} ${H}" class="heat-chart" role="img" aria-label="גרף החום לאורך הסיבוב">
  <defs>
    <linearGradient id="chHeat" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#2ec4b6"/><stop offset=".5" stop-color="#ff9f1c"/><stop offset="1" stop-color="#e5383b"/>
    </linearGradient>
  </defs>
  <line x1="0" x2="${W}" y1="${forcedY}" y2="${forcedY}" class="ch-limit"/>
  <polygon points="${area}" fill="url(#chHeat)" opacity=".18"/>
  <polyline points="${pts}" fill="none" stroke="url(#chHeat)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  ${marker}
</svg>`;
}

export function showSummary(
  modal: HTMLElement,
  r: RoundResult,
  ctx: { fx: FX; hud: HUD; audio: AudioEngine; zenBefore: number; last: boolean },
): Promise<void> {
  return new Promise((resolve) => {
    const [title, sub] = HEAD[r.outcome](r);
    const row = (label: string, pts: number, note = '') =>
      h('li', { class: pts ? '' : 'zero' }, h('span', {}, label, note && h('small', {}, note)), h('b', {}, pts ? ltr(`+${pts}`) : '0'));
    const choiceNote =
      r.choice === 'best' ? 'התגובה הרגועה' : r.choice === 'ok' ? 'תגובה סבירה' : r.choice === 'timeout' ? 'הזמן עבר' : r.choice ? 'תגובה רותחת' : '';
    const totalEl = h('div', { class: 'sum-total' }, h('span', {}, 'נקודות זן'), h('b', {}, ltr(`+${r.total}`)));
    const btn = h('button', { class: 'btn', type: 'button' }, ctx.last ? 'לסיכום הערב' : 'לסיבוב הבא');
    const card = h(
      'div',
      { class: `summary-card out-${r.outcome}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('h2', {}, title),
      h('p', { class: 'sum-sub' }, sub),
      h('div', { class: 'sum-chart', html: heatChart(r) }),
      h('div', { class: 'sum-legend' }, h('span', {}, `שיא: ${ltr(`${r.peakC}°`)}`), r.pauseC != null && h('span', { class: 'lg-pause' }, `עצירה: ${ltr(`${r.pauseC}°`)}`)),
      h(
        'ul',
        { class: 'sum-rows' },
        row('שמתם לב לחום', r.points.notice),
        row('נרגעתם', r.points.calm, r.impulsive ? `${r.impulsive} התפרצויות לחיצה` : ''),
        row('בחרתם תגובה', r.points.response, choiceNote),
        r.points.bonus ? row('סיימתם את המשימה', r.points.bonus) : null,
      ),
      totalEl,
      btn,
    );
    const overlay = h('div', { class: 'summary-overlay' }, card);
    modal.append(overlay);
    btn.focus({ preventScroll: true });

    if (r.total > 0) {
      setTimeout(() => {
        const tr = totalEl.getBoundingClientRect();
        const n = Math.min(14, Math.max(4, Math.round(r.total / 8)));
        ctx.fx.pebbles({ x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 }, ctx.hud.zenEl, n, (i) => {
          if (closed) return;
          ctx.hud.setZen(Math.round(ctx.zenBefore + (r.total * (i + 1)) / n), true);
          ctx.audio.coin(i);
        });
      }, 500);
    }
    let closed = false;
    btn.addEventListener('click', () => {
      closed = true;
      ctx.hud.setZen(ctx.zenBefore + r.total);
      overlay.remove();
      resolve();
    });
  });
}

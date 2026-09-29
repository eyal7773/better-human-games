import { clamp, lerp } from './dom';

/**
 * A family member's face that reacts live: mood −1 (hurt, defensive, red)
 * … 0 (neutral) … +1 (soft, open). `spikes` puffs them up like a hedgehog —
 * the funny version of getting defensive.
 */

export type Who = 'teen' | 'partner' | 'child' | 'grandma' | 'teenGirl';

const HAIR: Record<Who, { color: string; path: string; skin: string }> = {
  teen: { color: '#3b2a20', skin: '#f2c6a0', path: 'M22 46c-2-22 14-34 30-34s32 10 29 34c-6-10-14-14-20-12-8-8-26-8-39 12z' },
  teenGirl: {
    color: '#6b3a1f',
    skin: '#e9b48d',
    path: 'M18 60c-6-30 10-48 32-48s38 18 32 48c-2-18-8-26-14-30-10 6-26 6-36 0-6 4-12 12-14 30z',
  },
  partner: { color: '#2a2234', skin: '#d99e76', path: 'M20 44c0-20 14-30 30-30s30 10 30 30c-10-8-20-10-30-10s-20 2-30 10z' },
  child: { color: '#a4602a', skin: '#f7d0ae', path: 'M20 48c-2-24 12-34 30-34 20 0 32 12 30 34-4-6-10-10-16-10l-4-8-6 8c-8 0-22 2-34 10z' },
  grandma: {
    color: '#d9dbe3',
    skin: '#f0c7a4',
    path: 'M16 50c0-26 16-38 34-38s34 12 34 38c-6-12-12-16-20-18 2-6-4-10-14-10s-16 4-14 10c-8 2-14 6-20 18z',
  },
};

export function faceSVG(who: Who) {
  const hair = HAIR[who];
  const spikes = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const x1 = 50 + Math.cos(a) * 34;
    const y1 = 54 + Math.sin(a) * 34;
    const x2 = 50 + Math.cos(a) * 50;
    const y2 = 54 + Math.sin(a) * 50;
    const ax = 50 + Math.cos(a + 0.2) * 34;
    const ay = 54 + Math.sin(a + 0.2) * 34;
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${ax.toFixed(1)} ${ay.toFixed(1)}z"/>`;
  }).join('');
  return `<svg class="face-svg" viewBox="-6 -6 112 118" aria-hidden="true" data-who="${who}">
  <g class="fc-spikes" fill="#8a5a3c" stroke="#1d2b4f" stroke-width="2.5" stroke-linejoin="round" opacity="0">${spikes}</g>
  <ellipse cx="50" cy="104" rx="30" ry="4" fill="rgba(29,43,79,.16)"/>
  <circle class="fc-head" cx="50" cy="56" r="36" fill="${hair.skin}" stroke="#1d2b4f" stroke-width="3"/>
  <circle class="fc-flush" cx="50" cy="56" r="34" fill="#ff4a3a" opacity="0"/>
  <path d="${hair.path}" fill="${hair.color}" stroke="#1d2b4f" stroke-width="3" stroke-linejoin="round"/>
  <g class="fc-cheeks" fill="#ff7aa2"><circle cx="30" cy="68" r="5"/><circle cx="70" cy="68" r="5"/></g>
  <g fill="#1d2b4f"><ellipse class="fc-eye" cx="38" cy="58" rx="4" ry="4.6"/><ellipse class="fc-eye" cx="62" cy="58" rx="4" ry="4.6"/></g>
  <g fill="none" stroke="#1d2b4f" stroke-width="3.4" stroke-linecap="round">
    <path class="fc-brow fc-brow-l" d="M30 46h14"/><path class="fc-brow fc-brow-r" d="M56 46h14"/>
    <path class="fc-mouth" d="M40 76q10 4 20 0"/>
  </g>
</svg>`;
}

/** Updates a face made by faceSVG(). Cheap enough to call every frame. */
export function setFaceMood(svg: Element | null, mood: number, spikes = 0) {
  if (!svg) return;
  const m = clamp(mood, -1, 1);
  const q = (sel: string) => svg.querySelector(sel);
  const qa = (sel: string) => svg.querySelectorAll(sel);
  // Mouth: smile up for positive, frown for negative.
  const curve = lerp(0, 12, (m + 1) / 2) - 4;
  q('.fc-mouth')?.setAttribute('d', `M${40 - m * 3} 77q${10 + m * 3} ${curve.toFixed(1)} ${20 + m * 6} 0`);
  // Brows: angry slant when negative, soft raised when positive.
  const tilt = m < 0 ? m * 9 : m * -3;
  const lift = m > 0 ? -m * 3 : 0;
  q('.fc-brow-l')?.setAttribute('d', `M30 ${46 + lift - tilt}L44 ${46 + lift + tilt}`);
  q('.fc-brow-r')?.setAttribute('d', `M56 ${46 + lift + tilt}L70 ${46 + lift - tilt}`);
  // Squint a little when upset.
  qa('.fc-eye').forEach((e) => e.setAttribute('ry', (m < 0 ? 4.6 + m * 2.2 : 4.6).toFixed(2)));
  q('.fc-flush')?.setAttribute('opacity', (m < 0 ? -m * 0.32 : 0).toFixed(3));
  q('.fc-cheeks')?.setAttribute('opacity', (m > 0 ? 0.35 + m * 0.4 : 0.2).toFixed(3));
  const sp = q('.fc-spikes') as SVGGElement | null;
  if (sp) {
    sp.setAttribute('opacity', clamp(spikes, 0, 1).toFixed(3));
    sp.style.transform = `scale(${(0.7 + clamp(spikes, 0, 1) * 0.3).toFixed(3)})`;
    sp.style.transformOrigin = '50px 54px';
  }
}

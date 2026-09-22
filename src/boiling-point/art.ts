let uid = 0;

const GREMLIN_COLORS = ['#8b5cf6', '#ff5fa2', '#f97316', '#22c55e', '#0ea5e9', '#eab308'];

/** A fuzzy little "nudnik": spiky fur outline, huge eyes, mischievous grin. */
export function gremlinSVG(color = GREMLIN_COLORS[Math.floor(Math.random() * GREMLIN_COLORS.length)]) {
  const cx = 50;
  const cy = 54;
  const pts: string[] = [];
  const spikes = 30;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 ? 31 + Math.random() * 3 : 36 + Math.random() * 4;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r * 0.92).toFixed(1)}`);
  }
  const horn = Math.random() < 0.5;
  return `
<svg viewBox="0 0 100 104" class="gremlin-svg" aria-hidden="true">
  <ellipse cx="50" cy="99" rx="26" ry="4" fill="rgba(42,24,56,.18)"/>
  ${
    horn
      ? `<path d="M30 28 L24 8 L40 22 Z M70 28 L76 8 L60 22 Z" fill="${color}" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M50 20 Q54 4 64 8" fill="none" stroke="#2a1838" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="8" r="4" fill="#ffd447" stroke="#2a1838" stroke-width="2.5"/>`
  }
  <polygon points="${pts.join(' ')}" fill="${color}" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="38" cy="90" rx="9" ry="6" fill="${color}" stroke="#2a1838" stroke-width="3"/>
  <ellipse cx="62" cy="90" rx="9" ry="6" fill="${color}" stroke="#2a1838" stroke-width="3"/>
  <g class="g-eyes">
    <circle cx="38" cy="48" r="12" fill="#fff" stroke="#2a1838" stroke-width="3"/>
    <circle cx="63" cy="46" r="14" fill="#fff" stroke="#2a1838" stroke-width="3"/>
    <circle class="pupil" cx="40" cy="50" r="5.5" fill="#2a1838"/>
    <circle class="pupil" cx="65" cy="48" r="6.5" fill="#2a1838"/>
    <circle cx="42" cy="47" r="1.8" fill="#fff"/>
    <circle cx="67.5" cy="45" r="2" fill="#fff"/>
  </g>
  <path d="M34 66 Q50 82 68 64 Q52 72 34 66 Z" fill="#2a1838" stroke="#2a1838" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M40 68.5 l3 5 l3 -4.2 M58 68.5 l-2.5 4.6 l-3.2 -4" fill="#fff"/>
</svg>`;
}

export function flySVG() {
  return `
<svg viewBox="0 0 60 50" class="fly-svg" aria-hidden="true">
  <ellipse class="wing w1" cx="22" cy="14" rx="13" ry="8" fill="rgba(200,230,255,.75)" stroke="#2a1838" stroke-width="2"/>
  <ellipse class="wing w2" cx="38" cy="14" rx="13" ry="8" fill="rgba(200,230,255,.75)" stroke="#2a1838" stroke-width="2"/>
  <ellipse cx="30" cy="30" rx="13" ry="11" fill="#2a1838"/>
  <circle cx="21" cy="26" r="6" fill="#c0263a"/>
  <circle cx="39" cy="26" r="6" fill="#c0263a"/>
  <path d="M22 40 l-6 7 M30 41 v8 M38 40 l6 7" stroke="#2a1838" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}

export type SockPattern = 'stripes' | 'dots' | 'plain' | 'zigzag' | 'hearts' | 'toe';

export const SOCKS: { color: string; accent: string; pattern: SockPattern }[] = [
  { color: '#ff6b6b', accent: '#fff3e0', pattern: 'stripes' },
  { color: '#4d96ff', accent: '#ffd447', pattern: 'dots' },
  { color: '#ffd447', accent: '#2a1838', pattern: 'zigzag' },
  { color: '#3ecf8e', accent: '#fff', pattern: 'hearts' },
  { color: '#b983ff', accent: '#2a1838', pattern: 'toe' },
  { color: '#ff9f45', accent: '#fff', pattern: 'plain' },
];

export function sockSVG(i: number) {
  const s = SOCKS[i % SOCKS.length];
  const id = `sock${uid++}`;
  const path = 'M30 8 H62 V58 Q62 70 72 76 Q88 84 84 98 Q80 110 62 106 L34 98 Q22 94 26 78 L30 62 Z';
  let pattern = '';
  switch (s.pattern) {
    case 'stripes':
      pattern = [24, 36, 48].map((y) => `<rect x="20" y="${y}" width="60" height="6" fill="${s.accent}"/>`).join('');
      break;
    case 'dots':
      pattern = [
        [38, 22],
        [54, 30],
        [40, 44],
        [55, 56],
        [44, 68],
        [66, 88],
        [48, 90],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${s.accent}"/>`)
        .join('');
      break;
    case 'zigzag':
      pattern = `<path d="M26 34 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 M26 52 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" fill="none" stroke="${s.accent}" stroke-width="3.5"/>`;
      break;
    case 'hearts':
      pattern = [
        [42, 30],
        [52, 54],
        [64, 90],
      ]
        .map(
          ([x, y]) =>
            `<path transform="translate(${x} ${y}) scale(.9)" d="M0 4 C0 -2 8 -2 8 4 C8 -2 16 -2 16 4 C16 10 8 14 8 16 C8 14 0 10 0 4Z" fill="${s.accent}"/>`,
        )
        .join('');
      break;
    case 'toe':
      pattern = `<path d="M60 78 Q80 80 86 96 L86 112 L50 112 Z" fill="${s.accent}" opacity=".85"/><rect x="20" y="8" width="60" height="10" fill="${s.accent}" opacity=".85"/>`;
      break;
    case 'plain':
      pattern = `<rect x="20" y="8" width="60" height="8" fill="${s.accent}"/><rect x="20" y="20" width="60" height="3" fill="${s.accent}"/>`;
      break;
  }
  return `
<svg viewBox="0 0 100 116" class="sock-svg" aria-hidden="true">
  <defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs>
  <path d="${path}" fill="${s.color}"/>
  <g clip-path="url(#${id})">${pattern}</g>
  <path d="${path}" fill="none" stroke="#2a1838" stroke-width="3.5" stroke-linejoin="round"/>
</svg>`;
}

/** The zen-point currency: a smooth river pebble. */
export function pebbleSVG(cls = 'pebble') {
  return `
<svg viewBox="0 0 40 32" class="${cls}" aria-hidden="true">
  <path d="M5 18 Q3 6 18 4 Q34 2 37 14 Q39 27 21 29 Q7 30 5 18Z" fill="#2ec4b6" stroke="#2a1838" stroke-width="2.5"/>
  <path d="M11 12 Q16 7 24 8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
</svg>`;
}

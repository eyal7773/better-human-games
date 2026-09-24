/** The player's little toy character: a glossy blob with a face. */

export const AVATAR_COLORS = ['#ff5a4e', '#ff9f1c', '#ffc61a', '#3fcf6a', '#2f9bff', '#9a6bff'];

const BODIES = [
  '<circle cx="50" cy="56" r="36"/>',
  '<rect x="25" y="14" width="50" height="78" rx="25"/>',
  '<rect x="14" y="24" width="72" height="68" rx="24"/>',
  '<path d="M50 10C68 34 86 48 86 64a36 36 0 0 1-72 0C14 48 32 34 50 10Z"/>',
  '<ellipse cx="50" cy="62" rx="44" ry="30"/>',
];
export const AVATAR_SHAPES = BODIES.length;

const wrap = (i: number, n: number) => ((i % n) + n) % n;

/** Mixes a #rrggbb colour toward white (t > 0) or black (t < 0). */
function tint(hex: string, t: number) {
  const target = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const c = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k) + target * k));
  return `rgb(${c.join(',')})`;
}

let uid = 0;

export function avatarSVG(shape: number, color: number) {
  const body = BODIES[wrap(shape, BODIES.length)];
  const base = AVATAR_COLORS[wrap(color, AVATAR_COLORS.length)];
  const id = `avg${++uid}`;
  return `<svg class="avatar-svg" viewBox="0 0 100 100" aria-hidden="true">
  <defs><radialGradient id="${id}" cx="0.36" cy="0.3" r="0.85">
    <stop offset="0" stop-color="${tint(base, 0.45)}"/><stop offset="0.55" stop-color="${base}"/><stop offset="1" stop-color="${tint(base, -0.3)}"/>
  </radialGradient></defs>
  <ellipse cx="50" cy="95" rx="30" ry="4" fill="rgba(29,43,79,.18)"/>
  <g class="av-body" fill="url(#${id})">${body}</g>
  <ellipse cx="37" cy="40" rx="9" ry="5.5" fill="#fff" opacity=".5" transform="rotate(-28 37 40)"/>
  <g class="av-eyes"><circle cx="41" cy="58" r="4.2" fill="#1d2b4f"/><circle cx="59" cy="58" r="4.2" fill="#1d2b4f"/>
    <circle cx="42.4" cy="56.6" r="1.4" fill="#fff"/><circle cx="60.4" cy="56.6" r="1.4" fill="#fff"/></g>
  <circle cx="33" cy="67" r="4.5" fill="#ff7aa2" opacity=".55"/><circle cx="67" cy="67" r="4.5" fill="#ff7aa2" opacity=".55"/>
  <path d="M44 67q6 6 12 0" fill="none" stroke="#1d2b4f" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

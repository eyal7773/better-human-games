/**
 * The kettle is the player's stand-in: calm face when cool, gritted teeth
 * when hot. Colour and expression are driven from CSS via the
 * `data-mood` attribute (calm | warm | hot) and the `--kettle` variable.
 */
export function kettleSVG(extraClass = '') {
  return `
<svg class="kettle ${extraClass}" viewBox="0 0 140 124" aria-hidden="true" data-mood="calm">
  <ellipse cx="72" cy="116" rx="46" ry="6" class="k-shadow"/>
  <path class="k-handle" d="M40 46 C40 12, 104 12, 104 46" fill="none" stroke-width="9" stroke-linecap="round"/>
  <path class="k-spout" d="M34 78 L10 52 Q6 46 13 45 L20 47 L42 66 Z"/>
  <path class="k-body" d="M28 96 Q22 48 72 42 Q122 48 116 96 Q115 108 102 108 L42 108 Q29 108 28 96 Z"/>
  <path class="k-band" d="M29 92 Q72 100 115 92 L116 98 Q72 106 28 98 Z"/>
  <ellipse class="k-lid" cx="72" cy="42" rx="27" ry="7"/>
  <circle class="k-knob" cx="72" cy="31" r="6"/>
  <ellipse class="k-shine" cx="95" cy="62" rx="7" ry="12" transform="rotate(-25 95 62)"/>
  <g class="face face-calm">
    <path d="M52 72 q7 6 14 0" /><path d="M80 72 q7 6 14 0" />
    <path d="M62 86 q10 8 20 0" />
    <circle class="blush" cx="50" cy="84" r="5"/><circle class="blush" cx="96" cy="84" r="5"/>
  </g>
  <g class="face face-warm">
    <circle cx="59" cy="73" r="4.5" class="eye"/><circle cx="87" cy="73" r="4.5" class="eye"/>
    <path d="M51 64 l14 3" /><path d="M95 64 l-14 3" />
    <path d="M63 89 h18" />
  </g>
  <g class="face face-hot">
    <path d="M49 62 l17 7" /><path d="M97 62 l-17 7" />
    <circle cx="59" cy="75" r="5" class="eye"/><circle cx="87" cy="75" r="5" class="eye"/>
    <rect x="58" y="84" width="30" height="11" rx="4" class="mouth"/>
    <path class="teeth" d="M64 84 v11 M70 84 v11 M76 84 v11 M82 84 v11"/>
  </g>
</svg>`;
}

export function setKettleMood(svg: Element | null, heat01: number) {
  if (!svg) return;
  const mood = heat01 < 0.4 ? 'calm' : heat01 < 0.72 ? 'warm' : 'hot';
  if (svg.getAttribute('data-mood') !== mood) svg.setAttribute('data-mood', mood);
}

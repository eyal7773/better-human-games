/**
 * The runaway: the prototype's red "catch me" button, grown a face, arms and
 * sneakers. Expressions are switched from CSS through `data-face`, and every
 * face part carries a `data-f` list of the faces it belongs to.
 */
export type Face = 'tease' | 'run' | 'shock' | 'dizzy' | 'calm' | 'laugh';

let uid = 0;

export function buddySVG(extraClass = '') {
  const g = `bd${uid++}`;
  return `
<svg class="buddy-svg ${extraClass}" viewBox="0 0 120 134" aria-hidden="true">
  <defs>
    <radialGradient id="${g}-dome" cx="0.36" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#ff8a7a"/>
      <stop offset="0.45" stop-color="#f2463b"/>
      <stop offset="1" stop-color="#b8182c"/>
    </radialGradient>
    <linearGradient id="${g}-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6d5a80"/>
      <stop offset="1" stop-color="#3b2352"/>
    </linearGradient>
  </defs>

  <g class="bd-leg bd-leg-l">
    <path d="M47 100 L43 119" stroke="#2a1838" stroke-width="7" stroke-linecap="round"/>
    <path d="M30 124 Q30 115 42 115 Q52 115 52 122 Q52 127 44 127 L34 127 Q30 127 30 124Z" fill="#fff" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/>
    <path d="M36 121 h10" stroke="#ff5fa2" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <g class="bd-leg bd-leg-r">
    <path d="M73 100 L77 119" stroke="#2a1838" stroke-width="7" stroke-linecap="round"/>
    <path d="M90 124 Q90 115 78 115 Q68 115 68 122 Q68 127 76 127 L86 127 Q90 127 90 124Z" fill="#fff" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/>
    <path d="M74 121 h10" stroke="#ff5fa2" stroke-width="2.5" stroke-linecap="round"/>
  </g>

  <g class="bd-arm bd-arm-l">
    <path d="M24 90 Q12 88 10 76" fill="none" stroke="#2a1838" stroke-width="6" stroke-linecap="round"/>
    <circle cx="10" cy="72" r="6.5" fill="#fff" stroke="#2a1838" stroke-width="3"/>
  </g>
  <g class="bd-arm bd-arm-r">
    <path d="M96 90 Q108 88 110 76" fill="none" stroke="#2a1838" stroke-width="6" stroke-linecap="round"/>
    <circle cx="110" cy="72" r="6.5" fill="#fff" stroke="#2a1838" stroke-width="3"/>
  </g>

  <path d="M19 86 V96 A41 11 0 0 0 101 96 V86 Z" fill="url(#${g}-base)" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="60" cy="86" rx="41" ry="11" fill="#8a779c" stroke="#2a1838" stroke-width="3"/>
  <path d="M27 92 A35 7 0 0 0 93 92" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2.5" stroke-linecap="round"/>

  <g class="bd-dome">
    <path d="M25 86 C23 50 39 30 60 30 C81 30 97 50 95 86 A35 9 0 0 1 25 86 Z" fill="url(#${g}-dome)" stroke="#2a1838" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="42" cy="46" rx="10" ry="5.5" transform="rotate(-32 42 46)" fill="#fff" opacity=".75"/>
    <circle cx="33" cy="57" r="2.6" fill="#fff" opacity=".7"/>

    <g class="bd-face">
      <circle class="bd-blush" cx="36" cy="72" r="5.5" fill="#ff8fab" opacity=".7" data-f="tease calm laugh"/>
      <circle class="bd-blush" cx="84" cy="72" r="5.5" fill="#ff8fab" opacity=".7" data-f="tease calm laugh"/>

      <g class="bd-eyes" data-f="tease run shock">
        <ellipse cx="47" cy="60" rx="9" ry="10.5" fill="#fff" stroke="#2a1838" stroke-width="2.6"/>
        <ellipse cx="73" cy="60" rx="9" ry="10.5" fill="#fff" stroke="#2a1838" stroke-width="2.6"/>
        <g class="bd-pupils">
          <circle cx="48" cy="61" r="4.6" fill="#2a1838"/>
          <circle cx="74" cy="61" r="4.6" fill="#2a1838"/>
          <circle cx="49.8" cy="59" r="1.5" fill="#fff"/>
          <circle cx="75.8" cy="59" r="1.5" fill="#fff"/>
        </g>
      </g>

      <g fill="none" stroke="#2a1838" stroke-width="3" stroke-linecap="round">
        <path d="M38 47 Q45 42 53 46" data-f="tease"/>
        <path d="M67 48 Q74 46 81 49" data-f="tease"/>
        <path d="M38 45 Q46 40 54 44" data-f="shock"/>
        <path d="M66 44 Q74 40 82 45" data-f="shock"/>
        <path d="M40 49 L54 52" data-f="run"/>
        <path d="M80 49 L66 52" data-f="run"/>

        <path d="M40 61 Q47 54 54 61" data-f="calm laugh"/>
        <path d="M66 61 Q73 54 80 61" data-f="calm laugh"/>

        <path d="M42 56 l10 9 M52 56 l-10 9" data-f="dizzy"/>
        <path d="M68 56 l10 9 M78 56 l-10 9" data-f="dizzy"/>
        <path d="M48 80 q4 -4 8 0 t8 0 t8 0" data-f="dizzy"/>

        <path d="M50 75 Q60 81 71 72" data-f="tease"/>
        <path d="M52 77 Q60 82 68 77" data-f="calm"/>
      </g>
      <path d="M59 79 Q60 87 66 85 Q70 83 67 77" fill="#ff5f7e" stroke="#2a1838" stroke-width="2.4" stroke-linejoin="round" data-f="tease"/>
      <path d="M47 73 Q60 92 73 73 Z" fill="#2a1838" stroke="#2a1838" stroke-width="2.6" stroke-linejoin="round" data-f="run laugh"/>
      <path d="M52 75 H68 L66 79 H54 Z" fill="#fff" data-f="run laugh"/>
      <path d="M55 83 Q60 88 65 83" fill="#ff5f7e" data-f="laugh"/>
      <ellipse cx="60" cy="79" rx="5" ry="6.5" fill="#2a1838" data-f="shock"/>
    </g>
  </g>
</svg>`;
}

/** A buddy element you can pose, point its eyes and flip. */
export class Buddy {
  el: HTMLElement;
  private pupils: SVGGElement;

  constructor(extraClass = '') {
    this.el = document.createElement('div');
    this.el.className = `buddy ${extraClass}`;
    this.el.innerHTML = buddySVG();
    this.pupils = this.el.querySelector('.bd-pupils')!;
    this.face('tease');
  }

  face(f: Face) {
    this.el.dataset.face = f;
  }

  /** Point the eyes toward a direction (any length; it is normalised). */
  look(dx: number, dy: number) {
    if (this.el.classList.contains('flip')) dx = -dx; // the sprite is mirrored
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 120) * 3.2;
    this.pupils.setAttribute('transform', `translate(${((dx / d) * k).toFixed(2)} ${((dy / d) * k).toFixed(2)})`);
  }
}

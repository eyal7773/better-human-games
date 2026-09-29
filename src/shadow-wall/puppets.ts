import type { Puppet } from './content';

/**
 * Shadow-puppet silhouettes, drawn as paths in a unit box (−0.5…0.5), and
 * the monster parts the shadow grows while it's too big: horns, thorns,
 * claws, a jagged mouth and eyes the light shines through. `k` is how much
 * monster is left (0…1).
 */

type C = CanvasRenderingContext2D;

export function puppetPath(c: C, p: Puppet) {
  c.beginPath();
  switch (p) {
    case 'cup':
      c.moveTo(-0.3, -0.42);
      c.lineTo(0.3, -0.42);
      c.lineTo(0.2, 0.45);
      c.lineTo(-0.2, 0.45);
      c.closePath();
      c.moveTo(0.06, -0.42);
      c.lineTo(0.2, -0.66);
      c.lineTo(0.26, -0.62);
      c.lineTo(0.14, -0.42);
      c.closePath();
      break;
    case 'marker':
      c.moveTo(-0.14, -0.5);
      c.lineTo(0.14, -0.5);
      c.lineTo(0.14, 0.26);
      c.lineTo(0.06, 0.34);
      c.lineTo(0.03, 0.48);
      c.lineTo(-0.03, 0.48);
      c.lineTo(-0.06, 0.34);
      c.lineTo(-0.14, 0.26);
      c.closePath();
      break;
    case 'clock':
      c.arc(0, 0.04, 0.38, 0, Math.PI * 2);
      c.moveTo(-0.2, -0.36);
      c.arc(-0.26, -0.38, 0.13, 0, Math.PI * 2);
      c.moveTo(0.4, -0.38);
      c.arc(0.26, -0.38, 0.13, 0, Math.PI * 2);
      c.rect(-0.3, 0.34, 0.08, 0.14);
      c.rect(0.22, 0.34, 0.08, 0.14);
      break;
    case 'phone':
      c.roundRect(-0.26, -0.48, 0.52, 0.96, 0.1);
      break;
    case 'car':
      c.moveTo(-0.5, 0.2);
      c.lineTo(-0.46, -0.02);
      c.lineTo(-0.24, -0.06);
      c.lineTo(-0.12, -0.28);
      c.lineTo(0.2, -0.28);
      c.lineTo(0.32, -0.06);
      c.lineTo(0.48, -0.02);
      c.lineTo(0.5, 0.2);
      c.closePath();
      c.moveTo(-0.16, 0.22);
      c.arc(-0.28, 0.22, 0.12, 0, Math.PI * 2);
      c.moveTo(0.4, 0.22);
      c.arc(0.28, 0.22, 0.12, 0, Math.PI * 2);
      break;
    case 'mug':
      c.roundRect(-0.36, -0.36, 0.52, 0.76, 0.08);
      c.moveTo(0.44, 0.02);
      c.arc(0.2, 0.02, 0.24, 0, Math.PI * 2, false);
      c.moveTo(0.3, 0.02);
      c.arc(0.2, 0.02, 0.1, 0, Math.PI * 2, true);
      break;
    case 'mouth':
      c.moveTo(-0.48, -0.1);
      c.quadraticCurveTo(0, -0.26, 0.48, -0.1);
      c.quadraticCurveTo(0.3, 0.46, 0, 0.46);
      c.quadraticCurveTo(-0.3, 0.46, -0.48, -0.1);
      c.closePath();
      break;
    case 'envelope':
      c.rect(-0.46, -0.3, 0.92, 0.6);
      break;
    case 'blob':
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const r = 0.4 + Math.sin(a * 5) * 0.05;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      break;
  }
}

/** Extra shadow the monster adds around the puppet. False when there's nothing to fill. */
export function monsterPath(c: C, k: number) {
  c.beginPath();
  if (k <= 0) return false;
  // Bulk: a hunched body swallowing the puppet.
  c.ellipse(0, 0.08, 0.5 + 0.2 * k, 0.46 + 0.16 * k, 0, 0, Math.PI * 2);
  // Horns.
  for (const s of [-1, 1]) {
    c.moveTo(s * 0.12, -0.3);
    c.quadraticCurveTo(s * 0.34, -0.5 - 0.2 * k, s * (0.28 + 0.2 * k), -0.62 - 0.36 * k);
    c.lineTo(s * 0.34, -0.34);
    c.closePath();
  }
  // Thorns along the back.
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i + 0.5) * (Math.PI / n);
    const rx = 0.5 + 0.2 * k;
    const ry = 0.46 + 0.16 * k;
    const bx = Math.cos(a) * rx;
    const by = 0.08 + Math.sin(a) * ry;
    const tip = 1 + 0.35 * k;
    c.moveTo(bx - 0.06, by + 0.02);
    c.lineTo(bx * tip, 0.08 + (by - 0.08) * tip);
    c.lineTo(bx + 0.06, by + 0.02);
    c.closePath();
  }
  // Claws.
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const y = 0.3 + i * 0.1;
      c.moveTo(s * 0.55, y);
      c.lineTo(s * (0.72 + 0.14 * k), y + 0.05);
      c.lineTo(s * 0.55, y + 0.08);
      c.closePath();
    }
  return true;
}

/** The holes light shines through: eyes and a jagged grin. False when there are none. */
export function monsterHoles(c: C, k: number) {
  c.beginPath();
  if (k <= 0.15) return false;
  for (const s of [-1, 1]) c.ellipse(s * 0.18, -0.08, 0.07 * k + 0.02, 0.045 * k + 0.015, s * 0.3, 0, Math.PI * 2);
  c.moveTo(-0.26, 0.12);
  const teeth = 6;
  for (let i = 0; i <= teeth; i++) {
    const x = -0.26 + (i * 0.52) / teeth;
    c.lineTo(x, i % 2 ? 0.12 + 0.1 * k : 0.14);
  }
  c.lineTo(0.26, 0.22);
  c.quadraticCurveTo(0, 0.3, -0.26, 0.22);
  c.closePath();
  return true;
}

/** Thorns that stay, glowing red, when something real is there. */
export function realThorns(c: C) {
  c.beginPath();
  for (const [x, y, dx, dy] of [
    [-0.34, -0.3, -0.18, -0.26],
    [0.34, -0.3, 0.18, -0.26],
  ]) {
    c.moveTo(x - 0.06, y + 0.04);
    c.lineTo(x + dx, y + dy);
    c.lineTo(x + 0.06, y - 0.02);
    c.closePath();
  }
}

/** The puppet itself, as a painted cut-out on its stick. */
export const PUPPET_COLOR: Record<Puppet, string> = {
  cup: '#ff9f1c',
  marker: '#9a6bff',
  clock: '#ff5a4e',
  phone: '#2f9bff',
  car: '#3fcf6a',
  mug: '#ffc61a',
  mouth: '#ff7aa2',
  envelope: '#f5f0e6',
  blob: '#58a6ff',
};

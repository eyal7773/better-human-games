import type { Puppet } from './content';

/**
 * Shadow-puppet silhouettes, drawn as paths in a unit box (−0.5…0.5), and
 * the monster each one grows while its shadow is too big — out of its own
 * shape, at its own anchors. `k` is how much monster is left (0…1).
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
      // The flap: a thin V the light shines through (drawn the other way round, so it's a hole).
      c.moveTo(-0.4, -0.26);
      c.lineTo(-0.35, -0.26);
      c.lineTo(0, -0.02);
      c.lineTo(0.35, -0.26);
      c.lineTo(0.4, -0.26);
      c.lineTo(0, 0.04);
      c.closePath();
      break;
    case 'cart':
      c.moveTo(-0.45, -0.3);
      c.lineTo(0.4, -0.3);
      c.lineTo(0.3, 0.12);
      c.lineTo(-0.36, 0.12);
      c.closePath();
      c.rect(-0.54, -0.46, 0.16, 0.07);
      c.rect(-0.48, -0.4, 0.05, 0.12);
      c.rect(-0.32, 0.12, 0.56, 0.06);
      c.moveTo(-0.17, 0.28);
      c.arc(-0.26, 0.28, 0.09, 0, Math.PI * 2);
      c.moveTo(0.27, 0.28);
      c.arc(0.18, 0.28, 0.09, 0, Math.PI * 2);
      break;
    case 'drill':
      c.roundRect(-0.42, -0.32, 0.58, 0.28, 0.08);
      c.moveTo(0.16, -0.24);
      c.lineTo(0.5, -0.19);
      c.lineTo(0.16, -0.12);
      c.closePath();
      c.roundRect(-0.3, -0.06, 0.2, 0.44, 0.05);
      c.roundRect(-0.36, 0.34, 0.32, 0.14, 0.03);
      break;
    case 'speaker':
      c.roundRect(-0.3, -0.48, 0.6, 0.96, 0.08);
      // Cones: holes the light shines through even at true size.
      c.moveTo(0.17, 0.16);
      c.arc(0, 0.16, 0.17, 0, Math.PI * 2, true);
      c.moveTo(0.08, -0.22);
      c.arc(0, -0.22, 0.08, 0, Math.PI * 2, true);
      break;
    case 'towel':
      c.moveTo(-0.42, -0.2);
      c.lineTo(0, -0.42);
      c.lineTo(0.42, -0.2);
      c.lineTo(0.36, -0.2);
      c.lineTo(0, -0.36);
      c.lineTo(-0.36, -0.2);
      c.closePath();
      c.rect(-0.03, -0.5, 0.06, 0.1);
      c.moveTo(-0.34, -0.2);
      c.lineTo(0.34, -0.2);
      c.lineTo(0.34, 0.36);
      for (let i = 0; i <= 8; i++) c.lineTo(0.34 - (i * 0.68) / 8, i % 2 ? 0.46 : 0.36);
      c.closePath();
      break;
    case 'cake':
      c.roundRect(-0.44, 0, 0.88, 0.4, 0.05);
      c.roundRect(-0.3, -0.22, 0.6, 0.24, 0.05);
      for (const x of [-0.14, 0, 0.14]) {
        c.rect(x - 0.025, -0.38, 0.05, 0.16);
        c.moveTo(x + 0.035, -0.45);
        c.ellipse(x, -0.45, 0.035, 0.06, 0, 0, Math.PI * 2);
      }
      break;
    case 'bulb':
      c.arc(0, -0.12, 0.32, 0, Math.PI * 2);
      c.rect(-0.14, 0.14, 0.28, 0.14);
      c.roundRect(-0.11, 0.28, 0.22, 0.18, 0.04);
      break;
    case 'megaphone':
      c.moveTo(-0.3, -0.12);
      c.lineTo(0.44, -0.42);
      c.lineTo(0.44, 0.42);
      c.lineTo(-0.3, 0.12);
      c.closePath();
      c.roundRect(-0.48, -0.1, 0.2, 0.2, 0.04);
      c.roundRect(-0.14, 0.08, 0.1, 0.34, 0.03);
      break;
    case 'wallet':
      c.rect(-0.38, -0.42, 0.52, 0.16);
      c.roundRect(-0.46, -0.28, 0.92, 0.56, 0.08);
      c.moveTo(0.38, 0);
      c.arc(0.3, 0, 0.08, 0, Math.PI * 2, true);
      break;
    case 'key':
      c.arc(-0.28, 0, 0.2, 0, Math.PI * 2);
      c.moveTo(-0.2, 0);
      c.arc(-0.28, 0, 0.08, 0, Math.PI * 2, true);
      c.rect(-0.1, -0.05, 0.6, 0.1);
      c.rect(0.28, 0.05, 0.07, 0.11);
      c.rect(0.4, 0.05, 0.07, 0.16);
      break;
    case 'laptop':
      c.roundRect(-0.36, -0.4, 0.72, 0.5, 0.04);
      c.moveTo(-0.48, 0.14);
      c.lineTo(0.48, 0.14);
      c.lineTo(0.4, 0.26);
      c.lineTo(-0.4, 0.26);
      c.closePath();
      break;
    case 'sign':
      c.roundRect(-0.3, -0.5, 0.6, 0.5, 0.06);
      c.rect(-0.04, 0, 0.08, 0.44);
      c.rect(-0.16, 0.44, 0.32, 0.06);
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

/**
 * Where a puppet grows its monster: eyes and a mouth inside its outline (light
 * shines through them), horns and claws on its edge. Each object becomes its
 * own monster — the cup's rim grows teeth, the clock's bells grow horns — and
 * all of it melts back into the plain outline at true size.
 */
interface Anchors {
  eyes: [number, number][];
  /** Centre x, y and width of the mouth. */
  mouth: [number, number, number];
  horns: [number, number][];
  /** x, y and which way the claw points (−1 left, 1 right). */
  claws: [number, number, number][];
}

const A = (eyes: number[], mouth: [number, number, number], horns: number[], claws: number[]): Anchors => ({
  eyes: [
    [eyes[0], eyes[1]],
    [eyes[2], eyes[3]],
  ],
  mouth,
  horns: [
    [horns[0], horns[1]],
    [horns[2], horns[3]],
  ],
  claws: [
    [claws[0], claws[1], -1],
    [claws[2], claws[3], 1],
  ],
});

export const ANCHORS: Record<Puppet, Anchors> = {
  cup: A([-0.1, -0.2, 0.1, -0.2], [0, 0.1, 0.26], [-0.28, -0.42, 0.28, -0.42], [-0.2, 0.42, 0.2, 0.42]),
  marker: A([-0.06, -0.34, 0.06, -0.34], [0, -0.12, 0.18], [-0.14, -0.5, 0.14, -0.5], [-0.14, 0.2, 0.14, 0.2]),
  clock: A([-0.13, -0.04, 0.13, -0.04], [0, 0.18, 0.3], [-0.26, -0.48, 0.26, -0.48], [-0.26, 0.46, 0.26, 0.46]),
  phone: A([-0.1, -0.24, 0.1, -0.24], [0, 0.06, 0.32], [-0.24, -0.48, 0.24, -0.48], [-0.26, 0.3, 0.26, 0.3]),
  car: A([-0.04, -0.16, 0.12, -0.16], [0.04, 0.08, 0.5], [-0.12, -0.28, 0.2, -0.28], [-0.28, 0.32, 0.28, 0.32]),
  mug: A([-0.2, -0.14, 0, -0.14], [-0.1, 0.14, 0.3], [-0.34, -0.36, 0.14, -0.36], [-0.36, 0.36, 0.44, 0.02]),
  mouth: A([-0.16, -0.06, 0.16, -0.06], [0, 0.2, 0.36], [-0.46, -0.1, 0.46, -0.1], [-0.3, 0.4, 0.3, 0.4]),
  envelope: A([-0.14, -0.12, 0.14, -0.12], [0, 0.12, 0.5], [-0.46, -0.3, 0.46, -0.3], [-0.46, 0.3, 0.46, 0.3]),
  blob: A([-0.15, -0.08, 0.15, -0.08], [0, 0.14, 0.36], [-0.2, -0.36, 0.2, -0.36], [-0.38, 0.2, 0.38, 0.2]),
  cart: A([-0.14, -0.18, 0.12, -0.18], [-0.02, 0, 0.4], [-0.45, -0.3, 0.4, -0.3], [-0.26, 0.36, 0.18, 0.36]),
  drill: A([-0.26, -0.22, -0.06, -0.22], [-0.16, -0.1, 0.22], [-0.4, -0.32, 0.1, -0.32], [-0.3, 0.46, -0.04, 0.46]),
  speaker: A([-0.15, -0.38, 0.15, -0.38], [0, 0.4, 0.3], [-0.3, -0.48, 0.3, -0.48], [-0.3, 0.44, 0.3, 0.44]),
  towel: A([-0.12, -0.04, 0.12, -0.04], [0, 0.18, 0.36], [-0.42, -0.2, 0.42, -0.2], [-0.34, 0.42, 0.34, 0.42]),
  cake: A([-0.12, -0.12, 0.12, -0.12], [0, 0.2, 0.5], [-0.14, -0.4, 0.14, -0.4], [-0.44, 0.38, 0.44, 0.38]),
  bulb: A([-0.12, -0.18, 0.12, -0.18], [0, 0, 0.3], [-0.22, -0.38, 0.22, -0.38], [-0.11, 0.44, 0.11, 0.44]),
  megaphone: A([0.1, -0.1, 0.28, -0.1], [0.2, 0.12, 0.24], [-0.3, -0.12, 0.44, -0.42], [-0.08, 0.4, 0.44, 0.4]),
  wallet: A([-0.18, -0.1, 0.06, -0.1], [-0.06, 0.12, 0.42], [-0.38, -0.42, 0.14, -0.42], [-0.46, 0.26, 0.46, 0.26]),
  key: A([-0.36, -0.12, -0.2, -0.12], [0.22, 0, 0.32], [-0.42, -0.14, -0.14, -0.14], [-0.44, 0.1, 0.47, 0.18]),
  laptop: A([-0.14, -0.24, 0.14, -0.24], [0, -0.04, 0.4], [-0.36, -0.4, 0.36, -0.4], [-0.48, 0.2, 0.48, 0.2]),
  sign: A([-0.12, -0.32, 0.12, -0.32], [0, -0.14, 0.36], [-0.3, -0.5, 0.3, -0.5], [-0.16, 0.48, 0.16, 0.48]),
};

/** Monster parts grown on the puppet's edge: horns, a ridge of spikes between them, claws. False when there's nothing. */
export function monsterPath(c: C, k: number, p: Puppet) {
  c.beginPath();
  if (k <= 0) return false;
  const a = ANCHORS[p];
  // Horns curl up and away from the middle.
  for (const [x, y] of a.horns) {
    const s = x < 0 ? -1 : 1;
    c.moveTo(x - 0.06, y + 0.03);
    c.quadraticCurveTo(x + s * 0.04, y - 0.2 * k, x + s * 0.16 * k, y - (0.1 + 0.36 * k));
    c.lineTo(x + 0.06, y + 0.03);
    c.closePath();
  }
  // A ridge of spikes between the horns.
  const [[x0, y0], [x1, y1]] = a.horns;
  for (let i = 1; i <= 3; i++) {
    const f = i / 4;
    const x = x0 + (x1 - x0) * f;
    const y = y0 + (y1 - y0) * f;
    c.moveTo(x - 0.05, y + 0.02);
    c.lineTo(x, y - 0.2 * k);
    c.lineTo(x + 0.05, y + 0.02);
    c.closePath();
  }
  // Claws: three curved talons each.
  for (const [x, y, d] of a.claws)
    for (let i = 0; i < 3; i++) {
      const yy = y - 0.06 + i * 0.06;
      c.moveTo(x, yy - 0.025);
      c.quadraticCurveTo(x + d * 0.12 * k, yy, x + d * 0.2 * k, yy + 0.08 * k);
      c.lineTo(x, yy + 0.025);
      c.closePath();
    }
  return true;
}

/**
 * The holes the light shines through: slanted eyes and a mouth. A fierce
 * monster grins with teeth; a gentle one (heavy scenes) only frowns.
 */
export function monsterHoles(c: C, k: number, p: Puppet, fierce = true) {
  c.beginPath();
  if (k <= 0.15) return false;
  const a = ANCHORS[p];
  a.eyes.forEach(([x, y], i) => {
    const s = i ? 1 : -1;
    c.moveTo(x + 0.03 + 0.04 * k, y);
    c.ellipse(x, y, 0.03 + 0.04 * k, 0.018 + 0.022 * k, s * 0.35, 0, Math.PI * 2);
  });
  const [mx, my, w] = a.mouth;
  const half = (w / 2) * (0.6 + 0.4 * k);
  if (fierce) {
    const teeth = 6;
    c.moveTo(mx - half, my);
    for (let i = 0; i <= teeth; i++) c.lineTo(mx - half + (i * 2 * half) / teeth, i % 2 ? my + 0.07 * k : my + 0.015);
    c.lineTo(mx + half, my + 0.06);
    c.quadraticCurveTo(mx, my + 0.06 + 0.08 * k, mx - half, my + 0.06);
    c.closePath();
  } else {
    c.moveTo(mx - half, my + 0.04);
    c.quadraticCurveTo(mx, my - 0.03 * k, mx + half, my + 0.04);
    c.lineTo(mx + half, my + 0.065);
    c.quadraticCurveTo(mx, my - 0.005 * k, mx - half, my + 0.065);
    c.closePath();
  }
  return true;
}

/** Thorns that stay, glowing red, when something real is there: at the puppet's own horn points. */
export function realThorns(c: C, p: Puppet) {
  c.beginPath();
  for (const [x, y] of ANCHORS[p].horns) {
    const s = x < 0 ? -1 : 1;
    c.moveTo(x - 0.06, y + 0.04);
    c.lineTo(x + s * 0.16, y - 0.24);
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
  cart: '#b0bec5',
  drill: '#ff9f1c',
  speaker: '#5c6bc0',
  towel: '#7ad3ff',
  cake: '#ffb3c7',
  bulb: '#ffe066',
  megaphone: '#f0433a',
  wallet: '#a0663a',
  key: '#ffcb2f',
  laptop: '#9aa6c2',
  sign: '#2f7fd8',
};

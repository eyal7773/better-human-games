import * as THREE from 'three';
import { kettleSVG } from '../../../shared/kettle';
import { arenaFor, box, canvasTex, cutout, cyl, disposeTree, footprint, gloss, shell, std, svgTex, tiles, type Room, type RoomSize } from '../kit';

type Mood = 'calm' | 'warm' | 'hot';
const MOOD_COLORS: Record<Mood, [string, string]> = {
  calm: ['#3fdcc2', '#10b09a'],
  warm: ['#ffc15e', '#e79a1f'],
  hot: ['#ff6b4a', '#c7362a'],
};

/** The kettle from the home page, as a standalone picture (its CSS inlined). */
export function kettleTexture(mood: Mood) {
  const [body, band] = MOOD_COLORS[mood];
  const ink = '#1d2b4f';
  const css = `.k-shadow{fill:rgba(29,43,79,.14)}.k-handle{stroke:${ink}}.k-body,.k-spout,.k-lid{fill:${body};stroke:${ink};stroke-width:3.5;stroke-linejoin:round}.k-band{fill:${band}}.k-knob{fill:${ink}}.k-shine{fill:#fff;opacity:.45}.face{fill:none;stroke:${ink};stroke-width:3.5;stroke-linecap:round;display:none}.face .eye{fill:${ink};stroke:none}.face .blush{fill:#ff7aa2;stroke:none;opacity:.8}.face .mouth{fill:#fff}.face .teeth{stroke-width:2}.face-${mood}{display:inline}`;
  const svg = kettleSVG()
    .trim()
    .replace(/<svg([^>]*)>/, `<svg$1 width="280" height="248"><style>${css}</style>`);
  return svgTex(svg, 280, 248);
}

/** Level 2 — the kitchen. The victim: the kettle. Pesky hides behind chairs. */
export function kitchen(size: RoomSize) {
  const { hw, hd } = size;
  const floor = tiles('#fef6e4', '#9fd8f5');
  floor.repeat.set(hw / 1.2, hd / 1.2);
  const wallTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#e6f7ff';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#c7e9fa';
    g.lineWidth = 4;
    for (let y = 0; y <= 256; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
  }, [hw, 1]);
  const s = shell(size, { floor: std(0xffffff, { map: floor }), wall: std(0xffffff, { map: wallTex }), side: std(0xd6effb), trim: 0xb8c7d9 });
  const g = s.group;

  // Counter along the back wall, fridge in the corner.
  const counterW = hw * 1.25;
  const counter = new THREE.Group();
  counter.add(box(counterW, 0.85, 0.62, gloss(0xffffff), 0, 0, 0, 0.04), box(counterW + 0.06, 0.07, 0.68, gloss(0xff9f1c), 0, 0.85, 0));
  for (let i = 0; i < 3; i++) counter.add(box(0.04, 0.3, 0.02, std(0xb8c7d9), -counterW / 2 + (counterW / 3) * (i + 0.5), 0.4, 0.32));
  counter.position.set(-hw + counterW / 2 + 0.05, 0, -hd + 0.34);
  const fridge = box(0.85, 1.65, 0.7, gloss(0xdff3ff), hw - 0.48, 0, -hd + 0.4, 0.08);
  const handle = box(0.05, 0.5, 0.05, std(0x8aa0b8), hw - 0.2, 0.7, -hd + 0.78);
  g.add(counter, fridge, handle);

  // The kettle on the counter.
  const tex = { calm: kettleTexture('calm'), warm: kettleTexture('warm'), hot: kettleTexture('hot') };
  const kettle = cutout(tex.calm, 0.8, 0.71, -hw + 0.7, 0.92, -hd + 0.38);
  g.add(kettle);

  // Table in the middle with chairs at its ends — Pesky hides behind the chairs.
  const table = new THREE.Group();
  const wood = gloss(0xf2b872, { clearcoat: 0.4 });
  table.add(box(1.5, 0.08, 0.9, wood, 0, 0.78, 0, 0.03));
  for (const [x, z] of [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]]) table.add(box(0.08, 0.78, 0.08, wood, x, 0, z));
  // Fruit bowl.
  table.add(cyl(0.22, 0.12, 0.1, gloss(0xffffff), 0, 0.86, 0));
  for (let i = 0; i < 3; i++) table.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), gloss([0xff5a4e, 0xffc61a, 0x3fcf6a][i])).translateX(-0.08 + i * 0.08).translateY(0.99));
  const tz = hd * 0.05;
  table.position.set(0.15, 0, tz);
  g.add(table);

  const chair = (x: number, z: number, flip: number) => {
    const c = new THREE.Group();
    const m = gloss(0xff5fa2, { clearcoat: 0.5 });
    c.add(box(0.5, 0.06, 0.5, m, 0, 0.5, 0, 0.02));
    for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) c.add(box(0.05, 0.5, 0.05, m, lx, 0, lz));
    c.add(box(0.06, 0.55, 0.5, m, 0.22 * flip, 0.56, 0, 0.02));
    c.position.set(x, 0, z);
    return c;
  };
  const chairs = [chair(0.15 - 1.15, tz + 0.2, -1), chair(0.15 + 1.15, tz + 0.2, 1)];
  g.add(...chairs);
  // A bin and a stool in the front half, to hide behind too.
  const bin = cyl(0.2, 0.17, 0.55, gloss(0x3fcf6a), -hw * 0.55, 0, hd * 0.5);
  const stool = new THREE.Group();
  stool.add(cyl(0.22, 0.22, 0.06, gloss(0xffc61a), 0, 0.6), cyl(0.04, 0.04, 0.6, std(0x8aa0b8)));
  stool.position.set(hw * 0.55, 0, hd * 0.45);
  g.add(bin, stool);

  const obstacles = [footprint(counter), footprint(fridge), footprint(table), ...chairs.map((c) => footprint(c)), footprint(bin), footprint(stool)];
  // Hiding spots sit just behind (farther from the camera than) each piece,
  // so part of him is always showing.
  const hideSpots = [
    { x: chairs[0].position.x, z: chairs[0].position.z - 0.62 },
    { x: chairs[1].position.x, z: chairs[1].position.z - 0.62 },
    { x: bin.position.x, z: bin.position.z - 0.55 },
    { x: stool.position.x, z: stool.position.z - 0.55 },
  ];
  const arena = arenaFor(size, obstacles, { hideSpots });
  arena.hideSpots = hideSpots.filter((p) => p.z > arena.minZ && !obstacles.some((b) => p.x > b.x0 - 0.38 && p.x < b.x1 + 0.38 && p.z > b.z0 - 0.38 && p.z < b.z1 + 0.38));

  let demo = 0;
  let pressed = 0;
  let mood: Mood = 'calm';
  const setMood = (m: Mood) => {
    if (m === mood) return;
    mood = m;
    (kettle.material as THREE.MeshBasicMaterial).map = tex[m];
  };

  const room: Room & { setHeat(h: number): void; kettle: THREE.Object3D } = {
    group: g,
    arena,
    kettle,
    victim: new THREE.Vector3(kettle.position.x, 1.3, kettle.position.z),
    press() {
      pressed = 1.4;
    },
    /** For the breathing demo: 0 = calm … 1 = boiling. */
    setHeat(h: number) {
      demo = h;
    },
    update(dt, t) {
      pressed = Math.max(0, pressed - dt);
      const heat = Math.max(demo, pressed > 0 ? 1 : 0);
      setMood(heat > 0.7 ? 'hot' : heat > 0.35 ? 'warm' : 'calm');
      kettle.rotation.z = mood === 'hot' ? Math.sin(t * 50) * 0.04 : 0;
    },
    bg: 'radial-gradient(120% 60% at 50% 0%, #e8fbff 0%, #a8e0ff 60%, #6cc8ff 100%)',
    fit: s.fit,
    dispose: () => disposeTree(g),
  };
  return room;
}

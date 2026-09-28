import * as THREE from 'three';
import { h } from '../../shared/dom';
import { LEVELS } from '../levels';
import { PeskyModel, type FaceSet } from '../pesky/model';
import { unlocked, type Save3D } from '../save';
import { countStars } from '../stars';
import { LEVEL_NAMES, T } from '../story';
import { kettleTexture } from './rooms/kitchen';
import { box, canvasTex, cutout, cyl, disposeTree, gloss, std } from './kit';
import type { World } from './scene';

/**
 * The map: the house in cross-section, like a dollhouse. Every room is a
 * button (real DOM buttons laid over the 3D rooms, for keyboards and screen
 * readers). A room opens once the one before it is done; done rooms can be
 * replayed. Rendered once — no frame loop while you're choosing.
 */

const CW = 2;
const CH = 1.45;
const CD = 1.5;

interface Cell {
  id: number;
  at: THREE.Vector3;
}

export function showMap(world: World, layer: HTMLElement, save: Save3D, faces: FaceSet, onPick: (id: number) => void) {
  const g = new THREE.Group();
  const cells: Cell[] = [];

  // The lawn (level 4 — the garden) in front of the house.
  const grass = std(0x7ddc5a);
  const lawn = box(6.2, 0.3, 4.4, [std(0x5fae3e), std(0x5fae3e), grass, grass, std(0x5fae3e), std(0x5fae3e)], 0, -0.3, 1.1);
  g.add(lawn);
  for (const [x, z] of [[-2.6, 2.6], [2.6, 2.4], [-2.7, 0.6]]) g.add(new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), std(0x3fa84a)).translateX(x).translateY(0.25).translateZ(z));
  const gnome = new THREE.Group();
  gnome.add(cyl(0.1, 0.16, 0.3, gloss(0x2f9bff)), new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 16), gloss(0xff5a4e)).translateY(0.52));
  gnome.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), std(0xffd6b0)).translateY(0.36).translateZ(0.03));
  gnome.position.set(1.6, 0, 2.3);
  g.add(gnome);
  cells.push({ id: 4, at: new THREE.Vector3(1.9, 0.1, 2.9) });

  const room = (id: number, x: number, y: number, wall: number, floor: number, deco: (r: THREE.Group) => void) => {
    const r = new THREE.Group();
    const open = unlocked(save, id);
    const tone = (c: number) => (open ? c : new THREE.Color(c).lerp(new THREE.Color(0x6b6f86), 0.6).getHex());
    r.add(box(CW, 0.12, CD, std(tone(floor)), 0, -0.12, 0));
    r.add(box(CW, CH, 0.1, std(tone(wall)), 0, 0, -CD / 2 + 0.05));
    r.add(box(0.1, CH, CD, std(0xfff4e0), -CW / 2 + 0.05, 0, 0), box(0.1, CH, CD, std(0xfff4e0), CW / 2 - 0.05, 0, 0));
    if (open) deco(r);
    r.position.set(x, y, 0);
    g.add(r);
    cells.push({ id, at: new THREE.Vector3(x, y + 0.12, CD / 2 + 0.05) });
  };
  const floorH = CH + 0.12;
  room(1, -CW / 2, 0, 0xffe2b8, 0xe7b57a, (r) => {
    r.add(box(0.9, 0.55, 0.08, gloss(0x2a2f45), 0.2, 0.35, -0.55), box(0.35, 0.3, 0.8, gloss(0x6a4bd8), -0.6, 0, -0.1));
  });
  room(2, CW / 2, 0, 0xe6f7ff, 0x9fd8f5, (r) => {
    r.add(box(1.2, 0.5, 0.35, gloss(0xffffff), -0.3, 0, -0.5), cutout(kettleTexture('calm'), 0.45, 0.4, -0.5, 0.5, -0.55), box(0.6, 0.04, 0.4, gloss(0xf2b872), 0.5, 0.45, 0.1));
  });
  room(3, -CW / 2, floorH, 0xe9dcff, 0xffd6e8, (r) => {
    r.add(box(0.8, 0.3, 0.55, gloss(0x7fc8f8), -0.4, 0, -0.35), box(0.8, 0.12, 0.55, gloss(0xffffff), -0.4, 0.3, -0.35));
    r.add(box(0.25, 0.4, 0.2, gloss(0x9aa7b8), 0.55, 0, 0));
  });
  room(6, CW / 2, floorH, 0xffe9c9, 0xd9a066, (r) => {
    r.add(box(0.8, 0.5, 0.6, std(0xc89a5c), 0, 0, -0.1), box(0.84, 0.06, 0.64, std(0xb07f45), 0, 0.5, -0.1));
  });
  // The roof (level 5) on top, with chimneys.
  const roofY = floorH * 2;
  const shape = new THREE.Shape();
  shape.moveTo(-CW - 0.25, 0);
  shape.lineTo(CW + 0.25, 0);
  shape.lineTo(0, 1.5);
  shape.closePath();
  const roofOpen = unlocked(save, 5);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: CD + 0.2, bevelEnabled: false }), gloss(roofOpen ? 0xe8674a : 0x8e7f86));
  roof.position.set(0, roofY - 0.12, -CD / 2 - 0.1);
  g.add(roof, box(0.3, 0.6, 0.3, std(roofOpen ? 0xb5523c : 0x7a6f75), -1.1, roofY + 0.3, -0.2), box(0.3, 0.5, 0.3, std(roofOpen ? 0xb5523c : 0x7a6f75), 1.05, roofY + 0.3, 0.1));
  cells.push({ id: 5, at: new THREE.Vector3(0, roofY + 0.55, CD / 2 + 0.1) });

  // Pesky, waving from the lawn.
  const pesky = new PeskyModel(faces);
  pesky.root.position.set(-2.1, 0, 2.7);
  pesky.update(0, { x: -2.1, z: 2.7, y: 0, running: false, stumbling: false, faceX: 0.3, faceZ: 1, reduced: true });
  g.add(pesky.root);

  // A sky backdrop with a sun.
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    new THREE.MeshBasicMaterial({
      map: canvasTex(64, 256, (c) => {
        const gr = c.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, '#6cc8ff');
        gr.addColorStop(1, '#e8f7ff');
        c.fillStyle = gr;
        c.fillRect(0, 0, 64, 256);
      }),
    }),
  );
  sky.position.set(0, 1, -6);
  sky.scale.set(1.6, 1.6, 1);
  g.add(sky);

  world.show(g);
  const pts = [new THREE.Vector3(-3.1, -0.3, 3.3), new THREE.Vector3(3.1, -0.3, 3.3), new THREE.Vector3(-CW - 0.3, roofY + 1.5, -CD / 2), new THREE.Vector3(CW + 0.3, roofY + 1.5, -CD / 2), new THREE.Vector3(0, roofY + 1.5, 0)];

  // DOM layer: room buttons, trick collection, endless.
  const buttons = h('div', { class: 'c3-map-rooms' });
  const place = () => {
    world.frame({ points: pts, top: 150, bottom: layer.querySelector('.c3-map-foot')?.getBoundingClientRect().height ?? 120, side: 10, elevation: 0.3, target: new THREE.Vector3(0, 1.8, 0) });
    world.render();
    for (const c of cells) {
      const b = buttons.querySelector<HTMLElement>(`[data-id="${c.id}"]`);
      if (!b) continue;
      const p = world.project(c.at);
      b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    }
  };
  for (const c of cells.sort((a, b) => a.id - b.id)) {
    const lv = LEVELS.find((l) => l.id === c.id)!;
    const open = unlocked(save, lv.id);
    const stars = countStars(save.stars[String(lv.id)]);
    const b = h(
      'button',
      { class: `c3-room-btn${open ? '' : ' locked'}${save.done.includes(lv.id) ? ' done' : ''}`, type: 'button', 'data-id': String(lv.id), disabled: !open, 'aria-label': `${lv.id}. ${LEVEL_NAMES[lv.id]}${open ? '' : ` — ${T.locked}`}` },
      h('span', { class: 'c3-room-top' }, h('span', { class: 'c3-room-num' }, open ? String(lv.id) : '🔒'), h('span', { class: 'c3-room-name' }, LEVEL_NAMES[lv.id])),
      open ? h('span', { class: 'c3-room-stars', 'aria-label': `${stars}/3` }, ...[0, 1, 2].map((i) => h('i', { class: i < stars ? 'on' : '' }, '★'))) : null,
    );
    b.addEventListener('click', () => onPick(lv.id));
    buttons.append(b);
  }
  layer.prepend(buttons);
  world.onResize = place;
  place();
  // Textures (drawn from SVG) arrive a moment later.
  const t1 = setTimeout(place, 120);
  const t2 = setTimeout(place, 600);
  (buttons.querySelector('button:not([disabled]):last-of-type') as HTMLElement | null)?.focus({ preventScroll: true });

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    world.onResize = undefined;
    buttons.remove();
    g.remove(pesky.root);
    pesky.dispose();
    disposeTree(g);
  };
}

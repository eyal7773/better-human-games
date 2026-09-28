import * as THREE from 'three';
import { arenaFor, ball, box, canvasTex, cyl, disposeTree, footprint, gloss, shell, std, type Room, type RoomSize } from '../kit';

/** Level 6 — Pesky's own box: cardboard, quiet, a few lonely toys. */
export function peskyBox(size: RoomSize): Room {
  const { hw, hd } = size;
  const card = (base: string) =>
    canvasTex(128, 128, (g) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = 'rgba(120,70,20,0.18)';
      g.lineWidth = 2;
      for (let x = 4; x < 128; x += 8) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, 128);
        g.stroke();
      }
    }, [hw, hd]);
  const s = shell(size, { floor: std(0xffffff, { map: card('#d9a066') }), wall: std(0xffffff, { map: card('#c89a5c') }), side: std(0xc89a5c), trim: 0xa8773f, wallH: 2 });
  const g = s.group;
  // Tape across the back wall, a string of lights, a pillow and a few toys.
  g.add(box(hw * 2, 0.25, 0.02, std(0xe8d3a5), 0, 1.2, -hd + 0.02));
  const bulbs: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 9; i++) {
    const m = std([0xffd447, 0xff8fab, 0x7fc8f8][i % 3], { emissive: [0xffd447, 0xff8fab, 0x7fc8f8][i % 3], emissiveIntensity: 0.8 });
    bulbs.push(m);
    const x = -hw + 0.3 + (i * (hw * 2 - 0.6)) / 8;
    g.add(ball(0.06, m, x, 1.55 - Math.sin((i / 8) * Math.PI) * 0.25, -hd + 0.06));
  }
  const pillow = box(0.9, 0.2, 0.6, gloss(0xff8fab, { clearcoat: 0.2 }), -hw * 0.45, 0, -hd + 0.5, 0.08);
  const blocks = new THREE.Group();
  blocks.add(box(0.22, 0.22, 0.22, gloss(0x2f9bff), 0, 0, 0, 0.03), box(0.22, 0.22, 0.22, gloss(0xffc61a), 0.05, 0.22, 0, 0.03));
  blocks.position.set(hw * 0.55, 0, -hd * 0.4);
  const ballToy = ball(0.16, gloss(0x3fcf6a), hw * 0.5, 0, hd * 0.35);
  const lamp = new THREE.Group();
  lamp.add(cyl(0.12, 0.14, 0.05, std(0x2a2f45)), cyl(0.02, 0.02, 0.45, std(0x2a2f45)), cyl(0.12, 0.2, 0.2, std(0xffe08a, { emissive: 0xffc94a, emissiveIntensity: 0.8 }), 0, 0.45));
  lamp.position.set(-hw + 0.3, 0, hd * 0.2);
  g.add(pillow, blocks, ballToy, lamp);
  const arena = arenaFor(size, [footprint(pillow), footprint(blocks), footprint(ballToy), footprint(lamp)]);
  return {
    group: g,
    arena,
    victim: new THREE.Vector3(0, 1, -hd),
    press() {},
    update(_dt, t) {
      bulbs.forEach((m, i) => (m.emissiveIntensity = 0.5 + Math.sin(t * 1.5 + i) * 0.3));
    },
    bg: 'radial-gradient(120% 70% at 50% 0%, #6b4a7a 0%, #3b2352 70%, #26163a 100%)',
    fit: s.fit,
    dispose: () => disposeTree(g),
  };
}

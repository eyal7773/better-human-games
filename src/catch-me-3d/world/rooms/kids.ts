import * as THREE from 'three';
import { arenaFor, ball, box, canvasTex, cyl, disposeTree, footprint, gloss, shell, std, type Room, type RoomSize } from '../kit';

/** Level 3 — the kids' room. The victim: a toy robot. Pesky bounces on the bed. */
export function kidsRoom(size: RoomSize): Room {
  const { hw, hd } = size;
  const carpet = canvasTex(128, 128, (g) => {
    g.fillStyle = '#ffd6e8';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#ffb8d6';
    for (let y = 16; y < 128; y += 32) for (let x = 16; x < 128; x += 32) {
      g.beginPath();
      g.arc(x + ((y / 32) % 2) * 16, y, 6, 0, Math.PI * 2);
      g.fill();
    }
  }, [hw * 1.2, hd * 1.2]);
  const wall = canvasTex(256, 256, (g) => {
    g.fillStyle = '#e9dcff';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#fff6b0';
    const star = (x: number, y: number, r: number) => {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const rr = i % 2 ? r * 0.45 : r;
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.fill();
    };
    star(50, 60, 16);
    star(180, 110, 12);
    star(110, 190, 14);
    star(230, 30, 9);
  }, [hw, 1]);
  const s = shell(size, { floor: std(0xffffff, { map: carpet }), wall: std(0xffffff, { map: wall }), side: std(0xdccaff), trim: 0xb89ae6 });
  const g = s.group;

  // The bed, on the left against the back wall — a trampoline for Pesky.
  const bed = new THREE.Group();
  const bw = 1.05;
  const bd = Math.min(2, hd * 0.9);
  bed.add(box(bw, 0.3, bd, gloss(0x7fc8f8), 0, 0, 0, 0.06));
  bed.add(box(bw - 0.08, 0.16, bd - 0.1, gloss(0xffffff, { clearcoat: 0.2 }), 0, 0.3, 0, 0.06));
  bed.add(box(bw - 0.06, 0.06, bd * 0.6, gloss(0xffc61a, { clearcoat: 0.2 }), 0, 0.44, bd * 0.18, 0.03));
  bed.add(box(0.6, 0.12, 0.35, gloss(0xffffff), 0, 0.46, -bd / 2 + 0.3, 0.05));
  bed.add(box(bw, 0.75, 0.1, gloss(0x7fc8f8), 0, 0, -bd / 2 - 0.02, 0.04));
  bed.position.set(-hw + bw / 2 + 0.08, 0, -hd + bd / 2 + 0.1);
  g.add(bed);

  // The toy robot — the victim.
  const robot = new THREE.Group();
  const metal = gloss(0x9aa7b8, { metalness: 0.2 });
  robot.add(box(0.36, 0.34, 0.26, metal, 0, 0.18, 0, 0.05), box(0.28, 0.24, 0.24, metal, 0, 0.54, 0, 0.05));
  robot.add(box(0.08, 0.18, 0.08, std(0x55607f), -0.1, 0, 0), box(0.08, 0.18, 0.08, std(0x55607f), 0.1, 0, 0));
  const eyeMat = std(0x2ec4b6, { emissive: 0x2ec4b6, emissiveIntensity: 0.6 });
  robot.add(ball(0.035, eyeMat, -0.06, 0.62, 0.12), ball(0.035, eyeMat, 0.06, 0.62, 0.12));
  robot.add(cyl(0.01, 0.01, 0.14, std(0x55607f), 0, 0.78, 0));
  const bulbMat = std(0xff5a4e, { emissive: 0xff5a4e, emissiveIntensity: 0.3 });
  robot.add(ball(0.045, bulbMat, 0, 0.9, 0));
  // An empty socket on its chest — Pesky took its button.
  robot.add(cyl(0.04, 0.04, 0.02, std(0x1d2b4f), 0, 0.3, 0.13).rotateX(Math.PI / 2));
  robot.scale.setScalar(1.6);
  robot.position.set(hw * 0.45, 0, -hd + 0.5);
  g.add(robot);

  // Shelf with toys, and blocks on the floor.
  const shelf = box(0.9, 0.9, 0.35, gloss(0xffd166), hw - 0.55, 0, -hd * 0.1, 0.04);
  const blocks = new THREE.Group();
  [0xff5a4e, 0x2f9bff, 0x3fcf6a, 0xffc61a].forEach((c, i) => blocks.add(box(0.22, 0.22, 0.22, gloss(c), (i % 2) * 0.24, Math.floor(i / 2) * 0.22, 0, 0.03)));
  blocks.position.set(-hw * 0.45, 0, hd * 0.45);
  g.add(shelf, blocks);

  const bedBox = footprint(bed);
  bedBox.h = 0.46;
  const arena = arenaFor(size, [bedBox, footprint(robot, 0.05), footprint(shelf), footprint(blocks, 0.05)], { bed: bedBox });

  let shake = 0;
  return {
    group: g,
    arena,
    victim: new THREE.Vector3(robot.position.x, 1, robot.position.z),
    press() {
      shake = 1.4;
    },
    update(dt, t) {
      shake = Math.max(0, shake - dt);
      robot.rotation.y = shake > 0 ? Math.sin(t * 30) * 0.25 : Math.sin(t * 0.8) * 0.1;
      bulbMat.emissiveIntensity = shake > 0 ? (Math.sin(t * 25) > 0 ? 1.5 : 0.1) : 0.3;
    },
    bg: 'radial-gradient(120% 60% at 50% 0%, #f5eeff 0%, #d9c7ff 60%, #b79cf2 100%)',
    fit: s.fit,
    dispose: () => disposeTree(g),
  };
}

import * as THREE from 'three';
import { arenaFor, box, canvasTex, cyl, disposeTree, footprint, gloss, planks, shell, std, type Room, type RoomSize } from '../kit';

/** Level 1 — the living room. The victim: the TV, whose remote lost its red button. */
export function livingRoom(size: RoomSize): Room {
  const { hw, hd } = size;
  const floor = planks('#e7b57a', '#c98f55');
  floor.repeat.set(hw / 1.5, hd / 1.5);
  const wallTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#fff1d8';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#ffe2b8';
    for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 14, 256);
  }, [hw, 1]);
  const s = shell(size, { floor: std(0xffffff, { map: floor }), wall: std(0xffffff, { map: wallTex }), side: std(0xffe7c2) });
  const g = s.group;

  // Rug.
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    std(0xffffff, {
      map: canvasTex(256, 256, (c) => {
        for (let i = 6; i > 0; i--) {
          c.fillStyle = i % 2 ? '#7fc8f8' : '#ffd166';
          c.beginPath();
          c.arc(128, 128, i * 21, 0, Math.PI * 2);
          c.fill();
        }
      }),
    }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.scale.set(hw * 0.55, hd * 0.4, 1);
  rug.position.set(0, 0.006, hd * 0.1);
  g.add(rug);

  // Window on the back wall.
  const win = box(1.3, 0.8, 0.04, std(0xbfe8ff, { emissive: 0x8fd4ff, emissiveIntensity: 0.35 }), -hw * 0.45, 0.75, -hd + 0.01);
  const frame = box(1.42, 0.92, 0.03, std(0xffffff), -hw * 0.45, 0.69, -hd);
  const bar = box(0.05, 0.8, 0.05, std(0xffffff), -hw * 0.45, 0.75, -hd + 0.03);
  g.add(frame, win, bar);

  // TV on its stand — the victim.
  const stand = box(1.5, 0.42, 0.5, gloss(0x8a5a3c), hw * 0.25, 0, -hd + 0.3, 0.05);
  const tv = new THREE.Group();
  const bezel = box(1.3, 0.82, 0.1, gloss(0x2a2f45), 0, 0, 0, 0.04);
  const screenMat = std(0x1c2540, { emissive: 0x4ab8ff, emissiveIntensity: 0.25 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.66), screenMat);
  screen.position.set(0, 0.41, 0.052);
  const foot = box(0.4, 0.06, 0.2, gloss(0x2a2f45), 0, -0.06, 0);
  tv.add(bezel, screen, foot);
  tv.position.set(hw * 0.25, 0.48, -hd + 0.3);
  g.add(stand, tv);

  // Sofa on the left, with the remote on it (a hole where the red button was).
  const sofa = new THREE.Group();
  const cloth = gloss(0x6a4bd8, { clearcoat: 0.2, roughness: 0.7 });
  sofa.add(box(0.75, 0.38, 1.9, cloth, 0, 0, 0, 0.1), box(0.25, 0.75, 1.9, cloth, -0.27, 0, 0, 0.1));
  sofa.add(box(0.72, 0.5, 0.25, cloth, 0, 0, -0.9, 0.1), box(0.72, 0.5, 0.25, cloth, 0, 0, 0.9, 0.1));
  const remote = box(0.12, 0.04, 0.34, gloss(0x2a2f45), 0.08, 0.38, 0.2, 0.02);
  const hole = cyl(0.035, 0.035, 0.012, std(0x111111), 0.08, 0.42, 0.28);
  sofa.add(remote, hole);
  sofa.position.set(-hw + 0.42, 0, -hd * 0.2);
  g.add(sofa);

  // Lamp and plant.
  const lamp = new THREE.Group();
  lamp.add(cyl(0.2, 0.22, 0.04, std(0x2a2f45)), cyl(0.025, 0.025, 1.3, std(0x2a2f45)), cyl(0.18, 0.3, 0.32, std(0xffe08a, { emissive: 0xffc94a, emissiveIntensity: 0.5 }), 0, 1.25));
  lamp.position.set(hw - 0.35, 0, -hd + 0.35);
  const plant = new THREE.Group();
  plant.add(cyl(0.2, 0.15, 0.35, gloss(0xff8f4f)));
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), std(0x3fcf6a));
    const a = (i / 5) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.12, 0.5 + (i % 2) * 0.12, Math.sin(a) * 0.12);
    leaf.scale.set(1, 1.6, 1);
    plant.add(leaf);
  }
  plant.position.set(hw - 0.35, 0, hd * 0.35);
  g.add(lamp, plant);

  const arena = arenaFor(size, [footprint(stand), footprint(sofa, 0.02), footprint(lamp), footprint(plant)]);

  let flicker = 0;
  const colors = [0xff5a4e, 0x3fcf6a, 0xffc61a, 0x9a6bff, 0xffffff];
  return {
    group: g,
    arena,
    victim: new THREE.Vector3(hw * 0.25, 1, -hd + 0.4),
    press() {
      flicker = 1.2;
    },
    update(dt, t) {
      if (flicker > 0) {
        flicker -= dt;
        screenMat.emissive.setHex(colors[Math.floor(t * 12) % colors.length]);
        screenMat.emissiveIntensity = 0.9;
      } else {
        screenMat.emissive.setHex(0x4ab8ff);
        screenMat.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.05;
      }
    },
    bg: 'radial-gradient(120% 60% at 50% 0%, #ffe9b8 0%, #ffcf7a 60%, #f7b35c 100%)',
    fit: s.fit,
    dispose: () => disposeTree(g),
  };
}

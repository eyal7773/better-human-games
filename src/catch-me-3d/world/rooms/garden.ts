import * as THREE from 'three';
import { arenaFor, ball, box, canvasTex, cyl, disposeTree, footprint, gloss, shell, std, type Room, type RoomSize } from '../kit';

/** Level 4 — the garden. The victim: the garden gnome. Pesky makes copies of himself. */
export function garden(size: RoomSize): Room {
  const { hw, hd } = size;
  const grass = canvasTex(128, 128, (g) => {
    g.fillStyle = '#7ddc5a';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#5fc446';
    g.lineWidth = 3;
    for (let i = 0; i < 40; i++) {
      const x = (i * 53) % 128;
      const y = (i * 37) % 128;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 3, y - 8);
      g.stroke();
    }
  }, [hw * 1.4, hd * 1.4]);
  const s = shell(size, { floor: std(0xffffff, { map: grass }), wall: std(0xffffff), trim: 0x8a5a3c, noWalls: true });
  const g = s.group;

  // A picket fence at the back.
  const wood = gloss(0xffffff, { clearcoat: 0.3 });
  const fence = new THREE.Group();
  for (let x = -hw; x <= hw + 0.01; x += 0.32) {
    fence.add(box(0.16, 0.9, 0.06, wood, x, 0, 0, 0.03));
    fence.add(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 4), wood).translateX(x).translateY(0.98).rotateY(Math.PI / 4));
  }
  fence.add(box(hw * 2 + 0.2, 0.08, 0.04, wood, 0, 0.25, -0.04), box(hw * 2 + 0.2, 0.08, 0.04, wood, 0, 0.65, -0.04));
  fence.position.z = -hd - 0.05;
  g.add(fence);

  // Bushes and flowers.
  const bushMat = std(0x3fa84a, { roughness: 0.8 });
  const bushes: THREE.Group[] = [];
  const bush = (x: number, z: number, r: number) => {
    const b = new THREE.Group();
    b.add(ball(r, bushMat, 0, 0, 0), ball(r * 0.75, bushMat, r * 0.6, 0, 0.1), ball(r * 0.7, bushMat, -r * 0.55, 0, 0.05));
    b.position.set(x, 0, z);
    bushes.push(b);
    g.add(b);
  };
  bush(-hw + 0.5, -hd + 0.5, 0.42);
  bush(hw - 0.55, hd * 0.2, 0.36);
  bush(-hw * 0.3, hd * 0.55, 0.3);
  const flowerCols = [0xff5fa2, 0xffc61a, 0xffffff, 0x9a6bff];
  for (let i = 0; i < 14; i++) {
    const x = ((i * 0.73) % 1) * hw * 1.8 - hw * 0.9;
    const z = (((i * 0.41) % 1) * 2 - 1) * hd * 0.9;
    const f = new THREE.Group();
    f.add(cyl(0.012, 0.012, 0.18, std(0x2f8a3a)), ball(0.05, std(flowerCols[i % 4]), 0, 0.16, 0));
    f.position.set(x, 0, z);
    g.add(f);
  }

  // The gnome — the victim.
  const gnome = new THREE.Group();
  gnome.add(cyl(0.16, 0.22, 0.38, gloss(0x2f9bff)));
  gnome.add(ball(0.13, std(0xffd6b0), 0, 0.36, 0.02));
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 16), std(0xffffff));
  beard.position.set(0, 0.36, 0.08);
  beard.rotation.x = Math.PI;
  gnome.add(beard);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 16), gloss(0xff5a4e));
  hat.position.y = 0.72;
  gnome.add(hat);
  gnome.position.set(hw * 0.35, 0, -hd + 0.45);
  g.add(gnome);

  // A little pond.
  const pond = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), gloss(0x4ab8ff, { roughness: 0.1 }));
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(1.3, 0.8, 1);
  pond.position.set(-hw * 0.35, 0.008, -hd * 0.25);
  g.add(pond);

  const arena = arenaFor(size, [...bushes.map((b) => footprint(b)), footprint(gnome, 0.05)]);
  let hop = 0;
  return {
    group: g,
    arena,
    victim: new THREE.Vector3(gnome.position.x, 1, gnome.position.z),
    press() {
      hop = 1.2;
    },
    update(dt, t) {
      hop = Math.max(0, hop - dt);
      gnome.position.y = hop > 0 ? Math.abs(Math.sin(t * 12)) * 0.25 : 0;
      gnome.rotation.y = hop > 0 ? t * 8 : 0;
    },
    bg: 'linear-gradient(180deg, #6cc8ff 0%, #b4e5ff 55%, #d9f2ff 100%)',
    fit: s.fit.slice(0, 4).concat([new THREE.Vector3(-hw, 1.1, -hd), new THREE.Vector3(hw, 1.1, -hd)]),
    dispose: () => disposeTree(g),
  };
}

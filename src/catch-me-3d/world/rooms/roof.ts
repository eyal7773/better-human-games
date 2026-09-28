import * as THREE from 'three';
import { arenaFor, box, canvasTex, cutout, cyl, disposeTree, footprint, gloss, shell, std, type Room, type RoomSize } from '../kit';

/** Level 5 — the roof at sunset. The victim: the weathervane rooster. Pesky uses doors and chimneys. */
export function roof(size: RoomSize): Room {
  const { hw, hd } = size;
  const tilesTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#e8674a';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#c24a33';
    g.lineWidth = 4;
    for (let y = 0; y < 128; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(128, y);
      g.stroke();
      for (let x = (y / 32) % 2 ? 16 : 0; x < 128; x += 32) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 32);
        g.stroke();
      }
    }
  }, [hw * 1.1, hd * 1.1]);
  const s = shell(size, { floor: std(0xffffff, { map: tilesTex }), wall: std(0xffffff), trim: 0xa8452f, noWalls: true });
  const g = s.group;
  // A low parapet so the edge reads as a rooftop.
  const brick = std(0xb5523c);
  g.add(box(hw * 2 + 0.3, 0.25, 0.14, brick, 0, 0, -hd - 0.08), box(0.14, 0.25, hd * 2 + 0.2, brick, -hw - 0.08, 0, 0), box(0.14, 0.25, hd * 2 + 0.2, brick, hw + 0.08, 0, 0));

  // Two chimneys and a roof door: Pesky dives into one and pops out of another.
  const chimney = (x: number, z: number) => {
    const c = new THREE.Group();
    c.add(box(0.55, 0.9, 0.55, brick, 0, 0, 0, 0.03), box(0.68, 0.12, 0.68, std(0x8e3a28), 0, 0.9, 0));
    c.add(box(0.36, 0.02, 0.36, std(0x1d1020), 0, 1.02, 0));
    c.position.set(x, 0, z);
    g.add(c);
    return c;
  };
  const c1 = chimney(-hw * 0.5, -hd * 0.45);
  const c2 = chimney(hw * 0.55, hd * 0.25);
  const hatch = new THREE.Group();
  hatch.add(box(0.8, 0.9, 0.5, std(0xffe2b8), 0, 0, 0, 0.04));
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 0.35);
  shape.closePath();
  const cap = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false }), gloss(0x6a4bd8));
  cap.position.set(0, 0.9, -0.3);
  hatch.add(cap, box(0.4, 0.62, 0.02, gloss(0x8a5a3c), 0, 0, 0.26, 0.02));
  hatch.position.set(hw * 0.35, 0, -hd + 0.35);
  g.add(hatch);

  // The weathervane rooster on a pole — the victim.
  const vane = new THREE.Group();
  vane.add(cyl(0.025, 0.025, 1.3, std(0x2a2f45)));
  const rooster = cutout(
    canvasTex(128, 128, (c) => {
      c.fillStyle = '#2a2f45';
      c.beginPath();
      c.ellipse(64, 76, 34, 24, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(92, 44, 16, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(30, 70);
      c.quadraticCurveTo(4, 30, 20, 12);
      c.quadraticCurveTo(36, 40, 46, 60);
      c.fill();
      c.fillStyle = '#ff5a4e';
      c.beginPath();
      c.arc(92, 26, 8, 0, Math.PI * 2);
      c.arc(100, 30, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffc61a';
      c.beginPath();
      c.moveTo(106, 42);
      c.lineTo(122, 48);
      c.lineTo(106, 52);
      c.fill();
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(96, 42, 3.5, 0, Math.PI * 2);
      c.fill();
    }),
    0.95,
    0.95,
    0,
    1.2,
    0,
  );
  rooster.rotation.x = 0;
  vane.add(rooster);
  vane.position.set(-hw * 0.45, 0, hd * 0.5);
  g.add(vane);

  // Sunset sky and sun behind the roof.
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(hw * 6, 6),
    new THREE.MeshBasicMaterial({
      map: canvasTex(64, 256, (c) => {
        const gr = c.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, '#6a4bd8');
        gr.addColorStop(0.5, '#ff7a6b');
        gr.addColorStop(1, '#ffc15e');
        c.fillStyle = gr;
        c.fillRect(0, 0, 64, 256);
      }),
    }),
  );
  sky.position.set(0, 1, -hd - 1.5);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ color: 0xffe27a }));
  sun.position.set(-hw * 0.55, 0.1, -hd - 1.4);
  g.add(sky, sun);

  const obstacles = [footprint(c1), footprint(c2), footprint(hatch), footprint(vane, 0.08)];
  const portals = [
    { x: c1.position.x, z: c1.position.z + 0.75 },
    { x: c2.position.x, z: c2.position.z + 0.75 },
    { x: hatch.position.x, z: hatch.position.z + 0.75 },
  ];
  const arena = arenaFor(size, obstacles, { portals });

  let spin = 0;
  return {
    group: g,
    arena,
    victim: new THREE.Vector3(vane.position.x, 1.6, vane.position.z),
    press() {
      spin = 1.5;
    },
    update(dt, t) {
      spin = Math.max(0, spin - dt);
      rooster.rotation.y = spin > 0 ? t * 14 : Math.sin(t * 0.7) * 0.5;
    },
    bg: 'linear-gradient(180deg, #6a4bd8 0%, #ff7a6b 55%, #ffc15e 100%)',
    fit: s.fit.slice(0, 4).concat([new THREE.Vector3(-hw, 1.1, -hd), new THREE.Vector3(hw, 1.1, -hd)]),
    dispose: () => disposeTree(g),
  };
}

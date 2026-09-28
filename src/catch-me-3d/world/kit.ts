import * as THREE from 'three';
import type { Arena, Box, Pt } from '../pesky/brain';

/**
 * Building blocks for the toy-diorama rooms: a dollhouse cross-section (floor
 * slab, back and side walls, open front), furniture from boxes and cylinders,
 * and textures drawn on canvases or from SVG.
 */

export interface Room {
  group: THREE.Group;
  arena: Arena;
  /** Where the "victim" stands — the one whose buttons Pesky keeps pushing. */
  victim: THREE.Vector3;
  /** Pesky pushed the victim's button. */
  press(): void;
  update(dt: number, t: number): void;
  /** Page background behind the room (CSS). */
  bg: string;
  /** Points the camera must keep on screen. */
  fit: THREE.Vector3[];
  /** Hiding furniture etc. for the story/trick art. */
  dispose(): void;
}

export interface RoomSize {
  hw: number;
  hd: number;
}

export const WALL_H = 1.7;
/** Pesky's centre keeps this far from the walls. */
export const MARGIN = 0.45;

/** Room size for the screen's shape: tall rooms on phones, wide ones on desktops. */
export function roomSize(w: number, h: number): RoomSize {
  if (h >= w) {
    const hw = 2.1;
    return { hw, hd: THREE.MathUtils.clamp(hw * (h / w) * 0.8, 2.2, 4.4) };
  }
  const hd = 2.2;
  return { hd, hw: THREE.MathUtils.clamp(hd * (w / h) * 1.05, 2.4, 4.4) };
}

export const std = (color: THREE.ColorRepresentation, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.62, ...o });
export const gloss = (color: THREE.ColorRepresentation, o: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15, ...o });

/** A box standing on `y` (its bottom), centred on x/z. */
export function box(w: number, h: number, d: number, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0, r = 0) {
  const geo = r > 0 ? roundedBox(w, h, d, r) : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

/** A soft-cornered box (toy look), made by rounding an extruded rectangle. */
function roundedBox(w: number, h: number, d: number, r: number) {
  r = Math.min(r, w / 2, h / 2, d / 2);
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: 0, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(d - r * 2) / 2);
  return g;
}

export function cyl(rTop: number, rBottom: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), m);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

export function ball(r: number, m: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
  mesh.position.set(x, y + r, z);
  return mesh;
}

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/** Draws an SVG string into a texture (async: the image decodes first). */
export function svgTex(svg: string, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    t.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}`;
  return t;
}

/** A flat cut-out standing upright and turned to the camera (cardboard-toy style). */
export function cutout(tex: THREE.Texture, w: number, h: number, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide }));
  m.position.set(x, y + h / 2, z);
  // Lean back toward the camera a little so it reads from above.
  m.rotation.x = -0.35;
  return m;
}

/** The dollhouse shell: floor slab, back wall, side walls, and the arena inside it. */
export function shell(
  size: RoomSize,
  o: { floor: THREE.Material; wall: THREE.Material; side?: THREE.Material; trim?: number; wallH?: number; noWalls?: boolean },
) {
  const { hw, hd } = size;
  const g = new THREE.Group();
  const wallH = o.wallH ?? WALL_H;
  const t = 0.16;
  // Floor with a visible cut edge at the front.
  const slab = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + t * 2, 0.34, hd * 2 + t * 2), [
    std(o.trim ?? 0xd9a066),
    std(o.trim ?? 0xd9a066),
    o.floor,
    std(o.trim ?? 0xd9a066),
    std(o.trim ?? 0xd9a066),
    std(o.trim ?? 0xd9a066),
  ]);
  slab.position.y = -0.17;
  g.add(slab);
  if (!o.noWalls) {
    const back = box(hw * 2 + t * 2, wallH, t, o.wall, 0, 0, -hd - t / 2);
    const left = box(t, wallH * 0.6, hd * 2 + t, o.side ?? o.wall, -hw - t / 2, 0, t / 2);
    const right = box(t, wallH * 0.6, hd * 2 + t, o.side ?? o.wall, hw + t / 2, 0, t / 2);
    const trim = std(o.trim ?? 0xd9a066);
    const board = box(hw * 2, 0.12, 0.05, trim, 0, 0, -hd + 0.02);
    g.add(back, left, right, board);
  }
  const fit = [
    new THREE.Vector3(-hw - t, 0, hd + t),
    new THREE.Vector3(hw + t, 0, hd + t),
    new THREE.Vector3(-hw - t, -0.34, hd + t),
    new THREE.Vector3(hw + t, -0.34, hd + t),
    new THREE.Vector3(-hw - t, wallH, -hd - t),
    new THREE.Vector3(hw + t, wallH, -hd - t),
  ];
  return { group: g, fit };
}

export function arenaFor(size: RoomSize, obstacles: Box[] = [], extra: Partial<Arena> = {}): Arena {
  return {
    minX: -size.hw + MARGIN,
    maxX: size.hw - MARGIN,
    minZ: -size.hd + MARGIN,
    maxZ: size.hd - MARGIN,
    obstacles,
    hideSpots: [],
    portals: [],
    bed: null,
    ...extra,
  };
}

/** Obstacle footprint of a mesh/group placed on the floor. */
export function footprint(o: THREE.Object3D, pad = 0): Box {
  const b = new THREE.Box3().setFromObject(o);
  return { x0: b.min.x - pad, x1: b.max.x + pad, z0: b.min.z - pad, z1: b.max.z + pad, h: b.max.y };
}

export const pt = (x: number, z: number): Pt => ({ x, z });

/** Dispose every geometry/material/texture under a group. */
export function disposeTree(g: THREE.Object3D) {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const x of mats) {
      for (const v of Object.values(x)) if (v instanceof THREE.Texture) v.dispose();
      x.dispose();
    }
  });
}

/** Wooden planks. */
export function planks(base: string, line: string, n = 6) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = line;
    g.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      const y = (i * 256) / n;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
      const x = ((i * 97) % 256) + 20;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 256 / n);
      g.stroke();
    }
  }, [2, 3]);
}

/** Checker tiles. */
export function tiles(a: string, b: string, n = 8) {
  return canvasTex(256, 256, (g) => {
    const s = 256 / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        g.fillStyle = (i + j) % 2 ? a : b;
        g.fillRect(i * s, j * s, s, s);
      }
  }, [1, 1.6]);
}

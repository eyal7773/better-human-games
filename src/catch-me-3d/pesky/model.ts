import * as THREE from 'three';
import { buddySVG } from '../../catch-me/buddy';
import type { Face } from './brain';

/**
 * Pesky in 3D, built from simple shapes after the SVG design in
 * src/catch-me/buddy.ts: a glossy red dome, a purple base, white sneakers with
 * a pink stripe, and little arms. The face is a CanvasTexture drawn from the
 * SVG's own face parts, one per expression.
 *
 * Modelled in SVG units (x right, y up from the soles, z toward the camera)
 * and scaled so the body is one world unit wide.
 */

export const FACES: Face[] = ['tease', 'run', 'shock', 'dizzy', 'calm', 'laugh'];
/** SVG units → world units. */
const S = 1 / 100;
/** The part of the SVG the face is cut from. */
const FACE_BOX = { x: 28, y: 40, w: 64, h: 54 };
const INK = 0x2a1838;

export type FaceSet = Record<Face, THREE.Texture>;

let facesPromise: Promise<FaceSet> | null = null;

/** Draws each expression once (from the SVG) into its own texture. */
export function loadFaces(): Promise<FaceSet> {
  facesPromise ??= (async () => {
    const doc = new DOMParser().parseFromString(buddySVG(), 'text/html');
    const face = doc.querySelector('.bd-face')!.outerHTML;
    const out = {} as FaceSet;
    await Promise.all(
      FACES.map(async (f) => {
        const W = 512;
        const H = Math.round((W * FACE_BOX.h) / FACE_BOX.w);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FACE_BOX.x} ${FACE_BOX.y} ${FACE_BOX.w} ${FACE_BOX.h}" width="${W}" height="${H}"><style>[data-f]{display:none}[data-f~="${f}"]{display:inline}</style>${face}</svg>`;
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        try {
          await img.decode();
        } catch {
          /* leave the face blank rather than break the game */
        }
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        c.getContext('2d')!.drawImage(img, 0, 0, W, H);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        out[f] = tex;
      }),
    );
    return out;
  })();
  return facesPromise;
}

// Shared by every copy (the clones in the garden look exactly alike).
let shared: ReturnType<typeof makeShared> | null = null;
function makeShared() {
  const dome = new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  // The face shell: the front of the dome, a hair larger, UV-mapped straight
  // from the front so the SVG face lands where it is in the drawing.
  const faceGeo = new THREE.SphereGeometry(1, 40, 20, Math.PI / 2 - 1.2, 2.4, 0.2, Math.PI / 2 - 0.2);
  const pos = faceGeo.attributes.position;
  const uv = faceGeo.attributes.uv;
  const R = { x: 35.8, y: 56.8, z: 33.8 };
  for (let i = 0; i < pos.count; i++) {
    const svgX = 60 + pos.getX(i) * R.x;
    // 4 units of lift keeps the mouth clear of the base.
    const svgY = 86 - pos.getY(i) * R.y + 4;
    uv.setXY(i, (svgX - FACE_BOX.x) / FACE_BOX.w, 1 - (svgY - FACE_BOX.y) / FACE_BOX.h);
    pos.setXYZ(i, pos.getX(i) * R.x, pos.getY(i) * R.y, pos.getZ(i) * R.z);
  }
  uv.needsUpdate = true;
  faceGeo.computeVertexNormals();
  const base = new THREE.CylinderGeometry(41, 41, 21, 40);
  const shoe = new THREE.SphereGeometry(1, 20, 12);
  const leg = new THREE.CylinderGeometry(3.5, 3.5, 20, 10);
  leg.translate(0, -10, 0); // pivot at the hip
  const hand = new THREE.SphereGeometry(6.5, 16, 10);
  const arm = new THREE.TubeGeometry(
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(12, 2, 0), new THREE.Vector3(14, 14, 0)),
    12,
    3,
    8,
  );
  const stripe = new THREE.BoxGeometry(11, 2.2, 4);
  const blob = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(29,43,79,0.55)');
    grad.addColorStop(0.6, 'rgba(29,43,79,0.25)');
    grad.addColorStop(1, 'rgba(29,43,79,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  })();
  return {
    dome,
    faceGeo,
    base,
    shoe,
    leg,
    hand,
    arm,
    stripe,
    shadowGeo: new THREE.PlaneGeometry(1, 1),
    shieldGeo: new THREE.SphereGeometry(1, 32, 20),
    mat: {
      dome: new THREE.MeshPhysicalMaterial({ color: 0xf2463b, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.2 }),
      base: [
        new THREE.MeshPhysicalMaterial({ color: 0x5a4474, roughness: 0.5, clearcoat: 0.6 }),
        new THREE.MeshPhysicalMaterial({ color: 0x8a779c, roughness: 0.5, clearcoat: 0.6 }),
        new THREE.MeshStandardMaterial({ color: 0x3b2352 }),
      ],
      white: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.45, clearcoat: 0.5 }),
      ink: new THREE.MeshStandardMaterial({ color: INK, roughness: 0.7 }),
      outline: new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }),
      shadow: new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }),
    },
  };
}

export class PeskyModel {
  readonly root = new THREE.Group();
  /** Lifted by hops; squashed on landing. */
  readonly body = new THREE.Group();
  readonly shadow: THREE.Mesh;
  private face: THREE.Mesh;
  private faceMat: THREE.MeshBasicMaterial;
  private legs: THREE.Object3D[] = [];
  private arms: THREE.Object3D[] = [];
  private stripeMat: THREE.MeshStandardMaterial;
  private shield: THREE.Mesh;
  private shieldMat: THREE.MeshBasicMaterial;
  private t = Math.random() * 10;
  private squash = 1;
  private yaw = 0;
  current: Face = 'tease';
  laces = false;
  /** Extra scale so far-away Pesky never looks smaller than 75% (set by the level). */
  comp = 1;

  constructor(private faces: FaceSet) {
    shared ??= makeShared();
    const g = shared;
    const m = g.mat;
    const svg = new THREE.Group();
    svg.scale.setScalar(S);
    this.body.add(svg);

    const dome = new THREE.Mesh(g.dome, m.dome);
    dome.scale.set(35, 56, 33);
    dome.position.y = 41;
    const domeLine = new THREE.Mesh(g.dome, m.outline);
    domeLine.scale.set(37, 58, 35);
    domeLine.position.y = 41;

    this.faceMat = new THREE.MeshBasicMaterial({ map: faces.tease, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.face = new THREE.Mesh(g.faceGeo, this.faceMat);
    this.face.position.y = 41;

    const base = new THREE.Mesh(g.base, m.base);
    base.position.y = 30.5;
    const baseLine = new THREE.Mesh(g.base, m.outline);
    baseLine.scale.set(1.05, 1.1, 1.05);
    baseLine.position.y = 30.5;

    this.stripeMat = new THREE.MeshStandardMaterial({ color: 0xff5fa2, emissive: 0xff2d8a, emissiveIntensity: 0, roughness: 0.4 });
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 14, 26, 0);
      const leg = new THREE.Mesh(g.leg, m.ink);
      const shoe = new THREE.Mesh(g.shoe, m.white);
      shoe.scale.set(10, 6.5, 13);
      shoe.position.set(side * 3, -20, 3);
      const shoeLine = new THREE.Mesh(g.shoe, m.outline);
      shoeLine.scale.set(11.5, 8, 14.5);
      shoeLine.position.copy(shoe.position);
      const stripe = new THREE.Mesh(g.stripe, this.stripeMat);
      stripe.position.set(side * 3, -14.5, 6);
      hip.add(leg, shoe, shoeLine, stripe);
      this.legs.push(hip);
      svg.add(hip);

      const shoulder = new THREE.Group();
      shoulder.position.set(side * 36, 37, 0);
      const arm = new THREE.Mesh(g.arm, m.ink);
      arm.scale.x = side;
      const hand = new THREE.Mesh(g.hand, m.white);
      hand.position.set(side * 14, 17, 0);
      shoulder.add(arm, hand);
      this.arms.push(shoulder);
      svg.add(shoulder);
    }
    svg.add(domeLine, dome, this.face, baseLine, base);

    this.shieldMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    this.shield = new THREE.Mesh(g.shieldGeo, this.shieldMat);
    this.shield.position.y = 0.45;
    this.shield.scale.setScalar(0.72);
    this.shield.visible = false;
    this.body.add(this.shield);

    this.shadow = new THREE.Mesh(g.shadowGeo, m.shadow);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.012;
    this.shadow.scale.set(1.1, 0.8, 1);
    this.root.add(this.shadow, this.body);
  }

  setFace(f: Face) {
    if (f === this.current) return;
    this.current = f;
    this.faceMat.map = this.faces[f];
    this.faceMat.needsUpdate = true;
  }

  /** Squash on landing, then stretch back. */
  land() {
    this.squash = 0;
  }

  /** The red shield — how strong your anger makes him. 0 = off. */
  setShield(level: number) {
    this.shield.visible = level > 0.01;
    this.shieldMat.opacity = 0.28 * level;
  }

  update(
    dt: number,
    s: { x: number; z: number; y: number; running: boolean; stumbling: boolean; faceX: number; faceZ: number; reduced: boolean; hidden?: boolean },
  ) {
    this.t += dt;
    const t = this.t;
    this.root.position.set(s.x, 0, s.z);
    this.root.visible = !s.hidden;
    // Face mostly toward the camera, so you can always read his expression.
    const want = Math.max(-1.1, Math.min(1.1, Math.atan2(s.faceX, s.faceZ)));
    this.yaw += (want - this.yaw) * Math.min(1, dt * 10);
    this.body.rotation.y = this.yaw;

    let y = s.y;
    if (!s.running && !s.reduced) y += Math.max(0, Math.sin(t * 4.2)) * 0.02;
    this.body.position.y = y;

    // Squash & stretch on landing: (1.18, 0.8) → (0.94, 1.06) → 1.
    let sx = 1;
    let sy = 1;
    if (this.squash < 1 && !s.reduced) {
      this.squash = Math.min(1, this.squash + dt / 0.24);
      const k = this.squash;
      if (k < 0.4) {
        const a = k / 0.4;
        sx = 1.18 + (0.94 - 1.18) * a;
        sy = 0.8 + (1.06 - 0.8) * a;
      } else {
        const a = (k - 0.4) / 0.6;
        sx = 0.94 + (1 - 0.94) * a;
        sy = 1.06 + (1 - 1.06) * a;
      }
    }
    this.body.scale.set(sx * this.comp, sy * this.comp, sx * this.comp);

    // Wobble while tripping.
    this.body.rotation.z = s.stumbling && !s.reduced ? Math.sin(t * 25) * 0.21 : 0;

    // Legs and arms.
    const swing = s.running ? Math.sin(t * 24) : 0;
    this.legs[0].rotation.x = swing * 0.42;
    this.legs[1].rotation.x = -swing * 0.42;
    const wave = this.current === 'tease' && !s.running ? Math.sin(t * 12.5) * 0.35 : 0;
    const cheer = this.current === 'laugh' && !s.running ? Math.sin(t * 18) * 0.3 : 0;
    this.arms[0].rotation.z = s.running ? -swing * 0.5 : cheer;
    this.arms[1].rotation.z = s.running ? -swing * 0.5 : -wave - cheer;
    this.arms[0].rotation.x = s.running ? swing * 0.4 : 0;
    this.arms[1].rotation.x = s.running ? -swing * 0.4 : 0;

    // The shadow shrinks as he lifts off.
    const k = 1 - Math.min(0.45, s.y * 0.6);
    this.shadow.scale.set(1.1 * k * this.comp, 0.8 * k * this.comp, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 1;

    if (this.shield.visible) {
      const p = s.reduced ? 1 : 1 + Math.sin(t * 6) * 0.04;
      this.shield.scale.setScalar(0.72 * p);
    }

    // The real one's laces flash pink.
    this.stripeMat.emissiveIntensity = this.laces ? (Math.sin(t * 14) > 0 ? 1.6 : 0.1) : 0;
  }

  dispose() {
    this.faceMat.dispose();
    this.stripeMat.dispose();
    this.shieldMat.dispose();
  }
}

/** A soft round shadow for props and decoys. */
export function blobShadow(size: number) {
  shared ??= makeShared();
  const m = new THREE.Mesh(shared.shadowGeo, shared.mat.shadow);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.scale.set(size, size * 0.75, 1);
  return m;
}

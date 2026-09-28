import * as THREE from 'three';
import { rand } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import type { FX } from '../shared/fx';
import type { Level, Trick } from './levels';
import { Brain, type BrainEvents, type Ptr } from './pesky/brain';
import { blobShadow, PeskyModel, type FaceSet } from './pesky/model';
import type { Room } from './world/kit';
import type { World } from './world/scene';

/**
 * Extra things in a room that aren't Pesky himself: decoy balls that look
 * like him (kids' room), and copies of him (garden). Each can claim a tap —
 * "he fooled you!" / "not him!" — which counts like a miss.
 */
export interface Addon {
  update(dt: number, phase: string): void;
  /** A tap at a screen point hit this thing (not Pesky). */
  tap?(x: number, y: number): 'decoy' | 'clone' | null;
  pointerMove?(ptr: Ptr): void;
  /** Depth compensation (see level.ts), given the near-edge camera distance. */
  comp?(nearDist: number): void;
  dispose(): void;
}

export interface AddonCtx {
  lv: Level;
  stage: THREE.Group;
  room: Room;
  brain: Brain;
  pesky: PeskyModel;
  faces: FaceSet;
  world: World;
  fx: FX;
  audio: AudioEngine;
  endless: boolean;
  trick(t: Trick): void;
}

export function makeAddons(c: AddonCtx): Addon[] {
  const out: Addon[] = [];
  if (c.lv.tricks.includes('decoy')) out.push(new Decoys(c));
  if (c.lv.tricks.includes('clones')) out.push(new Clones(c));
  return out;
}

const hitPx = (world: World, p: THREE.Vector3, r: number, x: number, y: number) => {
  const s = world.project(p);
  const pr = world.pxPerUnit(p) * r;
  return Math.hypot(s.x - x, s.y - y) < Math.max(pr * 1.3, 30);
};

// ---------------------------------------------------------------- decoys

const DECOY_R = 0.3;

/** Red balls that roll around the room and, from the corner of your eye, look just like him. */
class Decoys implements Addon {
  private balls: { g: THREE.Group; ball: THREE.Mesh; x: number; z: number; vx: number; vz: number; bump: number }[] = [];
  private t = 0;
  private shown = false;
  private mats: THREE.Material[] = [];

  constructor(private c: AddonCtx) {
    const red = new THREE.MeshPhysicalMaterial({ color: 0xf2463b, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
    const ring = new THREE.MeshPhysicalMaterial({ color: 0x5a4474, roughness: 0.5, clearcoat: 0.6 });
    this.mats.push(red, ring);
    const a = c.room.arena;
    for (let i = 0; i < 2; i++) {
      const g = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(DECOY_R, 28, 18), red);
      ball.position.y = DECOY_R + 0.04;
      const base = new THREE.Mesh(new THREE.TorusGeometry(DECOY_R * 0.85, 0.07, 10, 28), ring);
      base.rotation.x = Math.PI / 2;
      base.position.y = 0.1;
      g.add(blobShadow(0.7), base, ball);
      g.visible = false;
      c.stage.add(g);
      const ang = rand(0, Math.PI * 2);
      const sp = rand(1.1, 1.6);
      this.balls.push({ g, ball, x: rand(a.minX, a.maxX), z: rand(a.minZ, a.maxZ), vx: Math.cos(ang) * sp, vz: Math.sin(ang) * sp, bump: 0 });
    }
  }

  update(dt: number, phase: string) {
    if (phase === 'intro') return;
    this.t += dt;
    const a = this.c.room.arena;
    this.balls.forEach((b, i) => {
      // They roll in one after another, a few seconds into the chase.
      if (!b.g.visible) {
        if (this.t < 3 + i * 6) return;
        b.g.visible = true;
        if (!this.shown) {
          this.shown = true;
          this.c.trick('decoy');
        }
      }
      if (phase === 'chase' || phase === 'breath') {
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        if (b.x < a.minX || b.x > a.maxX) b.vx *= -1;
        if (b.z < a.minZ || b.z > a.maxZ) b.vz *= -1;
        for (const o of a.obstacles) {
          if (b.x > o.x0 - DECOY_R && b.x < o.x1 + DECOY_R && b.z > o.z0 - DECOY_R && b.z < o.z1 + DECOY_R) {
            b.x -= b.vx * dt * 2;
            b.z -= b.vz * dt * 2;
            if (Math.random() < 0.5) b.vx *= -1;
            else b.vz *= -1;
          }
        }
        b.x = Math.max(a.minX, Math.min(a.maxX, b.x));
        b.z = Math.max(a.minZ, Math.min(a.maxZ, b.z));
        b.ball.rotation.z -= (b.vx * dt) / DECOY_R;
        b.ball.rotation.x += (b.vz * dt) / DECOY_R;
      }
      b.bump = Math.max(0, b.bump - dt * 3);
      b.g.position.set(b.x, 0, b.z);
      b.g.scale.setScalar(1 + Math.sin(b.bump * Math.PI) * 0.25);
    });
  }

  tap(x: number, y: number) {
    for (const b of this.balls) {
      if (!b.g.visible) continue;
      if (hitPx(this.c.world, new THREE.Vector3(b.x, DECOY_R, b.z), DECOY_R, x, y)) {
        b.bump = 1;
        return 'decoy' as const;
      }
    }
    return null;
  }

  dispose() {
    for (const b of this.balls) {
      this.c.stage.remove(b.g);
      b.ball.geometry.dispose();
    }
    this.mats.forEach((m) => m.dispose());
  }
}

// ---------------------------------------------------------------- clones

/** How long the copies stay, and the gap between appearances (seconds of game time). */
const CLONE_S: [number, number] = [4.5, 6];
const CLONE_GAP_S: [number, number] = [7, 11];

/** Now and then Pesky splits into three; only the real one's laces flash pink. */
class Clones implements Addon {
  private items: { model: PeskyModel; brain: Brain }[] = [];
  private t = 0;
  private next = rand(4, 6);
  private until = 0;
  private ptr: Ptr = { x: 0, z: 0, vx: 0, vz: 0, active: false, known: false };
  private nearDist = 1;

  constructor(private c: AddonCtx) {}

  private poof(x: number, z: number, n = 8) {
    const s = this.c.world.project(new THREE.Vector3(x, 0.45, z));
    this.c.fx.steam(s.x, s.y, n, 0.9);
  }

  private spawn() {
    const c = this.c;
    const real = c.brain;
    if (real.hidden || real.stumbling || real.frozen) return;
    for (let i = 0; i < 2; i++) {
      const model = new PeskyModel(c.faces);
      const ev: BrainEvents = {
        face: (f) => model.setFace(f),
        say: () => {},
        sound: () => {},
        land: () => model.land(),
        puff: () => {},
        trick: () => {},
        portal: () => {},
      };
      const brain = new Brain(c.room.arena, ev, { tricks: ['zigzag'], tripPerSec: 0, clone: true });
      brain.mods = real.mods;
      brain.teleport(real.x, real.z);
      brain.start();
      // Scatter: each copy hops off in its own direction.
      brain.pointerDown({ x: real.x + rand(-0.3, 0.3), z: real.z + rand(-0.3, 0.3) }, true);
      c.stage.add(model.root);
      this.items.push({ model, brain });
    }
    c.pesky.laces = true;
    c.audio.whoosh();
    c.audio.giggle();
    this.poof(real.x, real.z, 12);
    this.until = this.t + rand(...CLONE_S);
    c.trick('clones');
  }

  private remove(i: number) {
    const it = this.items[i];
    this.poof(it.brain.x, it.brain.z);
    this.c.stage.remove(it.model.root);
    it.model.dispose();
    this.items.splice(i, 1);
    if (!this.items.length) this.c.pesky.laces = false;
  }

  update(dt: number, phase: string) {
    if (phase === 'intro') return;
    this.t += dt;
    if (phase === 'chase') {
      if (!this.items.length && this.t > this.next) {
        this.spawn();
        this.next = this.t + rand(...CLONE_GAP_S);
      } else if (this.items.length && this.t > this.until) {
        while (this.items.length) this.remove(0);
        this.c.audio.pop();
        this.next = this.t + rand(...CLONE_GAP_S);
      }
    } else if (this.items.length && phase === 'breath') {
      // The breath is a safe place: the copies fade away.
      while (this.items.length) this.remove(0);
    }
    const cam = this.c.world.camera.position;
    for (const it of this.items) {
      it.brain.update(dt, this.ptr);
      const d = cam.distanceTo(new THREE.Vector3(it.brain.x, 0.45, it.brain.z));
      it.model.comp = Math.max(1, (0.75 * d) / this.nearDist);
      it.model.update(dt, {
        x: it.brain.x,
        z: it.brain.z,
        y: it.brain.y,
        running: it.brain.running,
        stumbling: false,
        faceX: it.brain.faceX,
        faceZ: it.brain.faceZ,
        reduced: it.brain.mods.reduced,
      });
    }
  }

  pointerMove(ptr: Ptr) {
    this.ptr = ptr;
    for (const it of this.items) it.brain.pointerMove(ptr);
  }

  comp(nearDist: number) {
    this.nearDist = nearDist;
  }

  tap(x: number, y: number) {
    for (let i = 0; i < this.items.length; i++) {
      const b = this.items[i].brain;
      if (hitPx(this.c.world, new THREE.Vector3(b.x, b.y + 0.45 * this.items[i].model.comp, b.z), 0.5 * this.items[i].model.comp, x, y)) {
        this.remove(i);
        return 'clone' as const;
      }
    }
    return null;
  }

  dispose() {
    while (this.items.length) this.remove(0);
    this.c.pesky.laces = false;
  }
}

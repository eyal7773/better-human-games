import type * as THREE from 'three';
import type { AudioEngine } from '../shared/audio';
import type { FX } from '../shared/fx';
import type { Level } from './levels';
import type { Brain, Ptr } from './pesky/brain';
import type { FaceSet } from './pesky/model';
import type { Room } from './world/kit';
import type { World } from './world/scene';

/**
 * Extra things in a room that aren't Pesky himself: decoy balls that look
 * like him, and copies of him. Each can claim a tap ("not him!").
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
  faces: FaceSet;
  world: World;
  fx: FX;
  audio: AudioEngine;
  endless: boolean;
}

export function makeAddons(_c: AddonCtx): Addon[] {
  return [];
}

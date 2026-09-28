import * as THREE from 'three';
import { clamp, pick, rand, reducedMotion, Scope } from '../shared/dom';
import { vibrate } from '../shared/haptics';
import type { Ctx } from './level';
import { Brain, type BrainEvents, type Ptr } from './pesky/brain';
import { PeskyModel } from './pesky/model';
import type { LevelStats } from './stars';
import { LEVEL_NAMES, STORY, T } from './story';
import { roomSize } from './world/kit';
import { buildRoom } from './world/rooms';

/**
 * Level 6 — Pesky's box, and the twist: chasing pushes him away, breathing
 * brings him closer. Every full breath is one step toward you; taps near him
 * send him scurrying back. Once he's right by you, one single, gentle tap
 * makes you friends. Rapid taps startle him and he jumps back.
 *
 * Nothing here explains the twist in words — the breaths (where he always
 * crept closer) and the rooster's hint on the roof did that already.
 */

const STEPS = 5;
/** A tap within this many bodies of him scares him off. */
const SCARE_R = 2;
/** A gentle tap: no other tap for this long before… */
const CALM_BEFORE_MS = 1200;
/** …or right after. */
const CALM_AFTER_MS = 450;

export interface FinaleResult {
  stats: LevelStats;
  exited: boolean;
}

export function playFinale(ctx: Ctx): Promise<FinaleResult> {
  const { world, hud, audio, fx } = ctx;
  const scope = new Scope();
  const size = roomSize(innerWidth, innerHeight);
  const room = buildRoom('box', size);
  const stage = new THREE.Group();
  stage.add(room.group);
  const pesky = new PeskyModel(ctx.faces);
  stage.add(pesky.root);
  world.show(stage);
  ctx.bg.style.background = room.bg;
  const refit = () => world.frame({ points: room.fit, top: 70, bottom: 10, side: 6 });
  refit();
  world.onResize = refit;
  hud.title.textContent = LEVEL_NAMES[6];
  hud.setCatches(0, 1);
  hud.mirror.hidden = false;

  const stats: LevelStats = { completed: false, noticedInTime: 0, boils: 0, cleanBreaths: 0, slips: 0 };
  const a = room.arena;
  const screen = { x: 0, y: 0 };
  const ev: BrainEvents = {
    face: (f) => pesky.setFace(f),
    say: () => {},
    sound: (s) => audio[s](),
    land: () => pesky.land(),
    puff: () => {},
    trick: () => {},
    portal: () => {},
  };
  const brain = new Brain(a, ev, { tricks: [], tripPerSec: 0 });
  const ptr: Ptr = { x: 0, z: 0, vx: 0, vz: 0, active: false, known: false };

  /** The nearest floor row still above the breath orb. */
  const nearZ = (() => {
    const limit = innerHeight - Math.min(360, innerHeight * 0.45);
    for (let z = a.maxZ; z > a.minZ; z -= 0.1) if (world.project(new THREE.Vector3(0, 1, z), screen).y < limit) return z;
    return a.minZ;
  })();
  const farZ = a.minZ + 0.2;
  let step = 0;
  let phase: 'shy' | 'close' | 'friends' = 'shy';
  let lastTap = -Infinity;
  let pendingGentle = 0;
  let clock = 0;
  const zFor = (s: number) => farZ + ((nearZ - farZ) * s) / STEPS;
  brain.teleport(rand(-0.6, 0.6), farZ);
  brain.hold('shock');

  const goTo = (s: number, speed: number, then?: () => void) => {
    step = clamp(s, 0, STEPS);
    const x = clamp(step === STEPS ? 0 : rand(-1, 1) * (1 - step / STEPS) * 1.2, a.minX, a.maxX);
    brain.walkTo(x, zFor(step), speed, () => {
      brain.hold(step === STEPS ? 'calm' : step > 2 ? 'calm' : 'shock');
      then?.();
    });
  };

  return new Promise<FinaleResult>((resolve) => {
    let looping = false;
    const finish = (exited: boolean) => {
      stats.completed = !exited;
      scope.dispose();
      ctx.breath.cancel();
      unsub();
      world.stop();
      world.onResize = undefined;
      hud.clearCards();
      hud.hush();
      hud.mirror.hidden = true;
      hud.setCalm(0);
      hud.setDesat(false);
      audio.stopPad();
      pesky.dispose();
      room.dispose();
      resolve({ stats, exited });
    };
    hud.setBack('map', () => finish(true));

    // ------------------------------------------------------------ the breath brings him closer
    const breatheLoop = async () => {
      if (looping) return;
      looping = true;
      // One unbroken breathing session: the orb never disappears under your finger.
      const r = await ctx.breath.run({
        cycles: 99,
        title: '',
        desc: '',
        endless: true,
        onProgress: (p) => hud.setCalm(p * 0.6),
        onCycle: () => {
          if (phase !== 'shy') return;
          goTo(step + 1, 0.9, () => {
            if (step === STEPS && phase === 'shy') {
              ctx.breath.cancel();
              becomeClose();
            }
          });
        },
      });
      stats.cleanBreaths += r.clean;
      looping = false;
    };

    const becomeClose = () => {
      phase = 'close';
      pesky.setFace('calm');
      hud.say('…?', 1800);
      scope.timeout(() => phase === 'close' && hud.say(T.friendHint, 2200), 3500);
    };

    // ------------------------------------------------------------ taps push him away
    const scare = (x: number, y: number) => {
      pesky.setFace('shock');
      hud.say(T.startled, 1100);
      audio.whoosh();
      vibrate(12);
      fx.ring(x, y, 'rgba(229, 56, 59, 0.45)', 34);
      const wasClose = phase === 'close';
      phase = 'shy';
      goTo(step - 2, 3.2, () => pesky.setFace('shock'));
      if (wasClose) void breatheLoop();
    };

    scope.on<PointerEvent>(world.canvas, 'pointerdown', (e) => {
      if (phase === 'friends') return;
      const now = performance.now();
      const quick = now - lastTap < CALM_BEFORE_MS;
      lastTap = now;
      const p = world.floorAt(e.clientX, e.clientY, 0.45);
      if (!p) return;
      // A second tap right after the first one turns it into a grab.
      if (pendingGentle) {
        clearTimeout(pendingGentle);
        pendingGentle = 0;
        return scare(e.clientX, e.clientY);
      }
      const near = Math.hypot(p.x - brain.x, p.z - brain.z) < SCARE_R;
      if (!near) return;
      const c = new THREE.Vector3(brain.x, 0.45 * pesky.comp, brain.z);
      world.project(c, screen);
      const onHim = Math.hypot(e.clientX - screen.x, e.clientY - screen.y) < Math.max(world.pxPerUnit(c) * 0.7, 40);
      if (phase === 'close' && onHim && !quick) {
        // Wait a moment: if no second tap follows, it was a gentle touch.
        pendingGentle = window.setTimeout(() => {
          pendingGentle = 0;
          if (phase === 'close') friends(e.clientX, e.clientY);
        }, CALM_AFTER_MS);
        return;
      }
      scare(e.clientX, e.clientY);
    });
    scope.add(() => clearTimeout(pendingGentle));
    // Keyboard: Enter on Pesky is a gentle touch when he's close.
    hud.peskyBtn.tabIndex = 0;
    scope.on<MouseEvent>(hud.peskyBtn, 'click', (e) => {
      if (e.detail !== 0) return;
      if (phase === 'close') friends(screen.x, screen.y);
      else scare(screen.x, screen.y);
    });
    scope.add(() => (hud.peskyBtn.tabIndex = -1));

    const friends = (x: number, y: number) => {
      phase = 'friends';
      hud.setCatches(1, 1);
      pesky.setFace('laugh');
      hud.say(T.friends, 2400);
      hud.tapResult(x, y - 16, '💛', 'c3-hit c3-big');
      audio.success();
      scope.timeout(() => audio.bell(9, 0.7), 300);
      vibrate([20, 40, 20]);
      fx.confetti(x, y, 50, ['#ff8fab', '#ffd447', '#2ec4b6', '#b983ff', '#ffffff']);
      hud.setCalm(1);
      scope.timeout(() => finish(false), 2600);
    };

    // ------------------------------------------------------------ frame
    const unsub = world.onFrame((dt) => {
      clock += dt;
      brain.mods.reduced = reducedMotion();
      brain.update(dt, ptr);
      const d = world.camera.position.distanceTo(new THREE.Vector3(brain.x, 0.45, brain.z));
      const dNear = world.camera.position.distanceTo(new THREE.Vector3(0, 0.45, a.maxZ));
      pesky.comp = Math.max(1, (0.75 * d) / dNear);
      // Shy: he peeks, turning away; closer: he looks at you.
      const shy = phase === 'shy' && step < 3;
      pesky.update(dt, {
        x: brain.x,
        z: brain.z,
        y: brain.y,
        running: brain.running,
        stumbling: false,
        faceX: shy ? Math.sin(clock * 0.8) * 0.9 : brain.running ? brain.faceX : 0,
        faceZ: 1,
        reduced: brain.mods.reduced,
      });
      room.update(dt, clock);
      const c = new THREE.Vector3(brain.x, brain.y + 0.45 * pesky.comp, brain.z);
      world.project(c, screen);
      hud.follow(screen.x, screen.y, world.pxPerUnit(c) * pesky.comp);
      if (phase === 'shy' && step < 2 && Math.random() < dt * 0.25) hud.say(pick(['…', '?', '…!']), 900);
    });

    if (ctx.debug) (window as unknown as { __c3f: unknown }).__c3f = { get step() { return step; }, get phase() { return phase; }, brain };
    world.start();
    void (async () => {
      await hud.story(STORY[6]);
      if (!scope.alive) return;
      audio.startPad('island');
      void breatheLoop();
    })();
  });
}

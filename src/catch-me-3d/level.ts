import * as THREE from 'three';
import { clamp, pick, rand, reducedMotion, Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import type { FX } from '../shared/fx';
import { vibrate } from '../shared/haptics';
import type { BreathOrb } from './breath';
import type { Debug } from './debug';
import { BoilGate, Calibrator, Frustration, Grip, NOTICE_MIN, type Notice } from './frustration';
import type { Hud } from './hud';
import { MAX_LEVEL_MS, TIRED_AT_MS, type Level, type Trick } from './levels';
import { ALMOST_REACH, Brain, CATCH_REACH, STREAK_CALLOUTS, type BrainEvents, type Ptr, type Say } from './pesky/brain';
import { PeskyModel, type FaceSet } from './pesky/model';
import { persist, seeTrick, type Save3D } from './save';
import type { LevelStats } from './stars';
import { BED, FEINTS, GOTCHAS, LEVEL_NAMES, MOCKS, R, ROOSTER_HINT, T, TAUNTS } from './story';
import { makeAddons, type Addon } from './tricks';
import { buildRoom } from './world/rooms';
import { roomSize, type Room } from './world/kit';
import type { World } from './world/scene';

/**
 * Plays one room: the chase, the frustration meter reading your taps, the
 * breath (forced when you boil over, or chosen with "I'm getting angry"),
 * calm power, the shield, and all the feedback.
 */

export interface Ctx {
  world: World;
  hud: Hud;
  breath: BreathOrb;
  audio: AudioEngine;
  fx: FX;
  save: Save3D;
  faces: FaceSet;
  debug: Debug | null;
  bg: HTMLElement;
}

export interface Played {
  stats: LevelStats;
  exited: boolean;
  /** Tricks seen for the first time in this play. */
  newTricks: Trick[];
  /** Endless: calm stars (noticed in time + calm catches). */
  calmStars: number;
  catches: number;
}

/** Calm power lasts 8s after noticing in time, only 3s after boiling over. */
export const CALM_MS = { inTime: 8000, early: 5000, late: 5000, boil: 3000, demo: 8000 } as const;
/** Calm power: Pesky runs at this share of his speed. */
export const CALM_SPEED = 0.6;
const IDLE_MS = 8000;

type BreathKind = Notice | 'boil' | 'demo';

export function playLevel(ctx: Ctx, lv: Level, o: { endless?: boolean; intro?: () => Promise<void> } = {}): Promise<Played> {
  const { world, hud, audio, fx, save } = ctx;
  const endless = !!o.endless;
  const scope = new Scope();
  const size = roomSize(innerWidth, innerHeight);
  const room: Room = buildRoom(lv.room, size);
  const stage = new THREE.Group();
  stage.add(room.group);
  const pesky = new PeskyModel(ctx.faces);
  stage.add(pesky.root);
  world.show(stage);
  ctx.bg.style.background = room.bg;
  const topPad = () => 70 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0);
  const refit = () => world.frame({ points: room.fit, top: topPad(), bottom: 10, side: 6 });
  refit();
  world.onResize = refit;

  hud.title.textContent = endless ? T.endless : LEVEL_NAMES[lv.id];
  hud.mirror.hidden = false;
  hud.setCatches(0, endless ? 0 : lv.catches);

  const stats: LevelStats = { completed: false, noticedInTime: 0, boils: 0, cleanBreaths: 0, slips: 0 };
  const fresh: Trick[] = [];
  const meter = new Frustration(save.baseline);
  const gate = new BoilGate();
  const grip = new Grip();
  const calibrator = lv.id === 1 && save.baseline === null ? new Calibrator(performance.now()) : null;
  let phase: 'intro' | 'chase' | 'breath' | 'done' = 'intro';
  let catches = 0;
  let calmCatches = 0;
  let misses = 0;
  let celebrating = false;
  let fingerDown = false;
  let fingerUpAt = 0;
  let lastTapAt = performance.now();
  let calmUntil = 0;
  let calmShown = 0;
  let shieldShown = 0;
  let chaseStart = 0;
  let chaseTime = 0; // seconds actually chasing (breaths don't count)
  let lastBreathEnd: number | null = null;
  let tired = false;
  let beat = 0;
  let clock = 0;
  let lastPress = 0;

  const ptr: Ptr = { x: 0, z: 0, vx: 0, vz: 0, active: false, known: false };
  let ptrT = 0;
  const center = new THREE.Vector3();
  const screen = { x: 0, y: 0 };

  const sayText: Record<Say, () => string> = {
    taunt: () => pick(TAUNTS),
    feint: () => pick(FEINTS),
    gotcha: () => pick(GOTCHAS),
    mock: () => pick(MOCKS),
    bed: () => pick(BED),
  };
  const events: BrainEvents = {
    face: (f) => pesky.setFace(f),
    say: (k) => {
      if (phase !== 'chase') return;
      hud.say(sayText[k]());
      // Pushing someone's buttons, now and then — the victim reacts.
      if (k === 'taunt' && clock - lastPress > 5 && Math.random() < 0.35) {
        lastPress = clock;
        room.press();
        audio.ring();
      }
    },
    sound: (s) => audio[s](),
    land: () => pesky.land(),
    puff: () => {
      world.project(new THREE.Vector3(brain.x, 0.05, brain.z), screen);
      fx.steam(screen.x, screen.y, 2, 0.45);
    },
    trick: (t) => {
      if (seeTrick(save, t)) {
        fresh.push(t);
        persist(save);
      }
    },
    portal: (_io, at) => {
      world.project(new THREE.Vector3(at.x, 0.4, at.z), screen);
      fx.steam(screen.x, screen.y, 6, 0.7);
      audio.pop();
    },
  };
  const brain = new Brain(room.arena, events, { tricks: lv.tricks, tripPerSec: lv.tripPerSec });
  brain.teleport(0, (room.arena.minZ + room.arena.maxZ) / 2 + 0.6);
  brain.hold('tease');
  const addons: Addon[] = makeAddons({ lv, stage, room, brain, pesky, faces: ctx.faces, world, fx, audio, endless, trick: (t) => events.trick(t) });

  /** Pesky's middle, on screen, and how many pixels one body spans there. */
  const locate = () => {
    center.set(brain.x, brain.y + 0.45 * pesky.comp, brain.z);
    world.project(center, screen);
    const bodyPx = world.pxPerUnit(center) * pesky.comp;
    return { x: screen.x, y: screen.y, bodyPx };
  };

  /** Keeps far-away Pesky at no less than 75% of his near size (fair taps at any depth). */
  const nearDist = world.camera.position.distanceTo(new THREE.Vector3(0, 0.45, room.arena.maxZ));
  const updateComp = () => {
    const d = world.camera.position.distanceTo(new THREE.Vector3(brain.x, 0.45, brain.z));
    pesky.comp = Math.max(1, (0.75 * d) / nearDist);
    for (const a of addons) a.comp?.(nearDist);
  };

  /** The nearest spot on the floor that still shows above the breath orb. */
  const aboveOrbZ = () => {
    const a = room.arena;
    const limit = innerHeight - Math.min(360, innerHeight * 0.45);
    for (let z = a.maxZ; z > a.minZ; z -= 0.1) {
      if (world.project(new THREE.Vector3(0, 1, z), screen).y < limit) return z;
    }
    return a.minZ;
  };

  const floorPoint = (e: PointerEvent) => world.floorAt(e.clientX, e.clientY, 0.45);

  const calmOn = () => performance.now() < calmUntil;
  const shielded = () => meter.shield && !calmOn();

  return new Promise<Played>((resolve) => {
    const finish = (exited: boolean) => {
      if (phase === 'done' && !exited) return;
      phase = 'done';
      stats.completed = !exited;
      scope.dispose();
      unsub();
      world.stop();
      world.onResize = undefined;
      hud.clearCards();
      hud.showNotice(false);
      hud.hush();
      hud.setHeat(0, 0);
      hud.setCalm(0);
      hud.setDesat(false);
      hud.mirror.hidden = true;
      audio.setWhistle(0);
      audio.stopPad();
      ctx.debug?.clear();
      for (const a of addons) a.dispose();
      pesky.dispose();
      room.dispose();
      resolve({ stats, exited, newTricks: fresh, calmStars: stats.noticedInTime + calmCatches, catches });
    };
    hud.setBack('map', () => finish(true));

    // ------------------------------------------------------------ input
    const track = (e: PointerEvent) => {
      const p = floorPoint(e);
      if (!p) return null;
      const dt = e.timeStamp - ptrT;
      if (ptr.known && dt > 0 && dt < 100) {
        ptr.vx = (p.x - ptr.x) / dt;
        ptr.vz = (p.z - ptr.z) / dt;
      } else ptr.vx = ptr.vz = 0;
      ptr.x = p.x;
      ptr.z = p.z;
      ptr.known = true;
      ptrT = e.timeStamp;
      return p;
    };
    const canvas = world.canvas;
    scope.on<PointerEvent>(canvas, 'pointermove', (e) => {
      const p = track(e);
      if (!p || phase !== 'chase') return;
      if (e.pointerType === 'mouse') ptr.active = true;
      brain.pointerMove(ptr);
      for (const a of addons) a.pointerMove?.(ptr);
    });
    const up = (e: PointerEvent) => {
      fingerDown = false;
      fingerUpAt = performance.now();
      if (e.pointerType !== 'mouse') ptr.active = false;
    };
    scope.on<PointerEvent>(canvas, 'pointerup', up);
    scope.on<PointerEvent>(canvas, 'pointercancel', up);
    scope.on(canvas, 'pointerleave', () => (ptr.active = false));
    scope.on<PointerEvent>(canvas, 'pointerdown', (e) => {
      fingerDown = true;
      const p = track(e);
      if (!p || phase !== 'chase') return;
      ptr.active = true;
      const now = performance.now();
      lastTapAt = now;
      meter.tap(now);
      calibrator?.tap(now);
      if (celebrating || brain.frozen) return;
      const me = locate();
      const d = Math.hypot(e.clientX - me.x, e.clientY - me.y);
      const hitR = Math.max(me.bodyPx * 0.6, 36);
      if (brain.stumbling && !brain.hidden && d < Math.max(hitR, CATCH_REACH * me.bodyPx)) return catchIt(e.clientX, e.clientY);
      // A decoy or a copy under the finger (and not Pesky himself)?
      if (d > hitR) {
        for (const a of addons) {
          const r = a.tap?.(e.clientX, e.clientY);
          if (r) {
            brain.pointerDown(p, e.pointerType === 'mouse');
            return fooled(e.clientX, e.clientY, r === 'decoy' ? R.fooled : R.notHim);
          }
        }
      }
      brain.pointerDown(p, e.pointerType === 'mouse');
      // After pointerDown(), so its random taunt can't hide a streak call-out.
      missed(e.clientX, e.clientY, !brain.hidden && d < ALMOST_REACH * me.bodyPx);
    });

    // Keyboard: Enter/Space on Pesky (the invisible button that follows him).
    hud.peskyBtn.tabIndex = 0;
    scope.on<MouseEvent>(hud.peskyBtn, 'click', (e) => {
      if (e.detail !== 0 || phase !== 'chase' || celebrating || brain.frozen) return;
      meter.tap(performance.now());
      lastTapAt = performance.now();
      if (brain.stumbling) return catchIt();
      brain.poke();
    });
    scope.add(() => (hud.peskyBtn.tabIndex = -1));

    // "I'm getting angry": noticing, by choice.
    scope.on(hud.notice, 'click', () => {
      if (phase !== 'chase' || celebrating) return;
      const k = meter.notice();
      if (k === 'inTime') stats.noticedInTime++;
      void breathe(k);
    });

    /** A tap that didn't catch him: say so, right where you tapped. */
    const missed = (x: number, y: number, almost: boolean) => {
      misses++;
      fx.ring(x, y, 'rgba(229, 56, 59, 0.55)', almost ? 44 : 30);
      hud.tapResult(x, y - 12, almost ? R.almost : R.miss, almost ? 'c3-almost' : 'c3-miss');
      audio.miss();
      vibrate(almost ? [10, 30, 10] : 8);
      meter.miss(almost);
      if (STREAK_CALLOUTS.includes(misses)) {
        pesky.setFace('laugh');
        hud.say(R.streak(misses), 1400);
      }
    };
    const fooled = (x: number, y: number, text: string) => {
      misses++;
      fx.ring(x, y, 'rgba(229, 56, 59, 0.55)', 36);
      hud.tapResult(x, y - 12, text, 'c3-miss');
      audio.giggle();
      vibrate([10, 30, 10]);
      meter.miss(false);
    };

    const catchIt = (cx?: number, cy?: number) => {
      const me = locate();
      cx ??= me.x;
      cy ??= me.y;
      // Either way, first you really do get him: hit-stop, sparks, a clear "Got it!".
      celebrating = true;
      brain.freeze();
      fx.sparks(cx, cy, '#ff6b4a', 16);
      audio.sizzle();
      vibrate([30, 40, 30]);
      if (grip.resolve(shielded()) === 'slip') {
        // The shield: he slips out of your hand and runs off laughing.
        stats.slips++;
        hud.tapResult(cx, cy - 12, R.hit, 'c3-hit');
        const at = world.floorAt(cx, cy, 0.45) ?? { x: brain.x, z: brain.z };
        scope.timeout(() => {
          celebrating = false;
          misses++;
          meter.slip();
          hud.tapResult(cx!, cy! - 40, R.notReally, 'c3-miss');
          brain.slipFrom({ x: at.x + rand(-0.1, 0.1), z: at.z + rand(-0.1, 0.1) });
        }, 420);
        return;
      }
      catches++;
      if (meter.f < NOTICE_MIN) calmCatches++;
      misses = 0;
      pesky.setFace('dizzy');
      hud.tapResult(cx, cy - 12, R.caught, 'c3-hit c3-big');
      audio.success();
      hud.setCatches(catches, endless ? catches : lv.catches);
      if (!endless && catches >= lv.catches) {
        fx.confetti(cx, cy, 40, ['#2ec4b6', '#ffd447', '#fff3c4', '#8cc084', '#ff8fab']);
        scope.timeout(() => {
          celebrating = false;
          complete();
        }, 900);
        return;
      }
      scope.timeout(() => {
        celebrating = false;
        if (phase !== 'chase') return;
        brain.resume();
        brain.pointerDown({ x: brain.x + rand(-0.2, 0.2), z: brain.z + 0.3 }, true);
      }, 750);
    };

    const complete = () => {
      brain.hold('dizzy');
      audio.bell(4, 0.7);
      scope.timeout(() => finish(false), 700);
    };

    /** The level's soft cap: he tires out; the hard cap: he gives up. */
    const giveUp = () => {
      phase = 'done';
      hud.say(T.gaveUp, 1600);
      brain.hold('dizzy');
      catches = lv.catches;
      hud.setCatches(catches, lv.catches);
      audio.success();
      scope.timeout(() => finish(false), 1500);
    };

    // ------------------------------------------------------------ breathing
    const breathe = async (kind: BreathKind) => {
      phase = 'breath';
      hud.showNotice(false);
      hud.hush();
      hud.setDesat(true);
      audio.setWhistle(0);
      // While you breathe, he sneaks up close and watches, curious.
      const a = room.arena;
      brain.walkTo(clamp(rand(-0.8, 0.8), a.minX, a.maxX), aboveOrbZ(), 1.6, () => brain.hold('calm'));
      scope.timeout(() => phase === 'breath' && pesky.setFace('calm'), 600);
      let title = T.noticeTitle;
      let desc = T.breathDesc;
      let cycles = 1;
      if (kind === 'boil') {
        stats.boils++;
        audio.boilOver();
        vibrate([120, 60, 180]);
        title = T.boilTitle;
        cycles = 2;
        // The mirror line: what the anger did to your fingers — body, not blame.
        const base = meter.baseline;
        const peak = meter.peakRate;
        desc = peak > base * 1.3 ? T.mirror(fmt(base), fmt(peak)) : T.mirrorPlain;
        const r = hud.mirror.getBoundingClientRect();
        for (let i = 0; i < 10; i++) fx.steam(r.left + r.width / 2 + rand(-10, 10), r.top, 1, 1.6);
      } else if (kind === 'inTime') {
        title = T.noticedTitle;
        audio.success();
      } else if (kind === 'demo') {
        title = T.demoTitle;
        desc = T.demoDesc;
      }
      // On the roof, the rooster's hint comes back while you breathe.
      if (lv.id === 5 && kind !== 'boil') desc = `🐓 “${ROOSTER_HINT}”`;
      const kitchen = kind === 'demo' ? (room as Room & { setHeat?: (h: number) => void }) : null;
      const res = await ctx.breath.run({
        cycles,
        title,
        desc,
        endless,
        onProgress: (p) => {
          hud.setCalm(p);
          kitchen?.setHeat?.(1 - p);
        },
      });
      if ((phase as string) === 'done') return; // left the room mid-breath
      if (kind !== 'demo') stats.cleanBreaths += res.clean;
      meter.cool(kind === 'boil' ? 10 : 5);
      lastBreathEnd = performance.now();
      calmUntil = performance.now() + CALM_MS[kind];
      hud.setDesat(false);
      hud.tapResult(innerWidth / 2, innerHeight * 0.3, T.calmPower, 'c3-hit c3-big');
      audio.bell(7, 0.6);
      phase = 'chase';
      if (!chaseStart) chaseStart = performance.now();
      brain.resume();
      if (kind === 'demo') scope.timeout(() => hud.tapResult(innerWidth / 2, innerHeight * 0.3, T.slowed, 'c3-hit'), 1800);
      if (endless && stats.boils >= 3) {
        phase = 'done';
        scope.timeout(() => finish(false), 400);
      }
    };

    // ------------------------------------------------------------ frame
    const unsub = world.onFrame((dt) => {
      const now = performance.now();
      clock += dt;
      const slow = phase === 'breath' ? 0.35 : 1;
      if (phase === 'chase') {
        chaseTime += dt;
        meter.update(dt, now, true);
        if (calibrator) {
          const b = calibrator.result(now);
          if (b !== null) {
            save.baseline = meter.baseline = b;
            persist(save);
          }
        }
      }
      const calm = calmOn();
      if (!tired && !endless && chaseTime * 1000 > TIRED_AT_MS) {
        tired = true;
        hud.say(T.tired, 1600);
      }
      if (!endless && chaseTime * 1000 > MAX_LEVEL_MS && phase === 'chase' && !celebrating) giveUp();
      // He feeds on your anger; calm power makes him slow and clumsy.
      const escalate = endless ? 1 + Math.min(0.5, chaseTime / 240) : 1;
      brain.mods.speed = (calm ? CALM_SPEED : 1 + (0.3 * meter.f) / 100) * (tired ? 0.6 : 1) * escalate;
      brain.mods.jink = calm ? 0.5 : 1;
      brain.mods.trip = (calm ? 3 : 1) * (tired ? 4 : 1);
      brain.mods.reduced = reducedMotion();
      if (phase !== 'intro') brain.update(dt * slow, ptr);
      updateComp();
      pesky.update(dt * slow, {
        x: brain.x,
        z: brain.z,
        y: brain.y,
        running: brain.running,
        stumbling: brain.stumbling,
        faceX: brain.faceX,
        faceZ: brain.faceZ,
        reduced: brain.mods.reduced,
        hidden: brain.hidden,
      });
      for (const a of addons) a.update(dt * slow, phase);
      shieldShown += ((shielded() && phase === 'chase' ? 1 : 0) - shieldShown) * Math.min(1, dt * 6);
      pesky.setShield(shieldShown);
      calmShown += ((calm ? 1 : 0) - calmShown) * Math.min(1, dt * 3);
      if (phase !== 'breath') hud.setCalm(calmShown);
      hud.setHeat(meter.f / 100, dt);
      room.update(dt, clock);
      const me = locate();
      hud.follow(me.x, me.y, me.bodyPx, !brain.hidden);

      if (phase === 'chase') {
        hud.showNotice(lv.notice && chaseTime > 5, lv.noticePulse && meter.f > NOTICE_MIN);
        // The soundtrack's pulse and the kettle whistle rise with F.
        audio.setWhistle(Math.max(0, (meter.f - 55) / 45) * 0.45);
        if (meter.f > 65) {
          beat += dt;
          if (beat > 1.25 - (meter.f / 100) * 0.55) {
            beat = 0;
            audio.heartbeat();
          }
        }
        if (lv.forcedBoil && gate.check({ now, chaseStart, lastBreathEnd, fingerDown, fingerUpAt, celebrating, boiling: meter.boiling })) void breathe('boil');
        // Nobody chasing for a while? He comes closer to tease (never a boil).
        else if (now - lastTapAt > IDLE_MS && !ptr.active && !brain.busy && !celebrating) {
          lastTapAt = now;
          const a = room.arena;
          brain.walkTo(clamp(rand(-1, 1), a.minX, a.maxX), a.maxZ - 0.4, 2.2, () => {
            pesky.setFace('tease');
            hud.say(pick(TAUNTS));
            scope.timeout(() => phase === 'chase' && brain.resume(), 1300);
          });
        }
      }
      ctx.debug?.update(dt, {
        F: meter.f,
        baseline: meter.baseline,
        rate: meter.rate(now),
        mode: brain.mode,
        shield: shielded(),
        calm: calm ? ((calmUntil - now) / 1000).toFixed(1) + 's' : 'no',
        tired,
        chase: chaseTime,
        catches,
        fps: world.fps,
        ratio: world.ratio,
      });
    });

    // Tuning/testing hook, only with ?debug=1.
    if (ctx.debug) (window as unknown as { __c3: unknown }).__c3 = { brain, meter, locate, addons, get phase() { return phase; }, stats };

    // ------------------------------------------------------------ start
    world.start();
    const go = () => {
      phase = 'chase';
      chaseStart = performance.now();
      lastTapAt = chaseStart;
      audio.startPad('home');
      brain.start();
      hud.say(T.go, 1400);
    };
    void (async () => {
      await o.intro?.();
      if (phase === 'done') return;
      if (lv.id === 2 && !endless) {
        // The kettle boils first: a guided breath before the chase, then calm power in action.
        audio.startPad('home');
        void breathe('demo');
      } else scope.timeout(go, 300);
    })();
  });
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

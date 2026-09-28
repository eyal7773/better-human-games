import { clamp, ease, lerp, pick, rand } from '../../shared/dom';
import type { Trick } from '../levels';

/**
 * How Pesky runs — the tested `chase()` logic from src/catch-me/main.ts, moved
 * onto the floor of a 3D room: positions are (x, z) in world units, where one
 * unit is one body. No DOM and no three.js here; the level wires in input and
 * turns events into faces, speech bubbles and sound. Timers run on the brain's
 * own clock, so slowing time down (breathing) slows Pesky too.
 */

export type Face = 'tease' | 'run' | 'shock' | 'dizzy' | 'calm' | 'laugh';

/** It spooks when the pointer is this many bodies away — growing over the level. */
export const FEAR_RADIUS: [number, number] = [2, 2.8];
/** Hops get up to this much faster by the end of a level. */
export const MAX_SPEEDUP = 1.5;
/** How far ahead (ms) it guesses where a moving pointer is going. */
export const LOOKAHEAD_MS = 160;
/** Chance a dodge turns into a feint: it plays tired, then bolts at the last moment. */
export const FEINT_CHANCE = 0.15;
/** It jogs around on its own, in arena-widths per second (start → end of a level). */
export const JOG_SPEED: [number, number] = [0.65, 1.1];
/** A pointer close by makes it run this much faster, away from it. */
export const PANIC_BOOST = 2.2;
/** It jogs for a while (ms)… */
export const JOG_MS: [number, number] = [2500, 4500];
/** …then stops to taunt you for a moment (ms) — your window of hope. */
export const PAUSE_MS: [number, number] = [300, 600];
/** How sharply its path wanders (radians per second). */
export const WANDER_TURN = 4;
/** Nonstop darts sideways and back: gap between darts (ms)… */
export const JINK_GAP_MS: [number, number] = [100, 350];
/** …how long a dart out-and-back takes (ms)… */
export const JINK_MS: [number, number] = [170, 280];
/** …and how far out it goes, in bodies. */
export const JINK_SIZE: [number, number] = [1, 1.9];
/** How long a trip lasts — the catch window. */
export const TRIP_MS = 750;
/** While it's down, a tap this close (bodies) catches it. */
export const CATCH_REACH = 1.1;
/** A missed tap this close (bodies) counts as "almost". */
export const ALMOST_REACH = 1.5;
/** Miss streaks it calls out, to rub it in. */
export const STREAK_CALLOUTS = [3, 5, 8, 12, 20];
/** Level time over which it gets jumpier, faster and cheekier. */
export const PROGRESS_SPAN_S = 120;

export interface Pt {
  x: number;
  z: number;
}
/** An axis-aligned block on the floor; `h` is its height (a bed can be jumped on). */
export interface Box {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  h: number;
}
export interface Arena {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  obstacles: Box[];
  hideSpots: Pt[];
  portals: Pt[];
  bed: Box | null;
}
export interface Ptr extends Pt {
  /** Velocity in units per millisecond. */
  vx: number;
  vz: number;
  /** A finger is down, or a mouse is over the room. */
  active: boolean;
  known: boolean;
}

export type Say = 'taunt' | 'feint' | 'gotcha' | 'mock' | 'bed';
export type Sound = 'whoosh' | 'giggle' | 'pop' | 'slip';

export interface BrainEvents {
  face(f: Face): void;
  say(kind: Say): void;
  sound(s: Sound): void;
  /** Squash on landing (from a hop or a bounce). */
  land(): void;
  /** Steam puff at its feet. */
  puff(): void;
  /** A trick was performed where the player could see it. */
  trick(t: Trick): void;
  portal(inOut: 'in' | 'out', at: Pt): void;
}

/** Live multipliers: level speed, anger feeding it, calm power, reduced motion… */
export interface Mods {
  speed: number;
  jink: number;
  trip: number;
  /** Reduced motion: half speed, no zigzag. */
  reduced: boolean;
}

type Mode = 'jog' | 'pause' | 'hop' | 'trip' | 'feint' | 'frozen' | 'walk' | 'bed' | 'hidden' | 'idle';

interface Hop {
  sx: number;
  sz: number;
  sy: number;
  tx: number;
  tz: number;
  ty: number;
  t: number;
  dur: number;
  height: number;
  then: () => void;
}

const BODY_R = 0.38;

export class Brain {
  x = 0;
  z = 0;
  /** Height of the feet above the floor (hops, bouncing on the bed). */
  y = 0;
  heading = rand(0, Math.PI * 2);
  /** Where it's looking/moving, for turning the model. */
  faceX = 0;
  faceZ = 1;
  mode: Mode = 'idle';
  running = false;
  /** Bouncing gait while jogging. */
  bob = 0;
  mods: Mods = { speed: 1, jink: 1, trip: 1, reduced: false };
  /** Game clock (seconds) — the level's own time, slowed while breathing. */
  t = 0;
  /** A pointer-driven dodge counter (feints only after a couple). */
  dodges = 0;
  hidden = false;
  /** Set when a hop/jog stops in a hiding spot. */
  hiding = false;

  private jogging = true;
  private hop: Hop | null = null;
  private walk: { tx: number; tz: number; v: number; scripted?: boolean; then?: () => void } | null = null;
  private timers: { at: number; fn: () => void; gen: number }[] = [];
  private gen = 0;
  private jink = { t: 0, dur: 0, amp: 0, off: 0, wait: 0 };
  private bedUntil = 0;
  private started = 0;

  constructor(
    public arena: Arena,
    private ev: BrainEvents,
    private opts: { tricks: readonly Trick[]; tripPerSec: number; clone?: boolean },
  ) {
    this.x = (arena.minX + arena.maxX) / 2;
    this.z = (arena.minZ + arena.maxZ) / 2;
  }

  // ------------------------------------------------------------ clock

  /** Runs fn after `ms` of game time, unless the brain's plans change first (cancel()). */
  private after(ms: number, fn: () => void) {
    this.timers.push({ at: this.t + ms / 1000, fn, gen: this.gen });
  }
  /** Drops pending plans (a scripted scene is taking over). */
  private cancel() {
    this.gen++;
  }

  get progress() {
    return clamp((this.t - this.started) / PROGRESS_SPAN_S, 0, 1);
  }
  get fearRadius() {
    return lerp(FEAR_RADIUS[0], FEAR_RADIUS[1], this.progress);
  }
  private get hopSpeed() {
    return lerp(1, MAX_SPEEDUP, this.progress) * Math.max(0.4, this.mods.speed);
  }
  get width() {
    return this.arena.maxX - this.arena.minX;
  }
  get stumbling() {
    return this.mode === 'trip';
  }
  get frozen() {
    return this.mode === 'frozen';
  }
  get feinting() {
    return this.mode === 'feint';
  }
  /** Busy with something a dodge can't interrupt. */
  get busy() {
    return ['hop', 'trip', 'feint', 'frozen', 'hidden', 'idle'].includes(this.mode) || (this.mode === 'walk' && this.walk?.scripted === true);
  }

  // ------------------------------------------------------------ lifecycle

  /** Start (or restart) chasing. */
  start() {
    this.cancel();
    this.started = this.t;
    this.mode = 'jog';
    this.jogging = true;
    this.hop = null;
    this.walk = null;
    this.hidden = false;
    this.hiding = false;
    this.y = 0;
    this.ev.face('tease');
    this.after(rand(...JOG_MS), () => this.rhythm());
  }

  /** Stop everything and stand still (cutscenes, breathing, the end of a level). */
  hold(face: Face = 'tease') {
    this.cancel();
    this.mode = 'idle';
    this.running = false;
    this.hop = null;
    this.walk = null;
    this.hiding = false;
    this.ev.face(face);
  }

  /** Back to chasing after a scene, without resetting the level's progress. */
  resume() {
    const started = this.started;
    this.start();
    this.started = started;
  }

  teleport(x: number, z: number) {
    this.x = x;
    this.z = z;
    this.y = 0;
  }

  /** Walks somewhere on its own (curious during breathing, teasing an idle player…). */
  walkTo(x: number, z: number, speed: number, then?: () => void) {
    this.cancel();
    this.hop = null;
    this.mode = 'walk';
    this.hiding = false;
    this.walk = { tx: x, tz: z, v: speed, scripted: true, then };
  }

  // ------------------------------------------------------------ geometry

  private inside(b: Box, x: number, z: number, pad = BODY_R) {
    return x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad;
  }
  private blocked(x: number, z: number) {
    return this.arena.obstacles.some((b) => this.inside(b, x, z));
  }
  private clampArena() {
    const a = this.arena;
    this.x = clamp(this.x, a.minX, a.maxX);
    this.z = clamp(this.z, a.minZ, a.maxZ);
  }
  /** Push out of furniture along the shallowest side, and turn away from it. */
  private pushOut() {
    for (const b of this.arena.obstacles) {
      if (!this.inside(b, this.x, this.z)) continue;
      const d = [this.x - (b.x0 - BODY_R), b.x1 + BODY_R - this.x, this.z - (b.z0 - BODY_R), b.z1 + BODY_R - this.z];
      const m = Math.min(...d);
      if (m === d[0]) this.x = b.x0 - BODY_R;
      else if (m === d[1]) this.x = b.x1 + BODY_R;
      else if (m === d[2]) this.z = b.z0 - BODY_R;
      else this.z = b.z1 + BODY_R;
      this.heading += Math.PI * rand(0.5, 1);
    }
  }

  /** Pick a landing spot well away from the pointer, inside the room and clear of furniture. */
  escapeFrom(px: number, pz: number): Pt {
    const a = this.arena;
    let best = { x: this.x, z: this.z, score: -Infinity };
    for (let i = 0; i < 24; i++) {
      const x = rand(a.minX, a.maxX);
      const z = rand(a.minZ, a.maxZ);
      if (this.blocked(x, z)) continue;
      const away = Math.hypot(x - px, z - pz);
      const travel = Math.hypot(x - this.x, z - this.z);
      // Far from the finger, but not always across the whole room — and never
      // a landing that's still within easy reach.
      const tooClose = away < FEAR_RADIUS[1] ? 4 : 0;
      const score = away - Math.max(0, travel - this.width * 0.8) * 0.5 + rand(0, 0.37) - tooClose;
      if (score > best.score) best = { x, z, score };
    }
    return best;
  }

  // ------------------------------------------------------------ moves

  private startHop(tx: number, tz: number, ty: number, speed: number, then: () => void) {
    const dist = Math.hypot(tx - this.x, tz - this.z);
    this.mode = 'hop';
    this.running = true;
    this.hiding = false;
    this.setFacing(tx - this.x, tz - this.z);
    this.ev.face(Math.random() < 0.5 ? 'run' : 'laugh');
    this.ev.sound('whoosh');
    if (Math.random() < 0.35) this.ev.sound('giggle');
    this.ev.puff();
    const ms = clamp((dist * 94) / 1.7, 240, 430) / speed;
    this.hop = {
      sx: this.x,
      sz: this.z,
      sy: this.y,
      tx,
      tz,
      ty,
      t: 0,
      dur: ms / 1000,
      height: Math.min(0.75, 0.28 + dist * 0.18),
      then,
    };
  }

  /** Hop away from a point, then carry on jogging. */
  private flee(px: number, pz: number, boost = 1, then?: () => void) {
    const to = this.escapeFrom(px, pz);
    this.startHop(to.x, to.z, 0, this.hopSpeed * boost, () => {
      this.mode = 'jog';
      this.ev.face('tease');
      then?.();
    });
  }

  private dodge(px: number, pz: number) {
    if (this.busy) return;
    this.dodges++;
    // Now and then it plays tired, lets you get close, and bolts at the last moment.
    if (!this.opts.clone && this.dodges >= 2 && Math.random() < FEINT_CHANCE) return this.feint();
    if (Math.random() < 0.45) this.ev.say('taunt');
    this.flee(px, pz, 1, () => {
      if (this.dodges >= 6 && Math.random() < 0.15) this.trip();
    });
  }

  /** Now and then it trips over its own sneakers — the only way to catch it. */
  trip() {
    if (this.opts.clone) return;
    this.mode = 'trip';
    this.running = false;
    this.ev.face('dizzy');
    this.ev.sound('slip');
    this.after(TRIP_MS, () => {
      if (this.mode !== 'trip') return; // caught meanwhile
      this.mode = 'jog';
      this.ev.face('tease');
    });
  }

  private feint() {
    this.mode = 'feint';
    this.running = false;
    this.ev.face('calm');
    this.ev.say('feint');
    // If you don't take the bait, it doesn't wait forever.
    this.after(rand(900, 1500), () => this.mode === 'feint' && this.bolt());
  }
  private lastPtr: Pt = { x: 0, z: 0 };
  bolt() {
    this.mode = 'jog';
    this.ev.sound('giggle');
    this.flee(this.lastPtr.x, this.lastPtr.z, 1.35, () => this.ev.say('gotcha'));
  }

  /** It never just stands there: it jogs on a wandering path, stops to taunt, jogs on. */
  private rhythm() {
    this.jogging = !this.jogging;
    if (!this.jogging && this.mode === 'jog') {
      this.running = false;
      if (this.trySpecial()) {
        this.jogging = true;
      } else if (Math.random() < FEINT_CHANCE * 2 && !this.opts.clone) {
        this.feint();
      } else {
        this.mode = 'pause';
        this.ev.face('tease');
        if (Math.random() < 0.6 + 0.3 * this.progress) this.ev.say('taunt');
      }
    } else if (this.jogging && this.mode === 'pause') {
      this.mode = 'jog';
      this.hiding = false;
    }
    this.after(rand(...(this.jogging ? JOG_MS : PAUSE_MS)), () => this.rhythm());
  }

  /** The level's own tricks, used in place of a plain pause. */
  private trySpecial(): boolean {
    const has = (t: Trick) => this.opts.tricks.includes(t);
    if (has('hide') && this.arena.hideSpots.length && Math.random() < 0.5) return this.goHide(), true;
    if (has('bed') && this.arena.bed && Math.random() < 0.3) return this.goBed(), true;
    if (has('portals') && this.arena.portals.length > 1 && Math.random() < 0.4) return this.goPortal(), true;
    return false;
  }

  /** Stops behind a table or chair leg, peeking out. */
  private goHide() {
    const spots = this.arena.hideSpots;
    const p = this.lastPtr;
    const spot = spots.reduce((best, s) => {
      const score = -Math.hypot(s.x - this.x, s.z - this.z) + Math.hypot(s.x - p.x, s.z - p.z) * 0.5;
      return score > best.score ? { s, score } : best;
    }, { s: spots[0], score: -Infinity }).s;
    const v = this.width * JOG_SPEED[0] * this.speedMul();
    this.mode = 'walk';
    this.running = true;
    this.walk = {
      tx: spot.x,
      tz: spot.z,
      v,
      then: () => {
        this.mode = 'pause';
        this.hiding = true;
        this.running = false;
        this.ev.face('tease');
        this.ev.trick('hide');
        this.after(rand(900, 1500), () => {
          if (this.mode === 'pause' && this.hiding) {
            this.hiding = false;
            this.mode = 'jog';
          }
        });
      },
    };
  }

  /** Hops onto the bed and bounces on it, laughing. */
  private goBed() {
    const b = this.arena.bed!;
    const cx = (b.x0 + b.x1) / 2 + rand(-0.3, 0.3);
    const cz = (b.z0 + b.z1) / 2 + rand(-0.2, 0.2);
    this.startHop(cx, cz, b.h, this.hopSpeed, () => {
      this.mode = 'bed';
      this.running = false;
      this.ev.face('laugh');
      this.ev.say('bed');
      this.ev.trick('bed');
      this.bedUntil = this.t + rand(1.6, 2.4);
    });
  }

  /** Dives into a door or chimney and pops out of another one. */
  private goPortal() {
    const ps = this.arena.portals;
    const near = ps.reduce((a, b) => (Math.hypot(a.x - this.x, a.z - this.z) < Math.hypot(b.x - this.x, b.z - this.z) ? a : b));
    this.mode = 'walk';
    this.running = true;
    this.walk = {
      tx: near.x,
      tz: near.z,
      v: this.width * JOG_SPEED[1] * this.speedMul(),
      then: () => {
        this.mode = 'hidden';
        this.hidden = true;
        this.running = false;
        this.ev.portal('in', near);
        this.after(rand(600, 1100), () => {
          if (this.mode !== 'hidden') return;
          const p = this.lastPtr;
          const out = ps
            .filter((q) => q !== near)
            .reduce((a, b) => (Math.hypot(a.x - p.x, a.z - p.z) > Math.hypot(b.x - p.x, b.z - p.z) ? a : b));
          this.x = out.x;
          this.z = out.z;
          this.hidden = false;
          this.ev.portal('out', out);
          this.ev.trick('portals');
          this.flee(p.x, p.z);
        });
      },
    };
  }

  private speedMul() {
    return this.mods.speed * (this.mods.reduced ? 0.5 : 1);
  }

  private setFacing(dx: number, dz: number) {
    const d = Math.hypot(dx, dz);
    if (d > 1e-4) {
      this.faceX = dx / d;
      this.faceZ = dz / d;
    }
  }

  /** Turn `a` toward `target` by at most `max` radians. */
  private steer(a: number, target: number, max: number) {
    return a + clamp(Math.atan2(Math.sin(target - a), Math.cos(target - a)), -max, max);
  }

  private jog(dt: number, ptr: Ptr) {
    const a = this.arena;
    let v = this.width * lerp(JOG_SPEED[0], JOG_SPEED[1], this.progress) * this.mods.speed;
    this.heading += rand(-1, 1) * WANDER_TURN * dt;
    // Ease away from the walls before reaching them…
    const edge = 0.8;
    if (this.x < a.minX + edge || this.x > a.maxX - edge || this.z < a.minZ + edge || this.z > a.maxZ - edge) {
      const cx = (a.minX + a.maxX) / 2;
      const cz = (a.minZ + a.maxZ) / 2;
      this.heading = this.steer(this.heading, Math.atan2(cz - this.z, cx - this.x), 3 * dt);
    }
    // …but a pointer close by wins: run from it, sliding along a wall if pinned.
    if (ptr.active && Math.hypot(this.x - ptr.x, this.z - ptr.z) < this.fearRadius * 1.8) {
      this.heading = this.steer(this.heading, Math.atan2(this.z - ptr.z, this.x - ptr.x), 8 * dt);
      v *= PANIC_BOOST;
    }
    if (this.mods.reduced) v *= 0.5;
    // Nonstop darts to the side and back, so it's never where you aimed.
    let side = 0;
    if (!this.mods.reduced && this.opts.tricks.includes('zigzag') && this.mods.jink > 0) {
      const j = this.jink;
      if (j.t < j.dur) {
        j.t = Math.min(j.dur, j.t + dt);
        const off = j.amp * Math.sin((Math.PI * j.t) / j.dur);
        side = off - j.off;
        j.off = off;
      } else if ((j.wait -= dt) <= 0) {
        Object.assign(j, {
          t: 0,
          dur: rand(...JINK_MS) / 1000,
          amp: pick([-1, 1]) * rand(...JINK_SIZE) * this.mods.jink,
          off: 0,
          wait: rand(...JINK_GAP_MS) / 1000,
        });
        if (Math.random() < 0.05) this.ev.trick('zigzag');
      }
    }
    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);
    this.x += cos * v * dt - sin * side;
    this.z += sin * v * dt + cos * side;
    this.clampArena();
    this.pushOut();
    this.running = true;
    this.setFacing(cos, sin);
    this.bob += dt * 14;
    this.y = this.mods.reduced ? 0 : Math.abs(Math.sin(this.bob)) * 0.06;
    if (this.progress > 0.02 && Math.random() < this.opts.tripPerSec * this.mods.trip * dt) this.trip();
  }

  // ------------------------------------------------------------ input

  /**
   * The pointer (a mouse, or a finger sliding on the screen) gets close, or is
   * heading its way fast → it runs early, away from where the pointer is going.
   */
  pointerMove(ptr: Ptr) {
    this.lastPtr = { x: ptr.x, z: ptr.z };
    if (this.mode === 'feint') {
      if (Math.hypot(ptr.x - this.x, ptr.z - this.z) < 0.8) this.bolt();
      return;
    }
    if (this.mode === 'bed') {
      if (Math.hypot(ptr.x - this.x, ptr.z - this.z) < this.fearRadius) this.leaveBed(ptr);
      return;
    }
    const ax = ptr.x + ptr.vx * LOOKAHEAD_MS;
    const az = ptr.z + ptr.vz * LOOKAHEAD_MS;
    const r = this.fearRadius;
    if (Math.hypot(ptr.x - this.x, ptr.z - this.z) < r || Math.hypot(ax - this.x, az - this.z) < r * 0.9) {
      if (!this.busy) this.ev.face('shock');
      this.dodge(ax, az);
    }
  }

  /** A tap that didn't catch it (the level checks catches in screen space first). */
  pointerDown(p: Pt, mouse: boolean) {
    this.lastPtr = p;
    if (this.mode === 'frozen') return;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (this.mode === 'feint') {
      if (d < 1.6) this.bolt();
      return;
    }
    if (this.mode === 'bed') return this.leaveBed(p);
    // A finger lands without warning, so anywhere nearby is enough to spook it.
    const reach = mouse ? this.fearRadius : Math.max(this.fearRadius, this.width * 0.45);
    if (d < reach) {
      if (!this.busy) this.ev.face('shock');
      this.dodge(p.x, p.z);
    }
  }

  private leaveBed(p: Pt) {
    this.mode = 'jog';
    this.ev.face('shock');
    const to = this.escapeFrom(p.x, p.z);
    this.startHop(to.x, to.z, 0, this.hopSpeed, () => {
      this.mode = 'jog';
      this.ev.face('tease');
    });
  }

  /** Keyboard players get the same runaround. */
  poke() {
    if (this.mode === 'feint') return this.bolt();
    const w = this.width;
    this.dodge(this.x + rand(-1, 1) * w * 0.1, this.z + rand(-1, 1) * w * 0.1);
  }

  /** A beat of hit-stop when you get your hands on it. */
  freeze() {
    this.cancel();
    this.mode = 'frozen';
    this.running = false;
    this.hop = null;
    this.walk = null;
    this.ev.face('shock');
  }

  /** Slipped out of your hand (the shield): it runs off laughing. */
  slipFrom(p: Pt) {
    this.dodges = 0;
    this.mode = 'jog';
    this.ev.sound('giggle');
    this.flee(p.x, p.z);
    this.after(rand(...JOG_MS), () => this.rhythm());
    this.ev.say('mock');
  }

  // ------------------------------------------------------------ frame

  update(dt: number, ptr: Ptr) {
    this.t += dt;
    if (this.timers.length) {
      const due = this.timers.filter((x) => x.at <= this.t);
      if (due.length) {
        this.timers = this.timers.filter((x) => x.at > this.t && x.gen === this.gen);
        for (const x of due) if (x.gen === this.gen) x.fn();
      } else if (this.timers.some((x) => x.gen !== this.gen)) {
        this.timers = this.timers.filter((x) => x.gen === this.gen);
      }
    }
    switch (this.mode) {
      case 'hop': {
        const h = this.hop!;
        h.t = Math.min(h.dur, h.t + dt);
        const k = h.t / h.dur;
        const e = ease.inOut(k);
        this.x = lerp(h.sx, h.tx, e);
        this.z = lerp(h.sz, h.tz, e);
        this.y = lerp(h.sy, h.ty, e) + Math.sin(Math.PI * k) * h.height;
        if (k >= 1) {
          this.hop = null;
          this.running = false;
          this.y = h.ty;
          this.ev.land();
          this.ev.puff();
          this.ev.sound('pop');
          h.then();
        }
        break;
      }
      case 'jog':
        if (this.jogging) this.jog(dt, ptr);
        else {
          this.running = false;
          this.y = 0;
        }
        break;
      case 'walk': {
        const w = this.walk!;
        const dx = w.tx - this.x;
        const dz = w.tz - this.z;
        const d = Math.hypot(dx, dz);
        const step = w.v * dt * (this.mods.reduced ? 0.5 : 1);
        this.running = d > 0.05;
        if (d <= step) {
          this.x = w.tx;
          this.z = w.tz;
          this.walk = null;
          this.running = false;
          this.y = 0;
          this.mode = 'pause';
          w.then?.();
        } else {
          this.x += (dx / d) * step;
          this.z += (dz / d) * step;
          this.setFacing(dx, dz);
          this.bob += dt * 12;
          this.y = this.mods.reduced ? 0 : Math.abs(Math.sin(this.bob)) * 0.05;
        }
        break;
      }
      case 'bed': {
        const b = this.arena.bed!;
        const was = this.y;
        this.bob += dt * 7;
        this.y = b.h + (this.mods.reduced ? 0 : Math.abs(Math.sin(this.bob)) * 0.55);
        if (!this.mods.reduced && was > b.h + 0.05 && this.y <= b.h + 0.05) this.ev.land();
        if (this.t > this.bedUntil) this.leaveBed(this.lastPtr);
        break;
      }
      default:
        if (this.mode !== 'hidden') this.y = 0;
    }
  }
}

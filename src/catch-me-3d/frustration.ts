/**
 * The frustration meter F (0–100): instead of a timer, the game reads anger
 * from how you play. Pure — time is passed in (ms), so it is easy to test.
 * See docs/catch-me-3d-spec.md §4.
 */

export const F = {
  miss: 6,
  almost: 8,
  slip: 15,
  rage: 4,
  chasePerSec: 0.5,
  /** Cooling per second once you've stopped tapping for QUIET_MS. */
  calmPerSec: 4,
} as const;

/** Stopping yourself cools you down: this long without a tap and F falls. */
export const QUIET_MS = 1500;
/** Two taps this close together are a rage tap… */
export const RAGE_GAP_MS = 250;
/** …and so is tapping this many times faster than your own baseline. */
export const RAGE_RATE_X = 2.5;
/** Window (ms) over which the current tap rate is measured. */
export const RATE_WINDOW_MS = 2000;
/** Taps per second assumed until a player's own baseline is measured. */
export const DEFAULT_BASELINE = 2;

/** "I'm getting angry" in this window earns the noticed-in-time star. */
export const NOTICE_MIN = 45;
export const NOTICE_MAX = 85;
/** Above this the runner is shielded and catches slip out of your hand. */
export const SHIELD_AT = 75;
export const BOIL = 100;

export type Notice = 'early' | 'inTime' | 'late';

export class Frustration {
  f = 0;
  baseline: number;
  private taps: number[] = [];
  private lastTap = -Infinity;
  /** Highest tap rate seen since the last reset — for the mirror line. */
  peakRate = 0;
  /** Reaching 100 sticks until the breath, even if F cools while the timing guards wait. */
  private boiled = false;

  constructor(baseline: number | null = null) {
    this.baseline = baseline && baseline > 0 ? baseline : DEFAULT_BASELINE;
  }

  private add(d: number) {
    this.f = Math.min(BOIL, Math.max(0, this.f + d));
    if (this.f >= BOIL) this.boiled = true;
  }

  /** Taps per second over the last RATE_WINDOW_MS. */
  rate(now: number) {
    const from = now - RATE_WINDOW_MS;
    let n = 0;
    for (const t of this.taps) if (t > from && t <= now) n++;
    return n / (RATE_WINDOW_MS / 1000);
  }

  /** Records a tap; returns whether it was a rage tap (and heats up if so). */
  tap(now: number): boolean {
    const quick = now - this.lastTap < RAGE_GAP_MS;
    this.lastTap = now;
    this.taps.push(now);
    this.taps = this.taps.filter((t) => t > now - RATE_WINDOW_MS);
    const r = this.rate(now);
    this.peakRate = Math.max(this.peakRate, r);
    const rage = quick || r >= this.baseline * RAGE_RATE_X;
    if (rage) this.add(F.rage);
    return rage;
  }

  miss(almost = false) {
    this.add(almost ? F.almost : F.miss);
  }

  slip() {
    this.add(F.slip);
  }

  /** Is the player's finger resting (no taps for QUIET_MS)? */
  quiet(now: number) {
    return now - this.lastTap >= QUIET_MS;
  }

  /** Time passes: chasing and teasing warm you up, a still finger cools you down. */
  update(dt: number, now: number, chasing = true) {
    if (this.f >= BOIL) this.boiled = true;
    if (this.quiet(now)) this.add(-F.calmPerSec * dt);
    else if (chasing) this.add(F.chasePerSec * dt);
  }

  get shield() {
    return this.f > SHIELD_AT;
  }

  get boiling() {
    return this.boiled || this.f >= BOIL;
  }

  /** What pressing "I'm getting angry" right now counts as. */
  notice(): Notice {
    if (this.f < NOTICE_MIN) return 'early';
    return this.f <= NOTICE_MAX ? 'inTime' : 'late';
  }

  /** After a breath the heat is gone; the mirror starts measuring afresh. */
  cool(to = 0) {
    this.f = to;
    this.boiled = false;
    this.peakRate = 0;
    this.taps = [];
  }
}

/**
 * Measures a player's own tapping pace during the first seconds of level 1,
 * so a child who taps a lot isn't read as angry by default.
 */
export const CALIBRATE_MS = 10000;
export const MIN_BASELINE = 1;

export class Calibrator {
  private taps = 0;
  constructor(private start: number) {}
  tap(now: number) {
    if (now - this.start <= CALIBRATE_MS) this.taps++;
  }
  /** The baseline once the window is over (null before, or if too few taps to tell). */
  result(now: number): number | null {
    if (now - this.start < CALIBRATE_MS || this.taps < 3) return null;
    return Math.max(MIN_BASELINE, this.taps / (CALIBRATE_MS / 1000));
  }
}

/** Timing guards for a forced breath (§4 "הגנות עיתוי"). */
export const FIRST_BREATH_MS = 10000;
export const BREATH_GAP_MS = 8000;
export const LIFTED_MS = 250;
export const MAX_WAIT_MS = 1500;

export interface GateState {
  now: number;
  /** When chasing started in this level. */
  chaseStart: number;
  /** When the last breath ended, if any in this level. */
  lastBreathEnd: number | null;
  fingerDown: boolean;
  /** When the finger was last lifted. */
  fingerUpAt: number;
  /** A catch is being celebrated (hit-stop) — never interrupt it. */
  celebrating: boolean;
  boiling: boolean;
}

/** Decides the moment a forced breath may begin once F has boiled over. */
export class BoilGate {
  private pendingSince: number | null = null;

  /** Earliest time the guards allow a forced breath. */
  static allowed(s: GateState) {
    if (!s.boiling || s.celebrating) return false;
    if (s.now - s.chaseStart < FIRST_BREATH_MS) return false;
    if (s.lastBreathEnd !== null && s.now - s.lastBreathEnd < BREATH_GAP_MS) return false;
    return true;
  }

  check(s: GateState): boolean {
    if (!BoilGate.allowed(s)) {
      this.pendingSince = null;
      return false;
    }
    this.pendingSince ??= s.now;
    const lifted = !s.fingerDown && s.now - s.fingerUpAt >= LIFTED_MS;
    if (lifted || s.now - this.pendingSince >= MAX_WAIT_MS) {
      this.pendingSince = null;
      return true;
    }
    return false;
  }
}

/**
 * The shield and its safety net: while shielded, a catch slips out of your
 * hand — but after two slips in a row the next catch always counts.
 */
export const PITY_AFTER = 2;

export class Grip {
  slipsInRow = 0;
  slips = 0;
  resolve(shielded: boolean): 'slip' | 'catch' {
    if (shielded && this.slipsInRow < PITY_AFTER) {
      this.slipsInRow++;
      this.slips++;
      return 'slip';
    }
    this.slipsInRow = 0;
    return 'catch';
  }
}

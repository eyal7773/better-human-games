import { avatarSVG } from '../shared/avatar';
import { profile } from '../shared/profile';
import type { Ctx } from './art/kit';
import { def, visitor, type Visitor } from './catalog';
import { cellsOfPlaced, type IslandState, type Placed } from './economy';
import { footprint, iso, landBounds } from './iso';
import { findPath } from './path';
import { key, type Actor } from './render';

/**
 * Things that move about an island: you (your "My home" character) and the
 * visitors who moved in. Each one walks the grid along A* paths.
 */

type Cell = { x: number; y: number };

/** Where feet can go on an island: land, not under an item, not in water (bridges are fine). */
export function walkMap(s: IslandState, isle: string) {
  const { lo, hi } = landBounds(s.land[isle] ?? 0);
  const blocked = new Set<number>();
  const water = new Set<number>();
  const bridge = new Set<number>();
  for (const p of s.placed) {
    if (p.isle !== isle) continue;
    const d = def(p.id);
    if (!d || d.kind === 'ambient') continue;
    for (const [x, y] of cellsOfPlaced(p, d)) {
      const k = x * 64 + y;
      if (d.kind === 'ground') {
        if (d.water === 'is') water.add(k);
      } else if (d.water === 'on') bridge.add(k);
      else blocked.add(k);
    }
  }
  const inside = (x: number, y: number) => x >= lo && y >= lo && x < hi && y < hi;
  return {
    lo,
    hi,
    walk: (x: number, y: number) => inside(x, y) && !blocked.has(x * 64 + y) && (!water.has(x * 64 + y) || bridge.has(x * 64 + y)),
    swim: (x: number, y: number) => inside(x, y) && water.has(x * 64 + y) && !bridge.has(x * 64 + y),
  };
}
export type WalkMap = ReturnType<typeof walkMap>;

class Walker {
  gx: number;
  gy: number;
  path: Cell[] = [];
  left = false;
  moving = false;
  onArrive: (() => void) | null = null;

  constructor(
    at: Cell,
    public speed: number,
  ) {
    this.gx = at.x + 0.5;
    this.gy = at.y + 0.5;
  }

  get cell(): Cell {
    return { x: Math.floor(this.gx), y: Math.floor(this.gy) };
  }

  go(to: Cell, can: (x: number, y: number) => boolean, then: (() => void) | null = null) {
    const here = this.cell;
    if (here.x === to.x && here.y === to.y) {
      this.path = [];
      this.onArrive = null;
      then?.();
      return true;
    }
    const p = findPath(here, to, can);
    if (!p) return false;
    this.path = p;
    this.onArrive = then;
    return true;
  }

  step(dt: number) {
    const next = this.path[0];
    this.moving = !!next;
    if (!next) return;
    const tx = next.x + 0.5;
    const ty = next.y + 0.5;
    const dx = tx - this.gx;
    const dy = ty - this.gy;
    const d = Math.hypot(dx, dy);
    const s = this.speed * dt;
    // screen x grows with gx − gy: that's which way we face
    if (Math.abs(dx - dy) > 0.01) this.left = dx - dy < 0;
    if (d <= s) {
      this.gx = tx;
      this.gy = ty;
      this.path.shift();
      if (!this.path.length) {
        this.moving = false;
        const f = this.onArrive;
        this.onArrive = null;
        f?.();
      }
    } else {
      this.gx += (dx / d) * s;
      this.gy += (dy / d) * s;
    }
  }
}

// ---------------------------------------------------------------- you

const avatarImg = (() => {
  const img = new Image();
  const shape = profile.status === 'done' ? profile.shape : 0;
  const color = profile.status === 'done' ? profile.color : 4;
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSVG(shape, color).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))}`;
  return img;
})();

export class Me extends Walker {
  /** Sitting on this seat, breathing. */
  seat: Placed | null = null;

  constructor(at: Cell) {
    super(at, 2.6);
  }

  actor(t: number): Actor {
    const seat = this.seat;
    if (seat) {
      const d = def(seat.id)!;
      const f = footprint(d, seat.flip);
      return { gx: seat.x + f.w / 2, gy: seat.y + f.d / 2, lift: 10, depth: key(seat) + 0.01, draw: (c) => this.paint(c, t, true) };
    }
    return { gx: this.gx, gy: this.gy, draw: (c) => this.paint(c, t, false) };
  }

  private paint(c: Ctx, t: number, sitting: boolean) {
    const bob = this.moving ? Math.abs(Math.sin(t * 11)) * 3 : sitting ? 0 : Math.sin(t * 2) * 0.6;
    const sq = this.moving ? 1 + Math.sin(t * 22) * 0.04 : 1;
    c.fillStyle = 'rgba(30,50,40,.22)';
    c.beginPath();
    c.ellipse(0, 0, 10, 4.5, 0, 0, Math.PI * 2);
    c.fill();
    if (!avatarImg.complete) return;
    c.save();
    if (this.left) c.scale(-1, 1);
    c.scale(1 / sq, sq);
    c.drawImage(avatarImg, -17, -33 - bob, 34, 34);
    c.restore();
  }
}

/** A free cell near the middle to stand on. */
export function startCell(m: WalkMap): Cell {
  const mid = Math.floor((m.lo + m.hi) / 2);
  for (let r = 0; r < 8; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && m.walk(mid + dx, mid + dy)) return { x: mid + dx, y: mid + dy };
  return { x: mid, y: mid };
}

/** The walkable cell next to an item that's nearest to `from`. */
export function besideItem(p: Placed, m: WalkMap, from: Cell): Cell | null {
  const d = def(p.id)!;
  const cells = cellsOfPlaced(p, d);
  const ring: Cell[] = [];
  for (const [x, y] of cells)
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const c = { x: x + dx, y: y + dy };
        if (m.walk(c.x, c.y) && !ring.some((r) => r.x === c.x && r.y === c.y)) ring.push(c);
      }
  ring.sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y));
  return ring[0] ?? null;
}

// ---------------------------------------------------------------- visitors

export class Guest extends Walker {
  private wait = 1 + Math.random() * 3;
  readonly v: Visitor;

  constructor(
    id: string,
    at: Cell,
    private seed: number,
  ) {
    const v = visitor(id)!;
    super(at, v.gait === 'walk' && id === 'turtle' ? 0.5 : v.gait === 'hop' ? 1.6 : 1.1);
    this.v = v;
  }

  update(dt: number, m: WalkMap) {
    this.step(dt);
    if (this.moving || this.v.gait === 'perch' || this.v.gait === 'sea') return;
    this.wait -= dt;
    if (this.wait > 0) return;
    this.wait = 3 + Math.random() * 5;
    const can = this.v.gait === 'swim' && m.swim(this.cell.x, this.cell.y) ? m.swim : m.walk;
    // wander a few cells, somewhere it can actually go
    for (let i = 0; i < 8; i++) {
      const to = { x: this.cell.x + Math.round((Math.random() - 0.5) * 6), y: this.cell.y + Math.round((Math.random() - 0.5) * 6) };
      if (can(to.x, to.y) && this.go(to, can)) return;
    }
  }

  actor(t: number, s: IslandState, isle: string): Actor {
    const draw = (c: Ctx) => {
      if (this.left) c.scale(-1, 1);
      this.v.draw(c, t + this.seed, this.moving);
    };
    if (this.v.gait === 'sea') {
      const { lo, hi } = landBounds(s.land[isle] ?? 0);
      return { gx: hi + 2.5, gy: lo + 1.5, sea: true, draw: (c) => this.v.draw(c, t + this.seed, false) };
    }
    if (this.v.gait === 'perch') {
      const perch = s.placed.find((p) => p.isle === isle && p.id === this.v.perch);
      if (perch) {
        const d = def(perch.id)!;
        const f = footprint(d, perch.flip);
        return { gx: perch.x + f.w / 2 + 0.3, gy: perch.y + f.d / 2 + 0.3, lift: d.h * 0.62, depth: key(perch) + 0.01, draw };
      }
    }
    return { gx: this.gx, gy: this.gy, draw };
  }
}

/** Puts a guest on a free cell, near where it belongs. */
export function placeGuest(id: string, m: WalkMap, seed: number) {
  const v = visitor(id)!;
  const cells: Cell[] = [];
  for (let x = m.lo; x < m.hi; x++) for (let y = m.lo; y < m.hi; y++) if ((v.gait === 'swim' ? m.swim : m.walk)(x, y)) cells.push({ x, y });
  const pool = cells.length ? cells : [startCell(m)];
  return new Guest(id, pool[Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * pool.length)], seed);
}

export const anchorOf = (p: Placed) => {
  const d = def(p.id)!;
  const f = footprint(d, p.flip);
  return iso(p.x + f.w / 2, p.y + f.d / 2);
};

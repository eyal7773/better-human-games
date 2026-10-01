import { lerp } from '../shared/dom';
import { CLIFF } from './art/garden';
import { blob, diamond, hash, type Ctx } from './art/kit';
import { def, type ItemDef } from './catalog';
import { at, cellsOfPlaced, type IslandState, type Placed } from './economy';
import { anchor, depth, footprint, iso, landBounds, TH, TW, unIso } from './iso';

/**
 * Paints one island: sky and sea for the time of day, the land block with its
 * cliff, ground tiles, items back to front, and at night a darkness layer with
 * holes where the lights are. World units throughout; the camera maps them to
 * the canvas.
 */

// ---------------------------------------------------------------- time of day

type RGB = [number, number, number];
const hex = (s: string): RGB => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(lerp(v, b[i], t))) as RGB;
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export interface Daylight {
  /** 0 = full day, 1 = deep night. */
  dark: number;
  /** Sunrise / sunset glow, 0–1. */
  warm: number;
}

const ramp = (h: number, a: number, b: number) => Math.min(1, Math.max(0, (h - a) / (b - a)));

/** Light for an hour of the day (0–24, fractional). */
export function daylight(hour: number): Daylight {
  const h = ((hour % 24) + 24) % 24;
  if (h < 5 || h >= 20.5) return { dark: 1, warm: 0 };
  if (h < 7) return { dark: 1 - ramp(h, 5, 7), warm: 1 - Math.abs(h - 6.2) / 1.2 };
  if (h < 17.5) return { dark: 0, warm: 0 };
  if (h < 19) return { dark: ramp(h, 17.5, 19) * 0.3, warm: ramp(h, 17.5, 19) };
  return { dark: 0.3 + ramp(h, 19, 20.5) * 0.7, warm: 1 - ramp(h, 19, 20.5) };
}

const SKY = {
  day: [hex('#7cc8f0'), hex('#d8f0f4')],
  warm: [hex('#f49a7c'), hex('#ffd58f')],
  night: [hex('#1d2a6e'), hex('#4b4fa0')],
};
const SEA = {
  day: [hex('#5fc4c8'), hex('#2b7f9a')],
  warm: [hex('#e7a184'), hex('#4f7393')],
  night: [hex('#2c3f86'), hex('#18245c')],
};

function tones(set: typeof SKY, d: Daylight): [RGB, RGB] {
  const a = mix(set.day[0], set.warm[0], d.warm * 0.85);
  const b = mix(set.day[1], set.warm[1], d.warm * 0.85);
  return [mix(a, set.night[0], d.dark), mix(b, set.night[1], d.dark)];
}

/** The sea's top and bottom colours for this light (for the map). */
export const seaTones = (d: Daylight) => tones(SEA, d).map((c) => css(c));

// ---------------------------------------------------------------- island looks

interface Palette {
  grass: [number[], number[]];
  soil: string;
  overhang: string;
  tuft: string;
  lit: [string, string];
  dim: [string, string];
}

const PALETTES: Record<string, Palette> = {
  garden: { grass: [[134, 192, 110], [126, 184, 104]], soil: '#5d8a3e', overhang: '#6fa64e', tuft: 'rgba(70,120,60,.55)', lit: ['#b98a64', '#7d5640'], dim: ['#8c6248', '#583a2c'] },
  shore: { grass: [[240, 220, 166], [233, 211, 154]], soil: '#d9b878', overhang: '#e6c98c', tuft: 'rgba(170,140,90,.45)', lit: ['#e0b27a', '#b98452'], dim: ['#b48452', '#7e5a38'] },
  hill: { grass: [[160, 212, 118], [150, 204, 108]], soil: '#6c9e44', overhang: '#86bb56', tuft: 'rgba(80,130,60,.55)', lit: ['#c49a72', '#8a6648'], dim: ['#9a7254', '#634632'] },
  forest: { grass: [[86, 132, 90], [80, 124, 84]], soil: '#3e6640', overhang: '#4d7a4c', tuft: 'rgba(40,70,45,.6)', lit: ['#8a7464', '#5a4a40'], dim: ['#665446', '#3e322a'] },
};
export const paletteOf = (isle: string) => PALETTES[isle] ?? PALETTES.garden;

// ---------------------------------------------------------------- the scene

export interface Ghost {
  def: ItemDef;
  cells: { x: number; y: number }[];
  /** For items: where it stands. */
  x: number;
  y: number;
  flip: boolean;
  ok: boolean;
  /** Many cells laid by dragging (paths, fences). */
  brush?: boolean;
}

export interface View {
  state: IslandState;
  /** Bumped whenever the island changes, so the cached land layer is redrawn. */
  rev: number;
  isle: string;
  growth: number;
  daylight: Daylight;
  build: boolean;
  ghost?: Ghost | null;
  selected?: Placed | null;
  /** Placed items popping in: time placed (performance.now). */
  born: Map<Placed, number>;
  /** Items wobbling from a tap. */
  poke: Map<Placed, number>;
  /** Things that move about: you and the visitors, in continuous grid coordinates. */
  actors?: Actor[];
  /** Breathing with the island: 0 → 1 → 0 over a breath, or undefined. */
  breath?: number;
}

export interface Actor {
  gx: number;
  gy: number;
  /** Height above the ground (a perch, a seat). */
  lift?: number;
  /** Draws them standing at (0, 0). */
  draw: (c: Ctx, t: number) => void;
  /** Out at sea: drawn with the water, not on the island. */
  sea?: boolean;
  /** Painter's-order override: sitting on or perched on an item draws just after it. */
  depth?: number;
}

export function stageOf(d: ItemDef, p: Placed, growth: number) {
  if (!d.stages) return 3;
  const per = d.stages > 4 ? 3 : 2;
  return Math.min(d.stages, 1 + Math.floor(Math.max(0, growth - p.at) / per));
}

export class Scene {
  readonly ctx: CanvasRenderingContext2D;
  private lights = document.createElement('canvas');
  private lctx = this.lights.getContext('2d')!;
  private layer = document.createElement('canvas');
  private layerCtx = this.layer.getContext('2d')!;
  private layerKey = '';
  private used = new Set<number>();
  private sprites = new Map<string, HTMLCanvasElement>();
  w = 0;
  h = 0;
  dpr = 1;
  /** World point at the middle of the view, and pixels per world unit. */
  cam = { x: 0, y: 0, zoom: 1 };

  constructor(readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(w = this.canvas.clientWidth, h = this.canvas.clientHeight, dpr = Math.min(2, devicePixelRatio || 1)) {
    this.dpr = dpr;
    this.w = w;
    this.h = h;
    for (const cv of [this.canvas, this.layer]) {
      cv.width = Math.round(this.w * this.dpr);
      cv.height = Math.round(this.h * this.dpr);
    }
    // the night layer is soft, so half resolution is plenty
    this.lights.width = Math.round(this.w / 2);
    this.lights.height = Math.round(this.h / 2);
    this.layerKey = '';
    this.sprites.clear();
  }

  /** Frames the land (plus room for the cliff) inside the free part of the view. */
  fit(expansions: number, insetTop: number, insetBottom: number) {
    const { lo, hi } = landBounds(expansions);
    const left = iso(lo, hi).x;
    const right = iso(hi, lo).x;
    const top = iso(lo, lo).y - 70;
    const bottom = iso(hi, hi).y + CLIFF + 26;
    const availH = Math.max(120, this.h - insetTop - insetBottom);
    const zoom = Math.min((this.w * 0.94) / (right - left), availH / (bottom - top), 2.4);
    this.cam.zoom = zoom;
    this.cam.x = (left + right) / 2;
    // centre of the free area, in screen space, mapped back to the world
    const midScreen = insetTop + availH / 2;
    this.cam.y = (top + bottom) / 2 - (midScreen - this.h / 2) / zoom;
  }

  toScreen(x: number, y: number) {
    return { x: (x - this.cam.x) * this.cam.zoom + this.w / 2, y: (y - this.cam.y) * this.cam.zoom + this.h / 2 };
  }

  toWorld(sx: number, sy: number) {
    return { x: (sx - this.w / 2) / this.cam.zoom + this.cam.x, y: (sy - this.h / 2) / this.cam.zoom + this.cam.y };
  }

  /** The grid cell under a screen point. */
  cellAt(sx: number, sy: number) {
    const p = this.toWorld(sx, sy);
    const g = unIso(p.x, p.y);
    return { x: Math.floor(g.gx), y: Math.floor(g.gy) };
  }

  /** The placed item drawn at a screen point (front-most first), else the ground tile. */
  hit(v: View, sx: number, sy: number): Placed | null {
    const p = this.toWorld(sx, sy);
    const items = sortedItems(v).reverse();
    for (const q of items) {
      const d = def(q.id)!;
      const f = footprint(d, q.flip);
      const a = anchor(q.x, q.y, f.w, f.d);
      const hw = ((f.w + f.d) * TW) / 4;
      if (p.x > a.x - hw && p.x < a.x + hw && p.y > a.y - d.h - 6 && p.y < a.y + ((f.w + f.d) * TH) / 4) return q;
    }
    const c = this.cellAt(sx, sy);
    return at(v.state, def, v.isle, c.x, c.y).ground ?? null;
  }

  /** `backdrop: false` leaves sky and sea out (and the night layer), for pictures of an island alone. */
  draw(v: View, t: number, backdrop = true) {
    const c = this.ctx;
    const { dpr } = this;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const horizonWorld = iso(0, 0).y + 40;
    const horizon = Math.max(this.h * 0.12, Math.min(this.h * 0.5, this.toScreen(0, horizonWorld).y));
    if (backdrop) {
      this.sky(c, horizon, v.daylight, t);
      this.sea(c, horizon, v.daylight, t);
    } else c.clearRect(0, 0, this.w, this.h);

    const z = this.cam.zoom;
    const world = (k: CanvasRenderingContext2D) => k.setTransform(dpr * z, 0, 0, dpr * z, dpr * (this.w / 2 - this.cam.x * z), dpr * (this.h / 2 - this.cam.y * z));
    const exp = v.state.land[v.isle] ?? 0;
    world(c);
    this.shore(c, exp, t);
    if (v.state.placed.some((p) => p.id === 'dolphins' && p.isle === v.isle)) this.dolphins(c, exp, t);
    for (const a of v.actors ?? []) {
      if (!a.sea) continue;
      const p = iso(a.gx, a.gy);
      c.save();
      c.translate(p.x, p.y);
      a.draw(c, t);
      c.restore();
    }
    // The land block, ground tiles and grid only change with the island or the
    // camera: paint them once into a layer and reuse it every frame.
    const g = v.ghost?.def.kind === 'ground' ? v.ghost.cells.map((q) => `${q.x},${q.y}`).join(';') + v.ghost.ok : '';
    const key = `${v.isle}|${v.rev}|${exp}|${z}|${this.cam.x}|${this.cam.y}|${this.w}|${this.h}|${v.build}|${g}`;
    if (key !== this.layerKey) {
      this.layerKey = key;
      const k = this.layerCtx;
      k.setTransform(1, 0, 0, 1, 0, 0);
      k.clearRect(0, 0, this.layer.width, this.layer.height);
      world(k);
      this.land(k, exp, paletteOf(v.isle));
      this.ground(k, v);
      if (v.build) this.gridLines(k, exp);
      this.used = occupied(v);
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.layer, 0, 0);
    world(c);
    this.tufts(c, exp, t, paletteOf(v.isle));
    this.shimmer(c, v, t);
    if (v.build) this.marks(c, v, t);
    this.items(c, v, t);
    const has = (id: string) => v.state.placed.some((p) => p.id === id && p.isle === v.isle);
    if (has('fireflies')) this.fireflies(c, exp, t, v.daylight.dark, [255, 245, 160]);
    if (has('bluefireflies')) this.fireflies(c, exp, t + 40, Math.max(0.6, v.daylight.dark), [150, 220, 255]);
    if (has('birds')) this.birds(c, exp, t);
    if (v.breath != null) this.breathGlow(c, exp, v.breath);

    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (backdrop) this.night(c, v, t, horizon);
  }

  // ------------------------------------------------------------ backdrop

  private sky(c: Ctx, horizon: number, d: Daylight, t: number) {
    const [top, bottom] = tones(SKY, d);
    const g = c.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, css(top));
    g.addColorStop(1, css(bottom));
    c.fillStyle = g;
    c.fillRect(0, 0, this.w, horizon + 1);
    // sun by day, low and big at sunset
    if (d.dark < 0.9) {
      const sx = this.w * 0.22;
      const sy = lerp(horizon * 0.35, horizon - 10, d.warm);
      const sg = c.createRadialGradient(sx, sy, 4, sx, sy, 80);
      sg.addColorStop(0, `rgba(255, 246, 220, ${1 - d.dark})`);
      sg.addColorStop(0.3, `rgba(255, 226, 170, ${0.7 * (1 - d.dark)})`);
      sg.addColorStop(1, 'rgba(255, 226, 170, 0)');
      c.fillStyle = sg;
      c.fillRect(0, 0, this.w, horizon);
    }
    // clouds
    for (let i = 0; i < 4; i++) {
      const x = ((t * (5 + i * 2.5) + i * 170) % (this.w + 220)) - 110;
      const y = horizon * (0.15 + i * 0.16);
      const a = 0.55 * (1 - d.dark * 0.85);
      for (const [dx, dy, r] of [
        [0, 0, 16],
        [18, -8, 21],
        [40, 0, 15],
        [22, 4, 14],
      ])
        blob(c, x + dx, y + dy, r, d.warm > 0.3 ? `rgba(255,214,200,${a})` : `rgba(255,255,255,${a})`);
    }
    // distant hills
    c.fillStyle = css(mix(hex('#78aaaa'), hex('#28306a'), d.dark), 0.6);
    c.beginPath();
    c.moveTo(0, horizon);
    for (let x = 0; x <= this.w; x += 16) c.lineTo(x, horizon - 14 - Math.sin(x / 70) * 10 - Math.sin(x / 23) * 3);
    c.lineTo(this.w, horizon);
    c.fill();
  }

  private sea(c: Ctx, horizon: number, d: Daylight, t: number) {
    const [top, bottom] = tones(SEA, d);
    const g = c.createLinearGradient(0, horizon, 0, this.h);
    g.addColorStop(0, css(top));
    g.addColorStop(1, css(bottom));
    c.fillStyle = g;
    c.fillRect(0, horizon, this.w, this.h - horizon);
    c.strokeStyle = 'rgba(255,255,255,.28)';
    c.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) {
      const y = horizon + 6 + i * i * 2.4;
      if (y > this.h) break;
      const off = (t * (7 + i) + i * 57) % 130;
      c.beginPath();
      for (let x = -off; x < this.w; x += 130) {
        c.moveTo(x, y);
        c.lineTo(x + 24 + i * 2, y);
      }
      c.stroke();
    }
  }

  // ------------------------------------------------------------ the land block

  /** Reflection and foam in the sea around the island. */
  private shore(c: Ctx, exp: number, t: number) {
    const { lo, hi } = landBounds(exp);
    const R = iso(hi, lo);
    const F = iso(hi, hi);
    const L = iso(lo, hi);

    // reflection and foam in the sea
    c.save();
    c.globalAlpha = 0.16;
    c.fillStyle = '#1d4d50';
    c.beginPath();
    c.moveTo(L.x, L.y + CLIFF);
    c.lineTo(F.x, F.y + CLIFF);
    c.lineTo(R.x, R.y + CLIFF);
    c.lineTo(F.x, F.y + CLIFF * 2.2);
    c.closePath();
    c.fill();
    c.restore();
    const foam = 0.5 + Math.sin(t * 1.4) * 0.2;
    c.strokeStyle = `rgba(255,255,255,${foam})`;
    c.lineWidth = 5;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(L.x - 6, L.y + CLIFF + 2);
    c.lineTo(F.x, F.y + CLIFF + 6 + Math.sin(t * 1.4) * 1.5);
    c.lineTo(R.x + 6, R.y + CLIFF + 2);
    c.stroke();
  }

  private land(c: Ctx, exp: number, pal: Palette) {
    const { lo, hi } = landBounds(exp);
    const B = iso(lo, lo);
    const R = iso(hi, lo);
    const F = iso(hi, hi);
    const L = iso(lo, hi);

    // cliff faces: lit on the left, shaded on the right, with rock strata
    const face = (a: { x: number; y: number }, b: { x: number; y: number }, lit: boolean) => {
      const g = c.createLinearGradient(0, Math.min(a.y, b.y), 0, Math.max(a.y, b.y) + CLIFF);
      g.addColorStop(0, lit ? pal.lit[0] : pal.dim[0]);
      g.addColorStop(1, lit ? pal.lit[1] : pal.dim[1]);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.lineTo(b.x, b.y + CLIFF);
      c.lineTo(a.x, a.y + CLIFF);
      c.closePath();
      c.fill();
      c.strokeStyle = lit ? 'rgba(70,40,25,.22)' : 'rgba(30,15,10,.25)';
      c.lineWidth = 2;
      for (let i = 1; i <= 3; i++) {
        const z = (CLIFF * i) / 4 + Math.sin(i * 2.3) * 3;
        c.beginPath();
        c.moveTo(a.x, a.y + z);
        const n = 10;
        for (let k = 1; k <= n; k++) c.lineTo(lerp(a.x, b.x, k / n), lerp(a.y, b.y, k / n) + z + Math.sin(k * 1.9 + i) * 2);
        c.stroke();
      }
      // a few pebbles in the rock
      for (let k = 0; k < 9; k++) {
        const u = hash(k, lit ? 1 : 2, exp);
        const vv = hash(k, lit ? 3 : 4, exp);
        blob(c, lerp(a.x, b.x, u), lerp(a.y, b.y, u) + 8 + vv * (CLIFF - 16), 2 + vv * 2, lit ? 'rgba(220,190,160,.35)' : 'rgba(150,110,90,.35)');
      }
    };
    face(L, F, true);
    face(F, R, false);
    // a band of soil under the grass
    c.fillStyle = pal.soil;
    c.beginPath();
    c.moveTo(L.x, L.y);
    c.lineTo(F.x, F.y);
    c.lineTo(R.x, R.y);
    c.lineTo(R.x, R.y + 7);
    c.lineTo(F.x, F.y + 7);
    c.lineTo(L.x, L.y + 7);
    c.closePath();
    c.fill();
    // grass hanging over the edge
    c.fillStyle = pal.overhang;
    for (let k = 0; k < 24; k++) {
      const u = (k + 0.5) / 24;
      const [a, b] = k < 12 ? [L, F] : [F, R];
      const uu = k < 12 ? u * 2 : (u - 0.5) * 2;
      const x = lerp(a.x, b.x, uu);
      const y = lerp(a.y, b.y, uu);
      c.beginPath();
      c.moveTo(x - 5, y + 6);
      c.lineTo(x, y + 10 + hash(k, exp) * 6);
      c.lineTo(x + 5, y + 6);
      c.fill();
    }

    // grass top, a soft checker so the cells read without lines
    for (let x = lo; x < hi; x++)
      for (let y = lo; y < hi; y++) {
        const p = iso(x + 0.5, y + 0.5);
        const n = hash(x, y);
        const base = (x + y) % 2 ? pal.grass[0] : pal.grass[1];
        const k = (n - 0.5) * 10;
        diamond(c, p.x, p.y, 1.02, `rgb(${base[0] + k},${base[1] + k},${base[2] + k * 0.6})`);
      }
    // light from the upper left across the lawn
    const sheen = c.createLinearGradient(B.x - (R.x - B.x), B.y, F.x, F.y);
    sheen.addColorStop(0, 'rgba(255,255,220,.16)');
    sheen.addColorStop(1, 'rgba(40,70,40,.1)');
    c.fillStyle = sheen;
    c.beginPath();
    c.moveTo(B.x, B.y);
    c.lineTo(R.x, R.y);
    c.lineTo(F.x, F.y);
    c.lineTo(L.x, L.y);
    c.closePath();
    c.fill();
  }

  /** Grass tufts swaying on empty cells. */
  private tufts(c: Ctx, exp: number, t: number, pal: Palette) {
    const { lo, hi } = landBounds(exp);
    c.strokeStyle = pal.tuft;
    c.lineWidth = 1.2;
    c.beginPath();
    for (let x = lo; x < hi; x++)
      for (let y = lo; y < hi; y++) {
        if (hash(x, y, 7) > 0.35 || this.used.has(x * 64 + y)) continue;
        const p = iso(x + 0.3 + hash(x, y, 8) * 0.4, y + 0.3 + hash(x, y, 9) * 0.4);
        const sw = Math.sin(t * 1.5 + x + y) * 0.8;
        c.moveTo(p.x - 3, p.y);
        c.lineTo(p.x - 4 + sw, p.y - 6);
        c.moveTo(p.x, p.y);
        c.lineTo(p.x + sw, p.y - 8);
        c.moveTo(p.x + 3, p.y);
        c.lineTo(p.x + 4 + sw, p.y - 5);
      }
    c.stroke();
  }

  // ------------------------------------------------------------ ground tiles

  private ground(c: Ctx, v: View) {
    const tiles = v.state.placed.filter((p) => p.isle === v.isle && def(p.id)?.kind === 'ground');
    const ghostCells = v.ghost?.def.kind === 'ground' && v.ghost.ok ? v.ghost.cells : [];
    const kindAt = new Map<string, string>();
    for (const p of tiles) kindAt.set(`${p.x},${p.y}`, p.id);
    for (const g of ghostCells) kindAt.set(`${g.x},${g.y}`, v.ghost!.def.id);
    for (const [key, id] of kindAt) {
      const [x, y] = key.split(',').map(Number);
      const same = (dx: number, dy: number) => kindAt.get(`${x + dx},${y + dy}`) === id;
      const p = iso(x + 0.5, y + 0.5);
      const corners = [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)];
      // edges: −y (top→right), +x (right→bottom), +y (bottom→left), −x (left→top)
      const edges: [boolean, number, number][] = [
        [same(0, -1), 0, 1],
        [same(1, 0), 1, 2],
        [same(0, 1), 2, 3],
        [same(-1, 0), 3, 0],
      ];
      const ghosted = ghostCells.some((g) => g.x === x && g.y === y);
      c.save();
      if (ghosted) c.globalAlpha = 0.75;
      if (id === 'stream') {
        const g = c.createLinearGradient(p.x, p.y - TH / 2, p.x, p.y + TH / 2);
        g.addColorStop(0, '#3a9fb4');
        g.addColorStop(1, '#68cdd6');
        diamond(c, p.x, p.y, 1.01, g);
        // banks where the water meets grass
        c.strokeStyle = '#4e8a4a';
        c.lineWidth = 3;
        for (const [joined, a, b] of edges) {
          if (joined) continue;
          c.beginPath();
          c.moveTo(corners[a].x, corners[a].y);
          c.lineTo(corners[b].x, corners[b].y);
          c.stroke();
        }
      } else if (id === 'pier') {
        diamond(c, p.x, p.y, 1.01, '#c9935e');
        c.strokeStyle = 'rgba(110,70,40,.55)';
        c.lineWidth = 1.2;
        for (let k = 1; k < 4; k++) {
          const a = iso(x + k / 4, y);
          const b = iso(x + k / 4, y + 1);
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
        for (const [joined, a, b] of edges) {
          if (joined) continue;
          c.beginPath();
          c.moveTo(corners[a].x, corners[a].y);
          c.lineTo(corners[b].x, corners[b].y);
          c.stroke();
        }
      } else if (id === 'leafpath') {
        diamond(c, p.x, p.y, 1.01, '#8a6a42');
        for (let k = 0; k < 7; k++) {
          const sp = iso(x + 0.15 + hash(x, y, k) * 0.7, y + 0.15 + hash(y, x, k + 9) * 0.7);
          c.fillStyle = ['#d9822b', '#c4562a', '#e6b03a'][k % 3];
          c.beginPath();
          c.ellipse(sp.x, sp.y, 4, 2, hash(k, x, y) * 3, 0, Math.PI * 2);
          c.fill();
        }
      } else {
        diamond(c, p.x, p.y, 1.01, '#e3cfa5');
        for (let k = 0; k < 4; k++) {
          const u = hash(x, y, k);
          const w = hash(y, x, k + 4);
          const sp = iso(x + 0.2 + u * 0.6, y + 0.2 + w * 0.6);
          c.fillStyle = k % 2 ? '#cdb68c' : '#d8c39a';
          c.beginPath();
          c.ellipse(sp.x, sp.y, 6, 3, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = 'rgba(150,120,80,.5)';
        c.lineWidth = 1.5;
        for (const [joined, a, b] of edges) {
          if (joined) continue;
          c.beginPath();
          c.moveTo(corners[a].x, corners[a].y);
          c.lineTo(corners[b].x, corners[b].y);
          c.stroke();
        }
      }
      c.restore();
    }
  }

  private gridLines(c: Ctx, exp: number) {
    const { lo, hi } = landBounds(exp);
    c.strokeStyle = 'rgba(255,255,255,.35)';
    c.lineWidth = 1;
    c.beginPath();
    for (let i = lo; i <= hi; i++) {
      const a = iso(i, lo);
      const b = iso(i, hi);
      const d = iso(lo, i);
      const e = iso(hi, i);
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.moveTo(d.x, d.y);
      c.lineTo(e.x, e.y);
    }
    c.stroke();
  }

  /** Light glinting on the streams. */
  private shimmer(c: Ctx, v: View, t: number) {
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.lineWidth = 1.2;
    c.beginPath();
    for (const q of v.state.placed) {
      if (q.id !== 'stream' || q.isle !== v.isle) continue;
      const p = iso(q.x + 0.5, q.y + 0.5);
      const s = (t * 0.6 + hash(q.x, q.y)) % 1;
      c.moveTo(p.x - 10 + s * 8, p.y - 3 + s * 4);
      c.lineTo(p.x - 2 + s * 8, p.y + 1 + s * 4);
    }
    c.stroke();
  }

  /** The footprint the ghost or the selection covers. */
  private marks(c: Ctx, v: View, t: number) {
    const mark = (cells: { x: number; y: number }[], color: string) => {
      for (const cell of cells) {
        const p = iso(cell.x + 0.5, cell.y + 0.5);
        diamond(c, p.x, p.y, 0.96, color);
      }
    };
    if (v.ghost && v.ghost.def.kind !== 'ground') mark(v.ghost.cells, v.ghost.ok ? 'rgba(120, 230, 140, .55)' : 'rgba(255, 110, 100, .55)');
    if (v.ghost && v.ghost.def.kind === 'ground' && !v.ghost.ok) mark(v.ghost.cells, 'rgba(255, 110, 100, .55)');
    if (v.selected) {
      const d = def(v.selected.id)!;
      const a = 0.35 + Math.sin(t * 6) * 0.15;
      mark(
        cellsOfPlaced(v.selected, d).map(([x, y]) => ({ x, y })),
        `rgba(255, 214, 80, ${a})`,
      );
    }
  }

  // ------------------------------------------------------------ items

  private items(c: Ctx, v: View, t: number) {
    const list: { p: Placed; ghost?: boolean }[] = sortedItems(v).map((p) => ({ p }));
    const g = v.ghost;
    if (g && g.def.kind === 'item') {
      const at = g.brush ? g.cells : [{ x: g.x, y: g.y }];
      for (const q of at) list.push({ p: { id: g.def.id, isle: v.isle, x: q.x, y: q.y, flip: g.flip, at: v.growth }, ghost: true });
      list.sort((a, b) => key(a.p) - key(b.p));
    }
    const now = performance.now();
    const { hi } = landBounds(v.state.land[v.isle] ?? 0);
    // you and the visitors join the painter's order by where they stand
    const order = (a: Actor) => a.depth ?? a.gx + a.gy + 0.5;
    const actors = (v.actors ?? []).filter((a) => !a.sea).sort((a, b) => order(a) - order(b));
    let ai = 0;
    const actorsUpTo = (k: number) => {
      while (ai < actors.length && order(actors[ai]) <= k) {
        const a = actors[ai++];
        const pt = iso(a.gx, a.gy);
        c.save();
        c.translate(pt.x, pt.y - (a.lift ?? 0));
        a.draw(c, t);
        c.restore();
      }
    };
    for (const { p, ghost } of list) {
      actorsUpTo(key(p));
      const d = def(p.id)!;
      if (!d.draw) continue;
      const f = footprint(d, p.flip);
      const a = anchor(p.x, p.y, f.w, f.d);
      let sx = 1;
      let sy = 1;
      const b = v.born.get(p);
      if (b != null) {
        const k = Math.min(1, (now - b) / 650);
        const s = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.3 - (1 - k) * 0.7 : 1;
        sx = sy = Math.max(0.05, s);
        if (k >= 1) v.born.delete(p);
      }
      const pk = v.poke.get(p);
      if (pk != null) {
        const k = (now - pk) / 500;
        if (k >= 1) v.poke.delete(p);
        else {
          sy *= 1 + Math.sin(k * Math.PI * 3) * 0.08 * (1 - k);
          sx *= 1 - Math.sin(k * Math.PI * 3) * 0.05 * (1 - k);
        }
      }
      let extra = 0;
      if (d.id === 'waterfall') {
        // Pours over the +x edge (1) or the +y edge (2). A flipped drawing is
        // mirrored, so its own "+x" runs along the world's +y.
        const side = p.x + f.w === hi ? 1 : 2;
        extra = p.flip ? 3 - side : side;
      }
      if (d.id === 'fence') extra = fenceLinks(v, p);
      if (d.still && !ghost && sx === 1 && sy === 1) {
        this.sprite(c, d, p, a, extra);
        continue;
      }
      c.save();
      c.translate(a.x, a.y);
      if (ghost) c.globalAlpha = g!.ok ? 0.8 : 0.45;
      c.scale(sx * (p.flip ? -1 : 1), sy);
      d.draw(c, t, stageOf(d, p, v.growth), seedOf(p), extra);
      c.restore();
    }
    actorsUpTo(Infinity);
  }

  /** Draws a still item from a cached picture made at the current zoom. */
  private sprite(c: Ctx, d: ItemDef, p: Placed, a: { x: number; y: number }, extra: number) {
    const f = footprint(d, p.flip);
    const half = ((f.w + f.d) * TW) / 4 + 24;
    const up = d.h + 30;
    const down = ((f.w + f.d) * TH) / 4 + 16;
    const scale = this.cam.zoom * this.dpr;
    const key = `${d.id}|${p.flip}|${extra}|${scale.toFixed(3)}`;
    let sp = this.sprites.get(key);
    if (!sp) {
      if (this.sprites.size > 200) this.sprites.clear();
      sp = document.createElement('canvas');
      sp.width = Math.ceil(half * 2 * scale);
      sp.height = Math.ceil((up + down) * scale);
      const k = sp.getContext('2d')!;
      k.setTransform(scale * (p.flip ? -1 : 1), 0, 0, scale, half * scale, up * scale);
      d.draw!(k, 0, 3, 0, extra);
      this.sprites.set(key, sp);
    }
    c.drawImage(sp, a.x - half, a.y - up, (sp.width / scale), (sp.height / scale));
  }

  /** Dolphins leaping in arcs out at sea, in front of the island. */
  private dolphins(c: Ctx, exp: number, t: number) {
    const { hi } = landBounds(exp);
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.22 + i / 3) % 1;
      if (k > 0.35) continue;
      const j = k / 0.35;
      const base = iso(hi + 2.2 + i * 0.6, hi - 3 + i * 3);
      const x = base.x - 30 + j * 60;
      const y = base.y + 40 - Math.sin(j * Math.PI) * 34;
      c.save();
      c.translate(x, y);
      c.rotate((j - 0.5) * 1.6);
      c.fillStyle = '#6a8ab0';
      c.beginPath();
      c.ellipse(0, 0, 13, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#c9d8e8';
      c.beginPath();
      c.ellipse(1, 2, 9, 2.2, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#6a8ab0';
      c.beginPath();
      c.moveTo(-2, -4);
      c.lineTo(2, -10);
      c.lineTo(5, -4);
      c.moveTo(-12, 0);
      c.lineTo(-18, -5);
      c.lineTo(-18, 5);
      c.fill();
      c.restore();
      if (j < 0.12 || j > 0.88) blob(c, x, base.y + 42, 5, 'rgba(255,255,255,.7)');
    }
  }

  /** A loose flock crossing high over the island. */
  private birds(c: Ctx, exp: number, t: number) {
    const { lo, hi } = landBounds(exp);
    const left = iso(lo, hi).x - 120;
    const right = iso(hi, lo).x + 120;
    const top = iso(lo, lo).y - 140;
    c.strokeStyle = 'rgba(40,40,60,.7)';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.035 + i * 0.03) % 1;
      const x = left + (right - left) * k + (i % 2) * 14;
      const y = top + Math.sin(k * 6 + i) * 10 + i * 9;
      const f = Math.sin(t * 7 + i) * 4;
      c.beginPath();
      c.moveTo(x - 7, y - f);
      c.quadraticCurveTo(x - 3, y - 3, x, y);
      c.quadraticCurveTo(x + 3, y - 3, x + 7, y - f);
      c.stroke();
    }
  }

  /** While you sit and breathe, the whole island glows softly in and out. */
  private breathGlow(c: Ctx, exp: number, b: number) {
    const { lo, hi } = landBounds(exp);
    const m = iso((lo + hi) / 2, (lo + hi) / 2);
    const r = (hi - lo) * 34 * (0.75 + b * 0.35);
    const g = c.createRadialGradient(m.x, m.y - 20, 0, m.x, m.y - 20, r);
    g.addColorStop(0, `rgba(255, 250, 225, ${0.1 + b * 0.22})`);
    g.addColorStop(1, 'rgba(255, 250, 225, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(m.x, m.y - 20, r, 0, Math.PI * 2);
    c.fill();
  }

  private fireflies(c: Ctx, exp: number, t: number, dark: number, rgb: number[]) {
    const { lo, hi } = landBounds(exp);
    const mid = (lo + hi) / 2;
    const span = (hi - lo) / 2;
    for (let i = 0; i < 18; i++) {
      const gx = mid + Math.sin(t * 0.3 + i * 1.7) * span * 0.85;
      const gy = mid + Math.cos(t * 0.23 + i * 2.3) * span * 0.85;
      const p = iso(gx, gy);
      const y = p.y - 20 - Math.abs(Math.sin(t * 0.5 + i)) * 30;
      const a = (0.35 + 0.65 * Math.abs(Math.sin(t * 2 + i))) * (0.5 + dark * 0.5);
      const g = c.createRadialGradient(p.x, y, 0, p.x, y, 9);
      g.addColorStop(0, `rgba(${rgb.join(',')}, ${a})`);
      g.addColorStop(1, `rgba(${rgb.join(',')}, 0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, y, 9, 0, Math.PI * 2);
      c.fill();
    }
  }

  // ------------------------------------------------------------ night

  private night(c: Ctx, v: View, t: number, horizon: number) {
    const dark = v.daylight.dark;
    if (dark < 0.02) return;
    const l = this.lctx;
    l.setTransform(0.5, 0, 0, 0.5, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, this.w, this.h);
    l.fillStyle = `rgba(12, 18, 58, ${dark * 0.6})`;
    l.fillRect(0, 0, this.w, this.h);
    l.globalCompositeOperation = 'destination-out';
    const glows: { x: number; y: number; r: number }[] = [];
    for (const p of v.state.placed) {
      if (p.isle !== v.isle) continue;
      const d = def(p.id);
      if (!d?.light) continue;
      const f = footprint(d, p.flip);
      const a = anchor(p.x, p.y, f.w, f.d);
      const s = this.toScreen(a.x, a.y - d.light.y);
      const r = d.light.r * this.cam.zoom * (0.95 + Math.sin(t * 2 + p.x) * 0.05);
      glows.push({ x: s.x, y: s.y, r });
    }
    for (const g of glows) {
      const rg = l.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      rg.addColorStop(0, 'rgba(0,0,0,.95)');
      rg.addColorStop(0.5, 'rgba(0,0,0,.5)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = rg;
      l.beginPath();
      l.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      l.fill();
    }
    c.drawImage(this.lights, 0, 0, this.w, this.h);
    // warm glow on top
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const g of glows) {
      const rg = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 0.6);
      rg.addColorStop(0, `rgba(255, 180, 90, ${0.28 * dark})`);
      rg.addColorStop(1, 'rgba(255, 180, 90, 0)');
      c.fillStyle = rg;
      c.beginPath();
      c.arc(g.x, g.y, g.r * 0.6, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    // stars and moon over the dark sky
    for (let i = 0; i < 46; i++) {
      const x = hash(i, 1) * this.w;
      const y = hash(i, 2) * horizon * 0.92;
      const a = dark * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i)));
      blob(c, x, y, 0.6 + hash(i, 3) * 1.2, `rgba(255,255,240,${a})`);
    }
    // low enough to stay clear of the top bar
    const mx = this.w * 0.78;
    const my = Math.max(110, horizon * 0.45);
    c.save();
    c.globalAlpha = dark;
    const mg = c.createRadialGradient(mx, my, 6, mx, my, 50);
    mg.addColorStop(0, 'rgba(255,250,220,.5)');
    mg.addColorStop(1, 'rgba(255,250,220,0)');
    c.fillStyle = mg;
    c.beginPath();
    c.arc(mx, my, 50, 0, Math.PI * 2);
    c.fill();
    blob(c, mx, my, 13, '#fff6d8');
    blob(c, mx + 6, my - 4, 11, `rgba(${(tones(SKY, v.daylight)[0]).join(',')},0.9)`);
    c.restore();
  }
}

export const key = (p: Placed) => {
  const d = def(p.id)!;
  const f = footprint(d, p.flip);
  return depth(p.x, p.y, f.w, f.d);
};

/** Items (not ground tiles, not ambient) of this island, back to front. */
export function sortedItems(v: View) {
  return v.state.placed.filter((p) => p.isle === v.isle && def(p.id)?.kind === 'item').sort((a, b) => key(a) - key(b));
}

/** Cells with something on them, as x * 64 + y. */
function occupied(v: View) {
  const used = new Set<number>();
  for (const p of v.state.placed) {
    const d = p.isle === v.isle ? def(p.id) : undefined;
    if (d && d.kind !== 'ambient') for (const [x, y] of cellsOfPlaced(p, d)) used.add(x * 64 + y);
  }
  return used;
}

const seedOf = (p: Placed) => (p.x * 7 + p.y * 13) % 17;

function fenceLinks(v: View, p: Placed) {
  const pending = v.ghost?.def.id === 'fence' ? v.ghost.cells : [];
  const has = (dx: number, dy: number) =>
    v.state.placed.some((q) => q.id === 'fence' && q.isle === v.isle && q.x === p.x + dx && q.y === p.y + dy) || pending.some((q) => q.x === p.x + dx && q.y === p.y + dy);
  let m = (has(1, 0) ? 1 : 0) | (has(0, 1) ? 2 : 0) | (has(-1, 0) ? 4 : 0) | (has(0, -1) ? 8 : 0);
  // mirrored drawing swaps the x and y directions
  if (p.flip) m = ((m & 1) << 1) | ((m & 2) >> 1) | ((m & 4) << 1) | ((m & 8) >> 1);
  return m;
}

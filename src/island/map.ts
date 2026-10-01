import { blob, hash } from './art/kit';
import { isleMeta, ISLES } from '../shared/isles';
import type { IslandState } from './economy';
import { Scene, seaTones, type Daylight, type View } from './render';

/**
 * The archipelago from above: every island as a little live picture on the
 * sea. Open ones carry their name; closed ones sit in fog with a lock.
 */

/** Where each island sits on the map, in map units (≈ css px at zoom 1). */
export const MAP_POS: Record<string, { x: number; y: number }> = {
  forest: { x: -120, y: -210 },
  hill: { x: 130, y: -120 },
  garden: { x: -115, y: 40 },
  shore: { x: 125, y: 150 },
  lighthouse: { x: -115, y: 290 },
  toys: { x: 130, y: 400 },
};
const SNAP_W = 230;
const SNAP_H = 210;

export class WorldMap {
  private snaps = new Map<string, HTMLCanvasElement>();
  cam = { x: 0, y: 0, zoom: 1 };
  /** Fog per closed-or-just-opened island: 1 = thick, 0 = gone. */
  fog = new Map<string, number>();

  constructor(private scene: Scene) {}

  /** Re-renders an island's picture (after building there, or when the light changes). */
  snapshot(isle: string, state: IslandState, growth: number, open: boolean, light: Daylight) {
    const cv = this.snaps.get(isle) ?? document.createElement('canvas');
    const sc = new Scene(cv);
    const dpr = Math.min(2, devicePixelRatio || 1);
    sc.resize(SNAP_W, SNAP_H, dpr);
    const shown: IslandState = open ? state : { placed: [], stored: {}, land: {} };
    sc.fit(shown.land[isle] ?? 0, 6, 0);
    const v: View = { rev: 0, state: shown, isle, growth, daylight: isle === 'forest' ? { dark: Math.max(0.45, light.dark), warm: 0.4 } : light, build: false, born: new Map(), poke: new Map() };
    sc.draw(v, 0, false);
    const dark = v.daylight.dark;
    if (dark > 0.02) {
      // the picture has no night layer of its own: dim just the island to match the sea
      const k = sc.ctx;
      k.setTransform(1, 0, 0, 1, 0, 0);
      k.globalCompositeOperation = 'source-atop';
      k.fillStyle = `rgba(12, 18, 64, ${dark * 0.45})`;
      k.fillRect(0, 0, cv.width, cv.height);
      k.globalCompositeOperation = 'source-over';
    }
    this.snaps.set(isle, cv);
  }

  fit(w: number, h: number, top: number, bottom: number) {
    const xs = Object.values(MAP_POS).map((p) => p.x);
    const ys = Object.values(MAP_POS).map((p) => p.y);
    const bw = Math.max(...xs) - Math.min(...xs) + SNAP_W;
    const bh = Math.max(...ys) - Math.min(...ys) + SNAP_H + 40;
    const avail = Math.max(200, h - top - bottom);
    this.cam.zoom = Math.min((w * 0.96) / bw, avail / bh, 1.4);
    this.cam.x = (Math.max(...xs) + Math.min(...xs)) / 2;
    this.cam.y = (Math.max(...ys) + Math.min(...ys)) / 2 + 20 - (top + avail / 2 - h / 2) / this.cam.zoom;
  }

  private toScreen(x: number, y: number) {
    const s = this.scene;
    return { x: (x - this.cam.x) * this.cam.zoom + s.w / 2, y: (y - this.cam.y) * this.cam.zoom + s.h / 2 };
  }

  /** The island under a screen point. */
  hit(sx: number, sy: number) {
    for (const i of ISLES) {
      const p = this.toScreen(MAP_POS[i.id].x, MAP_POS[i.id].y);
      const hw = (SNAP_W / 2) * this.cam.zoom * 0.8;
      const hh = (SNAP_H / 2) * this.cam.zoom;
      if (Math.abs(sx - p.x) < hw && Math.abs(sy - p.y) < hh) return i.id;
    }
    return null;
  }

  /** Screen position of an island's centre (for flying in). */
  where(isle: string) {
    return this.toScreen(MAP_POS[isle].x, MAP_POS[isle].y);
  }

  draw(t: number, light: Daylight, open: string[], current: string) {
    const s = this.scene;
    const c = s.ctx;
    c.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    const [top, bottom] = seaTones(light);
    const g = c.createLinearGradient(0, 0, 0, s.h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, s.w, s.h);
    // ripples
    c.strokeStyle = 'rgba(255,255,255,.18)';
    c.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) {
      const x = ((hash(i, 1) * s.w + t * (6 + (i % 5))) % (s.w + 60)) - 30;
      const y = hash(i, 2) * s.h;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 8, y - 3, x + 16, y);
      c.stroke();
    }
    const z = this.cam.zoom;
    c.font = `700 ${Math.round(15 * Math.max(0.8, Math.min(1.2, z)))}px Fredoka, 'Baloo Bhaijaan 2', system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const i of ISLES) {
      const pos = this.toScreen(MAP_POS[i.id].x, MAP_POS[i.id].y + Math.sin(t * 0.6 + hash(i.threshold)) * 3);
      const isOpen = open.includes(i.id);
      const snap = this.snaps.get(i.id);
      const w = SNAP_W * z;
      const h = SNAP_H * z;
      if (snap) {
        c.save();
        if (!isOpen) {
          c.globalAlpha = 0.5;
          c.filter = 'grayscale(0.7)';
        }
        c.drawImage(snap, pos.x - w / 2, pos.y - h / 2, w, h);
        c.restore();
      }
      const fog = this.fog.get(i.id) ?? (isOpen ? 0 : 1);
      if (fog > 0.01) {
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2 + t * 0.05;
          const r = (w * 0.32) * (1.2 - fog * 0.2) + (1 - fog) * w * 0.4;
          blob(c, pos.x + Math.cos(a) * r * 0.9, pos.y + Math.sin(a) * r * 0.45, w * 0.17, `rgba(255,255,255,${0.55 * fog})`);
        }
        blob(c, pos.x, pos.y, w * 0.22 * (0.4 + fog * 0.6), `rgba(255,255,255,${0.55 * fog})`);
      }
      // label
      const m = isleMeta(i.id)!;
      const label = `${isOpen ? m.emoji : '🔒'} ${m.name}`;
      const tw = c.measureText(label).width + 22;
      const ly = pos.y + h * 0.42;
      c.fillStyle = isOpen ? 'rgba(255,255,255,.95)' : 'rgba(29,43,79,.78)';
      const r = 14;
      c.beginPath();
      c.roundRect(pos.x - tw / 2, ly - r, tw, r * 2, r);
      c.fill();
      c.fillStyle = isOpen ? '#1d2b4f' : '#fff';
      c.fillText(label, pos.x, ly + 1);
      if (i.id === current && isOpen) {
        const by = pos.y - h * 0.36 + Math.sin(t * 3) * 3;
        c.fillStyle = '#ff5a4e';
        c.beginPath();
        c.arc(pos.x, by, 7, Math.PI, 0);
        c.lineTo(pos.x, by + 12);
        c.closePath();
        c.fill();
        blob(c, pos.x, by, 2.6, '#fff');
      }
    }
  }
}


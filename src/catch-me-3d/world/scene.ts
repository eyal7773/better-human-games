import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * The renderer, a fixed three-quarter camera (~55° from above — it never moves
 * or shakes), lights, resizing and dynamic resolution. Rendering stops while
 * the tab is hidden and whenever nothing asked for frames.
 */

export const CAMERA_ELEVATION = (55 * Math.PI) / 180;
const FOV = 34;
/** Resolution steps down when the frame rate drops below this… */
const LOW_FPS = 45;
/** …and back up after a few good seconds above this. */
const GOOD_FPS = 57;
const MIN_RATIO = 0.75;

export interface Fit {
  /** Points (world) that must be on screen. */
  points: THREE.Vector3[];
  /** Screen space kept free at the top/bottom/sides, in CSS pixels. */
  top: number;
  bottom: number;
  side: number;
  /** Look-at point. */
  target?: THREE.Vector3;
  /** Camera angle above the horizon (radians); rooms always use CAMERA_ELEVATION. */
  elevation?: number;
}

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  readonly canvas: HTMLCanvasElement;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;

  /** Current and maximum render scale (devicePixelRatio, capped at 2). */
  ratio: number;
  maxRatio: number;
  fps = 60;

  private fns = new Set<(dt: number) => void>();
  private raf = 0;
  private last = 0;
  private wanted = false;
  private fit: Fit | null = null;
  private frames = 0;
  private windowStart = 0;
  private goodWindows = 0;
  private ray = new THREE.Raycaster();
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(parent: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'c3-canvas';
    this.maxRatio = Math.min(2, window.devicePixelRatio || 1);
    this.ratio = this.maxRatio;
    this.renderer.setPixelRatio(this.ratio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    parent.prepend(this.canvas);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();

    this.hemi = new THREE.HemisphereLight(0xfff6e0, 0x9a8cb8, 1.1);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.7);
    this.sun.position.set(-3, 8, 5);
    this.scene.add(this.hemi, this.sun);

    addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => (document.hidden ? this.halt() : this.wanted && this.run()));
    this.resize();
  }

  /** WebGL is available (checked without three.js in main.ts too). */
  static supported() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }

  get width() {
    return this.canvas.clientWidth || innerWidth;
  }
  get height() {
    return this.canvas.clientHeight || innerHeight;
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h, true);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.fit) this.frame(this.fit);
    this.onResize?.();
    if (!this.wanted) this.render();
  }
  onResize?: () => void;

  /** Places the fixed camera so every fit point is on screen, centred in the free area. */
  frame(fit: Fit) {
    this.fit = fit;
    const cam = this.camera;
    const target = fit.target ?? new THREE.Vector3(0, 0, 0);
    const w = innerWidth;
    const h = innerHeight;
    cam.clearViewOffset();
    const el = fit.elevation ?? CAMERA_ELEVATION;
    const dir = new THREE.Vector3(0, Math.sin(el), Math.cos(el));
    const bbox = (d: number) => {
      cam.position.copy(target).addScaledVector(dir, d);
      cam.lookAt(target);
      cam.updateMatrixWorld();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      const v = new THREE.Vector3();
      for (const p of fit.points) {
        v.copy(p).project(cam);
        const sx = ((v.x + 1) / 2) * w;
        const sy = ((1 - v.y) / 2) * h;
        x0 = Math.min(x0, sx);
        x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy);
        y1 = Math.max(y1, sy);
      }
      return { x0, x1, y0, y1 };
    };
    const availW = w - fit.side * 2;
    const availH = h - fit.top - fit.bottom;
    let lo = 2;
    let hi = 80;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const b = bbox(mid);
      if (b.x1 - b.x0 <= availW && b.y1 - b.y0 <= availH) hi = mid;
      else lo = mid;
    }
    const b = bbox(hi);
    // Shift the picture so the room sits in the middle of the free area.
    const dx = (b.x0 + b.x1) / 2 - w / 2;
    const dy = (b.y0 + b.y1) / 2 - (fit.top + availH / 2);
    cam.setViewOffset(w, h, dx, dy, w, h);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  /** Screen position (CSS px, viewport) of a world point. */
  project(p: THREE.Vector3, out = { x: 0, y: 0 }) {
    const v = p.clone().project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    out.x = r.left + ((v.x + 1) / 2) * r.width;
    out.y = r.top + ((1 - v.y) / 2) * r.height;
    return out;
  }

  /** How many screen pixels one world unit spans (sideways) at a point. */
  pxPerUnit(p: THREE.Vector3) {
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    const a = this.project(p);
    const b = this.project(p.clone().add(right));
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  /** Where on the floor (y = height) a screen point lands. */
  floorAt(clientX: number, clientY: number, height = 0): { x: number; z: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    this.floorPlane.constant = -height;
    const hit = new THREE.Vector3();
    return this.ray.ray.intersectPlane(this.floorPlane, hit) ? { x: hit.x, z: hit.z } : null;
  }

  /** Objects under a screen point. */
  pick(clientX: number, clientY: number, objects: THREE.Object3D[]) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    return this.ray.intersectObjects(objects, true);
  }

  /** Runs fn(dt) every frame while the world is running. Returns an unsubscribe. */
  onFrame(fn: (dt: number) => void) {
    this.fns.add(fn);
    return () => this.fns.delete(fn);
  }

  /** Keep rendering every frame (a level is being played). */
  start() {
    this.wanted = true;
    if (!document.hidden) this.run();
  }

  /** Stop the frame loop (menus, cards): the last frame stays on screen. */
  stop() {
    this.wanted = false;
    this.halt();
  }

  private run() {
    if (this.raf) return;
    this.last = performance.now();
    this.windowStart = this.last;
    this.frames = 0;
    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      for (const fn of this.fns) fn(dt);
      this.render();
      this.measure(now);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private halt() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Dynamic resolution: step down under 45fps, creep back up when it's smooth again. */
  private measure(now: number) {
    this.frames++;
    const span = now - this.windowStart;
    if (span < 1000) return;
    this.fps = (this.frames * 1000) / span;
    this.frames = 0;
    this.windowStart = now;
    if (this.fps < LOW_FPS && this.ratio > MIN_RATIO) {
      this.setRatio(Math.max(MIN_RATIO, this.ratio - 0.25));
      this.goodWindows = 0;
    } else if (this.fps > GOOD_FPS && this.ratio < this.maxRatio) {
      if (++this.goodWindows >= 5) {
        this.setRatio(Math.min(this.maxRatio, this.ratio + 0.25));
        this.goodWindows = 0;
      }
    } else this.goodWindows = 0;
  }

  private setRatio(r: number) {
    this.ratio = r;
    this.renderer.setPixelRatio(r);
    this.renderer.setSize(innerWidth, innerHeight, true);
  }

  /** Swap what's on stage. */
  show(group: THREE.Object3D | null) {
    for (const c of [...this.scene.children]) if (c !== this.sun && c !== this.hemi) this.scene.remove(c);
    if (group) this.scene.add(group);
  }
}

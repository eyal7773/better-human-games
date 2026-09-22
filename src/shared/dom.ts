type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown>;

/** Tiny hyperscript helper. `on*` props become listeners, `class`/`style`/`html` are special. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    el.append(typeof c === 'number' ? String(c) : c);
  }
  return el;
}

/** Wraps text in a left-to-right isolate so "+30" and "85°" survive inside RTL text. */
export const ltr = (s: string | number) => `⁦${s}⁩`;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const ease = {
  linear: (t: number) => t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Owns timers, listeners and frame loops for one piece of game logic.
 * After dispose(), pending sleeps/tweens never resolve, so async sequences
 * written with `await scope.sleep()` simply stop.
 */
export class Scope {
  alive = true;
  private cleanups: (() => void)[] = [];

  add(fn: () => void) {
    this.cleanups.push(fn);
  }

  timeout(fn: () => void, ms: number) {
    const id = window.setTimeout(() => this.alive && fn(), ms);
    this.add(() => clearTimeout(id));
  }

  interval(fn: () => void, ms: number) {
    const id = window.setInterval(() => this.alive && fn(), ms);
    this.add(() => clearInterval(id));
  }

  sleep(ms: number): Promise<void> {
    return new Promise((res) => this.timeout(res, ms));
  }

  on<E extends Event = Event>(
    target: EventTarget,
    type: string,
    fn: (e: E) => void,
    opts?: AddEventListenerOptions | boolean,
  ) {
    const l = fn as EventListener;
    target.addEventListener(type, l, opts);
    this.add(() => target.removeEventListener(type, l, opts));
  }

  /** Runs fn(dt seconds) every animation frame until disposed. */
  loop(fn: (dt: number) => void) {
    let last = performance.now();
    let id = 0;
    const tick = (now: number) => {
      if (!this.alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      fn(dt);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    this.add(() => cancelAnimationFrame(id));
  }

  tween(ms: number, fn: (t: number) => void, easing: (t: number) => number = ease.inOut): Promise<void> {
    return new Promise((res) => {
      const start = performance.now();
      const step = (now: number) => {
        if (!this.alive) return;
        const t = Math.min(1, (now - start) / ms);
        fn(easing(t));
        if (t < 1) requestAnimationFrame(step);
        else res();
      };
      requestAnimationFrame(step);
    });
  }

  dispose() {
    if (!this.alive) return;
    this.alive = false;
    for (const fn of this.cleanups.splice(0)) {
      try {
        fn();
      } catch {
        /* cleanup must never throw */
      }
    }
  }
}

/** Resolves on the next click of `el`. */
export function waitClick(el: HTMLElement): Promise<void> {
  return new Promise((res) => el.addEventListener('click', () => res(), { once: true }));
}

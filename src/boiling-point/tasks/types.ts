import type { Scope } from '../../shared/dom';
import type { AudioEngine } from '../../shared/audio';
import type { FX } from '../../shared/fx';

export interface TaskCtx {
  board: HTMLElement;
  scope: Scope;
  audio: AudioEngine;
  fx: FX;
  level: number;
  /** A wrong move — small heat bump. Coordinates are in viewport space. */
  miss(x: number, y: number): void;
  /** One more piece done (drives the progress sound/visuals). */
  progress(step: number, x: number, y: number): void;
  complete(): void;
}

/**
 * A small household chore. Gremlins interact with it through the
 * victim/detach/carry/drop/shuffle hooks (coordinates are board-local).
 */
export interface Task {
  title: string;
  hint: string;
  mount(): void;
  victim(): HTMLElement | null;
  center(el: HTMLElement): { x: number; y: number };
  /** Take the item away from the player. False if it is no longer stealable. */
  detach(el: HTMLElement): boolean;
  carry(el: HTMLElement, x: number, y: number): void;
  drop(el: HTMLElement, x: number, y: number): void;
  shuffle(): void;
  freeze(): void;
}

/** Board-local → viewport coordinates. */
export function toClient(board: HTMLElement, x: number, y: number) {
  const r = board.getBoundingClientRect();
  return { x: r.left + x, y: r.top + y };
}

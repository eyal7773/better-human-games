import type { Scope } from '../../shared/dom';
import type { AudioEngine } from '../../shared/audio';
import type { FX } from '../../shared/fx';

export interface CalmCtx {
  board: HTMLElement;
  scope: Scope;
  audio: AudioEngine;
  fx: FX;
  /** Positive = hotter. Coordinates (viewport) place a spark/label. */
  heat(delta: number, x?: number, y?: number, label?: string): void;
  /** Replaces the instruction line under the title. */
  say(text: string): void;
  done(): void;
}

export interface Calm {
  title: string;
  hint: string;
  /** Multiplies the gap between interruptions (default 1). */
  mischiefScale?: number;
  mount(): void;
}

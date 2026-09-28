import { h, reducedMotion } from '../shared/dom';
import { avatarSVG } from '../shared/avatar';
import { kettleSVG, setKettleMood } from '../shared/kettle';
import { profile } from '../shared/profile';
import type { FX } from '../shared/fx';
import { T } from './story';

/**
 * Everything drawn over the 3D room: the top bar, tap feedback (at your
 * finger), Pesky's speech bubble (next to him), the mirror in the corner that
 * steams up as you get frustrated, the "I'm getting angry" button, and cards.
 *
 * Rule: text at the tap = what happened to *your* tap; a bubble by Pesky =
 * his taunt. At most one of each at a time. Everything is also announced in
 * an aria-live region.
 */

const ICON_HOME = '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/></svg>';
const ICON_BACK = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_SOUND =
  '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const ICON_MUTED =
  '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

export class Hud {
  readonly root: HTMLElement;
  readonly layer: HTMLElement;
  readonly back: HTMLAnchorElement;
  readonly title = h('span', { class: 'c3-top-title' });
  readonly dots = h('div', { class: 'c3-dots', 'aria-hidden': 'true' });
  readonly sound: HTMLButtonElement;
  readonly notice: HTMLButtonElement;
  readonly peskyBtn: HTMLButtonElement;
  readonly mirror: HTMLElement;
  readonly cards = h('div', { class: 'c3-cards' });
  private live = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  private bubble = h('div', { class: 'c3-bubble', 'aria-hidden': 'true' });
  private tapEl: HTMLElement | null = null;
  private bubbleTimer = 0;
  private steamAcc = 0;
  private kettle: Element | null = null;

  constructor(
    parent: HTMLElement,
    private fx: FX,
    muted: () => boolean,
    toggleSound: () => void,
  ) {
    this.back = h('a', { class: 'icon-btn', href: import.meta.env.BASE_URL, 'aria-label': T.home, html: ICON_HOME });
    this.sound = h('button', { class: 'icon-btn', type: 'button' });
    const paint = () => {
      this.sound.innerHTML = muted() ? ICON_MUTED : ICON_SOUND;
      this.sound.setAttribute('aria-label', muted() ? T.soundOn : T.mute);
    };
    paint();
    this.sound.addEventListener('click', () => {
      toggleSound();
      paint();
    });
    this.notice = h('button', { class: 'c3-notice', type: 'button', hidden: true }, T.angry);
    this.peskyBtn = h('button', { class: 'c3-pesky-btn', type: 'button', 'aria-label': T.pesky, tabindex: '-1' });
    const mirrorArt = h('div', { class: 'c3-mirror-art' });
    if (profile.status === 'done') mirrorArt.innerHTML = avatarSVG(profile.shape, profile.color);
    else {
      mirrorArt.innerHTML = kettleSVG();
      this.kettle = mirrorArt.querySelector('svg');
    }
    this.mirror = h('div', { class: 'c3-mirror', 'aria-hidden': 'true', hidden: true }, mirrorArt);
    this.layer = h(
      'div',
      { class: 'c3-hud' },
      h('div', { class: 'c3-tint c3-tint-warm', 'aria-hidden': 'true' }),
      h('div', { class: 'c3-tint c3-tint-calm', 'aria-hidden': 'true' }),
      h('header', { class: 'c3-top' }, this.back, h('div', { class: 'c3-top-mid' }, this.title, this.dots), this.sound),
      this.peskyBtn,
      this.bubble,
      this.mirror,
      this.notice,
      this.live,
    );
    this.root = h('section', { class: 'c3' }, this.layer, this.cards);
    parent.append(this.root);
  }

  /** Top-left button: home (on the map) or back to the map (in a room). */
  setBack(mode: 'home' | 'map', onMap?: () => void) {
    this.back.onclick = null;
    if (mode === 'home') {
      this.back.href = import.meta.env.BASE_URL;
      this.back.innerHTML = ICON_HOME;
      this.back.setAttribute('aria-label', T.home);
    } else {
      this.back.href = '#';
      this.back.innerHTML = ICON_BACK;
      this.back.setAttribute('aria-label', T.map);
      this.back.onclick = (e) => {
        e.preventDefault();
        onMap?.();
      };
    }
  }

  setCatches(n: number, of: number) {
    this.dots.replaceChildren(...Array.from({ length: of }, (_, i) => h('i', { class: i < n ? 'on' : '' })));
    this.dots.setAttribute('title', T.catches(n, of));
  }

  announce(text: string) {
    this.live.textContent = '';
    // A fresh node each time so screen readers repeat identical messages.
    requestAnimationFrame(() => (this.live.textContent = text));
  }

  /** What happened to your tap, right where you tapped. Replaces the previous one. */
  tapResult(x: number, y: number, text: string, cls = '') {
    this.tapEl?.remove();
    const el = h('div', { class: `c3-tap ${cls}`, style: { left: `${x}px`, top: `${y}px` } }, text);
    this.layer.append(el);
    this.tapEl = el;
    setTimeout(() => el.remove(), 1300);
    this.announce(text);
  }

  /** Pesky's taunt in a bubble by his head. */
  say(text: string, ms = 1200) {
    this.bubble.textContent = text;
    this.bubble.classList.remove('show');
    void this.bubble.offsetWidth;
    this.bubble.classList.add('show');
    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = window.setTimeout(() => this.bubble.classList.remove('show'), ms);
    this.announce(text);
  }

  hush() {
    this.bubble.classList.remove('show');
  }

  /** Keeps the bubble and the keyboard button over Pesky. */
  follow(x: number, y: number, size: number, visible = true) {
    this.bubble.style.transform = `translate(${x}px, ${y - size * 0.55}px)`;
    const b = this.peskyBtn;
    b.style.width = b.style.height = `${size}px`;
    b.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
    b.style.visibility = visible ? 'visible' : 'hidden';
  }

  /** F (0–1) shows as screen hue and steam from your mirror — never as a number. */
  setHeat(f01: number, dt: number) {
    this.root.style.setProperty('--heat', f01.toFixed(3));
    setKettleMood(this.kettle, f01);
    if (this.mirror.hidden || f01 < 0.3) return;
    this.steamAcc += dt * f01 * f01 * 9;
    if (this.steamAcc >= 1) {
      this.steamAcc = 0;
      const r = this.mirror.getBoundingClientRect();
      this.fx.steam(r.left + r.width * 0.5, r.top + 6, 1, 0.5 + f01);
    }
  }

  setCalm(k: number) {
    this.root.style.setProperty('--calm', k.toFixed(3));
  }

  /** Breathing: colours fade (the canvas sits outside the HUD, so flag the body). */
  setDesat(on: boolean) {
    this.root.classList.toggle('breathing', on);
    document.body.classList.toggle('c3-breathing', on);
  }

  showNotice(show: boolean, pulse = false) {
    this.notice.hidden = !show;
    this.notice.classList.toggle('pulse', pulse && !reducedMotion());
  }

  /** A card over the room: title, lines, buttons. Resolves with the chosen button's id. */
  card(o: { title?: string; lines?: (string | Node)[]; art?: Node; buttons: { id: string; label: string; cls?: string }[]; cls?: string }): Promise<string> {
    return new Promise((resolve) => {
      const btns = o.buttons.map((b) => {
        const el = h('button', { class: `btn ${b.cls ?? ''}`, type: 'button' }, b.label);
        el.addEventListener('click', () => {
          card.remove();
          resolve(b.id);
        });
        return el;
      });
      const card = h(
        'div',
        { class: `c3-card ${o.cls ?? ''}`, role: 'dialog', 'aria-modal': 'true' },
        o.art ?? null,
        o.title ? h('h2', {}, o.title) : null,
        ...(o.lines ?? []).map((l) => (typeof l === 'string' ? h('p', {}, l) : l)),
        h('div', { class: 'c3-card-btns' }, ...btns),
      );
      this.cards.append(card);
      btns[0]?.focus({ preventScroll: true });
    });
  }

  /** Story lines, one tap at a time, with a skip button. */
  async story(lines: string[], art?: () => Node) {
    for (let i = 0; i < lines.length; i++) {
      const last = i === lines.length - 1;
      const choice = await this.card({
        cls: 'c3-story',
        art: art?.(),
        lines: [lines[i]],
        buttons: [{ id: 'next', label: last ? T.go : T.next, cls: 'warm' }, ...(last ? [] : [{ id: 'skip', label: T.skip, cls: 'ghost' }])],
      });
      if (choice === 'skip') return;
    }
  }

  clearCards() {
    this.cards.replaceChildren();
  }
}

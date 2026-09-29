import './base.css';
import './shell.css';
import { h } from './dom';
import { tr } from './i18n';
import { AudioEngine } from './audio';
import { FX } from './fx';
import { grantZen } from '../boiling-point/save';
import {
  countStars,
  loadProgress,
  nextLevel,
  recordLevel,
  saveProgress,
  unlocked,
  type Progress,
  type Stars,
} from './progress';

/**
 * The frame the small games share: a top bar (home/back, title, sound), a
 * stage the game draws into, a level menu with stars and locks, the end card,
 * and modal cards. Each game owns only its play screen.
 */

const ICON_HOME = '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/></svg>';
const ICON_BACK =
  '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_SOUND =
  '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const ICON_MUTED =
  '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

export const S = {
  home: tr({ en: 'All games', he: 'לכל המשחקים', ar: 'كل الألعاب' }),
  menu: tr({ en: 'Levels', he: 'שלבים', ar: 'المراحل' }),
  soundOn: tr({ en: 'Sound on', he: 'הפעלת צליל', ar: 'تشغيل الصوت' }),
  mute: tr({ en: 'Mute', he: 'השתקה', ar: 'كتم الصوت' }),
  start: tr({ en: 'Play', he: 'לשחק', ar: 'العبوا' }),
  cont: (n: number) => tr({ en: `Continue · level ${n}`, he: `להמשיך · שלב ${n}`, ar: `متابعة · المرحلة ${n}` }),
  again: tr({ en: 'Play again', he: 'עוד פעם', ar: 'مرة أخرى' }),
  next: tr({ en: 'Next level', he: 'לשלב הבא', ar: 'المرحلة التالية' }),
  locked: tr({ en: 'Locked — finish the level before it', he: 'נעול — סיימו את השלב הקודם', ar: 'مقفلة — أنهوا المرحلة السابقة' }),
  level: (n: number) => tr({ en: `Level ${n}`, he: `שלב ${n}`, ar: `المرحلة ${n}` }),
  zen: (n: number) => tr({ en: `+${n} zen for your island`, he: `+${n} זן לאי השקט`, ar: `+${n} سكينة لجزيرتكم` }),
  takeHome: tr({ en: 'Take it home', he: 'לקחת הביתה', ar: 'خذوها إلى البيت' }),
  howTo: tr({ en: 'How to play', he: 'איך משחקים', ar: 'كيف نلعب' }),
  gotIt: tr({ en: 'Got it', he: 'הבנתי', ar: 'فهمت' }),
  close: tr({ en: 'Close', he: 'סגירה', ar: 'إغلاق' }),
  record: tr({ en: 'New personal best!', he: 'שיא אישי חדש!', ar: 'رقم شخصي جديد!' }),
  stars: (n: number) => tr({ en: `${n} of 3 stars`, he: `${n} מתוך 3 כוכבים`, ar: `${n} من 3 نجوم` }),
};

export interface LevelInfo {
  id: string;
  name: string;
}

export interface Extra {
  label: string;
  locked?: boolean;
  lockedHint?: string;
  onClick: () => void;
}

export interface StarLine {
  label: string;
  on: boolean;
}

export interface CardButton {
  id: string;
  label: string;
  cls?: string;
}

export class Shell {
  readonly root: HTMLElement;
  readonly stage = h('div', { class: 'sh-stage' });
  readonly audio: AudioEngine;
  readonly fx: FX;
  readonly progress: Progress;
  private back: HTMLAnchorElement;
  private titleEl: HTMLElement;
  private layer = h('div', { class: 'sh-layer' });
  private live = h('p', { class: 'sr-only', 'aria-live': 'polite' });

  constructor(
    private key: string,
    readonly title: string,
    theme: string,
  ) {
    document.title = title;
    this.progress = loadProgress(key);
    this.audio = new AudioEngine(this.progress.muted);
    addEventListener('pointerdown', () => this.audio.unlock(), { capture: true });
    addEventListener('keydown', () => this.audio.unlock(), { capture: true });
    document.addEventListener('visibilitychange', () => this.audio.setBackground(document.hidden));

    this.back = h('a', { class: 'icon-btn', href: import.meta.env.BASE_URL, 'aria-label': S.home, html: ICON_HOME });
    const sound = h('button', { class: 'icon-btn', type: 'button' });
    const paint = () => {
      sound.innerHTML = this.progress.muted ? ICON_MUTED : ICON_SOUND;
      sound.setAttribute('aria-label', this.progress.muted ? S.soundOn : S.mute);
    };
    paint();
    sound.addEventListener('click', () => {
      this.progress.muted = !this.progress.muted;
      this.audio.setMuted(this.progress.muted);
      if (!this.progress.muted) this.audio.unlock();
      this.persist();
      paint();
    });
    this.titleEl = h('span', { class: 'sh-title' }, title);
    this.root = h(
      'section',
      { class: `sh ${theme}` },
      h('header', { class: 'sh-top' }, this.back, this.titleEl, sound),
      this.stage,
      this.layer,
      this.live,
    );
    document.getElementById('app')!.append(this.root);
    this.fx = new FX(document.body);
  }

  persist() {
    saveProgress(this.key, this.progress);
  }

  setTitle(t: string) {
    this.titleEl.textContent = t;
  }

  /** Top-left: home page (on the menu) or back to the menu (while playing). */
  setBack(onMenu?: () => void) {
    this.back.onclick = null;
    if (!onMenu) {
      this.back.href = import.meta.env.BASE_URL;
      this.back.innerHTML = ICON_HOME;
      this.back.setAttribute('aria-label', S.home);
      return;
    }
    this.back.href = '#';
    this.back.innerHTML = ICON_BACK;
    this.back.setAttribute('aria-label', S.menu);
    this.back.onclick = (e) => {
      e.preventDefault();
      onMenu();
    };
  }

  announce(text: string) {
    this.live.textContent = '';
    // A fresh write each time so screen readers repeat identical messages.
    requestAnimationFrame(() => (this.live.textContent = text));
  }

  clearStage() {
    this.stage.replaceChildren();
    this.layer.replaceChildren();
  }

  /** Records stars (zen only for new ones) and saves. Returns the zen earned. */
  finishLevel(id: string, stars: Stars) {
    const zen = recordLevel(this.progress, id, stars);
    this.persist();
    if (zen) grantZen(zen);
    return zen;
  }

  /** The start screen: intro, a big "continue", the level grid and extra modes. */
  menu(o: { lede: string; art?: Node; levels: LevelInfo[]; extras?: Extra[]; onPlay: (id: string) => void }) {
    this.clearStage();
    this.setTitle(this.title);
    this.setBack();
    const ids = o.levels.map((l) => l.id);
    const next = nextLevel(this.progress, ids);
    const nextN = ids.indexOf(next) + 1;
    const started = this.progress.done.length > 0;
    const tiles = o.levels.map((l, i) => {
      const open = unlocked(this.progress, ids, l.id);
      const n = countStars(this.progress.stars[l.id]);
      const tile = h(
        'button',
        {
          class: `sh-tile${open ? '' : ' locked'}${l.id === next ? ' next' : ''}`,
          type: 'button',
          'aria-label': open ? `${S.level(i + 1)}: ${l.name}. ${S.stars(n)}` : `${S.level(i + 1)}: ${S.locked}`,
          'aria-disabled': open ? null : 'true',
        },
        h('span', { class: 'sh-tile-n' }, open ? String(i + 1) : '🔒'),
        h('span', { class: 'sh-tile-name' }, l.name),
        h('span', { class: 'sh-tile-stars', 'aria-hidden': 'true' }, ...[0, 1, 2].map((k) => h('i', { class: k < n ? 'on' : '' }, '★'))),
      );
      tile.addEventListener('click', () => {
        if (open) o.onPlay(l.id);
        else this.announce(S.locked);
      });
      return tile;
    });
    const extras = (o.extras ?? []).map((x) => {
      const b = h('button', { class: `btn ghost sh-extra${x.locked ? ' locked' : ''}`, type: 'button' }, x.locked ? `🔒 ${x.label}` : x.label);
      b.addEventListener('click', () => {
        if (x.locked) this.announce(x.lockedHint ?? S.locked);
        else x.onClick();
      });
      if (x.locked && x.lockedHint) b.title = x.lockedHint;
      return b;
    });
    const play = h('button', { class: 'btn warm sh-play', type: 'button' }, started ? S.cont(nextN) : S.start);
    play.addEventListener('click', () => o.onPlay(next));
    const screen = h(
      'div',
      { class: 'sh-menu' },
      o.art ? h('div', { class: 'sh-menu-art', 'aria-hidden': 'true' }, o.art) : null,
      h('h1', { class: 'sh-menu-title' }, this.title),
      h('p', { class: 'sh-menu-lede' }, o.lede),
      play,
      h('div', { class: 'sh-tiles' }, ...tiles),
      extras.length ? h('div', { class: 'sh-extras' }, ...extras) : null,
    );
    this.stage.append(screen);
    play.focus({ preventScroll: true });
  }

  /** A modal card over the stage. Resolves with the id of the button pressed. */
  card(o: { title?: string; lines?: (string | Node)[]; art?: Node; buttons: CardButton[]; cls?: string }): Promise<string> {
    return new Promise((resolve) => {
      const card = h('div', { class: `sh-card ${o.cls ?? ''}`, role: 'dialog', 'aria-modal': 'true' });
      const btns = o.buttons.map((b) => {
        const el = h('button', { class: `btn ${b.cls ?? ''}`, type: 'button' }, b.label);
        el.addEventListener('click', () => {
          wrap.remove();
          resolve(b.id);
        });
        return el;
      });
      card.append(
        ...[
          o.art ?? null,
          o.title ? h('h2', {}, o.title) : null,
          ...(o.lines ?? []).map((l) => (typeof l === 'string' ? h('p', {}, l) : l)),
          h('div', { class: 'sh-card-btns' }, ...btns),
        ].filter((x): x is Node => x !== null),
      );
      const wrap = h('div', { class: 'sh-scrim' }, card);
      this.layer.append(wrap);
      if (o.title) this.announce(o.title);
      btns[0]?.focus({ preventScroll: true });
    });
  }

  /** The end-of-level card. Resolves with 'next' | 'again' | 'menu'. */
  end(o: {
    title: string;
    stars: StarLine[];
    zen: number;
    lines?: (string | Node)[];
    anchor: string;
    record?: boolean;
    hasNext: boolean;
  }): Promise<string> {
    const earned = o.stars.filter((s) => s.on).length;
    const starsEl = h(
      'div',
      { class: 'sh-end-stars', 'aria-label': S.stars(earned) },
      ...o.stars.map((s, i) =>
        h('div', { class: `sh-end-star${s.on ? ' on' : ''}`, style: { animationDelay: `${0.15 + i * 0.22}s` } }, h('i', { 'aria-hidden': 'true' }, '★'), h('span', {}, s.label)),
      ),
    );
    if (earned) this.audio.success();
    const buttons: CardButton[] = [];
    if (o.hasNext) buttons.push({ id: 'next', label: S.next, cls: 'warm' });
    buttons.push({ id: 'again', label: S.again, cls: o.hasNext ? 'ghost' : 'warm' }, { id: 'menu', label: S.menu, cls: 'ghost' });
    return this.card({
      cls: 'sh-end',
      title: o.title,
      lines: [
        starsEl,
        ...(o.lines ?? []),
        ...(o.record ? [h('p', { class: 'sh-record' }, `🏆 ${S.record}`)] : []),
        ...(o.zen ? [h('p', { class: 'sh-zen' }, `🌿 ${S.zen(o.zen)}`)] : []),
        h('div', { class: 'sh-anchor' }, h('b', {}, S.takeHome), h('p', {}, o.anchor)),
      ],
      buttons,
    });
  }

  /** Information sheet (album, how to play) with a close button. */
  sheet(title: string, body: Node[]): Promise<string> {
    return this.card({ cls: 'sh-sheet', title, lines: body, buttons: [{ id: 'close', label: S.close, cls: 'ghost' }] });
  }
}

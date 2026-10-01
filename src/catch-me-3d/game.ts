import { AudioEngine } from '../shared/audio';
import { h } from '../shared/dom';
import { FX } from '../shared/fx';
import { addZen, dailyBonus, islandHref } from '../shared/zen';
import { currentlyOpen, isleMeta } from '../shared/isles';
import { BreathOrb } from './breath';
import { Debug } from './debug';
import { Hud } from './hud';
import { playLevel, type Ctx } from './level';
import { ENDLESS_ROOMS, FINAL_LEVEL, level, LEVELS, type Level } from './levels';
import { playFinale } from './finale';
import { pick } from '../shared/dom';
import { loadFaces } from './pesky/model';
import { loadSave, persist, recordLevel, unlocked } from './save';
import { starsFor, type Stars } from './stars';
import { ENDING, ROOSTER_HINT, STORY, T, TRICK_INFO } from './story';
import { buddySVG } from '../catch-me/buddy';
import { showMap } from './world/map';
import { World } from './world/scene';
import { TRICKS } from './levels';

/**
 * The game's flow, loaded on demand together with three.js: the house map,
 * story beats, a room, and the results.
 */

export async function boot(app: HTMLElement) {
  const save = loadSave();
  const audio = new AudioEngine(save.muted);
  addEventListener('pointerdown', () => audio.unlock(), { capture: true });
  document.addEventListener('visibilitychange', () => audio.setBackground(document.hidden));

  const bg = h('div', { class: 'c3-bg', 'aria-hidden': 'true' });
  app.append(bg);
  const world = new World(app);
  const fx = new FX(document.body);
  const hud = new Hud(app, fx, () => save.muted, () => {
    save.muted = !save.muted;
    persist(save);
    audio.setMuted(save.muted);
    if (!save.muted) audio.unlock();
    else {
      audio.stopPad();
      audio.setWhistle(0);
    }
  });
  const breath = new BreathOrb(hud.layer, audio);
  const debug = Debug.wanted() ? new Debug(app) : null;
  const faces = await loadFaces();
  const ctx: Ctx = { world, hud, breath, audio, fx, save, faces, debug, bg };

  const mapScreen = () => {
    hud.root.dataset.screen = 'map';
    hud.title.textContent = T.house;
    hud.dots.replaceChildren();
    hud.setBack('home');
    bg.style.background = '';
    const foot = h('div', { class: 'c3-map-foot' }, trickShelf());
    if (save.finished) {
      const endless = h(
        'button',
        { class: 'btn warm c3-endless', type: 'button' },
        h('span', {}, `∞ ${T.endless}`),
        save.endlessBest ? h('small', {}, T.best(save.endlessBest)) : null,
      );
      endless.addEventListener('click', () => pick(0));
      foot.prepend(endless);
    }
    const layer = h('div', { class: 'c3-map' }, foot);
    hud.layer.append(layer);
    const close = showMap(world, layer, save, faces, (id) => pick(id));
    let picked = false;
    const pick = (id: number) => {
      if (picked) return;
      picked = true;
      audio.unlock();
      close();
      layer.remove();
      void play(id).then(mapScreen);
    };
    // First visit: a welcome card, then straight into the living room.
    if (!save.done.length && !save.baseline) {
      void hud
        .card({ cls: 'c3-welcome', title: T.title, lines: [T.lede], buttons: [{ id: 'go', label: T.play, cls: 'warm' }] })
        .then(() => pick(1));
    }
  };

  /** The trick collection: silhouettes until seen. */
  const trickShelf = () =>
    h(
      'div',
      { class: 'c3-tricks', role: 'list', 'aria-label': T.tricksTitle },
      h('span', { class: 'c3-tricks-title' }, T.tricksTitle),
      ...TRICKS.map((t) => {
        const seen = save.tricks.includes(t);
        return h('span', { class: `c3-trick${seen ? '' : ' unseen'}`, role: 'listitem', title: seen ? TRICK_INFO[t].name : '?' }, h('b', {}, TRICK_INFO[t].icon), h('small', {}, seen ? TRICK_INFO[t].name : '?'));
      }),
    );

  const play = async (id: number): Promise<void> => {
    hud.root.dataset.screen = 'level';
    if (id === 0) return playEndless();
    const lv = level(id)!;
    if (id === FINAL_LEVEL) return playLast();
    const res = await playLevel(ctx, lv, {
      intro: async () => {
        await hud.story(STORY[id]);
        if (id === 4) await hud.card({ cls: 'c3-story', art: shieldArt(), lines: [], buttons: [{ id: 'go', label: T.go, cls: 'warm' }] });
        if (id === 5) await hud.card({ cls: 'c3-story', art: h('div', { class: 'c3-art' }, '🐓'), lines: [`“${ROOSTER_HINT}”`], buttons: [{ id: 'go', label: T.go, cls: 'warm' }] });
      },
    });
    if (res.exited) return;
    const hasBreath = lv.id !== 1;
    const stars = starsFor(res.stats, hasBreath);
    const starZen = recordLevel(save, id, stars);
    if (starZen) addZen(starZen);
    // The day's first finished room also pays the daily bonus (added to the wallet by dailyBonus).
    const zen = starZen + (stars[0] ? dailyBonus('catch-me-3d') : 0);
    persist(save);
    const next = LEVELS.find((l) => l.id === id + 1);
    const choice = await hud.card({
      cls: 'c3-results',
      title: T.done,
      lines: [
        starList(stars, hasBreath),
        ...(zen ? [h('p', { class: 'c3-zen' }, T.zen(zen))] : []),
        ...(res.newTricks.length ? [h('p', { class: 'c3-newtrick' }, `${T.newTrick} ${res.newTricks.map((t) => TRICK_INFO[t].icon).join(' ')}`)] : []),
      ],
      buttons: [
        ...(next && unlocked(save, next.id) ? [{ id: 'next', label: T.nextRoom, cls: 'warm' }] : []),
        { id: 'map', label: T.map, cls: next ? 'ghost' : 'warm' },
        { id: 'again', label: T.again2, cls: 'ghost' },
        ...(zen ? [{ id: 'island', label: T.island, cls: 'ghost' }] : []),
      ],
    });
    if (choice === 'island') return location.assign(islandHref());
    if (choice === 'next' && next) return play(next.id);
    if (choice === 'again') return play(id);
  };

  /** Level 6, then the ending: the buttons go back, and Pesky moves into your home. */
  const playLast = async () => {
    const res = await playFinale(ctx);
    if (res.exited) return;
    const openBefore = currentlyOpen();
    const stars = starsFor(res.stats, true);
    const starZen = recordLevel(save, FINAL_LEVEL, stars);
    if (starZen) addZen(starZen);
    // The day's first finished room also pays the daily bonus (added to the wallet by dailyBonus).
    const zen = starZen + (stars[0] ? dailyBonus('catch-me-3d') : 0);
    const first = !save.finished;
    save.finished = true;
    persist(save);
    // finishing the story opens Toy Island, where Pesky lives
    const opened = currentlyOpen()
      .filter((i) => !openBefore.includes(i))
      .map((i) => isleMeta(i)!);
    const victims = () => h('div', { class: 'c3-art c3-victims' }, ...['📺', '🫖', '🤖', '🧙', '🐓'].map((e) => h('span', {}, e)));
    const withPesky = () =>
      h('div', { class: 'c3-art' }, h('div', { class: 'c3-buddy', 'data-face': 'calm', html: buddySVG() }), h('span', { class: 'c3-heart' }, '💛'));
    await hud.story([ENDING[0]], withPesky);
    await hud.story([ENDING[1]], victims);
    const choice = await hud.card({
      cls: 'c3-results',
      art: withPesky(),
      title: T.friends,
      lines: [ENDING[2], starList(stars, true), ...(zen ? [h('p', { class: 'c3-zen' }, T.zen(zen))] : []), ...(first ? [h('p', { class: 'c3-newtrick' }, `∞ ${T.endless}`)] : []), ...opened.map((m) => h('p', { class: 'c3-zen' }, `${m.emoji} ${T.newIsle(m.name)}`))],
      buttons: [
        ...(opened.length ? [{ id: 'island', label: T.island, cls: 'warm' }] : []),
        { id: 'home', label: T.toHome, cls: opened.length ? 'ghost' : 'warm' },
        { id: 'map', label: T.map, cls: 'ghost' },
      ],
    });
    if (choice === 'island') location.assign(islandHref());
    if (choice === 'home') location.href = import.meta.env.BASE_URL;
  };

  /** Endless: a random room, every trick, escalating; the run ends after three boils or on leaving. */
  const playEndless = async (): Promise<void> => {
    const room = pick(ENDLESS_ROOMS);
    const lv: Level = { id: 0, room, catches: Infinity, tricks: ['zigzag', 'hide', 'decoy', 'bed', 'clones', 'portals'], mechanic: 'chase', forcedBoil: true, notice: true, noticePulse: false, tripPerSec: 0.08 };
    const res = await playLevel(ctx, lv, { endless: true, intro: () => hud.story([T.endless + '…', T.endlessDesc]) });
    const best = res.calmStars > save.endlessBest;
    if (best) save.endlessBest = res.calmStars;
    persist(save);
    const choice = await hud.card({
      cls: 'c3-results',
      title: T.runOver,
      lines: [
        h('p', { class: 'c3-calm-stars' }, `★ ${T.calmStars(res.calmStars)}`),
        best && res.calmStars > 0 ? h('p', { class: 'c3-zen' }, T.newBest) : h('p', {}, T.best(save.endlessBest)),
      ],
      buttons: [
        { id: 'again', label: T.again2, cls: 'warm' },
        { id: 'map', label: T.map, cls: 'ghost' },
      ],
    });
    if (choice === 'again') return playEndless();
  };

  /** Level 4: what the red shield means, in two pictures. */
  const shieldArt = () => {
    const panel = (who: string, face: string, shield: boolean, caption: string) =>
      h(
        'figure',
        { class: `c3-shield-panel${shield ? ' on' : ''}` },
        h('div', { class: 'c3-shield-pic' }, h('span', { class: 'c3-who' }, who), h('div', { class: 'c3-buddy', 'data-face': face, html: buddySVG() })),
        h('figcaption', {}, caption),
      );
    return h('div', { class: 'c3-shield-art' }, panel('😠', 'laugh', true, T.shieldTitle), panel('😌', 'dizzy', false, T.shieldCalm));
  };

  const starList = (s: Stars, hasBreath: boolean) =>
    h(
      'ul',
      { class: 'c3-stars' },
      ...[T.star1, T.star2, hasBreath ? T.star3 : T.star3noBreath].map((label, i) =>
        h('li', { class: s[i] ? 'on' : '' }, h('b', { 'aria-hidden': 'true' }, s[i] ? '★' : '☆'), h('span', {}, label)),
      ),
    );

  mapScreen();
}

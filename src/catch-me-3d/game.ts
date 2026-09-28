import { AudioEngine } from '../shared/audio';
import { h } from '../shared/dom';
import { FX } from '../shared/fx';
import { grantZen } from '../boiling-point/save';
import { BreathOrb } from './breath';
import { Debug } from './debug';
import { Hud } from './hud';
import { playLevel, type Ctx } from './level';
import { level, LEVELS } from './levels';
import { loadFaces } from './pesky/model';
import { loadSave, persist, recordLevel, unlocked } from './save';
import { starsFor, type Stars } from './stars';
import { STORY, T, TRICK_INFO } from './story';
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
    const res = await playLevel(ctx, lv, { intro: () => hud.story(STORY[id]) });
    if (res.exited) return;
    const hasBreath = lv.id !== 1;
    const stars = starsFor(res.stats, hasBreath);
    const zen = recordLevel(save, id, stars);
    if (zen) grantZen(zen);
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
      ],
    });
    if (choice === 'next' && next) return play(next.id);
    if (choice === 'again') return play(id);
  };

  const playEndless = async () => {
    /* Arrives with the finale (phase ג). */
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

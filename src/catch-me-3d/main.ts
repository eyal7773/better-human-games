import '../shared/base.css';
import './styles.css';
import { h } from '../shared/dom';
import { T } from './story';

/**
 * Catch Me (3D) — entry point. Kept tiny: it checks for WebGL and only then
 * loads the game together with three.js (a separate chunk), so no other page
 * ever downloads the 3D engine. There is no fallback mode: without WebGL we
 * point to "Catch Me Simple".
 */

document.title = T.title;
const app = document.getElementById('app')!;

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function message(text: string, link = false) {
  app.replaceChildren(
    h(
      'div',
      { class: 'c3-boot' },
      h('p', {}, text),
      link ? h('a', { class: 'btn warm', href: `${import.meta.env.BASE_URL}catch-me/` }, T.simple) : null,
      link ? h('a', { class: 'c3-boot-home', href: import.meta.env.BASE_URL }, T.home) : null,
    ),
  );
}

if (!webgl()) message(T.noWebgl, true);
else {
  message(T.loading);
  import('./game')
    .then(({ boot }) => {
      app.replaceChildren();
      return boot(app);
    })
    .catch((err) => {
      console.error(err);
      message(T.noWebgl, true);
    });
}

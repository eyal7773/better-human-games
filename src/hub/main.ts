import '../shared/base.css';
import './hub.css';
import { kettleSVG, setKettleMood } from '../shared/kettle';

const holder = document.getElementById('hub-kettle');
if (holder) {
  holder.innerHTML = kettleSVG();
  const svg = holder.querySelector('svg');
  const card = holder.closest('.game-card');
  // Hovering or pressing the card heats the kettle up — a tiny preview of the game.
  const heat = (on: boolean) => setKettleMood(svg, on ? 0.9 : 0);
  card?.addEventListener('pointerenter', () => heat(true));
  card?.addEventListener('pointerleave', () => heat(false));
  card?.addEventListener('focus', () => heat(true));
  card?.addEventListener('blur', () => heat(false));
}

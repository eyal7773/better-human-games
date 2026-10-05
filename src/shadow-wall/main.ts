// The shell first, so each game's styles come after (and win over) the shared ones.
import { Shell } from '../shared/shell';
import './styles.css';
import { h, clamp, lerp, ltr, rand, reducedMotion, Scope } from '../shared/dom';
import { tr } from '../shared/i18n';
import { vibrate } from '../shared/haptics';
import { ANCHOR } from '../shared/anchors';
import { discover } from '../shared/progress';
import { eligible, markSeen, query } from '../shared/library';
import {
  FRAME_HOLD,
  TRUE_M,
  depthAt,
  inFrame,
  magnification,
  monsterness,
  penumbra,
  project,
  starsFor,
  type Response,
  LEVELS,
  migrateLevels,
} from './logic';
import { LEVEL_ICONS, LEVEL_NAMES, MY_LOSSES, SCENES, type Scene } from './content';
import { PUPPET_COLOR, monsterHoles, monsterPath, puppetPath, realThorns } from './puppets';
import { Roar } from './sound';

/**
 * Shadow on the Wall: the small thing throws a monster's shadow because the
 * light is too close. Move the light (real projection physics) until the
 * shadow is its true size, look through two lenses — what was really taken,
 * and is this really a threat — then choose how to answer.
 */

const T = {
  title: tr({ en: 'Shadow on the Wall', he: 'צל על הקיר', ar: 'ظلّ على الحائط' }),
  lede: tr({
    en: 'A small thing can throw a monster’s shadow. Move the light, see its real size — and what was really taken.',
    he: 'דבר קטן יכול להטיל צל של מפלצת. הזיזו את האור, ראו את הגודל האמיתי — ומה באמת נלקח.',
    ar: 'شيء صغير قد يُلقي ظلّ وحش. حرّكوا الضوء، وانظروا حجمه الحقيقي — وما الذي أُخذ حقًا.',
  }),
  gallery: tr({ en: '🖼️ Shadow gallery', he: '🖼️ גלריית הצללים', ar: '🖼️ معرض الظلال' }),
  galleryEmpty: tr({ en: 'Shrink a shadow to hang it here.', he: 'כווצו צל כדי לתלות אותו כאן.', ar: 'قلّصوا ظلًّا لتعلّقوه هنا.' }),
  mine: tr({ en: '✍️ My shadow', he: '✍️ הצל שלי', ar: '✍️ ظلّي' }),
  mineLocked: tr({ en: 'Opens after level 3', he: 'נפתח אחרי שלב 3', ar: 'تُفتح بعد المرحلة 3' }),
  start: tr({ en: 'Pick up the flashlight', he: 'להרים את הפנס', ar: 'التقطوا المصباح' }),
  hintMove: tr({ en: 'Drag the flashlight. Far from the puppet, the shadow shrinks.', he: 'גררו את הפנס. רחוק מהבובה, הצל מתכווץ.', ar: 'اسحبوا المصباح. بعيدًا عن الدمية، يتقلّص الظل.' }),
  hintFrame: tr({
    en: 'Now fit it in the dashed frame. The shadow moves opposite to the light.',
    he: 'עכשיו הכניסו אותו למסגרת המקווקוות. הצל זז הפוך לאור.',
    ar: 'الآن أدخلوه في الإطار المنقّط. الظل يتحرك عكس الضوء.',
  }),
  framed: tr({ en: 'That’s its real size.', he: 'זה הגודל האמיתי שלו.', ar: 'هذا حجمه الحقيقي.' }),
  real: tr({ en: 'Some of it stays. Something real is here.', he: 'חלק ממנו נשאר. יש פה משהו אמיתי.', ar: 'جزء منه يبقى. هناك شيء حقيقي هنا.' }),
  frame: tr({ en: 'real size', he: 'גודל אמיתי', ar: 'الحجم الحقيقي' }),
  flashlight: tr({ en: 'Flashlight', he: 'פנס', ar: 'مصباح' }),
  lensTaken: tr({ en: '🟠 What was really taken from me?', he: '🟠 מה באמת לקחו לי?', ar: '🟠 ما الذي أُخذ مني حقًا؟' }),
  lensThreat: tr({ en: '🔵 Does this threaten my existence?', he: '🔵 זה מאיים על הקיום שלי?', ar: '🔵 هل يهدّد هذا وجودي؟' }),
  alarm: tr({
    en: 'Your body reacted as if it were huge. That’s how alarms work.',
    he: 'הגוף הגיב כאילו זה ענק. ככה אזעקות עובדות.',
    ar: 'تفاعل جسدكم كأنه ضخم. هكذا تعمل أجهزة الإنذار.',
  }),
  alarmReal: tr({
    en: 'Not a threat to your existence — but a line was crossed.',
    he: 'לא מאיים על הקיום — אבל נחצה פה גבול.',
    ar: 'ليس تهديدًا لوجودكم — لكن حدًّا قد تُجووز.',
  }),
  look: tr({ en: 'Look through both lenses, then choose:', he: 'הסתכלו דרך שתי העדשות, ואז בחרו:', ar: 'انظروا عبر العدستين، ثم اختاروا:' }),
  resp: {
    let: tr({ en: '🍃 Let it go / fix the small thing', he: '🍃 לשחרר / לתקן את הדבר הקטן', ar: '🍃 دعوه يمرّ / أصلحوا الشيء الصغير' }),
    boundary: tr({ en: '🗣️ Say a boundary, calmly', he: '🗣️ לומר גבול, בנחת', ar: '🗣️ قولوا حدًّا، بهدوء' }),
    roar: tr({ en: '🦖 Roar back', he: '🦖 לשאוג בחזרה', ar: '🦖 ازأروا بالمقابل' }),
  } as Record<Response, string>,
  roared: tr({
    en: 'Now there are two monsters on the wall. Roaring back makes every shadow bigger.',
    he: 'עכשיו יש שתי מפלצות על הקיר. שאגה בחזרה מגדילה את כל הצללים.',
    ar: 'الآن هناك وحشان على الحائط. الزئير بالمقابل يكبّر كل الظلال.',
  }),
  swallow: tr({
    en: 'Letting this go would mean swallowing something that matters. Try again.',
    he: 'לשחרר פה זה לבלוע משהו שחשוב לכם. נסו שוב.',
    ar: 'تركه يمرّ يعني ابتلاع شيء مهمّ لكم. حاولوا مجددًا.',
  }),
  tooMuch: tr({
    en: 'A boundary over this? A small fix is probably enough.',
    he: 'גבול על זה? כנראה שתיקון קטן מספיק.',
    ar: 'حدّ من أجل هذا؟ غالبًا يكفي إصلاح صغير.',
  }),
  tips: [
    tr({ en: 'Next time: move the light back until the shadow fits', he: 'בפעם הבאה: הרחיקו את הפנס עד שהצל נכנס', ar: 'في المرة القادمة: أبعدوا الضوء حتى يدخل الظل' }),
    tr({ en: 'Next time: look through both lenses before you choose', he: 'בפעם הבאה: הסתכלו דרך שתי העדשות לפני שבוחרים', ar: 'في المرة القادمة: انظروا عبر العدستين قبل أن تختاروا' }),
  ],
  tipLet: tr({ en: 'Next time: small things can be let go', he: 'בפעם הבאה: דבר קטן אפשר לשחרר', ar: 'في المرة القادمة: الأشياء الصغيرة يمكن تركها' }),
  tipReal: tr({ en: 'Next time: when something real is there, a calm boundary', he: 'בפעם הבאה: כשיש משהו אמיתי, גבול בנחת', ar: 'في المرة القادمة: حين يوجد شيء حقيقي، حدّ بهدوء' }),
  doneTitle: tr({ en: 'Back to its real size', he: 'חזרה לגודל האמיתי', ar: 'عاد إلى حجمه الحقيقي' }),
  stars: [
    tr({ en: 'Found its real size', he: 'מצאתם את הגודל האמיתי', ar: 'وجدتم حجمه الحقيقي' }),
    tr({ en: 'Looked through both lenses first', he: 'הסתכלתם דרך שתי העדשות קודם', ar: 'نظرتم عبر العدستين أولًا' }),
    tr({ en: 'A fitting answer, first time', he: 'תגובה מתאימה, כבר בפעם הראשונה', ar: 'ردّ مناسب من المرة الأولى' }),
  ],
  // My shadow
  mineTitle: tr({ en: 'My shadow', he: 'הצל שלי', ar: 'ظلّي' }),
  mineAsk: tr({
    en: 'What annoyed you today? A few words — it stays on this device, and isn’t saved.',
    he: 'מה הרגיז אתכם היום? כמה מילים — זה נשאר במכשיר ולא נשמר.',
    ar: 'ما الذي أزعجكم اليوم؟ بضع كلمات — تبقى على هذا الجهاز ولا تُحفظ.',
  }),
  minePlaceholder: tr({ en: 'e.g. the neighbor’s music at midnight', he: 'למשל: המוזיקה של השכנים בחצות', ar: 'مثلًا: موسيقى الجيران عند منتصف الليل' }),
  safety: tr({
    en: 'If you or someone else is in real danger, reach out now to someone you trust or to emergency services.',
    he: 'אם אתם או מישהו אחר בסכנה אמיתית, פנו עכשיו למישהו שאתם סומכים עליו או לשירותי החירום.',
    ar: 'إن كنتم أنتم أو غيركم في خطر حقيقي، تواصلوا الآن مع شخص تثقون به أو مع خدمات الطوارئ.',
  }),
  mineGo: tr({ en: 'Cast its shadow', he: 'להטיל את הצל', ar: 'ألقوا ظلّه' }),
  minePick: tr({ en: 'Tap what it really took:', he: 'הקישו על מה שזה באמת לקח:', ar: 'اضغطوا على ما أخذه حقًا:' }),
  mineThreat: tr({ en: 'How much does it threaten what matters to you?', he: 'כמה זה מאיים על מה שחשוב לכם?', ar: 'إلى أي حدّ يهدّد ما يهمّكم؟' }),
  mineEnd: tr({
    en: 'Whatever you chose — you looked at its real size first. That’s the whole skill.',
    he: 'מה שלא בחרתם — הסתכלתם קודם על הגודל האמיתי. זו כל המיומנות.',
    ar: 'مهما اخترتم — نظرتم إلى حجمه الحقيقي أولًا. هذه هي المهارة كلها.',
  }),
};

const KEY = 'bhg.shadow-wall.v1';
const shell = new Shell(KEY, T.title, 'sw-theme');
if (migrateLevels(shell.progress)) shell.persist();
const roar = new Roar(shell.audio);

const art = () =>
  h('div', {
    class: 'sw-art',
    html: `<svg viewBox="0 0 200 130" aria-hidden="true"><rect x="0" y="0" width="200" height="130" rx="18" fill="#f3d9a6"/>
    <radialGradient id="swg" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="#fff3cf"/><stop offset="1" stop-color="#e2b877"/></radialGradient>
    <rect x="6" y="6" width="188" height="118" rx="14" fill="url(#swg)"/>
    <path d="M60 110c0-40 10-70 40-78 30 8 40 38 40 78z" fill="#2a1b33" opacity=".85"/><path d="M78 40l-10-28 18 22zM122 40l10-28-18 22z" fill="#2a1b33" opacity=".85"/>
    <ellipse cx="88" cy="62" rx="6" ry="4" fill="#fff3cf"/><ellipse cx="112" cy="62" rx="6" ry="4" fill="#fff3cf"/>
    <path d="M150 118l8-26h10l8 26z" fill="#ff9f1c" stroke="#1d2b4f" stroke-width="3"/></svg>`,
  });

function showMenu() {
  roar.stop();
  shell.menu({
    lede: T.lede,
    art: art(),
    levels: LEVELS.map((l, i) => ({ id: l.id, name: LEVEL_NAMES[i] })),
    extras: [
      { label: T.gallery, onClick: showGallery },
      { label: T.mine, locked: !shell.progress.done.includes(LEVELS[2].id), lockedHint: T.mineLocked, onClick: () => void startMine() },
    ],
    onPlay: (id) => void playLevel(LEVELS.findIndex((l) => l.id === id)),
  });
}

/** A level draws a scene that fits the player's home: fresh ones first; something real when the level asks for it. */
function playLevel(i: number) {
  const l = LEVELS[i];
  const pool = SCENES.filter((s) => s.real === l.real);
  const [scene] = query(pool, { count: 1, diff: l.diff, gentle: i < 2 }).concat(query(pool, { count: 1 }));
  markSeen([scene.id]);
  void play(scene, false, i);
}

async function showGallery() {
  // Only shadows this home can meet count, so the gallery can be filled.
  const mine = SCENES.filter((s) => eligible(s));
  const found = mine.filter((s) => shell.progress.album.includes(s.id));
  await shell.sheet(
    `${T.gallery} · ${found.length}/${mine.length}`,
    found.length
      ? [h('div', { class: 'sw-gallery' }, ...found.map((s) => h('div', { class: 'sw-frame-card' }, h('span', { class: 'sw-frame-emoji' }, s.emoji), h('b', {}, s.name), h('span', {}, s.losses.join(' · ')))))]
      : [h('p', {}, T.galleryEmpty)],
  );
}

async function startMine() {
  const input = h('input', { class: 'sw-input', type: 'text', maxlength: '60', placeholder: T.minePlaceholder, 'aria-label': T.mineAsk }) as HTMLInputElement;
  const c = await shell.card({
    title: T.mineTitle,
    lines: [T.mineAsk, input, h('p', { class: 'sw-safety' }, T.safety)],
    buttons: [
      { id: 'go', label: T.mineGo, cls: 'warm' },
      { id: 'menu', label: tr({ en: 'Back', he: 'חזרה', ar: 'رجوع' }), cls: 'ghost' },
    ],
  });
  if (c !== 'go') return;
  const text = input.value.trim() || T.minePlaceholder;
  void play(
    {
      id: 'mine',
      with: ['none'],
      topics: ['household'],
      setting: 'home',
      diff: 1,
      name: text,
      event: text,
      puppet: 'blob',
      emoji: '🌀',
      losses: [],
      threat: 0,
      right: 'let',
      real: false,
      frameDx: rand(-0.06, 0.06),
      anchor: T.mineEnd,
    },
    true,
  );
}

/** The end card's centrepiece: the thing itself, hung in a gallery frame, with what it really took. */
function framedHero(scene: Scene, count: string) {
  const c = h('canvas', { class: 'sw-hero-art', width: 160, height: 160, 'aria-hidden': 'true' }) as HTMLCanvasElement;
  const x = c.getContext('2d')!;
  x.translate(80, 84);
  x.scale(110, 110);
  puppetPath(x, scene.puppet);
  x.fillStyle = PUPPET_COLOR[scene.puppet];
  x.fill();
  x.lineWidth = 3 / 110;
  x.strokeStyle = '#1d2b4f';
  x.stroke();
  return h(
    'div',
    { class: 'sw-hero' },
    h('div', { class: 'sw-hero-frame' }, c),
    h('b', { class: 'sw-hero-name' }, scene.name),
    scene.losses.length ? h('div', { class: 'sw-hero-tags' }, ...scene.losses.map((l) => h('span', { class: 'sw-tag' }, l))) : null,
    count ? h('small', { class: 'sw-hero-count' }, count) : null,
  );
}

// ------------------------------------------------------------------ play

async function play(scene: Scene, mine = false, level = 0) {
  const scope = new Scope();
  roar.stop();
  shell.clearStage();
  shell.setTitle(mine ? T.mineTitle : scene.name);
  shell.setBack(() => {
    scope.dispose();
    roar.stop();
    showMenu();
  });

  const canvas = h('canvas', { class: 'sw-canvas', 'aria-hidden': 'true' });
  const ctx = canvas.getContext('2d')!;
  const shadowLayer = document.createElement('canvas');
  const sctx = shadowLayer.getContext('2d')!;
  const hint = h('p', { class: 'sh-hint sw-hint' });
  const wallUi = h('div', { class: 'sw-wall-ui' });
  const tags = h('div', { class: 'sw-tags' });
  const gauge = h('div', { class: 'sw-gauge', hidden: true });
  const anchorEl = h('div', { class: 'sw-anchor', hidden: true });
  wallUi.append(tags, gauge, anchorEl);
  const panel = h('div', { class: 'sw-panel', hidden: true });
  // A keyboard handle for the flashlight: arrows move it.
  const lightBtn = h('button', { class: 'sw-light-key', type: 'button', 'aria-label': T.flashlight });
  const root = h('div', { class: 'sw-play' }, canvas, wallUi, hint, panel, lightBtn);
  shell.stage.append(root);

  let W = 0;
  let H = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const geo = { wx: 0, wy: 0, ww: 0, wh: 0, floorTop: 0, floorH: 0, P: 40, cy: 0 };
  const resize = () => {
    W = root.clientWidth;
    H = root.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    // The shadow is blurred anyway: its layer can stay at CSS resolution, which
    // keeps the per-frame blur cheap on phones.
    shadowLayer.width = W;
    shadowLayer.height = H;
    geo.wx = 14;
    geo.wy = 8;
    geo.ww = W - 28;
    geo.wh = Math.round(H * 0.56);
    geo.floorTop = geo.wy + geo.wh + 10;
    geo.floorH = H - geo.floorTop - 10;
    geo.P = clamp(Math.min(geo.ww, geo.wh) * 0.17, 34, 70);
    geo.cy = geo.wy + geo.wh * 0.5;
    wallUi.style.cssText = `left:${geo.wx}px;top:${geo.wy}px;width:${geo.ww}px;height:${geo.wh}px`;
  };
  resize();
  scope.on(window, 'resize', resize);
  const wallX = (u: number) => geo.wx + u * geo.ww;

  // --- state
  const light = { u: 0.54, k: 0.08 }; // u: across the wall (0…1), k: depth along the floor (0 = near)
  let framedFor = 0;
  let framed = false;
  let lens: 'taken' | 'threat' | null = null;
  const usedLens = new Set<string>();
  let firstChoice: Response | null = null;
  /** Whether both lenses had been used when the first answer was chosen. */
  let firstLooked = false;
  let twoMonsters = 0;
  let solved = false;
  let t = 0;
  /** 0 → 1 once the frame locks: the shadow turns into the thing itself. */
  let reveal = 0;
  const frameU = 0.5 + scene.frameDx;
  hint.textContent = T.hintMove;

  // --- dragging the flashlight
  let dragging = -1;
  const moveLight = (x: number, y: number) => {
    if (framed) return;
    light.u = clamp((x - geo.wx) / geo.ww, 0.02, 0.98);
    light.k = clamp((y - geo.floorTop) / geo.floorH, 0, 1);
  };
  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  scope.on<PointerEvent>(canvas, 'pointerdown', (e) => {
    const p = local(e);
    if (p.y < geo.floorTop - 20 || framed) return;
    dragging = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    moveLight(p.x, p.y);
  });
  scope.on<PointerEvent>(canvas, 'pointermove', (e) => {
    if (e.pointerId !== dragging) return;
    const p = local(e);
    moveLight(p.x, p.y);
  });
  scope.on(canvas, 'pointerup', () => (dragging = -1));
  scope.on(canvas, 'pointercancel', () => (dragging = -1));
  scope.on<KeyboardEvent>(lightBtn, 'keydown', (e) => {
    if (framed) return;
    const d = { ArrowLeft: [-0.01, 0], ArrowRight: [0.01, 0], ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] }[e.key];
    if (!d) return;
    e.preventDefault();
    light.u = clamp(light.u + d[0], 0.02, 0.98);
    light.k = clamp(light.k + d[1], 0, 1);
  });

  const physics = () => {
    const m = magnification(depthAt(light.k));
    const sx = project(0.5, light.u, m);
    // The drawn monster always melts away at true size; the growl stays a little when something real is here.
    return { m, sx, monster: monsterness(m), growl: monsterness(m, scene.real ? 0.4 : 0) };
  };

  // --- the frame loop
  let hintedFrame = false;
  scope.loop((dt) => {
    t += dt;
    const { m, sx, monster, growl } = physics();
    if (!framed) {
      if (m < TRUE_M + 0.3 && !hintedFrame) {
        hintedFrame = true;
        hint.textContent = T.hintFrame;
      }
      if (inFrame(sx, m, frameU)) {
        framedFor += dt;
        if (framedFor >= FRAME_HOLD) onFramed();
      } else framedFor = Math.max(0, framedFor - dt * 2);
    }
    roar.update(m, twoMonsters > 0 ? 1 : growl);
    twoMonsters = Math.max(0, twoMonsters - dt);
    if (framed) reveal = Math.min(1, reveal + dt * (reducedMotion() ? 10 : 1.2));
    draw(m, sx, monster);
  });

  function draw(m: number, sx: number, monster: number) {
    const { wx, wy, ww, wh, floorTop, P, cy } = geo;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Floor.
    const fg = ctx.createLinearGradient(0, floorTop - 10, 0, H);
    fg.addColorStop(0, '#6b3f2a');
    fg.addColorStop(1, '#3d2219');
    ctx.fillStyle = fg;
    ctx.fillRect(0, floorTop - 10, W, H - floorTop + 10);
    // Wall, warm plaster.
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 16);
    ctx.clip();
    ctx.fillStyle = '#b98a57';
    ctx.fillRect(wx, wy, ww, wh);
    // The flashlight's pool of light on the wall; a lens tints it.
    const lx = wallX(light.u);
    const tint = lens === 'taken' ? [255, 176, 80] : lens === 'threat' ? [150, 200, 255] : [255, 236, 190];
    const rad = ww * (0.5 + (1 - light.k) * 0.25);
    const lg = ctx.createRadialGradient(lx, cy, 10, lx, cy, rad);
    lg.addColorStop(0, `rgb(${tint.join(',')})`);
    lg.addColorStop(0.55, `rgba(${tint.join(',')},0.55)`);
    lg.addColorStop(1, 'rgba(120,70,40,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(wx, wy, ww, wh);
    // The true-size frame.
    const fs = P * 1.38;
    const fx = wallX(frameU);
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = framed ? 'rgba(16,176,154,.9)' : 'rgba(61,34,25,.55)';
    ctx.strokeRect(fx - fs / 2 - 6, cy - fs / 2 - 6, fs + 12, fs + 12);
    ctx.setLineDash([]);
    ctx.font = `600 11px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body')}`;
    ctx.fillStyle = 'rgba(61,34,25,.7)';
    ctx.textAlign = 'center';
    ctx.fillText(T.frame, fx, cy + fs / 2 + 20);
    // The shadow: puppet + monster parts, painted opaque on their own layer,
    // then laid on the wall softly (a flashlight isn't a point, so the edge blurs).
    const size = P * Math.min(m, 9);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, shadowLayer.width, shadowLayer.height);
    // The monster grows out of the object itself, a little puffed up while it's big.
    const puff = 1 + 0.12 * monster;
    sctx.setTransform(size * puff, 0, 0, size * puff, wallX(sx), cy);
    sctx.fillStyle = '#1e1226';
    puppetPath(sctx, scene.puppet);
    sctx.fill();
    if (monsterPath(sctx, monster, scene.puppet)) sctx.fill();
    // Light through the eye and mouth holes; heavy scenes get a frown, not fangs.
    sctx.globalCompositeOperation = 'destination-out';
    if (monsterHoles(sctx, monster, scene.puppet, !scene.heavy)) sctx.fill();
    sctx.globalCompositeOperation = 'source-over';
    // Your own shadow roaring back.
    if (twoMonsters > 0) {
      const s2 = P * 5.2;
      sctx.setTransform(s2, 0, 0, s2, wx + ww * (sx < 0.5 ? 0.78 : 0.22), cy + wh * 0.1);
      puppetPath(sctx, 'blob');
      sctx.fill();
      if (monsterPath(sctx, 1, 'blob')) sctx.fill();
      sctx.globalCompositeOperation = 'destination-out';
      if (monsterHoles(sctx, 1, 'blob')) sctx.fill();
      sctx.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.filter = `blur(${Math.min(8, penumbra(m) * ww).toFixed(1)}px)`;
    ctx.globalAlpha = 0.82 * (1 - reveal);
    ctx.drawImage(shadowLayer, wx, wy, ww, wh, wx, wy, ww, wh);
    ctx.restore();
    // The "oh, it's just a mug" moment: at true size the shadow turns into the thing itself.
    if (reveal > 0) {
      ctx.save();
      ctx.translate(wallX(sx), cy);
      ctx.globalAlpha = reveal;
      const glow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.1);
      glow.addColorStop(0, 'rgba(255,246,220,.9)');
      glow.addColorStop(1, 'rgba(255,246,220,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-size * 1.2, -size * 1.2, size * 2.4, size * 2.4);
      ctx.scale(size, size);
      puppetPath(ctx, scene.puppet);
      ctx.fillStyle = PUPPET_COLOR[scene.puppet];
      ctx.fill();
      ctx.lineWidth = 3 / size;
      ctx.strokeStyle = '#1d2b4f';
      ctx.stroke();
      ctx.restore();
    }
    // Something real: the thorns that stay glow red.
    if (scene.real && m < 2) {
      ctx.save();
      ctx.translate(wallX(sx), cy);
      ctx.scale(size, size);
      realThorns(ctx, scene.puppet);
      ctx.fillStyle = `rgba(240,67,58,${(0.6 + Math.sin(t * 4) * 0.25).toFixed(3)})`;
      ctx.fill();
      ctx.restore();
    }
    // Vignette and curtains.
    const vg = ctx.createRadialGradient(wx + ww / 2, cy, wh * 0.3, wx + ww / 2, cy, ww);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(40,15,20,.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.restore();
    for (const side of [0, 1]) {
      const cx0 = side ? W - 26 : 0;
      const cg = ctx.createLinearGradient(cx0, 0, cx0 + 26, 0);
      cg.addColorStop(side ? 1 : 0, '#8f1d2c');
      cg.addColorStop(side ? 0 : 1, '#c2344a');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(cx0, 0);
      ctx.lineTo(cx0 + 26, 0);
      ctx.quadraticCurveTo(side ? cx0 + 4 : cx0 + 22, wh * 0.5, side ? cx0 + 16 : cx0 + 10, wh + 14);
      ctx.lineTo(side ? cx0 + 26 : cx0, wh + 14);
      ctx.closePath();
      ctx.fill();
    }
    const px = wallX(0.5);
    // The flashlight where your finger is.
    {
      const fx2 = wallX(light.u);
      const fy2 = geo.floorTop + light.k * geo.floorH;
      ctx.save();
      ctx.translate(fx2, fy2);
      const ang = Math.atan2(cy - fy2, px - fx2);
      ctx.rotate(ang);
      const beam = ctx.createLinearGradient(0, 0, 90, 0);
      beam.addColorStop(0, `rgba(${tint.join(',')},.55)`);
      beam.addColorStop(1, `rgba(${tint.join(',')},0)`);
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(14, -9);
      ctx.lineTo(90, -34);
      ctx.lineTo(90, 34);
      ctx.lineTo(14, 9);
      ctx.fill();
      ctx.fillStyle = '#ffcb2f';
      ctx.strokeStyle = '#1d2b4f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-26, -9, 34, 18, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(6, -13, 12, 26, 4);
      ctx.fillStyle = lens === 'taken' ? '#ff9f1c' : lens === 'threat' ? '#58a6ff' : '#fff4d6';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // The puppet on its stick, just in front of the wall — drawn last, so the flashlight never hides it.
    const py = floorTop + 6;
    ctx.fillStyle = '#5a3a24';
    ctx.fillRect(px - 3, py, 6, 34);
    ctx.fillRect(px - 16, py + 30, 32, 8);
    ctx.save();
    ctx.translate(px, py - P * 0.36);
    ctx.scale(P * 0.7, P * 0.7);
    puppetPath(ctx, scene.puppet);
    ctx.fillStyle = PUPPET_COLOR[scene.puppet];
    ctx.fill();
    ctx.lineWidth = 3 / (P * 0.7);
    ctx.strokeStyle = '#1d2b4f';
    ctx.stroke();
    ctx.restore();
  }

  // --- found the real size: lenses and answers
  function onFramed() {
    framed = true;
    shell.audio.bell(2, 0.9);
    vibrate(25);
    // Name the thing as it appears: the shadow was only this.
    hint.textContent = mine ? T.framed : `${scene.emoji} ${scene.name} · ${scene.real ? T.real : T.framed}`;
    shell.announce(hint.textContent);
    buildPanel();
  }

  let lensA: HTMLButtonElement;
  let lensB: HTMLButtonElement;
  const myLosses = new Set<string>();
  let myThreat = 30;

  function buildPanel() {
    lensA = h('button', { class: 'sw-lens a', type: 'button', 'aria-pressed': 'false' }, T.lensTaken);
    lensB = h('button', { class: 'sw-lens b', type: 'button', 'aria-pressed': 'false' }, T.lensThreat);
    const lensRow = h('div', { class: 'sw-lenses' }, lensA, lensB);
    const extra = h('div', { class: 'sw-extra' });
    const answers = (['let', 'boundary', 'roar'] as Response[]).map((r) => {
      const b = h('button', { class: `btn ${r === 'roar' ? 'ghost' : 'warm'} sw-answer`, type: 'button' }, T.resp[r]);
      scope.on(b, 'click', () => void answer(r));
      return b;
    });
    panel.append(lensRow, extra, h('p', { class: 'sw-look' }, T.look), h('div', { class: 'sw-answers' }, ...answers));
    panel.hidden = false;
    scope.on(lensA, 'click', () => useLens('taken', extra));
    scope.on(lensB, 'click', () => useLens('threat', extra));
  }

  async function useLens(which: 'taken' | 'threat', extra: HTMLElement) {
    lens = which;
    usedLens.add(which);
    lensA.setAttribute('aria-pressed', String(which === 'taken'));
    lensB.setAttribute('aria-pressed', String(which === 'threat'));
    shell.audio.tone({ f: 1400, d: 0.03, g: 0.08, type: 'square', lp: 3000 });
    extra.replaceChildren();
    if (which === 'taken') {
      gauge.hidden = true;
      tags.hidden = false;
      if (mine) {
        const chips = MY_LOSSES.map((l) => {
          const c = h('button', { class: 'sw-chip', type: 'button', 'aria-pressed': String(myLosses.has(l)) }, l);
          c.addEventListener('click', () => {
            if (myLosses.has(l)) myLosses.delete(l);
            else myLosses.add(l);
            c.setAttribute('aria-pressed', String(myLosses.has(l)));
            paintTags([...myLosses], false);
          });
          return c;
        });
        extra.append(h('p', {}, T.minePick), h('div', { class: 'sw-chips' }, ...chips));
        paintTags([...myLosses], false);
      } else paintTags(scene.losses, true);
    } else {
      tags.hidden = true;
      if (mine) {
        const range = h('input', { type: 'range', min: '0', max: '100', value: String(myThreat), class: 'sw-range', 'aria-label': T.mineThreat }) as HTMLInputElement;
        range.addEventListener('input', () => {
          myThreat = Number(range.value);
          paintGauge(myThreat, false);
        });
        extra.append(h('p', {}, T.mineThreat), range);
        paintGauge(myThreat, false);
      } else paintGauge(scene.threat, true);
    }
  }

  function paintTags(list: string[], animate: boolean) {
    tags.replaceChildren(
      ...list.map((l, i) => {
        const el = h('span', { class: 'sw-tag' }, l);
        if (animate && !reducedMotion()) {
          el.style.animationDelay = `${0.4 + i * 0.7}s`;
          el.classList.add('develop');
          scope.timeout(() => shell.audio.bell(4 + i * 2, 0.4), 400 + i * 700);
        }
        return el;
      }),
    );
  }

  /** The needle starts where your body put it (100) and settles on the real value. */
  function paintGauge(value: number, animate: boolean) {
    gauge.hidden = false;
    gauge.innerHTML = `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke="#fff4" stroke-width="10"/>
      <path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke="url(#swgg)" stroke-width="10" stroke-linecap="round"/>
      <linearGradient id="swgg"><stop offset="0" stop-color="#3fdcc2"/><stop offset=".6" stop-color="#ffcb2f"/><stop offset="1" stop-color="#f0433a"/></linearGradient>
      <line class="sw-needle" x1="60" y1="62" x2="60" y2="18" stroke="#1d2b4f" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="62" r="6" fill="#1d2b4f"/></svg>
      <b class="sw-gauge-val"></b><p>${mine ? '' : scene.real ? T.alarmReal : T.alarm}</p>`;
    const needle = gauge.querySelector('.sw-needle') as SVGLineElement;
    const val = gauge.querySelector('.sw-gauge-val') as HTMLElement;
    const set = (v: number) => {
      needle.setAttribute('transform', `rotate(${(-90 + v * 1.8).toFixed(1)} 60 62)`);
      val.textContent = ltr(`${Math.round(v)}%`);
    };
    if (!animate || reducedMotion()) {
      set(value);
      return;
    }
    let lastTick = 100;
    void scope.tween(
      2200,
      (k) => {
        const v = lerp(100, value, k);
        set(v);
        if (lastTick - v >= 10) {
          lastTick = v;
          shell.audio.tick();
        }
      },
      (x) => 1 - Math.pow(1 - x, 3),
    );
  }

  async function answer(r: Response) {
    if (solved) return;
    const looked = usedLens.size === 2;
    if (!firstChoice) {
      firstChoice = r;
      firstLooked = looked;
    }
    if (mine) {
      if (r === 'roar') {
        twoMonsters = 2.5;
        roar.burst();
        hint.textContent = T.roared;
        return;
      }
      return finish(true);
    }
    if (r === 'roar') {
      twoMonsters = 2.8;
      roar.burst();
      shell.fx.shake(root, 8, 400);
      vibrate([30, 40, 30]);
      hint.textContent = T.roared;
      shell.announce(T.roared);
      return;
    }
    if (r !== scene.right) {
      hint.textContent = scene.real ? T.swallow : T.tooMuch;
      shell.audio.miss();
      shell.announce(hint.textContent);
      return;
    }
    finish(false);
  }

  async function finish(isMine: boolean) {
    solved = true;
    panel.hidden = true;
    anchorEl.hidden = false;
    anchorEl.textContent = scene.anchor;
    shell.audio.success();
    const r = anchorEl.getBoundingClientRect();
    shell.fx.confetti(r.left + r.width / 2, r.top + r.height / 2, 26, ['#ffcb2f', '#ff9f1c', '#fff4d6', '#3fdcc2']);
    if (!isMine && discover(shell.progress, scene.id)) shell.persist();
    await scope.sleep(2600);
    if (!scope.alive) return;
    roar.stop();
    if (isMine) {
      const c = await shell.end({
        title: T.doneTitle,
        stars: [],
        zen: 0,
        hero: framedHero(scene, ''),
        anchor: `${ANCHOR.taken} ${ANCHOR.threat}`,
        hasNext: false,
      });
      scope.dispose();
      if (c === 'again') void startMine();
      else showMenu();
      return;
    }
    const stars = starsFor({ framed: true, looked: firstLooked, firstChoice, right: scene.right });
    const zen = shell.finishLevel(LEVELS[level].id, stars);
    const mineScenes = SCENES.filter((x) => eligible(x));
    const hung = mineScenes.filter((x) => shell.progress.album.includes(x.id)).length;
    const c = await shell.end({
      title: T.doneTitle,
      stars: stars.map((on, i) => ({ on, label: T.stars[i], tip: i === 2 ? (scene.real ? T.tipReal : T.tipLet) : T.tips[i] })),
      zen,
      hero: framedHero(scene, `🖼️ ${hung}/${mineScenes.length}`),
      next: level < LEVELS.length - 1 ? { name: LEVEL_NAMES[level + 1], icon: LEVEL_ICONS[level + 1] } : undefined,
      anchor: scene.real ? ANCHOR.boundary : `${ANCHOR.taken} ${ANCHOR.threat}`,
      hasNext: level < LEVELS.length - 1,
    });
    scope.dispose();
    if (c === 'next') playLevel(level + 1);
    else if (c === 'again') void play(scene, false, level);
    else showMenu();
  }

  // The moment, told over the dark theatre while the monster already growls behind it.
  if (!mine) {
    const go = await shell.card({
      title: scene.name,
      art: h('div', { class: 'sw-card-emoji' }, scene.emoji),
      lines: [scene.event],
      buttons: [{ id: 'go', label: T.start, cls: 'warm' }],
    });
    if (!scope.alive || go !== 'go') return;
  }
}

showMenu();

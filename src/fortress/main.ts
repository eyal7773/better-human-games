// The shell first, so each game's styles come after (and win over) the shared ones.
import { Shell } from '../shared/shell';
import './styles.css';
import { h, clamp, ltr, pick, rand, Scope } from '../shared/dom';
import { tr } from '../shared/i18n';
import { vibrate } from '../shared/haptics';
import { ANCHOR } from '../shared/anchors';
import { bump } from '../shared/progress';
import {
  CANNON_COST,
  LEVELS,
  PILLARS,
  SHIELD_COST,
  endlessWave,
  fire,
  looksThreat,
  newState,
  schedule,
  shield,
  spawn,
  standing,
  starsFor,
  step,
  type Hassle,
  type Kind,
  type Level,
  type Pillar,
  type Wave,
} from './logic';
import { BUBBLES, LEVEL_NAMES, PILLAR_INFO, THREATS } from './content';

/**
 * The Fortress: a reverse tower defence. Everyday hassles drift in; most are
 * bubbles that pop harmlessly on the wall and hand your energy back. The anger
 * cannon destroys anything — and its recoil cracks your relationships. Save
 * your energy for a calm shield when a real threat comes.
 */

const T = {
  title: tr({ en: 'The Fortress', he: 'המבצר', ar: 'الحصن' }),
  lede: tr({
    en: 'Hassles drift toward your fortress. Most are bubbles — let them pop. Save your energy for the few that really threaten what matters.',
    he: 'טרדות צפות אל המבצר שלכם. רובן בועות — תנו להן להתפוצץ. שמרו את האנרגיה למעטות שבאמת מאיימות על מה שחשוב.',
    ar: 'مضايقات تطفو نحو حصنكم. معظمها فقاعات — دعوها تنفجر. احفظوا طاقتكم للقليل الذي يهدّد حقًا ما يهمّكم.',
  }),
  endless: tr({ en: '♾️ Endless days', he: '♾️ ימים בלי סוף', ar: '♾️ أيام بلا نهاية' }),
  endlessLocked: tr({ en: 'Opens after level 5', he: 'נפתח אחרי שלב 5', ar: 'تُفتح بعد المرحلة 5' }),
  energy: tr({ en: 'Energy', he: 'אנרגיה', ar: 'الطاقة' }),
  wall: tr({ en: 'Relationships', he: 'יחסים', ar: 'العلاقات' }),
  wave: (n: number, of: number | null) =>
    of ? tr({ en: `Wave ${n} of ${of}`, he: `גל ${n} מתוך ${of}`, ar: `الموجة ${n} من ${of}` }) : tr({ en: `Wave ${n}`, he: `גל ${n}`, ar: `الموجة ${n}` }),
  letGo: tr({ en: 'let go', he: 'שוחררו', ar: 'مرّت' }),
  takes: tr({ en: 'It takes:', he: 'זה לוקח:', ar: 'يأخذ:' }),
  threatens: tr({ en: 'Threatens:', he: 'מאיים על:', ar: 'يهدّد:' }),
  nothing: tr({ en: 'nothing on your list', he: 'שום דבר מהרשימה', ar: 'لا شيء من قائمتكم' }),
  letBe: tr({ en: '🍃 Let it be', he: '🍃 שיעבור', ar: '🍃 دعوه يمرّ' }),
  shieldBtn: tr({ en: `🛡️ Boundary · ${SHIELD_COST}⚡`, he: `🛡️ גבול · ${SHIELD_COST}⚡`, ar: `🛡️ حدّ · ${SHIELD_COST}⚡` }),
  fireBtn: tr({ en: `🔥 Cannon · ${CANNON_COST}⚡`, he: `🔥 תותח · ${CANNON_COST}⚡`, ar: `🔥 مدفع · ${CANNON_COST}⚡` }),
  noEnergy: tr({ en: 'No energy left — it went on bubbles', he: 'אין אנרגיה — היא הלכה על בועות', ar: 'لا طاقة — ذهبت على الفقاعات' }),
  wasted: tr({ en: 'A boundary on a bubble… it would have popped anyway', he: 'גבול על בועה... היא הייתה מתפוצצת בכל מקרה', ar: 'حدّ على فقاعة... كانت ستنفجر على أي حال' }),
  recoil: tr({ en: 'Boom! …and a crack in the relationships', he: 'בום! ...וסדק ביחסים', ar: 'بوم! ...وشرخ في العلاقات' }),
  hit: (p: string) => tr({ en: `Ouch — ${p} took a hit`, he: `אאוץ׳ — ${p} ספג/ה מכה`, ar: `آخ — ${p} تلقّت ضربة` }),
  hint1: tr({
    en: 'Tap a hassle to see what it really takes — or just let it hit the wall.',
    he: 'הקישו על טרדה כדי לראות מה היא באמת לוקחת — או פשוט תנו לה לפגוע בחומה.',
    ar: 'اضغطوا على مضايقة لتروا ما تأخذه حقًا — أو دعوها تصطدم بالسور.',
  }),
  hint2: tr({
    en: 'Spiky ones are real threats. Tap one and raise a 🛡️ boundary.',
    he: 'הקוצניות הן איומים אמיתיים. הקישו על אחת והרימו 🛡️ גבול.',
    ar: 'الشائكة تهديدات حقيقية. اضغطوا على واحدة وارفعوا 🛡️ حدًّا.',
  }),
  hint4: tr({
    en: 'Careful: some threats look like bubbles until they get close.',
    he: 'זהירות: חלק מהאיומים נראים כמו בועות עד שהם מתקרבים.',
    ar: 'انتبهوا: بعض التهديدات تبدو كفقاعات حتى تقترب.',
  }),
  fell: tr({ en: 'The fortress needs a rest', he: 'המבצר צריך מנוחה', ar: 'الحصن يحتاج إلى راحة' }),
  fellWhy: tr({
    en: 'Something that mattered took too many hits. That happens — try again with your energy saved for the spiky ones.',
    he: 'משהו שחשוב ספג יותר מדי מכות. זה קורה — נסו שוב, ושמרו את האנרגיה לקוצניים.',
    ar: 'شيء مهمّ تلقّى ضربات كثيرة. يحدث ذلك — حاولوا مجددًا واحفظوا الطاقة للشائكة.',
  }),
  cracked: tr({
    en: 'The relationship wall cracked from all that cannon fire. Try again — let more bubbles simply pop.',
    he: 'חומת היחסים נסדקה מכל הירי. נסו שוב — תנו ליותר בועות פשוט להתפוצץ.',
    ar: 'تشقّق سور العلاقات من كل ذلك القصف. حاولوا مجددًا — دعوا مزيدًا من الفقاعات تنفجر ببساطة.',
  }),
  retry: tr({ en: 'Try again', he: 'לנסות שוב', ar: 'حاولوا مجددًا' }),
  menu: tr({ en: 'Levels', he: 'שלבים', ar: 'المراحل' }),
  doneTitle: tr({ en: 'The fortress stands', he: 'המבצר עומד', ar: 'الحصن صامد' }),
  endlessTitle: tr({ en: 'End of the days', he: 'סוף הימים', ar: 'نهاية الأيام' }),
  stars: [
    tr({ en: 'The fortress stands', he: 'המבצר עומד', ar: 'الحصن صامد' }),
    tr({ en: 'A calm hand on the cannon', he: 'יד רגועה על התותח', ar: 'يد هادئة على المدفع' }),
    tr({ en: 'A boundary where it mattered', he: 'גבול איפה שזה חשוב', ar: 'حدّ حيث يهمّ' }),
  ],
  summary: (l: number, b: number, s: number) =>
    tr({
      en: `Let go: ${l} · Boundaries: ${b} · Cannon shots: ${s}`,
      he: `שוחררו: ${l} · גבולות: ${b} · יריות: ${s}`,
      ar: `مرّت: ${l} · حدود: ${b} · طلقات: ${s}`,
    }),
  bestLet: (n: number) => tr({ en: `Most let go: ${n}`, he: `הכי הרבה ששוחררו: ${n}`, ar: `أكثر ما مرّ: ${n}` }),
};

const KEY = 'bhg.fortress.v1';
const shell = new Shell(KEY, T.title, 'fo-theme');
const PILLAR_ANGLE: Record<Pillar, number> = { worth: -Math.PI / 2, home: 0, family: Math.PI / 2, health: Math.PI };

const art = () =>
  h('div', {
    class: 'fo-art',
    html: `<svg viewBox="0 0 200 130" aria-hidden="true"><circle cx="100" cy="72" r="54" fill="#7ddc5a"/><circle cx="100" cy="72" r="38" fill="none" stroke="#c9a978" stroke-width="9"/>
    <rect x="86" y="50" width="28" height="40" rx="4" fill="#fff4e0" stroke="#1d2b4f" stroke-width="3"/><path d="M83 52l17-16 17 16z" fill="#f0433a" stroke="#1d2b4f" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="30" cy="30" r="14" fill="#bfe6ff" opacity=".8" stroke="#fff" stroke-width="2"/><circle cx="172" cy="40" r="12" fill="#ffe3f0" opacity=".85" stroke="#fff" stroke-width="2"/>
    <circle cx="165" cy="108" r="12" fill="#5b3a6e" stroke="#2a1b33" stroke-width="2"/><path d="M165 92l3 5h-6zM179 108l-5 3v-6zM151 108l5-3v6z" fill="#2a1b33"/></svg>`,
  });

function showMenu() {
  const allDone = LEVELS.every((l) => shell.progress.done.includes(l.id));
  const best = shell.progress.best.endless ?? 0;
  shell.menu({
    lede: T.lede,
    art: art(),
    levels: LEVELS.map((l, i) => ({ id: l.id, name: LEVEL_NAMES[i] })),
    extras: [{ label: best ? `${T.endless} · 🍃${best}` : T.endless, locked: !allDone, lockedHint: T.endlessLocked, onClick: () => void play(null) }],
    onPlay: (id) => void play(LEVELS.find((l) => l.id === id)!),
  });
}

async function play(level: Level | null) {
  const scope = new Scope();
  const endless = level === null;
  const lvlN = level ? LEVELS.indexOf(level) + 1 : 0;
  shell.clearStage();
  shell.setTitle(level ? LEVEL_NAMES[lvlN - 1] : T.endless);
  // Held in an object: TypeScript can't see the frame loop reassign a plain local.
  const buzz: { stop: (() => void) | null } = { stop: null };
  const hush = () => {
    buzz.stop?.();
    buzz.stop = null;
  };
  const quit = () => {
    hush();
    scope.dispose();
  };
  shell.setBack(() => {
    quit();
    showMenu();
  });

  // --- layout
  const canvas = h('canvas', { class: 'fo-canvas', 'aria-hidden': 'true' });
  const ctx = canvas.getContext('2d')!;
  const bar = (cls: string, icon: string, label: string) => {
    const fill = h('i');
    const el = h('div', { class: `fo-bar ${cls}`, role: 'meter', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('span', { 'aria-hidden': 'true' }, icon), h('b', {}, fill));
    return { el, fill };
  };
  const energyBar = bar('energy', '⚡', T.energy);
  const wallBar = bar('wall', '🧱', T.wall);
  const waveEl = h('span', { class: 'fo-wave' });
  const letEl = h('div', { class: 'fo-let', 'aria-live': 'off' });
  const hint = h('p', { class: 'sh-hint fo-hint' });
  const pop = h('div', { class: 'fo-inspect', hidden: true, role: 'dialog' });
  const root = h('div', { class: 'fo-play' }, canvas, h('div', { class: 'fo-hud' }, energyBar.el, wallBar.el, waveEl), letEl, hint, pop);
  shell.stage.append(root);

  let W = 0;
  let H = 0;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const g = { cx: 0, cy: 0, R: 60, Rs: 400 };
  const resize = () => {
    W = root.clientWidth;
    H = root.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    g.cx = W / 2;
    g.cy = H * 0.52;
    g.R = clamp(Math.min(W, H) * 0.2, 60, 120);
    g.Rs = Math.max(W, H) * 0.56;
  };
  resize();
  scope.on(window, 'resize', resize);
  const posOf = (x: Hassle) => {
    const r = g.R + 14 + x.dist * (g.Rs - g.R - 14);
    return { x: g.cx + Math.cos(x.angle) * r, y: g.cy + Math.sin(x.angle) * r };
  };

  // --- state
  const s = newState();
  let slow = 1;
  let inspecting: Hassle | null = null;
  let t = 0;
  const shieldsFx: { angle: number; life: number }[] = [];
  const bolts: { x: number; y: number; life: number }[] = [];
  let wallShake = 0;

  const paintHud = () => {
    energyBar.fill.style.width = `${s.energy}%`;
    energyBar.el.setAttribute('aria-valuenow', String(Math.round(s.energy)));
    wallBar.fill.style.width = `${s.wall}%`;
    wallBar.el.setAttribute('aria-valuenow', String(Math.round(s.wall)));
    letEl.textContent = `🍃 ${ltr(s.letGo)} ${T.letGo}`;
  };
  paintHud();

  const screen = (p: { x: number; y: number }) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  };

  // --- tapping a hassle opens its card; the world slows while you think
  scope.on<PointerEvent>(canvas, 'pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    let best: Hassle | null = null;
    let bd = 44;
    for (const x of s.hassles) {
      if (x.fate !== 'flying') continue;
      const p = posOf(x);
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < bd) {
        bd = d;
        best = x;
      }
    }
    if (best) openCard(best);
    else closeCard();
  });

  /** Not deciding is deciding: an open card becomes "let it be" after this long. */
  const CARD_MS = 4000;
  let cardTimer = 0;
  scope.add(() => clearTimeout(cardTimer));
  function openCard(x: Hassle) {
    inspecting = x;
    x.inspected = true;
    slow = 0.25;
    shell.audio.tone({ f: 900, d: 0.05, g: 0.06, type: 'triangle' });
    const threat = x.kind === 'threat';
    const info = threat ? THREATS[x.item] : BUBBLES[x.item];
    const p = PILLAR_INFO[x.pillar];
    const letBtn = h('button', { class: 'btn warm fo-act', type: 'button' }, T.letBe);
    const shBtn = h('button', { class: 'btn ghost fo-act', type: 'button' }, T.shieldBtn);
    const fiBtn = h('button', { class: 'btn ghost fo-act fire', type: 'button' }, T.fireBtn);
    letBtn.addEventListener('click', closeCard);
    shBtn.addEventListener('click', () => act(x, 'shield'));
    fiBtn.addEventListener('click', () => act(x, 'fire'));
    pop.replaceChildren(
      ...[
      h('div', { class: 'fo-inspect-head' }, h('span', { class: 'fo-inspect-emoji' }, info.emoji), h('b', {}, info.label)),
      threat
        ? h('p', { class: 'fo-threat' }, `${T.threatens} ${p.emoji} ${p.name}!`)
        : h('p', {}, h('span', { class: 'fo-k' }, T.takes), ' ', (info as (typeof BUBBLES)[number]).takes),
      threat ? null : h('p', { class: 'fo-safe' }, h('span', { class: 'fo-k' }, T.threatens), ' ', T.nothing, ' ', h('span', { class: 'fo-pillars' }, PILLARS.map((q) => PILLAR_INFO[q].emoji).join(''))),
      h('div', { class: 'fo-acts' }, letBtn, shBtn, fiBtn),
      ].filter((n): n is HTMLParagraphElement | HTMLDivElement => n !== null),
    );
    pop.hidden = false;
    // Next to the hassle, kept on screen.
    const at = posOf(x);
    const pw = Math.min(300, W - 20);
    pop.style.width = `${pw}px`;
    pop.style.left = `${clamp(at.x - pw / 2, 10, W - pw - 10)}px`;
    const ph = pop.offsetHeight;
    pop.style.top = `${clamp(at.y < H / 2 ? at.y + 36 : at.y - ph - 36, 50, H - ph - 10)}px`;
    shell.announce(`${info.label}. ${threat ? `${T.threatens} ${p.name}` : `${T.takes} ${(info as (typeof BUBBLES)[number]).takes}`}`);
    letBtn.focus({ preventScroll: true });
    clearTimeout(cardTimer);
    cardTimer = window.setTimeout(() => inspecting === x && closeCard(), CARD_MS);
  }
  function closeCard() {
    clearTimeout(cardTimer);
    inspecting = null;
    pop.hidden = true;
    slow = 1;
  }

  function act(x: Hassle, what: 'fire' | 'shield') {
    const p = screen(posOf(x));
    const refusal = what === 'fire' ? fire(s, x) : shield(s, x);
    closeCard();
    if (refusal === 'energy') {
      shell.fx.floatText(p.x, p.y, T.noEnergy, 'hot');
      shell.audio.miss();
      shell.announce(T.noEnergy);
      return;
    }
    if (refusal) return;
    if (what === 'fire') {
      bolts.push({ ...posOf(x), life: 0.25 });
      shell.fx.sparks(p.x, p.y, '#ff9f1c', 18);
      shell.audio.noise({ d: 0.5, g: 0.45, type: 'lowpass', f: 900, to: 120, q: 1.5 });
      shell.audio.tone({ f: 120, to: 40, d: 0.45, g: 0.35 });
      wallShake = 0.4;
      shell.fx.shake(root, 7, 320);
      vibrate([40, 30, 20]);
      const c = screen({ x: g.cx, y: g.cy - g.R });
      shell.fx.floatText(c.x, c.y, T.recoil, 'hot');
      shell.fx.steam(c.x, c.y + 10, 6, 1.2);
    } else {
      shieldsFx.push({ angle: x.angle, life: 1.1 });
      shell.audio.bell(2, 0.7);
      shell.audio.noise({ d: 0.35, g: 0.15, type: 'highpass', f: 2500 });
      vibrate(20);
      if (x.kind === 'threat') shell.fx.floatText(p.x, p.y, THREATS[x.item].boundary, 'fo-boundary');
      else shell.fx.floatText(p.x, p.y, T.wasted);
    }
    paintHud();
  }

  // --- waves
  let finishedWaves = false;
  let waveNo = 0;
  const runWave = async (w: Wave, speed: number, disguise: boolean) => {
    const plan = schedule(w);
    let clock = 0;
    let next = 0;
    while (scope.alive && standing(s) && (next < plan.length || s.hassles.some((x) => x.fate === 'flying'))) {
      await scope.sleep(50);
      clock += 0.05 * slow;
      while (next < plan.length && plan[next].at <= clock) {
        const kind: Kind = plan[next].kind;
        // A threat comes at the pillar it endangers; a bubble drifts at any of them.
        const item = Math.floor(Math.random() * (kind === 'threat' ? THREATS.length : BUBBLES.length));
        const pillar = kind === 'threat' ? THREATS[item].pillar : pick(PILLARS);
        spawn(s, {
          kind,
          item,
          pillar,
          angle: PILLAR_ANGLE[pillar] + rand(-0.75, 0.75),
          speed: speed * rand(0.9, 1.1),
          disguised: disguise && kind === 'threat',
        });
        next++;
      }
    }
  };

  // --- frame loop
  scope.loop((dt) => {
    t += dt;
    const arrived = step(s, dt * slow);
    for (const x of arrived) {
      const p = screen(posOf(x));
      if (x.fate === 'popped') {
        shell.fx.ring(p.x, p.y, '#bfe6ff', 36);
        shell.audio.pop();
        shell.audio.pluck(s.letGo % 10);
      } else if (x.fate === 'hit') {
        const info = PILLAR_INFO[x.pillar];
        shell.fx.sparks(p.x, p.y, '#5b3a6e', 16);
        shell.fx.floatText(p.x, p.y, T.hit(info.name), 'hot');
        shell.audio.tone({ f: 90, to: 45, d: 0.4, g: 0.4 });
        shell.audio.noise({ d: 0.2, g: 0.3, type: 'lowpass', f: 400 });
        shell.fx.shake(root, 9, 380);
        vibrate(60);
        shell.announce(T.hit(info.name));
      }
      if (inspecting === x) closeCard();
    }
    if (arrived.length) paintHud();
    else if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) paintHud();
    // Many bubbles close by buzz — the itch to fire.
    const close = s.hassles.filter((x) => x.fate === 'flying' && x.kind === 'bubble' && x.dist < 0.35).length;
    if (close >= 3 && !buzz.stop) buzz.stop = shell.audio.buzz();
    else if (close < 2) hush();
    wallShake = Math.max(0, wallShake - dt);
    for (const f of shieldsFx) f.life -= dt;
    for (const b of bolts) b.life -= dt;
    draw();
  });

  const labelFont = getComputedStyle(document.documentElement).getPropertyValue('--font-body') || 'sans-serif';
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const { cx, cy, R } = g;
    const jx = wallShake > 0 ? rand(-3, 3) : 0;
    // Meadow.
    ctx.fillStyle = '#8fd66b';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ccb57';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
    ctx.fill();
    // The relationship wall: cracks as it loses strength.
    ctx.lineWidth = 12;
    ctx.strokeStyle = s.wall > 60 ? '#d9b98a' : s.wall > 30 ? '#c19a66' : '#9c7a52';
    ctx.beginPath();
    ctx.arc(cx + jx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    const cracks = Math.floor((100 - s.wall) / 10);
    ctx.strokeStyle = '#4a3322';
    ctx.lineWidth = 2;
    for (let i = 0; i < cracks; i++) {
      const a = i * 2.39996;
      const x0 = cx + Math.cos(a) * (R - 6);
      const y0 = cy + Math.sin(a) * (R - 6);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(a + 0.6) * 6, y0 + Math.sin(a + 0.6) * 6);
      ctx.lineTo(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6));
      ctx.stroke();
    }
    // Shield arcs.
    for (const f of shieldsFx) {
      if (f.life <= 0) continue;
      ctx.strokeStyle = `rgba(88,166,255,${Math.min(1, f.life).toFixed(3)})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, R + 18, f.angle - 0.5, f.angle + 0.5);
      ctx.stroke();
    }
    // Pillars.
    for (const p of PILLARS) {
      const a = PILLAR_ANGLE[p];
      const px = cx + Math.cos(a) * R * 0.52;
      const py = cy + Math.sin(a) * R * 0.52;
      const hp = s.pillars[p];
      const info = PILLAR_INFO[p];
      const tw = R * 0.34;
      const th = R * 0.42;
      ctx.fillStyle = hp > 0 ? info.color : '#9aa3b8';
      ctx.strokeStyle = '#1d2b4f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(px - tw / 2, py - th / 2, tw, th, 6);
      ctx.fill();
      ctx.stroke();
      ctx.font = `${Math.round(tw * 0.55)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.emoji, px, py - 2);
      // Health pips under it.
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = hp > k * 34 ? '#3fcf6a' : 'rgba(29,43,79,.25)';
        ctx.beginPath();
        ctx.arc(px - 8 + k * 8, py + th / 2 + 7, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Cannon shots.
    for (const b of bolts) {
      if (b.life <= 0) continue;
      ctx.strokeStyle = `rgba(255,120,40,${(b.life * 4).toFixed(3)})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // Hassles.
    for (const x of s.hassles) {
      if (x.fate !== 'flying') continue;
      const p = posOf(x);
      const threat = looksThreat(x);
      const r = threat ? 24 : 22 + Math.sin(t * 3 + x.id) * 1.5;
      if (threat) {
        ctx.fillStyle = '#2a1b33';
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2 + t * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a - 0.2) * r, p.y + Math.sin(a - 0.2) * r);
          ctx.lineTo(p.x + Math.cos(a) * (r + 11), p.y + Math.sin(a) * (r + 11));
          ctx.lineTo(p.x + Math.cos(a + 0.2) * r, p.y + Math.sin(a + 0.2) * r);
          ctx.fill();
        }
        ctx.fillStyle = '#5b3a6e';
      } else {
        const bg = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, 2, p.x, p.y, r);
        bg.addColorStop(0, 'rgba(255,255,255,.95)');
        bg.addColorStop(1, 'rgba(191,230,255,.55)');
        ctx.fillStyle = bg;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = threat ? '#1a0f20' : 'rgba(255,255,255,.95)';
      ctx.stroke();
      if (inspecting === x) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffcb2f';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      const info = x.kind === 'threat' ? THREATS[x.item] : BUBBLES[x.item];
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // A disguised threat wears a random bubble's face until it's revealed.
      const face = threat || x.kind === 'bubble' ? info : BUBBLES[x.id % BUBBLES.length];
      ctx.fillText(face.emoji, p.x, p.y + 1);
      // A short label under it, so you can judge without tapping.
      ctx.font = `600 11px ${labelFont}`;
      const lw = Math.min(130, ctx.measureText(face.label).width + 12);
      ctx.fillStyle = threat ? 'rgba(42,27,51,.85)' : 'rgba(255,255,255,.85)';
      ctx.beginPath();
      ctx.roundRect(p.x - lw / 2, p.y + r + 4, lw, 16, 8);
      ctx.fill();
      ctx.fillStyle = threat ? '#fff' : '#1d2b4f';
      ctx.fillText(face.label, p.x, p.y + r + 12.5, lw - 8);
    }
  }

  // --- the day
  hint.textContent = lvlN === 1 ? T.hint1 : lvlN === 2 ? T.hint2 : lvlN === 4 ? T.hint4 : '';
  scope.timeout(() => (hint.textContent = ''), 9000);
  const waves = level ? level.waves : null;
  while (scope.alive && standing(s)) {
    let w: Wave;
    let speed: number;
    let disguise: boolean;
    if (waves) {
      if (waveNo >= waves.length) {
        finishedWaves = true;
        break;
      }
      w = waves[waveNo];
      speed = level!.speed;
      disguise = level!.disguise;
    } else ({ wave: w, speed, disguise } = endlessWave(waveNo));
    waveNo++;
    waveEl.textContent = T.wave(waveNo, waves ? waves.length : null);
    waveEl.classList.remove('flash');
    void waveEl.offsetWidth;
    waveEl.classList.add('flash');
    await runWave(w, speed, disguise);
    if (!scope.alive) return;
    await scope.sleep(1800);
  }
  if (!scope.alive) return;
  hush();
  closeCard();

  const summary = h('p', { class: 'fo-summary' }, T.summary(s.letGo, s.shields, s.shots));
  if (endless) {
    const record = bump(shell.progress, 'endless', s.letGo);
    shell.persist();
    const c = await shell.end({
      title: T.endlessTitle,
      stars: [],
      zen: 0,
      lines: [summary, h('p', {}, T.bestLet(shell.progress.best.endless ?? 0))],
      record,
      anchor: `${ANCHOR.threat}`,
      hasNext: false,
    });
    quit();
    if (c === 'again') void play(null);
    else showMenu();
    return;
  }
  const lv = level!;
  if (!finishedWaves || !standing(s)) {
    const c = await shell.card({
      title: T.fell,
      lines: [s.wall <= 0 ? T.cracked : T.fellWhy, summary],
      buttons: [
        { id: 'retry', label: T.retry, cls: 'warm' },
        { id: 'menu', label: T.menu, cls: 'ghost' },
      ],
    });
    quit();
    if (c === 'retry') void play(lv);
    else showMenu();
    return;
  }
  const stars = starsFor(s, lv, true);
  const zen = shell.finishLevel(lv.id, stars);
  const record = bump(shell.progress, lv.id, s.letGo);
  shell.persist();
  const c = await shell.end({
    title: T.doneTitle,
    stars: stars.map((on, i) => ({ on, label: T.stars[i] })),
    zen,
    lines: [summary],
    record,
    anchor: `${ANCHOR.taken} ${ANCHOR.threat}`,
    hasNext: lvlN < LEVELS.length,
  });
  quit();
  if (c === 'next') void play(LEVELS[lvlN]);
  else if (c === 'again') void play(lv);
  else showMenu();
}

showMenu();

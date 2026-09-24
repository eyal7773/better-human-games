import { h, ltr } from '../shared/dom';
import { tr } from '../shared/i18n';
import { AudioEngine } from '../shared/audio';
import { FX } from '../shared/fx';
import { vibrate } from '../shared/haptics';
import { kettleSVG } from '../shared/kettle';
import { AVATAR_COLORS, AVATAR_SHAPES, avatarSVG } from '../shared/avatar';
import { MAX_HOT, profile, resetProfile, saveProfile, type Address, type Profile } from '../shared/profile';
import type { HouseholdTag, TopicTag } from '../shared/tags';
import { save as bpSave, persist as bpPersist } from '../boiling-point/save';

/**
 * "My home": a character builder instead of a settings form. You make a little
 * toy character, fill its house with who lives with you, and stick your hot
 * buttons on the door — and the games quietly pick situations that fit.
 */

const REWARD = 10;

const HOUSEHOLD: { tag: HouseholdTag; icon: string; label: string; sub?: string }[] = [
  { tag: 'parent-young-child', icon: '👶', label: tr({ en: 'Little kid', he: 'ילד קטן', ar: 'طفل صغير' }), sub: tr({ en: 'ages 0–6', he: `גילאי ${ltr('0–6')}`, ar: 'من 0 إلى 6' }) },
  { tag: 'parent-school-age', icon: '🎒', label: tr({ en: 'School-age kid', he: 'ילד בגיל בית ספר', ar: 'طفل في سنّ المدرسة' }), sub: tr({ en: 'ages 6–12', he: `גילאי ${ltr('6–12')}`, ar: 'من 6 إلى 12' }) },
  { tag: 'parent-teen', icon: '🎧', label: tr({ en: 'Teenager', he: 'מתבגר', ar: 'مراهق' }) },
  { tag: 'single-parent', icon: '🦸', label: tr({ en: 'I’m a single parent', he: 'אני הורה יחידני', ar: 'أنا والد وحيد' }) },
  { tag: 'partner', icon: '💞', label: tr({ en: 'Partner', he: 'בן או בת זוג', ar: 'شريك الحياة' }) },
  { tag: 'adult-child', icon: '👵', label: tr({ en: 'An ageing parent I look after', he: 'הורה מבוגר שבטיפולי', ar: 'والد مسنّ أعتني به' }) },
  { tag: 'grandparent', icon: '🧸', label: tr({ en: 'Grandkids', he: 'נכדים', ar: 'أحفاد' }) },
  { tag: 'no-kids', icon: '🌿', label: tr({ en: 'No kids', he: 'בלי ילדים', ar: 'بلا أطفال' }) },
];
const KID_TAGS: HouseholdTag[] = ['parent-young-child', 'parent-school-age', 'parent-teen', 'single-parent'];

const HOT: { tag: TopicTag; icon: string; label: string }[] = [
  { tag: 'mess', icon: '🧦', label: tr({ en: 'Mess', he: 'בלגן', ar: 'فوضى' }) },
  { tag: 'morning-rush', icon: '⏰', label: tr({ en: 'Mornings', he: 'בקרים', ar: 'الصباح' }) },
  { tag: 'bedtime', icon: '🌙', label: tr({ en: 'Bedtime', he: 'שינה', ar: 'النوم' }) },
  { tag: 'screens', icon: '📱', label: tr({ en: 'Screens', he: 'מסכים', ar: 'الشاشات' }) },
  { tag: 'money', icon: '💸', label: tr({ en: 'Money', he: 'כסף', ar: 'المال' }) },
  { tag: 'noise', icon: '🔊', label: tr({ en: 'Noise', he: 'רעש', ar: 'الضجيج' }) },
  { tag: 'chores', icon: '🧺', label: tr({ en: 'Chores', he: 'מטלות', ar: 'مهام البيت' }) },
  { tag: 'mealtime', icon: '🍽️', label: tr({ en: 'Mealtimes', he: 'ארוחות', ar: 'الوجبات' }) },
  { tag: 'homework', icon: '📚', label: tr({ en: 'Homework', he: 'שיעורי בית', ar: 'الواجبات' }) },
  { tag: 'siblings', icon: '🤼', label: tr({ en: 'Sibling fights', he: 'ריבים בין אחים', ar: 'شجار الإخوة' }) },
  { tag: 'in-laws', icon: '🏡', label: tr({ en: 'Extended family', he: 'המשפחה המורחבת', ar: 'العائلة الكبيرة' }) },
  { tag: 'work-life', icon: '💼', label: tr({ en: 'Work vs. home', he: 'עבודה מול בית', ar: 'العمل والبيت' }) },
];

const ADDRESS: { v: Address; label: string }[] = [
  { v: 'f', label: tr({ en: 'Feminine', he: 'את', ar: 'أنتِ' }) },
  { v: 'm', label: tr({ en: 'Masculine', he: 'אתה', ar: 'أنتَ' }) },
  { v: 'x', label: tr({ en: 'Neutral', he: 'אתם', ar: 'أنتم' }) },
];

const T = {
  next: tr({ en: 'Next', he: 'הבא', ar: 'التالي' }),
  back: tr({ en: 'Back', he: 'חזרה', ar: 'رجوع' }),
  close: tr({ en: 'Close', he: 'סגירה', ar: 'إغلاق' }),
  later: tr({ en: 'Later', he: 'אחר כך', ar: 'لاحقًا' }),
};

const KEY_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M11 12h10M17.5 12v3.5M20.5 12v2.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

let audio: AudioEngine | null = null;
let fx: FX | null = null;
const sound = () => (audio ??= new AudioEngine(bpSave.muted));

export function openHomeBuilder(opts: { edit?: boolean; onChange?: () => void } = {}) {
  document.querySelector('.hb')?.remove();
  const draft: Profile = structuredClone(profile);
  if (draft.status !== 'done') draft.address = 'x';
  const first = !opts.edit && profile.status === 'new';
  let step = first ? 0 : 1;

  const keys = h('div', { class: 'hb-keys', 'aria-hidden': 'true' }, ...[1, 2, 3, 4].map(() => h('span', { class: 'hb-key', html: KEY_ICON })));
  const closeBtn = h('button', { class: 'hb-x', type: 'button', 'aria-label': T.close, html: '&times;' });
  const body = h('div', { class: 'hb-body' });
  const backBtn = h('button', { class: 'hb-back link', type: 'button' }, T.back);
  const nextBtn = h('button', { class: 'btn hb-next', type: 'button' }, T.next);
  const foot = h('div', { class: 'hb-foot' }, backBtn, nextBtn);
  const card = h('div', { class: 'hb-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hb-title' }, h('div', { class: 'hb-top' }, keys, closeBtn), body, foot);
  const root = h('div', { class: 'hb' }, h('div', { class: 'hb-bg', 'aria-hidden': 'true' }), card);
  document.body.append(root);
  document.documentElement.classList.add('hb-open');

  const tap = () => {
    sound().unlock();
    vibrate(8);
  };

  function close() {
    // Closing the first-time builder counts as "later": it won't pop up again.
    if (profile.status === 'new') {
      profile.status = 'skipped';
      saveProfile();
    }
    root.classList.add('leaving');
    document.documentElement.classList.remove('hb-open');
    setTimeout(() => root.remove(), 220);
    opts.onChange?.();
  }
  closeBtn.addEventListener('click', close);
  root.addEventListener('keydown', (e) => e.key === 'Escape' && close());

  function finish() {
    const reward = !profile.rewarded;
    Object.assign(profile, draft, { status: 'done', rewarded: true });
    saveProfile();
    if (reward) {
      bpSave.zen += REWARD;
      bpPersist();
    }
    opts.onChange?.();
    go(4, reward);
  }

  function go(n: number, reward = false) {
    step = n;
    keys.querySelectorAll('.hb-key').forEach((k, i) => {
      k.classList.toggle('on', i < step - 1 || step === 4);
      k.classList.toggle('now', i === step - 1);
    });
    keys.hidden = step === 0;
    foot.hidden = step === 0 || step === 4;
    backBtn.style.visibility = step > 1 && step < 4 ? 'visible' : 'hidden';
    nextBtn.textContent = step === 3 ? tr({ en: 'Done!', he: 'סיימתי!', ar: 'انتهيت!' }) : T.next;
    const view = [welcome, character, household, hotButtons, () => done(reward)][step]();
    view.classList.add('hb-step');
    body.replaceChildren(view);
    (view.querySelector('h2') as HTMLElement | null)?.focus({ preventScroll: true });
  }
  backBtn.addEventListener('click', () => {
    tap();
    sound().whoosh();
    go(step - 1);
  });
  nextBtn.addEventListener('click', () => {
    tap();
    if (step === 3) return finish();
    sound().whoosh();
    go(step + 1);
  });

  // ---------------------------------------------------------------- 0 welcome
  function welcome() {
    const kettle = h('div', { class: 'hb-kettle', html: kettleSVG() });
    return h(
      'div',
      { class: 'hb-welcome' },
      kettle,
      h('h2', { id: 'hb-title', tabindex: '-1' }, tr({ en: 'Hi! Let’s make you a character', he: 'היי! בואו נבנה לכם דמות', ar: 'أهلًا! تعالوا نصنع لكم شخصية' })),
      h(
        'p',
        {},
        tr({
          en: 'A few tiny choices, and the games will fit themselves to your home.',
          he: 'כמה בחירות קטנות, והמשחקים יתאימו את עצמם לבית שלכם.',
          ar: 'بضعة اختيارات صغيرة، وتتكيّف الألعاب مع بيتكم.',
        }),
      ),
      h('button', { class: 'btn warm hb-go', type: 'button', onclick: () => (tap(), sound().success(), go(1)) }, tr({ en: 'Let’s go!', he: 'בואו!', ar: 'يلا!' })),
      h('button', { class: 'link', type: 'button', onclick: close }, T.later),
    );
  }

  // ---------------------------------------------------------------- 1 character
  function character() {
    const figure = h('button', { class: 'hb-avatar', type: 'button', 'aria-label': tr({ en: 'Poke your character', he: 'לגעת בדמות', ar: 'المسوا شخصيتكم' }) });
    const paint = () => {
      figure.innerHTML = avatarSVG(draft.shape, draft.color);
      figure.classList.remove('boing');
      void figure.offsetWidth;
      figure.classList.add('boing');
    };
    figure.addEventListener('click', () => (tap(), sound().giggle(), paint()));
    const turn = (d: number) => () => {
      tap();
      sound().pop();
      draft.shape = (draft.shape + d + AVATAR_SHAPES) % AVATAR_SHAPES;
      paint();
    };
    const arrow = (d: number, label: string, glyph: string) =>
      h('button', { class: 'hb-arrow', type: 'button', 'aria-label': label, onclick: turn(d) }, glyph);
    const swatches = h(
      'div',
      { class: 'hb-swatches', role: 'radiogroup', 'aria-label': tr({ en: 'Colour', he: 'צבע', ar: 'اللون' }) },
      ...AVATAR_COLORS.map((c, i) => {
        const b = h('button', { class: 'hb-swatch', type: 'button', role: 'radio', 'aria-checked': String(draft.color === i), style: { background: c } });
        b.addEventListener('click', () => {
          tap();
          sound().coin(i);
          draft.color = i;
          swatches.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
          paint();
        });
        return b;
      }),
    );
    const address = h(
      'div',
      { class: 'segmented hb-address', role: 'radiogroup', 'aria-labelledby': 'hb-address' },
      ...ADDRESS.map((a) => {
        const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(draft.address === a.v) }, a.label);
        b.addEventListener('click', () => {
          tap();
          sound().pop();
          draft.address = a.v;
          address.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        });
        return b;
      }),
    );
    paint();
    // Arrows point the way they move in the reading direction.
    const rtl = document.documentElement.dir === 'rtl';
    return h(
      'div',
      {},
      h('h2', { id: 'hb-title', tabindex: '-1' }, tr({ en: 'This is you', he: 'זה אתם', ar: 'هذا أنتم' })),
      h('div', { class: 'hb-stage' }, arrow(-1, tr({ en: 'Previous shape', he: 'הצורה הקודמת', ar: 'الشكل السابق' }), rtl ? '▶' : '◀'), figure, arrow(1, tr({ en: 'Next shape', he: 'הצורה הבאה', ar: 'الشكل التالي' }), rtl ? '◀' : '▶')),
      swatches,
      h('h3', { id: 'hb-address' }, tr({ en: 'How should we address you?', he: 'איך לפנות אליכם?', ar: 'كيف نخاطبكم؟' })),
      address,
      h('p', { class: 'hb-note' }, tr({ en: 'This only helps pick situations that fit you.', he: 'זה רק עוזר לבחור מצבים שמתאימים לכם.', ar: 'هذا يساعد فقط في اختيار مواقف تناسبكم.' })),
      profile.status === 'done' ? resetButton() : null,
    );
  }

  // Two taps, like "Reset progress" in Boiling Point, so it can't happen by accident.
  function resetButton() {
    let armed = false;
    const b = h('button', { class: 'link hb-reset', type: 'button' }, tr({ en: 'Delete my home', he: 'מחיקת הבית שלי', ar: 'حذف بيتي' }));
    b.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        b.textContent = tr({ en: 'Sure? Tap again to delete', he: 'בטוחים? לחצו שוב כדי למחוק', ar: 'متأكدون؟ اضغطوا مرة أخرى للحذف' });
        return;
      }
      resetProfile();
      close();
    });
    return b;
  }

  // ---------------------------------------------------------------- 2 household
  function house() {
    const residents = h('div', { class: 'hb-residents' }, h('span', { class: 'hb-me', html: avatarSVG(draft.shape, draft.color) }));
    for (const t of draft.household) {
      const item = HOUSEHOLD.find((x) => x.tag === t);
      if (item && t !== 'no-kids' && t !== 'single-parent') residents.append(h('span', { class: 'hb-res', 'data-tag': t }, item.icon));
    }
    return h('div', { class: 'hb-house', 'aria-hidden': 'true' }, h('div', { class: 'hb-roof' }), residents);
  }

  function household() {
    let houseEl = house();
    const refresh = (added?: HouseholdTag) => {
      const next = house();
      if (added) next.querySelector(`[data-tag="${added}"]`)?.classList.add('pop');
      houseEl.replaceWith(next);
      houseEl = next;
    };
    const tiles = h(
      'div',
      { class: 'hb-tiles', role: 'group', 'aria-labelledby': 'hb-title' },
      ...HOUSEHOLD.map((item) => {
        const b = h(
          'button',
          { class: 'hb-tile', type: 'button', 'aria-pressed': String(draft.household.includes(item.tag)), 'data-tag': item.tag },
          h('span', { class: 'hb-tile-icon' }, item.icon),
          h('span', { class: 'hb-tile-label' }, item.label, item.sub ? h('small', {}, item.sub) : null),
        );
        b.addEventListener('click', () => {
          tap();
          const on = !draft.household.includes(item.tag);
          let set = draft.household.filter((t) => t !== item.tag);
          if (on) {
            // "No kids" and the kid tiles can't both be true.
            if (item.tag === 'no-kids') set = set.filter((t) => !KID_TAGS.includes(t));
            if (KID_TAGS.includes(item.tag)) set = set.filter((t) => t !== 'no-kids');
            set.push(item.tag);
          }
          draft.household = set;
          if (on) sound().pop();
          else sound().slip();
          tiles.querySelectorAll<HTMLElement>('.hb-tile').forEach((x) => x.setAttribute('aria-pressed', String(set.includes(x.dataset.tag as HouseholdTag))));
          refresh(on ? item.tag : undefined);
        });
        return b;
      }),
    );
    return h(
      'div',
      {},
      h('h2', { id: 'hb-title', tabindex: '-1' }, tr({ en: 'Who’s at home with you?', he: 'מי גר איתכם?', ar: 'مَن يعيش معكم؟' })),
      h('p', { class: 'hb-lede' }, tr({ en: 'Pick everyone that fits.', he: 'בחרו את כל מי שמתאים.', ar: 'اختاروا كل من ينطبق.' })),
      houseEl,
      tiles,
    );
  }

  // ---------------------------------------------------------------- 3 hot buttons
  function hotButtons() {
    const door = h('div', { class: 'hb-door', 'aria-hidden': 'true' });
    const count = h('p', { class: 'hb-count', 'aria-live': 'polite' });
    const paintDoor = (added?: TopicTag) => {
      door.replaceChildren(
        h('span', { class: 'hb-knob' }),
        ...draft.hot.map((t, i) => h('span', { class: `hb-sticker s${i}${t === added ? ' pop' : ''}` }, HOT.find((x) => x.tag === t)?.icon ?? '')),
      );
      count.textContent = `${draft.hot.length} / ${MAX_HOT}`;
    };
    const chips = h(
      'div',
      { class: 'hb-chips', role: 'group', 'aria-labelledby': 'hb-title' },
      ...HOT.map((item) => {
        const b = h('button', { class: 'hb-chip', type: 'button', 'aria-pressed': String(draft.hot.includes(item.tag)) }, h('span', {}, item.icon), item.label);
        b.addEventListener('click', () => {
          tap();
          if (draft.hot.includes(item.tag)) {
            draft.hot = draft.hot.filter((t) => t !== item.tag);
            sound().slip();
            paintDoor();
          } else if (draft.hot.length >= MAX_HOT) {
            sound().miss();
            b.classList.remove('nope');
            void b.offsetWidth;
            b.classList.add('nope');
            count.classList.remove('nope');
            void count.offsetWidth;
            count.classList.add('nope');
            return;
          } else {
            draft.hot = [...draft.hot, item.tag];
            sound().pop();
            paintDoor(item.tag);
          }
          b.setAttribute('aria-pressed', String(draft.hot.includes(item.tag)));
        });
        return b;
      }),
    );
    paintDoor();
    return h(
      'div',
      {},
      h('h2', { id: 'hb-title', tabindex: '-1' }, tr({ en: 'What sets you off the most?', he: 'מה הכי מקפיץ אתכם?', ar: 'ما الذي يستفزّكم أكثر؟' })),
      h('p', { class: 'hb-lede' }, tr({ en: 'Stick up to 3 on your door. These will come up more often.', he: 'הדביקו עד 3 על הדלת. הם יופיעו יותר.', ar: 'ألصقوا حتى 3 على الباب. ستظهر أكثر.' })),
      h('div', { class: 'hb-door-row' }, door, count),
      chips,
    );
  }

  // ---------------------------------------------------------------- 4 done
  function done(reward: boolean) {
    const houseEl = house();
    houseEl.classList.add('hb-house-done');
    const view = h(
      'div',
      { class: 'hb-done' },
      houseEl,
      h('h2', { id: 'hb-title', tabindex: '-1' }, tr({ en: 'Your home is ready!', he: 'הבית שלכם מוכן!', ar: 'بيتكم جاهز!' })),
      reward
        ? h('p', { class: 'hb-reward' }, tr({ en: `+${REWARD} zen points for Boiling Point`, he: `+${REWARD} נקודות זן ב"נקודת רתיחה"`, ar: `+${REWARD} نقاط هدوء في «نقطة الغليان»` }))
        : h('p', { class: 'hb-lede' }, tr({ en: 'Saved. The games will pick situations that fit.', he: 'נשמר. המשחקים יבחרו מצבים שמתאימים לכם.', ar: 'تم الحفظ. ستختار الألعاب مواقف تناسبكم.' })),
      h('button', { class: 'btn warm hb-go', type: 'button', onclick: close }, tr({ en: 'Let’s play!', he: 'יאללה לשחק!', ar: 'يلا نلعب!' })),
    );
    requestAnimationFrame(() => {
      sound().success();
      vibrate([20, 40, 20]);
      fx ??= new FX(document.body);
      const r = card.getBoundingClientRect();
      fx.confetti(r.left + r.width / 2, r.top + r.height * 0.3, 60, ['#ffcb2f', '#2f9bff', '#3fcf6a', '#ff5a4e', '#9a6bff']);
    });
    return view;
  }

  go(step);
}

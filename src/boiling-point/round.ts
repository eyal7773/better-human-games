import { h, clamp, ltr, pick, rand, Scope } from '../shared/dom';
import type { AudioEngine } from '../shared/audio';
import { vibrate } from '../shared/haptics';
import { setKettleMood } from '../shared/kettle';
import type { FX } from '../shared/fx';
import { type HUD, heatGradient, toCelsius } from './hud';
import type { Dilemma } from './content';
import type { Task, TaskCtx } from './tasks/types';
import { OrderTask } from './tasks/order';
import { SortTask } from './tasks/sort';
import { PairsTask } from './tasks/pairs';
import type { Calm, CalmCtx } from './calm/types';
import { BreathCalm } from './calm/breath';
import { SlideCalm } from './calm/slide';
import { HeartCalm } from './calm/heartbeat';
import { type Mischief, unleash } from './gremlins';
import { runChoice, type ChoiceOutcome } from './choice';
import { tr } from '../shared/i18n';

export type TaskKind = 'order' | 'sort' | 'pairs';
export type CalmKind = 'breath' | 'slide' | 'heart';

export interface RoundSpec {
  clock: string;
  task: TaskKind;
  calm: CalmKind;
  dilemma: Dilemma;
  level: number;
  coach: boolean; // show first-time guidance
  choiceSeconds: number;
}

export interface RoundResult {
  outcome: 'noticed' | 'forced' | 'finished' | 'boiled';
  choice: ChoiceOutcome | null;
  pauseC: number | null; // °C when the player paused
  peakC: number;
  impulsive: number;
  taskDone: boolean;
  samples: number[]; // heat 0..100, every 250ms
  pauseSample: number | null;
  points: { notice: number; calm: number; response: number; bonus: number };
  total: number;
}

/** Elements of the play screen a round draws into. */
export interface PlayView {
  root: HTMLElement;
  hud: HUD;
  clock: HTMLElement;
  title: HTMLElement;
  hint: HTMLElement;
  kettle: SVGElement;
  board: HTMLElement;
  pauseBtn: HTMLButtonElement;
  layer: HTMLElement;
  modal: HTMLElement;
}

interface Tuning {
  disruptAt: number;
  passive: number;
  spawnEvery: number;
  taskMischief: Mischief[];
  calmMischief: Mischief[];
}

function tuning(level: number): Tuning {
  const taskMischief: Mischief[] = ['thief', 'thief', 'shouter', 'notif'];
  if (level >= 1) taskMischief.push('shuffler', 'fly');
  if (level >= 2) taskMischief.push('flicker', 'thief', 'shuffler');
  const calmMischief: Mischief[] = ['shouter', 'notif', 'lure'];
  if (level >= 1) calmMischief.push('fly', 'lure');
  if (level >= 2) calmMischief.push('flicker', 'shouter');
  return {
    disruptAt: Math.max(2400, 5200 - level * 550),
    passive: 2.4 + level * 0.8,
    spawnEvery: Math.max(1050, 2500 - level * 300),
    taskMischief,
    calmMischief,
  };
}

const FORCED_AT = 85;

export function playRound(view: PlayView, spec: RoundSpec, audio: AudioEngine, fx: FX) {
  const r = new Round(view, spec, audio, fx);
  return { done: r.run(), abort: () => r.abort() };
}

class Round {
  private master = new Scope();
  private heat = 10;
  private peak = 10;
  private impulsive = 0;
  private samples: number[] = [];
  private pauseSample: number | null = null;
  private pauseHeat: number | null = null;
  private phase: 'intro' | 'task' | 'calm' | 'choice' | 'end' = 'intro';
  private disrupting = false;
  private taskDone = false;
  private taps: number[] = [];
  private coachedTaps = false;
  private t: Tuning;
  private boil!: Promise<'boiled'>;
  private triggerBoil!: () => void;
  private forceCalm: (() => void) | null = null;

  constructor(
    private v: PlayView,
    private spec: RoundSpec,
    private audio: AudioEngine,
    private fx: FX,
  ) {
    this.t = tuning(spec.level);
    this.boil = new Promise((res) => (this.triggerBoil = () => res('boiled')));
  }

  async run(): Promise<RoundResult> {
    this.startLoop();
    await this.intro();
    const taskOutcome = await this.taskPhase();
    if (taskOutcome === 'boiled') return this.finish('boiled', null);
    const calmOutcome = await this.calmPhase(taskOutcome);
    if (calmOutcome === 'boiled') return this.finish('boiled', null);
    this.phase = 'choice';
    const choice = await runChoice(this.v.modal, this.master, this.audio, this.spec.dilemma, this.spec.choiceSeconds);
    return this.finish(taskOutcome, choice);
  }

  abort() {
    this.phase = 'end';
    this.master.dispose();
    this.audio.setWhistle(0);
  }

  // ---------- heat ----------

  private addHeat = (delta: number, x?: number, y?: number, label?: string) => {
    if (this.phase === 'choice' || this.phase === 'end' || this.phase === 'intro') return;
    this.heat = clamp(this.heat + delta, 0, 100);
    this.peak = Math.max(this.peak, this.heat);
    if (delta >= 2 && x != null && y != null) {
      this.fx.sparks(x, y, '#ff6b4a', 8);
      if (label) this.fx.floatText(x, y - 10, `${ltr(`+${Math.round(delta * 0.8)}°`)} ${label}`, 'hot');
    }
    if (delta >= 3) {
      this.v.kettle.animate(
        [{ transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'none' }],
        { duration: 220 },
      );
    }
    if (delta >= 5) this.fx.shake(this.v.board, 5, 260);
    if (this.heat >= 100) this.triggerBoil();
  };

  private startLoop() {
    const m = this.master;
    let sampleAcc = 0;
    let steamAcc = 0;
    let tickAcc = 0;
    m.loop((dt) => {
      if (this.phase === 'task' && this.disrupting) this.addHeat(this.t.passive * dt);
      else if (this.phase === 'calm') this.addHeat(0.6 * dt);
      else if (this.phase === 'task') this.heat = Math.max(8, this.heat - 2 * dt);

      if (this.phase === 'task' && this.heat >= FORCED_AT) this.forceCalm?.();

      const h01 = this.heat / 100;
      this.v.hud.setHeat(this.heat);
      this.v.root.style.setProperty('--heat', h01.toFixed(3));
      this.v.root.style.background = heatGradient(h01);
      setKettleMood(this.v.kettle, h01);
      this.audio.setWhistle(this.phase === 'end' || this.phase === 'choice' ? 0 : clamp((this.heat - 48) / 52, 0, 1));

      steamAcc += dt * (1 + h01 * 16);
      if (steamAcc >= 1 && this.phase !== 'end') {
        steamAcc = 0;
        const r = this.v.kettle.getBoundingClientRect();
        // Spout tip sits at the kettle's upper-left in the SVG.
        this.fx.steam(r.left + r.width * 0.08, r.top + r.height * 0.36, 1, 0.4 + h01);
      }
      if (h01 > 0.7 && Math.random() < dt * 10 * (h01 - 0.6)) this.fx.embers(1);

      if (this.phase === 'task' || this.phase === 'calm') {
        sampleAcc += dt;
        if (sampleAcc >= 0.25) {
          sampleAcc = 0;
          this.samples.push(this.heat);
        }
      }
      // Ticking clock that speeds up with the heat.
      if (this.disrupting && this.phase === 'task') {
        tickAcc += dt;
        const every = 1 - h01 * 0.72;
        if (tickAcc >= every) {
          tickAcc = 0;
          this.audio.tick(h01 > 0.6);
        }
      }
    });

    // Agitated tapping anywhere raises the heat — the core "restraint" measurement.
    m.on<PointerEvent>(
      this.v.root,
      'pointerdown',
      (e) => {
        if (this.phase !== 'task' && this.phase !== 'calm') return;
        const now = performance.now();
        this.taps = this.taps.filter((t) => now - t < 1000);
        this.taps.push(now);
        if (this.taps.length >= 5) {
          this.impulsive++;
          this.taps = this.taps.slice(-2);
          this.audio.sizzle();
          vibrate(50);
          this.addHeat(4, e.clientX, e.clientY, tr({ en: 'agitated taps', he: 'לחיצות עצבניות', ar: 'نقرات عصبية' }));
          if (!this.coachedTaps) {
            this.coachedTaps = true;
            this.toast(tr({ en: 'Fast, agitated tapping heats you up. Slowly.', he: 'לחיצות מהירות ועצבניות מחממות. לאט.', ar: 'النقرات السريعة والعصبية ترفع الحرارة. ببطء.' }));
          }
        }
      },
      { capture: true },
    );
  }

  // ---------- phases ----------

  private async intro() {
    this.v.clock.textContent = this.spec.clock;
    this.v.title.textContent = '';
    this.v.hint.textContent = '';
    this.v.board.replaceChildren();
    const card = h(
      'div',
      { class: 'round-intro' },
      h('div', { class: 'ri-clock' }, this.spec.clock),
      h('p', { class: 'ri-title' }, this.taskTitle()),
    );
    this.v.modal.append(card);
    await this.master.sleep(1700);
    card.classList.add('leaving');
    await this.master.sleep(300);
    card.remove();
  }

  private taskTitle() {
    return { order: tr({ en: 'A chore, in order', he: 'משימה לפי הסדר', ar: 'مهمة بالترتيب' }), sort: tr({ en: 'Tidy the living room', he: 'לסדר את הסלון', ar: 'ترتيب غرفة الجلوس' }), pairs: tr({ en: 'Sock pairs', he: 'זוגות גרביים', ar: 'أزواج الجوارب' }) }[this.spec.task];
  }

  private async taskPhase(): Promise<'noticed' | 'forced' | 'finished' | 'boiled'> {
    this.phase = 'task';
    const s = new Scope();
    this.master.add(() => s.dispose());
    this.v.board.replaceChildren();
    let resolve!: (r: 'noticed' | 'forced' | 'finished') => void;
    const done = new Promise<'noticed' | 'forced' | 'finished'>((r) => (resolve = r));

    const ctx: TaskCtx = {
      board: this.v.board,
      scope: s,
      audio: this.audio,
      fx: this.fx,
      level: this.spec.level,
      miss: (x, y) => {
        this.audio.miss();
        vibrate(25);
        this.addHeat(2, x, y);
      },
      progress: (step, x, y) => {
        this.audio.pluck(step);
        this.fx.ring(x, y, '#2ec4b6', 46);
      },
      complete: () => {
        this.taskDone = true;
        this.audio.success();
        const r = this.v.board.getBoundingClientRect();
        this.fx.confetti(r.left + r.width / 2, r.top + r.height / 2, 26);
        s.timeout(() => resolve('finished'), 450);
      },
    };
    const task: Task =
      this.spec.task === 'order' ? new OrderTask(ctx) : this.spec.task === 'sort' ? new SortTask(ctx) : new PairsTask(ctx);
    this.v.title.textContent = task.title;
    this.v.hint.textContent = task.hint;
    task.mount();

    const g = { scope: s, board: this.v.board, layer: this.v.layer, audio: this.audio, fx: this.fx, task, heat: this.addHeat };

    s.timeout(() => {
      this.disrupting = true;
      this.v.hint.textContent = tr({ en: 'The nudniks are here…', he: 'הנודניקים הגיעו…', ar: 'وصل المزعجون…' });
      this.showPause(s, () => resolve('noticed'));
      unleash('thief', g);
      const spawn = () => {
        unleash(pick(this.t.taskMischief), g);
        s.timeout(spawn, this.t.spawnEvery * rand(0.7, 1.3));
      };
      s.timeout(spawn, this.t.spawnEvery);
    }, this.t.disruptAt);

    this.forceCalm = () => resolve('forced');
    const outcome = await Promise.race([done, this.boil]);
    this.forceCalm = null;
    this.disrupting = false;
    task.freeze();
    s.dispose();
    this.hidePause();
    this.v.layer.replaceChildren();
    if (outcome === 'boiled') return outcome;

    if (outcome === 'noticed') {
      this.pauseHeat = this.heat;
      this.pauseSample = this.samples.length;
      await this.stopMoment(tr({
          en: `You paused at ${ltr(`${toCelsius(this.heat)}°`)}`,
          he: `עצרתם ב־${ltr(`${toCelsius(this.heat)}°`)}`,
          ar: `توقفتم عند ${ltr(`${toCelsius(this.heat)}°`)}`,
        }), 'noticed');
    } else if (outcome === 'forced') {
      await this.stopMoment(tr({ en: 'The kettle is whistling!', he: 'הקומקום שורק!', ar: 'الإبريق يصفّر!' }), 'forced');
    } else {
      await this.stopMoment(tr({ en: 'Done. And now — bring the heat down', he: 'סיימתם. ועכשיו — להוריד את החום', ar: 'انتهيتم. والآن — خفّضوا الحرارة' }), 'finished');
    }
    return outcome;
  }

  /** The dramatic freeze when the round switches from chaos to calm. */
  private async stopMoment(text: string, kind: 'noticed' | 'forced' | 'finished') {
    this.phase = 'intro';
    if (kind === 'noticed') {
      this.audio.gong();
      vibrate([40, 80, 40]);
    } else if (kind === 'forced') {
      this.audio.ring();
      this.fx.shake(this.v.root, 10, 500);
      vibrate([100, 50, 100]);
    }
    const el = h('div', { class: `stop-moment sm-${kind}` }, h('div', { class: 'sm-hand', 'aria-hidden': 'true' }, kind === 'forced' ? '♨' : '✋'), h('p', {}, text));
    this.v.modal.append(el);
    await this.master.sleep(1500);
    el.classList.add('leaving');
    await this.master.sleep(300);
    el.remove();
  }

  private showPause(s: Scope, onPause: () => void) {
    const b = this.v.pauseBtn;
    b.hidden = false;
    b.classList.add('in');
    const handler = () => onPause();
    b.addEventListener('click', handler);
    s.add(() => b.removeEventListener('click', handler));
    if (this.spec.coach) {
      const tip = h('div', { class: 'coach' }, tr({ en: 'Feel it rising? Tap here. The earlier you pause — the more points.', he: 'מרגישים שזה עולה? לחצו כאן. ככל שעוצרים מוקדם יותר — יותר נקודות.', ar: 'تشعرون أنها ترتفع؟ اضغطوا هنا. كلما توقفتم أبكر — زادت النقاط.' }));
      this.v.root.append(tip);
      s.add(() => tip.remove());
      s.timeout(() => tip.remove(), 4500);
    }
  }

  private hidePause() {
    this.v.pauseBtn.classList.remove('in');
    this.v.pauseBtn.hidden = true;
  }

  private async calmPhase(from: 'noticed' | 'forced' | 'finished'): Promise<'calm' | 'boiled'> {
    this.phase = 'calm';
    const s = new Scope();
    this.master.add(() => s.dispose());
    this.v.board.replaceChildren();
    let resolve!: (r: 'calm') => void;
    const done = new Promise<'calm'>((r) => (resolve = r));
    const ctx: CalmCtx = {
      board: this.v.board,
      scope: s,
      audio: this.audio,
      fx: this.fx,
      heat: this.addHeat,
      say: (t) => (this.v.hint.textContent = t),
      done: () => resolve('calm'),
    };
    const calm: Calm =
      this.spec.calm === 'breath' ? new BreathCalm(ctx) : this.spec.calm === 'slide' ? new SlideCalm(ctx) : new HeartCalm(ctx);
    this.v.title.textContent = calm.title;
    this.v.hint.textContent = from === 'forced' ? tr({ en: 'Boiling point is close. ', he: 'הרתיחה קרובה. ', ar: 'الغليان قريب. ' }) + calm.hint : calm.hint;
    calm.mount();

    const g = { scope: s, board: this.v.board, layer: this.v.layer, audio: this.audio, fx: this.fx, task: null, heat: this.addHeat };
    const spawn = () => {
      unleash(pick(this.t.calmMischief), g);
      s.timeout(spawn, this.t.spawnEvery * 1.5 * rand(0.8, 1.3));
    };
    s.timeout(spawn, 1800);

    const outcome = await Promise.race([done, this.boil]);
    s.dispose();
    this.v.layer.replaceChildren();
    if (outcome === 'boiled') return outcome;

    this.phase = 'intro';
    this.audio.success();
    const start = this.heat;
    await this.master.tween(900, (k) => (this.heat = start + (Math.min(start, 14) - start) * k));
    this.v.hint.textContent = tr({ en: 'You’ve calmed down. Now you can choose how to respond', he: 'נרגעתם. עכשיו אפשר לבחור איך להגיב', ar: 'هدأتم. الآن يمكنكم اختيار كيف تردّون' });
    await this.master.sleep(500);
    return 'calm';
  }

  private toast(text: string) {
    const el = h('div', { class: 'toast' }, text);
    this.v.root.append(el);
    this.master.timeout(() => el.remove(), 2600);
  }

  private async finish(outcome: RoundResult['outcome'], choice: ChoiceOutcome | null): Promise<RoundResult> {
    if (outcome === 'boiled') {
      this.phase = 'end';
      this.audio.setWhistle(0);
      this.audio.boilOver();
      vibrate([200, 80, 300]);
      this.v.layer.replaceChildren();
      const r = this.v.kettle.getBoundingClientRect();
      for (let i = 0; i < 40; i++) this.fx.steam(r.left + rand(0, r.width), r.top + r.height / 2, 1, 2.2);
      this.fx.shake(this.v.root, 14, 700);
      const cloud = h('div', { class: 'boil-cloud' }, h('p', {}, tr({ en: 'You boiled over.', he: 'רתחתם.', ar: 'غليتم.' })), h('span', {}, tr({ en: 'It happens. What matters is noticing earlier next time.', he: 'זה קורה. מה שחשוב הוא לשים לב מוקדם יותר בפעם הבאה.', ar: 'هذا يحدث. المهم أن تلاحظوا أبكر في المرة القادمة.' })));
      this.v.modal.append(cloud);
      await this.master.sleep(2600);
      cloud.remove();
    }
    this.phase = 'end';
    this.audio.setWhistle(0);
    this.master.dispose();
    this.v.board.replaceChildren();
    this.v.layer.replaceChildren();
    this.hidePause();

    const boiled = outcome === 'boiled';
    const ph = this.pauseHeat;
    const notice = outcome === 'noticed' && ph != null ? (ph < 40 ? 35 : ph < 60 ? 25 : 15) : 0;
    const calm = boiled ? 0 : clamp(30 - this.impulsive * 4, 5, 30) + (this.peak < 70 ? 10 : 0);
    const response = choice === 'best' ? 40 : choice === 'ok' ? 20 : 0;
    const bonus = this.taskDone && !boiled ? 10 : 0;
    return {
      outcome,
      choice,
      pauseC: ph == null ? null : toCelsius(ph),
      peakC: toCelsius(this.peak),
      impulsive: this.impulsive,
      taskDone: this.taskDone,
      samples: this.samples,
      pauseSample: this.pauseSample,
      points: { notice, calm, response, bonus },
      total: notice + calm + response + bonus,
    };
  }
}

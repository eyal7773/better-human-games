import { tr } from '../shared/i18n';
import { load } from '../shared/storage';
import { wallet } from '../shared/zen';

/**
 * Achievement items: never bought, earned in the games. Each one reads a
 * game's own saved progress (read-only) to see whether it's been earned.
 */

type Saved = { album?: unknown; done?: unknown; stars?: unknown; calmRounds?: unknown; finished?: unknown };
const read = (game: string) => load<Saved>(`bhg.${game}.v1`, {});
const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
const threeStarLevels = (v: unknown) => (v && typeof v === 'object' ? Object.values(v as Record<string, unknown>).filter((s) => Array.isArray(s) && s.length === 3 && s.every(Boolean)).length : 0);

export interface Award {
  how: string;
  done: () => boolean;
}

export const AWARDS: Record<string, Award> = {
  kettle: {
    how: tr({ en: '30 rounds of Boiling Point without boiling over', he: '30 סיבובים בנקודת רתיחה בלי לרתוח', ar: '30 جولة في «نقطة الغليان» دون غليان' }),
    done: () => Number(read('boiling-point').calmRounds) >= 30,
  },
  antenna: {
    how: tr({ en: 'Find all six stations in Inner Radio', he: 'למצוא את כל שש התחנות ברדיו הפנימי', ar: 'اعثروا على المحطات الست في «الراديو الداخلي»' }),
    done: () => len(read('inner-radio').album) >= 6,
  },
  feather: {
    how: tr({ en: 'Three stars on every level of Words in Flight', he: 'שלושה כוכבים בכל השלבים של מילים באוויר', ar: 'ثلاث نجوم في كل مراحل «كلمات في الهواء»' }),
    done: () => threeStarLevels(read('words-in-flight').stars) >= 5,
  },
  shadowlamp: {
    how: tr({ en: 'Fill the whole shadow gallery in Shadow on the Wall', he: 'למלא את כל גלריית הצללים בצל על הקיר', ar: 'املؤوا معرض الظلال كله في «ظلّ على الحائط»' }),
    done: () => len(read('shadow-wall').album) >= 8,
  },
  shield: {
    how: tr({ en: 'Finish every level of The Fortress', he: 'לסיים את כל השלבים של המבצר', ar: 'أنهوا كل مراحل «الحصن»' }),
    done: () => len(read('fortress').done) >= 5,
  },
  realbench: {
    how: tr({ en: 'Tap “I paused at home today too” on 7 different days', he: 'ללחוץ על "עצרתי גם בבית היום" ב־7 ימים שונים', ar: 'اضغطوا «توقفت في البيت اليوم أيضًا» في 7 أيام مختلفة' }),
    done: () => wallet.realPauses >= 7,
  },
};

export const peskyHome = () => read('catch-me-3d').finished === true;

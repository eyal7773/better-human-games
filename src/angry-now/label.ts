import { tr } from '../shared/i18n';
import { heSelf, profile, type Profile } from '../shared/profile';

/** "I'm angry right now", in the form of address the player chose (both forms when they didn't). */
export function angryNowLabel(p: Profile = profile) {
  const arSelf = p.address === 'f' ? 'غاضبة' : p.address === 'm' ? 'غاضب' : 'غاضب/ة';
  return tr({
    en: 'I’m angry right now',
    he: `אני ${heSelf('כועס', 'כועסת', p)} עכשיו`,
    ar: `أنا ${arSelf} الآن`,
  });
}

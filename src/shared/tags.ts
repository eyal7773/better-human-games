/**
 * Tags let us match content to the player. They are always English, and the
 * same in every language file.
 * - Who it fits: a dilemma may fit several audiences. A gender tag is added only
 *   when the situation is specific to it; no gender tag means it fits everyone.
 * - What it's about: the kind of flashpoint.
 */
export type HouseholdTag =
  | 'parent-young-child' // ages 0–6
  | 'parent-school-age' // ages 6–12
  | 'parent-teen'
  | 'single-parent'
  | 'partner'
  | 'adult-child' // grown son or daughter of an ageing parent
  | 'grandparent'
  | 'no-kids';
export type GenderTag = 'men' | 'women';
export type AudienceTag = HouseholdTag | GenderTag;

export type TopicTag =
  | 'mess'
  | 'chores'
  | 'mealtime'
  | 'bedtime'
  | 'morning-rush'
  | 'siblings'
  | 'homework'
  | 'noise'
  | 'work-life'
  | 'household'
  | 'screens'
  | 'money'
  | 'in-laws' // grandparents and in-laws stepping into your parenting
  | 'caregiving'
  | 'health'
  | 'mental-load' // the invisible work of noticing, planning and remembering
  | 'respect'
  | 'independence'
  | 'honesty'
  | 'public'
  | 'connection';
export type Tag = AudienceTag | TopicTag;

export const GENDER_TAGS: readonly GenderTag[] = ['men', 'women'];
export const HOUSEHOLD_TAGS: readonly HouseholdTag[] = [
  'parent-young-child',
  'parent-school-age',
  'parent-teen',
  'single-parent',
  'partner',
  'adult-child',
  'grandparent',
  'no-kids',
];

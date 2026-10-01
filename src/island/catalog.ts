import { tr } from '../shared/i18n';
import type { Rule } from './economy';
import * as G from './art/garden';
import type { Draw } from './art/kit';

export type Category = 'plants' | 'build' | 'water' | 'light';

export interface ItemDef extends Rule {
  name: string;
  desc: string;
  cat: Category;
  /** Ground tiles are painted by the renderer, ambient things are drawn over the whole island. */
  draw?: Draw;
  /** Visual height in world units, for taps and thumbnails. */
  h: number;
  /** A light that shows at night: height above the ground and reach. */
  light?: { y: number; r: number };
  /** Growth stages; the wallet's `growth` since planting moves it on. */
  stages?: number;
  /** The big one for its island. */
  icon?: boolean;
  /** Never moves: drawn once into a cached sprite. */
  still?: boolean;
  /** Laid by dragging a finger, many at a time (tiles and fences). */
  brush?: boolean;
  sound: 'bell' | 'chime' | 'splash' | 'rustle' | 'wood' | 'stone';
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'plants', icon: '🌿', label: tr({ en: 'Plants', he: 'צמחים', ar: 'نباتات' }) },
  { id: 'build', icon: '🏯', label: tr({ en: 'Buildings', he: 'מבנים', ar: 'مبانٍ' }) },
  { id: 'water', icon: '💧', label: tr({ en: 'Water & paths', he: 'מים ושבילים', ar: 'ماء وممرات' }) },
  { id: 'light', icon: '🏮', label: tr({ en: 'Light & sound', he: 'אור וצליל', ar: 'ضوء وصوت' }) },
];

const garden = (d: Omit<ItemDef, 'isle' | 'kind' | 'w' | 'd'> & Partial<Pick<ItemDef, 'kind' | 'w' | 'd'>>): ItemDef => ({ isle: 'garden', kind: 'item', w: 1, d: 1, ...d });
const TILE = Infinity;

export const ITEMS: ItemDef[] = [
  // ---- ground tiles: cheap, as many as you like
  garden({ id: 'path', kind: 'ground', brush: true, cat: 'water', cost: 5, cap: TILE, h: 0, sound: 'stone', name: tr({ en: 'Stone path', he: 'שביל אבנים', ar: 'ممر حجري' }), desc: tr({ en: 'Drag to lay a path', he: 'גוררים כדי לסלול', ar: 'اسحبوا لرصف ممر' }) }),
  garden({ id: 'stream', kind: 'ground', brush: true, water: 'is', cat: 'water', cost: 8, cap: TILE, h: 0, sound: 'splash', name: tr({ en: 'Stream', he: 'נחל', ar: 'جدول' }), desc: tr({ en: 'Drag to let water run', he: 'גוררים כדי שמים יזרמו', ar: 'اسحبوا ليجري الماء' }) }),
  garden({ id: 'fence', still: true, brush: true, cat: 'build', cost: 10, cap: TILE, h: 22, sound: 'wood', draw: G.fence, name: tr({ en: 'Bamboo fence', he: 'גדר במבוק', ar: 'سياج خيزران' }), desc: tr({ en: 'Joins up with its neighbours', he: 'מתחברת לשכנות', ar: 'يتصل بما يجاوره' }) }),
  // ---- the old island's ten, same prices
  garden({ id: 'flowers', cat: 'plants', cost: 20, cap: 6, h: 14, sound: 'rustle', draw: G.flowers, name: tr({ en: 'Flower bed', he: 'ערוגת פרחים', ar: 'حوض زهور' }), desc: tr({ en: 'A splash of colour', he: 'קצת צבע', ar: 'قليل من الألوان' }) }),
  garden({ id: 'stones', still: true, cat: 'build', cost: 25, cap: 4, h: 32, sound: 'stone', draw: G.stones, name: tr({ en: 'Stone stack', he: 'מגדל אבנים', ar: 'برج حجارة' }), desc: tr({ en: 'Balance, stone on stone', he: 'איזון, אבן על אבן', ar: 'توازن، حجر فوق حجر' }) }),
  garden({ id: 'tree', cat: 'plants', cost: 30, cap: 4, h: 70, stages: 4, sound: 'rustle', draw: G.tree, name: tr({ en: 'Tree', he: 'עץ', ar: 'شجرة' }), desc: tr({ en: 'Grows with every calm round', he: 'גדל עם כל סיבוב רגוע', ar: 'تكبر مع كل جولة هادئة' }) }),
  garden({ id: 'lantern', cat: 'light', cost: 45, cap: 4, h: 46, light: { y: 26, r: 70 }, sound: 'bell', draw: G.lantern, name: tr({ en: 'Stone lantern', he: 'פנס אבן', ar: 'فانوس حجري' }), desc: tr({ en: 'Warm light for the evening', he: 'אור חמים לערב', ar: 'ضوء دافئ للمساء' }) }),
  garden({ id: 'bench', still: true, cat: 'build', cost: 50, cap: 2, w: 2, h: 26, sound: 'wood', draw: G.bench, name: tr({ en: 'Bench', he: 'ספסל', ar: 'مقعد' }), desc: tr({ en: 'A place to sit a moment', he: 'מקום לשבת רגע', ar: 'مكان للجلوس لحظة' }) }),
  garden({ id: 'fireflies', kind: 'ambient', cat: 'light', cost: 60, cap: 1, w: 0, d: 0, h: 0, sound: 'chime', name: tr({ en: 'Fireflies', he: 'גחליליות', ar: 'يراعات' }), desc: tr({ en: 'Floating specks of light', he: 'נקודות אור מרחפות', ar: 'نقاط ضوء عائمة' }) }),
  garden({ id: 'chimes', cat: 'light', cost: 70, cap: 2, h: 56, sound: 'chime', draw: G.chimes, name: tr({ en: 'Wind chimes', he: 'פעמוני רוח', ar: 'أجراس الريح' }), desc: tr({ en: 'Adds chimes to the island', he: 'מוסיף צלצולים לאי', ar: 'تضيف رنينًا للجزيرة' }) }),
  garden({ id: 'pond', cat: 'water', cost: 90, cap: 1, w: 2, d: 2, h: 10, sound: 'splash', draw: G.pond, name: tr({ en: 'Fish pond', he: 'בריכת דגים', ar: 'بركة أسماك' }), desc: tr({ en: 'Two koi fish', he: 'שני דגי קוי', ar: 'سمكتا كوي' }) }),
  garden({ id: 'sakura', cat: 'plants', cost: 110, cap: 2, h: 76, sound: 'rustle', draw: G.sakura, name: tr({ en: 'Cherry tree', he: 'עץ דובדבן', ar: 'شجرة كرز' }), desc: tr({ en: 'Falling petals', he: 'עלי כותרת נושרים', ar: 'بتلات تتساقط' }) }),
  garden({ id: 'waterfall', cat: 'water', cost: 140, cap: 1, edge: true, h: 14, sound: 'splash', draw: G.waterfall, name: tr({ en: 'Waterfall', he: 'מפל', ar: 'شلال' }), desc: tr({ en: 'Pours over the edge, into the sea', he: 'נשפך מהקצה אל הים', ar: 'ينساب من الحافة إلى البحر' }) }),
  // ---- new in the garden
  garden({ id: 'bush', cat: 'plants', cost: 15, cap: 6, h: 26, sound: 'rustle', draw: G.bush, name: tr({ en: 'Bush', he: 'שיח', ar: 'شجيرة' }), desc: tr({ en: 'Round and green, some with berries', he: 'עגול וירוק, לפעמים עם פירות', ar: 'مستديرة وخضراء، وبعضها بثمار' }) }),
  garden({ id: 'bamboo', cat: 'plants', cost: 35, cap: 6, h: 76, sound: 'rustle', draw: G.bamboo, name: tr({ en: 'Bamboo', he: 'במבוק', ar: 'خيزران' }), desc: tr({ en: 'Sways in the breeze', he: 'מתנדנד ברוח', ar: 'يتمايل مع النسيم' }) }),
  garden({ id: 'vegbed', still: true, cat: 'plants', cost: 40, cap: 3, w: 2, h: 18, sound: 'rustle', draw: G.vegBed, name: tr({ en: 'Vegetable bed', he: 'ערוגת ירקות', ar: 'حوض خضار' }), desc: tr({ en: 'Lettuce, carrots, tomatoes', he: 'חסה, גזר, עגבניות', ar: 'خس وجزر وطماطم' }) }),
  garden({ id: 'bridge', still: true, cat: 'water', water: 'on', cost: 120, cap: 2, h: 26, sound: 'wood', draw: G.bridge, name: tr({ en: 'Wooden bridge', he: 'גשר עץ', ar: 'جسر خشبي' }), desc: tr({ en: 'Goes over a stream', he: 'עומד מעל נחל', ar: 'يُوضع فوق جدول' }) }),
  garden({ id: 'hammock', cat: 'build', cost: 160, cap: 1, w: 2, h: 42, sound: 'wood', draw: G.hammock, name: tr({ en: 'Hammock', he: 'ערסל', ar: 'أرجوحة شبكية' }), desc: tr({ en: 'For doing nothing at all', he: 'בשביל לא לעשות כלום', ar: 'لكي لا نفعل شيئًا' }) }),
  garden({ id: 'willow', cat: 'plants', cost: 220, cap: 2, h: 92, sound: 'rustle', draw: G.willow, name: tr({ en: 'Weeping willow', he: 'ערבה בוכייה', ar: 'صفصاف باكٍ' }), desc: tr({ en: 'Long, soft branches', he: 'ענפים ארוכים ורכים', ar: 'أغصان طويلة وناعمة' }) }),
  garden({ id: 'pavilion', cat: 'build', cost: 300, cap: 1, w: 2, d: 2, h: 86, light: { y: 28, r: 80 }, sound: 'bell', draw: G.pavilion, name: tr({ en: 'Pavilion', he: 'ביתן', ar: 'كشك' }), desc: tr({ en: 'Shade and a paper lantern', he: 'צל ופנס נייר', ar: 'ظلّ وفانوس ورقي' }) }),
  garden({ id: 'teahouse', still: true, cat: 'build', cost: 450, cap: 1, w: 2, d: 2, h: 76, light: { y: 18, r: 90 }, sound: 'wood', draw: G.teahouse, name: tr({ en: 'Tea house', he: 'בית תה', ar: 'بيت الشاي' }), desc: tr({ en: 'Its window glows at night', he: 'החלון מאיר בלילה', ar: 'نافذته تضيء ليلًا' }) }),
  garden({ id: 'ancient', cat: 'plants', cost: 1000, cap: 1, w: 2, d: 2, h: 150, stages: 7, icon: true, sound: 'rustle', draw: G.ancientTree, name: tr({ en: 'The Ancient Tree', he: 'העץ העתיק', ar: 'الشجرة العتيقة' }), desc: tr({ en: 'Grows through 7 stages with every calm round — and then it blossoms', he: 'גדל בשבעה שלבים עם כל סיבוב רגוע — ובסוף פורח', ar: 'تكبر عبر 7 مراحل مع كل جولة هادئة — ثم تُزهر' }) }),
];

const BY_ID = new Map(ITEMS.map((d) => [d.id, d]));
export const def = (id: string) => BY_ID.get(id);

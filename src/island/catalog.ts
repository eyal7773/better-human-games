import { tr } from '../shared/i18n';
import type { Rule } from './economy';
import * as G from './art/garden';
import * as S from './art/shore';
import * as H from './art/hill';
import * as F from './art/forest';
import * as A from './art/creatures';
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
  sound: 'bell' | 'chime' | 'splash' | 'rustle' | 'wood' | 'stone' | 'melody' | 'gong' | 'note' | 'whoosh';
  /** You can sit here and breathe with the island. */
  seat?: boolean;
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'plants', icon: '🌿', label: tr({ en: 'Nature', he: 'טבע', ar: 'طبيعة' }) },
  { id: 'build', icon: '🏯', label: tr({ en: 'Buildings', he: 'מבנים', ar: 'مبانٍ' }) },
  { id: 'water', icon: '💧', label: tr({ en: 'Water & paths', he: 'מים ושבילים', ar: 'ماء وممرات' }) },
  { id: 'light', icon: '🏮', label: tr({ en: 'Light & sound', he: 'אור וצליל', ar: 'ضوء وصوت' }) },
];

type Spec = Omit<ItemDef, 'isle' | 'kind' | 'w' | 'd'> & Partial<Pick<ItemDef, 'kind' | 'w' | 'd'>>;
const on =
  (isle: string) =>
  (d: Spec): ItemDef => ({ isle, kind: 'item', w: 1, d: 1, ...d });
const garden = on('garden');
const shore = on('shore');
const hill = on('hill');
const forest = on('forest');
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
  garden({ id: 'bench', seat: true, still: true, cat: 'build', cost: 50, cap: 2, w: 2, h: 26, sound: 'wood', draw: G.bench, name: tr({ en: 'Bench', he: 'ספסל', ar: 'مقعد' }), desc: tr({ en: 'A place to sit a moment', he: 'מקום לשבת רגע', ar: 'مكان للجلوس لحظة' }) }),
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
  garden({ id: 'hammock', seat: true, cat: 'build', cost: 160, cap: 1, w: 2, h: 42, sound: 'wood', draw: G.hammock, name: tr({ en: 'Hammock', he: 'ערסל', ar: 'أرجوحة شبكية' }), desc: tr({ en: 'For doing nothing at all', he: 'בשביל לא לעשות כלום', ar: 'لكي لا نفعل شيئًا' }) }),
  garden({ id: 'willow', cat: 'plants', cost: 220, cap: 2, h: 92, sound: 'rustle', draw: G.willow, name: tr({ en: 'Weeping willow', he: 'ערבה בוכייה', ar: 'صفصاف باكٍ' }), desc: tr({ en: 'Long, soft branches', he: 'ענפים ארוכים ורכים', ar: 'أغصان طويلة وناعمة' }) }),
  garden({ id: 'pavilion', cat: 'build', cost: 300, cap: 1, w: 2, d: 2, h: 86, light: { y: 28, r: 80 }, sound: 'bell', draw: G.pavilion, name: tr({ en: 'Pavilion', he: 'ביתן', ar: 'كشك' }), desc: tr({ en: 'Shade and a paper lantern', he: 'צל ופנס נייר', ar: 'ظلّ وفانوس ورقي' }) }),
  garden({ id: 'teahouse', still: true, cat: 'build', cost: 450, cap: 1, w: 2, d: 2, h: 76, light: { y: 18, r: 90 }, sound: 'wood', draw: G.teahouse, name: tr({ en: 'Tea house', he: 'בית תה', ar: 'بيت الشاي' }), desc: tr({ en: 'Its window glows at night', he: 'החלון מאיר בלילה', ar: 'نافذته تضيء ليلًا' }) }),
  garden({ id: 'ancient', cat: 'plants', cost: 1000, cap: 1, w: 2, d: 2, h: 150, stages: 7, icon: true, sound: 'rustle', draw: G.ancientTree, name: tr({ en: 'The Ancient Tree', he: 'העץ העתיק', ar: 'الشجرة العتيقة' }), desc: tr({ en: 'Grows through 7 stages with every calm round — and then it blossoms', he: 'גדל בשבעה שלבים עם כל סיבוב רגוע — ובסוף פורח', ar: 'تكبر عبر 7 مراحل مع كل جولة هادئة — ثم تُزهر' }) }),
  // ---- Shore of Sounds
  shore({ id: 'pier', kind: 'ground', brush: true, cat: 'water', cost: 12, cap: TILE, h: 0, sound: 'wood', name: tr({ en: 'Boardwalk', he: 'רציף עץ', ar: 'ممشى خشبي' }), desc: tr({ en: 'Drag to lay planks', he: 'גוררים כדי להניח קרשים', ar: 'اسحبوا لوضع الألواح' }) }),
  shore({ id: 'shells', cat: 'plants', cost: 5, cap: 6, h: 10, sound: 'note', draw: S.shells, name: tr({ en: 'Shells', he: 'צדפים', ar: 'أصداف' }), desc: tr({ en: 'And a starfish', he: 'וכוכב ים אחד', ar: 'ونجمة بحر' }) }),
  shore({ id: 'sandcastle', still: true, cat: 'build', cost: 15, cap: 3, h: 44, sound: 'stone', draw: S.sandcastle, name: tr({ en: 'Sandcastle', he: 'ארמון חול', ar: 'قلعة رمل' }), desc: tr({ en: 'With a little flag', he: 'עם דגל קטן', ar: 'مع راية صغيرة' }) }),
  shore({ id: 'beachchair', seat: true, still: true, cat: 'build', cost: 40, cap: 4, h: 30, sound: 'wood', draw: S.beachChair, name: tr({ en: 'Beach chair', he: 'כיסא חוף', ar: 'كرسي شاطئ' }), desc: tr({ en: 'Sit and listen to the waves', he: 'לשבת ולהקשיב לגלים', ar: 'اجلسوا واستمعوا للأمواج' }) }),
  shore({ id: 'parasol', cat: 'build', cost: 45, cap: 4, h: 56, sound: 'whoosh', draw: S.parasol, name: tr({ en: 'Parasol', he: 'שמשייה', ar: 'مظلة' }), desc: tr({ en: 'Stripes of shade', he: 'פסים של צל', ar: 'خطوط من الظل' }) }),
  shore({ id: 'shellchimes', cat: 'light', cost: 70, cap: 2, h: 52, sound: 'chime', draw: S.shellChimes, name: tr({ en: 'Shell chimes', he: 'פעמוני צדפים', ar: 'أجراس الأصداف' }), desc: tr({ en: 'Clink in the sea breeze', he: 'מקשקשים ברוח הים', ar: 'ترنّ في نسيم البحر' }) }),
  shore({ id: 'singingstones', cat: 'light', cost: 90, cap: 2, h: 22, sound: 'note', draw: S.singingStones, name: tr({ en: 'Singing stones', he: 'אבנים מזמרות', ar: 'حجارة مغنّية' }), desc: tr({ en: 'Each one hums its own note', he: 'כל אחת מזמזמת תו משלה', ar: 'كل واحدة تدندن نغمتها' }) }),
  shore({ id: 'radio', cat: 'light', cost: 120, cap: 1, h: 46, sound: 'melody', draw: S.oldRadio, name: tr({ en: 'Old radio', he: 'רדיו ישן', ar: 'راديو قديم' }), desc: tr({ en: 'Plays the feelings’ tunes', he: 'מנגן את המנגינות של הרגשות', ar: 'يعزف ألحان المشاعر' }) }),
  shore({ id: 'musicbox', cat: 'light', cost: 150, cap: 1, h: 26, sound: 'melody', draw: S.musicBox, name: tr({ en: 'Music box', he: 'תיבת נגינה', ar: 'صندوق موسيقى' }), desc: tr({ en: 'A tiny dancer turns', he: 'רקדנית קטנה מסתובבת', ar: 'راقصة صغيرة تدور' }) }),
  shore({ id: 'lifeguard', cat: 'build', cost: 260, cap: 1, w: 2, d: 2, h: 100, sound: 'wood', draw: S.lifeguard, name: tr({ en: 'Lifeguard hut', he: 'סוכת מציל', ar: 'كوخ المنقذ' }), desc: tr({ en: 'Keeping a calm eye on the sea', he: 'שומרת בעין רגועה על הים', ar: 'يراقب البحر بهدوء' }) }),
  shore({ id: 'boat', still: true, cat: 'water', cost: 300, cap: 2, w: 2, h: 58, sound: 'wood', draw: S.boat, name: tr({ en: 'Fishing boat', he: 'סירת דייגים', ar: 'قارب صيد' }), desc: tr({ en: 'Pulled up on the sand', he: 'משוכה על החול', ar: 'مسحوب على الرمل' }) }),
  shore({ id: 'dolphins', kind: 'ambient', cat: 'water', cost: 400, cap: 1, w: 0, d: 0, h: 0, sound: 'splash', name: tr({ en: 'Dolphins', he: 'דולפינים', ar: 'دلافين' }), desc: tr({ en: 'Leaping out at sea', he: 'קופצים בים', ar: 'تقفز في البحر' }) }),
  shore({ id: 'bandstand', cat: 'build', cost: 700, cap: 1, w: 2, d: 2, h: 90, light: { y: 40, r: 80 }, sound: 'melody', draw: S.bandstand, name: tr({ en: 'Bandstand', he: 'במת תזמורת', ar: 'منصة الفرقة' }), desc: tr({ en: 'A little band that plays', he: 'תזמורת קטנה שמנגנת', ar: 'فرقة صغيرة تعزف' }) }),
  shore({ id: 'belltower', icon: true, cat: 'build', cost: 1200, cap: 1, w: 2, d: 2, h: 170, light: { y: 120, r: 60 }, sound: 'gong', draw: S.bellTower, name: tr({ en: 'The Bell Tower', he: 'מגדל הפעמונים', ar: 'برج الأجراس' }), desc: tr({ en: 'Rings every hour, on the hour', he: 'מצלצל בכל שעה עגולה', ar: 'يرنّ مع كل ساعة' }) }),
  // ---- Hill of Wind
  hill({ id: 'tallgrass', brush: true, cat: 'plants', cost: 5, cap: TILE, h: 24, sound: 'rustle', draw: H.tallGrass, name: tr({ en: 'Tall grass', he: 'דשא גבוה', ar: 'عشب طويل' }), desc: tr({ en: 'Drag to sow it', he: 'גוררים כדי לזרוע', ar: 'اسحبوا لزراعته' }) }),
  hill({ id: 'sunflowers', brush: true, cat: 'plants', cost: 8, cap: TILE, h: 36, sound: 'rustle', draw: H.sunflowers, name: tr({ en: 'Sunflowers', he: 'חמניות', ar: 'عباد الشمس' }), desc: tr({ en: 'Drag to plant a field', he: 'גוררים כדי לשתול שדה', ar: 'اسحبوا لزراعة حقل' }) }),
  hill({ id: 'pinwheel', cat: 'light', cost: 20, cap: 6, h: 44, sound: 'whoosh', draw: H.pinwheel, name: tr({ en: 'Pinwheel', he: 'שבשבת', ar: 'دوّارة' }), desc: tr({ en: 'Spins faster in a gust', he: 'מסתובבת מהר יותר במשב רוח', ar: 'تدور أسرع مع الهبّة' }) }),
  hill({ id: 'kite', cat: 'light', cost: 35, cap: 5, h: 110, sound: 'whoosh', draw: H.kite, name: tr({ en: 'Kite', he: 'עפיפון', ar: 'طائرة ورقية' }), desc: tr({ en: 'Each one a different colour', he: 'כל אחד בצבע אחר', ar: 'كلّ واحدة بلون مختلف' }) }),
  hill({ id: 'bunting', cat: 'build', cost: 40, cap: 3, w: 2, h: 40, sound: 'whoosh', draw: H.bunting, name: tr({ en: 'Bunting', he: 'דגלונים', ar: 'رايات' }), desc: tr({ en: 'A string of little flags', he: 'שרשרת של דגלים קטנים', ar: 'سلسلة رايات صغيرة' }) }),
  hill({ id: 'lookout', seat: true, still: true, cat: 'build', cost: 60, cap: 2, w: 2, h: 30, sound: 'wood', draw: H.lookout, name: tr({ en: 'Lookout bench', he: 'ספסל תצפית', ar: 'مقعد الإطلالة' }), desc: tr({ en: 'With a telescope', he: 'עם טלסקופ', ar: 'مع منظار' }) }),
  hill({ id: 'birds', kind: 'ambient', cat: 'light', cost: 60, cap: 1, w: 0, d: 0, h: 0, sound: 'whoosh', name: tr({ en: 'Birds', he: 'ציפורים', ar: 'طيور' }), desc: tr({ en: 'Flocks drift over the hill', he: 'להקות חולפות מעל הגבעה', ar: 'أسراب تعبر فوق التلة' }) }),
  hill({ id: 'birdhouse', cat: 'build', cost: 75, cap: 3, h: 50, sound: 'wood', draw: H.birdhouse, name: tr({ en: 'Birdhouse', he: 'בית ציפורים', ar: 'بيت عصافير' }), desc: tr({ en: 'Someone visits now and then', he: 'מישהו מבקר מדי פעם', ar: 'يزوره أحد بين حين وآخر' }) }),
  hill({ id: 'bigchimes', cat: 'light', cost: 110, cap: 2, h: 72, sound: 'chime', draw: H.bigChimes, name: tr({ en: 'Big wind chimes', he: 'פעמוני רוח גדולים', ar: 'أجراس ريح كبيرة' }), desc: tr({ en: 'Deep, slow notes', he: 'צלילים עמוקים ואיטיים', ar: 'نغمات عميقة وبطيئة' }) }),
  hill({ id: 'swing', cat: 'plants', cost: 140, cap: 2, h: 96, sound: 'wood', draw: H.treeSwing, name: tr({ en: 'Tree swing', he: 'נדנדה על עץ', ar: 'أرجوحة شجرة' }), desc: tr({ en: 'It swings by itself in the wind', he: 'מתנדנדת לבד ברוח', ar: 'تتأرجح وحدها مع الريح' }) }),
  hill({ id: 'windmill', cat: 'build', cost: 380, cap: 1, w: 2, d: 2, h: 140, light: { y: 50, r: 50 }, sound: 'wood', draw: H.windmill, name: tr({ en: 'Windmill', he: 'טחנת רוח', ar: 'طاحونة هواء' }), desc: tr({ en: 'Its sails turn all day', he: 'הכנפיים מסתובבות כל היום', ar: 'أشرعتها تدور طوال اليوم' }) }),
  hill({ id: 'balloon', cat: 'light', cost: 500, cap: 1, h: 150, sound: 'whoosh', draw: H.balloon, name: tr({ en: 'Hot-air balloon', he: 'כדור פורח', ar: 'منطاد' }), desc: tr({ en: 'Floats on a long rope', he: 'מרחף על חבל ארוך', ar: 'يطفو على حبل طويل' }) }),
  hill({ id: 'dragonkite', icon: true, cat: 'light', cost: 1100, cap: 1, w: 2, d: 2, h: 160, sound: 'whoosh', draw: H.dragonKite, name: tr({ en: 'The Dragon Kite', he: 'עפיפון הדרקון', ar: 'طائرة التنين' }), desc: tr({ en: 'A long, friendly dragon in the sky', he: 'דרקון ארוך וחביב בשמיים', ar: 'تنين طويل لطيف في السماء' }) }),
  // ---- Lantern Forest
  forest({ id: 'leafpath', kind: 'ground', brush: true, cat: 'water', cost: 5, cap: TILE, h: 0, sound: 'rustle', name: tr({ en: 'Leaf path', he: 'שביל עלים', ar: 'ممر أوراق' }), desc: tr({ en: 'Drag to lay it', he: 'גוררים כדי להניח', ar: 'اسحبوا لوضعه' }) }),
  forest({ id: 'mushrooms', cat: 'plants', cost: 10, cap: 6, h: 16, light: { y: 6, r: 36 }, sound: 'note', draw: F.mushrooms, name: tr({ en: 'Glowing mushrooms', he: 'פטריות זוהרות', ar: 'فطر مضيء' }), desc: tr({ en: 'A soft blue light', he: 'אור כחול ורך', ar: 'ضوء أزرق ناعم' }) }),
  forest({ id: 'fern', cat: 'plants', cost: 10, cap: 6, h: 24, sound: 'rustle', draw: F.fern, name: tr({ en: 'Fern', he: 'שרך', ar: 'سرخس' }), desc: tr({ en: 'Green and feathery', he: 'ירוק ונוצי', ar: 'أخضر كالريش' }) }),
  forest({ id: 'paperlantern', cat: 'light', cost: 25, cap: 6, h: 46, light: { y: 32, r: 60 }, sound: 'bell', draw: F.paperLantern, name: tr({ en: 'Paper lantern', he: 'פנס נייר', ar: 'فانوس ورقي' }), desc: tr({ en: 'Sways on a hook', he: 'מתנדנד על וו', ar: 'يتمايل على خطّاف' }) }),
  forest({ id: 'pine', cat: 'plants', cost: 30, cap: 8, h: 84, sound: 'rustle', draw: F.pine, name: tr({ en: 'Pine', he: 'אורן', ar: 'صنوبرة' }), desc: tr({ en: 'Tall and dark', he: 'גבוה וכהה', ar: 'طويلة وداكنة' }) }),
  forest({ id: 'lanternpost', cat: 'light', cost: 50, cap: 4, h: 72, light: { y: 56, r: 80 }, sound: 'bell', draw: F.lanternPost, name: tr({ en: 'Lantern post', he: 'עמוד פנסים', ar: 'عمود فانوس' }), desc: tr({ en: 'Lights the way', he: 'מאיר את הדרך', ar: 'يضيء الطريق' }) }),
  forest({ id: 'bluefireflies', kind: 'ambient', cat: 'light', cost: 80, cap: 1, w: 0, d: 0, h: 0, sound: 'chime', name: tr({ en: 'Blue fireflies', he: 'גחליליות כחולות', ar: 'يراعات زرقاء' }), desc: tr({ en: 'Little blue lights between the trees', he: 'אורות כחולים קטנים בין העצים', ar: 'أضواء زرقاء صغيرة بين الأشجار' }) }),
  forest({ id: 'moonpool', cat: 'water', cost: 200, cap: 1, w: 2, d: 2, h: 14, light: { y: 0, r: 70 }, sound: 'splash', draw: F.moonPool, name: tr({ en: 'Moon pool', he: 'בריכת ירח', ar: 'بركة القمر' }), desc: tr({ en: 'The moon lives in it', he: 'הירח גר בתוכה', ar: 'القمر يسكن فيها' }) }),
  forest({ id: 'cabin', still: true, cat: 'build', cost: 350, cap: 1, w: 2, d: 2, h: 80, light: { y: 18, r: 80 }, sound: 'wood', draw: F.cabin, name: tr({ en: 'Log cabin', he: 'בקתה', ar: 'كوخ خشبي' }), desc: tr({ en: 'A warm window in the woods', he: 'חלון חמים ביער', ar: 'نافذة دافئة في الغابة' }) }),
  forest({ id: 'treehouse', cat: 'build', cost: 450, cap: 1, w: 2, d: 2, h: 170, light: { y: 78, r: 80 }, sound: 'wood', draw: F.treehouse, name: tr({ en: 'Treehouse', he: 'בית עץ', ar: 'بيت الشجرة' }), desc: tr({ en: 'With a rope ladder', he: 'עם סולם חבלים', ar: 'مع سلّم من الحبال' }) }),
  forest({ id: 'theater', cat: 'build', cost: 600, cap: 1, w: 2, h: 84, light: { y: 44, r: 90 }, sound: 'melody', draw: F.shadowTheater, name: tr({ en: 'Shadow theatre', he: 'תיאטרון צלליות', ar: 'مسرح الظل' }), desc: tr({ en: 'Shadows that only dance', he: 'צללים שרק רוקדים', ar: 'ظلال ترقص فقط' }) }),
  forest({ id: 'lighttree', icon: true, cat: 'plants', cost: 1300, cap: 1, w: 2, d: 2, h: 180, light: { y: 90, r: 140 }, sound: 'gong', draw: F.lightTree, name: tr({ en: 'The Tree of Light', he: 'עץ האור', ar: 'شجرة النور' }), desc: tr({ en: 'Lights drift up from its branches', he: 'אורות עולים מהענפים שלו', ar: 'أضواء تصعد من أغصانه' }) }),
];

const BY_ID = new Map(ITEMS.map((d) => [d.id, d]));
export const def = (id: string) => BY_ID.get(id);

// ---------------------------------------------------------------- visitors

/** How a visitor gets about: walking, hopping, on the water, on a perch, or out at sea. */
export type Gait = 'walk' | 'hop' | 'swim' | 'perch' | 'sea';

export interface Visitor {
  id: string;
  isle: string;
  emoji: string;
  name: string;
  /** A hint at what draws them, shown until they come. */
  hint: string;
  gait: Gait;
  /** For perchers: what they sit on. */
  perch?: string;
  draw: A.CreatureDraw;
  /** Given how many of each item the island has: do they come? */
  need: (n: (id: string) => number) => boolean;
}

export const VISITORS: Visitor[] = [
  { id: 'frog', isle: 'garden', emoji: '🐸', gait: 'hop', draw: A.frog, need: (n) => n('pond') > 0 && n('bamboo') > 0, name: tr({ en: 'Frog', he: 'צפרדע', ar: 'ضفدع' }), hint: tr({ en: 'Someone who loves still water and tall stalks…', he: 'מישהו שאוהב מים שקטים וגבעולים גבוהים…', ar: 'أحدٌ يحبّ الماء الساكن والسيقان الطويلة…' }) },
  { id: 'cat', isle: 'garden', emoji: '🐈', gait: 'walk', draw: A.cat, need: (n) => n('bench') > 0 && n('bush') >= 2, name: tr({ en: 'Cat', he: 'חתול', ar: 'قطّة' }), hint: tr({ en: 'Someone who likes a bench, and bushes to hide in…', he: 'מישהו שאוהב ספסל, ושיחים להתחבא בהם…', ar: 'أحدٌ يحبّ مقعدًا، وشجيرات يختبئ فيها…' }) },
  { id: 'ducks', isle: 'garden', emoji: '🦆', gait: 'swim', draw: A.duck, need: (n) => n('stream') >= 4, name: tr({ en: 'Duck', he: 'ברווז', ar: 'بطّة' }), hint: tr({ en: 'Someone who needs a long stream to paddle in…', he: 'מישהו שצריך נחל ארוך כדי לשחות…', ar: 'أحدٌ يحتاج جدولًا طويلًا ليسبح…' }) },
  { id: 'crab', isle: 'shore', emoji: '🦀', gait: 'walk', draw: A.crab, need: (n) => n('shells') >= 3, name: tr({ en: 'Crab', he: 'סרטן', ar: 'سلطعون' }), hint: tr({ en: 'Someone who collects shells…', he: 'מישהו שאוסף צדפים…', ar: 'أحدٌ يجمع الأصداف…' }) },
  { id: 'turtle', isle: 'shore', emoji: '🐢', gait: 'walk', draw: A.turtle, need: (n) => n('sandcastle') > 0 && n('pier') > 0, name: tr({ en: 'Turtle', he: 'צב', ar: 'سلحفاة' }), hint: tr({ en: 'Someone slow who likes castles and planks…', he: 'מישהו איטי שאוהב ארמונות וקרשים…', ar: 'أحدٌ بطيء يحبّ القلاع والألواح…' }) },
  { id: 'whale', isle: 'shore', emoji: '🐋', gait: 'sea', draw: A.whale, need: (n) => n('belltower') > 0 && n('dolphins') > 0, name: tr({ en: 'Singing whale', he: 'לווייתן שר', ar: 'حوت مغنٍّ' }), hint: tr({ en: 'Someone huge who answers bells and dolphins…', he: 'מישהו ענק שעונה לפעמונים ולדולפינים…', ar: 'أحدٌ ضخم يجيب الأجراس والدلافين…' }) },
  { id: 'rabbit', isle: 'hill', emoji: '🐇', gait: 'hop', draw: A.rabbit, need: (n) => n('sunflowers') >= 4, name: tr({ en: 'Rabbit', he: 'ארנב', ar: 'أرنب' }), hint: tr({ en: 'Someone who hides in a field of sunflowers…', he: 'מישהו שמתחבא בשדה חמניות…', ar: 'أحدٌ يختبئ في حقل عبّاد الشمس…' }) },
  { id: 'sheep', isle: 'hill', emoji: '🐑', gait: 'walk', draw: A.sheep, need: (n) => n('tallgrass') >= 6 && n('lookout') > 0, name: tr({ en: 'Sheep', he: 'כבשה', ar: 'خروف' }), hint: tr({ en: 'Someone who grazes tall grass, with a view…', he: 'מישהו שרועה בדשא גבוה, עם נוף…', ar: 'أحدٌ يرعى العشب الطويل، مع إطلالة…' }) },
  { id: 'owl', isle: 'forest', emoji: '🦉', gait: 'perch', perch: 'treehouse', draw: A.owl, need: (n) => n('treehouse') > 0 && n('pine') >= 3, name: tr({ en: 'Owl', he: 'ינשוף', ar: 'بومة' }), hint: tr({ en: 'Someone who watches from a high house among pines…', he: 'מישהו שמשקיף מבית גבוה בין אורנים…', ar: 'أحدٌ يراقب من بيت عالٍ بين الصنوبر…' }) },
  { id: 'fox', isle: 'forest', emoji: '🦊', gait: 'walk', draw: A.fox, need: (n) => n('cabin') > 0 && n('fern') >= 2, name: tr({ en: 'Fox', he: 'שועל', ar: 'ثعلب' }), hint: tr({ en: 'Someone who sneaks between ferns near a warm cabin…', he: 'מישהו שמתגנב בין שרכים ליד בקתה חמימה…', ar: 'أحدٌ يتسلّل بين السرخس قرب كوخ دافئ…' }) },
  { id: 'deer', isle: 'forest', emoji: '🦌', gait: 'walk', draw: A.deer, need: (n) => n('moonpool') > 0 && n('mushrooms') >= 2, name: tr({ en: 'Deer', he: 'צבי', ar: 'غزال' }), hint: tr({ en: 'Someone who drinks moonlight by glowing mushrooms…', he: 'מישהו ששותה אור ירח ליד פטריות זוהרות…', ar: 'أحدٌ يشرب ضوء القمر قرب الفطر المضيء…' }) },
];

export const visitor = (id: string) => VISITORS.find((v) => v.id === id);

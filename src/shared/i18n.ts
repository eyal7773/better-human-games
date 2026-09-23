/**
 * Site-wide language. The choice is stored per device and applied to <html>
 * (lang + dir) before anything renders; switching languages reloads the page,
 * so modules can resolve their strings once at load time with `tr()`.
 */

export type Lang = 'en' | 'he' | 'ar';

export const LANGS: { code: Lang; name: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'he', name: 'עברית', dir: 'rtl' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
];

export const DEFAULT_LANG: Lang = 'en';
const KEY = 'bhg.lang';

const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.code === v);

function detect(): Lang {
  try {
    // ?lang=he makes links shareable in a specific language, and sticks.
    const q = new URLSearchParams(location.search).get('lang');
    if (isLang(q)) {
      localStorage.setItem(KEY, q);
      return q;
    }
  } catch {
    /* no URL / storage — fall through */
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage blocked */
  }
  return DEFAULT_LANG;
}

export const lang: Lang = detect();
export const dir: 'ltr' | 'rtl' = LANGS.find((l) => l.code === lang)!.dir;
export const isRTL = dir === 'rtl';

document.documentElement.lang = lang;
document.documentElement.dir = dir;

/** Picks the current language's string. English is the fallback. */
export function tr<T>(s: { en: T; he: T; ar: T }): T {
  return s[lang] ?? s.en;
}

export function setLang(next: Lang) {
  if (next === lang) return;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* won't persist, but still switch for this visit */
  }
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  location.replace(url.toString());
}

/** A row of language buttons; the current one is marked. */
export function langSwitcher(className = 'lang-switch'): HTMLElement {
  const nav = document.createElement('div');
  nav.className = className;
  nav.setAttribute('role', 'radiogroup');
  nav.setAttribute('aria-label', tr({ en: 'Language', he: 'שפה', ar: 'اللغة' }));
  for (const l of LANGS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.lang = l.code;
    b.dir = l.dir;
    b.textContent = l.name;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(l.code === lang));
    b.addEventListener('click', () => setLang(l.code));
    nav.append(b);
  }
  return nav;
}

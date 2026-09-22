/** localStorage can be missing or throw (private mode, blocked storage) — never let that break a game. */
export function load<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return { ...structuredClone(fallback), ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return structuredClone(fallback);
  }
}

export function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* progress just won't persist */
  }
}

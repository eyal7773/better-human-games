let enabled = true;

export function setHaptics(on: boolean) {
  enabled = on;
}

/** Vibration where supported (Android). Silently a no-op elsewhere. */
export function vibrate(pattern: number | number[]) {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

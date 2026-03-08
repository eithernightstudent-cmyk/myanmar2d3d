/**
 * Trigger a short haptic vibration on supported devices.
 * pattern: array of vibrate/pause durations in ms.
 * Default is a single light tap (15ms).
 */
export function haptic(pattern: number | number[] = 15) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration API not supported
  }
}

/** Light single tap */
export function hapticLight() {
  haptic(12);
}

/** Medium tap for confirmations */
export function hapticMedium() {
  haptic(25);
}

/** Double tap pattern */
export function hapticDouble() {
  haptic([15, 40, 15]);
}

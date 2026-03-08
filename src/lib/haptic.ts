/**
 * Haptic feedback + optional click sound for interactive elements.
 */

const CLICK_SOUND_KEY = "kktech-click-sound";

/** Trigger a short haptic vibration */
export function haptic(pattern: number | number[] = 20) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration API not supported
  }
}

/** Light single tap — 20ms for subtle professional feel */
export function hapticLight() {
  haptic(20);
}

/** Medium tap for confirmations */
export function hapticMedium() {
  haptic(30);
}

/** Double tap pattern */
export function hapticDouble() {
  haptic([20, 40, 20]);
}

// ---- Click Sound ----

let clickAudioCtx: AudioContext | null = null;

function getClickAudioCtx(): AudioContext | null {
  try {
    if (!clickAudioCtx) {
      clickAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return clickAudioCtx;
  } catch {
    return null;
  }
}

/** Play a very quiet, subtle click sound */
export function playClickSound() {
  if (!isClickSoundEnabled()) return;
  const ctx = getClickAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Very short, quiet tick — 2000Hz for a crisp click
  osc.type = "sine";
  osc.frequency.setValueAtTime(2000, ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.002);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.025);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
}

/** Check if click sound is enabled */
export function isClickSoundEnabled(): boolean {
  try {
    return localStorage.getItem(CLICK_SOUND_KEY) === "true";
  } catch {
    return false;
  }
}

/** Toggle click sound on/off */
export function setClickSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(CLICK_SOUND_KEY, enabled ? "true" : "false");
  } catch {}
}

/** Combined haptic + sound tap */
export function tap() {
  hapticLight();
  playClickSound();
}

/** Combined haptic + sound medium tap */
export function tapMedium() {
  hapticMedium();
  playClickSound();
}

// Notification sound + vibration for 2D result changes

const BEEP_FREQUENCY = 880; // Hz (A5 note)
const BEEP_DURATION = 150; // ms

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playNotificationBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume if suspended (autoplay policy)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(BEEP_FREQUENCY, ctx.currentTime);

  // Quick fade in/out to avoid click
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + BEEP_DURATION / 1000);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + BEEP_DURATION / 1000);
}

export function vibrateDevice() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // short-pause-short pattern
    }
  } catch {
    // Vibration API not supported
  }
}

export function notifyResultChange() {
  playNotificationBeep();
  vibrateDevice();
}

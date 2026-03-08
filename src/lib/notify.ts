// Notification sound + vibration + Web Push for 2D result changes

const BEEP_FREQUENCY = 880;
const BEEP_DURATION = 150;
const NOTIFICATION_PERMISSION_KEY = "kktech-notif-enabled";

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

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(BEEP_FREQUENCY, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + BEEP_DURATION / 1000);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + BEEP_DURATION / 1000);
}

export function vibrateDevice() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Vibration API not supported
  }
}

/** Check if browser supports notifications */
export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

/** Get current notification permission */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Request notification permission */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";
  
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, "true");
    }
    return result;
  } catch {
    return "denied";
  }
}

/** Check if user has opted in */
export function isNotificationEnabled(): boolean {
  if (!isNotificationSupported()) return false;
  return (
    Notification.permission === "granted" &&
    localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === "true"
  );
}

/** Toggle notification opt-in/out */
export function setNotificationEnabled(enabled: boolean) {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, enabled ? "true" : "false");
}

/** Send a browser notification for 2D result */
export function sendResultNotification(twod: string, sessionTime?: string) {
  if (!isNotificationEnabled()) return;
  
  try {
    const timeLabel = sessionTime || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const notification = new Notification("🎯 2D Result is out!", {
      body: `Number: ${twod} (${timeLabel})`,
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: `2d-result-${twod}-${Date.now()}`,
      requireInteraction: false,
      silent: false,
    });

    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn("Notification failed:", err);
  }
}

export function playVerifiedChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  // Two-tone ascending chime for "verified"
  const notes = [660, 880];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.15 + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.25);
    osc.start(ctx.currentTime + i * 0.15);
    osc.stop(ctx.currentTime + i * 0.15 + 0.25);
  });
}

export function notifyResultChange(twod?: string, sessionTime?: string) {
  playNotificationBeep();
  vibrateDevice();
  if (twod && twod !== "--") {
    sendResultNotification(twod, sessionTime);
  }
}

export function notifyVerified(twod?: string, sessionTime?: string) {
  playVerifiedChime();
  vibrateDevice();
  if (twod && twod !== "--") {
    sendResultNotification(twod, sessionTime);
  }
}

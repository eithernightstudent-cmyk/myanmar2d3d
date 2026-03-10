import { describe, it, expect } from "vitest";

// Replicate the exact logic from use-live-dashboard.ts
const SESSION_CLOSE_TIMES = ["11:00", "12:01", "15:00", "16:30"];
const SESSION_CLOSE_SECONDS = SESSION_CLOSE_TIMES.map((time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 3600 + m * 60;
});

const POLL_NORMAL_MS = 15000;
const POLL_HOT_MS = 2500;
const POLL_BURST_MS = 1000;
const POLL_BACKGROUND_MS = 45000;
const POLL_OFF_MARKET_MS = 180000;
const HOT_WINDOW_BEFORE_SECONDS = 5 * 60;
const HOT_WINDOW_AFTER_SECONDS = 5 * 60;
const BURST_WINDOW_BEFORE_SECONDS = 2 * 60;
const BURST_WINDOW_AFTER_SECONDS = 2 * 60;

interface Parts { weekday: string; hour: number; minute: number; second: number; }

function isWithinSessionWindow(nowSeconds: number, before: number, after: number): boolean {
  return SESSION_CLOSE_SECONDS.some(
    (close) => nowSeconds >= close - before && nowSeconds <= close + after,
  );
}

function isBurstWindow(parts: Parts): boolean {
  const s = parts.hour * 3600 + parts.minute * 60 + parts.second;
  return isWithinSessionWindow(s, BURST_WINDOW_BEFORE_SECONDS, BURST_WINDOW_AFTER_SECONDS);
}

function isHotMinute(parts: Parts): boolean {
  const s = parts.hour * 3600 + parts.minute * 60 + parts.second;
  return isWithinSessionWindow(s, HOT_WINDOW_BEFORE_SECONDS, HOT_WINDOW_AFTER_SECONDS);
}

function isWithinMarketHours(parts: Parts): boolean {
  if (parts.weekday === "Sat" || parts.weekday === "Sun") return false;
  const m = parts.hour * 60 + parts.minute;
  return m >= 570 && m <= 990; // 09:30 - 16:30
}

function getPollIntervalMs(parts: Parts, hidden: boolean): number {
  if (hidden) return POLL_BACKGROUND_MS;
  const marketOpen = isWithinMarketHours(parts);
  if (!marketOpen) return POLL_OFF_MARKET_MS;
  if (isBurstWindow(parts)) return POLL_BURST_MS;
  if (isHotMinute(parts)) return POLL_HOT_MS;
  return POLL_NORMAL_MS;
}

function makeParts(weekday: string, h: number, m: number, s = 0): Parts {
  return { weekday, hour: h, minute: m, second: s };
}

describe("Burst polling at session close times", () => {
  const sessions = [
    { label: "11:00 AM", h: 11, m: 0 },
    { label: "12:01 PM", h: 12, m: 1 },
    { label: "03:00 PM", h: 15, m: 0 },
    { label: "04:30 PM", h: 16, m: 30 },
  ];

  for (const sess of sessions) {
    it(`should return 1s (BURST) exactly at ${sess.label}`, () => {
      const parts = makeParts("Mon", sess.h, sess.m, 0);
      expect(getPollIntervalMs(parts, false)).toBe(POLL_BURST_MS);
      expect(isBurstWindow(parts)).toBe(true);
    });

    it(`should return 1s (BURST) 1 minute BEFORE ${sess.label}`, () => {
      const parts = makeParts("Tue", sess.h, sess.m - 1, 0);
      expect(getPollIntervalMs(parts, false)).toBe(POLL_BURST_MS);
    });

    it(`should return 1s (BURST) 2 minutes BEFORE ${sess.label}`, () => {
      const parts = makeParts("Wed", sess.h, sess.m - 2, 0);
      expect(getPollIntervalMs(parts, false)).toBe(POLL_BURST_MS);
    });

    // For 16:30, "after" windows fall outside market hours (16:30 is the boundary)
    if (sess.h === 16 && sess.m === 30) {
      it(`should return OFF_MARKET after ${sess.label} (market closes at 16:30)`, () => {
        const parts1 = makeParts("Thu", sess.h, sess.m + 1, 0);
        expect(getPollIntervalMs(parts1, false)).toBe(POLL_OFF_MARKET_MS);
        const parts2 = makeParts("Fri", sess.h, sess.m + 2, 0);
        expect(getPollIntervalMs(parts2, false)).toBe(POLL_OFF_MARKET_MS);
        const parts3 = makeParts("Mon", sess.h, sess.m + 3, 0);
        expect(getPollIntervalMs(parts3, false)).toBe(POLL_OFF_MARKET_MS);
      });
    } else {
      it(`should return 1s (BURST) 1 minute AFTER ${sess.label}`, () => {
        const parts = makeParts("Thu", sess.h, sess.m + 1, 0);
        expect(getPollIntervalMs(parts, false)).toBe(POLL_BURST_MS);
      });

      it(`should return 1s (BURST) 2 minutes AFTER ${sess.label}`, () => {
        const parts = makeParts("Fri", sess.h, sess.m + 2, 0);
        expect(getPollIntervalMs(parts, false)).toBe(POLL_BURST_MS);
      });

      it(`should return 2.5s (HOT) 3 minutes AFTER ${sess.label}`, () => {
        const parts = makeParts("Mon", sess.h, sess.m + 3, 0);
        expect(getPollIntervalMs(parts, false)).toBe(POLL_HOT_MS);
      });
    }
  }

  it("should return 15s (NORMAL) during market hours outside any window", () => {
    // 13:00 is far from any session
    const parts = makeParts("Mon", 13, 0, 0);
    expect(getPollIntervalMs(parts, false)).toBe(POLL_NORMAL_MS);
    expect(isBurstWindow(parts)).toBe(false);
    expect(isHotMinute(parts)).toBe(false);
  });

  it("should return 180s (OFF_MARKET) outside market hours on weekday", () => {
    const parts = makeParts("Mon", 7, 0, 0);
    expect(getPollIntervalMs(parts, false)).toBe(POLL_OFF_MARKET_MS);
  });

  it("should return 180s (OFF_MARKET) on weekends", () => {
    const parts = makeParts("Sat", 11, 0, 0);
    expect(getPollIntervalMs(parts, false)).toBe(POLL_OFF_MARKET_MS);
  });

  it("should return 45s (BACKGROUND) when tab is hidden even during burst", () => {
    const parts = makeParts("Mon", 11, 0, 0);
    expect(getPollIntervalMs(parts, true)).toBe(POLL_BACKGROUND_MS);
  });
});
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { notifyVerified } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import {
  getThailandParts,
  isWithinMarketHours,
  formatPartsClock,
  formatPartsDate,
  formatNumber,
  formatTimestamp,
  getNextCheckText,
  type ThailandParts,
} from "@/lib/market-utils";

const SESSION_CLOSE_TIMES = ["11:00", "12:01", "15:00", "16:30"];
const SESSION_TIME_SET = new Set(SESSION_CLOSE_TIMES);
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
const VERIFICATION_WINDOW_MS = 60000;

const DEFAULT_OWNER_NAME = "2D3D";
const OWNER_STORAGE_KEY = "kktech-live-owner-name";
const LIVE_CACHE_KEY = "kktech-live-cache-v1";
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000;
const RESULT_MODE_STORAGE_KEY = "kktech-result-display-mode";
const DEFAULT_RESULT_MODE = "hybrid";

type VerificationState = "verified" | "verifying" | "finalizing" | "live" | "closed";
type ResultDisplayMode = "hybrid" | "final-only";

interface CachedLiveState {
  data: LiveData;
  signature: string;
  savedAt: number;
}

export interface CurrentDayResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
  stock_date?: string;
  stock_datetime?: string;
  history_id?: string;
}

export interface LiveData {
  setIndex: number | null;
  value: number | null;
  calculated2d: string;
  connectionStatus: string;
  currentDate: string;
  serverTime: string;
  fetchedAt: string;
  currentDayResults: CurrentDayResult[];
  result: CurrentDayResult[];
  live: { set: string; value: string; time: string; twod: string; date: string };
  holiday: { status: string; date: string; name: string } | null;
  holidayName: string | null;
  source?: string;
}

function getSecondsOfDay(parts: ThailandParts) {
  return parts.hour * 3600 + parts.minute * 60 + parts.second;
}

function isWithinSessionWindow(nowSeconds: number, beforeSeconds: number, afterSeconds: number): boolean {
  return SESSION_CLOSE_SECONDS.some(
    (closeSeconds) =>
      nowSeconds >= closeSeconds - beforeSeconds &&
      nowSeconds <= closeSeconds + afterSeconds,
  );
}

function isHotMinute(parts: ThailandParts): boolean {
  const nowSeconds = getSecondsOfDay(parts);
  return isWithinSessionWindow(nowSeconds, HOT_WINDOW_BEFORE_SECONDS, HOT_WINDOW_AFTER_SECONDS);
}

function isBurstWindow(parts: ThailandParts): boolean {
  const nowSeconds = getSecondsOfDay(parts);
  return isWithinSessionWindow(nowSeconds, BURST_WINDOW_BEFORE_SECONDS, BURST_WINDOW_AFTER_SECONDS);
}

function getPollIntervalMs(parts: ThailandParts, hidden: boolean): number {
  if (hidden) return POLL_BACKGROUND_MS;
  if (isBurstWindow(parts)) return POLL_BURST_MS;
  if (isHotMinute(parts)) return POLL_HOT_MS;
  if (isWithinMarketHours(parts)) return POLL_NORMAL_MS;
  return POLL_OFF_MARKET_MS;
}

function parseStockTime(raw: string): { h: number; m: number; s: number } | null {
  const match = raw?.match(/(\d{2}):(\d{2}):(\d{2})\s*$/);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]), s: Number(match[3]) };
}

function getLatestResult(data: LiveData | null): CurrentDayResult | null {
  if (!data) return null;
  if (data.currentDayResults?.length) return data.currentDayResults[data.currentDayResults.length - 1];
  if (data.result?.length) return data.result[data.result.length - 1];
  return null;
}

function toTimeKey(raw: string | undefined): string {
  const text = String(raw ?? "").trim();
  const matched = text.match(/(\d{2}):(\d{2})/);
  return matched ? `${matched[1]}:${matched[2]}` : "";
}

function hasValidTwoD(raw: string | undefined): boolean {
  return /^\d{2}$/.test(String(raw ?? "").trim());
}

function getLatestSessionResult(data: LiveData | null): CurrentDayResult | null {
  if (!data) return null;
  const source = data.currentDayResults?.length ? data.currentDayResults : data.result || [];
  for (let i = source.length - 1; i >= 0; i--) {
    const entry = source[i];
    const timeKey = toTimeKey(entry?.open_time);
    if (SESSION_TIME_SET.has(timeKey) && hasValidTwoD(entry?.twod)) {
      return entry;
    }
  }
  return null;
}

function isHolidayActive(holiday: LiveData["holiday"]): boolean {
  if (!holiday) return false;
  const status = String(holiday.status ?? "").trim().toLowerCase();
  if (status === "1" || status === "true" || status === "yes" || status === "holiday" || status === "closed") {
    return true;
  }
  if (status === "0" || status === "false" || status === "no" || status === "") {
    return false;
  }
  return !!String(holiday.name ?? "").trim();
}

function buildDataSignature(data: LiveData): string {
  const latest = getLatestResult(data);
  const sessionResult = getLatestSessionResult(data);
  // When market is closed and we have a finalized session result, use stable values
  // to avoid signature changes from fluctuating calculated2d/setIndex/value
  const hasStableSession = sessionResult && hasValidTwoD(sessionResult.twod);
  return [
    data.currentDate || "",
    data.connectionStatus || "",
    hasStableSession ? sessionResult!.twod : (data.calculated2d || ""),
    hasStableSession ? "" : String(data.setIndex ?? ""),
    hasStableSession ? "" : String(data.value ?? ""),
    data.live?.time || "",
    latest?.history_id || "",
    latest?.stock_datetime || "",
    latest?.twod || "",
    data.holidayName || "",
    data.holiday?.name || "",
    data.source || "",
  ].join("|");
}

function readLiveCache(): CachedLiveState | null {
  try {
    const raw = localStorage.getItem(LIVE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLiveState;
    if (!parsed?.data || !parsed?.signature || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > LIVE_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveLiveCache(data: LiveData, signature: string) {
  try {
    localStorage.setItem(
      LIVE_CACHE_KEY,
      JSON.stringify({
        data,
        signature,
        savedAt: Date.now(),
      } as CachedLiveState),
    );
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

function getSessionVerificationStatus(
  parts: ThailandParts,
  stockDatetime: string | undefined,
  sessionCloseTime: string,
  isMarketLive: boolean,
  firstSeenAt: number | null,
): VerificationState {
  const [closeH, closeM] = sessionCloseTime.split(":").map(Number);
  const closeSeconds = closeH * 3600 + closeM * 60;

  if (stockDatetime) {
    const parsed = parseStockTime(stockDatetime);
    if (parsed) {
      const stockSeconds = parsed.h * 3600 + parsed.m * 60 + parsed.s;
      if (stockSeconds >= closeSeconds) {
        if (!isMarketLive) return "verified";
        if (firstSeenAt && Date.now() - firstSeenAt < VERIFICATION_WINDOW_MS) {
          return "verifying";
        }
        return "verified";
      }
    }
  }

  const nowSeconds = getSecondsOfDay(parts);
  const diff = nowSeconds - closeSeconds;
  if (diff >= 0 && diff <= 10) return "finalizing";
  if (diff > 10 && !stockDatetime) return "closed";

  if (isMarketLive) return "live";
  return "closed";
}

export function useLiveDashboard() {
  const [ownerName, setOwnerName] = useState(() => {
    try {
      return localStorage.getItem(OWNER_STORAGE_KEY) || DEFAULT_OWNER_NAME;
    } catch {
      return DEFAULT_OWNER_NAME;
    }
  });

  const [parts, setParts] = useState<ThailandParts>(getThailandParts());
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [resultDisplayMode, setResultDisplayMode] = useState<ResultDisplayMode>(() => {
    try {
      const saved = localStorage.getItem(RESULT_MODE_STORAGE_KEY);
      return saved === "final-only" ? "final-only" : DEFAULT_RESULT_MODE;
    } catch {
      return DEFAULT_RESULT_MODE;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiNote, setApiNote] = useState("Data source: waiting for API response...");
  const [flash, setFlash] = useState(false);
  const [lastSuccessTime, setLastSuccessTime] = useState<string>("--");
  const [pollIntervalMs, setPollIntervalMs] = useState(() => getPollIntervalMs(getThailandParts(), false));

  const liveDataRef = useRef<LiveData | null>(null);
  const lastSuccessRef = useRef("--");
  const lastFetchAtMs = useRef(0);
  const isUpdating = useRef(false);
  const queuedForceFetchRef = useRef(false);
  const pollTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const requestSeqRef = useRef(0);
  const latestAppliedSeqRef = useRef(0);
  const latestSignatureRef = useRef<string>("");
  const prev2dRef = useRef<string | null>(null);
  const prevVerificationRef = useRef<string | null>(null);
  const prevHistoryIdRef = useRef<string | null>(null);
  const firstSeenAtRef = useRef<number | null>(null);
  const firstSeenValueRef = useRef<string | null>(null);
  const fetchLiveDataRef = useRef<(force?: boolean) => Promise<void>>(async () => {});

  const updateOwnerName = useCallback((value: string) => {
    const cleaned = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 24) || DEFAULT_OWNER_NAME;
    setOwnerName(cleaned);
    try {
      localStorage.setItem(OWNER_STORAGE_KEY, cleaned);
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }, []);

  const toggleResultDisplayMode = useCallback(() => {
    setResultDisplayMode((prev) => {
      const next: ResultDisplayMode = prev === "hybrid" ? "final-only" : "hybrid";
      try {
        localStorage.setItem(RESULT_MODE_STORAGE_KEY, next);
      } catch {
        // Ignore storage failures (private mode / quota).
      }
      return next;
    });
  }, []);

  const applyLiveData = useCallback(
    (
      data: LiveData,
      options: {
        fromCache?: boolean;
        partsAtApply?: ThailandParts;
        requestId?: number;
      } = {},
    ) => {
      if (options.requestId != null && options.requestId < latestAppliedSeqRef.current) return;
      if (options.requestId != null) latestAppliedSeqRef.current = options.requestId;

      const signature = buildDataSignature(data);
      const changed = signature !== latestSignatureRef.current;
      const shouldHydrate = changed || liveDataRef.current == null;

      if (shouldHydrate) {
        latestSignatureRef.current = signature;
        liveDataRef.current = data;
        setLiveData(data);
      }

      const latestRes = getLatestResult(data);
      const new2d = data.calculated2d || "--";
      const newHistoryId = latestRes?.history_id || null;

      if (newHistoryId && newHistoryId !== prevHistoryIdRef.current) {
        if (new2d !== "--" && new2d !== firstSeenValueRef.current) {
          firstSeenAtRef.current = Date.now();
          firstSeenValueRef.current = new2d;
        }
      }
      prevHistoryIdRef.current = newHistoryId;

      if (firstSeenAtRef.current && firstSeenValueRef.current === new2d) {
        if (Date.now() - firstSeenAtRef.current >= VERIFICATION_WINDOW_MS) {
          firstSeenAtRef.current = null;
        }
      } else if (new2d !== firstSeenValueRef.current && new2d !== "--") {
        firstSeenAtRef.current = Date.now();
        firstSeenValueRef.current = new2d;
      }

      if (!options.fromCache) {
        // Keep UI update immediate but delay alert notification until verification completes.
        prev2dRef.current = new2d;

        if (changed) {
          if (flashTimerRef.current != null) clearTimeout(flashTimerRef.current);
          setFlash(true);
          flashTimerRef.current = window.setTimeout(() => setFlash(false), 180);
        }

        saveLiveCache(data, signature);
      }

      const now = formatTimestamp(new Date().toISOString());
      lastSuccessRef.current = now;
      setLastSuccessTime(now);

      const partsForCadence = options.partsAtApply || getThailandParts();
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const nextInterval = getPollIntervalMs(partsForCadence, hidden);
      setPollIntervalMs((prev) => (prev === nextInterval ? prev : nextInterval));

      const source = data.source || "thaistock2d";
      const pace = Math.max(1, Math.round(nextInterval / 100) / 10);
      const label = isBurstWindow(partsForCadence) ? " 🚀" : isHotMinute(partsForCadence) ? " ⚡" : "";
      setApiNote(`Source: ${source} | Refresh: ${pace}s${label} | ${now}`);
    },
    [],
  );

  const fetchLiveData = useCallback(
    async (force = false) => {
      const currentParts = getThailandParts();
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const withinMarket = isWithinMarketHours(currentParts);
      const withinBurst = isBurstWindow(currentParts);
      const dueOffMarketRefresh = Date.now() - lastFetchAtMs.current >= POLL_OFF_MARKET_MS;

      if (!force && !withinMarket && !withinBurst && (hidden || !dueOffMarketRefresh)) return;

      if (isUpdating.current) {
        if (force) queuedForceFetchRef.current = true;
        return;
      }

      isUpdating.current = true;
      setIsSyncing(true);
      const requestId = ++requestSeqRef.current;

      try {
        let payload: any;

        // Use prefetched data from inline script on first load
        const prefetched = (window as any).__prefetchedLive;
        if (prefetched) {
          (window as any).__prefetchedLive = null; // consume once
          payload = await prefetched;
        }

        if (!payload) {
          const resp = await supabase.functions.invoke("set-live");
          if (resp.error) throw new Error(resp.error.message || "Edge function error");
          payload = resp.data;
        }

        const data = payload?.data as LiveData | undefined;
        if (!data) throw new Error("No data in response");

        applyLiveData(data, {
          fromCache: false,
          partsAtApply: currentParts,
          requestId,
        });
      } catch (err) {
        console.error("Fetch error:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        setApiNote(`Error: ${msg} | Last sync: ${lastSuccessRef.current}`);
      } finally {
        lastFetchAtMs.current = Date.now();
        isUpdating.current = false;
        setIsSyncing(false);

        if (queuedForceFetchRef.current) {
          queuedForceFetchRef.current = false;
          window.setTimeout(() => {
            void fetchLiveDataRef.current(true);
          }, 0);
        }
      }
    },
    [applyLiveData],
  );

  fetchLiveDataRef.current = fetchLiveData;

  useEffect(() => {
    const clockId = setInterval(() => {
      setParts(getThailandParts());
    }, 1000);
    return () => clearInterval(clockId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = async () => {
      if (cancelled) return;
      const startedAt = Date.now();
      const cycleParts = getThailandParts();
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const interval = getPollIntervalMs(cycleParts, hidden);
      setPollIntervalMs((prev) => (prev === interval ? prev : interval));

      await fetchLiveDataRef.current(false);

      const elapsed = Date.now() - startedAt;
      const waitMs = Math.max(300, interval - elapsed);
      pollTimerRef.current = window.setTimeout(scheduleNext, waitMs);
    };

    void scheduleNext();

    return () => {
      cancelled = true;
      if (pollTimerRef.current != null) clearTimeout(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      const hidden = document.visibilityState === "hidden";
      const currentParts = getThailandParts();
      const interval = getPollIntervalMs(currentParts, hidden);
      setPollIntervalMs((prev) => (prev === interval ? prev : interval));
      if (!hidden) void fetchLiveDataRef.current(true);
    };

    const onFocus = () => {
      void fetchLiveDataRef.current(true);
    };

    const onOnline = () => {
      void fetchLiveDataRef.current(true);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    const cached = readLiveCache();
    if (cached) {
      latestSignatureRef.current = cached.signature;
      liveDataRef.current = cached.data;
      prev2dRef.current = cached.data.calculated2d || null;
      setLiveData(cached.data);
      setLastSuccessTime(formatTimestamp(new Date(cached.savedAt).toISOString()));
    }
    void fetchLiveDataRef.current(true);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current != null) clearTimeout(flashTimerRef.current);
      if (pollTimerRef.current != null) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const clock = formatPartsClock(parts);
  const dateStr = formatPartsDate(parts);
  // When market is closed, prefer the official session result over the calculated value
  const twod = (() => {
    if (!liveData) return "--";
    const isMarketLive = isWithinMarketHours(parts);
    if (isMarketLive) return liveData.calculated2d || "--";
    // Market closed: use latest session result's twod if available
    const sessionResult = getLatestSessionResult(liveData);
    if (sessionResult && hasValidTwoD(sessionResult.twod)) return sessionResult.twod;
    return liveData.calculated2d || "--";
  })();
  const rawConnectionStatus = liveData?.connectionStatus || "Closed";
  const isHoliday = isHolidayActive(liveData?.holiday || null);
  const isTradingDay = useMemo(
    () => parts.weekday !== "Sat" && parts.weekday !== "Sun" && !isHoliday,
    [parts.weekday, isHoliday],
  );
  const isLive = useMemo(() => isWithinMarketHours(parts) && isTradingDay, [parts, isTradingDay]);
  const connectionStatus =
    !isTradingDay
      ? "Closed"
      : !isLive
        ? "Closed"
        : rawConnectionStatus.toLowerCase() === "live"
          ? "Live"
          : "Open";

  const getLastDigit = (raw: unknown) => {
    const digits = String(raw ?? "").replace(/\D/g, "");
    return digits ? digits[digits.length - 1] : "-";
  };

  const setDigit = liveData?.setIndex != null ? getLastDigit(liveData.setIndex) : "-";
  const valueDigit = liveData?.value != null ? getLastDigit(liveData.value) : "-";

  const getLastNDigits = (raw: unknown, n: number) => {
    const digits = String(Math.floor(Math.abs(Number(raw ?? 0)))).replace(/\D/g, "");
    return digits.length >= n ? digits.slice(-n) : digits.padStart(n, "0");
  };

  const threed = liveData?.value != null ? getLastNDigits(liveData.value, 3) : "---";
  const setFormatted = liveData?.setIndex != null ? formatNumber(liveData.setIndex) : "--";
  const valueFormatted = liveData?.value != null ? formatNumber(liveData.value) : "--";
  const lastUpdated = liveData ? formatTimestamp(liveData.fetchedAt || liveData.serverTime) : `${dateStr} ${clock}`;

  const liveTime = liveData?.live?.time;
  const marketTimestamp =
    liveTime && liveTime !== "--" ? `${liveData?.currentDate || "--"} ${liveTime}` : liveData?.currentDate || "--";

  const latestResult = getLatestResult(liveData);
  const latestSessionResult = getLatestSessionResult(liveData);
  const rawStockDatetime = latestResult?.stock_datetime || "";
  const verificationStockDatetime = latestSessionResult?.stock_datetime || "";
  const latestSessionTwod = String(latestSessionResult?.twod || "").trim();
  const hasLatestSessionTwod = /^\d{2}$/.test(latestSessionTwod);
  const isCurrentTwodSessionResult = hasLatestSessionTwod && twod === latestSessionTwod;
  const stockDatetime = (() => {
    if (!rawStockDatetime) return "--";
    const match = rawStockDatetime.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]} ${match[4]}`;
    return rawStockDatetime;
  })();

  const nextCheck = getNextCheckText(parts, lastFetchAtMs.current, pollIntervalMs);
  const currentDate = liveData?.currentDate || "--";

  const resultVerificationStatus = useMemo(() => {
    const latestSessionTime = (() => {
      const nowMins = parts.hour * 60 + parts.minute;
      for (let i = SESSION_CLOSE_TIMES.length - 1; i >= 0; i--) {
        const [h, m] = SESSION_CLOSE_TIMES[i].split(":").map(Number);
        if (nowMins >= h * 60 + m) return SESSION_CLOSE_TIMES[i];
      }
      return SESSION_CLOSE_TIMES[SESSION_CLOSE_TIMES.length - 1];
    })();

    return getSessionVerificationStatus(
      parts,
      verificationStockDatetime,
      latestSessionTime,
      isLive,
      firstSeenAtRef.current,
    );
  }, [parts, verificationStockDatetime, isLive]);

  const uiVerificationStatus: VerificationState = useMemo(() => {
    if (!isLive) return resultVerificationStatus;

    const nowSeconds = getSecondsOfDay(parts);
    const RESET_BUFFER_SECONDS = 120; // 2 min after close → reset to "live" for next session

    // Find the next upcoming session close
    const nextSessionIdx = SESSION_CLOSE_SECONDS.findIndex((s) => nowSeconds < s);
    // Find the last session close that already passed
    const lastPassedIdx =
      nextSessionIdx > 0
        ? nextSessionIdx - 1
        : nextSessionIdx === -1
          ? SESSION_CLOSE_SECONDS.length - 1
          : -1;

    // Before any session has closed today
    if (lastPassedIdx < 0) return "live";

    // If past last close + buffer AND there's a next session → new live window
    if (nextSessionIdx >= 0) {
      const lastClose = SESSION_CLOSE_SECONDS[lastPassedIdx];
      if (nowSeconds > lastClose + RESET_BUFFER_SECONDS) {
        console.log("[DEBUG] Reset to live:", { nowSeconds, lastClose, buffer: lastClose + RESET_BUFFER_SECONDS, isLive, isCurrentTwodSessionResult, resultVerificationStatus });
        return "live";
      }
    }

    // Within the buffer after a session close — keep verification status
    if (!isCurrentTwodSessionResult) return "live";
    console.log("[DEBUG] Keeping verified:", { nowSeconds, isLive, isCurrentTwodSessionResult, resultVerificationStatus });
    return resultVerificationStatus;
  }, [isLive, isCurrentTwodSessionResult, resultVerificationStatus, parts]);

  const resultConfirmSecondsLeft =
    isLive && uiVerificationStatus === "verifying" && firstSeenAtRef.current
      ? Math.max(0, Math.ceil((VERIFICATION_WINDOW_MS - (Date.now() - firstSeenAtRef.current)) / 1000))
      : 0;

  const isResultPreliminary = isLive && (uiVerificationStatus === "verifying" || uiVerificationStatus === "finalizing");

  useEffect(() => {
    if (
      (prevVerificationRef.current === "finalizing" || prevVerificationRef.current === "verifying") &&
      uiVerificationStatus === "verified"
    ) {
      notifyVerified(twod);
    }
    prevVerificationRef.current = uiVerificationStatus;
  }, [uiVerificationStatus, twod]);

  const isResultLocked = uiVerificationStatus === "verified" || (!isLive && verificationStockDatetime !== "");
  const isFinalOnlyMode = resultDisplayMode === "final-only";
  const shouldHideUnverified = isFinalOnlyMode && !isResultLocked;
  const displayTwod = shouldHideUnverified ? "--" : twod;
  const showPreliminaryBadge = !isFinalOnlyMode && isResultPreliminary;
  const dataSource = liveData?.source || "thaistock2d";
  const refreshData = useCallback(() => {
    void fetchLiveDataRef.current(true);
  }, []);

  return {
    ownerName,
    updateOwnerName,
    resultDisplayMode,
    toggleResultDisplayMode,
    isFinalOnlyMode,
    clock,
    dateStr,
    isLive,
    isTradingDay,
    isSyncing,
    flash,
    twod: displayTwod,
    threed,
    setDigit,
    valueDigit,
    setFormatted,
    valueFormatted,
    lastUpdated,
    marketTimestamp,
    apiNote,
    nextCheck,
    connectionStatus,
    currentDate,
    lastSuccessTime,
    currentDayResults: liveData?.currentDayResults || [],
    lastFetchTime: lastFetchAtMs.current
      ? `${formatPartsDate(getThailandParts(new Date(lastFetchAtMs.current)))} ${formatPartsClock(getThailandParts(new Date(lastFetchAtMs.current)))} (TH)`
      : "--",
    results: liveData?.currentDayResults || [],
    allResults: liveData?.result || [],
    holiday: liveData?.holiday,
    holidayName: (() => {
      const raw = liveData?.holidayName;
      if (raw && raw !== "null" && raw !== "NULL" && raw.trim() !== "") return raw;
      const hName = liveData?.holiday?.name;
      if (hName && hName !== "null" && hName !== "NULL" && hName.trim() !== "") return hName;
      if (!isLive && liveData) {
        if (parts.weekday === "Sun") return "Sunday";
        if (parts.weekday === "Sat") return "Saturday";
      }
      return null;
    })(),
    stockDatetime,
    resultVerificationStatus: uiVerificationStatus,
    isResultLocked,
    isResultPreliminary: showPreliminaryBadge,
    resultConfirmSecondsLeft,
    dataSource,
    isHotMinute: isHotMinute(parts),
    refreshData,
  };
}

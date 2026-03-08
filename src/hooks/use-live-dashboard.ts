import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { notifyResultChange, notifyVerified } from "@/lib/notify";
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

/** Session closing times in HH:MM format */
const SESSION_CLOSE_TIMES = ["11:00", "12:01", "15:00", "16:30"];

/** Burst windows: ±2 min around each session close */
const BURST_WINDOWS = SESSION_CLOSE_TIMES.map((t) => {
  const [h, m] = t.split(":").map(Number);
  const totalMin = h * 60 + m;
  return { start: totalMin - 2, end: totalMin + 2 };
});

/** Hot windows: ±5 min around each session close */
const HOT_WINDOWS = SESSION_CLOSE_TIMES.map((t) => {
  const [h, m] = t.split(":").map(Number);
  const totalMin = h * 60 + m;
  return { start: totalMin - 5, end: totalMin + 5 };
});

// Adaptive polling intervals
const POLL_NORMAL_MS = 15000;      // 15s during normal market hours
const POLL_HOT_MS = 2500;          // 2.5s near session close
const POLL_BURST_MS = 1200;        // 1.2s right at session close
const POLL_BACKGROUND_MS = 45000;  // 45s when tab not visible
const POLL_OFFMARKET_MS = 180000;  // 3min off-market periodic check

const VERIFICATION_WINDOW_MS = 60000;

const CACHE_KEY = "kktech-live-cache-v1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Check if current time falls within a burst window (±2 min of close) */
function isBurstMinute(parts: ThailandParts): boolean {
  const nowMins = parts.hour * 60 + parts.minute;
  return BURST_WINDOWS.some((w) => nowMins >= w.start && nowMins <= w.end);
}

/** Check if current time falls within a hot window (±5 min of close) */
function isHotMinute(parts: ThailandParts): boolean {
  const nowMins = parts.hour * 60 + parts.minute;
  return HOT_WINDOWS.some((w) => nowMins >= w.start && nowMins <= w.end);
}

/** Determine the current adaptive poll interval */
function getAdaptivePollInterval(parts: ThailandParts, isTabVisible: boolean): number {
  if (!isTabVisible) return POLL_BACKGROUND_MS;
  if (!isWithinMarketHours(parts)) return POLL_OFFMARKET_MS;
  if (isBurstMinute(parts)) return POLL_BURST_MS;
  if (isHotMinute(parts)) return POLL_HOT_MS;
  return POLL_NORMAL_MS;
}

/** Generate a payload signature from critical fields to detect real changes */
function payloadSignature(data: any): string {
  if (!data) return "";
  const sig = [
    data.calculated2d,
    data.connectionStatus,
    data.setIndex,
    data.value,
    data.currentDayResults?.length,
    data.currentDayResults?.map((r: any) => `${r.open_time}:${r.twod}`).join(","),
  ].join("|");
  return sig;
}

/** Read cached data from localStorage */
function readCache(): { data: any; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Write data to localStorage cache */
function writeCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

/** Parse "YYYY-MM-DD HH:MM:SS" into { h, m, s } */
function parseStockTime(raw: string): { h: number; m: number; s: number } | null {
  const match = raw?.match(/(\d{2}):(\d{2}):(\d{2})\s*$/);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]), s: Number(match[3]) };
}

function getSessionVerificationStatus(
  parts: ThailandParts,
  stockDatetime: string | undefined,
  sessionCloseTime: string,
  isMarketLive: boolean,
  firstSeenAt: number | null,
): "verified" | "verifying" | "finalizing" | "live" | "closed" {
  const [closeH, closeM] = sessionCloseTime.split(":").map(Number);
  const closeSeconds = closeH * 3600 + closeM * 60;

  if (stockDatetime) {
    const parsed = parseStockTime(stockDatetime);
    if (parsed) {
      const stockSeconds = parsed.h * 3600 + parsed.m * 60 + parsed.s;
      if (stockSeconds >= closeSeconds) {
        if (firstSeenAt && Date.now() - firstSeenAt < VERIFICATION_WINDOW_MS) {
          return "verifying";
        }
        return "verified";
      }
    }
  }

  const nowSeconds = parts.hour * 3600 + parts.minute * 60 + parts.second;
  const diff = nowSeconds - closeSeconds;
  if (diff >= 0 && diff <= 10) return "finalizing";
  if (diff > 10 && !stockDatetime) return "closed";

  if (isMarketLive) return "live";
  return "closed";
}

const DEFAULT_OWNER_NAME = "2D3D";
const OWNER_STORAGE_KEY = "kktech-live-owner-name";

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

export function useLiveDashboard() {
  const [ownerName, setOwnerName] = useState(() => {
    try {
      return localStorage.getItem(OWNER_STORAGE_KEY) || DEFAULT_OWNER_NAME;
    } catch {
      return DEFAULT_OWNER_NAME;
    }
  });

  const [parts, setParts] = useState<ThailandParts>(getThailandParts());
  const [liveData, setLiveData] = useState<LiveData | null>(() => {
    // Warm start from localStorage cache
    const cached = readCache();
    return cached?.data || null;
  });
  const [isLive, setIsLive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiNote, setApiNote] = useState("Data source: waiting for API response...");
  const [flash, setFlash] = useState(false);
  const [lastSuccessTime, setLastSuccessTime] = useState<string>("--");

  const lastFetchAtMs = useRef(0);
  const isUpdating = useRef(false);
  const hasRendered = useRef(false);
  const prev2dRef = useRef<string | null>(null);
  const prevVerificationRef = useRef<string | null>(null);
  const prevHistoryIdRef = useRef<string | null>(null);
  const prevPayloadSigRef = useRef<string>("");
  const requestSeqRef = useRef(0); // Stale-response guard

  // Track when a new 2D number was first seen for verification timing
  const firstSeenAtRef = useRef<number | null>(null);
  const firstSeenValueRef = useRef<string | null>(null);

  const updateOwnerName = useCallback((value: string) => {
    const cleaned = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 24) || DEFAULT_OWNER_NAME;
    setOwnerName(cleaned);
    try {
      localStorage.setItem(OWNER_STORAGE_KEY, cleaned);
    } catch {}
  }, []);

  const fetchLiveData = useCallback(async (force = false) => {
    if (isUpdating.current) return;
    isUpdating.current = true;
    setIsSyncing(true);

    const seqId = ++requestSeqRef.current;

    try {
      const { data: payload, error } = await supabase.functions.invoke("set-live");

      // Stale-response guard: ignore if a newer request was started
      if (seqId !== requestSeqRef.current) return;

      if (error) throw new Error(error.message || "Edge function error");

      const data = payload?.data;
      if (!data) throw new Error("No data in response");

      // Payload signature dedupe: skip full setState if critical data unchanged
      const newSig = payloadSignature(data);
      if (newSig === prevPayloadSigRef.current && !force) {
        // Data unchanged — update fetch time but skip re-render
        lastFetchAtMs.current = Date.now();
        return;
      }
      prevPayloadSigRef.current = newSig;

      setLiveData(data);
      writeCache(data);
      hasRendered.current = true;

      // Track 2D number changes for verification timing
      const new2d = data.calculated2d || "--";
      const latestRes = data.currentDayResults?.length
        ? data.currentDayResults[data.currentDayResults.length - 1]
        : null;
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

      // Notify on 2D change during market hours
      const currentParts2 = getThailandParts();
      if (
        prev2dRef.current !== null &&
        prev2dRef.current !== new2d &&
        new2d !== "--" &&
        isWithinMarketHours(currentParts2)
      ) {
        const sessionTime = latestRes?.open_time?.slice(0, 5) || undefined;
        notifyResultChange(new2d, sessionTime);
      }
      prev2dRef.current = new2d;

      setFlash(true);
      setTimeout(() => setFlash(false), 180);

      const now = formatTimestamp(new Date().toISOString());
      setLastSuccessTime(now);

      const source = data.source || "thaistock2d";
      const p = getThailandParts();
      const interval = getAdaptivePollInterval(p, !document.hidden);
      setApiNote(`Source: ${source} | Refresh: ${Math.round(interval / 1000)}s${isBurstMinute(p) ? " 🔥" : isHotMinute(p) ? " ⚡" : ""} | ${now}`);
    } catch (err) {
      if (seqId !== requestSeqRef.current) return;
      console.error("Fetch error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiNote(`Error: ${msg} | Last sync: ${lastSuccessTime}`);
    } finally {
      if (seqId === requestSeqRef.current) {
        lastFetchAtMs.current = Date.now();
        isUpdating.current = false;
        setIsSyncing(false);
      }
    }
  }, [lastSuccessTime]);

  // Clock tick every second with adaptive polling
  useEffect(() => {
    const interval = setInterval(() => {
      const p = getThailandParts();
      setParts(p);

      const apiStatus = liveData?.connectionStatus?.toLowerCase();
      const withinMarket = isWithinMarketHours(p);
      setIsLive(withinMarket && apiStatus === "live");

      const isTabVisible = !document.hidden;
      const pollInterval = getAdaptivePollInterval(p, isTabVisible);

      if (!lastFetchAtMs.current || Date.now() - lastFetchAtMs.current >= pollInterval) {
        fetchLiveData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchLiveData, liveData]);

  // Visibility/focus/online: force immediate refresh
  useEffect(() => {
    const forceRefresh = () => {
      // Small delay to avoid race conditions
      setTimeout(() => fetchLiveData(true), 100);
    };

    const onVisibility = () => {
      if (!document.hidden) forceRefresh();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", forceRefresh);
    window.addEventListener("online", forceRefresh);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", forceRefresh);
      window.removeEventListener("online", forceRefresh);
    };
  }, [fetchLiveData]);

  // Initial fetch (always)
  useEffect(() => {
    fetchLiveData(true);
  }, [fetchLiveData]);

  const clock = formatPartsClock(parts);
  const dateStr = formatPartsDate(parts);

  const twod = liveData?.calculated2d || "--";
  const connectionStatus = liveData?.connectionStatus || "Closed";

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
  const marketTimestamp = liveTime && liveTime !== "--"
    ? `${liveData?.currentDate || "--"} ${liveTime}`
    : liveData?.currentDate || "--";

  const latestResult = liveData?.currentDayResults?.length
    ? liveData.currentDayResults[liveData.currentDayResults.length - 1]
    : liveData?.result?.length
      ? liveData.result[liveData.result.length - 1]
      : null;
  const rawStockDatetime = (latestResult as any)?.stock_datetime || "";
  const stockDatetime = (() => {
    if (!rawStockDatetime) return "--";
    const match = rawStockDatetime.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]} ${match[4]}`;
    return rawStockDatetime;
  })();

  const pollInterval = getAdaptivePollInterval(parts, !document.hidden);
  const nextCheck = getNextCheckText(parts, lastFetchAtMs.current, pollInterval);
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
      rawStockDatetime,
      latestSessionTime,
      isLive,
      firstSeenAtRef.current,
    );
  }, [parts, rawStockDatetime, isLive]);

  // Play verified chime when status transitions
  useEffect(() => {
    if (
      (prevVerificationRef.current === "finalizing" || prevVerificationRef.current === "verifying") &&
      resultVerificationStatus === "verified"
    ) {
      notifyVerified(twod);
    }
    prevVerificationRef.current = resultVerificationStatus;
  }, [resultVerificationStatus, twod]);

  const isResultLocked = resultVerificationStatus === "verified" ||
    (!isLive && rawStockDatetime !== "");

  const dataSource = liveData?.source || "thaistock2d";

  // Stable refresh callback for PullToRefresh
  const refreshData = useCallback(() => fetchLiveData(true), [fetchLiveData]);

  return {
    ownerName,
    updateOwnerName,
    clock,
    dateStr,
    isLive,
    isSyncing,
    flash,
    twod,
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
    resultVerificationStatus,
    isResultLocked,
    dataSource,
    isHotMinute: isHotMinute(parts),
    refreshData,
  };
}

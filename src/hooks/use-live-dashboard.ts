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

/** Hot minutes windows (Myanmar Time = Thailand Time) for aggressive polling */
const HOT_WINDOWS = [
  { startH: 11, startM: 55, endH: 12, endM: 5 },   // 11:55 AM - 12:05 PM
  { startH: 16, startM: 25, endH: 16, endM: 40 },   // 4:25 PM - 4:40 PM
];

const POLL_NORMAL_MS = 60000;     // 60s during normal hours
const POLL_HOT_MS = 7000;         // 7s during hot minutes
const VERIFICATION_WINDOW_MS = 60000; // 60s verification window

/** Check if current time falls within a hot window */
function isHotMinute(parts: ThailandParts): boolean {
  const nowMins = parts.hour * 60 + parts.minute;
  return HOT_WINDOWS.some(w => {
    const start = w.startH * 60 + w.startM;
    const end = w.endH * 60 + w.endM;
    return nowMins >= start && nowMins <= end;
  });
}

/** Parse "YYYY-MM-DD HH:MM:SS" into { h, m, s } */
function parseStockTime(raw: string): { h: number; m: number; s: number } | null {
  const match = raw?.match(/(\d{2}):(\d{2}):(\d{2})\s*$/);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]), s: Number(match[3]) };
}

/**
 * Determine verification status for a session:
 * - "verified": result stayed consistent for 60s or history_id confirmed
 * - "verifying": new number detected within last 60s
 * - "finalizing": within 10s after session close time, not yet confirmed
 * - "live": market open, session not yet closed
 * - "closed": market closed / no data
 */
function getSessionVerificationStatus(
  parts: ThailandParts,
  stockDatetime: string | undefined,
  sessionCloseTime: string,
  isMarketLive: boolean,
  firstSeenAt: number | null,
): "verified" | "verifying" | "finalizing" | "live" | "closed" {
  const [closeH, closeM] = sessionCloseTime.split(":").map(Number);
  const closeSeconds = closeH * 3600 + closeM * 60;

  // If we have a stock_datetime at or after the session close
  if (stockDatetime) {
    const parsed = parseStockTime(stockDatetime);
    if (parsed) {
      const stockSeconds = parsed.h * 3600 + parsed.m * 60 + parsed.s;
      if (stockSeconds >= closeSeconds) {
        // Check if we're still in the verification window
        if (firstSeenAt && Date.now() - firstSeenAt < VERIFICATION_WINDOW_MS) {
          return "verifying";
        }
        return "verified";
      }
    }
  }

  // Check if we're in the finalizing window (0-10s after close)
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
  const [liveData, setLiveData] = useState<LiveData | null>(null);
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
    const currentParts = getThailandParts();
    if (!force && !isWithinMarketHours(currentParts)) return;
    if (isUpdating.current) return;
    isUpdating.current = true;
    setIsSyncing(true);

    try {
      const { data: payload, error } = await supabase.functions.invoke("set-live");

      if (error) throw new Error(error.message || "Edge function error");

      const data = payload?.data;
      if (!data) throw new Error("No data in response");

      setLiveData(data);
      hasRendered.current = true;

      // Track 2D number changes for verification timing
      const new2d = data.calculated2d || "--";
      const latestRes = data.currentDayResults?.length
        ? data.currentDayResults[data.currentDayResults.length - 1]
        : null;
      const newHistoryId = latestRes?.history_id || null;

      // If history_id changed, this is a confirmed new result
      if (newHistoryId && newHistoryId !== prevHistoryIdRef.current) {
        if (new2d !== "--" && new2d !== firstSeenValueRef.current) {
          firstSeenAtRef.current = Date.now();
          firstSeenValueRef.current = new2d;
        }
      }
      prevHistoryIdRef.current = newHistoryId;

      // If first seen value stayed consistent for 60s, mark as verified
      if (firstSeenAtRef.current && firstSeenValueRef.current === new2d) {
        if (Date.now() - firstSeenAtRef.current >= VERIFICATION_WINDOW_MS) {
          firstSeenAtRef.current = null; // Clear - it's verified now
        }
      } else if (new2d !== firstSeenValueRef.current && new2d !== "--") {
        // Number changed, reset verification timer
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
      const hot = isHotMinute(currentParts);
      const interval = hot ? `${POLL_HOT_MS / 1000}s` : `${POLL_NORMAL_MS / 1000}s`;
      setApiNote(`Source: ${source} | Refresh: ${interval}${hot ? " ⚡" : ""} | ${now}`);
    } catch (err) {
      console.error("Fetch error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiNote(`Error: ${msg} | Last sync: ${lastSuccessTime}`);
    } finally {
      lastFetchAtMs.current = Date.now();
      isUpdating.current = false;
      setIsSyncing(false);
    }
  }, [lastSuccessTime]);

  // Clock tick every second with smart polling
  useEffect(() => {
    const interval = setInterval(() => {
      const p = getThailandParts();
      setParts(p);

      const apiStatus = liveData?.connectionStatus?.toLowerCase();
      const withinMarket = isWithinMarketHours(p);
      setIsLive(withinMarket && apiStatus === "live");

      // Smart polling: hot minutes = fast, normal = slower
      const pollInterval = isHotMinute(p) ? POLL_HOT_MS : POLL_NORMAL_MS;

      if (withinMarket && (!lastFetchAtMs.current || Date.now() - lastFetchAtMs.current >= pollInterval)) {
        fetchLiveData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchLiveData, liveData]);

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

  const nextCheck = getNextCheckText(parts, lastFetchAtMs.current);
  const currentDate = liveData?.currentDate || "--";

  // Determine verification status with timing-based verification
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
      // Fallback: if holiday object has a name
      const hName = liveData?.holiday?.name;
      if (hName && hName !== "null" && hName !== "NULL" && hName.trim() !== "") return hName;
      // Fallback for weekends
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
    refreshData: () => fetchLiveData(true),
  };
}

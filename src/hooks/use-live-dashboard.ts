import { useState, useEffect, useCallback, useRef } from "react";
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

const POLL_INTERVAL_MS = 20000; // 20 seconds
const DEFAULT_OWNER_NAME = "2D3D";
const OWNER_STORAGE_KEY = "kktech-live-owner-name";

export interface CurrentDayResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
  stock_date?: string;
  stock_datetime?: string;
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
  live: { set: string; value: string; time: string; twod: string; date: string };
  holiday: { status: string; date: string; name: string } | null;
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

      const setNumeric = data.setIndex;
      const valueNumeric = data.value;
      if (setNumeric === null || valueNumeric === null) {
        throw new Error("SET Index/Value are unavailable in upstream data.");
      }

      setLiveData(data);
      hasRendered.current = true;
      setFlash(true);
      setTimeout(() => setFlash(false), 180);

      const now = formatTimestamp(new Date().toISOString());
      setLastSuccessTime(now);

      const sourceLabel = data.source === "rapidapi" ? "RapidAPI" : "thaistock2d";
      setApiNote(`Source: ${sourceLabel} | Auto-refresh: 20s | ${now}`);
    } catch (err) {
      console.error("Fetch error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiNote(`⚠️ Error: ${msg} | Last sync: ${lastSuccessTime}`);
      // Keep previous liveData so UI doesn't go blank
    } finally {
      lastFetchAtMs.current = Date.now();
      isUpdating.current = false;
      setIsSyncing(false);
    }
  }, [lastSuccessTime]);

  // Clock tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      const p = getThailandParts();
      setParts(p);

      const apiStatus = liveData?.connectionStatus?.toLowerCase();
      const withinMarket = isWithinMarketHours(p);
      setIsLive(withinMarket && apiStatus === "live");

      // Auto-fetch during market hours at 20s intervals
      if (withinMarket && (!lastFetchAtMs.current || Date.now() - lastFetchAtMs.current >= POLL_INTERVAL_MS)) {
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

  const nextCheck = getNextCheckText(parts, lastFetchAtMs.current);
  const currentDate = liveData?.currentDate || "--";

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
    holiday: liveData?.holiday,
  };
}

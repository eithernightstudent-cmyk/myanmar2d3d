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

const POLL_INTERVAL_MS = 30000;
const DEFAULT_OWNER_NAME = "KKTech";
const OWNER_STORAGE_KEY = "kktech-live-owner-name";

export interface LiveData {
  setIndex: number | null;
  value: number | null;
  calculated2d: string;
  marketStatus: string;
  marketDateTime: string;
  serverTime: string;
  fetchedAt: string;
  results: Array<{
    set: string;
    value: string;
    open_time: string;
    twod: string;
    stock_date: string;
    stock_datetime: string;
  }>;
  holiday: { status: string; date: string; name: string } | null;
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
  const [apiNote, setApiNote] = useState("Connecting to thaistock2d.com...");
  const [flash, setFlash] = useState(false);
  const lastFetchAtMs = useRef(0);
  const isUpdating = useRef(false);

  const updateOwnerName = useCallback((value: string) => {
    const cleaned = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 24) || DEFAULT_OWNER_NAME;
    setOwnerName(cleaned);
    try {
      localStorage.setItem(OWNER_STORAGE_KEY, cleaned);
    } catch {}
  }, []);

  const fetchLiveData = useCallback(async (force = false) => {
    const currentParts = getThailandParts();
    // Always fetch on force, otherwise only during market hours
    if (!force && !isWithinMarketHours(currentParts)) return;
    if (isUpdating.current) return;
    isUpdating.current = true;

    try {
      const { data: payload, error } = await supabase.functions.invoke("set-live");

      if (error) throw new Error(error.message || "Edge function error");

      const data = payload?.data;
      if (data) {
        setLiveData(data);
        setFlash(true);
        setTimeout(() => setFlash(false), 180);

        const statusText = data.marketStatus || "Unknown";
        setApiNote(`Source: thaistock2d.com | Status: ${statusText} | Auto-refresh: 30s`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiNote(`Fetch error: ${msg}`);
    } finally {
      lastFetchAtMs.current = Date.now();
      isUpdating.current = false;
    }
  }, []);

  // Clock tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      const p = getThailandParts();
      setParts(p);

      const withinMarket = isWithinMarketHours(p);
      const marketOpen = liveData?.marketStatus?.toLowerCase().includes("open") ?? false;
      setIsLive(withinMarket && marketOpen);

      // Auto-fetch during market hours
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

  // Use the API's calculated 2D directly
  const twod = liveData?.calculated2d || "--";
  
  // Extract last digits for display
  const getLastDigit = (raw: unknown) => {
    const digits = String(raw ?? "").replace(/\D/g, "");
    return digits ? digits[digits.length - 1] : "-";
  };

  const setDigit = liveData?.setIndex != null ? getLastDigit(liveData.setIndex) : "-";
  const valueDigit = liveData?.value != null ? getLastDigit(liveData.value) : "-";
  const setFormatted = liveData?.setIndex != null ? formatNumber(liveData.setIndex) : "--";
  const valueFormatted = liveData?.value != null ? formatNumber(liveData.value) : "--";
  const lastUpdated = liveData ? formatTimestamp(liveData.fetchedAt || Date.now().toString()) : `${dateStr} ${clock}`;
  const marketTimestamp = liveData?.marketDateTime ? formatTimestamp(liveData.marketDateTime) : "--";
  const nextCheck = getNextCheckText(parts, lastFetchAtMs.current);

  return {
    ownerName,
    updateOwnerName,
    clock,
    dateStr,
    isLive,
    flash,
    twod,
    setDigit,
    valueDigit,
    setFormatted,
    valueFormatted,
    lastUpdated,
    marketTimestamp,
    apiNote,
    nextCheck,
    connectionStatus: isLive ? "Live" : "Closed",
    lastFetchTime: lastFetchAtMs.current
      ? `${formatPartsDate(getThailandParts(new Date(lastFetchAtMs.current)))} ${formatPartsClock(getThailandParts(new Date(lastFetchAtMs.current)))} (TH)`
      : "--",
    results: liveData?.results || [],
    holiday: liveData?.holiday,
  };
}

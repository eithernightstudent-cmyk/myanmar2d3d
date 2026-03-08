import { useState, useEffect, useCallback, useRef } from "react";
import {
  getThailandParts,
  isWithinMarketHours,
  formatPartsClock,
  formatPartsDate,
  formatNumber,
  calculateTwoD,
  formatTimestamp,
  getNextCheckText,
  type ThailandParts,
} from "@/lib/market-utils";

const POLL_INTERVAL_MS = 30000;
const DEFAULT_OWNER_NAME = "KKTech";
const OWNER_STORAGE_KEY = "kktech-live-owner-name";

// Demo data for when API is not available
const DEMO_DATA = {
  setIndex: 1427.63,
  value: 38241.57,
  marketStatus: "Demo Mode",
  marketDateTime: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
};

export interface LiveData {
  setIndex: number;
  value: number;
  marketStatus: string;
  marketDateTime: string;
  fetchedAt: string;
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
  const [apiNote, setApiNote] = useState("Data source: waiting for response...");
  const [flash, setFlash] = useState(false);
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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch("/api/live", { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`API ${response.status}`);
        const payload = await response.json();
        const data = payload?.data;

        if (data?.setIndex != null && data?.value != null) {
          setLiveData(data);
          hasRendered.current = true;
          setFlash(true);
          setTimeout(() => setFlash(false), 180);

          const marketStatusText = String(data.marketStatus || "Unknown");
          setApiNote(`Source: set.or.th | Market Status: ${marketStatusText} | Auto-refresh: 30s in 09:30-16:30 (TH)`);
          return;
        }
      } catch {
        // API not available, use demo data
      }

      // Fallback to demo data
      if (!hasRendered.current) {
        setLiveData(DEMO_DATA);
        hasRendered.current = true;
        setFlash(true);
        setTimeout(() => setFlash(false), 180);
        setApiNote("Demo mode — connect to /api/live for real data from set.or.th");
      }
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
      const marketOpen = liveData
        ? !String(liveData.marketStatus || "").toLowerCase().includes("close")
        : false;
      setIsLive(withinMarket && marketOpen);

      // Auto-fetch during market hours
      if (withinMarket && (!lastFetchAtMs.current || Date.now() - lastFetchAtMs.current >= POLL_INTERVAL_MS)) {
        fetchLiveData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchLiveData, liveData]);

  // Initial fetch
  useEffect(() => {
    fetchLiveData(true);
  }, [fetchLiveData]);

  const clock = formatPartsClock(parts);
  const dateStr = formatPartsDate(parts);
  const calc = liveData ? calculateTwoD(liveData.setIndex, liveData.value) : { setDigit: "-", valueDigit: "-", result: "--" };
  const setFormatted = liveData ? formatNumber(liveData.setIndex) : "--";
  const valueFormatted = liveData ? formatNumber(liveData.value) : "--";
  const lastUpdated = liveData ? formatTimestamp(liveData.fetchedAt || Date.now().toString()) : `${dateStr} ${clock}`;
  const marketTimestamp = liveData ? formatTimestamp(liveData.marketDateTime) : "--";
  const nextCheck = getNextCheckText(parts, lastFetchAtMs.current);

  return {
    ownerName,
    updateOwnerName,
    clock,
    dateStr,
    isLive,
    flash,
    twod: calc.result,
    setDigit: calc.setDigit,
    valueDigit: calc.valueDigit,
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
  };
}

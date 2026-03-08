import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/market-utils";
import { tap } from "@/lib/haptic";

interface CurrentDayResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
  stock_date?: string;
  stock_datetime?: string;
}

interface TodayResultsProps {
  currentDayResults: CurrentDayResult[];
  currentDate: string;
  fallbackResults?: CurrentDayResult[];
}

/** Primary sessions show full SET/Value detail */
const PRIMARY_SLOTS = [
  { time: "12:01", display: "12:01 PM", label: "Midday" },
  { time: "16:30", display: "4:30 PM", label: "Closing" },
];

/** Secondary sessions show a compact row */
const SECONDARY_SLOTS = [
  { time: "11:00", display: "11:00 AM", label: "Morning" },
  { time: "15:00", display: "3:00 PM", label: "Afternoon" },
];

export const TodayResults = React.memo(function TodayResults({ currentDayResults, currentDate, fallbackResults = [] }: TodayResultsProps) {
  const displayResults = currentDayResults.length > 0 ? currentDayResults : fallbackResults;
  const isFallback = currentDayResults.length === 0 && fallbackResults.length > 0;
  const fallbackDate = isFallback && fallbackResults[0]?.stock_date ? fallbackResults[0].stock_date : null;

  // Memoized lookup map: open_time (first 5 chars) -> result
  const resultMap = useMemo(() => {
    const map = new Map<string, CurrentDayResult>();
    for (const r of displayResults) {
      const t = String(r.open_time ?? "").trim().slice(0, 5);
      if (t) map.set(t, r);
    }
    return map;
  }, [displayResults]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
    >
      <article className="rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg">
        {/* Header — no icon */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold tracking-wide text-foreground">
              {isFallback ? "Latest Results" : "Today's Results"}
            </h2>
            <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
              {isFallback && fallbackDate ? fallbackDate : (currentDate || "--")}
            </p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase tracking-wider text-primary">
            Daily 2D
          </span>
        </div>

        {/* Primary Cards — 12:01 PM & 4:30 PM */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {PRIMARY_SLOTS.map((slot, i) => {
            const result = resultMap.get(slot.time) || null;
            const has = !!result && !!result.twod && result.twod !== "--";

            return (
              <motion.div
                key={slot.time}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.4 }}
                onTouchStart={() => tap()}
                className="rounded-2xl border border-border/60 bg-card p-4 transition-all duration-200 active:scale-[0.97]"
              >
                {/* Time */}
                <p className="font-display text-xs font-bold text-foreground">
                  {slot.display}
                </p>
                <p className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                  {slot.label}
                </p>

                {/* 2D Number */}
                {has ? (
                  <motion.p
                    key={result!.twod}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-4xl font-extrabold leading-none mb-3"
                    style={{
                      background: "linear-gradient(135deg, hsl(330 85% 50%), hsl(275 75% 48%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {result!.twod}
                  </motion.p>
                ) : (
                  <div className="mb-3">
                    <span className="font-display text-3xl font-bold text-muted-foreground/30">--</span>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 ml-2">
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                      <span className="font-display text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        Pending
                      </span>
                    </div>
                  </div>
                )}

                {/* SET & Value */}
                {has && (
                  <div className="space-y-1 border-t border-border/50 pt-2">
                    <div className="flex justify-between font-display text-[0.65rem]">
                      <span className="font-bold text-foreground">SET</span>
                      <span className="font-bold text-foreground">
                        {formatNumber(result!.set)}
                      </span>
                    </div>
                    <div className="flex justify-between font-display text-[0.65rem]">
                      <span className="font-bold text-foreground">VALUE</span>
                      <span className="font-bold text-foreground">
                        {formatNumber(result!.value)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Secondary Cards — 11:00 AM & 3:00 PM — compact rows */}
        <div className="grid grid-cols-2 gap-3">
          {SECONDARY_SLOTS.map((slot, i) => {
            const result = resultMap.get(slot.time) || null;
            const has = !!result && !!result.twod && result.twod !== "--";

            return (
              <motion.div
                key={slot.time}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + 0.06 * i, duration: 0.4 }}
                onTouchStart={() => tap()}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 transition-all duration-200 active:scale-[0.97]"
              >
                {/* Left: time */}
                <div>
                  <p className="font-display text-xs font-bold text-foreground">
                    {slot.display}
                  </p>
                  <p className="font-display text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {slot.label}
                  </p>
                </div>

                {/* Right: 2D number */}
                {has ? (
                  <motion.span
                    key={result!.twod}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-2xl font-extrabold"
                    style={{
                      background: "linear-gradient(135deg, hsl(330 85% 50%), hsl(275 75% 48%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {result!.twod}
                  </motion.span>
                ) : (
                  <span className="font-display text-xl font-bold text-muted-foreground/30">--</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </article>
    </motion.section>
  );
});

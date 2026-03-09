import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/market-utils";
import { tap } from "@/lib/haptic";
import { RollingNumber } from "./RollingNumber";
import { ChevronRight } from "lucide-react";

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

const ALL_SLOTS = [
  { time: "11:00", display: "11:00 AM", label: "Morning" },
  { time: "12:01", display: "12:01 PM", label: "Midday" },
  { time: "15:00", display: "03:00 PM", label: "Afternoon" },
  { time: "16:30", display: "04:30 PM", label: "Closing" },
];

/** Card gradient tones — adapts to dark theme using primary hues */
const CARD_GRADIENTS = [
  "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.12))",
  "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.18))",
  "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.12))",
  "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.18))",
];

function hasValidTwoD(value: string | undefined) {
  return /^\d{2}$/.test(String(value ?? "").trim());
}

export const TodayResults = memo(function TodayResults({
  currentDayResults,
  currentDate,
  fallbackResults = [],
}: TodayResultsProps) {
  const displayResults = currentDayResults.length > 0 ? currentDayResults : fallbackResults;
  const isFallback = currentDayResults.length === 0 && fallbackResults.length > 0;
  const fallbackDate = isFallback && fallbackResults[0]?.stock_date ? fallbackResults[0].stock_date : null;
  const displayDate = (isFallback && fallbackDate ? fallbackDate : currentDate || "").trim();
  const resultByTime = useMemo(() => {
    const map = new Map<string, CurrentDayResult>();
    for (const result of displayResults) {
      const time = String(result.open_time ?? "").trim().slice(0, 5);
      if (!map.has(time)) map.set(time, result);
    }
    return map;
  }, [displayResults]);

  return (
    <section>
      <article className="rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold tracking-wide text-foreground">
              {isFallback ? "Latest Results" : "Today's Results"}
            </h2>
            <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
              {displayDate || "\u00A0"}
            </p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase tracking-wider text-primary">
            Daily 2D
          </span>
        </div>

        {/* Session Cards — stacked vertically */}
        <div className="flex flex-col gap-3">
          {ALL_SLOTS.map((slot, i) => {
            const result = resultByTime.get(slot.time) || null;
            const has = !!result && hasValidTwoD(result.twod);

            return (
              <motion.div
                key={slot.time}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.35 }}
                onTouchStart={() => tap()}
                className="relative overflow-hidden rounded-2xl border border-primary/20 p-4 transition-all duration-200 active:scale-[0.98]"
                style={{ background: CARD_GRADIENTS[i] }}
              >
                {/* Time header */}
                <p className="text-center font-display text-sm font-bold text-foreground mb-3">
                  {slot.display}
                </p>

                {/* Divider */}
                <div className="mb-3 h-px bg-foreground/10" />

                {/* Data row: Set / Value / 2D */}
                <div className="grid grid-cols-3 items-end gap-2 text-center">
                  {/* SET */}
                  <div>
                    <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Set
                    </p>
                    <p className="font-display text-sm font-bold text-foreground">
                      {has ? formatNumber(result!.set) : "—"}
                    </p>
                  </div>

                  {/* Value */}
                  <div>
                    <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Value
                    </p>
                    <p className="font-display text-sm font-bold text-foreground">
                      {has ? formatNumber(result!.value) : "—"}
                    </p>
                  </div>

                  {/* 2D */}
                  <div className="flex items-center justify-center gap-1">
                    <div>
                      <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        2D
                      </p>
                      {has ? (
                        <RollingNumber
                          value={result!.twod}
                          className="font-display text-xl font-extrabold"
                          digitStyle={{
                            background: "linear-gradient(135deg, #fff6cc 0%, #ffd866 30%, #ffb81f 62%, #fff2ba 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        />
                      ) : (
                        <p className="font-display text-xl font-extrabold text-muted-foreground">—</p>
                      )}
                    </div>
                    {has && (
                      <ChevronRight className="h-4 w-4 text-primary/60 mt-3" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </article>
    </section>
  );
});

TodayResults.displayName = "TodayResults";

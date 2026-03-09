import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/market-utils";
import { tap } from "@/lib/haptic";
import { RollingNumber } from "./RollingNumber";
import { ChevronRight, Dice3, CalendarDays, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TwoDHistoryOverlay } from "./TwoDHistoryOverlay";

interface CurrentDayResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
  stock_date?: string;
  stock_datetime?: string;
  history_id?: string;
}

interface TodayResultsProps {
  currentDayResults: CurrentDayResult[];
  currentDate: string;
  fallbackResults?: CurrentDayResult[];
  onOpenHistory?: () => void;
  onOpen3D?: () => void;
}

const ALL_SLOTS = [
  { time: "11:00", display: "11:00 AM", label: "Morning" },
  { time: "12:01", display: "12:01 PM", label: "Midday" },
  { time: "15:00", display: "03:00 PM", label: "Afternoon" },
  { time: "16:30", display: "04:30 PM", label: "Closing" },
];

const CARD_GRADIENTS = [
  "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.12))",
  "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.18))",
  "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.12))",
  "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.18))",
];

function hasValidTwoD(value: string | undefined) {
  return /^\d{2}$/.test(String(value ?? "").trim());
}

const NAV_ICONS = [
  {
    key: "3d",
    icon: Dice3,
    label: "3D Results",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    key: "history",
    icon: CalendarDays,
    label: "Previous Results",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    key: "results",
    icon: Clock,
    label: "2D Results",
    gradient: "from-blue-400 to-indigo-500",
  },
];

export const TodayResults = memo(function TodayResults({
  currentDayResults,
  currentDate,
  fallbackResults = [],
  onOpenHistory,
  onOpen3D,
}: TodayResultsProps) {
  const navigate = useNavigate();
  const [historyOverlay, setHistoryOverlay] = useState<{ date: string; openTime: string; time: string } | null>(null);
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

  const handleNavClick = (key: string) => {
    tap();
    if (key === "3d") onOpen3D?.();
    else if (key === "history") onOpenHistory?.();
    else if (key === "results") navigate("/results");
  };

  return (
    <section>
      <article className="rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-4 sm:p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg">
        {/* Header with nav icons */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold tracking-wide text-foreground">
              {isFallback ? "Latest Results" : "Today's Results"}
            </h2>
            <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
              {displayDate || "\u00A0"}
            </p>
          </div>

          {/* Icon navigation cluster */}
          <div className="flex items-center gap-2">
            {NAV_ICONS.map(({ key, icon: Icon, label, gradient }) => (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                aria-label={label}
                title={label}
                className={`group relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-all duration-200 active:scale-90 hover:scale-110 hover:shadow-lg`}
              >
                <Icon className="h-4.5 w-4.5 drop-shadow-sm" strokeWidth={2.2} />
              </button>
            ))}
          </div>
        </div>

        {/* Session Cards — stacked vertically */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
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
                  <div>
                    <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Set
                    </p>
                    <p className="font-display text-sm font-bold text-foreground">
                      {has ? formatNumber(result!.set) : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Value
                    </p>
                    <p className="font-display text-sm font-bold text-foreground">
                      {has ? formatNumber(result!.value) : "—"}
                    </p>
                  </div>

                  <div
                    className={`flex items-center justify-center gap-1 ${has && result!.history_id ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (has && result!.history_id) {
                        tap();
                        setHistoryOverlay({ id: result!.history_id, time: slot.display });
                      }
                    }}
                  >
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
                    {has && result!.history_id && (
                      <ChevronRight className="h-4 w-4 text-primary/60 mt-3" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </article>

      <TwoDHistoryOverlay
        open={!!historyOverlay}
        onClose={() => setHistoryOverlay(null)}
        historyId={historyOverlay?.id || null}
        sessionTime={historyOverlay?.time}
      />
    </section>
  );
});

TodayResults.displayName = "TodayResults";

import { motion } from "framer-motion";
import { Sunrise, Sun, CloudSun, Sunset, Clock, Loader2 } from "lucide-react";
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
}

interface SessionSlot {
  time: string;
  label: string;
  icon: React.ReactNode;
  animClass: string;
  gradientFrom: string;
  gradientTo: string;
}

const SESSION_SLOTS: SessionSlot[] = [
  {
    time: "11:00",
    label: "Morning",
    icon: <Sunrise className="h-6 w-6" />,
    animClass: "anim-float",
    gradientFrom: "from-orange-400",
    gradientTo: "to-amber-300",
  },
  {
    time: "12:01",
    label: "Midday",
    icon: <Sun className="h-6 w-6" />,
    animClass: "anim-pulse-glow",
    gradientFrom: "from-yellow-400",
    gradientTo: "to-orange-300",
  },
  {
    time: "15:00",
    label: "Afternoon",
    icon: <CloudSun className="h-6 w-6" />,
    animClass: "anim-cloud-drift",
    gradientFrom: "from-sky-400",
    gradientTo: "to-cyan-300",
  },
  {
    time: "16:30",
    label: "Closing",
    icon: <Sunset className="h-6 w-6" />,
    animClass: "anim-float",
    gradientFrom: "from-rose-400",
    gradientTo: "to-pink-300",
  },
];

function matchResult(results: CurrentDayResult[], slotTime: string): CurrentDayResult | null {
  return results.find((r) => {
    const t = String(r.open_time ?? "").trim().slice(0, 5);
    return t === slotTime;
  }) || null;
}

export function TodayResults({ currentDayResults, currentDate }: TodayResultsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
    >
      <article className="rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold tracking-wide" style={{ color: "hsl(var(--text-strong))" }}>
                Today's Results
              </h2>
              <p className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {currentDate || "--"}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase tracking-wider text-primary">
            Daily 2D
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SESSION_SLOTS.map((slot, i) => {
            const result = matchResult(currentDayResults, slot.time);
            const has = !!result && !!result.twod && result.twod !== "--";

            return (
              <motion.div
                key={slot.time}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 * i, duration: 0.4 }}
                onTouchStart={() => tap()}
                className="group relative flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-[hsl(var(--card-strong))] p-4 transition-all duration-200 active:scale-95 hover:border-primary/30 hover:shadow-lg"
              >
                {/* Animated Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${slot.gradientFrom} ${slot.gradientTo} text-white shadow-md ${slot.animClass}`}
                >
                  {slot.icon}
                </div>

                {/* Time & Label */}
                <div className="text-center">
                  <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {slot.label}
                  </p>
                  <p className="font-display text-xs font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>
                    {slot.time === "11:00" ? "11:00 AM" : slot.time === "12:01" ? "12:01 PM" : slot.time === "15:00" ? "3:00 PM" : "4:30 PM"}
                  </p>
                </div>

                {/* 2D Result Number */}
                {has ? (
                  <motion.span
                    key={result!.twod}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-3xl font-extrabold"
                    style={{
                      background: "linear-gradient(135deg, hsl(330, 80%, 55%), hsl(280, 70%, 55%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {result!.twod}
                  </motion.span>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-display text-2xl font-bold text-muted-foreground/40">
                      --
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                      <span className="font-display text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        Pending
                      </span>
                    </span>
                  </div>
                )}

                {/* SET & Value sub-info */}
                {has && (
                  <div className="w-full space-y-0.5 border-t border-border pt-2 mt-1">
                    <div className="flex justify-between font-display text-[0.6rem]">
                      <span className="font-semibold text-muted-foreground">SET</span>
                      <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                        {formatNumber(result!.set)}
                      </span>
                    </div>
                    <div className="flex justify-between font-display text-[0.6rem]">
                      <span className="font-semibold text-muted-foreground">Value</span>
                      <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                        {formatNumber(result!.value)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </article>
    </motion.section>
  );
}

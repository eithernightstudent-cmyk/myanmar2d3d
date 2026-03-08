import { motion, AnimatePresence } from "framer-motion";
import { StatusPill } from "./StatusPill";
import { ShieldCheck, Lock, CalendarDays, Zap } from "lucide-react";
import { tap } from "@/lib/haptic";

interface LiveCardProps {
  clock: string;
  twod: string;
  threed: string;
  setDigit: string;
  valueDigit: string;
  setFormatted: string;
  valueFormatted: string;
  lastUpdated: string;
  marketTimestamp: string;
  flash: boolean;
  apiNote: string;
  isLive: boolean;
  isSyncing: boolean;
  connectionStatus: string;
  currentDate: string;
  holidayName?: string | null;
  stockDatetime?: string;
  resultVerificationStatus?: "verified" | "verifying" | "finalizing" | "live" | "closed";
  isResultLocked?: boolean;
  isHotMinute?: boolean;
}

export function LiveCard({
  clock,
  twod,
  setFormatted,
  valueFormatted,
  flash,
  isLive,
  isSyncing,
  connectionStatus,
  holidayName,
  stockDatetime,
  resultVerificationStatus = "closed",
  isResultLocked = false,
  isHotMinute = false,
}: LiveCardProps) {
  const marketClosed = !isLive;

  const cleanHolidayName = (() => {
    if (holidayName && holidayName !== "null" && holidayName !== "NULL" && holidayName.trim() !== "") {
      return holidayName;
    }
    return null;
  })();

  const showLockIcon = isLive || (resultVerificationStatus === "verified" && isResultLocked);
  const hasData = twod && twod !== "--";
  const hasSet = setFormatted && setFormatted !== "--";
  const hasValue = valueFormatted && valueFormatted !== "--";
  const hasStockDatetime = stockDatetime && stockDatetime !== "--";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.5 }}
      aria-live="polite"
    >
      <article
        className={`relative overflow-hidden rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-4 sm:p-6 shadow-[var(--shadow-panel)] backdrop-blur-lg transition-all ${
          flash ? "before:opacity-100" : "before:opacity-0"
        } before:pointer-events-none before:absolute before:inset-[-30%] before:bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_60%)] before:transition-opacity before:duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--text-secondary))" }}>
              Live 2D
            </span>
            <StatusPill isLive={isLive} connectionStatus={connectionStatus} />
            {isHotMinute && isLive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5"
              >
                <Zap className="h-3 w-3 text-amber-500" fill="currentColor" />
                <span className="font-display text-[0.55rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Fast
                </span>
              </motion.div>
            )}
          </div>
          <span className="rounded-full border border-border bg-[hsl(var(--card-strong))] px-3 py-1.5 font-display text-xs font-bold text-primary">
            {clock}
          </span>
        </div>

        {/* Market Status & Holiday Name */}
        {marketClosed && (
          <div className="mb-2 text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "hsl(var(--text-secondary))" }}>
              Market Closed
            </p>
            {cleanHolidayName && (
              <div className="mt-1.5 inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                <p className="font-display text-sm font-bold text-primary/80">
                  {cleanHolidayName}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Big 2D Number */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative min-h-[5rem]">
            {hasData && (
              <motion.span
                key={twod}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="font-display text-[clamp(5rem,20vw,7rem)] font-bold leading-none text-primary"
                style={{
                  textShadow: "0 4px 20px hsl(var(--primary) / 0.35), 0 0 60px hsl(var(--primary) / 0.15)",
                }}
              >
                {twod}
              </motion.span>
            )}

            {showLockIcon && isResultLocked && hasData && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-7 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-success/10 border border-success/30"
              >
                <Lock className="h-3.5 w-3.5 text-success" />
              </motion.div>
            )}
          </div>

          {/* Only show Verified badge */}
          <AnimatePresence mode="wait">
            {isLive && resultVerificationStatus === "verified" && hasData && (
              <motion.div
                key="verified"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-4 py-1.5 backdrop-blur-sm"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={2.2} />
                <span className="font-display text-[0.7rem] font-bold uppercase tracking-wider text-emerald-400">
                  Verified
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Updated timestamp — only show when data exists */}
        {hasStockDatetime && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="font-display text-[0.8rem] font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>
              Updated:{" "}
              <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                {stockDatetime}
              </span>
            </span>
          </div>
        )}
        {!hasStockDatetime && <div className="mb-6" />}

        {/* SET Index & Value — only show when data exists */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            key={`set-${setFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="rounded-2xl border border-border bg-[hsl(var(--card-strong))] p-4 active:scale-95 transition-transform duration-150"
          >
            <span className="block font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: "hsl(var(--text-secondary))" }}>
              SET Index
            </span>
            {hasSet && (
              <span className="font-display text-xl font-bold" style={{ color: "hsl(var(--text-strong))" }}>{setFormatted}</span>
            )}
            {!hasSet && <span className="block h-7" />}
          </motion.div>
          <motion.div
            key={`val-${valueFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="rounded-2xl border border-border bg-[hsl(var(--card-strong))] p-4 active:scale-95 transition-transform duration-150"
          >
            <span className="block font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: "hsl(var(--text-secondary))" }}>
              Value
            </span>
            {hasValue && (
              <span className="font-display text-xl font-bold" style={{ color: "hsl(var(--text-strong))" }}>{valueFormatted}</span>
            )}
            {!hasValue && <span className="block h-7" />}
          </motion.div>
        </div>

      </article>
    </motion.section>
  );
}

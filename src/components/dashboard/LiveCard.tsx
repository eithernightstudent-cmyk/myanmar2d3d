import { motion, AnimatePresence } from "framer-motion";
import { StatusPill } from "./StatusPill";
import { Loader2, CheckCircle, ShieldCheck, Lock, CalendarDays, Zap, CircleAlert } from "lucide-react";
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
  isResultPreliminary?: boolean;
  resultConfirmSecondsLeft?: number;
  onManualRefresh?: () => void;
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
  currentDate,
  holidayName,
  stockDatetime,
  resultVerificationStatus = "closed",
  isResultLocked = false,
  isResultPreliminary = false,
  resultConfirmSecondsLeft = 0,
  isHotMinute = false,
}: LiveCardProps) {
  const marketClosed = !isLive;
  const hasTwoD = /^\d{2}$/.test(String(twod ?? "").trim());
  const hasStockDatetime = !!stockDatetime && stockDatetime !== "--";
  const hasSetValue = !!setFormatted && setFormatted !== "--";
  const hasValueValue = !!valueFormatted && valueFormatted !== "--";
  const showPreliminaryNotice = hasTwoD && isResultPreliminary && !isResultLocked;

  // Clean holiday name — filter out null/undefined/empty
  const cleanHolidayName = (() => {
    if (holidayName && holidayName !== "null" && holidayName !== "NULL" && holidayName.trim() !== "") {
      return holidayName;
    }
    return null;
  })();

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
            {isSyncing && isLive && (
              <div className="flex items-center gap-1.5" style={{ color: "hsl(var(--text-secondary))" }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="font-display text-[0.6rem] font-semibold uppercase tracking-wider">
                  Syncing
                </span>
              </div>
            )}
            {/* Hot Minute Indicator */}
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
          <div className="relative">
            {hasTwoD ? (
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
            ) : (
              <div className="h-[7rem] w-[10rem]" aria-hidden="true" />
            )}

            {/* Lock icon when result is verified */}
            {isResultLocked && hasTwoD && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-7 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-success/10 border border-success/30"
              >
                <Lock className="h-3.5 w-3.5 text-success" />
              </motion.div>
            )}
          </div>

          {/* Verification Status Badges — only during/after live market */}
          <AnimatePresence mode="wait">
            {showPreliminaryNotice && (
              <motion.div
                key="preliminary"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1"
              >
                <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Preliminary {resultConfirmSecondsLeft > 0 ? `• Confirming ${resultConfirmSecondsLeft}s` : "• Confirming"}
                </span>
              </motion.div>
            )}
            {resultVerificationStatus === "verified" && hasTwoD && (
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

        {/* Updated timestamp */}
        {hasStockDatetime && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${isResultLocked ? "bg-success/10" : "bg-muted"}`}>
              <CheckCircle className="h-3.5 w-3.5" style={{ color: isResultLocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }} />
            </div>
            <span className="font-display text-[0.8rem] font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>
              Updated:{" "}
              <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                {stockDatetime}
              </span>
            </span>
          </div>
        )}

        {/* SET Index & Value */}
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
            <span className="font-display text-xl font-bold" style={{ color: "hsl(var(--text-strong))" }}>
              {hasSetValue ? setFormatted : "\u00A0"}
            </span>
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
            <span className="font-display text-xl font-bold" style={{ color: "hsl(var(--text-strong))" }}>
              {hasValueValue ? valueFormatted : "\u00A0"}
            </span>
          </motion.div>
        </div>

        {/* Minimal footer — Date only */}
        <div className="border-t border-border pt-4">
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>Date</span>
            <span style={{ color: "hsl(var(--text-secondary))" }}>{currentDate}</span>
          </div>
        </div>
      </article>
    </motion.section>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { StatusPill } from "./StatusPill";
import { Loader2, CheckCircle, ShieldCheck, Lock, CalendarDays, Zap, CircleAlert } from "lucide-react";
import { tap } from "@/lib/haptic";
import { RollingNumber } from "./RollingNumber";

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
  isTradingDay?: boolean;
  isSyncing: boolean;
  connectionStatus: string;
  currentDate: string;
  holidayName?: string | null;
  stockDatetime?: string;
  resultVerificationStatus?: "verified" | "verifying" | "finalizing" | "live" | "closed";
  isResultLocked?: boolean;
  isResultPreliminary?: boolean;
  resultConfirmSecondsLeft?: number;
  isFinalOnlyMode?: boolean;
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
  isTradingDay = true,
  isSyncing,
  connectionStatus,
  currentDate,
  holidayName,
  stockDatetime,
  resultVerificationStatus = "closed",
  isResultLocked = false,
  isResultPreliminary = false,
  resultConfirmSecondsLeft = 0,
  isFinalOnlyMode = false,
  isHotMinute = false,
}: LiveCardProps) {
  const marketClosed = !isTradingDay;
  const hasTwoD = /^\d{2}$/.test(String(twod ?? "").trim());
  const hasStockDatetime = !!stockDatetime && stockDatetime !== "--";
  const hasSetValue = !!setFormatted && setFormatted !== "--";
  const hasValueValue = !!valueFormatted && valueFormatted !== "--";
  const showPreliminaryNotice = hasTwoD && isResultPreliminary && !isResultLocked;
  const showAwaitingFinalNotice = isFinalOnlyMode && !hasTwoD && isLive;

  const cleanHolidayName = (() => {
    if (holidayName && holidayName !== "null" && holidayName !== "NULL" && holidayName.trim() !== "") {
      return holidayName;
    }
    return null;
  })();

  return (
    <section aria-live="polite">
      <article
        className={`relative overflow-hidden rounded-3xl border border-border bg-[hsl(var(--card-glass))] shadow-[var(--shadow-panel)] backdrop-blur-lg transition-all ${
          flash ? "before:opacity-100" : "before:opacity-0"
        } before:pointer-events-none before:absolute before:inset-[-30%] before:bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_60%)] before:transition-opacity before:duration-200`}
      >
        {/* Compact Header Bar */}
        <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-primary status-badge-glow-live">
              Live 2D
            </span>
            <StatusPill isLive={isLive} connectionStatus={connectionStatus} />
            {isFinalOnlyMode && (
              <div className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5">
                <Lock className="h-3 w-3 text-success" />
                <span className="font-display text-[0.55rem] font-bold uppercase tracking-wider text-success">Final</span>
              </div>
            )}
            {isSyncing && isLive && (
              <div className="flex items-center gap-1.5" style={{ color: "hsl(var(--text-secondary))" }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              </div>
            )}
            {isHotMinute && isLive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5"
              >
                <Zap className="h-3 w-3 text-amber-500" fill="currentColor" />
                <span className="font-display text-[0.55rem] font-bold uppercase tracking-wider text-amber-600">Fast</span>
              </motion.div>
            )}
          </div>
          <span className="rounded-full border border-border bg-[hsl(var(--card-strong))] px-3 py-1.5 font-display text-xs font-bold gold-metal-text">
            {clock}
          </span>
        </div>

        {/* Market Closed Banner */}
        {marketClosed && (
          <div className="mt-3 text-center">
            <p className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 status-badge-glow-closed">
              Market Closed
            </p>
            {cleanHolidayName && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                <p className="font-display text-sm font-bold text-primary/80">{cleanHolidayName}</p>
              </div>
            )}
          </div>
        )}

        {/* Hero 2D Number — large, centered, dominant */}
        <div className="flex flex-col items-center justify-center py-4 sm:py-8">
          <div className="relative">
            {hasTwoD ? (
              <motion.div
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="font-display text-[clamp(6rem,24vw,9rem)] font-extrabold leading-none"
              >
                <RollingNumber value={twod} digitClassName="gold-metal-text" />
              </motion.div>
            ) : (
              <div className="h-[9rem] w-[10rem]" aria-hidden="true" />
            )}

            {isResultLocked && hasTwoD && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-5 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-success/10 border border-success/30"
              >
                <Lock className="h-3.5 w-3.5 text-success" />
              </motion.div>
            )}
          </div>

          {/* Verification Badges */}
          <AnimatePresence mode="wait">
            {showPreliminaryNotice && (
              <motion.div
                key="preliminary"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1"
              >
                <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-display text-[0.62rem] font-bold uppercase tracking-wider text-amber-700">
                  Preliminary {resultConfirmSecondsLeft > 0 ? `• ${resultConfirmSecondsLeft}s` : ""}
                </span>
              </motion.div>
            )}
            {resultVerificationStatus === "verified" && hasTwoD && (
              <motion.div
                key="verified"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-4 py-1.5 backdrop-blur-sm"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={2.2} />
                <span className="font-display text-[0.7rem] font-bold uppercase tracking-wider text-emerald-400">Verified</span>
              </motion.div>
            )}
          </AnimatePresence>

          {showAwaitingFinalNotice && (
            <div className="mt-3 inline-flex items-center rounded-full border border-border bg-[hsl(var(--card-strong))] px-3 py-1">
              <span className="font-display text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Awaiting Verified Result
              </span>
            </div>
          )}
        </div>

        {/* Updated timestamp — clean single line */}
        {hasStockDatetime && (
          <div className="flex items-center justify-center gap-2 pb-3 sm:pb-5">
            <CheckCircle
              className="h-4 w-4"
              style={{ color: isResultLocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}
            />
            <span className="font-display text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
              Updated:{" "}
              <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                {stockDatetime}
              </span>
            </span>
          </div>
        )}

        {/* SET & Value — bottom bar style */}
        <div className="grid grid-cols-2 border-t border-border">
          <motion.div
            key={`set-${setFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="border-r border-border px-4 py-4 sm:px-6 active:bg-muted/30 transition-colors duration-150"
          >
            <span className="block font-display text-[0.6rem] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: "hsl(var(--text-secondary))" }}>
              SET Index
            </span>
            <span className="font-display text-lg font-bold sm:text-xl" style={{ color: "hsl(var(--text-strong))" }}>
              {hasSetValue ? setFormatted : "\u00A0"}
            </span>
          </motion.div>
          <motion.div
            key={`val-${valueFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="px-4 py-4 sm:px-6 active:bg-muted/30 transition-colors duration-150"
          >
            <span className="block font-display text-[0.6rem] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: "hsl(var(--text-secondary))" }}>
              Value
            </span>
            <span className="font-display text-lg font-bold sm:text-xl" style={{ color: "hsl(var(--text-strong))" }}>
              {hasValueValue ? valueFormatted : "\u00A0"}
            </span>
          </motion.div>
        </div>

        {/* Date footer */}
        <div className="border-t border-border px-4 py-3 sm:px-6">
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>Date</span>
            <span style={{ color: "hsl(var(--text-secondary))" }}>{currentDate}</span>
          </div>
        </div>
      </article>
    </section>
  );
}

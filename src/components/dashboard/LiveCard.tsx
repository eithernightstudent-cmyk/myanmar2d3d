import { motion, AnimatePresence } from "framer-motion";
import { StatusPill } from "./StatusPill";
import { Loader2, CheckCircle, ShieldCheck, Lock, CalendarDays, Zap, CircleAlert, Clock3 } from "lucide-react";
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
  const showLivePendingClock = hasStockDatetime && isLive && !isResultLocked;

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
        className={`relative overflow-hidden rounded-[1.8rem] border border-border/80 bg-[hsl(var(--card-glass))] p-4 shadow-[var(--shadow-panel)] backdrop-blur-xl transition-all duration-300 sm:p-6 ${
          flash ? "ring-2 ring-primary/25" : "ring-1 ring-transparent"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-x-8 -top-20 h-44 rounded-full opacity-80 blur-3xl"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--primary)/0.26), transparent 72%)",
          }}
        />

        <header className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-display text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary status-badge-glow-live">
              Live 2D
            </span>
            

            {isFinalOnlyMode && (
              <div className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5">
                <Lock className="h-3 w-3 text-success" />
                <span className="font-display text-[0.55rem] font-bold uppercase tracking-wider text-success">Final-only</span>
              </div>
            )}

            {isHotMinute && isLive && (
              <motion.div
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5"
              >
                <Zap className="h-3 w-3 text-amber-500" fill="currentColor" />
                <span className="font-display text-[0.55rem] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Fast
                </span>
              </motion.div>
            )}

            {isSyncing && isLive && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-[hsl(var(--card-strong))] px-2 py-0.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="font-display text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Syncing
                </span>
              </div>
            )}
          </div>

          <span className="rounded-full border border-primary/20 bg-[hsl(var(--card-strong))] px-3 py-1.5 font-display text-xs font-bold tracking-[0.1em] gold-metal-text">
            {clock}
          </span>
        </header>

        {marketClosed && (
          <div className="relative mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
              Market Closed
            </p>
            {cleanHolidayName && (
              <p className="mt-1 inline-flex items-center gap-1.5 font-display text-sm font-bold text-primary/90">
                <CalendarDays className="h-3.5 w-3.5" />
                {cleanHolidayName}
              </p>
            )}
          </div>
        )}

        <div className="relative mt-4 overflow-hidden rounded-[1.4rem] border border-primary/20 bg-gradient-to-b from-primary/10 via-card/60 to-card/80 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl"
            aria-hidden="true"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.3), transparent 70%)" }}
          />

          <div className="relative flex flex-col items-center text-center">
            {hasTwoD ? (
              <motion.div
                initial={{ opacity: 0.92 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative font-display text-[clamp(4.7rem,22vw,7.3rem)] font-bold leading-[0.92] text-primary"
                style={{
                  textShadow: "0 8px 28px hsl(var(--primary)/0.28)",
                }}
              >
                <RollingNumber value={twod} digitClassName="gold-metal-text" />
                {isResultLocked && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -right-5 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-success/35 bg-success/15"
                  >
                    <Lock className="h-4 w-4 text-success" />
                  </motion.span>
                )}
              </motion.div>
            ) : (
              <p className="py-6 font-display text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {isLive ? "Waiting For Result" : "No Active Session"}
              </p>
            )}

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
                    Preliminary {resultConfirmSecondsLeft > 0 ? `• ${resultConfirmSecondsLeft}s` : "• Confirming"}
                  </span>
                </motion.div>
              )}

              {resultVerificationStatus === "verified" && hasTwoD && (
                <motion.div
                  key="verified"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-950/70 px-4 py-1.5 backdrop-blur-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={2.2} />
                  <span className="font-display text-[0.7rem] font-bold uppercase tracking-wider text-emerald-400">Verified</span>
                </motion.div>
              )}
            </AnimatePresence>

            {showAwaitingFinalNotice && (
              <div className="mt-2 inline-flex items-center rounded-full border border-border bg-[hsl(var(--card-strong))] px-3 py-1">
                <span className="font-display text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Awaiting Verified Result
                </span>
              </div>
            )}
          </div>
        </div>

        {hasStockDatetime && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-[hsl(var(--card-strong))] px-3 py-2">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                showLivePendingClock ? "bg-primary/10" : isResultLocked ? "bg-success/10" : "bg-muted"
              }`}
            >
              {showLivePendingClock ? (
                <Clock3 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <CheckCircle
                  className="h-3.5 w-3.5"
                  style={{ color: isResultLocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}
                />
              )}
            </div>
            <span className="font-display text-[0.76rem] font-semibold text-[hsl(var(--text-secondary))]">
              {showLivePendingClock ? "Live mode:" : "Updated:"}{" "}
              <span className="font-bold text-[hsl(var(--text-strong))]">{stockDatetime}</span>
            </span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <motion.div
            key={`set-${setFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="rounded-2xl border border-border/80 bg-[hsl(var(--card-strong))] p-4 active:scale-[0.98] transition-transform duration-150"
          >
            <span className="mb-1 block font-display text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--text-secondary))]">
              SET Index
            </span>
            <span className="font-display text-[1.35rem] font-extrabold text-[hsl(var(--text-strong))]">
              {hasSetValue ? setFormatted : "\u00A0"}
            </span>
          </motion.div>

          <motion.div
            key={`val-${valueFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="rounded-2xl border border-border/80 bg-[hsl(var(--card-strong))] p-4 active:scale-[0.98] transition-transform duration-150"
          >
            <span className="mb-1 block font-display text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--text-secondary))]">
              Value
            </span>
            <span className="font-display text-[1.35rem] font-extrabold text-[hsl(var(--text-strong))]">
              {hasValueValue ? valueFormatted : "\u00A0"}
            </span>
          </motion.div>
        </div>

        <footer className="mt-4 border-t border-border/70 pt-4">
          <div className="flex items-center justify-between font-display text-xs">
            <span className="font-bold text-[hsl(var(--text-strong))]">Date</span>
            <span className="font-semibold text-[hsl(var(--text-secondary))]">{currentDate}</span>
          </div>
        </footer>
      </article>
    </motion.section>
  );
}

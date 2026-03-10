import { AnimatePresence, motion } from "framer-motion";
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
        className="relative overflow-hidden rounded-3xl bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]"
        style={{ border: "1px solid hsl(220 13% 90%)" }}
      >
        {/* Header chips */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-foreground"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Live 2D
            </span>
            <StatusPill isLive={isLive} connectionStatus={connectionStatus} />
            {isFinalOnlyMode && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                <Lock className="h-3 w-3 text-[hsl(var(--success))]" />
                <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[hsl(var(--success))]"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}>Final</span>
              </span>
            )}
            {isSyncing && isLive && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            {isHotMinute && isLive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5"
              >
                <Zap className="h-3 w-3 text-[hsl(var(--warm))]" fill="currentColor" />
                <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-[hsl(var(--warm))]"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}>Fast</span>
              </motion.span>
            )}
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground tabular-nums"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {clock}
          </span>
        </div>

        {/* Market Closed */}
        {marketClosed && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-[hsl(var(--warm))]"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Market Closed
            </span>
            {cleanHolidayName && (
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>{cleanHolidayName}</p>
              </div>
            )}
          </div>
        )}

        {/* Hero 2D Number */}
        <div className="flex flex-col items-center justify-center py-8 sm:py-10">
          <div className="relative">
            {hasTwoD ? (
              <motion.div
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-[clamp(5.5rem,22vw,8.5rem)] font-extrabold leading-none tracking-tight"
                style={{ fontFamily: "Inter, system-ui, sans-serif", color: "hsl(220 15% 10%)" }}
              >
                <RollingNumber
                  value={twod}
                  digitClassName=""
                  digitStyle={{ color: "hsl(220, 15%, 10%)" }}
                />
              </motion.div>
            ) : (
              <div className="h-[8.5rem] w-[10rem]" aria-hidden="true" />
            )}

            {isResultLocked && hasTwoD && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-4 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card"
              >
                <Lock className="h-3 w-3 text-[hsl(var(--success))]" />
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
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1"
              >
                <CircleAlert className="h-3.5 w-3.5 text-[hsl(var(--warm))]" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[hsl(var(--warm))]"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                  Preliminary {resultConfirmSecondsLeft > 0 ? `· ${resultConfirmSecondsLeft}s` : ""}
                </span>
              </motion.div>
            )}
            {resultVerificationStatus === "verified" && hasTwoD && (
              <motion.div
                key="verified"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--success))]" strokeWidth={2} />
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[hsl(var(--success))]"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}>Verified</span>
              </motion.div>
            )}
          </AnimatePresence>

          {showAwaitingFinalNotice && (
            <div className="mt-4 inline-flex items-center rounded-full border border-border px-3 py-1">
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                Awaiting Verified Result
              </span>
            </div>
          )}
        </div>

        {/* Updated timestamp */}
        {hasStockDatetime && (
          <div className="flex items-center justify-center gap-2 pb-4">
            <CheckCircle
              className="h-3.5 w-3.5"
              style={{ color: isResultLocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}
            />
            <span className="text-xs text-muted-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Updated{" "}
              <span className="font-semibold text-foreground">
                {stockDatetime}
              </span>
            </span>
          </div>
        )}

        {/* SET & Value bottom section */}
        <div className="grid grid-cols-2" style={{ borderTop: "1px solid hsl(220 13% 90%)" }}>
          <motion.div
            key={`set-${setFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="px-5 py-4 active:bg-muted/30 transition-colors"
            style={{ borderRight: "1px solid hsl(220 13% 90%)" }}
          >
            <span className="block text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground mb-1"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              SET Index
            </span>
            <span className="text-lg font-bold text-foreground sm:text-xl"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              {hasSetValue ? setFormatted : "\u00A0"}
            </span>
          </motion.div>
          <motion.div
            key={`val-${valueFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onTouchStart={() => tap()}
            className="px-5 py-4 active:bg-muted/30 transition-colors"
          >
            <span className="block text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground mb-1"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Value
            </span>
            <span className="text-lg font-bold text-foreground sm:text-xl"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              {hasValueValue ? valueFormatted : "\u00A0"}
            </span>
          </motion.div>
        </div>

        {/* Date footer */}
        <div className="px-5 py-3" style={{ borderTop: "1px solid hsl(220 13% 90%)" }}>
          <div className="flex justify-between text-xs" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
            <span className="font-semibold text-foreground">Date</span>
            <span className="text-muted-foreground">{currentDate}</span>
          </div>
        </div>
      </article>
    </section>
  );
}

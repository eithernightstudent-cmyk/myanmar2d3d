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
        className={`relative overflow-hidden rounded-2xl border border-border/60 shadow-sm backdrop-blur-lg transition-all ${
          flash ? "before:opacity-100" : "before:opacity-0"
        } before:pointer-events-none before:absolute before:inset-[-30%] before:bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_60%)] before:transition-opacity before:duration-200`}
        style={{ background: "linear-gradient(135deg, hsl(210 40% 97%), hsl(220 30% 95%))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.18em] text-primary status-badge-glow-live">
              Live 2D
            </span>
            {isLive && <StatusPill isLive={isLive} connectionStatus={connectionStatus} />}
            {isFinalOnlyMode && (
              <div className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5">
                <Lock className="h-2.5 w-2.5 text-success" />
                <span className="font-display text-[0.5rem] font-bold uppercase tracking-wider text-success">Final</span>
              </div>
            )}
            {isSyncing && isLive && (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
            {isHotMinute && isLive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5"
              >
                <Zap className="h-2.5 w-2.5 text-amber-500" fill="currentColor" />
                <span className="font-display text-[0.5rem] font-bold uppercase tracking-wider text-amber-600">Fast</span>
              </motion.div>
            )}
          </div>
          <span className="rounded-full border border-border bg-card px-2.5 py-1 font-display text-[0.65rem] font-bold gold-metal-text">
            {clock}
          </span>
        </div>

        {/* Holiday Name (without Market Closed banner) */}
        {marketClosed && cleanHolidayName && (
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <CalendarDays className="h-3 w-3 text-primary" />
              <p className="font-display text-xs font-bold text-primary/80">{cleanHolidayName}</p>
            </div>
          </div>
        )}

        {/* 2D Number — compact centered */}
        <div className="flex flex-col items-center justify-center py-3">
          <div className="relative">
            {hasTwoD ? (
              <motion.div
                initial={{ opacity: 0.95 }}
                animate={isLive ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
                transition={isLive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                className={`font-digital text-[clamp(3.5rem,14vw,5rem)] font-extrabold leading-none ${isLive ? "digital-glow digital-glow-pulse" : "digital-glow"}`}
              >
                <RollingNumber value={twod} digitClassName="gold-metal-text" />
              </motion.div>
            ) : (
              <div className="h-[5rem] w-[6rem]" aria-hidden="true" />
            )}

            {isResultLocked && hasTwoD && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-4 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-success/10 border border-success/30"
              >
                <Lock className="h-3 w-3 text-success" />
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
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-0.5"
              >
                <CircleAlert className="h-3 w-3 text-amber-500" />
                <span className="font-display text-[0.55rem] font-bold uppercase tracking-wider text-amber-700">
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
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 backdrop-blur-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.2} />
                <span className="font-display text-[0.6rem] font-bold uppercase tracking-wider text-emerald-700">Verified</span>
              </motion.div>
            )}
          </AnimatePresence>

          {showAwaitingFinalNotice && (
            <div className="mt-2 inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5">
              <span className="font-display text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Awaiting Verified Result
              </span>
            </div>
          )}
        </div>

        {/* Updated timestamp */}
        {hasStockDatetime && (
          <div className="flex items-center justify-center gap-1.5 pb-2">
            <CheckCircle
              className="h-3.5 w-3.5"
              style={{ color: isResultLocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}
            />
            <span className="font-display text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
              Updated:{" "}
              <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>
                {stockDatetime}
              </span>
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 h-px bg-foreground/10" />

        {/* SET & Value — compact grid */}
        <div className="grid grid-cols-3 items-end gap-2 px-4 py-3 text-center">
          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Set
            </p>
            <p className="font-display text-sm font-bold text-foreground">
              {hasSetValue ? setFormatted : "—"}
            </p>
          </div>
          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Value
            </p>
            <p className="font-display text-sm font-bold text-foreground">
              {hasValueValue ? valueFormatted : "—"}
            </p>
          </div>
          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Date
            </p>
            <p className="font-display text-sm font-bold text-foreground">
              {currentDate || "—"}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

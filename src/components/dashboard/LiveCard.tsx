import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ShieldCheck, Lock, CircleAlert } from "lucide-react";
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
}: LiveCardProps) {
  const marketClosed = !isTradingDay;
  const hasTwoD = /^\d{2}$/.test(String(twod ?? "").trim());
  const hasStockDatetime = !!stockDatetime && stockDatetime !== "--";
  const hasSetValue = !!setFormatted && setFormatted !== "--";
  const hasValueValue = !!valueFormatted && valueFormatted !== "--";
  const showPreliminaryNotice = hasTwoD && isResultPreliminary && !isResultLocked;

  const cleanHolidayName = (() => {
    if (holidayName && holidayName !== "null" && holidayName !== "NULL" && holidayName.trim() !== "") {
      return holidayName;
    }
    return null;
  })();

  const statusColor = isLive ? "hsl(var(--success))" : "hsl(var(--muted-foreground))";

  return (
    <section aria-live="polite">
      <article className="rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-4 sm:p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg">

        {/* Header: status + clock */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span className="relative flex h-2 w-2">
                {isLive && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: statusColor }} />}
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
              </span>
              {connectionStatus}
            </span>
            {isSyncing && isLive && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <span className="font-display text-[0.65rem] font-semibold tabular-nums uppercase tracking-[0.12em] text-muted-foreground">{clock}</span>
        </div>

        {/* Market closed notice */}
        {marketClosed && (
          <p className="mt-4 text-center font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Market Closed{cleanHolidayName ? ` · ${cleanHolidayName}` : ""}
          </p>
        )}

        {/* Divider */}
        <div className="my-3 h-px bg-foreground/10" />

        {/* Hero 2D number */}
        <div className="flex flex-col items-center py-6 sm:py-8">
          {hasTwoD ? (
            <div className="relative">
              <RollingNumber
                value={twod}
                className="font-display text-[clamp(5rem,20vw,7.5rem)] font-extrabold leading-none tracking-tight"
                digitStyle={{
                  background: "linear-gradient(180deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.6) 60%, hsl(var(--foreground) / 0.35) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 4px 12px hsl(var(--foreground) / 0.1))",
                }}
              />
              />
              {isResultLocked && (
                <Lock className="absolute -right-3 top-0 h-4 w-4 text-[hsl(var(--success))]" />
              )}
            </div>
          ) : (
            <div className="h-24 sm:h-28" aria-hidden="true" />
          )}

          {/* Badge area */}
          <AnimatePresence mode="wait">
            {showPreliminaryNotice && (
              <motion.p
                key="preliminary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <CircleAlert className="mr-1 inline h-3 w-3 align-[-2px] text-[hsl(var(--warm))]" />
                Preliminary{resultConfirmSecondsLeft > 0 ? ` · ${resultConfirmSecondsLeft}s` : ""}
              </motion.p>
            )}
            {resultVerificationStatus === "verified" && hasTwoD && (
              <motion.p
                key="verified"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 font-display text-[0.6rem] font-semibold uppercase tracking-wider text-[hsl(var(--success))]"
              >
                <ShieldCheck className="mr-1 inline h-3 w-3 align-[-2px]" />
                Verified
              </motion.p>
            )}
          </AnimatePresence>

          {isFinalOnlyMode && !hasTwoD && isLive && (
            <p className="mt-3 font-display text-[0.6rem] font-semibold text-muted-foreground">Awaiting verified result</p>
          )}
        </div>

        {/* Updated time */}
        {hasStockDatetime && (
          <p className="pb-3 text-center font-display text-[0.65rem] text-muted-foreground">
            Updated <span className="font-bold text-foreground">{stockDatetime}</span>
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-foreground/10" />

        {/* SET / Value / Date — bottom row */}
        <div className="grid grid-cols-3 items-center gap-2 pt-3 text-center">
          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Set</p>
            <p className="font-display text-sm font-bold text-foreground">{hasSetValue ? setFormatted : "—"}</p>
          </div>
          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Value</p>
            <p className="font-display text-sm font-bold text-foreground">{hasValueValue ? valueFormatted : "—"}</p>
          </div>
          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Date</p>
            <p className="font-display text-sm font-bold text-foreground">{currentDate || "—"}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
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

const FONT = { fontFamily: "Inter, system-ui, sans-serif" } as const;

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
      <div className="rounded-2xl bg-card" style={{ ...FONT, border: "1px solid hsl(220 14% 92%)" }}>

        {/* Row 1: status + clock */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <div className="flex items-center gap-2">
            {/* Live dot + status text */}
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                {isLive && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: statusColor }} />}
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
              </span>
              {connectionStatus}
            </span>
            {isSyncing && isLive && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <span className="text-[0.7rem] font-medium tabular-nums text-muted-foreground">{clock}</span>
        </div>

        {/* Market closed notice */}
        {marketClosed && (
          <p className="mt-3 text-center text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            Market Closed{cleanHolidayName ? ` · ${cleanHolidayName}` : ""}
          </p>
        )}

        {/* Hero 2D number */}
        <div className="flex flex-col items-center py-6 sm:py-8">
          {hasTwoD ? (
            <div className="relative">
              <RollingNumber
                value={twod}
                className="text-[clamp(5rem,20vw,7.5rem)] font-extrabold leading-none tracking-tight"
                digitStyle={{ color: "hsl(220 15% 10%)" }}
              />
              {isResultLocked && (
                <Lock className="absolute -right-3 top-0 h-4 w-4 text-[hsl(var(--success))]" />
              )}
            </div>
          ) : (
            <div className="h-24 sm:h-28" aria-hidden="true" />
          )}

          {/* Single-line badge area */}
          <AnimatePresence mode="wait">
            {showPreliminaryNotice && (
              <motion.p
                key="preliminary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-[0.65rem] font-medium text-muted-foreground"
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
                className="mt-3 text-[0.65rem] font-medium text-[hsl(var(--success))]"
              >
                <ShieldCheck className="mr-1 inline h-3 w-3 align-[-2px]" />
                Verified
              </motion.p>
            )}
          </AnimatePresence>

          {isFinalOnlyMode && !hasTwoD && isLive && (
            <p className="mt-3 text-[0.65rem] text-muted-foreground">Awaiting verified result</p>
          )}
        </div>

        {/* Updated time — plain text */}
        {hasStockDatetime && (
          <p className="pb-4 text-center text-[0.7rem] text-muted-foreground">
            Updated <span className="font-semibold text-foreground">{stockDatetime}</span>
          </p>
        )}

        {/* SET / Value / Date — single bottom row */}
        <div className="flex items-center border-t border-border px-5 py-3 text-[0.7rem]">
          <div className="flex-1">
            <span className="text-muted-foreground">SET </span>
            <span className="font-semibold text-foreground">{hasSetValue ? setFormatted : "—"}</span>
          </div>
          <div className="mx-3 h-3 w-px bg-border" />
          <div className="flex-1">
            <span className="text-muted-foreground">Val </span>
            <span className="font-semibold text-foreground">{hasValueValue ? valueFormatted : "—"}</span>
          </div>
          <div className="mx-3 h-3 w-px bg-border" />
          <span className="text-muted-foreground">{currentDate}</span>
        </div>
      </div>
    </section>
  );
}

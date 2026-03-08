import { motion } from "framer-motion";
import { StatusPill } from "./StatusPill";
import { Loader2 } from "lucide-react";

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
  serverTime: string;
  lastSuccessTime: string;
  holidayName?: string | null;
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
  serverTime,
  lastSuccessTime,
  holidayName,
}: LiveCardProps) {
  const marketClosed = !isLive;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.5 }}
      aria-live="polite"
    >
      <article
        className={`relative overflow-hidden rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-6 shadow-[var(--shadow-panel)] backdrop-blur-lg transition-all ${
          flash ? "before:opacity-100" : "before:opacity-0"
        } before:pointer-events-none before:absolute before:inset-[-30%] before:bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_60%)] before:transition-opacity before:duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Live 2D
            </span>
            <StatusPill isLive={isLive} connectionStatus={connectionStatus} />
            {isSyncing && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="font-display text-[0.6rem] font-semibold uppercase tracking-wider">
                  Syncing
                </span>
              </div>
            )}
          </div>
          <span className="rounded-full border border-border bg-[hsl(var(--card-strong))] px-3 py-1.5 font-display text-xs font-bold text-primary">
            {clock}
          </span>
        </div>

        {/* Market Status & Holiday Name */}
        {marketClosed && (
          <div className="mb-2 text-center">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Market Closed
            </p>
            {holidayName && (
              <p className="mt-1 font-display text-sm font-bold text-primary/80">
                📅 {holidayName}
              </p>
            )}
          </div>
        )}

        {/* Big 2D Number */}
        <div className="flex justify-center py-4">
          <span className="font-display text-[clamp(5rem,20vw,7rem)] font-bold leading-none text-primary [text-shadow:0_0_40px_hsl(var(--primary)/0.25)]">
            {twod}
          </span>
        </div>

        {/* Calculated 2D */}
        <p className="mb-6 text-center font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Calculated 2D: <span className="text-primary font-bold text-sm">{twod}</span>
        </p>

        {/* SET Index & Value */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            key={`set-${setFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-border bg-[hsl(var(--card-strong))] p-4"
          >
            <span className="block font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
              SET Index
            </span>
            <span className="font-display text-xl font-bold text-foreground">{setFormatted}</span>
          </motion.div>
          <motion.div
            key={`val-${valueFormatted}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-border bg-[hsl(var(--card-strong))] p-4"
          >
            <span className="block font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
              Value
            </span>
            <span className="font-display text-xl font-bold text-foreground">{valueFormatted}</span>
          </motion.div>
        </div>

        {/* Date, Server Time & Last Sync */}
        <div className="space-y-1.5 border-t border-border pt-4">
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold text-foreground">Date</span>
            <span className="text-muted-foreground">{currentDate}</span>
          </div>
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold text-foreground">Server Time</span>
            <span className="text-muted-foreground">{serverTime}</span>
          </div>
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold text-foreground">Last Successful Sync</span>
            <span className="text-primary font-semibold">{lastSuccessTime}</span>
          </div>
        </div>
      </article>
    </motion.section>
  );
}

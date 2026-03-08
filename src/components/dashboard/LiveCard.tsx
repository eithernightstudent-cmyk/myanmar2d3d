import { motion, AnimatePresence } from "framer-motion";
import { StatusPill } from "./StatusPill";
import { Loader2, CheckCircle, ShieldCheck, Lock } from "lucide-react";
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
  serverTime: string;
  lastSuccessTime: string;
  holidayName?: string | null;
  stockDatetime?: string;
  resultVerificationStatus?: "verified" | "finalizing" | "live" | "closed";
  isResultLocked?: boolean;
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
  stockDatetime,
  resultVerificationStatus = "closed",
  isResultLocked = false,
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
            {isSyncing && (
              <div className="flex items-center gap-1" style={{ color: "hsl(var(--text-secondary))" }}>
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
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "hsl(var(--text-secondary))" }}>
              Market Closed
            </p>
            {holidayName && (
              <p className="mt-1 font-display text-sm font-bold text-primary/80">
                📅 {holidayName}
              </p>
            )}
          </div>
        )}

        {/* Big 2D Number — Vibrant Gold */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative">
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

            {/* Lock icon when result is verified */}
            {isResultLocked && twod !== "--" && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -right-6 -top-1"
              >
                <Lock className="h-4 w-4 text-success" />
              </motion.div>
            )}
          </div>

          {/* Verification Status Badge */}
          <AnimatePresence mode="wait">
            {resultVerificationStatus === "finalizing" && (
              <motion.div
                key="finalizing"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-warm/30 bg-warm-soft px-3 py-1"
              >
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="font-display text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                  Finalizing...
                </span>
              </motion.div>
            )}
            {resultVerificationStatus === "verified" && twod !== "--" && (
              <motion.div
                key="verified"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-light px-3 py-1"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span className="font-display text-[0.65rem] font-bold uppercase tracking-wider text-success">
                  Verified
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Updated timestamp — premium style with green verified checkmark */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <CheckCircle className="h-4 w-4" style={{ color: isResultLocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }} />
          <span className="font-display text-[0.8rem] font-semibold" style={{ color: "hsl(var(--text-secondary))" }}>
            Updated:{" "}
            <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>
              {stockDatetime || "--"}
            </span>
          </span>
        </div>

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
            <span className="font-display text-xl font-bold" style={{ color: "hsl(var(--text-strong))" }}>{setFormatted}</span>
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
            <span className="font-display text-xl font-bold" style={{ color: "hsl(var(--text-strong))" }}>{valueFormatted}</span>
          </motion.div>
        </div>

        {/* Date, Server Time & Last Sync */}
        <div className="space-y-1.5 border-t border-border pt-4">
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>Date</span>
            <span style={{ color: "hsl(var(--text-secondary))" }}>{currentDate}</span>
          </div>
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>Server Time</span>
            <span style={{ color: "hsl(var(--text-secondary))" }}>{serverTime}</span>
          </div>
          <div className="flex justify-between font-display text-xs">
            <span className="font-bold" style={{ color: "hsl(var(--text-strong))" }}>Last Successful Sync</span>
            <span className="text-primary font-semibold">{lastSuccessTime}</span>
          </div>
        </div>
      </article>
    </motion.section>
  );
}

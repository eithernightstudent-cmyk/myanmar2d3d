import { motion } from "framer-motion";

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
}

export function LiveCard({
  clock,
  twod,
  threed,
  setDigit,
  valueDigit,
  setFormatted,
  valueFormatted,
  lastUpdated,
  marketTimestamp,
  flash,
  apiNote,
}: LiveCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="grid gap-3"
      aria-live="polite"
    >
      <article
        className={`relative overflow-hidden rounded-3xl border border-border bg-card/90 p-5 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md transition-all ${
          flash ? "before:opacity-100" : "before:opacity-0"
        } before:pointer-events-none before:absolute before:inset-[-30%] before:bg-[radial-gradient(circle,hsl(var(--primary)/0.16),transparent_60%)] before:transition-opacity before:duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Live 2D Dashboard
          </span>
          <span className="rounded-lg border border-input bg-secondary px-2 py-1 font-display text-[0.72rem] font-semibold text-muted-foreground">
            {clock}
          </span>
        </div>

        {/* Big 2D & 3D Numbers */}
        <div className="grid min-h-[132px] place-items-center">
          <div className="flex items-end gap-4">
            <div className="text-center">
              <span className="block font-display text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">2D</span>
              <span className="font-display text-[clamp(4.2rem,18vw,5.4rem)] font-bold leading-none text-primary [text-shadow:0_0_22px_hsl(var(--primary)/0.25)]">
                {twod}
              </span>
            </div>
            <div className="text-center pb-1">
              <span className="block font-display text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">3D</span>
              <span className="font-display text-[clamp(2.4rem,10vw,3.2rem)] font-bold leading-none text-accent-foreground [text-shadow:0_0_16px_hsl(var(--foreground)/0.1)]">
                {threed}
              </span>
            </div>
          </div>
        </div>

        {/* Calc Strip */}
        <div className="mt-2 rounded-md border border-border bg-accent px-3 py-2">
          <p className="m-0 font-display text-[0.78rem] font-bold uppercase tracking-wider text-accent-foreground">
            2D = <span className="text-primary">{setDigit}</span> + <span className="text-primary">{valueDigit}</span>
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <article className="rounded-md border border-input bg-secondary p-3">
            <h3 className="mb-1.5 font-display text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              SET Index
            </h3>
            <p className="font-display text-lg font-bold text-foreground">{setFormatted}</p>
          </article>
          <article className="rounded-md border border-input bg-secondary p-3">
            <h3 className="mb-1.5 font-display text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Value (Market Turnover)
            </h3>
            <p className="font-display text-lg font-bold text-foreground">{valueFormatted}</p>
          </article>
        </div>

        {/* Result Meta */}
        <div className="mt-4 grid gap-1.5 border-t border-border pt-3">
          <p className="flex justify-between gap-4 font-display text-[0.74rem] font-medium text-muted-foreground">
            <strong className="font-bold text-foreground">Last Updated</strong>
            <span>{lastUpdated}</span>
          </p>
          <p className="flex justify-between gap-4 font-display text-[0.74rem] font-medium text-muted-foreground">
            <strong className="font-bold text-foreground">Market Timestamp</strong>
            <span>{marketTimestamp}</span>
          </p>
        </div>
      </article>

      <p className="w-fit max-w-full rounded-full border border-border bg-card/90 px-3 py-1.5 font-display text-[0.7rem] font-medium text-muted-foreground">
        {apiNote}
      </p>
    </motion.section>
  );
}

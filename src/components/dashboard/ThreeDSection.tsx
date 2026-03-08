import { motion } from "framer-motion";
import { formatNumber } from "@/lib/market-utils";

interface CurrentDayResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
}

interface ThreeDSectionProps {
  threed: string;
  valueFormatted: string;
  currentDayResults: CurrentDayResult[];
  flash: boolean;
}

function get3D(value: string) {
  const digits = String(Math.floor(Math.abs(Number(String(value ?? "").replace(/,/g, ""))))).replace(/\D/g, "");
  return digits.length >= 3 ? digits.slice(-3) : digits.padStart(3, "0");
}

function formatResultTime(raw: string) {
  const text = String(raw ?? "").trim();
  if (!text || text === "--") return "--";
  return text.slice(0, 5);
}

export function ThreeDSection({ threed, valueFormatted, currentDayResults, flash }: ThreeDSectionProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className={`relative overflow-hidden rounded-3xl border border-border bg-card/90 p-5 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md transition-all ${
        flash ? "before:opacity-100" : "before:opacity-0"
      } before:pointer-events-none before:absolute before:inset-[-30%] before:bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_60%)] before:transition-opacity before:duration-200`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          🎰 Live 3D Results
        </span>
        <span className="rounded-lg border border-input bg-accent px-2 py-1 font-display text-[0.62rem] font-semibold text-accent-foreground">
          Value Last 3 Digits
        </span>
      </div>

      {/* Big 3D Number */}
      <div className="grid min-h-[100px] place-items-center">
        <span className="font-display text-[clamp(3rem,14vw,4.5rem)] font-bold leading-none text-primary [text-shadow:0_0_22px_hsl(var(--primary)/0.25)]">
          {threed}
        </span>
      </div>

      {/* Source */}
      <div className="mt-2 rounded-md border border-border bg-accent px-3 py-2">
        <p className="m-0 font-display text-[0.78rem] font-bold uppercase tracking-wider text-accent-foreground">
          Value = <span className="text-primary">{valueFormatted}</span> → 3D = <span className="text-primary">{threed}</span>
        </p>
      </div>

      {/* Today's 3D Results */}
      {currentDayResults.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-display text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Today's 3D
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {currentDayResults.map((entry, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-secondary p-2.5"
              >
                <span className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  {formatResultTime(entry.open_time)}
                </span>
                <span className="font-display text-xl font-bold text-primary">
                  {get3D(entry.value)}
                </span>
                <span className="font-display text-[0.55rem] text-muted-foreground">
                  VAL {formatNumber(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.article>
  );
}

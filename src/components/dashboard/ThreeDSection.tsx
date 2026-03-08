import { motion } from "framer-motion";

interface ThreeDResult {
  value: string;
  date: string;
  time: string;
}

interface ThreeDSectionProps {
  threed: string;
  valueFormatted: string;
  currentDayResults: Array<{
    set: string;
    value: string;
    open_time: string;
    twod: string;
    stock_date?: string;
    stock_datetime?: string;
  }>;
  flash: boolean;
  lastUpdated: string;
  historyResults: Array<{
    date?: string;
    child: Array<{
      time: string;
      set: string;
      value: string;
      twod: string;
    }>;
  }>;
}

function get3D(value: string) {
  const digits = String(Math.floor(Math.abs(Number(String(value ?? "").replace(/,/g, ""))))).replace(/\D/g, "");
  return digits.length >= 3 ? digits.slice(-3) : digits.padStart(3, "0");
}

function formatDate(dateStr: string) {
  if (!dateStr) return "--";
  // Convert from YYYY-MM-DD to DD/MM/YYYY
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function formatTime12h(timeStr: string) {
  if (!timeStr || timeStr === "--") return "--";
  const t = timeStr.slice(0, 5);
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function ThreeDSection({ lastUpdated, historyResults }: ThreeDSectionProps) {
  // Collect latest 3D results from history (flatten all sessions, take last 6)
  const allResults: ThreeDResult[] = [];
  for (const day of historyResults) {
    for (const session of day.child || []) {
      allResults.push({
        value: get3D(session.value),
        date: formatDate(day.date || ""),
        time: formatTime12h(session.time),
      });
    }
  }
  const latestResults = allResults.slice(0, 6);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-bold text-foreground">
          Latest 3D Results
        </h3>
        <span className="font-display text-[0.65rem] text-muted-foreground">
          Last sync: {lastUpdated}
        </span>
      </div>

      {/* 3D Results Grid */}
      {latestResults.length === 0 ? (
        <p className="py-8 text-center font-display text-sm text-muted-foreground">
          No results available
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {latestResults.map((result, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary/80"
            >
              <span className="font-display text-3xl font-bold text-foreground">
                {result.value}
              </span>
              <div className="mt-1.5 space-y-0.5">
                <p className="font-display text-[0.65rem] text-muted-foreground">
                  {result.date}
                </p>
                <p className="font-display text-[0.65rem] text-muted-foreground">
                  {result.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.article>
  );
}

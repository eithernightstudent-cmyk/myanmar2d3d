import { motion } from "framer-motion";
import { formatNumber } from "@/lib/market-utils";
import { hapticLight } from "@/lib/haptic";

interface CurrentDayResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
}

interface SessionPanelProps {
  connectionStatus: string;
  currentDate: string;
  lastFetchTime: string;
  nextCheck: string;
  currentDayResults: CurrentDayResult[];
}

const SESSION_LABELS: Record<string, string> = {
  "11:00": "11:00 AM",
  "12:01": "12:00 PM",
  "15:00": "3:00 PM",
  "16:30": "4:30 PM",
};

function getSessionLabel(time: string) {
  const t = String(time ?? "").trim().slice(0, 5);
  return SESSION_LABELS[t] || t || "--";
}

function getSubLabel(entry: CurrentDayResult) {
  const time = String(entry.open_time ?? "").trim().slice(0, 5);
  if (time === "16:31" || time === "16:35") {
    const digits = String(Math.floor(Math.abs(Number(String(entry.value ?? "").replace(/,/g, ""))))).replace(/\D/g, "");
    const last2 = digits.length >= 2 ? digits.slice(-2) : digits.padStart(2, "0");
    return `Modern ${last2}`;
  }
  return `SET ${formatNumber(entry.set)}`;
}

export function SessionPanel({
  currentDayResults,
}: SessionPanelProps) {
  if (!currentDayResults || currentDayResults.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.5 }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {currentDayResults.map((entry, i) => (
        <div
          key={i}
          onTouchStart={hapticLight}
          className="flex flex-col items-center gap-1 rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-4 shadow-[var(--shadow-panel)] backdrop-blur-lg active:scale-[0.97] transition-transform"
        >
          <span className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {getSessionLabel(entry.open_time)}
          </span>
          <span className="font-display text-3xl font-bold text-foreground">
            {entry.twod || "--"}
          </span>
          <span className="font-display text-[0.6rem] text-muted-foreground">
            {getSubLabel(entry)}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

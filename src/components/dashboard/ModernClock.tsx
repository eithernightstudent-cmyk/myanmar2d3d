import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getThailandParts, padTwo } from "@/lib/market-utils";

export function ModernClock() {
  const [parts, setParts] = useState(getThailandParts());

  useEffect(() => {
    const id = setInterval(() => setParts(getThailandParts()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = padTwo(parts.hour);
  const m = padTwo(parts.minute);
  const s = padTwo(parts.second);

  // Result times
  const resultTimes = [
    { label: "Morning", time: "12:01" },
    { label: "Afternoon", time: "14:31" },
    { label: "Evening 1", time: "16:31" },
    { label: "Evening 2", time: "16:35" },
  ];

  const nowMinutes = parts.hour * 60 + parts.minute;
  const getStatus = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const target = h * 60 + m;
    if (nowMinutes >= target) return "done";
    if (nowMinutes >= target - 5) return "soon";
    return "waiting";
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.5 }}
      className="rounded-3xl border border-border bg-card/90 p-5 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          🇹🇭 Thailand Time
        </span>
        <span className="font-display text-[0.62rem] font-medium text-muted-foreground">
          {parts.weekday} {padTwo(parts.day)}/{padTwo(parts.month)}/{parts.year}
        </span>
      </div>

      {/* Digital Clock */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {[h[0], h[1], ":", m[0], m[1], ":", s[0], s[1]].map((char, i) =>
          char === ":" ? (
            <span
              key={i}
              className="font-display text-2xl font-bold text-primary animate-pulse mx-0.5"
            >
              :
            </span>
          ) : (
            <span
              key={i}
              className="inline-flex h-12 w-9 items-center justify-center rounded-lg border border-border bg-secondary font-display text-xl font-bold text-foreground shadow-sm"
            >
              {char}
            </span>
          )
        )}
      </div>

      {/* Result Schedule */}
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {resultTimes.map((rt) => {
          const status = getStatus(rt.time);
          return (
            <div
              key={rt.label}
              className={`flex flex-col items-center rounded-lg border p-2 transition-colors ${
                status === "done"
                  ? "border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.08)]"
                  : status === "soon"
                  ? "border-primary/40 bg-primary/5 animate-pulse"
                  : "border-border bg-secondary"
              }`}
            >
              <span className="font-display text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {rt.label}
              </span>
              <span className={`font-display text-sm font-bold ${
                status === "done" ? "text-[hsl(var(--success))]" : "text-foreground"
              }`}>
                {rt.time}
              </span>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getThailandParts, padTwo } from "@/lib/market-utils";

const RESULT_TIMES = [
  { label: "Morning", h: 12, m: 1 },
  { label: "Afternoon", h: 14, m: 31 },
  { label: "Evening 1", h: 16, m: 31 },
  { label: "Evening 2", h: 16, m: 35 },
];

function getNextResult(nowH: number, nowM: number, nowS: number) {
  const nowTotal = nowH * 3600 + nowM * 60 + nowS;
  for (const rt of RESULT_TIMES) {
    const target = rt.h * 3600 + rt.m * 60;
    if (nowTotal < target) {
      const diff = target - nowTotal;
      const hh = Math.floor(diff / 3600);
      const mm = Math.floor((diff % 3600) / 60);
      const ss = diff % 60;
      return { label: rt.label, time: `${padTwo(rt.h)}:${padTwo(rt.m)}`, hh, mm, ss };
    }
  }
  return null; // All results done for today
}

export function ModernClock() {
  const [parts, setParts] = useState(getThailandParts());

  useEffect(() => {
    const id = setInterval(() => setParts(getThailandParts()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = padTwo(parts.hour);
  const m = padTwo(parts.minute);
  const s = padTwo(parts.second);

  const next = getNextResult(parts.hour, parts.minute, parts.second);

  const nowMinutes = parts.hour * 60 + parts.minute;
  const getStatus = (rh: number, rm: number) => {
    const target = rh * 60 + rm;
    if (nowMinutes >= target) return "done";
    if (nowMinutes >= target - 5) return "soon";
    return "waiting";
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          🇹🇭 Thailand Time
        </span>
        <span className="font-display text-[0.6rem] text-muted-foreground">
          {parts.weekday} {padTwo(parts.day)}/{padTwo(parts.month)}/{parts.year}
        </span>
      </div>

      {/* Digital Clock */}
      <div className="flex items-center justify-center gap-1 py-2">
        {[h[0], h[1], ":", m[0], m[1], ":", s[0], s[1]].map((char, i) =>
          char === ":" ? (
            <span key={i} className="font-display text-xl font-bold text-primary animate-pulse mx-0.5">:</span>
          ) : (
            <span
              key={i}
              className="inline-flex h-10 w-8 items-center justify-center rounded-lg border border-border bg-secondary font-display text-lg font-bold text-foreground"
            >
              {char}
            </span>
          )
        )}
      </div>

      {/* Countdown to next result */}
      {next ? (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
          <p className="font-display text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Next: {next.label} ({next.time})
          </p>
          <div className="flex items-center justify-center gap-1.5">
            {[
              { val: padTwo(next.hh), unit: "h" },
              { val: padTwo(next.mm), unit: "m" },
              { val: padTwo(next.ss), unit: "s" },
            ].map((t, i) => (
              <div key={i} className="flex items-baseline gap-0.5">
                <span className="font-display text-2xl font-bold text-primary">{t.val}</span>
                <span className="font-display text-[0.55rem] font-semibold text-muted-foreground">{t.unit}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-success/30 bg-success/5 p-3 text-center">
          <p className="font-display text-xs font-semibold text-success">✓ All results completed for today</p>
        </div>
      )}

      {/* Result Schedule */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {RESULT_TIMES.map((rt) => {
          const status = getStatus(rt.h, rt.m);
          return (
            <div
              key={rt.label}
              className={`flex flex-col items-center rounded-lg border p-2 transition-colors ${
                status === "done"
                  ? "border-success/30 bg-success/5"
                  : status === "soon"
                  ? "border-primary/40 bg-primary/5 animate-pulse"
                  : "border-border bg-secondary"
              }`}
            >
              <span className="font-display text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {rt.label}
              </span>
              <span className={`font-display text-sm font-bold ${status === "done" ? "text-success" : "text-foreground"}`}>
                {padTwo(rt.h)}:{padTwo(rt.m)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.article>
  );
}

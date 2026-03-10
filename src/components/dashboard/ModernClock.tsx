import { useState, useEffect } from "react";

import { Globe, CheckCircle2 } from "lucide-react";
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
  return null;
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
    <article
      className="rounded-3xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-teal-400 to-emerald-500 shadow-sm">
            <Globe className="h-3 w-3 text-white" strokeWidth={2.5} />
          </div>
          Myanmar Time
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
              className="inline-flex h-10 w-8 items-center justify-center rounded-xl border border-border bg-[hsl(var(--card-strong))] font-display text-lg font-bold text-foreground"
            >
              {char}
            </span>
          )
        )}
      </div>

      {/* Countdown */}
      {next ? (
        <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-center">
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
                <span className="font-digital text-2xl font-bold text-primary">{t.val}</span>
                <span className="font-display text-[0.55rem] font-semibold text-muted-foreground">{t.unit}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 text-center">
          <p className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All results completed for today
          </p>
        </div>
      )}

      {/* Schedule — prominent session times */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {RESULT_TIMES.map((rt) => {
          const status = getStatus(rt.h, rt.m);
          return (
            <div
              key={rt.label}
              className={`relative flex flex-col items-center rounded-2xl border-2 p-2.5 transition-all duration-300 ${
                status === "done"
                  ? "border-primary/40 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                  : status === "soon"
                  ? "border-[hsl(var(--warm))]/50 bg-[hsl(var(--warm-soft))] shadow-[0_0_16px_hsl(var(--warm)/0.2)] animate-pulse"
                  : "border-border/60 bg-[hsl(var(--card-strong))]"
              }`}
            >
              {status === "done" && (
                <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                  <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <span className="font-display text-[0.55rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {rt.label}
              </span>
              <span className={`font-digital text-base font-extrabold tracking-wider ${
                status === "done" ? "text-primary" : status === "soon" ? "text-accent-foreground" : "text-foreground"
              }`}>
                {padTwo(rt.h)}:{padTwo(rt.m)}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

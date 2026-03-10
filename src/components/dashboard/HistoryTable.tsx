import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/market-utils";
import { Loader2, BarChart3 } from "lucide-react";
import { tap } from "@/lib/haptic";

const SESSION_MAP: Record<string, string> = {
  "11:00": "11:00 AM",
  "12:01": "12:01 PM",
  "15:00": "3:00 PM",
  "16:30": "4:30 PM",
};

const SESSION_ORDER = ["11:00", "12:01", "15:00", "16:30"];

interface DayResult {
  date?: string;
  child: Array<{
    time: string;
    set: string;
    value: string;
    twod: string;
  }>;
}

function normalizeTime(t: string): string {
  return String(t ?? "").trim().slice(0, 5);
}

function isValidTwoD(val: string): boolean {
  return /^\d{2}$/.test(String(val ?? "").trim());
}

function get3D(value: string) {
  const digits = String(Math.floor(Math.abs(Number(String(value ?? "").replace(/,/g, ""))))).replace(/\D/g, "");
  return digits.length >= 3 ? digits.slice(-3) : digits.padStart(3, "0");
}

export function HistoryTable() {
  const [results, setResults] = useState<DayResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        // Use thaistock2d /2d_result endpoint via edge function
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "2d_result" },
        });
        if (!response.error && response.data?.data) {
          const raw = response.data.data;
          let days: DayResult[] = [];
          if (Array.isArray(raw)) {
            days = raw;
          } else if (raw?.data && Array.isArray(raw.data)) {
            days = raw.data;
          }
          // Normalize times
          const normalized = days.map((day) => ({
            ...day,
            child: (day.child || []).map((s) => ({
              ...s,
              time: normalizeTime(s.time),
            })),
          }));
          setResults(normalized.slice(0, 7));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14, duration: 0.5 }}
      className="rounded-3xl border border-border bg-card/90 p-5 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md"
    >
      <h3 className="mb-4 flex items-center gap-2 font-display text-[0.8rem] font-bold uppercase tracking-wider text-foreground">
        <BarChart3 className="h-4 w-4 text-primary" />
        Previous Results (Last 7 Days)
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <p className="py-4 text-center font-display text-sm text-muted-foreground">
          No results available
        </p>
      ) : (
        <div className="space-y-3">
          {results.map((day, i) => {
            const sessionMap = new Map<string, typeof day.child[0]>();
            for (const s of day.child || []) {
              const key = normalizeTime(s.time);
              if (!sessionMap.has(key)) sessionMap.set(key, s);
            }

            return (
              <div key={day.date || i} className="rounded-xl border border-border bg-secondary/50 p-3">
                <p className="mb-2 font-display text-[0.7rem] font-bold text-muted-foreground">
                  📅 {day.date || "Unknown"}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {SESSION_ORDER.map((time) => {
                    const session = sessionMap.get(time);
                    const has = session && isValidTwoD(session.twod);

                    return (
                      <div
                        key={time}
                        onTouchStart={() => tap()}
                        className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card p-2 active:scale-95 transition-transform duration-150"
                      >
                        <span className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
                          {SESSION_MAP[time] || time}
                        </span>
                        {has ? (
                          <>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-display text-lg font-bold text-primary">
                                {session!.twod}
                              </span>
                              <span className="font-display text-sm font-bold text-accent-foreground">
                                {get3D(session!.value)}
                              </span>
                            </div>
                            <span className="font-display text-[0.55rem] text-muted-foreground">
                              SET {formatNumber(session!.set)}
                            </span>
                          </>
                        ) : (
                          <span className="font-display text-xs text-muted-foreground/60 py-1">
                            —
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.article>
  );
}

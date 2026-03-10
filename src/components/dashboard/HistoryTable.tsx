import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber, normalizeSessionDays, type SessionDay } from "@/lib/market-utils";
import { Loader2, BarChart3 } from "lucide-react";
import { tap } from "@/lib/haptic";

function get3D(value: string) {
  const digits = String(Math.floor(Math.abs(Number(String(value ?? "").replace(/,/g, ""))))).replace(/\D/g, "");
  return digits.length >= 3 ? digits.slice(-3) : digits.padStart(3, "0");
}

export function HistoryTable() {
  const [results, setResults] = useState<SessionDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        // Use calendar endpoint (RapidAPI primary via edge function)
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "calendar", page: "1", limit: "7" },
        });
        if (!response.error && response.data?.data) {
          const raw = response.data.data;
          // Handle both array format and calendar format
          if (Array.isArray(raw)) {
            setResults(normalizeSessionDays(raw, 7));
          } else if (raw?.data && Array.isArray(raw.data)) {
            setResults(normalizeSessionDays(raw.data, 7));
          }
          return;
        }
      } catch {
        // silent
      }

      // Fallback: try old 2d_result endpoint
      try {
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "2d_result" },
        });
        if (!response.error && response.data?.data) {
          setResults(normalizeSessionDays(response.data.data, 7));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchResults().finally(() => setLoading(false));
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
          {results.map((day, i) => (
            <div key={day.date || i} className="rounded-xl border border-border bg-secondary/50 p-3">
              <p className="mb-2 font-display text-[0.7rem] font-bold text-muted-foreground">
                📅 {day.date || "Unknown"}
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {day.child?.map((session, j) => (
                  <div
                    key={j}
                    onTouchStart={() => tap()}
                    className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card p-2 active:scale-95 transition-transform duration-150"
                  >
                    <span className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
                      {session.time?.slice(0, 5) || "--"}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-lg font-bold text-primary">
                        {session.twod}
                      </span>
                      <span className="font-display text-sm font-bold text-accent-foreground">
                        {get3D(session.value)}
                      </span>
                    </div>
                    <span className="font-display text-[0.55rem] text-muted-foreground">
                      SET {formatNumber(session.set)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.article>
  );
}

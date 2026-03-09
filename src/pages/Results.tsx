import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Calendar, Loader2, Info } from "lucide-react";
import { formatNumber } from "@/lib/market-utils";
import { Link } from "react-router-dom";
import { tap } from "@/lib/haptic";

const logoImg = "/logo-24.webp";
const Footer = lazy(() => import("@/components/dashboard/Footer").then(m => ({ default: m.Footer })));

const SESSION_MAP: Record<string, string> = {
  "11:00": "11:00 AM",
  "12:01": "12:01 PM",
  "15:00": "3:00 PM",
  "16:30": "4:30 PM",
};

const SESSION_ORDER = ["11:00", "12:01", "15:00", "16:30"];

interface SessionResult {
  time: string;
  set: string;
  value: string;
  twod: string;
}

interface DayResult {
  date?: string;
  child: SessionResult[];
}

function normalizeTime(t: string): string {
  return String(t ?? "").trim().slice(0, 5);
}

function isValidTwoD(val: string): boolean {
  return /^\d{2}$/.test(String(val ?? "").trim());
}

const Results = () => {
  const [results, setResults] = useState<DayResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ownerName = localStorage.getItem("kktech-live-owner-name") || "2D3D";

  useEffect(() => {
    async function fetchResults() {
      try {
        // Primary: use edge function which calls thaistock2d /2d_result
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "2d_result" },
        });
        if (response.error) throw new Error(response.error.message);

        const raw = response.data?.data;
        let days: DayResult[] = [];

        if (Array.isArray(raw)) {
          days = raw;
        } else if (raw?.data && Array.isArray(raw.data)) {
          days = raw.data;
        }

        // Normalize session times and filter valid entries
        const normalized = days.map((day) => ({
          ...day,
          child: (day.child || []).map((s) => ({
            ...s,
            time: normalizeTime(s.time),
          })),
        }));

        setResults(normalized.slice(0, 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-background">
      {/* Fixed header */}
      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-3 sm:px-5"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)" }}
      >
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-[hsl(var(--card-glass))] px-2.5 py-1.5 text-inherit no-underline shadow-lg backdrop-blur-xl transition-all active:scale-95"
        >
          <img
            src={logoImg}
            alt="2D3D logo"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover ring-1 ring-primary/20"
          />
          <span className="font-display text-[0.78rem] font-extrabold tracking-wide text-foreground">
            2D3D
          </span>
        </Link>
      </header>

      <main
        className="mx-auto w-[min(100%-0.75rem,72rem)] pb-24 sm:w-[min(100%-2rem,72rem)]"
        style={{ paddingTop: "max(calc(env(safe-area-inset-top, 0px) + 3.5rem), 4rem)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-tight text-foreground">
            2D Results
          </h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Last 10 days of official 2D session results
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-fail-border bg-fail-light p-4 text-center text-sm text-fail">
            {error}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-display text-sm text-muted-foreground">No results available</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="grid gap-4">
            {results.map((day, i) => {
              const sessionMap = new Map<string, SessionResult>();
              for (const s of day.child || []) {
                const key = normalizeTime(s.time);
                if (!sessionMap.has(key)) sessionMap.set(key, s);
              }

              return (
                <motion.article
                  key={day.date || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-primary shadow-sm">
                      <Calendar size={13} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="font-display text-sm font-bold text-foreground">
                      {day.date || "Unknown Date"}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SESSION_ORDER.map((time) => {
                      const session = sessionMap.get(time);
                      const has = session && isValidTwoD(session.twod);

                      return (
                        <div
                          key={time}
                          onTouchStart={() => tap()}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-secondary/50 p-3 transition-transform duration-150 active:scale-95"
                        >
                          <span className="font-display text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {SESSION_MAP[time] || time}
                          </span>
                          {has ? (
                            <>
                              <span className="font-display text-2xl font-bold text-primary">
                                {session!.twod}
                              </span>
                              <span className="font-display text-[0.58rem] text-muted-foreground">
                                SET {formatNumber(session!.set)}
                              </span>
                            </>
                          ) : (
                            <span className="font-display text-sm text-muted-foreground/60 py-1">
                              —
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>

      <Suspense fallback={null}><Footer ownerName={ownerName} /></Suspense>
      <BottomNav />
    </div>
  );
};

export default Results;

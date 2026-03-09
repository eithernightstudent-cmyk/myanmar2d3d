import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Topbar } from "@/components/dashboard/Topbar";
const Footer = lazy(() => import("@/components/dashboard/Footer").then(m => ({ default: m.Footer })));
import { Calendar, Loader2 } from "lucide-react";

interface DayResult {
  date?: string;
  child: Array<{
    time: string;
    set: string;
    value: string;
    twod: string;
  }>;
}

const Results = () => {
  const [results, setResults] = useState<DayResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ownerName = localStorage.getItem("kktech-live-owner-name") || "2D3D";

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "2d_result" },
        });
        if (response.error) throw new Error(response.error.message);
        setResults(response.data?.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden">
      <Topbar ownerName={ownerName} />

      <main
        className="mx-auto w-[min(100%-0.75rem,72rem)] pb-20 sm:w-[min(100%-2rem,72rem)]"
        style={{ paddingTop: "max(calc(env(safe-area-inset-top, 0px) + 3rem), 3.5rem)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-tight text-foreground">
            2D Results
          </h1>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Last 10 days of final 2D results
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-fail-border bg-fail-light p-4 text-fail">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4">
            {results.map((day, i) => (
              <motion.article
                key={day.date || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-2xl border border-border bg-card/90 p-4 shadow-[0_12px_20px_-14px_hsl(var(--foreground)/0.12)] backdrop-blur-md"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-primary" />
                  <h2 className="font-display text-sm font-bold text-foreground">
                    {day.date || "Unknown Date"}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {day.child?.map((session, j) => (
                    <div
                      key={j}
                      className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary p-3"
                    >
                      <span className="font-display text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                        {session.time?.slice(0, 5) || "--"}
                      </span>
                      <span className="font-display text-2xl font-bold text-primary">
                        {session.twod}
                      </span>
                      <span className="font-display text-[0.62rem] text-muted-foreground">
                        SET {session.set}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      <Suspense fallback={null}><Footer ownerName={ownerName} /></Suspense>
    </div>
  );
};

export default Results;

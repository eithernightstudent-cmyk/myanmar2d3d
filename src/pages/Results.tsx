import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Topbar } from "@/components/dashboard/Topbar";
import { Footer } from "@/components/dashboard/Footer";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, hsl(214 95% 93% / 0.95), transparent 32%), radial-gradient(circle at 90% 12%, hsl(30 100% 92% / 0.95), transparent 38%), hsl(var(--background))",
        }}
      />

      <Topbar ownerName={ownerName} />

      <main className="mx-auto w-[min(100%-2rem,72rem)] py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 font-display text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>

          <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-tight text-foreground">
            2D Results — Last 10 Days
          </h1>
          <p className="mt-1 mb-6 text-muted-foreground">
            Final 2D results from thaistock2d.com
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
                className="rounded-2xl border border-border bg-card/90 p-5 shadow-[0_12px_20px_-14px_hsl(var(--foreground)/0.12)] backdrop-blur-md"
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

      <Footer ownerName={ownerName} />
    </div>
  );
};

export default Results;

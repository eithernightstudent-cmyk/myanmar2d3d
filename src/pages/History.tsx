import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Topbar } from "@/components/dashboard/Topbar";
import { Footer } from "@/components/dashboard/Footer";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface HistoryEntry {
  time: string;
  set: string;
  value: string;
  twod: string;
  is_result?: string;
}

interface HistoryDay {
  date: string;
  child: HistoryEntry[];
}

const History = () => {
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ownerName = localStorage.getItem("kktech-live-owner-name") || "KKTech";

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "history" },
        });
        if (response.error) throw new Error(response.error.message);
        setHistory(response.data?.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">

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
            2D Change History
          </h1>
          <p className="mt-1 mb-6 text-muted-foreground">
            Live stock changes throughout the trading day
          </p>
        </motion.div>

        {/* Previous Results Table */}
        <div className="mb-6">
          <HistoryTable />

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
            {history.map((day, i) => (
              <motion.article
                key={day.date}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-2xl border border-border bg-card/90 p-5 shadow-[0_12px_20px_-14px_hsl(var(--foreground)/0.12)] backdrop-blur-md"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <h2 className="font-display text-sm font-bold text-foreground">
                    {day.date}
                  </h2>
                  <span className="font-display text-[0.65rem] text-muted-foreground">
                    ({day.child?.length || 0} entries)
                  </span>
                </div>

                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                          Time
                        </th>
                        <th className="pb-2 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                          2D
                        </th>
                        <th className="pb-2 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                          SET
                        </th>
                        <th className="pb-2 font-display text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.child?.slice(0, 50).map((entry, j) => (
                        <tr
                          key={j}
                          className={`border-b border-border/50 ${
                            entry.is_result === "on"
                              ? "bg-success-light"
                              : ""
                          }`}
                        >
                          <td className="py-1.5 font-display text-[0.75rem] text-muted-foreground">
                            {entry.time}
                          </td>
                          <td className="py-1.5 font-display text-sm font-bold text-primary">
                            {entry.twod}
                          </td>
                          <td className="py-1.5 font-display text-[0.75rem] text-foreground">
                            {entry.set}
                          </td>
                          <td className="py-1.5 font-display text-[0.75rem] text-foreground">
                            {entry.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

export default History;

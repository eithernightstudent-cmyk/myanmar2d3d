import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ThreeDResult {
  date: string;
  threed: string;
}

interface ThreeDSectionProps {
  lastUpdated: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "--";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export function ThreeDSection({ lastUpdated }: ThreeDSectionProps) {
  const [results, setResults] = useState<ThreeDResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThreeD() {
      try {
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "threed_result" },
        });
        if (!response.error && response.data?.data) {
          setResults(response.data.data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchThreeD();
  }, []);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-bold text-foreground">
          Latest 3D Results
        </h3>
        <span className="font-display text-[0.65rem] text-muted-foreground">
          Last sync: {lastUpdated}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <p className="py-8 text-center font-display text-sm text-muted-foreground">
          No results available
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.map((result, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary/80"
            >
              <span className="font-display text-3xl font-bold text-primary">
                {result.threed}
              </span>
              <p className="mt-1.5 font-display text-[0.65rem] text-muted-foreground">
                📅 {formatDate(result.date)}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.article>
  );
}

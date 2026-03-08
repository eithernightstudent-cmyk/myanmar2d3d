import { motion } from "framer-motion";

interface DailyResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
  stock_date: string;
  stock_datetime: string;
}

interface ResultsTableProps {
  results: DailyResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  if (!results || results.length === 0) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.5 }}
      className="rounded-3xl border border-border bg-card/90 p-5 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md"
    >
      <h3 className="font-display text-base font-bold tracking-wide text-foreground">
        Today's Results
      </h3>
      <p className="mt-0.5 mb-3 font-display text-[0.7rem] text-muted-foreground">
        {results[0]?.stock_date || "—"}
      </p>

      <div className="grid gap-2.5">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary p-3"
          >
            <div className="grid gap-0.5">
              <span className="font-display text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                {r.open_time}
              </span>
              <span className="font-display text-[0.72rem] text-muted-foreground">
                SET {r.set} · Val {r.value}
              </span>
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {r.twod}
            </span>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

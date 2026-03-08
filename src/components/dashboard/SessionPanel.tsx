import { motion } from "framer-motion";
import { formatNumber } from "@/lib/market-utils";

interface CurrentDayResult {
  set: string;
  value: string;
  open_time: string;
  twod: string;
}

interface SessionPanelProps {
  connectionStatus: string;
  currentDate: string;
  lastFetchTime: string;
  nextCheck: string;
  currentDayResults: CurrentDayResult[];
}

function formatResultTime(raw: string) {
  const text = String(raw ?? "").trim();
  if (!text || text === "--") return "--";
  return text.slice(0, 5);
}

export function SessionPanel({
  connectionStatus,
  currentDate,
  lastFetchTime,
  nextCheck,
  currentDayResults,
}: SessionPanelProps) {
        {/* Current Day Results */}
        <div className="mt-4">
          <h4 className="mb-2.5 font-display text-[0.8rem] font-bold uppercase tracking-wider text-foreground">
            Current Day Results
          </h4>
          <ul className="grid list-none gap-2 p-0">
            {(!currentDayResults || currentDayResults.length === 0) ? (
              <li className="rounded-md border border-dashed border-border p-3 font-display text-[0.72rem] font-medium text-muted-foreground">
                No result for current day.
              </li>
            ) : (
              currentDayResults.map((entry, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[auto_auto_1fr] items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2.5"
                >
                  <span className="font-display text-[0.68rem] font-bold text-muted-foreground">
                    {formatResultTime(entry.open_time)}
                  </span>
                  <span className="font-display text-base font-bold text-primary">
                    {entry.twod || "--"}
                  </span>
                  <span className="font-display text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    SET {formatNumber(entry.set)} | VALUE {formatNumber(entry.value)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </article>
    </motion.aside>
  );
}

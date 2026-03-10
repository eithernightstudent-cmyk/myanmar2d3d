import { useState, useEffect } from "react";
import { FullScreenOverlay } from "./FullScreenOverlay";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { RollingNumber } from "./RollingNumber";

interface HistoryEntry {
  time: string;
  set: string;
  value: string;
  twod: string;
  isResult: boolean;
}

interface TwoDHistoryData {
  result2d: string;
  updatedAt: string;
  entries: HistoryEntry[];
}

interface TwoDHistoryOverlayProps {
  open: boolean;
  onClose: () => void;
  date: string | null;
  openTime: string | null;
  sessionTime?: string;
}

export function TwoDHistoryOverlay({ open, onClose, date, openTime, sessionTime }: TwoDHistoryOverlayProps) {
  const [data, setData] = useState<TwoDHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !date || !openTime) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await supabase.functions.invoke("twod-history", {
          body: { date, open_time: openTime },
        });
        if (cancelled) return;
        if (resp.error) throw new Error(resp.error.message);
        setData(resp.data?.data || null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, date, openTime]);

  const title = sessionTime ? `2D History — ${sessionTime}` : "2D History";

  return (
    <FullScreenOverlay open={open} onClose={onClose} title={title}>
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-5">
          {/* Hero result */}
          <div className="flex flex-col items-center gap-2">
            {data.result2d && data.result2d !== "--" ? (
              <RollingNumber
                value={data.result2d}
                className="font-display text-6xl font-black"
                digitStyle={{
                  background: "linear-gradient(135deg, #fff6cc 0%, #ffd866 30%, #ffb81f 62%, #fff2ba 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              />
            ) : (
              <p className="font-display text-2xl font-bold text-muted-foreground">
                ဤ Session အတွက် Result Data မရှိပါ
              </p>
            )}
            {data.updatedAt && data.result2d !== "--" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                Updated: {data.updatedAt}
              </p>
            )}
            {data.result2d === "--" && data.entries.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-1">
                ရရှိနိုင်သော Timeline Data ကို အောက်တွင် ပြထားပါသည်
              </p>
            )}
          </div>

          {/* Timeline table */}
          <div className="rounded-2xl border border-border bg-[hsl(var(--card-glass))] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1.2fr_1fr_1.2fr_0.6fr] border-b border-border bg-muted/30 px-4 py-2.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Time</span>
              <span className="text-right">Set</span>
              <span className="text-right">Value</span>
              <span className="text-right">2D</span>
            </div>

            {/* Rows */}
            <div className="max-h-[60vh] overflow-y-auto">
              {data.entries.map((entry, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1.2fr_1fr_1.2fr_0.6fr] px-4 py-2 text-sm border-b border-border/50 last:border-0 transition-colors ${
                    entry.isResult
                      ? "bg-primary/15 border-primary/20"
                      : ""
                  }`}
                >
                  <span className={`font-mono text-xs ${entry.isResult ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                    {entry.time}
                  </span>
                  <span className={`text-right font-mono text-xs ${entry.isResult ? "font-bold text-foreground" : "text-foreground/80"}`}>
                    {entry.set}
                  </span>
                  <span className={`text-right font-mono text-xs ${entry.isResult ? "font-bold text-foreground" : "text-foreground/80"}`}>
                    {entry.value}
                  </span>
                  <span
                    className="text-right font-display text-sm font-bold"
                    style={entry.isResult ? {
                      background: "linear-gradient(135deg, #fff6cc 0%, #ffd866 30%, #ffb81f 62%, #fff2ba 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    } : { color: "hsl(38 90% 55%)" }}
                  >
                    {entry.twod}
                  </span>
                </div>
              ))}

              {data.entries.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No history data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </FullScreenOverlay>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/dashboard/Topbar";
import { LiveCard } from "@/components/dashboard/LiveCard";
import { SessionPanel } from "@/components/dashboard/SessionPanel";
import { ThreeDSection } from "@/components/dashboard/ThreeDSection";
import { Footer } from "@/components/dashboard/Footer";
import { supabase } from "@/integrations/supabase/client";

import { useLiveDashboard } from "@/hooks/use-live-dashboard";

interface DayResult {
  date?: string;
  child: Array<{
    time: string;
    set: string;
    value: string;
    twod: string;
  }>;
}

const Index = () => {
  const dashboard = useLiveDashboard();
  const [historyResults, setHistoryResults] = useState<DayResult[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await supabase.functions.invoke("set-live", {
          body: { endpoint: "2d_result" },
        });
        if (!response.error && response.data?.data) {
          setHistoryResults(response.data.data.slice(0, 7));
        }
      } catch {}
    }
    fetchHistory();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Topbar ownerName={dashboard.ownerName} />

      <main className="mx-auto w-[min(100%-2rem,72rem)] py-8">
        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* Left: Live 2D Card */}
          <LiveCard
            clock={dashboard.clock}
            twod={dashboard.twod}
            threed={dashboard.threed}
            setDigit={dashboard.setDigit}
            valueDigit={dashboard.valueDigit}
            setFormatted={dashboard.setFormatted}
            valueFormatted={dashboard.valueFormatted}
            lastUpdated={dashboard.lastUpdated}
            marketTimestamp={dashboard.marketTimestamp}
            flash={dashboard.flash}
            apiNote={dashboard.apiNote}
            isLive={dashboard.isLive}
            connectionStatus={dashboard.connectionStatus}
            currentDate={dashboard.currentDate}
            serverTime={dashboard.clock}
          />

          {/* Right: Latest 3D Results */}
          <ThreeDSection
            threed={dashboard.threed}
            valueFormatted={dashboard.valueFormatted}
            currentDayResults={dashboard.currentDayResults}
            flash={dashboard.flash}
            lastUpdated={dashboard.lastUpdated}
            historyResults={historyResults}
          />
        </div>

        {/* Session Results Bar */}
        <div className="mt-6">
          <SessionPanel
            connectionStatus={dashboard.connectionStatus}
            currentDate={dashboard.currentDate}
            lastFetchTime={dashboard.lastFetchTime}
            nextCheck={dashboard.nextCheck}
            currentDayResults={dashboard.currentDayResults}
          />
        </div>
      </main>

      <Footer ownerName={dashboard.ownerName} />
    </div>
  );
};

export default Index;

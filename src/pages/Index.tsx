import { Topbar } from "@/components/dashboard/Topbar";
import { LiveCard } from "@/components/dashboard/LiveCard";
import { ModernClock } from "@/components/dashboard/ModernClock";
import { TodayResults } from "@/components/dashboard/TodayResults";
import { SessionPanel } from "@/components/dashboard/SessionPanel";
import { ThreeDSection } from "@/components/dashboard/ThreeDSection";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { AboutSection } from "@/components/dashboard/AboutSection";
import { Footer } from "@/components/dashboard/Footer";
import { PullToRefresh } from "@/components/dashboard/PullToRefresh";
import { useLiveDashboard } from "@/hooks/use-live-dashboard";

const Index = () => {
  const dashboard = useLiveDashboard();

  return (
    <PullToRefresh onRefresh={dashboard.refreshData}>
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Background scene */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-all duration-500"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 10%, hsl(38 92% 50% / 0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 85% 8%, hsl(152 65% 42% / 0.08), transparent 45%), radial-gradient(ellipse 80% 50% at 50% 100%, hsl(38 92% 50% / 0.06), transparent 50%), linear-gradient(160deg, hsl(var(--background)), hsl(36 50% 95%), hsl(32 40% 93%))",
        }}
      />
      {/* Dark mode ambient glow overlays */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-0 transition-opacity duration-700 dark:opacity-100"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 10%, hsl(38 95% 58% / 0.06), transparent), radial-gradient(ellipse 60% 40% at 80% 15%, hsl(200 80% 50% / 0.04), transparent), radial-gradient(ellipse 90% 60% at 50% 100%, hsl(260 60% 50% / 0.04), transparent), linear-gradient(180deg, hsl(var(--background)), hsl(222 28% 5%))",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-30 transition-opacity duration-500 dark:opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 118, 110, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 118, 110, 0.04) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <Topbar ownerName={dashboard.ownerName} />

      <main className="mx-auto w-[min(100%-1.25rem,72rem)] py-6 sm:w-[min(100%-2rem,72rem)] sm:py-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="grid gap-5">
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
              isSyncing={dashboard.isSyncing}
              connectionStatus={dashboard.connectionStatus}
              currentDate={dashboard.currentDate}
              serverTime={dashboard.clock}
              lastSuccessTime={dashboard.lastSuccessTime}
              holidayName={dashboard.holidayName}
              stockDatetime={dashboard.stockDatetime}
              resultVerificationStatus={dashboard.resultVerificationStatus}
              isResultLocked={dashboard.isResultLocked}
            />
            <ModernClock />
          </div>

          {/* Right Column */}
          <ThreeDSection lastUpdated={dashboard.lastUpdated} />
        </div>

        {/* Today's Results Summary */}
        <div className="mt-6">
          <TodayResults
            currentDayResults={dashboard.currentDayResults}
            currentDate={dashboard.currentDate}
            fallbackResults={dashboard.allResults}
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

        {/* History Table from /live result array */}
        <div className="mt-6">
          <HistoryTable />
        </div>

        {/* About info moved to footer */}
      </main>

      <Footer ownerName={dashboard.ownerName} />
    </div>
    </PullToRefresh>
  );
};

export default Index;

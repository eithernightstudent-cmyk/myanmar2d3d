import { lazy, Suspense, useState } from "react";
import { LazyFooter } from "@/components/dashboard/LazyFooter";

const Topbar = lazy(() => import("@/components/dashboard/Topbar").then(m => ({ default: m.Topbar })));
const LiveCard = lazy(() => import("@/components/dashboard/LiveCard").then(m => ({ default: m.LiveCard })));
const FullScreenOverlay = lazy(() => import("@/components/dashboard/FullScreenOverlay").then(m => ({ default: m.FullScreenOverlay })));
const PullToRefresh = lazy(() => import("@/components/dashboard/PullToRefresh").then(m => ({ default: m.PullToRefresh })));
import { useLiveDashboard } from "@/hooks/use-live-dashboard";

const ModernClock = lazy(() => import("@/components/dashboard/ModernClock").then(m => ({ default: m.ModernClock })));
const TodayResults = lazy(() => import("@/components/dashboard/TodayResults").then(m => ({ default: m.TodayResults })));
const SessionPanel = lazy(() => import("@/components/dashboard/SessionPanel").then(m => ({ default: m.SessionPanel })));
const HistoryTable = lazy(() => import("@/components/dashboard/HistoryTable").then(m => ({ default: m.HistoryTable })));
const ThreeDSection = lazy(() => import("@/components/dashboard/ThreeDSection").then(m => ({ default: m.ThreeDSection })));

const Index = () => {
  const dashboard = useLiveDashboard();
  const [showHistory, setShowHistory] = useState(false);
  const [show3D, setShow3D] = useState(false);

  return (
    <Suspense fallback={null}>
    <PullToRefresh onRefresh={dashboard.refreshData}>
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden">
      {/* Background scene */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-all duration-500"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 10%, hsl(38 92% 50% / 0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 85% 8%, hsl(152 65% 42% / 0.08), transparent 45%), radial-gradient(ellipse 80% 50% at 50% 100%, hsl(38 92% 50% / 0.06), transparent 50%), linear-gradient(160deg, hsl(var(--background)), hsl(var(--background)))",
        }}
      />
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

      <Topbar
        ownerName={dashboard.ownerName}
        resultDisplayMode={dashboard.resultDisplayMode}
        onToggleResultDisplayMode={dashboard.toggleResultDisplayMode}
      />

      <main
        className="mx-auto w-[min(100%-0.75rem,72rem)] pb-20 sm:w-[min(100%-2rem,72rem)]"
        style={{ paddingTop: "max(calc(env(safe-area-inset-top, 0px) + 3rem), 3.5rem)" }}
      >
        <h1 className="sr-only">2D3D Myanmar Live Results Dashboard</h1>

        {/* Live Card + Clock */}
        <div className="grid grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="grid gap-3 sm:gap-4">
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
              isTradingDay={dashboard.isTradingDay}
              isSyncing={dashboard.isSyncing}
              connectionStatus={dashboard.connectionStatus}
              currentDate={dashboard.currentDate}
              holidayName={dashboard.holidayName}
              stockDatetime={dashboard.stockDatetime}
              resultVerificationStatus={dashboard.resultVerificationStatus}
              isResultLocked={dashboard.isResultLocked}
              isResultPreliminary={dashboard.isResultPreliminary}
              resultConfirmSecondsLeft={dashboard.resultConfirmSecondsLeft}
              isFinalOnlyMode={dashboard.isFinalOnlyMode}
              isHotMinute={dashboard.isHotMinute}
            />

            <Suspense fallback={null}>
              <ModernClock />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <TodayResults
              currentDayResults={dashboard.currentDayResults}
              currentDate={dashboard.currentDate}
              fallbackResults={dashboard.allResults}
              onOpenHistory={() => setShowHistory(true)}
              onOpen3D={() => setShow3D(true)}
            />
          </Suspense>
        </div>

        <div className="mt-4">
          <Suspense fallback={null}>
            <SessionPanel
              currentDayResults={dashboard.currentDayResults}
            />
          </Suspense>
        </div>
      </main>

      <LazyFooter ownerName={dashboard.ownerName} />

      <FullScreenOverlay
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="Previous Results (Last 7 Days)"
      >
        <Suspense fallback={null}>
          <HistoryTable />
        </Suspense>
      </FullScreenOverlay>

      <FullScreenOverlay
        open={show3D}
        onClose={() => setShow3D(false)}
        title="Latest 3D Results"
      >
        <Suspense fallback={null}>
          <ThreeDSection lastUpdated={dashboard.lastUpdated} />
        </Suspense>
      </FullScreenOverlay>
    </div>
    </PullToRefresh>
  );
};

export default Index;

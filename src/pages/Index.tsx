import { lazy, Suspense } from "react";
import { LazyFooter } from "@/components/dashboard/LazyFooter";

const Topbar = lazy(() => import("@/components/dashboard/Topbar").then(m => ({ default: m.Topbar })));
const LiveCard = lazy(() => import("@/components/dashboard/LiveCard").then(m => ({ default: m.LiveCard })));
const PullToRefresh = lazy(() => import("@/components/dashboard/PullToRefresh").then(m => ({ default: m.PullToRefresh })));
import { useLiveDashboard } from "@/hooks/use-live-dashboard";

const TodayResults = lazy(() => import("@/components/dashboard/TodayResults").then(m => ({ default: m.TodayResults })));

const Index = () => {
  const dashboard = useLiveDashboard();

  return (
    <Suspense fallback={null}>
    <PullToRefresh onRefresh={dashboard.refreshData}>
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden">
      {/* Warm gradient background matching reference theme */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-500"
        aria-hidden="true"
        style={{
          background: "linear-gradient(135deg, hsl(30 50% 97%) 0%, hsl(25 40% 95%) 40%, hsl(35 35% 93%) 100%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 dark:opacity-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 10%, hsl(24 80% 60% / 0.06), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 90%, hsl(30 60% 50% / 0.04), transparent 50%)",
        }}
      />

      <Topbar
        ownerName={dashboard.ownerName}
        resultDisplayMode={dashboard.resultDisplayMode}
        onToggleResultDisplayMode={dashboard.toggleResultDisplayMode}
      />

      <main
        className="mx-auto w-[min(100%-1rem,40rem)] pb-20"
        style={{ paddingTop: "max(calc(env(safe-area-inset-top, 0px) + 3rem), 3.5rem)" }}
      >
        <h1 className="sr-only">2D3D Myanmar Live Results Dashboard</h1>

        <div className="grid gap-4">
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
            <TodayResults
              currentDayResults={dashboard.currentDayResults}
              currentDate={dashboard.currentDate}
              fallbackResults={dashboard.allResults}
            />
          </Suspense>
        </div>
      </main>

      <LazyFooter ownerName={dashboard.ownerName} />
    </div>
    </PullToRefresh>
    </Suspense>
  );
};

export default Index;

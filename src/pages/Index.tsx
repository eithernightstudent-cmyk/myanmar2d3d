import { Topbar } from "@/components/dashboard/Topbar";
import { LiveCard } from "@/components/dashboard/LiveCard";
import { ModernClock } from "@/components/dashboard/ModernClock";
import { SessionPanel } from "@/components/dashboard/SessionPanel";
import { ThreeDSection } from "@/components/dashboard/ThreeDSection";
import { Footer } from "@/components/dashboard/Footer";
import { useLiveDashboard } from "@/hooks/use-live-dashboard";

const Index = () => {
  const dashboard = useLiveDashboard();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Topbar ownerName={dashboard.ownerName} />

      <main className="mx-auto w-[min(100%-2rem,72rem)] py-8">
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
              connectionStatus={dashboard.connectionStatus}
              currentDate={dashboard.currentDate}
              serverTime={dashboard.clock}
            />
            <ModernClock />
          </div>

          {/* Right Column */}
          <ThreeDSection lastUpdated={dashboard.lastUpdated} />
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

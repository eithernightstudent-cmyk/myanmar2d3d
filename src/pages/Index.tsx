import { Topbar } from "@/components/dashboard/Topbar";
import { LiveCard } from "@/components/dashboard/LiveCard";
import { ModernClock } from "@/components/dashboard/ModernClock";
import { SessionPanel } from "@/components/dashboard/SessionPanel";
import { ThreeDSection } from "@/components/dashboard/ThreeDSection";
import { AboutSection } from "@/components/dashboard/AboutSection";
import { Footer } from "@/components/dashboard/Footer";
import { useLiveDashboard } from "@/hooks/use-live-dashboard";

const Index = () => {
  const dashboard = useLiveDashboard();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Background scene */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 14% 12%, rgba(45, 212, 191, 0.25), transparent 38%), radial-gradient(circle at 88% 8%, rgba(251, 191, 36, 0.24), transparent 42%), radial-gradient(circle at 52% 100%, rgba(15, 118, 110, 0.18), transparent 45%), linear-gradient(145deg, hsl(var(--background)), hsl(35 100% 95%))",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-30 dark:opacity-10"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 118, 110, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 118, 110, 0.04) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

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
              isSyncing={dashboard.isSyncing}
              connectionStatus={dashboard.connectionStatus}
              currentDate={dashboard.currentDate}
              serverTime={dashboard.clock}
              lastSuccessTime={dashboard.lastSuccessTime}
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

        {/* About Section */}
        <AboutSection />
      </main>

      <Footer ownerName={dashboard.ownerName} />
    </div>
  );
};

export default Index;

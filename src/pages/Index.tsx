import { motion } from "framer-motion";
import { Topbar } from "@/components/dashboard/Topbar";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { LiveCard } from "@/components/dashboard/LiveCard";
import { SessionPanel } from "@/components/dashboard/SessionPanel";
import { Footer } from "@/components/dashboard/Footer";
import { TradingViewWidget } from "@/components/dashboard/TradingViewWidget";
import { useLiveDashboard } from "@/hooks/use-live-dashboard";

const Index = () => {
  const dashboard = useLiveDashboard();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Background gradients */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, hsl(214 95% 93% / 0.95), transparent 32%), radial-gradient(circle at 90% 12%, hsl(30 100% 92% / 0.95), transparent 38%), hsl(var(--background))",
        }}
      />

      <Topbar ownerName={dashboard.ownerName} />

      <main className="mx-auto w-[min(100%-2rem,72rem)] py-8">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-5">
            <HeroSection
              ownerName={dashboard.ownerName}
              isLive={dashboard.isLive}
              connectionStatus={dashboard.connectionStatus}
              onOwnerChange={dashboard.updateOwnerName}
            />
            <LiveCard
              clock={dashboard.clock}
              twod={dashboard.twod}
              setDigit={dashboard.setDigit}
              valueDigit={dashboard.valueDigit}
              setFormatted={dashboard.setFormatted}
              valueFormatted={dashboard.valueFormatted}
              lastUpdated={dashboard.lastUpdated}
              marketTimestamp={dashboard.marketTimestamp}
              flash={dashboard.flash}
              apiNote={dashboard.apiNote}
            />
          </div>

          <div className="grid gap-5">
            <SessionPanel
              connectionStatus={dashboard.connectionStatus}
              lastFetchTime={dashboard.lastFetchTime}
              nextCheck={dashboard.nextCheck}
            />
            <TradingViewWidget />
          </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="#"
            className="rounded-[calc(var(--radius)+2px)] border border-transparent bg-primary px-5 py-3.5 text-center font-display text-sm font-bold uppercase tracking-wider text-primary-foreground no-underline transition-all hover:-translate-y-px hover:opacity-90"
          >
            Download App
          </a>
          <a
            href="#"
            className="rounded-[calc(var(--radius)+2px)] border border-input bg-card px-5 py-3.5 text-center font-display text-sm font-bold uppercase tracking-wider text-secondary-foreground no-underline transition-all hover:-translate-y-px hover:bg-secondary hover:border-border"
          >
            Telegram Channel
          </a>
        </motion.section>
      </main>

      <Footer ownerName={dashboard.ownerName} />
    </div>
  );
};

export default Index;

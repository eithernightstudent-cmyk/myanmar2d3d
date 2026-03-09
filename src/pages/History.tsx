import { lazy, Suspense } from "react";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const logoImg = "/logo-24.webp";
const Footer = lazy(() => import("@/components/dashboard/Footer").then(m => ({ default: m.Footer })));

const History = () => {
  const ownerName = localStorage.getItem("kktech-live-owner-name") || "2D3D";

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-background">
      {/* Fixed header */}
      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-3 sm:px-5"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)" }}
      >
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-[hsl(var(--card-glass))] px-2.5 py-1.5 text-inherit no-underline shadow-lg backdrop-blur-xl transition-all active:scale-95"
        >
          <img
            src={logoImg}
            alt="2D3D logo"
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover ring-1 ring-primary/20"
          />
          <span className="font-display text-[0.78rem] font-extrabold tracking-wide text-foreground">
            2D3D
          </span>
        </Link>
      </header>

      <main
        className="mx-auto w-[min(100%-0.75rem,72rem)] pb-24 sm:w-[min(100%-2rem,72rem)]"
        style={{ paddingTop: "max(calc(env(safe-area-inset-top, 0px) + 3.5rem), 4rem)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-tight text-foreground">
            Change History
          </h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Intraday stock changes throughout the trading day
          </p>
        </motion.div>

        <HistoryTable />
      </main>

      <Suspense fallback={null}><Footer ownerName={ownerName} /></Suspense>
      <BottomNav />
    </div>
  );
};

export default History;

import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, BarChart3, Clock } from "lucide-react";
import { tapMedium } from "@/lib/haptic";

const TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/results", icon: BarChart3, label: "Results" },
  { to: "/history", icon: Clock, label: "History" },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.35rem)" }}
    >
      <div className="mx-3 flex w-[min(100%,20rem)] items-center justify-around rounded-2xl border border-border/40 bg-[hsl(var(--card-glass))] px-2 py-1.5 shadow-lg backdrop-blur-xl md:w-auto md:mx-0 md:gap-1 md:px-4">
        {TABS.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => tapMedium()}
              aria-label={label}
              title={label}
              className="relative grid h-10 w-12 place-items-center rounded-xl"
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 rounded-xl border border-primary/25 bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                key={`${to}-${active}`}
                initial={false}
                animate={active ? { scale: [0.85, 1.12, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`relative z-10 transition-colors duration-200 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              </motion.div>
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, BellRing, Sun, Moon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { tap } from "@/lib/haptic";
const logoImg = "/logo-icon.webp";

interface TopbarProps {
  ownerName: string;
  resultDisplayMode?: "hybrid" | "final-only";
  onToggleResultDisplayMode?: () => void;
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("kktech-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function Topbar({ ownerName, resultDisplayMode, onToggleResultDisplayMode }: TopbarProps) {
  const BRAND_NAME = "2D3D";
  const { supported, permission, enabled, toggleNotifications } = useNotifications();
  const [justEnabled, setJustEnabled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  // Apply theme on mount & change
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("kktech-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    tap();
    const next = theme === "light" ? "dark" : "light";

    // Use View Transition API if available
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(next);
      });
    } else {
      setTheme(next);
    }
  }, [theme]);

  useEffect(() => {
    if (enabled) {
      setJustEnabled(true);
      const t = setTimeout(() => setJustEnabled(false), 1500);
      return () => clearTimeout(t);
    }
  }, [enabled]);

  const BellIcon = !supported || permission === "denied"
    ? BellOff
    : enabled
      ? (justEnabled ? BellRing : Bell)
      : Bell;

  const iconBtn = "grid h-8 w-8 place-items-center rounded-xl border transition-all duration-300";
  const iconBtnDefault = `${iconBtn} border-border/40 bg-[hsl(var(--card-glass))] text-muted-foreground hover:text-foreground hover:border-primary/30`;

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between px-3 sm:px-5"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)" }}
    >
      {/* Brand chip — top left */}
      <Link
        to="/"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-[hsl(var(--card-glass))] px-2.5 py-1.5 text-inherit no-underline shadow-lg backdrop-blur-xl transition-all active:scale-95"
      >
        <img
          src={logoImg}
          alt={`${BRAND_NAME} logo`}
          width={24}
          height={24}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-6 w-6 rounded-full object-cover ring-1 ring-primary/20"
        />
        <span className="font-display text-[0.78rem] font-extrabold tracking-wide text-foreground">
          {BRAND_NAME}
        </span>
      </Link>

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className={`pointer-events-auto ${iconBtnDefault} shadow-lg backdrop-blur-xl`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </header>
  );
}
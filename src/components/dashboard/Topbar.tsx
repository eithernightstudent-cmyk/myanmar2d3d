import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, BellRing, Volume2, VolumeX, Zap, Lock, Sun, Moon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { tapMedium, tap, isClickSoundEnabled, setClickSoundEnabled } from "@/lib/haptic";
const logoImg = "/logo-icon.webp";

interface TopbarProps {
  ownerName: string;
  resultDisplayMode?: "hybrid" | "final-only";
  onToggleResultDisplayMode?: () => void;
}

export function Topbar({ ownerName, resultDisplayMode, onToggleResultDisplayMode }: TopbarProps) {
  const BRAND_NAME = "2D3D";

  const { supported, permission, enabled, toggleNotifications } = useNotifications();
  const [justEnabled, setJustEnabled] = useState(false);
  const [soundOn, setSoundOn] = useState(isClickSoundEnabled);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("kktech-theme");
    return saved === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("kktech-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    const toggle = () => setIsDark(prev => !prev);
    if (document.startViewTransition) {
      document.startViewTransition(toggle);
    } else {
      toggle();
    }
    tap();
  }, []);

  useEffect(() => {
    if (enabled) {
      setJustEnabled(true);
      const t = setTimeout(() => setJustEnabled(false), 1500);
      return () => clearTimeout(t);
    }
  }, [enabled]);

  const bellLabel = !supported
    ? "Notifications not supported"
    : permission === "denied"
      ? "Notifications blocked by browser"
      : enabled
        ? "Notifications on — click to turn off"
        : "Get notifications for 2D results";

  const BellIcon = !supported || permission === "denied"
    ? BellOff
    : enabled
      ? (justEnabled ? BellRing : Bell)
      : Bell;

  const iconBtn = "grid h-8 w-8 place-items-center rounded-xl border transition-all duration-300";
  const iconBtnDefault = `${iconBtn} border-border/40 bg-[hsl(var(--card-glass))] text-muted-foreground hover:text-foreground hover:border-primary/30`;
  const iconBtnActive = `${iconBtn} border-primary/40 bg-primary/15 text-primary`;

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
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="pointer-events-auto grid h-8 w-8 place-items-center rounded-xl border border-border/40 bg-[hsl(var(--card-glass))] text-muted-foreground shadow-lg backdrop-blur-xl transition-all duration-300 hover:text-foreground hover:border-primary/30 active:scale-90"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Sun className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Moon className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </header>
  );
}

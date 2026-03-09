import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Bell, BellOff, BellRing, Volume2, VolumeX, Zap, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { tapMedium, tap, isClickSoundEnabled, setClickSoundEnabled } from "@/lib/haptic";
import logoImg from "@/assets/logo-tiny.webp";

interface TopbarProps {
  ownerName: string;
  resultDisplayMode?: "hybrid" | "final-only";
  onToggleResultDisplayMode?: () => void;
}

export function Topbar({ ownerName, resultDisplayMode, onToggleResultDisplayMode }: TopbarProps) {
  const BRAND_NAME = "2D3D";

  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("kktech-theme");
    return saved === "dark";
  });

  const { supported, permission, enabled, toggleNotifications } = useNotifications();
  const [justEnabled, setJustEnabled] = useState(false);
  const [soundOn, setSoundOn] = useState(isClickSoundEnabled);

  const toggleTheme = () => {
    const next = !dark;
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("kktech-theme", next ? "dark" : "light");
      });
    } else {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("kktech-theme", next ? "dark" : "light");
    }
    setDark(next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kktech-theme", dark ? "dark" : "light");
  }, [dark]);

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

  const iconBtn = (active: boolean) =>
    `relative grid h-8 w-8 place-items-center rounded-xl border transition-all duration-300 ${
      active
        ? "border-primary/40 bg-primary/12 text-primary"
        : "border-border/60 bg-[hsl(var(--card-glass))] text-muted-foreground hover:text-foreground hover:border-primary/30"
    }`;

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-30"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex w-[min(100%-1rem,72rem)] items-start justify-between pt-3 sm:pt-4">
        {/* Brand chip — top left */}
        <Link
          to="/"
          aria-label={`${BRAND_NAME} home`}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-border/50 bg-[hsl(var(--card-glass))] px-2.5 py-1.5 text-inherit no-underline shadow-sm backdrop-blur-xl transition-all duration-300 active:scale-95"
        >
          <motion.img
            src={logoImg}
            alt={`${BRAND_NAME} logo`}
            width={24}
            height={24}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-6 w-6 rounded-full object-cover ring-1 ring-primary/20"
          />
          <span className="font-display text-[0.78rem] font-extrabold tracking-[0.03em] text-foreground">
            {BRAND_NAME}
          </span>
        </Link>

        {/* Floating icon dock — top right */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/50 bg-[hsl(var(--card-glass))] px-1.5 py-1.5 shadow-sm backdrop-blur-xl">
          {/* Result Display Mode */}
          {onToggleResultDisplayMode && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => { tap(); onToggleResultDisplayMode(); }}
              aria-label={resultDisplayMode === "final-only" ? "Switch to fast live mode" : "Switch to final-only mode"}
              title={resultDisplayMode === "final-only" ? "Final-only (tap for Fast)" : "Fast (tap for Final-only)"}
              className={`grid h-8 w-8 place-items-center rounded-xl border transition-all duration-300 ${
                resultDisplayMode === "final-only"
                  ? "border-success/35 bg-success/12 text-success"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              {resultDisplayMode === "final-only" ? <Lock size={14} strokeWidth={2.2} /> : <Zap size={14} strokeWidth={2.2} />}
            </motion.button>
          )}

          {/* Notification Bell */}
          {supported && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => { tapMedium(); toggleNotifications(); }}
              aria-label={bellLabel}
              title={bellLabel}
              className={`${iconBtn(enabled)} ${permission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={permission === "denied"}
            >
              <motion.span
                key={enabled ? "bell-on" : "bell-off"}
                initial={{ scale: 0.7, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <BellIcon size={14} strokeWidth={2.2} />
              </motion.span>
              {enabled && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-[hsl(var(--card-glass))] bg-primary animate-pulse" />
              )}
            </motion.button>
          )}

          {/* Sound Toggle */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { const next = !soundOn; setClickSoundEnabled(next); setSoundOn(next); tap(); }}
            aria-label={soundOn ? "Turn off click sound" : "Turn on click sound"}
            title={soundOn ? "Sound: ON" : "Sound: OFF"}
            className={iconBtn(soundOn)}
          >
            <motion.span
              key={soundOn ? "on" : "off"}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {soundOn ? <Volume2 size={14} strokeWidth={2.2} /> : <VolumeX size={14} strokeWidth={2.2} />}
            </motion.span>
          </motion.button>

          {/* Dark Mode Toggle */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { tap(); toggleTheme(); }}
            aria-label="Toggle dark mode"
            className={iconBtn(false)}
          >
            <AnimatePresence mode="wait" initial={false}>
              {dark ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute text-amber-500"
                >
                  <Sun size={14} strokeWidth={2.2} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute text-indigo-400"
                >
                  <Moon size={14} strokeWidth={2.2} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

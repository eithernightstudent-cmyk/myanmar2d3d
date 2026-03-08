import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Bell, BellOff, BellRing, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { tapMedium, tap, isClickSoundEnabled, setClickSoundEnabled } from "@/lib/haptic";

interface TopbarProps {
  ownerName: string;
}

export function Topbar({ ownerName }: TopbarProps) {
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

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-1.5">
      {/* Notification Bell */}
      {supported && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { tapMedium(); toggleNotifications(); }}
          aria-label={bellLabel}
          title={bellLabel}
          className={`relative grid h-9 w-9 place-items-center rounded-xl border backdrop-blur-lg transition-all duration-300 ${
            enabled
              ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
              : "border-border/50 bg-[hsl(var(--card-glass))] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
          } ${permission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={permission === "denied"}
        >
          <motion.span
            key={enabled ? "bell-on" : "bell-off"}
            initial={{ scale: 0.7, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.3, type: "spring" }}
          >
            <BellIcon size={16} strokeWidth={2.2} />
          </motion.span>
          {enabled && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--card-glass))] bg-primary animate-pulse" />
          )}
        </motion.button>
      )}

      {/* Sound Toggle */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          const next = !soundOn;
          setClickSoundEnabled(next);
          setSoundOn(next);
          tap();
        }}
        aria-label={soundOn ? "Turn off click sound" : "Turn on click sound"}
        title={soundOn ? "Click sound: ON" : "Click sound: OFF"}
        className={`relative grid h-9 w-9 place-items-center rounded-xl border backdrop-blur-lg transition-all duration-300 ${
          soundOn
            ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 text-primary"
            : "border-border/50 bg-[hsl(var(--card-glass))] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
        }`}
      >
        <motion.span
          key={soundOn ? "on" : "off"}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {soundOn ? <Volume2 size={16} strokeWidth={2.2} /> : <VolumeX size={16} strokeWidth={2.2} />}
        </motion.span>
      </motion.button>

      {/* Dark Mode Toggle */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { tap(); toggleTheme(); }}
        aria-label="Toggle dark mode"
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-[hsl(var(--card-glass))] text-muted-foreground backdrop-blur-lg transition-all duration-300 hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
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
              <Sun size={16} strokeWidth={2.2} />
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
              <Moon size={16} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

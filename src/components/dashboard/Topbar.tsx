import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Bell, BellOff, BellRing, Volume2, VolumeX, Zap, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { tapMedium, tap, isClickSoundEnabled, setClickSoundEnabled } from "@/lib/haptic";
import logoImg from "@/assets/logo.png";

interface TopbarProps {
  ownerName: string;
  resultDisplayMode?: "hybrid" | "final-only";
  onToggleResultDisplayMode?: () => void;
}

export function Topbar({ ownerName, resultDisplayMode, onToggleResultDisplayMode }: TopbarProps) {
  const BRAND_NAME = "2D3D";
  const BRAND_TAGLINE = "Myanmar Live Results";
  const showOwnerAlias = ownerName.trim().length > 0 && ownerName.trim() !== BRAND_NAME;

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

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[hsl(var(--card-glass))] backdrop-blur-lg transition-colors duration-300">
      <div className="mx-auto flex min-h-[52px] w-[min(100%-1.25rem,72rem)] items-center justify-between gap-3 sm:min-h-[56px] sm:w-[min(100%-2rem,72rem)] sm:gap-4">
        <Link
          to="/"
          aria-label={`${BRAND_NAME} home`}
          className="inline-flex items-center gap-2.5 text-inherit no-underline"
        >
          <motion.img
            src={logoImg}
            alt={`${BRAND_NAME} logo`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-[0.95rem] font-extrabold tracking-[0.03em] text-foreground transition-colors duration-300">
              {BRAND_NAME}
            </span>
            <span className="mt-1 font-display text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {BRAND_TAGLINE}
            </span>
          </div>
          {showOwnerAlias && (
            <span className="hidden rounded-full border border-border bg-[hsl(var(--card-strong))] px-2 py-1 font-display text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground md:inline-flex">
              {ownerName.trim()}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "Home", to: "/" },
            { label: "Results", to: "/results" },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => tap()}
              className="rounded-full border border-transparent px-3 py-1.5 font-body text-sm font-semibold text-muted-foreground no-underline transition-all duration-200 hover:border-border hover:bg-primary/5 hover:text-primary active:scale-95"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {/* Result Display Mode */}
          {onToggleResultDisplayMode && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                tap();
                onToggleResultDisplayMode();
              }}
              aria-label={resultDisplayMode === "final-only" ? "Switch to fast live mode" : "Switch to final-only mode"}
              title={resultDisplayMode === "final-only" ? "Final-only mode (tap to switch Fast)" : "Fast live mode (tap to switch Final-only)"}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 font-display text-[0.62rem] font-bold uppercase tracking-wider transition-all duration-300 ${
                resultDisplayMode === "final-only"
                  ? "border-success/35 bg-success/10 text-success"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              {resultDisplayMode === "final-only" ? <Lock size={13} strokeWidth={2.2} /> : <Zap size={13} strokeWidth={2.2} />}
              <span>{resultDisplayMode === "final-only" ? "Final" : "Fast"}</span>
            </motion.button>
          )}

          {/* Notification Bell */}
          {supported && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { tapMedium(); toggleNotifications(); }}
              aria-label={bellLabel}
              title={bellLabel}
              className={`relative grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 ${
                enabled
                  ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
                  : "border-border bg-[hsl(var(--card-strong))] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
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
            className={`relative grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300 ${
              soundOn
                ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 text-primary"
                : "border-border bg-[hsl(var(--card-strong))] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
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
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-[hsl(var(--card-strong))] text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
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
      </div>
    </header>
  );
}

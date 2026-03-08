import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Bell, BellOff, BellRing, Volume2, VolumeX, Home, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { tapMedium, tap, isClickSoundEnabled, setClickSoundEnabled } from "@/lib/haptic";
import logoImg from "@/assets/logo.png";

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
  const location = useLocation();

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

  const iconBtnBase = "relative grid h-9 w-9 place-items-center rounded-xl border backdrop-blur-lg transition-all duration-300";
  const iconBtnInactive = "border-border/30 bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5";

  return (
    <>
      {/* Top floating header — Logo left, Controls right */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="mx-auto flex w-[min(100%-1.25rem,72rem)] items-center justify-between py-4 sm:w-[min(100%-2rem,72rem)]">
          {/* Logo + Brand */}
          <Link to="/" className="pointer-events-auto inline-flex items-center gap-2.5 no-underline group">
            <motion.img
              src={logoImg}
              alt="2D3D Live - Myanmar 2D Live Result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 shadow-[0_4px_20px_hsl(var(--primary)/0.25)] transition-shadow duration-300 group-hover:shadow-[0_4px_28px_hsl(var(--primary)/0.4)]"
            />
            <span
              className="font-display text-lg font-extrabold tracking-wide text-foreground drop-shadow-sm transition-colors duration-300 dark:text-primary"
              style={{ letterSpacing: "0.04em" }}
            >
              2D3D
            </span>
          </Link>

          {/* Floating Controls */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {/* Notification Bell */}
            {supported && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { tapMedium(); toggleNotifications(); }}
                aria-label={bellLabel}
                title={bellLabel}
                className={`${iconBtnBase} ${
                  enabled
                    ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
                    : iconBtnInactive
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
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary animate-pulse" />
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
              className={`${iconBtnBase} ${
                soundOn
                  ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 text-primary"
                  : iconBtnInactive
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
              className={`${iconBtnBase} ${iconBtnInactive}`}
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
      </div>

      {/* Bottom floating navigation */}
      <nav className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
          className="flex items-center gap-1 rounded-2xl border border-border/40 bg-background/80 px-2 py-1.5 shadow-[0_8px_32px_hsl(0_0%_0%/0.12)] backdrop-blur-xl dark:shadow-[0_8px_32px_hsl(0_0%_0%/0.3)]"
        >
          {[
            { label: "Home", to: "/", Icon: Home },
            { label: "Results", to: "/results", Icon: BarChart3 },
          ].map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => tap()}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-display text-xs font-semibold no-underline transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <link.Icon size={14} strokeWidth={2.2} />
                {link.label}
              </Link>
            );
          })}
        </motion.div>
      </nav>
    </>
  );
}

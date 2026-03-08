import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Bell, BellOff, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { hapticMedium, hapticLight } from "@/lib/haptic";
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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kktech-theme", dark ? "dark" : "light");
  }, [dark]);

  // Brief animation when notifications are enabled
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
      <div className="mx-auto flex min-h-[56px] w-[min(100%-2rem,72rem)] items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2.5 text-inherit no-underline">
          <motion.img
            src={logoImg}
            alt="2D Logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="font-display text-sm font-bold tracking-wide transition-colors duration-300">{ownerName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "Home", to: "/" },
            { label: "Results", to: "/results" },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-full border border-transparent px-3 py-1.5 font-body text-sm font-semibold text-muted-foreground no-underline transition-all duration-200 hover:border-border hover:bg-primary/5 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          {supported && (
            <button
              onClick={() => { hapticMedium(); toggleNotifications(); }}
              aria-label={bellLabel}
              title={bellLabel}
              className={`relative grid h-9 w-9 place-items-center rounded-full border transition-all duration-300 ${
                enabled
                  ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                  : "border-border bg-[hsl(var(--card-strong))] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
              } ${permission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={permission === "denied"}
            >
              <motion.span
                key={enabled ? "bell-on" : "bell-off"}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <BellIcon size={15} />
              </motion.span>
              {enabled && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--card-glass))] bg-primary" />
              )}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => { hapticLight(); setDark((d) => !d); }}
            aria-label="Toggle dark mode"
            className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-[hsl(var(--card-strong))] text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-primary/40 hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {dark ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute"
                >
                  <Sun size={15} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute"
                >
                  <Moon size={15} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  );
}

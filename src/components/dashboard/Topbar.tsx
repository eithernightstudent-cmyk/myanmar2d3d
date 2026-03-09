import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, BellRing, Volume2, VolumeX, Zap, Lock } from "lucide-react";
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


  const { supported, permission, enabled, toggleNotifications } = useNotifications();
  const [justEnabled, setJustEnabled] = useState(false);
  const [soundOn, setSoundOn] = useState(isClickSoundEnabled);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("kktech-theme", "dark");
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
        aria-label={`${BRAND_NAME} home`}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-border/40 bg-[hsl(var(--card-glass))] px-2.5 py-1.5 text-inherit no-underline shadow-lg backdrop-blur-xl transition-all active:scale-95"
      >
        <motion.img
          src={logoImg}
          alt={`${BRAND_NAME} logo`}
          width={24}
          height={24}
          loading="eager"
          decoding="async"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-6 w-6 rounded-full object-cover ring-1 ring-primary/20"
        />
        <span className="font-display text-[0.78rem] font-extrabold tracking-wide text-foreground">
          {BRAND_NAME}
        </span>
      </Link>

      {/* Icon dock — top right */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/40 bg-[hsl(var(--card-glass))] px-1.5 py-1.5 shadow-lg backdrop-blur-xl">
        {/* Result Display Mode */}
        {onToggleResultDisplayMode && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { tap(); onToggleResultDisplayMode(); }}
            aria-label={resultDisplayMode === "final-only" ? "Switch to fast live mode" : "Switch to final-only mode"}
            title={resultDisplayMode === "final-only" ? "Final-only mode" : "Fast live mode"}
            className={resultDisplayMode === "final-only"
              ? `${iconBtn} border-success/35 bg-success/10 text-success`
              : `${iconBtn} gold-metal-button`
            }
          >
            {resultDisplayMode === "final-only" ? <Lock size={14} strokeWidth={2.2} /> : <Zap size={14} strokeWidth={2.2} />}
          </motion.button>
        )}

        {/* Notification Bell */}
        {supported && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { tapMedium(); toggleNotifications(); }}
            aria-label={bellLabel}
            title={bellLabel}
            className={`${enabled ? iconBtnActive : iconBtnDefault} ${permission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={permission === "denied"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={enabled ? "bell-on" : "bell-off"}
                initial={{ scale: 0.7, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0, rotate: 15 }}
                transition={{ duration: 0.25, type: "spring" }}
              >
                <BellIcon size={14} strokeWidth={2.2} />
              </motion.span>
            </AnimatePresence>
            {enabled && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-[hsl(var(--card-glass))] bg-primary animate-pulse" />
            )}
          </motion.button>
        )}

        {/* Sound Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            const next = !soundOn;
            setClickSoundEnabled(next);
            setSoundOn(next);
            tap();
          }}
          aria-label={soundOn ? "Turn off click sound" : "Turn on click sound"}
          title={soundOn ? "Sound: ON" : "Sound: OFF"}
          className={soundOn ? iconBtnActive : iconBtnDefault}
        >
          {soundOn ? <Volume2 size={14} strokeWidth={2.2} /> : <VolumeX size={14} strokeWidth={2.2} />}
        </motion.button>

      </div>
    </header>
  );
}

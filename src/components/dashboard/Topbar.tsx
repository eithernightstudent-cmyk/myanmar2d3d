import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, BellRing, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("kktech-theme", "light");
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

  const iconBtn = "pointer-events-auto grid h-9 w-9 place-items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-sm active:scale-90";
  const iconBtnDefault = `${iconBtn} border-border/30 bg-[hsl(var(--card-glass))] text-muted-foreground hover:text-foreground hover:border-primary/30`;
  const iconBtnActive = `${iconBtn} border-primary/30 bg-primary/10 text-primary`;

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-3 sm:px-5"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)" }}
    >
      {/* Brand chip — top left */}
      <Link
        to="/"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-border/30 bg-[hsl(var(--card-glass))] px-2.5 py-1.5 text-inherit no-underline shadow-sm backdrop-blur-xl transition-all active:scale-95"
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

      {/* Action icons — top right */}
      <div className="flex items-center gap-2">
        {/* Sound toggle */}
        <button
          className={soundOn ? iconBtnActive : iconBtnDefault}
          aria-label={soundOn ? "Sound on — click to mute" : "Sound off — click to unmute"}
          onClick={() => {
            tap();
            const next = !soundOn;
            setSoundOn(next);
            setClickSoundEnabled(next);
          }}
        >
          {soundOn ? <Volume2 size={16} strokeWidth={2} /> : <VolumeX size={16} strokeWidth={2} />}
        </button>

        {/* Notification toggle */}
        <button
          className={enabled ? iconBtnActive : iconBtnDefault}
          aria-label={bellLabel}
          onClick={() => {
            tapMedium();
            toggleNotifications();
          }}
          disabled={!supported || permission === "denied"}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`bell-${enabled}-${justEnabled}`}
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              <BellIcon size={16} strokeWidth={2} />
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}

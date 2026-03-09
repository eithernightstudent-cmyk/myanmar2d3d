import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, BellRing, Volume2, VolumeX, Zap, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { tapMedium, tap, isClickSoundEnabled, setClickSoundEnabled } from "@/lib/haptic";
const logoImg = "/logo-24.webp";

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

    </header>
  );
}

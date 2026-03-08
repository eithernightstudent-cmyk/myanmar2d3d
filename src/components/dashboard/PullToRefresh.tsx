import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";
import { tapMedium } from "@/lib/haptic";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const THRESHOLD = 80;
const MAX_PULL = 130;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullY = useMotionValue(0);

  const indicatorOpacity = useTransform(pullY, [0, THRESHOLD * 0.5, THRESHOLD], [0, 0.5, 1]);
  const indicatorScale = useTransform(pullY, [0, THRESHOLD], [0.6, 1]);
  const indicatorRotate = useTransform(pullY, [0, MAX_PULL], [0, 360]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || isRefreshing) return;
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    const dampened = Math.min(MAX_PULL, dy * 0.45);
    pullY.set(dampened);

    if (dampened > 10) {
      e.preventDefault();
    }
  }, [isRefreshing, pullY]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || isRefreshing) return;
    pulling.current = false;

    if (pullY.get() >= THRESHOLD) {
      tapMedium();
      setIsRefreshing(true);
      pullY.set(60);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        pullY.set(0);
      }
    } else {
      pullY.set(0);
    }
  }, [isRefreshing, onRefresh, pullY]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-center justify-center"
        style={{ height: pullY, opacity: indicatorOpacity }}
      >
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg"
          style={{ scale: indicatorScale }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <motion.svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="text-primary"
              style={{ rotate: indicatorRotate }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              <polyline points="21 3 21 12 12 12" />
            </motion.svg>
          )}
        </motion.div>
      </motion.div>

      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
}

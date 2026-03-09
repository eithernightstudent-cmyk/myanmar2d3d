import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface RollingNumberProps {
  value: string;
  placeholder?: string;
  className?: string;
  digitClassName?: string;
  digitStyle?: CSSProperties;
}

/**
 * Smooth rolling animation for short numeric strings (e.g. 2D result).
 * It animates each character only when the rendered value actually changes.
 */
export const RollingNumber = forwardRef<HTMLSpanElement, RollingNumberProps>(function RollingNumber({
  value,
  placeholder = "--",
  className,
  digitClassName,
  digitStyle,
}, ref) {
  const safeValue = useMemo(() => {
    const text = String(value ?? "").trim();
    return text.length > 0 ? text : placeholder;
  }, [value, placeholder]);

  const [displayValue, setDisplayValue] = useState(safeValue);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (safeValue === displayValue) return;
    setDisplayValue(safeValue);
    setTick((prev) => prev + 1);
  }, [safeValue, displayValue]);

  return (
    <span className={cn("inline-flex tabular-nums", className)} aria-label={displayValue}>
      {displayValue.split("").map((char, idx) => (
        <span
          key={`digit-track-${idx}`}
          className="relative inline-flex h-[1em] w-[0.62em] items-center justify-center overflow-hidden align-middle"
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={`digit-${idx}-${char}-${tick}`}
              initial={{ y: "115%", opacity: 0.2, filter: "blur(1.5px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              exit={{ y: "-115%", opacity: 0.2, filter: "blur(1.5px)" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute inset-0 inline-flex items-center justify-center tabular-nums",
                digitClassName,
              )}
              style={digitStyle}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
});

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { tap } from "@/lib/haptic";

interface FullScreenOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function FullScreenOverlay({ open, onClose, title, children }: FullScreenOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-xl px-4 py-3 sm:px-6">
            <h2 className="font-display text-base font-bold" style={{ color: "hsl(var(--text-strong))" }}>
              {title}
            </h2>
            <motion.button
              whileHover={{ scale: 1.02, filter: "brightness(1.08)" }}
              whileTap={{ scale: 0.97, filter: "brightness(0.94)" }}
              onClick={() => { tap(); onClose(); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-[hsl(var(--card-strong))] text-muted-foreground transition-all hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
            >
              <X className="h-4.5 w-4.5" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
          >
            <div className="mx-auto w-full max-w-3xl">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

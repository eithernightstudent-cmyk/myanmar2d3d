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
            <button
              onClick={() => { tap(); onClose(); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/50 text-foreground transition-all active:scale-90 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
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

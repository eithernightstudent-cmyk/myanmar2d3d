import { motion } from "framer-motion";
import { CalendarDays, Dice3 } from "lucide-react";
import { tap } from "@/lib/haptic";

interface DashboardNavButtonsProps {
  onOpenHistory: () => void;
  onOpen3D: () => void;
}

export function DashboardNavButtons({ onOpenHistory, onOpen3D }: DashboardNavButtonsProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3"
    >
      {/* 2D History Button */}
      <button
        onClick={() => { tap(); onOpenHistory(); }}
        className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg transition-all duration-200 active:scale-[0.96] hover:border-primary/40 hover:shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <motion.div
          whileHover={{ scale: 1.12, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg transition-shadow duration-200 group-hover:shadow-xl group-hover:shadow-amber-500/20"
        >
          <CalendarDays className="h-6 w-6 drop-shadow-sm" strokeWidth={2.2} />
        </motion.div>

        <div className="relative text-center">
          <p className="font-display text-sm font-bold" style={{ color: "hsl(var(--text-strong))" }}>
            Previous Results
          </p>
          <p className="font-display text-[0.6rem] font-medium text-muted-foreground mt-0.5">
            Last 7 Days
          </p>
        </div>
      </button>

      {/* 3D Results Button */}
      <button
        onClick={() => { tap(); onOpen3D(); }}
        className="group relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-[hsl(var(--card-glass))] p-5 shadow-[var(--shadow-panel)] backdrop-blur-lg transition-all duration-200 active:scale-[0.96] hover:border-primary/40 hover:shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <motion.div
          whileHover={{ scale: 1.12, rotate: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg transition-shadow duration-200 group-hover:shadow-xl group-hover:shadow-emerald-500/20"
        >
          <Dice3 className="h-6 w-6 drop-shadow-sm" strokeWidth={2.2} />
        </motion.div>

        <div className="relative text-center">
          <p className="font-display text-sm font-bold" style={{ color: "hsl(var(--text-strong))" }}>
            3D Results
          </p>
          <p className="font-display text-[0.6rem] font-medium text-muted-foreground mt-0.5">
            Latest 3-Digit
          </p>
        </div>
      </button>
    </motion.div>
  );
}

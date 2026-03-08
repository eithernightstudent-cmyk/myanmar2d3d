import { motion } from "framer-motion";
import { StatusPill } from "./StatusPill";

interface HeroSectionProps {
  ownerName: string;
  isLive: boolean;
  connectionStatus: string;
  onOwnerChange: (value: string) => void;
}

export function HeroSection({ ownerName, isLive, connectionStatus, onOwnerChange }: HeroSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03, duration: 0.5 }}
      className="rounded-3xl border border-border bg-card/90 p-6 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusPill isLive={isLive} connectionStatus={connectionStatus} />
        <label className="inline-flex items-center gap-2 font-display text-[0.72rem] font-semibold uppercase tracking-widest text-muted-foreground max-[760px]:w-full max-[760px]:justify-between">
          Name
          <input
            type="text"
            maxLength={24}
            placeholder="2D3D"
            defaultValue={ownerName}
            onChange={(e) => onOwnerChange(e.target.value)}
            className="w-36 rounded-md border border-input bg-card px-2 py-1.5 font-display text-[0.72rem] font-semibold normal-case tracking-normal text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
          />
        </label>
      </div>

      <h1 className="mt-4 font-display text-[clamp(2rem,5vw,2.8rem)] font-bold leading-tight tracking-tight text-foreground">
        {ownerName} Live 2D Dashboard
      </h1>
      <p className="mt-3 max-w-[56ch] leading-relaxed text-muted-foreground">
        Real-time SET Index monitor from set.or.th with live 2D result calculation.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {["2D Live", "SET + Turnover", "Asia/Bangkok"].map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 font-display text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {chip}
          </span>
        ))}
      </div>
    </motion.section>
  );
}

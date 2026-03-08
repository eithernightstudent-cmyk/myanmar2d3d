import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

interface TopbarProps {
  ownerName: string;
}

export function Topbar({ ownerName }: TopbarProps) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("kktech-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kktech-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-[64px] w-[min(100%-2rem,72rem)] items-center justify-between gap-4">
        <a href="#" className="inline-flex items-center gap-2.5 text-inherit no-underline">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid h-[34px] w-[34px] place-items-center rounded-xl bg-primary font-display text-xs font-bold text-primary-foreground shadow-[0_6px_14px_-8px_hsl(var(--primary))]"
          >
            2D
          </motion.span>
          <span className="font-display text-base font-bold tracking-wide">{ownerName}</span>
        </a>

        <nav className="hidden items-center gap-5 md:flex">
          {["Home", "Results", "History"].map((link) => (
            <a
              key={link}
              href="#"
              className="rounded-lg px-1.5 py-0.5 font-body text-sm text-muted-foreground no-underline transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            className="grid h-9 w-9 place-items-center rounded-lg border border-input bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a
            href="#"
            className="rounded-[calc(var(--radius)+2px)] border border-transparent bg-primary px-3.5 py-2 font-display text-xs font-bold text-primary-foreground no-underline transition-all hover:-translate-y-px hover:opacity-90"
          >
            Download
          </a>
        </div>
      </div>
    </header>
  );
}

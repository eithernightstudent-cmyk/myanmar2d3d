import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface TopbarProps {
  ownerName: string;
}

export function Topbar({ ownerName }: TopbarProps) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("kktech-theme");
    return saved === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kktech-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[hsl(var(--card-glass))] backdrop-blur-lg">
      <div className="mx-auto flex min-h-[56px] w-[min(100%-2rem,72rem)] items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2.5 text-inherit no-underline">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid h-8 w-8 place-items-center rounded-xl bg-primary font-display text-xs font-bold text-primary-foreground"
          >
            2D
          </motion.span>
          <span className="font-display text-sm font-bold tracking-wide">{ownerName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "Home", to: "/" },
            { label: "Results", to: "/results" },
            { label: "History", to: "/history" },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-full border border-transparent px-3 py-1.5 font-body text-sm font-semibold text-muted-foreground no-underline transition-all hover:border-border hover:bg-primary/5 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-[hsl(var(--card-strong))] text-muted-foreground transition-colors hover:text-foreground"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}

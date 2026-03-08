import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface TopbarProps {
  ownerName: string;
}

export function Topbar({ ownerName }: TopbarProps) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("kktech-theme");
    return saved ? saved === "dark" : true; // Default to dark
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kktech-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-[56px] w-[min(100%-2rem,72rem)] items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2.5 text-inherit no-underline">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground"
          >
            2D
          </motion.span>
          <span className="font-display text-sm font-bold tracking-wide">{ownerName}</span>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          {[
            { label: "Home", to: "/" },
            { label: "Results", to: "/results" },
            { label: "History", to: "/history" },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-lg px-2 py-1 font-body text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
          className="grid h-8 w-8 place-items-center rounded-lg border border-input bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}

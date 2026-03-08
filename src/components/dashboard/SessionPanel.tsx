import { motion } from "framer-motion";

interface SessionPanelProps {
  connectionStatus: string;
  lastFetchTime: string;
  nextCheck: string;
}

export function SessionPanel({ connectionStatus, lastFetchTime, nextCheck }: SessionPanelProps) {
  const items = [
    { label: "Connection Status:", value: connectionStatus },
    { label: "Last Updated:", value: lastFetchTime },
    { label: "Next Refresh:", value: nextCheck },
    { label: "Rule:", value: "Fetch every 30s during 09:30-16:30 (Thailand Time)." },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.5 }}
    >
      <article className="rounded-3xl border border-border bg-card/90 p-5 shadow-[0_20px_24px_-18px_hsl(var(--foreground)/0.15)] backdrop-blur-md">
        <h3 className="font-display text-base font-bold tracking-wide text-foreground">
          Live Session Monitor
        </h3>
        <ul className="mt-3 grid list-none gap-2.5 p-0">
          {items.map((item, i) => (
            <li
              key={i}
              className="rounded-md border border-border bg-secondary p-3 font-display text-[0.78rem] font-medium leading-snug text-muted-foreground"
            >
              <strong className="text-foreground">{item.label}</strong>{" "}
              {item.value}
            </li>
          ))}
        </ul>
      </article>
    </motion.aside>
  );
}

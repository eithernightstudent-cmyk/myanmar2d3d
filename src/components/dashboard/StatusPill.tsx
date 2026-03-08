interface StatusPillProps {
  isLive: boolean;
  connectionStatus: string;
}

export function StatusPill({ isLive, connectionStatus }: StatusPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[0.65rem] font-bold uppercase tracking-wider ${
        isLive
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-[hsl(var(--warm))]/30 bg-[hsl(var(--warm-soft))] text-[hsl(var(--warm))]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isLive ? "bg-primary" : "bg-[hsl(var(--warm))]"
        }`}
        style={{
          animation: isLive ? "pulse-dot 1.6s infinite" : "pulse-dot-fail 1.6s infinite",
        }}
      />
      <span>{connectionStatus}</span>
    </div>
  );
}

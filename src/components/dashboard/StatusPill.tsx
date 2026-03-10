interface StatusPillProps {
  isLive: boolean;
  connectionStatus: string;
}

export function StatusPill({ isLive, connectionStatus }: StatusPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[0.65rem] font-bold uppercase tracking-wider ${
        isLive
          ? "border-primary/30 bg-primary/10 text-primary status-badge-glow-live"
          : "border-[hsl(var(--warm))]/30 bg-[hsl(var(--warm-soft))] text-[hsl(var(--warm))] status-badge-glow-closed"
      }`}
    >
      <span className={`relative flex h-2 w-2 ${isLive ? "live-dot-shimmer" : ""}`}>
        {isLive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isLive ? "bg-primary" : "bg-[hsl(var(--warm))]"
          }`}
        />
      </span>
      <span>{connectionStatus}</span>
    </div>
  );
}

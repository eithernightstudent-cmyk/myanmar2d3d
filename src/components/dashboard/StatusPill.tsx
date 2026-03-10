interface StatusPillProps {
  isLive: boolean;
  connectionStatus: string;
}

export function StatusPill({ isLive, connectionStatus }: StatusPillProps) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        color: isLive ? "hsl(var(--success))" : "hsl(var(--warm))",
      }}
    >
      <span className="relative flex h-2 w-2">
        {isLive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: "hsl(var(--success))" }} />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: isLive ? "hsl(var(--success))" : "hsl(var(--warm))" }}
        />
      </span>
      <span>{connectionStatus}</span>
    </div>
  );
}

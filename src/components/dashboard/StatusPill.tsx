interface StatusPillProps {
  isLive: boolean;
  connectionStatus: string;
}

export function StatusPill({ isLive, connectionStatus }: StatusPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[0.65rem] font-bold uppercase tracking-wider ${
        isLive
          ? "border-success-border bg-success-light text-success"
          : "border-fail-border bg-fail-light text-fail"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isLive ? "bg-success" : "bg-fail"
        }`}
        style={{
          animation: isLive ? "pulse-dot 1.6s infinite" : "pulse-dot-fail 1.6s infinite",
        }}
      />
      <span>{connectionStatus}</span>
    </div>
  );
}

interface StatusPillProps {
  isLive: boolean;
  connectionStatus: string;
}

export function StatusPill({ isLive, connectionStatus }: StatusPillProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-display text-[0.73rem] font-semibold uppercase tracking-widest ${
        isLive
          ? "border-success-border bg-success-light text-success"
          : "border-fail-border bg-fail-light text-fail"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isLive ? "bg-success" : "bg-fail"
        }`}
        style={{
          animation: isLive ? "pulse-dot 1.6s infinite" : "pulse-dot-fail 1.6s infinite",
        }}
      />
      <span>Connection Status: {connectionStatus}</span>
    </div>
  );
}

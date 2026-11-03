/** PRD 4.5 — tray popover: remaining time + schedule mode. */
export default function TimePopover({ remainingMins, mode }: { remainingMins: number; mode: string }) {
  return (
    <div className="card">
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#8A9A90" }}>SCREEN TIME</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{remainingMins} min left</div>
      <div style={{ fontSize: 13, color: "#64756b" }}>Mode: {mode} · policy enforced offline</div>
      <div style={{ height: 7, background: "#EEE8D4", borderRadius: 99, marginTop: 8 }}>
        <div style={{ width: `${Math.min(100, (remainingMins / 45) * 100)}%`, height: "100%", background: "#0C5B40", borderRadius: 99 }} />
      </div>
    </div>
  );
}

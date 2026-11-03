import { useRef, useState } from "react";

/** PRD 4.5 — hold-to-confirm SOS (2s). Production: invoke Tauri `send_sos` → pipe → backend. */
export default function SosButton() {
  const [holding, setHolding] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef<number | null>(null);

  const start = () => {
    setHolding(true); setSent(false);
    timer.current = window.setTimeout(() => {
      setSent(true); setHolding(false);
    }, 2000);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!sent) setHolding(false);
  };

  return (
    <div>
      <div className="sos-hold"
        onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel}
        style={{ opacity: holding ? 0.85 : 1 }}>
        {sent ? "🚨 SOS sent — parent alerted" : holding ? "Holding… release to cancel" : "Hold for SOS · 2 sec"}
      </div>
      <div style={{ fontSize: 12, color: "#64756b", textAlign: "center", marginTop: 6 }}>
        Bypasses every lock · shares location with parent.
      </div>
    </div>
  );
}

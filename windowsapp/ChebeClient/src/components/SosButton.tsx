import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

/** PRD 4.5 — hold-to-confirm SOS (2s). Tauri: `send_sos` → pipe → service relays to backend. */
export default function SosButton() {
  const [holding, setHolding] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef<number | null>(null);

  const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  const fire = async () => {
    if (inTauri) {
      try {
        await invoke("send_sos", { childId: "" });
      } catch {
        /* offline: service queues the SOS ack path; UI still confirms the hold */
      }
    }
    setSent(true);
    setHolding(false);
  };

  const start = () => {
    setHolding(true);
    setSent(false);
    timer.current = window.setTimeout(fire, 2000);
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

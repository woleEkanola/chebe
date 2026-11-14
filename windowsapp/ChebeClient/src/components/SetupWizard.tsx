import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const BACKEND = "https://chebe.vercel.app";

/** PRD 4.1 — 6-digit pairing wizard.
 * Inside Tauri: invoke `pair_device` → pipe → ChebeService links via backend.
 * Outside Tauri (browser dev): POST straight to the backend (same call the service makes). */
export default function SetupWizard({ onDone, onCancel }: { onDone: (deviceId: string) => void; onCancel?: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkedId, setLinkedId] = useState<string | null>(null);

  const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  const submit = async () => {
    const clean = code.replace(/\D/g, "");
    if (clean.length < 6) { setErr("Enter the 6-digit code from the Parent dashboard."); return; }
    setErr("");
    setBusy(true);
    try {
      if (inTauri) {
        const deviceId = await invoke<string>("pair_device", { code: clean });
        try { localStorage.setItem("chebe-device-id", deviceId); } catch { /* ignore */ }
        setLinkedId(deviceId);
        return;
      }
      const res = await fetch(`${BACKEND}/api/pairing/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean, platform: "windows", label: "Windows PC" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Link failed.");
      try { localStorage.setItem("chebe-device-id", data.device.id); } catch { /* ignore */ }
      setLinkedId(data.device.id);
    } catch (e) {
      // Tauri invoke rejects with the raw Rust error string.
      setErr(typeof e === "string" ? e : e instanceof Error ? e.message : "Link failed. Is ChebeService running?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
      <b>Link this device</b>
      <p style={{ fontSize: 13, color: "#64756B" }}>Enter the 6-digit pairing code from the Parent Web Dashboard.</p>
      {linkedId && (
        <div style={{ background: "#E3EFE7", borderRadius: 12, padding: 12, marginTop: 4 }}>
          <div style={{ fontWeight: 800, color: "#083B2A" }}>✓ Device linked</div>
          <div style={{ fontSize: 12, color: "#42524a", marginTop: 4, wordBreak: "break-all" }}>
            This PC is now bound to your family. Device ID: {linkedId}
          </div>
          <button className="btn-pine" style={{ width: "100%", marginTop: 10 }} onClick={() => onDone(linkedId)}>
            Done
          </button>
        </div>
      )}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. 482-913"
        style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1.5px solid #E7E1D1", fontSize: 18, letterSpacing: "0.2em", fontFamily: "monospace" }}
      />
      {err && <div style={{ color: "#B3261E", fontSize: 13, marginTop: 8 }}>{err}</div>}
      <button className="btn-pine" style={{ width: "100%", marginTop: 12 }} onClick={submit} disabled={busy}>
        {busy ? "Linking…" : "Link device"}
      </button>
      {onCancel && (
        <button className="btn-lime" style={{ width: "100%", marginTop: 8 }} onClick={onCancel} disabled={busy}>
          Back
        </button>
      )}
    </div>
  );
}

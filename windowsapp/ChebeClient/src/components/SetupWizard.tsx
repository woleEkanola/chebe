import { useState } from "react";

const BACKEND = "http://localhost:3000";

/** PRD 4.1 — 6-digit pairing wizard.
 * Tauri: invokes `pair_device` → pipe → ChebeService links via backend.
 * Browser dev: POSTs straight to the backend (service does the same call). */
export default function SetupWizard({ onDone }: { onDone: (deviceId: string) => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const clean = code.replace(/\D/g, "");
    if (clean.length < 6) { setErr("Enter the 6-digit code from the Parent dashboard."); return; }
    setErr("");
    setBusy(true);
    try {
      // @ts-expect-error — injected by Tauri at runtime
      if (window.__TAURI__?.core) {
        // @ts-expect-error — injected by Tauri at runtime
        const { invoke } = window.__TAURI__.core;
        const deviceId = await invoke<string>("pair_device", { code: clean });
        try { localStorage.setItem("chebe-device-id", deviceId); } catch { /* ignore */ }
        onDone(deviceId);
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
      onDone(data.device.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Link failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
      <b>Link this device</b>
      <p style={{ fontSize: 13, color: "#64756b" }}>Enter the 6-digit pairing code from the Parent Web Dashboard.</p>
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
    </div>
  );
}

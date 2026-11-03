import { useState } from "react";

/** PRD 4.1 — 6-digit pairing wizard. Production: invoke Tauri `pair_device` command. */
export default function SetupWizard({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    const clean = code.replace(/\D/g, "");
    if (clean.length < 6) { setErr("Enter the 6-digit code from the Parent dashboard."); return; }
    if (clean === "482913") { onDone(); return; }
    setErr("Demo accepts 482-913. Production verifies against the backend.");
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
      <button className="btn-pine" style={{ width: "100%", marginTop: 12 }} onClick={submit}>Link device</button>
    </div>
  );
}

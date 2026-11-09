import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import SetupWizard from "./components/SetupWizard";
import TimePopover from "./components/TimePopover";
import LockOverlay from "./components/LockOverlay";
import WarnToast from "./components/WarnToast";
import SosButton from "./components/SosButton";

const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export type UiState =
  | { view: "setup" }
  | { view: "status"; locked: boolean; lockReason?: string; unlockAt?: string; warn?: string; remainingMins?: number; mode?: string };

/**
 * In production this subscribes to Tauri events forwarded from the Rust
 * named-pipe client (lock/unlock/warn/policy). For dev without Tauri,
 * `window.__chebeMock` events + demo buttons drive the same state.
 */
export default function App() {
  const [state, setState] = useState<UiState>({ view: "status", locked: false, remainingMins: 17, mode: "Free Time" });
  const [svc, setSvc] = useState<"starting" | "ready" | "error">("starting");
  const [svcErr, setSvcErr] = useState("");

  const lock = (reason = "bedtime") =>
    setState({ view: "status", locked: true, lockReason: reason, unlockAt: "07:00" });
  const unlock = () =>
    setState({ view: "status", locked: false, remainingMins: 17, mode: "Free Time" });

  // Real pipe events from the Rust shell (lock/unlock/warn/policy). No-op in browser dev.
  useEffect(() => {
    if (!inTauri) return;
    const unsubs: Array<() => void> = [];
    listen<{ reason?: string; unlockAt?: string }>("chebe-lock", (e) =>
      lock(e.payload?.reason ?? "bedtime")).then((u) => unsubs.push(u)).catch(() => {});
    listen("chebe-unlock", () => unlock()).then((u) => unsubs.push(u)).catch(() => {});
    listen<{ message?: string }>("chebe-warn", (e) =>
      setState((s) => (s.view === "status" ? { ...s, warn: e.payload?.message ?? "" } : s))
    ).then((u) => unsubs.push(u)).catch(() => {});
    listen("chebe-service-ready", () => setSvc("ready")).then((u) => unsubs.push(u)).catch(() => {});
    listen<{ error?: string }>("chebe-service-error", (e) => {
      setSvc("error");
      setSvcErr(e.payload?.error ?? "Could not start ChebeService.");
    }).then((u) => unsubs.push(u)).catch(() => {});
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.view === "setup") return <SetupWizard onDone={unlock} />;

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: "#0c5b40", color: "#c9f16f", display: "grid", placeItems: "center", fontWeight: 800 }}>c</div>
        <b>chebe</b>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#64756b" }}>policy v12 · offline-safe</span>
      </div>

      {inTauri && svc === "starting" && (
        <div className="card" style={{ marginBottom: 12, background: "#F6F1E0" }}>
          <b>Starting protection…</b>
          <div style={{ fontSize: 12, color: "#64756b" }}>Connecting to ChebeService.</div>
        </div>
      )}
      {inTauri && svc === "error" && (
        <div className="card" style={{ marginBottom: 12, background: "#F9E7E5", borderColor: "#D8B4B1" }}>
          <b>Service unavailable</b>
          <div style={{ fontSize: 12, color: "#64756b" }}>{svcErr || "ChebeService.exe could not be started. Run the installer or place ChebeService.exe next to this app."}</div>
        </div>
      )}

      {state.view === "status" && !state.locked && (
        <>
          <TimePopover remainingMins={state.remainingMins ?? 17} mode={state.mode ?? "Free Time"} />
          <div style={{ height: 12 }} />
          <SosButton />
          <div className="card" style={{ marginTop: 12 }}>
            <b>Demo controls</b>
            <div style={{ fontSize: 12, color: "#64756b", margin: "4px 0 8px" }}>Simulates pipe messages from ChebeService.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-pine" onClick={() => lock("bedtime")}>Simulate lock</button>
              <button className="btn-lime" onClick={() => setState({ view: "setup" })}>Setup wizard</button>
            </div>
          </div>
        </>
      )}

      {state.view === "status" && state.locked && (
        <LockOverlay reason={state.lockReason ?? "bedtime"} unlockAt={state.unlockAt ?? "07:00"} onUnlocked={unlock} />
      )}

      {state.view === "status" && state.warn && <WarnToast message={state.warn} />}
    </div>
  );
}

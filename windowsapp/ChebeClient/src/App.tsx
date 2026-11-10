import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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
  // "live" = installed Windows service (production), "testing" = UI-spawned sidecar (dev).
  const [svcMode, setSvcMode] = useState<"live" | "testing" | null>(null);

  const lock = (reason = "bedtime") =>
    setState({ view: "status", locked: true, lockReason: reason, unlockAt: "07:00" });
  const unlock = () =>
    setState({ view: "status", locked: false, remainingMins: 17, mode: "Free Time" });

  // Real pipe events from the Rust shell (lock/unlock/warn/policy). No-op in browser dev.
  useEffect(() => {
    if (!inTauri) {
      // Browser dev without Tauri: nothing to connect to.
      return;
    }
    let cancelled = false;
    const unsubs: Array<() => void> = [];
    listen<{ reason?: string; unlockAt?: string }>("chebe-lock", (e) =>
      lock(e.payload?.reason ?? "bedtime")).then((u) => unsubs.push(u)).catch(() => {});
    listen("chebe-unlock", () => unlock()).then((u) => unsubs.push(u)).catch(() => {});
    listen<{ message?: string }>("chebe-warn", (e) =>
      setState((s) => (s.view === "status" ? { ...s, warn: e.payload?.message ?? "" } : s))
    ).then((u) => unsubs.push(u)).catch(() => {});
    listen("chebe-service-ready", (e: { payload?: { mode?: string } }) => {
      if (cancelled) return;
      setSvc("ready");
      const m = e?.payload?.mode;
      if (m === "live" || m === "testing") setSvcMode(m);
    }).then((u) => unsubs.push(u)).catch(() => {});
    listen<{ error?: string }>("chebe-service-error", (e) => {
      if (cancelled) return;
      setSvc("error");
      setSvcErr(e.payload?.error ?? "Could not start ChebeService.");
    }).then((u) => unsubs.push(u)).catch(() => {});
    // Authoritative check on mount: the ready event may have fired before we
    // subscribed (Rust setup runs before the webview finishes loading).
    // Mode stays null (shows neutral "Connected") if the startup event was
    // the only source of mode info and was missed.
    invoke<string>("service_status").then(
      (mode) => {
        if (!cancelled) {
          setSvc("ready");
          setSvcErr("");
          if (mode === "live" || mode === "testing") setSvcMode(mode);
        }
      },
      (e) => {
        if (cancelled) return;
        setSvc("error");
        setSvcErr(typeof e === "string" ? e : "Could not reach ChebeService.");
      }
    ).catch(() => {});
    return () => { cancelled = true; unsubs.forEach((u) => u()); };
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
      {inTauri && svc === "ready" && svcMode !== null && (
        <div className="card" style={{ marginBottom: 12, background: svcMode === "live" ? "#E3EFE7" : "#F6F1E0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: svcMode === "live" ? "#083B2A" : "#8A5A12" }}>
            {svcMode === "live" ? "● Protected — installed service" : "● Testing mode — UI-launched service"}
          </div>
          {svcMode === "testing" && (
            <div style={{ fontSize: 11, color: "#64756B", marginTop: 2 }}>
              Full enforcement needs the installed service. Run the installer as Administrator for production use.
            </div>
          )}
        </div>
      )}
      {inTauri && svc === "error" && (
        <div className="card" style={{ marginBottom: 12, background: "#F9E7E5", borderColor: "#D8B4B1" }}>
          <b>Service unavailable</b>
          <div style={{ fontSize: 12, color: "#64756b" }}>{svcErr || "ChebeService.exe could not be started."}</div>
          <button
            className="btn-pine"
            style={{ marginTop: 8, width: "100%" }}
            onClick={async () => {
              setSvc("starting");
              try {
                const mode = await invoke<string>("retry_service");
                setSvc("ready");
                setSvcErr("");
                if (mode.includes("live")) setSvcMode("live");
                else if (mode.includes("testing")) setSvcMode("testing");
              } catch {
                /* status arrives via chebe-service-error event */
              }
            }}
          >
            Try again
          </button>
        </div>
      )}

      {state.view === "status" && !state.locked && (
        <>
          <TimePopover remainingMins={state.remainingMins ?? 17} mode={state.mode ?? "Free Time"} />
          <div style={{ height: 12 }} />
          <SosButton />
          {!inTauri && (
            <div className="card" style={{ marginTop: 12 }}>
              <b>Demo controls</b>
              <div style={{ fontSize: 12, color: "#64756b", margin: "4px 0 8px" }}>Simulates pipe messages from ChebeService.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-pine" onClick={() => lock("bedtime")}>Simulate lock</button>
                <button className="btn-lime" onClick={() => setState({ view: "setup" })}>Setup wizard</button>
              </div>
            </div>
          )}
        </>
      )}

      {state.view === "status" && state.locked && (
        <LockOverlay reason={state.lockReason ?? "bedtime"} unlockAt={state.unlockAt ?? "07:00"} onUnlocked={unlock} />
      )}

      {state.view === "status" && state.warn && <WarnToast message={state.warn} />}
    </div>
  );
}

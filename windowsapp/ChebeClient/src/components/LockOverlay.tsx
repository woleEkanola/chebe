import SosButton from "./SosButton";

/** PRD 4.2 — full-screen, top-most, non-dismissible lock overlay. */
export default function LockOverlay({ reason, unlockAt, onUnlocked }: { reason: string; unlockAt: string; onUnlocked: () => void }) {
  return (
    <div className="overlay-lock">
      <div style={{ fontSize: 44 }}>🌙</div>
      <h1 style={{ margin: "8px 0" }}>{reason === "pause" ? "Device paused" : "Bedtime shield is on"}</h1>
      <p style={{ color: "#B9CDBF" }}>
        {reason === "pause" ? "Take a break — everything unlocks when your parent resumes." : `Games unlock at ${unlockAt} · homework apps stay available.`}
      </p>
      <div style={{ marginTop: 16, width: "min(320px, 90vw)" }}>
        <SosButton />
      </div>
      {/* Demo escape hatch — production overlay has no dismiss button */}
      <button onClick={onUnlocked} style={{ marginTop: 24, background: "transparent", border: "1px solid #3a5a48", color: "#9DB4A4", borderRadius: 999, padding: "8px 16px", cursor: "pointer", fontSize: 12 }}>
        (demo) simulate unlock
      </button>
    </div>
  );
}

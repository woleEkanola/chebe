// Dev simulator: mimics ChebeService pipe messages in a browser (no Tauri/pipe needed).
// Open ChebeClient with `npm run dev`, paste in DevTools console, then call chebe.lock(), etc.
window.__chebe = {
  lock(reason = "bedtime") {
    window.dispatchEvent(new CustomEvent("chebe-lock", { detail: { reason, unlockAt: "07:00" } }));
    console.log("[chebe-sim] lock:", reason);
  },
  unlock() {
    window.dispatchEvent(new CustomEvent("chebe-unlock"));
    console.log("[chebe-sim] unlock");
  },
  warn(msg = "5 minutes of screen time remaining") {
    window.dispatchEvent(new CustomEvent("chebe-warn", { detail: { message: msg } }));
    console.log("[chebe-sim] warn:", msg);
  },
};
console.log("Chebe simulator ready: chebe.lock() / chebe.unlock() / chebe.warn()");

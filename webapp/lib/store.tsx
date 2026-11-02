"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { alerts as seedAlerts, appInventory as seedApps, children as seedChildren } from "./mock";

interface ChatMsg {
  id: number;
  who: "me" | "bot";
  html: string;
}

interface ChebeState {
  paused: Record<string, boolean>;
  globalPause: boolean;
  bonusLog: string;
  alerts: typeof seedAlerts;
  apps: typeof seedApps;
  toasts: string[];
  messages: ChatMsg[];
  togglePause: (childId: string) => void;
  toggleGlobalPause: () => void;
  grantBonus: (mins: number) => void;
  resolveAlert: (id: string) => void;
  setAppLimit: (id: string, mins: number) => void;
  pushToast: (msg: string) => void;
  dismissToast: () => void;
  sendChat: (text: string) => void;
}

const Ctx = createContext<ChebeState | null>(null);
let chatId = 10;

function assistantReply(q: string): string {
  const s = q.toLowerCase();
  if (/where.*(alex|sarah)|location/.test(s))
    return `Alex is inside the <b>Home fence</b> (±8 m, 12s ago). <a class="underline" href="/map">Open map</a>`;
  if (/youtube/.test(s)) {
    const un = /unblock/.test(s);
    return `${un ? "YouTube limit removed." : "YouTube blocked for today."}<br/><span class="text-xs opacity-70">Rule: com.google.youtube · today only · <button data-undo class="underline font-bold">Undo</button></span>`;
  }
  if (/pause/.test(s)) return "Done — non-essential apps pause with a 1-minute warning.";
  if (/resume/.test(s)) return "Done — devices resumed.";
  if (/bedtime|9\s?pm|21/.test(s)) return "Bedtime set to <b>21:00–07:00, Mon–Fri</b>. Applies tonight · works offline.";
  if (/summar/.test(s))
    return "Today: <b>2h 41m</b> (−32m), top app YouTube 1h 04m, 1 high alert resolved. Full digest on the dashboard.";
  if (/block.*roblox/.test(s)) return "Roblox blocked for today. <button data-undo class='underline font-bold'>Undo</button>";
  return "I can pause, block apps, locate Alex/Sarah, set bedtimes, or summarize. Try “summarize today”.";
}

export function ChebeProvider({ children }: { children: React.ReactNode }) {
  const [paused, setPaused] = useState<Record<string, boolean>>({});
  const [globalPause, setGlobalPause] = useState(false);
  const [bonusLog, setBonusLog] = useState("No bonus granted yet today.");
  const [alerts, setAlerts] = useState(seedAlerts);
  const [apps, setApps] = useState(seedApps);
  const [toasts, setToasts] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 1, who: "bot", html: "Hi Ama. I can pause devices, block apps, locate Alex, set bedtimes, and summarize the day. What should I do?" },
  ]);

  const pushToast = useCallback((msg: string) => {
    setToasts((t) => [...t, msg]);
    setTimeout(() => setToasts((t) => t.slice(1)), 2400);
  }, []);

  const dismissToast = useCallback(() => setToasts((t) => t.slice(1)), []);

  const togglePause = useCallback(
    (childId: string) => {
      setPaused((p) => {
        const next = !p[childId];
        pushToast(next ? "Pause sent — locks in under 3s" : "Device resumed");
        return { ...p, [childId]: next };
      });
    },
    [pushToast]
  );

  const toggleGlobalPause = useCallback(() => {
    setGlobalPause((g) => {
      pushToast(g ? "All devices resumed" : "Global pause sent to all devices");
      return !g;
    });
  }, [pushToast]);

  const grantBonus = useCallback(
    (mins: number) => {
      setBonusLog(`+${mins} min granted just now · never overrides Bedtime.`);
      pushToast(`+${mins} min bonus granted`);
    },
    [pushToast]
  );

  const resolveAlert = useCallback(
    (id: string) => {
      setAlerts((a) => a.map((x) => (x.id === id ? { ...x, status: "resolved" as const } : x)));
      pushToast("Alert resolved with guidance");
    },
    [pushToast]
  );

  const setAppLimit = useCallback((id: string, mins: number) => {
    setApps((a) => a.map((x) => (x.id === id ? { ...x, limitMins: mins } : x)));
  }, []);

  const sendChat = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q) return;
      setMessages((m) => [...m, { id: ++chatId, who: "me", html: q.replace(/</g, "&lt;") }]);
      const typingId = ++chatId;
      setMessages((m) => [...m, { id: typingId, who: "bot", html: "…" }]);
      const reply = assistantReply(q);
      if (/pause/.test(q.toLowerCase()) && !q.toLowerCase().includes("resume")) setGlobalPause(true);
      if (/resume/.test(q.toLowerCase())) setGlobalPause(false);
      setTimeout(() => {
        setMessages((m) => m.map((x) => (x.id === typingId ? { ...x, html: reply } : x)));
      }, 600);
    },
    []
  );

  const value = useMemo(
    () => ({
      paused,
      globalPause,
      bonusLog,
      alerts,
      apps,
      toasts,
      messages,
      togglePause,
      toggleGlobalPause,
      grantBonus,
      resolveAlert,
      setAppLimit,
      pushToast,
      dismissToast,
      sendChat,
    }),
    [paused, globalPause, bonusLog, alerts, apps, toasts, messages, togglePause, toggleGlobalPause, grantBonus, resolveAlert, setAppLimit, pushToast, dismissToast, sendChat]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChebe() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChebe must be used inside ChebeProvider");
  return ctx;
}

export function childStatusLabel(c: (typeof seedChildren)[number], isPaused: boolean) {
  if (isPaused) return "Paused";
  return c.status === "online" ? "Active" : "Offline";
}

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface ApiDevice {
  id: string;
  label: string;
  platform: string;
  policyVersion: number;
  instantPaused: boolean;
  lastSeenAt: string | null;
}

export interface ApiLocation {
  lat: number;
  lng: number;
  accuracyM: number;
  recordedAt: string;
}

export interface ApiChild {
  id: string;
  name: string;
  age: number;
  devices: ApiDevice[];
  locations: ApiLocation[];
}

export interface ApiAlert {
  id: string;
  childId: string | null;
  severity: string;
  kind: string;
  title: string;
  detail: string;
  snippet: string | null;
  guidance: string;
  status: string;
  createdAt: string;
}

export interface ApiLimit {
  id: string;
  childId: string;
  pkg: string;
  label: string;
  limitMins: number;
}

export interface ApiUsageChild {
  childId: string;
  name: string;
  today: number;
  week: Record<string, number>;
  top: Record<string, { label: string; mins: number }>;
}
export interface ApiGeofence {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radiusM: number;
}

export interface ApiSchedule {
  id: string;
  deviceId: string;
  label: string;
  days: number[];
  start: string;
  end: string;
  shieldLevel: string;
}

interface ChatMsg {
  id: number;
  who: "me" | "bot";
  html: string;
}

interface ChebeState {
  userName: string;
  loading: boolean;
  children: ApiChild[];
  alerts: ApiAlert[];
  limits: ApiLimit[];
  geofences: ApiGeofence[];
  usage: ApiUsageChild[];
  paused: Record<string, boolean>;
  globalPause: boolean;
  bonusLog: string;
  toasts: string[];
  messages: ChatMsg[];
  togglePause: (childId: string) => void;
  toggleGlobalPause: () => void;
  grantBonus: (mins: number) => void;
  resolveAlert: (id: string) => void;
  setAppLimit: (childId: string, pkg: string, mins: number) => void;
  pushToast: (msg: string) => void;
  dismissToast: () => void;
  sendChat: (text: string) => void;
  refresh: () => void;
}

const Ctx = createContext<ChebeState | null>(null);
let chatId = 10;

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined") {
    const p = window.location.pathname;
    if (p !== "/login" && p !== "/register") window.location.href = "/login";
    throw new Error("signed out");
  }
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed.");
  return data as T;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function deviceOnline(d: ApiDevice): boolean {
  if (!d.lastSeenAt) return false;
  return Date.now() - new Date(d.lastSeenAt).getTime() < 5 * 60 * 1000;
}

export function ChebeProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("Parent");
  const [loading, setLoading] = useState(true);
  const [childList, setChildList] = useState<ApiChild[]>([]);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [limits, setLimits] = useState<ApiLimit[]>([]);
  const [geofences, setGeofences] = useState<ApiGeofence[]>([]);
  const [usage, setUsage] = useState<ApiUsageChild[]>([]);
  const [bonusLog, setBonusLog] = useState("No bonus granted yet today.");
  const [toasts, setToasts] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 1, who: "bot", html: "Hi. I can pause devices, block apps, locate your child, set bedtimes, and summarize the day. What should I do?" },
  ]);
  const booted = useRef(false);

  const pushToast = useCallback((msg: string) => {
    setToasts((t) => [...t, msg]);
    setTimeout(() => setToasts((t) => t.slice(1)), 2400);
  }, []);

  const dismissToast = useCallback(() => setToasts((t) => t.slice(1)), []);

  const refresh = useCallback(async () => {
    try {
      const [c, a, l, g, u] = await Promise.all([
        j<{ children: ApiChild[] }>("/api/children"),
        j<{ alerts: ApiAlert[] }>("/api/alerts"),
        j<{ limits: ApiLimit[] }>("/api/applimits"),
        j<{ geofences: ApiGeofence[] }>("/api/geofences"),
        j<{ usage: ApiUsageChild[] }>("/api/usage"),
      ]);
      setChildList(c.children);
      setAlerts(a.alerts);
      setLimits(l.limits);
      setGeofences(g.geofences);
      setUsage(u.usage);
    } catch {
      /* session redirect handled in j() */
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      try {
        const me = await j<{ user: { name: string } }>("/api/auth/me");
        setUserName(me.user.name);
        await refresh();
      } catch {
        /* redirected to /login */
      } finally {
        setLoading(false);
      }
    })();
    const t = setInterval(refresh, 30000); // poll-only parity with devices
    return () => clearInterval(t);
  }, [refresh]);

  const paused = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const c of childList) m[c.id] = c.devices.length > 0 && c.devices.every((d) => d.instantPaused);
    return m;
  }, [childList]);

  const globalPause = useMemo(() => {
    const all = childList.flatMap((c) => c.devices);
    return all.length > 0 && all.every((d) => d.instantPaused);
  }, [childList]);

  const togglePause = useCallback(
    async (childId: string) => {
      const next = !paused[childId];
      try {
        await j("/api/commands", {
          method: "POST",
          body: JSON.stringify({ scope: "child", id: childId, action: next ? "pause" : "resume" }),
        });
        pushToast(next ? "Pause sent — applies on next device sync (<30s)" : "Resume sent");
        await refresh();
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Command failed.");
      }
    },
    [paused, refresh, pushToast]
  );

  const toggleGlobalPause = useCallback(async () => {
    try {
      await j("/api/commands", {
        method: "POST",
        body: JSON.stringify({ scope: "global", action: globalPause ? "resume" : "pause" }),
      });
      pushToast(globalPause ? "Resume sent to all devices" : "Global pause sent");
      await refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Command failed.");
    }
  }, [globalPause, refresh, pushToast]);

  const grantBonus = useCallback(
    async (mins: number) => {
      try {
        await j("/api/commands", { method: "POST", body: JSON.stringify({ scope: "global", action: "bonus", mins }) });
        setBonusLog(`+${mins} min granted just now · never overrides Bedtime.`);
        pushToast(`+${mins} min bonus granted`);
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Bonus failed.");
      }
    },
    [pushToast]
  );

  const resolveAlert = useCallback(
    async (id: string) => {
      try {
        await j(`/api/alerts/${id}`, { method: "PATCH", body: JSON.stringify({ status: "resolved" }) });
        setAlerts((a) => a.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)));
        pushToast("Alert resolved with guidance");
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Update failed.");
      }
    },
    [pushToast]
  );

  const setAppLimit = useCallback(
    async (childId: string, pkg: string, mins: number) => {
      setLimits((ls) => ls.map((x) => (x.childId === childId && x.pkg === pkg ? { ...x, limitMins: mins } : x)));
      try {
        const data = await j<{ limit: ApiLimit }>("/api/applimits", {
          method: "PUT",
          body: JSON.stringify({ childId, pkg, limitMins: mins }),
        });
        setLimits((ls) =>
          ls.some((x) => x.childId === childId && x.pkg === pkg)
            ? ls.map((x) => (x.childId === childId && x.pkg === pkg ? data.limit : x))
            : [...ls, data.limit]
        );
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Limit update failed.");
        refresh();
      }
    },
    [refresh, pushToast]
  );

  const sendChat = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q) return;
      setMessages((m) => [...m, { id: ++chatId, who: "me", html: q.replace(/</g, "&lt;") }]);
      const typingId = ++chatId;
      setMessages((m) => [...m, { id: typingId, who: "bot", html: "…" }]);
      try {
        const data = await j<{ reply: string }>("/api/assistant", {
          method: "POST",
          body: JSON.stringify({ message: q }),
        });
        setMessages((m) => m.map((x) => (x.id === typingId ? { ...x, html: data.reply } : x)));
        refresh();
      } catch {
        setMessages((m) => m.map((x) => (x.id === typingId ? { ...x, html: "Sorry — I couldn't reach the server." } : x)));
      }
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      userName, loading, children: childList, alerts, limits, geofences, usage,
      paused, globalPause, bonusLog, toasts, messages,
      togglePause, toggleGlobalPause, grantBonus, resolveAlert, setAppLimit,
      pushToast, dismissToast, sendChat, refresh,
    }),
    [userName, loading, childList, alerts, limits, geofences, usage, paused, globalPause, bonusLog, toasts, messages,
      togglePause, toggleGlobalPause, grantBonus, resolveAlert, setAppLimit, pushToast, dismissToast, sendChat, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChebe() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChebe must be used inside ChebeProvider");
  return ctx;
}

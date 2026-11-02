export type ChildStatus = "online" | "offline" | "paused";

export interface Child {
  id: string;
  name: string;
  age: number;
  device: string;
  status: ChildStatus;
  battery: number;
  activeApp: string;
  scheduleMode: string;
  screenTimeToday: string;
  screenTimeMins: number;
  lat: number;
  lng: number;
  accuracyM: number;
  updatedAgo: string;
  policyVersion: number;
}

export interface SafetyAlert {
  id: string;
  childId: string;
  severity: "high" | "medium" | "low";
  kind: string;
  title: string;
  snippet?: string;
  detail: string;
  time: string;
  guidance: string;
  status: "open" | "reviewed" | "resolved";
}

export interface AppLimit {
  id: string;
  name: string;
  pkg: string;
  color: string;
  limitMins: number;
  usedMins: number;
  monitored?: boolean;
}

export const children: Child[] = [
  {
    id: "alex",
    name: "Alex",
    age: 11,
    device: "Galaxy A14",
    status: "online",
    battery: 78,
    activeApp: "Roblox",
    scheduleMode: "Free Time",
    screenTimeToday: "2h 41m",
    screenTimeMins: 161,
    lat: 6.5244,
    lng: 3.3792,
    accuracyM: 8,
    updatedAgo: "12s ago",
    policyVersion: 12,
  },
  {
    id: "sarah",
    name: "Sarah",
    age: 8,
    device: "Galaxy Tab A8",
    status: "online",
    battery: 64,
    activeApp: "Khan Kids",
    scheduleMode: "Focus Time",
    screenTimeToday: "1h 05m",
    screenTimeMins: 65,
    lat: 6.5251,
    lng: 3.3798,
    accuracyM: 11,
    updatedAgo: "40s ago",
    policyVersion: 9,
  },
];

export const alerts: SafetyAlert[] = [
  {
    id: "a1",
    childId: "alex",
    severity: "high",
    kind: "bullying",
    title: "Toxic chat in Roblox",
    snippet: "…u r trash kid, uninstall or else [redacted]",
    detail: "Text-chat monitor · confidence 0.93 · player muted pending your call.",
    time: "4:12 PM · Today",
    guidance:
      "“I saw a mean message in your game. Do you know this player? You did nothing wrong — want to block them together?”",
    status: "open",
  },
  {
    id: "a2",
    childId: "alex",
    severity: "medium",
    kind: "stranger",
    title: "Unknown number via SMS",
    detail: "“hey its jay from lobby, add me on…” — sender not in approved contacts.",
    time: "2:05 PM · Today",
    guidance:
      "Ask who Jay is, confirm whether Alex shared any personal info, then block or approve the number together.",
    status: "open",
  },
  {
    id: "a3",
    childId: "sarah",
    severity: "low",
    kind: "webblock",
    title: "Gambling site blocked",
    detail: "gamble-arcade.example · local filter · whitelist / blacklist available.",
    time: "Yesterday",
    guidance: "Praise Sarah for staying safe; no conversation needed unless it repeats.",
    status: "reviewed",
  },
];

export const appInventory: AppLimit[] = [
  { id: "yt", name: "YouTube", pkg: "com.google.youtube", color: "#C0392B", limitMins: 60, usedMins: 64 },
  { id: "rbx", name: "Roblox", pkg: "com.roblox.client", color: "#2F6FED", limitMins: 45, usedMins: 28, monitored: true },
  { id: "kk", name: "Khan Kids", pkg: "org.khankids.app", color: "#1d9e6b", limitMins: 90, usedMins: 31 },
  { id: "mc", name: "Minecraft", pkg: "com.mojang.minecraftpe", color: "#5b7f2a", limitMins: 60, usedMins: 12 },
  { id: "wa", name: "WhatsApp", pkg: "com.whatsapp", color: "#25D366", limitMins: 30, usedMins: 9 },
];

export const weekBars = [42, 68, 55, 80, 96, 64, 74];

export const weeklyTop = [
  { name: "YouTube", mins: 64, pct: 72 },
  { name: "Roblox", mins: 48, pct: 52 },
  { name: "Khan Kids", mins: 31, pct: 34 },
];

export const pairingCode = "482-913";

"use client";

import { useMemo, useState } from "react";
import { Card, Switch } from "./chrome";
import { deviceOnline, timeAgo, useChebe } from "@/lib/store";

export function FamilyGrid() {
  const { children, alerts, loading, paused, togglePause } = useChebe();
  if (loading && children.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1].map((i) => (
          <Card key={i}>
            <div className="animate-pulse text-sm text-[#64756B]">Loading family…</div>
          </Card>
        ))}
      </div>
    );
  }
  if (children.length === 0) {
    return (
      <Card>
        <div className="font-extrabold">No children yet</div>
        <div className="text-xs text-[#64756B]">
          Add a profile under Children, then pair a device to see it here.
        </div>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {children.map((c) => {
        const isPaused = paused[c.id];
        const openAlerts = alerts.filter((a) => a.childId === c.id && a.status === "open").length;
        const seen = c.devices.map((d) => d.lastSeenAt).filter(Boolean).sort().pop() as string | undefined;
        const online = c.devices.some(deviceOnline);
        const primary = c.devices[0];
        return (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2F6FED] to-[#174a9e] text-lg font-extrabold text-white">
                {c.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">
                  {c.name} · {c.age}
                </div>
                <div className="truncate text-xs text-[#64756B]">
                  {primary ? `${primary.label} · policy v${primary.policyVersion}` : "No device paired"}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  isPaused ? "bg-[#FAEED3] text-[#8A5A12]" : "bg-[#E3EFE7] text-[#083B2A]"
                }`}
              >
                ● {isPaused ? "Paused" : online ? "Active" : "Offline"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-[#F6F4EC] p-2">
                <div className="font-extrabold">{c.devices.length}</div>
                <div className="text-[#64756B]">Devices</div>
              </div>
              <div className="rounded-lg bg-[#F6F4EC] p-2">
                <div className="font-extrabold">{openAlerts}</div>
                <div className="text-[#64756B]">Open alerts</div>
              </div>
              <div className="rounded-lg bg-[#F6F4EC] p-2">
                <div className="truncate font-extrabold">{timeAgo(seen ?? null)}</div>
                <div className="text-[#64756B]">Last seen</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#EFEAD9] pt-3">
              <span className="text-xs text-[#64756B]">Instant pause</span>
              <Switch on={!!isPaused} onClick={() => togglePause(c.id)} label={`pause ${c.name}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function GlobalPause() {
  const { globalPause, toggleGlobalPause } = useChebe();
  return (
    <Card className={globalPause ? "border-[#0C5B40] ring-1 ring-[#0C5B40]" : ""}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-extrabold">Master Instant Pause</div>
          <div className="text-xs text-[#64756B]">
            {globalPause ? "ON — all devices locked, 1-min warning shown" : "Off — one tap locks every linked device in <3s"}
          </div>
        </div>
        <Switch on={globalPause} onClick={toggleGlobalPause} label="global pause" />
      </div>
    </Card>
  );
}

const sevColor: Record<string, string> = {
  high: "bg-[#B3261E]",
  medium: "bg-[#D99A1F]",
  low: "bg-[#2F6FED]",
};

export function AlertFeed({ compact = false }: { compact?: boolean }) {
  const { alerts, resolveAlert } = useChebe();
  const [open, setOpen] = useState<string | null>(null);
  const list = compact ? alerts.slice(0, 3) : alerts;
  const openCount = useMemo(() => alerts.filter((a) => a.status === "open").length, [alerts]);
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-extrabold">Recent alerts {openCount > 0 && <span className="ml-1 rounded-full bg-[#B3261E] px-2 py-0.5 text-[11px] text-white">{openCount} open</span>}</div>
        <span className="text-xs text-[#64756B]">Live · 30s poll</span>
      </div>
      {list.length === 0 && <div className="py-4 text-center text-xs text-[#64756B]">No alerts — all quiet.</div>}
      {list.map((a) => (
        <div key={a.id} className="border-t border-[#EFEAD9] py-3 first:border-t-0">
          <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen(open === a.id ? null : a.id)}>
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${sevColor[a.severity] ?? sevColor.low}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <b className="truncate text-sm">{a.title}</b>
                <span className="shrink-0 text-xs text-[#64756B]">{new Date(a.createdAt).toLocaleString()}</span>
              </span>
              <span className="mt-0.5 block text-xs text-[#64756B]">{a.detail}</span>
              {a.snippet && (
                <span className="mt-2 block rounded-lg bg-[#101915] p-2 font-mono text-[11px] text-[#F3E3A1]">{a.snippet}</span>
              )}
            </span>
          </button>
          {open === a.id && (
            <div className="ml-5 mt-2 rounded-xl bg-[#F6F1E0] p-3 text-[13px] leading-relaxed">
              <b>Guidance — how to talk about this.</b>
              <br />
              {a.guidance}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => resolveAlert(a.id)}
                  className="rounded-lg bg-[#0C5B40] px-3 py-1.5 text-xs font-bold text-white"
                >
                  {a.status === "resolved" ? "Resolved ✓" : "Mark resolved"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {compact && (
        <a href="/assistant" className="mt-1 block text-center text-xs font-bold text-[#0C5B40] underline">
          Open full review
        </a>
      )}
    </Card>
  );
}

export function ScreenTimeCard() {
  const { grantBonus, bonusLog } = useChebe();
  const bars = [42, 68, 55, 80, 96, 64, 74];
  return (
    <Card>
      <div className="flex items-center justify-between text-xs text-[#64756B]">
        <span className="font-bold uppercase tracking-wider">Screen time today</span>
        <span className="rounded-full bg-[#E3EFE7] px-2 py-0.5 font-bold text-[#083B2A]">−32m vs yesterday</span>
      </div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight">2h 41m</div>
      <div className="mt-2 flex h-8 items-end gap-1.5">
        {bars.map((h, i) => (
          <div key={i} className={`w-full rounded ${i === 4 ? "bg-[#0C5B40]" : "bg-[#D8E4D8]"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => grantBonus(15)} className="rounded-xl bg-[#C9F16F] px-3 py-2 text-[13px] font-extrabold text-[#1C3405]">
          +15 min
        </button>
        <button onClick={() => grantBonus(30)} className="rounded-xl bg-[#C9F16F] px-3 py-2 text-[13px] font-extrabold text-[#1C3405]">
          +30 min
        </button>
      </div>
      <div className="mt-2 text-xs text-[#64756B]">{bonusLog}</div>
    </Card>
  );
}

export function WeeklyCard() {
  const { alerts, limits } = useChebe();
  const open = alerts.filter((a) => a.status === "open").length;
  const resolved = alerts.filter((a) => a.status === "resolved").length;
  return (
    <Card>
      <div className="text-xs font-bold uppercase tracking-wider text-[#64756B]">Safety summary · live</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">
        {open === 0 ? "All quiet." : `${open} open alert${open === 1 ? "" : "s"}`}
      </div>
      <div className="text-xs text-[#64756B]">{resolved} resolved with guidance · trends, not raw logs.</div>
      <div className="mt-3 space-y-2.5">
        {limits.slice(0, 3).map((r) => (
          <div key={r.id}>
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold">{r.label}</span>
              <span className="text-[#64756B]">{r.limitMins} min/day</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EEE8D4]">
              <div className="h-full rounded-full bg-[#0C5B40]" style={{ width: `${Math.min(100, (r.limitMins / 120) * 100)}%` }} />
            </div>
          </div>
        ))}
        {limits.length === 0 && (
          <div className="text-xs text-[#64756B]">No app limits set yet — add them under Routines.</div>
        )}
      </div>
    </Card>
  );
}

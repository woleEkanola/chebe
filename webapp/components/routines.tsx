"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "./chrome";
import { useChebe, type ApiSchedule } from "@/lib/store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

type Block = { day: number; hour: number; kind: "bedtime" | "school" | "homework" };

const KIND_COLOR: Record<Block["kind"], string> = {
  bedtime: "bg-[#083B2A] text-white",
  school: "bg-[#2F6FED] text-white",
  homework: "bg-[#D99A1F] text-white",
};

const KIND_LABEL: Record<string, Block["kind"]> = {
  bedtime: "bedtime",
  school: "school",
  homework: "homework",
};

function expandToBlocks(s: ApiSchedule): Block[] {
  const kind = KIND_LABEL[s.label.toLowerCase()] ?? "bedtime";
  const out: Block[] = [];
  const sh = parseInt(s.start.split(":")[0] ?? "0", 10);
  let eh = parseInt(s.end.split(":")[0] ?? "0", 10);
  if (eh <= sh) eh = 22; // overnight spans clip to grid
  for (const d of s.days) for (let h = sh; h < eh; h++) if (h >= 7 && h <= 21) out.push({ day: d, hour: h, kind });
  return out;
}

export function ScheduleBuilder() {
  const { children, pushToast } = useChebe();
  const devices = useMemo(() => children.flatMap((c) => c.devices.map((d) => ({ ...d, childName: c.name }))), [children]);
  const [deviceId, setDeviceId] = useState("");
  const [kind, setKind] = useState<Block["kind"]>("bedtime");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);

  const activeDevice = deviceId || devices[0]?.id || "";
  useEffect(() => {
    if (!activeDevice) return;
    (async () => {
      try {
        const res = await fetch(`/api/schedules?deviceId=${activeDevice}`);
        const data = await res.json();
        if (res.ok) setBlocks((data.schedules as ApiSchedule[]).flatMap(expandToBlocks));
      } catch {
        /* offline: keep local paint */
      }
    })();
  }, [activeDevice]);

  const toggle = (day: number, hour: number) => {
    setBlocks((b) => {
      const i = b.findIndex((x) => x.day === day && x.hour === hour);
      if (i >= 0) return b.filter((_, j) => j !== i);
      return [...b, { day, hour, kind }];
    });
  };

  const save = async () => {
    if (!activeDevice) {
      pushToast("Pair a device first.");
      return;
    }
    setSaving(true);
    try {
      // Collapse painted cells → one schedule per kind (min hour → max hour+1)
      const byKind = new Map<Block["kind"], Block[]>();
      for (const b of blocks) {
        const arr = byKind.get(b.kind) ?? [];
        arr.push(b);
        byKind.set(b.kind, arr);
      }
      await fetch("/api/schedules/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: activeDevice }),
      });
      for (const [k, arr] of byKind) {
        const days = [...new Set(arr.map((x) => x.day))].sort();
        const hours = arr.map((x) => x.hour);
        const start = `${String(Math.min(...hours)).padStart(2, "0")}:00`;
        const end = `${String(Math.max(...hours) + 1).padStart(2, "0")}:00`;
        await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: activeDevice, label: k[0].toUpperCase() + k.slice(1), days, start, end }),
        });
      }
      pushToast("Schedule synced — applies on next device poll");
    } catch {
      pushToast("Save failed — is the server running?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-extrabold">Visual schedule builder</div>
        <select
          value={activeDevice}
          onChange={(e) => setDeviceId(e.target.value)}
          className="rounded-lg border border-[#E7E1D1] bg-white px-2 py-1.5 text-xs font-bold"
        >
          {devices.length === 0 && <option value="">No devices paired</option>}
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.childName} · {d.label}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(["bedtime", "school", "homework"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                kind === k ? "bg-[#083B2A] text-white" : "bg-[#F0EBDB] text-[#083B2A]"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-[#64756B]">
        Click cells to paint <b className="capitalize">{kind}</b> blocks. Saving replaces this device&apos;s schedules.
      </p>
      <div className="mt-3 overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[44px_repeat(7,1fr)] gap-1">
          <div />
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-[#64756B]">
              {d}
            </div>
          ))}
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="pr-1 text-right text-[10px] leading-7 text-[#8A9A90]">{h}:00</div>
              {DAYS.map((_, d) => {
                const b = blocks.find((x) => x.day === d && x.hour === h);
                return (
                  <button
                    key={`${d}-${h}`}
                    onClick={() => toggle(d, h)}
                    title={`${DAYS[d]} ${h}:00`}
                    className={`h-7 rounded-md border text-[9px] font-bold transition ${
                      b ? KIND_COLOR[b.kind] + " border-transparent" : "border-[#EFEAD9] bg-[#FAF8F0] hover:border-[#0C5B40]"
                    }`}
                  >
                    {b ? b.kind[0].toUpperCase() : ""}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[#64756B]">{blocks.length} blocks painted</span>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-[#0C5B40] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save & sync"}
        </button>
      </div>
    </Card>
  );
}

const TILE_COLORS = ["#C0392B", "#2F6FED", "#1d9e66", "#5b7f2a", "#7a4fb5", "#b5711f"];

export function AppLimits() {
  const { children, limits, setAppLimit, pushToast, refresh } = useChebe();
  const byChild = useMemo(() => {
    const m = new Map<string, { name: string; limits: typeof limits }>();
    for (const c of children) m.set(c.id, { name: c.name, limits: [] });
    for (const l of limits) m.get(l.childId)?.limits.push(l);
    return [...m.entries()];
  }, [children, limits]);

  if (children.length === 0) {
    return (
      <Card>
        <div className="font-extrabold">App & category limits</div>
        <div className="text-xs text-[#64756B]">Pair a device first — limits attach to a child profile.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="font-extrabold">App & category limits</div>
      <p className="text-xs text-[#64756B]">Changes save immediately · blocks automatically at limit.</p>
      <div className="mt-2 divide-y divide-[#EFEAD9]">
        {byChild.map(([childId, g]) =>
          g.limits.length === 0 ? (
            <div key={childId} className="py-2.5 text-xs text-[#64756B]">
              <b>{g.name}</b> — no limits yet. Ask the assistant to “block YouTube”.
            </div>
          ) : (
            g.limits.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-extrabold text-white"
                  style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
                >
                  {a.label[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <b className="truncate">
                      {a.label} <span className="font-normal text-[#8A9A90]">· {g.name}</span>
                    </b>
                    <span className="shrink-0 text-xs text-[#64756B]">{a.limitMins} min/day</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={180}
                    value={a.limitMins}
                    onChange={(e) => setAppLimit(childId, a.pkg, Number(e.target.value))}
                    className="mt-1 w-full accent-[#0C5B40]"
                  />
                  <div className="font-mono text-[11px] text-[#64756B]">{a.pkg}</div>
                </div>
              </div>
            ))
          )
        )}
      </div>
      <button
        onClick={() => {
          refresh();
          pushToast("Limits reloaded from server");
        }}
        className="mt-2 w-full rounded-xl bg-[#F0EBDB] py-2.5 text-[13px] font-bold text-[#083B2A]"
      >
        Reload from server
      </button>
    </Card>
  );
}

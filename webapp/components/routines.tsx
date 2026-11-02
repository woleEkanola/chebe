"use client";

import { useState } from "react";
import { Card } from "./chrome";
import { useChebe } from "@/lib/store";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

type Block = { day: number; hour: number; kind: "bedtime" | "school" | "homework" };

const KIND_COLOR: Record<Block["kind"], string> = {
  bedtime: "bg-[#083B2A] text-white",
  school: "bg-[#2F6FED] text-white",
  homework: "bg-[#D99A1F] text-white",
};

export function ScheduleBuilder() {
  const { pushToast } = useChebe();
  const [kind, setKind] = useState<Block["kind"]>("bedtime");
  const [blocks, setBlocks] = useState<Block[]>([
    { day: 0, hour: 20, kind: "bedtime" },
    { day: 1, hour: 20, kind: "bedtime" },
    { day: 2, hour: 20, kind: "bedtime" },
    { day: 3, hour: 20, kind: "bedtime" },
    { day: 4, hour: 20, kind: "bedtime" },
    { day: 0, hour: 8, kind: "school" },
    { day: 1, hour: 8, kind: "school" },
    { day: 2, hour: 8, kind: "school" },
  ]);

  const toggle = (day: number, hour: number) => {
    setBlocks((b) => {
      const i = b.findIndex((x) => x.day === day && x.hour === hour);
      if (i >= 0) return b.filter((_, j) => j !== i);
      return [...b, { day, hour, kind }];
    });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-extrabold">Visual schedule builder</div>
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
        Click cells to paint <b className="capitalize">{kind}</b> blocks. Syncs to device for offline enforcement.
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
            <>
              <div key={`h-${h}`} className="pr-1 text-right text-[10px] leading-7 text-[#8A9A90]">
                {h}:00
              </div>
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
            </>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[#64756B]">{blocks.length} blocks · Bedtime 21:00–07:00 Mon–Fri default</span>
        <button
          onClick={() => pushToast("Schedule synced to devices (offline-safe)")}
          className="rounded-xl bg-[#0C5B40] px-4 py-2 text-[13px] font-bold text-white"
        >
          Save & sync
        </button>
      </div>
    </Card>
  );
}

export function AppLimits() {
  const { apps, setAppLimit, pushToast } = useChebe();
  return (
    <Card>
      <div className="font-extrabold">App & category limits</div>
      <p className="text-xs text-[#64756B]">Discovered on Alex&apos;s Galaxy A14 · blocks automatically at limit.</p>
      <div className="mt-2 divide-y divide-[#EFEAD9]">
        {apps.map((a) => (
          <div key={a.id} className="flex items-center gap-3 py-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-extrabold text-white" style={{ background: a.color }}>
              {a.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <b className="truncate">
                  {a.name} {a.monitored && <span className="ml-1 rounded bg-[#E7EFFE] px-1.5 py-0.5 text-[10px] text-[#2F6FED]">text-chat monitored</span>}
                </b>
                <span className="shrink-0 text-xs text-[#64756B]">{a.limitMins} min/day</span>
              </div>
              <input
                type="range"
                min={0}
                max={180}
                value={a.limitMins}
                onChange={(e) => setAppLimit(a.id, Number(e.target.value))}
                className="mt-1 w-full accent-[#0C5B40]"
              />
              <div className="text-[11px] text-[#64756B]">
                {a.usedMins} of {a.limitMins} min used
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => pushToast("Limits pushed to device")}
        className="mt-2 w-full rounded-xl bg-[#F0EBDB] py-2.5 text-[13px] font-bold text-[#083B2A]"
      >
        Apply limits
      </button>
    </Card>
  );
}

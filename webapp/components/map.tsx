"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Card } from "./chrome";
import { children } from "@/lib/mock";
import "leaflet/dist/leaflet.css";

const MapInner = dynamic(() => import("./map-inner"), { ssr: false });

export function MapSection() {
  const [radius, setRadius] = useState(200);
  const [activeChild, setActiveChild] = useState(children[0].id);
  const child = useMemo(() => children.find((c) => c.id === activeChild)!, [activeChild]);
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <Card className="!p-2">
        <div className="h-[420px] overflow-hidden rounded-xl">
          <MapInner lat={child.lat} lng={child.lng} radius={radius} name={child.name} />
        </div>
      </Card>
      <div className="space-y-3">
        <Card>
          <div className="font-extrabold">Children</div>
          <div className="mt-2 space-y-1.5">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChild(c.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${
                  c.id === activeChild ? "bg-[#083B2A] text-white" : "bg-[#F6F4EC] text-[#42524a]"
                }`}
              >
                <span>
                  {c.name} · {c.age}
                </span>
                <span className="text-xs opacity-70">±{c.accuracyM}m · {c.updatedAgo}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="font-extrabold">Geofence · Home</div>
          <div className="mt-1 text-xs text-[#64756B]">Entry / exit triggers instant push.</div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <b>Radius</b>
            <span className="text-xs text-[#64756B]">{radius} m</span>
          </div>
          <input type="range" min={100} max={500} step={10} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-1 w-full accent-[#0C5B40]" />
          <div className="mt-1 text-[11px] text-[#64756B]">Min 100 m to avoid GPS drift flapping · dwell 2 min.</div>
        </Card>
        <Card>
          <div className="font-extrabold">Emergency SOS</div>
          <div className="text-xs text-[#64756B]">Idle · bypasses locks · overrides DND.</div>
          <button
            onClick={() => alert("SOS drill push sent (DND override)")}
            className="mt-2 w-full rounded-xl bg-[#F0EBDB] py-2.5 text-[13px] font-bold text-[#083B2A]"
          >
            Send test push
          </button>
        </Card>
      </div>
    </div>
  );
}

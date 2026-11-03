"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card } from "./chrome";
import { timeAgo, useChebe } from "@/lib/store";
import "leaflet/dist/leaflet.css";

const MapInner = dynamic(() => import("./map-inner"), { ssr: false });

const FALLBACK = { lat: 6.5244, lng: 3.3792 };

export function MapSection() {
  const { children, geofences, loading, pushToast } = useChebe();
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const [radius, setRadius] = useState(200);

  const child = useMemo(
    () => children.find((c) => c.id === activeChild) ?? children[0] ?? null,
    [children, activeChild]
  );

  useEffect(() => {
    const home = geofences.find((g) => g.label.toLowerCase() === "home") ?? geofences[0];
    if (home) setRadius(home.radiusM);
  }, [geofences]);

  if (loading && children.length === 0) {
    return (
      <Card>
        <div className="animate-pulse text-sm text-[#64756B]">Loading map…</div>
      </Card>
    );
  }
  if (!child) {
    return (
      <Card>
        <div className="font-extrabold">No children yet</div>
        <div className="text-xs text-[#64756B]">Add a profile and pair a device to track location.</div>
      </Card>
    );
  }

  const loc = child.locations[0];
  const lat = loc?.lat ?? FALLBACK.lat;
  const lng = loc?.lng ?? FALLBACK.lng;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <Card className="!p-2">
        <div className="h-[420px] overflow-hidden rounded-xl">
          <MapInner lat={lat} lng={lng} radius={radius} name={child.name} />
        </div>
      </Card>
      <div className="space-y-3">
        <Card>
          <div className="font-extrabold">Children</div>
          <div className="mt-2 space-y-1.5">
            {children.map((c) => {
              const l = c.locations[0];
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveChild(c.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${
                    c.id === (activeChild ?? children[0]?.id) ? "bg-[#083B2A] text-white" : "bg-[#F6F4EC] text-[#42524a]"
                  }`}
                >
                  <span>
                    {c.name} · {c.age}
                  </span>
                  <span className="text-xs opacity-70">
                    {l ? `±${Math.round(l.accuracyM)}m · ${timeAgo(l.recordedAt)}` : "no fix yet"}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
        <Card>
          <div className="font-extrabold">Geofence · Home</div>
          <div className="mt-1 text-xs text-[#64756B]">
            {geofences.length > 0
              ? `Saved: ${geofences.map((g) => `${g.label} (${g.radiusM}m)`).join(" · ")}`
              : "No zones saved yet — set one below."}{" "}
            Circle below is a preview; manage zones in Routines v1.1.
          </div>
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
            onClick={() => pushToast("SOS drill: alert the child to hold SOS on their device")}
            className="mt-2 w-full rounded-xl bg-[#F0EBDB] py-2.5 text-[13px] font-bold text-[#083B2A]"
          >
            Send test push
          </button>
        </Card>
      </div>
    </div>
  );
}

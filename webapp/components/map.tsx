"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card } from "./chrome";
import { timeAgo, useChebe } from "@/lib/store";
import "leaflet/dist/leaflet.css";

const MapInner = dynamic(() => import("./map-inner"), { ssr: false });

const FALLBACK = { lat: 6.5244, lng: 3.3792 };

export function MapSection() {
  const { children, geofences, loading, pushToast, refresh } = useChebe();
  const [activeChild, setActiveChild] = useState<string | null>(null);
  const [radius, setRadius] = useState(200);
  const [pick, setPick] = useState<{ lat: number; lng: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const [label, setLabel] = useState("Home");
  const [saving, setSaving] = useState(false);

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

  const saveZone = async (usePicked: boolean) => {
    const base = usePicked && pick ? pick : loc ? { lat: loc.lat, lng: loc.lng } : null;
    if (!base) {
      pushToast("No location to anchor the zone — pick a point on the map.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || "Zone", lat: base.lat, lng: base.lng, radiusM: radius }),
      });
      if (!res.ok) throw new Error("Save failed.");
      setPick(null);
      setPicking(false);
      pushToast(`Zone saved — entry/exit pushes active`);
      refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const removeZone = async (id: string) => {
    try {
      const res = await fetch(`/api/geofences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      pushToast("Zone removed");
      refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <Card className="!p-2">
        <div className="h-[420px] overflow-hidden rounded-xl">
          <MapInner
            lat={lat}
            lng={lng}
            radius={radius}
            name={child.name}
            pick={pick}
            onPick={picking ? (a, b) => setPick({ lat: a, lng: b }) : undefined}
          />
        </div>
        {picking && <div className="px-1 pt-2 text-xs font-bold text-[#0C5B40]">Picking mode — click anywhere on the map to anchor the zone.</div>}
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
          <div className="font-extrabold">Safe zones</div>
          <div className="mt-1 text-xs text-[#64756B]">Entry / exit triggers a push on next device sync.</div>
          <div className="mt-2 space-y-1.5">
            {geofences.length === 0 && <div className="text-xs text-[#64756B]">No zones yet.</div>}
            {geofences.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl bg-[#F6F4EC] px-3 py-2 text-[13px]">
                <span className="font-semibold">{g.label} <span className="font-normal text-[#64756B]">· {g.radiusM}m</span></span>
                <button onClick={() => removeZone(g.id)} className="text-xs font-bold text-[#B3261E]">Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Zone name" className="w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2 text-sm outline-none focus:border-[#0C5B40]" />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <b>Radius</b>
            <span className="text-xs text-[#64756B]">{radius} m</span>
          </div>
          <input type="range" min={100} max={500} step={10} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-1 w-full accent-[#0C5B40]" />
          <div className="mt-1 text-[11px] text-[#64756B]">Min 100 m to avoid GPS drift flapping · dwell 2 min.</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setPicking((p) => !p)} className={`rounded-xl py-2.5 text-[13px] font-bold ${picking ? "bg-[#083B2A] text-white" : "bg-[#F0EBDB] text-[#083B2A]"}`}>
              {picking ? "Picking… tap map" : "Pick on map"}
            </button>
            <button onClick={() => saveZone(!!pick)} disabled={saving} className="rounded-xl bg-[#0C5B40] py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
              {saving ? "Saving…" : pick ? "Save picked zone" : "Save at child"}
            </button>
          </div>
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

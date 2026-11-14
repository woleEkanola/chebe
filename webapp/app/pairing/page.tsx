"use client";

import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/shell";
import { Topbar, Card } from "@/components/chrome";
import { deviceOnline, timeAgo, useChebe } from "@/lib/store";

export default function PairingPage() {
  const { pushToast, children, refresh } = useChebe();
  const [code, setCode] = useState("------");
  const [entered, setEntered] = useState("");
  const [linked, setLinked] = useState(false);
  const [linkedLabel, setLinkedLabel] = useState("");
  const [newDevice, setNewDevice] = useState<string | null>(null);
  const knownDevices = useRef<Set<string> | null>(null);

  const devices = children.flatMap((c) => c.devices.map((d) => ({ ...d, childName: c.name })));

  // Live device list: seed on first load, then announce anything new —
  // including links made from the desktop client on this same page.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (knownDevices.current === null) {
      knownDevices.current = new Set(devices.map((d) => d.id));
      return;
    }
    for (const d of devices) {
      if (!knownDevices.current.has(d.id)) {
        knownDevices.current.add(d.id);
        setNewDevice(d.label);
        setLinked(true);
        setLinkedLabel(d.label);
        pushToast(`Device linked: ${d.label} (${d.platform})`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  const regen = async () => {
    try {
      const res = await fetch("/api/pairing/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCode(data.code);
      pushToast("New pairing code generated (5-min TTL)");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Backend not migrated? See README.");
    }
  };

  useEffect(() => {
    regen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const link = async () => {
    try {
      const res = await fetch("/api/pairing/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: entered, platform: "windows", label: "Test device" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Link failed");
      setLinked(true);
      setLinkedLabel(data.device?.label ?? "Device");
      pushToast("Device linked to your family tenant");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Link failed.");
    }
  };

  return (
    <Shell>
      <Topbar title="Pair a device" sub="Temporary 6-digit code binds a Windows laptop or mobile app to your family." />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="text-xs font-bold uppercase tracking-wider text-[#64756B]">Your pairing code</div>
          <div className="mt-1 font-mono text-4xl font-extrabold tracking-[0.2em]">{code}</div>
          <div className="mt-1 text-xs text-[#64756B]">Expires in 4:32 · single use · tenant-scoped</div>
          <div className="mt-3 flex gap-2">
            <button onClick={regen} className="flex-1 rounded-xl bg-[#0C5B40] py-2.5 text-sm font-bold text-white">Generate new code</button>
            <button onClick={() => { navigator.clipboard?.writeText(code).catch(() => {}); pushToast("Code copied"); }} className="rounded-xl bg-[#F0EBDB] px-4 py-2.5 text-sm font-bold text-[#083B2A]">Copy</button>
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-[#42524a]">
            <li>On the child&apos;s Windows laptop, open Chebe and choose “Link device”.</li>
            <li>Enter the code above.</li>
            <li>Device appears in your Family grid instantly.</li>
          </ol>
        </Card>
        <Card>
          <div className="font-extrabold">Simulate child device</div>
          <div className="text-xs text-[#64756B]">Type the code as the Windows client would send it.</div>
          <div className="mt-2 flex gap-2">
            <input value={entered} onChange={(e) => setEntered(e.target.value)} placeholder="e.g. 482-913" className="flex-1 rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2.5 font-mono text-sm outline-none focus:border-[#0C5B40]" />
            <button onClick={link} className="rounded-xl bg-[#C9F16F] px-4 py-2.5 text-sm font-extrabold text-[#1C3405]">Link</button>
          </div>
          {linked && <div className="mt-2 rounded-xl bg-[#E3EFE7] p-3 text-sm font-semibold text-[#083B2A]">✓ Linked — “{linkedLabel}” bound to family tenant.</div>}
        </Card>
        <Card>
          <div className="font-extrabold">Linked devices</div>
          <div className="text-xs text-[#64756B]">Updates live — desktop links appear here without refresh.</div>
          {newDevice && <div className="mt-2 rounded-xl bg-[#E3EFE7] p-3 text-sm font-semibold text-[#083B2A]">✓ New device linked — “{newDevice}”.</div>}
          <div className="mt-2 space-y-2">
            {devices.length === 0 && <div className="text-sm text-[#64756B]">No devices yet — pair one above or from the Windows app.</div>}
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#F6F4EC] p-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-bold">{d.label} · {d.platform}</div>
                  <div className="text-xs text-[#64756B]">{d.childName} · last sync {timeAgo(d.lastSeenAt)}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${deviceOnline(d) ? "bg-[#E3EFE7] text-[#083B2A]" : "bg-[#F0EBDB] text-[#64756B]"}`}>
                  ● {deviceOnline(d) ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

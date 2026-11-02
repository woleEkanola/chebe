"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { Topbar, Card } from "@/components/chrome";
import { pairingCode } from "@/lib/mock";
import { useChebe } from "@/lib/store";

export default function PairingPage() {
  const { pushToast } = useChebe();
  const [code, setCode] = useState(pairingCode);
  const [entered, setEntered] = useState("");
  const [linked, setLinked] = useState(false);

  const regen = () => {
    const c = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    setCode(c);
    pushToast("New pairing code generated (5-min TTL)");
  };

  const link = () => {
    if (entered.replace(/\D/g, "").length >= 6) {
      setLinked(true);
      pushToast("Device linked to your family tenant");
    } else {
      pushToast("Enter the 6-digit code shown on the child device");
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
          {linked && <div className="mt-2 rounded-xl bg-[#E3EFE7] p-3 text-sm font-semibold text-[#083B2A]">✓ Linked — “Alex's Laptop” bound to family tenant.</div>}
        </Card>
      </div>
    </Shell>
  );
}

"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { Topbar, Card } from "@/components/chrome";
import { useChebe } from "@/lib/store";

export default function ChildrenPage() {
  const { children, loading, pushToast, refresh } = useChebe();
  const [name, setName] = useState("");
  const [age, setAge] = useState("10");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), age: Number(age) || 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed.");
      setName("");
      pushToast("Child profile created — pair a device next");
      refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, label: string) => {
    try {
      const res = await fetch(`/api/children/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Remove failed.");
      pushToast(`${label} removed`);
      refresh();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Remove failed.");
    }
  };

  return (
    <Shell>
      <Topbar title="Children" sub="Distinct profiles with tailored rules per child." />
      <div className="grid gap-3 md:grid-cols-2">
        {loading && children.length === 0 && (
          <Card>
            <div className="animate-pulse text-sm text-[#64756B]">Loading…</div>
          </Card>
        )}
        {children.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0C5B40] text-lg font-extrabold text-[#C9F16F]">{c.name[0]}</div>
              <div>
                <div className="font-extrabold">{c.name} · {c.age}</div>
                <div className="text-xs text-[#64756B]">
                  {c.devices.length > 0 ? c.devices.map((d) => d.label).join(" · ") : "No device paired"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => remove(c.id, c.name)} className="flex-1 rounded-xl border border-[#E7E1D1] py-2 text-[13px] font-bold text-[#B3261E]">Remove</button>
            </div>
          </Card>
        ))}
        <Card>
          <div className="font-extrabold">Add child profile</div>
          <div className="mt-2 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2 text-sm outline-none focus:border-[#0C5B40]" />
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" inputMode="numeric" className="w-20 rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2 text-sm outline-none focus:border-[#0C5B40]" />
          </div>
          <button onClick={add} disabled={busy} className="mt-2 w-full rounded-xl bg-[#0C5B40] py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? "Creating…" : "Create profile"}
          </button>
        </Card>
      </div>
    </Shell>
  );
}

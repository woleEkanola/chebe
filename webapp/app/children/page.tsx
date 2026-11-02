"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { Topbar, Card } from "@/components/chrome";
import { children as seed } from "@/lib/mock";
import { useChebe } from "@/lib/store";

export default function ChildrenPage() {
  const { pushToast } = useChebe();
  const [kids, setKids] = useState(seed);
  const [name, setName] = useState("");
  const [age, setAge] = useState("10");

  const add = () => {
    if (!name.trim()) return;
    setKids((k) => [
      ...k,
      { id: name.toLowerCase(), name: name.trim(), age: Number(age) || 10, device: "Unpaired device", status: "offline" as const, battery: 100, activeApp: "—", scheduleMode: "Free Time", screenTimeToday: "0m", screenTimeMins: 0, lat: 6.5244, lng: 3.3792, accuracyM: 0, updatedAgo: "never", policyVersion: 1 },
    ]);
    setName("");
    pushToast("Child profile created — pair a device next");
  };

  return (
    <Shell>
      <Topbar title="Children" sub="Distinct profiles with tailored rules per child." />
      <div className="grid gap-3 md:grid-cols-2">
        {kids.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0C5B40] text-lg font-extrabold text-[#C9F16F]">{c.name[0]}</div>
              <div>
                <div className="font-extrabold">{c.name} · {c.age}</div>
                <div className="text-xs text-[#64756B]">{c.device}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => pushToast(`Editing ${c.name} (mock)`)} className="flex-1 rounded-xl bg-[#F0EBDB] py-2 text-[13px] font-bold text-[#083B2A]">Edit</button>
              <button onClick={() => { setKids((k) => k.filter((x) => x.id !== c.id)); pushToast(`${c.name} removed`); }} className="flex-1 rounded-xl border border-[#E7E1D1] py-2 text-[13px] font-bold text-[#B3261E]">Remove</button>
            </div>
          </Card>
        ))}
        <Card>
          <div className="font-extrabold">Add child profile</div>
          <div className="mt-2 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2 text-sm outline-none focus:border-[#0C5B40]" />
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" inputMode="numeric" className="w-20 rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2 text-sm outline-none focus:border-[#0C5B40]" />
          </div>
          <button onClick={add} className="mt-2 w-full rounded-xl bg-[#0C5B40] py-2.5 text-sm font-bold text-white">Create profile</button>
        </Card>
      </div>
    </Shell>
  );
}

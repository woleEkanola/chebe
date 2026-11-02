"use client";

import { Shell } from "@/components/shell";
import { Topbar, Card } from "@/components/chrome";
import { ScheduleBuilder, AppLimits } from "@/components/routines";
import { useChebe } from "@/lib/store";

export default function RoutinesPage() {
  const { grantBonus, bonusLog } = useChebe();
  return (
    <Shell>
      <Topbar title="Schedules & limits" sub="Enforced on-device, even offline." />
      <div className="grid gap-3 lg:grid-cols-2">
        <ScheduleBuilder />
        <div className="space-y-3">
          <AppLimits />
          <Card>
            <div className="font-extrabold">Habit rewards</div>
            <div className="text-xs text-[#64756B]">Manual bonus only in v1. Bonus never overrides Bedtime.</div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => grantBonus(15)} className="rounded-xl bg-[#C9F16F] px-4 py-2 text-[13px] font-extrabold text-[#1C3405]">+15 min</button>
              <button onClick={() => grantBonus(30)} className="rounded-xl bg-[#C9F16F] px-4 py-2 text-[13px] font-extrabold text-[#1C3405]">+30 min</button>
            </div>
            <div className="mt-2 text-xs text-[#64756B]">{bonusLog}</div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

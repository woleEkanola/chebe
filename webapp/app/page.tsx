"use client";

import { Sidebar, Topbar, Toasts } from "@/components/chrome";
import { AlertFeed, FamilyGrid, GlobalPause, ScreenTimeCard, WeeklyCard } from "@/components/family";
import { useChebe } from "@/lib/store";

export default function Home() {
  const { toasts, dismissToast, userName, children, alerts } = useChebe();
  const open = alerts.filter((a) => a.status === "open").length;
  const names = children.map((c) => c.name).join(" & ") || "your family";
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
        <Topbar
          title={`Good evening, ${userName}.`}
          sub={`${names} · ${open === 0 ? "all quiet" : `${open} item${open === 1 ? "" : "s"} need${open === 1 ? "s" : ""} review`}.`}
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <GlobalPause />
            <FamilyGrid />
            <div className="grid gap-3 sm:grid-cols-2">
              <ScreenTimeCard />
              <WeeklyCard />
            </div>
          </div>
          <div>
            <AlertFeed compact />
          </div>
        </div>
      </main>
      <Toasts items={toasts} onDismiss={dismissToast} />
    </div>
  );
}

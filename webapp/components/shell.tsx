"use client";

import { Sidebar, Toasts } from "./chrome";
import { useChebe } from "@/lib/store";
import { SosBanner } from "./family";

export function Shell({ children }: { children: React.ReactNode }) {
  const { toasts, dismissToast } = useChebe();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
        <SosBanner />
        {children}
      </main>
      <Toasts items={toasts} onDismiss={dismissToast} />
    </div>
  );
}

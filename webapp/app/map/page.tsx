"use client";

import { Shell } from "@/components/shell";
import { Topbar } from "@/components/chrome";
import { MapSection } from "@/components/map";

export default function MapPage() {
  return (
    <Shell>
      <Topbar title="Family map" sub="Live · updates every 30–60s when this tab is active." />
      <MapSection />
    </Shell>
  );
}

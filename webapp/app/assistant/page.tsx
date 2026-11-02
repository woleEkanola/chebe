"use client";

import { Shell } from "@/components/shell";
import { Topbar } from "@/components/chrome";
import { ChatBox } from "@/components/assistant";
import { AlertFeed, WeeklyCard } from "@/components/family";

export default function AssistantPage() {
  return (
    <Shell>
      <Topbar title="Ask Chebe" sub="Natural-language control + weekly digests. Every action has Undo." />
      <div className="grid gap-3 lg:grid-cols-2">
        <ChatBox />
        <div className="space-y-3">
          <WeeklyCard />
          <AlertFeed />
        </div>
      </div>
    </Shell>
  );
}

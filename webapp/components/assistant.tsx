"use client";

import { useState } from "react";
import { Card } from "./chrome";
import { useChebe } from "@/lib/store";

const SUGS = ["Where is Alex?", "Block YouTube today", "Pause everything", "Set bedtime 9pm", "Summarize today"];

export function ChatBox() {
  const { messages, sendChat } = useChebe();
  const [val, setVal] = useState("");
  const submit = () => {
    sendChat(val);
    setVal("");
  };
  return (
    <Card>
      <div className="font-extrabold">Ask Chebe</div>
      <div className="text-xs text-[#64756B]">Acts on your words — every action has Undo.</div>
      <div className="mt-3 flex max-h-[380px] flex-col gap-2 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
              m.who === "me"
                ? "self-end rounded-br-md bg-[#083B2A] text-white"
                : "self-start rounded-bl-md border border-[#E7E1D1] bg-white"
            }`}
            dangerouslySetInnerHTML={{ __html: m.html }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGS.map((s) => (
          <button
            key={s}
            onClick={() => sendChat(s)}
            className="rounded-full border border-[#E7E1D1] bg-white px-3 py-1.5 text-xs font-bold text-[#083B2A] hover:bg-[#F0EBDB]"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Try: set bedtime 9pm…"
          className="flex-1 rounded-xl border-[1.5px] border-[#E7E1D1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0C5B40]"
        />
        <button onClick={submit} className="rounded-xl bg-[#0C5B40] px-4 py-2.5 text-sm font-bold text-white">
          Send
        </button>
      </div>
    </Card>
  );
}

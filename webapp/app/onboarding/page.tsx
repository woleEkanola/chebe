"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChebe } from "@/lib/store";

export default function Onboarding() {
  const { children, pushToast, refresh } = useChebe();
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState("");

  const addChild = async () => {
    if (!childName.trim()) return;
    const age = Number(childAge);
    if (!age || age < 6 || age > 16) {
      setErr("Please enter a valid age between 6 and 16.");
      return;
    }
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: childName.trim(), age }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create child");
      setChildName("");
      setChildAge("");
      setErr("");
      setStep(2);
      await refresh();
      pushToast("Child profile created");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create child");
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    setErr("");
    try {
      const res = await fetch("/api/pairing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate code");
      setPairingCode(data.code);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  if (step === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E7E1D1] bg-white p-6 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0C5B40] font-extrabold text-[#C9F16F]">c</div>
            <b className="text-lg tracking-tight">chebe</b>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Welcome to Chebe</h1>
          <p className="mt-2 text-sm text-[#64756B]">
            Set up your family in three quick steps: add your child, pair their device, and set up safety rules.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-6 w-full rounded-xl bg-[#0C5B40] py-3 text-sm font-bold text-white"
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E7E1D1] bg-white p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0C5B40] font-extrabold text-[#C9F16F]">c</div>
            <b className="text-lg tracking-tight">chebe</b>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Add your child</h2>
          <p className="text-sm text-[#64756B] mb-4">Create a profile so you can set rules and see location.</p>
          <label className="mt-2 block text-xs font-bold text-[#42524a]">Name</label>
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Alex"
            className="mt-1 w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2.5 text-sm outline-none focus:border-[#0C5B40]"
          />
          <label className="mt-3 block text-xs font-bold text-[#42524a]">Age (6&ndash;16)</label>
          <input
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            placeholder="e.g. 11"
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2.5 text-sm outline-none focus:border-[#0C5B40]"
          />
          {err && <div className="mt-2 text-[13px] font-semibold text-[#B3261E]">{err}</div>}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setStep(0)}
              className="flex-1 rounded-xl border border-[#E7E1D1] py-2.5 text-[13px] font-bold text-[#42524a]"
            >
              Back
            </button>
            <button
              onClick={addChild}
              className="flex-1 rounded-xl bg-[#0C5B40] py-2.5 text-[13px] font-bold text-white"
            >
              Create child
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E7E1D1] bg-white p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0C5B40] font-extrabold text-[#C9F16F]">c</div>
            <b className="text-lg tracking-tight">chebe</b>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Pair a device</h2>
          <p className="text-sm text-[#64756B] mb-4">
            Generate a pairing code and enter it on your child&rsquo;s Windows laptop or Android device to link them to your family.
          </p>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={generateCode}
                disabled={generating}
                className="flex-1 rounded-xl bg-[#0C5B40] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {generating ? "Generating&hellip;" : "Generate pairing code"}
              </button>
            </div>
          </div>
          {pairingCode && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#64756B]">Your pairing code</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1 font-mono text-2xl font-bold text-center bg-[#F6F4EC] rounded-xl border border-[#E7E1D1] px-4 py-3">
                  {pairingCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(pairingCode);
                    pushToast("Code copied");
                  }}
                  className="rounded-xl px-3 py-2 text-[13px] font-bold text-[#0C5B40]"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#64756B]">Code expires in 5 minutes &middot; single use</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#64756B]">On your child&rsquo;s device:</p>
            <ol className="text-sm text-[#64756B] mb-4 space-y-1 list-disc pl-4">
              <li>Open the Chebe child app (install it first from chebe.app/child)</li>
              <li>Choose &ldquo;Link device&rdquo;</li>
              <li>Enter the code above</li>
            </ol>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-[#E7E1D1] py-2.5 text-[13px] font-bold text-[#42524a]"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-xl bg-[#0C5B40] py-2.5 text-[13px] font-bold text-white"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 3 (Done)
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E7E1D1] bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0C5B40] font-extrabold text-[#C9F16F]">c</div>
          <b className="text-lg tracking-tight">chebe</b>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">You&rsquo;re all set</h2>
        <p className="text-sm text-[#64756B] mb-4">
          Your family is set up. From the dashboard you can pause devices, set app limits, view the map, and review alerts.
        </p>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#42524a]">Children added:</span>
            <span className="text-xs text-[#17211C]">{children.length}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#42524a]">Pairing code:</span>
            <span className="text-xs text-[#17211C]">{pairingCode || "none generated"}</span>
          </div>
        </div>
        <button
          onClick={() => window.location.href = "/"}
          className="w-full rounded-xl bg-[#0C5B40] py-3 text-sm font-bold text-white"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
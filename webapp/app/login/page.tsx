"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ama@example.com");
  const [pw, setPw] = useState("password123");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "Sign-in failed.");
        return;
      }
      router.push("/");
    } catch {
      setErr("Cannot reach server. Is the backend migrated? See README.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E7E1D1] bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0C5B40] font-extrabold text-[#C9F16F]">c</div>
          <b className="text-lg tracking-tight">chebe</b>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-sm text-[#64756B]">Parent sign-in · session cookie · local Postgres.</p>
        <label className="mt-4 block text-xs font-bold text-[#42524a]">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2.5 text-sm outline-none focus:border-[#0C5B40]" />
        <label className="mt-3 block text-xs font-bold text-[#42524a]">Password</label>
        <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" onKeyDown={(e) => e.key === "Enter" && submit()} className="mt-1 w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2.5 text-sm outline-none focus:border-[#0C5B40]" />
        {err && <div className="mt-2 text-[13px] font-semibold text-[#B3261E]">{err}</div>}
        <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-xl bg-[#0C5B40] py-3 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in →"}
        </button>
        <div className="mt-2 text-center text-xs text-[#64756B]">
          No account? <Link href="/register" className="font-bold text-[#0C5B40] underline">Create one</Link>
        </div>
      </div>
    </div>
  );
}

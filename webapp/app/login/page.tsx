"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("ama@example.com");
  const [pw, setPw] = useState("password123");
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E7E1D1] bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0C5B40] font-extrabold text-[#C9F16F]">c</div>
          <b className="text-lg tracking-tight">chebe</b>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-sm text-[#64756B]">Parent sign-in · MFA supported · mock auth for demo.</p>
        <label className="mt-4 block text-xs font-bold text-[#42524a]">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2.5 text-sm outline-none focus:border-[#0C5B40]" />
        <label className="mt-3 block text-xs font-bold text-[#42524a]">Password</label>
        <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className="mt-1 w-full rounded-xl border-[1.5px] border-[#E7E1D1] px-3 py-2.5 text-sm outline-none focus:border-[#0C5B40]" />
        <Link href="/" className="mt-4 block rounded-xl bg-[#0C5B40] py-3 text-center text-sm font-bold text-white">
          Sign in →
        </Link>
        <div className="mt-2 text-center text-xs text-[#64756B]">No backend yet — any credentials open the dashboard.</div>
      </div>
    </div>
  );
}

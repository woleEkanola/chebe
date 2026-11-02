"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/routines", label: "Routines", icon: "◷" },
  { href: "/map", label: "Map", icon: "◎" },
  { href: "/assistant", label: "Assistant", icon: "✦" },
  { href: "/children", label: "Children", icon: "◍" },
  { href: "/pairing", label: "Pairing", icon: "⛨" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1 border-r border-[#E7E1D1] bg-white/70 p-4 backdrop-blur">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0C5B40] font-extrabold text-[#C9F16F]">c</div>
          <div>
            <div className="text-[17px] font-extrabold tracking-tight text-[#17211C]">chebe</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#64756B]">Parent console</div>
          </div>
        </div>
        {links.map((l) => {
          const active = path === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active ? "bg-[#083B2A] text-white" : "text-[#42524a] hover:bg-[#F0EBDB]"
              }`}
            >
              <span className="w-5 text-center">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
        <div className="mt-auto rounded-xl bg-[#F6F4EC] border border-[#E7E1D1] p-3 text-xs leading-relaxed text-[#64756B]">
          <b className="text-[#083B2A]">Mock mode</b>
          <br />
          UI runs on local mock data. Wire <code>lib/store.tsx</code> to Nest REST + WebSockets for production.
        </div>
      </aside>
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 flex rounded-2xl border border-[#E7E1D1] bg-white/95 p-1.5 shadow-xl backdrop-blur">
        {links.slice(0, 5).map((l) => {
          const active = path === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold ${
                active ? "bg-[#083B2A] text-white" : "text-[#64756B]"
              }`}
            >
              <span className="text-base leading-none">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Topbar({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9A90]">Chebe · Parent web</p>
      <h1 className="text-2xl md:text-[28px] font-extrabold tracking-tight text-[#17211C]">{title}</h1>
      {sub && <p className="mt-1 text-sm text-[#64756B]">{sub}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#E7E1D1] bg-white p-4 shadow-[0_1px_0_rgba(23,33,28,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-[#0C5B40]" : "bg-[#D6D0BB]"}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export function Toasts({ items, onDismiss }: { items: string[]; onDismiss: () => void }) {
  if (!items.length) return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <button
        onClick={onDismiss}
        className="rounded-full bg-[#101915] px-4 py-2.5 text-[13px] font-semibold text-white shadow-xl"
      >
        {items[0]}
      </button>
    </div>
  );
}

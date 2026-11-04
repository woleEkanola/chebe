import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, todayKey, unauth } from "@/lib/server/util";

// GET /api/usage?childId= — today per-app mins + last-7-day totals (all family children if omitted)
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const url = new URL(req.url);
  const childId = url.searchParams.get("childId");

  const kids = await db.child.findMany({
    where: { familyId: user.familyId, ...(childId ? { id: childId } : {}) },
    select: { id: true, name: true },
  });
  if (!kids.length) return ok({ usage: [] });
  const ids = kids.map((k: { id: string }) => k.id);

  const today = todayKey();
  const weekAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const rows = await db.usageDaily.findMany({
    where: { childId: { in: ids }, day: { gte: weekAgo } },
  });

  const usage = kids.map((k: { id: string; name: string }) => {
    const mine = rows.filter((r) => r.childId === k.id);
    const byDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      byDay[d] = 0;
    }
    const byPkg: Record<string, { label: string; mins: number }> = {};
    for (const r of mine) {
      byDay[r.day] = (byDay[r.day] ?? 0) + r.mins;
      if (r.day === today) {
        const cur = byPkg[r.pkg] ?? { label: r.pkg, mins: 0 };
        cur.mins += r.mins;
        byPkg[r.pkg] = cur;
      }
    }
    // Prefer friendly labels from AppLimit rows
    return { childId: k.id, name: k.name, today: byDay[today] ?? 0, week: byDay, top: byPkg };
  });

  return ok({ usage, today });
}

// POST /api/usage { deviceId, entries: [{ pkg, label?, mins, day? }] } — device ledger sync (poll-only)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const deviceId = String(body?.deviceId ?? "");
  const entries = Array.isArray(body?.entries) ? body.entries : [];
  if (!deviceId || entries.length === 0) return bad("deviceId + entries[] required.");
  if (entries.length > 200) return bad("Max 200 entries per sync.");
  const device = await db.device.findUnique({ where: { id: deviceId } });
  if (!device) return bad("Unknown device.", 404);

  const valid = entries
    .map((e: { pkg?: unknown; label?: unknown; mins?: unknown; day?: unknown }) => ({
      pkg: String(e.pkg ?? "").slice(0, 128),
      mins: Math.max(0, Math.min(1440, Math.floor(Number(e.mins) || 0))),
      day: typeof e.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.day) ? e.day : todayKey(),
    }))
    .filter((e: { pkg: string }) => e.pkg.length > 0);
  if (valid.length === 0) return bad("No valid entries (need pkg + mins).");

  await db.$transaction(
    valid.map((e: { pkg: string; mins: number; day: string }) =>
      db.usageDaily.upsert({
        where: { childId_pkg_day: { childId: device.childId, pkg: e.pkg, day: e.day } },
        create: { childId: device.childId, pkg: e.pkg, day: e.day, mins: e.mins },
        update: { mins: e.mins },
      })
    )
  );
  await db.device.update({ where: { id: deviceId }, data: { lastSeenAt: new Date() } }).catch(() => null);
  return ok({ ok: true, count: valid.length });
}

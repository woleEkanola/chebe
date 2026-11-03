import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// GET /api/locations?childId= — latest location per child (or one child)
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const url = new URL(req.url);
  const childId = url.searchParams.get("childId");
  const children = await db.child.findMany({
    where: { familyId: user.familyId, ...(childId ? { id: childId } : {}) },
    include: { locations: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });
  return ok({ children: children.map((c: { id: string; name: string; locations: unknown[] }) => ({ childId: c.id, name: c.name, latest: c.locations[0] ?? null })) });
}

// POST /api/locations { deviceId, lat, lng, accuracyM? } — device batch-inserts (poll-only)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const deviceId = String(body?.deviceId ?? "");
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!deviceId || !Number.isFinite(lat) || !Number.isFinite(lng)) return bad("deviceId, lat, lng required.");
  const device = await db.device.findUnique({ where: { id: deviceId } });
  if (!device) return bad("Unknown device.", 404);
  const loc = await db.location.create({
    data: { childId: device.childId, lat, lng, accuracyM: Number(body?.accuracyM ?? 10) },
  });
  await db.device.update({ where: { id: deviceId }, data: { lastSeenAt: new Date() } }).catch(() => null);
  return ok({ location: loc }, 201);
}

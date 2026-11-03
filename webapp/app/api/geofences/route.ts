import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// GET /api/geofences | POST /api/geofences { label, lat, lng, radiusM }
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  return ok({ geofences: await db.geofence.findMany({ where: { familyId: user.familyId } }) });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => null);
  const label = String(body?.label ?? "").trim() || "Home";
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const radiusM = Math.min(2000, Math.max(50, Number(body?.radiusM ?? 200)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return bad("lat, lng required.");
  const g = await db.geofence.create({ data: { familyId: user.familyId, label, lat, lng, radiusM } });
  return ok({ geofence: g }, 201);
}

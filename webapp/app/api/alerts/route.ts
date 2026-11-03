import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// GET /api/alerts?status=open — family alerts, newest first
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const alerts = await db.alert.findMany({
    where: { familyId: user.familyId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return ok({ alerts });
}

// POST /api/alerts — device/mobile submits a flagged moment (redacted snippet only)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const deviceId = String(body?.deviceId ?? "");
  const kind = String(body?.kind ?? "unknown");
  const title = String(body?.title ?? "Safety flag");
  if (!deviceId) return bad("deviceId is required.");
  const device = await db.device.findUnique({ where: { id: deviceId }, include: { child: true } });
  if (!device) return bad("Unknown device.", 404);
  const alert = await db.alert.create({
    data: {
      familyId: device.child.familyId,
      childId: device.childId,
      severity: String(body?.severity ?? "medium"),
      kind,
      title,
      detail: String(body?.detail ?? ""),
      snippet: body?.snippet ? String(body.snippet) : null,
      guidance: String(body?.guidance ?? ""),
    },
  });
  return ok({ alert }, 201);
}

import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// GET /api/applimits?childId= | PUT /api/applimits { childId, pkg, label?, limitMins }
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const childId = new URL(req.url).searchParams.get("childId");
  const limits = await db.appLimit.findMany({
    where: { child: { familyId: user.familyId }, ...(childId ? { childId } : {}) },
  });
  return ok({ limits });
}

export async function PUT(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => null);
  const child = await db.child.findFirst({ where: { id: String(body?.childId ?? ""), familyId: user.familyId } });
  if (!child) return bad("Child not found.", 404);
  const pkg = String(body?.pkg ?? "").trim();
  const limitMins = Number(body?.limitMins);
  if (!pkg || !Number.isFinite(limitMins) || limitMins < 0 || limitMins > 1440) return bad("pkg + limitMins (0–1440) required.");
  const limit = await db.appLimit.upsert({
    where: { childId_pkg: { childId: child.id, pkg } },
    create: { childId: child.id, pkg, label: String(body?.label ?? pkg), limitMins },
    update: { limitMins, ...(body?.label ? { label: String(body.label) } : {}) },
  });
  await db.device.updateMany({ where: { childId: child.id }, data: { policyVersion: { increment: 1 } } });
  return ok({ limit });
}

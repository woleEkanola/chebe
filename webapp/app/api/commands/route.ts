import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// POST /api/commands { scope: "device"|"child"|"global", id?, action: "pause"|"resume"|"bonus", mins? }
// Poll-only: writes desired state; devices pick it up on next /policy poll (<30s).
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => null);
  const scope = String(body?.scope ?? "global");
  const action = String(body?.action ?? "");
  if (!["pause", "resume", "bonus"].includes(action)) return bad("Unknown action.");

  const childWhere = (childId: string) => ({ id: childId, familyId: user.familyId });

  if (action === "bonus") {
    const mins = Number(body?.mins);
    if (![15, 30].includes(mins)) return bad("Bonus must be +15 or +30.");
    // Bonus never overrides Bedtime — recorded as alert-log entry for audit trail.
    await db.alert.create({
      data: {
        familyId: user.familyId,
        childId: scope === "child" ? String(body?.id ?? "") : undefined,
        severity: "low",
        kind: "bonus",
        title: `Bonus +${mins} min granted`,
        detail: "Manual bonus. Never overrides Bedtime.",
        status: "resolved",
      },
    });
    return ok({ ok: true, action, mins });
  }

  const paused = action === "pause";
  if (scope === "global") {
    await db.device.updateMany({ where: { child: { familyId: user.familyId } }, data: { instantPaused: paused, policyVersion: { increment: 1 } } });
  } else if (scope === "child") {
    const child = await db.child.findFirst({ where: childWhere(String(body?.id ?? "")) });
    if (!child) return bad("Child not found.", 404);
    await db.device.updateMany({ where: { childId: child.id }, data: { instantPaused: paused, policyVersion: { increment: 1 } } });
  } else if (scope === "device") {
    const device = await db.device.findFirst({ where: { id: String(body?.id ?? ""), child: { familyId: user.familyId } } });
    if (!device) return bad("Device not found.", 404);
    await db.device.update({ where: { id: device.id }, data: { instantPaused: paused, policyVersion: { increment: 1 } } });
  } else {
    return bad("Unknown scope.");
  }
  return ok({ ok: true, action, scope });
}

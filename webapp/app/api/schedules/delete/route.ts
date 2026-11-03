import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// DELETE /api/schedules { deviceId, label? } — clear a device's schedules (or one label) before re-saving
export async function DELETE(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => null);
  const device = await db.device.findFirst({
    where: { id: String(body?.deviceId ?? ""), child: { familyId: user.familyId } },
  });
  if (!device) return bad("Device not found.", 404);
  const label = body?.label ? String(body.label) : undefined;
  const res = await db.schedule.deleteMany({ where: { deviceId: device.id, ...(label ? { label } : {}) } });
  await db.device.update({ where: { id: device.id }, data: { policyVersion: { increment: 1 } } });
  return ok({ deleted: res.count });
}

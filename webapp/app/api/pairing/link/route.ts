import { db } from "@/lib/server/db";
import { bad, ok } from "@/lib/server/util";

// POST /api/pairing/link { code, platform?, label, childId? }
// Public: the 6-digit code IS the credential. Binds a device to the family tenant.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const digits = String(body?.code ?? "").replace(/\D/g, "");
  if (digits.length < 6) return bad("Enter the 6-digit code.");
  const rec = await db.pairingCode.findUnique({ where: { code: digits } });
  if (!rec || rec.consumedAt || rec.expiresAt < new Date()) return bad("Invalid or expired code.", 410);

  let childId = rec.childId;
  if (body?.childId) {
    const child = await db.child.findFirst({ where: { id: String(body.childId), familyId: rec.familyId } });
    if (!child) return bad("Child not found.", 404);
    childId = child.id;
  }
  if (!childId) {
    const first = await db.child.findFirst({ where: { familyId: rec.familyId }, orderBy: { createdAt: "asc" } });
    if (!first) return bad("No child profile exists yet — create one first.", 409);
    childId = first.id;
  }

  const device = await db.device.create({
    data: {
      childId,
      platform: String(body?.platform ?? "windows"),
      label: String(body?.label ?? "Device"),
      policyVersion: 1,
    },
  });
  await db.schedule.create({
    data: { deviceId: device.id, label: "Bedtime", days: [0, 1, 2, 3, 4], start: "21:00", end: "07:00", shieldLevel: "full" },
  });
  await db.pairingCode.update({ where: { id: rec.id }, data: { consumedAt: new Date() } });
  return ok({ device: { id: device.id, childId, label: device.label, platform: device.platform } }, 201);
}

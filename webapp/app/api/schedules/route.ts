import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// GET /api/schedules?deviceId= — parent view of schedules
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const deviceId = new URL(req.url).searchParams.get("deviceId");
  const schedules = await db.schedule.findMany({
    where: {
      device: { child: { familyId: user.familyId } },
      ...(deviceId ? { deviceId } : {}),
    },
    orderBy: { start: "asc" },
  });
  return ok({ schedules });
}

// POST /api/schedules { deviceId, label, days, start, end, shieldLevel? }
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => null);
  const device = await db.device.findFirst({
    where: { id: String(body?.deviceId ?? ""), child: { familyId: user.familyId } },
  });
  if (!device) return bad("Device not found.", 404);
  const s = await db.schedule.create({
    data: {
      deviceId: device.id,
      label: String(body?.label ?? "Bedtime"),
      days: Array.isArray(body?.days) ? body.days.map(Number).filter((n: number) => n >= 0 && n <= 6) : [0, 1, 2, 3, 4],
      start: String(body?.start ?? "21:00"),
      end: String(body?.end ?? "07:00"),
      shieldLevel: String(body?.shieldLevel ?? "full"),
    },
  });
  await db.device.update({ where: { id: device.id }, data: { policyVersion: { increment: 1 } } });
  return ok({ schedule: s }, 201);
}

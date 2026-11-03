import { db } from "@/lib/server/db";
import { bad, ok } from "@/lib/server/util";

// GET /api/devices/:id/policy?v=12 — polled by ChebeService/mobile every 15–30s.
// Public to the holder of a device id (device identity = capability). No parent login needed.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const device = await db.device.findUnique({
    where: { id },
    include: { schedules: { where: { enabled: true } }, child: { include: { limits: true } } },
  });
  if (!device) return bad("Unknown device.", 404);
  await db.device.update({ where: { id }, data: { lastSeenAt: new Date() } }).catch(() => null);
  const filter = await db.webFilter.findUnique({ where: { familyId: device.child.familyId } });
  return ok({
    policyVersion: device.policyVersion,
    instantPaused: device.instantPaused,
    schedules: device.schedules,
    appLimits: device.child.limits,
    blocklist: filter?.blocklist ?? [],
    whitelist: filter?.whitelist ?? [],
    blocklistVersion: filter?.version ?? 1,
  });
}

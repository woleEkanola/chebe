import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { ok, unauth } from "@/lib/server/util";

// GET /api/devices — family devices (for dashboard grid + heartbeat monitoring)
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const devices = await db.device.findMany({
    where: { child: { familyId: user.familyId } },
    include: { child: true },
    orderBy: { createdAt: "asc" },
  });
  return ok({ devices });
}

import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// DELETE /api/geofences/:id — remove a saved zone
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const { id } = await ctx.params;
  const g = await db.geofence.findFirst({ where: { id, familyId: user.familyId } });
  if (!g) return bad("Zone not found.", 404);
  await db.geofence.delete({ where: { id } });
  return ok({ ok: true });
}

import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// PATCH /api/alerts/:id { status } — parent reviews/resolves
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = String(body?.status ?? "");
  if (!["open", "reviewed", "resolved"].includes(status)) return bad("Unknown status.");
  const alert = await db.alert.findFirst({ where: { id, familyId: user.familyId } });
  if (!alert) return bad("Alert not found.", 404);
  const updated = await db.alert.update({ where: { id }, data: { status } });
  return ok({ alert: updated });
}

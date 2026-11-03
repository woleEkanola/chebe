import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// DELETE /api/children/:id
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(_req);
  if (!user) return unauth();
  const { id } = await ctx.params;
  const child = await db.child.findFirst({ where: { id, familyId: user.familyId } });
  if (!child) return bad("Child not found.", 404);
  await db.child.delete({ where: { id } });
  return ok({ ok: true });
}

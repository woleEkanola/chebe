import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, newPairingCode, ok, unauth } from "@/lib/server/util";

// POST /api/pairing/generate { childId? } — parent creates a 6-digit code (5-min TTL)
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => ({}));
  const childId = body?.childId ? String(body.childId) : null;
  if (childId) {
    const child = await db.child.findFirst({ where: { id: childId, familyId: user.familyId } });
    if (!child) return bad("Child not found.", 404);
  }
  const code = newPairingCode();
  const rec = await db.pairingCode.create({
    data: {
      code,
      familyId: user.familyId,
      childId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
  return ok({ code: rec.code, expiresAt: rec.expiresAt }, 201);
}

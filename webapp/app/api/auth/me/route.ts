import { requireUser } from "@/lib/server/auth";
import { ok, unauth } from "@/lib/server/util";

// GET /api/auth/me
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  return ok({ user: { id: user.id, email: user.email, name: user.name, familyId: user.familyId } });
}

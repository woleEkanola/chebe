import { db } from "@/lib/server/db";
import { bad, ok } from "@/lib/server/util";
import { createSession, verifyPassword } from "@/lib/server/auth";
import { clientIp, rateLimit } from "@/lib/server/ratelimit";

// POST /api/auth/login { email, password }
export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 10)) return bad("Too many attempts. Try again in a minute.", 429);
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return bad("Wrong email or password.", 401);
  if (!(await verifyPassword(password, user.passwordHash))) return bad("Wrong email or password.", 401);
  await createSession(user.id);
  return ok({ user: { id: user.id, email: user.email, name: user.name, familyId: user.familyId } });
}

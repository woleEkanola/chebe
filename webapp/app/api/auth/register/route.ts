import { db } from "@/lib/server/db";
import { bad, ok } from "@/lib/server/util";
import { createSession, hashPassword } from "@/lib/server/auth";
import { clientIp, rateLimit } from "@/lib/server/ratelimit";

// POST /api/auth/register { email, password, name?, familyName? }
export async function POST(req: Request) {
  if (!rateLimit(`register:${clientIp(req)}`, 5)) return bad("Too many attempts. Try again in a minute.", 429);
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "Parent").trim() || "Parent";
  if (!email.includes("@")) return bad("Enter a valid email.");
  if (password.length < 8) return bad("Password must be at least 8 characters.");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return bad("That email is already registered.", 409);

  const family = await db.family.create({ data: { name: String(body?.familyName ?? "My Family") } });
  const user = await db.user.create({
    data: { email, passwordHash: await hashPassword(password), name, familyId: family.id },
  });
  await db.webFilter.create({ data: { familyId: family.id } });
  await createSession(user.id);
  return ok({ user: { id: user.id, email: user.email, name: user.name, familyId: family.id } }, 201);
}

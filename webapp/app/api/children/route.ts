import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// GET /api/children — family-scoped list with devices + latest location
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const children = await db.child.findMany({
    where: { familyId: user.familyId },
    include: {
      devices: true,
      locations: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });
  return ok({ children });
}

// POST /api/children { name, age }
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const age = Number(body?.age);
  if (!name) return bad("Name is required.");
  if (!Number.isFinite(age) || age < 1 || age > 21) return bad("Age must be 1–21.");
  const child = await db.child.create({ data: { name, age, familyId: user.familyId } });
  return ok({ child }, 201);
}

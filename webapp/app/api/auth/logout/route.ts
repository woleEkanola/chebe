import { clearSession } from "@/lib/server/auth";
import { ok } from "@/lib/server/util";

// POST /api/auth/logout
export async function POST() {
  await clearSession();
  return ok({ ok: true });
}

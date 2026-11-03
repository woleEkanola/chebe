import { runCleanup } from "@/lib/server/cleanup";
import { ok } from "@/lib/server/util";

// GET /api/cron/cleanup — purge expired codes + old locations.
// Hit from Task Scheduler/cron every hour. Optional CRON_SECRET gate.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return ok({ error: "Unauthorized." }, 401);
  }
  return ok(await runCleanup());
}

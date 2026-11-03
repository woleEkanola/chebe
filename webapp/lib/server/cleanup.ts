import { db } from "./db";

// Purge expired/consumed pairing codes + locations older than 30 days.
// Called lazily from pairing/link and via GET /api/cron/cleanup.
export async function runCleanup() {
  const now = new Date();
  const [codes, locations] = await Promise.all([
    db.pairingCode.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { consumedAt: { not: null } }] } }),
    db.location.deleteMany({ where: { recordedAt: { lt: new Date(now.getTime() - 30 * 24 * 3600 * 1000) } } }),
  ]);
  return { pairingCodes: codes.count, locations: locations.count };
}

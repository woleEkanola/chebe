/* Seed demo family (Ama + Alex + Sarah). Run: npx prisma db seed
 * Requires: prisma generate + a running local Postgres + DATABASE_URL
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  await db.alert.deleteMany();
  await db.location.deleteMany();
  await db.usageDaily.deleteMany();
  await db.appLimit.deleteMany();
  await db.schedule.deleteMany();
  await db.device.deleteMany();
  await db.pairingCode.deleteMany();
  await db.geofence.deleteMany();
  await db.webFilter.deleteMany();
  await db.child.deleteMany();
  await db.user.deleteMany();
  await db.family.deleteMany();

  const family = await db.family.create({ data: { name: "Ama's Family" } });
  await db.user.create({
    data: {
      email: "ama@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Ama",
      familyId: family.id,
    },
  });

  const alex = await db.child.create({ data: { name: "Alex", age: 11, familyId: family.id } });
  const sarah = await db.child.create({ data: { name: "Sarah", age: 8, familyId: family.id } });

  const laptop = await db.device.create({
    data: { childId: alex.id, platform: "windows", label: "Alex's Laptop", policyVersion: 12 },
  });
  await db.device.create({
    data: { childId: sarah.id, platform: "android", label: "Galaxy Tab A8", policyVersion: 9 },
  });

  await db.schedule.create({
    data: { deviceId: laptop.id, label: "Bedtime", days: [0, 1, 2, 3, 4], start: "21:00", end: "07:00", shieldLevel: "full" },
  });

  await db.appLimit.createMany({
    data: [
      { childId: alex.id, pkg: "com.google.youtube", label: "YouTube", limitMins: 60 },
      { childId: alex.id, pkg: "com.roblox.client", label: "Roblox", limitMins: 45 },
      { childId: sarah.id, pkg: "org.khankids.app", label: "Khan Kids", limitMins: 90 },
    ],
  });

  await db.alert.createMany({
    data: [
      {
        familyId: family.id, childId: alex.id, severity: "high", kind: "bullying",
        title: "Toxic chat in Roblox", detail: "Text-chat monitor · confidence 0.93.",
        snippet: "…u r trash kid, uninstall or else [redacted]",
        guidance: "“I saw a mean message in your game. Want to block them together?”",
      },
      {
        familyId: family.id, childId: alex.id, severity: "medium", kind: "stranger",
        title: "Unknown number via SMS", detail: "Sender not in approved contacts.",
      },
      {
        familyId: family.id, childId: sarah.id, severity: "low", kind: "webblock",
        title: "Gambling site blocked", detail: "gamble-arcade.example · local filter.",
        status: "reviewed",
      },
    ],
  });

  await db.location.create({
    data: { childId: alex.id, lat: 6.5244, lng: 3.3792, accuracyM: 8 },
  });

  await db.geofence.create({ data: { familyId: family.id, label: "Home", lat: 6.5244, lng: 3.3792, radiusM: 200 } });
  await db.webFilter.create({ data: { familyId: family.id } });
  await db.pairingCode.create({
    data: { code: "482913", familyId: family.id, childId: alex.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) },
  });

  console.log("Seed done: ama@example.com / password123");
}

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });

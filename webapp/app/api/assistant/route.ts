import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { bad, ok, unauth } from "@/lib/server/util";

// POST /api/assistant { message } — 5 real intents against live DB:
// where-is, block/unblock app, pause/resume, set bedtime, summarize.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauth();
  const body = await req.json().catch(() => null);
  const message = String(body?.message ?? "").trim();
  if (!message) return bad("message is required.");
  const s = message.toLowerCase();

  const kids = await db.child.findMany({
    where: { familyId: user.familyId },
    include: {
      devices: true,
      limits: true,
      locations: { orderBy: { recordedAt: "desc" }, take: 1 },
      alerts: { where: { status: "open" }, take: 5 },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!kids.length) return ok({ reply: "No child profiles yet — add one under Children first.", action: null });
  const target = kids.find((k: { name: string }) => s.includes(k.name.toLowerCase())) ?? kids[0];

  // where-is
  if (/where|location|locate/.test(s)) {
    const loc = target.locations[0];
    const reply = loc
      ? `${target.name} was last seen at ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} (±${Math.round(loc.accuracyM)}m). <a class="underline" href="/map">Open map</a>`
      : `No location reports for ${target.name} yet.`;
    return ok({ reply, action: null });
  }

  // block / unblock app
  const appMatch = /(youtube|roblox|minecraft|whatsapp|chrome|tiktok|instagram|fortnite)/.exec(s);
  if (/block|unblock|limit/.test(s) && appMatch) {
    const pkgMap: Record<string, { pkg: string; label: string }> = {
      youtube: { pkg: "com.google.youtube", label: "YouTube" },
      roblox: { pkg: "com.roblox.client", label: "Roblox" },
      minecraft: { pkg: "com.mojang.minecraftpe", label: "Minecraft" },
      whatsapp: { pkg: "com.whatsapp", label: "WhatsApp" },
      chrome: { pkg: "chrome.exe", label: "Chrome" },
      tiktok: { pkg: "com.tiktok.app", label: "TikTok" },
      instagram: { pkg: "com.instagram.app", label: "Instagram" },
      fortnite: { pkg: "fortnite.exe", label: "Fortnite" },
    };
    const app = pkgMap[appMatch[1]];
    if (/unblock/.test(s)) {
      await db.appLimit.deleteMany({ where: { childId: target.id, pkg: app.pkg } });
      await db.device.updateMany({ where: { childId: target.id }, data: { policyVersion: { increment: 1 } } });
      return ok({ reply: `${app.label} limit removed for ${target.name}.`, action: { type: "unblock", childId: target.id, pkg: app.pkg } });
    }
    await db.appLimit.upsert({
      where: { childId_pkg: { childId: target.id, pkg: app.pkg } },
      create: { childId: target.id, pkg: app.pkg, label: app.label, limitMins: 0 },
      update: { limitMins: 0 },
    });
    await db.device.updateMany({ where: { childId: target.id }, data: { policyVersion: { increment: 1 } } });
    return ok({ reply: `${app.label} blocked for ${target.name} today. <span class="opacity-70">Rule applies on next device sync.</span>`, action: { type: "block", childId: target.id, pkg: app.pkg } });
  }

  // pause / resume
  if (/pause/.test(s)) {
    await db.device.updateMany({ where: { childId: target.id }, data: { instantPaused: true, policyVersion: { increment: 1 } } });
    return ok({ reply: `Done — ${target.name}'s devices pause with a 1-minute warning.`, action: { type: "pause", childId: target.id } });
  }
  if (/resume/.test(s)) {
    await db.device.updateMany({ where: { childId: target.id }, data: { instantPaused: false, policyVersion: { increment: 1 } } });
    return ok({ reply: `Done — ${target.name}'s devices resumed.`, action: { type: "resume", childId: target.id } });
  }

  // bedtime
  const bedMatch = /bedtime.*?(\d{1,2})(?::(\d{2}))?\s*(pm|am)?/.exec(s) ?? /(\d{1,2})\s*pm/.exec(s);
  if (/bedtime/.test(s) || bedMatch) {
    let hour = 21;
    if (bedMatch) {
      hour = Number(bedMatch[1]) % 12;
      const mer = bedMatch[3] ?? "pm";
      hour = mer === "am" ? hour : hour + 12;
    }
    const start = `${String(hour).padStart(2, "0")}:00`;
    const device = target.devices[0];
    if (device) {
      await db.schedule.deleteMany({ where: { deviceId: device.id, label: "Bedtime" } });
      await db.schedule.create({ data: { deviceId: device.id, label: "Bedtime", days: [0, 1, 2, 3, 4], start, end: "07:00", shieldLevel: "full" } });
      await db.device.update({ where: { id: device.id }, data: { policyVersion: { increment: 1 } } });
    }
    return ok({ reply: `Bedtime set to <b>${start}–07:00, Mon–Fri</b> for ${target.name}. Applies on next sync.`, action: { type: "bedtime", childId: target.id, start } });
  }

  // summarize
  if (/summar|report|today/.test(s)) {
    const openCount = target.alerts.length;
    return ok({
      reply: `${target.name}: <b>${openCount} open alert${openCount === 1 ? "" : "s"}</b>. ${target.devices.length} device(s) linked. Full digest on the dashboard.`,
      action: null,
    });
  }

  return ok({ reply: "I can pause, block apps, locate a child, set bedtimes, or summarize. Try “summarize”.", action: null });
}

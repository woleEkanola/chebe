// In-memory fixed-window rate limiter (single-instance v1; move to Redis when multi-instance).
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  rec.count += 1;
  return rec.count <= max;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function limited(req: Request, max = 5, windowMs = 60_000): boolean {
  return rateLimit(`${clientIp(req)}:${new URL(req.url).pathname}`, max, windowMs);
}

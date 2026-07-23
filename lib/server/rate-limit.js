import "server-only";

// In-memory fixed-window rate limiter. Good enough to blunt brute-force attempts
// on a single instance. For multi-instance/serverless scale, back this with a
// shared store (e.g. Upstash Redis) using the same interface.
const buckets = new Map();

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;
  const ok = entry.count <= limit;
  return { ok, retryAfter: Math.ceil((entry.reset - now) / 1000) };
}

// Best-effort client IP from common proxy headers.
export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

// Occasionally drop expired buckets so the map doesn't grow unbounded.
if (typeof setInterval === "function") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (now > entry.reset) buckets.delete(key);
    }
  }, 60_000).unref?.();
}

import { NextRequest, NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
let checksSinceCleanup = 0;

function getClientIdentifier(request: NextRequest): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function cleanupExpiredBuckets(now: number) {
  checksSinceCleanup++;
  if (checksSinceCleanup < 100 && buckets.size < MAX_BUCKETS) return;

  checksSinceCleanup = 0;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  // Prevent attacker-controlled identifiers from causing unbounded memory use.
  if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

export function enforceRateLimit(
  request: NextRequest,
  { scope, limit, windowMs, identifier }: RateLimitOptions
): NextResponse | null {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const subject = identifier || getClientIdentifier(request);
  const key = `${scope}:${subject}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente mas tarde." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  current.count++;
  return null;
}


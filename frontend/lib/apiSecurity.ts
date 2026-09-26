import { NextResponse } from "next/server";

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimit(request: Request, scope: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  const key = `${scope}:${clientAddress(request)}`;
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [bucketKey, bucket] of buckets) if (now >= bucket.resetAt) buckets.delete(bucketKey);
    }
    return null;
  }
  if (current.count >= limit) {
    return NextResponse.json(
      { code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))) } },
    );
  }
  current.count += 1;
  return null;
}

export function sameOriginRequired(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ code: "CSRF_REJECTED" }, { status: 403 });
  }
  return null;
}

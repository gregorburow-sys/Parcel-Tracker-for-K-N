import { NextResponse } from "next/server";

/**
 * Edge middleware that applies per-IP rate limiting and adds standard
 * rate-limit response headers.
 *
 * Two buckets are tracked independently:
 *  - `lookup`  — applied to tracking-lookup style requests (10 / minute)
 *  - `general` — applied to every other request (30 / minute)
 *
 * The implementation uses a per-instance in-memory Map, which is the
 * appropriate fallback for development and single-instance deployments.
 * For multi-instance production deployments the store should be backed
 * by Redis (or an equivalent shared cache); see `docs/monitoring.md`.
 *
 * Next.js 12 middleware cannot return a response body directly, so when
 * a client exceeds its budget we rewrite to `/api/_rate-limited`, which
 * emits the JSON body. The rate-limit metadata is forwarded via request
 * headers that the rewrite target re-emits as response headers.
 */

const WINDOW_MS = 60_000;
const LOOKUP_LIMIT = 10;
const GENERAL_LIMIT = 30;

// Routes excluded from rate limiting entirely. Health and metrics need
// to remain reachable for orchestrators / monitoring agents even when
// the app is under attack. The rate-limited rewrite target is also
// exempt to avoid recursion.
const EXEMPT_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/api/health",
  "/api/metrics",
  "/api/_rate-limited",
];

// Routes that count against the stricter "lookup" budget.
const LOOKUP_PREFIXES = ["/tracker", "/api/parcel"];

const buckets = new Map();

function bucketFor(ip, scope) {
  const key = `${scope}:${ip}`;
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || now >= entry.reset) {
    entry = { count: 0, reset: now + WINDOW_MS };
    buckets.set(key, entry);
  }
  return entry;
}

function gc(now) {
  // Opportunistic eviction so the map cannot grow without bound under
  // sustained attack traffic. Runs at most once per request.
  if (buckets.size < 10_000) return;
  for (const [k, v] of buckets) {
    if (now >= v.reset) buckets.delete(k);
  }
}

function pickIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return req.ip || "unknown";
}

function scopeFor(pathname) {
  if (LOOKUP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return { scope: "lookup", limit: LOOKUP_LIMIT };
  }
  return { scope: "general", limit: GENERAL_LIMIT };
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const now = Date.now();
  gc(now);

  const ip = pickIp(req);
  const { scope, limit } = scopeFor(pathname);
  const entry = bucketFor(ip, scope);
  entry.count += 1;

  const remaining = Math.max(0, limit - entry.count);
  const resetSec = Math.ceil(entry.reset / 1000);
  const retryAfterSec = Math.max(1, Math.ceil((entry.reset - now) / 1000));

  if (entry.count > limit) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/_rate-limited";
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("reset", String(resetSec));
    url.searchParams.set("retry_after", String(retryAfterSec));
    url.searchParams.set("scope", scope);
    return NextResponse.rewrite(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(resetSec));
  res.headers.set("X-RateLimit-Scope", scope);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

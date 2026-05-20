/**
 * Internal endpoint used by middleware to surface a 429 response with a
 * JSON body. Next.js 12 middleware cannot return a body directly, so
 * the middleware rewrites to this handler when a client exceeds its
 * rate-limit budget. The rate-limit metadata is forwarded as query
 * parameters and re-emitted here as response headers.
 */

import logger from "../../utils/logger";
import metrics from "../../utils/metrics";

export default function handler(req, res) {
  const scope = String(req.query.scope || "general");
  const retryAfter = String(req.query.retry_after || "60");
  const limit = String(req.query.limit || "");
  const reset = String(req.query.reset || "");

  metrics.incrementCounter("rate_limit_violations_total", { scope });
  logger.warn("rate_limit_violation", {
    scope,
    path: req.headers["x-original-url"] || req.url,
    ip: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || undefined,
  });

  res.setHeader("Retry-After", retryAfter);
  if (limit) res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", "0");
  if (reset) res.setHeader("X-RateLimit-Reset", reset);
  res.setHeader("X-RateLimit-Scope", scope);
  res.setHeader("Cache-Control", "no-store");

  res.status(429).json({
    error: "rate_limited",
    scope,
    retry_after_seconds: Number(retryAfter) || 60,
  });
}

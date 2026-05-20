import metrics from "../../utils/metrics";

/**
 * Exposes the in-process metrics registry in Prometheus text format.
 *
 * Protect this endpoint at the perimeter (basic auth / IP allowlist /
 * private network) in production — it is intentionally unauthenticated
 * here to keep the example minimal and so that local scrapers / k6 can
 * read it without extra configuration.
 */

export default function handler(req, res) {
  metrics.incrementCounter("http_requests_total", { route: "/api/metrics", method: req.method });

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).end();
    return;
  }

  // Record a coarse process-level gauge on every scrape so that the
  // output is never empty.
  if (typeof process !== "undefined" && process.memoryUsage) {
    const mem = process.memoryUsage();
    metrics.setGauge("nodejs_heap_used_bytes", mem.heapUsed);
    metrics.setGauge("nodejs_rss_bytes", mem.rss);
  }

  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.status(200).send(metrics.render());
}

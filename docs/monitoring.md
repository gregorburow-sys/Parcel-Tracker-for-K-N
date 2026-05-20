# Monitoring & Incident Response

This document describes how the Parcel Tracker application should be
monitored in production, the alert thresholds that trigger an incident,
and the procedures for recovering from one. It is intended to be read
alongside the [Security](../README.md#security) section of the README.

## Key metrics

The application exposes Prometheus-style metrics at `/api/metrics`. The
following series are produced today; additional series can be added by
calling helpers in `utils/metrics.js`.

| Metric                              | Type    | Description                                |
|-------------------------------------|---------|--------------------------------------------|
| `http_requests_total{route,method}` | counter | Total HTTP requests handled per route      |
| `nodejs_heap_used_bytes`            | gauge   | Node.js V8 heap usage                      |
| `nodejs_rss_bytes`                  | gauge   | Process resident set size                  |

In addition the rate-limiter middleware emits these response headers on
every request, which a perimeter (CDN / WAF) should log and dashboard:

* `X-RateLimit-Limit` — bucket size for the current scope
* `X-RateLimit-Remaining` — remaining requests in the window
* `X-RateLimit-Reset` — Unix epoch (seconds) when the window resets
* `X-RateLimit-Scope` — `lookup` or `general`

The four signals to dashboard are:

1. **Latency** — P50 / P95 / P99 of homepage and `/tracker` requests.
2. **Error rate** — percentage of 4xx and 5xx responses, split by class.
3. **Saturation** — Node.js heap, RSS, and concurrent WebSocket count.
4. **Recovery time** — time from first 429 / 5xx to the next clean window.

## Alert thresholds

| Signal                                  | Warn     | Page      | Action                                |
|-----------------------------------------|----------|-----------|---------------------------------------|
| P95 latency (homepage)                  | > 1000ms | > 2000ms  | Investigate Appwrite latency          |
| Error rate (5xx)                        | > 1%     | > 5%      | Roll back; check Appwrite status      |
| Error rate (4xx, excluding 429)         | > 5%     | > 10%     | Inspect input-validation logs         |
| Rate-limit violations (`429s/min`)      | > 100    | > 1000    | Block source range at the WAF         |
| Node.js heap                            | > 70%    | > 80%     | Investigate WebSocket leak / restart  |
| WebSocket connection failure rate       | > 5%     | > 10%     | Inspect Appwrite realtime endpoint    |

The "Page" column reflects the rollback criteria used by the load-test
script: any of them crossing for two consecutive minutes is sufficient
to fail a release.

## Dashboard setup (Grafana + Prometheus)

The recommended setup uses Prometheus to scrape `/api/metrics` and
Grafana to visualise the result.

1. **Install Prometheus** and add a scrape job:
   ```yaml
   scrape_configs:
     - job_name: parcel-tracker
       scrape_interval: 15s
       metrics_path: /api/metrics
       static_configs:
         - targets: ["parcel-tracker.example.com"]
   ```
2. **Install Grafana** and add the Prometheus instance as a data source.
3. **Import the dashboard**: create panels for the four signals above.
   Suggested PromQL queries:
   * Request rate by route:
     `sum by (route) (rate(http_requests_total[1m]))`
   * Heap usage: `nodejs_heap_used_bytes`
   * 429 rate (from CDN logs): your CDN's log-derived series
4. **Wire up alerts** in Grafana using the thresholds in the table above.

For deployments on Vercel where Prometheus scraping is not feasible the
same metrics can be shipped via a [Log Drain](https://vercel.com/docs/log-drains)
into an OTLP-compatible collector.

## Rate-limit store

The middleware ships with an in-memory `Map` rate-limit store. For
multi-instance deployments swap it out for a Redis-backed implementation
so that limits are enforced globally. The `middleware.js` API surface
(per-IP, per-scope counters with a window reset) is small enough to
swap behind a `RATE_LIMIT_STORE=redis` environment flag.

## Recovery procedures

### A. Sustained 5xx spike

1. Page on-call (PagerDuty rotation `parcel-tracker`).
2. Check `/api/health` — confirm `appwrite.ok = true`.
3. If Appwrite is degraded, post status update; nothing to do client-side.
4. Otherwise, check recent deploys — roll back to the last known-good
   release via `git revert` + redeploy.

### B. DDoS / abuse pattern

1. Identify the abusive source range from CDN / WAF logs (look for
   high `429` counts attributed to a small set of IPs / ASNs).
2. Block the range at the perimeter (Cloudflare / Fastly / WAF rule).
3. Raise the `lookup` bucket limit in `middleware.js` only as a last
   resort — prefer perimeter mitigation.
4. After the incident, capture the source pattern in an allowlist /
   denylist runbook.

### C. WebSocket / memory growth

1. Verify the leak fix in `pages/tracker.js` is still deployed
   (`componentWillUnmount` must call `this.unsubscribe()`).
2. Inspect `nodejs_heap_used_bytes` and `nodejs_rss_bytes` trends.
3. If the leak has returned, redeploy the previous release while the
   regression is investigated.

### D. Rate-limit false positives

1. Confirm via logs (`event=rate_limit_violation`) that the affected
   user / IP is being throttled.
2. If the source is legitimate (e.g. corporate NAT, internal monitor),
   add it to the `EXEMPT_PREFIXES` allow-list in `middleware.js` or
   move it to a dedicated higher-budget scope.

## Related references

* [README — Security](../README.md#security)
* [`middleware.js`](../middleware.js)
* [`scripts/load-test.js`](../scripts/load-test.js)
* [`utils/metrics.js`](../utils/metrics.js)

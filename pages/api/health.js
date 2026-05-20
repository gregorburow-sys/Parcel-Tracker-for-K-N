import config from "../../utils/config";
import logger from "../../utils/logger";
import metrics from "../../utils/metrics";

/**
 * Application health check.
 *
 * Returns 200 when the process is reachable and required configuration
 * is present. Returns 503 when required configuration is missing — the
 * service is still up but cannot serve traffic correctly, which is the
 * signal load balancers / orchestrators should act on.
 *
 * The Appwrite endpoint reachability is only probed lightly (a HEAD
 * request) so this handler stays cheap enough to call from a liveness
 * probe.
 */

const STARTED_AT = Date.now();

async function checkAppwrite() {
  if (!config.appwriteURL) {
    return { ok: false, reason: "missing_endpoint" };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${config.appwriteURL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, reason: err.name === "AbortError" ? "timeout" : "unreachable" };
  }
}

function checkConfig() {
  const required = [
    "appwriteURL",
    "appwriteDatabaseID",
    "appwriteParcelsID",
    "appwriteParcelEventsID",
    "appwriteProjectID",
  ];
  const missing = required.filter((k) => !config[k]);
  return { ok: missing.length === 0, missing };
}

export default async function handler(req, res) {
  metrics.incrementCounter("http_requests_total", { route: "/api/health", method: req.method });

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const cfg = checkConfig();
  const appwrite = await checkAppwrite();

  const healthy = cfg.ok && appwrite.ok;
  const body = {
    status: healthy ? "ok" : "degraded",
    uptime_seconds: Math.round((Date.now() - STARTED_AT) / 1000),
    checks: {
      config: cfg,
      appwrite,
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
  };

  if (!healthy) {
    logger.warn("health_check_degraded", { checks: body.checks });
  }

  res.status(healthy ? 200 : 503).json(body);
}

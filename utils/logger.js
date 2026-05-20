/**
 * Structured logger for the Parcel Tracker application.
 *
 * Emits one JSON object per log line so that logs can be ingested by any
 * structured log pipeline (CloudWatch, Datadog, Loki, Vercel Log Drains).
 * No external dependencies are introduced to keep the surface area small
 * and the bundle size unchanged.
 *
 * Log shape:
 *   {
 *     ts: "2026-05-20T16:27:00.000Z",
 *     level: "info" | "warn" | "error" | "debug",
 *     event: "rate_limit_violation",
 *     ...context
 *   }
 *
 * In the browser only `warn`/`error` levels are emitted to avoid noisy
 * dev consoles. On the server every level is emitted.
 */

const LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

const isServer = typeof window === "undefined";

function minLevel() {
  const raw = (isServer ? process.env.LOG_LEVEL : null) || (isServer ? "info" : "warn");
  return LEVELS[raw] || LEVELS.info;
}

function emit(level, event, context) {
  if (LEVELS[level] < minLevel()) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(context),
  };
  const line = safeStringify(payload);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

/**
 * Strip values that look like secrets and clip very large strings so logs
 * do not become an exfiltration vector.
 */
function sanitize(context) {
  if (!context || typeof context !== "object") return {};
  const REDACT_KEYS = /^(authorization|cookie|set-cookie|api[_-]?key|token|secret|password)$/i;
  const out = {};
  for (const [k, v] of Object.entries(context)) {
    if (REDACT_KEYS.test(k)) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "string" && v.length > 1024) {
      out[k] = v.slice(0, 1024) + "…";
    } else {
      out[k] = v;
    }
  }
  return out;
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (_err) {
    return JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      event: "logger_serialize_failed",
    });
  }
}

const logger = {
  debug: (event, context) => emit("debug", event, context),
  info: (event, context) => emit("info", event, context),
  warn: (event, context) => emit("warn", event, context),
  error: (event, context) => emit("error", event, context),
};

export default logger;
export { LEVELS };

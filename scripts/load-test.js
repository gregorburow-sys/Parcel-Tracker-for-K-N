// k6 load test for the Parcel Tracker application.
//
// Run with the k6 CLI (https://k6.io):
//   BASE_URL=https://staging.example.com k6 run scripts/load-test.js
//
// The script implements the five scenarios documented in
// docs/monitoring.md (baseline, normal, spike, sustained, websocket
// stress) and exports custom thresholds that match the rollback
// criteria defined there. CI / cron pipelines should fail when any
// threshold is crossed so that regressions are caught automatically.
//
// Notes:
// - The script targets the application's *public* endpoints only. The
//   /api/health and /api/metrics endpoints are intentionally exempt
//   from rate limiting at the middleware layer, so probing them here
//   is safe and measures application latency rather than the limiter.
// - PARCEL_ID can be overridden to point at a real document in the
//   staging Appwrite instance. The default value is a placeholder that
//   exercises validation (will be rejected by the limiter / validator
//   before hitting Appwrite).

import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const PARCEL_ID = __ENV.PARCEL_ID || "TEST12345";
const WS_URL = __ENV.WS_URL || BASE_URL.replace(/^http/, "ws") + "/v1/realtime";

const errorRate = new Rate("errors");
const rateLimited = new Counter("rate_limited_responses");
const homeLatency = new Trend("home_latency_ms", true);

// Scenarios run sequentially with cooldowns between them (k6's
// `startTime` lets us stagger executors on the same VU pool).
export const options = {
  scenarios: {
    baseline: {
      executor: "constant-arrival-rate",
      rate: 10,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: "homepage",
      startTime: "0s",
    },
    normal: {
      executor: "constant-arrival-rate",
      rate: 50,
      timeUnit: "1s",
      duration: "10m",
      preAllocatedVUs: 100,
      maxVUs: 200,
      exec: "homepage",
      startTime: "10m", // 5m baseline + 5m cooldown
    },
    spike: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 200,
      maxVUs: 400,
      stages: [
        { duration: "30s", target: 200 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 10 },
        { duration: "5m", target: 10 },
      ],
      exec: "homepage",
      startTime: "25m", // after normal scenario + cooldown
    },
    sustained: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "30m",
      preAllocatedVUs: 200,
      maxVUs: 400,
      exec: "homepage",
      startTime: "35m",
    },
    websocket_stress: {
      executor: "constant-vus",
      vus: 100,
      duration: "5m",
      exec: "websocket",
      startTime: "70m",
    },
  },
  thresholds: {
    // Rollback criteria from docs/monitoring.md.
    errors: ["rate<0.05"], // < 5% error rate
    home_latency_ms: ["p(95)<2000"], // P95 < 2s
    http_req_failed: ["rate<0.05"],
  },
};

export function homepage() {
  const res = http.get(`${BASE_URL}/`);
  homeLatency.add(res.timings.duration);
  if (res.status === 429) rateLimited.add(1);
  const ok = check(res, {
    "status is 2xx or 429": (r) => (r.status >= 200 && r.status < 300) || r.status === 429,
  });
  errorRate.add(!ok);
  sleep(1);
}

export function lookup() {
  const res = http.get(`${BASE_URL}/tracker?$id=${encodeURIComponent(PARCEL_ID)}`);
  if (res.status === 429) rateLimited.add(1);
  const ok = check(res, {
    "lookup status acceptable": (r) =>
      (r.status >= 200 && r.status < 300) || r.status === 429 || r.status === 400,
  });
  errorRate.add(!ok);
  sleep(2);
}

export function websocket() {
  const res = ws.connect(WS_URL, null, function (socket) {
    socket.on("open", () => {
      socket.setTimeout(() => socket.close(), 1000);
    });
  });
  check(res, { "ws status is 101 or 4xx": (r) => r && (r.status === 101 || r.status >= 400) });
}

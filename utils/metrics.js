/**
 * In-memory metrics registry exposed via /api/metrics in a Prometheus
 * text-format compatible shape.
 *
 * This is deliberately simple — counters and gauges only — so that it
 * works on serverless platforms without a sidecar. For multi-instance
 * deployments these metrics should be exported to an external collector
 * (StatsD, Prometheus push gateway, OTLP) instead of relying on the
 * per-instance counters below.
 */

const counters = new Map();
const gauges = new Map();
const histograms = new Map();

function key(name, labels) {
  if (!labels) return name;
  const parts = Object.keys(labels)
    .sort()
    .map((k) => `${k}="${String(labels[k]).replace(/"/g, '\\"')}"`);
  return `${name}{${parts.join(",")}}`;
}

function incrementCounter(name, labels, by = 1) {
  const k = key(name, labels);
  counters.set(k, (counters.get(k) || 0) + by);
}

function setGauge(name, value, labels) {
  const k = key(name, labels);
  gauges.set(k, value);
}

function observe(name, value, labels) {
  const k = key(name, labels);
  const existing = histograms.get(k) || { count: 0, sum: 0, min: Infinity, max: -Infinity };
  existing.count += 1;
  existing.sum += value;
  if (value < existing.min) existing.min = value;
  if (value > existing.max) existing.max = value;
  histograms.set(k, existing);
}

/**
 * Render the registry in Prometheus text exposition format.
 * https://prometheus.io/docs/instrumenting/exposition_formats/
 */
function render() {
  const lines = [];
  for (const [k, v] of counters.entries()) {
    lines.push(`${k} ${v}`);
  }
  for (const [k, v] of gauges.entries()) {
    lines.push(`${k} ${v}`);
  }
  for (const [k, agg] of histograms.entries()) {
    const base = k.includes("{") ? k.slice(0, -1) : k;
    const suffix = k.includes("{") ? "" : "";
    lines.push(`${base}${suffix ? "" : ""}_count ${agg.count}`);
    lines.push(`${base}${suffix ? "" : ""}_sum ${agg.sum}`);
  }
  return lines.join("\n") + "\n";
}

function snapshot() {
  return {
    counters: Object.fromEntries(counters),
    gauges: Object.fromEntries(gauges),
    histograms: Object.fromEntries(
      Array.from(histograms.entries()).map(([k, v]) => [k, { ...v }])
    ),
  };
}

const metrics = {
  incrementCounter,
  setGauge,
  observe,
  render,
  snapshot,
};

export default metrics;
export { incrementCounter, setGauge, observe, render, snapshot };

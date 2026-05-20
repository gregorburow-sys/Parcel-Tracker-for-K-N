const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-500",
  out_for_delivery: "bg-emerald-500",
  in_transit: "bg-blue-500",
  created: "bg-slate-500",
  delayed: "bg-amber-500",
  returned: "bg-orange-500",
  cancelled: "bg-red-500",
};

export function statusColor(rawStatus: string): string {
  const key = rawStatus.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return STATUS_COLORS[key] ?? "bg-slate-400";
}

export function formatStatus(rawStatus: string): string {
  return rawStatus
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

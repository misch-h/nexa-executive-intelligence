import type { ExecutiveMetric, MetricHistoryPoint } from "./metrics";

export const certifiedNames = ["Loan Approval Rate", "30+ DPD Rate", "Active Customer Rate", "Loans Written", "Net Credit Loss", "Net Promoter Score", "Complaint Volume", "Complaints > SLA"];
export const proposedNames = ["Savings Deposits", "Gross Loan Portfolio", "Active Customers (30D)", "Transaction Volume", "Transaction Value", "Open Savings Accounts"];
export type ProposedMetric = {
  metric_id: string; metric_name: string; domain: string; metric_value: number; unit: string; as_of_date: string;
};
export type DashboardMetric = ExecutiveMetric | ProposedMetric;
export type DashboardData = { certified: ExecutiveMetric[]; proposed: ProposedMetric[]; date: string };

function records(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) throw new Error("Invalid metric response.");
  return data.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("Invalid metric record.");
    return row as Record<string, unknown>;
  });
}
function validateBase(row: Record<string, unknown>) {
  for (const key of ["metric_id", "metric_name", "domain", "unit", "as_of_date"]) {
    if (typeof row[key] !== "string" || !row[key].trim()) throw new Error(`Missing ${key}.`);
  }
  if (typeof row.metric_value !== "number" || !Number.isFinite(row.metric_value)) throw new Error("Invalid metric value.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.as_of_date as string) || Number.isNaN(Date.parse(row.as_of_date as string))) throw new Error("Invalid reporting date.");
}
export function parseDashboard(certifiedData: unknown, proposedData: unknown): DashboardData | null {
  const certifiedRows = records(certifiedData);
  const proposedRows = records(proposedData);
  if (!certifiedRows.length && !proposedRows.length) return null;
  const certified = certifiedRows.map((row) => {
    validateBase(row);
    if (row.certification_status !== "Executive Certified") throw new Error("Unexpected certified status.");
    for (const key of ["business_definition", "calculation_logic", "data_product", "owner_role", "calculated_at", "status"]) {
      if (typeof row[key] !== "string") throw new Error(`Invalid ${key}.`);
    }
    for (const key of ["target_value", "variance_to_target", "green_threshold", "amber_threshold", "red_threshold", "previous_value", "absolute_change", "trend_pct", "numerator_value", "denominator_value"]) {
      if (row[key] !== null && (typeof row[key] !== "number" || !Number.isFinite(row[key]))) throw new Error(`Invalid ${key}.`);
    }
    if (!["GREEN", "AMBER", "RED", "GREY"].includes(String(row.rag_status)) ||
      !["HIGHER_IS_BETTER", "LOWER_IS_BETTER"].includes(String(row.rag_direction)) ||
      !["FAVOURABLE", "ADVERSE", "NEUTRAL"].includes(String(row.variance_status)) ||
      !["UP", "DOWN", "FLAT"].includes(String(row.trend_direction))) throw new Error("Invalid governed metric state.");
    return row as ExecutiveMetric;
  });
  const proposed = proposedRows.map((row) => {
    validateBase(row);
    return row as ProposedMetric;
  });
  // Never silently overwrite conflicting names or IDs when joining sources.
  const all = [...certified, ...proposed];
  if (new Set(all.map((metric) => metric.metric_id)).size !== all.length || new Set(all.map((metric) => metric.metric_name)).size !== all.length) throw new Error("Duplicate or conflicting metric definitions.");
  if (certified.length !== certifiedNames.length || certifiedNames.some((name) => !certified.some((metric) => metric.metric_name === name)) ||
    proposed.length !== proposedNames.length || proposedNames.some((name) => !proposed.some((metric) => metric.metric_name === name))) throw new Error("Incomplete executive snapshot.");
  const dates = new Set(all.map((metric) => metric.as_of_date));
  if (dates.size !== 1) throw new Error("Metric reporting dates do not align.");
  return { certified, proposed, date: all[0].as_of_date };
}
export function parseDashboardHistory(data: unknown): MetricHistoryPoint[] {
  return records(data).map((row) => { validateBase(row); return row as MetricHistoryPoint; });
}
export function isCertified(metric: DashboardMetric): metric is ExecutiveMetric {
  return "certification_status" in metric && metric.certification_status === "Executive Certified";
}
export function metricHistory(metric: DashboardMetric, history: MetricHistoryPoint[]) {
  const matching = history.filter((point) => point.metric_id === metric.metric_id && point.unit === metric.unit && point.as_of_date <= metric.as_of_date).sort((a, b) => a.as_of_date.localeCompare(b.as_of_date));
  if (new Set(matching.map((point) => point.as_of_date)).size !== matching.length) return [];
  const latest = matching.at(-1);
  if (matching.length < 2 || latest?.as_of_date !== metric.as_of_date || latest.metric_value !== metric.metric_value) return [];
  return matching;
}
export function historyChange(metric: DashboardMetric, history: MetricHistoryPoint[]): string | null {
  const points = metricHistory(metric, history);
  if (points.length < 2) return null;
  const prior = points.at(-2)!;
  const change = metric.metric_value - prior.metric_value;
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${prior.as_of_date}T00:00:00Z`));
  if (metric.unit === "%") return `${change > 0 ? "+" : ""}${change.toFixed(2)} pp vs ${month}`;
  if (prior.metric_value === 0) return null;
  const relative = change / Math.abs(prior.metric_value) * 100;
  return `${relative > 0 ? "+" : ""}${relative.toFixed(1)}% vs ${month}`;
}
export function dashboardValue(metric: DashboardMetric, exact = false): string {
  if (metric.unit === "AED") return `AED ${new Intl.NumberFormat("en-GB", exact ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { notation: "compact", maximumFractionDigits: 2 }).format(metric.metric_value)}`;
  if (metric.unit === "%") return `${metric.metric_value.toFixed(metric.metric_name === "30+ DPD Rate" ? 2 : 1)}%`;
  if (metric.unit === "NPS") return `${metric.metric_value > 0 ? "+" : ""}${metric.metric_value}`;
  return new Intl.NumberFormat("en-GB").format(metric.metric_value);
}

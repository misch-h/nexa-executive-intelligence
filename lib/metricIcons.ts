export type MetricIconName =
  | "lending"
  | "approval"
  | "risk"
  | "loss"
  | "customer"
  | "complaints"
  | "default";

export function getMetricIcon(metricName: string): MetricIconName {
  const map: Record<string, MetricIconName> = {
    "Loans Written": "lending",
    "Loan Approval Rate": "approval",
    "30+ DPD Rate": "risk",
    "Net Credit Loss": "loss",
    "Active Customer Rate": "customer",
    "Complaint Volume": "complaints",
  };

  return map[metricName] ?? "default";
}
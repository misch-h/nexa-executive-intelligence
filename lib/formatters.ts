export function formatMetric(name: string, value: number) {
  if (name === "Loans Written") {
    return `AED ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (name === "Net Credit Loss") {
    return `AED ${(value / 1_000_000).toFixed(2)}M`;
  }

  if (
    name === "Active Customer Rate" ||
    name === "Loan Approval Rate" ||
    name === "30+ DPD Rate"
  ) {
    return `${value.toFixed(value < 10 ? 2 : 1)}%`;
  }

  return value.toLocaleString();
}
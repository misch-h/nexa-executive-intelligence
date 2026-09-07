export function formatMetric(
  name: string,
  value: number | string | null | undefined
) {
  if (value === null || value === undefined) return "—";

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return "—";

  if (
    name === "Loan Approval Rate" ||
    name === "30+ DPD Rate" ||
    name === "Active Customer Rate"
  ) {
    return `${numericValue.toFixed(1)}%`;
  }

  if (name === "Net Promoter Score") {
    return numericValue > 0
      ? `+${numericValue.toFixed(0)}`
      : numericValue.toFixed(0);
  }

  if (
    name === "Loans Written" ||
    name === "Net Credit Loss"
  ) {
    if (Math.abs(numericValue) >= 1_000_000) {
      return `AED ${(numericValue / 1_000_000).toFixed(1)}M`;
    }

    if (Math.abs(numericValue) >= 1_000) {
      return `AED ${(numericValue / 1_000).toFixed(0)}K`;
    }

    return `AED ${numericValue.toLocaleString()}`;
  }

  return numericValue.toLocaleString();
}


export function formatVariance(
  name: string,
  variance: number | string | null | undefined,
  status: string
) {
  if (variance === null || variance === undefined) {
    return "No target";
  }

  const numericVariance = Number(variance);

  if (Number.isNaN(numericVariance)) {
    return "No target";
  }

  const direction =
    status === "FAVOURABLE"
      ? "favourable"
      : status === "ADVERSE"
      ? "adverse"
      : "";

  const absolute = Math.abs(numericVariance);

  if (
    name === "Active Customer Rate" ||
    name === "Loan Approval Rate" ||
    name === "30+ DPD Rate"
  ) {
    return `${Math.round(absolute * 100)} bps ${direction}`;
  }

  if (name === "Net Promoter Score") {
    return `${absolute.toFixed(0)} pts ${direction}`;
  }

  if (
    name === "Loans Written" ||
    name === "Net Credit Loss"
  ) {
    if (absolute >= 1_000_000) {
      return `AED ${(absolute / 1_000_000).toFixed(1)}M ${direction}`;
    }

    if (absolute >= 1_000) {
      return `AED ${Math.round(absolute / 1_000)}K ${direction}`;
    }

    return `AED ${absolute.toFixed(0)} ${direction}`;
  }

  return `${absolute.toLocaleString()} ${direction}`;
}
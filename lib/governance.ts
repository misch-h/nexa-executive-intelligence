export type GovernanceMetric = {
  definition_owner: string;
  metric_name: string;
  business_definition: string;
  metric_value: number;
  is_certified: boolean;
  as_of_date: string;
};

export function parseGovernanceMetrics(data: unknown): GovernanceMetric[] {
  if (!Array.isArray(data)) throw new Error("Invalid governance response.");
  return data.map((row) => {
    if (
      !row || typeof row.definition_owner !== "string" ||
      typeof row.metric_name !== "string" ||
      typeof row.business_definition !== "string" ||
      !row.business_definition.trim() ||
      typeof row.is_certified !== "boolean" ||
      typeof row.as_of_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.as_of_date) ||
      Number.isNaN(Date.parse(row.as_of_date)) ||
      (typeof row.metric_value !== "number" && typeof row.metric_value !== "string") ||
      String(row.metric_value).trim() === "" ||
      !Number.isSafeInteger(Number(row.metric_value)) || Number(row.metric_value) < 0
    ) throw new Error("Incomplete or invalid governance data.");
    return { ...row, metric_value: Number(row.metric_value) };
  });
}

export function formatGovernanceDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

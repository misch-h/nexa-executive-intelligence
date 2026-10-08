export type CatalogueMetric = {
  metric_id: string;
  metric_name: string;
  domain: string;
  owner_role: string | null;
  business_definition: string | null;
  calculation_logic: string | null;
  source_dataset: string | null;
  refresh_cadence: string | null;
  certification_status: string;
  data_product: string | null;
  as_of_date: string | null;
};
export type CatalogueLineage = {
  metric_id: string;
  lineage_order: number;
  layer_name: string;
  object_name: string;
  object_type: string;
  transformation_description: string | null;
};
export const governanceDescriptions: Record<string, string> = {
  "Executive Certified": "Existing certified metrics for executive reporting.",
  Proposed: "Definitions awaiting formal approval.",
  Exploratory: "Non-certified analysis.",
};
function records(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) throw new Error("Invalid catalogue response.");
  return data.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid catalogue record.");
    return value as Record<string, unknown>;
  });
}
function required(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${key}.`);
  return value.trim();
}
function optional(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error(`Invalid ${key}.`);
  return value.trim() || null;
}
export function parseCatalogue(data: unknown): CatalogueMetric[] {
  const ids = new Set<string>();
  return records(data).map((row): CatalogueMetric => {
    const metric_id = required(row, "metric_id");
    if (ids.has(metric_id)) throw new Error("Duplicate catalogue metric ID.");
    ids.add(metric_id);
    const as_of_date = optional(row, "as_of_date");
    if (as_of_date && (!/^\d{4}-\d{2}-\d{2}$/.test(as_of_date) || Number.isNaN(Date.parse(as_of_date)))) throw new Error("Invalid reporting date.");
    return {
      metric_id, metric_name: required(row, "metric_name"), domain: required(row, "domain"),
      owner_role: optional(row, "owner_role"), business_definition: optional(row, "business_definition"),
      calculation_logic: optional(row, "calculation_logic"), source_dataset: optional(row, "source_dataset"),
      refresh_cadence: optional(row, "refresh_cadence"), certification_status: required(row, "certification_status"),
      data_product: optional(row, "data_product"), as_of_date,
    };
  }).sort((a, b) => a.metric_name.localeCompare(b.metric_name));
}
export function parseCatalogueLineage(data: unknown, metricId: string): CatalogueLineage[] {
  return records(data).map((row): CatalogueLineage => {
    const metric_id = required(row, "metric_id");
    const order = row.lineage_order;
    if (metric_id !== metricId || (typeof order !== "number" && typeof order !== "string") || String(order).trim() === "" || !Number.isSafeInteger(Number(order)) || Number(order) < 0) throw new Error("Invalid metric lineage.");
    return {
      metric_id, lineage_order: Number(order), layer_name: required(row, "layer_name"),
      object_name: required(row, "object_name"), object_type: required(row, "object_type"),
      transformation_description: optional(row, "transformation_description"),
    };
  }).sort((a, b) => a.lineage_order - b.lineage_order);
}
export function catalogueSummary(metrics: CatalogueMetric[]) {
  return {
    total: metrics.length,
    certified: metrics.filter((metric) => metric.certification_status === "Executive Certified").length,
    proposed: metrics.filter((metric) => metric.certification_status === "Proposed").length,
    domains: new Set(metrics.map((metric) => metric.domain)).size,
  };
}
export function filterCatalogue(metrics: CatalogueMetric[], query: string, domain: string, status: string) {
  const search = query.trim().toLocaleLowerCase();
  return metrics.filter((metric) =>
    (!domain || metric.domain === domain) && (!status || metric.certification_status === status) &&
    [metric.metric_name, metric.metric_id, metric.domain, metric.business_definition ?? ""].some((value) => value.toLocaleLowerCase().includes(search))
  );
}

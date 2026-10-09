import type { RAGStatus } from "./metrics";
export type DomainTone = "growth" | "credit" | "finance" | "customer" | "operations" | "neutral";
export function domainTone(domain: string): DomainTone {
  if (/credit|risk/i.test(domain)) return "credit";
  if (/finance|deposit|saving/i.test(domain)) return "finance";
  if (/customer|product/i.test(domain)) return "customer";
  if (/growth|lend|origination/i.test(domain)) return "growth";
  if (/operations|service|payment|experience/i.test(domain)) return "operations";
  return "neutral";
}
export const ragLabels: Record<RAGStatus, string> = { GREEN: "On track", AMBER: "Attention", RED: "Critical", GREY: "Not assessed" };
export function certificationTone(status: string) {
  return status === "Executive Certified" ? "certified" : status === "Proposed" ? "proposed" : "exploratory";
}
export const bucketStyles: Record<string, { tone: string; color: string }> = {
  Current: { tone: "current", color: "#168365" },
  "1–29 DPD": { tone: "early", color: "#d9b66b" },
  "30–59 DPD": { tone: "late", color: "#c18a2d" },
  "60–89 DPD": { tone: "severe", color: "#e76f63" },
  "90+ DPD": { tone: "default", color: "#b73b50" },
};
export function bucketColor(label: string) { return bucketStyles[label.replace(/-/g, "–")]?.color ?? "#65707a"; }
export const layerExplanations: Record<string, string> = {
  Source: "Where information originates", Bronze: "Raw records captured", Silver: "Data cleaned and standardised", Gold: "Business-ready information", Semantic: "Governed metrics used for reporting",
};

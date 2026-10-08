export type CreditOverview = {
  total_applications: number;
  approved_applications: number;
  declined_applications: number;
  approval_rate_pct: number;
  funded_loans: number;
  active_loans: number;
  nonperforming_loans: number;
  indicative_funding_conversion_pct: number;
  loans_written_aed: number;
  outstanding_portfolio_aed: number;
  dpd30_rate_pct: number;
  dpd90_rate_pct: number;
  as_of_date: string;
};
export type DelinquencyBucket = {
  delinquency_bucket: string;
  bucket_order: number;
  loan_count: number;
  outstanding_balance_aed: number;
};
export type RiskExposure = {
  risk_grade: string;
  loan_count: number;
  outstanding_balance_aed: number;
  portfolio_share_pct: number;
};
export type ExecutiveDpd = { metric_value: number; as_of_date: string };
export type CreditData = {
  overview: CreditOverview;
  delinquency: DelinquencyBucket[];
  risk: RiskExposure[];
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid credit record.");
  return value as Record<string, unknown>;
}
function numeric(row: Record<string, unknown>, key: string, count = false): number {
  const value = row[key];
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") throw new Error(`Missing ${key}.`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || (count && !Number.isSafeInteger(result))) throw new Error(`Invalid ${key}.`);
  return result;
}
function text(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing ${key}.`);
  return value;
}
function date(row: Record<string, unknown>): string {
  const value = text(row, "as_of_date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new Error("Invalid reporting date.");
  return value;
}
function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error("Invalid credit response.");
  return value.map(record);
}

export function parseCreditData(overviewData: unknown, delinquencyData: unknown, riskData: unknown): CreditData | null {
  const overviewRows = rows(overviewData);
  const delinquencyRows = rows(delinquencyData);
  const riskRows = rows(riskData);
  if (!overviewRows.length || !delinquencyRows.length || !riskRows.length) return null;
  const latestDate = overviewRows.map(date).sort().at(-1)!;
  const latest = overviewRows.filter((row) => date(row) === latestDate);
  if (latest.length !== 1) throw new Error("Ambiguous credit overview.");
  const row = latest[0];
  const overview: CreditOverview = {
    total_applications: numeric(row, "total_applications", true),
    approved_applications: numeric(row, "approved_applications", true),
    declined_applications: numeric(row, "declined_applications", true),
    approval_rate_pct: numeric(row, "approval_rate_pct"),
    funded_loans: numeric(row, "funded_loans", true),
    active_loans: numeric(row, "active_loans", true),
    nonperforming_loans: numeric(row, "nonperforming_loans", true),
    indicative_funding_conversion_pct: numeric(row, "indicative_funding_conversion_pct"),
    loans_written_aed: numeric(row, "loans_written_aed"),
    outstanding_portfolio_aed: numeric(row, "outstanding_portfolio_aed"),
    dpd30_rate_pct: numeric(row, "dpd30_rate_pct"),
    dpd90_rate_pct: numeric(row, "dpd90_rate_pct"),
    as_of_date: latestDate,
  };
  const delinquency = delinquencyRows.map((row): DelinquencyBucket => ({
    delinquency_bucket: text(row, "delinquency_bucket"),
    bucket_order: numeric(row, "bucket_order", true),
    loan_count: numeric(row, "loan_count", true),
    outstanding_balance_aed: numeric(row, "outstanding_balance_aed"),
  })).sort((a, b) => a.bucket_order - b.bucket_order);
  const risk = riskRows.map((row): RiskExposure => ({
    risk_grade: text(row, "risk_grade"),
    loan_count: numeric(row, "loan_count", true),
    outstanding_balance_aed: numeric(row, "outstanding_balance_aed"),
    portfolio_share_pct: numeric(row, "portfolio_share_pct"),
  })).sort((a, b) => a.risk_grade.localeCompare(b.risk_grade));
  const bucketNames = ["Current", "1–29 DPD", "30–59 DPD", "60–89 DPD", "90+ DPD"];
  if (delinquency.length !== 5 || delinquency.some((bucket, index) => bucket.bucket_order !== index + 1 || bucket.delinquency_bucket.replaceAll("-", "–") !== bucketNames[index])) throw new Error("Incomplete delinquency distribution.");
  if (risk.length !== 5 || risk.some((grade, index) => grade.risk_grade !== "ABCDE"[index])) throw new Error("Incomplete risk distribution.");
  return { overview, delinquency, risk };
}

export function parseExecutiveDpd(data: unknown): ExecutiveDpd[] {
  return rows(data).map((row) => ({ metric_value: numeric(row, "metric_value"), as_of_date: date(row) }));
}
export function percentage(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator * 100 : null;
}
export function calculateCredit(data: CreditData) {
  const portfolio = data.delinquency.reduce((sum, row) => sum + row.outstanding_balance_aed, 0);
  const overdue = data.delinquency.filter((row) => row.bucket_order >= 3);
  const dpd30Balance = overdue.reduce((sum, row) => sum + row.outstanding_balance_aed, 0);
  const dpd90Balance = data.delinquency.find((row) => row.bucket_order === 5)!.outstanding_balance_aed;
  const higherRiskBalance = data.risk.filter((row) => ["D", "E"].includes(row.risk_grade)).reduce((sum, row) => sum + row.outstanding_balance_aed, 0);
  const riskTotal = data.risk.reduce((sum, row) => sum + row.outstanding_balance_aed, 0);
  return {
    portfolio, dpd30Balance,
    dpd30Loans: overdue.reduce((sum, row) => sum + row.loan_count, 0),
    dpd30Rate: percentage(dpd30Balance, portfolio),
    dpd90Rate: percentage(dpd90Balance, portfolio),
    higherRiskBalance, higherRiskShare: percentage(higherRiskBalance, riskTotal), riskTotal,
    approvalRate: percentage(data.overview.approved_applications, data.overview.total_applications),
    fundingConversion: percentage(data.overview.funded_loans, data.overview.approved_applications),
  };
}

// Compare at the source KPI's two-decimal precision, avoiding rounding-only flags.
export function ratesDiffer(calculated: number | null, reported: number): boolean {
  return calculated !== null && Math.round(calculated * 100) !== Math.round(reported * 100);
}
export const creditCount = new Intl.NumberFormat("en-GB");
export function creditPercent(value: number | null): string {
  return value === null ? "Unavailable" : `${value.toFixed(2)}%`;
}
export function creditMoney(value: number, compact = false): string {
  return `AED ${new Intl.NumberFormat("en-GB", compact
    ? { notation: "compact", maximumFractionDigits: 2 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

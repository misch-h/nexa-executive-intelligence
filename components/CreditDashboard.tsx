"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { formatGovernanceDate } from "../lib/governance";
import {
  calculateCredit, creditCount, creditMoney, creditPercent, parseCreditData,
  parseExecutiveDpd, percentage, ratesDiffer, type CreditData, type ExecutiveDpd,
} from "../lib/credit";
import SectionLabel from "./SectionLabel";

type State =
  | { status: "loading" | "empty" | "error" }
  | { status: "ready"; data: CreditData; executive: ExecutiveDpd[] | null };

function ExposureChart({ rows, total, risk = false }: {
  rows: { label: string; count: number; balance: number; elevated: boolean }[];
  total: number;
  risk?: boolean;
}) {
  return <div className="credit-chart" role="table" aria-label={risk ? "Outstanding exposure by risk grade" : "Outstanding exposure by delinquency bucket"}>
    <div className="credit-chart-header" role="row">
      <span role="columnheader">{risk ? "Risk grade" : "Delinquency"}</span>
      <span role="columnheader">Share of balance</span>
      <span role="columnheader">Loans</span>
      <span role="columnheader">Outstanding balance</span>
    </div>
    {rows.map((row) => {
      const share = percentage(row.balance, total);
      return <div className={`credit-chart-row${row.elevated ? " credit-elevated" : ""}`} role="row" key={row.label}>
        <span className="credit-chart-label" role="cell">{row.label}</span>
        <div className="credit-chart-exposure" role="cell">
          <div className="credit-bar-track" aria-hidden="true"><div style={{ width: `${Math.min(100, share ?? 0)}%` }} /></div>
          <span>{creditPercent(share)}</span>
        </div>
        <span className="credit-chart-count" role="cell"><span className="credit-mobile-label">Loans </span>{creditCount.format(row.count)}</span>
        <span className="credit-chart-balance" role="cell">{creditMoney(row.balance)}</span>
      </div>;
    })}
  </div>;
}

export default function CreditDashboard() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const results = await Promise.allSettled([
          supabase.from("credit_overview_api").select("total_applications,approved_applications,declined_applications,approval_rate_pct,funded_loans,active_loans,nonperforming_loans,indicative_funding_conversion_pct,loans_written_aed,outstanding_portfolio_aed,dpd30_rate_pct,dpd90_rate_pct,as_of_date").abortSignal(controller.signal),
          supabase.from("credit_delinquency_api").select("delinquency_bucket,bucket_order,loan_count,outstanding_balance_aed").abortSignal(controller.signal),
          supabase.from("credit_risk_distribution_api").select("risk_grade,loan_count,outstanding_balance_aed,portfolio_share_pct").abortSignal(controller.signal),
          supabase.from("executive_metrics_api").select("metric_value,as_of_date").eq("metric_name", "30+ DPD Rate").abortSignal(controller.signal),
        ]);
        const required = results.slice(0, 3).map((result) => {
          if (result.status === "rejected") throw result.reason;
          if (result.value.error) throw result.value.error;
          return result.value.data;
        });
        const data = parseCreditData(required[0], required[1], required[2]);
        let executive: ExecutiveDpd[] | null = null;
        const executiveResult = results[3];
        if (executiveResult.status === "fulfilled" && !executiveResult.value.error) {
          try { executive = parseExecutiveDpd(executiveResult.value.data); } catch { /* Keep the dashboard available; disclose the failed comparison below. */ }
        }
        if (!controller.signal.aborted) setState(data ? { status: "ready", data, executive } : { status: "empty" });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  function retry() { setState({ status: "loading" }); setAttempt((value) => value + 1); }
  const date = state.status === "ready" ? formatGovernanceDate(state.data.overview.as_of_date).toUpperCase() : null;
  return <>
    <section className="credit-intro">
      <div className="credit-heading-row">
        <SectionLabel>CREDIT &amp; LENDING</SectionLabel>
        <span className="credit-synthetic">SYNTHETIC DATA · {date ?? "REPORTING DATE PENDING"}</span>
      </div>
      <h1>Origination performance.<br />Portfolio health. <span>Emerging risk.</span></h1>
      <p>A view of lending growth, customer conversion and the balance exposed to credit risk.</p>
    </section>
    {state.status === "loading" && <div className="credit-state" role="status">Loading credit and lending data…</div>}
    {state.status === "error" && <div className="credit-state" role="alert"><h2>Credit data is unavailable.</h2><p>One or more views could not be read or returned incomplete data. Try again; if this persists, check the credit views and public read access.</p><button onClick={retry} type="button">Try again</button></div>}
    {state.status === "empty" && <div className="credit-state" role="status"><h2>No complete credit snapshot available.</h2><p>One or more credit views returned no visible records.</p><button onClick={retry} type="button">Refresh</button></div>}
    {state.status === "ready" && <CreditSnapshot data={state.data} executive={state.executive} />}
  </>;
}

function CreditSnapshot({ data, executive }: { data: CreditData; executive: ExecutiveDpd[] | null }) {
  const { overview, delinquency, risk } = data;
  const calculated = calculateCredit(data);
  const matches = executive?.filter((row) => row.as_of_date === overview.as_of_date) ?? [];
  const executiveMetric = matches.length === 1 ? matches[0] : null;
  const discrepancy = executiveMetric && ratesDiffer(calculated.dpd30Rate, executiveMetric.metric_value);
  const overviewDiscrepancy = ratesDiffer(calculated.dpd30Rate, overview.dpd30_rate_pct);
  const balanceMismatch = Math.abs(calculated.portfolio - overview.outstanding_portfolio_aed) > 0.05 || Math.abs(calculated.riskTotal - overview.outstanding_portfolio_aed) > 0.05;
  const largestGrade = risk.reduce((largest, row) => row.outstanding_balance_aed > largest.outstanding_balance_aed ? row : largest);
  const metrics = [
    { label: "Loan Approval Rate", value: creditPercent(calculated.approvalRate), note: `${creditCount.format(overview.approved_applications)} approved / ${creditCount.format(overview.total_applications)} applications` },
    { label: "Loans Written (AED)", value: creditMoney(overview.loans_written_aed, true), note: "Funded origination value", exact: creditMoney(overview.loans_written_aed) },
    { label: "Outstanding Loan Portfolio (AED)", value: creditMoney(overview.outstanding_portfolio_aed, true), note: "Total outstanding exposure", exact: creditMoney(overview.outstanding_portfolio_aed) },
    { label: "30+ DPD Rate", value: creditPercent(calculated.dpd30Rate), note: "Balance-weighted · 30+ DPD / total balance", elevated: true },
  ];
  return <>
    <section className="credit-scorecard" aria-labelledby="credit-scorecard-title">
      <SectionLabel><span id="credit-scorecard-title">EXECUTIVE SCORECARD</span></SectionLabel>
      <div className="credit-kpis">{metrics.map((metric) => <article className={metric.elevated ? "credit-kpi credit-kpi-risk" : "credit-kpi"} key={metric.label}>
        <h2>{metric.label}</h2><div className="credit-kpi-value" title={metric.exact}>{metric.value}</div><p>{metric.note}</p>
      </article>)}</div>
      <dl className="credit-support">
        <div><dt>Funded loans</dt><dd>{creditCount.format(overview.funded_loans)}</dd></div>
        <div><dt>90+ DPD Rate · balance-weighted</dt><dd>{creditPercent(calculated.dpd90Rate)}</dd></div>
        <div><dt>Non-performing loans</dt><dd>{creditCount.format(overview.nonperforming_loans)}</dd></div>
      </dl>
      {discrepancy ? <p className="credit-notice" role="status">DPD discrepancy: this page calculates {creditPercent(calculated.dpd30Rate)}; the executive KPI reports {creditPercent(executiveMetric.metric_value)} for the same date. Both values are retained; reconcile their source populations.</p>
        : executiveMetric && calculated.dpd30Rate !== null ? <p className="credit-note">30+ DPD agrees with the executive KPI ({creditPercent(executiveMetric.metric_value)}) at two-decimal precision.</p>
        : <p className="credit-notice">Executive KPI comparison unavailable: no unique readable 30+ DPD record for this reporting date, or no portfolio balance to calculate a rate.</p>}
      {overviewDiscrepancy && <p className="credit-notice">Credit overview rate discrepancy: the overview reports {creditPercent(overview.dpd30_rate_pct)}; the delinquency balances calculate {creditPercent(calculated.dpd30Rate)}.</p>}
      {balanceMismatch && <p className="credit-notice">Source balance discrepancy: overview {creditMoney(overview.outstanding_portfolio_aed)}, delinquency {creditMoney(calculated.portfolio)}, risk distribution {creditMoney(calculated.riskTotal)}. Distribution shares use each view’s own total; validate snapshot alignment.</p>}
    </section>

    <section className="credit-section" aria-labelledby="credit-funnel-title">
      <SectionLabel>ORIGINATION FUNNEL</SectionLabel><h2 id="credit-funnel-title">From application to funded lending.</h2>
      <div className="credit-funnel">
        <article><h3>Applications</h3><strong>{creditCount.format(overview.total_applications)}</strong><p>Starting population</p></article>
        <article><h3><span aria-hidden="true">→ </span>Approved</h3><strong>{creditCount.format(overview.approved_applications)}</strong><p>{creditPercent(calculated.approvalRate)} of applications</p></article>
        <article><h3><span aria-hidden="true">→ </span>Funded</h3><strong>{creditCount.format(overview.funded_loans)}</strong><p>{creditPercent(calculated.fundingConversion)} of approvals · indicative</p></article>
      </div>
      <p className="credit-copy">{creditCount.format(overview.declined_applications)} applications were declined ({creditPercent(percentage(overview.declined_applications, overview.total_applications))} of applications). Funded loans represent a separate population; approval-to-funding conversion is indicative until cohort linkage is validated. The gap between approvals and funded loans cannot yet be treated as customer dropout.</p>
    </section>

    <section className="credit-section" aria-labelledby="credit-quality-title">
      <SectionLabel>PORTFOLIO QUALITY</SectionLabel><h2 id="credit-quality-title">Delinquency through the lens of exposure.</h2>
      <p className="credit-copy">Bars show the share of outstanding balance, alongside loan counts. The 30+ DPD rate includes the 30–59, 60–89 and 90+ DPD buckets.</p>
      <ExposureChart total={calculated.portfolio} rows={delinquency.map((row) => ({ label: row.delinquency_bucket, count: row.loan_count, balance: row.outstanding_balance_aed, elevated: row.bucket_order >= 3 }))} />
    </section>

    <section className="credit-section" aria-labelledby="credit-risk-title">
      <SectionLabel>RISK CONCENTRATION</SectionLabel><h2 id="credit-risk-title">Where the portfolio balance is concentrated.</h2>
      <p className="credit-copy">Exposure by risk grade A–E. Grades D and E are highlighted as higher-risk populations; balance share takes priority over loan count.</p>
      <ExposureChart risk total={calculated.riskTotal} rows={risk.map((row) => ({ label: `Grade ${row.risk_grade}`, count: row.loan_count, balance: row.outstanding_balance_aed, elevated: ["D", "E"].includes(row.risk_grade) }))} />
    </section>

    <section className="credit-interpretation" aria-labelledby="credit-interpretation-title">
      <SectionLabel>EXECUTIVE INTERPRETATION</SectionLabel><h2 id="credit-interpretation-title">Growth and risk, read together.</h2>
      <div className="credit-interpretation-grid">
        <div><h3>Origination</h3><p>{creditPercent(calculated.approvalRate)} of {creditCount.format(overview.total_applications)} applications were approved. {creditCount.format(overview.funded_loans)} funded loans account for {creditMoney(overview.loans_written_aed, true)} in lending. Cohort linkage is needed to identify post-approval dropout.</p></div>
        <div><h3>Delinquent exposure</h3><p>{creditMoney(calculated.dpd30Balance, true)} across {creditCount.format(calculated.dpd30Loans)} loans is 30+ days past due, representing {creditPercent(calculated.dpd30Rate)} of outstanding balance.</p></div>
        <div><h3>Higher-risk concentration</h3><p>Grades D and E hold {creditMoney(calculated.higherRiskBalance, true)}, or {creditPercent(calculated.higherRiskShare)} of portfolio balance. Grade {largestGrade.risk_grade} has the largest exposure share at {creditPercent(percentage(largestGrade.outstanding_balance_aed, calculated.riskTotal))}.</p></div>
      </div>
      <p className="credit-note">This snapshot identifies exposure and conversion, but does not establish whether risk is improving or deteriorating, or whether lending growth is responsible. Historical comparisons, targets and validated cohorts are needed for those judgments. Distribution views do not expose reporting dates; totals are checked against the dated overview.</p>
    </section>
  </>;
}

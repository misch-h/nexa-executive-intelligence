"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import type { ExecutiveMetric, MetricHistoryPoint } from "../lib/metrics";
import { dashboardValue, isCertified, parseDashboard, parseDashboardHistory, type DashboardData, type DashboardMetric } from "../lib/executiveDashboard";
import { formatGovernanceDate } from "../lib/governance";
import ExecutiveHeader from "../components/ExecutiveHeader";
import ExecutiveMetricTile from "../components/ExecutiveMetricTile";
import MetricDrawer from "../components/MetricDrawer";
import ArchitectureModal from "../components/ArchitectureModal";
import SectionLabel from "../components/SectionLabel";
import "./executive-v2.css";

type State = { status: "loading" } | { status: "error" } | { status: "empty" } |
  { status: "ready"; data: DashboardData; history: MetricHistoryPoint[]; historyUnavailable: boolean };

export default function Home() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<ExecutiveMetric | null>(null);
  const [architectureOpen, setArchitectureOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const responses = await Promise.allSettled([
          supabase.from("executive_metrics_api").select("*").abortSignal(controller.signal),
          supabase.from("executive_extended_metrics_api").select("metric_id,metric_name,domain,metric_value,unit,as_of_date").abortSignal(controller.signal),
          supabase.from("metric_history_api").select("metric_id,metric_name,domain,unit,metric_value,as_of_date").order("as_of_date", { ascending: true }).abortSignal(controller.signal),
        ]);
        const values = responses.slice(0, 2).map((response) => {
          if (response.status === "rejected") throw response.reason;
          if (response.value.error) throw response.value.error;
          return response.value.data;
        });
        const data = parseDashboard(values[0], values[1]);
        let history: MetricHistoryPoint[] = [];
        let historyUnavailable = true;
        const historyResponse = responses[2];
        if (historyResponse.status === "fulfilled" && !historyResponse.value.error) {
          try { history = parseDashboardHistory(historyResponse.value.data); historyUnavailable = false; } catch { /* Show current metrics without unsupported trends. */ }
        }
        if (!controller.signal.aborted) setState(data ? { status: "ready", data, history, historyUnavailable } : { status: "empty" });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  function retry() { setState({ status: "loading" }); setAttempt((value) => value + 1); }
  return <main className="page-shell executive-v2"><div className="page-wrap">
    <ExecutiveHeader />
    <section className="v2-hero">
      <div className="v2-heading-row"><SectionLabel>EXECUTIVE INTELLIGENCE</SectionLabel><span className="v2-synthetic">SYNTHETIC DATA · {state.status === "ready" ? `AS AT ${formatGovernanceDate(state.data.date).toUpperCase()}` : "REPORTING DATE PENDING"}</span></div>
      <h1>The bank, at a glance.</h1>
      <p>One trusted view of growth, financial position and emerging risk.</p>
    </section>
    {state.status === "loading" && <div className="v2-state" role="status">Loading the executive snapshot…</div>}
    {state.status === "error" && <div className="v2-state" role="alert"><h2>The executive snapshot is unavailable.</h2><p>One or more metric sources could not be read, are incomplete, or contain conflicting records or reporting dates.</p><button type="button" onClick={retry}>Try again</button></div>}
    {state.status === "empty" && <div className="v2-state" role="status"><h2>No executive metrics are published.</h2><p>The views returned no visible records.</p><button type="button" onClick={retry}>Refresh snapshot</button></div>}
    {state.status === "ready" && <ExecutiveSnapshot state={state} onSelect={setSelected} />}
    <footer className="trust-footer"><div><div className="trust-title">Trusted by design</div><div className="trust-copy">Certified definitions · visible ownership · proposed measures clearly identified</div><div className="trust-copy">Demonstration environment · Synthetic data · No live banking information</div></div><button className="trust-button" type="button" onClick={() => setArchitectureOpen(true)}>Explore architecture →</button></footer>
  </div>
    <MetricDrawer metric={selected} onClose={() => setSelected(null)} />
    <ArchitectureModal open={architectureOpen} onClose={() => setArchitectureOpen(false)} />
  </main>;
}

function ExecutiveSnapshot({ state, onSelect }: { state: Extract<State, { status: "ready" }>; onSelect: (metric: ExecutiveMetric) => void }) {
  const { data, history } = state;
  const all = [...data.certified, ...data.proposed];
  const byName = new Map(all.map((metric) => [metric.metric_name, metric]));
  function metric(name: string): DashboardMetric { return byName.get(name)!; }
  function value(name: string) { return dashboardValue(metric(name)); }
  function tile(name: string, note?: string, headline = false, compact = false) {
    return <ExecutiveMetricTile key={name} metric={metric(name)} note={note} headline={headline} compact={compact} history={history} onSelect={onSelect} />;
  }
  const attention = data.certified.filter((item) => ["AMBER", "RED"].includes(item.rag_status));
  const period = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${data.date}T00:00:00Z`));
  const dpd = metric("30+ DPD Rate") as ExecutiveMetric;
  const active = metric("Active Customer Rate") as ExecutiveMetric;
  return <>
    <section aria-label="Headline metrics" className="v2-headline-grid">
      {tile("Loan Approval Rate", "Approved applications / total applications", true)}
      {tile("30+ DPD Rate", "Balance-weighted delinquent exposure", true)}
      {tile("Savings Deposits", "Open savings account balances", true)}
      {tile("Active Customer Rate", "Eligible customers with qualifying 30-day activity", true)}
    </section>
    <div className="v2-trust-line"><span>{data.certified.length} Executive Certified · {data.proposed.length} Proposed</span><span>{attention.length} certified metrics require attention under existing RAG rules</span></div>
    {state.historyUnavailable && <p className="v2-notice" role="status">Historical data is unavailable. Current values remain visible; trend indicators are omitted.</p>}

    <section className="v2-section" aria-labelledby="v2-growth-title">
      <div className="v2-section-heading"><div><SectionLabel>01 · GROWTH &amp; CREDIT</SectionLabel><h2 id="v2-growth-title">Origination, exposure and credit cost.</h2></div><Link href="/credit">Explore Credit &amp; Lending →</Link></div>
      <div className="v2-growth-grid">{tile("Loans Written", "Original funded loan value for the reporting period")}{tile("Gross Loan Portfolio", "Outstanding principal across funded loans")}{tile("Net Credit Loss", "Write-offs less subsequent recoveries")}</div>
    </section>

    <section className="v2-section v2-financial" aria-labelledby="v2-financial-title">
      <div><SectionLabel>02 · FINANCIAL POSITION</SectionLabel><h2 id="v2-financial-title">Balances in context.</h2><p>Deposits and loan balances describe the financial position. They are not revenue or measures of profitability.</p></div>
      <dl className="v2-financial-references">{["Savings Deposits", "Gross Loan Portfolio", "Net Credit Loss"].map((name) => {
        const item = metric(name);
        const certified = isCertified(item);
        const content = <><span>{value(name)}</span><small>{certified ? item.certification_status : "Proposed · Not certified"} · {certified ? "View detail" : "View definition"} →</small></>;
        return <div key={name}><dt>{name}</dt><dd>{certified ? <button type="button" onClick={() => onSelect(item)}>{content}</button> : <Link href={`/metrics?metric=${encodeURIComponent(item.metric_id)}`}>{content}</Link>}</dd></div>;
      })}</dl>
    </section>

    <section className="v2-section" aria-labelledby="v2-customer-title">
      <div className="v2-section-heading"><div><SectionLabel>03 · CUSTOMER &amp; PRODUCT</SectionLabel><h2 id="v2-customer-title">Engagement beyond account ownership.</h2></div><Link href="/governance">Understand customer definitions →</Link></div>
      <p className="v2-section-copy">Transaction volume and value cover {period}. Transaction Value is gross recorded transaction value, not net payment flows or revenue.</p>
      <div className="v2-customer-grid">{tile("Active Customers (30D)", "Eligible customers with qualifying trailing 30-day activity")}{tile("Transaction Volume", `Recorded transactions · ${period}`)}{tile("Transaction Value", `Gross recorded value · ${period}`)}{tile("Open Savings Accounts", "Open savings account population")}</div>
    </section>

    <section className="v2-section" aria-labelledby="v2-experience-title">
      <SectionLabel>04 · CUSTOMER EXPERIENCE</SectionLabel><h2 id="v2-experience-title">Advocacy and service delivery.</h2>
      <div className="v2-experience-grid">{tile("Net Promoter Score", undefined, false, true)}{tile("Complaint Volume", undefined, false, true)}{tile("Complaints > SLA", undefined, false, true)}</div>
    </section>

    <section className="v2-interpretation" aria-labelledby="v2-interpretation-title">
      <SectionLabel>MANAGEMENT PERSPECTIVE</SectionLabel><h2 id="v2-interpretation-title">What deserves attention.</h2>
      <div className="v2-interpretation-grid">
        <div><h3>Lending &amp; credit quality</h3><p>{value("Loan Approval Rate")} of applications were approved, with {value("Loans Written")} in funded lending. The balance-weighted 30+ DPD rate is {value("30+ DPD Rate")}{dpd.target_value !== null ? ` against a ${dashboardValue({ ...dpd, metric_value: dpd.target_value })} target` : ""}. Its governed RAG status is {dpd.rag_status.toLowerCase()}.</p></div>
        <div><h3>Customer engagement</h3><p>{value("Active Customers (30D)")} customers had qualifying activity in the trailing 30 days. The certified Active Customer Rate is {value("Active Customer Rate")}{active.target_value !== null ? ` against a ${dashboardValue({ ...active, metric_value: active.target_value })} target` : ""}. Active-customer count remains a Proposed catalogue metric.</p></div>
        <div><h3>Deposits &amp; transaction activity</h3><p>Savings balances total {value("Savings Deposits")} across {value("Open Savings Accounts")} open accounts. {period} contains {value("Transaction Volume")} transactions and {value("Transaction Value")} in gross recorded value. These measures are Proposed and do not represent revenue.</p></div>
      </div>
      <p className="v2-attention-list">Management attention under existing RAG rules: {attention.length ? attention.map((item) => `${item.metric_name} (${item.rag_status.toLowerCase()})`).join(" · ") : "No certified metrics are amber or red."}</p>
      <p className="v2-disclaimer">This synthetic reporting snapshot does not establish causation or whether growth is responsible. Proposed measures await formal approval and carry no assigned RAG thresholds.</p>
    </section>
  </>;
}

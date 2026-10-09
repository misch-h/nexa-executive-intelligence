"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { formatGovernanceDate, parseGovernanceMetrics, type GovernanceMetric } from "../lib/governance";
import SectionLabel from "./SectionLabel";

const domains = [
  { owner: "Finance", title: "Fee-paying customers" },
  { owner: "Product", title: "Transacting customers" },
  { owner: "Credit", title: "Active borrowers" },
];
const number = new Intl.NumberFormat("en-GB");
type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; metrics: GovernanceMetric[] };

export default function GovernanceContent() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data, error } = await supabase
          .from("metric_conflict_resolution_api")
          .select("definition_owner,metric_name,business_definition,metric_value,is_certified,as_of_date")
          .abortSignal(controller.signal);
        if (error) throw error;
        const metrics = parseGovernanceMetrics(data);
        if (!controller.signal.aborted) setState({ status: "ready", metrics });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  if (state.status === "loading") return <div className="governance-state" role="status" aria-live="polite">Loading governed definitions…</div>;
  if (state.status === "error") return (
    <div className="governance-state" role="alert">
      <h2>Governance data is unavailable.</h2>
      <p>We could not retrieve the metric definitions. Please try again. If this persists, check the view’s public read access.</p>
      <button type="button" onClick={retry}>Try again</button>
    </div>
  );
  if (!state.metrics.length) return (
    <div className="governance-state" role="status">
      <h2>No governance records available.</h2>
      <p>The view returned no visible definitions. Check that records are published and accessible to the public client.</p>
      <button type="button" onClick={retry}>Refresh</button>
    </div>
  );

  const latestDate = state.metrics.map((metric) => metric.as_of_date).sort().at(-1)!;
  const snapshot = state.metrics.filter((metric) => metric.as_of_date === latestDate);
  const certified = snapshot.filter((metric) => metric.is_certified && metric.definition_owner.toLowerCase() === "enterprise" && metric.metric_name.toLowerCase() === "active customers (30d)");
  const enterprise = certified.length === 1 ? certified[0] : undefined;
  function domainMetric(owner: string) {
    const matches = snapshot.filter((metric) => metric.definition_owner.toLowerCase() === owner.toLowerCase() && !metric.is_certified);
    return matches.length === 1 ? matches[0] : undefined;
  }
  const product = domainMetric("Product");
  const difference = enterprise && product ? enterprise.metric_value - product.metric_value : undefined;

  return (
    <>
      <section className="governance-certified" aria-labelledby="certified-title">
        <div className="governance-heading-row">
          <h2 id="certified-title">ENTERPRISE CUSTOMER POPULATION — 30D</h2>
          {enterprise && <span className="governance-certified-badge">CERTIFIED CUSTOMER DEFINITION</span>}
        </div>
        {enterprise ? <>
          <div className="governance-hero-value">{number.format(enterprise.metric_value)}<span>customers</span></div>
          <p className="governance-hero-definition">{enterprise.business_definition}</p>
          <p className="governance-copy v3-definition-owner">Business owner · Head of Customer</p>
          <p className="governance-copy">This population supplies the numerator for <Link href="/metrics?metric=MET-CUST-001">Active Customer Rate (MET-CUST-001)</Link>, the Executive Certified enterprise KPI. Certification here refers to the customer definition used by that rate.</p>
          <p className="governance-copy">The standalone <Link href="/metrics?metric=MET-CUST-002">Active Customers (30D) count (MET-CUST-002)</Link> remains Proposed and is not an Executive Certified KPI. The shared population count does not change its catalogue status.</p>
          <div className="governance-date">AS AT {formatGovernanceDate(enterprise.as_of_date).toUpperCase()} · TRAILING 30 DAYS</div>
        </> : <p>No unique certified enterprise definition is available for the latest reporting date.</p>}
      </section>

      <section className="governance-section" aria-labelledby="domains-title">
        <SectionLabel>DOMAIN COMPARISON</SectionLabel>
        <h2 id="domains-title">Different populations. Different business needs.</h2>
        <p className="governance-copy">These are domain-specific customer populations, not competing calculations of an identical metric. They should not be added together.</p>
        <div className="governance-domain-grid">
          {domains.map(({ owner, title }) => {
            const metric = domainMetric(owner);
            return <article className="governance-domain" key={owner}>
              <SectionLabel>{owner}</SectionLabel>
              <h3>{title}</h3>
              <div className="governance-domain-value">{metric ? number.format(metric.metric_value) : "—"}</div>
              <p>{metric?.business_definition ?? "No unique domain definition available for this reporting date."}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="governance-section governance-reconciliation" aria-labelledby="reconciliation-title">
        <div>
          <SectionLabel><span id="reconciliation-title">WHY THE NUMBERS DIFFER</span></SectionLabel>
          <h2>Activity becomes an enterprise standard.</h2>
          <p className="governance-copy">Product counts purchases, payments, transfers and salary credits, and excludes cash withdrawals. The enterprise definition includes cash withdrawals and applies active customer eligibility.</p>
          <p className="governance-copy">For this synthetic dataset, the additional customers are attributable to cash-withdrawal-only activity. Finance measures fee-paying customers; Credit measures customers with active loans and outstanding principal. Neither population is a reconciliation adjustment.</p>
        </div>
        <div className="governance-bridge">
          <div><span>Product</span><strong>{product ? number.format(product.metric_value) : "—"}</strong></div>
          <div><span>Enterprise</span><strong>{enterprise ? number.format(enterprise.metric_value) : "—"}</strong></div>
          <div className="governance-difference"><span>Difference · customers</span><strong>{difference !== undefined ? `${difference > 0 ? "+" : ""}${number.format(difference)}` : "—"}</strong></div>
          <p>{difference !== undefined && difference >= 0 ? "Cash-withdrawal-only activity in the current synthetic dataset." : "A comparable Product and Enterprise snapshot is required to reconcile the difference."}</p>
        </div>
      </section>

      <section className="governance-section" aria-labelledby="record-title">
        <SectionLabel>CERTIFICATION RECORD</SectionLabel>
        <h2 id="record-title">A definition with accountability.</h2>
        <div className="governance-record">
          <dl>
            <div><dt>Certified KPI</dt><dd>Active Customer Rate (MET-CUST-001)</dd></div>
            <div><dt>Definition scope</dt><dd>Enterprise customer population used as the rate’s numerator</dd></div>
            <div><dt>Standalone count</dt><dd>Active Customers (30D) (MET-CUST-002) — Proposed</dd></div>
            <div><dt>Business owner</dt><dd>Head of Customer</dd></div>
            <div><dt>Status</dt><dd>{enterprise ? "Certified customer definition — Prototype" : "Certification unavailable"}</dd></div>
            <div><dt>Reporting window</dt><dd>Trailing 30 days</dd></div>
            <div><dt>Reporting date</dt><dd>{enterprise ? formatGovernanceDate(enterprise.as_of_date) : "Unavailable"}</dd></div>
          </dl>
          <div className="governance-rules">
            <h3>Sources</h3>
            <ul><li><code>public.crm_customers</code></li><li><code>public.payment_transactions</code></li></ul>
            <h3>Qualifying activity</h3>
            <p>Card Purchase · Bill Payment · Transfer In · Transfer Out · Salary Credit · Cash Withdrawal</p>
            <h3>Excluded</h3><p>Fee · Refund</p>
          </div>
        </div>
        <p className="governance-note">This record illustrates the enterprise customer-definition standard in the synthetic banking prototype. It does not certify the standalone Proposed customer-count KPI.</p>
      </section>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ExecutiveMetric, MetricHistoryPoint } from "../lib/metrics";
import { dashboardValue, historyChange, metricHistory, parseDashboardHistory } from "../lib/executiveDashboard";
import { formatGovernanceDate } from "../lib/governance";
import { layerExplanations } from "../lib/visualSemantics";
import CertificationBadge from "./CertificationBadge";
import DomainBadge from "./DomainBadge";
import RAGBadge from "./RAGBadge";
import Sparkline from "./Sparkline";
import MetricDrawer from "./MetricDrawer";

type Lineage = { lineage_order: number; layer_name: string; object_name: string; object_type: string; transformation_description: string | null };
type Change = { version_number: number | string; change_type: string; change_description: string | null; effective_date: string | null; changed_at: string | null };
type State = { status: "loading" | "error" | "empty" } | { status: "ready"; metric: ExecutiveMetric; history: MetricHistoryPoint[]; lineage: Lineage[]; changes: Change[]; unavailable: string[] };

export default function GovernanceReview() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        // Existing published APIs, matching the executive and drawer contracts.
        const [metricResult, historyResult, lineageResult, changeResult] = await Promise.all([
          supabase.from("executive_metrics_api").select("*").eq("metric_id", "MET-CUST-001").abortSignal(controller.signal).returns<ExecutiveMetric[]>(),
          supabase.from("metric_history_api").select("metric_id,metric_name,domain,unit,metric_value,as_of_date").eq("metric_id", "MET-CUST-001").order("as_of_date").abortSignal(controller.signal),
          supabase.from("metric_lineage_api").select("lineage_order,layer_name,object_name,object_type,transformation_description").eq("metric_id", "MET-CUST-001").order("lineage_order").abortSignal(controller.signal).returns<Lineage[]>(),
          supabase.from("metric_change_history_api").select("version_number,change_type,change_description,effective_date,changed_at").eq("metric_id", "MET-CUST-001").order("changed_at", { ascending: false, nullsFirst: false }).abortSignal(controller.signal).returns<Change[]>(),
        ]);
        if (metricResult.error) throw metricResult.error;
        if (!metricResult.data?.length) { if (!controller.signal.aborted) setState({ status: "empty" }); return; }
        const metric = metricResult.data[0];
        if (metricResult.data.length !== 1 || metric.certification_status !== "Executive Certified" || !Number.isFinite(metric.metric_value) || !["GREEN", "AMBER", "RED", "GREY"].includes(metric.rag_status)) throw new Error("Invalid governed record");
        const unavailable: string[] = [];
        let history: MetricHistoryPoint[] = [];
        if (historyResult.error) unavailable.push("History");
        else { try { history = parseDashboardHistory(historyResult.data); } catch { unavailable.push("History"); } }
        if (lineageResult.error) unavailable.push("Lineage");
        if (changeResult.error) unavailable.push("Change history");
        if (!controller.signal.aborted) setState({ status: "ready", metric, history, lineage: lineageResult.error ? [] : lineageResult.data ?? [], changes: changeResult.error ? [] : changeResult.data ?? [], unavailable });
      } catch { if (!controller.signal.aborted) setState({ status: "error" }); }
    }
    void load(); return () => controller.abort();
  }, [attempt]);
  function retry() { setState({ status: "loading" }); setAttempt(value => value + 1); }
  if (state.status === "loading") return <p role="status">Loading certified metric and published controls…</p>;
  if (state.status !== "ready") return <section className="governance-state" role={state.status === "error" ? "alert" : "status"}><h2>{state.status === "error" ? "Certified metric review is unavailable." : "No certified metric record is published."}</h2><button type="button" onClick={retry}>Try again</button></section>;
  const { metric, history, lineage, changes, unavailable } = state;
  const points = metricHistory(metric, history);
  const layers = [...new Set(lineage.map(step => step.layer_name))].map(name => ({ name, stages: lineage.filter(step => step.layer_name === name) }));
  return <>
    <section className="v4-governance-identity" aria-labelledby="v4-governed-name">
      <div><span className="section-label">01 · METRIC IDENTITY</span><h2 id="v4-governed-name">{metric.metric_name}</h2><p>{metric.metric_id} · {metric.owner_role}</p></div>
      <div><DomainBadge domain={metric.domain} /><CertificationBadge status={metric.certification_status} /></div>
    </section>
    <section className="v4-governance-performance" aria-label="Metric performance">
      <div><span className="section-label">02 · PERFORMANCE</span><strong>{dashboardValue(metric)}</strong><RAGBadge status={metric.rag_status} /><p>Target {metric.target_value === null ? "not recorded" : `${metric.rag_direction === "HIGHER_IS_BETTER" ? "≥" : "≤"} ${dashboardValue({ ...metric, metric_value: metric.target_value })}`}</p><small>As at {formatGovernanceDate(metric.as_of_date)}</small></div>
      <div>{points.length >= 2 ? <><Sparkline data={points} status={metric.rag_status} /><p>{historyChange(metric, history)}</p><small>{points[0].as_of_date} — {points.at(-1)!.as_of_date} · Published history</small></> : <p>{unavailable.includes("History") ? "Published history is unavailable." : "No comparable published history."}</p>}</div>
    </section>
    <section className="v4-governance-controls" aria-label="Meaning and controls">
      <div><span className="section-label">03 · MEANING &amp; CONTROLS</span><h3>What the metric means</h3><p>{metric.business_definition}</p><details><summary>Calculation logic</summary><pre>{metric.calculation_logic}</pre></details></div>
      <div><h3>Ownership and governance</h3><dl><div><dt>Business owner</dt><dd>{metric.owner_role}</dd></div><div><dt>Data product</dt><dd>{metric.data_product}</dd></div><div><dt>Certification</dt><dd>{metric.certification_status}</dd></div></dl><button type="button" className="v4-detail-action" onClick={() => setOpen(true)}>Inspect metric controls →</button></div>
    </section>
    <section className="v4-governance-lineage" aria-labelledby="v4-lineage-title"><span className="section-label">04 · DATA LINEAGE</span><h3 id="v4-lineage-title">From source to executive consumption</h3>
      {lineage.length ? <><p className="v4-lineage-note">Published stages grouped by layer. Only recorded lineage is shown.</p><ol className="v4-lineage-flow">{layers.map(layer => <li key={layer.name}><span>{layer.name}</span><p className="v41-layer-explanation">{layerExplanations[layer.name] ?? "Published lineage layer"}</p>{layer.stages.map((step, index) => <div className="v4-lineage-object" key={`${step.lineage_order}-${index}`}><strong>{step.object_name}</strong><small>{step.object_type}</small>{step.transformation_description && <details><summary>Transformation detail</summary><p>{step.transformation_description}</p></details>}</div>)}</li>)}</ol></> : <p>{unavailable.includes("Lineage") ? "Published lineage is unavailable." : "No lineage stages are published for this metric."}</p>}
    </section>
    <section className="v4-governance-changes" aria-labelledby="v4-changes-title"><span className="section-label">05 · CHANGE HISTORY</span><h3 id="v4-changes-title">Published definition changes</h3>
      {changes.length ? <ol>{changes.map((change, index) => <li key={`${change.version_number}-${index}`}><strong>Version {change.version_number} · {change.change_type}</strong><span>{change.effective_date ?? change.changed_at?.slice(0, 10) ?? "Date not recorded"}</span><p>{change.change_description ?? "No change description recorded."}</p></li>)}</ol> : <p>{unavailable.includes("Change history") ? "Published change history is unavailable." : "No definition changes are published for this metric."}</p>}
    </section>
    <MetricDrawer metric={open ? metric : null} onClose={() => setOpen(false)} />
  </>;
}

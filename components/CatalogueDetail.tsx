"use client";

import { useEffect, useRef, useState } from "react";
import { useDialog } from "../lib/useDialog";
import { supabase } from "../lib/supabase";
import { governanceDescriptions, parseCatalogueLineage, type CatalogueLineage, type CatalogueMetric } from "../lib/catalogue";
import { formatGovernanceDate } from "../lib/governance";
import SectionLabel from "./SectionLabel";

type LineageState = { status: "loading" | "error" } | { status: "ready"; rows: CatalogueLineage[] };

export default function CatalogueDetail({ metric, onClose }: { metric: CatalogueMetric; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [lineage, setLineage] = useState<LineageState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useDialog(dialog, onClose, true);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data, error } = await supabase.from("metric_lineage_api")
          .select("metric_id,lineage_order,layer_name,object_name,object_type,transformation_description")
          .eq("metric_id", metric.metric_id).order("lineage_order", { ascending: true }).abortSignal(controller.signal);
        if (error) throw error;
        const rows = parseCatalogueLineage(data, metric.metric_id);
        if (!controller.signal.aborted) setLineage({ status: "ready", rows });
      } catch {
        if (!controller.signal.aborted) setLineage({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [metric.metric_id, attempt]);
  const fields = [
    ["Metric ID", metric.metric_id], ["Metric name", metric.metric_name], ["Domain", metric.domain],
    ["Owner", metric.owner_role], ["Refresh cadence", metric.refresh_cadence],
    ["Certification status", metric.certification_status], ["Data product", metric.data_product],
    ["Reporting date", metric.as_of_date ? formatGovernanceDate(metric.as_of_date) : null],
  ];
  return <dialog ref={dialog} className="dictionary-detail" tabIndex={-1} aria-modal="true" aria-labelledby="dictionary-detail-title" aria-describedby="dictionary-detail-description" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target === event.currentTarget) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }
  }}>
    <header className="dictionary-detail-header"><div><SectionLabel>METRIC DEFINITION</SectionLabel><h2 id="dictionary-detail-title">{metric.metric_name}</h2></div><button type="button" onClick={onClose} autoFocus aria-label="Close metric details">Close</button></header>
    <div className="dictionary-detail-body">
      <p id="dictionary-detail-description" className="dictionary-status-explanation">{metric.certification_status} · {governanceDescriptions[metric.certification_status] ?? "Certification status as recorded in the catalogue."}</p>
      <dl className="dictionary-detail-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "Not recorded"}</dd></div>)}</dl>
      <section><h3>Business definition</h3><p>{metric.business_definition ?? "No business definition recorded."}</p></section>
      <section><h3>Calculation formula</h3>{metric.calculation_logic ? <pre><code>{metric.calculation_logic}</code></pre> : <p>No calculation formula recorded.</p>}</section>
      <section><h3>Source datasets</h3>{metric.source_dataset ? <ul className="dictionary-sources">{metric.source_dataset.split(";").map((source) => source.trim()).filter(Boolean).map((source, index) => <li key={`${source}-${index}`}><code>{source}</code></li>)}</ul> : <p>No source datasets recorded.</p>}</section>
      <section><h3>Metric lineage</h3>
        {lineage.status === "loading" && <p role="status">Loading lineage stages…</p>}
        {lineage.status === "error" && <div role="status"><p>Lineage could not be retrieved. The metric definition remains available.</p><button type="button" onClick={() => { setLineage({ status: "loading" }); setAttempt((value) => value + 1); }}>Retry lineage</button></div>}
        {lineage.status === "ready" && (lineage.rows.length ? <ol className="dictionary-lineage">{lineage.rows.map((stage, index) => <li key={`${stage.lineage_order}-${stage.object_name}-${index}`}><span>{stage.layer_name} · {stage.object_type}</span><strong>{stage.object_name}</strong>{stage.transformation_description && <p>{stage.transformation_description}</p>}</li>)}</ol> : <p>No lineage stages are published for this metric.</p>)}
      </section>
    </div>
  </dialog>;
}

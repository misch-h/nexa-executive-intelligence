"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { catalogueSummary, filterCatalogue, governanceDescriptions, parseCatalogue, type CatalogueMetric } from "../lib/catalogue";
import CatalogueDetail from "./CatalogueDetail";

type CatalogueState = { status: "loading" } | { status: "error" } | { status: "ready"; metrics: CatalogueMetric[] };

export default function MetricCatalogue() {
  const [state, setState] = useState<CatalogueState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<CatalogueMetric | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data, error } = await supabase.from("enterprise_metric_catalogue_api")
          .select("metric_id,metric_name,domain,owner_role,business_definition,calculation_logic,source_dataset,refresh_cadence,certification_status,data_product,as_of_date")
          .abortSignal(controller.signal);
        if (error) throw error;
        const metrics = parseCatalogue(data);
        if (!controller.signal.aborted) {
          setState({ status: "ready", metrics });
          const requestedId = new URLSearchParams(window.location.search).get("metric");
          if (requestedId) setSelected(metrics.find((metric) => metric.metric_id === requestedId) ?? null);
        }
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  function retry() { setState({ status: "loading" }); setAttempt((value) => value + 1); }
  if (state.status === "loading") return <div className="dictionary-state" role="status">Loading enterprise metric catalogue…</div>;
  if (state.status === "error") return <div className="dictionary-state" role="alert"><h2>The catalogue is unavailable.</h2><p>We could not retrieve the metric definitions. Try again; if this persists, check the view’s public read access and response fields.</p><button type="button" onClick={retry}>Try again</button></div>;
  const { metrics } = state;
  const summary = catalogueSummary(metrics);
  const domains = [...new Set(metrics.map((metric) => metric.domain))].sort();
  const statuses = [...new Set([...Object.keys(governanceDescriptions), ...metrics.map((metric) => metric.certification_status)])];
  const filtered = filterCatalogue(metrics, query, domain, status);
  function clear() { setQuery(""); setDomain(""); setStatus(""); }
  return <>
    <dl className="dictionary-summary">
      {[ ["Total metrics", summary.total], ["Executive Certified", summary.certified], ["Proposed", summary.proposed], ["Business domains", summary.domains] ].map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}
    </dl>
    <div className="dictionary-governance">{Object.entries(governanceDescriptions).map(([label, description]) => <p key={label}><strong>{label}</strong><span>{description}</span></p>)}</div>
    {!metrics.length ? <div className="dictionary-state" role="status"><h2>No metrics are published yet.</h2><p>The catalogue returned no visible records.</p><button type="button" onClick={retry}>Refresh catalogue</button></div> : <section aria-labelledby="dictionary-catalogue-title">
      <h2 id="dictionary-catalogue-title" className="dictionary-catalogue-title">Enterprise metric catalogue</h2>
      <div className="dictionary-controls">
        <label className="dictionary-search">Search metrics<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, domain or definition" /></label>
        <label>Domain<select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="">All domains</option>{domains.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Certification status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button className="dictionary-clear" onClick={clear} type="button" disabled={!query && !domain && !status}>Clear filters</button>
      </div>
      <p className="dictionary-result-count" role="status" aria-live="polite">{filtered.length} of {metrics.length} metrics</p>
      {filtered.length ? <div className="dictionary-table-wrap" role="region" aria-label="Metric catalogue table" tabIndex={0}><table className="dictionary-table">
        <caption className="dictionary-sr-only">Enterprise definitions and ownership. Select a metric name to view its definition and lineage.</caption>
        <thead><tr><th scope="col">Metric name</th><th scope="col">Domain</th><th scope="col">Owner</th><th scope="col">Certification status</th><th scope="col">Refresh cadence</th></tr></thead>
        <tbody>{filtered.map((metric) => <tr key={metric.metric_id} onClick={() => setSelected(metric)}>
          <th scope="row"><button type="button" onClick={() => setSelected(metric)} aria-haspopup="dialog">{metric.metric_name}</button><span className="dictionary-metric-id">{metric.metric_id}</span></th>
          <td>{metric.domain}</td><td>{metric.owner_role ?? "Not recorded"}</td><td><span className={metric.certification_status === "Executive Certified" ? "dictionary-certified" : "dictionary-status"}>{metric.certification_status}</span></td><td>{metric.refresh_cadence ?? "Not recorded"}</td>
        </tr>)}</tbody>
      </table></div> : <div className="dictionary-state"><h3>No matching metrics.</h3><p>Try another search term or clear the filters.</p><button type="button" onClick={clear}>Clear filters</button></div>}
    </section>}
    {selected && <CatalogueDetail key={selected.metric_id} metric={selected} onClose={() => setSelected(null)} />}
  </>;
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { filterDataProducts, parseDataProducts, type DataProduct } from "../lib/dataProducts";
import DataProductDetail from "./DataProductDetail";
import SectionLabel from "./SectionLabel";

type State = { status: "loading" } | { status: "error" } | { status: "ready"; products: DataProduct[] };

export default function DataMarketplace() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");
  const [selected, setSelected] = useState<DataProduct | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data, error } = await supabase.from("enterprise_data_products_api")
          .select("product_id,product_name,domain,description,owner_role,source_datasets,refresh_cadence,access_classification,approval_role,access_sla,product_status")
          .abortSignal(controller.signal);
        if (error) throw error;
        const products = parseDataProducts(data);
        if (!controller.signal.aborted) setState({ status: "ready", products });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  function retry() { setState({ status: "loading" }); setAttempt((value) => value + 1); }
  function clear() { setQuery(""); setDomain(""); }
  if (state.status === "loading") return <div className="marketplace-state" role="status">Loading enterprise data products…</div>;
  if (state.status === "error") return <div className="marketplace-state" role="alert"><h2>The data catalogue is unavailable.</h2><p>We could not retrieve the product records. Try again; if this persists, check the view’s public read access and response fields.</p><button onClick={retry} type="button">Try again</button></div>;
  const { products } = state;
  if (!products.length) return <div className="marketplace-state" role="status"><h2>No data products are published yet.</h2><p>The view returned no visible product records.</p><button onClick={retry} type="button">Refresh catalogue</button></div>;
  const domains = [...new Set(products.map((product) => product.domain))].sort();
  const filtered = filterDataProducts(products, query, domain);
  return <section className="marketplace-catalogue" aria-labelledby="marketplace-catalogue-title">
    <h2 id="marketplace-catalogue-title">Enterprise data products</h2>
    <div className="marketplace-controls">
      <label className="marketplace-search">Search products<input type="search" placeholder="Product name or description" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label>Business domain<select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="">All domains</option>{domains.map((value) => <option key={value}>{value}</option>)}</select></label>
      <button type="button" onClick={clear} disabled={!query && !domain}>Clear filters</button>
    </div>
    <p className="marketplace-results" role="status" aria-live="polite">{filtered.length} of {products.length} data products</p>
    {filtered.length ? <div className="marketplace-product-grid">{filtered.map((product) => <article className="marketplace-product" key={product.product_id}>
      <div className="marketplace-heading-row"><SectionLabel>{product.domain}</SectionLabel><span className="marketplace-product-status">{product.product_status ?? "Status not recorded"}</span></div>
      <h3><button type="button" aria-haspopup="dialog" onClick={() => setSelected(product)}>{product.product_name}</button></h3>
      <p className="marketplace-description">{product.description ?? "No description recorded."}</p>
      <dl><div><dt>Owner</dt><dd>{product.owner_role ?? "Not recorded"}</dd></div><div><dt>Refresh cadence</dt><dd>{product.refresh_cadence ?? "Not recorded"}</dd></div><div><dt>Access classification</dt><dd>{product.access_classification ?? "Not recorded"}</dd></div></dl>
      <button className="marketplace-view" type="button" aria-haspopup="dialog" aria-label={`View ${product.product_name} details`} onClick={() => setSelected(product)}>View product details <span aria-hidden="true">→</span></button>
    </article>)}</div> : <div className="marketplace-state"><h3>No matching data products.</h3><p>Try another search term or clear your filters.</p><button type="button" onClick={clear}>Clear filters</button></div>}
    {selected && <DataProductDetail key={selected.product_id} product={selected} onClose={() => setSelected(null)} />}
  </section>;
}

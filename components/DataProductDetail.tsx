"use client";

import { useState } from "react";
import type { DataProduct } from "../lib/dataProducts";
import MarketplaceDialog from "./MarketplaceDialog";
import SectionLabel from "./SectionLabel";

export default function DataProductDetail({ product, onClose }: { product: DataProduct; onClose: () => void }) {
  const [accessOpen, setAccessOpen] = useState(false);
  const fields = [
    ["Business owner", product.owner_role], ["Business domain", product.domain],
    ["Refresh cadence", product.refresh_cadence], ["Access classification", product.access_classification],
    ["Approval authority", product.approval_role], ["Access SLA · proposed target", product.access_sla],
    ["Product status", product.product_status],
  ];
  return <MarketplaceDialog titleId="marketplace-detail-title" descriptionId="marketplace-detail-description" onClose={onClose}>
    <header className="marketplace-dialog-header"><div><SectionLabel>DATA PRODUCT</SectionLabel><h2 id="marketplace-detail-title">{product.product_name}</h2></div><button type="button" autoFocus onClick={onClose} aria-label="Close product details">Close</button></header>
    <div className="marketplace-dialog-body">
      <p className="marketplace-product-id">{product.product_id}</p>
      <p id="marketplace-detail-description">{product.description ?? "No description recorded."}</p>
      <dl className="marketplace-detail-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "Not recorded"}</dd></div>)}</dl>
      <section className="marketplace-sources"><h3>Source datasets</h3>{product.source_datasets ? <ul>{product.source_datasets.split(";").map((source) => source.trim()).filter(Boolean).map((source, index) => <li key={`${source}-${index}`}><code>{source}</code></li>)}</ul> : <p>No source datasets recorded.</p>}</section>
      <div className="marketplace-request"><button className="marketplace-primary" type="button" aria-haspopup="dialog" onClick={() => setAccessOpen(true)}>Request Access</button><p>Explore the illustrative approval process. Access SLAs are proposed targets, not production commitments.</p></div>
    </div>
    {accessOpen && <MarketplaceDialog modal titleId="marketplace-access-title" descriptionId="marketplace-access-description" onClose={() => setAccessOpen(false)}>
      <header className="marketplace-dialog-header"><div><SectionLabel>ILLUSTRATIVE ACCESS PROCESS</SectionLabel><h2 id="marketplace-access-title">Access with accountability.</h2></div><button type="button" autoFocus onClick={() => setAccessOpen(false)} aria-label="Close access process">Close</button></header>
      <div className="marketplace-dialog-body">
        <p id="marketplace-access-description">Access to <strong>{product.product_name}</strong> follows an approval process appropriate to its data classification.</p>
        <ol className="marketplace-access-steps">
          <li><strong>Discover</strong><p>Understand the product, its ownership and access classification.</p></li>
          <li><strong>Request</strong><p>Provide business justification, intended use and the scope of access needed.</p></li>
          <li><strong>Approve</strong><p>Obtain owner approval and appropriate data-governance review. Approval authority: {product.approval_role ?? "Not recorded"}.</p></li>
          <li><strong>Access</strong><p>Approved access would follow the agreed scope and data-handling requirements.</p></li>
        </ol>
        <p className="marketplace-prototype-note">Access requests are illustrative in this prototype. No request is submitted or stored.</p>
      </div>
    </MarketplaceDialog>}
  </MarketplaceDialog>;
}

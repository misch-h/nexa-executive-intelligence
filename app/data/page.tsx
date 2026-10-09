import type { Metadata } from "next";
import ExecutiveHeader from "../../components/ExecutiveHeader";
import SectionLabel from "../../components/SectionLabel";
import DataMarketplace from "../../components/DataMarketplace";
import "./data.css";

export const metadata: Metadata = {
  title: "Data Marketplace | NEXA Executive Intelligence",
  description: "Discover enterprise data products, ownership and illustrative access procedures.",
};

const commitments = [
  ["Access request acknowledgement", "1 business day"],
  ["Standard access review", "3 business days"],
  ["Critical data incident response", "4 business hours"],
  ["Data refresh", "According to product cadence"],
  ["Metric changes", "Subject to governance approval"],
];

export default function DataPage() {
  return <main className="page-shell marketplace-page"><div className="page-wrap">
    <ExecutiveHeader />
    <section className="marketplace-intro">
      <div className="marketplace-heading-row"><SectionLabel>DATA MARKETPLACE</SectionLabel><span className="marketplace-badge">SYNTHETIC DATA · PROTOTYPE</span></div>
      <h1>Find the data. Understand it. Put it to work.</h1>
      <p>Discover enterprise data products, understand their ownership and request appropriate access.</p>
    </section>
    <DataMarketplace />
    <section className="marketplace-commitments" aria-labelledby="marketplace-commitments-title">
      <SectionLabel>PROPOSED OPERATING MODEL</SectionLabel>
      <h2 id="marketplace-commitments-title">Service commitments, by design.</h2>
      <p>All service levels below are proposed targets for this prototype, not actual production SLAs.</p>
      <dl>{commitments.map(([label, target]) => <div key={label}><dt>{label}</dt><dd>{target}</dd></div>)}</dl>
    </section>
  </div></main>;
}

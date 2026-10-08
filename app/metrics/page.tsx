import type { Metadata } from "next";
import ExecutiveHeader from "../../components/ExecutiveHeader";
import SectionLabel from "../../components/SectionLabel";
import MetricCatalogue from "../../components/MetricCatalogue";
import "./metrics.css";

export const metadata: Metadata = {
  title: "Enterprise KPI Dictionary | NEXA Executive Intelligence",
  description: "Definitions, ownership, certification and lineage for enterprise metrics.",
};

export default function MetricsPage() {
  return <main className="page-shell dictionary-page"><div className="page-wrap">
    <ExecutiveHeader />
    <section className="dictionary-intro">
      <div className="dictionary-heading-row"><SectionLabel>METRIC INTELLIGENCE</SectionLabel><span className="dictionary-synthetic">SYNTHETIC DATA</span></div>
      <h1>Every number has a definition.</h1>
      <p>A governed catalogue of the measures that power enterprise decisions.</p>
    </section>
    <MetricCatalogue />
  </div></main>;
}

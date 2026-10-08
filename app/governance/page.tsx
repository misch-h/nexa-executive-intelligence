import type { Metadata } from "next";
import ExecutiveHeader from "../../components/ExecutiveHeader";
import SectionLabel from "../../components/SectionLabel";
import GovernanceContent from "../../components/GovernanceContent";
import "./governance.css";

export const metadata: Metadata = {
  title: "Metric Governance | NEXA Executive Intelligence",
  description: "A certified enterprise customer standard across Finance, Product and Credit.",
};

export default function GovernancePage() {
  return (
    <main className="page-shell governance-page">
      <div className="page-wrap">
        <ExecutiveHeader />
        <section className="governance-intro">
          <div className="governance-heading-row">
            <SectionLabel>METRIC GOVERNANCE</SectionLabel>
            <span className="governance-synthetic">SYNTHETIC DATA · 31 AUG 2026</span>
          </div>
          <h1>One metric.<br />Multiple interpretations.</h1>
          <p>Establishing a trusted enterprise standard across Finance, Product and Credit.</p>
        </section>
        <GovernanceContent />
        <blockquote className="governance-principle">
          “Domain-specific metrics remain useful. Enterprise certification establishes which definition is used for cross-functional executive reporting.”
        </blockquote>
      </div>
    </main>
  );
}

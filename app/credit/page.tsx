import type { Metadata } from "next";
import ExecutiveHeader from "../../components/ExecutiveHeader";
import CreditDashboard from "../../components/CreditDashboard";
import "./credit.css";

export const metadata: Metadata = {
  title: "Credit & Lending | NEXA Executive Intelligence",
  description: "Origination performance, portfolio health and credit risk concentration.",
};

export default function CreditPage() {
  return <main className="page-shell credit-page">
    <div className="page-wrap">
      <ExecutiveHeader />
      <CreditDashboard />
    </div>
  </main>;
}

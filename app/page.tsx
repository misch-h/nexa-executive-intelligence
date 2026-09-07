"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ExecutiveMetric,
  MetricHistoryPoint,
} from "../lib/metrics";

import MetricDrawer from "../components/MetricDrawer";
import ExecutiveHeader from "../components/ExecutiveHeader";
import MetricCard from "../components/MetricCard";
import SignalPanel from "../components/SignalPanel";
import SectionLabel from "../components/SectionLabel";
import ArchitectureModal from "../components/ArchitectureModal";

export default function Home() {
  const [metrics, setMetrics] = useState<ExecutiveMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [architectureOpen, setArchitectureOpen] =
    useState(false);

  const [selectedMetric, setSelectedMetric] =
    useState<ExecutiveMetric | null>(null);

  const [metricHistory, setMetricHistory] =
    useState<MetricHistoryPoint[]>([]);

  useEffect(() => {
    async function loadMetrics() {
      const { data, error } = await supabase
        .from("executive_metrics_api")
        .select("*");

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setMetrics((data as ExecutiveMetric[]) || []);
      }

      const { data: historyData, error: historyError } =
        await supabase
          .from("metric_history_api")
          .select("*")
          .order("as_of_date", { ascending: true });

      if (historyError) {
        console.error(
          "Metric history error:",
          historyError
        );
      } else {
        setMetricHistory(
          (historyData ?? []) as MetricHistoryPoint[]
        );
      }

      setLoading(false);
    }

    loadMetrics();
  }, []);

  const metricMap = useMemo(() => {
    return Object.fromEntries(
      metrics.map((metric) => [
        metric.metric_name,
        metric,
      ])
    );
  }, [metrics]);

  /* =========================================================
     DASHBOARD STRUCTURE
     ========================================================= */

  const financialMetrics = [
    "Loans Written",
    "Loan Approval Rate",
    "30+ DPD Rate",
    "Net Credit Loss",
  ];

  const customerMetrics = [
    "Active Customer Rate",
    "Net Promoter Score",
    "Complaint Volume",
    "Complaints > SLA",
  ];

  /* =========================================================
     DYNAMIC RAG COUNTS
     ========================================================= */

  const certifiedMetrics = metrics.filter(
    (metric) =>
      metric.certification_status ===
      "Executive Certified"
  );

  const greenCount = metrics.filter(
    (metric) => metric.rag_status === "GREEN"
  ).length;

  const amberCount = metrics.filter(
    (metric) => metric.rag_status === "AMBER"
  ).length;

  const redCount = metrics.filter(
    (metric) => metric.rag_status === "RED"
  ).length;

  /* =========================================================
   EXECUTIVE SUMMARY HELPERS
   ========================================================= */

  const loansWritten = metricMap["Loans Written"];
  const approvalRate = metricMap["Loan Approval Rate"];
  const dpdRate = metricMap["30+ DPD Rate"];
  const netCreditLoss = metricMap["Net Credit Loss"];

  const latestAsOfDate = metrics
    .map((metric) => metric.as_of_date)
    .filter(Boolean)
    .sort()
    .at(-1);

  const latestRefresh = metrics
    .map((metric) => metric.calculated_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  function formatAsOfDate(date?: string) {
    if (!date) return "—";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(new Date(date))
      .toUpperCase();
  }

  function formatRefreshTime(date?: string) {
    if (!date) return "—";

    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Dubai",
    }).format(new Date(date));
  }

  function signedTrend(metric?: ExecutiveMetric) {
    if (!metric || metric.trend_pct === null) return "—";

    const value = Number(metric.trend_pct);

    if (Number.isNaN(value)) return "—";

    const sign = value > 0 ? "+" : "";

    return `${sign}${value.toFixed(1)}%`;
  }

  /* =========================================================
     REUSABLE CARD RENDERER
     ========================================================= */

  function renderMetric(name: string) {
    const metric = metricMap[name];

    if (!metric) return null;

    const history = metricHistory.filter(
      (point) =>
        point.metric_id === metric.metric_id
    );

    return (
      <MetricCard
        key={metric.metric_id}
        metric={metric}
        history={history}
        onClick={setSelectedMetric}
      />
    );
  }

  return (
    <main className="page-shell">
      <div className="page-wrap">

        {/* HEADER */}

        <ExecutiveHeader />

        {/* EXECUTIVE VIEW */}

        <section className="executive-overview">

          <div className="executive-overview-main">

            <div className="executive-overview-top">
              <SectionLabel>EXECUTIVE VIEW</SectionLabel>

              <div className="as-at">
                AS AT {formatAsOfDate(latestAsOfDate)}
              </div>
            </div>

            <h1 className="executive-headline">
              Growth remains resilient;
              <span> early credit deterioration is emerging.</span>
            </h1>

            <div className="executive-evidence">

              <div className="evidence-block">
                <div className="evidence-label">
                  EVIDENCE
                </div>

                <div className="evidence-items">
                  <span>
                    Loans written{" "}
                    <strong>
                      {signedTrend(loansWritten)}
                    </strong>
                  </span>

                  <span>
                    Approval{" "}
                    <strong>
                      {approvalRate
                        ? `${Number(
                          approvalRate.metric_value
                        ).toFixed(1)}%`
                        : "—"}
                    </strong>
                  </span>

                  <span>
                    30+ DPD{" "}
                    <strong
                      className={
                        dpdRate?.rag_status === "RED"
                          ? "evidence-red"
                          : dpdRate?.rag_status === "AMBER"
                            ? "evidence-amber"
                            : ""
                      }
                    >
                      {signedTrend(dpdRate)}
                    </strong>
                  </span>

                  <span>
                    Net credit loss{" "}
                    <strong
                      className={
                        netCreditLoss?.rag_status === "RED"
                          ? "evidence-red"
                          : netCreditLoss?.rag_status === "AMBER"
                            ? "evidence-amber"
                            : ""
                      }
                    >
                      {signedTrend(netCreditLoss)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="attention-block">
                <div className="evidence-label">
                  MANAGEMENT ATTENTION
                </div>

                <p>
                  Monitor migration of recent originations
                  into 30+ DPD and emerging credit loss.
                </p>
              </div>

            </div>
          </div>

          <aside className="executive-status">

            <div>
              <SectionLabel>PORTFOLIO STATUS</SectionLabel>

              <div className="status-number">
                {amberCount + redCount}
              </div>

              <div className="status-description">
                metrics requiring management attention
              </div>
            </div>

            <div className="status-rag-grid">

              <div>
                <span className="status-dot-large status-green" />
                <strong>{greenCount}</strong>
                <span>Green</span>
              </div>

              <div>
                <span className="status-dot-large status-amber" />
                <strong>{amberCount}</strong>
                <span>Amber</span>
              </div>

              <div>
                <span className="status-dot-large status-red" />
                <strong>{redCount}</strong>
                <span>Red</span>
              </div>

            </div>

            <div className="status-footer">
              <div>
                <span>Certified</span>
                <strong>{certifiedMetrics.length} / {metrics.length}</strong>
              </div>

              <div>
                <span>Last refreshed</span>
                <strong>
                  {formatRefreshTime(latestRefresh)} GST
                </strong>
              </div>
            </div>

          </aside>

        </section>

        {/* EXECUTIVE SCORECARD */}

        <section className="scorecard-section">

          <div className="scorecard-heading">
            <div>
              <SectionLabel>
                EXECUTIVE SCORECARD
              </SectionLabel>

              <h2>
                Performance across the bank.
              </h2>
            </div>

            {!loading && (
              <div className="scorecard-summary">
                <span>
                  {certifiedMetrics.length} certified
                </span>

                <span>
                  {greenCount} green
                </span>

                <span>
                  {amberCount} amber
                </span>

                {redCount > 0 && (
                  <span>
                    {redCount} red
                  </span>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              Loading governed metrics...
            </div>
          ) : (
            <>
              {/* FINANCIAL + RISK */}

              <section className="dashboard-band">
                <div className="dashboard-band-heading">
                  <SectionLabel>
                    FINANCIAL &amp; RISK
                  </SectionLabel>

                  <span>
                    Growth · Lending · Portfolio quality
                  </span>
                </div>

                <div className="financial-kpi-grid">
                  {financialMetrics.map(renderMetric)}
                </div>
              </section>

              {/* CUSTOMER + SERVICE */}

              <section className="dashboard-band customer-band">
                <div className="dashboard-band-heading">
                  <SectionLabel>
                    CUSTOMER &amp; SERVICE
                  </SectionLabel>

                  <span>
                    Engagement · Advocacy · Service performance
                  </span>
                </div>

                <div className="customer-kpi-grid">
                  {customerMetrics.map(renderMetric)}
                </div>
              </section>
            </>
          )}

        </section>

        {/* DATA TRUST */}

        <footer className="trust-footer">
          <div>
            <div className="trust-title">
              Trusted by design
            </div>

            <div className="trust-copy">
              Certified metrics · defined ownership ·
              governed data products
            </div>
          </div>

          <button
            className="trust-button"
            type="button"
            onClick={() => setArchitectureOpen(true)}
          >
            Explore architecture →
          </button>
        </footer>

      </div>

      <MetricDrawer
        metric={selectedMetric}
        onClose={() =>
          setSelectedMetric(null)
        }
      />
      <ArchitectureModal
        open={architectureOpen}
        onClose={() => setArchitectureOpen(false)}
      />
    </main>
  );
}
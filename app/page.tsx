"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { ExecutiveMetric } from "../lib/metrics";

import ExecutiveHeader from "../components/ExecutiveHeader";
import MetricCard from "../components/MetricCard";
import SignalPanel from "../components/SignalPanel";
import SectionLabel from "../components/SectionLabel";

export default function Home() {
  const [metrics, setMetrics] = useState<ExecutiveMetric[]>([]);
  const [loading, setLoading] = useState(true);

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

      setLoading(false);
    }

    loadMetrics();
  }, []);

  const metricMap = useMemo(() => {
    return Object.fromEntries(
      metrics.map((metric) => [metric.metric_name, metric])
    );
  }, [metrics]);

  const headlineMetrics = [
    "Loans Written",
    "Loan Approval Rate",
    "30+ DPD Rate",
    "Net Credit Loss",
  ];

  const secondaryMetrics = [
    "Active Customer Rate",
    "Complaint Volume",
  ];

  return (
    <main className="page-shell">
      <div className="page-wrap">
        <ExecutiveHeader />

        <section className="hero-grid">
          <div className="hero-card">
            <SectionLabel>EXECUTIVE VIEW</SectionLabel>

            <h1 className="hero-title">
              Growth is strong.
              <br />
              <span>Credit quality needs attention.</span>
            </h1>

            <p className="hero-copy">
              Lending remains strong and approval rates are stable, while
              delinquency and net credit loss indicate emerging pressure in
              portfolio performance.
            </p>
          </div>

          <SignalPanel />
        </section>

        <section className="scorecard-section">
          <SectionLabel>EXECUTIVE SCORECARD</SectionLabel>

          {loading ? (
            <div className="loading-state">Loading governed metrics...</div>
          ) : (
            <div className="metric-grid">
              {headlineMetrics.map((name) => {
                const metric = metricMap[name];
                if (!metric) return null;

                return (
                  <MetricCard
                    key={name}
                    metric={metric}
                    onClick={(selectedMetric) =>
                      console.log("Selected metric:", selectedMetric)
                    }
                  />
                );
              })}
            </div>
          )}
        </section>

        {!loading && (
          <section className="secondary-grid">
            {secondaryMetrics.map((name) => {
              const metric = metricMap[name];
              if (!metric) return null;

              return (
                <MetricCard
                  key={name}
                  metric={metric}
                  onClick={(selectedMetric) =>
                    console.log("Selected metric:", selectedMetric)
                  }
                />
              );
            })}
          </section>
        )}

        <footer className="trust-footer">
          <div>
            <div className="trust-title">Trusted by design</div>
            <div className="trust-copy">
              Certified metrics · defined ownership · governed data products
            </div>
          </div>

          <button className="trust-button" type="button">
            Explore governance →
          </button>
        </footer>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { ExecutiveMetric } from "../lib/metrics";
import {
  formatMetric,
  formatVariance,
} from "../lib/formatters";
import RAGBadge from "./RAGBadge";

type LineageItem = {
  metric_id: string;
  lineage_order: number;
  layer_name: string;
  object_name: string;
  object_type: string;
  transformation_description: string | null;
};

type DQResult = {
  metric_id: string;
  dq_rule_id: string;
  rule_name: string;
  rule_description: string | null;
  severity: string;
  rule_status: string;
  as_of_date: string | null;
  actual_result_pct: number | string | null;
  threshold_pct: number | string | null;
  result_status: string | null;
  checked_at: string | null;
};

type ChangeItem = {
  metric_id: string;
  version_number: number | string;
  change_type: string;
  change_description: string | null;
  previous_definition: string | null;
  new_definition: string | null;
  requested_by: string | null;
  approved_by: string | null;
  effective_date: string | null;
  changed_at: string | null;
};

export default function MetricDrawer({
  metric,
  onClose,
}: {
  metric: ExecutiveMetric | null;
  onClose: () => void;
}) {
  const [lineage, setLineage] = useState<LineageItem[]>([]);
  const [dqResults, setDQResults] = useState<DQResult[]>([]);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [loadingTrust, setLoadingTrust] = useState(false);

  useEffect(() => {
    if (!metric) {
      setLineage([]);
      setDQResults([]);
      setChanges([]);
      return;
    }

    let cancelled = false;

    async function loadTrustData() {
      setLoadingTrust(true);

      const [lineageResponse, dqResponse, changeResponse] =
        await Promise.all([
          supabase
            .from("metric_lineage_api")
            .select("*")
            .eq("metric_id", metric!.metric_id)
            .order("lineage_order", { ascending: true }),

          supabase
            .from("metric_data_quality_api")
            .select("*")
            .eq("metric_id", metric!.metric_id)
            .order("checked_at", {
              ascending: false,
              nullsFirst: false,
            }),

          supabase
            .from("metric_change_history_api")
            .select("*")
            .eq("metric_id", metric!.metric_id)
            .order("changed_at", {
              ascending: false,
              nullsFirst: false,
            }),
        ]);

      if (cancelled) return;

      if (lineageResponse.error) {
        console.error(
          "Metric lineage error:",
          lineageResponse.error
        );
        setLineage([]);
      } else {
        setLineage(
          (lineageResponse.data ?? []) as LineageItem[]
        );
      }

      if (dqResponse.error) {
        console.error(
          "Metric DQ error:",
          dqResponse.error
        );
        setDQResults([]);
      } else {
        setDQResults(
          (dqResponse.data ?? []) as DQResult[]
        );
      }

      if (changeResponse.error) {
        console.error(
          "Metric change history error:",
          changeResponse.error
        );
        setChanges([]);
      } else {
        setChanges(
          (changeResponse.data ?? []) as ChangeItem[]
        );
      }

      setLoadingTrust(false);
    }

    loadTrustData();

    return () => {
      cancelled = true;
    };
  }, [metric]);

  const latestDQResults = useMemo(() => {
    const latestByRule = new Map<string, DQResult>();

    for (const result of dqResults) {
      if (!latestByRule.has(result.dq_rule_id)) {
        latestByRule.set(result.dq_rule_id, result);
      }
    }

    return Array.from(latestByRule.values());
  }, [dqResults]);

  const dqPassed = latestDQResults.filter(
    (result) =>
      result.result_status?.toUpperCase() === "PASS"
  ).length;

  const dqFailed = latestDQResults.filter(
    (result) =>
      result.result_status?.toUpperCase() === "FAIL"
  ).length;

  if (!metric) return null;

  function formatDate(date?: string | null) {
    if (!date) return "—";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatDateTime(date?: string | null) {
    if (!date) return "—";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Dubai",
    }).format(new Date(date));
  }

  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={onClose}
      />

      <aside
        className="metric-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${metric.metric_name} detail`}
      >
        {/* HEADER */}

        <div className="drawer-header">
          <div>
            <div className="drawer-domain">
              {metric.domain}
            </div>

            <h2>{metric.metric_name}</h2>
          </div>

          <button
            className="drawer-close"
            type="button"
            onClick={onClose}
            aria-label="Close metric detail"
          >
            ×
          </button>
        </div>

        {/* PERFORMANCE */}

        <div className="drawer-value-row">
          <div>
            <div className="drawer-value">
              {formatMetric(
                metric.metric_name,
                metric.metric_value
              )}
            </div>

            <div className="drawer-date">
              As at {formatDate(metric.as_of_date)}
            </div>
          </div>

          <RAGBadge status={metric.rag_status} />
        </div>

        <section className="drawer-section">
          <div className="drawer-section-title">
            Performance
          </div>

          <div className="drawer-stats">
            <div className="drawer-stat">
              <span>Actual</span>
              <strong>
                {formatMetric(
                  metric.metric_name,
                  metric.metric_value
                )}
              </strong>
            </div>

            <div className="drawer-stat">
              <span>Target</span>
              <strong>
                {metric.target_value !== null
                  ? `${
                      metric.rag_direction ===
                      "HIGHER_IS_BETTER"
                        ? "≥ "
                        : "≤ "
                    }${formatMetric(
                      metric.metric_name,
                      metric.target_value
                    )}`
                  : "—"}
              </strong>
            </div>

            <div className="drawer-stat">
              <span>Variance</span>
              <strong
                className={
                  metric.variance_status === "FAVOURABLE"
                    ? "variance-good"
                    : metric.variance_status === "ADVERSE"
                    ? "variance-bad"
                    : ""
                }
              >
                {formatVariance(
                  metric.metric_name,
                  metric.variance_to_target,
                  metric.variance_status
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* DEFINITION */}

        <section className="drawer-section">
          <div className="drawer-section-title">
            Metric definition
          </div>

          <p className="drawer-body">
            {metric.business_definition || "—"}
          </p>

          <div className="drawer-list drawer-list-spaced">
            <div>
              <span>Calculation</span>
              <strong>
                {metric.calculation_logic || "—"}
              </strong>
            </div>

            <div>
              <span>Direction</span>
              <strong>
                {metric.rag_direction ===
                "HIGHER_IS_BETTER"
                  ? "Higher is better"
                  : "Lower is better"}
              </strong>
            </div>
          </div>
        </section>

        {/* ACCOUNTABILITY */}

        <section className="drawer-section">
          <div className="drawer-section-title">
            Accountability
          </div>

          <div className="drawer-list">
            <div>
              <span>Metric owner</span>
              <strong>{metric.owner_role || "—"}</strong>
            </div>

            <div>
              <span>Data product</span>
              <strong>
                {metric.data_product || "—"}
              </strong>
            </div>

            <div>
              <span>Certification</span>
              <strong>
                {metric.certification_status || "—"}
              </strong>
            </div>

            <div>
              <span>Last calculated</span>
              <strong>
                {formatDateTime(metric.calculated_at)}
              </strong>
            </div>
          </div>
        </section>

        {/* LINEAGE */}

        <section className="drawer-section">
          <div className="drawer-section-title">
            Data lineage
          </div>

          {loadingTrust ? (
            <p className="drawer-body">
              Loading trust metadata...
            </p>
          ) : lineage.length === 0 ? (
            <p className="drawer-body">
              No lineage registered for this metric.
            </p>
          ) : (
            <div className="lineage-flow">
              {lineage.map((item, index) => (
                <div
                  className="lineage-step"
                  key={`${item.metric_id}-${item.lineage_order}`}
                >
                  <div className="lineage-marker">
                    {index + 1}
                  </div>

                  <div className="lineage-content">
                    <div className="lineage-layer">
                      {item.layer_name}
                    </div>

                    <strong>{item.object_name}</strong>

                    <span>
                      {item.object_type}
                    </span>

                    {item.transformation_description && (
                      <p>
                        {
                          item.transformation_description
                        }
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* DATA QUALITY */}

        <section className="drawer-section">
          <div className="drawer-section-title">
            Data quality
          </div>

          {!loadingTrust &&
            latestDQResults.length > 0 && (
              <div className="dq-summary">
                <div>
                  <strong>{dqPassed}</strong>
                  <span>Passed</span>
                </div>

                <div>
                  <strong>{dqFailed}</strong>
                  <span>Failed</span>
                </div>

                <div>
                  <strong>
                    {latestDQResults.length}
                  </strong>
                  <span>Rules</span>
                </div>
              </div>
            )}

          {loadingTrust ? (
            <p className="drawer-body">
              Loading quality results...
            </p>
          ) : latestDQResults.length === 0 ? (
            <p className="drawer-body">
              No data quality rules registered for this
              metric.
            </p>
          ) : (
            <div className="dq-list">
              {latestDQResults.map((result) => {
                const status =
                  result.result_status?.toUpperCase() ||
                  "UNKNOWN";

                return (
                  <div
                    className="dq-item"
                    key={result.dq_rule_id}
                  >
                    <div className="dq-item-top">
                      <div>
                        <strong>
                          {result.rule_name}
                        </strong>

                        <span>
                          {result.severity}
                        </span>
                      </div>

                      <div
                        className={`dq-status dq-${status.toLowerCase()}`}
                      >
                        {status}
                      </div>
                    </div>

                    {result.rule_description && (
                      <p>
                        {result.rule_description}
                      </p>
                    )}

                    <div className="dq-values">
                      <span>
                        Actual{" "}
                        <strong>
                          {result.actual_result_pct !==
                          null
                            ? `${Number(
                                result.actual_result_pct
                              ).toFixed(1)}%`
                            : "—"}
                        </strong>
                      </span>

                      <span>
                        Threshold{" "}
                        <strong>
                          {result.threshold_pct !== null
                            ? `${Number(
                                result.threshold_pct
                              ).toFixed(1)}%`
                            : "—"}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CHANGE HISTORY */}

        <section className="drawer-section">
          <div className="drawer-section-title">
            Change history
          </div>

          {loadingTrust ? (
            <p className="drawer-body">
              Loading change history...
            </p>
          ) : changes.length === 0 ? (
            <p className="drawer-body">
              No definition changes recorded.
            </p>
          ) : (
            <div className="change-list">
              {changes.map((change, index) => (
                <div
                  className="change-item"
                  key={`${change.metric_id}-${change.version_number}-${index}`}
                >
                  <div className="change-version">
                    v{change.version_number}
                  </div>

                  <div>
                    <strong>
                      {change.change_type}
                    </strong>

                    {change.change_description && (
                      <p>
                        {change.change_description}
                      </p>
                    )}

                    <span>
                      Effective{" "}
                      {formatDate(
                        change.effective_date
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="drawer-trust-footer">
          <span>GOVERNED METRIC</span>

          <strong>
            {metric.data_product}
          </strong>
        </div>
      </aside>
    </>
  );
}
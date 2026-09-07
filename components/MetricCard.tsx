import { ExecutiveMetric, MetricHistoryPoint } from "../lib/metrics";
import { formatMetric, formatVariance } from "../lib/formatters";
import RAGBadge from "./RAGBadge";
import MetricIcon from "./MetricIcon";
import { getMetricIcon } from "../lib/metricIcons";
import TrendIndicator from "./TrendIndicator";
import Sparkline from "./Sparkline";

export default function MetricCard({
  metric,
  history,
  onClick,
}: {
  metric: ExecutiveMetric;
  history: MetricHistoryPoint[];
  onClick?: (metric: ExecutiveMetric) => void;
}) {
  return (
    <button
      className="metric-card"
      type="button"
      onClick={() => onClick?.(metric)}
    >
      <div className="metric-card-top">
        <div className="metric-title-group">
          <MetricIcon icon={getMetricIcon(metric.metric_name)} />

          <div>
            <div className="metric-name">{metric.metric_name}</div>
            <div className="metric-domain">{metric.domain}</div>
          </div>
        </div>

        <RAGBadge status={metric.rag_status} />
      </div>

      <div className="metric-value">
        {formatMetric(metric.metric_name, Number(metric.metric_value))}
      </div>

      <div className="metric-target-row">
        <span>
          Target{" "}
          {metric.rag_direction === "HIGHER_IS_BETTER" ? "≥" : "≤"}{" "}
          {metric.target_value !== null
            ? formatMetric(
                metric.metric_name,
                Number(metric.target_value)
              )
            : "—"}
        </span>

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

      <TrendIndicator metric={metric} />

      <Sparkline
        data={history}
        status={metric.rag_status}
      />

      <div className="metric-meta">
        <span>{metric.data_product}</span>
        <span>{metric.certification_status}</span>
      </div>

      <div className="metric-action">
        View detail →
      </div>
    </button>
  );
}
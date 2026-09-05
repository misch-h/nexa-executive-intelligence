import { ExecutiveMetric } from "../lib/metrics";
import { formatMetric } from "../lib/formatters";

export default function MetricCard({
  metric,
  onClick,
}: {
  metric: ExecutiveMetric;
  onClick?: (metric: ExecutiveMetric) => void;
}) {
  return (
    <button
      className="metric-card"
      type="button"
      onClick={() => onClick?.(metric)}
    >
      <div className="metric-card-top">
        <div className="metric-name">{metric.metric_name}</div>

        <div className="metric-status">
          {metric.certification_status}
        </div>
      </div>

      <div className="metric-value">
        {formatMetric(metric.metric_name, Number(metric.metric_value))}
      </div>

      <div className="metric-meta">
        <span>{metric.owner_role}</span>
        <span>{metric.data_product}</span>
      </div>

      <div className="metric-action">
        Explore metric →
      </div>
    </button>
  );
}
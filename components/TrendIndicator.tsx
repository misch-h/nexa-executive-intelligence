import { ExecutiveMetric } from "../lib/metrics";

export default function TrendIndicator({
  metric,
}: {
  metric: ExecutiveMetric;
}) {
  if (metric.trend_pct === null) {
    return <div className="trend-indicator trend-neutral">— No prior period</div>;
  }

  const direction = metric.trend_direction;
  const value = Math.abs(Number(metric.trend_pct));

  const isFavourable =
    direction === "FLAT" ||
    (metric.rag_direction === "HIGHER_IS_BETTER" && direction === "UP") ||
    (metric.rag_direction === "LOWER_IS_BETTER" && direction === "DOWN");

  const trendClass =
    direction === "FLAT"
      ? "trend-neutral"
      : isFavourable
        ? "trend-positive"
        : "trend-negative";

  const arrow =
    direction === "UP" ? "↗" : direction === "DOWN" ? "↘" : "→";

  return (
    <div className={`trend-indicator ${trendClass}`}>
      <span className="trend-arrow">{arrow}</span>
      <span>{value.toFixed(1)}%</span>
      <span className="trend-period">vs prior period</span>
    </div>
  );
}
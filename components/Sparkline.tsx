import { MetricHistoryPoint, RAGStatus } from "../lib/metrics";

function formatCompact(value: number, unit: string) {
  if (unit === "AED") {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
      return `${Math.round(value / 1_000)}K`;
    }
  }

  if (unit === "%") {
    return `${value.toFixed(value < 10 ? 1 : 1)}%`;
  }

  return value.toLocaleString();
}

function buildSmoothPath(
  points: { x: number; y: number }[]
) {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const midX = (current.x + next.x) / 2;

    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

export default function Sparkline({
  data,
  status,
}: {
  data: MetricHistoryPoint[];
  status: RAGStatus;
}) {
  if (!data || data.length < 2) return null;

  const sorted = [...data].sort(
    (a, b) =>
      new Date(a.as_of_date).getTime() -
      new Date(b.as_of_date).getTime()
  );

  const values = sorted.map((point) =>
    Number(point.metric_value)
  );

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 240;
  const height = 72;

  const paddingX = 12;
  const paddingTop = 14;
  const paddingBottom = 20;

  const points = values.map((value, index) => {
    const x =
      paddingX +
      (index / (values.length - 1)) *
        (width - paddingX * 2);

    const y =
      paddingTop +
      (1 - (value - min) / range) *
        (height - paddingTop - paddingBottom);

    return { x, y };
  });

  const path = buildSmoothPath(points);

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  const firstValue = values[0];
  const lastValue = values[values.length - 1];

  const unit = sorted[0]?.unit ?? "";

  return (
    <div
      className={`sparkline sparkline-${status.toLowerCase()}`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx={firstPoint.x}
          cy={firstPoint.y}
          r="3.1"
          fill="currentColor"
        />

        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3.1"
          fill="currentColor"
        />

        <text
          x={firstPoint.x}
          y={Math.min(height - 3, firstPoint.y + 18)}
          textAnchor="start"
          className="sparkline-label"
        >
          {formatCompact(firstValue, unit)}
        </text>

        <text
          x={lastPoint.x}
          y={Math.max(10, lastPoint.y - 7)}
          textAnchor="end"
          className="sparkline-label"
        >
          {formatCompact(lastValue, unit)}
        </text>
      </svg>
    </div>
  );
}
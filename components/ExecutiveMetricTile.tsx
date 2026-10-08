import Link from "next/link";
import type { ExecutiveMetric, MetricHistoryPoint } from "../lib/metrics";
import { dashboardValue, historyChange, isCertified, metricHistory, type DashboardMetric } from "../lib/executiveDashboard";
import RAGBadge from "./RAGBadge";
import Sparkline from "./Sparkline";

export default function ExecutiveMetricTile({ metric, history, onSelect, note, headline = false, compact = false }: {
  metric: DashboardMetric; history: MetricHistoryPoint[]; onSelect: (metric: ExecutiveMetric) => void;
  note?: string; headline?: boolean; compact?: boolean;
}) {
  const certified = isCertified(metric);
  const points = metricHistory(metric, history);
  const change = historyChange(metric, history);
  const content = <>
    <div className="v2-tile-top"><span>{metric.metric_name}</span>{certified && <RAGBadge status={metric.rag_status} />}</div>
    <div className="v2-tile-value" title={dashboardValue(metric, true)}>{dashboardValue(metric)}</div>
    <div className={`v2-certification ${certified ? "v2-certified" : "v2-proposed"}`}>{certified ? metric.certification_status : "Proposed · Not certified"}</div>
    {note && <p className="v2-tile-note">{note}</p>}
    {certified && metric.target_value !== null && <p className="v2-target">Target {metric.rag_direction === "HIGHER_IS_BETTER" ? "≥" : "≤"} {dashboardValue({ ...metric, metric_value: metric.target_value })}</p>}
    {change && <div className="v2-history-change">{change}</div>}
    {headline && points.length >= 2 && <Sparkline data={points} status={certified ? metric.rag_status : "GREY"} />}
    <span className="v2-tile-action">{certified ? "View governed detail" : "View catalogue definition"} <span aria-hidden="true">→</span></span>
  </>;
  const className = `v2-tile${headline ? " v2-headline-tile" : ""}${compact ? " v2-compact-tile" : ""}`;
  return certified ? <button type="button" className={className} onClick={() => onSelect(metric)}>{content}</button>
    : <Link className={className} href={`/metrics?metric=${encodeURIComponent(metric.metric_id)}`}>{content}</Link>;
}

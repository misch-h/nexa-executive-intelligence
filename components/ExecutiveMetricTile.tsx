import Link from "next/link";
import type { ExecutiveMetric, MetricHistoryPoint } from "../lib/metrics";
import { dashboardValue, historyChange, isCertified, metricHistory, type DashboardMetric } from "../lib/executiveDashboard";
import CertificationBadge from "./CertificationBadge";
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
    <div className="v41-score-identity">
      <div className="v2-tile-top"><span>{headline && metric.metric_name === "30+ DPD Rate" ? "30+ Days Past Due" : metric.metric_name}</span></div>
      <div className="v2-tile-value" title={dashboardValue(metric, true)}>{dashboardValue(metric)}</div>
      <div className="v41-score-status">{certified ? <RAGBadge status={metric.rag_status} /> : <span>Performance not assessed</span>}</div>
    </div>
    <div className="v41-score-comparison">
      <p className="v2-target">{certified && metric.target_value !== null ? <>Target {metric.rag_direction === "HIGHER_IS_BETTER" ? "≥" : "≤"} {dashboardValue({ ...metric, metric_value: metric.target_value })}</> : "No published target"}</p>
      <div className="v2-history-change">{change ?? "No comparable previous period"}</div>
    </div>
    <div className="v41-score-history">
      {headline && points.length >= 2 ? <><Sparkline data={points} status={certified ? metric.rag_status : "GREY"} /><div className="v3-history-period">{points[0].as_of_date} — {points[points.length - 1].as_of_date}</div></> : headline ? <p className="v3-history-unavailable">No comparable published history</p> : null}
      {headline && note && <p className="v41-score-note">{note}</p>}
    </div>
    <div className="v41-score-footer"><CertificationBadge status={certified ? metric.certification_status : "Proposed"} /><span className="v2-tile-action">{certified ? "View governed detail" : "View catalogue definition"} <span aria-hidden="true">→</span></span></div>
  </>;
  const className = `v2-tile${headline ? " v2-headline-tile" : ""}${compact ? " v2-compact-tile" : ""}`;
  return certified ? <button type="button" className={className} onClick={() => onSelect(metric)}>{content}</button>
    : <Link className={className} href={`/metrics?metric=${encodeURIComponent(metric.metric_id)}`}>{content}</Link>;
}

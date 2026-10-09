import { domainTone, ragLabels, certificationTone } from "../lib/visualSemantics";
import type { RAGStatus } from "../lib/metrics";
export type LegendCategory = { label: string; color: string };
type Props = { kind: "domain"; domains: string[] } | { kind: "rag" } | { kind: "certification"; statuses?: string[] } | { kind: "category"; title: string; categories: LegendCategory[] };
export default function VisualLegend(props: Props) {
  const title = props.kind === "domain" ? "Business domains" : props.kind === "rag" ? "Performance RAG" : props.kind === "certification" ? "Certification · separate from performance" : props.title;
  const items: { label: string; className: string; color?: string }[] = props.kind === "domain" ? [...new Set(props.domains)].map(label => ({ label, className: `domain-${domainTone(label)}` }))
    : props.kind === "rag" ? (Object.keys(ragLabels) as RAGStatus[]).map(status => ({ label: `${status[0]}${status.slice(1).toLowerCase()} · ${ragLabels[status]}`, className: `legend-rag-${status.toLowerCase()}` }))
    : props.kind === "certification" ? (props.statuses ?? ["Executive Certified", "Proposed", "Exploratory"]).map(label => ({ label, className: `legend-cert-${certificationTone(label)}` }))
    : props.categories.map(item => ({ label: item.label, className: "", color: item.color }));
  return <div className="visual-legend" role="group" aria-label={title}><span className="visual-legend-title">{title}</span><ul>{items.map(item => <li key={item.label} className={item.className}><span className="visual-legend-dot" aria-hidden="true" style={item.color ? { background: item.color } : undefined} />{item.label}</li>)}</ul></div>;
}

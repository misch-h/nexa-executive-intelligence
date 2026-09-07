import { RAGStatus } from "../lib/metrics";

export default function RAGBadge({
  status,
}: {
  status: RAGStatus;
}) {
  return (
    <div className={`rag-badge rag-${status.toLowerCase()}`}>
      <span className="rag-dot" />
      <span>{status}</span>
    </div>
  );
}
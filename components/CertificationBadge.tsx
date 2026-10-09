import { certificationTone } from "../lib/visualSemantics";
export default function CertificationBadge({ status }: { status: string }) {
  return <span className={`certification-badge certification-${certificationTone(status)}`}>{status}</span>;
}

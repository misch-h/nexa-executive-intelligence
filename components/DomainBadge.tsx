import { domainTone } from "../lib/visualSemantics";
export { domainTone } from "../lib/visualSemantics";
export default function DomainBadge({ domain }: { domain: string }) {
  return <span className={`domain-badge domain-${domainTone(domain)}`}>{domain}</span>;
}

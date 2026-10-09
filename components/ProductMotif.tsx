import { domainTone } from "../lib/visualSemantics";
export default function ProductMotif({ domain }: { domain: string }) {
  const tone = domainTone(domain);
  // Illustrations only: no values, axes, observations or encoded product data.
  return <div className={`product-motif domain-${tone}`} aria-hidden="true"><svg viewBox="0 0 160 48" focusable="false">
    {tone === "customer" ? <><circle cx="80" cy="24" r="10" /><circle cx="32" cy="24" r="6" /><circle cx="128" cy="24" r="6" /><path d="M38 24H70M90 24H122" /></>
      : tone === "finance" ? <><rect x="54" y="5" width="52" height="38" rx="6" /><path d="M62 14H98M62 23H98M62 32H84" /></>
      : tone === "credit" || tone === "growth" ? <><rect x="22" y="12" width="26" height="24" rx="5" /><rect x="67" y="12" width="26" height="24" rx="5" /><rect x="112" y="12" width="26" height="24" rx="5" /><path d="M48 24H67M93 24H112" /></>
      : <><circle cx="45" cy="24" r="13" /><circle cx="115" cy="24" r="13" /><path d="M58 20H102M58 28H102" /></>}
  </svg></div>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ExecutiveHeader() {
  const pathname = usePathname();
  return (
    <header className="executive-header">
      <div>
        <div className="brand-label">NEXA BANK</div>
        <div className="brand-subtitle">Executive Intelligence</div>
      </div>

      <nav className="executive-nav" aria-label="Main navigation">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>Executive Overview</Link>
        <Link href="/governance" aria-current={pathname === "/governance" ? "page" : undefined}>Metric Governance</Link>
        <Link href="/credit" aria-current={pathname === "/credit" ? "page" : undefined}>Credit &amp; Lending</Link>
        <Link href="/metrics" aria-current={pathname === "/metrics" ? "page" : undefined}>Metric Dictionary</Link>
        <Link href="/data" aria-current={pathname === "/data" ? "page" : undefined}>Data Marketplace</Link>
      </nav>

      <div className="header-meta">
        <span className="status-dot" />
        Live governed data
      </div>
    </header>
  );
}

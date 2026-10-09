import { creditCount, creditMoney, creditPercent, percentage } from "../lib/credit";
import { bucketColor } from "../lib/visualSemantics";
import VisualLegend from "./VisualLegend";
export type ExposureRow = { label: string; count: number; balance: number; elevated: boolean };
export default function CreditDistribution({ rows, total, risk = false }: { rows: ExposureRow[]; total: number; risk?: boolean }) {
  if (!rows.length) return <p role="status">No distribution data is published.</p>;
  const countTotal = rows.reduce((sum, row) => sum + row.count, 0);
  const delinquent = rows.filter(row => !/^current$/i.test(row.label));
  const max = Math.max(0, ...rows.map(row => row.balance));
  const delinquentMax = Math.max(0, ...delinquent.map(row => row.count));
  const largest = [...rows].sort((a, b) => b.balance - a.balance).slice(0, 2);
  const topShare = percentage(largest.reduce((sum, row) => sum + row.balance, 0), total);
  return <div className={`v4-distribution ${risk ? "v4-risk-chart" : "v4-delinquency-chart"}`}>
    {risk ? <>
      <p className="v41-chart-takeaway">{largest.map(row => row.label).join(" + ")} hold <strong>{creditPercent(topShare)}</strong> of portfolio balance.</p>
      <VisualLegend kind="category" title="Exposure legend" categories={[{ label: "Outstanding portfolio balance · AED", color: "#65707a" }]} />
      <p className="v4-chart-scale">Outstanding balance · AED<span>Scale: 0 — {creditMoney(max, true)}</span></p>
      <ol className="v4-risk-bars">{rows.map(row => <li key={row.label}>
        <div className="v4-risk-label"><strong>{row.label}</strong><span>{creditMoney(row.balance, true)} <small>· {creditPercent(percentage(row.balance, total))}</small></span></div>
        <div className="v4-bar-track" aria-hidden="true"><div className="v41-risk-neutral" style={{ width: `${max > 0 ? row.balance / max * 100 : 0}%` }} /></div><small>{creditCount.format(row.count)} loans</small>
      </li>)}</ol>
    </> : <>
      <h3 className="v41-chart-subtitle">Portfolio health <small>Share of loan count</small></h3>
      {countTotal > 0 ? <div className="v41-health-stack" role="img" aria-label={`Portfolio health by loan count: ${rows.map(row => `${row.label}, ${creditCount.format(row.count)} loans, ${creditPercent(percentage(row.count, countTotal))}`).join("; ")}`}>
        {rows.map(row => <span key={row.label} aria-hidden="true" style={{ width: `${row.count / countTotal * 100}%`, background: bucketColor(row.label) }} />)}
      </div> : <p role="status">No loan counts are available to calculate population shares.</p>}
      <VisualLegend kind="category" title="Delinquency buckets · loan count share" categories={rows.map(row => ({ label: `${row.label} · ${creditPercent(percentage(row.count, countTotal))}`, color: bucketColor(row.label) }))} />
      <h3 className="v41-chart-subtitle">Delinquent loans <small>Counts · excludes Current</small></h3>
      <p className="v4-chart-scale">Number of loans<span>Scale: 0 — {creditCount.format(delinquentMax)}</span></p>
      {delinquent.length ? <div className="v4-columns" role="img" aria-label={`Delinquent loan counts, excluding Current: ${delinquent.map(row => `${row.label}: ${creditCount.format(row.count)} loans`).join("; ")}`}>
        <div className="v4-y-axis" aria-hidden="true"><span>{creditCount.format(delinquentMax)}</span><span>{creditCount.format(Math.round(delinquentMax / 2))}</span><span>0</span></div>
        <div className="v4-column-grid" style={{ gridTemplateColumns: `repeat(${delinquent.length},minmax(0,1fr))` }} aria-hidden="true">{delinquent.map(row => <div className="v4-column" key={row.label}>
          <div className="v4-column-plot"><div style={{ height: `${delinquentMax > 0 ? row.count / delinquentMax * 100 : 0}%`, background: bucketColor(row.label) }} /><strong>{creditCount.format(row.count)}</strong></div><span>{row.label}</span>
        </div>)}</div>
      </div> : <p role="status">No delinquent buckets are published.</p>}
      <p className="v41-chart-note">These visuals show loan counts. The 30+ DPD KPI remains balance-weighted.</p>
    </>}
    <details className="v4-chart-details"><summary>View exact balances and loan counts</summary><div className="v4-data-table" role="region" aria-label={risk ? "Risk exposure data" : "Delinquency data"} tabIndex={0}><table><caption className="dictionary-sr-only">{risk ? "Risk grade exposure" : "Delinquency distribution"}</caption><thead><tr><th scope="col">{risk ? "Risk grade" : "Bucket"}</th><th scope="col">Loans</th><th scope="col">Balance (AED)</th><th scope="col">Balance share</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{creditCount.format(row.count)}</td><td>{creditMoney(row.balance)}</td><td>{creditPercent(percentage(row.balance, total))}</td></tr>)}</tbody></table></div></details>
  </div>;
}

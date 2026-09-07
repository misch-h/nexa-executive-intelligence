import { MetricIconName } from "../lib/metricIcons";

export default function MetricIcon({

  icon,

}: {

  icon: MetricIconName;

}) {

  const icons: Record<MetricIconName, React.ReactNode> = {

    lending: (

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <ellipse cx="12" cy="5" rx="7" ry="3" />

        <path d="M5 5v5c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />

        <path d="M5 10v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />

      </svg>

    ),

    approval: (

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <rect x="5" y="3" width="14" height="18" rx="2" />

        <path d="M9 12l2 2 4-5" />

      </svg>

    ),

    risk: (

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <path d="M12 3l9 16H3L12 3z" />

        <path d="M12 9v4" />

        <circle cx="12" cy="16.5" r="0.7" />

      </svg>

    ),

    loss: (

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <path d="M4 19h16" />

        <path d="M7 16v-5" />

        <path d="M12 16V8" />

        <path d="M17 16V5" />

        <path d="M6 6l4 4 4-3 4 3" />

      </svg>

    ),

    customer: (

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <circle cx="9" cy="8" r="3" />

        <circle cx="16.5" cy="9" r="2.5" />

        <path d="M3 19c0-3.2 2.5-5.5 6-5.5s6 2.3 6 5.5" />

        <path d="M14 14.5c3 0 5 1.8 5 4.5" />

      </svg>

    ),

    complaints: (

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <path d="M4 6h16v10H8l-4 4V6z" />

        <path d="M8 10h8" />

        <path d="M8 13h5" />

      </svg>

    ),

    default: (

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <circle cx="12" cy="12" r="8" />

        <path d="M12 8v4l3 2" />

      </svg>

    ),

  };

  return <div className={`metric-icon metric-icon-${icon}`}>{icons[icon]}</div>;

}
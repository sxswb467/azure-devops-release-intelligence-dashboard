/**
 * Render a compact metric block for the dashboard header.
 *
 * @param {Object} props - Component props.
 * @param {string} props.label - Short metric label.
 * @param {string | number} props.value - Primary metric value.
 * @param {string} props.hint - Supporting context for the metric.
 * @param {"neutral" | "success" | "warning" | "danger"} [props.tone] - Visual emphasis tone.
 * @returns {JSX.Element} Metric panel.
 */
export function MetricPanel({ label, value, hint, tone = "neutral" }) {
  return (
    <section className={`metric-panel metric-panel--${tone}`} aria-label={`${label}: ${value}`}>
      <p className="metric-panel__label">{label}</p>
      <p className="metric-panel__value" aria-hidden="true">{value}</p>
      <p className="metric-panel__hint">{hint}</p>
    </section>
  );
}

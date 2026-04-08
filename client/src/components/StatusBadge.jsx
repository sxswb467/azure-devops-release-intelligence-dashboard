const STATUS_TONES = {
  Succeeded: "success",
  Failed: "danger",
  PartiallySucceeded: "warning",
  Active: "warning",
  Completed: "success",
  Done: "success",
  "In QA": "warning",
  "In Progress": "warning",
  Closed: "success"
};

/**
 * Render a semantic badge for pipeline, work item, and pull request states.
 *
 * @param {Object} props - Component props.
 * @param {string} props.status - Raw status label.
 * @returns {JSX.Element} Status badge.
 */
export function StatusBadge({ status }) {
  const tone = STATUS_TONES[status] || "neutral";
  return (
    <span className={`status-badge status-badge--${tone}`} aria-label={`Status: ${status}`}>
      {status}
    </span>
  );
}

/**
 * Resolve the semantic tone associated with a known status label.
 *
 * @param {string} status - Raw status label.
 * @returns {"success" | "warning" | "danger" | "neutral"} Semantic tone.
 */
export function getStatusTone(status) {
  return STATUS_TONES[status] || "neutral";
}

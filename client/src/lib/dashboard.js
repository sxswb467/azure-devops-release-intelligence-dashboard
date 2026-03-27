/**
 * Format an ISO timestamp for dashboard display in the user's locale.
 *
 * @param {string} value - ISO datetime string.
 * @returns {string} Formatted date and time.
 */
export function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

/**
 * Build aggregate metrics from the current dashboard payload.
 *
 * @param {Object | null} dashboard - Dashboard API response.
 * @returns {Object} Derived metrics used by the UI.
 */
export function buildDashboardMetrics(dashboard) {
  if (!dashboard) {
    return {
      buildTotal: 0,
      buildSucceeded: 0,
      buildFailed: 0,
      activeWorkItems: 0,
      activePullRequests: 0,
      readiness: 0
    };
  }

  const buildTotal = dashboard.builds.length;
  const buildSucceeded = dashboard.builds.filter((item) => item.status === "Succeeded").length;
  const buildFailed = dashboard.builds.filter((item) => item.status === "Failed").length;
  const activeWorkItems = dashboard.workItems.filter((item) => item.state !== "Done" && item.state !== "Closed").length;
  const activePullRequests = dashboard.pullRequests.filter((item) => item.status === "Active").length;

  const buildScore = buildTotal ? buildSucceeded / buildTotal : 0;
  const workItemScore = dashboard.workItems.length ? 1 - activeWorkItems / dashboard.workItems.length : 1;
  const pullRequestScore = dashboard.pullRequests.length ? 1 - activePullRequests / dashboard.pullRequests.length : 1;
  const readiness = Math.round((buildScore * 0.5 + workItemScore * 0.3 + pullRequestScore * 0.2) * 100);

  return {
    buildTotal,
    buildSucceeded,
    buildFailed,
    activeWorkItems,
    activePullRequests,
    readiness
  };
}

/**
 * Select the most recent pipeline activity timestamp from the dashboard.
 *
 * @param {Object | null} dashboard - Dashboard API response.
 * @returns {string | null} ISO timestamp if available.
 */
export function getLatestBuildTimestamp(dashboard) {
  if (!dashboard?.builds?.length) {
    return null;
  }

  return dashboard.builds.reduce((latest, item) => {
    if (!latest) {
      return item.startedAt;
    }

    return new Date(item.startedAt) > new Date(latest) ? item.startedAt : latest;
  }, null);
}

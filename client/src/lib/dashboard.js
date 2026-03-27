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

/**
 * Resolve a release decision posture for the selected mock project.
 *
 * @param {Object | null} dashboard - Dashboard API response.
 * @param {Object} metrics - Derived dashboard metrics.
 * @returns {Object} Posture data used in the hero section.
 */
export function getReleasePosture(dashboard, metrics) {
  if (!dashboard) {
    return {
      label: "Loading",
      tone: "neutral",
      headline: "Building release view",
      detail: "Waiting for the latest snapshot.",
      nextActions: []
    };
  }

  if (metrics.buildFailed > 0) {
    return {
      label: "Hold release",
      tone: "danger",
      headline: "Promotion should stay blocked for now.",
      detail: "A failing pipeline and unfinished delivery scope still make the release too noisy for production approval.",
      nextActions: [
        "Stabilize the failed validation pipeline before the next release review.",
        "Triage the active bug so the demo clearly shows unresolved operational risk."
      ]
    };
  }

  if (dashboard.riskFlags.length > 0 || metrics.activePullRequests > 0 || metrics.activeWorkItems > 0) {
    return {
      label: "Review before promote",
      tone: "warning",
      headline: "The release is close, but not yet clean.",
      detail: "The path to promotion is visible, though one deployment needs follow-up and the release scope still contains active change.",
      nextActions: [
        "Recheck the partially successful deployment and capture the exact remediation owner.",
        "Close the in-flight pull request and move the QA story to done before scheduling production."
      ]
    };
  }

  return {
    label: "Ready for review",
    tone: "success",
    headline: "Signals are aligned for release approval.",
    detail: "Builds, work items, and pull requests all support a clean promotion discussion.",
    nextActions: [
      "Confirm the production window with the release manager.",
      "Archive the final release note once approval is granted."
    ]
  };
}

/**
 * Resolve mock-specific project context used to make demo screenshots more legible.
 *
 * @param {string} projectKey - Project identifier.
 * @returns {Object} Project profile details.
 */
export function getProjectProfile(projectKey) {
  if (projectKey === "beacon") {
    return {
      releaseTrain: "2026.03 webhook resilience",
      owner: "Liam + Sophia",
      environment: "Staging recovery lane",
      objective: "Contain webhook failures and land billing-alert scope without creating another noisy cut.",
      stage: "Incident follow-up"
    };
  }

  return {
    releaseTrain: "2026.03 checkout refinement",
    owner: "Ava + Noah",
    environment: "Staging to production",
    objective: "Push the invoice filter polish and auth regression patch through a controlled release review.",
    stage: "Promotion review"
  };
}

/**
 * Create short, scan-friendly talking points for the mock release brief.
 *
 * @param {Object | null} dashboard - Dashboard API response.
 * @param {Object} metrics - Derived dashboard metrics.
 * @returns {string[]} Bullet points for the release brief.
 */
export function buildBriefPoints(dashboard, metrics) {
  if (!dashboard) {
    return [];
  }

  const points = [];
  const deploymentBuild = dashboard.builds.find((item) => item.pipeline.toLowerCase().includes("deploy"));

  if (deploymentBuild) {
    points.push(`${deploymentBuild.pipeline} is the visible handoff point for the release cut.`);
  }

  if (metrics.buildFailed > 0) {
    points.push(`${metrics.buildFailed} pipeline is failing and should block the release story in the demo.`);
  } else if (dashboard.builds.some((item) => item.status === "PartiallySucceeded")) {
    points.push("The deployment lane reported partial success, which creates a useful near-ready mock scenario.");
  }

  if (metrics.activeWorkItems > 0) {
    points.push(`${metrics.activeWorkItems} scoped work item still needs closure before the release reads as complete.`);
  }

  if (metrics.activePullRequests > 0) {
    points.push(`${metrics.activePullRequests} pull request remains active inside the release boundary.`);
  }

  return points.slice(0, 3);
}

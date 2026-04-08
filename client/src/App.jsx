import { useEffect, useMemo, useRef, useState } from "react";
import { MetricPanel } from "./components/MetricPanel.jsx";
import { SectionPanel } from "./components/SectionPanel.jsx";
import { StatusBadge, getStatusTone } from "./components/StatusBadge.jsx";
import {
  buildBriefPoints,
  buildDashboardMetrics,
  formatDateTime,
  getLatestBuildTimestamp,
  getProjectProfile,
  getReleasePosture
} from "./lib/dashboard.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4100/api";
const DEFAULT_PROJECT = "atlas";

function getInitialProject() {
  if (typeof window === "undefined") {
    return DEFAULT_PROJECT;
  }

  return new URLSearchParams(window.location.search).get("project") || DEFAULT_PROJECT;
}

/**
 * Render the release intelligence dashboard application shell.
 *
 * @returns {JSX.Element} Dashboard application.
 */
export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(getInitialProject);
  const [dashboard, setDashboard] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    void loadProjects();
    void loadEnvironment();
  }, []);

  useEffect(() => {
    void loadDashboard(selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("project", selectedProject);
    window.history.replaceState({}, "", nextUrl);
  }, [selectedProject]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const metrics = useMemo(() => buildDashboardMetrics(dashboard), [dashboard]);
  const latestBuildTimestamp = useMemo(() => getLatestBuildTimestamp(dashboard), [dashboard]);
  const selectedProjectName = projects.find((project) => project.key === selectedProject)?.name || "Release workspace";
  const projectProfile = useMemo(() => getProjectProfile(selectedProject), [selectedProject]);
  const releasePosture = useMemo(() => getReleasePosture(dashboard, metrics), [dashboard, metrics]);
  const briefPoints = useMemo(() => buildBriefPoints(dashboard, metrics), [dashboard, metrics]);

  async function loadProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (!response.ok) {
        throw new Error("Failed to load projects.");
      }

      const json = await response.json();
      setProjects(json);
    } catch (loadProjectsError) {
      setError(loadProjectsError.message);
    }
  }

  async function loadEnvironment() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error("Health check failed.");
      }

      const json = await response.json();
      setEnvironment(json);
    } catch (_error) {
      setEnvironment(null);
    }
  }

  async function loadDashboard(projectKey) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard?project=${projectKey}`, {
        signal: controller.signal
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to load dashboard.");
      }

      setDashboard(json);
    } catch (loadError) {
      if (loadError.name === "AbortError") return;
      setDashboard(null);
      setError(friendlyError(loadError.message));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  async function refreshSnapshot() {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: selectedProject })
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to refresh snapshot.");
      }

      await loadDashboard(selectedProject);
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setToast(`Dashboard refreshed at ${time}`);
    } catch (refreshError) {
      setError(friendlyError(refreshError.message));
    } finally {
      setRefreshing(false);
    }
  }

  function friendlyError(raw) {
    if (/failed to fetch|networkerror|network request failed/i.test(raw)) {
      return "Unable to connect to the server. Check your network connection and try again.";
    }
    return raw;
  }

  return (
    <main className={`dashboard-shell dashboard-shell--${selectedProject}`}>
      <div className="dashboard-frame">
        <header className="dashboard-header">
          <div className="dashboard-header__top">
            <div className="dashboard-header__brand">
              <p className="dashboard-header__eyebrow">Release workspace</p>
              <h1 className="dashboard-header__title">Azure DevOps Release Intelligence</h1>
            </div>

            <div className="dashboard-header__actions">
              <div className="meta-strip">
                <div className="meta-pill">
                  <span>Project</span>
                  <strong>{selectedProjectName}</strong>
                </div>
                <div className="meta-pill">
                  <span>Stage</span>
                  <strong>{projectProfile.stage}</strong>
                </div>
                {latestBuildTimestamp ? (
                  <div className="meta-pill">
                    <span>Latest activity</span>
                    <strong>{formatDateTime(latestBuildTimestamp)}</strong>
                  </div>
                ) : null}
              </div>
              <div className="control-cluster">
                <label htmlFor="project-select" className="visually-hidden">Project</label>
                <select
                  id="project-select"
                  className="dashboard-select"
                  value={selectedProject}
                  onChange={(event) => setSelectedProject(event.target.value)}
                >
                  {projects.map((project) => (
                    <option key={project.key} value={project.key}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <button className="dashboard-button" type="button" onClick={refreshSnapshot} disabled={refreshing}>
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          <div className="metric-grid">
            <MetricPanel
              label="Release readiness"
              value={`${metrics.readiness}%`}
              hint={metrics.readiness >= 80 ? "Healthy enough for release review" : "Needs active follow-up before promotion"}
              tone={metrics.readiness >= 80 ? "success" : metrics.readiness >= 60 ? "warning" : "danger"}
            />
            <MetricPanel
              label="Build pass rate"
              value={`${metrics.buildSucceeded}/${metrics.buildTotal}`}
              hint={metrics.buildFailed ? `${metrics.buildFailed} failing pipelines in scope` : "No failing pipelines in the tracked set"}
              tone={metrics.buildFailed ? "danger" : "success"}
            />
            <MetricPanel
              label="Open work items"
              value={metrics.activeWorkItems}
              hint="Items still outside Done or Closed"
              tone={metrics.activeWorkItems ? "warning" : "success"}
            />
            <MetricPanel
              label="Active pull requests"
              value={metrics.activePullRequests}
              hint="Open code changes tied to this release"
              tone={metrics.activePullRequests ? "warning" : "success"}
            />
          </div>
        </header>

        {loading ? (
          <section className="loading-state" role="status" aria-live="polite" aria-label="Loading dashboard">
            <span className="loading-spinner" aria-hidden="true" />
            Loading dashboard...
          </section>
        ) : error ? (
          <section className="error-state" role="alert" aria-live="assertive">
            <h2>Dashboard unavailable</h2>
            <p>{error}</p>
            <button
              className="error-state__retry"
              type="button"
              onClick={() => loadDashboard(selectedProject)}
            >
              Try again
            </button>
          </section>
        ) : (
          <div className="dashboard-layout">
            <div className="dashboard-column">
              <div className="hero-inline-grid">
                <div className="hero-inline-card">
                  <p className="hero-inline-card__label">Release train</p>
                  <p className="hero-inline-card__value">{projectProfile.releaseTrain}</p>
                </div>
                <div className="hero-inline-card">
                  <p className="hero-inline-card__label">Target lane</p>
                  <p className="hero-inline-card__value">{projectProfile.environment}</p>
                </div>
                <div className="hero-inline-card">
                  <p className="hero-inline-card__label">Primary owner</p>
                  <p className="hero-inline-card__value">{projectProfile.owner}</p>
                </div>
              </div>

              <div className={`hero-decision hero-decision--${releasePosture.tone}`}>
                <div>
                  <div className="hero-decision__pill-row">
                    <span className={`hero-decision__pill hero-decision__pill--${releasePosture.tone}`}>{releasePosture.label}</span>
                    <span className="hero-decision__pill hero-decision__pill--muted">{environment?.azureMode || "mock"}</span>
                  </div>
                  <h2 className="hero-decision__title">{releasePosture.headline}</h2>
                  <p className="hero-decision__body">{releasePosture.detail}</p>
                </div>
                <div className="hero-decision__notes">
                  <p className="hero-decision__notes-label">Next actions</p>
                  <ul className="hero-decision__list">
                    {releasePosture.nextActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <SectionPanel
                eyebrow="Brief"
                title="Release brief"
                description="A mock-friendly summary tuned for screenshots, reviews, and stakeholder walkthroughs."
              >
                <p className="summary-copy">{projectProfile.objective}</p>
                <div className="brief-points">
                  {briefPoints.map((point) => (
                    <div key={point} className="brief-point">
                      <span className="brief-point__marker" />
                      <p className="brief-point__copy">{point}</p>
                    </div>
                  ))}
                </div>
                <div className="summary-callout">
                  <p className="summary-callout__label">Narrative</p>
                  <p className="summary-callout__copy">{dashboard.releaseSummary}</p>
                </div>
              </SectionPanel>

              <SectionPanel
                eyebrow="Risk"
                title="Current flags"
                description="Signals that could block promotion or create late release churn."
                trailing={
                  <div className="section-stat">
                    <p className="section-stat__label">Total flags</p>
                    <p className="section-stat__value">{dashboard.riskFlags.length}</p>
                  </div>
                }
              >
                <div className="signal-list">
                  {dashboard.riskFlags.length ? (
                    dashboard.riskFlags.map((flag) => (
                      <div key={flag} className="signal-item">
                        <span className="signal-item__marker" />
                        <p className="signal-item__copy">{flag}</p>
                      </div>
                    ))
                  ) : (
                    <div className="signal-item signal-item--calm">
                      <span className="signal-item__marker" />
                      <p className="signal-item__copy">No major release blockers detected in the current snapshot.</p>
                    </div>
                  )}
                </div>
              </SectionPanel>

              <SectionPanel
                eyebrow="Environment"
                title="Local operating mode"
                description="The API reports whether it is serving mock or live-backed data for this session."
              >
                <div className="environment-grid">
                  <div className="environment-card">
                    <p className="environment-card__label">Azure DevOps mode</p>
                    <p className="environment-card__value">{environment?.azureMode || "Unavailable"}</p>
                  </div>
                  <div className="environment-card">
                    <p className="environment-card__label">AI summary mode</p>
                    <p className="environment-card__value">{environment?.aiMode || "Unavailable"}</p>
                  </div>
                </div>
              </SectionPanel>
            </div>

            <div className="dashboard-column">
              <SectionPanel
                eyebrow="Delivery"
                title="Build pipelines"
                description="The tracked pipeline sequence for the selected release."
                trailing={
                  <div className="section-stat">
                    <p className="section-stat__label">Success rate</p>
                    <p className="section-stat__value">
                      {metrics.buildTotal ? Math.round((metrics.buildSucceeded / metrics.buildTotal) * 100) : 0}%
                    </p>
                  </div>
                }
              >
                <div className="list-stack">
                  {dashboard.builds.map((build) => (
                    <article
                      key={`${build.pipeline}-${build.startedAt}`}
                      className={`list-item list-item--${getStatusTone(build.status)}`}
                    >
                      <div className="list-item__header">
                        <div>
                          <p className="list-item__title">{build.pipeline}</p>
                          <p className="list-item__subtitle">{build.branch}</p>
                        </div>
                        <StatusBadge status={build.status} />
                      </div>
                      <div className="list-item__meta">
                        <span>Started {formatDateTime(build.startedAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel
                eyebrow="Scope"
                title="Release work items"
                description="Items included in the release cut and their current ownership."
                trailing={
                  <div className="section-stat">
                    <p className="section-stat__label">Open items</p>
                    <p className="section-stat__value">{metrics.activeWorkItems}</p>
                  </div>
                }
              >
                <div className="list-stack">
                  {dashboard.workItems.map((item) => (
                    <article key={item.id} className={`list-item list-item--${getStatusTone(item.state)}`}>
                      <div className="list-item__header">
                        <div>
                          <p className="list-item__title">
                            {item.type} {item.id}
                          </p>
                          <p className="list-item__subtitle">{item.title}</p>
                        </div>
                        <StatusBadge status={item.state} />
                      </div>
                      <div className="list-item__meta">
                        <span>Owner {item.owner}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </SectionPanel>
            </div>

            <div className="dashboard-column">
              <SectionPanel
                eyebrow="Code review"
                title="Pull requests"
                description="Change sets that still influence release confidence."
                trailing={
                  <div className="section-stat">
                    <p className="section-stat__label">Active PRs</p>
                    <p className="section-stat__value">{metrics.activePullRequests}</p>
                  </div>
                }
              >
                <div className="list-stack">
                  {dashboard.pullRequests.map((pullRequest) => (
                    <article key={pullRequest.id} className={`list-item list-item--${getStatusTone(pullRequest.status)}`}>
                      <div className="list-item__header">
                        <div>
                          <p className="list-item__title">
                            PR {pullRequest.id} · {pullRequest.title}
                          </p>
                          <p className="list-item__subtitle">{pullRequest.author}</p>
                        </div>
                        <StatusBadge status={pullRequest.status} />
                      </div>
                    </article>
                  ))}
                </div>
              </SectionPanel>
            </div>
          </div>
        )}
      </div>

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

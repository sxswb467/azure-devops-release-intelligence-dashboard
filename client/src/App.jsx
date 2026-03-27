import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:4100/api";

function StatusBadge({ status }) {
  const styles = {
    Succeeded: "success",
    Failed: "danger",
    PartiallySucceeded: "warning",
    Active: "warning",
    Completed: "success",
    Done: "success",
    "In QA": "warning",
    "In Progress": "warning"
  };
  return <span className={`badge text-bg-${styles[status] || "secondary"}`}>{status}</span>;
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("atlas");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    const res = await fetch(`${API}/projects`);
    const json = await res.json();
    setProjects(json);
  }

  async function loadDashboard(projectKey) {
    setLoading(true);
    const res = await fetch(`${API}/dashboard?project=${projectKey}`);
    const json = await res.json();
    setDashboard(json);
    setLoading(false);
  }

  async function refreshSnapshot() {
    await fetch(`${API}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: selectedProject })
    });
    await loadDashboard(selectedProject);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadDashboard(selectedProject);
  }, [selectedProject]);

  const buildStats = useMemo(() => {
    if (!dashboard?.builds) return { total: 0, green: 0 };
    return {
      total: dashboard.builds.length,
      green: dashboard.builds.filter((build) => build.status === "Succeeded").length
    };
  }, [dashboard]);

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="row g-4">
        <div className="col-12">
          <div className="bg-white rounded shadow-sm p-3 d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Azure DevOps Release Intelligence Dashboard</h1>
              <p className="text-muted mb-0">React + Node demo for release health, AI summary, and engineering risk review</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0">Project</label>
              <select
                className="form-select"
                style={{ width: 240 }}
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.key} value={project.key}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button className="btn btn-outline-primary" onClick={refreshSnapshot}>
                Refresh Snapshot
              </button>
            </div>
          </div>
        </div>

        {loading || !dashboard ? (
          <div className="col-12">
            <div className="alert alert-info">Loading dashboard...</div>
          </div>
        ) : (
          <>
            <div className="col-lg-3">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white"><strong>Build Health</strong></div>
                <div className="card-body">
                  <div className="display-6">{buildStats.green}/{buildStats.total}</div>
                  <div className="text-muted">successful tracked builds</div>
                </div>
              </div>

              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white"><strong>Risk Flags</strong></div>
                <div className="card-body">
                  {dashboard.riskFlags.length ? (
                    <ul className="mb-0">
                      {dashboard.riskFlags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-0 text-success">No major risks detected.</p>
                  )}
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-header bg-white"><strong>Release Summary</strong></div>
                <div className="card-body">
                  <p className="mb-0">{dashboard.releaseSummary}</p>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white"><strong>Build Pipelines</strong></div>
                <div className="card-body">
                  {dashboard.builds.map((build) => (
                    <div key={`${build.pipeline}-${build.startedAt}`} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{build.pipeline}</div>
                          <div className="small text-muted">{build.branch}</div>
                        </div>
                        <StatusBadge status={build.status} />
                      </div>
                      <div className="small text-muted mt-2">Started: {build.startedAt}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-header bg-white"><strong>Pull Requests</strong></div>
                <div className="card-body">
                  {dashboard.pullRequests.map((pr) => (
                    <div key={pr.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">PR {pr.id} · {pr.title}</div>
                          <div className="small text-muted">{pr.author}</div>
                        </div>
                        <StatusBadge status={pr.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header bg-white"><strong>Release Work Items</strong></div>
                <div className="card-body">
                  {dashboard.workItems.map((item) => (
                    <div key={item.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{item.type} {item.id}</div>
                          <div>{item.title}</div>
                          <div className="small text-muted mt-1">Owner: {item.owner}</div>
                        </div>
                        <StatusBadge status={item.state} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

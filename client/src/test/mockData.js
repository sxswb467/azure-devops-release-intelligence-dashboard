export const mockProjects = [
  { key: "atlas", name: "Atlas — Checkout refinement" },
  { key: "beacon", name: "Beacon — Webhook resilience" }
];

export const mockHealth = {
  azureMode: "mock",
  aiMode: "mock"
};

/** Dashboard with a failing build — triggers "Hold release" posture */
export const mockDashboardDanger = {
  builds: [
    { pipeline: "Build validation", branch: "main", status: "Succeeded", startedAt: "2026-04-07T10:00:00Z" },
    { pipeline: "Deploy to staging", branch: "main", status: "PartiallySucceeded", startedAt: "2026-04-07T10:30:00Z" },
    { pipeline: "Integration tests", branch: "main", status: "Failed", startedAt: "2026-04-07T11:00:00Z" }
  ],
  workItems: [
    { id: "WI-101", type: "Story", title: "Invoice filter polish", state: "In Progress", owner: "Ava" },
    { id: "WI-102", type: "Bug", title: "Auth regression fix", state: "Done", owner: "Noah" }
  ],
  pullRequests: [
    { id: "PR-42", title: "Fix invoice filter edge case", author: "ava@team.com", status: "Active" },
    { id: "PR-43", title: "Auth patch", author: "noah@team.com", status: "Completed" }
  ],
  riskFlags: ["Integration test pipeline is failing"],
  releaseSummary: "The checkout refinement release is in late-stage preparation with active blockers."
};

/** Dashboard with risk flags but no failing builds — triggers "Review before promote" posture */
export const mockDashboardWarning = {
  builds: [
    { pipeline: "Build validation", branch: "main", status: "Succeeded", startedAt: "2026-04-07T10:00:00Z" },
    { pipeline: "Deploy to staging", branch: "main", status: "PartiallySucceeded", startedAt: "2026-04-07T10:30:00Z" }
  ],
  workItems: [
    { id: "WI-101", type: "Story", title: "Invoice filter polish", state: "In Progress", owner: "Ava" },
    { id: "WI-102", type: "Bug", title: "Auth regression fix", state: "Done", owner: "Noah" }
  ],
  pullRequests: [
    { id: "PR-42", title: "Fix invoice filter edge case", author: "ava@team.com", status: "Active" }
  ],
  riskFlags: ["Staging deployment partially succeeded"],
  releaseSummary: "The release is close but has outstanding items."
};

/** All-clear dashboard — triggers "Ready for review" posture */
export const mockDashboardSuccess = {
  builds: [
    { pipeline: "Build validation", branch: "main", status: "Succeeded", startedAt: "2026-04-07T10:00:00Z" },
    { pipeline: "Deploy to staging", branch: "main", status: "Succeeded", startedAt: "2026-04-07T10:30:00Z" }
  ],
  workItems: [
    { id: "WI-101", type: "Story", title: "Invoice filter polish", state: "Done", owner: "Ava" },
    { id: "WI-102", type: "Bug", title: "Auth regression fix", state: "Done", owner: "Noah" }
  ],
  pullRequests: [
    { id: "PR-43", title: "Auth patch", author: "noah@team.com", status: "Completed" }
  ],
  riskFlags: [],
  releaseSummary: "All signals are aligned for a clean promotion discussion."
};

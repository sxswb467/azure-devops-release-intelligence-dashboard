import { describe, expect, it } from "vitest";
import {
  buildBriefPoints,
  buildDashboardMetrics,
  formatDateTime,
  getLatestBuildTimestamp,
  getProjectProfile,
  getReleasePosture
} from "./dashboard.js";
import {
  mockDashboardDanger,
  mockDashboardSuccess,
  mockDashboardWarning
} from "../test/mockData.js";

// ── formatDateTime ────────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("returns a non-empty string for a valid ISO timestamp", () => {
    const result = formatDateTime("2026-04-07T10:30:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the day of the month in the output", () => {
    const result = formatDateTime("2026-04-07T10:30:00Z");
    expect(result).toMatch(/7/);
  });
});

// ── buildDashboardMetrics ─────────────────────────────────────────────────────

describe("buildDashboardMetrics", () => {
  it("returns all-zero metrics when dashboard is null", () => {
    expect(buildDashboardMetrics(null)).toEqual({
      buildTotal: 0,
      buildSucceeded: 0,
      buildFailed: 0,
      activeWorkItems: 0,
      activePullRequests: 0,
      readiness: 0
    });
  });

  it("counts build totals, successes, and failures correctly", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    expect(metrics.buildTotal).toBe(3);
    expect(metrics.buildSucceeded).toBe(1);
    expect(metrics.buildFailed).toBe(1);
  });

  it("counts active work items (excludes Done and Closed)", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    expect(metrics.activeWorkItems).toBe(1); // WI-101 is In Progress
  });

  it("counts active pull requests", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    expect(metrics.activePullRequests).toBe(1); // PR-42 is Active
  });

  it("calculates readiness as a number between 0 and 100", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    expect(metrics.readiness).toBeGreaterThanOrEqual(0);
    expect(metrics.readiness).toBeLessThanOrEqual(100);
  });

  it("returns 100% readiness when all builds pass, all items done, no active PRs", () => {
    const metrics = buildDashboardMetrics(mockDashboardSuccess);
    expect(metrics.readiness).toBe(100);
  });

  it("handles empty builds, workItems, and pullRequests arrays", () => {
    const empty = { builds: [], workItems: [], pullRequests: [], riskFlags: [], releaseSummary: "" };
    const metrics = buildDashboardMetrics(empty);
    expect(metrics.buildTotal).toBe(0);
    // No builds → buildScore = 0 (weighted 0.5); no work items or PRs → scores = 1 each
    // readiness = (0×0.5 + 1×0.3 + 1×0.2) × 100 = 50
    expect(metrics.readiness).toBe(50);
  });
});

// ── getLatestBuildTimestamp ───────────────────────────────────────────────────

describe("getLatestBuildTimestamp", () => {
  it("returns null when dashboard is null", () => {
    expect(getLatestBuildTimestamp(null)).toBeNull();
  });

  it("returns null when builds array is empty", () => {
    expect(getLatestBuildTimestamp({ builds: [] })).toBeNull();
  });

  it("returns the most recent startedAt timestamp", () => {
    const result = getLatestBuildTimestamp(mockDashboardDanger);
    expect(result).toBe("2026-04-07T11:00:00Z"); // Integration tests is latest
  });

  it("works correctly with a single build", () => {
    const dashboard = { builds: [{ pipeline: "CI", status: "Succeeded", startedAt: "2026-01-01T00:00:00Z" }] };
    expect(getLatestBuildTimestamp(dashboard)).toBe("2026-01-01T00:00:00Z");
  });
});

// ── getReleasePosture ─────────────────────────────────────────────────────────

describe("getReleasePosture", () => {
  it("returns a loading posture when dashboard is null", () => {
    const posture = getReleasePosture(null, buildDashboardMetrics(null));
    expect(posture.tone).toBe("neutral");
    expect(posture.label).toBe("Loading");
    expect(posture.nextActions).toHaveLength(0);
  });

  it("returns danger posture when a build has failed", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    const posture = getReleasePosture(mockDashboardDanger, metrics);
    expect(posture.tone).toBe("danger");
    expect(posture.label).toBe("Hold release");
    expect(posture.nextActions.length).toBeGreaterThan(0);
  });

  it("returns warning posture when there are risk flags but no failing builds", () => {
    const metrics = buildDashboardMetrics(mockDashboardWarning);
    const posture = getReleasePosture(mockDashboardWarning, metrics);
    expect(posture.tone).toBe("warning");
    expect(posture.label).toBe("Review before promote");
  });

  it("returns success posture when all signals are clear", () => {
    const metrics = buildDashboardMetrics(mockDashboardSuccess);
    const posture = getReleasePosture(mockDashboardSuccess, metrics);
    expect(posture.tone).toBe("success");
    expect(posture.label).toBe("Ready for review");
  });

  it("danger posture takes priority over risk flags", () => {
    const dashboardWithBoth = {
      ...mockDashboardDanger,
      riskFlags: ["Something risky"]
    };
    const metrics = buildDashboardMetrics(dashboardWithBoth);
    const posture = getReleasePosture(dashboardWithBoth, metrics);
    expect(posture.tone).toBe("danger");
  });

  it("all postures include a headline and detail string", () => {
    for (const dashboard of [null, mockDashboardDanger, mockDashboardWarning, mockDashboardSuccess]) {
      const metrics = buildDashboardMetrics(dashboard);
      const posture = getReleasePosture(dashboard, metrics);
      expect(typeof posture.headline).toBe("string");
      expect(typeof posture.detail).toBe("string");
    }
  });
});

// ── getProjectProfile ─────────────────────────────────────────────────────────

describe("getProjectProfile", () => {
  it("returns beacon profile for 'beacon'", () => {
    const profile = getProjectProfile("beacon");
    expect(profile.stage).toBe("Incident follow-up");
    expect(profile.owner).toBe("Liam + Sophia");
  });

  it("returns atlas profile for 'atlas'", () => {
    const profile = getProjectProfile("atlas");
    expect(profile.stage).toBe("Promotion review");
    expect(profile.owner).toBe("Ava + Noah");
  });

  it("returns atlas profile for any unknown key", () => {
    const profile = getProjectProfile("unknown-project");
    expect(profile.stage).toBe("Promotion review");
  });

  it("every profile has required fields", () => {
    for (const key of ["atlas", "beacon"]) {
      const profile = getProjectProfile(key);
      expect(profile).toHaveProperty("releaseTrain");
      expect(profile).toHaveProperty("owner");
      expect(profile).toHaveProperty("environment");
      expect(profile).toHaveProperty("objective");
      expect(profile).toHaveProperty("stage");
    }
  });
});

// ── buildBriefPoints ──────────────────────────────────────────────────────────

describe("buildBriefPoints", () => {
  it("returns an empty array when dashboard is null", () => {
    expect(buildBriefPoints(null, buildDashboardMetrics(null))).toEqual([]);
  });

  it("returns at most 3 points", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    const points = buildBriefPoints(mockDashboardDanger, metrics);
    expect(points.length).toBeLessThanOrEqual(3);
  });

  it("includes a point about the deploy pipeline when present", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    const points = buildBriefPoints(mockDashboardDanger, metrics);
    expect(points.some((p) => p.toLowerCase().includes("deploy"))).toBe(true);
  });

  it("includes a point about failing builds when buildFailed > 0", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    const points = buildBriefPoints(mockDashboardDanger, metrics);
    expect(points.some((p) => p.includes("failing"))).toBe(true);
  });

  it("includes a partial success point when no failures but partial build exists", () => {
    const metrics = buildDashboardMetrics(mockDashboardWarning);
    const points = buildBriefPoints(mockDashboardWarning, metrics);
    expect(points.some((p) => p.toLowerCase().includes("partial"))).toBe(true);
  });

  it("returns only strings", () => {
    const metrics = buildDashboardMetrics(mockDashboardDanger);
    const points = buildBriefPoints(mockDashboardDanger, metrics);
    points.forEach((p) => expect(typeof p).toBe("string"));
  });
});

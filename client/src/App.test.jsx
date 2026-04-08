import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import App from "./App.jsx";
import { mockDashboardSuccess } from "./test/mockData.js";
import { server } from "./test/server.js";

// Helper: render App and wait for the dashboard to finish loading
async function renderApp() {
  render(<App />);
  await waitFor(() => expect(screen.queryByText("Loading dashboard...")).not.toBeInTheDocument());
}

// ── Loading state ─────────────────────────────────────────────────────────────

describe("loading state", () => {
  it("shows loading text while fetching", () => {
    render(<App />);
    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("loading section has role=status for screen readers", () => {
    render(<App />);
    expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeInTheDocument();
  });

  it("loading section has aria-live=polite", () => {
    render(<App />);
    const loadingEl = screen.getByRole("status", { name: "Loading dashboard" });
    expect(loadingEl).toHaveAttribute("aria-live", "polite");
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe("error state", () => {
  it("shows error heading when the API returns an error", async () => {
    server.use(
      http.get("http://localhost:4100/api/dashboard", () =>
        HttpResponse.json({ error: "Project not found" }, { status: 404 })
      )
    );
    render(<App />);
    await waitFor(() => expect(screen.getByText("Dashboard unavailable")).toBeInTheDocument());
  });

  it("shows the error message from the API", async () => {
    server.use(
      http.get("http://localhost:4100/api/dashboard", () =>
        HttpResponse.json({ error: "Project not found" }, { status: 404 })
      )
    );
    render(<App />);
    await waitFor(() => expect(screen.getByText("Project not found")).toBeInTheDocument());
  });

  it("error section has role=alert for screen readers", async () => {
    server.use(
      http.get("http://localhost:4100/api/dashboard", () =>
        HttpResponse.json({ error: "Project not found" }, { status: 404 })
      )
    );
    render(<App />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("renders a Try again button in the error state", async () => {
    server.use(
      http.get("http://localhost:4100/api/dashboard", () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 })
      )
    );
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument());
  });

  it("clicking Try again retries the dashboard fetch", async () => {
    let callCount = 0;
    server.use(
      http.get("http://localhost:4100/api/dashboard", () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({ error: "Temporary error" }, { status: 500 });
        }
        return HttpResponse.json(mockDashboardSuccess);
      })
    );
    render(<App />);
    const retryBtn = await screen.findByRole("button", { name: "Try again" });
    await userEvent.click(retryBtn);
    await waitFor(() => expect(screen.queryByText("Dashboard unavailable")).not.toBeInTheDocument());
    expect(callCount).toBe(2);
  });

  it("shows a friendly message for network failures", async () => {
    server.use(
      http.get("http://localhost:4100/api/dashboard", () => HttpResponse.error())
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/unable to connect/i)).toBeInTheDocument()
    );
  });
});

// ── Dashboard content ─────────────────────────────────────────────────────────

describe("dashboard content", () => {
  it("renders the page title", async () => {
    await renderApp();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Azure DevOps Release Intelligence");
  });

  it("renders all four metric panels", async () => {
    await renderApp();
    expect(screen.getByLabelText(/release readiness/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/build pass rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/open work items/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/active pull requests/i)).toBeInTheDocument();
  });

  it("renders the build pipelines section", async () => {
    await renderApp();
    expect(screen.getByRole("heading", { name: "Build pipelines" })).toBeInTheDocument();
  });

  it("renders build pipeline entries from the API response", async () => {
    await renderApp();
    expect(screen.getByText("Build validation")).toBeInTheDocument();
    expect(screen.getByText("Integration tests")).toBeInTheDocument();
  });

  it("renders the release work items section", async () => {
    await renderApp();
    expect(screen.getByRole("heading", { name: "Release work items" })).toBeInTheDocument();
  });

  it("renders work item entries from the API response", async () => {
    await renderApp();
    expect(screen.getByText("Invoice filter polish")).toBeInTheDocument();
  });

  it("renders the pull requests section", async () => {
    await renderApp();
    expect(screen.getByRole("heading", { name: "Pull requests" })).toBeInTheDocument();
  });

  it("renders pull request entries from the API response", async () => {
    await renderApp();
    expect(screen.getByText(/Fix invoice filter edge case/)).toBeInTheDocument();
  });

  it("renders the release brief section", async () => {
    await renderApp();
    expect(screen.getByRole("heading", { name: "Release brief" })).toBeInTheDocument();
  });

  it("renders the current flags section", async () => {
    await renderApp();
    expect(screen.getByRole("heading", { name: "Current flags" })).toBeInTheDocument();
  });

  it("renders the risk flag text from the API response", async () => {
    await renderApp();
    expect(screen.getByText("Integration test pipeline is failing")).toBeInTheDocument();
  });

  it("renders the status badges for builds", async () => {
    await renderApp();
    expect(screen.getByLabelText("Status: Succeeded")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Failed")).toBeInTheDocument();
  });
});

// ── Project selector ──────────────────────────────────────────────────────────

describe("project selector", () => {
  it("renders the project select dropdown", async () => {
    await renderApp();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("populates the selector with projects from the API", async () => {
    await renderApp();
    const select = screen.getByRole("combobox");
    expect(within(select).getByText("Atlas — Checkout refinement")).toBeInTheDocument();
    expect(within(select).getByText("Beacon — Webhook resilience")).toBeInTheDocument();
  });

  it("defaults to the atlas project", async () => {
    await renderApp();
    expect(screen.getByRole("combobox")).toHaveValue("atlas");
  });

  it("reloads the dashboard when a different project is selected", async () => {
    let lastProject = null;
    server.use(
      http.get("http://localhost:4100/api/dashboard", ({ request }) => {
        lastProject = new URL(request.url).searchParams.get("project");
        return HttpResponse.json(mockDashboardSuccess);
      })
    );
    await renderApp();
    await userEvent.selectOptions(screen.getByRole("combobox"), "beacon");
    await waitFor(() => expect(lastProject).toBe("beacon"));
  });
});

// ── Refresh ───────────────────────────────────────────────────────────────────

describe("refresh", () => {
  it("renders the Refresh button", async () => {
    await renderApp();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  it("disables the Refresh button while refreshing", async () => {
    let resolveRefresh;
    server.use(
      http.post("http://localhost:4100/api/refresh", () =>
        new Promise((resolve) => { resolveRefresh = resolve; })
      )
    );
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(screen.getByRole("button", { name: "Refreshing..." })).toBeDisabled();
    resolveRefresh(HttpResponse.json({ ok: true }));
  });

  it("shows a toast notification after a successful refresh", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(screen.getByText(/dashboard refreshed at/i)).toBeInTheDocument()
    );
  });

  it("shows an error message if the refresh API call fails", async () => {
    server.use(
      http.post("http://localhost:4100/api/refresh", () =>
        HttpResponse.json({ error: "Refresh failed" }, { status: 500 })
      )
    );
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(screen.getByText("Refresh failed")).toBeInTheDocument());
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe("accessibility", () => {
  it("renders a single h1 landmark", async () => {
    await renderApp();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("project select has an accessible label", async () => {
    await renderApp();
    // label uses visually-hidden class and htmlFor association
    expect(screen.getByLabelText("Project")).toBeInTheDocument();
  });

  it("all status badges have aria-label attributes", async () => {
    await renderApp();
    const badges = screen.getAllByLabelText(/^Status:/);
    expect(badges.length).toBeGreaterThan(0);
  });
});

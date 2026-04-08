import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricPanel } from "./MetricPanel.jsx";

describe("MetricPanel", () => {
  it("renders the label", () => {
    render(<MetricPanel label="Release readiness" value="82%" hint="Healthy" />);
    expect(screen.getByText("Release readiness")).toBeInTheDocument();
  });

  it("renders the value", () => {
    render(<MetricPanel label="Release readiness" value="82%" hint="Healthy" />);
    expect(screen.getByText("82%")).toBeInTheDocument();
  });

  it("renders the hint", () => {
    render(<MetricPanel label="Release readiness" value="82%" hint="Healthy enough for release review" />);
    expect(screen.getByText("Healthy enough for release review")).toBeInTheDocument();
  });

  it("has an aria-label combining label and value", () => {
    render(<MetricPanel label="Open work items" value="3" hint="Items outside Done" />);
    expect(screen.getByRole("region", { name: "Open work items: 3" })).toBeInTheDocument();
  });

  it("applies the success tone class", () => {
    render(<MetricPanel label="Build pass rate" value="4/4" hint="All passing" tone="success" />);
    expect(screen.getByRole("region")).toHaveClass("metric-panel--success");
  });

  it("applies the warning tone class", () => {
    render(<MetricPanel label="Open work items" value="2" hint="Active items" tone="warning" />);
    expect(screen.getByRole("region")).toHaveClass("metric-panel--warning");
  });

  it("applies the danger tone class", () => {
    render(<MetricPanel label="Build pass rate" value="2/4" hint="Failing pipelines" tone="danger" />);
    expect(screen.getByRole("region")).toHaveClass("metric-panel--danger");
  });

  it("defaults to neutral tone when tone prop is omitted", () => {
    render(<MetricPanel label="Metric" value="0" hint="hint" />);
    expect(screen.getByRole("region")).toHaveClass("metric-panel--neutral");
  });

  it("always renders the base metric-panel class", () => {
    render(<MetricPanel label="Metric" value="0" hint="hint" tone="success" />);
    expect(screen.getByRole("region")).toHaveClass("metric-panel");
  });
});

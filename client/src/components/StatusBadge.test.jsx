import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge, getStatusTone } from "./StatusBadge.jsx";

describe("StatusBadge", () => {
  it("renders the status text", () => {
    render(<StatusBadge status="Succeeded" />);
    expect(screen.getByText("Succeeded")).toBeInTheDocument();
  });

  it("has an aria-label describing the status", () => {
    render(<StatusBadge status="Failed" />);
    expect(screen.getByLabelText("Status: Failed")).toBeInTheDocument();
  });

  it("applies the success tone class for Succeeded", () => {
    render(<StatusBadge status="Succeeded" />);
    expect(screen.getByText("Succeeded")).toHaveClass("status-badge--success");
  });

  it("applies the danger tone class for Failed", () => {
    render(<StatusBadge status="Failed" />);
    expect(screen.getByText("Failed")).toHaveClass("status-badge--danger");
  });

  it("applies the warning tone class for Active", () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText("Active")).toHaveClass("status-badge--warning");
  });

  it("applies the success tone class for Done", () => {
    render(<StatusBadge status="Done" />);
    expect(screen.getByText("Done")).toHaveClass("status-badge--success");
  });

  it("applies the neutral tone class for an unknown status", () => {
    render(<StatusBadge status="Unknown" />);
    expect(screen.getByText("Unknown")).toHaveClass("status-badge--neutral");
  });

  it("always renders the base status-badge class", () => {
    render(<StatusBadge status="Completed" />);
    expect(screen.getByText("Completed")).toHaveClass("status-badge");
  });
});

describe("getStatusTone", () => {
  it("returns success for Succeeded", () => expect(getStatusTone("Succeeded")).toBe("success"));
  it("returns danger for Failed", () => expect(getStatusTone("Failed")).toBe("danger"));
  it("returns warning for Active", () => expect(getStatusTone("Active")).toBe("warning"));
  it("returns warning for In Progress", () => expect(getStatusTone("In Progress")).toBe("warning"));
  it("returns success for Done", () => expect(getStatusTone("Done")).toBe("success"));
  it("returns success for Completed", () => expect(getStatusTone("Completed")).toBe("success"));
  it("returns success for Closed", () => expect(getStatusTone("Closed")).toBe("success"));
  it("returns neutral for an unrecognised status", () => expect(getStatusTone("Deploying")).toBe("neutral"));
});

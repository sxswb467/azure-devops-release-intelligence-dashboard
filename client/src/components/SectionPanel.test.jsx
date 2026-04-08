import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionPanel } from "./SectionPanel.jsx";

describe("SectionPanel", () => {
  it("renders the title", () => {
    render(<SectionPanel title="Build pipelines" description="Tracked pipelines"><p>content</p></SectionPanel>);
    expect(screen.getByText("Build pipelines")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<SectionPanel title="Build pipelines" description="Tracked pipeline sequence"><p>content</p></SectionPanel>);
    expect(screen.getByText("Tracked pipeline sequence")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <SectionPanel title="Title" description="Description">
        <p>Child content</p>
      </SectionPanel>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders the eyebrow when provided", () => {
    render(<SectionPanel eyebrow="Delivery" title="Build pipelines" description="desc"><p>x</p></SectionPanel>);
    expect(screen.getByText("Delivery")).toBeInTheDocument();
  });

  it("does not render an eyebrow element when omitted", () => {
    render(<SectionPanel title="Build pipelines" description="desc"><p>x</p></SectionPanel>);
    expect(screen.queryByText("Delivery")).not.toBeInTheDocument();
  });

  it("renders trailing content when provided", () => {
    render(
      <SectionPanel title="Title" description="desc" trailing={<span>Trailing info</span>}>
        <p>x</p>
      </SectionPanel>
    );
    expect(screen.getByText("Trailing info")).toBeInTheDocument();
  });

  it("does not render trailing slot when omitted", () => {
    render(<SectionPanel title="Title" description="desc"><p>x</p></SectionPanel>);
    expect(screen.queryByText("Trailing info")).not.toBeInTheDocument();
  });

  it("uses an h2 for the title", () => {
    render(<SectionPanel title="Build pipelines" description="desc"><p>x</p></SectionPanel>);
    expect(screen.getByRole("heading", { level: 2, name: "Build pipelines" })).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <SectionPanel title="Title" description="desc">
        <p>First</p>
        <p>Second</p>
        <p>Third</p>
      </SectionPanel>
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });
});

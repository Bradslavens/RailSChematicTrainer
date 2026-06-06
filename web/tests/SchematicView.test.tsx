import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { SchematicView } from "../src/schematic/SchematicView.js";
import type { Schematic } from "../src/lib/schematics.js";

const schematic: Schematic = {
  id: "s1",
  name: "Test Branch",
  lineColor: "#1f6feb",
  status: "draft",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", color: "#1f6feb", polyline: [[365, 40], [365, 910]] }],
  points: [
    { id: "p1", type: "signal", label: "E18LA", x: 345, y: 95, track: "left", order: null },
    { id: "p2", type: "station", label: "La Mesa Blvd", x: 430, y: 255, track: null, order: null },
    { id: "p3", type: "crossing", label: "University Ave", x: 200, y: 173, track: null, order: null },
  ],
};

function renderView(props: Partial<React.ComponentProps<typeof SchematicView>> = {}) {
  return render(<SchematicView schematic={schematic} {...props} />);
}

describe("SchematicView", () => {
  it("renders an svg with the schematic viewBox", () => {
    const { container } = renderView();
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 700 950");
  });

  it("draws each track and each point", () => {
    const { container } = renderView();
    expect(container.querySelectorAll(".track")).toHaveLength(1);
    expect(container.querySelectorAll("[data-point-id]")).toHaveLength(3);
  });

  it("hides labels by default (blank schematic)", () => {
    const { queryByText } = renderView();
    expect(queryByText("E18LA")).not.toBeInTheDocument();
  });

  it("shows all labels when showLabels is true", () => {
    const { getByText } = renderView({ showLabels: true });
    expect(getByText("E18LA")).toBeInTheDocument();
    expect(getByText("University Ave")).toBeInTheDocument();
  });

  it("reveals only specific labels via revealedPointIds", () => {
    const { getByText, queryByText } = renderView({ revealedPointIds: new Set(["p2"]) });
    expect(getByText("La Mesa Blvd")).toBeInTheDocument();
    expect(queryByText("E18LA")).not.toBeInTheDocument();
  });

  it("applies the highlight class to the highlighted point", () => {
    const { container } = renderView({ highlightPointId: "p1" });
    const marker = container.querySelector('[data-point-id="p1"]')!;
    expect(marker.classList.contains("is-highlighted")).toBe(true);
  });

  it("filters markers by visibleTypes", () => {
    const { container } = renderView({ visibleTypes: ["signal"] });
    expect(container.querySelectorAll("[data-point-id]")).toHaveLength(1);
    expect(container.querySelector('[data-point-type="signal"]')).toBeInTheDocument();
  });

  it("calls onPointClick when a marker is clicked", () => {
    const onPointClick = vi.fn();
    const { container } = renderView({ onPointClick });
    fireEvent.click(container.querySelector('[data-point-id="p3"]')!);
    expect(onPointClick).toHaveBeenCalledWith(expect.objectContaining({ id: "p3", label: "University Ave" }));
  });

  it("makes markers non-interactive without onPointClick", () => {
    const { container } = renderView();
    expect(container.querySelector('[data-point-id="p1"]')!.getAttribute("role")).toBeNull();
  });
});

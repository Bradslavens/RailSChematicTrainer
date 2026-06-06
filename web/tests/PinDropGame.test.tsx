import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PinDropGame } from "../src/games/PinDropGame.js";
import type { Schematic, SchematicPoint } from "../src/lib/schematics.js";

const points: SchematicPoint[] = [
  { id: "p1", type: "signal", label: "E18LA", x: 345, y: 95, track: "left", order: null },
  { id: "p2", type: "signal", label: "E1221", x: 340, y: 310, track: "left", order: null },
];

const schematic: Schematic = {
  id: "s1",
  name: "Branch",
  lineColor: "#1f6feb",
  status: "draft",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", color: "#1f6feb", polyline: [[365, 40], [365, 910]] }],
  points,
};

function markerFor(container: HTMLElement, label: string) {
  const id = points.find((p) => p.label === label)!.id;
  return container.querySelector(`[data-point-id="${id}"]`)!;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ attempt: { id: "a1" } }) }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("PinDropGame", () => {
  it("awards points and records an attempt when the correct marker is tapped", async () => {
    const { container } = render(
      <PinDropGame schematic={schematic} pool={points} roundLength={2} visibleTypes={["signal"]} onExit={() => {}} />,
    );

    const target = screen.getByTestId("prompt-label").textContent!;
    fireEvent.click(markerFor(container, target));

    // feedback shows a bullseye and the score badge updates to 100
    expect(await screen.findByText(/Bullseye/i)).toBeInTheDocument();
    expect(screen.getByText("100 pts")).toBeInTheDocument();

    // an attempt was recorded as correct
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/attempts", expect.any(Object)));
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toMatchObject({ gameMode: "pin-drop", correct: true });
  });

  it("marks a wrong tap as not correct", async () => {
    const { container } = render(
      <PinDropGame schematic={schematic} pool={points} roundLength={2} visibleTypes={["signal"]} onExit={() => {}} />,
    );
    const target = screen.getByTestId("prompt-label").textContent!;
    const wrong = points.find((p) => p.label !== target)!.label;
    fireEvent.click(markerFor(container, wrong));

    expect(await screen.findByText(/So close|Not quite/i)).toBeInTheDocument();
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.correct).toBe(false);
  });

  it("progresses through the round to a results screen", async () => {
    const { container } = render(
      <PinDropGame schematic={schematic} pool={points} roundLength={2} visibleTypes={["signal"]} onExit={() => {}} />,
    );

    for (let q = 0; q < 2; q++) {
      const target = screen.getByTestId("prompt-label").textContent!;
      fireEvent.click(markerFor(container, target));
      const advance = await screen.findByRole("button", { name: /Next|See results/i });
      fireEvent.click(advance);
    }

    expect(await screen.findByText(/Round complete/i)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 2 correct/)).toBeInTheDocument();
  });
});

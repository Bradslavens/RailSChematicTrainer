import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RunTheLineGame } from "../src/games/RunTheLineGame.js";
import type { Schematic, SchematicPoint } from "../src/lib/schematics.js";

const points: SchematicPoint[] = [
  { id: "p3", type: "signal", label: "E1147", x: 340, y: 468, track: "left", order: null },
  { id: "p1", type: "signal", label: "E18LA", x: 345, y: 95, track: "left", order: null },
  { id: "p2", type: "signal", label: "E1221", x: 340, y: 310, track: "left", order: null },
  { id: "px", type: "signal", label: "E9999", x: 510, y: 200, track: "right", order: null },
];

const schematic: Schematic = {
  id: "s1",
  name: "Branch",
  lineColor: "#1f6feb",
  status: "draft",
  viewBox: [0, 0, 700, 950],
  tracks: [
    { id: "left", color: "#1f6feb", polyline: [[365, 40], [365, 910]] },
    { id: "right", color: "#1f6feb", polyline: [[510, 40], [510, 910]] },
  ],
  points,
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ attempt: { id: "a1" }, stats: { xp: 10 }, leveledUp: false }),
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("RunTheLineGame", () => {
  it("quizzes only the selected track, starting at the topmost stop", () => {
    render(<RunTheLineGame schematic={schematic} trackId="left" onExit={() => {}} />);
    const choices = screen.getAllByRole("button").filter((b) => b.classList.contains("choice"));
    // first stop is the topmost left signal (E18LA, y=95); right-track E9999 is never a choice
    expect(choices.some((b) => b.textContent === "E18LA")).toBe(true);
    expect(choices.some((b) => b.textContent === "E9999")).toBe(false);
  });

  it("builds a combo and records run-the-line attempts on correct answers", async () => {
    render(<RunTheLineGame schematic={schematic} trackId="left" onExit={() => {}} />);
    // first stop is E18LA — click it
    fireEvent.click(screen.getByRole("button", { name: "E18LA" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/attempts", expect.any(Object)));
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.gameMode).toBe("run-the-line");
    expect(body.correct).toBe(true);
    // score reflects combo x1 = 100
    expect(screen.getByText(/100 pts/)).toBeInTheDocument();
  });
});

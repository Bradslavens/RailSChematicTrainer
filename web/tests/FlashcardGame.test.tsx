import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FlashcardGame } from "../src/games/FlashcardGame.js";
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

function mockApi(duePointIds: string[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("/progress/due")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ pointIds: duePointIds }) });
      }
      // POST /attempts
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => ({ attempt: { id: "a1" }, stats: { xp: 10 }, leveledUp: false }),
      });
    }),
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("FlashcardGame", () => {
  it("shows 'all caught up' when nothing is due", async () => {
    mockApi([]);
    render(<FlashcardGame schematic={schematic} types={["signal"]} onExit={() => {}} />);
    expect(await screen.findByText(/All caught up/i)).toBeInTheDocument();
  });

  it("reveals the answer and records a 'got it' as correct", async () => {
    mockApi(["p2"]);
    render(<FlashcardGame schematic={schematic} types={["signal"]} onExit={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: /Reveal answer/i }));
    expect(screen.getByTestId("card-answer")).toHaveTextContent("E1221");

    fireEvent.click(screen.getByRole("button", { name: /Got it/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/attempts", expect.objectContaining({ method: "POST" })),
    );
    const postCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => c[0] === "/api/attempts",
    )!;
    const body = JSON.parse(postCall[1].body);
    expect(body).toMatchObject({ gameMode: "flashcard", correct: true, pointId: "p2" });

    expect(await screen.findByText(/Review complete/i)).toBeInTheDocument();
  });

  it("records 'missed it' as incorrect", async () => {
    mockApi(["p1"]);
    render(<FlashcardGame schematic={schematic} types={["signal"]} onExit={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: /Reveal answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /Missed it/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/attempts", expect.any(Object)));
    const postCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => c[0] === "/api/attempts",
    )!;
    expect(JSON.parse(postCall[1].body).correct).toBe(false);
  });
});

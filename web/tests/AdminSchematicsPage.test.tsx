import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminSchematicsPage } from "../src/pages/admin/AdminSchematicsPage.js";
import { renderWithProviders } from "./test-utils.js";

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("AdminSchematicsPage", () => {
  it("lists existing schematics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          schematics: [{ id: "s1", name: "La Mesa Branch", status: "draft", pointCount: 37 }],
        }),
      ),
    );
    renderWithProviders(<AdminSchematicsPage />);
    expect(await screen.findByText("La Mesa Branch")).toBeInTheDocument();
    expect(screen.getByText(/37 markers/)).toBeInTheDocument();
  });

  it("shows an error when an uploaded file is not valid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { schematics: [] })));
    renderWithProviders(<AdminSchematicsPage />);
    await screen.findByText(/None yet/);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["this is { not json"], "broken.json", { type: "application/json" });
    await userEvent.upload(input, badFile);

    expect(await screen.findByRole("alert")).toHaveTextContent(/not valid JSON/i);
  });

  it("uploads a valid JSON file via POST /api/schematics", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { schematics: [] })) // initial list
      .mockResolvedValueOnce(
        jsonResponse(201, { schematic: { name: "Uploaded", points: [{}, {}] } }),
      ) // create
      .mockResolvedValueOnce(jsonResponse(200, { schematics: [] })); // reload
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<AdminSchematicsPage />);
    await screen.findByText(/None yet/);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File([JSON.stringify({ name: "Uploaded", viewBox: [0, 0, 1, 1] })], "good.json", {
      type: "application/json",
    });
    await userEvent.upload(input, goodFile);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/schematics", expect.objectContaining({ method: "POST" })),
    );
    expect(await screen.findByText(/Uploaded "Uploaded"/)).toBeInTheDocument();
  });
});

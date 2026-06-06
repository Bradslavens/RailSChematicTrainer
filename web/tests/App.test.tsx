import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App.js";

describe("App", () => {
  it("renders the app title", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /rail schematic trainer/i }),
    ).toBeInTheDocument();
  });
});

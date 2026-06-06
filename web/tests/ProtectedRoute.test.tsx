import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../src/components/ProtectedRoute.js";
import { renderWithProviders } from "./test-utils.js";

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

function Tree() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div>Secret Home</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  it("redirects to /login when there is no token", async () => {
    renderWithProviders(<Tree />, "/");
    await waitFor(() => expect(screen.getByText("Login Page")).toBeInTheDocument());
    expect(screen.queryByText("Secret Home")).not.toBeInTheDocument();
  });

  it("renders the protected content when /auth/me succeeds", async () => {
    localStorage.setItem("rst.token", "valid");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user: { id: "1", email: "a@b.com", role: "learner" } }),
      }),
    );
    renderWithProviders(<Tree />, "/");
    await waitFor(() => expect(screen.getByText("Secret Home")).toBeInTheDocument());
  });
});

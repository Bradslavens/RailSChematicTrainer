import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "../src/pages/LoginPage.js";
import { renderWithProviders } from "./test-utils.js";

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("LoginPage", () => {
  it("renders the email and password fields", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows a validation error when submitting empty", async () => {
    renderWithProviders(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/email and password/i);
  });

  it("calls the login endpoint with entered credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: "t", user: { id: "1", email: "a@b.com", role: "learner" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(opts.body)).toEqual({ email: "a@b.com", password: "password123" });
  });
});

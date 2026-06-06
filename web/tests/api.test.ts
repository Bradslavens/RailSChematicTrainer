import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api, ApiError, setToken } from "../src/lib/api.js";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("returns parsed JSON on success", async () => {
    mockFetch(200, { hello: "world" });
    const data = await api.get<{ hello: string }>("/thing");
    expect(data.hello).toBe("world");
  });

  it("throws ApiError with the server message on failure", async () => {
    mockFetch(409, { error: "That email is already registered" });
    await expect(api.post("/auth/register", {})).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "That email is already registered",
    });
  });

  it("attaches the Authorization header when a token is stored", async () => {
    const fn = mockFetch(200, {});
    setToken("abc123");
    await api.get("/auth/me");
    const headers = fn.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer abc123");
  });

  it("omits Authorization when there is no token", async () => {
    const fn = mockFetch(200, {});
    await api.get("/auth/me");
    const headers = fn.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe("ApiError", () => {
  it("carries status and message", () => {
    const err = new ApiError(401, "nope");
    expect(err.status).toBe(401);
    expect(err.message).toBe("nope");
  });
});

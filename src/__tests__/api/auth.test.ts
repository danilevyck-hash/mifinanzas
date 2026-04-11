import { describe, it, expect, vi } from "vitest";

// Mock supabase-server before importing the route
vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: "not found" } }),
        }),
      }),
    }),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  createToken: () => "mock-token",
}));

describe("Auth API", () => {
  it("returns error when username is missing", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "test123" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("returns 401 for non-existent user", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({ username: "fake", password: "wrong" }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(401);
  });
});

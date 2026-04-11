import { describe, it, expect, vi } from "vitest";

// Mock supabase-server
vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: "mock error" } }),
        }),
      }),
    }),
  },
}));

// Mock session - return null (unauthorized)
vi.mock("@/lib/session", () => ({
  getAuthUserId: () => null,
}));

describe("Personal Expenses API", () => {
  it("returns 401 when not authenticated (POST)", async () => {
    const { POST } = await import("@/app/api/personal-expenses/route");

    const request = new Request("http://localhost/api/personal-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-01-01", amount: 50, category: "Comida" }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it("returns 401 when not authenticated (GET)", async () => {
    const { GET } = await import("@/app/api/personal-expenses/route");

    const request = new Request("http://localhost/api/personal-expenses", {
      method: "GET",
    });

    const response = await GET(request as never);
    expect(response.status).toBe(401);
  });
});

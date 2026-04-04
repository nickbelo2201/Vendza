import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, fetchAPI } from "../lib/api";

// Mock das dependências server-side
vi.mock("../utils/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mock-token-123" } },
      }),
    },
  }),
}));

describe("fetchAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz GET com Authorization header quando há sessão", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { ordersToday: 5 } }),
    } as Response);

    const result = await fetchAPI<{ ordersToday: number }>("/partner/dashboard/summary");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/partner/dashboard/summary"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token-123",
        }),
      }),
    );
    expect(result).toEqual({ ordersToday: 5 });
  });

  it("lança ApiError quando resposta não é ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    const erro = await fetchAPI("/partner/orders").catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect((erro as ApiError).status).toBe(401);
  });

  it("faz PATCH com body serializado", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    await fetchAPI("/partner/products/prod-1/availability", {
      method: "PATCH",
      body: { isAvailable: false },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/partner/products/prod-1/availability"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ isAvailable: false }),
      }),
    );
  });
});

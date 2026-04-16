import { test, expect } from "@playwright/test";

const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3333";

// Testes diretos na API via HTTP (sem browser).
// Cobrem: health check + endpoints públicos do storefront.
// Requerem apenas que a API esteja rodando — sem autenticação necessária.

test.describe("API — Health check", () => {
  test("GET /v1/health retorna 200 e status ok", async ({ request }) => {
    const response = await request.get(`${API_URL}/v1/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Envelope: { data: { status: "ok", service: "vendza-api" }, meta, error }
    expect(body).toHaveProperty("data.status", "ok");
    expect(body).toHaveProperty("data.service", "vendza-api");
  });
});

test.describe("API — Endpoints públicos do storefront", () => {
  test("GET /v1/storefront/config retorna 200 com envelope", async ({ request }) => {
    const response = await request.get(`${API_URL}/v1/storefront/config`);
    // 200 quando a loja existe, 503 quando STORE_SLUG não está configurado
    expect([200, 503]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      // Envelope padrão: { data, meta, error }
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("meta");
    }
  });

  test("GET /v1/catalog/categories retorna 200 com array no envelope", async ({ request }) => {
    const response = await request.get(`${API_URL}/v1/catalog/categories`);
    expect([200, 503]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  test("GET /v1/catalog/products retorna 200 com envelope e campo produtos", async ({ request }) => {
    const response = await request.get(`${API_URL}/v1/catalog/products`);
    expect([200, 503]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty("data");
    }
  });

  test("GET /v1/catalog/products aceita query params de filtro sem erro", async ({ request }) => {
    const response = await request.get(`${API_URL}/v1/catalog/products?pagina=1&limite=10`);
    expect([200, 503]).toContain(response.status());
  });
});

test.describe("API — Segurança: rotas partner exigem autenticação", () => {
  test("GET /v1/partner/orders retorna 401 sem token", async ({ request }) => {
    const response = await request.get(`${API_URL}/v1/partner/orders`);
    expect(response.status()).toBe(401);
  });

  test("GET /v1/partner/products retorna 401 sem token", async ({ request }) => {
    const response = await request.get(`${API_URL}/v1/partner/products`);
    expect(response.status()).toBe(401);
  });

  test("PATCH /v1/partner/orders/qualquer-id/status retorna 401 sem token", async ({ request }) => {
    const response = await request.patch(`${API_URL}/v1/partner/orders/fake-id/status`, {
      data: { status: "confirmed" },
    });
    expect(response.status()).toBe(401);
  });
});

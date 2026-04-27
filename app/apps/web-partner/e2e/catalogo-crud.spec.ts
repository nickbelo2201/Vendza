import { test, expect } from "@playwright/test";

const BASE_URL = "https://web-partner-three.vercel.app";

const ROTAS_CRUD = [
  { path: "/catalogo", label: "hub catálogo" },
  { path: "/catalogo/produtos", label: "produtos" },
  { path: "/catalogo/categorias", label: "categorias" },
  { path: "/catalogo/subcategorias", label: "subcategorias" },
  { path: "/catalogo/combos", label: "combos" },
  { path: "/catalogo/grupos-de-complementos", label: "grupos de complementos" },
  { path: "/catalogo/complementos", label: "complementos" },
  { path: "/catalogo/extras", label: "extras" },
];

test.describe("Catálogo CRUD — proteção de rotas (sem autenticação)", () => {
  for (const { path, label } of ROTAS_CRUD) {
    test(`rota ${path} (${label}) redireciona para /login`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, { timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 20000 });
      await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    });
  }

  test("nenhuma rota de catálogo retorna 404", async ({ page }) => {
    for (const { path } of ROTAS_CRUD) {
      await page.goto(`${BASE_URL}${path}`, { timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 });

      const bodyText = await page.locator("body").textContent({ timeout: 5000 });
      expect(bodyText).not.toMatch(/404|not found|página não encontrada/i);
    }
  });
});

test.describe("Catálogo CRUD — hub de navegação (autenticado)", () => {
  test.skip(!process.env.E2E_EMAIL, "Requer E2E_EMAIL e E2E_PASSWORD");

  test.beforeEach(async ({ page }) => {
    // Login programático via Supabase
    const supabaseUrl = process.env.E2E_SUPABASE_URL!;
    const supabaseKey = process.env.E2E_SUPABASE_ANON_KEY!;

    const res = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: supabaseKey, "Content-Type": "application/json" },
      data: { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD },
    });
    const { access_token } = await res.json();

    await page.goto(`${BASE_URL}/login`, { timeout: 20000 });
    await page.evaluate((token) => {
      localStorage.setItem("sb-access-token", token);
    }, access_token);
  });

  test("/catalogo exibe hub com 7 cards de navegação", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page).toHaveURL(/\/catalogo($|\?)/, { timeout: 20000 });

    const cards = page.locator("a[href*='/catalogo/']");
    await expect(cards).toHaveCount(7, { timeout: 10000 });

    for (const { path } of ROTAS_CRUD.filter((r) => r.path !== "/catalogo")) {
      await expect(page.locator(`a[href="${path}"]`)).toBeVisible({ timeout: 5000 });
    }
  });

  test("/catalogo/categorias lista categorias e exibe botão criar", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo/categorias`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page.locator("h1")).toContainText(/categorias/i, { timeout: 10000 });
    await expect(page.locator("button, a").filter({ hasText: /nova categoria/i })).toBeVisible({ timeout: 5000 });
  });

  test("/catalogo/subcategorias exibe página sem erros", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo/subcategorias`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page.locator("h1")).toContainText(/subcategorias/i, { timeout: 10000 });
    await expect(page.locator("button, a").filter({ hasText: /nova subcategoria/i })).toBeVisible({ timeout: 5000 });
  });

  test("/catalogo/combos exibe página e botão novo combo", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo/combos`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page.locator("h1")).toContainText(/combos/i, { timeout: 10000 });
    await expect(page.locator("button").filter({ hasText: /novo combo/i })).toBeVisible({ timeout: 5000 });
  });

  test("/catalogo/grupos-de-complementos exibe página sem erros", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo/grupos-de-complementos`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page.locator("h1")).toContainText(/grupos/i, { timeout: 10000 });
  });

  test("/catalogo/complementos exibe página sem erros", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo/complementos`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page.locator("h1")).toContainText(/complementos/i, { timeout: 10000 });
  });

  test("/catalogo/extras exibe página e botão novo extra", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo/extras`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page.locator("h1")).toContainText(/extras/i, { timeout: 10000 });
    await expect(page.locator("button").filter({ hasText: /novo extra/i })).toBeVisible({ timeout: 5000 });
  });

  test("breadcrumb 'Produtos' em todas as subpáginas aponta para /catalogo", async ({ page }) => {
    const subpaginas = ROTAS_CRUD.filter((r) => r.path !== "/catalogo" && r.path !== "/catalogo/produtos");

    for (const { path } of subpaginas) {
      await page.goto(`${BASE_URL}${path}`, { timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 });

      const breadcrumb = page.locator("a[href='/catalogo']").first();
      await expect(breadcrumb).toBeVisible({ timeout: 5000 });
    }
  });
});

import { test, expect } from "@playwright/test";

const BASE_URL = "https://web-partner-three.vercel.app";

// A rota /onboarding é protegida por autenticação via Supabase Auth + middleware.
// Sem sessão ativa, o middleware redireciona para /login.
// Estes testes verificam apenas que a rota existe e está protegida.
// Testes do wizard completo requerem credenciais reais (ver README.md).

test.describe("Flow 5 — Proteção da rota /onboarding", () => {
  test("/onboarding redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // O middleware Supabase SSR redireciona usuários não autenticados para /login
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("/onboarding não retorna 404 — a rota está registrada", async ({ page }) => {
    // Navega para /onboarding e aguarda o carregamento completo após o redirect
    await page.goto(`${BASE_URL}/onboarding`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // O middleware redireciona para /login. Se chegou aqui sem erro, a rota existe
    // e não retornou 404. Verificamos pela URL final que é /login.
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/login/);

    // Garante que não há mensagem de "404 Not Found" ou similar na página
    const bodyText = await page.locator("body").textContent({ timeout: 5000 });
    expect(bodyText).not.toMatch(/404|not found|página não encontrada/i);
  });
});

// ---------------------------------------------------------------------------
// TESTES FUTUROS (requerem autenticação real)
// ---------------------------------------------------------------------------
// Os testes abaixo são marcados como skip porque dependem de credenciais reais.
// Para habilitá-los, defina as variáveis de ambiente E2E_EMAIL e E2E_PASSWORD
// e remova os .skip().
//
// test.describe("Flow 6 — Wizard de onboarding (autenticado)", () => {
//   test.beforeEach(async ({ page }) => {
//     // Login programático via Supabase Auth API
//     // Redireciona para /onboarding se loja ainda não foi criada
//   });
//
//   test("exibe o wizard de setup inicial", async ({ page }) => { ... });
//   test("avança para o passo 2 ao preencher nome da loja", async ({ page }) => { ... });
//   test("finaliza o onboarding e redireciona para /", async ({ page }) => { ... });
// });

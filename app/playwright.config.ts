/**
 * Configuração Playwright raiz — Vendza Monorepo
 *
 * Orquestra os testes E2E do web-client (SOF-96) e web-partner (SOF-97).
 *
 * Uso:
 *   pnpm e2e                          # todos os testes
 *   pnpm e2e --project=web-client     # só storefront
 *   pnpm e2e --project=web-partner    # só painel do lojista
 *
 * Variáveis de ambiente:
 *   PLAYWRIGHT_BASE_URL         — URL do web-client (padrão: produção)
 *   PLAYWRIGHT_BASE_URL_PARTNER — URL do web-partner (padrão: produção)
 *   PARTNER_EMAIL               — credencial de teste para web-partner
 *   PARTNER_PASSWORD            — senha de teste para web-partner
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Diretório raiz dos testes — Playwright busca recursivamente
  testDir: "./apps",

  // Padrão de arquivos de teste (apenas os que estão dentro de pastas e2e/)
  testMatch: "**/e2e/**/*.spec.ts",

  // Execução paralela — cada teste é independente
  fullyParallel: true,

  // Em CI, não permite test.only acidental
  forbidOnly: !!process.env.CI,

  // 1 retry em CI para absorver flakiness de rede; nenhum em dev
  retries: process.env.CI ? 1 : 0,

  // Workers: 1 em CI para evitar race conditions; automático em dev
  workers: process.env.CI ? 1 : undefined,

  // Reporters: HTML para análise e line para terminal
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["line"],
  ],

  // Configurações globais compartilhadas entre projetos
  use: {
    // Timeout por ação (clique, fill, etc.)
    actionTimeout: 30000,

    // Timeout de navegação
    navigationTimeout: 30000,

    // Captura trace apenas no primeiro retry para diagnóstico
    trace: "on-first-retry",

    // Screenshot somente em falhas
    screenshot: "only-on-failure",
  },

  // Timeout por teste
  timeout: 30000,

  // Timeout dos assertions (expect)
  expect: {
    timeout: 10000,
  },

  // Projetos — um por app
  projects: [
    // ── web-client (storefront cliente) ──────────────────────────────────
    {
      name: "web-client",
      testDir: "./apps/web-client/e2e",
      use: {
        ...devices["Desktop Chrome"],
        baseURL:
          process.env.PLAYWRIGHT_BASE_URL ??
          "https://web-client-1v7y6yhv2-nickbelo2201s-projects.vercel.app",
      },
    },
    {
      name: "web-client-mobile",
      testDir: "./apps/web-client/e2e",
      use: {
        ...devices["Pixel 5"],
        baseURL:
          process.env.PLAYWRIGHT_BASE_URL ??
          "https://web-client-1v7y6yhv2-nickbelo2201s-projects.vercel.app",
      },
    },

    // ── web-partner (painel do lojista) ───────────────────────────────────
    {
      name: "web-partner",
      testDir: "./apps/web-partner/e2e",
      use: {
        ...devices["Desktop Chrome"],
        baseURL:
          process.env.PLAYWRIGHT_BASE_URL_PARTNER ??
          "https://web-partner-three.vercel.app",
      },
    },
  ],
});

import { test, expect } from "@playwright/test";

const BASE_URL = "https://web-partner-three.vercel.app";

// Testes de proteção das rotas do dashboard que não estão cobertas em auth.spec.ts.
// Rotas cobertas em auth.spec.ts: /, /pedidos, /catalogo, /clientes, /configuracoes, /relatorios
// Rotas cobertas aqui: /estoque, /financeiro, /pdv, /caixa

test.describe("Flow — Proteção de rotas do dashboard (sem autenticação)", () => {
  test("rota /estoque redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/estoque`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /financeiro redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/financeiro`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /pdv redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/pdv`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /caixa redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/caixa`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("nenhuma rota do dashboard retorna 404 — todas estão registradas", async ({ page }) => {
    const rotas = [
      "/estoque",
      "/financeiro",
      "/pdv",
      "/caixa",
    ];

    for (const rota of rotas) {
      await page.goto(`${BASE_URL}${rota}`, { timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 20000 });

      // O middleware redireciona para /login. Se chegou aqui sem erro, a rota existe.
      const finalUrl = page.url();
      expect(finalUrl).toMatch(/\/login/);

      const bodyText = await page.locator("body").textContent({ timeout: 5000 });
      expect(bodyText).not.toMatch(/404|not found|página não encontrada/i);
    }
  });
});

// ---------------------------------------------------------------------------
// TESTES AUTENTICADOS (requerem E2E_EMAIL e E2E_PASSWORD)
// ---------------------------------------------------------------------------
// Para habilitar, defina as variáveis de ambiente E2E_EMAIL e E2E_PASSWORD
// e remova os test.skip. O padrão de login programático via Supabase:
//
//   const supabaseUrl = process.env.E2E_SUPABASE_URL!;
//   const supabaseKey = process.env.E2E_SUPABASE_ANON_KEY!;
//   const supabase = createClient(supabaseUrl, supabaseKey);
//   const { data } = await supabase.auth.signInWithPassword({
//     email: process.env.E2E_EMAIL!,
//     password: process.env.E2E_PASSWORD!,
//   });
//   // Injetar o token na sessão do browser via localStorage/cookie

test.describe("Flow — Lojista: mudar status de pedido (autenticado)", () => {
  test.skip(!process.env.E2E_EMAIL, "Requer E2E_EMAIL e E2E_PASSWORD");

  test("lojista faz login e vê o dashboard com pedidos", async ({ page }) => {
    // TODO: implementar login programático via Supabase Auth API
    // e verificar que o dashboard exibe a lista de pedidos com status correto
  });

  test("lojista muda status de pedido de 'pending' para 'confirmed'", async ({ page }) => {
    // TODO: implementar login + navegar para /pedidos + selecionar pedido
    // + confirmar mudança de status via UI
  });

  test("mudança de status reflete imediatamente na lista de pedidos", async ({ page }) => {
    // TODO: verificar que a UI atualiza sem precisar de refresh manual
  });
});

test.describe("Flow — Lojista: criar produto e ver na vitrine (autenticado)", () => {
  test.skip(!process.env.E2E_EMAIL, "Requer E2E_EMAIL e E2E_PASSWORD");

  test("lojista cria um produto novo no catálogo", async ({ page }) => {
    // TODO: login + navegar para /catalogo + abrir modal de novo produto
    // + preencher dados + salvar
  });

  test("produto criado aparece na vitrine do cliente", async ({ page }) => {
    // TODO: após criar o produto, navegar para a URL do web-client
    // e verificar que o produto está listado no catálogo público
  });
});

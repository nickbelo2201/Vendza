import { test, expect } from "@playwright/test";

/**
 * Testes do fluxo de carrinho (SOF-38)
 *
 * Cobre: adicionar itens, alterar quantidade, remover item, verificar total,
 * e a interação com o CartSheet (painel lateral de carrinho).
 */

const CONFIG_MOCK = {
  data: {
    id: "store-1",
    branding: { name: "Adega Teste", slug: "adega-teste", logoUrl: null },
    status: "open",
    minimumOrderValueCents: 2000,
    whatsappPhone: "5511999999999",
  },
  meta: { requestedAt: new Date().toISOString(), stub: false },
  error: null,
};

const PRODUTOS_MOCK = {
  data: [
    {
      id: "prod-1",
      name: "Heineken 600ml",
      slug: "heineken-600ml",
      imageUrl: null,
      listPriceCents: 1490,
      salePriceCents: null,
      isFeatured: false,
      offer: false,
      category: { id: "cat-1", name: "Cervejas", slug: "cervejas" },
    },
    {
      id: "prod-2",
      name: "Vinho Tinto Reserva",
      slug: "vinho-tinto-reserva",
      imageUrl: null,
      listPriceCents: 5990,
      salePriceCents: 4990,
      isFeatured: false,
      offer: true,
      category: { id: "cat-2", name: "Vinhos", slug: "vinhos" },
    },
  ],
  meta: { requestedAt: new Date().toISOString(), stub: false },
  error: null,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/v1/storefront/config", (route) =>
    route.fulfill({ json: CONFIG_MOCK })
  );
  await page.route("**/v1/catalog/categories", (route) =>
    route.fulfill({
      json: {
        data: [],
        meta: { requestedAt: new Date().toISOString(), stub: false },
        error: null,
      },
    })
  );
  await page.route("**/v1/catalog/products**", (route) =>
    route.fulfill({ json: PRODUTOS_MOCK })
  );

  // Limpa carrinho e ignora age gate a cada teste
  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
    localStorage.removeItem("vendza_carrinho");
  });
});

test("badge do carrinho inicia em zero na página inicial", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Badge deve estar invisível quando totalItens = 0
  const badge = page.locator(".wc-cart-badge");
  await expect(badge).not.toBeVisible();
});

test("adicionar produto ao carrinho exibe badge com quantidade 1", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();

  const badge = page.locator(".wc-cart-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText("1");
});

test("adicionar o mesmo produto duas vezes incrementa a quantidade para 2", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const botaoAdicionar = page.locator(".wc-product-card").first().locator(".wc-btn-cta");
  await botaoAdicionar.click();
  await botaoAdicionar.click();

  await expect(page.locator(".wc-cart-badge")).toHaveText("2");
});

test("adicionar dois produtos diferentes incrementa badge para 2", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const cards = page.locator(".wc-product-card");
  await cards.nth(0).locator(".wc-btn-cta").click();
  await cards.nth(1).locator(".wc-btn-cta").click();

  await expect(page.locator(".wc-cart-badge")).toHaveText("2");
});

test("clicar no botão do carrinho abre o painel lateral (CartSheet)", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Adiciona produto para ter itens no carrinho
  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();

  // Abre o carrinho
  await page.locator(".wc-cart-btn").click();

  await expect(page.locator(".wc-cart-panel")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Carrinho" })).toBeVisible();
});

test("painel do carrinho mostra item adicionado com nome e preço unitário", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await page.locator(".wc-cart-btn").click();

  const panel = page.locator(".wc-cart-panel");
  await expect(panel).toContainText("Heineken 600ml");
  // Preço unitário formatado em R$
  await expect(panel).toContainText("R$");
});

test("painel do carrinho exibe subtotal correto para 1 item", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await page.locator(".wc-cart-btn").click();

  // Subtotal = R$ 14,90
  const panel = page.locator(".wc-cart-panel");
  await expect(panel).toContainText("14,90");
});

test("incrementar quantidade no painel atualiza badge do header", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await page.locator(".wc-cart-btn").click();

  // Clica no botão "+" dentro do painel
  const botaoMais = page
    .locator(".wc-cart-panel")
    .getByRole("button")
    .filter({ hasText: "+" });
  await botaoMais.click();

  await expect(page.locator(".wc-cart-badge")).toHaveText("2");
});

test("decrementar quantidade para zero remove o item do carrinho", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await page.locator(".wc-cart-btn").click();

  // Clica no botão "−" para reduzir para 0 (remove o item)
  const botaoMenos = page
    .locator(".wc-cart-panel")
    .getByRole("button")
    .filter({ hasText: "−" });
  await botaoMenos.click();

  // Carrinho deve ficar vazio
  await expect(page.locator(".wc-cart-panel")).toContainText("Seu carrinho está vazio.");
  await expect(page.locator(".wc-cart-badge")).not.toBeVisible();
});

test("botão × remove o item diretamente do painel", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await page.locator(".wc-cart-btn").click();

  // O botão × de remoção dentro de cada item do painel
  // Identifica pelo contexto do item (não o × de fechar o painel)
  const itemCarrinho = page.locator(".wc-stack > div").filter({ hasText: "Heineken" });
  const botaoRemover = itemCarrinho.getByRole("button").last();
  await botaoRemover.click();

  await expect(page.locator(".wc-cart-panel")).toContainText("Seu carrinho está vazio.");
});

test("subtotal é calculado corretamente para múltiplos itens e quantidades", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Adiciona Heineken × 2 (2 × R$14,90 = R$29,80)
  const botaoHeineken = page.locator(".wc-product-card").first().locator(".wc-btn-cta");
  await botaoHeineken.click();
  await botaoHeineken.click();

  // Abre o painel
  await page.locator(".wc-cart-btn").click();
  const panel = page.locator(".wc-cart-panel");

  // Subtotal deve ser R$ 29,80
  await expect(panel).toContainText("29,80");
});

test("botão 'Ir para checkout' no painel navega para /checkout", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await page.locator(".wc-cart-btn").click();

  const linkCheckout = page.locator(".wc-cart-panel").getByRole("link", { name: "Ir para checkout" });
  await expect(linkCheckout).toHaveAttribute("href", "/checkout");
});

test("clicar fora do painel (overlay) fecha o carrinho", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await page.locator(".wc-cart-btn").click();

  await expect(page.locator(".wc-cart-panel")).toBeVisible();

  // Clica no overlay para fechar
  await page.locator(".wc-cart-overlay").click();

  await expect(page.locator(".wc-cart-panel")).not.toBeVisible();
});

test("painel vazio exibe mensagem de carrinho vazio", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Abre o carrinho sem adicionar produto
  await page.locator(".wc-cart-btn").click();

  await expect(page.locator(".wc-cart-panel")).toContainText("Seu carrinho está vazio.");
});

test("carrinho é persistido no localStorage após adicionar item", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();

  // Verifica que o localStorage foi atualizado
  const carrinhoSalvo = await page.evaluate(() =>
    localStorage.getItem("vendza_carrinho")
  );
  expect(carrinhoSalvo).not.toBeNull();

  const itens = JSON.parse(carrinhoSalvo!);
  expect(itens).toHaveLength(1);
  expect(itens[0].name).toBe("Heineken 600ml");
});

test("carrinho é restaurado do localStorage ao recarregar a página", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Adiciona produto
  await page.locator(".wc-product-card").first().locator(".wc-btn-cta").click();
  await expect(page.locator(".wc-cart-badge")).toHaveText("1");

  // Recarrega a página
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Badge deve ainda mostrar 1
  await expect(page.locator(".wc-cart-badge")).toHaveText("1");
});

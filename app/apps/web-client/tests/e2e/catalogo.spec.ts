import { test, expect } from "@playwright/test";

/**
 * Testes do fluxo de catálogo (SOF-38)
 *
 * Estes testes mockam as chamadas de API para rodar sem servidor.
 * O mock intercepta /v1/storefront/config, /v1/catalog/categories e /v1/catalog/products.
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

const CATEGORIAS_MOCK = {
  data: [
    { id: "cat-1", name: "Cervejas", slug: "cervejas" },
    { id: "cat-2", name: "Vinhos", slug: "vinhos" },
  ],
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
      isFeatured: true,
      offer: true,
      category: { id: "cat-2", name: "Vinhos", slug: "vinhos" },
    },
  ],
  meta: { requestedAt: new Date().toISOString(), stub: false },
  error: null,
};

test.beforeEach(async ({ page }) => {
  // Intercepta todas as chamadas de API para rodar offline
  await page.route("**/v1/storefront/config", (route) =>
    route.fulfill({ json: CONFIG_MOCK })
  );
  await page.route("**/v1/catalog/categories", (route) =>
    route.fulfill({ json: CATEGORIAS_MOCK })
  );
  await page.route("**/v1/catalog/products**", (route) =>
    route.fulfill({ json: PRODUTOS_MOCK })
  );

  // Ignora a verificação de idade — assume usuário já verificado
  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
  });
});

test("página inicial carrega sem erros críticos de console", async ({ page }) => {
  const errosCriticos: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errosCriticos.push(msg.text());
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Erros de rede de recursos estáticos (imagens) são ignorados — só captura erros JS
  const errosJS = errosCriticos.filter(
    (e) =>
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR") &&
      !e.includes("favicon")
  );
  expect(errosJS).toHaveLength(0);
});

test("exibe produtos na grade ao carregar a página inicial", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Verifica que os cards de produto aparecem
  const cards = page.locator(".wc-product-card");
  await expect(cards).toHaveCount(2);
});

test("cada card de produto exibe nome e preço", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Primeiro produto
  const primeiroCard = page.locator(".wc-product-card").first();
  await expect(primeiroCard.locator(".wc-product-name")).toContainText("Heineken 600ml");
  await expect(primeiroCard.locator(".wc-price-now")).toBeVisible();
});

test("cada card de produto tem botão de adicionar ao carrinho", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const botaoAdicionar = page.locator(".wc-product-card").first().locator(".wc-btn-cta");
  await expect(botaoAdicionar).toBeVisible();
  await expect(botaoAdicionar).toContainText("Adicionar");
});

test("exibe badge de desconto em produto com oferta", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // O segundo produto (Vinho Tinto) tem offer: true e salePriceCents definido
  const segundoCard = page.locator(".wc-product-card").nth(1);
  await expect(segundoCard.locator(".wc-badge-discount")).toBeVisible();
});

test("exibe badge 'Novo' em produto isFeatured", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // O segundo produto tem isFeatured: true
  const segundoCard = page.locator(".wc-product-card").nth(1);
  await expect(segundoCard.locator(".wc-badge-new")).toContainText("Novo");
});

test("carrossel de categorias estáticas está visível", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Carrossel de categorias com o botão "Todos"
  const carrossel = page.locator(".wc-category-carousel");
  await expect(carrossel).toBeVisible();

  // Botão "Todos" deve estar presente e ativo por padrão
  const botaoTodos = carrossel.locator(".wc-cat-item--active");
  await expect(botaoTodos).toContainText("Todos");
});

test("chips de subcategoria da API aparecem abaixo do carrossel", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const chips = page.locator(".wc-subcategory-chip");
  // Deve ter "Todos" + 2 categorias do mock
  await expect(chips).toHaveCount(3);
});

test("filtrar por categoria exibe apenas produtos dessa categoria", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Clica no chip "Cervejas"
  const chipCervejas = page.locator(".wc-subcategory-chip", { hasText: "Cervejas" });
  await chipCervejas.click();

  // Apenas a Heineken deve aparecer
  const cards = page.locator(".wc-product-card");
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator(".wc-product-name")).toContainText("Heineken 600ml");
});

test("clicar em 'Todos' após filtrar mostra todos os produtos novamente", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Filtra por Vinhos primeiro
  await page.locator(".wc-subcategory-chip", { hasText: "Vinhos" }).click();
  await expect(page.locator(".wc-product-card")).toHaveCount(1);

  // Clica em "Todos"
  await page.locator(".wc-subcategory-chip", { hasText: "Todos" }).first().click();
  await expect(page.locator(".wc-product-card")).toHaveCount(2);
});

test("mensagem de vazio aparece quando nenhum produto é encontrado na categoria", async ({ page }) => {
  // Retorna lista vazia de produtos
  await page.route("**/v1/catalog/products**", (route) =>
    route.fulfill({
      json: {
        data: [],
        meta: { requestedAt: new Date().toISOString(), stub: false },
        error: null,
      },
    })
  );

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Nenhum produto nesta categoria")).toBeVisible();
});

test("barra de pesquisa está visível no header", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const inputBusca = page.locator(".wc-search-input");
  await expect(inputBusca).toBeVisible();
  await expect(inputBusca).toHaveAttribute("placeholder", "Pesquise produtos");
});

test("produto com termo de busca sem resultado exibe link para limpar busca", async ({ page }) => {
  // Simula produtos retornados como vazio para uma busca
  await page.route("**/v1/catalog/products**", (route) =>
    route.fulfill({
      json: {
        data: [],
        meta: { requestedAt: new Date().toISOString(), stub: false },
        error: null,
      },
    })
  );

  await page.goto("/?busca=inexistente");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText(/Nenhum produto encontrado para/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Limpar busca" })).toBeVisible();
});

test("loja fechada exibe aviso ao cliente", async ({ page }) => {
  // Sobrescreve config com status fechado
  await page.route("**/v1/storefront/config", (route) =>
    route.fulfill({
      json: {
        data: {
          ...CONFIG_MOCK.data,
          status: "closed",
        },
        meta: { requestedAt: new Date().toISOString(), stub: false },
        error: null,
      },
    })
  );

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("A loja está temporariamente fechada.")).toBeVisible();
});

test("age gate aparece quando usuário não confirmou a idade", async ({ page }) => {
  // Remove o localStorage de verificação de idade
  await page.addInitScript(() => {
    localStorage.removeItem("vendza_age_verified");
  });

  await page.goto("/");

  // O modal de verificação de idade deve aparecer
  await expect(page.locator(".wc-agegate-overlay")).toBeVisible();
  await expect(page.getByText("Você tem 18 anos ou mais?")).toBeVisible();
});

test("confirmar age gate oculta o modal", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("vendza_age_verified");
  });

  await page.goto("/");

  const botaoSim = page.getByRole("button", { name: /Sim, tenho 18 anos/ });
  await botaoSim.click();

  await expect(page.locator(".wc-agegate-overlay")).not.toBeVisible();
});

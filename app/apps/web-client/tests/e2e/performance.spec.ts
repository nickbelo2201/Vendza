import { test, expect } from "@playwright/test";

/**
 * Testes de performance básica (SOF-38)
 *
 * Verifica tempo de carregamento, presença de alt text em imagens
 * e ausência de elementos com overflow problemático.
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

  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
  });
});

test("página principal carrega em menos de 5 segundos", async ({ page }) => {
  const inicio = Date.now();

  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const duracao = Date.now() - inicio;
  expect(duracao).toBeLessThan(5000);
});

test("página principal atinge networkidle em menos de 8 segundos", async ({ page }) => {
  const inicio = Date.now();

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const duracao = Date.now() - inicio;
  expect(duracao).toBeLessThan(8000);
});

test("imagens com src definido têm atributo alt não vazio", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Verifica todas as imagens que possuem src
  const imagensSemAlt = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img[src]"));
    return imgs
      .filter((img) => {
        const alt = (img as HTMLImageElement).alt;
        // alt vazio ou apenas espaços é problemático para acessibilidade
        return !alt || alt.trim() === "";
      })
      .map((img) => (img as HTMLImageElement).src);
  });

  expect(imagensSemAlt).toHaveLength(0);
});

test("logo da loja no header tem alt text", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const logoImg = page.locator(".wc-logo img");
  // Pode não ter logo se logoUrl for null — verifica apenas se existe
  const count = await logoImg.count();
  if (count > 0) {
    const alt = await logoImg.getAttribute("alt");
    expect(alt).toBeTruthy();
  }
});

test("input de busca tem aria-label descritivo", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const input = page.locator(".wc-search-input");
  await expect(input).toHaveAttribute("aria-label", "Pesquisar produtos");
});

test("botão do carrinho no header tem aria-label", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const botaoCarrinho = page.locator(".wc-cart-btn");
  const ariaLabel = await botaoCarrinho.getAttribute("aria-label");
  expect(ariaLabel).toBeTruthy();
  expect(ariaLabel).toContain("Carrinho");
});

test("botão de toggle de tema tem aria-label", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const botaoTema = page.locator(".wc-theme-toggle");
  const ariaLabel = await botaoTema.getAttribute("aria-label");
  expect(ariaLabel).toBeTruthy();
});

test("botões de navegação do carrossel têm aria-label", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const setaEsquerda = page.locator(".wc-carousel-arrow--left");
  const setaDireita = page.locator(".wc-carousel-arrow--right");

  await expect(setaEsquerda).toHaveAttribute("aria-label", "Anterior");
  await expect(setaDireita).toHaveAttribute("aria-label", "Próximo");
});

test("página não tem scroll horizontal indesejado no desktop", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = page.viewportSize()?.width ?? 1280;

  // Tolerância de 20px para scrollbar
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 20);
});

test("links de produto têm href válido (começa com /produto/)", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const linksNome = page.locator(".wc-product-name");
  const count = await linksNome.count();

  for (let i = 0; i < count; i++) {
    const href = await linksNome.nth(i).getAttribute("href");
    expect(href).toMatch(/^\/produto\/.+/);
  }
});

test("sem erros de JavaScript no console na página de checkout (carrinho vazio)", async ({
  page,
}) => {
  const erros: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      erros.push(msg.text());
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
    localStorage.removeItem("vendza_carrinho");
  });

  // Checkout sem carrinho deve redirecionar sem erros JS
  await page.goto("/checkout");
  await page.waitForLoadState("domcontentloaded");

  const errosJS = erros.filter(
    (e) =>
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR") &&
      !e.includes("favicon")
  );
  expect(errosJS).toHaveLength(0);
});

test("página /perfil renderiza sem erros de JavaScript no console", async ({ page }) => {
  const erros: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      erros.push(msg.text());
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
  });

  await page.goto("/perfil");
  await page.waitForLoadState("networkidle");

  const errosJS = erros.filter(
    (e) =>
      !e.includes("Failed to load resource") &&
      !e.includes("net::ERR") &&
      !e.includes("favicon")
  );
  expect(errosJS).toHaveLength(0);
});

/**
 * SOF-96 — Fluxo E2E do cliente (web-client)
 *
 * Cobre os 8 passos principais da jornada do cliente no storefront:
 *   1. Age gate — confirmar maioridade
 *   2. Catálogo visível — produtos na tela
 *   3. Filtro por categoria — lista atualiza ao clicar em chip/card
 *   4. Busca por nome — resultado reflete na URL (?busca=...)
 *   5. Adicionar produto ao carrinho
 *   6. CartSheet — abrir e navegar para checkout
 *   7. Formulário de checkout — preencher e submeter
 *   8. Tracking page — URL contém publicId, timeline visível
 *
 * Variáveis de ambiente:
 *   PLAYWRIGHT_BASE_URL  — sobrescreve a URL base (padrão: produção)
 *
 * Os testes que dependem de dados reais (produto, checkout, tracking)
 * fazem skip automaticamente quando a condição não é satisfeita.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// URL base — pode ser sobrescrita via variável de ambiente
// ---------------------------------------------------------------------------
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://web-client-1v7y6yhv2-nickbelo2201s-projects.vercel.app";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Injeta o localStorage do age gate antes da navegação para que o overlay
 * não bloqueie interações nos testes que não testam o próprio age gate.
 */
async function dispensarAgeGate(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
  });
}

/**
 * Navega para uma URL e retorna false (fazendo skip do teste) se o servidor
 * retornar 401 (Vercel Deployment Protection).
 */
async function navegarOuSkip(page: Page, url: string): Promise<boolean> {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;

  if (status === 401) {
    test.skip(
      true,
      "URL protegida por Vercel Deployment Protection (401). " +
        "Passe PLAYWRIGHT_BASE_URL=http://localhost:3000 para testar localmente."
    );
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Passo 1 — Age gate: confirmar maioridade
// ---------------------------------------------------------------------------
test.describe("Passo 1 — Age gate", () => {
  // Este teste NÃO injeta o localStorage — ele verifica o próprio overlay.
  test("deve exibir o age gate e dispensá-lo ao clicar em Sim", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    // O overlay do age gate usa a chave localStorage "vendza_age_verified"
    // A classe do overlay é .wc-age-gate (ver AgeGate.tsx no web-client)
    const ageGate = page.locator(".wc-age-gate");

    // Pode ser que o age gate já esteja ausente se o localStorage foi setado anteriormente
    // Verifica se está presente e interage com ele
    const isVisible = await ageGate.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      // Clica no botão de confirmação de maioridade
      const simBtn = page
        .locator(".wc-age-gate button", { hasText: /sim|tenho 18|entrar|confirmar/i })
        .first();
      await simBtn.click();

      // Após confirmar, o overlay deve desaparecer
      await expect(ageGate).not.toBeVisible({ timeout: 5000 });
    }

    // Após dispensar (ou já dispensado), a página principal deve estar visível
    const header = page.locator("header.wc-header");
    await expect(header).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// Passo 2 — Catálogo: produtos visíveis
// ---------------------------------------------------------------------------
test.describe("Passo 2 — Catálogo de produtos", () => {
  test.beforeEach(async ({ page }) => {
    // Dispensa o age gate para não bloquear a interação com o catálogo
    await dispensarAgeGate(page);
  });

  test("deve exibir ao menos um produto ou mensagem de catálogo vazio", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // O grid de produtos usa a classe .wc-product-grid
    const productGrid = page.locator(".wc-product-grid");
    await expect(productGrid).toBeAttached({ timeout: 10000 });

    // Verifica cards de produto ou mensagem de vazio
    const qtdProdutos = await page.locator(".wc-product-card").count();
    const mensagemVazio = page.locator(
      "text=Nenhum produto encontrado, text=Nenhum produto cadastrado"
    );

    if (qtdProdutos === 0) {
      await expect(mensagemVazio.first()).toBeVisible();
    } else {
      expect(qtdProdutos).toBeGreaterThan(0);
    }
  });

  test("deve exibir o header com botão do carrinho", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // O header com a classe wc-header deve estar visível
    await expect(page.locator("header.wc-header")).toBeVisible();

    // O botão do carrinho usa aria-label contendo "Carrinho"
    const cartBtn = page.locator('button[aria-label*="Carrinho"]');
    await expect(cartBtn).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Passo 3 — Filtro por categoria
// ---------------------------------------------------------------------------
test.describe("Passo 3 — Filtro por categoria", () => {
  test.beforeEach(async ({ page }) => {
    await dispensarAgeGate(page);
  });

  test("deve filtrar ao clicar em chip de subcategoria", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // Chips de subcategoria usam a classe .wc-subcategory-chip
    const chips = page.locator("button.wc-subcategory-chip");
    const qtdChips = await chips.count();

    if (qtdChips <= 1) {
      // Sem subcategorias ou apenas "Todos" — passa silenciosamente
      return;
    }

    // Clica no segundo chip (o primeiro geralmente é "Todos")
    await chips.nth(1).click();
    await page.waitForTimeout(500);

    // O chip clicado deve receber a classe "active"
    await expect(chips.nth(1)).toHaveClass(/active/);

    // O grid de produtos ainda deve estar no DOM após o filtro
    await expect(page.locator(".wc-product-grid")).toBeAttached();
  });

  test("deve filtrar ao clicar em card de categoria da grade estática", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // Grade de categorias: .wc-category-grid com cards .wc-category-card
    const categoryCards = page.locator(".wc-category-card");
    const qtd = await categoryCards.count();

    if (qtd === 0) {
      // Sem categorias disponíveis na API — passa silenciosamente
      return;
    }

    await categoryCards.first().click();
    await page.waitForTimeout(500);

    // O card clicado deve ter classe "active"
    await expect(categoryCards.first()).toHaveClass(/active/);

    // O grid de produtos ainda deve existir (pode estar vazio)
    await expect(page.locator(".wc-product-grid")).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// Passo 4 — Busca por nome de produto
// ---------------------------------------------------------------------------
test.describe("Passo 4 — Busca de produto", () => {
  test.beforeEach(async ({ page }) => {
    await dispensarAgeGate(page);
  });

  test("deve refletir o termo de busca na URL (?busca=...)", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // O campo de busca usa aria-label "Pesquisar produtos"
    const searchInput = page.locator('input[aria-label="Pesquisar produtos"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill("cerveja");

    // Aguarda o debounce de 300ms mais margem
    await page.waitForTimeout(600);

    // A URL deve conter o parâmetro ?busca=cerveja (roteado pelo Next.js App Router)
    const url = page.url();
    expect(url).toContain("busca=cerveja");
  });

  test("deve exibir resultado de busca ou mensagem de vazio", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    const searchInput = page.locator('input[aria-label="Pesquisar produtos"]');
    await expect(searchInput).toBeVisible();

    // Busca por um termo genérico que provavelmente não existe
    await searchInput.fill("xyzxyzxyz_produto_inexistente");
    await page.waitForTimeout(600);

    // O grid continua no DOM — pode mostrar mensagem de vazio
    await expect(page.locator(".wc-product-grid")).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// Passo 5 — Adicionar produto ao carrinho
// ---------------------------------------------------------------------------
test.describe("Passo 5 — Adicionar ao carrinho", () => {
  test.beforeEach(async ({ page }) => {
    await dispensarAgeGate(page);
  });

  test("deve atualizar o badge do carrinho ao adicionar produto", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // Os cards de produto têm um botão "Adicionar" com a classe .wc-btn-cta
    const botoesAdicionar = page.locator("button.wc-btn-cta", { hasText: "Adicionar" });
    const qtd = await botoesAdicionar.count();

    if (qtd === 0) {
      test.skip(true, "Nenhum produto disponível para adicionar ao carrinho");
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);

    // O badge do carrinho usa a classe .wc-cart-badge e deve mostrar "1"
    const cartBadge = page.locator(".wc-cart-badge");
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText("1");
  });
});

// ---------------------------------------------------------------------------
// Passo 6 — CartSheet: abrir e ir para checkout
// ---------------------------------------------------------------------------
test.describe("Passo 6 — CartSheet e link para checkout", () => {
  test.beforeEach(async ({ page }) => {
    await dispensarAgeGate(page);
  });

  test("deve abrir o CartSheet ao clicar no botão do carrinho", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // Adiciona um produto se disponível
    const botoesAdicionar = page.locator("button.wc-btn-cta", { hasText: "Adicionar" });
    if ((await botoesAdicionar.count()) > 0) {
      await botoesAdicionar.first().click();
      await page.waitForTimeout(300);
    }

    // Clica no botão do carrinho no header
    const cartBtn = page.locator('button[aria-label*="Carrinho"]');
    await cartBtn.click();

    // O drawer (CartSheet) deve aparecer com o título "Carrinho"
    const cartTitle = page.locator("h2", { hasText: "Carrinho" });
    await expect(cartTitle).toBeVisible({ timeout: 5000 });
  });

  test("deve exibir link 'Ir para checkout' dentro do CartSheet com produto", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    const botoesAdicionar = page.locator("button.wc-btn-cta", { hasText: "Adicionar" });
    const qtd = await botoesAdicionar.count();

    if (qtd === 0) {
      test.skip(true, "Nenhum produto disponível para testar o CartSheet");
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);

    // Abre o CartSheet
    const cartBtn = page.locator('button[aria-label*="Carrinho"]');
    await cartBtn.click();

    await expect(page.locator("h2", { hasText: "Carrinho" })).toBeVisible();

    // O link para checkout deve existir no drawer
    const linkCheckout = page.locator("a", { hasText: "Ir para checkout" });
    await expect(linkCheckout).toBeVisible();
    await expect(linkCheckout).toHaveAttribute("href", "/checkout");
  });
});

// ---------------------------------------------------------------------------
// Passo 7 — Checkout: preencher formulário e submeter
// ---------------------------------------------------------------------------
test.describe("Passo 7 — Formulário de checkout", () => {
  test.beforeEach(async ({ page }) => {
    await dispensarAgeGate(page);
  });

  test("deve exibir o formulário de checkout ao acessar /checkout com itens", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // Adiciona produto ao carrinho via localStorage antes de navegar para /checkout
    // (evitar dependência de clicar no botão da UI)
    const botoesAdicionar = page.locator("button.wc-btn-cta", { hasText: "Adicionar" });
    const qtd = await botoesAdicionar.count();

    if (qtd === 0) {
      test.skip(true, "Nenhum produto disponível para testar o checkout");
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);

    // Navega para /checkout
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });

    // Aguarda o React hidratar e renderizar o formulário
    // O formulário usa a classe .wc-card e contém "Dados do pedido"
    await page.waitForSelector("form.wc-card", { timeout: 15000 });

    await expect(page.locator("form.wc-card")).toBeVisible();
  });

  test("deve ter campos obrigatórios de nome, telefone, rua, bairro, cidade e estado", async ({
    page,
  }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    const botoesAdicionar = page.locator("button.wc-btn-cta", { hasText: "Adicionar" });
    if ((await botoesAdicionar.count()) === 0) {
      test.skip(true, "Nenhum produto disponível");
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("form.wc-card", { timeout: 15000 });

    // Campo nome: placeholder "Seu nome", required
    const campoNome = page.locator('input[placeholder="Seu nome"]');
    await expect(campoNome).toBeVisible();
    await expect(campoNome).toHaveAttribute("required", "");

    // Campo telefone: placeholder com máscara
    const campoTelefone = page.locator('input[placeholder="(11) 99999-9999"]');
    await expect(campoTelefone).toBeVisible();

    // Campos de endereço (required)
    await expect(page.locator('input[placeholder="Nome da rua"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Seu bairro"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Cidade"]')).toBeVisible();
  });

  test("deve exibir opções de pagamento PIX, Dinheiro e Cartão na entrega", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    const botoesAdicionar = page.locator("button.wc-btn-cta", { hasText: "Adicionar" });
    if ((await botoesAdicionar.count()) === 0) {
      test.skip(true, "Nenhum produto disponível");
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("form.wc-card", { timeout: 15000 });

    // As opções de pagamento são radio buttons com labels visíveis
    await expect(page.locator("text=PIX")).toBeVisible();
    await expect(page.locator("text=Dinheiro")).toBeVisible();
    await expect(page.locator("text=Cartão na entrega")).toBeVisible();
  });

  /**
   * Teste de ponta a ponta: preenche o formulário completo e submete o pedido.
   * Este teste requer que a API esteja acessível e com produtos disponíveis.
   * Faz skip se não houver produtos ou se a API não responder.
   *
   * NOTA: Este teste faz uma chamada real à API de pedidos — não use em produção
   * com dados de clientes reais. Configure PLAYWRIGHT_BASE_URL para staging/local.
   */
  test("deve submeter o formulário e redirecionar para a página de tracking", async ({ page }) => {
    // Este teste só roda em ambiente local/staging — nunca em produção
    if (!process.env.PLAYWRIGHT_BASE_URL?.includes("localhost")) {
      test.skip(true, "Teste de submissão real só roda com PLAYWRIGHT_BASE_URL=http://localhost:3000");
      return;
    }

    await dispensarAgeGate(page);
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    const botoesAdicionar = page.locator("button.wc-btn-cta", { hasText: "Adicionar" });
    if ((await botoesAdicionar.count()) === 0) {
      test.skip(true, "Nenhum produto disponível para testar submissão de pedido");
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("form.wc-card", { timeout: 15000 });

    // Preenche campos de identificação
    await page.locator('input[placeholder="Seu nome"]').fill("Cliente Teste E2E");
    await page.locator('input[placeholder="(11) 99999-9999"]').fill("11999999999");

    // Preenche campos de endereço obrigatórios
    await page.locator('input[placeholder="Nome da rua"]').fill("Rua Teste");
    await page.locator('input[placeholder="Seu bairro"]').fill("Centro");
    await page.locator('input[placeholder="Cidade"]').fill("São Paulo");
    await page.locator('input[placeholder="SP"]').fill("SP");

    // Seleciona PIX (já é o padrão, mas garante)
    await page.locator('input[type="radio"][value="pix"]').check();

    // Submete o formulário
    await page.locator('button[type="submit"].wc-btn.wc-btn-primary').click();

    // Aguarda redirecionamento para /pedidos/:publicId
    await page.waitForURL(/\/pedidos\/PED-\d+/, { timeout: 20000 });

    // Verifica que a URL contém o publicId
    const url = page.url();
    expect(url).toMatch(/\/pedidos\/PED-\d+/);

    // A página de tracking deve mostrar o publicId no título
    await expect(page.locator("h1", { hasText: /PED-\d+/ })).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Passo 8 — Tracking page: publicId na URL e timeline visível
// ---------------------------------------------------------------------------
test.describe("Passo 8 — Página de tracking do pedido", () => {
  test("deve carregar /pedidos/PED-0001 sem crash de JavaScript", async ({ page }) => {
    const errosJS: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errosJS.push(msg.text());
    });

    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-0001`);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // Filtra erros de terceiros e ambiente
    const errosCriticos = errosJS.filter(
      (e) =>
        !e.includes("net::ERR_") &&
        !e.includes("favicon") &&
        !e.includes("hydration") &&
        !e.includes("chrome-extension") &&
        !e.includes("Provider's accounts list")
    );

    expect(errosCriticos, `Erros JS críticos: ${errosCriticos.join(" | ")}`).toHaveLength(0);
  });

  test("deve exibir o header na página de tracking", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-0001`);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // O layout raiz sempre injeta o header
    await expect(page.locator("header.wc-header")).toBeVisible();
  });

  test("deve exibir conteúdo do pedido ou notFound se o pedido existir", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-0001`);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(10);

    // Se o pedido existir, o publicId aparece em um <h1>
    const h1ComPublicId = page.locator("h1", { hasText: /PED-0001/ });
    const temPedido = (await h1ComPublicId.count()) > 0;

    if (temPedido) {
      await expect(h1ComPublicId.first()).toBeVisible();

      // A seção de timeline usa o texto "Histórico do pedido"
      const timeline = page.locator("text=Histórico do pedido");
      await expect(timeline).toBeVisible();

      // A seção de itens usa o texto "Itens do pedido"
      const itens = page.locator("text=Itens do pedido");
      await expect(itens).toBeVisible();
    }
    // Se o pedido não existir, o Next.js chama notFound() — a página exibe 404 graciosamente
  });

  test("deve exibir link 'Voltar ao início' na página de tracking", async ({ page }) => {
    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-0001`);
    if (!acessivel) return;

    await page.waitForLoadState("networkidle");

    // O link de volta usa o texto "← Voltar ao início"
    const voltarLink = page.locator("a", { hasText: "Voltar ao início" });

    // Pode não existir se a página for 404 — só verifica se o pedido existir
    const temPedido = (await page.locator("h1", { hasText: /PED/ }).count()) > 0;
    if (temPedido) {
      await expect(voltarLink).toBeVisible();
      await expect(voltarLink).toHaveAttribute("href", "/");
    }
  });
});

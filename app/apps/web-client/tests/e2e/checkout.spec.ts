import { test, expect } from "@playwright/test";

/**
 * Testes do fluxo de checkout (SOF-38)
 *
 * Cobre: preenchimento do formulário, seleção de pagamento,
 * cálculo de frete, submissão do pedido e redirecionamento para confirmação.
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

const FRETE_MOCK = {
  data: {
    zonaId: "zona-1",
    label: "Centro",
    feeCents: 500,
    etaMinutes: 45,
    fora: false,
  },
  meta: { requestedAt: new Date().toISOString(), stub: false },
  error: null,
};

const FRETE_FORA_AREA_MOCK = {
  data: {
    zonaId: null,
    label: null,
    feeCents: 0,
    etaMinutes: 0,
    fora: true,
    motivo: "Bairro fora da área de entrega",
  },
  meta: { requestedAt: new Date().toISOString(), stub: false },
  error: null,
};

const PEDIDO_CRIADO_MOCK = {
  data: {
    id: "order-123",
    publicId: "PED-0001",
    status: "pending",
  },
  meta: { requestedAt: new Date().toISOString(), stub: false },
  error: null,
};

const PEDIDO_TRACKING_MOCK = {
  data: {
    id: "order-123",
    publicId: "PED-0001",
    status: "pending",
    channel: "online",
    paymentMethod: "pix",
    customerName: "João Teste",
    customerPhone: "5511999999999",
    subtotalCents: 1490,
    deliveryFeeCents: 500,
    discountCents: 0,
    totalCents: 1990,
    items: [
      {
        id: "item-1",
        productName: "Heineken 600ml",
        quantity: 1,
        unitPriceCents: 1490,
        totalPriceCents: 1490,
      },
    ],
    timeline: [
      {
        type: "created",
        label: "Pedido recebido",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  meta: { requestedAt: new Date().toISOString(), stub: false },
  error: null,
};

// Helper: configura a página com carrinho pré-populado via localStorage
async function configurarCarrinhoComProduto(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
    const itemCarrinho = [
      {
        id: "prod-1-123",
        productId: "prod-1",
        name: "Heineken 600ml",
        slug: "heineken-600ml",
        imagemUrl: null,
        unitPriceCents: 1490,
        quantity: 1,
      },
    ];
    localStorage.setItem("vendza_carrinho", JSON.stringify(itemCarrinho));
  });
}

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
    route.fulfill({
      json: {
        data: [],
        meta: { requestedAt: new Date().toISOString(), stub: false },
        error: null,
      },
    })
  );
  await page.route("**/v1/storefront/calcular-frete", (route) =>
    route.fulfill({ json: FRETE_MOCK })
  );
  await page.route("**/v1/orders", (route) =>
    route.fulfill({ status: 201, json: PEDIDO_CRIADO_MOCK })
  );
  await page.route("**/v1/orders/PED-0001", (route) =>
    route.fulfill({ json: PEDIDO_TRACKING_MOCK })
  );
});

test("redireciona para home se o carrinho estiver vazio", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("vendza_age_verified", "1");
    localStorage.removeItem("vendza_carrinho");
  });

  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  // Deve redirecionar para a página inicial
  await expect(page).toHaveURL("/");
});

test("página de checkout renderiza o formulário com carrinho preenchido", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Dados do pedido" })).toBeVisible();
});

test("formulário exibe campos obrigatórios de identificação", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await expect(page.getByPlaceholder("Seu nome")).toBeVisible();
  await expect(page.getByPlaceholder("5511999999999")).toBeVisible();
  await expect(page.getByPlaceholder("seu@email.com")).toBeVisible();
});

test("formulário exibe campos de endereço obrigatórios", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await expect(page.getByPlaceholder("Nome da rua")).toBeVisible();
  await expect(page.getByPlaceholder("Seu bairro")).toBeVisible();
  await expect(page.getByPlaceholder("Cidade")).toBeVisible();
});

test("opções de pagamento PIX, Dinheiro e Cartão estão visíveis", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("PIX")).toBeVisible();
  await expect(page.getByText("Dinheiro")).toBeVisible();
  await expect(page.getByText("Cartão na entrega")).toBeVisible();
});

test("PIX é a forma de pagamento selecionada por padrão", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  const radiosPagamento = page.locator("input[name='pagamento']");
  const pixRadio = radiosPagamento.filter({ hasValue: "pix" });
  await expect(pixRadio).toBeChecked();
});

test("selecionar forma de pagamento 'Dinheiro' marca o radio correto", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await page.getByText("Dinheiro").click();

  const cashRadio = page.locator("input[name='pagamento'][value='cash']");
  await expect(cashRadio).toBeChecked();
});

test("resumo do pedido exibe o item do carrinho", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  const aside = page.locator("aside");
  await expect(aside).toContainText("Heineken 600ml");
  await expect(aside).toContainText("14,90");
});

test("preenchendo bairro dispara cálculo de frete e exibe valor", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await page.getByPlaceholder("Seu bairro").fill("Centro");
  await page.waitForTimeout(700); // aguarda debounce de 500ms

  // Frete de R$5,00 deve aparecer no resumo lateral
  const aside = page.locator("aside");
  await expect(aside).toContainText("5,00");
  await expect(aside).toContainText("45 min");
});

test("endereço fora da área exibe aviso e desabilita botão finalizar", async ({ page }) => {
  // Sobrescreve mock de frete para retornar fora de área
  await page.route("**/v1/storefront/calcular-frete", (route) =>
    route.fulfill({ json: FRETE_FORA_AREA_MOCK })
  );

  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await page.getByPlaceholder("Seu bairro").fill("Bairro Distante");
  await page.waitForTimeout(700);

  await expect(page.getByText("Bairro fora da área de entrega")).toBeVisible();

  const botaoFinalizar = page.getByRole("button", { name: "Finalizar pedido" });
  await expect(botaoFinalizar).toBeDisabled();
});

test("submissão do formulário completo cria pedido e redireciona para rastreamento", async ({ page }) => {
  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  // Preenche identificação
  await page.getByPlaceholder("Seu nome").fill("João Teste");
  await page.getByPlaceholder("5511999999999").fill("5511999999999");

  // Preenche endereço
  await page.getByPlaceholder("Nome da rua").fill("Rua das Flores");
  await page.getByPlaceholder("123").first().fill("100");
  await page.getByPlaceholder("Seu bairro").fill("Centro");
  await page.getByPlaceholder("Cidade").fill("São Paulo");
  await page.getByPlaceholder("SP").fill("SP");

  // Aguarda cálculo de frete
  await page.waitForTimeout(700);

  // Submete o formulário
  await page.getByRole("button", { name: "Finalizar pedido" }).click();

  // Deve redirecionar para a página de rastreamento do pedido
  await expect(page).toHaveURL("/pedidos/PED-0001");
});

test("erro de API exibe mensagem de erro inline no formulário", async ({ page }) => {
  // Simula erro na criação do pedido
  await page.route("**/v1/orders", (route) =>
    route.fulfill({
      status: 422,
      json: {
        data: null,
        meta: { requestedAt: new Date().toISOString(), stub: false },
        error: { message: "Carrinho inválido ou produtos indisponíveis." },
      },
    })
  );

  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  // Preenche o mínimo necessário
  await page.getByPlaceholder("Seu nome").fill("João Teste");
  await page.getByPlaceholder("5511999999999").fill("5511999999999");
  await page.getByPlaceholder("Nome da rua").fill("Rua Teste");
  await page.getByPlaceholder("Seu bairro").fill("Centro");
  await page.getByPlaceholder("Cidade").fill("São Paulo");
  await page.getByPlaceholder("SP").fill("SP");

  await page.getByRole("button", { name: "Finalizar pedido" }).click();

  await expect(page.getByText("Carrinho inválido ou produtos indisponíveis.")).toBeVisible();
});

test("botão 'Finalizar pedido' exibe 'Enviando...' durante o envio", async ({ page }) => {
  // Atrasa a resposta da API para capturar o estado "enviando"
  await page.route("**/v1/orders", async (route) => {
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ status: 201, json: PEDIDO_CRIADO_MOCK });
  });

  await configurarCarrinhoComProduto(page);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  await page.getByPlaceholder("Seu nome").fill("João Teste");
  await page.getByPlaceholder("5511999999999").fill("5511999999999");
  await page.getByPlaceholder("Nome da rua").fill("Rua Teste");
  await page.getByPlaceholder("Seu bairro").fill("Centro");
  await page.getByPlaceholder("Cidade").fill("São Paulo");
  await page.getByPlaceholder("SP").fill("SP");

  // Clica e verifica estado de carregamento imediatamente
  const botao = page.getByRole("button", { name: /Finalizar pedido|Enviando/ });
  await botao.click();

  // Em algum momento durante o envio deve mostrar "Enviando..."
  await expect(page.getByRole("button", { name: "Enviando..." })).toBeVisible();
});

test("página de rastreamento exibe publicId e status do pedido", async ({ page }) => {
  await page.goto("/pedidos/PED-0001");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Pedido PED-0001" })).toBeVisible();
  await expect(page.getByText("Aguardando confirmação")).toBeVisible();
});

test("página de rastreamento exibe itens do pedido em tabela", async ({ page }) => {
  await page.goto("/pedidos/PED-0001");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("cell", { name: "Heineken 600ml" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "1" })).toBeVisible();
});

test("página de rastreamento exibe link de WhatsApp quando configurado", async ({ page }) => {
  await page.goto("/pedidos/PED-0001");
  await page.waitForLoadState("networkidle");

  const linkWhatsApp = page.getByRole("link", { name: /WhatsApp/ });
  await expect(linkWhatsApp).toBeVisible();
  await expect(linkWhatsApp).toHaveAttribute("href", /wa\.me/);
});

test("página de rastreamento exibe link para voltar ao início", async ({ page }) => {
  await page.goto("/pedidos/PED-0001");
  await page.waitForLoadState("networkidle");

  const linkVoltar = page.getByRole("link", { name: /Voltar ao início/ });
  await expect(linkVoltar).toBeVisible();
  await expect(linkVoltar).toHaveAttribute("href", "/");
});

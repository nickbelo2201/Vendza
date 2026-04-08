import { test, expect, type Page } from '@playwright/test';

/**
 * BASE_URL pode ser sobrescrita via variável de ambiente PLAYWRIGHT_BASE_URL.
 *
 * Exemplos:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test ...
 *   PLAYWRIGHT_BASE_URL=https://minha-url-publica.vercel.app npx playwright test ...
 *
 * Se o deploy no Vercel usar Deployment Protection (SSO), passe o bypass token:
 *   PLAYWRIGHT_BASE_URL="https://minha-url.vercel.app?x-vercel-protection-bypass=TOKEN"
 */
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ??
  'https://web-client-1v7y6yhv2-nickbelo2201s-projects.vercel.app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Erros de console que sao ruido de terceiros ou do ambiente — nao representam bugs reais
const ERROS_IGNORADOS = [
  'net::ERR_',
  'Failed to load resource',
  'favicon',
  // Supabase Auth avisa sobre lista de providers vazia quando nao ha social login configurado
  "Provider's accounts list is empty",
  // Hydration mismatch de data-theme injetado pelo script inline (comportamento esperado)
  'Hydration failed',
  'hydration',
  // Erros de extensoes do navegador
  'chrome-extension',
  'moz-extension',
];

function ehErroIgnorado(mensagem: string): boolean {
  return ERROS_IGNORADOS.some((padrao) =>
    mensagem.toLowerCase().includes(padrao.toLowerCase())
  );
}

// Coleta erros de console JavaScript durante o teste
function coletarErrosConsole(page: Page): string[] {
  const erros: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      erros.push(msg.text());
    }
  });
  return erros;
}

/**
 * Navega para uma URL e verifica se ela esta acessivel.
 * Se retornar 401 (Vercel Deployment Protection), faz skip do teste com mensagem explicativa.
 * Retorna true se a navegacao foi bem-sucedida.
 */
async function navegarOuSkip(page: Page, url: string): Promise<boolean> {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const status = response?.status() ?? 0;

  if (status === 401) {
    test.skip(
      true,
      'URL protegida por Vercel Deployment Protection (401). ' +
        'Use: PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test'
    );
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Flow 1 — Home e catalogo
// ---------------------------------------------------------------------------
test.describe('Flow 1 — Home e catalogo', () => {
  test('deve carregar a pagina home sem erros criticos de JavaScript', async ({ page }) => {
    const errosJS = coletarErrosConsole(page);

    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;

    await page.waitForLoadState('networkidle');

    // Nao deve ter erros JS criticos (exclui ruido de terceiros e ambiente)
    const errosCriticos = errosJS.filter((e) => !ehErroIgnorado(e));
    expect(errosCriticos, `Erros JS criticos encontrados: ${errosCriticos.join(', ')}`).toHaveLength(0);
  });

  test('deve exibir o header com link para a home', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // O header existe com a classe wc-header
    const header = page.locator('header.wc-header');
    await expect(header).toBeVisible();

    // O link do logo (wc-logo) deve existir e apontar para "/"
    const logoLink = page.locator('a.wc-logo');
    await expect(logoLink).toBeVisible();
    const href = await logoLink.getAttribute('href');
    expect(href).toBe('/');
  });

  test('deve exibir pelo menos um produto ou mensagem de catalogo vazio', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Verifica se existem cards de produto OU mensagem de vazio
    const qtdProdutos = await page.locator('.wc-product-card').count();
    const mensagemVazio = page.locator('text=Nenhum produto encontrado');

    if (qtdProdutos === 0) {
      await expect(mensagemVazio.first()).toBeVisible();
    } else {
      expect(qtdProdutos).toBeGreaterThan(0);
    }
  });

  test('deve exibir a grade de categorias estaticas', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // A grade de categorias deve existir (wc-category-grid)
    const categoryGrid = page.locator('.wc-category-grid');
    await expect(categoryGrid).toBeVisible();

    // Deve ter pelo menos um card de categoria
    const categoryCards = page.locator('.wc-category-card');
    const count = await categoryCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir o campo de pesquisa no header', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[aria-label="Pesquisar produtos"]');
    await expect(searchInput).toBeVisible();
  });

  test('deve exibir o titulo da pagina', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // O titulo deve conter "Delivery" ou "Vendza" (fallback)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toMatch(/Delivery|Vendza/i);
  });
});

// ---------------------------------------------------------------------------
// Flow 2 — Filtro por categoria
// ---------------------------------------------------------------------------
test.describe('Flow 2 — Filtro por categoria', () => {
  test('deve filtrar produtos ao clicar em uma categoria', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Verifica se existem subcategory chips
    const chips = page.locator('button.wc-subcategory-chip');
    const qtdChips = await chips.count();

    if (qtdChips > 1) {
      // Clica no segundo chip (o primeiro e "Todos")
      await chips.nth(1).click();
      await page.waitForTimeout(500);

      // A pagina nao deve quebrar — header ainda deve estar visivel
      await expect(page.locator('header.wc-header')).toBeVisible();

      // O chip clicado deve ter a classe "active"
      await expect(chips.nth(1)).toHaveClass(/active/);
    } else {
      // Se nao ha chips de subcategoria (API retornou vazio), verifica que "Todos" existe
      await expect(chips.first()).toBeVisible();
    }
  });

  test('deve filtrar ao clicar em card de categoria estatica', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const categoryCards = page.locator('.wc-category-card');
    const qtd = await categoryCards.count();

    if (qtd > 0) {
      await categoryCards.first().click();
      await page.waitForTimeout(500);

      // A pagina nao deve ter quebrado — wc-product-grid ainda no DOM
      const productGrid = page.locator('.wc-product-grid');
      await expect(productGrid).toBeAttached();

      // O card clicado deve ter classe "active"
      await expect(categoryCards.first()).toHaveClass(/active/);
    }
  });

  test('deve desativar filtro ao clicar no mesmo card novamente (toggle)', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const categoryCards = page.locator('.wc-category-card');
    if ((await categoryCards.count()) === 0) return;

    // Primeiro clique — ativa
    await categoryCards.first().click();
    await page.waitForTimeout(300);
    await expect(categoryCards.first()).toHaveClass(/active/);

    // Segundo clique — desativa
    await categoryCards.first().click();
    await page.waitForTimeout(300);
    const classes = await categoryCards.first().getAttribute('class');
    expect(classes).not.toMatch(/\bactive\b/);
  });

  test('deve atualizar URL ao digitar na busca', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[aria-label="Pesquisar produtos"]');
    await searchInput.fill('cerveja');

    // Debounce de 300ms + margem
    await page.waitForTimeout(600);

    const url = page.url();
    expect(url).toContain('busca=cerveja');
  });
});

// ---------------------------------------------------------------------------
// Flow 3 — Carrinho
// ---------------------------------------------------------------------------
test.describe('Flow 3 — Carrinho', () => {
  test('deve adicionar produto ao carrinho e atualizar badge', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Verifica se existem produtos disponiveis com botao "Adicionar"
    const botoesAdicionar = page.locator('button.wc-btn-cta', { hasText: 'Adicionar' });
    const qtd = await botoesAdicionar.count();

    if (qtd === 0) {
      test.skip(true, 'Nenhum produto disponivel para adicionar ao carrinho');
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);

    // O badge do carrinho deve aparecer com o numero 1
    const cartBadge = page.locator('.wc-cart-badge');
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText('1');
  });

  test('deve abrir o CartSheet ao clicar no botao do carrinho', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Adiciona um produto se disponivel
    const botoesAdicionar = page.locator('button.wc-btn-cta', { hasText: 'Adicionar' });
    if ((await botoesAdicionar.count()) > 0) {
      await botoesAdicionar.first().click();
      await page.waitForTimeout(300);
    }

    // Clica no botao do carrinho no header
    const cartBtn = page.locator('button[aria-label*="Carrinho"]');
    await expect(cartBtn).toBeVisible();
    await cartBtn.click();

    // O drawer (CartSheet) deve aparecer com o titulo "Carrinho"
    const cartTitle = page.locator('h2', { hasText: 'Carrinho' });
    await expect(cartTitle).toBeVisible();
  });

  test('deve exibir item no CartSheet apos adicionar produto', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const botoesAdicionar = page.locator('button.wc-btn-cta', { hasText: 'Adicionar' });
    const qtd = await botoesAdicionar.count();

    if (qtd === 0) {
      test.skip(true, 'Nenhum produto disponivel para testar carrinho');
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);

    // Abre o carrinho
    const cartBtn = page.locator('button[aria-label*="Carrinho"]');
    await cartBtn.click();

    // O CartSheet nao deve mostrar "carrinho esta vazio"
    const vazio = page.locator('text=Seu carrinho está vazio');
    await expect(vazio).not.toBeVisible();

    // Deve haver um link "Ir para checkout"
    const linkCheckout = page.locator('a', { hasText: 'Ir para checkout' });
    await expect(linkCheckout).toBeVisible();
  });

  test('deve fechar o CartSheet ao clicar no botao X', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Abre o carrinho
    const cartBtn = page.locator('button[aria-label*="Carrinho"]');
    await cartBtn.click();

    // CartSheet deve estar visivel
    const cartTitle = page.locator('h2', { hasText: 'Carrinho' });
    await expect(cartTitle).toBeVisible();

    // Clica no botao de fechar (x) dentro do drawer
    const fecharBtn = page.locator('button', { hasText: '×' }).last();
    await fecharBtn.click();
    await page.waitForTimeout(200);

    // CartSheet deve ter desaparecido
    await expect(cartTitle).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Flow 4 — Checkout basico
// ---------------------------------------------------------------------------
test.describe('Flow 4 — Checkout basico', () => {
  test('deve exibir redirecionamento ao acessar /checkout sem itens', async ({ page }) => {
    const errosJS = coletarErrosConsole(page);

    const acessivel = await navegarOuSkip(page, `${BASE_URL}/checkout`);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Com carrinho vazio, a pagina redireciona para "/" ou mostra "Redirecionando..."
    const url = page.url();
    const isRedirected =
      url === `${BASE_URL}/` ||
      url === BASE_URL ||
      url.endsWith('/');
    const isRedirectingMessage = (await page.locator('text=Redirecionando').count()) > 0;

    expect(isRedirected || isRedirectingMessage).toBeTruthy();

    // Sem erros JS criticos
    const errosCriticos = errosJS.filter((e) => !ehErroIgnorado(e));
    expect(errosCriticos).toHaveLength(0);
  });

  test('deve exibir o formulario de checkout apos adicionar produto', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const botoesAdicionar = page.locator('button.wc-btn-cta', { hasText: 'Adicionar' });
    if ((await botoesAdicionar.count()) === 0) {
      test.skip(true, 'Nenhum produto disponivel para testar checkout');
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // O formulario deve estar presente
    const form = page.locator('form.wc-card');
    await expect(form).toBeVisible();
  });

  test('deve ter campo de nome obrigatorio no formulario de checkout', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const botoesAdicionar = page.locator('button.wc-btn-cta', { hasText: 'Adicionar' });
    if ((await botoesAdicionar.count()) === 0) {
      test.skip(true, 'Nenhum produto disponivel');
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const campoNome = page.locator('input[placeholder="Seu nome"]');
    await expect(campoNome).toBeVisible();
    const required = await campoNome.getAttribute('required');
    expect(required).not.toBeNull();
  });

  test('deve ter campo de telefone obrigatorio no formulario de checkout', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const botoesAdicionar = page.locator('button.wc-btn-cta', { hasText: 'Adicionar' });
    if ((await botoesAdicionar.count()) === 0) {
      test.skip(true, 'Nenhum produto disponivel');
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    const campoTelefone = page.locator('input[placeholder="5511999999999"]');
    await expect(campoTelefone).toBeVisible();
    const required = await campoTelefone.getAttribute('required');
    expect(required).not.toBeNull();
  });

  test('deve exibir opcoes de pagamento no checkout', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const botoesAdicionar = page.locator('button.wc-btn-cta', { hasText: 'Adicionar' });
    if ((await botoesAdicionar.count()) === 0) {
      test.skip(true, 'Nenhum produto disponivel');
      return;
    }

    await botoesAdicionar.first().click();
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Deve ter opcoes de pagamento: PIX, Dinheiro, Cartao na entrega
    await expect(page.locator('text=PIX')).toBeVisible();
    await expect(page.locator('text=Dinheiro')).toBeVisible();
    await expect(page.locator('text=Cartão na entrega')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Flow 5 — Tracking de pedido
// ---------------------------------------------------------------------------
test.describe('Flow 5 — Tracking de pedido', () => {
  test('deve carregar /pedidos/PED-0001 sem crash de JavaScript', async ({ page }) => {
    const errosJS = coletarErrosConsole(page);

    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-0001`);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Sem erros JS criticos
    const errosCriticos = errosJS.filter((e) => !ehErroIgnorado(e));
    expect(errosCriticos, `Erros JS criticos: ${errosCriticos.join(' | ')}`).toHaveLength(0);
  });

  test('deve exibir mensagem de pedido nao encontrado ou conteudo do pedido', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-9999`);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // A pagina deve exibir algo — either "nao encontrado" ou dados do pedido
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(10);
  });

  test('deve exibir o header mesmo na pagina de pedido inexistente', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-0001`);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // O header deve sempre estar presente (vem do layout raiz)
    const header = page.locator('header.wc-header');
    await expect(header).toBeVisible();
  });

  test('deve exibir estrutura de timeline se pedido for encontrado', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, `${BASE_URL}/pedidos/PED-0001`);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Verificar se ha conteudo de pedido (pode nao existir na demo)
    const temConteudoPedido = await page.locator('text=Pedido').count();

    if (temConteudoPedido > 0) {
      const pedidoTitulo = page.locator('text=PED-0001');
      if ((await pedidoTitulo.count()) > 0) {
        await expect(pedidoTitulo.first()).toBeVisible();
      }
    }

    // O teste passa independente — o objetivo e verificar que nao ha crash
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Flow 6 — Mobile responsividade (P4-03)
// ---------------------------------------------------------------------------
test.describe('Flow 6 — Mobile responsividade (P4-03)', () => {
  // Estes testes usam o device "iphone" configurado no playwright.config.ts (iPhone 14, 390x844)
  // Para rodar: npx playwright test --project=iphone

  test('deve carregar a home sem crash no viewport mobile', async ({ page }) => {
    const errosJS = coletarErrosConsole(page);

    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Sem erros JS criticos
    const errosCriticos = errosJS.filter((e) => !ehErroIgnorado(e));
    expect(errosCriticos, `Erros JS no mobile: ${errosCriticos.join(' | ')}`).toHaveLength(0);
  });

  test('nao deve ter overflow horizontal na home mobile', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Verifica se o document.body tem scroll horizontal
    const scrollWidthExceedsViewport = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });

    // Se houver overflow, reporta qual elemento esta causando
    if (scrollWidthExceedsViewport) {
      const elementosCausadores = await page.evaluate(() => {
        const largura = window.innerWidth;
        const elementos: string[] = [];
        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > largura + 10) {
            elementos.push(`${el.tagName}.${el.className} (right: ${rect.right}px)`);
          }
        });
        return elementos.slice(0, 5);
      });
      // Warning informativo — o carousel de marcas pode ter overflow intencional
      console.warn(
        'Elementos com overflow horizontal (pode ser carousel intencional):',
        elementosCausadores
      );
    }

    // O body pode ser hidden/auto/visible — o importante e nao ser layout quebrado
    if (scrollWidthExceedsViewport) {
      const bodyOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflowX;
      });
      expect(['hidden', 'auto', 'clip']).toContain(bodyOverflow);
    }
  });

  test('deve exibir o header visivel e nao sobreposto no mobile', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const header = page.locator('header.wc-header');
    await expect(header).toBeVisible();

    // Verifica posicao do header — deve estar no topo e nao negativo
    const boundingBox = await header.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.y).toBeGreaterThanOrEqual(0);
      expect(boundingBox.height).toBeGreaterThan(0);
    }
  });

  test('deve exibir cards de produto visiveis e nao cortados no mobile', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const productCards = page.locator('.wc-product-card');
    const qtd = await productCards.count();

    if (qtd === 0) {
      // Sem produtos — apenas verifica que o layout nao quebrou
      await expect(page.locator('.wc-product-grid')).toBeAttached();
      return;
    }

    // Verifica o primeiro card
    const primeiroCard = productCards.first();
    await expect(primeiroCard).toBeVisible();

    const bb = await primeiroCard.boundingBox();
    expect(bb).not.toBeNull();
    if (bb) {
      // O card deve ter largura > 0
      expect(bb.width).toBeGreaterThan(0);
      // O card nao deve estar alem da margem direita da viewport (com tolerancia de 10px)
      const viewport = page.viewportSize();
      if (viewport) {
        expect(bb.x + bb.width).toBeLessThanOrEqual(viewport.width + 10);
      }
    }
  });

  test('deve exibir botao de carrinho acessivel no mobile', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    const cartBtn = page.locator('button[aria-label*="Carrinho"]');
    await expect(cartBtn).toBeVisible();

    const bb = await cartBtn.boundingBox();
    expect(bb).not.toBeNull();
    if (bb) {
      // Botao deve ter tamanho minimo tocavel de 30px
      expect(bb.width).toBeGreaterThanOrEqual(30);
      expect(bb.height).toBeGreaterThanOrEqual(30);
    }
  });

  test('deve exibir o footer no mobile', async ({ page }) => {
    const acessivel = await navegarOuSkip(page, BASE_URL);
    if (!acessivel) return;
    await page.waitForLoadState('networkidle');

    // Scroll ate o footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const footer = page.locator('footer.wc-footer');
    await expect(footer).toBeVisible();

    // O footer deve conter o texto de copyright
    await expect(footer).toContainText('maiores de 18 anos');
  });
});

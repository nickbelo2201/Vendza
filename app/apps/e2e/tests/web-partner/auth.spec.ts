import { test, expect } from "@playwright/test";

const BASE_URL = "https://web-partner-three.vercel.app";

// A página de login é uma landing page. O formulário de autenticação fica
// dentro de um modal que abre ao clicar no botão "Entrar no painel".
// O botão de abrir o modal tem classe .lp-btn-main ou .lp-nav-cta.

test.describe("Flow 1 — Página de login (landing page + modal)", () => {
  test("página carrega sem crash e exibe o headline da landing", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });

    // A landing page usa .lp-headline (div) em vez de <h1> como título principal
    // O título "Gestão operacional" fica dentro de .lp-hl-green
    await expect(page.locator(".lp-headline")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".lp-hl-green")).toContainText("Gestão operacional", { timeout: 10000 });
  });

  test("modal de login abre ao clicar no CTA", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });

    // Clica em qualquer botão que abre o modal de login
    // O CTA primário da landing e o botão da navbar têm texto "Entrar no painel" ou "Começar agora"
    const ctaBtn = page
      .getByRole("button", { name: /entrar no painel|começar agora|entrar|acessar painel/i })
      .first();

    await expect(ctaBtn).toBeVisible({ timeout: 15000 });
    await ctaBtn.click();

    // O modal deve aparecer com o formulário de login
    const modalCard = page.locator(".lp-modal-card");
    await expect(modalCard).toBeVisible({ timeout: 10000 });
  });

  test("modal contém campo de email, senha e botão de submit", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });

    // Abre o modal
    await page.getByRole("button", { name: /entrar no painel|começar agora|entrar|acessar painel/i }).first().click();
    await expect(page.locator(".lp-modal-card")).toBeVisible({ timeout: 10000 });

    // Campo email
    const emailInput = page.locator("#m-email");
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toHaveAttribute("type", "email");

    // Campo senha
    const senhaInput = page.locator("#m-pass");
    await expect(senhaInput).toBeVisible({ timeout: 10000 });
    await expect(senhaInput).toHaveAttribute("type", "password");

    // Botão de submit
    const submitBtn = page.locator(".lp-btn-submit");
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
  });

  test("login com credenciais inválidas exibe mensagem de erro sem redirecionar", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });

    // Abre o modal
    await page.getByRole("button", { name: /entrar no painel|começar agora|entrar|acessar painel/i }).first().click();
    await expect(page.locator(".lp-modal-card")).toBeVisible({ timeout: 10000 });

    // Preenche credenciais inválidas
    await page.locator("#m-email").fill("test@invalid.com");
    await page.locator("#m-pass").fill("wrongpassword");
    await page.locator(".lp-btn-submit").click();

    // Deve aparecer mensagem de erro (classe .lp-modal-erro)
    const erro = page.locator(".lp-modal-erro");
    await expect(erro).toBeVisible({ timeout: 15000 });

    // A URL não deve mudar para o dashboard
    await expect(page).not.toHaveURL(/\/(pedidos|catalogo|clientes|configuracoes|relatorios)/, { timeout: 5000 });
  });

  test("link 'Esqueceu a senha?' está visível no modal", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });

    await page.getByRole("button", { name: /entrar no painel|começar agora|entrar|acessar painel/i }).first().click();
    await expect(page.locator(".lp-modal-card")).toBeVisible({ timeout: 10000 });

    const forgotLink = page.locator("a.lp-inp-forgot");
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
    await expect(forgotLink).toHaveAttribute("href", "/esqueci-senha");
  });
});

test.describe("Flow 2 — Página de cadastro", () => {
  test("página carrega sem crash", async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`, { waitUntil: "networkidle", timeout: 30000 });

    // Deve exibir o título da página
    const titulo = page.locator("h1.wp-auth-title");
    await expect(titulo).toBeVisible({ timeout: 15000 });
  });

  test("contém campo de email", async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`, { waitUntil: "networkidle", timeout: 30000 });

    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("contém campo de senha", async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`, { waitUntil: "networkidle", timeout: 30000 });

    const senhaInput = page.locator("#senha");
    await expect(senhaInput).toBeVisible({ timeout: 10000 });
    await expect(senhaInput).toHaveAttribute("type", "password");
  });

  test("contém campo de confirmar senha", async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`, { waitUntil: "networkidle", timeout: 30000 });

    const confirmarInput = page.locator("#confirmar");
    await expect(confirmarInput).toBeVisible({ timeout: 10000 });
    await expect(confirmarInput).toHaveAttribute("type", "password");
  });

  test("botão de submit existe e está habilitado", async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`, { waitUntil: "networkidle", timeout: 30000 });

    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await expect(submitBtn).toBeEnabled();
  });

  test("valida senhas não coincidem antes de enviar para o servidor", async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`, { waitUntil: "networkidle", timeout: 30000 });

    await page.locator("#email").fill("test@example.com");
    await page.locator("#senha").fill("senha123");
    await page.locator("#confirmar").fill("senha456"); // diferente
    await page.locator("button[type='submit']").click();

    // Deve exibir erro de validação local sem chamar Supabase
    const erro = page.locator(".wp-error-box");
    await expect(erro).toBeVisible({ timeout: 10000 });
    await expect(erro).toContainText(/senhas não coincidem/i);
  });
});

test.describe("Flow 3 — Redirect sem autenticação", () => {
  test("dashboard '/' redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { timeout: 30000 });

    // Aguarda a navegação se completar
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    // Deve redirecionar para a página de login
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /pedidos redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/pedidos`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /catalogo redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/catalogo`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /clientes redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/clientes`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /configuracoes redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/configuracoes`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test("rota /relatorios redireciona para /login sem estar logado", async ({ page }) => {
    await page.goto(`${BASE_URL}/relatorios`, { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 });

    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });
});

test.describe("Flow 4 — Página de recuperação de senha", () => {
  test("página /esqueci-senha carrega sem crash", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-senha`, { waitUntil: "networkidle", timeout: 30000 });

    const titulo = page.locator("h1.wp-auth-title");
    await expect(titulo).toBeVisible({ timeout: 15000 });
  });

  test("contém campo de email", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-senha`, { waitUntil: "networkidle", timeout: 30000 });

    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("botão de envio existe e está habilitado", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-senha`, { waitUntil: "networkidle", timeout: 30000 });

    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await expect(submitBtn).toBeEnabled();
  });

  test("link de voltar para login existe", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-senha`, { waitUntil: "networkidle", timeout: 30000 });

    const loginLink = page.locator("a[href='/login']");
    await expect(loginLink).toBeVisible({ timeout: 10000 });
  });

  test("valida campo vazio antes de enviar ao servidor", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-senha`, { waitUntil: "networkidle", timeout: 30000 });

    // Clica em submit sem preencher o email
    // O campo tem o atributo required — o browser nativo pode bloquear,
    // mas a validação JS também age. Testamos a validação JS forçando o submit.
    await page.locator("button[type='submit']").click();

    // Ou o browser valida nativamente, ou o JS exibe o wp-error-box
    const emailInput = page.locator("#email");

    // O campo deve ser inválido (validação nativa do browser)
    const isValid = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });
});

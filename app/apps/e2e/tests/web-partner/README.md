# Testes E2E — web-partner (Painel do Lojista)

Testes Playwright para o painel do lojista Vendza hospedado em
`https://web-partner-three.vercel.app`.

## Como rodar

A partir do diretório `apps/e2e/`:

```bash
# Instalar dependências (apenas na primeira vez)
npx playwright install chromium

# Rodar todos os testes do web-partner no Chromium
npx playwright test tests/web-partner/ --project=chromium --reporter=list

# Rodar apenas os testes de autenticação
npx playwright test tests/web-partner/auth.spec.ts --project=chromium --reporter=list

# Rodar apenas os testes de onboarding
npx playwright test tests/web-partner/onboarding.spec.ts --project=chromium --reporter=list

# Rodar com browser visível (útil para depuração)
npx playwright test tests/web-partner/ --project=chromium --headed

# Gerar relatório HTML
npx playwright test tests/web-partner/ --project=chromium --reporter=html
```

## Testes implementados

### `auth.spec.ts`

| Flow | Teste | Observacao |
|------|-------|------------|
| 1 | Página de login carrega sem crash | A rota /login é uma landing page |
| 1 | Modal de login abre ao clicar no CTA | O formulário fica dentro de um modal |
| 1 | Modal contém email, senha e botão submit | Seletores: #m-email, #m-pass, .lp-btn-submit |
| 1 | Credenciais inválidas exibem mensagem de erro | Classe .lp-modal-erro |
| 1 | Link "Esqueceu a senha?" visível no modal | Aponta para /esqueci-senha |
| 2 | Página /cadastro carrega sem crash | Formulário standalone |
| 2 | /cadastro contém campos email, senha, confirmar | Seletores: #email, #senha, #confirmar |
| 2 | Botão de submit existe e está habilitado | button[type=submit] |
| 2 | Validação local: senhas não coincidem | Erro antes de chamar Supabase |
| 3 | / redireciona para /login sem auth | Middleware Supabase SSR |
| 3 | /pedidos redireciona para /login | Rota protegida |
| 3 | /catalogo redireciona para /login | Rota protegida |
| 3 | /clientes redireciona para /login | Rota protegida |
| 3 | /configuracoes redireciona para /login | Rota protegida |
| 3 | /relatorios redireciona para /login | Rota protegida |
| 4 | /esqueci-senha carrega sem crash | Formulário standalone |
| 4 | /esqueci-senha contém campo email e botão | Seletores: #email, button[type=submit] |
| 4 | Link "Voltar para login" existe | Aponta para /login |
| 4 | Validação: campo vazio bloqueado no browser | Atributo required no input |

### `onboarding.spec.ts`

| Flow | Teste |
|------|-------|
| 5 | /onboarding redireciona para /login sem auth |
| 5 | /onboarding nao retorna 404 |

## Testes autenticados (futuros)

Testes que verificam o conteúdo das rotas protegidas requerem uma sessão
autenticada real. Para isso, defina as variáveis de ambiente:

```bash
E2E_EMAIL=seu@email.com
E2E_PASSWORD=suasenha
```

O setup de autenticação deve ser feito num `global-setup.ts` que realiza login
via Supabase Auth, salva o `storageState` e o reutiliza nos testes.

Exemplo de comando:

```bash
E2E_EMAIL=parceiro@teste.com E2E_PASSWORD=senha123 \
  npx playwright test tests/web-partner/ --project=chromium
```

Os testes autenticados estao marcados com `test.skip()` no arquivo
`onboarding.spec.ts` e podem ser habilitados removendo o `.skip()` apos
configurar as credenciais.

## Estrutura da autenticação

O painel usa Supabase Auth com SSR via `@supabase/ssr`. O middleware em
`apps/web-partner/src/middleware.ts` verifica a sessao em todas as rotas
(exceto assets estaticos). Sem sessao valida, o usuario e redirecionado para
`/login`.

A rota `/login` e uma landing page. O formulario de login fica dentro de um
modal que abre ao clicar nos CTAs da pagina.

# Testes E2E — Web Client (Storefront)

Testes end-to-end do storefront Vendza, escritos com Playwright.

## Pré-requisitos

- Node >= 22
- pnpm (via corepack)
- Playwright instalado com os browsers

## Instalação

Da raiz do monorepo (`app/`):

```bash
corepack pnpm install
```

Instalar os browsers do Playwright (apenas na primeira vez):

```bash
cd apps/e2e
npx playwright install chromium --with-deps
npx playwright install webkit --with-deps   # para testes iPhone
```

## Rodando os testes

Todos os testes rodam contra a URL de produção do web-client.

### Desktop (Chromium)

```bash
cd apps/e2e
npx playwright test tests/web-client/ --project=chromium --reporter=list
```

### Mobile iPhone 14

```bash
cd apps/e2e
npx playwright test tests/web-client/ --project=iphone --reporter=list
```

### Mobile Android (Pixel 5)

```bash
cd apps/e2e
npx playwright test tests/web-client/ --project=mobile-chrome --reporter=list
```

### Todos os projetos

```bash
cd apps/e2e
npx playwright test tests/web-client/
```

### Com interface visual (recomendado para debug)

```bash
cd apps/e2e
npx playwright test --ui
```

### Com browser visivel

```bash
cd apps/e2e
npx playwright test tests/web-client/ --project=chromium --headed
```

## Ver relatório HTML

Apos rodar os testes:

```bash
cd apps/e2e
npx playwright show-report
```

## Estrutura dos testes

| Flow | Descricao |
|------|-----------|
| Flow 1 | Home e catalogo — carregamento, header, grade de produtos |
| Flow 2 | Filtro por categoria — chips, cards de categoria, busca |
| Flow 3 | Carrinho — adicionar produto, badge, CartSheet |
| Flow 4 | Checkout basico — formulario, campos obrigatorios |
| Flow 5 | Tracking de pedido — pagina /pedidos/:publicId sem crash |
| Flow 6 | Mobile responsividade — overflow, header, cards (P4-03) |

## URL testada

`https://web-client-1v7y6yhv2-nickbelo2201s-projects.vercel.app`

Para mudar o ambiente alvo, edite a constante `BASE_URL` em `storefront.spec.ts`.

## Observacoes

- Testes do Flow 6 rodam em todos os projetos, mas sao mais relevantes com `--project=iphone`
- Testes do Flow 3 e 4 fazem skip automatico se nao houver produtos disponiveis na API
- Erros de console de imagens externas e favicon sao filtrados automaticamente
- O carousel de marcas (`wc-brand-carousel`) tem overflow-x intencional — nao e bug

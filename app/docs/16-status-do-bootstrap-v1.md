# Status do Bootstrap V1 — Documento Histórico

> Este documento é um registro histórico. O bootstrap da V1 foi concluído em **2026-04-06** (commit `f2c7c23`).
> A V2 também foi concluída na mesma data (commit `ad8c35f`).
> O produto está em produção. O primeiro cliente (Adega Ideal) está em onboarding ativo desde 2026-04-29.

---

## O que foi bootstrapado e está em produção

### Workspace e Monorepo

- Monorepo com `pnpm workspaces` + `Turbo 2.5`
- `tsconfig` compartilhado entre todos os pacotes
- `.env.example` com todas as variáveis do projeto
- Scripts unificados de dev, build, typecheck e banco

### Infraestrutura

- Supabase Auth para identidade (Bearer tokens)
- Supabase PostgreSQL como banco principal
- Prisma 7 como ORM oficial da API
- Docker Compose disponível para desenvolvimento offline (Postgres 16, Redis 7)
- Deploy: Railway (API em `https://vendza-production.up.railway.app`) + Vercel (web-partner e web-client)

### Banco de Dados

- Schema Prisma tenant-ready em `packages/database/prisma/schema.prisma`
- Client Prisma gerado em `packages/database/generated/client`
- Seed inicial da loja piloto em `packages/database/prisma/seed.ts`
- `DATABASE_URL` e `DIRECT_URL` apontam para o Postgres do Supabase nos ambientes de produção

### API (Fastify 5)

- Servidor com CORS configurado e respostas tipadas (envelope `{ data, meta, error }`)
- Auth parceiro via Bearer token do Supabase com resolução `auth_user_id → store_users`

**Rotas públicas:**
- `POST /v1/coverage/validate`
- `GET /v1/storefront/config`
- `GET /v1/catalog/categories`
- `GET /v1/catalog/products`
- `GET /v1/catalog/products/:slug`
- `POST /v1/cart/quote`
- `POST /v1/orders`
- `GET /v1/orders/:publicId`

**Rotas parceiras:**
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `GET /v1/partner/dashboard/summary`
- `GET /v1/partner/orders`
- `GET /v1/partner/orders/:id`
- `PATCH /v1/partner/orders/:id/status`
- `POST /v1/partner/orders/manual`
- `GET /v1/partner/products`
- `POST /v1/partner/products`
- `PATCH /v1/partner/products/:id`
- `PATCH /v1/partner/products/:id/availability`
- `GET /v1/partner/inventory`
- `POST /v1/partner/inventory/movements`
- `GET /v1/partner/customers`
- `GET /v1/partner/customers/:id`
- `PATCH /v1/partner/customers/:id`
- `GET /v1/partner/store/settings`
- `PATCH /v1/partner/store/settings`
- `PATCH /v1/partner/store/hours`
- `PATCH /v1/partner/store/delivery-zones`

### Frontend

- `web-client` (Next.js 15): vitrine, busca, produto com combos/extras, carrinho, checkout, rastreamento
- `web-partner` (Next.js 15): login, dashboard, pedidos com drawer de detalhe, catálogo com CRUD, CRM, configurações, relatórios, exportação CSV
- Autenticação via Supabase SSR em ambos os apps
- Design system aplicado (Inter + Space Grotesk, tokens de cor: cream, green, amber, blue, carbon)

---

## Critérios de pronto — todos atingidos

- `corepack pnpm install` passa
- `corepack pnpm typecheck` passa com 0 erros
- `corepack pnpm build` passa
- `corepack pnpm db:generate` passa
- Conectividade com o Postgres do Supabase validada
- Fluxo ponta a ponta validado (cliente → checkout → pedido → painel parceiro)
- Deploy em produção funcional (Railway + Vercel)
- Primeiro cliente em onboarding

---

## O que permanece como backlog

Ver `15-backlog-de-implementacao.md` para a lista completa de pendências da próxima sprint (CI, testes Playwright, logo, revisão visual, perfil do cliente em localStorage, endereços favoritos).

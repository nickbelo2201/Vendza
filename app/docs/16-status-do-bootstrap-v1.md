# Status do Bootstrap V1

## Objetivo

Este documento existe para alinhar o time sobre o que ja foi implementado no scaffold da V1 e o que ainda precisa entrar na fase de integracao real.

## Ja implementado

### Workspace

- monorepo com `pnpm workspace`
- orquestracao com `turbo`
- `tsconfig` compartilhado
- `.env.example` com as variaveis do projeto
- `AGENTS.md` com regras do produto e do time

### Infra e dados

- decisao atual:
  - `Supabase Auth` para identidade
  - `Supabase Postgres` como banco principal
  - `Prisma` como ORM oficial da API
- `infra/docker/docker-compose.yml` continua disponivel para desenvolvimento offline com:
  - `Postgres 16`
  - `Redis 7`

### Banco

- schema Prisma tenant-ready em `packages/database/prisma/schema.prisma`
- client Prisma gerado em `packages/database/generated/client`
- seed inicial da loja piloto em `packages/database/prisma/seed.ts`
- regra nova: `DATABASE_URL` e `DIRECT_URL` devem apontar para o Postgres do projeto Supabase nos ambientes oficiais

### API

- servidor Fastify com CORS e respostas tipadas
- auth partner via bearer token do Supabase com resolucao `auth_user_id -> store_users`
- rotas publicas do MVP:
  - `POST /v1/coverage/validate`
  - `GET /v1/storefront/config`
  - `GET /v1/catalog/categories`
  - `GET /v1/catalog/products`
  - `GET /v1/catalog/products/:slug`
  - `POST /v1/cart/quote`
  - `POST /v1/orders`
  - `GET /v1/orders/:publicId`
- rotas parceiras do MVP:
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

### Frontend estrutural

- `web-client` com home, produto, checkout e tracking
- `web-partner` com home, login, pedidos, catalogo, clientes e configuracoes
- layout responsivo basico
- design gate mantido de forma explicita

## Ainda nao implementado

### Integracoes reais

- `DATABASE_URL` do ambiente ainda precisa ser migrado do Postgres local para o Postgres do Supabase
- Mercado Pago no checkout
- storage real para imagens

### Operacao real

- smoke ponta a ponta com usuario real do Supabase vinculado em `store_users.auth_user_id`
- seed e validacao no banco do Supabase
- dashboard com agregacoes reais validadas em ambiente com dados

### Produto visual

- direcao criativa final do `web-client`
- direcao criativa final do `web-partner`
- polimento visual final aprovado pelo usuario

## Ordem tecnica recomendada agora

1. Ligar `Supabase Auth`
2. Apontar `DATABASE_URL` para o Postgres do Supabase
3. Rodar Prisma no banco do Supabase
4. Conectar os frontends a API real
5. Validar fluxo ponta a ponta
6. So depois iniciar a fase visual final

## Criterio de pronto desta etapa

O bootstrap da V1 esta pronto quando:

- `corepack pnpm install` passa
- `corepack pnpm typecheck` passa
- `corepack pnpm build` passa
- `corepack pnpm db:generate` passa
- existe conectividade real com o Postgres do Supabase
- a estrutura da V1 esta clara para o time
- o design gate continua bloqueando a camada visual final
- Definir se vai usar mercado pago como metodo de pagamento ou pix

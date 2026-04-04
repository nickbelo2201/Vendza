# INF Adega App

Esta e a raiz oficial do produto. A partir de agora, quando formos iniciar a producao do aplicativo, o ponto de entrada deve ser esta pasta.

## Objetivo do produto

Construir o melhor aplicativo proprio para adegas do mercado brasileiro, combinando:

- UX e conversao no nivel do Ze Delivery
- cobertura operacional no nivel da Neemo
- CRM, WhatsApp e ownership acima dos dois

## Principios do produto

- `Adega-first`: horarios de madrugada, Pix-first, combos, kits, impulso visual e pedido assistido.
- `Own the customer`: marca, dominio, base, historico e campanhas pertencem a adega.
- `Ops before hype`: o V1 precisa operar a loja de verdade, nao apenas parecer bonito.
- `WhatsApp as a surface`: o WhatsApp entra no fluxo operacional, nao so como link perdido.
- `Clear cockpit`: painel mais leve e mais acionavel que o dos concorrentes.

## Estrutura

```text
app/
  apps/
    api/
    web-client/
    web-partner/
    mobile/
  packages/
    database/
    ui/
    types/
    utils/
  infra/
    docker/
    terraform/
  docs/
    01-visao-estrategica.md
    02-prd-v1.md
    03-prd-v2.md
    04-matriz-de-funcionalidades.md
    05-jornadas-e-operacao.md
    06-arquitetura-de-produto.md
    07-arquitetura-tecnica.md
    08-modelo-de-dados-e-integracoes.md
    09-design-system-e-ux.md
    10-roadmap-backlog-kpis.md
    11-plano-de-execucao-amanha.md
    12-contratos-api.md
    13-schema-inicial.md
    14-compliance-adega.md
    15-backlog-de-implementacao.md
    16-status-do-bootstrap-v1.md
```

## Ordem de leitura recomendada

1. `docs/01-visao-estrategica.md`
2. `docs/02-prd-v1.md`
3. `docs/04-matriz-de-funcionalidades.md`
4. `docs/07-arquitetura-tecnica.md`
5. `docs/12-contratos-api.md`
6. `docs/13-schema-inicial.md`
7. `docs/15-backlog-de-implementacao.md`
8. `docs/16-status-do-bootstrap-v1.md`

## Status atual

O monorepo da V1 ja esta bootstrapado e compilando com:

- `Fastify + TypeScript` no `apps/api`
- `Next.js App Router` no `apps/web-client`
- `Next.js App Router` no `apps/web-partner`
- `Prisma + Postgres do Supabase` no `packages/database`
- `Supabase Auth` para identidade e sessao
- `Docker Compose` local opcional para desenvolvimento offline

O que ja existe no scaffold:

- schema tenant-ready para o MVP
- seed inicial para a loja piloto
- rotas estruturais da API para storefront, checkout, pedidos e painel parceiro
- frontend estrutural com `design gate` preservado
- workspace com `pnpm` e `turbo`

O que ainda esta em mock ou pendente de integracao real:

- uso do `DATABASE_URL` apontando para o Postgres do Supabase em todos os ambientes
- integracao Mercado Pago
- consumo real da API pelos frontends
- design visual final aprovado pelo usuario

## Quickstart

1. Instale dependencias com `corepack pnpm install`
2. Copie `.env.example` para `.env`
3. Preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Aponte `DATABASE_URL` e `DIRECT_URL` para o Postgres do projeto Supabase
5. Gere o client Prisma com `corepack pnpm db:generate`
6. Rode migrations ou push no banco alvo e depois o seed com `corepack pnpm db:seed`
7. Inicie o workspace com `corepack pnpm dev`

## Decisao atual de banco

- `Supabase Auth` continua sendo a camada oficial de autenticacao
- `Supabase Postgres` passa a ser o banco principal da aplicacao
- `Prisma` continua sendo o ORM oficial do backend
- o backend resolve `auth_user_id -> store_users` dentro do mesmo banco
- `docker compose` local com Postgres deixa de ser requisito arquitetural; fica apenas como opcao de desenvolvimento offline

## Regra de execucao

- backend primeiro
- sem agentes na V1
- `web-client` e `web-partner` ficam estruturais ate aprovacao visual
- cobertura do V1 fica em `bairro + raio`
- Mercado Pago e o unico gateway do V1

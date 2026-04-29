# Vendza — Claude Code Configuration

## Project Overview

**Vendza** is a full-stack operational infrastructure + AI automation platform for retail commerce. It provides a direct sales channel, operational dashboard, native CRM, and event-based automation for store owners and their customers across any retail segment.

**Language:** Portuguese (BR) — all domain terms, UI labels, variable names, and documentation are in Portuguese.

---

## WORKFLOW DE BRANCHES — REGRA ABSOLUTA

**NUNCA fazer push direto para `main`.** Existe um git pre-push hook que bloqueia pushes diretos para `main` automaticamente.

### Fluxo obrigatório para todo desenvolvimento:

```bash
# 1. Criar feature branch a partir de main
git checkout -b feat/nome-da-feature

# 2. Implementar, commitar normalmente
git add <arquivos>
git commit -m "feat: descrição da mudança"

# 3. Push para o branch remoto (gera preview URL automática no Vercel)
git push origin feat/nome-da-feature

# 4. Abrir Pull Request no GitHub
# → O fundador (Nicholas Belo) testa na preview URL do Vercel
# → O fundador faz o merge e push para main pessoalmente
```

**Quem autoriza merges para `main`:** somente o fundador Nicholas Belo.

**O agente NUNCA deve:**
- Fazer `git push origin main`
- Tentar fazer merge de PR programaticamente
- Pular etapas do fluxo acima

---

## Repository Structure

```
INF_Adega_Oficial/app/       # Main product workspace (monorepo root)
├── apps/
│   ├── api/                 # Fastify 5 backend (TypeScript) — port 3333
│   ├── web-client/          # Customer storefront (Next.js 15) — port 3000
│   ├── web-partner/         # Store partner dashboard (Next.js 15) — port 3001
│   └── mobile/              # Reserved for V3
├── packages/
│   ├── database/            # Prisma 7 ORM + migrations + seed
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   └── utils/               # Shared utilities
├── infra/
│   ├── docker/              # docker-compose (Postgres 16, Redis 7)
│   └── terraform/           # IaC
├── docs/                    # Documentação estratégica e técnica (PT-BR)
└── .claude/                 # Claude Code plugins & agent marketplace
```

---

## Tech Stack

| Layer       | Technology                                  |
|-------------|---------------------------------------------|
| Frontend    | Next.js 15, React 19, TypeScript 6          |
| Backend     | Fastify 5, TypeScript 6                     |
| ORM         | Prisma 7 (`@prisma/adapter-pg`)             |
| Database    | Supabase PostgreSQL (pg_trgm, future PostGIS)|
| Auth        | Supabase Auth (Bearer tokens)               |
| Monorepo    | pnpm 10 + Turbo 2.5                         |
| Node        | >=22.0.0                                    |
| Validation  | TypeBox (`@sinclair/typebox`)               |
| Future      | Redis 7, Socket.io, Mercado Pago            |

---

## Development Commands

All commands run from `app/` directory:

```bash
# Install dependencies
corepack pnpm install

# Start all dev servers
corepack pnpm dev

# Individual servers
corepack pnpm dev:api          # API at localhost:3333
corepack pnpm dev:web-partner  # Partner dashboard at localhost:3001
corepack pnpm dev:web-client   # Customer app at localhost:3000

# Database
corepack pnpm db:generate      # Generate Prisma client
corepack pnpm db:migrate       # Run migrations
corepack pnpm db:push          # Sync schema (no migration file)
corepack pnpm db:seed          # Seed initial data

# Quality
corepack pnpm build            # Build all packages
corepack pnpm typecheck        # TypeScript validation
corepack pnpm lint             # Linting
```

---

## Architecture Conventions

### API (Fastify)

**Response envelope — always use this format:**
```json
{
  "data": { ... },
  "meta": { "requestedAt": "ISO", "stub": false },
  "error": null
}
```

**Auth context** — authenticated partner routes inject `request.partnerContext`:
```ts
{ userId: string, storeId: string, storeUserId: string, role: StoreUserRole }
```

**Route organization:**
- Public routes: `/v1/...`
- Partner-authenticated routes: `/v1/partner/...`
- Auth endpoints: `/v1/auth/...`

**Isolation rule:** All DB queries on partner routes MUST filter by `storeId` from `request.partnerContext`. Never trust storeId from the request body.

### Database (Prisma)

- **Tenant isolation** is at query level via `storeId` on every model.
- **Append-only patterns**: `InventoryMovement` and `OrderEvent` are never updated/deleted — only created.
- **Enums** in `schema.prisma`: `StoreStatus`, `StoreUserRole`, `OrderChannel`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `InventoryMovementType`, `DeliveryZoneMode`.
- After any schema change: run `corepack pnpm db:generate`.

### Frontend (Next.js)

- Both apps use **App Router** (Next.js 15).
- Path alias: `@/*` → `./src/*` (configured in tsconfig).
- Shared packages (`@vendza/ui`, `@vendza/types`, `@vendza/utils`) are transpiled via `next.config.ts`.
- Supabase SSR auth via `@supabase/ssr`.

### Shared Packages

- Import as `@vendza/database`, `@vendza/types`, `@vendza/ui`, `@vendza/utils`.
- After changing a package, Turbo handles rebuild order automatically.

---

## Status do Produto

### V1 — COMPLETA (2026-04-06, commit f2c7c23)

Todas as 20 stories da V1 entregues. Produto em produção com clientes reais.

### V2 — COMPLETA (2026-04-29)

Todas as stories da V2 entregues e em produção:
- V2-A1: Painel de pedidos funcional (listar, filtrar, mudar status, realtime)
- V2-A2: CRUD de produtos e categorias com upload de imagem
- V2-A3: CRM de clientes com histórico
- V2-A4: Configurações da loja (dados, horário, zonas de entrega)
- V2-B1: Relatórios e analytics por período
- V2-B2: Notificações realtime de novos pedidos (badge)
- V2-B3: Exportação CSV de pedidos
- V2-C1: Busca de produtos no web-client
- V2-C2: SEO e metatags dinâmicas por produto

### Próximas Tarefas (Backlog ativo)

Consultar `app/prd.json` para detalhes completos. Prioridade atual:

| Story | Descrição |
|-------|-----------|
| P3-03 | GitHub Actions CI (typecheck + build no PR) |
| P4-01 | Playwright — setup e testes e2e básicos |
| P4-03 | Playwright — testes do fluxo de checkout |
| P5-01 | Design system — atualização de logo e identidade |
| P5-02 | Design system — componentes visuais revisados |
| P2-08 | Storefront — carrinho via localStorage |
| P2-09 | Storefront — persistência de sessão no web-client |

### V3 Backlog (não iniciar até stories acima concluídas)

- Mobile app
- WhatsApp automação
- Multi-tenant avançado
- **ÚLTIMA FEAT V3: Mercado Pago (checkout online)**

### Fora de escopo (todas as versões)

- Polygon-based delivery zones (usa bairro + radius)
- IA generativa (V3+)

---

## Key Files Reference

| Purpose                  | Path                                                          |
|--------------------------|---------------------------------------------------------------|
| Root workspace config    | `app/package.json`                                           |
| Env template             | `app/.env.example`                                           |
| Prisma schema            | `app/packages/database/prisma/schema.prisma`                 |
| DB seed                  | `app/packages/database/prisma/seed.ts`                       |
| API entry point          | `app/apps/api/src/server.ts`                                 |
| API routes & middleware  | `app/apps/api/src/app.ts`                                    |
| Supabase auth plugin     | `app/apps/api/src/plugins/supabase.js`                       |
| Partner services         | `app/apps/api/src/modules/partner/`                          |
| Partner frontend layout  | `app/apps/web-partner/src/app/layout.tsx`                    |
| Partner dashboard        | `app/apps/web-partner/src/app/page.tsx`                      |
| Docs (PT-BR)             | `app/docs/`                                                  |

---

## Produção — Ambientes e Deploy

| Serviço | URL | Branch | Plataforma |
|---|---|---|---|
| API | `https://vendza-production.up.railway.app` | `main` | Railway |
| web-partner | `https://web-partner-three.vercel.app` | `main` | Vercel |

**Deploy em produção acontece APENAS via merge para `main` pelo fundador.**

Feature branches geram preview URLs automáticas no Vercel para validação antes do merge.

**Antes de abrir PR:**
1. `corepack pnpm typecheck` — deve passar com 0 erros
2. Todos os arquivos modificados devem estar commitados
3. Variáveis de ambiente novas devem estar documentadas no PR

Ver `app/docs/18-deploy-e-producao.md` para documentação completa de infraestrutura.

---

## Important Rules

1. **Language:** All code comments, variable names, and user-facing strings should stay in Portuguese (BR) to match the existing codebase.
2. **Branch workflow:** NUNCA fazer push para `main`. Sempre usar feature branch → PR → fundador faz merge.
3. **storeId isolation:** Never skip the `storeId` filter on partner queries — this is a security and data isolation requirement.
4. **Append-only logs:** Never UPDATE or DELETE `InventoryMovement` or `OrderEvent` records.
5. **Stub tracking:** When creating stub/mock responses, always set `meta.stub: true` in the response envelope so they can be easily found and replaced.
6. **Package manager:** Always use `pnpm` (via corepack), never `npm` or `yarn`.
7. **Node version:** Must be >=22.0.0.
8. **next.config.ts:** Nunca adicionar `outputFileTracingRoot` sem `output: 'standalone'` — quebra o runtime do Vercel.
9. **Commits atômicos:** Sempre commitar TODOS os arquivos relacionados à mudança juntos. Arquivos uncommitted não são deployados.

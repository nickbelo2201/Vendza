# Vendza — Claude Code Configuration

## Project Overview

**Vendza** is a full-stack operational infrastructure + AI automation platform for retail commerce. It provides a direct sales channel, operational dashboard, native CRM, and event-based automation for store owners and their customers across any retail segment.

**Language:** Portuguese (BR) — all domain terms, UI labels, variable names, and documentation are in Portuguese.

---

## Repository Structure

```
INF_Adega_Oficial/app/       # Main product workspace (monorepo root)
├── apps/
│   ├── api/                 # Fastify 5 backend (TypeScript) — port 3333
│   ├── web-client/          # Customer storefront (Next.js 15) — port 3000
│   ├── web-partner/         # Store partner dashboard (Next.js 15) — port 3001
│   └── mobile/              # Reserved for V2
├── packages/
│   ├── database/            # Prisma 7 ORM + migrations + seed
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   └── utils/               # Shared utilities
├── infra/
│   ├── docker/              # docker-compose (Postgres 16, Redis 7)
│   └── terraform/           # IaC
├── docs/                    # 16 strategic and technical docs (all in PT-BR)
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

## Current V1 Status (as of 2026-03-30)

**Done:**
- Full monorepo setup (pnpm, Turbo, TypeScript)
- Fastify API with all partner + public routes
- Prisma schema (complete, tenant-ready)
- Docker Compose for local dev
- Web-partner routing structure (layout, pages)
- Web-client storefront structure

**V1 Status: COMPLETE ✅ (2026-04-06, commit f2c7c23)**

All 20 V1 stories shipped. See `app/prd.json` for V2 stories.

**V2 In Progress (see app/prd.json for full details):**
- V2-A1: Painel de pedidos funcional (listar, filtrar, mudar status, realtime)
- V2-A2: CRUD de produtos e categorias com upload de imagem
- V2-A3: CRM de clientes com histórico
- V2-A4: Configurações da loja (dados, horário, zonas de entrega)
- V2-B1: Relatórios e analytics por período
- V2-B2: Notificações realtime de novos pedidos (badge)
- V2-B3: Exportação CSV de pedidos
- V2-C1: Busca de produtos no web-client
- V2-C2: SEO e metatags dinâmicas por produto

**V3 Backlog (não iniciar até V2 completa):**
- Deploy automatizado (Vercel + Railway + GitHub Actions)
- Testes e2e Playwright
- Mobile app, WhatsApp automação, multi-tenant
- **ÚLTIMA FEAT V3: Mercado Pago (checkout online)**

**Out of scope (todos os versions):**
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

## Important Rules

1. **Language:** All code comments, variable names, and user-facing strings should stay in Portuguese (BR) to match the existing codebase.
2. **storeId isolation:** Never skip the `storeId` filter on partner queries — this is a security and data isolation requirement.
3. **Append-only logs:** Never UPDATE or DELETE `InventoryMovement` or `OrderEvent` records.
4. **Stub tracking:** When creating stub/mock responses, always set `meta.stub: true` in the response envelope so they can be easily found and replaced.
5. **Package manager:** Always use `pnpm` (via corepack), never `npm` or `yarn`.
6. **Node version:** Must be >=22.0.0.

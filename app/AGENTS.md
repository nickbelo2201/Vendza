# AGENTS.md

## Project Overview

`Vendza` is the official V1 monorepo for a commerce OS providing operational infrastructure + AI automation for any retail segment.

Core stack for V1:

- `Supabase` for managed auth/storage services
- `Fastify + TypeScript` for the central API
- `PostgreSQL + Prisma` for the operational data model
- `Redis` for cache, locks, and future jobs
- `Next.js App Router` for `web-client` and `web-partner`
- `Mercado Pago` as the only payment gateway in V1

## Mandatory Product Rules

- Build `backend first`.
- Keep the schema `tenant-ready`, but the initial deployment is `single-tenant`.
- `web-client` and `web-partner` must remain structurally correct before becoming visually polished.
- Final frontend visual implementation is blocked by a `design gate`.
- Do not implement WhatsApp agents, management agents, or other autonomous agents in V1.
- Use `bairro + raio` delivery coverage in V1. Do not introduce polygon coverage unless explicitly requested later.

## Design Gate

- The user must approve the frontend visual direction before final UI styling work starts.
- Until approval exists, frontend work should focus on:
  - route structure
  - state flow
  - forms
  - loading/error states
  - API integration points
- Do not spend time on high-fidelity marketing UI before that approval.

## Skills Policy

Treat these skills as mandatory guidance when they are available in the local Codex environment:

- `verification-before-completion`
- `supabase-postgres-best-practices`
- `prisma-database-setup`
- `fastify-best-practices`
- `nextjs-app-router-patterns`
- `nextjs-best-practices`

If a required skill is installed on disk but not active in the current session, read its `SKILL.md` directly before implementing the related area.

## Workspace Commands

- Install dependencies: `corepack pnpm install`
- Run all dev processes: `corepack pnpm dev`
- Run type checks: `corepack pnpm typecheck`
- Build the workspace: `corepack pnpm build`
- Run database generate: `corepack pnpm --filter @vendza/database db:generate`
- Run database migrations: `corepack pnpm --filter @vendza/database db:migrate`
- Seed local data: `corepack pnpm --filter @vendza/database db:seed`

## Monorepo Layout

```text
app/
  apps/
    api/
    web-client/
    web-partner/
    mobile/
  packages/
    database/
    types/
    ui/
    utils/
  infra/
    docker/
    terraform/
  docs/
```

## Code Style

- Use TypeScript everywhere.
- Prefer `Server Components` in Next.js by default; use client components only when interactivity is required.
- Prefer `TypeBox` schemas for Fastify route validation.
- Keep route registration grouped by domain.
- Keep money values in integer cents.
- Keep audit/event tables append-only by design.
- Use ASCII by default in source files.

## Verification

- Do not claim success without running fresh verification commands.
- Minimum verification for scaffold changes is:
  - `corepack pnpm install`
  - `corepack pnpm typecheck`
- If a command fails, report the failure precisely instead of implying completion.

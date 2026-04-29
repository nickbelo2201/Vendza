# Vendza — Monorepo

Vendza é um Commerce OS para lojistas: canal direto de vendas, painel operacional, CRM nativo e automação por eventos.

Este diretório é a raiz do monorepo. Todo o desenvolvimento do produto acontece aqui.

---

## Arquitetura

```
app/
  apps/
    api/            Fastify 5 + TypeScript — porta 3333
    web-client/     Next.js 15 — porta 3000 (vitrine do cliente)
    web-partner/    Next.js 15 — porta 3001 (painel do parceiro)
  packages/
    database/       Prisma 7 + schema + migrations + seed
    types/          Tipos TypeScript compartilhados
    ui/             Componentes compartilhados
    utils/          Utilitários (formatCurrency, etc.)
  infra/
    docker/         docker-compose (Postgres 16, Redis 7)
    terraform/      IaC
  docs/             Documentacao tecnica e estrategica (PT-BR)
  prd.json          Stories V1 e V2 com status de conclusao
  progress.txt      Log de progresso dos agentes
```

---

## Tech stack

| Camada      | Tecnologia                                         |
|-------------|----------------------------------------------------|
| Backend     | Fastify 5, TypeScript 6, Node >=22                 |
| ORM         | Prisma 7 (`@prisma/adapter-pg`)                    |
| Banco       | Supabase PostgreSQL                                |
| Auth        | Supabase Auth (Bearer tokens)                      |
| Frontend    | Next.js 15, React 19, App Router                   |
| Monorepo    | pnpm 10 + Turbo 2.5                                |
| Validacao   | TypeBox (`@sinclair/typebox`)                      |
| Packages    | `@vendza/database`, `@vendza/types`, `@vendza/ui`, `@vendza/utils` |

---

## Status atual

**V1 — Concluida (2026-04-06)**
Todas as 20 stories da V1 estao completas e em producao.

**V2 — Concluida (2026-04-06)**
Painel de pedidos, CRUD de produtos e categorias, CRM de clientes, configuracoes de loja, relatorios, notificacoes realtime, exportacao CSV e busca de produtos — todos entregues.

**Pendente**
- GitHub Actions CI
- Testes Playwright (e2e)
- Logo oficial
- Responsividade mobile completa

---

## Quickstart

### Pre-requisitos

- Node >= 22
- pnpm via corepack (`corepack enable`)
- Projeto no Supabase com banco PostgreSQL e Auth ativados

### Passos

```bash
# 1. Instalar dependencias
corepack pnpm install

# 2. Configurar variaveis de ambiente
cp .env.example .env
# Preencher: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#            DATABASE_URL, DIRECT_URL, STORE_SLUG

# 3. Gerar o client Prisma
corepack pnpm db:generate

# 4. Rodar as migrations e o seed inicial
corepack pnpm db:migrate
corepack pnpm db:seed

# 5. Iniciar todos os servidores
corepack pnpm dev
```

---

## Comandos principais

```bash
# Desenvolvimento
corepack pnpm dev              Inicia api, web-client e web-partner em paralelo
corepack pnpm dev:api          Somente a API (porta 3333)
corepack pnpm dev:web-partner  Somente o painel parceiro (porta 3001)
corepack pnpm dev:web-client   Somente a vitrine do cliente (porta 3000)

# Qualidade
corepack pnpm typecheck        Validacao TypeScript — deve passar com 0 erros
corepack pnpm build            Build de todos os pacotes e apps
corepack pnpm lint             Linting

# Banco de dados
corepack pnpm db:generate      Regenera o client Prisma apos mudancas no schema
corepack pnpm db:migrate       Executa migrations pendentes
corepack pnpm db:seed          Popula o banco com dados iniciais
```

---

## Workflow de branches

`main` e o branch de producao. Push em `main` dispara deploy automatico no Railway e na Vercel.

**Regra obrigatoria: nunca commitar ou fazer push direto em `main`.**

```bash
git checkout -b feat/nome-da-mudanca
# implementa, testa, faz commit
corepack pnpm typecheck        # deve passar antes do push
git push origin feat/nome-da-mudanca
# abre PR — merge feito exclusivamente pelo fundador
```

---

## Ambientes de producao

| Servico     | URL                                              | Plataforma |
|-------------|--------------------------------------------------|------------|
| API         | https://vendza-production.up.railway.app         | Railway    |
| web-partner | https://web-partner-three.vercel.app             | Vercel     |

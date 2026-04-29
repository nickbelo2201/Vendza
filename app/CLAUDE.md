# Vendza — Ralph Agent Instructions

> ATENCAO: NUNCA fazer push para `main`. Todo desenvolvimento vai via feature branch -> PR -> fundador (Nicholas Belo) testa na preview URL -> fundador faz merge e push para main pessoalmente. Ha um pre-push hook que bloqueia pushes diretos para main.

Você é um agente de código autônomo trabalhando no projeto **Vendza**, um Commerce OS para lojistas.

> **V1 ENCERRADA (2026-04-06):** Todas as 20 stories da V1 estão completas e em produção (commit `f2c7c23`).

> **V2 ENCERRADA (2026-04-29):** Todas as stories da V2 estão completas e em produção com clientes reais. O produto está operacional.

> **DESIGN AUTORIZADO (2026-04-02):** O cliente autorizou explicitamente a implementação visual completa do frontend. NÃO use placeholders, `designGateNotice`, nem textos de "bloqueio de design". Aplique o Brand Bible completo em todas as páginas sem aguardar aprovação adicional. O `designGateNotice` do pacote `@vendza/ui` está OBSOLETO — nunca o utilize.

---

## REGRA ABSOLUTA — WORKFLOW DE BRANCHES

**NUNCA fazer push direto para `main`.** O pre-push hook bloqueia automaticamente.

```bash
# Fluxo correto para qualquer implementação:
git checkout -b feat/nome-da-feature   # 1. criar branch
git add <arquivos>                      # 2. implementar e commitar
git commit -m "feat: descrição"
git push origin feat/nome-da-feature   # 3. push para o branch (NÃO para main)
# 4. Abrir PR → fundador testa na preview URL → fundador faz merge
```

**O agente NUNCA deve executar `git push origin main`.**

---

## REGRA OBRIGATÓRIA — ORQUESTRAÇÃO E DESIGN

### 1. Implementação de código → sempre via /nicholas-orchestrator

**NUNCA implemente código diretamente sem passar pelo nicholas-orchestrator.**

Toda implementação de feature, correção de bug, refactor ou adição de rota DEVE ser delegada ao sistema `nicholas-orchestrator` (`~/.agents-global/nicholas.aios-agents/`), que roteia para os agentes especializados corretos (backend, frontend, testes, segurança, etc.).

Como invocar: use o skill `/nicholas-orchestrator` descrevendo a tarefa. Ele coordena os agentes e retorna o resultado consolidado.

Exceção: alterações triviais de 1-2 linhas (ex: corrigir um typo, trocar um token de cor) podem ser feitas diretamente.

### 2. Design de páginas → sempre com o time de design (Caio-Marketing)

**NUNCA crie ou modifique a aparência visual de uma página sem consultar o time de design.**

Sempre que uma tarefa envolver:
- Criar uma nova página ou tela
- Modificar layout, cores, tipografia ou componentes visuais
- Definir estrutura de UI (cards, tabelas, formulários, modais)
- Criar um novo padrão visual

Invoque o agente `@rafael` (Brand Designer) ou o orquestrador `@caio` para garantir que o resultado seja consistente com o Brand Bible, a paleta oficial e as diretrizes tipográficas do projeto.

O time de design disponível:
- `@caio` — orquestrador de brand strategy e Brand Bible completo
- `@rafael` — Brand Designer (paleta, tipografia, componentes, brandbook)
- `@marina` — ângulos de comunicação e ICP
- `@lucas` — copywriting, manifesto, taglines
- `@beatriz` — pesquisa de mercado e concorrentes

---

## Sua Tarefa

1. Leia `prd.json` (neste diretório) para ver as user stories e seus status
2. Leia `progress.txt` (neste diretório) — especialmente a seção `## Codebase Patterns`
3. Crie um feature branch com nome adequado: `git checkout -b feat/nome-da-story`
4. Escolha a **story de maior prioridade** com `passes: false`
5. Implemente **somente essa story**
6. Rode os quality checks (abaixo)
7. Se checks passarem, faça commit de TODAS as mudanças
8. Faça push do branch: `git push origin feat/nome-da-story`
9. Marque `passes: true` no prd.json para a story concluída
10. Appende seu progresso em `progress.txt`
11. Se todas as stories tiverem `passes: true`, responda com `<promise>COMPLETE</promise>`

**Stories prioritárias no momento (consultar prd.json para detalhes):**
- P3-03: GitHub Actions CI (typecheck + build no PR)
- P4-01: Playwright — setup e testes e2e básicos
- P4-03: Playwright — testes do fluxo de checkout
- P5-01: Design system — atualização de logo e identidade
- P5-02: Design system — componentes visuais revisados
- P2-08: Storefront — carrinho via localStorage
- P2-09: Storefront — persistência de sessão no web-client

---

## Projeto: estrutura e localização

```
INF_Adega_Oficial/
├── app/                    <- RAIZ DO MONOREPO (trabalhe aqui)
│   ├── apps/
│   │   ├── api/            <- Fastify 5 + TypeScript — porta 3333
│   │   ├── web-client/     <- Next.js 15 — porta 3000 (vitrine cliente)
│   │   └── web-partner/    <- Next.js 15 — porta 3001 (painel parceiro)
│   ├── packages/
│   │   ├── database/       <- Prisma 7 + schema
│   │   ├── types/          <- Tipos compartilhados
│   │   ├── ui/             <- Componentes compartilhados
│   │   └── utils/          <- Utilitários (formatCurrency etc)
│   ├── prd.json            <- Stories do produto (V1/V2 completas, próximas pendentes)
│   ├── progress.txt        <- Log de progresso
│   └── CLAUDE.md           <- Este arquivo
└── .git/                   <- Git repo (um nível acima de app/)
```

**IMPORTANTE:** O git root está em `../` (um nível acima). Comandos git funcionam normalmente de dentro de `app/`.

---

## Quality Checks (OBRIGATÓRIO antes de commitar)

```bash
# Rodar a partir de app/
cd "C:/Users/USER/OneDrive/Área de Trabalho/INF_Adega/INF_Adega_Oficial/app"

# Typecheck (DEVE passar com 0 erros)
corepack pnpm typecheck

# Build (obrigatório nas stories de infra/CI)
corepack pnpm build
```

Se typecheck falhar, corrija os erros antes de commitar. Nunca comite código com erros TypeScript.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Fastify 5, TypeScript 6, Node >=22 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Banco | Supabase PostgreSQL |
| Auth | Supabase Auth (Bearer tokens) |
| Frontend | Next.js 15, React 19, App Router |
| Monorepo | pnpm 10 + Turbo 2.5 |
| Packages | `@vendza/database`, `@vendza/types`, `@vendza/ui`, `@vendza/utils` |

---

## Convenções críticas

### API (Fastify)

**Toda resposta usa envelope:**
```typescript
import { ok } from "../../lib/http.js";
// ok(data, { stub: false }) → { data, meta: { requestedAt, stub: false }, error: null }
```

**storeId NUNCA vem do body** — sempre do `partnerContext` (rotas autenticadas) ou resolvido pelo `STORE_SLUG` env (rotas públicas/storefront).

**Como resolver storeId no storefront:**
```typescript
const store = await prisma.store.findFirst({ where: { slug: process.env.STORE_SLUG } });
if (!store) return reply.code(503).send(...);
const storeId = store.id;
```

**Import do Prisma client:**
```typescript
import { prisma } from "@vendza/database";
```

**Append-only:** `InventoryMovement` e `OrderEvent` NUNCA são atualizados/deletados, apenas criados.

**Extensões de arquivo:** imports de arquivos locais usam `.js` mesmo sendo `.ts` (ESM):
```typescript
import { ok } from "../../lib/http.js"; // não .ts
```

### Banco de dados (schema atual)

**Tabelas em snake_case** no PostgreSQL, mas Prisma mapeia para camelCase no código.

**Modelos principais para storefront:**
- `Store` → `store_id`, `slug`, `name`, `whatsappPhone`, `status`, `minimumOrderValueCents`
- `Category` → `id`, `storeId`, `name`, `slug`, `isFeatured`
- `Product` → `id`, `storeId`, `categoryId`, `name`, `slug`, `listPriceCents`, `salePriceCents`, `isAvailable`, `isFeatured`
- `Customer` → `id`, `storeId`, `name`, `phone` (único por store), `email`
- `Order` → `id`, `storeId`, `customerId`, `publicId`, `status`, `channel`, `paymentMethod`, + campos snapshot
- `OrderItem` → `id`, `orderId`, `productId`, `productName`, `quantity`, `unitPriceCents`, `totalPriceCents`
- `OrderEvent` → `id`, `orderId`, `type`, `note`, `createdAt`
- `DeliveryZone` → `id`, `storeId`, `label`, `feeCents`, `etaMinutes`, `mode`, neighborhoods via `DeliveryZoneNeighborhood`

**Para gerar publicId sequencial:**
```typescript
const count = await prisma.order.count({ where: { storeId } });
const publicId = `PED-${String(count + 1).padStart(4, '0')}`;
```

### Frontend (Next.js)

**Server Components** para data fetching. **Client Components** (`"use client"`) para interatividade.

**NUNCA passar event handlers de Server Component para Client Component via props** — isso quebra. Se precisar de hover, use CSS classes.

**Path alias:** `@/*` → `./src/*`

**Shared packages** são importados como `@vendza/utils`, `@vendza/types` etc.

**fetchAPI no web-partner** (já existe em `apps/web-partner/src/lib/api.ts`):
```typescript
import { fetchAPI } from "../../lib/api";
const data = await fetchAPI<T>("/partner/endpoint");
```

**Para web-client** (criar `apps/web-client/src/lib/api.ts`):
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
export async function fetchStorefront<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data as T;
}
```

### Design System — Brand Bible

**Tokens obrigatórios:**
```css
--cream: #F7F3EE;      /* Cream Canvas — background geral */
--green: #2D6A4F;      /* Adega Green — CTAs primários */
--amber: #E07B39;      /* Vitoria Amber — destaques, badges */
--blue: #1B3A4B;       /* Nucleus Blue — sidebar, headers escuros */
--carbon: #1A1A2E;     /* texto principal */
--text-muted: #6B7280; /* texto secundário */
--surface: #FFFFFF;    /* superfície de cards */
```

**Tipografia:**
```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

font-family: 'Inter', sans-serif;    /* body */
font-family: 'Space Grotesk', sans-serif; /* valores numéricos, slugs */
```

**Web-client** usa prefixo `.wc-*` para classes CSS.
**Web-partner** usa prefixo `.wp-*` para classes CSS.

---

## REGRAS DE ISOLAMENTO — OBRIGATÓRIO

**NUNCA viole estas regras. São não-negociáveis:**

- **Stories de web-client:** NUNCA toque, modifique, mova, renomeie ou delete arquivos dentro de `apps/web-partner/`. Somente crie/edite arquivos em `apps/web-client/`.
- **Stories de API:** NUNCA delete arquivos existentes em `apps/web-client/` ou `apps/web-partner/`. Apenas adicione/edite arquivos em `apps/api/`.
- **Stories de infra/build:** Pode tocar todos os apps, mas NUNCA delete arquivos que já existem.
- **Regra geral:** Se uma story foca em um app específico, **apenas esse app** é tocado.
- **NUNCA delete arquivos existentes** sem certeza absoluta de que são obsoletos (ex: `page.tsx`, `layout.tsx`, `globals.css` são SEMPRE preservados).

---

## Gotchas conhecidos

1. **`"use client"` e event handlers:** Server Components não podem passar `onMouseEnter` etc. para tags HTML via props. Use CSS `:hover`.

2. **Prisma client em monorepo:** Sempre importar de `@vendza/database`, nunca diretamente do package.

3. **ESM imports:** Usar `.js` em imports locais mesmo que o arquivo seja `.ts`.

4. **storeId isolation:** Toda query Prisma em rotas partner DEVE ter `where: { storeId }`. Nunca confiar no storeId do request body.

5. **Socket.io com Next.js:** No web-client/partner, instanciar socket.io-client apenas no cliente (`"use client"` + `useEffect`). Nunca no servidor.

6. **Redis opcional:** Se `REDIS_URL` não estiver definida, a API deve iniciar normalmente (apenas logar warning). Não usar `!` em processo.env.REDIS_URL sem verificação.

7. **Carrinho no web-client:** Usar `localStorage` para persistência. Inicializar estado com `useState(() => carregarDoLocalStorage())` para evitar hidratação divergente.

8. **pnpm sempre via corepack:** Usar `corepack pnpm` não `pnpm` diretamente.

9. **Após mudança de schema Prisma:** Rodar DOIS comandos do diretório `app/`:
   ```bash
   corepack pnpm db:generate                          # Regenera os tipos TypeScript
   corepack pnpm --filter @vendza/database build      # Recompila o dist/ (obrigatório!)
   ```
   Se pular o `build`, a API usa o `dist/` antigo e `prisma.novoModelo` fica `undefined`.

10. **`db:migrate` (não `db:push`):** O projeto usa migrations (`db:migrate` para produção, `db:migrate:dev` para dev). O `db:push` foi desativado.

11. **JSX errors no typecheck do web-client:** Se aparecerem erros `TS7026: JSX element implicitly has type 'any'` ou `TS2591: Cannot find name 'process'`, verificar se o arquivo `apps/web-client/.next/types/routes.d.ts` existe. Se não existir, copiar de `apps/web-partner/.next/types/routes.d.ts`. NUNCA adicionar `"types": ["node", "react", "react-dom"]` ao tsconfig — isso quebra os imports do Next.js.

12. **vitest no web-partner:** Já instalado como devDependency. Se typecheck falhar com "cannot find module 'vitest'", rodar `corepack pnpm install` do diretório `app/`.

13. **Brand Bible — web-partner globals.css:** O arquivo `apps/web-partner/src/app/globals.css` contém o design system completo com tokens `--blue: #1B3A4B`, `--green: #2D6A4F`, `--amber: #E07B39`, `--cream: #F7F3EE`. NUNCA sobrescreva ou simplifique este arquivo — ele define toda a identidade visual do painel parceiro.

---

## Formato do commit

```
feat: [STORY-ID] - [Story Title]
```

Exemplo: `feat: P3-03 - GitHub Actions CI com typecheck e build`

---

## Formato do progress.txt

SEMPRE APPENDE (nunca sobrescreva):

```
## [ISO DateTime] - [Story ID]: [Story Title]
- O que foi implementado
- Arquivos criados/modificados
- **Learnings:**
  - Padrão descoberto X
  - Gotcha Y
---
```

---

## Stop Condition

Após completar uma story, verifique se TODAS têm `passes: true` no prd.json.

Se sim, responda com: `<promise>COMPLETE</promise>`

Se não, termine normalmente (próxima iteração pega a próxima story).

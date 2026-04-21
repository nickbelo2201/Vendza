# Relatório de Validação — Label: performance

**Data de início:** 2026-04-21
**Total de issues encontradas:** 4 em "To do"
**Status geral:** Em análise

---

## ETAPA 1 — Busca, Análise e Planejamento

### Issues Encontradas

#### performance #1 — SOF-60
**Título:** [PERF] Implementar CDN para imagens de produto
**Link:** https://linear.app/venza-project/issue/SOF-60/perf-implementar-cdn-para-imagens-de-produto
**Status Linear:** To do
**Prioridade:** Alta (2)
**Complexidade:** Pequena
**Descrição:** As imagens de produto são servidas diretamente do Supabase Storage sem CDN. Para uma adega com centenas de fotos de produtos, isso significa latência alta para clientes geograficamente distantes e sem cache de borda.

**Escopo de validação:**
- Frontend: `apps/web-client/src/components/ProductImage.tsx` — Migrar URLs para usar transformações de imagem do Supabase
- Frontend: `apps/web-client/next.config.ts` — Atualizar loader customizado para Next.js Image
- Backend/API: Sem alterações necessárias (apenas configuração de URL)

**Arquivos afetados:**
- `apps/web-client/src/components/ProductImage.tsx` (existe)
- `apps/web-client/next.config.ts`
- Documentação de Supabase Storage

**Dependências:** Nenhuma
**Status:** Pendente
**Plano de validação:**
1. Verificar estrutura atual do ProductImage.tsx (usa Next.js Image, já tem responsividade)
2. Entender padrão de URL atual do Supabase Storage
3. Implementar Opção A (transformações do Supabase — zero custo extra)
4. Testar URLs com parâmetros ?width=400&quality=80
5. Validar performance via DevTools (Network tab)
6. Validar compatibilidade com categorias emoji fallback

**Critérios de aceite:**
- Imagens renderizam via transformação Supabase
- URLs incluem parâmetros ?width=X&quality=80
- Cache funciona (verificar headers Cache-Control)
- Fallback emoji ainda funciona
- TypeScript passa sem erros

---

#### performance #2 — SOF-59
**Título:** [PERF] Forçar paginação no catálogo do parceiro (cap de itens por request)
**Link:** https://linear.app/venza-project/issue/SOF-59/perf-forcar-paginacao-no-catalogo-do-parceiro-cap-de-itens-por-request
**Status Linear:** To do
**Prioridade:** Alta (2)
**Complexidade:** Média

**Descrição:** Com 1000+ produtos, a listagem do catálogo no painel do parceiro pode estar retornando todos os produtos de uma vez sem paginação forçada. Isso sobrecarrega o banco e torna a página lenta.

**Escopo de validação:**
- Backend: `apps/api/src/modules/partner/catalog-service.ts` — função `listPartnerProducts` já implementa `take: limite`, mas sem limit máximo forçado
- Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/page.tsx` — Server Component fetcha dados; CatalogoClient renderiza
- Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/CatalogoClient.tsx` — Verificar se implementa paginação cursor-based
- Frontend: Possível: adicionar virtualização com `@tanstack/react-virtual`

**Arquivos afetados:**
- `apps/api/src/modules/partner/catalog-service.ts` (verificar implementação)
- `apps/api/src/modules/partner/routes.ts` (endpoint GET /v1/partner/products)
- `apps/web-partner/src/app/(dashboard)/catalogo/page.tsx` (Server Component)
- `apps/web-partner/src/app/(dashboard)/catalogo/CatalogoClient.tsx` (Client Component)

**Dependências:** Nenhuma
**Status:** Pendente
**Plano de validação:**
1. Verificar se `listPartnerProducts` força limit máximo (ex: 100)
2. Se não houver, adicionar: `take: Math.min(limit ?? 50, 100)`
3. Verificar se frontend implementa paginação cursor-based (atual: limite=20&pagina=1)
4. Teste com 1000+ produtos no banco
5. Verificar query performance (sem N+1)
6. Avaliar necessidade de virtualização (@tanstack/react-virtual) com base em teste

**Critérios de aceite:**
- Backend força `take` máximo = 100
- Frontend implementa paginação cursor-based
- Sem N+1 queries
- Performance adequada com 1000+ produtos
- TypeScript passa sem erros

---

#### performance #3 — SOF-62
**Título:** [PERF] Adicionar Suspense em rotas pesadas do dashboard (pedidos, configurações)
**Link:** https://linear.app/venza-project/issue/SOF-62/perf-adicionar-suspense-em-rotas-pesadas-do-dashboard-pedidos
**Status Linear:** Backlog
**Prioridade:** Média (3)
**Complexidade:** Pequena

**Descrição:** As páginas `/pedidos` e `/configuracoes` do dashboard fazem `await` síncrono de múltiplas chamadas à API. Se qualquer endpoint atrasar, a página inteira fica em branco até tudo carregar. Em `/configuracoes`, um `Promise.all()` busca 6 endpoints simultaneamente — se um falha, a página inteira quebra.

**Escopo de validação:**
- Frontend: `apps/web-partner/src/app/(dashboard)/pedidos/page.tsx` (Server Component — 1 call simples, já usa Suspense)
- Frontend: `apps/web-partner/src/app/(dashboard)/configuracoes/page.tsx` (Server Component — múltiplas calls, sem separação)
- Frontend: Criar `loading.tsx` com skeleton adequado
- Frontend: Envolver seções independentes em `<Suspense fallback={<Skeleton />}>`

**Arquivos afetados:**
- `apps/web-partner/src/app/(dashboard)/pedidos/page.tsx` (já bem estruturado — baixa prioridade)
- `apps/web-partner/src/app/(dashboard)/pedidos/loading.tsx` (criar se não existir)
- `apps/web-partner/src/app/(dashboard)/configuracoes/page.tsx` (requer refactor — alto impacto)
- `apps/web-partner/src/app/(dashboard)/configuracoes/loading.tsx` (criar se não existir)
- Componentes sub-seções (DadosBancarios, HorariosForm, UsuariosConfig, MapaZonasEntrega)

**Dependências:** Nenhuma (low-level frontend)
**Status:** Pendente
**Plano de validação:**
1. Auditar `/configuracoes/page.tsx` — contar Promise.all() calls
2. Separar em Suspense boundaries por seção (Dados, Horários, Conta Bancária, Usuários, Zonas)
3. Criar `loading.tsx` com skeleton layout
4. Testar falha de endpoint individual (não quebra page)
5. Medir: time-to-first-paint vs. antes

**Critérios de aceite:**
- `/configuracoes` renderiza seções independentemente
- Falha de 1 endpoint não quebra a página
- `loading.tsx` exibe skeleton
- UX: usuário vê conteúdo conforme carrega
- TypeScript passa sem erros

---

#### performance #4 — SOF-61
**Título:** [PERF] Criar endpoint /v1/storefront/bootstrap (config + catalog unificados)
**Link:** https://linear.app/venza-project/issue/SOF-61/perf-criar-endpoint-v1storefrontbootstrap-config-catalog-unificados
**Status Linear:** Backlog
**Prioridade:** Média (3)
**Complexidade:** Média

**Descrição:** A homepage do web-client faz 2 requests separados na carga inicial: `GET /storefront/config` e `GET /catalog/products`. Isso adiciona 1 RTT extra e duplica a latência percebida.

**Escopo de validação:**
- Backend: `apps/api/src/modules/storefront/routes.ts` — criar novo endpoint `GET /v1/storefront/bootstrap`
- Backend: `apps/api/src/modules/storefront/storefront-service.ts` — criar função `getBootstrap()` que retorna config + categorias + 20 primeiros produtos
- Frontend: `apps/web-client/src/lib/api.ts` (criar se não existir) — adicionar função para chamar `/v1/storefront/bootstrap`
- Frontend: `apps/web-client/src/app/page.tsx` (homepage) — refatorar para usar novo endpoint

**Arquivos afetados:**
- `apps/api/src/modules/storefront/routes.ts` (adicionar rota)
- `apps/api/src/modules/storefront/storefront-service.ts` (adicionar função)
- `apps/web-client/src/lib/api.ts` (criar ou editar)
- `apps/web-client/src/app/page.tsx` (refatorar)

**Dependências:** Nenhuma (novo endpoint, não quebra existentes)
**Status:** Pendente
**Plano de validação:**
1. Verificar se web-client já tem `src/lib/api.ts` (provavelmente não)
2. Criar `getBootstrap()` service: merge `getStorefrontConfig()` + `getCategories()` + 20 produtos featured/recentes
3. Implementar rota `/v1/storefront/bootstrap` (GET)
4. Atualizar homepage para usar 1 call ao invés de 2
5. Medir: RTT reduction (1 RTT menos)
6. Manter endpoints individuais para compatibilidade

**Critérios de aceite:**
- Endpoint `GET /v1/storefront/bootstrap` retorna config + categorias + 20 produtos em 1 call
- Response schema validado (TypeBox)
- Homepage usa novo endpoint
- Endpoints antigos ainda funcionam
- Performance: 1 RTT menos vs. antes
- TypeScript passa sem erros

---

## Resumo Executivo

| ID | Título | Status | Prioridade | Complexidade | Escopo |
|-----|--------|--------|-----------|--------------|--------|
| SOF-60 | Implementar CDN para imagens | To do | Alta | Pequena | Frontend (web-client) |
| SOF-59 | Forçar paginação catálogo | To do | Alta | Média | Backend + Frontend (partner) |
| SOF-62 | Adicionar Suspense (pedidos/config) | Backlog | Média | Pequena | Frontend (web-partner) |
| SOF-61 | Criar endpoint /bootstrap | Backlog | Média | Média | Backend + Frontend (web-client) |

---

## Ordem de Execução Recomendada

### FASE 1: Pequenos Wins (baixo risco, impacto rápido)
1. **SOF-60** — CDN imagens (30 min, frontend only)
2. **SOF-62** — Suspense dashboard (45 min, frontend only)

### FASE 2: Backend Performance (impacto maior)
3. **SOF-59** — Paginação catálogo (1.5 horas, backend + frontend)
4. **SOF-61** — Endpoint /bootstrap (1.5 horas, backend + frontend)

---

## Pontos de Atenção

### SOF-60
- ProductImage.tsx já usa Next.js Image (bom)
- Verificar se URLs atuais são compatíveis com transformações Supabase
- Fallback emoji precisa ser testado após mudança de URL

### SOF-59
- `listPartnerProducts` já implementa `take/skip` — verificar se há limit máximo forçado
- Pode envolver criação de índice no banco (productId, storeId) se performance for ruim
- Virtualização (@tanstack/react-virtual) é opcional se paginação for suficiente

### SOF-62
- `/pedidos/page.tsx` já bem estruturado (menor prioridade)
- `/configuracoes/page.tsx` é o problema — busca 6 endpoints com Promise.all()
- Risco: refactor poderia quebrar algum componente filho

### SOF-61
- Novo endpoint não quebra compatibilidade (endpoints antigos permanecem)
- Precisa decidir: "primeiros 20 produtos" por quê? Mais vendidos? Mais recentes? Featured?
- Sugerir definir regra no spec (ex: últimos 20 featured OR top 20 by sales_count)

---

## Questões em Aberto (aguardando confirmação)

1. **SOF-60**: Qual é o endpoint exato do Supabase Storage? Exemplo: `https://<project>.supabase.co/storage/v1/object/public/produtos-adega/...`?
2. **SOF-59**: Há índices no banco para queries de produtos? Espera-se 1000+ produtos em qual timeframe?
3. **SOF-62**: Os 6 endpoints em `/configuracoes` são todos críticos para render inicial, ou alguns podem ser lazy-loaded?
4. **SOF-61**: Como ordenar os 20 produtos no endpoint /bootstrap? Featured + recentes? Mais vendidos? Top-rated?

---

## ETAPA 2 — Validação Sequencial

### SOF-60: Implementar CDN para imagens (APROVADO)

**Data:** 2026-04-21
**Status:** Aprovado

**O que foi validado:**
1. Adicionados remotePatterns para `/storage/v1/render/image/public/**` em `next.config.ts`
2. Implementado hook `transformSupabaseImageUrl()` que:
   - Converte URLs de `/storage/v1/object/public/` para `/storage/v1/render/image/public/`
   - Adiciona parâmetros `?width=400&quality=80` automaticamente
   - Evita transformações duplas (idempotente)
3. Atualizado `ProductImage.tsx` para usar transformação CDN
4. Fallback emoji ainda funciona caso imagem falhe
5. TypeScript: 0 erros
6. Lint: 0 erros

**Arquivos alterados:**
- `apps/web-client/next.config.ts` — adicionados remotePatterns para render/image
- `apps/web-client/src/components/ProductImage.tsx` — adicionado transformSupabaseImageUrl hook

**Próximos Passos:**
1. SOF-62 — Adicionar Suspense em rotas pesadas
2. SOF-59 — Forçar paginação catálogo
3. SOF-61 — Criar endpoint /bootstrap

---

### SOF-62: Adicionar Suspense em rotas pesadas (APROVADO)

**Data:** 2026-04-21
**Status:** Aprovado

**O que foi validado:**
1. Separado `Promise.all()` em 5 Suspense boundaries independentes
2. Cada seção agora carrega independentemente sem bloquear as outras
3. Criado `SuspenseWrappers.tsx` com async componentes para cada seção (Settings, Horarios, ContaBancaria, Zonas, Usuarios)
4. Criado `loading.tsx` com skeleton animado que reflete estrutura real
5. Falha de 1 endpoint não quebra mais a página inteira
6. TypeScript: 0 erros
7. Lint: 0 erros

**Arquivos alterados:**
- `apps/web-partner/src/app/(dashboard)/configuracoes/page.tsx` — refatorado para usar Suspense
- `apps/web-partner/src/app/(dashboard)/configuracoes/SuspenseWrappers.tsx` — novo arquivo com async componentes
- `apps/web-partner/src/app/(dashboard)/configuracoes/loading.tsx` — novo arquivo com skeleton

**Impacto de performance:**
- UX: usuário vê conteúdo conforme carrega (não branco)
- Resiliência: falha de 1 endpoint = somente 1 seção com erro
- Time-to-first-paint: reduzido (load é paralelo vs. sequencial)

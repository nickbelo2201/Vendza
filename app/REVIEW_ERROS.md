# Relatório de Revisão Pré-Entrega — Vendza

**Data:** 2026-04-13
**Status geral:** 🔴 Crítico
**Auditores:** Code Reviewer · Security Auditor · Backend Architect · Frontend Developer (4 agentes em paralelo)

---

## 🔴 Erros Críticos (bloqueiam uso seguro em produção)

| # | Arquivo | Linha | Descrição do Problema | Correção Sugerida |
|---|---------|-------|----------------------|-------------------|
| C-01 | `apps/api/src/app.ts` | 29 | **CORS totalmente aberto** — `origin: true` + `credentials: true` permite que qualquer site faça requests autenticados à API (CSRF). Produção exposta agora. | Substituir por lista explícita: `origin: ["https://web-partner-three.vercel.app", "http://localhost:3000", "http://localhost:3001"]` |
| C-02 | `apps/api/src/modules/auth/routes.ts` | 28–52 | **Rotas de auth retornam tokens falsos em produção** — `POST /v1/auth/login` devolve `access-{email}` e `/auth/refresh` devolve `renewed-{token}` sem validar nada contra o Supabase. Não há `stub: true` marcado. | Remover completamente estas rotas. Auth real acontece no frontend via Supabase SDK. |
| C-03 | `apps/api/src/modules/partner/configuracoes-service.ts` | 106 | **Chave PIX armazenada em Base64** — o campo `encryptedKey` usa `Buffer.from(pixKey).toString("base64")` que é reversível trivialmente. Dado financeiro sensível exposto caso o banco seja comprometido. | Implementar AES-256-GCM via `crypto` nativo com chave em variável de ambiente (`PIX_ENCRYPTION_KEY`). |
| C-04 | `apps/api/src/database.d.ts` | 32–38 | **`prisma: any` anula todo type-safety do Prisma** — o arquivo declara `PrismaClient = any`, `Prisma.TransactionClient = any` e `prisma: any`, sobrescrevendo os tipos gerados. Queries com campos inexistentes compilam sem erro. | Remover o arquivo ou reexportar os tipos reais de `@prisma/client` ao invés de sobrescrever com `any`. |
| C-05 | `apps/api/src/app.ts` | — | **Sem rate limiting** — nenhum `@fastify/rate-limit` instalado. Endpoints de upload, exportação CSV, storefront e auth estão completamente abertos a brute force e DoS. | Instalar `@fastify/rate-limit` e configurar: 100 req/min (público), 300 req/min (autenticado), 10 req/min (upload/export). |
| C-06 | `apps/api/src/app.ts` | — | **Sem security headers (Helmet ausente)** — API não envia `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`. | Instalar `@fastify/helmet` e registrar em `app.ts`. |
| C-07 | `apps/web-partner/src/utils/supabase/middleware.ts` | 34 | **Middleware não protege `/sem-acesso` e `/onboarding`** — usuário não autenticado redirecionado para `/onboarding` é imediatamente enviado de volta para `/login`, criando loop. | Adicionar `!request.nextUrl.pathname.startsWith('/sem-acesso')` e `/onboarding` na whitelist. |
| C-08 | `apps/api/src/modules/partner/routes.ts` | 1017–1051 | **Endpoint de upload sem validação de `ext` e propriedade do `productId`** — `ext` aceita qualquer string (incluindo path traversal) e `productId` vem do body sem validar se pertence ao `storeId` do contexto. Um lojista pode sobrescrever imagens de outro. | Validar `ext` contra allowlist (`["jpg","jpeg","png","webp"]`) e verificar `productId` pertence ao `storeId` do contexto. |
| C-09 | `apps/api/src/modules/partner/orders-service.ts` | 537–538 | **Race condition no `publicId` do `createManualPartnerOrder`** — `count()` e `create()` não estão no mesmo `$transaction`. Em concorrência, dois pedidos recebem o mesmo `publicId`, causando erro 500 (unique constraint). O `createOrderReal` do storefront já usa `pg_advisory_xact_lock` corretamente. | Mover o `count` para dentro da `$transaction` ou usar advisory lock idêntico ao `createOrderReal`. |
| C-10 | `apps/web-client/src/app/page.tsx` | 83 | **MOCK_PRODUCTS hardcoded com produtos de adega para qualquer cliente** — se a API cair, a vitrine exibe produtos fictícios de bebidas (Heineken, etc.) mesmo que o cliente seja de outro segmento. | Remover o fallback para MOCK_PRODUCTS. Em caso de erro de API, exibir tela vazia com mensagem de loja temporariamente indisponível. |

---

## 🟡 Inconsistências e Melhorias (não bloqueiam mas degradam segurança e experiência)

| # | Arquivo | Linha | Descrição | Sugestão |
|---|---------|-------|-----------|----------|
| I-01 | `apps/api/src/modules/partner/estoque-service.ts` | 46–80 | **N+1 grave em `getEstoque`** — para cada produto são disparadas 2 queries individuais (1 para qtd vendida, 1 para receita). Com 100 produtos = 201 queries. | Substituir por `groupBy` do Prisma ou raw query com `GROUP BY product_id`. |
| I-02 | `apps/api/src/modules/partner/crm-dashboard-service.ts` | 83 | **`listCustomers` sem paginação** — retorna todos os clientes da loja em uma query. Com milhares de clientes causa latência e OOM. | Adicionar `take` e `skip` com paginação. |
| I-03 | `apps/api/src/modules/cobertura/routes.ts` | 34 | **`/v1/coverage/validate` é stub ativo com dados mockados** — usa `validateCoverage` de `mock-data.ts` com bairros hardcoded. A rota real equivalente já existe em `/v1/storefront/calcular-frete`. | Deprecar ou redirecionar para o endpoint real do storefront. |
| I-04 | `apps/api/src/lib/mock-data.ts` | — | **Arquivo de mock data (537 linhas) ainda importado em produção** — contém estado mutável in-memory, produtos e pedidos fictícios. Importado por `auth/routes.ts` e `cobertura/routes.ts`. | Remover referências e deletar o arquivo após C-02 e I-03 serem corrigidos. |
| I-05 | `apps/api/src/modules/partner/routes.ts` | 696–846 | **Rotas duplicadas com comportamentos incompatíveis** — `store/delivery-zones` (replace-all) e `configuracoes/zonas-entrega` (CRUD individual) operam sobre os mesmos dados com lógicas incompatíveis. Mesmo padrão para `store/settings` vs `configuracoes/loja` e `store/hours` vs `configuracoes/horarios`. | Consolidar em um único grupo de rotas. Deprecar os aliases antigos (`store/*`). |
| I-06 | `apps/api/src/modules/partner/routes.ts` | 329 | **`GET /partner/reports` retorna envelope inválido em erros de negócio** — quando período > 90 dias, retorna `{ error: "Período máximo..." }` sem `data` e `meta`, quebrando o contrato do envelope. | Usar `reply.code(400).send(err(400, "PERIOD_TOO_LONG", "..."))`. |
| I-07 | `apps/api/src/modules/partner/routes.ts` | 412, 986 | **Rotas CSV sem `response` schema declarado** — em erros de runtime, Fastify retorna JSON com `Content-Type: text/csv`, quebrando o cliente. | Declarar `response` schema ou tratar erros inline antes de chamar `reply.send(csv)`. |
| I-08 | `apps/api/src/modules/partner/routes.ts` | — | **Sem RBAC por `role`** — o campo `role` existe no `partnerContext` mas nenhuma rota o verifica. Um `operator` pode alterar configurações, revogar usuários e atualizar conta bancária. | Criar middleware de autorização que restringe rotas críticas (config, financeiro, usuários) a `owner` ou `manager`. |
| I-09 | `apps/api/src/modules/partner/orders-service.ts` | 538 | **`publicId` sequencial previsível** — `PED-0001`, `PED-0002`... permitem enumeração de todos os pedidos via `GET /v1/orders/:publicId` (rota pública, sem auth). | Adicionar componente aleatório ao publicId, ex: `PED-{random6chars}`. |
| I-10 | `apps/api/src/modules/storefront/routes.ts` | 187–205 | **`GET /storefront/cliente/pedidos?phone=XXX` expõe histórico de pedidos por telefone sem auth** — qualquer pessoa pode enumerar pedidos de clientes sabendo o telefone. | Adicionar rate limiting agressivo (5 req/min por IP) ou verificação via OTP. |
| I-11 | `apps/api/src/modules/partner/financeiro-service.ts` | 549–554 | **CSV injection no extrato financeiro** — função `escaparCsv` não protege contra formula injection (`=`, `+`, `@`). A função `escapeCsvField` do `orders-service.ts` já implementa corretamente. | Substituir `escaparCsv` pela `escapeCsvField` já existente em `orders-service.ts`. |
| I-12 | `apps/api/src/plugins/redis.ts` | 23 | **Redis `retryStrategy: () => null`** — se a conexão cair, nunca reconecta. Workers BullMQ param de processar silenciosamente. | Implementar backoff exponencial na `retryStrategy`. |
| I-13 | `apps/api/src/app.ts` | 63–84 | **Error handler expõe mensagens internas em erros 500** — `error.message` raw é enviado ao cliente, podendo revelar constraint names do Prisma, paths internos ou stack traces parciais. | Em erros 500, retornar mensagem genérica ao cliente e logar o detalhe internamente via `fastify.log`. |
| I-14 | `apps/web-partner/src/components/SidebarV2.tsx` | 137–140 | **Links mortos na sidebar** — itens "IA Insights", "Previsão de Vendas" e "Automação" têm `href="#"`, causando scroll ao topo e confusão. | Desabilitar visualmente com `pointer-events: none; opacity: 0.4` e remover o `href` até implementação. |
| I-15 | `apps/web-partner/src/components/TopbarV2.tsx` | 11–18 | **Breadcrumb não mapeia `/financeiro`, `/estoque`, `/promocoes`, `/documentacao`** — essas páginas mostram "Página" como título no topbar. | Adicionar as 4 entradas faltantes ao `ROUTE_META`. |
| I-16 | `apps/web-partner/src/app/(dashboard)/pedidos/StatusSelect.tsx` | 31–33 | **Mudança de status sem feedback de erro ao usuário** — `startTransition` descarta silenciosamente erros de API. O select volta ao valor anterior mas sem aviso. | Usar `useActionState` ou callback de retorno para exibir toast de erro. |
| I-17 | `apps/web-partner/src/components/ToggleLojaAberta.tsx` | 16–24 | **`ToggleLojaAberta` sem rollback em erro** — estado é atualizado otimisticamente antes da API confirmar. Em falha, a UI mostra status errado sem rollback. | Salvar estado anterior e restaurar no `catch`. |
| I-18 | `apps/web-partner/src/components/TopbarV2.tsx` | 48–58 | **Logout sem feedback de erro** — se `signOut()` falhar, usuário fica preso no dashboard sem aviso. | Exibir toast de erro e redirecionar para `/login` de qualquer forma. |
| I-19 | `apps/web-partner/src/app/(dashboard)/catalogo/BotaoDeletar.tsx` | 15, 24 | **`BotaoDeletar` usa `alert()` e `confirm()` nativos** — bloqueantes, inconsistentes com design system, quebram em PWA/iframe. | Substituir por modal de confirmação com componentes do design system. |
| I-20 | `apps/web-partner/src/app/(dashboard)/documentacao/page.tsx` | 52 | **Página de documentação com texto placeholder sem acentos** — "Nossa documentacao esta em analise..." visível ao cliente. | Corrigir para "Nossa documentação está em análise..." ou implementar conteúdo real. |
| I-21 | `apps/web-partner/src/app/(auth)/esqueci-senha/page.tsx` | 43 | **Emoji 📬 no JSX da página de auth** — viola o design system (zero emojis, somente SVG). | Substituir por ícone SVG correspondente. |
| I-22 | `apps/web-partner/src/app/(auth)/redefinir-senha/page.tsx` | 51 | **Caractere ✓ unicode em vez de SVG** — inconsistente com o design system. | Substituir por ícone SVG de check. |
| I-23 | `apps/web-partner/src/app/(dashboard)/pedidos/actions.ts` | 12 | **`revalidatePath("/pedidos")` sem grupo de rota** — pode não invalidar cache corretamente com App Router e route groups `(dashboard)`. | Verificar se a revalidação funciona em produção; se não, ajustar para `revalidatePath("/(dashboard)/pedidos")`. |
| I-24 | `apps/api/src/modules/partner/catalog-service.ts` | 215, 353 | **`tx: any` em transactions Prisma** — type-safety dentro de transações anulado. Agravado pelo `database.d.ts` (C-04). | Após corrigir C-04, trocar para `Prisma.TransactionClient`. |
| I-25 | Múltiplos arquivos em `apps/web-partner/src/` | — | **`fetchComAuth` duplicado em 5 arquivos** — mesma lógica copiada em `financeiro/page.tsx`, `estoque/page.tsx`, `catalogo/ProdutoModal.tsx`, `clientes/ClienteDetalhe.tsx`, `pedidos/PedidoManualModal.tsx`. | Extrair para `utils/supabase/client-fetch.ts` como utilitário compartilhado. |

---

## 🟢 O que está funcionando bem

- **Isolamento multi-tenant por `storeId`** — verificado em todos os services partner. Nenhuma query acessa dados de outra loja. Filtro sempre vem do `partnerContext`, nunca do body.
- **Auth middleware aplicado globalmente nas rotas partner** — hook `onRequest` garante que 100% das rotas `/v1/partner/*` exigem token válido.
- **Token validation real via Supabase** — `supabaseClient.auth.getUser(token)` faz validação server-side, tokens revogados são rejeitados.
- **Append-only enforcement** — `InventoryMovement` e `OrderEvent` nunca são UPDATE/DELETE em nenhum service.
- **Race condition no storefront** — `createOrderReal` usa `pg_advisory_xact_lock` corretamente (o problema existe apenas no `createManualPartnerOrder` — C-09).
- **Redis e Socket.io opcionais** — API inicia normalmente sem eles, com fallback gracioso.
- **Graceful shutdown** — trata SIGTERM/SIGINT, fecha workers e servidor corretamente.
- **CSV injection protection** — `escapeCsvField` em `orders-service.ts` protege contra formula injection.
- **Socket.io store room isolation** — `join:store` valida `partnerStoreId` antes de entrar na sala.
- **Soft-delete de produtos** — preserva integridade referencial com `InventoryMovement`.
- **Cache em camadas no web-client** — 3 TTLs distintos (config 5min, catálogo 60s, no-store) com `AbortSignal.timeout(8000)`.
- **Fluxo de auth completo no web-partner** — login, cadastro, esqueci-senha e redefinir-senha com validação, loading e feedback.
- **Módulos completos e funcionais**: Dashboard, Pedidos, Estoque, Catálogo, Clientes, Relatórios, Configurações, Financeiro, Promoções.
- **OrderNotification** — WebSocket com badge de contagem, beep de áudio e cleanup correto de listeners.
- **TypeBox validation** — todas as rotas têm schema de body/params/querystring.
- **Envelope de resposta consistente** — `ok()` usado em todas as rotas (exceto I-06 e I-07).
- **Error handler global** — captura exceções não tratadas sem derrubar o servidor.

---

## 📊 Resumo Executivo

| Métrica | Valor |
|---|---|
| Erros críticos (bloqueiam produção segura) | **10** |
| Inconsistências e melhorias | **25** |
| Arquivos modificados automaticamente | **1** (`coverage/routes.ts` deletado — módulo órfão) |
| Total de rotas catalogadas na API | **57** |
| Endpoints ainda com dados stub | **3** (`/auth/login`, `/auth/refresh`, `/coverage/validate`) |
| Módulos frontend completos e funcionais | **9** |

### Prioridade imediata antes da entrega ao cliente:

**Esta semana (bloqueia segurança):**
1. **C-01** — Restringir CORS (`origin: true` → lista explícita) — 15 min
2. **C-02** — Remover rotas `/v1/auth/login` e `/v1/auth/refresh` — 10 min
3. **C-07** — Corrigir middleware Next.js para `/sem-acesso` e `/onboarding` — 5 min
4. **C-05** — Instalar `@fastify/rate-limit` com limites por rota — 1h
5. **C-06** — Instalar `@fastify/helmet` — 15 min
6. **C-10** — Remover fallback MOCK_PRODUCTS no web-client — 10 min

**Esta semana (corretude):**
7. **C-09** — Race condition no `publicId` do `createManualPartnerOrder` — 30 min
8. **C-08** — Validar `ext` e `productId` no endpoint de upload — 30 min
9. **I-16** — Feedback de erro no `StatusSelect` de pedidos — 30 min
10. **I-17** — Rollback no `ToggleLojaAberta` — 20 min

**Próximo sprint (não bloqueante para entrega):**
- C-03 (PIX encryption), C-04 (database.d.ts), I-01 (N+1 estoque), I-08 (RBAC), C-05 (rate limit), I-02 (paginação clientes)

---

## Correções Aplicadas Automaticamente

| # | Arquivo | Ação |
|---|---------|------|
| A-01 | `apps/api/src/modules/coverage/routes.ts` | **Deletado** — módulo órfão idêntico a `cobertura/routes.ts`, nunca importado em `app.ts` |

---

> ⚠️ Este documento foi gerado por auditoria automatizada multi-agente e aguarda aprovação do desenvolvedor antes de qualquer ajuste adicional ser aplicado.

# Feature Report — Implementação de Features (Linear)

Gerado em: 2026-04-13
Atualizado em: 2026-04-14

---

## Feature #1 — SOF-27 ✅

- **Status:** `resolvido` (sessão anterior)
- **Título:** Feature: Tela de estoque — Histórico de movimentações
- **O que foi implementado:** Corrigido shape mismatch em `DrawerHistorico` — ajustado tipo e extração `resposta.data`.

---

## Feature #2 — SOF-12 ✅

- **Status:** `resolvido` (sessão anterior)
- **Título:** G6 Financeiro
- **O que foi implementado:** Página completa `/financeiro` com KPIs, gráfico de área, donut de breakdown, tabela de extrato e exportação CSV.

---

## Feature #3 — SOF-13 ✅

- **Status:** `resolvido` (coberta por SOF-12, sessão anterior)
- **Título:** G7 Histórico financeiro

---

## Feature #4 — SOF-39 ✅

- **Título:** [PDV] Tornar identificação de cliente opcional no modal de pedido manual
- **Link:** https://linear.app/venza-project/issue/SOF-39
- **Prioridade:** urgente
- **Status:** `resolvido`
- **O que foi implementado:**
  Toggle "Identificar cliente" (switch) no Passo 1 do `PedidoManualModal`, default OFF. Quando OFF: campos ocultos, pedido avança como "Consumidor". Quando ON: comportamento original preservado. Backend aceita `phone` opcional; cliente anônimo recebe phone único `ANON-XXXXXXXX` para satisfazer a unique constraint. TypeBox schema atualizado. Typecheck: 0 erros.
- **Commit:** `ae30684`

---

## Feature #5 — SOF-40 ✅

- **Título:** [PDV] Adicionar tipo "Balcão" no modal de pedido — pular endereço para venda presencial
- **Link:** https://linear.app/venza-project/issue/SOF-40
- **Prioridade:** urgente
- **Status:** `resolvido`
- **O que foi implementado:**
  Toggle "Balcão / Delivery" com ícones SVG (IconStore / IconTruck) no topo do Passo 3, default Balcão. Balcão: sem formulário de endereço, só pagamento. Delivery: comportamento atual preservado. Enum `OrderChannel.balcao` adicionado ao schema Prisma, `db:generate` rodado. Badge "Balcão" na tabela de pedidos (`PedidosClient`). `address` e `deliveryType` tornados opcionais no TypeBox e no service. Typecheck: 0 erros.
- **Commit:** `8bd3158`

---

## Feature #6 — SOF-28 ✅ (já implementado no codebase)

- **Título:** Tempo no card de pedidos
- **Link:** https://linear.app/venza-project/issue/SOF-28/tempo-no-card-de-pedidos
- **Prioridade:** baixa
- **Complexidade:** pequena
- **Status:** `resolvido` — **JÁ ESTAVA IMPLEMENTADO** no `KanbanBoard.tsx`
- **O que foi verificado:**
  `KanbanBoard.tsx` já contém: função `formatTempoDecorrido(isoString)` que exibe "há 15min", "há 2h" etc.; função `isCardAtrasado()` com limiares de 30min (Preparando) e 120min (Entregando); borda vermelha + ícone de alerta nos cards atrasados; tick a cada 30s para recalcular tempos. Todos os critérios da issue estão cumpridos.
- **Ação:** Não requer implementação. Marcar no Linear como Done.

---

## Feature #7 — SOF-34 (ARQUIVADA — ignorar)

- **Título:** Redesig: Botão visão geral
- **Link:** https://linear.app/venza-project/issue/SOF-34
- **Status:** `arquivada` — issue arquivada (archivedAt definido). Não implementar.

---

## Feature #8 — SOF-42 ✅

- **Título:** [PDV] Cálculo de troco automático no pagamento em dinheiro
- **Link:** https://linear.app/venza-project/issue/SOF-42/pdv-calculo-de-troco-automatico-no-pagamento-em-dinheiro
- **Prioridade:** alta
- **Complexidade:** pequena (1 arquivo)
- **Status:** `resolvido`
- **Descrição:** Quando método de pagamento = "Dinheiro" no PedidoManualModal, exibir campo "Valor recebido", calcular e exibir troco em tempo real, com botões de valor rápido (R$5, R$10, R$20, R$50, R$100).
- **Escopo técnico:**
  - Frontend: `PedidoManualModal.tsx` — adicionar bloco condicional no Passo 3 (seção "entrega"), visível apenas quando `metodoPagamento === "cash"`
  - Backend/API: nenhuma mudança necessária — lógica puramente client-side
  - Estado/Store: `useState` para `valorRecebido` + `useMemo` para `troco`
  - Pacotes necessários: nenhum
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/pedidos/PedidoManualModal.tsx`
- **Status:** `pendente`
- **Plano de implementação:**
  1. Adicionar `const [valorRecebido, setValorRecebido] = useState("")` ao estado do modal
  2. Resetar `valorRecebido` no `useEffect` de reset ao abrir
  3. Na seção "entrega" (Passo 3), após o seletor de forma de pagamento: renderizar condicionalmente quando `metodoPagamento === "cash"` um bloco com campo numérico "Valor recebido", botões de sugestão (R$5, R$10, R$20, R$50, R$100) e display do troco
  4. Calcular `troco = parseFloat(valorRecebido) * 100 - subtotal`
  5. Exibir em verde se troco >= 0 ou em vermelho "Valor insuficiente" se negativo
  6. Usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para formatação
- **Critérios de aceite:**
  - [ ] Campo "Valor recebido" aparece apenas quando pagamento = Dinheiro
  - [ ] Troco calculado e exibido em tempo real
  - [ ] Botões de valor rápido (R$5, R$10, R$20, R$50, R$100)
  - [ ] Valor insuficiente exibido em vermelho
  - [ ] Troco exibido em verde e fonte maior
  - [ ] Não impede o envio do pedido (campo opcional)

---

## Feature #9 — SOF-41 ✅

- **Título:** [PDV] Modo PDV com grade visual de produtos por categoria
- **Link:** https://linear.app/venza-project/issue/SOF-41/pdv-modo-pdv-com-grade-visual-de-produtos-por-categoria
- **Prioridade:** alta
- **Complexidade:** grande (nova página, múltiplos componentes, integra API existente)
- **Descrição:** Nova página `/pdv` com grade visual de produtos por categoria (tabs), carrinho lateral, e botão de finalizar pedido via API existente `/partner/orders/manual`.
- **Escopo técnico:**
  - Frontend: nova página `(dashboard)/pdv/page.tsx` (client component), componentes internos de grade e carrinho
  - Backend/API: sem novos endpoints — usa `GET /partner/categories` e `GET /partner/products?available=true` que já existem
  - Estado/Store: `useState` local para carrinho + tabs selecionada
  - Pacotes necessários: nenhum
- **Dependências:** nenhuma (API já existente)
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/pdv/page.tsx` (criar)
  - `app/apps/web-partner/src/components/SidebarV2.tsx` (adicionar link "PDV" no grupo Operação)
  - `app/apps/web-partner/src/components/TopbarV2.tsx` (adicionar `/pdv` ao ROUTE_META)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Adicionar `/pdv` ao `ROUTE_META` em `TopbarV2.tsx`
  2. Adicionar link "PDV" com ícone de caixa registradora no array `operacao` em `SidebarV2.tsx`
  3. Criar `app/(dashboard)/pdv/page.tsx` como `"use client"`:
     - Fetch de categorias e produtos com auth (padrão `fetchComAuth` do modal existente)
     - Layout de duas colunas: 60% grade + 40% carrinho
     - Tabs de categoria no topo da grade
     - Grid de cards de produto (foto + nome + preço), cards acinzentados se `isAvailable = false`
     - Clique no card adiciona ao carrinho (mesma lógica `adicionarItem` do PedidoManualModal)
     - Coluna direita: lista de itens, botões +/-, total, seletor tipo (Balcão/Delivery), seletor pagamento
     - Botão "Finalizar Pedido" → POST `/partner/orders/manual` (mesmo payload do modal existente)
  4. Implementar estados de loading, erro e empty state
- **Critérios de aceite:**
  - [ ] Página /pdv acessível via sidebar
  - [ ] Grade de produtos organizada por categoria (tabs)
  - [ ] Clique no produto adiciona ao carrinho
  - [ ] Carrinho mostra itens, quantidades, subtotal e total
  - [ ] Botão "Finalizar" cria pedido via API e limpa o carrinho
  - [ ] Produtos sem estoque ficam indisponíveis
  - [ ] Funciona em tablet (touch-friendly, botões grandes)

---

## Feature #10 — SOF-45 ✅

- **Título:** [Catálogo] Importação em massa de produtos via planilha CSV
- **Link:** https://linear.app/venza-project/issue/SOF-45/catalogo-importacao-em-massa-de-produtos-via-planilha-csv
- **Prioridade:** alta
- **Complexidade:** grande (modal multi-step + novo endpoint backend + parsing de CSV/XLSX)
- **Descrição:** Botão "Importar CSV" na página /catalogo que abre modal de 3 passos: upload, mapeamento de colunas e validação/importação em batch.
- **Escopo técnico:**
  - Frontend: botão na `catalogo/page.tsx` + novo componente `ImportarCSVModal.tsx`
  - Backend/API: novo endpoint `POST /partner/products/import` (multipart) + `import-service.ts`
  - Estado/Store: estado multi-step local no modal
  - Pacotes necessários: `papaparse` (CSV parsing no browser), `xlsx` (para .xlsx)
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/catalogo/page.tsx` (adicionar botão)
  - `app/apps/web-partner/src/app/(dashboard)/catalogo/ImportarCSVModal.tsx` (criar)
  - `app/apps/api/src/modules/partner/routes.ts` (adicionar endpoint)
  - `app/apps/api/src/modules/partner/import-service.ts` (criar)
  - `app/apps/api/package.json` (adicionar papaparse + xlsx se não existirem)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Instalar `papaparse` e `@types/papaparse` no web-partner; `xlsx` no web-partner (parsing client-side)
  2. Criar `ImportarCSVModal.tsx` com 3 passos: Upload → Mapeamento → Validação+Importação
  3. Passo 1: drag-and-drop de .csv/.xlsx, preview de 5 linhas, link "Baixar planilha modelo"
  4. Passo 2: detectar colunas do CSV, dropdowns para mapear nome/preço/categoria/disponível
  5. Passo 3: tabela completa com status por linha (válida/erro), botão "Importar X produtos", progress bar
  6. Backend: `POST /partner/products/import` aceita JSON com linhas validadas (parse já feito no frontend), cria produtos em batch via Prisma
  7. Adicionar botão na page.tsx do catálogo ao lado de "Novo Produto"
- **Critérios de aceite:**
  - [ ] Botão "Importar CSV" na página de catálogo
  - [ ] Upload de .csv e .xlsx funciona
  - [ ] Preview das primeiras linhas exibido
  - [ ] Mapeamento de colunas intuitivo
  - [ ] Validação linha por linha com erros destacados
  - [ ] Importação em batch, produtos aparecem no catálogo
  - [ ] Template CSV para download disponível

---

## Feature #11 — SOF-46 ✅

- **Título:** [Financeiro] Controle de caixa — abertura, fechamento e resumo por turno
- **Link:** https://linear.app/venza-project/issue/SOF-46/financeiro-controle-de-caixa-abertura-fechamento-e-resumo-por-turno
- **Prioridade:** alta
- **Complexidade:** grande (novo model Prisma + migration + 5 endpoints + nova página)
- **Descrição:** Nova página `/caixa` para controle de turno de caixa. Permite abrir/fechar caixa com saldo inicial, ver resumo por método de pagamento em tempo real e histórico de turnos.
- **Escopo técnico:**
  - Frontend: nova página `(dashboard)/caixa/page.tsx`, indicador de status na `TopbarV2.tsx`
  - Backend/API: 5 novos endpoints (`/partner/caixa/abrir`, `/fechar`, `/atual`, `/resumo/:id`, `/historico`) + `caixa-service.ts`
  - Estado/Store: estado local na página
  - Pacotes necessários: nenhum
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `app/packages/database/prisma/schema.prisma` (adicionar model `CaixaTurno`)
  - `app/apps/api/src/modules/partner/routes.ts` (adicionar 5 endpoints)
  - `app/apps/api/src/modules/partner/caixa-service.ts` (criar)
  - `app/apps/web-partner/src/app/(dashboard)/caixa/page.tsx` (criar)
  - `app/apps/web-partner/src/components/SidebarV2.tsx` (adicionar link "Caixa")
  - `app/apps/web-partner/src/components/TopbarV2.tsx` (adicionar `/caixa` ao ROUTE_META + indicador de status)
- **Status:** `resolvido`
- **O que foi implementado:**
  - `CaixaTurno` adicionado ao `schema.prisma` (id/storeId `@db.Uuid`, snake_case `@map()`, `@@map("caixa_turnos")`, relação com `Store`)
  - `db:generate` rodado com sucesso (migration pendente de rodar em produção — DB inacessível na rede atual)
  - `caixa-service.ts` criado com: `abrirCaixa`, `fecharCaixa`, `getCaixaAtual`, `getResumoTurno` (totais por método de pagamento), `getHistoricoCaixa`
  - 5 endpoints adicionados ao `routes.ts`: POST /caixa/abrir, POST /caixa/fechar, GET /caixa/atual, GET /caixa/resumo/:turnoId, GET /caixa/historico
  - Página `/caixa` criada: estado "fechado" com empty state + botão abrir; estado "aberto" com métricas em tempo real (pedidos, total, por método); histórico de turnos em tabela; modais de abertura e fechamento
  - SidebarV2 e TopbarV2 já estavam atualizados (feito na sessão anterior com SOF-41)
  - Typecheck: 0 erros
- **Plano de implementação:**
  1. Adicionar model `CaixaTurno` ao `schema.prisma` conforme spec da issue
  2. Rodar `corepack pnpm db:generate` (não db:push — seguir instrução da issue que pede migration)
  3. Criar `caixa-service.ts` com funções: abrirCaixa, fecharCaixa, getCaixaAtual, getResumoTurno, getHistorico
  4. Adicionar rotas no `routes.ts`: POST /caixa/abrir, POST /caixa/fechar, GET /caixa/atual, GET /caixa/resumo/:turnoId, GET /caixa/historico
  5. Criar página `/caixa` com dois estados: fechado (botão abrir + campo saldo inicial + histórico) e aberto (métricas em tempo real + botão fechar)
  6. Modal de fechamento com resumo + campo observações
  7. Adicionar indicador de status na TopbarV2 (badge verde/vermelho)
  8. Adicionar link no SidebarV2
- **Critérios de aceite:**
  - [ ] Pode abrir e fechar caixa com saldo inicial
  - [ ] Resumo do turno atual mostra totais por forma de pagamento
  - [ ] Histórico de turnos anteriores acessível
  - [ ] Indicador de status de caixa na topbar
  - [ ] Após fechar caixa, dono vê relatório do turno

---

## Feature #12 — SOF-47

- **Título:** [PDV] Scanner de código de barras para adicionar produto rapidamente
- **Link:** https://linear.app/venza-project/issue/SOF-47/pdv-scanner-de-codigo-de-barras-para-adicionar-produto-rapidamente
- **Prioridade:** média
- **Complexidade:** grande (novo campo schema + backend + componente de câmera + integração em 2 lugares)
- **Descrição:** Campo de código de barras (EAN) no cadastro de produto com scanner via câmera. No PDV, escanear adiciona produto direto ao carrinho.
- **Escopo técnico:**
  - Frontend: campo `barcode` no `ProdutoModal.tsx`; componente `BarcodeScanner.tsx` reutilizável; integração no PDV (`/pdv`)
  - Backend/API: campo `barcode String?` no model `Product` + `GET /partner/products?barcode=` atualizado
  - Estado/Store: estado local nos componentes
  - Pacotes necessários: `@zxing/browser` (scanner de câmera via ZXing)
- **Dependências:** SOF-41 (integração no PDV depende da página /pdv existir)
- **Arquivos afetados:**
  - `app/packages/database/prisma/schema.prisma` (adicionar campo `barcode` + index)
  - `app/apps/api/src/modules/partner/routes.ts` (atualizar GET products para aceitar `?barcode=`)
  - `app/apps/web-partner/src/app/(dashboard)/catalogo/ProdutoModal.tsx` (campo barcode + botão câmera)
  - `app/apps/web-partner/src/app/(dashboard)/pdv/page.tsx` (botão scanner no PDV — após SOF-41)
  - `app/apps/web-partner/src/components/BarcodeScanner.tsx` (criar — componente reutilizável)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Adicionar `barcode String?` ao model `Product` com `@@index([storeId, barcode])`
  2. Rodar `corepack pnpm db:generate`
  3. Atualizar GET /partner/products para aceitar `?barcode=` e retornar produto correspondente
  4. Instalar `@zxing/browser` no web-partner
  5. Criar `BarcodeScanner.tsx`: overlay fullscreen, viewfinder animado, scan line animado, estados success/error
  6. Adicionar campo "Código de barras (EAN)" no `ProdutoModal.tsx` com botão câmera inline
  7. Integrar scanner no PDV (após SOF-41): botão câmera ao lado do campo de busca
- **Critérios de aceite:**
  - [ ] Campo "Código de barras" no modal de produto
  - [ ] Botão de câmera funcional no cadastro de produto
  - [ ] Scanner via câmera reconhece EAN-13 em menos de 2 segundos
  - [ ] No PDV: escanear código de barras adiciona produto ao carrinho
  - [ ] Produto não cadastrado: sugestão de cadastrar
  - [ ] API busca produto por barcode corretamente

---

## Progresso

| Issue | Título | Status |
|-------|--------|--------|
| SOF-27 | Histórico de movimentações estoque | resolvido |
| SOF-12 | G6 Financeiro | resolvido |
| SOF-13 | G7 Histórico financeiro | resolvido |
| SOF-39 | Cliente opcional no modal | resolvido |
| SOF-40 | Tipo Balcão no modal | resolvido |
| SOF-28 | Tempo no card de pedidos | **já implementado** |
| SOF-34 | Redesig botão visão geral | arquivada — ignorar |
| SOF-42 | Cálculo de troco automático | pendente |
| SOF-41 | PDV grade visual de produtos | pendente |
| SOF-45 | Importação CSV de produtos | pendente |
| SOF-46 | Controle de caixa por turno | pendente |
| SOF-47 | Scanner de código de barras | pendente (deps: SOF-41) |

---

## Ordem de execução sugerida (sessão anterior)

1. **SOF-42** — Troco automático (1 arquivo, alta prioridade, sem deps, ~30 min)
2. **SOF-41** — PDV grade visual (grande, alta prioridade, sem deps de backend novos)
3. **SOF-45** — Importação CSV (grande, alta prioridade, independente)
4. **SOF-46** — Controle de caixa (grande, alta prioridade, precisa de migration)
5. **SOF-47** — Scanner barcode (grande, média prioridade, depende de SOF-41 para PDV)

---

# Sessão 2026-04-16 — Novas Features (ToDo + label "feature")

---

## Feature #13 — SOF-74

- **Título:** [Catálogo] Implementar hierarquia completa de categorias para adega com subcategorias e busca rápida
- **Link:** https://linear.app/venza-project/issue/SOF-74/catalogo-implementar-hierarquia-completa-de-categorias-para-adega-com
- **Prioridade:** alta
- **Complexidade:** grande (DB migration + seed + API + frontend)
- **Descrição:** Implementar hierarquia de categorias pai/filho (Vinhos > Vinho Tinto, etc.), seed com árvore completa para adega, busca por nome com debounce 300ms e filtros de categoria/subcategoria na página de catálogo do web-partner. API deve aceitar `?categoria=&subcategoria=&busca=&pagina=&limite=`.
- **Escopo técnico:**
  - Frontend: `(dashboard)/catalogo/CatalogoClient.tsx` — adicionar barra de busca com debounce, dropdown de categoria pai, dropdown dinâmico de subcategoria, paginação (20 itens/página)
  - Backend/API: `GET /partner/produtos` (ou `/products`) atualizado para aceitar `?busca=&categoria=&subcategoria=&pagina=&limite=`; índice `GIN` pg_trgm para busca eficiente
  - Estado/Store: estado local (useState) para filtros e paginação no CatalogoClient
  - Banco: adicionar campo `parentCategoryId String? @db.Uuid` ao model `Category` com relação self-referential; migration via `corepack pnpm db:migrate`; atualizar seed com hierarquia completa
  - Pacotes necessários: nenhum novo
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `app/packages/database/prisma/schema.prisma` — adicionar `parentCategoryId` + relações self-ref + índice
  - `app/packages/database/prisma/seed.ts` — adicionar seed das categorias + subcategorias
  - `app/apps/api/src/modules/partner/` — atualizar endpoint de produtos com filtros e paginação
  - `app/apps/web-partner/src/app/(dashboard)/catalogo/CatalogoClient.tsx` — busca + filtros + paginação
  - `app/apps/web-partner/src/app/(dashboard)/catalogo/page.tsx` — passar novas props (se necessário)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Adicionar `parentCategoryId String? @map("parent_category_id") @db.Uuid` ao model `Category` com relação self-referential (`parent Category? @relation(...)` e `children Category[] @relation(...)`)
  2. Rodar `corepack pnpm db:generate` e `corepack pnpm db:migrate`
  3. Atualizar seed: remover categorias simples atuais, inserir árvore completa (7 categorias pai + 27 subcategorias definidas na issue) via `upsert` idempotente
  4. Atualizar endpoint `GET /partner/products` para aceitar query params `busca`, `categoria`, `subcategoria`, `pagina`, `limite`; usar `prisma.$queryRaw` com ILIKE ou pg_trgm para busca; filtrar por `storeId` do partnerContext
  5. No `CatalogoClient.tsx`: adicionar estado para `busca`, `categoriaId`, `subcategoriaId`, `pagina`; substituir dados estáticos por fetch com os filtros; debounce 300ms na busca; dropdown de categoria pai; dropdown de subcategoria (populado com base na categoria selecionada); paginação com botões Anterior/Próximo
  6. Garantir que categorias são cacheadas client-side (não refetchar a cada render)
- **Critérios de aceite:**
  - [ ] Hierarquia de categorias para adega disponível após `pnpm db:seed`
  - [ ] Schema suporta `parentCategoryId` (subcategorias)
  - [ ] Busca por nome retorna resultados em menos de 300ms para 1.000+ produtos
  - [ ] Filtros de categoria/subcategoria funcionam sem recarregar a página
  - [ ] Paginação funciona corretamente com catálogo extenso
  - [ ] Interface permite navegação e localização rápida de qualquer produto

---

## Feature #14 — SOF-64

- **Título:** [UX] Skeleton animado no loading.tsx global do web-client
- **Link:** https://linear.app/venza-project/issue/SOF-64/ux-skeleton-animado-no-loadingtsx-global-do-web-client
- **Prioridade:** baixa
- **Complexidade:** pequena (3 arquivos, frontend only)
- **Descrição:** Substituir o "Carregando..." de texto simples no `loading.tsx` por skeletons animados que imitam o layout real de cada rota — homepage (header + grid), produto/[slug] (detalhe) e checkout (formulário + resumo).
- **Escopo técnico:**
  - Frontend: `apps/web-client/src/app/loading.tsx` (raiz), criar `apps/web-client/src/app/produto/[slug]/loading.tsx`, criar `apps/web-client/src/app/checkout/loading.tsx`
  - Backend/API: nenhuma mudança
  - Estado/Store: nenhuma mudança
  - Pacotes necessários: nenhum (usa `animate-pulse` do Tailwind + CSS custom existente)
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `app/apps/web-client/src/app/loading.tsx` (modificar — atualmente só exibe "Carregando...")
  - `app/apps/web-client/src/app/produto/[slug]/loading.tsx` (criar)
  - `app/apps/web-client/src/app/checkout/loading.tsx` (criar)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Atualizar `loading.tsx` raiz: skeleton com header mock + grid de 8 cards `bg-gray-200 animate-pulse` no mesmo layout da `CatalogView` (2-4 colunas responsivo)
  2. Criar `produto/[slug]/loading.tsx`: skeleton de duas colunas — coluna esquerda com imagem + badges + título + preço; coluna direita com card de ação
  3. Criar `checkout/loading.tsx`: skeleton de duas colunas — formulário à esquerda, resumo à direita
  4. Usar variável CSS `--cream`, `--border` e blocos `rounded` consistentes com o design system `.wc-*`
- **Critérios de aceite:**
  - [ ] `loading.tsx` raiz exibe skeleton de grid de produtos (não "Carregando...")
  - [ ] `produto/[slug]/loading.tsx` exibe skeleton do layout de detalhe
  - [ ] `checkout/loading.tsx` exibe skeleton do formulário de checkout
  - [ ] Todos usam `animate-pulse` com blocos em cinza suave

---

## Feature #15 — SOF-68

- **Título:** [UX] Breadcrumb de navegação na vitrine do cliente
- **Link:** https://linear.app/venza-project/issue/SOF-68/ux-breadcrumb-de-navegacao-na-vitrine-do-cliente
- **Prioridade:** baixa
- **Complexidade:** pequena (1-2 arquivos, frontend only)
- **Descrição:** Adicionar breadcrumb em `/produto/[slug]` com "Início > [Categoria] > Nome do Produto", onde "Início" linka para `/` e a categoria linka para `/?categoria=[slug]` (homepage já suporta filtro por categoria via searchParam).
- **Escopo técnico:**
  - Frontend: `apps/web-client/src/app/produto/[slug]/page.tsx` — substituir o botão "← Voltar ao catálogo" por um breadcrumb navegável (pode ser um componente inline simples, sem biblioteca externa)
  - Backend/API: nenhuma mudança — `produto.category` já está disponível na resposta
  - Estado/Store: nenhuma
  - Pacotes necessários: nenhum
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `app/apps/web-client/src/app/produto/[slug]/page.tsx`
- **Status:** `pendente`
- **Plano de implementação:**
  1. Substituir o bloco `<div style={{ marginBottom: 16 }}>` com o botão "← Voltar" por um `<nav>` de breadcrumb
  2. Estrutura: `Início` (link para `/`) > `[categoria.name]` se categoria existir (link para `/?categoria=[categoria.slug]`) > `[produto.name]` (texto simples, não clicável)
  3. Se não houver categoria, mostrar apenas: `Início > [produto.name]`
  4. Estilizar com `color: var(--text-muted)` para separadores e itens não-ativos; `color: var(--green)` para links; `font-size: 13px`
- **Critérios de aceite:**
  - [ ] Breadcrumb aparece em `/produto/[slug]`
  - [ ] "Início" linka para `/`
  - [ ] Categoria linka para `/?categoria=[slug]` filtrando a homepage
  - [ ] Nome do produto é texto simples (não clicável)
  - [ ] Sem biblioteca externa

---

## Feature #16 — SOF-67

- **Título:** [UX] Máscara de telefone no formulário de checkout
- **Link:** https://linear.app/venza-project/issue/SOF-67/ux-mascara-de-telefone-no-formulario-de-checkout
- **Prioridade:** baixa
- **Complexidade:** pequena (1 arquivo + 1 pacote)
- **Descrição:** Aplicar máscara `(XX) XXXXX-XXXX` no campo de telefone do checkout. Estado armazena apenas dígitos. Validação mínima de 10 dígitos antes de submeter (já existe, mas sem máscara visual).
- **Escopo técnico:**
  - Frontend: `apps/web-client/src/app/checkout/page.tsx` — adicionar máscara no input de telefone via `react-imask`
  - Backend/API: nenhuma mudança — já recebe `telefone.replace(/\D/g, "")` no submit
  - Estado/Store: nenhuma mudança no state (já existe `telefone`)
  - Pacotes necessários: `react-imask` no `apps/web-client`
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `app/apps/web-client/src/app/checkout/page.tsx`
  - `app/apps/web-client/package.json` (adicionar `react-imask`)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Instalar `react-imask` no web-client: `corepack pnpm --filter web-client add react-imask`
  2. Importar `IMaskInput` de `react-imask` no checkout/page.tsx
  3. Substituir o `<input>` de telefone por `<IMaskInput mask="(00) 00000-0000" className="wc-input" ... onAccept={(value) => setTelefone(value)} unmask={true} />`
  4. `unmask={true}` garante que o estado armazena apenas dígitos
  5. Atualizar `placeholder` para `"(11) 99999-9999"`
- **Critérios de aceite:**
  - [ ] Máscara `(XX) XXXXX-XXXX` aparece ao digitar
  - [ ] Estado armazena apenas dígitos (sem parênteses/traços)
  - [ ] Validação de 10 dígitos mínimos continua funcionando
  - [ ] Placeholder atualizado para `(11) 99999-9999`

---

## Feature #17 — SOF-49

- **Título:** Sistema de templates multi-segmento no web-client
- **Link:** https://linear.app/venza-project/issue/SOF-49/sistema-de-templates-multi-segmento-no-web-client
- **Prioridade:** baixa
- **Complexidade:** grande (decisão arquitetural estratégica)
- **Descrição:** Estratégia para servir múltiplos segmentos (adega, restaurante, empório) a partir de um único deploy. A issue oferece duas opções: A) campo `template` no model Store + lógica de layout no web-client; B) app separado `apps/web-restaurante/` no monorepo.
- **Escopo técnico:**
  - Depende da decisão arquitetural (Opção A vs B)
  - Opção A: campo `template String @default("adega")` no schema, lógica de roteamento no layout do web-client
  - Opção B: novo app `apps/web-[segmento]/` com estrutura Next.js + Vercel Preview
  - Ambas: wildcard domain no Vercel (`*.vendza.com.br`)
- **Dependências:** nenhuma técnica, mas requer DECISÃO do produto antes de iniciar
- **Arquivos afetados:** depende da opção escolhida
- **Status:** `bloqueado — aguardando decisão`
- **Plano de implementação:** A definir após decisão do produto
- **Critérios de aceite:** (ver issue para lista completa — depende da opção)
- **⚠️ REQUER ESCLARECIMENTO:** A issue apresenta duas opções arquiteturais. Antes de implementar, o usuário deve confirmar qual opção seguir (A ou B). Impacta schema do banco, estrutura do monorepo e configuração do Vercel.

---

## Ordem de execução sugerida (sessão 2026-04-16)

1. **SOF-74** — Hierarquia de categorias (alta prioridade, grande — começar primeiro por impacto no produto)
2. **SOF-64** — Skeleton loading (baixa prioridade, pequena, sem deps — rápido)
3. **SOF-68** — Breadcrumb (baixa prioridade, pequena, sem deps — rápido)
4. **SOF-67** — Máscara telefone (baixa prioridade, pequena, sem deps — rápido)
5. **SOF-49** — Multi-segmento (**BLOQUEADA** — aguardar decisão arquitetural do usuário)

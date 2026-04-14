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

## Ordem de execução sugerida

1. **SOF-42** — Troco automático (1 arquivo, alta prioridade, sem deps, ~30 min)
2. **SOF-41** — PDV grade visual (grande, alta prioridade, sem deps de backend novos)
3. **SOF-45** — Importação CSV (grande, alta prioridade, independente)
4. **SOF-46** — Controle de caixa (grande, alta prioridade, precisa de migration)
5. **SOF-47** — Scanner barcode (grande, média prioridade, depende de SOF-41 para PDV)

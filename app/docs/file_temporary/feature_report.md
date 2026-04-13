# Feature Report — Implementação de Features (Linear)

Gerado em: 2026-04-13

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

## Feature #4 — SOF-39

- **Título:** [PDV] Tornar identificação de cliente opcional no modal de pedido manual
- **Link:** https://linear.app/venza-project/issue/SOF-39
- **Prioridade:** urgente
- **Status:** `resolvido`
- **O que foi implementado:**
  Toggle "Identificar cliente" (switch) no Passo 1 do `PedidoManualModal`, default OFF. Quando OFF: campos ocultos, pedido avança como "Consumidor". Quando ON: comportamento original preservado. Backend aceita `phone` opcional; cliente anônimo recebe phone único `ANON-XXXXXXXX` para satisfazer a unique constraint. TypeBox schema atualizado. Typecheck: 0 erros.
- **Commit:** `ae30684`

---

## Feature #5 — SOF-40

- **Título:** [PDV] Adicionar tipo "Balcão" no modal de pedido — pular endereço para venda presencial
- **Link:** https://linear.app/venza-project/issue/SOF-40
- **Prioridade:** urgente
- **Status:** `resolvido`
- **O que foi implementado:**
  Toggle "Balcão / Delivery" com ícones SVG (IconStore / IconTruck) no topo do Passo 3, default Balcão. Balcão: sem formulário de endereço, só pagamento. Delivery: comportamento atual preservado. Enum `OrderChannel.balcao` adicionado ao schema Prisma, `db:generate` rodado. Badge "Balcão" na tabela de pedidos (`PedidosClient`). `address` e `deliveryType` tornados opcionais no TypeBox e no service. Typecheck: 0 erros.
- **Commit:** `8bd3158`

---

## Progresso

| Issue | Status |
|-------|--------|
| SOF-27 | resolvido |
| SOF-12 | resolvido |
| SOF-13 | resolvido (coberta por SOF-12) |
| SOF-39 | resolvido |
| SOF-40 | resolvido |

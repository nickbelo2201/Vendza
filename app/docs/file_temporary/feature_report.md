# Feature Report — Implementação de Features (Linear)

Gerado em: 2026-04-13

---

## Feature #1 — SOF-27

- **Título:** Feature: Tela de estoque — Histórico de movimentações
- **Link:** https://linear.app/venza-project/issue/SOF-27/feature-tela-de-estoque
- **Prioridade:** alta
- **Complexidade:** pequena (1-2 arquivos)
- **Descrição:** Exibir histórico de movimentações na side drawer quando um produto é aberto na tela de estoque. O usuário deve ver quando foi adicionado/removido estoque, quantidades e motivos.
- **Análise de codebase:**
  O `DrawerHistorico` JÁ EXISTE em `estoque/page.tsx` e já chama o endpoint correto. Porém há um **bug de shape mismatch**: o backend retorna `{ data: MovimentoHistorico[], total, page, pageSize }` aninhado, mas o frontend tipa como `MovimentoHistorico[]` — fazendo com que a lista apareça sempre vazia. A fix é mínima: ajustar o tipo e a extração de `dados.data`.
- **Escopo técnico:**
  - Frontend: `apps/web-partner/src/app/(dashboard)/estoque/page.tsx` — ajuste no `DrawerHistorico` (tipo + extração `dados.data`)
  - Backend/API: nenhuma mudança necessária (rota e service já existem e estão corretos)
  - Estado/Store: nenhuma mudança
  - Pacotes necessários: nenhum
- **Dependências:** nenhuma
- **Arquivos afetados:**
  - `apps/web-partner/src/app/(dashboard)/estoque/page.tsx`
- **Status:** `resolvido`
- **O que foi implementado:** Corrigido shape mismatch em `DrawerHistorico` — ajustado o tipo genérico de `fetchComAuth` para `{ data: MovimentoHistorico[]; total: number; page: number; pageSize: number }` e alterado `setHistorico(dados)` para `setHistorico(resposta.data)`. Typecheck: 0 erros.
- **Plano de implementação:**
  1. Em `DrawerHistorico`, mudar o tipo de `fetchComAuth<MovimentoHistorico[]>` para `fetchComAuth<{ data: MovimentoHistorico[]; total: number; page: number; pageSize: number }>` ✅
  2. Trocar `setHistorico(dados)` por `setHistorico(resposta.data)` ✅
  3. Rodar typecheck e confirmar zero erros ✅
- **Critérios de aceite:**
  - Ao clicar em um produto na tabela de estoque, a side drawer abre
  - O histórico de movimentações aparece corretamente (entradas positivas em verde, saídas em vermelho)
  - Data, tipo e motivo de cada movimento são visíveis
  - Estado de loading aparece enquanto carrega
  - Empty state amigável quando não há movimentações

---

## Feature #2 — SOF-12

- **Título:** G6 Financeiro
- **Link:** https://linear.app/venza-project/issue/SOF-12/g6-financeiro
- **Prioridade:** média
- **Complexidade:** grande (10+ arquivos, envolve backend)
- **Descrição:** Criar a página "Financeiro" no painel do parceiro com: filtros de período, 6 KPI cards (Receita Bruta, Líquida, Pedidos Pagos, Pendentes, Ticket Médio, Cancelamentos), gráfico de área de receita ao longo do tempo, breakdown por status/método de pagamento (donut + lista), tabela de extrato completa com busca/filtro/ordenação/paginação/seleção em lote, e exportação CSV/PDF.
- **Escopo técnico:**
  - Frontend:
    - Nova página: `apps/web-partner/src/app/(dashboard)/financeiro/page.tsx`
    - Componentes: `FinanceiroKpis.tsx`, `GraficoReceitaFinanceiro.tsx`, `BreakdownPagamentos.tsx`, `TabelaExtrato.tsx`, `ExportarDropdown.tsx`
    - Alterar `SidebarV2.tsx`: adicionar item "Financeiro" entre "Relatórios" e "Configurações"
  - Backend/API:
    - Novo service: `apps/api/src/modules/partner/financeiro-service.ts`
    - Nova rota em `routes.ts`: `GET /partner/financeiro` (querystring: `from`, `to`)
    - Nova rota: `GET /partner/financeiro/extrato` (paginação, filtros, busca)
    - Nova rota: `GET /partner/financeiro/exportar` (CSV — resumo ou completo)
  - Estado/Store: estado local (React state) — sem store global necessário
  - Pacotes necessários: recharts (já instalado), nenhum novo
- **Dependências:** nenhuma — pode ser implementada de forma independente
- **Arquivos afetados:**
  - `apps/web-partner/src/app/(dashboard)/financeiro/page.tsx` (novo)
  - `apps/web-partner/src/app/(dashboard)/financeiro/FinanceiroKpis.tsx` (novo)
  - `apps/web-partner/src/app/(dashboard)/financeiro/GraficoReceitaFinanceiro.tsx` (novo)
  - `apps/web-partner/src/app/(dashboard)/financeiro/BreakdownPagamentos.tsx` (novo)
  - `apps/web-partner/src/app/(dashboard)/financeiro/TabelaExtrato.tsx` (novo)
  - `apps/web-partner/src/app/(dashboard)/financeiro/ExportarDropdown.tsx` (novo)
  - `apps/web-partner/src/components/SidebarV2.tsx` (alterar)
  - `apps/api/src/modules/partner/financeiro-service.ts` (novo)
  - `apps/api/src/modules/partner/routes.ts` (alterar — adicionar rotas)
- **Status:** `pendente`
- **Plano de implementação:**
  1. Implementar `financeiro-service.ts` no backend: KPIs, dados do gráfico por dia, breakdown por status/método, extrato paginado, exportação CSV
  2. Registrar as novas rotas em `routes.ts` (`/partner/financeiro`, `/partner/financeiro/extrato`, `/partner/financeiro/exportar`)
  3. Criar a estrutura de arquivos do frontend em `/financeiro/`
  4. Implementar `FinanceiroKpis.tsx` com os 6 KPI cards (esqueleto + dados reais)
  5. Implementar `GraficoReceitaFinanceiro.tsx` com `AreaChart` do Recharts (2 linhas: pago e total)
  6. Implementar `BreakdownPagamentos.tsx` com `PieChart` (donut) e lista por método de pagamento
  7. Implementar `TabelaExtrato.tsx` com busca, filtros, ordenação, paginação e seleção em lote
  8. Implementar `ExportarDropdown.tsx` com opções CSV resumo, CSV completo, CSV selecionado (condicional) e PDF
  9. Montar `page.tsx` integrando todos os componentes com o seletor de período
  10. Adicionar "Financeiro" no `SidebarV2.tsx` (entre Relatórios e Configurações)
  11. Rodar typecheck — zero erros
- **Critérios de aceite:**
  - Página acessível via `/financeiro` com link na sidebar
  - Seletor de período funcional (Hoje, 7/15/30 dias, Mês atual, Mês anterior, Personalizado)
  - 6 KPI cards exibem valores corretos com comparação ao período anterior
  - Gráfico de área mostra receita paga vs total por dia
  - Donut mostra breakdown por status de pagamento
  - Lista abaixo do donut mostra breakdown por método com barras de progresso
  - Tabela de extrato com todas as colunas, busca, filtros e paginação (20 itens/página)
  - Clicar em um pedido na tabela abre drawer com detalhes
  - Exportação CSV funcional (resumo e completo) com UTF-8 BOM
  - Empty states para período sem dados
  - Skeleton loading nos KPIs e gráficos

---

## Feature #3 — SOF-13

- **Título:** G7 Histórico financeiro
- **Link:** https://linear.app/venza-project/issue/SOF-13/g7-historico-financeiro
- **Prioridade:** média
- **Complexidade:** pequena (subset de SOF-12)
- **Descrição:** Histórico detalhado de transações financeiras com filtros por data, método de pagamento e status. Exportação CSV.
- **Análise de sobreposição:** **ATENÇÃO — SOF-13 é completamente coberta pela SOF-12.** A especificação da SOF-12 já inclui: tabela de extrato completa com filtros por data (seletor de período), por método de pagamento e por status, além de exportação CSV. SOF-13 não adiciona nada além do que a SOF-12 especifica.
- **Escopo técnico:**
  - Frontend: nenhum arquivo novo — tudo já coberto pela SOF-12
  - Backend/API: nenhuma rota nova — já coberta pela SOF-12
  - Pacotes necessários: nenhum
- **Dependências:** depende de SOF-12 (é subconjunto)
- **Arquivos afetados:** os mesmos da SOF-12
- **Status:** `pendente`
- **Plano de implementação:**
  1. Implementar SOF-12 primeiro (inclui tudo que SOF-13 pede)
  2. Marcar SOF-13 como concluída junto com SOF-12 (toda sua especificação está coberta)
- **Critérios de aceite:**
  - Tabela de transações com filtro por data — coberta pela SOF-12
  - Filtro por método de pagamento — coberto pela SOF-12
  - Filtro por status — coberto pela SOF-12
  - Exportação CSV — coberto pela SOF-12

---

## Ordem de Execução Sugerida

1. **SOF-27** — alta prioridade, pequena, fix simples de 2 linhas no frontend
2. **SOF-12** — média prioridade, grande, implementação completa da página Financeiro
3. **SOF-13** — automaticamente resolvida ao concluir SOF-12

## Progresso

| Issue | Status |
|-------|--------|
| SOF-27 | resolvido |
| SOF-12 | resolvido |
| SOF-13 | resolvido (coberta por SOF-12) |

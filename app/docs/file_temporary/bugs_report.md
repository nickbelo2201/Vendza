# Relatório de Bugs — Linear (Gerado em 2026-04-16)

Total encontrado: **3 bugs** (1 urgente, 2 alta prioridade)

---

## Bug #1 — SOF-75

- **Título:** Bug: [Estoque] Movimentação de saída e ajuste somando estoque em vez de subtrair
- **Link:** https://linear.app/venza-project/issue/SOF-75/bug-estoque-movimentacao-de-saida-e-ajuste-somando-estoque-em-vez-de
- **Prioridade:** urgente
- **Descrição:** Na tela de Estoque, ao registrar movimentação do tipo "Saída" (`cancellation`) ou "Ajuste" (`manual_adjustment`), o estoque é **incrementado** em vez de decrementado. O campo `currentStock` usa sempre `increment: input.quantidade` (positivo), independente do tipo da movimentação. Bug crítico de integridade de dados.
- **Arquivos afetados:**
  - `app/apps/api/src/modules/partner/estoque-service.ts` — linha 160 (lógica de `increment` sem considerar o tipo)
- **Status:** `resolvido`
- **Plano de resolução:**
  1. Em `registrarMovimentacao`, calcular `quantityDelta` baseado no tipo antes de aplicar ao `InventoryItem`
  2. `replenishment` → delta positivo (+quantidade)
  3. `cancellation` → delta negativo (-quantidade)
  4. `manual_adjustment` → valor absoluto (definir o saldo diretamente via `set: quantidade`)
  5. Validar estoque negativo: se `cancellation` resultar em `currentStock - quantidade < 0`, retornar erro 400
  6. Garantir que o `quantityDelta` salvo no `InventoryMovement` reflita o delta real (negativo para saída)
  7. Verificar que o frontend envia `quantidade` sempre positiva (já confirmado no page.tsx)

---

## Bug #2 — SOF-76

- **Título:** Bug: [Relatórios] Dados de pedidos divergem entre visão diária e tela de relatórios
- **Link:** https://linear.app/venza-project/issue/SOF-76/bug-relatorios-dados-de-pedidos-divergem-entre-visao-diaria-e-tela-de
- **Prioridade:** alta
- **Descrição:** Inconsistência entre "Pedidos do Dia" (dashboard/CRM) e a tela de Relatórios. O `getDashboardSummary` usa `setHours(0, 0, 0, 0)` (hora local do servidor, provavelmente UTC), enquanto a tela de relatórios usa datas enviadas pelo frontend que podem considerar o horário de Brasília. Pedidos criados após 21h (UTC) de um dia X aparecem no dashboard como dia X+1, mas nos relatórios como dia X.
- **Arquivos afetados:**
  - `app/apps/api/src/modules/partner/crm-dashboard-service.ts` — linhas 292-293 (`startOfToday.setHours(0, 0, 0, 0)` sem timezone)
  - `app/apps/api/src/modules/partner/financeiro-service.ts` — queries que usam `DATE(placed_at)` sem conversão de timezone no PostgreSQL
- **Status:** `resolvido`
- **Plano de resolução:**
  1. Em `crm-dashboard-service.ts`, calcular `startOfToday` com timezone `America/Sao_Paulo`:
     - Usar `Intl.DateTimeFormat` ou cálculo manual: subtrair 3h de UTC para obter meia-noite em Brasília
     - Alternativa simples: `const offset = -3 * 60 * 60 * 1000; const now = new Date(); const startOfToday = new Date(Math.floor((now.getTime() + offset) / 86400000) * 86400000 - offset);`
  2. Em `financeiro-service.ts`, no agrupamento por dia (`DATE(placed_at)`), usar `DATE(placed_at AT TIME ZONE 'America/Sao_Paulo')` no PostgreSQL para garantir que a data seja calculada no timezone correto
  3. Adicionar comentário documentando que "pedido do dia" = pedido criado entre 00:00 e 23:59 no horário de Brasília (America/Sao_Paulo)
  4. Verificar também `crm-dashboard-service.ts` na função `getPartnerReports` se existir lógica similar

---

## Bug #3 — SOF-77

- **Título:** [Bug] Caixa: erros de carregamento silenciados sem feedback ao usuário
- **Link:** https://linear.app/venza-project/issue/SOF-77/bug-caixa-erros-de-carregamento-silenciados-sem-feedback-ao-usuario
- **Prioridade:** alta
- **Descrição:** O componente `CaixaPage` tem um `catch { /* silencioso */ }` na linha 416. Se a API falhar (rede offline, 500, token expirado), a página fica vazia sem nenhum aviso ao lojista, que não sabe se a tela está vazia porque não há turnos ou porque houve erro.
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/caixa/page.tsx` — linha 416
- **Status:** `resolvido`
- **Plano de resolução:**
  1. Adicionar estado `const [erro, setErro] = useState<string | null>(null);`
  2. No `carregar`: `setErro(null)` no início, e no `catch`: `setErro(e instanceof Error ? e.message : "Erro ao carregar dados do caixa.")`
  3. No JSX (antes do `return` principal, após o guard de `carregando`), renderizar um bloco de erro visível com a mensagem e um botão "Tentar novamente" que chame `void carregar()`
  4. Usar classes `.wp-error-box` (já existem no design system global) ou aplicar estilo inline consistente com o resto da página

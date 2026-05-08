# INF_Adega Progresso v1

> Atualizado em: 2026-03-26 10:58:04 -03:00

---

## Concluido

| Bloco | Descricao | Status |
|---|---|---|
| Auth | Middleware com contexto de loja (`userId`, `storeId`, `storeUserId`, `role`) via token Supabase | OK |
| Loja | `store/settings`, `store/hours`, `delivery-zones` com Prisma real | OK |
| Catalogo | Products CRUD, availability, inventory e `inventory_movements` persistidos | OK |
| Pedidos | Listagem, detalhe, status com `order_events` e pedido manual | OK |
| CRM | Customers list, detail e patch com filtro por loja | OK |
| Dashboard | `dashboard/summary` com dados reais da loja | OK |

---

## 🔄 Em andamento / Proximo bloco

| Prioridade | Task | Observacao |
|---|---|---|
| 1 | Login/sessao web-partner ponta a ponta com Supabase | Backend pronto; falta fechar fluxo do frontend |
| 2 | Consumo real da API no frontend web-partner | Trocar consumo mockado por chamadas reais |
| 3 | Start de producao da API via artefato final | Validar comando final de runtime do build fora do modo `tsx` |
| 4 | Observabilidade basica da API | Logs, health e erros de producao com mais contexto |

---

## Backlog v1 (ainda nao iniciado)

| Task | Descricao |
|---|---|
| Rastreio do cliente | Evoluir status e acompanhamento de pedido no web-client |
| Mobile | Iniciar base funcional do app mobile apos estabilizar web |
| Jobs e fila | Preparar processamento assicrono com Redis para eventos futuros |
| Polimento visual / UI |
---

## 🚫 Fora do escopo desta v1
- Cobertura por poligono
- Agentes autonomos de WhatsApp ou gestao

---

## Decisoes tomadas hoje
- Arquitetura padrao definida como `Supabase Auth + Supabase Postgres + Prisma`
- O backend resolve `store_users.auth_user_id` a partir do bearer token e aplica `401/403` no middleware
- Mudancas de status de pedido permanecem append-only em `order_events`
- Movimentos de estoque permanecem append-only em `inventory_movements`
- O smoke do parceiro foi automatizado com verificacao de isolamento entre lojas
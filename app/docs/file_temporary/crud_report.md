# CRUD Report — 2026-04-28

## Resumo da análise

**Issues encontradas com "CRUD" no título:** 6 (em Todo)
**Issues CRUD já concluídas anteriormente:** 4 (SOF-2, SOF-8, SOF-9, SOF-84)

**Resultado da análise de codebase:** TODAS as 6 issues abertas já estão completamente implementadas.
Não foi necessário escrever nenhum código. As issues foram fechadas como Done.

---

## CRUD #1 — SOF-104
Título: CRUD de Categorias — gestão independente pela loja
Link: https://linear.app/venza-project/issue/SOF-104
Prioridade: Alta
Complexidade: média
Descrição: Página `/catalogo/categorias` para criar, editar, ativar/desativar e excluir categorias.
Escopo de validação:
  Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/categorias/CategoriasClient.tsx` — IMPLEMENTADO
  Backend/API: `GET/POST/PATCH/DELETE /partner/categories` em `catalog-routes.ts` — IMPLEMENTADO
  Database: model `Category` no Prisma com `parentCategoryId` — IMPLEMENTADO
Status: aprovado
Critérios de aceite: Listar, criar (com slug auto-gerado), editar, excluir (com validação de produtos vinculados) — TODOS ATENDIDOS

---

## CRUD #2 — SOF-105
Título: CRUD de Subcategorias — gestão hierárquica por categoria pai
Link: https://linear.app/venza-project/issue/SOF-105
Prioridade: Alta
Complexidade: média
Descrição: Página `/catalogo/subcategorias` usando o mesmo model `Category` com `parentCategoryId`.
Escopo de validação:
  Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/subcategorias/SubcategoriasClient.tsx` — IMPLEMENTADO
  Backend/API: endpoints de categories com suporte a `parentCategoryId` — IMPLEMENTADO
  Database: model `Category` com auto-referência via `parentCategoryId` — IMPLEMENTADO
Status: aprovado
Critérios de aceite: Listar agrupadas por categoria pai, criar com seleção de pai, editar, excluir com validação — TODOS ATENDIDOS

---

## CRUD #3 — SOF-106
Título: CRUD de Combos — criar e administrar combos de produtos
Link: https://linear.app/venza-project/issue/SOF-106
Prioridade: Alta
Complexidade: grande
Descrição: Página `/catalogo/combos` para gerenciar combos com múltiplos produtos e grupos de complementos.
Escopo de validação:
  Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/combos/CombosClient.tsx` — IMPLEMENTADO
  Backend/API: `GET/POST/PATCH/DELETE /partner/combos` + `/partner/combos/:id/active` em `catalog-extras-routes.ts` — IMPLEMENTADO
  Database: models `Combo`, `ComboItem`, `ComboComplementGroup` — IMPLEMENTADOS
Status: aprovado
Critérios de aceite: Listar, criar com produtos + grupos de complementos, editar, ativar/desativar, excluir — TODOS ATENDIDOS

---

## CRUD #4 — SOF-107
Título: CRUD de Grupos de Complementos — agrupar variações por tipo
Link: https://linear.app/venza-project/issue/SOF-107
Prioridade: Média
Complexidade: média
Descrição: Página `/catalogo/grupos-de-complementos` para criar e gerenciar grupos (ex: "Sabores de Energético").
Escopo de validação:
  Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/grupos-de-complementos/GruposComplementosClient.tsx` — IMPLEMENTADO
  Backend/API: `GET/POST/PATCH/DELETE /partner/complement-groups` em `catalog-extras-routes.ts` — IMPLEMENTADO
  Database: model `ComplementGroup` com min/max selection e isRequired — IMPLEMENTADO
Status: aprovado
Critérios de aceite: Listar, criar (nome, descrição, seleção mín/máx, obrigatório), editar, excluir com validação — TODOS ATENDIDOS

---

## CRUD #5 — SOF-108
Título: CRUD de Complementos — itens vinculáveis a grupos
Link: https://linear.app/venza-project/issue/SOF-108
Prioridade: Média
Complexidade: média
Descrição: Página `/catalogo/complementos` para criar complementos individuais associados a grupos.
Escopo de validação:
  Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/complementos/ComplementosClient.tsx` — IMPLEMENTADO
  Backend/API: `GET/POST/PATCH/DELETE /partner/complements` + `/partner/complements/:id/availability` — IMPLEMENTADO
  Database: model `Complement` com relação a `ComplementGroup` — IMPLEMENTADO
Status: aprovado
Critérios de aceite: Listar com filtro por grupo, criar, editar, ativar/desativar, excluir com validação — TODOS ATENDIDOS

---

## CRUD #6 — SOF-109
Título: CRUD de Extras de Pedido — itens avulsos adicionáveis ao pedido
Link: https://linear.app/venza-project/issue/SOF-109
Prioridade: Média
Complexidade: pequena
Descrição: Página `/catalogo/extras` para gerenciar extras de pedido (ex: "Gelo", "Sacola retornável").
Escopo de validação:
  Frontend: `apps/web-partner/src/app/(dashboard)/catalogo/extras/ExtrasClient.tsx` — IMPLEMENTADO
  Backend/API: `GET/POST/PATCH/DELETE /partner/extras` + `/partner/extras/:id/availability` — IMPLEMENTADO
  Database: model `Extra` no Prisma — IMPLEMENTADO
Status: aprovado
Critérios de aceite: Listar ativos/inativos, criar, editar, ativar/desativar, excluir — TODOS ATENDIDOS

---

## Conclusão

Todas as 6 issues CRUD estavam já implementadas no codebase — schema, API e frontend.
Nenhum código foi escrito. Apenas o status no Linear foi atualizado para Done.

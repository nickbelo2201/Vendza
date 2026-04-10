# Bugs Report — Linear BUG Issues
> Gerado em: 2026-04-10 | Agente: nicholas-orchestrator
> Atualizado: 2026-04-10 — ETAPA 2 concluída

---

## Bug #1 — SOF-25

- **Título:** Dbug: Tela de pedidos — Painel de detalhes transparente no Dark Mode
- **Link:** https://linear.app/venza-project/issue/SOF-25/dbug-tela-de-pedidos
- **Prioridade:** Alta
- **Status:** `resolvido`

### Root Cause
Em `globals.css` linha 1567, dentro de `[data-theme="dark"]`:
```css
--surface: rgba(30, 41, 59, 0.5);  /* 50% transparente — BUG */
```
O drawer de pedidos (`PedidoDetalhe.tsx`) usa `background: "var(--surface)"`. Em dark mode, o token era semi-transparente, causando o vazamento visual.

### Fix Aplicado
**`app/apps/web-partner/src/app/globals.css`** linha 1567:
```css
/* Antes */
--surface: rgba(30, 41, 59, 0.5);
/* Depois */
--surface: #1e293b;
```

---

## Bug #2 — SOF-27

- **Título:** Dbug: Tela de estoque — Painel de histórico transparente no Dark Mode
- **Link:** https://linear.app/venza-project/issue/SOF-27/dbug-tela-de-estoque
- **Prioridade:** Alta
- **Status:** `resolvido`

### Root Cause
Mesma causa que SOF-25. O `DrawerHistorico` em `estoque/page.tsx` também usa `background: "var(--surface)"`. A correção do token CSS resolve ambos.

### Fix Aplicado
Mesmo fix do SOF-25 — `--surface: #1e293b` em dark mode.

---

## Bug #3 — SOF-26

- **Título:** Dbug: Tela de produtos — Imagem de produto não salva / erro no upload
- **Link:** https://linear.app/venza-project/issue/SOF-26/dbug-tela-de-produtos
- **Prioridade:** Alta
- **Status:** `resolvido`

### Root Cause (3 camadas)

**Camada 1 — API `routes.ts`:** `ProductUpsertSchema` não declarava `imageUrl`, `isAvailable`, `isFeatured`. Se TypeBox usa `additionalProperties: false`, requests com esses campos são rejeitados.

**Camada 2 — API `catalog-service.ts`:** `ProductUpsertInput` não incluía os campos. `createPartnerProduct` hardcodava `imageUrl: null`. `updatePartnerProduct` não atualizava nenhum dos 3 campos.

**Camada 3 — Frontend `actions.ts`:** `criarProduto` e `editarProduto` não declaravam `imageUrl`, `isAvailable`, `isFeatured` nos tipos, causando possível descarte silencioso.

**Camada 4 — Frontend `ProdutoModal.tsx`:** `accept="image/jpeg,image/png,image/webp"` rejeitava GIF e outros formatos.

### Fixes Aplicados

**`app/apps/api/src/modules/partner/routes.ts`** — `ProductUpsertSchema`:
```typescript
imageUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
isAvailable: Type.Optional(Type.Boolean()),
isFeatured: Type.Optional(Type.Boolean()),
```

**`app/apps/api/src/modules/partner/catalog-service.ts`** — `ProductUpsertInput`:
```typescript
imageUrl?: string | null;
isAvailable?: boolean;
isFeatured?: boolean;
```

**`catalog-service.ts`** — `createPartnerProduct`:
```typescript
imageUrl: input.imageUrl ?? null,       // era: imageUrl: null
isAvailable: input.isAvailable ?? true, // era: isAvailable: true (hardcoded)
isFeatured: input.isFeatured ?? false,  // era: isFeatured: false (hardcoded)
```

**`catalog-service.ts`** — `updatePartnerProduct` data spread:
```typescript
...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
```

**`app/apps/web-partner/src/app/(dashboard)/catalogo/actions.ts`** — ambos os tipos:
```typescript
imageUrl?: string | null;
isAvailable?: boolean;
isFeatured?: boolean;
```

**`app/apps/web-partner/src/app/(dashboard)/catalogo/ProdutoModal.tsx`**:
```
accept="image/*"   // era: "image/jpeg,image/png,image/webp"
```

---

## Resumo Final

| # | ID | Título | Status |
|---|-----|--------|--------|
| 1 | SOF-25 | Drawer pedidos transparente dark mode | resolvido |
| 2 | SOF-27 | Drawer estoque transparente dark mode | resolvido |
| 3 | SOF-26 | Imagem produto não salva — pipeline quebrado | resolvido |

**Total encontrados:** 3 issues Linear / 2 bugs únicos (SOF-25+SOF-27 mesma causa)
**Total resolvidos:** 3
**Total bloqueados:** 0
**Typecheck:** 0 erros

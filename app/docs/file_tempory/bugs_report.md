# Bugs Report — Linear BUG Issues
> Gerado em: 2026-04-10 | Agente: nicholas-orchestrator
> Atualizado: 2026-04-13 — ETAPA 2 concluída

---

## Bug #1 — SOF-25
- **Título:** Dbug: Tela de pedidos — Painel de detalhes transparente no Dark Mode
- **Link:** https://linear.app/venza-project/issue/SOF-25/dbug-tela-de-pedidos
- **Prioridade:** Alta
- **Status:** `resolvido` (commit 0486247)

---

## Bug #2 — SOF-27
- **Título:** Dbug: Tela de estoque — campo `motivo` obrigatório mesmo sendo opcional
- **Link:** https://linear.app/venza-project/issue/SOF-27/dbug-tela-de-estoque
- **Prioridade:** Alta
- **Status:** `resolvido`

### Root Cause
O schema TypeBox do endpoint `POST /partner/estoque/movimentacao` declarava `motivo: Type.String({ minLength: 1 })` (obrigatório, sem string vazia), enquanto o frontend exibia o campo como "(opcional)" para movimentações do tipo `replenishment`.

### Fix Aplicado
**`apps/api/src/modules/partner/routes.ts`:**
- Tipo genérico: `motivo: string` → `motivo?: string`
- Validação TypeBox: `Type.String({ minLength: 1 })` → `Type.Optional(Type.String())`

**`apps/api/src/modules/partner/estoque-service.ts`:**
- Tipo `MovimentacaoInput`: `motivo: string` → `motivo?: string`
- Insert no DB: `reason: input.motivo` → `reason: input.motivo ?? ""`

Schema Prisma não foi alterado (campo `reason String` permanece non-nullable, recebe `""` quando não informado).

---

## Bug #3 — SOF-26
- **Título:** Dbug: Tela de produtos — Upload de imagem falha com "Bucket not found"
- **Link:** https://linear.app/venza-project/issue/SOF-26/dbug-tela-de-produtos
- **Prioridade:** Alta
- **Status:** `resolvido`

### Root Cause (3 camadas)
1. O bucket `product-images` não existia no Supabase (ou políticas RLS bloqueavam upload)
2. O upload era feito diretamente pelo cliente com anon key, sem garantia de que o bucket existe
3. Sem compressão de imagem, arquivos grandes causavam erros de tamanho

### Fix Aplicado

**`apps/api/src/plugins/supabase.ts`:**
- Adicionado `supabaseAdmin` com `SUPABASE_SERVICE_ROLE_KEY` (já configurado no .env)
- Na inicialização: verifica se bucket `product-images` existe; cria-o como público com limite de 10MB se não existir
- Adicionado `supabaseAdmin` ao `FastifyInstance` via module augmentation

**`apps/api/src/modules/partner/routes.ts`:**
- Novo endpoint `POST /partner/upload/signed-url` (autenticado)
- Usa `supabaseAdmin` para gerar signed upload URL via `createSignedUploadUrl`
- Retorna `{ signedUrl, token, path, publicUrl }`

**`apps/web-partner/src/app/(dashboard)/catalogo/ProdutoModal.tsx`:**
- Adicionado `fetchComAuth` (padrão dos outros componentes) e `comprimirImagem` via Canvas API
- Novo fluxo: comprimir → obter signed URL do backend → upload via `uploadToSignedUrl`
- Aceita qualquer formato de imagem sem restrição de tamanho no cliente

---

## Resumo Final

| # | ID | Título | Status |
|---|-----|--------|--------|
| 1 | SOF-25 | Drawer pedidos transparente dark mode | resolvido |
| 2 | SOF-27 | Campo motivo obrigatório no estoque | resolvido |
| 3 | SOF-26 | Upload imagem — Bucket not found | resolvido |

**Total encontrados:** 3 issues Linear
**Total resolvidos:** 3
**Total bloqueados:** 0
**Typecheck:** 0 erros

# Bugs Report — Linear BUG Issues
> Gerado em: 2026-04-10 | Agente: nicholas-orchestrator
> Atualizado: 2026-04-13 — ETAPA 2 ciclo anterior concluída
> Atualizado: 2026-04-14 — Nova rodada iniciada (SOF-48, SOF-50, SOF-51)

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

# Nova Rodada — 2026-04-14

---

## Bug #4 — SOF-48 ✅

- **Título:** Bug: [PDV] Campo de troco exibe zero ao invés de "valor insuficiente" quando valor digitado é menor que o total
- **Link:** https://linear.app/venza-project/issue/SOF-48/bug-pdv-campo-de-troco-exibe-zero-ao-inves-de-valor-insuficiente
- **Prioridade:** Alta
- **Descrição:** O cálculo de troco deve exibir feedback de erro visual quando o valor digitado é menor que o total. Critérios de aceitação:
  - Valor < total → "Valor insuficiente — faltam R$ X,XX" em vermelho
  - Valor = total → "Troco: R$ 0,00" em verde
  - Valor > total → "Troco: R$ X,XX" em verde
  - Campo vazio → nada exibido
  - Botão "Finalizar" desabilitado quando valorRecebido > 0 e < total
  - Botão habilitado quando campo está vazio
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/pdv/page.tsx` (linhas 635–677)
  - `app/apps/web-partner/src/app/(dashboard)/pedidos/PedidoManualModal.tsx` (linhas 723–782)
- **Status:** `resolvido`
- **Fix aplicado:**
  - Adicionado `useMemo` nos imports de ambos os arquivos
  - Derivado `trocoInsuficiente` com `useMemo` (deps: `metodoPagamento`, `valorRecebido`, `subtotal`)
  - Mensagem atualizada: `"Valor insuficiente — faltam ${formatCents(subtotal - recebidoCents)}"`
  - Botão Finalizar/Criar: `disabled={enviando || trocoInsuficiente}` + `title` de tooltip

---

## Bug #5 — SOF-50 ✅

- **Título:** Bug: Analise de Financeiro
- **Link:** https://linear.app/venza-project/issue/SOF-50/bug-analise-de-financeiro
- **Prioridade:** Média
- **Descrição:** No gráfico da seção de financeiro/relatórios, ao passar o mouse nos gráficos o tooltip abre com fundo branco e letras brancas — texto invisível.
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/relatorios/GraficoLinha.tsx` (TooltipCustom linha ~50)
  - `app/apps/web-partner/src/app/(dashboard)/relatorios/GraficoDonut.tsx` (TooltipCustom linha ~31)
  - `app/apps/web-partner/src/app/(dashboard)/relatorios/GraficoPicoHora.tsx` (TooltipCustom linha ~40)
- **Status:** `resolvido`
- **Fix aplicado:**
  - Substituído `background: "var(--night, #0f172a)"` por `background: "#1e293b"` nos 3 arquivos
  - Adicionado `border: "1px solid rgba(255,255,255,0.1)"` em todos os tooltips para contraste consistente

---

## Bug #6 — SOF-51 ✅

- **Título:** Bug: Tela principal (kanban na side dark)
- **Link:** https://linear.app/venza-project/issue/SOF-51/bug-tela-principal-kanban-na-side-dark
- **Prioridade:** Média
- **Descrição:** Drawer de detalhes de pedido aparece correto no tema light mas no tema dark aparece sobreposto ao kanban, menor, posicionado incorretamente — flutua no meio em vez de ocupar a lateral direita.
- **Arquivos afetados:**
  - `app/apps/web-partner/src/app/(dashboard)/pedidos/PedidoDetalhe.tsx` (linhas 155–fin)
  - `app/apps/web-partner/src/app/globals.css` (dark mode section)
- **Status:** `resolvido`
- **Fix aplicado:**
  - Adicionado `isDark` state com `useEffect` que observa `data-theme` via `MutationObserver`
  - Overlay: `isDark ? "rgba(0,0,0,0.65)" : "rgba(10,10,14,0.45)"` — visível em ambos os temas
  - Drawer shadow: `isDark ? "-8px 0 40px rgba(0,0,0,0.6)" : "-8px 0 40px rgba(15,23,42,.18)"`
  - Drawer border: `isDark ? "1px solid var(--border)" : "none"` — delimita o painel no dark mode

---

## Resumo Rodada Atual (2026-04-14)

| # | Issue | Prioridade | Status |
|---|-------|-----------|--------|
| 4 | SOF-48 — Troco PDV | Alta | pendente |
| 5 | SOF-50 — Tooltip Financeiro | Média | pendente |
| 6 | SOF-51 — Drawer Dark Mode | Média | pendente |

**Total encontrado nesta rodada:** 3 bugs  
**Total resolvidos:** 3  
**Total bloqueados:** 0  
**Typecheck:** 0 erros

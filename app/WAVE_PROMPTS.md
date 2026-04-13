# Vendza — Prompts de Execução por Wave

> Cole cada prompt em uma nova sessão Claude Code aberta no diretório do projeto.
> Cada sessão opera em isolamento. Não inicie uma wave antes da anterior terminar (exceto onde indicado como "paralelo").

---

## WAVE 1 — 4 sessões simultâneas (abrir ao mesmo tempo)(FEITA)

---

### WAVE 1-A — GitHub Actions CI(FEITO)

```
Você é um agente de engenharia trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar o pipeline de CI com GitHub Actions (story P3-03).

ESCOPO EXATO — toque APENAS estes arquivos:
- .github/workflows/ci.yml (criar)
- README.md (adicionar badge de CI, se existir)

NÃO toque nenhum arquivo dentro de app/ (nenhum .ts, .tsx, .json de package).

CHECKLIST DE IMPLEMENTAÇÃO:
1. Criar .github/workflows/ci.yml que dispara em push e pull_request para master e main
2. Job "typecheck":
   - uses: actions/checkout@v4
   - setup Node 22 + pnpm via corepack
   - Cache do pnpm store (actions/cache com key baseada em pnpm-lock.yaml)
   - corepack pnpm install --frozen-lockfile
   - cd app && corepack pnpm typecheck
3. Job "build" (depende de typecheck):
   - Mesmo setup
   - Envs dummy para Next.js não quebrar: NEXT_PUBLIC_API_URL=http://localhost:3333, SUPABASE_URL=https://placeholder.supabase.co, SUPABASE_ANON_KEY=placeholder
   - cd app && corepack pnpm build
4. Upload de playwright-report/ como artefato em caso de falha (actions/upload-artifact)
5. Badge de status no topo do README.md se existir

REGRAS:
- Node version: 22
- pnpm sempre via corepack (não instalar pnpm diretamente)
- Secrets a documentar (não hardcodar): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_API_URL
- O job de build deve ter continue-on-error: false

APÓS TERMINAR:
1. Commitar com mensagem: feat: P3-03 - GitHub Actions CI typecheck + build
2. Mover card do Trello para "Fazendo" e depois "Feitas":
   - Binary: C:\Users\USER\bin\trello.exe
   - Card ID: 69d6bb1072dbade54e749f8d
   - Lista "Feitas" ID: 69d6bb18d88b366f2318584ae (verificar antes com boards get se necessário)
   - Comando: C:\Users\USER\bin\trello.exe cards move --card 69d6bb1072dbade54e749f8d --list 69d6a78d88b366f2318584ae
```

---

### WAVE 1-B — Design Final: Logo e og:image(FEITO)

```
Você é um agente de frontend trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Finalizar identidade visual — logo, favicon e og:image (stories P5-01 e P5-02).

CONTEXTO DO PROJETO:
- web-client: vitrine do cliente em apps/web-client/ (porta 3000)
- web-partner: painel do parceiro em apps/web-partner/ (porta 3001)
- Design tokens (já existem em globals.css de cada app):
  --green: #2D6A4F (CTA primário)
  --amber: #E07B39 (destaque)
  --blue: #1B3A4B (sidebar/header escuro)
  --cream: #F7F3EE (background)
  --carbon: #1A1A2E (texto)
- Tipografia: Inter (body) + Space Grotesk (valores numéricos)

ESCOPO — toque APENAS:
- apps/web-client/public/ (logo, favicon, og-image)
- apps/web-partner/public/ (logo, favicon)
- apps/web-client/src/app/layout.tsx (metatags og:image)
- apps/web-client/src/components/Header* ou onde o logo atual está
- apps/web-partner/src/app/layout.tsx (metatags)
- Componente de header do web-partner onde o logo aparece

CHECKLIST:
1. Criar logo SVG da Vendza em /public/logo.svg nos dois apps:
   - Texto "Vendza" em Space Grotesk 700
   - Cor: #2D6A4F (verde) para web-client, #FFFFFF para web-partner (fundo escuro)
   - Dimensões: viewBox "0 0 120 32", altura visual ~24px
2. Criar favicon.ico ou favicon.svg (letra V em verde #2D6A4F, fundo cream #F7F3EE)
3. Criar og-image.png 1200×630 (pode ser SVG exportado ou HTML/CSS estático):
   - Background: #1B3A4B
   - Logo Vendza em branco centralizado
   - Tagline: "Seu Commerce OS" em Inter 400 branco com opacity 0.7
4. Atualizar apps/web-client/src/app/layout.tsx com:
   - <meta property="og:image" content="/og-image.png" />
   - <meta property="og:title" content="Vendza" />
   - <meta name="twitter:card" content="summary_large_image" />
5. Substituir qualquer logo placeholder/texto por <img src="/logo.svg"> nos headers
6. Verificar: corepack pnpm typecheck deve passar sem erros

REGRAS:
- Não criar arquivos .tsx desnecessários — apenas o mínimo para substituir o logo
- Não modificar globals.css (já está correto)
- Não tocar arquivos de API ou lógica de negócio

APÓS TERMINAR:
1. Commitar: feat: P5-01/P5-02 - logo oficial, favicon e og:image
2. Mover card Trello:
   - Binary: C:\Users\USER\bin\trello.exe
   - Card ID: 69d6bb13c0af811194247c3e
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb13c0af811194247c3e --list 69d6a78d88b366f2318584ae
```

---

### WAVE 1-C — Impressão de Pedido (80mm)(FEITO)

```
Você é um agente de frontend trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar botão e layout de impressão de pedido para impressoras térmicas 80mm (Grupo 11).

CONTEXTO:
- web-partner: painel do parceiro em apps/web-partner/ (porta 3001)
- Página de detalhes de pedido existente em apps/web-partner/src/app/(dashboard)/pedidos/[id]/
- Prefixo CSS do web-partner: .wp-*
- Design tokens: --blue #1B3A4B, --green #2D6A4F, --carbon #1A1A2E

ESCOPO — toque APENAS:
- apps/web-partner/src/components/PrintOrder.tsx (criar)
- apps/web-partner/src/app/(dashboard)/pedidos/[id]/page.tsx (adicionar botão)
- apps/web-partner/src/app/globals.css (adicionar apenas @media print, no final)

CHECKLIST:
1. Criar componente PrintOrder.tsx:
   - Props: { order: Order & { items: OrderItem[], customer: Customer, events: OrderEvent[] } }
   - Marcação simples: cabeçalho (nome da loja, data/hora, publicId PED-XXXX), itens (nome, qtd, preço unitário, total), rodapé (subtotal, frete, total, forma de pagamento, endereço, observações)
   - Não usar "use client" — componente puro de apresentação
2. Adicionar ao final de globals.css (sem modificar nada existente):
   @media print {
     body * { visibility: hidden; }
     .wp-print-area, .wp-print-area * { visibility: visible; }
     .wp-print-area { position: absolute; top: 0; left: 0; width: 100%; }
     .wp-no-print { display: none !important; }
     @page { size: 80mm auto; margin: 5mm; }
   }
3. Na página de detalhes do pedido:
   - Envolver <PrintOrder> em <div className="wp-print-area">
   - Adicionar <button onClick={() => window.print()} className="wp-no-print">
   - Botão visível apenas para role owner e manager (verificar role do usuário logado)
4. Fonte de impressão: font-family monospace, font-size 12px, line-height 1.4
5. Verificar: corepack pnpm typecheck deve passar

REGRAS:
- NÃO modificar rotas de API
- NÃO criar novas páginas
- NÃO alterar outros componentes do web-partner
- NÃO usar bibliotecas de PDF — apenas window.print()

APÓS TERMINAR:
1. Commitar: feat: Grupo 11 - impressão de pedido 80mm
2. Mover card Trello:
   - Binary: C:\Users\USER\bin\trello.exe
   - Card ID: 69d6bb1bcfcdf59a3d61ef32
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb1bcfcdf59a3d61ef32 --list 69d6a78d88b366f2318584ae
```

---

### WAVE 1-D — Validação Mobile e Responsividade(FEITO)

```
Você é um agente de frontend trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Auditar e corrigir responsividade mobile do storefront web-client (story P4-03).

CONTEXTO:
- web-client em apps/web-client/ — vitrine do cliente
- Prefixo CSS: .wc-*
- Viewports alvo: 375px (iPhone SE), 390px (iPhone 14), 768px (tablet)
- web-partner não precisa ser mobile-first, mas deve funcionar em 1024px

ESCOPO — toque APENAS:
- apps/web-client/src/app/globals.css
- apps/web-client/src/components/*.tsx (apenas ajustes CSS/className)
- apps/web-partner/src/app/globals.css (apenas media queries para 1024px se necessário)

NÃO MODIFIQUE lógica de negócio, rotas, contextos ou hooks.

CHECKLIST — auditar e corrigir cada item:
1. Header: logo + ícone carrinho acessíveis em 375px, sem overflow horizontal
2. Grid de produtos: 1 coluna em <480px, 2 colunas em 480-768px, 3+ em desktop
3. CartSheet (drawer lateral): ocupa 100% da altura em mobile, scroll interno nos itens
4. Checkout form: campos de input com width: 100%, font-size >= 16px (evitar zoom automático iOS)
5. Página de produto: imagem + botão "Adicionar" visíveis sem scroll horizontal
6. Tracking page: timeline legível em 375px
7. Botões CTA: min-height: 44px (touch target mínimo Apple/Google)
8. Age gate modal: centralizado e fechável em mobile
9. Verificar overflow-x: hidden no body para evitar scroll lateral indesejado
10. web-partner sidebar: recolhível em 1024px se ainda não estiver

PROCESSO:
- Leia os arquivos CSS e componentes antes de modificar
- Adicione media queries no final dos arquivos CSS existentes, não no meio
- Prefira max-width/min-width breakpoints: 480px, 768px, 1024px
- Rode corepack pnpm typecheck após alterações

APÓS TERMINAR:
1. Commitar: fix: P4-03 - responsividade mobile storefront e tablet web-partner
2. Mover card Trello:
   - Binary: C:\Users\USER\bin\trello.exe
   - Card ID: 69d6bb127393af826510e56c
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb127393af826510e56c --list 69d6a78d88b366f2318584ae
```

---

## WAVE 2 — 3 sessões simultâneas (após Wave 1 completa)(FEITO)

---

### WAVE 2-A — Analytics e Desempenho(FEITO)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar o painel de Analytics e Desempenho (Grupo 5 do feat-implementar.md).

CONTEXTO DO PROJETO:
- API Fastify 5 em apps/api/src/ — porta 3333
- web-partner Next.js 15 em apps/web-partner/ — porta 3001
- Envelope de resposta obrigatório: { data, meta: { requestedAt, stub: false }, error: null }
- storeId SEMPRE vem de request.partnerContext.storeId (NUNCA do body)
- Import Prisma: import { prisma } from "@vendza/database"
- Import http helpers: import { ok } from "../../lib/http.js"
- ESM: imports locais usam .js mesmo sendo .ts

ESCOPO — toque APENAS:
- apps/api/src/modules/partner/ (adicionar reports service e rota)
- apps/web-partner/src/app/(dashboard)/desempenho/ (criar página)

CHECKLIST — API:
1. Criar apps/api/src/modules/partner/reports-service.ts com função getPartnerReports(storeId, from, to):
   - Validar range máximo de 90 dias (retornar 400 se ultrapassar)
   - KPIs via prisma.$queryRaw (não findMany):
     * faturamento: SUM(totalCents) dos pedidos delivered no período
     * ticketMedio: faturamento / count(pedidos)
     * totalPedidos: COUNT(orders) no período
     * clientesNovos: COUNT(customers) com createdAt no período
     * taxaRecompra: clientes com 2+ pedidos / total clientes com pedido no período
     * taxaCancelamento: cancelled / total no período
   - Dados de gráfico: vendas agrupadas por hora (0-23), top 10 produtos por qtd vendida
   - Distribuição de formas de pagamento: GROUP BY paymentMethod
2. Criar rota GET /v1/partner/desempenho?from=ISO&to=ISO no arquivo de rotas do partner
3. Registrar rota no app.ts se necessário

CHECKLIST — Frontend:
4. Criar apps/web-partner/src/app/(dashboard)/desempenho/page.tsx:
   - Server Component fazendo fetch da rota /partner/desempenho
   - Seletor de período no topo: Hoje / Esta semana / Este mês / Mês passado / Custom
   - Cards de KPIs no topo (6 cards em grid 3×2)
   - Gráfico de barras de vendas por hora (implementar com CSS puro ou recharts se já instalado)
   - Tabela top 10 produtos com badge ABC
   - Distribuição de pagamentos em lista com percentuais
   - Usar tokens --blue, --green, --amber, --carbon do globals.css

QUALIDADE:
- corepack pnpm typecheck deve passar com 0 erros
- Usar prisma.$queryRaw apenas para agregações — não para queries simples
- storeId NUNCA do body

APÓS TERMINAR:
1. Commitar: feat: Grupo 5 - analytics e desempenho com KPIs e gráficos
2. Mover card Trello:
   - Binary: C:\Users\USER\bin\trello.exe
   - Card ID: 69d6bb16cb72c2ffdaca8b2d
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb16cb72c2ffdaca8b2d --list 69d6a78d88b366f2318584ae
```

---

### WAVE 2-B — Promoções e Alertas de Giro(FEITO)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar Central de Promoções (Grupo 2 do feat-implementar.md).

CONTEXTO DO PROJETO:
- API Fastify 5 em apps/api/src/ — porta 3333
- web-partner Next.js 15 em apps/web-partner/ — porta 3001
- Envelope: { data, meta: { requestedAt, stub: false }, error: null }
- storeId SEMPRE de request.partnerContext.storeId
- Import Prisma: import { prisma } from "@vendza/database"
- Import http: import { ok } from "../../lib/http.js"
- ESM local imports: .js

ESCOPO — toque APENAS:
- apps/api/src/modules/partner/ (adicionar promocoes service e rota)
- apps/web-partner/src/app/(dashboard)/promocoes/ (criar página)

CHECKLIST — API:
1. Criar apps/api/src/modules/partner/promocoes-service.ts com getPromocoes(storeId):
   - Produtos em promoção: WHERE salePriceCents < listPriceCents AND isAvailable = true
   - Calcular % de desconto: Math.round((1 - salePriceCents/listPriceCents) * 100)
   - Alertas de giro parado: produtos sem OrderItem nos últimos 14 dias
   - Alertas de estoque alto: currentStock > 2 * safetyStock AND sem venda proporcional
   - (Validade: se o model tiver campo expiresAt, filtrar < 15 dias)
   - Retornar: { emPromocao: Product[], alertasParado: Product[], alertasEstoqueAlto: Product[] }
2. Rota GET /v1/partner/promocoes
3. Reutilizar rota PATCH /v1/partner/products/:id já existente para editar salePriceCents

CHECKLIST — Frontend:
4. Criar apps/web-partner/src/app/(dashboard)/promocoes/page.tsx:
   - Seção "Em Promoção": tabela com nome, preço original vs. promo, % desconto, estoque
   - Botão inline "Editar preço" que abre modal com input de novo preço
   - Seção "Alertas": cards por tipo (Parado / Estoque Alto) com sugestão de ação
   - Badge colorido por tipo de alerta (amber para parado, vermelho para crítico)
   - Botão "Criar promoção rápida": formulário inline (produto + preço promo)

QUALIDADE:
- corepack pnpm typecheck deve passar
- Não criar novos models no schema (usar campos existentes)

APÓS TERMINAR:
1. Commitar: feat: Grupo 2 - central de promoções e alertas de giro
2. Mover card Trello:
   - Binary: C:\Users\USER\bin\trello.exe
   - Card ID: 69d6bb147228aa0a5a8198fa
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb147228aa0a5a8198fa --list 69d6a78d88b366f2318584ae
```

---

### WAVE 2-C — CRM: Tags, Notas e Histórico do Cliente(FEITO)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar Tags, Notas internas e Histórico do cliente no CRM (Grupo 10).

CONTEXTO:
-metade da tarefa foi feita, analise o que foi feito e contiue.
- API Fastify 5 em apps/api/src/ — porta 3333
- web-partner Next.js 15 em apps/web-partner/ — porta 3001
- Schema Prisma em packages/database/prisma/schema.prisma
- Após qualquer mudança no schema: corepack pnpm db:generate (NÃO db:migrate — usar db:push)
- storeId SEMPRE de request.partnerContext.storeId
- ESM: imports locais .js

ESCOPO — toque APENAS:
- packages/database/prisma/schema.prisma (adicionar CustomerTag e CustomerNote)
- apps/api/src/modules/partner/crm* (adicionar rotas de tags e notas)
- apps/web-partner/src/app/(dashboard)/clientes/[id]/ (expandir página existente)

CHECKLIST — Schema:
1. Adicionar ao schema.prisma:
   model CustomerTag {
     id         String   @id @default(cuid())
     customerId String
     storeId    String
     label      String
     createdAt  DateTime @default(now())
     customer   Customer @relation(fields: [customerId], references: [id])
     @@unique([customerId, label])
   }
   model CustomerNote {
     id              String   @id @default(cuid())
     customerId      String
     storeId         String
     body            String
     createdAt       DateTime @default(now())
     createdByUserId String
     customer        Customer @relation(fields: [customerId], references: [id])
   }
2. Adicionar relações em Customer: tags CustomerTag[], notes CustomerNote[]
3. Rodar: cd app && corepack pnpm db:generate && corepack pnpm db:push

CHECKLIST — API:
4. Rotas de tags: POST /v1/partner/clientes/:id/tags, DELETE /v1/partner/clientes/:id/tags/:label
5. Rota de notas: POST /v1/partner/clientes/:id/notas (append-only — NUNCA update/delete)
6. GET /v1/partner/clientes/:id já deve incluir tags, notes e histórico de pedidos (expandir query)

CHECKLIST — Frontend:
7. Na página /clientes/[id], adicionar 3 seções:
   - "Tags": chips coloridos com botão X para remover + input para adicionar nova tag
   - "Notas internas": textarea + botão salvar, lista de notas com data e usuário (append-only)
   - "Histórico": timeline de pedidos (publicId, data, total, status), total gasto, frequência

QUALIDADE:
- CustomerNote é append-only: NUNCA implementar UPDATE ou DELETE de notas
- corepack pnpm typecheck deve passar com 0 erros

APÓS TERMINAR:
1. Commitar: feat: Grupo 10 - CRM tags, notas e histórico do cliente
2. Mover card Trello:
   - Binary: C:\Users\USER\bin\trello.exe
   - Card ID: 69d6bb1a5e13547612ab2492
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb1a5e13547612ab2492 --list 69d6a78d88b366f2318584ae
```

---

## WAVE 3 — Sequencial (schema changes — uma de cada vez) (feito)

> ⚠️ Não rodar em paralelo. Cada uma faz `db:push`. Aguardar commit da anterior antes de iniciar a próxima.

---

### WAVE 3-1 — P2-09: Endereços Salvos do Cliente(feito)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar endereços salvos do cliente (P2-09 + Grupo 12).

IMPORTANTE: Esta tarefa inclui mudança no schema Prisma. Testa via mcp playwrite e Rodar db:push ao final.

CONTEXTO:
- web-client: apps/web-client/ — vitrine
- API: apps/api/src/
- Schema: packages/database/prisma/schema.prisma
- Endereços são salvos em localStorage nesta versão (sem autenticação do cliente)
  chave: "vendza-enderecos" → array de até 3 objetos
- Perfil do cliente: chave "vendza-perfil" → { nome, telefone, email }

ESCOPO:
- packages/database/prisma/schema.prisma (adicionar CustomerAddress para uso futuro)
- apps/web-client/src/ (nova página + componentes + lógica de localStorage)
- apps/api/src/ (NÃO precisa de rota nova nesta versão — tudo é localStorage)

CHECKLIST — Schema (preparar para futuro):
1. Adicionar ao schema.prisma:
   model CustomerAddress {
     id          String   @id @default(cuid())
     customerId  String
     storeId     String
     label       String   // "Casa", "Trabalho", "Outro"
     logradouro  String
     numero      String
     complemento String?
     bairro      String
     cep         String
     lat         Float?
     lng         Float?
     createdAt   DateTime @default(now())
     customer    Customer @relation(fields: [customerId], references: [id])
   }
2. Adicionar relação em Customer: addresses CustomerAddress[]
3. Rodar: cd app && corepack pnpm db:generate && corepack pnpm db:push

CHECKLIST — Frontend (localStorage, sem API):
4. Criar hook apps/web-client/src/hooks/useEnderecos.ts:
   - Ler/escrever "vendza-enderecos" no localStorage
   - Máximo 3 endereços. Retornar: { enderecos, salvar, remover, selecionar }
5. Criar apps/web-client/src/app/perfil/page.tsx:
   - Seção "Meu perfil": campos nome, telefone, email → salvar em "vendza-perfil"
   - Seção "Meus endereços": lista dos 3 slots com botão adicionar/remover
   - Formulário de novo endereço: label (select), logradouro, numero, bairro, cep, complemento
6. No checkout (apps/web-client/src/app/checkout/page.tsx):
   - Se há endereços salvos: exibir seletor no topo do form
   - Ao selecionar endereço salvo: preencher campos automaticamente
   - Checkbox "Salvar este endereço" após preencher manualmente
7. Header do storefront: adicionar ícone de perfil linkando para /perfil
8. Pré-preencher campos de nome/telefone/email do checkout com dados de "vendza-perfil"

QUALIDADE:
- corepack pnpm typecheck deve passar
- Usar "use client" apenas nos componentes que precisam de useState/localStorage

APÓS TERMINAR:
1. Commitar: feat: P2-09 - endereços salvos e perfil do cliente (localStorage)
2. Mover card P2-09:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb10a09e4d42deb4d079 --list 69d6a78d88b366f2318584ae
3. Mover card P2-08:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb0fb09a16c05ac4e6f3 --list 69d6a78d88b366f2318584ae
```

---

### WAVE 3-2 — Grupo 8: Minha Conta do Parceiro / Configurações|(feito)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar configurações completas da conta do parceiro (Grupo 8).

IMPORTANTE: Esta tarefa inclui mudanças no schema Prisma. Rodar db:push ao final.
AGUARDAR que a Wave 3-1 esteja commitada antes de iniciar.

CONTEXTO:
- API: apps/api/src/
- web-partner: apps/web-partner/
- Schema: packages/database/prisma/schema.prisma
- storeId SEMPRE de request.partnerContext.storeId
- ESM: .js em imports locais

CHECKLIST — Schema:
1. Adicionar model StoreHours:
   model StoreHours {
     id        String   @id @default(cuid())
     storeId   String
     dayOfWeek Int      // 0=Dom, 1=Seg, ..., 6=Sab
     opensAt   String   // "HH:MM"
     closesAt  String   // "HH:MM"
     isClosed  Boolean  @default(false)
     store     Store    @relation(fields: [storeId], references: [id])
     @@unique([storeId, dayOfWeek])
   }
2. Adicionar model StoreBankAccount:
   model StoreBankAccount {
     id             String   @id @default(cuid())
     storeId        String   @unique
     keyType        String   // cpf | cnpj | telefone | email | aleatoria
     encryptedKey   String   // criptografado (por ora: base64 simples — pgcrypto em V3)
     lastFourDigits String
     bankName       String?
     updatedAt      DateTime @updatedAt
     updatedByUserId String?
     store          Store    @relation(fields: [storeId], references: [id])
   }
3. Adicionar relações em Store: hours StoreHours[], bankAccount StoreBankAccount?
4. Rodar: cd app && corepack pnpm db:generate && corepack pnpm db:push

CHECKLIST — API:
5. GET/PUT /v1/partner/configuracoes/loja — dados da loja (nome, slug, desc, whatsapp, endereço, status, etaMinutes, minimumOrderValueCents)
6. GET/PUT /v1/partner/configuracoes/horarios — upsert StoreHours (7 registros por loja)
7. GET/PUT /v1/partner/configuracoes/conta-bancaria:
   - GET: retornar apenas keyType, lastFourDigits, bankName (NUNCA a encryptedKey)
   - PUT: salvar encryptedKey como Buffer.from(key).toString('base64') por enquanto
   - Log de auditoria: salvar updatedByUserId do partnerContext
8. GET /v1/partner/configuracoes/usuarios — lista StoreUser com role
9. POST /v1/partner/configuracoes/usuarios/convidar — registrar convite (pode ser stub com meta.stub:true)
10. DELETE /v1/partner/configuracoes/usuarios/:id — revogar acesso

CHECKLIST — Frontend:
11. Expandir /configuracoes/ com abas: Loja | Horários | Dados Bancários | Usuários
12. Aba Loja: form com todos os campos + toggle de status (open/closed/paused)
13. Aba Horários: grade visual 7 linhas (Dom-Sab), toggle Fechado + inputs HH:MM
14. Aba Dados Bancários: form com keyType select + input mascarado, exibir apenas últimos 4 dígitos
15. Aba Usuários: tabela de usuários com role badge + botão revogar

QUALIDADE:
- encryptedKey NUNCA retornar no GET
- corepack pnpm typecheck deve passar

APÓS TERMINAR:
1. Commitar: feat: Grupo 8 - configurações da conta do parceiro (loja, horários, banco, usuários)
2. Mover card Trello:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb19e649f7739660d931 --list 69d6a78d88b366f2318584ae
```

---

### WAVE 3-3 — Grupo 1: Gestão de Estoque(FEITO)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar página de Gestão de Estoque (Grupo 1 do feat-implementar.md).

AGUARDAR que a Wave 3-2 esteja commitada antes de iniciar.

CONTEXTO:
- API: apps/api/src/
- web-partner: apps/web-partner/
- Schema já tem: InventoryItem (currentStock, safetyStock), InventoryMovement (append-only!)
- InventoryMovement é APPEND-ONLY — NUNCA update ou delete
- storeId SEMPRE de request.partnerContext.storeId

ESCOPO:
- apps/api/src/modules/partner/ (estoque service e rotas)
- apps/web-partner/src/app/(dashboard)/estoque/ (criar página)

CHECKLIST — API:
1. GET /v1/partner/estoque — lista produtos com:
   - currentStock, safetyStock, status (ok|atencao|critico)
   - status: critico se currentStock <= safetyStock, atencao se <= 1.5x safetyStock
   - giro: contagem de OrderItem do produto nos últimos 30 dias / currentStock
   - curvaABC: A (top 20% faturamento), B (próximos 30%), C (restantes)
2. POST /v1/partner/estoque/movimentacao:
   - Body: { productId, tipo, quantidade, motivo, dataHora? }
   - Criar InventoryMovement (append-only)
   - Atualizar InventoryItem.currentStock no mesmo $transaction
   - quantidade positiva = entrada, negativa = saída
3. GET /v1/partner/estoque/:productId/historico?page=1&pageSize=20:
   - Retornar InventoryMovement do produto ordenado por createdAt DESC
   - Paginado

CHECKLIST — Frontend:
4. Criar apps/web-partner/src/app/(dashboard)/estoque/page.tsx:
   - Banner no topo: "N produtos abaixo do estoque mínimo" (clicável → filtra críticos)
   - Filtros: Todos / Críticos / Zerados / Normais
   - Busca em tempo real por nome
   - Tabela: produto, estoque atual, estoque mínimo, status (bolinha colorida), giro, badge ABC
   - Botão "Registrar movimentação" abre modal
5. Modal de movimentação:
   - Select de produto com busca
   - Select de tipo: Entrada (replenishment) | Ajuste (manual_adjustment) | Saída (cancellation)
   - Input de quantidade + motivo (obrigatório para ajuste/saída)
   - Data/hora (padrão: agora)
6. Ao clicar em produto: drawer lateral com histórico de movimentações (timeline)

QUALIDADE:
- InventoryMovement: NUNCA fazer update ou delete — apenas create
- corepack pnpm typecheck deve passar

APÓS TERMINAR:
1. Commitar: feat: Grupo 1 - gestão de estoque com visão geral, movimentações e histórico
2. Mover card Trello:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb145a47ae2df3945f3c --list 69d6a78d88b366f2318584ae
```

---

## WAVE 4 — 3 sessões simultâneas (após Wave 3 completa)(FEITA)

---

### WAVE 4-A — Zonas de Entrega e Cálculo de Frete(FEITO)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar configuração de zonas de entrega e cálculo de frete (Grupo 3).

CONTEXTO:
- API, web-partner E web-client são tocados
- Schema já tem: DeliveryZone (centerLat, centerLng, radiusMeters, feeCents, etaMinutes, mode), DeliveryZoneNeighborhood
- storeId SEMPRE de request.partnerContext.storeId (partner) ou STORE_SLUG env (storefront)

ESCOPO:
- apps/api/src/modules/partner/ (zonas CRUD)
- apps/api/src/modules/storefront/ (calcular-frete)
- apps/web-partner/src/app/(dashboard)/configuracoes/entrega/ (nova aba/página)
- apps/web-client/src/app/checkout/ (integrar cálculo de frete)

CHECKLIST — API Partner:
1. GET/POST/PUT/DELETE /v1/partner/configuracoes/zonas-entrega
2. Cada zona: label, mode (radius|neighborhoods), radiusKm, neighborhoods[], feeCents, etaMinutes, minimumOrderCents, freeShippingAboveCents

CHECKLIST — API Storefront:
3. POST /v1/storefront/calcular-frete com body { lat: number, lng: number } ou { cep: string, numero: string }:
   - Se cep: usar API gratuita ViaCEP (https://viacep.com.br/ws/{cep}/json/) para obter logradouro/bairro
   - Para lat/lng: calcular distância Haversine até centerLat/centerLng de cada zona
   - Para neighborhoods: verificar se bairro do endereço está no array neighborhoods
   - Retornar: { zonaId, label, feeCents, etaMinutes, minimumOrderCents } ou { fora: true }
    
CHECKLIST — Frontend web-partner:
4. Nova aba "Entrega" em /configuracoes/:
   - Toggle: Modo Raio | Modo Bairros
   - Modo Raio: lista de zonas com campos (nome, raio em km, taxa, tempo, mínimo, frete grátis acima de)
   - Modo Bairros: textarea ou chips de bairros por zona
   - Sem mapa por ora (mapa Leaflet pode ser V3) — usar apenas inputs numéricos

CHECKLIST — Frontend web-client:
5. No checkout, após usuário preencher endereço:
   - Chamar POST /storefront/calcular-frete
   - Exibir taxa de entrega e tempo estimado no resumo do pedido
   - Se fora da área: exibir mensagem e bloquear finalização
   - Botão "Usar minha localização": navigator.geolocation → calcular frete

QUALIDADE:
- Haversine sem dependência externa (implementar a fórmula diretamente)
- corepack pnpm typecheck deve passar

APÓS TERMINAR:
1. Commitar: feat: Grupo 3 - zonas de entrega e cálculo de frete
2. Mover card Trello:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb159d37da20d6406c15 --list 69d6a78d88b366f2318584ae
```

---

### WAVE 4-B — Minha Conta do Cliente(FEITO)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar área "Minha Conta" no storefront (Grupo 4).

CONTEXTO:
- web-client em apps/web-client/
- API em apps/api/src/
- Cliente é identificado pelo telefone (sem login com senha)
- Rota de tracking GET /v1/storefront/pedido/:publicId já existe

ESCOPO:
- apps/api/src/modules/storefront/ (adicionar rota de pedidos por telefone)
- apps/web-client/src/app/minha-conta/ (criar seção)

CHECKLIST — API:
1. GET /v1/storefront/cliente/pedidos?phone=:phone:
   - Buscar Customer por phone + storeId (STORE_SLUG env)
   - Retornar pedidos com items, events, total — ordenados por createdAt DESC
   - Paginado: ?page=1&pageSize=10
   - Sem autenticação — apenas o telefone como identificador

CHECKLIST — Frontend:
2. Criar apps/web-client/src/app/minha-conta/page.tsx:
   - Input de telefone para identificação (sem senha)
   - Ao submeter: buscar pedidos via GET /storefront/cliente/pedidos?phone=
   - Salvar telefone no localStorage ("vendza-perfil") para não pedir de novo
3. Lista de pedidos:
   - Card por pedido: publicId, data, status em português simples, total, itens (resumido)
   - Status: Recebido | Em preparo | Saiu para entrega | Entregue | Cancelado
   - Expandir pedido: ver itens detalhados + timeline de OrderEvent
4. Botão "Pedir de novo" em cada pedido:
   - Ler itens do pedido e adicionar todos ao carrinho (localStorage "vendza_carrinho")
   - Redirecionar para home ou checkout
5. Header do web-client: link "Minha conta" no menu

QUALIDADE:
- Sem autenticação real — baseado apenas em telefone (MVP)
- corepack pnpm typecheck deve passar

APÓS TERMINAR:
1. Commitar: feat: Grupo 4 - minha conta cliente com histórico e pedir de novo
2. Mover card Trello:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb16c4d3cf8d77122b45 --list 69d6a78d88b366f2318584ae
```

---

### WAVE 4-C — Notificações Realtime de Pedidos (FEITO)

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar notificações em tempo real de novos pedidos (Grupo 9).

ATENÇÃO: Esta é a tarefa mais complexa. Envolve Socket.io nos 3 apps.

CONTEXTO:
- API já pode ter Socket.io parcialmente configurado (verificar apps/api/src/server.ts)
- Socket rooms: store:{storeId} para partner, order:{publicId} para cliente
- Eventos: order:created, order:status_changed
- web-partner usa "use client" com useEffect para socket
- web-client usa "use client" com useEffect para socket

ESCOPO:
- apps/api/src/ (integrar Socket.io se não tiver, emitir eventos)
- apps/web-partner/src/ (badge + som)
- apps/web-client/src/app/pedidos/[publicId]/ (auto-atualizar)

CHECKLIST — API:
1. Verificar/instalar socket.io se necessário
2. Configurar rooms no servidor ao conectar cliente
3. Emitir order:created no storefront ao criar pedido (POST /orders)
4. Emitir order:status_changed no partner ao mudar status (PATCH /orders/:id/status)
5. Evento payload: { orderId, publicId, storeId, status, ...metadados relevantes }

CHECKLIST — web-partner:
6. Instalar socket.io-client se necessário
7. Criar hook useOrderNotifications(storeId):
   - Conectar ao room store:{storeId}
   - Ao receber order:created: incrementar contador de badge
   - Ao receber order:status_changed: invalidar cache da lista de pedidos
8. Badge no header: contador de pedidos novos (pending+confirmed)
   - Zera ao navegar para /pedidos
9. Som de alerta:
   - Arquivo /public/notificacao.mp3 (gerar ou baixar som simples de ~1s)
   - Tocar apenas após interação do usuário (guardar flag em useRef)
   - Toggle on/off salvo em localStorage "vendza_som_notif"

CHECKLIST — web-client:
10. Na página /pedidos/[publicId]:
    - Conectar ao room order:{publicId}
    - Ao receber order:status_changed: atualizar timeline sem reload
    - Loading state enquanto conecta

QUALIDADE:
- Socket client apenas em "use client" + useEffect (nunca no servidor)
- Tratar desconexão graciosamente (reconnect automático do socket.io)
- corepack pnpm typecheck deve passar

APÓS TERMINAR:
1. Commitar: feat: Grupo 9 - notificações realtime de pedidos via Socket.io
2. Mover card Trello:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb19128fccc4efcda424 --list 69d6a78d88b366f2318584ae
```

---

## WAVE 5 — QA (após Wave 4 completa)

---

### WAVE 5-A — Testes Playwright E2E

```
Você é um agente de QA trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar testes Playwright E2E cobrindo o fluxo completo do cliente (P4-01).

CONTEXTO:
- Testes em apps/e2e/ (verificar se existe) ou criar em apps/web-client/tests/
- Playwright já instalado no projeto (verificar package.json)
- Base URL: http://localhost:3000 (web-client)
- Os testes devem funcionar com a API rodando em localhost:3333

CHECKLIST:
1. Verificar estrutura de testes existente em apps/e2e/ ou apps/web-client/
2. Criar/completar testes:
   - storefront.spec.ts: home carrega com produtos, age gate aparece
   - catalog.spec.ts: filtrar por categoria, buscar produto, abrir página de produto
   - cart.spec.ts: adicionar produto ao carrinho, editar quantidade, persistência localStorage
   - checkout.spec.ts: preencher form completo, submeter, redirecionar para tracking
   - tracking.spec.ts: página /pedidos/:publicId exibe status e itens
3. Usar page.route() para mockar API em testes que não precisam de banco real
4. Configurar playwright.config.ts com:
   - baseURL: process.env.BASE_URL || 'http://localhost:3000'
   - timeout: 30000
   - retries: 1 em CI
5. Garantir que os testes passam com: corepack pnpm --filter @vendza/e2e test

QUALIDADE:
- Testes devem ser determinísticos (sem depender de dados aleatórios)
- Usar data-testid nos componentes se necessário (adicionar os atributos)
- corepack pnpm typecheck deve passar

APÓS TERMINAR:
1. Commitar: test: P4-01 - testes Playwright E2E fluxo do cliente
2. Mover card Trello:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb1122bdcac89cf2e2d3 --list 69d6a78d88b366f2318584ae
```

---

## WAVE FINAL — Mercado Pago

### WAVE FINAL — Checkout Online com Mercado Pago

```
Você é um agente full-stack trabalhando no projeto Vendza (monorepo pnpm + Turbo em app/).

TAREFA: Implementar checkout online com Mercado Pago (Grupo 14 — ÚLTIMA FEATURE).

⚠️ SÓ INICIAR APÓS: todas as waves anteriores estarem completas e validadas em produção.

CONTEXTO:
- API: apps/api/src/
- web-client: apps/web-client/
- Schema já tem: OrderPayment (providerReference, rawPayload, paidAt)
- Credenciais MP: MERCADOPAGO_ACCESS_TOKEN (env, NUNCA no frontend)
- Webhook URL em produção: https://vendza-production.up.railway.app/v1/webhook/mercadopago

CHECKLIST — Instalação:
1. Instalar SDK: corepack pnpm --filter @vendza/api add mercadopago
2. Configurar: MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })

CHECKLIST — API:
3. POST /v1/storefront/pagamento/criar-preferencia:
   - Receber orderId do body
   - Criar preferência MP com itens do pedido
   - Retornar { initPoint, pixQrCode, pixCopiaECola }
4. POST /v1/webhook/mercadopago (rota pública, sem auth):
   - Validar assinatura: header x-signature com MERCADOPAGO_WEBHOOK_SECRET
   - Buscar payment_id no MP
   - Idempotência: checar se OrderPayment.providerReference já existe (não processar duas vezes)
   - Atualizar OrderPayment.paidAt + criar OrderEvent "payment_confirmed"
5. POST /v1/partner/pedidos/:id/reembolso (apenas role owner):
   - Chamar MP Refunds API
   - Atualizar Order.status para cancelled

CHECKLIST — Frontend:
6. No checkout: botão "Pagar com PIX" exibe QR code + código copia-e-cola
7. No checkout: botão "Pagar com Cartão" redireciona para initPoint do MP
8. Polling a cada 5s na tracking page para verificar se pagamento foi confirmado

SEGURANÇA CRÍTICA:
- MERCADOPAGO_ACCESS_TOKEN NUNCA exposto no frontend ou em logs
- Validar x-signature do webhook antes de processar qualquer dado
- Idempotência obrigatória: mesmo payment_id nunca processado duas vezes
- Reembolso: apenas role owner pode solicitar

APÓS TERMINAR:
1. Commitar: feat: Grupo 14 - Mercado Pago PIX e cartão (checkout online)
2. Mover card Trello:
   - C:\Users\USER\bin\trello.exe cards move --card 69d6bb1c0a77ea4daf01404d --list 69d6a78d88b366f2318584ae
```

---

## Referência Rápida — IDs do Trello

| Card | ID |
|---|---|
| P2-08 Perfil cliente | 69d6bb0fb09a16c05ac4e6f3 |
| P2-09 Endereços | 69d6bb10a09e4d42deb4d079 |
| P3-03 CI | 69d6bb1072dbade54e749f8d |
| P4-01 Playwright | 69d6bb1122bdcac89cf2e2d3 |
| P4-03 Mobile | 69d6bb127393af826510e56c |
| P5 Design | 69d6bb13c0af811194247c3e |
| G1 Estoque | 69d6bb145a47ae2df3945f3c |
| G2 Promoções | 69d6bb147228aa0a5a8198fa |
| G3 Zonas entrega | 69d6bb159d37da20d6406c15 |
| G4 Minha conta cliente | 69d6bb16c4d3cf8d77122b45 |
| G5 Analytics | 69d6bb16cb72c2ffdaca8b2d |
| G6 Financeiro | 69d6bb179069d0dc2d3a4965 |
| G7 Hist. financeiro | 69d6bb181faf56f89967bf46 |
| G8 Config parceiro | 69d6bb19e649f7739660d931 |
| G9 Notificações | 69d6bb19128fccc4efcda424 |
| G10 CRM | 69d6bb1a5e13547612ab2492 |
| G11 Impressão | 69d6bb1bcfcdf59a3d61ef32 |
| Mercado Pago | 69d6bb1c0a77ea4daf01404d |
| Lista "Fazendo" | 69d6a78a36704ec68ff5f937 |
| Lista "Feitas" | 69d6a78d88b366f2318584ae |

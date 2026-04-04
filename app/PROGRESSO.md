# Vendza V1 — Plano de Fechamento

> Gerado em: 2026-04-02 | Responsável: Nicholas Orchestrator
> Objetivo: fechar o V1 completo exceto Mercado Pago (V2).

---

## Resumo do Estado Atual

| Componente | Estado |
|---|---|
| API Partner (dashboard) | ✅ Completo e funcionando com dados reais |
| Web-partner (painel B2B) | ✅ Completo — login, dashboard, pedidos, catálogo, clientes, config |
| Auth Supabase | ✅ Funcionando ponta a ponta |
| Banco de dados (Prisma) | ✅ Schema completo, seeded |
| API Storefront | ⚠️ Rotas existem mas retornam mock-data (`stub: true`) |
| Web-client (vitrine) | ⚠️ Estrutura existe, completamente stub sem design |
| Realtime (Socket.io) | ❌ Não iniciado |
| Redis + Filas | ❌ Não iniciado |
| Build de produção | ❌ Não validado |
| Mercado Pago | 🔜 V2 — fora do escopo V1 |

---

## ETAPA 1 — Storefront API: DB Real

**Objetivo:** substituir `mock-data.ts` por queries Prisma reais em todas as rotas públicas.

**Arquivos afetados:**
- `apps/api/src/modules/storefront/routes.ts`
- `apps/api/src/lib/mock-data.ts` (será depreciado)

### Endpoints a implementar

| Endpoint | Implementação |
|---|---|
| GET `/storefront/config` | Buscar Store pelo slug (env `STORE_SLUG`) |
| GET `/catalog/categories` | `Category` filtrado por `storeId`, apenas as com produtos disponíveis |
| GET `/catalog/products` | `Product` com filtros `category`, `search`, `featured`, `offer`, `isAvailable: true` |
| GET `/catalog/products/:slug` | `Product` com join de `Category` |
| POST `/cart/quote` | Calcular subtotal real + frete da `DeliveryZone` |
| POST `/orders` | Upsert `Customer` + criar `Order` + `OrderItem[]` + `OrderEvent` (placed) |
| GET `/orders/:publicId` | `Order` com `OrderItem[]` + `OrderEvent[]` (timeline) |

### Regras de negócio
- `storeId` vem sempre do `STORE_SLUG` (env) → nunca do body
- `Customer` é upsert por `phone + storeId`
- `OrderEvent` append-only: criar evento `placed` ao criar pedido
- Pagamento: sem processamento real — status `pending`
- `publicId` gerado como `PED-NNNN` sequencial por loja

### Status
- [ ] Conectar `getStorefrontConfig` ao DB
- [ ] Conectar `getCategories` ao DB
- [ ] Conectar `getProducts` ao DB
- [ ] Conectar `getProductBySlug` ao DB
- [ ] Implementar `quoteCart` real
- [ ] Implementar `createOrder` real
- [ ] Implementar `getOrderByPublicId` real

---

## ETAPA 2 — Web-client: Vitrine Completa

**Objetivo:** construir a vitrine do cliente com design Brand Bible, integrada à API real.

**Stack:** Next.js 15 App Router, React 19, Server Components para fetch, Client Components para interatividade.

**Arquivos principais:**
- `apps/web-client/src/app/globals.css` — design system completo
- `apps/web-client/src/app/page.tsx` — home com catálogo
- `apps/web-client/src/app/produto/[slug]/page.tsx` — detalhe do produto
- `apps/web-client/src/app/checkout/page.tsx` — checkout
- `apps/web-client/src/app/pedidos/[publicId]/page.tsx` — tracking
- `apps/web-client/src/lib/api.ts` — helper fetch para API
- `apps/web-client/src/context/carrinho.tsx` — estado do carrinho (Client)

### Páginas e componentes

#### Home (`/`)
- Header fixo: logo Vendza + ícone carrinho com contador
- Age gate modal (bebidas alcoólicas — exigência legal)
- Seção de destaques (produtos `isFeatured: true`)
- Grid de categorias
- Grid de produtos com filtro por categoria
- Footer com dados da loja (WhatsApp, endereço)

#### Produto (`/produto/[slug]`)
- Imagem, nome, descrição, preços (lista / venda)
- Botão "Adicionar ao carrinho"
- Navegação de volta ao catálogo

#### Carrinho (modal/sheet lateral)
- Lista de itens com quantidade editável
- Subtotal em tempo real
- Botão "Finalizar pedido" → `/checkout`
- Persistência no `localStorage`

#### Checkout (`/checkout`)
- Form de dados do cliente (nome, telefone, email opcional)
- Form de endereço de entrega (rua, número, bairro, cidade)
- Seleção de método de pagamento (PIX / Dinheiro / Cartão na entrega)
- Resumo do pedido (itens + frete)
- Botão "Confirmar pedido" → POST `/orders` → redireciona para tracking
- **Sem Mercado Pago** — pedido criado com `paymentStatus: pending`

#### Tracking (`/pedidos/[publicId]`)
- Número do pedido e status atual
- Timeline visual de eventos (placed → confirmed → preparing → out_for_delivery → delivered)
- Itens do pedido
- Total e método de pagamento
- Botão "Acompanhar no WhatsApp" (link `wa.me`)

### Design (Brand Bible)
- Background: `#F7F3EE` (Cream Canvas)
- Primary CTA: `#2D6A4F` (Adega Green)
- Accent: `#E07B39` (Vitoria Amber)
- Títulos: Inter ExtraBold 800
- Dados/valores: Space Grotesk 700
- Body: Inter 400/500

### Status
- [ ] `globals.css` — design system web-client
- [ ] `lib/api.ts` — helper fetch
- [ ] `context/carrinho.tsx` — estado do carrinho
- [ ] Home page com catálogo real
- [ ] Página de produto
- [ ] Modal/sheet do carrinho
- [ ] Checkout com form + submit
- [ ] Página de tracking
- [ ] Age gate

---

## ETAPA 3 — Realtime com Socket.io

**Objetivo:** notificações em tempo real de novos pedidos e mudanças de status.

**Arquivos afetados:**
- `apps/api/src/server.ts` — integrar Socket.io ao Fastify
- `apps/api/src/modules/partner/orders-service.ts` — emitir evento ao mudar status
- `apps/api/src/modules/storefront/routes.ts` — emitir evento ao criar pedido
- `apps/web-partner/src/app/(dashboard)/pedidos/` — receber eventos
- `apps/web-client/src/app/pedidos/[publicId]/page.tsx` — auto-atualizar tracking

### Eventos Socket.io

| Evento | Quem emite | Quem ouve |
|---|---|---|
| `order:created` | API (POST /orders) | web-partner (badge + som) |
| `order:status_changed` | API (PATCH /orders/:id/status) | web-partner + web-client (tracking) |

### Rooms
- Partner: `store:{storeId}` — recebe todos os eventos da loja
- Cliente: `order:{publicId}` — recebe apenas eventos do seu pedido

### Status
- [ ] Instalar `socket.io` na API
- [ ] Instalar `socket.io-client` no web-client e web-partner
- [ ] Configurar rooms no servidor
- [ ] Emitir `order:created` no storefront
- [ ] Emitir `order:status_changed` na rota partner
- [ ] web-partner: badge de notificação + auto-refresh de pedidos
- [ ] web-client: auto-atualizar timeline do tracking

---

## ETAPA 4 — Redis + Filas de Jobs

**Objetivo:** filas assíncronas para eventos de pedido (base para WhatsApp V2).

**Arquivos afetados:**
- `apps/api/src/plugins/redis.ts` — conexão Redis
- `apps/api/src/jobs/` — definição das filas
- `apps/api/src/server.ts` — registrar plugin e iniciar workers

### Filas planejadas (BullMQ)

| Fila | Trigger | Worker |
|---|---|---|
| `order.placed` | POST /orders | Log + placeholder WhatsApp |
| `order.status_changed` | PATCH /orders/:id/status | Log + placeholder WhatsApp |

### Status
- [ ] Instalar `bullmq` + `ioredis`
- [ ] Plugin Redis (`apps/api/src/plugins/redis.ts`)
- [ ] Fila `order.placed`
- [ ] Fila `order.status_changed`
- [ ] Workers com placeholder de notificação
- [ ] Graceful shutdown (fechar filas antes de encerrar)
- [ ] Health check incluir status do Redis

---

## ETAPA 5 — Build de Produção

**Objetivo:** validar que todos os apps constroem sem erros e estão prontos para deploy.

### Checklist

- [ ] `pnpm typecheck` em todos os apps — zero erros
- [ ] `pnpm build` na API — compilação TypeScript
- [ ] `pnpm build` no web-partner — Next.js build
- [ ] `pnpm build` no web-client — Next.js build
- [ ] Atualizar `.env.example` com todas as vars necessárias
- [ ] Documentar vars obrigatórias vs opcionais
- [ ] Verificar se Redis opcional é tratado graciosamente (sem crash se offline)
- [ ] Testar fluxo completo: login → vitrine → pedido → tracking → partner atualiza status

---

## Ordem de Execução

```
ETAPA 1 (API Real)  →  ETAPA 2 (Web-client)  →  ETAPA 3 (Realtime)
                                                        ↓
                                               ETAPA 4 (Redis) + ETAPA 5 (Build)
```

Etapas 4 e 5 podem ser feitas em paralelo após Etapa 3.

---

## Métricas de Conclusão V1

O V1 está fechado quando:
1. Cliente acessa `localhost:3000`, visualiza catálogo real, adiciona ao carrinho, faz checkout e recebe `publicId`
2. Tracking em `localhost:3000/pedidos/PED-XXXX` mostra status em tempo real
3. Partner vê pedido em `localhost:3001/pedidos` em tempo real assim que é criado
4. Partner muda status → cliente vê no tracking automaticamente
5. `pnpm build` passa sem erros em todos os apps

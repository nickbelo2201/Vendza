# Vendza — Features a Implementar (V2/V3)

> Documento de referência para o time de desenvolvimento. Descreve todas as features identificadas como gap entre o estado atual e a entrega completa do produto, com base na análise competitiva (Neemo, Zé Delivery, iFood, Nextar/Nex, Saipos) e melhores práticas de mercado para comércios locais de delivery no Brasil.
>
> **Ordem de execução:** Os grupos estão numerados por prioridade de valor para o lojista. Pagamento online (Mercado Pago) é sempre o **último** item.

---

## Grupo 1 — Gestão de Estoque (`web-partner`)

### 1.1 Página de Estoque — Visão Geral

**Onde:** `apps/web-partner/src/app/(dashboard)/estoque/`  
**Schema:** `InventoryItem`, `InventoryMovement`, `Product`  
**Prioridade:** Alta — lojista perde dinheiro sem controle de estoque

**Descrição:**  
Página central de gestão de inventário. Lista todos os produtos com seus níveis de estoque atual, status de saúde (OK / atenção / crítico) e métricas de giro.

**Features da página:**

| Feature | Descrição | Boas práticas |
|---|---|---|
| **Lista com status visual** | Cada produto exibe estoque atual, estoque mínimo (safetyStock) e status colorido (verde/amarelo/vermelho) | Semáforo é o padrão: Nextar, Bling, Omie usam a mesma lógica |
| **Filtro por status** | Filtrar: Todos / Críticos (≤ safetyStock) / Zerados / Normais | Reduz ruído para o lojista — ele age só no que importa |
| **Busca por nome/SKU** | Campo de busca em tempo real | |
| **Giro de estoque** | Calculado como: vendas no período / estoque médio do período | Mostrar como "baixo / médio / alto" com badge colorido |
| **Curva ABC** | Badge A/B/C por produto com base no % de faturamento | A = top 20% produtos = 80% receita; C = estoque parado |
| **Alerta de ponto de reposição** | Banner no topo quando N produtos estão abaixo do safetyStock | Chama atenção imediata; o número deve ser clicável |

**Rota API necessária:** `GET /v1/partner/estoque` — retorna produtos com currentStock, safetyStock, movimentos recentes, giro calculado

---

### 1.2 Movimentação Manual de Estoque

**Onde:** Modal na página de estoque / página de produto  
**Schema:** `InventoryMovement` (append-only — nunca atualizar/deletar)

**Descrição:**  
Formulário para registrar entrada (compra de fornecedor) ou saída manual (furto, desperdício, ajuste) com motivo obrigatório.

**Campos:**
- Produto (select com busca)
- Tipo: `replenishment` (entrada) | `manual_adjustment` (ajuste) | `cancellation` (saída por cancelamento)
- Quantidade (positivo = entrada, negativo = saída)
- Motivo (texto livre, obrigatório para ajustes)
- Data/hora (padrão: agora, editável)

**Rota API necessária:** `POST /v1/partner/estoque/movimentacao`

**Regra de negócio:** Após criar `InventoryMovement`, a rota DEVE atualizar `InventoryItem.currentStock` no mesmo transaction. `quantityDelta` positivo soma, negativo subtrai.

---

### 1.3 Histórico de Movimentações por Produto

**Onde:** Drawer/modal ao clicar em um produto na lista de estoque  
**Schema:** `InventoryMovement` (filtrado por `productId`)

**Descrição:**  
Timeline das últimas movimentações do produto: tipo, quantidade, motivo, usuário que registrou, data. Útil para auditoria e para entender por que o estoque diverge do esperado.

**Rota API necessária:** `GET /v1/partner/estoque/:productId/historico?page=1&pageSize=20`

---

## Grupo 2 — Página de Promoções (`web-partner`)

**Onde:** `apps/web-partner/src/app/(dashboard)/promocoes/`  
**Schema:** `Product` (salePriceCents, listPriceCents, isAvailable), `InventoryItem`

**Descrição:**  
Central de promoções do lojista. Combina visibilidade de produtos em promoção com alertas inteligentes de giro de estoque parado e vencimento.

### 2.1 Lista de Produtos em Promoção

Exibe todos os produtos onde `salePriceCents < listPriceCents` (promoção ativa), com:
- Nome, foto, preço original vs. preço de promoção, % de desconto
- Estoque atual (badge vermelho se crítico)
- Botão rápido para editar preço ou desativar promoção

### 2.2 Alertas de Giro Parado

Sistema que identifica produtos com baixo giro e sugere promoção:

| Gatilho | Ação sugerida |
|---|---|
| Produto sem venda há 14+ dias | Badge "Parado" + sugestão de desconto de 15-20% |
| Estoque acima de 2× o safetyStock sem venda proporcional | Badge "Estoque alto" + sugestão de combo/bundle |
| Produto com validade cadastrada e < 15 dias para vencer | Badge "Vencimento próximo" + sugestão de desconto urgente |

**Por que isso importa:**  
Pesquisa (Nextar/DistribuidorPro) mostra que alertas automáticos de vencimento evitam perdas diretas. Desde 2024, a legislação brasileira exige que o consumidor seja informado sobre produtos próximos do vencimento — o sistema deve facilitar isso.

### 2.3 Criar Promoção Rápida

Formulário inline para:
- Selecionar produto
- Definir preço promocional (ou % de desconto)
- Data de início e fim (opcional — sem data = indefinida)
- Visibilidade: exibir no web-client com badge "PROMO"

**Rota API necessária:**
- `GET /v1/partner/promocoes` — produtos em promoção + produtos com alertas
- `PATCH /v1/partner/products/:id` — já existe (atualizar salePriceCents)

---

## Grupo 3 — Sistema de Mapa e Zonas de Entrega (`web-partner` + `web-client`)

**Onde (configuração):** `apps/web-partner/src/app/(dashboard)/configuracoes/entrega/`  
**Onde (uso):** checkout no `web-client` + painel de pedidos no `web-partner`  
**Schema:** `DeliveryZone` (centerLat, centerLng, radiusMeters, neighborhoodsJson, deliveryFeeCents, estimatedDeliveryMinutes), `DeliveryZoneNeighborhood`

### 3.1 Configuração de Zonas de Entrega (web-partner)

**Descrição:**  
Interface visual para o lojista configurar as áreas de entrega com taxa por zona. Dois modos (já modelados no schema com `DeliveryZoneMode`):

**Modo 1 — Raio (km):**
- O lojista define o centro (endereço da loja, via geocoding) e múltiplos raios
- Ex: Zona 1 = 0-2 km → R$ 4,00 | Zona 2 = 2-5 km → R$ 7,00 | Zona 3 = 5-8 km → R$ 12,00
- Interface: mapa interativo (Leaflet.js ou Google Maps Static API) com círculos concêntricos
- Cada zona tem: nome, raio, taxa de entrega, tempo estimado, pedido mínimo (opcional)

**Modo 2 — Por bairros:**
- Lista de bairros selecionáveis com taxa por grupo
- Sem mapa obrigatório — mais simples para lojistas sem familiaridade com GPS
- Dados: `neighborhoodsJson` já existe no schema

**Boas práticas (referência: Consumer, Foody Delivery, Saipos):**
- Frete grátis acima de valor mínimo configurável por zona
- Valor mínimo de pedido diferente por zona (zona 3 exige R$ 80 mínimo)
- Estimativa de entrega por zona exibida para o cliente no checkout

**Rotas API necessárias:**
- `GET /v1/partner/configuracoes/zonas-entrega`
- `POST /v1/partner/configuracoes/zonas-entrega`
- `PUT /v1/partner/configuracoes/zonas-entrega/:id`
- `DELETE /v1/partner/configuracoes/zonas-entrega/:id`

### 3.2 Cálculo Automático de Frete no Checkout (web-client)

Ao cliente informar o endereço:
1. API recebe CEP/coordenadas do cliente
2. Calcula distância até o centro da loja (Haversine formula — sem custo de API)
3. Identifica em qual zona o cliente está
4. Retorna taxa de entrega + tempo estimado + pedido mínimo
5. Se endereço fora de todas as zonas → mensagem "Fora da área de entrega"

**Rota API necessária:** `POST /v1/storefront/calcular-frete` com `{ lat, lng }` ou `{ cep, numero }`

### 3.3 Geolocalização Assistida no Checkout (web-client)

Botão "Usar minha localização" que aciona `navigator.geolocation.getCurrentPosition()`, preenche o campo de endereço automaticamente via geocoding reverso (API gratuita: nominatim.openstreetmap.org) e calcula o frete em tempo real.

---

## Grupo 4 — Histórico de Pedidos e Perfil do Cliente (`web-client`)

**Onde:** `apps/web-client/src/app/minha-conta/` (novo)  
**Schema:** `Customer`, `Order`, `OrderItem`, `OrderEvent`

### 4.1 Área "Minha Conta" do Cliente

Acesso via header do web-client. Identifica o cliente pelo telefone (já é o identificador único no schema). Seções:

**Meus Pedidos (histórico):**
- Lista dos pedidos com: publicId (PED-NNNN), data, status, total, itens resumidos
- Status em português simples: "Recebido" / "Em preparo" / "Saiu para entrega" / "Entregue" / "Cancelado"
- Cada pedido expande para ver os itens completos e o histórico de eventos (OrderEvent)
- **Botão "Pedir de novo"** (feature mais valorizada segundo pesquisa iFood): reabre o carrinho com os mesmos produtos e quantidades

**Meus Endereços (V2+):**
- Salvar até 3 endereços favoritos (casa, trabalho, etc.)
- Schema: adicionar `CustomerAddress` (logradouro, numero, bairro, cep, complemento, lat, lng, label)

**Rota API necessária:**
- `GET /v1/storefront/cliente/pedidos?phone=:phone` — lista pedidos do cliente
- `GET /v1/storefront/pedido/:publicId` — já existe (tracking page)

### 4.2 Rastreamento em Tempo Real (web-client — já parcialmente implementado)

Aprimorar a página de tracking existente:
- Timeline visual dos eventos (OrderEvent) com ícones e timestamps
- Estimativa de entrega atualizada conforme status muda
- Notificação browser push quando status muda (via Web Push API ou polling a cada 15s)
- Cross-sell durante a espera: "Você também pode gostar de..." baseado nos itens do pedido atual

---

## Grupo 5 — Página de Desempenho / Analytics (`web-partner`)

**Onde:** `apps/web-partner/src/app/(dashboard)/desempenho/`  
**Schema:** `Order`, `OrderItem`, `Customer`, `InventoryMovement`

**Descrição:**  
Dashboard analítico com KPIs acionáveis para o lojista tomar decisões rápidas. Baseado nas melhores práticas de varejo de bebidas (Ouran, Dito, referências de mercado).

### 5.1 KPIs Principais (cards no topo)

| KPI | Fórmula | Ação que dispara |
|---|---|---|
| Faturamento do período | SUM(totalCents) dos pedidos entregues | Comparativo com período anterior |
| Ticket médio | Faturamento / Qtd. pedidos | Abaixo da meta → sugerir combos / valor mínimo maior |
| Total de pedidos | COUNT(orders) | |
| Clientes novos | Clientes com 1º pedido no período | Abaixo de 20% → intensificar captação |
| Taxa de recompra | Clientes com 2+ pedidos / total | Abaixo de 40% → acionar promoções de fidelidade |
| CMV do período | SUM(custo dos itens vendidos) | Acima de 50% do faturamento → revisar precificação |
| Taxa de cancelamento | Pedidos cancelados / total | Acima de 5% → investigar (estoque zerado? demora?) |

### 5.2 Gráficos

**Vendas por hora do dia (últimos 7 dias):**
- Gráfico de barras horizontal — identifica hora de pico para escalar motoboys
- Granularidade: por hora (0h-23h), média dos dias selecionados

**Produtos mais vendidos:**
- Ranking top 10 por quantidade vendida
- Curva ABC visual (A/B/C badge por produto)

**Clientes novos vs. recorrentes:**
- Gráfico de pizza ou stacked bar
- Meta: >40% recorrentes = negócio saudável

**Distribuição de formas de pagamento:**
- PIX / Dinheiro / Cartão / Fiado — impacta fluxo de caixa

### 5.3 Seletor de Período

Opções rápidas: Hoje / Ontem / Esta semana / Este mês / Mês passado  
Seletor custom: date range picker (data início + data fim)

> **Decisão de implementação:** Calcular tudo no banco (Prisma raw queries ou agregações) — não usar serviço externo de analytics. O volume de dados de uma adega local (~50-200 pedidos/dia) não justifica infraestrutura adicional.

**Rota API necessária:** `GET /v1/partner/desempenho?from=ISO&to=ISO`  
Retorna todos os KPIs e dados de gráfico em uma única chamada.

---

## Grupo 6 — Página Financeira e Fechamento de Caixa (`web-partner`)

**Onde:** `apps/web-partner/src/app/(dashboard)/financeiro/`  
**Schema:** `Order`, `OrderPayment` (paidAt, providerReference), `OrderEvent`

**Descrição:**  
Central financeira do lojista. Separa duas funcionalidades distintas: fechamento de caixa diário e histórico de movimentações financeiras.

### 6.1 Fechamento de Caixa

**Conceitos fundamentais (referência: F360, Galago, Saipos):**

| Operação | Descrição |
|---|---|
| **Suprimento** | Dinheiro adicionado ao caixa antes das vendas (fundo de troco, reforço) |
| **Sangria** | Retirada de dinheiro do caixa durante o turno |
| **Saldo esperado** | Fundo de troco + vendas em dinheiro + suprimentos − sangrias |
| **Diferença de caixa** | Saldo esperado − saldo conferido fisicamente |

**Fluxo do fechamento:**

1. Lojista clica em "Fechar caixa do dia"
2. Sistema exibe resumo automático:
   - Total de pedidos entregues no dia
   - Total por forma de pagamento (Dinheiro / PIX / Cartão / Fiado)
   - Sangrias e suprimentos registrados no dia
   - Saldo esperado em dinheiro
3. Lojista responde perguntas de conferência:
   - "Quanto você está contando no caixa físico agora?" (campo numérico)
   - Diferença é calculada automaticamente
4. Sistema gera o comprovante de fechamento (para download como PDF ou CSV)

**Fechamento por entregador (modo delivery):**
- Cada motoboy tem acerto individual: total de pedidos cash entregues por ele × valor coletado − troco dado
- Relatório mostra: nome do entregador, pedidos, total coletado, total repassado, diferença
- Referência: Saipos implementou isso como "acerto com entregadores" — feature muito valorizada por adegas com >2 motoboys

### 6.2 Exportação de Relatórios

Botões na página financeira:
- **Download CSV de pedidos** (período selecionável): publicId, data, cliente, itens, total, status, forma de pagamento
- **Download CSV de movimentações financeiras**: tipo, valor, data, observação
- **Resumo PDF do fechamento de caixa**: data, totais por forma de pagamento, diferença, assinatura do operador

> Implementar com geração server-side no Next.js API route (sem biblioteca pesada — usar strings CSV direto).

**Rota API necessária:**
- `POST /v1/partner/financeiro/fechamento` — registra fechamento do dia
- `GET /v1/partner/financeiro/fechamentos` — histórico de fechamentos
- `GET /v1/partner/financeiro/exportar?from=ISO&to=ISO&formato=csv` — download CSV

---

## Grupo 7 — Histórico de Movimentações Financeiras (`web-partner`)

**Onde:** Tab dentro de `/financeiro/` ou página `/financeiro/movimentacoes/`  
**Schema:** `Order` (com paymentMethod + totalCents), `OrderPayment`

**Descrição:**  
Feed cronológico de todas as entradas e saídas financeiras da loja. Equivalente a um extrato bancário operacional.

### Tipos de movimentação exibidos:

| Tipo | Origem | Sinal |
|---|---|---|
| Venda (pedido entregue) | `Order.status = delivered` | + (verde) |
| Cancelamento com reembolso | `Order.status = cancelled` após pagamento | − (vermelho) |
| Sangria de caixa | Registro manual | − (vermelho) |
| Suprimento de caixa | Registro manual | + (verde) |
| Ajuste financeiro | Registro manual com motivo | ± |

### Interface:
- Lista paginada com filtro por período, tipo e forma de pagamento
- Totalizador no topo: entradas do período / saídas do período / saldo líquido
- Cada linha expandível para ver detalhes do pedido associado (se houver)
- Barra de busca por publicId do pedido

---

## Grupo 8 — Minha Conta do Parceiro (`web-partner`)

**Onde:** `apps/web-partner/src/app/(dashboard)/configuracoes/` (expandir seção existente)  
**Schema:** `Store`, `StoreUser`, `Tenant`

**Descrição:**  
Central de configurações da conta do lojista. Dividida em abas/seções:

### 8.1 Dados da Loja

- Nome da loja, slug (URL), descrição, logo, banner
- WhatsApp de contato (principal canal de comunicação com cliente)
- Endereço físico com coordenadas (para cálculo de frete por raio)
- Status da loja: Aberto / Fechado / Pausado temporariamente (toggle rápido)
- Tempo estimado de entrega padrão (em minutos)
- Pedido mínimo padrão (em centavos)

### 8.2 Horários de Funcionamento

- Grade semanal: seg-dom com horário de abertura e fechamento por dia
- Dias sem funcionamento (checkbox "fechado")
- Feriados especiais (datas avulsas)
- Status automático: sistema fecha/abre a loja automaticamente baseado nos horários configurados
- Schema: adicionar `StoreHours` model (dayOfWeek 0-6, openTime, closeTime, isClosed)

### 8.3 Dados Bancários (para recebimento)

**Segurança é crítica aqui.** Boas práticas:
- Dados bancários **nunca trafegam no frontend** após salvos — apenas os últimos 4 dígitos da conta são exibidos (mascaramento)
- Campo de chave PIX: validação por tipo (CPF/CNPJ/telefone/email/aleatória)
- Dados são criptografados em repouso no banco (pgcrypto no Postgres) antes de salvar
- Log de auditoria: toda alteração de dados bancários registra quem alterou + IP + timestamp
- Schema: adicionar `StoreBankAccount` model (type: pix_key | conta_corrente, keyType, encryptedKey, lastFourDigits, bankName, bankCode, updatedAt, updatedBy)

**Não implementar:** pagamento automático ao lojista (isso é do Mercado Pago, que vai por último).

### 8.4 Acessos e Usuários

- Lista de usuários com acesso ao painel (StoreUser)
- Roles: `owner` (acesso total) / `manager` (sem dados bancários) / `attendant` (apenas pedidos)
- Botão de convidar novo usuário por email
- Revogar acesso de usuário
- Histórico de logins (data/hora + IP) — últimos 10

### 8.5 Termos e Legal

- Data de aceite dos Termos de Uso
- Versão dos termos aceita
- CNPJ/CPF do responsável (para emissão futura de NF)
- Link para baixar os termos em PDF

---

## Grupo 9 — Notificações em Tempo Real (`web-partner`)

**Onde:** Header do dashboard (ícone de sino) + notificação sonora  
**Schema:** `Order` (novos pedidos via Socket.io)

### 9.1 Badge de Novos Pedidos

- Contador no header com número de pedidos "novos" (status = `pending` + `confirmed`)
- Atualizado via Socket.io (room: `store:{storeId}`)
- Zera ao abrir a página de pedidos

### 9.2 Notificação Sonora

- Som de alerta ao receber novo pedido (arquivo `.mp3` local — sem dependência externa)
- Ativado apenas se o usuário interagiu com a página (requisito de autoplay do browser)
- Toggle on/off nas configurações (salvo em localStorage)
- Volume configurável
- Referência: Saipos, Consumer e todos os sistemas sérios de delivery têm isso — é uma necessidade operacional real, não diferencial

### 9.3 Notificação Browser (Push opcional)

- Permissão solicitada na primeira abertura do painel
- Notificação nativa do OS quando há novo pedido (mesmo com a aba em segundo plano)
- Implementar via Web Push API + Service Worker

---

## Grupo 10 — CRM: Tags e Notas em Clientes (`web-partner`)

**Onde:** `apps/web-partner/src/app/(dashboard)/clientes/:id/`  
**Schema:** `CustomerTag` (label, unique per customer), `CustomerNote` (body, createdAt, createdByUserId)

### 10.1 Tags no Cliente

- UI para adicionar/remover tags de texto livre (ex: "VIP", "fiado", "difícil", "sem glúten")
- Exibidas na lista de clientes como badges coloridos
- Filtro na lista de clientes por tag

### 10.2 Notas Internas

- Campo de texto para o atendente registrar observações sobre o cliente
- Cada nota tem: texto, data/hora, usuário que criou
- Histórico imutável (append-only) — notas não são editadas, apenas adicionadas

### 10.3 Histórico do Cliente

- Timeline de todos os pedidos do cliente
- Total gasto, frequência de compra, última compra
- Produtos favoritos (baseado em frequência de itens nos pedidos)

---

## Grupo 11 — Impressão de Pedido (`web-partner`)

**Onde:** Botão na página de detalhes do pedido  
**Schema:** `Order`, `OrderItem`, `Customer`

**Descrição:**  
Botão "Imprimir pedido" que abre uma janela de impressão formatada para impressoras térmicas de 80mm (padrão do mercado). Sem dependência de biblioteca — usar `window.print()` com CSS `@media print`.

**Layout do comprovante:**
- Cabeçalho: nome da loja, data/hora, publicId (PED-NNNN)
- Itens: nome, quantidade, preço unitário, total do item
- Rodapé: total, forma de pagamento, endereço de entrega, observações
- Fonte grande, alto contraste — legível para motoboy/cozinha

**Boas práticas:**
- Criar componente `<PrintOrder />` com CSS `@media print` isolado
- `@page { size: 80mm auto; margin: 5mm; }` para impressoras térmicas
- Botão "Imprimir" visível apenas para usuários com role `owner` ou `manager`

---

## Grupo 12 — Endereços Salvos do Cliente (`web-client`)

**Onde:** `apps/web-client/src/app/minha-conta/enderecos/`  
**Schema:** Novo model `CustomerAddress` a adicionar no schema.prisma

**Descrição:**  
Cliente pode salvar até 3 endereços com labels personalizados (Casa, Trabalho, Outro). No checkout, seleciona endereço salvo ao invés de digitar novamente.

**Campos do endereço:**
- Label (Casa / Trabalho / Outro — ou texto livre)
- Logradouro, número, complemento, bairro, CEP
- Cidade (fixo baseado na loja, não necessita entrada)
- Coordenadas lat/lng (salvas na primeira geocodificação)

---

## Grupo 13 — GitHub Actions CI (`infra`)

**Onde:** `.github/workflows/`  
**Quando:** A cada push para `master`

**Pipeline mínimo:**
```yaml
# ci.yml
jobs:
  typecheck:
    - corepack pnpm install --frozen-lockfile
    - corepack pnpm typecheck
  
  build:
    - corepack pnpm build
  
  e2e-tests:
    - corepack pnpm --filter @vendza/e2e exec playwright install --with-deps chromium
    - corepack pnpm --filter @vendza/e2e test --project=chromium
```

**Boas práticas:**
- Cache do pnpm store entre runs (economiza 2-3 min por run)
- Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_API_URL`
- Artefatos: upload do `playwright-report/` em caso de falha para diagnóstico
- Badge de status no README

---

## Grupo 14 — Pagamento Online (Mercado Pago) — ÚLTIMO

**Onde:** `web-client` (checkout) + `apps/api/src/modules/payments/`  
**Schema:** `OrderPayment` (já modelado com providerReference, rawPayload, paidAt)

> **Este grupo deve ser implementado por último, após todos os anteriores estarem completos e estáveis em produção.**

**Escopo mínimo V1 de pagamento:**
- Checkout transparente com cartão de crédito (1-12x)
- PIX gerado pela API do Mercado Pago (QR code + código copia-e-cola)
- Webhook de confirmação de pagamento → atualiza `OrderPayment.paidAt` + cria `OrderEvent`
- Reembolso manual via dashboard (botão na página do pedido, apenas role `owner`)

**Segurança crítica:**
- Nunca expor Access Token do Mercado Pago no frontend
- Validar assinatura do webhook (header `x-signature` do MP)
- Idempotência: nunca processar o mesmo `payment_id` duas vezes (verificar `OrderPayment.providerReference`)

**Rotas API necessárias:**
- `POST /v1/storefront/pagamento/criar-preferencia` — cria preferência no MP, retorna init_point
- `POST /v1/webhook/mercadopago` — recebe notificações do MP (rota pública, sem auth)
- `POST /v1/partner/pedidos/:id/reembolso` — solicita reembolso ao MP

---

## Resumo de Rotas API Novas

| Rota | Método | Descrição |
|---|---|---|
| `/v1/partner/estoque` | GET | Lista produtos com métricas de estoque |
| `/v1/partner/estoque/movimentacao` | POST | Registra movimentação manual |
| `/v1/partner/estoque/:productId/historico` | GET | Histórico de movimentações do produto |
| `/v1/partner/promocoes` | GET | Produtos em promoção + alertas de giro |
| `/v1/partner/desempenho` | GET | KPIs e dados de gráfico por período |
| `/v1/partner/financeiro/fechamento` | POST | Registra fechamento de caixa |
| `/v1/partner/financeiro/fechamentos` | GET | Histórico de fechamentos |
| `/v1/partner/financeiro/movimentacoes` | GET | Extrato financeiro paginado |
| `/v1/partner/financeiro/exportar` | GET | CSV de pedidos/movimentações |
| `/v1/partner/configuracoes/zonas-entrega` | GET/POST/PUT/DELETE | CRUD de zonas de entrega |
| `/v1/partner/configuracoes/loja` | GET/PUT | Dados da loja, horários, status |
| `/v1/partner/configuracoes/conta-bancaria` | GET/PUT | Chave PIX / dados bancários (criptografados) |
| `/v1/storefront/calcular-frete` | POST | Calcula taxa de entrega por coordenadas |
| `/v1/storefront/cliente/pedidos` | GET | Histórico de pedidos do cliente por telefone |
| `/v1/webhook/mercadopago` | POST | Webhook de pagamento (ÚLTIMO) |

---

## Resumo de Novos Models no Schema Prisma

| Model | Campos principais | Notas |
|---|---|---|
| `StoreHours` | storeId, dayOfWeek, openTime, closeTime, isClosed | 7 registros por loja |
| `StoreBankAccount` | storeId, type, keyType, encryptedKey, lastFourDigits, bankName | Criptografar encryptedKey com pgcrypto |
| `CustomerAddress` | customerId, storeId, label, logradouro, numero, bairro, cep, lat, lng | |

---

*Documento gerado em 2026-04-08. Atualizar conforme features forem implementadas.*

# Contratos API

## Convencoes

- prefixo base: `/v1`
- autenticacao do parceiro: `Bearer token`
- ids publicos para o cliente e ids internos para o parceiro
- respostas com envelope simples: `data`, `meta`, `error`

## Publico

### Cobertura

- `POST /v1/coverage/validate`
  - input: endereco, latitude, longitude
  - output: loja elegivel, taxa, prazo, motivo de bloqueio

### Storefront

- `GET /v1/storefront/config`
  - output: branding, horarios, banners, meios de pagamento, aviso legal

- `GET /v1/catalog/categories`
  - output: categorias publicas e destaques

- `GET /v1/catalog/products`
  - filtros: categoria, busca, destaque, oferta
  - output: cards de produto e disponibilidade

- `GET /v1/catalog/products/:slug`
  - output: detalhe do produto, variantes, kits relacionados

### Checkout

- `POST /v1/cart/quote`
  - input: itens, endereco, cupom opcional
  - output: subtotal, taxa, descontos, total, validade do quote

- `POST /v1/orders`
  - input: customer, itens, endereco, pagamento, observacao
  - output: pedido criado, status inicial, trackingUrl

- `GET /v1/orders/:publicId`
  - output: status atual, timeline, resumo financeiro

## Parceiro

### Auth

- `POST /v1/auth/login`
  - input: email, senha
  - output: accessToken, refreshToken, user, store

- `POST /v1/auth/refresh`
  - input: refreshToken
  - output: accessToken novo

### Dashboard

- `GET /v1/partner/dashboard/summary`
  - output: pedidos do dia, faturamento, ticket medio, novos x recorrentes

### Pedidos

- `GET /v1/partner/orders`
  - filtros: status, data, busca, agendado
  - output: cards do board

- `GET /v1/partner/orders/:id`
  - output: detalhe completo, timeline, pagamento, cliente

- `PATCH /v1/partner/orders/:id/status`
  - input: novo status, observacao opcional
  - output: pedido atualizado e novo evento

- `POST /v1/partner/orders/manual`
  - input: cliente, itens, endereco, pagamento
  - output: pedido criado no mesmo fluxo operacional

### Catalogo

- `GET /v1/partner/products`
- `POST /v1/partner/products`
- `PATCH /v1/partner/products/:id`
- `PATCH /v1/partner/products/:id/availability`

### Estoque

- `GET /v1/partner/inventory`
- `POST /v1/partner/inventory/movements`

### CRM

- `GET /v1/partner/customers`
- `GET /v1/partner/customers/:id`
- `PATCH /v1/partner/customers/:id`

### Loja

- `GET /v1/partner/store/settings`
- `PATCH /v1/partner/store/settings`
- `PATCH /v1/partner/store/hours`
- `PATCH /v1/partner/store/delivery-zones`

## Eventos realtime

- `order.created`
- `order.updated`
- `order.status_changed`
- `inventory.changed`
- `dashboard.summary_changed`

## Erros padrao

- `400`: payload invalido
- `401`: token invalido
- `403`: sem permissao
- `404`: recurso nao encontrado
- `409`: conflito de status ou estoque
- `422`: regra de negocio bloqueou a acao


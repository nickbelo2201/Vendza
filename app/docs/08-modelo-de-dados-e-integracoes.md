# Modelo de Dados e Integracoes

## Entidades centrais

### Tenant e loja

- `tenants`
- `stores`
- `store_users`
- `store_settings`
- `store_hours`
- `delivery_zones`

### Cliente

- `customers`
- `customer_addresses`
- `customer_tags`
- `customer_notes`

### Catalogo

- `categories`
- `products`
- `product_variants`
- `product_bundles`
- `inventory_items`
- `inventory_movements`

### Pedido

- `orders`
- `order_items`
- `order_events`
- `order_payments`
- `order_delivery`

### Growth e CRM

- `coupons`
- `campaigns`
- `customer_segments`
- `customer_scores`

### Analytics e backoffice

- `daily_metrics`
- `exports`
- `integration_connections`
- `integration_events`

## Campos que nao podem faltar no pedido

- origem
- canal
- endereco
- metodo de pagamento
- taxa de entrega
- regra de frete
- horario prometido
- status atual
- timestamps da timeline

## Eventos obrigatorios

- `order.created`
- `order.confirmed`
- `order.preparing`
- `order.ready_for_delivery`
- `order.out_for_delivery`
- `order.delivered`
- `order.cancelled`
- `inventory.reserved`
- `inventory.released`
- `customer.reactivated`

## Integracoes do V1

### Entram no V1

- mapas
- gateway de pagamento principal
- storage de imagens
- cache/filas
- realtime

### Preparadas no V1 para entrar no V2

- WhatsApp oficial
- NFe
- exportacao automatizada
- healthcheck de conectores

## Regras de integracao

- toda integracao precisa de status visivel
- toda falha precisa de ultimo erro gravado
- evento externo nunca pode atualizar pedido sem trilha
- secrets e credenciais ficam fora dos frontends

## Decisao de desenho

O `order_events` sera append-only e servira como base para:

- timeline do cliente
- board do operador
- analytics
- automacao futura

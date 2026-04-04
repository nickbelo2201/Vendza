# Schema Inicial

## Objetivo

Definir o recorte minimo do banco para iniciar o build sem ambiguidade.

## Tabelas P0

### Lojas e usuarios

- `tenants`
- `stores`
- `store_users`
- `store_hours`
- `delivery_zones`

Campos criticos:

- `stores.slug`
- `stores.status`
- `stores.whatsapp_phone`
- `stores.minimum_order_value`

### Clientes

- `customers`
- `customer_addresses`
- `customer_notes`
- `customer_tags`

Campos criticos:

- `customers.phone`
- `customers.last_order_at`
- `customers.total_spent_cents`
- `customers.is_inactive`

### Catalogo

- `categories`
- `products`
- `product_variants`
- `product_bundles`
- `inventory_items`
- `inventory_movements`

Campos criticos:

- `products.slug`
- `products.is_available`
- `products.list_price_cents`
- `products.sale_price_cents`

### Pedidos

- `orders`
- `order_items`
- `order_events`
- `order_payments`

Campos criticos:

- `orders.public_id`
- `orders.channel`
- `orders.status`
- `orders.delivery_fee_cents`
- `orders.total_cents`

## Modelos iniciais recomendados

### Store

- id
- tenant_id
- name
- slug
- whatsapp_phone
- status
- timezone
- minimum_order_value_cents
- created_at
- updated_at

### Customer

- id
- store_id
- name
- phone
- email
- birth_date
- last_order_at
- total_spent_cents
- is_inactive

### Product

- id
- store_id
- category_id
- name
- slug
- description
- image_url
- list_price_cents
- sale_price_cents
- is_available
- is_featured

### Order

- id
- store_id
- customer_id
- public_id
- channel
- status
- subtotal_cents
- delivery_fee_cents
- discount_cents
- total_cents
- placed_at

### OrderEvent

- id
- order_id
- type
- payload_json
- created_by_user_id
- created_at

## Regras de modelagem

- dinheiro sempre em centavos
- status controlado por enum
- eventos append-only
- exclusao logica quando necessario
- tenant_id ou store_id em tudo o que for dominio da adega


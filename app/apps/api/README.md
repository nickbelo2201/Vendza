# API

Responsavel por:

- auth
- lojas
- catalogo
- estoque
- pedidos
- CRM
- analytics
- integracoes

Regra: toda logica de negocio vive aqui.

## Status atual

O servidor Fastify da V1 ja esta de pe, compilando e com os endpoints `partner` ligados ao Prisma real. A autenticacao usa bearer token do Supabase e resolve `auth_user_id -> store_users` no banco.

## Rotas ja estruturadas

- `POST /v1/coverage/validate`
- `GET /v1/storefront/config`
- `GET /v1/catalog/categories`
- `GET /v1/catalog/products`
- `GET /v1/catalog/products/:slug`
- `POST /v1/cart/quote`
- `POST /v1/orders`
- `GET /v1/orders/:publicId`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `GET /v1/partner/dashboard/summary`
- `GET /v1/partner/orders`
- `GET /v1/partner/orders/:id`
- `PATCH /v1/partner/orders/:id/status`
- `POST /v1/partner/orders/manual`
- `GET /v1/partner/products`
- `POST /v1/partner/products`
- `PATCH /v1/partner/products/:id`
- `PATCH /v1/partner/products/:id/availability`
- `GET /v1/partner/inventory`
- `POST /v1/partner/inventory/movements`
- `GET /v1/partner/customers`
- `GET /v1/partner/customers/:id`
- `PATCH /v1/partner/customers/:id`
- `GET /v1/partner/store/settings`
- `PATCH /v1/partner/store/settings`
- `PATCH /v1/partner/store/hours`
- `PATCH /v1/partner/store/delivery-zones`

## Proximo passo

Fechar a operacao real do ambiente:

- apontar `DATABASE_URL` para o Postgres do Supabase
- rodar seed/migrations no banco alvo
- validar smoke ponta a ponta dos endpoints partner
- integrar `Mercado Pago`

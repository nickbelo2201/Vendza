# Backlog de Implementacao

## Sprint 0: Fundacao

- criar monorepo
- criar configs base
- configurar lint, typecheck e scripts
- configurar env do Supabase Auth e do Supabase Postgres
- manter Docker local apenas como opcao de dev offline
- definir schema P0

## Sprint 1: Loja, cobertura e catalogo

- store settings
- horarios
- delivery zones
- categorias
- produtos
- disponibilidade
- inventario basico

## Sprint 2: Cliente e checkout

- vitrine
- busca
- produto
- carrinho
- quote
- checkout
- criacao de pedido

## Sprint 3: Operacao parceiro

- auth parceiro
- board de pedidos
- detalhe do pedido
- mudanca de status
- pedido assistido
- notificacao sonora

## Sprint 4: CRM e dashboard

- lista de clientes
- perfil do cliente
- flags de inatividade
- dashboard operacional
- top produtos

## Sprint 5: Harden e go-live

- QA ponta a ponta
- revisao de logs
- revisao de politicas
- validar auth user -> store_users no banco do Supabase
- treino da adega piloto
- deploy

## Ordem de implementacao dentro de cada sprint

1. schema
2. endpoint
3. pagina
4. estados
5. verificacao

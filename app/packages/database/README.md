# Database

Conteudo esperado:

- schema
- migrations
- seed
- client ORM

O modelo precisa nascer `tenant-ready`.

## Status atual

O pacote ja contem:

- schema Prisma do MVP
- client gerado
- seed inicial da loja piloto
- configuracao para `Supabase Postgres` via `DATABASE_URL`

## Regras

- deploy inicial `single-tenant`
- modelagem `tenant-ready`
- dinheiro sempre em centavos
- eventos de pedido append-only
- cobertura do V1 em `bairro + raio`

## Proximo passo

- apontar `DATABASE_URL` e `DIRECT_URL` para o Postgres do projeto Supabase
- aplicar migrations ou `db push` no banco alvo
- rodar seed no mesmo banco do Supabase
- manter Postgres local em Docker apenas como alternativa de dev offline

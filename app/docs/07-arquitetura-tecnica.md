# Arquitetura Tecnica

## Decisao oficial da stack

O V1 sera construido em um monorepo com frontends separados e backend central.

## Superficies

- `web-client`: vitrine, catalogo, checkout e tracking
- `web-partner`: painel da adega
- `api`: regras de negocio, eventos e integracoes
- `mobile`: reservado para V2/V3

## Stack escolhida

| Camada | Stack | Decisao |
|---|---|---|
| Frontend cliente | Next.js 15 | SEO, performance e PWA |
| Frontend parceiro | Next.js 15 | produtividade e UI moderna |
| Backend | Fastify + TypeScript | regra centralizada e latencia baixa |
| Banco | Supabase Postgres + Prisma | um banco so, menos friccao operacional e dominio auditavel |
| Extensoes | PostGIS + pg_trgm | cobertura geoespacial e busca tolerante |
| Auth/Storage gerenciados | Supabase no V1 | Auth nativo e infraestrutura mais simples no V1 |
| Filas e cache | Redis 7 + BullMQ | jobs, locks e notificacoes |
| Realtime | Socket.io | board de pedidos e timeline |
| Midia | S3 compativel | imagens, banners e documentos |
| Mapas | Google Maps Platform | geocoding, distancia e ETA |
| Pagamento | um gateway principal | simplificar o V1 |

## Por que esta estrutura vence as duas analises anteriores

- mantem a velocidade de arranque do plano inicial
- adota a separacao de superficies correta observada no Ze
- preserva ownership e portabilidade acima da Neemo
- evita espalhar regra de negocio em Next.js
- prepara o produto para V2 sem reescrever tudo

## Estrutura do repositorio

```text
app/
  apps/
    api/
    web-client/
    web-partner/
    mobile/
  packages/
    database/
    ui/
    types/
    utils/
  infra/
    docker/
    terraform/
  docs/
```

## Decisoes de implementacao do V1

- `single-tenant no deploy inicial`, mas `tenant-ready no modelo de dados`
- `bairro + raio` no V1; `poligono` entra quando o piloto provar necessidade
- `um gateway de pagamento` no V1; multi-gateway fica para depois
- `wa.me + contexto de pedido` no V1; API oficial de WhatsApp entra no V2
- `pg_trgm` resolve busca do V1; engine dedicada so quando o catalogo crescer

## Ambientes

### Local

- `DATABASE_URL` pode apontar para o Postgres do Supabase
- Docker local com Postgres e Redis e opcional para desenvolvimento offline
- Redis local continua util para filas e cache quando essa camada entrar

### Staging

- mesmo shape da producao, preferencialmente em outro projeto Supabase
- dados mascarados

### Producao

- API e fronts com deploy automatizado
- banco gerenciado no Supabase
- storage gerenciado
- observabilidade basica desde o primeiro go-live

## Decisao de banco tomada agora

- nao vamos manter `Supabase Auth` e um `Postgres` separado como arquitetura principal
- o backend vai usar `Supabase Auth + Supabase Postgres + Prisma`
- isso reduz sincronizacao manual de usuario, reduz custo operacional e simplifica o smoke ponta a ponta
- o modelo continua portavel porque o dado segue em Postgres e o acesso segue via Prisma

# Backlog de Implementação — Log de Progresso

> Atualizado em 2026-04-29.
> V1 e V2 estão completas. Este documento registra o histórico de sprints e lista as próximas entregas pendentes.

---

## V1 — Completa (2026-04-06, commit `f2c7c23`)

### Sprint 0: Fundação

- Monorepo pnpm workspaces + Turbo
- Configurações base de TypeScript, lint e scripts
- Variáveis de ambiente (Supabase Auth + Supabase Postgres)
- Docker Compose para desenvolvimento offline (Postgres 16, Redis 7)
- Schema Prisma inicial tenant-ready

### Sprint 1: Loja, cobertura e catálogo

- Configurações da loja (nome, horários, zonas de entrega)
- Categorias e produtos
- Controle de disponibilidade
- Movimentação de inventário (append-only)

### Sprint 2: Cliente e checkout

- Vitrine com listagem de produtos
- Busca básica
- Página de produto
- Carrinho (localStorage)
- Cálculo de frete por zona (quote)
- Checkout e criação de pedido

### Sprint 3: Operação parceiro

- Autenticação do parceiro (Supabase Auth → store_users)
- Board de pedidos
- Detalhe do pedido
- Mudança de status com evento
- Pedido manual (assistido)

### Sprint 4: CRM e dashboard

- Listagem de clientes
- Perfil do cliente com histórico
- Flags de inatividade
- Dashboard operacional (resumo de vendas)
- Top produtos

### Sprint 5: Harden e go-live

- QA ponta a ponta
- Revisão de logs e políticas
- Validação auth_user_id → store_users no Supabase
- Deploy Railway + Vercel configurados

---

## V2 — Completa (2026-04-06, commit `ad8c35f`)

### Catálogo avançado
- CRUD completo de produtos com upload de imagem
- CRUD de categorias
- Combos e extras vinculados a produtos
- Controle de disponibilidade por produto

### Pedidos avançados
- Drawer de detalhe com timeline de eventos
- Exportação CSV de pedidos por período
- Criação manual de pedido melhorada

### Storefront aprimorado
- Busca de produtos
- Filtros por categoria
- Página de produto com combos e extras

### CRM
- Listagem com busca
- Perfil do cliente com histórico completo de compras

### Configurações completas da loja
- Dados gerais
- Horários de funcionamento por dia da semana
- Zonas de entrega (bairro ou raio, taxa, ETA)

### Relatórios
- Vendas por período
- Top produtos
- Exportação CSV

---

## Próximas Entregas — Sprint Atual

| ID | Descrição | Prioridade | Área |
|----|-----------|------------|------|
| P3-03 | GitHub Actions CI — typecheck + build em todo PR | Alta | Infra |
| P4-01 | Testes Playwright — fluxo completo do cliente (storefront) | Alta | QA |
| P4-03 | Testes Playwright — fluxo completo do parceiro (painel) | Alta | QA |
| P5-01 | Logo oficial substituindo placeholders | Alta | Design |
| P5-02 | Revisão visual final — og:image, tipografia, espaçamentos | Média | Design |
| P2-08 | Perfil do cliente salvo em localStorage (auto-fill no checkout) | Média | Storefront |
| P2-09 | Endereços favoritos — até 3 endereços para checkout rápido | Média | Storefront |

---

## Backlog Futuro (pós sprint atual)

Itens que aguardam cliente fechar ou volume justificar:

- WhatsApp automação (Meta Cloud API) — notificações de pedido, atendimento 24h
- Multi-tenant / onboarding self-service
- Mercado Pago (PIX e cartão online) — última feature do roadmap
- IA generativa — descrição de produtos e copy
- Mobile app (React Native / Expo)
- Segmentação RFM e campanhas por comportamento
- Fidelidade e cupons
- Multi-loja

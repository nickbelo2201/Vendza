# PRD V2 — Documento Histórico

> Status: **COMPLETA** — entregue em 2026-04-06 (commit `ad8c35f`).
> Este documento registra o que foi planejado e entregue na V2. Não representa trabalho em aberto.

---

## Objetivo da V2

Transformar o V1 operacional em um sistema completo de gestão para lojistas: catálogo gerenciável, pedidos com rastreamento detalhado, CRM com histórico de clientes, configurações completas da loja e relatórios de desempenho.

---

## Tese da V2

O V1 provou que a adega consegue vender e operar no canal próprio.

A V2 entregou o painel operacional completo — o lojista agora tem controle total sobre catálogo, pedidos, clientes, configurações e dados de vendas sem depender de intervenção técnica.

---

## Features Entregues

### Catálogo — CRUD completo com upload de imagem
- Criação, edição e exclusão de produtos
- Upload de imagem via storage (Supabase)
- Gerenciamento de categorias
- Controle de disponibilidade por produto
- Combos e extras vinculados a produtos

### Pedidos — painel operacional
- Board de pedidos com filtros por status
- Drawer de detalhe de pedido (itens, cliente, endereço, timeline de eventos)
- Mudança de status com registro de evento
- Criação manual de pedido pelo parceiro (pedido assistido)
- Exportação CSV dos pedidos por período

### CRM
- Listagem de clientes com busca
- Perfil do cliente com histórico completo de compras
- Dados de contato e endereço

### Configurações da loja
- Dados gerais (nome, telefone, descrição)
- Horários de funcionamento por dia da semana
- Zonas de entrega (por bairro ou raio, com taxa e ETA)

### Relatórios
- Resumo de vendas por período (total, ticket médio, número de pedidos)
- Top produtos mais vendidos
- Exportação de dados em CSV

### Storefront (web-client)
- Busca de produtos
- Filtros por categoria
- Página de produto com combos e extras
- Carrinho persistente em localStorage

---

## Pendências — Próxima Sprint

Os itens abaixo não fazem parte da V2 e compõem a próxima sprint de QA e refinamento:

| ID | Descrição | Prioridade |
|----|-----------|------------|
| P3-03 | GitHub Actions CI — typecheck + build em todo PR | Alta |
| P4-01 | Testes Playwright — fluxo completo do cliente (storefront) | Alta |
| P4-03 | Testes Playwright — fluxo completo do parceiro (painel) | Alta |
| P5-01 | Logo oficial substituindo placeholders | Alta |
| P5-02 | Revisão visual final — og:image, tipografia, espaçamentos | Média |
| P2-08 | Perfil do cliente salvo em localStorage (auto-fill no checkout) | Média |
| P2-09 | Endereços favoritos — até 3 endereços para checkout rápido | Média |

---

## Dependências que se provaram corretas

- eventos do pedido e do cliente padronizados no V1 — usados para CRM e histórico
- schema Prisma tenant-ready — isolamento por `storeId` funcionou sem refactor
- Supabase Auth com Bearer tokens — autenticação do parceiro estável

---

## Critérios de sucesso (resultado)

- lojista consegue criar e editar catálogo sem suporte técnico
- pedidos são gerenciados completamente pelo painel
- histórico de clientes está disponível e navegável
- configurações da loja são alteráveis sem deploy
- dados de vendas são consultáveis por período

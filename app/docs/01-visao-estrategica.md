# Visão Estratégica

> Atualizado em 2026-04-29. Reflete o status atual: produto em produção, primeiro cliente ativo.

---

## Status Atual

| Marco | Data | Situação |
|-------|------|----------|
| V1 — plataforma base | 2026-04-06 (commit `f2c7c23`) | Completa |
| V2 — catálogo, pedidos, CRM, configurações, relatórios | 2026-04-06 (commit `ad8c35f`) | Completa |
| Primeiro cliente — Adega Ideal | 2026-04-29 | Em onboarding ativo |
| Deploy | Railway (API) + Vercel (web-partner, web-client) | Em produção |

O Vendza está operacional. O sistema completo — storefront, painel parceiro, API, banco de dados e autenticação — está rodando em produção e sendo utilizado pelo primeiro cliente.

---

## Tese Central

O Vendza não é uma cópia do Zé Delivery nem uma cópia da Neemo.

É a **síntese superior dos dois**, com posicionamento premium:

- `do Zé`: discovery, vitrine, velocidade de compra e UX mobile-first
- `da Neemo`: cobertura operacional, pedidos, configuração de loja, analytics
- `nosso diferencial`: CRM de verdade, WhatsApp-first, automação gerenciada, dados próprios, painel mais simples e regras nativas de adega — **entregues como serviço**, não apenas como software

---

## Categoria do Produto

O produto é tratado como um **Commerce OS para lojistas locais**, entregue como serviço gerenciado, com foco inicial em adegas e bebidas.

Não é:
- um simples site de pedidos
- um painel genérico de delivery
- um marketplace que captura a relação com o cliente
- um SaaS self-service de baixo ticket

É:
- canal direto de venda
- cockpit operacional
- CRM com memória de compra
- motor de automação por eventos (WhatsApp, IA)
- serviço gerenciado pelo fundador nos primeiros clientes

---

## Posicionamento de Mercado

> "O canal próprio que as adegas usam para vender mais, sem depender do Zé Delivery."

### Por que o argumento funciona

Uma adega com R$ 15.000/mês pelo Zé paga R$ 3.750/mês de comissão (25%).
O Vendza (tier Plataforma + Automação) custa R$ 1.500/mês.
**Economia líquida: R$ 2.250/mês.**

O produto se paga no primeiro mês para qualquer adega com mais de R$ 6.000/mês pelo Zé.

---

## Modelo de Negócio

Ver documento completo em `17-modelo-de-negocio.md`.

Resumo:

| Tier | Preço |
|------|-------|
| Plataforma | R$ 500/mês |
| Plataforma + Automação WhatsApp | R$ 1.500/mês |
| Premium (com IA) | R$ 2.500/mês |

Meta: **R$ 5.000/mês de MRR até março de 2027** — equivalente a 4 clientes no tier Automação.

---

## O que significa ser melhor que Zé Delivery e Neemo

### Melhor que o Zé Delivery
- a adega é dona da marca, do domínio e do cliente
- o parceiro não compete dentro de um marketplace
- o financeiro é mais transparente e sem comissão
- o CRM existe de verdade
- o WhatsApp entra no fluxo operacional com automação real

### Melhor que a Neemo
- o painel é mais leve e mais direto
- o CRM é acionável, não apenas histórico
- o WhatsApp é eixo do produto, não add-on
- a experiência visual é premium e atual
- o onboarding é gerenciado, não manual pelo lojista

---

## Pilares do Produto

1. `Venda direta com alta conversão`
2. `Operação robusta de loja`
3. `CRM e recorrência desde o início`
4. `WhatsApp operacional e automatizado`
5. `IA aplicada a resultado (fase futura)`
6. `Serviço gerenciado — o fundador é parte do produto nos primeiros clientes`

---

## Requisitos Específicos do Segmento

- gate de maioridade
- horários de madrugada e múltiplos turnos
- combos, kits, gelo, mixers e compra por ocasião
- pedido assistido por telefone ou WhatsApp
- Pix-first com gateway integrado (Mercado Pago — fase futura)
- área de entrega por bairro e raio
- recompra rápida

---

## Foco de Segmento

**Adegas nos primeiros 12–18 meses.** Só expandir para outros segmentos de varejo após:
- 10+ adegas ativas e pagantes
- NPS > 40
- Pelo menos 1 case documentado com ROI comprovado

---

## Escopo do Produto (O que foi entregue)

O produto cobre a operação essencial de uma adega:

- vitrine e catálogo de produtos com busca e filtros por categoria
- combos e extras vinculados a produtos
- checkout com carrinho e cálculo de entrega por zona
- rastreamento de pedido pelo cliente
- painel parceiro com gestão de pedidos (board, drawer de detalhe, mudança de status)
- criação manual de pedido pelo parceiro
- CRUD de catálogo com upload de imagem
- CRM com histórico de compras por cliente
- configurações da loja (horários, zonas de entrega, dados gerais)
- relatórios de vendas por período
- exportação CSV de pedidos
- autenticação via Supabase Auth

---

## Norte do Produto

Se uma adega entrar no sistema, ela deve sentir:

- mais autonomia que no Zé
- menos atrito que na Neemo
- mais clareza comercial que em ambos
- que o fundador está do lado dela — não só o software

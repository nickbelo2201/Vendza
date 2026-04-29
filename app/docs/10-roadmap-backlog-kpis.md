# Roadmap, Backlog e KPIs

> Atualizado em 2026-04-29. Primeiro cliente ativo (Adega Ideal). Produto em produção.

---

## Status Atual

| Versão | Status | Data |
|--------|--------|------|
| V1 — plataforma base | Completa | 2026-04-06 |
| V2 — catálogo, pedidos, CRM, configurações, relatórios | Completa | 2026-04-06 |
| Onboarding Adega Ideal | Em andamento | 2026-04-29 |
| Próxima sprint — QA, CI e design | Em planejamento | — |

---

## Próxima Sprint — QA, CI e Design

Todos os itens abaixo estão pendentes e compõem a próxima sprint antes de novos onboardings:

### Infraestrutura

| ID | Descrição | Prioridade |
|----|-----------|------------|
| P3-03 | GitHub Actions CI — typecheck + build em todo PR | Alta |
| P4-01 | Testes Playwright — fluxo completo do cliente (storefront) | Alta |
| P4-03 | Testes Playwright — fluxo completo do parceiro (painel) | Alta |

### Design e identidade

| ID | Descrição | Prioridade |
|----|-----------|------------|
| P5-01 | Logo oficial substituindo placeholders | Alta |
| P5-02 | Revisão visual final — og:image, tipografia, espaçamentos | Média |

### Storefront

| ID | Descrição | Prioridade |
|----|-----------|------------|
| P2-08 | Perfil do cliente salvo em localStorage (auto-fill no checkout) | Média |
| P2-09 | Endereços favoritos — até 3 endereços para checkout rápido | Média |

---

## Roadmap de Produto

### Fase atual — Operação e refinamento (2026-Q2)

- Onboarding da Adega Ideal e coleta de feedback real
- Correções e ajustes baseados no uso do primeiro cliente
- Conclusão dos itens de QA e CI listados acima

### Próxima fase — IA e Automação (pós fechamento de contrato)

Iniciado apenas após o cliente solicitar explicitamente.

- **WhatsApp automação** (Meta Cloud API)
  - Notificação de status do pedido ao cliente
  - Confirmação automática de pedido
  - Atendimento automatizado 24h
  - Fluxos personalizados por evento
- **IA generativa** — descrição de produtos, copy de campanhas
- **Multi-tenant / onboarding self-service** — cadastrar qualquer lojista sem intervenção técnica
- **Mobile app** (React Native / Expo)
- **Mercado Pago** — PIX e cartão online (última feature do roadmap)

### Fase futura — Escala (ticket R$ 2.500/mês)

- IA no atendimento: sugestões por perfil de compra
- Insights automáticos de estoque e giro
- Relatórios preditivos
- Segmentação RFM
- Fidelidade e cupons
- Multi-loja

---

## Backlog Comercial (paralelo ao produto)

1. Landing page institucional (vendza.com.br)
2. Deck de proposta com cálculo de ROI personalizado
3. Contratos jurídicos (SaaS + LGPD + Termos de Uso)
4. Processo documentado de onboarding de adega
5. Script de call de qualificação e demo

---

## KPIs de Produto

| KPI | Meta para piloto | Meta para escala |
|-----|-----------------|-----------------|
| Taxa de conversão vitrine → checkout | > 8% | > 12% |
| Taxa de pedido concluído | > 90% | > 95% |
| Tempo médio de confirmação | < 2 min | < 1 min |
| Cancelamento por ruptura | < 5% | < 2% |
| Ticket médio do pedido | > R$ 80 | > R$ 100 |
| Recorrência (% clientes que pedem 2x+) | > 40% | > 60% |
| Clientes inativos reativados/mês | > 10% | > 20% |

---

## KPIs de Operação

- pedidos por faixa horária (pico identificado?)
- SLA entre status (tempo de confirmação, preparo, entrega)
- erros de pagamento (< 1%)
- falhas de cobertura (cliente sem zona de entrega)
- itens indisponíveis mais recorrentes

---

## KPIs de Negócio (Vendza)

| KPI | Situação atual (2026-Q2) | Meta Q1-2027 |
|-----|--------------------------|--------------|
| MRR | Em onboarding (piloto) | R$ 5.000 |
| Clientes pagantes | 1 (Adega Ideal) | 4 |
| Ticket médio por cliente | — | R$ 1.500 |
| Churn mensal | — | < 5% |
| NPS dos lojistas | A medir no piloto | > 60 |
| CAC médio | — | < R$ 500 |
| LTV:CAC | — | > 18x |

---

## KPI de Sucesso Competitivo

O sistema estará realmente melhor que os concorrentes quando entregar:

- UX de compra comparável ao Zé
- operação sem regressão frente à Neemo
- CRM e WhatsApp acima dos dois
- ROI comprovável em menos de 30 dias para o lojista

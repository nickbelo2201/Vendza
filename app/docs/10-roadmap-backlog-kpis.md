# Roadmap, Backlog e KPIs

> Atualizado em 2026-04-22. Alinhado ao modelo de negócio premium consultivo (ver `17-modelo-de-negocio.md`).

---

## Status Atual

| Versão | Status | Data |
|--------|--------|------|
| V1 (plataforma base) | ✅ Completa | 2026-04-06 |
| V2 (CRUD, CRM, relatórios, deploy) | ✅ Completa | 2026-04-06 |
| Polish pré-lançamento (P2-P5) | 🔄 Em progresso | — |
| IA e Automação | ⏳ Aguardando cliente fechar | — |

---

## O que falta para apresentar ao cliente

Todos os itens abaixo estão no Linear (SOF-95 a SOF-102) como **Todo**:

### Infraestrutura
| Card | Descrição | Prioridade |
|------|-----------|------------|
| SOF-95 | GitHub Actions CI — typecheck + build em todo PR | High |
| SOF-96 | Testes Playwright — fluxo completo do cliente | High |
| SOF-97 | Testes Playwright — fluxo completo do parceiro | High |
| SOF-98 | Validação mobile e responsividade | High |
| SOF-99 | Logo oficial substituindo placeholders | High |
| SOF-100 | Revisão final de design — og:image, tipografia, espaçamentos | Medium |

### Storefront
| Card | Descrição | Prioridade |
|------|-----------|------------|
| SOF-101 | Perfil do cliente salvo em localStorage (auto-fill no checkout) | Medium |
| SOF-102 | Endereços favoritos — até 3 endereços para checkout rápido | Medium |

Após esses 8 itens, a plataforma está pronta para apresentação e onboarding do primeiro cliente.

---

## Roadmap de Produto

### Módulos de IA e Automação ← próxima fase (pós cliente fechar)
Objetivo: habilitar automação e inteligência — implementado conforme demanda de cada cliente.

> **Regra:** nenhum módulo abaixo é iniciado antes do cliente fechar e solicitar explicitamente.

- **WhatsApp automação** (Baileys/WAHA)
  - Notificação de status do pedido ao cliente
  - Confirmação automática de pedido
  - Atendimento automatizado 24h
  - Fluxos personalizados por evento
- **IA generativa** — descrição de produtos, copy de campanhas
- **Multi-tenant / onboarding self-service** — cadastrar qualquer lojista sem tocar no código
- **Mobile app** (React Native / Expo)
- **Mercado Pago** — PIX e cartão online (última feature de todas)

### Onda futura — IA e Escala (ticket R$ 2.500–3.000/mês)
- IA no atendimento: sugestões por perfil de compra
- Insights automáticos de estoque e giro
- Relatórios preditivos
- Segmentação RFM
- Fidelidade e cupons
- Multi-loja

---

## Backlog Comercial (paralelo ao produto)

1. Landing page institucional (vendza.com.br ou similar)
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

| KPI | Meta Q3-2026 | Meta Q1-2027 |
|-----|-------------|-------------|
| MRR | R$ 0 (piloto gratuito) | R$ 5.000 |
| Clientes pagantes | 0 | 4 |
| Ticket médio por cliente | — | R$ 1.500 |
| Churn mensal | — | < 5% |
| NPS dos lojistas | > 40 (piloto) | > 60 |
| CAC médio | — | < R$ 500 |
| LTV:CAC | — | > 18x |

---

## KPI de Sucesso Competitivo

O sistema estará realmente melhor que os concorrentes quando entregar:

- UX de compra comparável ao Zé
- operação sem regressão frente à Neemo
- CRM e WhatsApp acima dos dois
- ROI comprovável em menos de 30 dias para o lojista

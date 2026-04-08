# Roadmap, Backlog e KPIs

> Atualizado em 2026-04-07. Alinhado ao modelo de negócio premium consultivo (ver `17-modelo-de-negocio.md`).

---

## Status Atual

| Versão | Status | Data |
|--------|--------|------|
| V1 (plataforma base) | ✅ Completa | 2026-04-06 |
| V2 (CRUD, CRM, relatórios, deploy) | ✅ Completa | 2026-04-06 |
| Plataforma P3-P5 (deploy, QA, polish) | 🔄 Em progresso | — |

---

## Roadmap de Produto

### Onda 1 — Plataforma Completa (P3–P5) ← estamos aqui
Objetivo: produto pronto para apresentar ao primeiro cliente.

- Deploy automático (Vercel + Railway + GitHub Actions CI)
- Testes Playwright (fluxo cliente + parceiro)
- QA de segurança e performance
- Onboarding self-service (wizard de setup da loja)
- Mercado Pago — Pix + cartão online ← **P0 CRÍTICO** (antecipar do backlog IA)

### Onda 2 — Automação WhatsApp (ticket R$ 1.500/mês)
Objetivo: habilitar o tier Plataforma + Automação — principal gerador de MRR.

- WhatsApp oficial (Baileys/WAHA)
  - Confirmação automática de pedido ao cliente
  - Notificação de status em tempo real
  - Atendimento automatizado 24h
  - Fluxos personalizados por evento
- Multi-tenant / onboarding self-service completo
- CRM acionável com campanhas por evento
- Segmentação RFM
- Fidelidade e cupons

### Onda 3 — IA e Escala (ticket R$ 2.500–3.000/mês)
Objetivo: habilitar o tier Premium — máximo de valor por cliente.

- IA generativa: descrição de produtos, copy de campanhas
- IA no atendimento: sugestões por perfil de compra
- Insights automáticos de estoque e giro
- Relatórios preditivos
- Mobile app (React Native / Expo)
- Multi-loja

---

## Prioridade Crítica: Mercado Pago

**O Mercado Pago deve ser implementado antes de qualquer cliente piloto.**

Motivo: sem Pix automático integrado, o lojista ainda cobra manualmente — isso dilui o momento "aha" do produto e é o principal motivo de churn nos primeiros 30 dias.

Escopo mínimo:
- Geração de QR Code Pix
- Webhook de confirmação de pagamento
- Atualização automática do status do pedido após pagamento confirmado
- Tela de confirmação para o cliente

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
